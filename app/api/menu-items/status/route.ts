import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://admin:StrongPassword123@185.204.169.107:27017/restaurant?authSource=admin'

let client: MongoClient
let clientPromise: Promise<MongoClient>

if (!client) {
  client = new MongoClient(MONGO_URI)
  clientPromise = client.connect()
}

export async function PATCH(request: NextRequest) {
  try {
    const client = await clientPromise
    const db = client.db('restaurant')
    const collection = db.collection('menu_items')

    const body = await request.json()
    const { id, field, value } = body

    if (!id) {
      return NextResponse.json({
        success: false,
        message: 'شناسه آیتم اجباری است'
      }, { status: 400 })
    }

    if (!field) {
      return NextResponse.json({
        success: false,
        message: 'فیلد اجباری است'
      }, { status: 400 })
    }

    const validFields = ['isAvailable', 'isPopular', 'price', 'preparationTime', 'name', 'description', 'category']
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
        message: 'آیتم یافت نشد'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'وضعیت آیتم با موفقیت به‌روزرسانی شد'
    })
  } catch (error) {
    console.error('Error updating menu item status:', error)
    return NextResponse.json({
      success: false,
      message: 'خطا در به‌روزرسانی وضعیت آیتم'
    }, { status: 500 })
  }
}
