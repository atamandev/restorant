import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://restorenUser:1234@localhost:27017/restoren'

let client: MongoClient | undefined
let clientPromise: Promise<MongoClient> | undefined

if (!clientPromise) {
  client = new MongoClient(MONGO_URI)
  clientPromise = client.connect()
}

// GET - دریافت پیش‌غذاها (wrapper برای menu-items)
export async function GET(request: NextRequest) {
  try {
    if (!clientPromise) {
      client = new MongoClient(MONGO_URI)
      clientPromise = client.connect()
    }
    const dbClient = await clientPromise
    const db = dbClient.db('restoren')
    // استفاده از collection مرکزی menu_items
    const collection = db.collection('menu_items')

    const { searchParams } = new URL(request.url)
    const isAvailable = searchParams.get('isAvailable')
    const isPopular = searchParams.get('isPopular')
    const isVegetarian = searchParams.get('isVegetarian')
    const isSpicy = searchParams.get('isSpicy')
    const name = searchParams.get('name')
    const sortBy = searchParams.get('sortBy') || 'name'
    const sortOrder = searchParams.get('sortOrder') || 'asc'

    let query: any = {
      category: 'پیش‌غذاها' // یا 'appetizer' بسته به category در منو
    }

    if (isAvailable !== null && isAvailable !== undefined) {
      query.isAvailable = isAvailable === 'true'
    }
    if (isPopular !== null && isPopular !== undefined) {
      query.isPopular = isPopular === 'true'
    }
    if (isVegetarian !== null && isVegetarian !== undefined) {
      query.isVegetarian = isVegetarian === 'true'
    }
    if (isSpicy !== null && isSpicy !== undefined) {
      query.isSpicy = isSpicy === 'true'
    }
    if (name) {
      query.name = { $regex: name, $options: 'i' }
    }

    let sortOptions: any = {}
    switch (sortBy) {
      case 'name':
        sortOptions.name = sortOrder === 'desc' ? -1 : 1
        break
      case 'price':
        sortOptions.price = sortOrder === 'desc' ? -1 : 1
        break
      case 'sales':
        sortOptions.salesCount = sortOrder === 'desc' ? -1 : 1
        break
      case 'rating':
        sortOptions.rating = sortOrder === 'desc' ? -1 : 1
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
    console.error('Error fetching appetizers:', error)
    return NextResponse.json({
      success: false,
      message: 'خطا در دریافت پیش‌غذاها'
    }, { status: 500 })
  }
}

// POST - ایجاد پیش‌غذا (redirect به menu-items)
export async function POST(request: NextRequest) {
  try {
    if (!clientPromise) {
      client = new MongoClient(MONGO_URI)
      clientPromise = client.connect()
    }
    const dbClient = await clientPromise
    const db = dbClient.db('restoren')
    const collection = db.collection('menu_items')

    const body = await request.json()
    
    // ایجاد در menu_items با category 'پیش‌غذاها'
    const menuItem = {
      ...body,
      category: 'پیش‌غذاها', // یا 'appetizer' بسته به استاندارد شما
      salesCount: body.salesCount || 0,
      rating: body.rating || 0,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await collection.insertOne(menuItem)

    return NextResponse.json({
      success: true,
      data: {
        _id: result.insertedId,
        ...menuItem
      },
      message: 'پیش‌غذا با موفقیت ایجاد شد'
    })
  } catch (error) {
    console.error('Error creating appetizer:', error)
    return NextResponse.json({
      success: false,
      message: 'خطا در ثبت پیش‌غذا'
    }, { status: 500 })
  }
}
