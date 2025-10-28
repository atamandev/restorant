import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://restorenUser:1234@localhost:27017/restoren'
const DB_NAME = 'restoren'
const COLLECTION_NAME = 'loyalty_programs'

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

// GET - دریافت تمام برنامه‌های وفاداری
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const limit = parseInt(searchParams.get('limit') || '100')
    const skip = parseInt(searchParams.get('skip') || '0')

    // ساخت فیلتر
    const filter: any = {}
    if (status && status !== 'all') filter.status = status
    if (type && type !== 'all') filter.type = type

    // ساخت مرتب‌سازی
    const sort: any = {}
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1

    const programs = await collection
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
          totalPrograms: { $sum: 1 },
          activePrograms: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
          inactivePrograms: { $sum: { $cond: [{ $eq: ['$status', 'inactive'] }, 1, 0] } },
          draftPrograms: { $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] } }
        }
      }
    ]).toArray()

    return NextResponse.json({
      success: true,
      data: programs,
      stats: stats[0] || {
        totalPrograms: 0,
        activePrograms: 0,
        inactivePrograms: 0,
        draftPrograms: 0
      },
      pagination: {
        limit,
        skip,
        total: await collection.countDocuments(filter)
      }
    })
  } catch (error) {
    console.error('Error fetching loyalty programs:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت برنامه‌های وفاداری' },
      { status: 500 }
    )
  }
}

// POST - ایجاد برنامه وفاداری جدید
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const body = await request.json()
    
    const program = {
      name: body.name,
      description: body.description,
      type: body.type || 'points',
      status: body.status || 'draft',
      rules: {
        pointsPerRial: body.rules?.pointsPerRial || 1,
        minOrderAmount: body.rules?.minOrderAmount || 100000,
        maxPointsPerOrder: body.rules?.maxPointsPerOrder || 1000,
        expiryDays: body.rules?.expiryDays || 365
      },
      rewards: body.rewards || [],
      tiers: body.tiers || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const result = await collection.insertOne(program)
    
    return NextResponse.json({
      success: true,
      data: { ...program, _id: result.insertedId },
      message: 'برنامه وفاداری با موفقیت ایجاد شد'
    })
  } catch (error) {
    console.error('Error creating loyalty program:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در ایجاد برنامه وفاداری' },
      { status: 500 }
    )
  }
}

// DELETE - حذف برنامه وفاداری
export async function DELETE(request: NextRequest) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'شناسه برنامه اجباری است' },
        { status: 400 }
      )
    }

    const result = await collection.deleteOne({ _id: new ObjectId(id) })
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'برنامه یافت نشد' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'برنامه با موفقیت حذف شد'
    })
  } catch (error) {
    console.error('Error deleting loyalty program:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در حذف برنامه' },
      { status: 500 }
    )
  }
}
