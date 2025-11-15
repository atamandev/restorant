import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://admin:StrongPassword123@185.204.169.107:27017/restaurant?authSource=admin'
const DB_NAME = 'restaurant'
const COLLECTION_NAME = 'adjustments'

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

// GET - دریافت تعدیل خاص
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const adjustment = await collection.findOne({ _id: new ObjectId(params.id) })
    
    if (!adjustment) {
      return NextResponse.json(
        { success: false, message: 'تعدیل یافت نشد' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        ...adjustment,
        _id: adjustment._id.toString(),
        id: adjustment._id.toString()
      }
    })
  } catch (error) {
    console.error('Error fetching adjustment:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت تعدیل' },
      { status: 500 }
    )
  }
}

// PUT - به‌روزرسانی تعدیل خاص
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const body = await request.json()
    
    const adjustment = await collection.findOne({ _id: new ObjectId(params.id) })
    
    if (adjustment && adjustment.status === 'posted') {
      return NextResponse.json(
        { success: false, message: 'تعدیل ثبت شده قابل ویرایش نیست' },
        { status: 400 }
      )
    }

    const result = await collection.updateOne(
      { _id: new ObjectId(params.id) },
      {
        $set: {
          ...body,
          updatedAt: new Date().toISOString()
        }
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'تعدیل یافت نشد' },
        { status: 404 }
      )
    }

    const updatedAdjustment = await collection.findOne({ _id: new ObjectId(params.id) })

    return NextResponse.json({
      success: true,
      data: { ...updatedAdjustment, _id: updatedAdjustment._id.toString(), id: updatedAdjustment._id.toString() },
      message: 'تعدیل با موفقیت به‌روزرسانی شد'
    })
  } catch (error) {
    console.error('Error updating adjustment:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در به‌روزرسانی تعدیل' },
      { status: 500 }
    )
  }
}

// DELETE - حذف تعدیل خاص
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const adjustment = await collection.findOne({ _id: new ObjectId(params.id) })
    
    if (!adjustment) {
      return NextResponse.json(
        { success: false, message: 'تعدیل یافت نشد' },
        { status: 404 }
      )
    }

    if (adjustment.status === 'posted') {
      return NextResponse.json(
        { success: false, message: 'تعدیل ثبت شده قابل حذف نیست' },
        { status: 400 }
      )
    }

    const result = await collection.deleteOne({ _id: new ObjectId(params.id) })
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'تعدیل یافت نشد' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'تعدیل با موفقیت حذف شد'
    })
  } catch (error) {
    console.error('Error deleting adjustment:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در حذف تعدیل' },
      { status: 500 }
    )
  }
}


