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

// POST - ثبت دانلود گزارش
export async function POST(
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

    if (report.status !== 'ready') {
      return NextResponse.json(
        { success: false, message: 'گزارش آماده دانلود نیست' },
        { status: 400 }
      )
    }

    // افزایش تعداد دانلود
    await collection.updateOne(
      { _id: new ObjectId(params.id) },
      { 
        $inc: { downloadCount: 1 },
        $set: { updatedAt: new Date().toISOString() }
      }
    )

    // بازگرداندن داده گزارش برای دانلود
    return NextResponse.json({
      success: true,
      data: {
        ...report,
        _id: report._id.toString(),
        id: report._id.toString(),
        downloadCount: (report.downloadCount || 0) + 1
      },
      message: 'گزارش آماده دانلود است'
    })
  } catch (error) {
    console.error('Error downloading inventory report:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دانلود گزارش' },
      { status: 500 }
    )
  }
}

