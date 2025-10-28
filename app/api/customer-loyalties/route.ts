import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://restorenUser:1234@localhost:27017/restoren'
const DB_NAME = 'restoren'
const COLLECTION_NAME = 'customer_loyalties'

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

// GET - دریافت تمام مشتریان وفادار
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const tier = searchParams.get('tier')
    const sortBy = searchParams.get('sortBy') || 'totalPoints'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const limit = parseInt(searchParams.get('limit') || '100')
    const skip = parseInt(searchParams.get('skip') || '0')

    // ساخت فیلتر
    const filter: any = {}
    if (status && status !== 'all') filter.status = status
    if (tier && tier !== 'all') filter.currentTier = tier

    // ساخت مرتب‌سازی
    const sort: any = {}
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1

    const loyalties = await collection
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
          totalCustomers: { $sum: 1 },
          totalPoints: { $sum: '$totalPoints' },
          totalPointsEarned: { $sum: '$pointsEarned' },
          totalPointsRedeemed: { $sum: '$pointsRedeemed' },
          activeCustomers: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
          inactiveCustomers: { $sum: { $cond: [{ $eq: ['$status', 'inactive'] }, 1, 0] } }
        }
      }
    ]).toArray()

    return NextResponse.json({
      success: true,
      data: loyalties,
      stats: stats[0] || {
        totalCustomers: 0,
        totalPoints: 0,
        totalPointsEarned: 0,
        totalPointsRedeemed: 0,
        activeCustomers: 0,
        inactiveCustomers: 0
      },
      pagination: {
        limit,
        skip,
        total: await collection.countDocuments(filter)
      }
    })
  } catch (error) {
    console.error('Error fetching customer loyalties:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت مشتریان وفادار' },
      { status: 500 }
    )
  }
}

// POST - ایجاد مشتری وفادار جدید
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const body = await request.json()
    
    const loyalty = {
      customerId: body.customerId,
      customerName: body.customerName,
      customerPhone: body.customerPhone,
      totalPoints: body.totalPoints || 0,
      currentTier: body.currentTier || 'Bronze',
      pointsEarned: body.pointsEarned || 0,
      pointsRedeemed: body.pointsRedeemed || 0,
      pointsExpired: body.pointsExpired || 0,
      totalOrders: body.totalOrders || 0,
      totalSpent: body.totalSpent || 0,
      lastOrderDate: body.lastOrderDate || '',
      nextTierPoints: body.nextTierPoints || 0,
      status: body.status || 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const result = await collection.insertOne(loyalty)
    
    return NextResponse.json({
      success: true,
      data: { ...loyalty, _id: result.insertedId },
      message: 'مشتری وفادار با موفقیت ایجاد شد'
    })
  } catch (error) {
    console.error('Error creating customer loyalty:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در ایجاد مشتری وفادار' },
      { status: 500 }
    )
  }
}

// DELETE - حذف مشتری وفادار
export async function DELETE(request: NextRequest) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'شناسه مشتری اجباری است' },
        { status: 400 }
      )
    }

    const result = await collection.deleteOne({ _id: new ObjectId(id) })
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'مشتری یافت نشد' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'مشتری با موفقیت حذف شد'
    })
  } catch (error) {
    console.error('Error deleting customer loyalty:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در حذف مشتری' },
      { status: 500 }
    )
  }
}
