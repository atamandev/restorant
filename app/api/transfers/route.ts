import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://restorenUser:1234@localhost:27017/restoren'
const DB_NAME = 'restoren'
const COLLECTION_NAME = 'transfers'

let client: MongoClient
let db: any

async function connectToDatabase() {
  if (!client) {
    client = new MongoClient(MONGO_URI)
    await client.connect()
    db = client.db(DB_NAME)
  }
  return db
}

// GET - دریافت تمام انتقالات با فیلتر و مرتب‌سازی
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // pending, in_transit, completed, cancelled
    const type = searchParams.get('type') // internal, external, return, adjustment
    const fromWarehouse = searchParams.get('fromWarehouse')
    const toWarehouse = searchParams.get('toWarehouse')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const limit = parseInt(searchParams.get('limit') || '100')
    const skip = parseInt(searchParams.get('skip') || '0')
    const search = searchParams.get('search') || ''

    // ساخت فیلتر
    const filter: any = {}
    if (status && status !== 'all') filter.status = status
    if (type && type !== 'all') filter.type = type
    if (fromWarehouse && fromWarehouse !== 'all') filter.fromWarehouse = fromWarehouse
    if (toWarehouse && toWarehouse !== 'all') filter.toWarehouse = toWarehouse
    if (search) {
      filter.$or = [
        { transferNumber: { $regex: search, $options: 'i' } },
        { fromWarehouse: { $regex: search, $options: 'i' } },
        { toWarehouse: { $regex: search, $options: 'i' } },
        { requestedBy: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } }
      ]
    }

    // ساخت مرتب‌سازی
    const sort: any = {}
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1

    const transfers = await collection
      .find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .toArray()

    // آمار کلی
    const stats = await collection.aggregate([
      {
        $group: {
          _id: null,
          totalTransfers: { $sum: 1 },
          pendingTransfers: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          inTransitTransfers: { $sum: { $cond: [{ $eq: ['$status', 'in_transit'] }, 1, 0] } },
          completedTransfers: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          cancelledTransfers: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
          totalItems: { $sum: { $size: '$items' } },
          totalValue: { $sum: '$totalValue' }
        }
      }
    ]).toArray()

    return NextResponse.json({
      success: true,
      data: transfers,
      stats: stats[0] || {
        totalTransfers: 0,
        pendingTransfers: 0,
        inTransitTransfers: 0,
        completedTransfers: 0,
        cancelledTransfers: 0,
        totalItems: 0,
        totalValue: 0
      },
      pagination: {
        limit,
        skip,
        total: await collection.countDocuments(filter)
      }
    })
  } catch (error) {
    console.error('Error fetching transfers:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت انتقالات' },
      { status: 500 }
    )
  }
}

// POST - ایجاد انتقال جدید
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const body = await request.json()
    
    // تولید شماره انتقال منحصر به فرد
    const transferCount = await collection.countDocuments()
    const transferNumber = `TRF-${String(transferCount + 1).padStart(6, '0')}`
    
    // محاسبه ارزش کل
    const totalValue = body.items?.reduce((sum: number, item: any) => 
      sum + (item.quantity * item.unitPrice), 0) || 0
    
    const transfer = {
      transferNumber,
      type: body.type || 'internal', // internal, external, return, adjustment
      fromWarehouse: body.fromWarehouse,
      toWarehouse: body.toWarehouse,
      items: body.items || [],
      totalItems: body.items?.length || 0,
      totalValue,
      requestedBy: body.requestedBy,
      approvedBy: body.approvedBy || null,
      status: body.status || 'pending', // pending, in_transit, completed, cancelled
      priority: body.priority || 'normal', // low, normal, high, urgent
      scheduledDate: body.scheduledDate || null,
      actualDate: body.actualDate || null,
      notes: body.notes || '',
      reason: body.reason || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const result = await collection.insertOne(transfer)
    
    return NextResponse.json({
      success: true,
      data: { ...transfer, _id: result.insertedId },
      message: 'انتقال با موفقیت ایجاد شد'
    })
  } catch (error) {
    console.error('Error creating transfer:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در ایجاد انتقال' },
      { status: 500 }
    )
  }
}

