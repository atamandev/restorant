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

// GET - دریافت نظر خاص
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const feedbackId = params.id

    if (!ObjectId.isValid(feedbackId)) {
      return NextResponse.json(
        { success: false, message: 'شناسه نظر نامعتبر است' },
        { status: 400 }
      )
    }

    const feedback = await collection.findOne({ _id: new ObjectId(feedbackId) })

    if (!feedback) {
      return NextResponse.json(
        { success: false, message: 'نظر یافت نشد' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: feedback
    })
  } catch (error) {
    console.error('Error fetching feedback:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت نظر' },
      { status: 500 }
    )
  }
}

// PUT - به‌روزرسانی نظر
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const body = await request.json()
    const feedbackId = params.id

    if (!ObjectId.isValid(feedbackId)) {
      return NextResponse.json(
        { success: false, message: 'شناسه نظر نامعتبر است' },
        { status: 400 }
      )
    }

    const updateData = {
      status: body.status,
      response: body.response || '',
      respondedAt: body.response ? new Date().toISOString() : '',
      updatedAt: new Date().toISOString()
    }

    const result = await collection.updateOne(
      { _id: new ObjectId(feedbackId) },
      { $set: updateData }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'نظر یافت نشد' },
        { status: 404 }
      )
    }

    const updatedFeedback = await collection.findOne({ _id: new ObjectId(feedbackId) })

    return NextResponse.json({
      success: true,
      data: updatedFeedback,
      message: 'نظر با موفقیت به‌روزرسانی شد'
    })
  } catch (error) {
    console.error('Error updating feedback:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در به‌روزرسانی نظر' },
      { status: 500 }
    )
  }
}

// DELETE - حذف نظر
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const feedbackId = params.id

    if (!ObjectId.isValid(feedbackId)) {
      return NextResponse.json(
        { success: false, message: 'شناسه نظر نامعتبر است' },
        { status: 400 }
      )
    }

    const result = await collection.deleteOne({ _id: new ObjectId(feedbackId) })
    
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

