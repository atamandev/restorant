import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://admin:StrongPassword123@185.204.169.107:27017/restaurant?authSource=admin'
const DB_NAME = 'restaurant'
const COLLECTION_NAME = 'item_ledger'

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

// GET - دریافت ورودی‌های دفتر کل با فیلتر
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()
    const ledgerCollection = db.collection(COLLECTION_NAME)
    const inventoryCollection = db.collection('inventory_items')
    
    const { searchParams } = new URL(request.url)
    const itemId = searchParams.get('itemId')
    const warehouse = searchParams.get('warehouse')
    const documentType = searchParams.get('documentType')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const sortBy = searchParams.get('sortBy') || 'date'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const limit = parseInt(searchParams.get('limit') || '100')
    const skip = parseInt(searchParams.get('skip') || '0')
    const search = searchParams.get('search') || ''

    // ساخت فیلتر
    const filter: any = {}
    if (itemId) {
      try {
        filter.itemId = itemId
      } catch {
        filter.itemId = itemId
      }
    }
    if (warehouse && warehouse !== 'all') filter.warehouse = warehouse
    if (documentType && documentType !== 'all') filter.documentType = documentType
    if (dateFrom) filter.date = { $gte: dateFrom }
    if (dateTo) {
      if (filter.date) {
        filter.date.$lte = dateTo
      } else {
        filter.date = { $lte: dateTo }
      }
    }
    if (search) {
      filter.$or = [
        { documentNumber: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { reference: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } }
      ]
    }

    // ساخت مرتب‌سازی
    const sort: any = {}
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1

    const entries = await ledgerCollection
      .find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .toArray()

    // اگر itemId داده شده، اطلاعات آیتم را هم بگیر
    let itemInfo = null
    if (itemId) {
      itemInfo = await inventoryCollection.findOne({ _id: new ObjectId(itemId) })
    }

    return NextResponse.json({
      success: true,
      data: entries,
      itemInfo,
      pagination: {
        limit,
        skip,
        total: await ledgerCollection.countDocuments(filter)
      }
    })
  } catch (error) {
    console.error('Error fetching item ledger entries:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت ورودی‌های دفتر کل' },
      { status: 500 }
    )
  }
}

