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
    const collection = db.collection('desserts')

    const body = await request.json()
    const id = params.id

    if (!id) {
      return NextResponse.json({
        success: false,
        message: 'شناسه دسر اجباری است'
      }, { status: 400 })
    }

    // Remove _id, rating and popularity from body if they exist
    delete body._id
    delete body.id
    delete body.rating
    delete body.popularity

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
        message: 'دسر یافت نشد'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'دسر با موفقیت به‌روزرسانی شد'
    })
  } catch (error) {
    console.error('Error updating dessert:', error)
    return NextResponse.json({
      success: false,
      message: 'خطا در به‌روزرسانی دسر'
    }, { status: 500 })
  }
}

