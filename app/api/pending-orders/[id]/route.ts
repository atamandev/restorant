import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://admin:StrongPassword123@185.204.169.107:27017/restaurant?authSource=admin'

let client: MongoClient
let clientPromise: Promise<MongoClient>

if (!client) {
  client = new MongoClient(MONGO_URI)
  clientPromise = client.connect()
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const client = await clientPromise
    const db = client.db('restaurant')
    const collection = db.collection('pending_orders')

    const body = await request.json()
    const id = params.id

    if (!id) {
      return NextResponse.json({
        success: false,
        message: 'شناسه سفارش اجباری است'
      }, { status: 400 })
    }

    // Remove _id from body if it exists
    delete body._id
    delete body.id

    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: {
          ...body,
          updatedAt: new Date()
        }
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({
        success: false,
        message: 'سفارش یافت نشد'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'سفارش با موفقیت به‌روزرسانی شد'
    })
  } catch (error) {
    console.error('Error updating pending order:', error)
    return NextResponse.json({
      success: false,
      message: 'خطا در به‌روزرسانی سفارش'
    }, { status: 500 })
  }
}