// POST - ایجاد ورودی جدید در دفتر کل
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()
    const ledgerCollection = db.collection(COLLECTION_NAME)
    const inventoryCollection = db.collection('inventory_items')
    
    const body = await request.json()
    
    const {
      itemId,
      date,
      documentNumber,
      documentType,
      description,
      warehouse,
      quantityIn,
      quantityOut,
      unitPrice,
      reference,
      notes,
      userId
    } = body

    if (!itemId || !date || !documentType) {
      return NextResponse.json(
        { success: false, message: 'شناسه آیتم، تاریخ و نوع سند اجباری است' },
        { status: 400 }
      )
    }

    // دریافت اطلاعات آیتم
    const item = await inventoryCollection.findOne({ _id: new ObjectId(itemId) })
    if (!item) {
      return NextResponse.json(
        { success: false, message: 'آیتم یافت نشد' },
        { status: 404 }
      )
    }

    // دریافت آخرین ورودی برای محاسبه مانده
    const lastEntry = await ledgerCollection
      .findOne(
        { itemId },
        { sort: { date: -1, createdAt: -1 } }
      )

    const lastBalance = lastEntry?.runningBalance || 0
    const lastValue = lastEntry?.runningValue || 0

    // محاسبه مانده جدید
    const qtyIn = Number(quantityIn) || 0
    const qtyOut = Number(quantityOut) || 0
    const price = Number(unitPrice) || 0
    
    const newBalance = lastBalance + qtyIn - qtyOut
    
    // محاسبه ارزش (بر اساس روش ارزش‌گذاری)
    let newValue = 0
    const valuationMethod = item.valuationMethod || 'weighted_average'
    
    if (valuationMethod === 'fifo') {
      // FIFO: قیمت ورودی استفاده می‌شود
      if (qtyIn > 0) {
        newValue = lastValue + (qtyIn * price) - (qtyOut * (lastValue / Math.max(lastBalance, 1)))
      } else if (qtyOut > 0) {
        newValue = lastValue - (qtyOut * (lastValue / Math.max(lastBalance, 1)))
      }
    } else if (valuationMethod === 'lifo') {
      // LIFO: مشابه FIFO اما در جهت معکوس
      if (qtyIn > 0) {
        newValue = lastValue + (qtyIn * price) - (qtyOut * (lastValue / Math.max(lastBalance, 1)))
      } else if (qtyOut > 0) {
        newValue = lastValue - (qtyOut * (lastValue / Math.max(lastBalance, 1)))
      }
    } else {
      // Weighted Average: میانگین موزون
      const totalValue = lastValue + (qtyIn * price)
      const totalQty = lastBalance + qtyIn
      const avgPrice = totalQty > 0 ? totalValue / totalQty : price
      newValue = totalValue - (qtyOut * avgPrice)
    }

    // تولید شماره سند اگر داده نشده باشد
    let docNumber = documentNumber
    if (!docNumber) {
      const prefix = documentType === 'receipt' ? 'REC' : 
                    documentType === 'issue' ? 'ISS' :
                    documentType === 'transfer_in' ? 'TRIN' :
                    documentType === 'transfer_out' ? 'TROUT' :
                    documentType === 'adjustment' ? 'ADJ' : 'CNT'
      const count = await ledgerCollection.countDocuments({ documentType })
      docNumber = `${prefix}-${String(count + 1).padStart(3, '0')}`
    }

    const totalValue = (qtyIn * price) - (qtyOut * price)

    const entry = {
      itemId,
      itemName: item.name,
      itemCode: item.code || item.code,
      date,
      documentNumber: docNumber,
      documentType,
      description: description || '',
      warehouse: warehouse || item.warehouse || 'انبار اصلی',
      quantityIn: qtyIn,
      quantityOut: qtyOut,
      unitPrice: price,
      totalValue,
      runningBalance: newBalance,
      runningValue: newValue,
      averagePrice: newBalance > 0 ? newValue / newBalance : price,
      reference: reference || '',
      notes: notes || '',
      userId: userId || 'سیستم',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const result = await ledgerCollection.insertOne(entry)

    // به‌روزرسانی موجودی آیتم
    const wasLowStock = item.isLowStock || false
    const isNowLowStock = newBalance <= (item.minStock || 0)
    
    await inventoryCollection.updateOne(
      { _id: new ObjectId(itemId) },
      {
        $set: {
          currentStock: newBalance,
          totalValue: newValue,
          unitPrice: newBalance > 0 ? newValue / newBalance : price,
          isLowStock: isNowLowStock,
          lastUpdated: new Date().toISOString(),
          updatedAt: new Date()
        }
      }
    )

    // مدیریت هشدار کمبود موجودی
    const stockAlertsCollection = db.collection('stock_alerts')
    
    // اگر موجودی کم شد، هشدار ایجاد/به‌روزرسانی کن
    if (!wasLowStock && isNowLowStock) {
      const alertType = newBalance === 0 ? 'out_of_stock' : 'low_stock'
      const severity = newBalance === 0 ? 'critical' : 'medium'

      const existingAlert = await stockAlertsCollection.findOne({
        itemId,
        status: 'active'
      })

      if (existingAlert) {
        await stockAlertsCollection.updateOne(
          { _id: existingAlert._id },
          {
            $set: {
              type: alertType,
              severity: severity,
              currentStock: newBalance,
              minStock: item.minStock || 0,
              message: newBalance === 0
                ? `${item.name} تمام شده است`
                : `موجودی ${item.name} کم است (${newBalance} ${item.unit || 'عدد'})`,
              priority: severity === 'critical' ? 'urgent' : 'normal',
              updatedAt: new Date().toISOString()
            }
          }
        )
      } else {
        await stockAlertsCollection.insertOne({
          itemId,
          itemName: item.name,
          itemCode: item.code || '',
          category: item.category || '',
          warehouse: item.warehouse || 'انبار اصلی',
          type: alertType,
          severity: severity,
          currentStock: newBalance,
          minStock: item.minStock || 0,
          maxStock: item.maxStock || 0,
          unit: item.unit || 'عدد',
          message: newBalance === 0
            ? `${item.name} تمام شده است`
            : `موجودی ${item.name} کم است (${newBalance} ${item.unit || 'عدد'})`,
          status: 'active',
          priority: severity === 'critical' ? 'urgent' : 'normal',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
      }
    }
    // اگر موجودی به حالت عادی برگشت، هشدار را resolve کن
    else if (wasLowStock && !isNowLowStock) {
      await stockAlertsCollection.updateMany(
        { itemId, status: 'active' },
        {
          $set: {
            status: 'resolved',
            resolvedAt: new Date().toISOString(),
            resolution: 'موجودی به حالت عادی برگشت',
            updatedAt: new Date().toISOString()
          }
        }
      )
    }

    return NextResponse.json({
      success: true,
      data: { ...entry, _id: result.insertedId },
      message: 'ورودی دفتر کل با موفقیت ایجاد شد'
    })
  } catch (error) {
    console.error('Error creating ledger entry:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در ایجاد ورودی دفتر کل' },
      { status: 500 }
    )
  }
}

