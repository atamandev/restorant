import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://restorenUser:1234@localhost:27017/restoren'
const DB_NAME = 'restoren'
const COLLECTION_NAME = 'orders'

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

// PATCH - تغییر وضعیت سفارش
export async function PATCH(request: NextRequest) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const body = await request.json()
    const { id, field, value } = body

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'شناسه سفارش اجباری است' },
        { status: 400 }
      )
    }

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: 'شناسه سفارش نامعتبر است' },
        { status: 400 }
      )
    }

    const updateData: any = {
      updatedAt: new Date()
    }
    updateData[field] = value

    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'سفارش یافت نشد' },
        { status: 404 }
      )
    }

    const updatedOrder = await collection.findOne({ _id: new ObjectId(id) })

    return NextResponse.json({
      success: true,
      data: updatedOrder,
      message: 'وضعیت سفارش با موفقیت تغییر کرد'
    })
  } catch (error) {
    console.error('Error updating order status:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در تغییر وضعیت سفارش' },
      { status: 500 }
    )
  }
}

