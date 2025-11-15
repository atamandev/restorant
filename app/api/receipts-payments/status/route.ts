import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://admin:StrongPassword123@185.204.169.107:27017/restaurant?authSource=admin'
const DB_NAME = 'restaurant'
const COLLECTION_NAME = 'receipts_payments'

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

// PATCH - به‌روزرسانی وضعیت تراکنش
export async function PATCH(request: NextRequest) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const body = await request.json()
    const { id, status, notes } = body
    
    if (!id || !status) {
      return NextResponse.json(
        { success: false, message: 'شناسه تراکنش و وضعیت اجباری است' },
        { status: 400 }
      )
    }

    const updateData: any = {
      status,
      updatedAt: new Date().toISOString()
    }

    if (notes) {
      updateData.notes = notes
    }

    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    )
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'تراکنش یافت نشد' },
        { status: 404 }
      )
    }

    const updatedTransaction = await collection.findOne({ _id: new ObjectId(id) })
    
    return NextResponse.json({
      success: true,
      data: updatedTransaction,
      message: 'وضعیت تراکنش با موفقیت به‌روزرسانی شد'
    })
  } catch (error) {
    console.error('Error updating transaction status:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در به‌روزرسانی وضعیت تراکنش' },
      { status: 500 }
    )
  }
}