// PUT - به‌روزرسانی ورودی دفتر کل
export async function PUT(request: NextRequest) {
  try {
    await connectToDatabase()
    const ledgerCollection = db.collection(COLLECTION_NAME)
    const inventoryCollection = db.collection('inventory_items')
    
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'شناسه ورودی اجباری است' },
        { status: 400 }
      )
    }

    // دریافت ورودی فعلی
    const currentEntry = await ledgerCollection.findOne({ _id: new ObjectId(id) })
    if (!currentEntry) {
      return NextResponse.json(
        { success: false, message: 'ورودی یافت نشد' },
        { status: 404 }
      )
    }

    // محاسبه مجدد مانده‌ها از این ورودی به بعد
    const result = await ledgerCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          ...updateData,
          updatedAt: new Date().toISOString()
        }
      }
    )

    // محاسبه مجدد تمام مانده‌ها برای این آیتم
    await recalculateBalances(currentEntry.itemId, ledgerCollection, inventoryCollection)

    const updatedEntry = await ledgerCollection.findOne({ _id: new ObjectId(id) })

    return NextResponse.json({
      success: true,
      data: updatedEntry,
      message: 'ورودی دفتر کل با موفقیت به‌روزرسانی شد'
    })
  } catch (error) {
    console.error('Error updating ledger entry:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در به‌روزرسانی ورودی دفتر کل' },
      { status: 500 }
    )
  }
}

// DELETE - حذف ورودی دفتر کل
export async function DELETE(request: NextRequest) {
  try {
    await connectToDatabase()
    const ledgerCollection = db.collection(COLLECTION_NAME)
    const inventoryCollection = db.collection('inventory_items')
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'شناسه ورودی اجباری است' },
        { status: 400 }
      )
    }

    const entry = await ledgerCollection.findOne({ _id: new ObjectId(id) })
    if (!entry) {
      return NextResponse.json(
        { success: false, message: 'ورودی یافت نشد' },
        { status: 404 }
      )
    }

    const itemId = entry.itemId
    await ledgerCollection.deleteOne({ _id: new ObjectId(id) })

    // محاسبه مجدد تمام مانده‌ها برای این آیتم
    await recalculateBalances(itemId, ledgerCollection, inventoryCollection)

    return NextResponse.json({
      success: true,
      message: 'ورودی دفتر کل با موفقیت حذف شد'
    })
  } catch (error) {
    console.error('Error deleting ledger entry:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در حذف ورودی دفتر کل' },
      { status: 500 }
    )
  }
}

