import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://admin:StrongPassword123@185.204.169.107:27017/restaurant?authSource=admin'

// GET /api/daily-orders - دریافت لیست سفارشات روزانه
export async function GET(request: NextRequest) {
  let client: MongoClient | null = null
  
  try {
    client = new MongoClient(MONGO_URI)
    await client.connect()
    const db = client.db('restaurant')
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const date = searchParams.get('date')
    const status = searchParams.get('status')
    const paymentMethod = searchParams.get('paymentMethod')
    const customerName = searchParams.get('customerName')
    
    const skip = (page - 1) * limit
    
    // Build query
    const query: any = {}
    if (date) {
      const startOfDay = new Date(date)
      const endOfDay = new Date(date)
      endOfDay.setHours(23, 59, 59, 999)
      query.createdAt = {
        $gte: startOfDay,
        $lte: endOfDay
      }
    }
    if (status) {
      query.status = status
    }
    if (paymentMethod) {
      query.paymentMethod = paymentMethod
    }
    if (customerName) {
      query.customerName = { $regex: customerName, $options: 'i' }
    }
    
    const orders = await db.collection('daily_orders')
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray()
    
    const total = await db.collection('daily_orders').countDocuments(query)
    
    return NextResponse.json({
      success: true,
      data: orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      message: 'لیست سفارشات روزانه با موفقیت دریافت شد'
    })
  } catch (error) {
    console.error('Error fetching daily orders:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در دریافت لیست سفارشات روزانه',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  } finally {
    if (client) {
      await client.close()
    }
  }
}

// POST /api/daily-orders - ایجاد سفارش روزانه جدید
export async function POST(request: NextRequest) {
  let client: MongoClient | null = null
  
  try {
    const body = await request.json()
    console.log('Received daily order body:', body)
    
    const { 
      orderNumber,
      customerName,
      items,
      total,
      paymentMethod,
      status,
      notes,
      branchId,
      tableNumber
    } = body

    // Validate required fields
    if (!orderNumber || !customerName || !items || total === undefined) {
      return NextResponse.json(
        { success: false, message: 'شماره سفارش، نام مشتری، آیتم‌ها و مبلغ اجباری است' },
        { status: 400 }
      )
    }

    client = new MongoClient(MONGO_URI)
    await client.connect()
    const db = client.db('restaurant')
    
    const orderData = {
      orderNumber: String(orderNumber),
      customerName: String(customerName),
      items: Array.isArray(items) ? items.map((item: any) => ({
        name: String(item.name),
        quantity: Number(item.quantity),
        price: Number(item.price),
        total: Number(item.total)
      })) : [],
      total: Number(total),
      paymentMethod: String(paymentMethod || 'cash'),
      status: String(status || 'pending'),
      notes: notes ? String(notes) : null,
      branchId: branchId ? String(branchId) : null,
      tableNumber: tableNumber ? String(tableNumber) : null,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    console.log('Creating daily order with data:', orderData)

    const result = await db.collection('daily_orders').insertOne(orderData)
    
    const order = await db.collection('daily_orders').findOne({ _id: result.insertedId })

    console.log('Daily order created successfully:', order)

    return NextResponse.json({
      success: true,
      data: order,
      message: 'سفارش روزانه با موفقیت ثبت شد'
    })
  } catch (error) {
    console.error('Error creating daily order:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در ثبت سفارش روزانه',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  } finally {
    if (client) {
      await client.close()
    }
  }
}

// PUT /api/daily-orders - به‌روزرسانی سفارش روزانه
export async function PUT(request: NextRequest) {
  let client: MongoClient | null = null
  
  try {
    const body = await request.json()
    console.log('Received update body:', body)
    
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'شناسه سفارش روزانه اجباری است' },
        { status: 400 }
      )
    }

    client = new MongoClient(MONGO_URI)
    await client.connect()
    const db = client.db('restaurant')
    
    const updateFields: any = {
      ...updateData,
      updatedAt: new Date()
    }

    // Convert fields
    if (updateFields.orderNumber !== undefined) {
      updateFields.orderNumber = String(updateFields.orderNumber)
    }
    if (updateFields.customerName !== undefined) {
      updateFields.customerName = String(updateFields.customerName)
    }
    if (updateFields.items !== undefined) {
      updateFields.items = Array.isArray(updateFields.items) ? updateFields.items.map((item: any) => ({
        name: String(item.name),
        quantity: Number(item.quantity),
        price: Number(item.price),
        total: Number(item.total)
      })) : []
    }
    if (updateFields.total !== undefined) {
      updateFields.total = Number(updateFields.total)
    }
    if (updateFields.paymentMethod !== undefined) {
      updateFields.paymentMethod = String(updateFields.paymentMethod)
    }
    if (updateFields.status !== undefined) {
      updateFields.status = String(updateFields.status)
    }
    if (updateFields.notes !== undefined) {
      updateFields.notes = updateFields.notes ? String(updateFields.notes) : null
    }
    if (updateFields.branchId !== undefined) {
      updateFields.branchId = updateFields.branchId ? String(updateFields.branchId) : null
    }
    if (updateFields.tableNumber !== undefined) {
      updateFields.tableNumber = updateFields.tableNumber ? String(updateFields.tableNumber) : null
    }

    console.log('Updating daily order with data:', updateFields)

    const result = await db.collection('daily_orders').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    )

    console.log('Update result:', result)

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'سفارش روزانه مورد نظر یافت نشد' },
        { status: 404 }
      )
    }

    const updatedOrder = await db.collection('daily_orders').findOne({ _id: new ObjectId(id) })

    console.log('Updated daily order:', updatedOrder)

    return NextResponse.json({
      success: true,
      data: updatedOrder,
      message: 'سفارش روزانه با موفقیت به‌روزرسانی شد'
    })
  } catch (error) {
    console.error('Error updating daily order:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در به‌روزرسانی سفارش روزانه',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  } finally {
    if (client) {
      await client.close()
    }
  }
}

// DELETE /api/daily-orders - حذف سفارش روزانه
export async function DELETE(request: NextRequest) {
  let client: MongoClient | null = null
  
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'شناسه سفارش روزانه اجباری است' },
        { status: 400 }
      )
    }

    client = new MongoClient(MONGO_URI)
    await client.connect()
    const db = client.db('restaurant')
    
    const result = await db.collection('daily_orders').deleteOne({ _id: new ObjectId(id) })

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'سفارش روزانه مورد نظر یافت نشد' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'سفارش روزانه با موفقیت حذف شد'
    })
  } catch (error) {
    console.error('Error deleting daily order:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در حذف سفارش روزانه',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  } finally {
    if (client) {
      await client.close()
    }
  }
}
