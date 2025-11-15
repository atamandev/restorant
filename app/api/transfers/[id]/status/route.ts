import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://admin:StrongPassword123@185.204.169.107:27017/restaurant?authSource=admin'
const DB_NAME = 'restaurant'
const COLLECTION_NAME = 'transfers'

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

// PUT - تغییر وضعیت انتقال
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const body = await request.json()
    const { status, notes, approvedBy } = body

    if (!status) {
      return NextResponse.json(
        { success: false, message: 'وضعیت جدید اجباری است' },
        { status: 400 }
      )
    }

    // بررسی انتقال
    const transfer = await collection.findOne({ _id: new ObjectId(params.id) })
    if (!transfer) {
      return NextResponse.json(
        { success: false, message: 'انتقال یافت نشد' },
        { status: 404 }
      )
    }

    // بررسی امکان تغییر وضعیت
    const validTransitions: { [key: string]: string[] } = {
      'pending': ['in_transit', 'cancelled'],
      'in_transit': ['completed', 'cancelled'],
      'completed': [], // انتقال تکمیل شده قابل تغییر نیست
      'cancelled': [] // انتقال لغو شده قابل تغییر نیست
    }

    if (!validTransitions[transfer.status]?.includes(status)) {
      return NextResponse.json(
        { 
          success: false, 
          message: `امکان تغییر وضعیت از ${transfer.status} به ${status} وجود ندارد` 
        },
        { status: 400 }
      )
    }

    // به‌روزرسانی وضعیت
    const updateData: any = {
      status,
      updatedAt: new Date().toISOString()
    }

    if (status === 'in_transit') {
      updateData.actualDate = new Date().toISOString()
    } else if (status === 'completed') {
      updateData.actualDate = new Date().toISOString()
    }

    if (approvedBy) {
      updateData.approvedBy = approvedBy
    }

    if (notes) {
      updateData.statusNotes = notes
    }

    const result = await collection.updateOne(
      { _id: new ObjectId(params.id) },
      { $set: updateData }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'انتقال یافت نشد' },
        { status: 404 }
      )
    }

    const updatedTransfer = await collection.findOne({ _id: new ObjectId(params.id) })

    return NextResponse.json({
      success: true,
      data: updatedTransfer,
      message: `وضعیت انتقال به ${status} تغییر یافت`
    })
  } catch (error) {
    console.error('Error updating transfer status:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در تغییر وضعیت انتقال' },
      { status: 500 }
    )
  }
}
