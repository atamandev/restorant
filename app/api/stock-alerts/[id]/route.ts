import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://admin:StrongPassword123@185.204.169.107:27017/restaurant?authSource=admin'
const DB_NAME = 'restaurant'
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

// GET - دریافت هشدار خاص
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const alert = await collection.findOne({ _id: new ObjectId(params.id) })
    
    if (!alert) {
      return NextResponse.json(
        { success: false, message: 'هشدار یافت نشد' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: alert
    })
  } catch (error) {
    console.error('Error fetching stock alert:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت هشدار' },
      { status: 500 }
    )
  }
}

// PUT - به‌روزرسانی هشدار خاص
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const body = await request.json()
    
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
        { success: false, message: 'هشدار یافت نشد' },
        { status: 404 }
      )
    }

    const updatedAlert = await collection.findOne({ _id: new ObjectId(params.id) })

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

// DELETE - حذف هشدار خاص
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const result = await collection.deleteOne({ _id: new ObjectId(params.id) })
    
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