// PUT - به‌روزرسانی انتقال (با اتصال به انبار)
export async function PUT(request: NextRequest) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    const inventoryCollection = db.collection('inventory_items')
    const ledgerCollection = db.collection('item_ledger')
    
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'شناسه انتقال اجباری است' },
        { status: 400 }
      )
    }

    // دریافت انتقال فعلی
    const currentTransfer = await collection.findOne({ _id: new ObjectId(id) })
    if (!currentTransfer) {
      return NextResponse.json(
        { success: false, message: 'انتقال یافت نشد' },
        { status: 404 }
      )
    }

    const oldStatus = currentTransfer.status
    const newStatus = updateData.status

    // شروع تراکنش برای به‌روزرسانی همزمان موجودی
    const session = client.startSession()
    
    try {
      await session.withTransaction(async () => {
        // محاسبه مجدد ارزش کل اگر آیتم‌ها تغییر کرده باشند
        if (updateData.items) {
          updateData.totalItems = updateData.items.length
          updateData.totalValue = updateData.items.reduce((sum: number, item: any) => 
            sum + (item.quantity * item.unitPrice), 0)
        }

        // مدیریت تغییر وضعیت به 'completed' (تکمیل شد)
        if (oldStatus !== 'completed' && newStatus === 'completed') {
          updateData.status = 'completed'
          updateData.actualDate = new Date().toISOString()

          // برای هر آیتم انتقال:
          for (const item of currentTransfer.items || []) {
            const itemId = item.itemId || item.inventoryItemId
            if (!itemId) continue

            const inventoryItem = await inventoryCollection.findOne({ 
              _id: new ObjectId(itemId)
            }, { session })

            if (!inventoryItem) continue

            // 1. کسر از انبار مبدأ
            if (currentTransfer.fromWarehouse) {
              const lastEntryFrom = await ledgerCollection
                .findOne(
                  { itemId, warehouse: currentTransfer.fromWarehouse },
                  { sort: { date: -1, createdAt: -1 }, session }
                )

              const lastBalanceFrom = lastEntryFrom?.runningBalance || inventoryItem.currentStock || 0
              const lastValueFrom = lastEntryFrom?.runningValue || (inventoryItem.totalValue || 0)
              
              const qtyOut = item.quantity || 0
              const unitPrice = item.unitPrice || inventoryItem.unitPrice || 0
              
              const newBalanceFrom = Math.max(0, lastBalanceFrom - qtyOut)
              const avgPriceFrom = lastBalanceFrom > 0 ? lastValueFrom / lastBalanceFrom : unitPrice
              const newValueFrom = Math.max(0, lastValueFrom - (qtyOut * avgPriceFrom))

              // ایجاد ورودی دفتر کل برای خروج از انبار مبدأ
              const docNumberFrom = `TROUT-${currentTransfer.transferNumber.substring(currentTransfer.transferNumber.length - 4)}`
              const ledgerEntryFrom = {
                itemId,
                itemName: inventoryItem.name,
                itemCode: inventoryItem.code || '',
                date: new Date(),
                documentNumber: docNumberFrom,
                documentType: 'transfer_out',
                description: `انتقال از ${currentTransfer.fromWarehouse} به ${currentTransfer.toWarehouse} - ${currentTransfer.transferNumber}`,
                warehouse: currentTransfer.fromWarehouse,
                quantityIn: 0,
                quantityOut: qtyOut,
                unitPrice: unitPrice,
                totalValue: -(qtyOut * avgPriceFrom),
                runningBalance: newBalanceFrom,
                runningValue: newValueFrom,
                averagePrice: newBalanceFrom > 0 ? newValueFrom / newBalanceFrom : avgPriceFrom,
                reference: currentTransfer.transferNumber,
                notes: `انتقال به ${currentTransfer.toWarehouse}`,
                userId: currentTransfer.requestedBy || 'سیستم',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              }

              await ledgerCollection.insertOne(ledgerEntryFrom, { session })
            }

            // 2. اضافه به انبار مقصد
            if (currentTransfer.toWarehouse) {
              const lastEntryTo = await ledgerCollection
                .findOne(
                  { itemId, warehouse: currentTransfer.toWarehouse },
                  { sort: { date: -1, createdAt: -1 }, session }
                )

              const lastBalanceTo = lastEntryTo?.runningBalance || 0
              const lastValueTo = lastEntryTo?.runningValue || 0
              
              const qtyIn = item.quantity || 0
              const unitPrice = item.unitPrice || inventoryItem.unitPrice || 0
              
              const newBalanceTo = lastBalanceTo + qtyIn
              const totalValueTo = lastValueTo + (qtyIn * unitPrice)
              const avgPriceTo = newBalanceTo > 0 ? totalValueTo / newBalanceTo : unitPrice

              // ایجاد ورودی دفتر کل برای ورود به انبار مقصد
              const docNumberTo = `TRIN-${currentTransfer.transferNumber.substring(currentTransfer.transferNumber.length - 4)}`
              const ledgerEntryTo = {
                itemId,
                itemName: inventoryItem.name,
                itemCode: inventoryItem.code || '',
                date: new Date(),
                documentNumber: docNumberTo,
                documentType: 'transfer_in',
                description: `انتقال از ${currentTransfer.fromWarehouse} به ${currentTransfer.toWarehouse} - ${currentTransfer.transferNumber}`,
                warehouse: currentTransfer.toWarehouse,
                quantityIn: qtyIn,
                quantityOut: 0,
                unitPrice: unitPrice,
                totalValue: qtyIn * unitPrice,
                runningBalance: newBalanceTo,
                runningValue: totalValueTo,
                averagePrice: avgPriceTo,
                reference: currentTransfer.transferNumber,
                notes: `انتقال از ${currentTransfer.fromWarehouse}`,
                userId: currentTransfer.requestedBy || 'سیستم',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              }

              await ledgerCollection.insertOne(ledgerEntryTo, { session })

              // به‌روزرسانی موجودی کلی آیتم (انبار اصلی)
              const lastEntryMain = await ledgerCollection
                .findOne(
                  { itemId },
                  { sort: { date: -1, createdAt: -1 }, session }
                )

              const lastBalanceMain = lastEntryMain?.runningBalance || inventoryItem.currentStock || 0
              const lastValueMain = lastEntryMain?.runningValue || (inventoryItem.totalValue || 0)
              
              // موجودی کلی تغییر نمی‌کند (فقط بین انبارها منتقل می‌شود)
              // اما می‌توانیم موجودی کل را از مجموع موجودی تمام انبارها محاسبه کنیم
              const allWarehouseEntries = await ledgerCollection
                .find({ itemId })
                .sort({ date: -1, createdAt: -1 })
                .limit(100)
                .toArray()

              let totalStock = 0
              for (const entry of allWarehouseEntries) {
                if (entry.quantityIn > 0) totalStock += entry.quantityIn
                if (entry.quantityOut > 0) totalStock -= entry.quantityOut
              }

              await inventoryCollection.updateOne(
                { _id: new ObjectId(itemId) },
                {
                  $set: {
                    currentStock: totalStock > 0 ? totalStock : lastBalanceMain,
                    isLowStock: (totalStock > 0 ? totalStock : lastBalanceMain) <= (inventoryItem.minStock || 0),
                    lastUpdated: new Date().toISOString(),
                    updatedAt: new Date()
                  }
                },
                { session }
              )
            }
          }
        }
        // مدیریت لغو انتقال (اگر از completed به cancelled تغییر کرد)
        else if (oldStatus === 'completed' && newStatus === 'cancelled') {
          // برگرداندن موجودی (معکوس کردن transfer)
          // این بخش پیچیده است و باید تراکنش‌های قبلی را معکوس کند
          // برای سادگی، پیاده‌سازی نمی‌کنیم در این مرحله
          updateData.status = 'cancelled'
        }
        // به‌روزرسانی عادی
        else {
          if (newStatus !== undefined) updateData.status = newStatus
          updateData.updatedAt = new Date().toISOString()
        }

        await collection.updateOne(
          { _id: new ObjectId(id) },
          { $set: updateData },
          { session }
        )
      })
    } finally {
      await session.endSession()
    }

    const updatedTransfer = await collection.findOne({ _id: new ObjectId(id) })

    return NextResponse.json({
      success: true,
      data: updatedTransfer,
      message: newStatus === 'completed' 
        ? 'انتقال تکمیل شد و موجودی انبار به‌روزرسانی شد'
        : 'انتقال با موفقیت به‌روزرسانی شد'
    })
  } catch (error) {
    console.error('Error updating transfer:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در به‌روزرسانی انتقال',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// DELETE - حذف انتقال
export async function DELETE(request: NextRequest) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'شناسه انتقال اجباری است' },
        { status: 400 }
      )
    }

    // بررسی وضعیت انتقال
    const transfer = await collection.findOne({ _id: new ObjectId(id) })
    if (transfer && transfer.status === 'completed') {
      return NextResponse.json(
        { 
          success: false, 
          message: 'امکان حذف انتقال تکمیل شده وجود ندارد. ابتدا انتقال را لغو کنید.' 
        },
        { status: 400 }
      )
    }

    const result = await collection.deleteOne({ _id: new ObjectId(id) })
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'انتقال یافت نشد' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'انتقال با موفقیت حذف شد'
    })
  } catch (error) {
    console.error('Error deleting transfer:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در حذف انتقال' },
      { status: 500 }
    )
  }
}
