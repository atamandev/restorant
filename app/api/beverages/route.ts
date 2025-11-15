import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://admin:StrongPassword123@185.204.169.107:27017/restaurant?authSource=admin'

let client: MongoClient
let clientPromise: Promise<MongoClient>

if (!client) {
  client = new MongoClient(MONGO_URI)
  clientPromise = client.connect()
}

// GET - دریافت نوشیدنی‌ها (wrapper برای menu-items)
export async function GET(request: NextRequest) {
  try {
    const client = await clientPromise
    const db = client.db('restaurant')
    // استفاده از collection مرکزی menu_items
    const collection = db.collection('menu_items')

    const { searchParams } = new URL(request.url)
    const isAvailable = searchParams.get('isAvailable')
    const category = searchParams.get('category')
    const name = searchParams.get('name')
    const temperature = searchParams.get('temperature')
    const size = searchParams.get('size')
    const sortBy = searchParams.get('sortBy') || 'name'
    const sortOrder = searchParams.get('sortOrder') || 'asc'

    let query: any = {
      category: 'نوشیدنی‌ها' // فیلتر دسته‌بندی
    }

    if (isAvailable !== null && isAvailable !== undefined) {
      query.isAvailable = isAvailable === 'true'
    }
    if (category && category !== 'all') {
      query.category = category // زیردسته‌بندی
    }
    if (name) {
      query.name = { $regex: name, $options: 'i' }
    }
    if (temperature) {
      query.temperature = temperature
    }
    if (size) {
      query.size = size
    }

    let sortOptions: any = {}
    switch (sortBy) {
      case 'name':
        sortOptions.name = sortOrder === 'desc' ? -1 : 1
        break
      case 'price':
        sortOptions.price = sortOrder === 'desc' ? -1 : 1
        break
      case 'rating':
        sortOptions.rating = sortOrder === 'desc' ? -1 : 1
        break
      case 'popularity':
        sortOptions.salesCount = sortOrder === 'desc' ? -1 : 1
        break
      case 'preparation':
        sortOptions.preparationTime = sortOrder === 'desc' ? -1 : 1
        break
      default:
        sortOptions.name = 1
    }

    const items = await collection.find(query).sort(sortOptions).toArray()

    return NextResponse.json({
      success: true,
      data: items
    })
  } catch (error) {
    console.error('Error fetching beverages:', error)
    return NextResponse.json({
      success: false,
      message: 'خطا در دریافت نوشیدنی‌ها'
    }, { status: 500 })
  }
}

// POST - ایجاد نوشیدنی (redirect به menu-items)
export async function POST(request: NextRequest) {
  try {
    const client = await clientPromise
    const db = client.db('restaurant')
    const collection = db.collection('menu_items') // استفاده از collection مرکزی

    const body = await request.json()
    
    // ایجاد در menu_items با category 'نوشیدنی‌ها'
    const beverage = {
      ...body,
      category: 'نوشیدنی‌ها', // اطمینان از دسته‌بندی صحیح
      rating: body.rating || 4.5,
      salesCount: body.salesCount || 0,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await collection.insertOne(beverage)

    return NextResponse.json({
      success: true,
      data: {
        _id: result.insertedId,
        ...beverage
      },
      message: 'نوشیدنی با موفقیت ایجاد شد'
    })
  } catch (error) {
    console.error('Error creating beverage:', error)
    return NextResponse.json({
      success: false,
      message: 'خطا در ثبت نوشیدنی'
    }, { status: 500 })
  }
}

// DELETE - حذف نوشیدنی (از menu_items)
export async function DELETE(request: NextRequest) {
  try {
    const client = await clientPromise
    const db = client.db('restaurant')
    const collection = db.collection('menu_items') // استفاده از collection مرکزی

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({
        success: false,
        message: 'شناسه نوشیدنی اجباری است'
      }, { status: 400 })
    }

    const result = await collection.deleteOne({ _id: new ObjectId(id) })

    if (result.deletedCount === 0) {
      return NextResponse.json({
        success: false,
        message: 'نوشیدنی یافت نشد'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'نوشیدنی با موفقیت حذف شد'
    })
  } catch (error) {
    console.error('Error deleting beverage:', error)
    return NextResponse.json({
      success: false,
      message: 'خطا در حذف نوشیدنی'
    }, { status: 500 })
  }
}

