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
    const collection = db.collection('menu_items')

    const body = await request.json()
    const id = params.id

    if (!id) {
      return NextResponse.json({
        success: false,
        message: 'شناسه آیتم اجباری است'
      }, { status: 400 })
    }

    // Remove _id, salesCount and rating from body if they exist
    delete body._id
    delete body.id
    delete body.salesCount
    delete body.rating

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
        message: 'آیتم یافت نشد'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'آیتم با موفقیت به‌روزرسانی شد'
    })
  } catch (error) {
    console.error('Error updating menu item:', error)
    return NextResponse.json({
      success: false,
      message: 'خطا در به‌روزرسانی آیتم'
    }, { status: 500 })
  }
}