// تابع کمکی برای محاسبه مجدد مانده‌ها
async function recalculateBalances(itemId: string, ledgerCollection: any, inventoryCollection: any) {
  const entries = await ledgerCollection
    .find({ itemId })
    .sort({ date: 1, createdAt: 1 })
    .toArray()

  const item = await inventoryCollection.findOne({ _id: new ObjectId(itemId) })
  const valuationMethod = item?.valuationMethod || 'weighted_average'

  let runningBalance = 0
  let runningValue = 0

  for (const entry of entries) {
    const qtyIn = entry.quantityIn || 0
    const qtyOut = entry.quantityOut || 0
    const price = entry.unitPrice || 0

    runningBalance += qtyIn - qtyOut

    // محاسبه ارزش بر اساس روش ارزش‌گذاری
    if (valuationMethod === 'weighted_average') {
      const totalValue = runningValue + (qtyIn * price)
      const totalQty = runningBalance + qtyOut
      const avgPrice = totalQty > 0 ? totalValue / totalQty : price
      runningValue = totalValue - (qtyOut * avgPrice)
    } else {
      // FIFO/LIFO
      if (qtyIn > 0) {
        runningValue += qtyIn * price
      }
      if (qtyOut > 0) {
        const avgPrice = runningBalance > 0 ? runningValue / runningBalance : price
        runningValue -= qtyOut * avgPrice
      }
    }

    const averagePrice = runningBalance > 0 ? runningValue / runningBalance : price

    await ledgerCollection.updateOne(
      { _id: entry._id },
      {
        $set: {
          runningBalance,
          runningValue,
          averagePrice,
          updatedAt: new Date().toISOString()
        }
      }
    )
  }

  // به‌روزرسانی موجودی آیتم
  if (entries.length > 0) {
    const lastEntry = entries[entries.length - 1]
    const wasLowStock = item.isLowStock || false
    const isNowLowStock = lastEntry.runningBalance <= (item.minStock || 0)
    
    await inventoryCollection.updateOne(
      { _id: new ObjectId(itemId) },
      {
        $set: {
          currentStock: lastEntry.runningBalance,
          totalValue: lastEntry.runningValue,
          unitPrice: lastEntry.averagePrice,
          isLowStock: isNowLowStock,
          lastUpdated: new Date().toISOString(),
          updatedAt: new Date()
        }
      }
    )

    // مدیریت هشدار کمبود موجودی
    const stockAlertsCollection = db.collection('stock_alerts')
    
    if (!wasLowStock && isNowLowStock) {
      const alertType = lastEntry.runningBalance === 0 ? 'out_of_stock' : 'low_stock'
      const severity = lastEntry.runningBalance === 0 ? 'critical' : 'medium'

      const existingAlert = await stockAlertsCollection.findOne({
        itemId,
        status: 'active'
      })

      if (existingAlert) {
        await stockAlertsCollection.updateOne(
          { _id: existingAlert._id },
          {
            $set: {
              type: alertType,
              severity: severity,
              currentStock: lastEntry.runningBalance,
              minStock: item.minStock || 0,
              message: lastEntry.runningBalance === 0
                ? `${item.name} تمام شده است`
                : `موجودی ${item.name} کم است (${lastEntry.runningBalance} ${item.unit || 'عدد'})`,
              priority: severity === 'critical' ? 'urgent' : 'normal',
              updatedAt: new Date().toISOString()
            }
          }
        )
      } else {
        await stockAlertsCollection.insertOne({
          itemId,
          itemName: item.name,
          itemCode: item.code || '',
          category: item.category || '',
          warehouse: item.warehouse || 'انبار اصلی',
          type: alertType,
          severity: severity,
          currentStock: lastEntry.runningBalance,
          minStock: item.minStock || 0,
          maxStock: item.maxStock || 0,
          unit: item.unit || 'عدد',
          message: lastEntry.runningBalance === 0
            ? `${item.name} تمام شده است`
            : `موجودی ${item.name} کم است (${lastEntry.runningBalance} ${item.unit || 'عدد'})`,
          status: 'active',
          priority: severity === 'critical' ? 'urgent' : 'normal',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
      }
    } else if (wasLowStock && !isNowLowStock) {
      await stockAlertsCollection.updateMany(
        { itemId, status: 'active' },
        {
          $set: {
            status: 'resolved',
            resolvedAt: new Date().toISOString(),
            resolution: 'موجودی به حالت عادی برگشت',
            updatedAt: new Date().toISOString()
          }
        }
      )
    }
  }
}

