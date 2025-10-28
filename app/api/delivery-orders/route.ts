import { NextRequest, NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'

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
    const collection = db.collection('delivery_orders')

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const customerName = searchParams.get('customerName')
    const customerPhone = searchParams.get('customerPhone')
    const orderNumber = searchParams.get('orderNumber')

    let query: any = {}

    if (status) {
      query.status = status
    }
    if (customerName) {
      query.customerName = { $regex: customerName, $options: 'i' }
    }
    if (customerPhone) {
      query.customerPhone = { $regex: customerPhone, $options: 'i' }
    }
    if (orderNumber) {
      query.orderNumber = { $regex: orderNumber, $options: 'i' }
    }

    const orders = await collection.find(query).sort({ createdAt: -1 }).toArray()

    return NextResponse.json({
      success: true,
      data: orders
    })
  } catch (error) {
    console.error('Error fetching delivery orders:', error)
    return NextResponse.json({
      success: false,
      message: 'خطا در دریافت سفارشات ارسال'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const client = await clientPromise
    const db = client.db('restoren')
    const collection = db.collection('delivery_orders')

    const body = await request.json()
    
    // Generate order number if not provided
    if (!body.orderNumber) {
      const count = await collection.countDocuments()
      body.orderNumber = `DL-${String(count + 1).padStart(6, '0')}`
    }

    const deliveryOrder = {
      ...body,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await collection.insertOne(deliveryOrder)

    return NextResponse.json({
      success: true,
      data: {
        _id: result.insertedId,
        ...deliveryOrder
      }
    })
  } catch (error) {
    console.error('Error creating delivery order:', error)
    return NextResponse.json({
      success: false,
      message: 'خطا در ثبت سفارش ارسال'
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const client = await clientPromise
    const db = client.db('restoren')
    const collection = db.collection('delivery_orders')

    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({
        success: false,
        message: 'شناسه سفارش اجباری است'
      }, { status: 400 })
    }

    const result = await collection.updateOne(
      { _id: id },
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
        message: 'سفارش یافت نشد'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'سفارش با موفقیت به‌روزرسانی شد'
    })
  } catch (error) {
    console.error('Error updating delivery order:', error)
    return NextResponse.json({
      success: false,
      message: 'خطا در به‌روزرسانی سفارش'
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const client = await clientPromise
    const db = client.db('restoren')
    const collection = db.collection('delivery_orders')

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({
        success: false,
        message: 'شناسه سفارش اجباری است'
      }, { status: 400 })
    }

    const result = await collection.deleteOne({ _id: id })

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
    console.error('Error deleting delivery order:', error)
    return NextResponse.json({
      success: false,
      message: 'خطا در حذف سفارش'
    }, { status: 500 })
  }
}
