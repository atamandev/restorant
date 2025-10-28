import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://restorenUser:1234@localhost:27017/restoren'

let client: MongoClient
let clientPromise: Promise<MongoClient>

if (!client) {
  client = new MongoClient(MONGO_URI)
  clientPromise = client.connect()
}

export async function PATCH(request: NextRequest) {
  try {
    const client = await clientPromise
    const db = client.db('restoren')
    const collection = db.collection('pending_orders')

    const body = await request.json()
    const { id, field, value } = body

    if (!id) {
      return NextResponse.json({
        success: false,
        message: 'شناسه سفارش اجباری است'
      }, { status: 400 })
    }

    if (!field) {
      return NextResponse.json({
        success: false,
        message: 'فیلد اجباری است'
      }, { status: 400 })
    }

    const validFields = ['status', 'priority', 'notes', 'estimatedTime', 'customerName', 'customerPhone', 'customerAddress']
    if (!validFields.includes(field)) {
      return NextResponse.json({
        success: false,
        message: 'فیلد نامعتبر است'
      }, { status: 400 })
    }

    const updateData: any = {
      [field]: value,
      updatedAt: new Date()
    }

    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({
        success: false,
        message: 'سفارش یافت نشد'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'وضعیت سفارش با موفقیت به‌روزرسانی شد'
    })
  } catch (error) {
    console.error('Error updating pending order status:', error)
    return NextResponse.json({
      success: false,
      message: 'خطا در به‌روزرسانی وضعیت سفارش'
    }, { status: 500 })
  }
}
