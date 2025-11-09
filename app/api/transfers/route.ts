import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://restorenUser:1234@localhost:27017/restoren'
const DB_NAME = 'restoren'

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

// تنظیمات سیستم: مدل انتقال (simple یا two_stage)
const TRANSFER_MODE = process.env.TRANSFER_MODE || 'simple' // 'simple' | 'two_stage'

// GET - دریافت تمام انتقال‌ها
export async function GET(request: NextRequest) {
  try {
    const db = await connectToDatabase()
    const transferCollection = db.collection('transfers')
    
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const fromWarehouse = searchParams.get('fromWarehouse')
    const toWarehouse = searchParams.get('toWarehouse')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const limit = parseInt(searchParams.get('limit') || '100')
    const skip = parseInt(searchParams.get('skip') || '0')
    
    const filter: any = {}
    if (status && status !== 'all') filter.status = status
    if (type && type !== 'all') filter.type = type
    if (fromWarehouse) filter.fromWarehouse = fromWarehouse
    if (toWarehouse) filter.toWarehouse = toWarehouse
    if (dateFrom || dateTo) {
      filter.createdAt = {}
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom)
      if (dateTo) filter.createdAt.$lte = new Date(dateTo)
    }
    
    const transfers = await transferCollection
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray()
    
    const total = await transferCollection.countDocuments(filter)
    
    // محاسبه آمار
    const stats = {
      totalTransfers: await transferCollection.countDocuments({}),
      pendingTransfers: await transferCollection.countDocuments({ status: 'pending' }),
      inTransitTransfers: await transferCollection.countDocuments({ status: 'in_transit' }),
      completedTransfers: await transferCollection.countDocuments({ status: 'completed' }),
      cancelledTransfers: await transferCollection.countDocuments({ status: 'cancelled' }),
      draftTransfers: await transferCollection.countDocuments({ status: 'draft' })
    }
    
    return NextResponse.json({
      success: true,
      data: transfers,
      stats,
      total,
      limit,
      skip
    })
  } catch (error) {
    console.error('Error fetching transfers:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت انتقال‌ها' },
      { status: 500 }
    )
  }
}

// POST - ایجاد انتقال جدید
export async function POST(request: NextRequest) {
  try {
    const db = await connectToDatabase()
    const client = (db as any).client || await connectToDatabase()
    const transferCollection = db.collection('transfers')
    const balanceCollection = db.collection('inventory_balance')
    const movementCollection = db.collection('stock_movements')
    const fifoLayerCollection = db.collection('fifo_layers')
    const warehouseCollection = db.collection('warehouses')
    
    const body = await request.json()
    const {
      type = 'internal',
      fromWarehouse,
      toWarehouse,
      items,
      requestedBy,
      priority = 'normal',
      scheduledDate,
      notes = '',
      reason = '',
      status = 'draft', // پیش‌نویس
      transferMode = TRANSFER_MODE // 'simple' یا 'two_stage'
    } = body
    
    // اعتبارسنجی
    if (!fromWarehouse || !toWarehouse) {
      return NextResponse.json(
        { success: false, message: 'انبار مبدا و مقصد اجباری است' },
        { status: 400 }
      )
    }
    
    if (fromWarehouse === toWarehouse) {
      return NextResponse.json(
        { success: false, message: 'انتقال به همان انبار ممنوع است' },
        { status: 400 }
      )
    }
    
    if (!items || items.length === 0) {
      return NextResponse.json(
        { success: false, message: 'حداقل یک آیتم برای انتقال لازم است' },
        { status: 400 }
      )
    }
    
    // بررسی مقادیر
    for (const item of items) {
      if (!item.quantity || item.quantity <= 0) {
        return NextResponse.json(
          { success: false, message: `مقدار آیتم "${item.itemName}" باید بیشتر از صفر باشد` },
          { status: 400 }
        )
      }
    }
    
    // بررسی وضعیت انبار مقصد
    const toWarehouseDoc = await warehouseCollection.findOne({ 
      $or: [
        { name: toWarehouse },
        { name: { $regex: toWarehouse, $options: 'i' } }
      ]
    })
    
    if (!toWarehouseDoc) {
      return NextResponse.json(
        { success: false, message: `انبار مقصد "${toWarehouse}" یافت نشد` },
        { status: 400 }
      )
    }
    
    if (toWarehouseDoc.status === 'inactive') {
      return NextResponse.json(
        { success: false, message: `انتقال به انبار غیرفعال "${toWarehouse}" ممنوع است` },
        { status: 400 }
      )
    }
    
    // بررسی موجودی در انبار مبدا
    for (const item of items) {
      const balance = await balanceCollection.findOne({
        itemId: new ObjectId(item.itemId),
        warehouseName: fromWarehouse
      })
      
      const availableQuantity = balance?.quantity || 0
      if (availableQuantity < item.quantity) {
        return NextResponse.json(
          { 
            success: false, 
            message: `موجودی کافی نیست. آیتم "${item.itemName}": موجودی ${availableQuantity}، درخواست ${item.quantity}` 
          },
          { status: 400 }
        )
      }
    }
    
    // تولید شماره انتقال
    const transferCount = await transferCollection.countDocuments()
    const transferNumber = `TRF-${String(transferCount + 1).padStart(6, '0')}`
    
    // محاسبه مجموع
    const totalItems = items.reduce((sum: number, item: any) => sum + item.quantity, 0)
    const totalValue = items.reduce((sum: number, item: any) => sum + (item.totalValue || item.quantity * item.unitPrice), 0)
    
    // ایجاد سند انتقال
    const transfer = {
      transferNumber,
      type,
      fromWarehouse,
      toWarehouse,
      items,
      totalItems,
      totalValue,
      requestedBy,
      approvedBy: null,
      status,
      priority,
      scheduledDate: scheduledDate || null,
      actualDate: null,
      notes,
      reason,
      transferMode,
      transferRef: null, // برای اتصال TRANSFER_OUT و TRANSFER_IN
      inTransit: {}, // برای مدل دو مرحله‌ای: { itemId: quantity }
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      approvedAt: null,
      completedAt: null,
      cancelledAt: null
    }
    
    const result = await transferCollection.insertOne(transfer)
    
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
