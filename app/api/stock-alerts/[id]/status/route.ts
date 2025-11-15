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

// PUT - تغییر وضعیت هشدار
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const body = await request.json()
    const { status, resolution, resolvedBy, notes } = body

    if (!status) {
      return NextResponse.json(
        { success: false, message: 'وضعیت جدید اجباری است' },
        { status: 400 }
      )
    }

    // بررسی هشدار
    const alert = await collection.findOne({ _id: new ObjectId(params.id) })
    if (!alert) {
      return NextResponse.json(
        { success: false, message: 'هشدار یافت نشد' },
        { status: 404 }
      )
    }

    // به‌روزرسانی وضعیت
    const updateData: any = {
      status,
      updatedAt: new Date().toISOString()
    }

    if (status === 'resolved') {
      updateData.resolvedAt = new Date().toISOString()
      if (resolvedBy) {
        updateData.resolvedBy = resolvedBy
      }
      if (resolution) {
        updateData.resolution = resolution
      }
    }

    if (notes) {
      updateData.notes = notes
    }

    const result = await collection.updateOne(
      { _id: new ObjectId(params.id) },
      { $set: updateData }
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
      message: `وضعیت هشدار به ${status} تغییر یافت`
    })
  } catch (error) {
    console.error('Error updating stock alert status:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در تغییر وضعیت هشدار' },
      { status: 500 }
    )
  }
}
