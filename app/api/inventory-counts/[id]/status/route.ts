import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://restorenUser:1234@localhost:27017/restoren'
const DB_NAME = 'restoren'
const COLLECTION_NAME = 'inventory_counts'

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

// PUT - تغییر وضعیت شمارش
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const body = await request.json()
    const { status } = body

    if (!status) {
      return NextResponse.json(
        { success: false, message: 'وضعیت جدید اجباری است' },
        { status: 400 }
      )
    }

    const updateData: any = {
      status,
      updatedAt: new Date().toISOString()
    }

    // تنظیم تاریخ‌ها بر اساس وضعیت
    if (status === 'in_progress') {
      updateData.startedDate = new Date().toISOString()
    } else if (status === 'completed') {
      updateData.completedDate = new Date().toISOString()
      // اگر startedDate وجود ندارد، آن را هم تنظیم کن
      const currentCount = await collection.findOne({ _id: new ObjectId(params.id) })
      if (!currentCount.startedDate) {
        updateData.startedDate = new Date().toISOString()
      }
    }

    const result = await collection.updateOne(
      { _id: new ObjectId(params.id) },
      { $set: updateData }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'شمارش یافت نشد' },
        { status: 404 }
      )
    }

    const updatedCount = await collection.findOne({ _id: new ObjectId(params.id) })

    return NextResponse.json({
      success: true,
      data: { ...updatedCount, _id: updatedCount._id.toString(), id: updatedCount._id.toString() },
      message: `وضعیت شمارش به ${status} تغییر یافت`
    })
  } catch (error) {
    console.error('Error updating count status:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در تغییر وضعیت شمارش' },
      { status: 500 }
    )
  }
}


