import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://admin:StrongPassword123@185.204.169.107:27017/restaurant?authSource=admin'
const DB_NAME = 'restaurant'
const COLLECTION_NAME = 'stock_alerts'

let client: MongoClient
let db: any

async function connectToDatabase() {
  try {
    if (!client) {
      client = new MongoClient(MONGO_URI)
      await client.connect()
      db = client.db(DB_NAME)
    } else if (!db) {
      db = client.db(DB_NAME)
    }
    
    if (db) {
      try {
        await db.admin().ping()
      } catch (pingError) {
        console.warn('MongoDB ping failed, but continuing:', pingError)
      }
    }
    
    if (!db) {
      throw new Error('Database connection failed: db is null')
    }
    
    return db
  } catch (error) {
    console.error('Database connection error:', error)
    if (client) {
      try {
        await client.close()
      } catch (e) {}
      client = null as any
    }
    db = null
    throw error
  }
}

// GET - دریافت تمام هشدارهای موجودی با فیلتر و مرتب‌سازی
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // active, resolved, dismissed
    const severity = searchParams.get('severity') // low, medium, high, critical
    const type = searchParams.get('type') // low_stock, out_of_stock, expiry, overstock
    const warehouse = searchParams.get('warehouse') // فیلتر بر اساس نام انبار
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const limit = parseInt(searchParams.get('limit') || '100')
    const skip = parseInt(searchParams.get('skip') || '0')
    const search = searchParams.get('search') || ''

    // ساخت فیلتر
    const filter: any = {}
    if (status && status !== 'all') filter.status = status
    if (severity && severity !== 'all') filter.severity = severity
    if (type && type !== 'all') filter.type = type
    if (warehouse && warehouse !== 'all') {
      // فیلتر دقیق بر اساس نام انبار
      filter.warehouse = warehouse
    }
    if (search) {
      filter.$or = [
        { itemName: { $regex: search, $options: 'i' } },
        { itemCode: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { warehouse: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } }
      ]
    }

    // ساخت مرتب‌سازی
    const sort: any = {}
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1

    // دریافت تمام هشدارها
    let alerts = await collection
      .find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit * 2) // بیشتر بگیر تا بعد از فیلتر کردن کافی باشد
      .toArray()

    // فیلتر کردن هشدارها بر اساس کالاهای واقعاً موجود در انبارها
    const balanceCollection = db.collection('inventory_balance')
    const inventoryItemsCollection = db.collection('inventory_items')
    
    // دریافت تمام موجودی‌ها از Balance
    const balances = await balanceCollection.find({}).toArray()
    
    // دریافت تمام آیتم‌ها
    const items = await inventoryItemsCollection.find({}).limit(10000).toArray()
    
    // ساخت map برای بررسی سریع موجودی
    const balanceMap = new Map()
    balances.forEach(balance => {
      const key = `${balance.itemId?.toString() || balance.itemId}-${balance.warehouseName || ''}`
      balanceMap.set(key, balance.quantity || 0)
    })
    
    // ساخت map برای بررسی سریع آیتم‌ها
    const itemsMap = new Map()
    items.forEach(item => {
      const key = `${item._id?.toString() || item.id}-${item.warehouse || ''}`
      itemsMap.set(key, item.currentStock || 0)
    })
    
    // فیلتر کردن هشدارها: بررسی اینکه آیا هشدار معتبر است
    alerts = alerts.filter(alert => {
      const itemId = alert.itemId?.toString() || alert.itemId
      const warehouse = alert.warehouse || ''
      
      if (!itemId) {
        return false // اگر itemId نداریم، هشدار را نمایش نده
      }
      
      // بررسی در balance برای انبار مشخص شده
      const balanceKey = `${itemId}-${warehouse}`
      const balanceQty = balanceMap.get(balanceKey)
      
      // بررسی در inventory_items برای انبار مشخص شده
      const itemKey = `${itemId}-${warehouse}`
      const itemStock = itemsMap.get(itemKey)
      
      // دریافت موجودی واقعی (از balance یا inventory_items)
      const actualStock = balanceQty !== undefined ? balanceQty : (itemStock !== undefined ? itemStock : alert.currentStock || 0)
      
      // برای هشدار out_of_stock: اگر موجودی 0 یا کمتر است، هشدار را نمایش بده
      if (alert.type === 'out_of_stock') {
        return actualStock <= 0
      }
      
      // برای هشدار low_stock: اگر موجودی کمتر یا برابر minStock است، هشدار را نمایش بده
      if (alert.type === 'low_stock') {
        const minStock = alert.minStock || 0
        return actualStock <= minStock
      }
      
      // برای هشدار overstock: اگر موجودی بیشتر از maxStock است، هشدار را نمایش بده
      if (alert.type === 'overstock') {
        const maxStock = alert.maxStock || 0
        return actualStock > maxStock
      }
      
      // برای هشدار expiry: همیشه نمایش بده (اگر تاریخ انقضا دارد)
      if (alert.type === 'expiry') {
        return !!alert.expiryDate
      }
      
      // برای سایر هشدارها: نمایش بده
      return true
    })
    
    // محدود کردن به limit
    alerts = alerts.slice(0, limit)

    // آمار کلی - محاسبه بر اساس هشدارهای فیلتر شده
    const alertIds = alerts.map(a => new ObjectId(a._id))
    const stats = alertIds.length > 0 ? await collection.aggregate([
      {
        $match: {
          _id: { $in: alertIds }
        }
      },
      {
        $group: {
          _id: null,
          totalAlerts: { $sum: 1 },
          activeAlerts: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
          resolvedAlerts: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
          dismissedAlerts: { $sum: { $cond: [{ $eq: ['$status', 'dismissed'] }, 1, 0] } },
          criticalAlerts: { 
            $sum: { 
              $cond: [
                { 
                  $or: [
                    { $eq: ['$severity', 'critical'] },
                    { $eq: ['$alertStatus', 'critical'] },
                    { $and: [
                      { $eq: ['$status', 'active'] },
                      { $or: [
                        { $eq: ['$currentStock', 0] },
                        { $lt: ['$currentStock', 0] }
                      ]}
                    ]}
                  ]
                }, 
                1, 
                0
              ] 
            } 
          },
          needsActionAlerts: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$status', 'active'] },
                    { $ne: ['$severity', 'critical'] },
                    { $ne: ['$alertStatus', 'critical'] },
                    { $gt: ['$currentStock', 0] }
                  ]
                },
                1,
                0
              ]
            }
          },
          highAlerts: { $sum: { $cond: [{ $eq: ['$severity', 'high'] }, 1, 0] } },
          mediumAlerts: { $sum: { $cond: [{ $eq: ['$severity', 'medium'] }, 1, 0] } },
          lowAlerts: { $sum: { $cond: [{ $eq: ['$severity', 'low'] }, 1, 0] } },
          lowStockAlerts: { $sum: { $cond: [{ $eq: ['$type', 'low_stock'] }, 1, 0] } },
          outOfStockAlerts: { $sum: { $cond: [{ $eq: ['$type', 'out_of_stock'] }, 1, 0] } },
          expiryAlerts: { $sum: { $cond: [{ $eq: ['$type', 'expiry'] }, 1, 0] } },
          overstockAlerts: { $sum: { $cond: [{ $eq: ['$type', 'overstock'] }, 1, 0] } }
        }
      }
    ]).toArray() : []

    return NextResponse.json({
      success: true,
      data: alerts,
      stats: stats[0] || {
        totalAlerts: 0,
        activeAlerts: 0,
        resolvedAlerts: 0,
        dismissedAlerts: 0,
        criticalAlerts: 0,
        needsActionAlerts: 0,
        highAlerts: 0,
        mediumAlerts: 0,
        lowAlerts: 0,
        lowStockAlerts: 0,
        outOfStockAlerts: 0,
        expiryAlerts: 0,
        overstockAlerts: 0
      },
      pagination: {
        limit,
        skip,
        total: alerts.length // تعداد هشدارهای فیلتر شده
      }
    })
  } catch (error) {
    console.error('Error fetching stock alerts:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت هشدارهای موجودی' },
      { status: 500 }
    )
  }
}

