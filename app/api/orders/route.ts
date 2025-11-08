import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://restorenUser:1234@localhost:27017/restoren'
const DB_NAME = 'restoren'
const COLLECTION_NAME = 'orders'

let client: MongoClient | undefined
let db: any
let clientPromise: Promise<MongoClient> | undefined

async function connectToDatabase() {
  try {
  if (!client) {
    client = new MongoClient(MONGO_URI)
      clientPromise = client.connect()
      await clientPromise
      db = client.db(DB_NAME)
    } else if (!db) {
    db = client.db(DB_NAME)
  }
  return db
  } catch (error) {
    console.error('Database connection error:', error)
    throw error
  }
}

// GET - دریافت تمام سفارشات با فیلتر و مرتب‌سازی
export async function GET(request: NextRequest) {
  try {
    const db = await connectToDatabase()
    if (!db) {
      throw new Error('Database connection failed')
    }
    const collection = db.collection(COLLECTION_NAME)
    
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const orderType = searchParams.get('orderType')
    const priority = searchParams.get('priority')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const sortBy = searchParams.get('sortBy') || 'orderTime'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = parseInt(searchParams.get('skip') || '0')

    // ساخت فیلتر
    const filter: any = {}
    if (status && status !== 'all') filter.status = status
    if (orderType && orderType !== 'all') filter.orderType = orderType
    if (priority && priority !== 'all') filter.priority = priority
    
    // فیلتر تاریخ - دقیق‌تر برای روزانه
    if (startDate || endDate) {
      const start = startDate ? new Date(startDate) : null
      const end = endDate ? new Date(endDate) : null
      
      if (start) {
        start.setHours(0, 0, 0, 0)
      }
      if (end) {
        end.setHours(23, 59, 59, 999)
      }
      
      // فیلتر بر اساس orderTime یا createdAt
      const dateConditions: any[] = []
      
      if (start && end) {
        dateConditions.push(
          { orderTime: { $gte: start, $lte: end } },
          { orderTime: { $gte: start.toISOString(), $lte: end.toISOString() } },
          { createdAt: { $gte: start, $lte: end } }
        )
      } else if (start) {
        dateConditions.push(
          { orderTime: { $gte: start } },
          { orderTime: { $gte: start.toISOString() } },
          { createdAt: { $gte: start } }
        )
      } else if (end) {
        dateConditions.push(
          { orderTime: { $lte: end } },
          { orderTime: { $lte: end.toISOString() } },
          { createdAt: { $lte: end } }
        )
      }
      
      if (dateConditions.length > 0) {
        filter.$or = dateConditions
      }
    }

    // ساخت مرتب‌سازی
    const sort: any = {}
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1

    // بهینه‌سازی: محدود کردن نتایج و فقط فیلدهای ضروری
    const orders = await collection
      .find(filter, {
        projection: {
          orderNumber: 1,
          customerName: 1,
          customerPhone: 1,
          orderType: 1,
          tableNumber: 1,
          items: { $slice: 10 }, // محدود کردن آیتم‌ها
          total: 1,
          status: 1,
          paymentMethod: 1,
          orderTime: 1,
          createdAt: 1,
          priority: 1
        }
      })
      .sort(sort)
      .skip(skip)
      .limit(Math.min(limit, 200)) // محدود کردن به حداکثر 200
      .toArray()

    // آمار کلی - با try/catch برای جلوگیری از خطا
    let stats = [{
      totalOrders: 0,
      totalRevenue: 0,
      pendingOrders: 0,
      confirmedOrders: 0,
      preparingOrders: 0,
      readyOrders: 0,
      completedOrders: 0
    }]
    
    try {
      const statsResult = await collection.aggregate([
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
            totalRevenue: { 
              $sum: { 
                $cond: [
                  { $ne: ['$total', null] },
                  { $ifNull: ['$total', 0] },
                  0
                ]
              }
            },
          pendingOrders: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          confirmedOrders: { $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] } },
          preparingOrders: { $sum: { $cond: [{ $eq: ['$status', 'preparing'] }, 1, 0] } },
          readyOrders: { $sum: { $cond: [{ $eq: ['$status', 'ready'] }, 1, 0] } },
          completedOrders: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } }
        }
      }
    ]).toArray()
      
      if (statsResult && statsResult.length > 0) {
        stats = statsResult
      }
    } catch (statsError) {
      console.error('Error calculating stats:', statsError)
      // محاسبه دستی آمار
      const allOrders: any[] = await collection.find({}).toArray()
      stats = [{
        totalOrders: allOrders.length,
        totalRevenue: allOrders.reduce((sum: number, order: any) => sum + (order.total || 0), 0),
        pendingOrders: allOrders.filter((o: any) => o.status === 'pending').length,
        confirmedOrders: allOrders.filter((o: any) => o.status === 'confirmed').length,
        preparingOrders: allOrders.filter((o: any) => o.status === 'preparing').length,
        readyOrders: allOrders.filter((o: any) => o.status === 'ready').length,
        completedOrders: allOrders.filter((o: any) => o.status === 'completed').length
      }]
    }

    return NextResponse.json({
      success: true,
      data: orders,
      stats: stats[0] || {
        totalOrders: 0,
        totalRevenue: 0,
        pendingOrders: 0,
        confirmedOrders: 0,
        preparingOrders: 0,
        readyOrders: 0,
        completedOrders: 0
      },
      pagination: {
        limit,
        skip,
        total: await collection.countDocuments(filter)
      }
    })
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در دریافت سفارشات',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

// POST - ایجاد سفارش جدید
export async function POST(request: NextRequest) {
  try {
    const db = await connectToDatabase()
    if (!db) {
      throw new Error('Database connection failed')
    }
    const collection = db.collection(COLLECTION_NAME)
    
    const body = await request.json()
    
    // تولید شماره سفارش منحصر به فرد
    const orderCount = await collection.countDocuments()
    const orderNumber = `ORD-${String(orderCount + 1).padStart(6, '0')}`
    
    const order = {
      orderNumber,
      customerName: body.customerName,
      customerPhone: body.customerPhone,
      customerAddress: body.customerAddress || '',
      orderType: body.orderType || 'dine-in',
      tableNumber: body.tableNumber || '',
      items: body.items || [],
      subtotal: body.subtotal || 0,
      tax: body.tax || 0,
      serviceCharge: body.serviceCharge || 0,
      discount: body.discount || 0,
      total: body.total || 0,
      orderTime: body.orderTime || new Date().toISOString(),
      estimatedTime: body.estimatedTime || new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      status: body.status || 'pending',
      notes: body.notes || '',
      paymentMethod: body.paymentMethod || 'cash',
      priority: body.priority || 'normal',
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await collection.insertOne(order)
    
    return NextResponse.json({
      success: true,
      data: { ...order, _id: result.insertedId },
      message: 'سفارش با موفقیت ایجاد شد'
    })
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در ایجاد سفارش' },
      { status: 500 }
    )
  }
}

// DELETE - حذف سفارش
export async function DELETE(request: NextRequest) {
  try {
    const db = await connectToDatabase()
    if (!db) {
      throw new Error('Database connection failed')
    }
    const collection = db.collection(COLLECTION_NAME)
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'شناسه سفارش اجباری است' },
        { status: 400 }
      )
    }

    const result = await collection.deleteOne({ _id: new ObjectId(id) })
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'سفارش یافت نشد' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'سفارش با موفقیت حذف شد'
    })
  } catch (error) {
    console.error('Error deleting order:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در حذف سفارش' },
      { status: 500 }
    )
  }
}