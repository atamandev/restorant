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
    const collection = db.collection('pending_orders')

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const orderType = searchParams.get('orderType')
    const priority = searchParams.get('priority')
    const customerName = searchParams.get('customerName')
    const orderNumber = searchParams.get('orderNumber')
    const sortBy = searchParams.get('sortBy') || 'orderTime'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    let query: any = {}

    if (status && status !== 'all') {
      query.status = status
    }
    if (orderType && orderType !== 'all') {
      query.orderType = orderType
    }
    if (priority && priority !== 'all') {
      query.priority = priority
    }
    if (customerName) {
      query.customerName = { $regex: customerName, $options: 'i' }
    }
    if (orderNumber) {
      query.orderNumber = { $regex: orderNumber, $options: 'i' }
    }

    let sortOptions: any = {}
    switch (sortBy) {
      case 'orderTime':
        sortOptions.orderTime = sortOrder === 'desc' ? -1 : 1
        break
      case 'estimatedTime':
        sortOptions.estimatedTime = sortOrder === 'desc' ? -1 : 1
        break
      case 'total':
        sortOptions.total = sortOrder === 'desc' ? -1 : 1
        break
      case 'customerName':
        sortOptions.customerName = sortOrder === 'desc' ? -1 : 1
        break
      case 'priority':
        sortOptions.priority = sortOrder === 'desc' ? -1 : 1
        break
      default:
        sortOptions.orderTime = -1
    }

    const orders = await collection.find(query).sort(sortOptions).toArray()

    return NextResponse.json({
      success: true,
      data: orders
    })
  } catch (error) {
    console.error('Error fetching pending orders:', error)
    return NextResponse.json({
      success: false,
      message: 'خطا در دریافت سفارشات در انتظار'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const client = await clientPromise
    const db = client.db('restoren')
    const collection = db.collection('pending_orders')

    const body = await request.json()
    
    const order = {
      ...body,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await collection.insertOne(order)

    return NextResponse.json({
      success: true,
      data: {
        _id: result.insertedId,
        ...order
      }
    })
  } catch (error) {
    console.error('Error creating pending order:', error)
    return NextResponse.json({
      success: false,
      message: 'خطا در ثبت سفارش در انتظار'
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const client = await clientPromise
    const db = client.db('restoren')
    const collection = db.collection('pending_orders')

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({
        success: false,
        message: 'شناسه سفارش اجباری است'
      }, { status: 400 })
    }

    const result = await collection.deleteOne({ _id: new ObjectId(id) })

    if (result.deletedCount === 0) {
      return NextResponse.json({
        success: false,
        message: 'سفارش یافت نشد'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'سفارش با موفقیت حذف شد'
    })
  } catch (error) {
    console.error('Error deleting pending order:', error)
    return NextResponse.json({
      success: false,
      message: 'خطا در حذف سفارش'
    }, { status: 500 })
  }
}