// POST - ایجاد هشدار جدید
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const body = await request.json()
    
    const alert = {
      itemId: body.itemId,
      itemName: body.itemName,
      itemCode: body.itemCode,
      category: body.category,
      warehouse: body.warehouse,
      type: body.type, // low_stock, out_of_stock, expiry, overstock
      severity: body.severity, // low, medium, high, critical
      currentStock: body.currentStock,
      minStock: body.minStock,
      maxStock: body.maxStock,
      expiryDate: body.expiryDate,
      daysToExpiry: body.daysToExpiry,
      message: body.message,
      status: body.status || 'active', // active, resolved, dismissed
      priority: body.priority || 'normal', // low, normal, high, urgent
      assignedTo: body.assignedTo || null,
      resolvedBy: body.resolvedBy || null,
      resolvedAt: body.resolvedAt || null,
      resolution: body.resolution || null,
      notes: body.notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const result = await collection.insertOne(alert)
    
    return NextResponse.json({
      success: true,
      data: { ...alert, _id: result.insertedId },
      message: 'هشدار با موفقیت ایجاد شد'
    })
  } catch (error) {
    console.error('Error creating stock alert:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در ایجاد هشدار' },
      { status: 500 }
    )
  }
}

// PUT - به‌روزرسانی هشدار
export async function PUT(request: NextRequest) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'شناسه هشدار اجباری است' },
        { status: 400 }
      )
    }

    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: {
          ...updateData,
          updatedAt: new Date().toISOString()
        }
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'هشدار یافت نشد' },
        { status: 404 }
      )
    }

    const updatedAlert = await collection.findOne({ _id: new ObjectId(id) })

    return NextResponse.json({
      success: true,
      data: updatedAlert,
      message: 'هشدار با موفقیت به‌روزرسانی شد'
    })
  } catch (error) {
    console.error('Error updating stock alert:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در به‌روزرسانی هشدار' },
      { status: 500 }
    )
  }
}

// DELETE - حذف هشدار
export async function DELETE(request: NextRequest) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'شناسه هشدار اجباری است' },
        { status: 400 }
      )
    }

    const result = await collection.deleteOne({ _id: new ObjectId(id) })
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'هشدار یافت نشد' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'هشدار با موفقیت حذف شد'
    })
  } catch (error) {
    console.error('Error deleting stock alert:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در حذف هشدار' },
      { status: 500 }
    )
  }
}
