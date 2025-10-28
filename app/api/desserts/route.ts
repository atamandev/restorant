import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://restorenUser:1234@localhost:27017/restoren'

let client: MongoClient
let clientPromise: Promise<MongoClient>

if (!client) {
  client = new MongoClient(MONGO_URI)
  clientPromise = client.connect()
}

export async function GET(request: NextRequest) {
  try {
    const client = await clientPromise
    const db = client.db('restoren')
    const collection = db.collection('desserts')

    const { searchParams } = new URL(request.url)
    const isAvailable = searchParams.get('isAvailable')
    const category = searchParams.get('category')
    const name = searchParams.get('name')
    const sweetness = searchParams.get('sweetness')
    const sortBy = searchParams.get('sortBy') || 'name'
    const sortOrder = searchParams.get('sortOrder') || 'asc'

    let query: any = {}

    if (isAvailable !== null && isAvailable !== undefined) {
      query.isAvailable = isAvailable === 'true'
    }
    if (category && category !== 'all') {
      query.category = category
    }
    if (name) {
      query.name = { $regex: name, $options: 'i' }
    }
    if (sweetness) {
      query.sweetness = sweetness
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
        sortOptions.popularity = sortOrder === 'desc' ? -1 : 1
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
    console.error('Error fetching desserts:', error)
    return NextResponse.json({
      success: false,
      message: 'خطا در دریافت دسرها'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const client = await clientPromise
    const db = client.db('restoren')
    const collection = db.collection('desserts')

    const body = await request.json()
    
    const dessert = {
      ...body,
      rating: body.rating || 4.5,
      popularity: body.popularity || 70,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await collection.insertOne(dessert)

    return NextResponse.json({
      success: true,
      data: {
        _id: result.insertedId,
        ...dessert
      }
    })
  } catch (error) {
    console.error('Error creating dessert:', error)
    return NextResponse.json({
      success: false,
      message: 'خطا در ثبت دسر'
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const client = await clientPromise
    const db = client.db('restoren')
    const collection = db.collection('desserts')

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({
        success: false,
        message: 'شناسه دسر اجباری است'
      }, { status: 400 })
    }

    const result = await collection.deleteOne({ _id: new ObjectId(id) })

    if (result.deletedCount === 0) {
      return NextResponse.json({
        success: false,
        message: 'دسر یافت نشد'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'دسر با موفقیت حذف شد'
    })
  } catch (error) {
    console.error('Error deleting dessert:', error)
    return NextResponse.json({
      success: false,
      message: 'خطا در حذف دسر'
    }, { status: 500 })
  }
}
