import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://restorenUser:1234@localhost:27017/restoren'
const DB_NAME = 'restoren'
const COLLECTION_NAME = 'customer_feedback'

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

// GET - دریافت تمام نظرات مشتریان
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const category = searchParams.get('category')
    const sentiment = searchParams.get('sentiment')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const limit = parseInt(searchParams.get('limit') || '100')
    const skip = parseInt(searchParams.get('skip') || '0')

    // ساخت فیلتر
    const filter: any = {}
    if (status && status !== 'all') filter.status = status
    if (category && category !== 'all') filter.category = category
    if (sentiment && sentiment !== 'all') filter.sentiment = sentiment

    // ساخت مرتب‌سازی
    const sort: any = {}
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1

    const feedbacks = await collection
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
          totalFeedbacks: { $sum: 1 },
          averageRating: { $avg: '$rating' },
          pendingFeedbacks: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          reviewedFeedbacks: { $sum: { $cond: [{ $eq: ['$status', 'reviewed'] }, 1, 0] } },
          resolvedFeedbacks: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
          positiveFeedbacks: { $sum: { $cond: [{ $eq: ['$sentiment', 'positive'] }, 1, 0] } },
          negativeFeedbacks: { $sum: { $cond: [{ $eq: ['$sentiment', 'negative'] }, 1, 0] } }
        }
      }
    ]).toArray()

    return NextResponse.json({
      success: true,
      data: feedbacks,
      stats: stats[0] || {
        totalFeedbacks: 0,
        averageRating: 0,
        pendingFeedbacks: 0,
        reviewedFeedbacks: 0,
        resolvedFeedbacks: 0,
        positiveFeedbacks: 0,
        negativeFeedbacks: 0
      },
      pagination: {
        limit,
        skip,
        total: await collection.countDocuments(filter)
      }
    })
  } catch (error) {
    console.error('Error fetching feedbacks:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت نظرات' },
      { status: 500 }
    )
  }
}

// POST - ایجاد نظر جدید
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const body = await request.json()
    
    const feedback = {
      customerId: body.customerId,
      customerName: body.customerName,
      customerPhone: body.customerPhone,
      orderId: body.orderId,
      rating: body.rating,
      comment: body.comment,
      category: body.category || 'other',
      sentiment: body.sentiment || 'neutral',
      status: body.status || 'pending',
      response: body.response || '',
      respondedAt: body.respondedAt || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const result = await collection.insertOne(feedback)
    
    return NextResponse.json({
      success: true,
      data: { ...feedback, _id: result.insertedId },
      message: 'نظر با موفقیت ثبت شد'
    })
  } catch (error) {
    console.error('Error creating feedback:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در ثبت نظر' },
      { status: 500 }
    )
  }
}

// DELETE - حذف نظر
export async function DELETE(request: NextRequest) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'شناسه نظر اجباری است' },
        { status: 400 }
      )
    }

    const result = await collection.deleteOne({ _id: new ObjectId(id) })
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'نظر یافت نشد' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'نظر با موفقیت حذف شد'
    })
  } catch (error) {
    console.error('Error deleting feedback:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در حذف نظر' },
      { status: 500 }
    )
  }
}
