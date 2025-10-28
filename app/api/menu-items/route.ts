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
    const collection = db.collection('menu_items')

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const isAvailable = searchParams.get('isAvailable')
    const isPopular = searchParams.get('isPopular')
    const name = searchParams.get('name')
    const sortBy = searchParams.get('sortBy') || 'name'
    const sortOrder = searchParams.get('sortOrder') || 'asc'

    let query: any = {}

    if (category && category !== 'all') {
      query.category = category
    }
    if (isAvailable !== null && isAvailable !== undefined) {
      query.isAvailable = isAvailable === 'true'
    }
    if (isPopular !== null && isPopular !== undefined) {
      query.isPopular = isPopular === 'true'
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
      case 'preparationTime':
        sortOptions.preparationTime = sortOrder === 'desc' ? -1 : 1
        break
      case 'salesCount':
        sortOptions.salesCount = sortOrder === 'desc' ? -1 : 1
        break
      case 'rating':
        sortOptions.rating = sortOrder === 'desc' ? -1 : 1
        break
      case 'createdAt':
        sortOptions.createdAt = sortOrder === 'desc' ? -1 : 1
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
    console.error('Error fetching menu items:', error)
    return NextResponse.json({
      success: false,
      message: 'خطا در دریافت آیتم‌های منو'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const client = await clientPromise
    const db = client.db('restoren')
    const collection = db.collection('menu_items')

    const body = await request.json()
    
    const menuItem = {
      ...body,
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
      }
    })
  } catch (error) {
    console.error('Error creating menu item:', error)
    return NextResponse.json({
      success: false,
      message: 'خطا در ثبت آیتم منو'
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const client = await clientPromise
    const db = client.db('restoren')
    const collection = db.collection('menu_items')

    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({
        success: false,
        message: 'شناسه آیتم اجباری است'
      }, { status: 400 })
    }

    // Remove salesCount and rating from updateData if they exist
    delete updateData.salesCount
    delete updateData.rating

    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: {
          ...updateData,
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

export async function DELETE(request: NextRequest) {
  try {
    const client = await clientPromise
    const db = client.db('restoren')
    const collection = db.collection('menu_items')

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({
        success: false,
        message: 'شناسه آیتم اجباری است'
      }, { status: 400 })
    }

    const result = await collection.deleteOne({ _id: new ObjectId(id) })

    if (result.deletedCount === 0) {
      return NextResponse.json({
        success: false,
        message: 'آیتم یافت نشد'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'آیتم با موفقیت حذف شد'
    })
  } catch (error) {
    console.error('Error deleting menu item:', error)
    return NextResponse.json({
      success: false,
      message: 'خطا در حذف آیتم'
    }, { status: 500 })
  }
}