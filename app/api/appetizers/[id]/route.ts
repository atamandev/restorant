import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://restorenUser:1234@localhost:27017/restoren'

let client: MongoClient | undefined
let clientPromise: Promise<MongoClient> | undefined

if (!clientPromise) {
  client = new MongoClient(MONGO_URI)
  clientPromise = client.connect()
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!clientPromise) {
      client = new MongoClient(MONGO_URI)
      clientPromise = client.connect()
    }
    const dbClient = await clientPromise
    const db = dbClient.db('restoren')
    const collection = db.collection('appetizers')

    const body = await request.json()
    const id = params.id

    if (!id) {
      return NextResponse.json({
        success: false,
        message: 'شناسه پیش‌غذا اجباری است'
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
          category: 'پیش‌غذاها',
          updatedAt: new Date()
        }
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({
        success: false,
        message: 'پیش‌غذا یافت نشد'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'پیش‌غذا با موفقیت به‌روزرسانی شد'
    })
  } catch (error) {
    console.error('Error updating appetizer:', error)
    return NextResponse.json({
      success: false,
      message: 'خطا در به‌روزرسانی پیش‌غذا'
    }, { status: 500 })
  }
}

