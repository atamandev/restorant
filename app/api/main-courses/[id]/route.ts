import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://restorenUser:1234@localhost:27017/restoren'

let client: MongoClient
let clientPromise: Promise<MongoClient>

if (!client) {
  client = new MongoClient(MONGO_URI)
  clientPromise = client.connect()
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const client = await clientPromise
    const db = client.db('restoren')
    const collection = db.collection('main_courses')

    const body = await request.json()
    const id = params.id

    if (!id) {
      return NextResponse.json({
        success: false,
        message: 'شناسه غذا اجباری است'
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
        message: 'غذا یافت نشد'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'غذا با موفقیت به‌روزرسانی شد'
    })
  } catch (error) {
    console.error('Error updating main course:', error)
    return NextResponse.json({
      success: false,
      message: 'خطا در به‌روزرسانی غذا'
    }, { status: 500 })
  }
}

