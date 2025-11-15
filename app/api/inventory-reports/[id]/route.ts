import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://admin:StrongPassword123@185.204.169.107:27017/restaurant?authSource=admin'
const DB_NAME = 'restaurant'
const COLLECTION_NAME = 'inventory_reports'

let client: MongoClient | null = null
let db: any

async function connectToDatabase() {
  try {
    if (!client) {
      client = new MongoClient(MONGO_URI)
      await client.connect()
      db = client.db(DB_NAME)
    }
    return db
  } catch (error) {
    console.error('Database connection error:', error)
    throw error
  }
}

// GET - دریافت یک گزارش خاص
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const report = await collection.findOne({ _id: new ObjectId(params.id) })
    
    if (!report) {
      return NextResponse.json(
        { success: false, message: 'گزارش یافت نشد' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: { ...report, _id: report._id.toString(), id: report._id.toString() },
      message: 'گزارش با موفقیت دریافت شد'
    })
  } catch (error) {
    console.error('Error fetching inventory report:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت گزارش' },
      { status: 500 }
    )
  }
}

// PUT - به‌روزرسانی گزارش
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const body = await request.json()
    const { ...updateData } = body

    const result = await collection.updateOne(
      { _id: new ObjectId(params.id) },
      { 
        $set: {
          ...updateData,
          updatedAt: new Date().toISOString()
        }
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'گزارش یافت نشد' },
        { status: 404 }
      )
    }

    const updatedReport = await collection.findOne({ _id: new ObjectId(params.id) })

    return NextResponse.json({
      success: true,
      data: { ...updatedReport, _id: updatedReport._id.toString(), id: updatedReport._id.toString() },
      message: 'گزارش با موفقیت به‌روزرسانی شد'
    })
  } catch (error) {
    console.error('Error updating inventory report:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در به‌روزرسانی گزارش' },
      { status: 500 }
    )
  }
}

// DELETE - حذف گزارش
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
        { success: false, message: 'گزارش یافت نشد' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'گزارش با موفقیت حذف شد'
    })
  } catch (error) {
    console.error('Error deleting inventory report:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در حذف گزارش' },
      { status: 500 }
    )
  }
}

