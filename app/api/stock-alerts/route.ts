import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://restorenUser:1234@localhost:27017/restoren'
const DB_NAME = 'restoren'
const COLLECTION_NAME = 'stock_alerts'

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

// GET - دریافت تمام هشدارهای موجودی با فیلتر و مرتب‌سازی
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // active, resolved, dismissed
    const severity = searchParams.get('severity') // low, medium, high, critical
    const type = searchParams.get('type') // low_stock, out_of_stock, expiry, overstock
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

    const alerts = await collection
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
    ]).toArray()

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
        total: await collection.countDocuments(filter)
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
