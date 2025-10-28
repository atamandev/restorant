import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://restorenUser:1234@localhost:27017/restoren'

// GET /api/dine-in-orders - دریافت لیست سفارشات حضوری
export async function GET(request: NextRequest) {
  let client: MongoClient | null = null
  
  try {
    client = new MongoClient(MONGO_URI)
    await client.connect()
    const db = client.db('restoren')
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const status = searchParams.get('status')
    const tableNumber = searchParams.get('tableNumber')
    const date = searchParams.get('date')
    
    const skip = (page - 1) * limit
    
    // Build query
    const query: any = {}
    if (status) {
      query.status = status
    }
    if (tableNumber) {
      query.tableNumber = tableNumber
    }
    if (date) {
      const startOfDay = new Date(date)
      const endOfDay = new Date(date)
      endOfDay.setHours(23, 59, 59, 999)
      query.createdAt = {
        $gte: startOfDay,
        $lte: endOfDay
      }
    }
    
    const orders = await db.collection('dine_in_orders')
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray()
    
    const total = await db.collection('dine_in_orders').countDocuments(query)
    
    return NextResponse.json({
      success: true,
      data: orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      message: 'لیست سفارشات حضوری با موفقیت دریافت شد'
    })
  } catch (error) {
    console.error('Error fetching dine-in orders:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در دریافت لیست سفارشات حضوری',
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

// POST /api/dine-in-orders - ایجاد سفارش حضوری جدید
export async function POST(request: NextRequest) {
  let client: MongoClient | null = null
  
  try {
    const body = await request.json()
    console.log('Received dine-in order body:', body)
    
    const { 
      orderNumber,
      tableNumber,
      customerName,
      customerPhone,
      items,
      subtotal,
      tax,
      serviceCharge,
      discount,
      total,
      estimatedReadyTime,
      status,
      notes,
      paymentMethod,
      priority
    } = body

    // Validate required fields
    if (!orderNumber || !tableNumber || !customerName || !items || total === undefined) {
      return NextResponse.json(
        { success: false, message: 'شماره سفارش، شماره میز، نام مشتری، آیتم‌ها و مبلغ اجباری است' },
        { status: 400 }
      )
    }

    client = new MongoClient(MONGO_URI)
    await client.connect()
    const db = client.db('restoren')
    
    const orderData = {
      orderNumber: String(orderNumber),
      tableNumber: String(tableNumber),
      customerName: String(customerName),
      customerPhone: customerPhone ? String(customerPhone) : null,
      items: Array.isArray(items) ? items.map((item: any) => ({
        id: String(item.id),
        name: String(item.name),
        price: Number(item.price),
        category: String(item.category),
        image: String(item.image || ''),
        preparationTime: Number(item.preparationTime || 0),
        description: String(item.description || ''),
        quantity: Number(item.quantity),
        notes: item.notes ? String(item.notes) : null
      })) : [],
      subtotal: Number(subtotal),
      tax: Number(tax || 0),
      serviceCharge: Number(serviceCharge || 0),
      discount: Number(discount || 0),
      total: Number(total),
      estimatedReadyTime: estimatedReadyTime ? String(estimatedReadyTime) : null,
      status: String(status || 'pending'),
      notes: notes ? String(notes) : null,
      paymentMethod: String(paymentMethod || 'cash'),
      priority: String(priority || 'normal'),
      createdAt: new Date(),
      updatedAt: new Date()
    }

    console.log('Creating dine-in order with data:', orderData)

    const result = await db.collection('dine_in_orders').insertOne(orderData)
    
    const order = await db.collection('dine_in_orders').findOne({ _id: result.insertedId })

    console.log('Dine-in order created successfully:', order)

    return NextResponse.json({
      success: true,
      data: order,
      message: 'سفارش حضوری با موفقیت ثبت شد'
    })
  } catch (error) {
    console.error('Error creating dine-in order:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در ثبت سفارش حضوری',
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

// PUT /api/dine-in-orders - به‌روزرسانی سفارش حضوری
export async function PUT(request: NextRequest) {
  let client: MongoClient | null = null
  
  try {
    const body = await request.json()
    console.log('Received update body:', body)
    
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'شناسه سفارش حضوری اجباری است' },
        { status: 400 }
      )
    }

    client = new MongoClient(MONGO_URI)
    await client.connect()
    const db = client.db('restoren')
    
    const updateFields: any = {
      ...updateData,
      updatedAt: new Date()
    }

    // Convert fields
    if (updateFields.orderNumber !== undefined) {
      updateFields.orderNumber = String(updateFields.orderNumber)
    }
    if (updateFields.tableNumber !== undefined) {
      updateFields.tableNumber = String(updateFields.tableNumber)
    }
    if (updateFields.customerName !== undefined) {
      updateFields.customerName = String(updateFields.customerName)
    }
    if (updateFields.customerPhone !== undefined) {
      updateFields.customerPhone = updateFields.customerPhone ? String(updateFields.customerPhone) : null
    }
    if (updateFields.items !== undefined) {
      updateFields.items = Array.isArray(updateFields.items) ? updateFields.items.map((item: any) => ({
        id: String(item.id),
        name: String(item.name),
        price: Number(item.price),
        category: String(item.category),
        image: String(item.image || ''),
        preparationTime: Number(item.preparationTime || 0),
        description: String(item.description || ''),
        quantity: Number(item.quantity),
        notes: item.notes ? String(item.notes) : null
      })) : []
    }
    if (updateFields.subtotal !== undefined) {
      updateFields.subtotal = Number(updateFields.subtotal)
    }
    if (updateFields.tax !== undefined) {
      updateFields.tax = Number(updateFields.tax)
    }
    if (updateFields.serviceCharge !== undefined) {
      updateFields.serviceCharge = Number(updateFields.serviceCharge)
    }
    if (updateFields.discount !== undefined) {
      updateFields.discount = Number(updateFields.discount)
    }
    if (updateFields.total !== undefined) {
      updateFields.total = Number(updateFields.total)
    }
    if (updateFields.estimatedReadyTime !== undefined) {
      updateFields.estimatedReadyTime = updateFields.estimatedReadyTime ? String(updateFields.estimatedReadyTime) : null
    }
    if (updateFields.status !== undefined) {
      updateFields.status = String(updateFields.status)
    }
    if (updateFields.notes !== undefined) {
      updateFields.notes = updateFields.notes ? String(updateFields.notes) : null
    }
    if (updateFields.paymentMethod !== undefined) {
      updateFields.paymentMethod = String(updateFields.paymentMethod)
    }
    if (updateFields.priority !== undefined) {
      updateFields.priority = String(updateFields.priority)
    }

    console.log('Updating dine-in order with data:', updateFields)

    const result = await db.collection('dine_in_orders').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    )

    console.log('Update result:', result)

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'سفارش حضوری مورد نظر یافت نشد' },
        { status: 404 }
      )
    }

    const updatedOrder = await db.collection('dine_in_orders').findOne({ _id: new ObjectId(id) })

    console.log('Updated dine-in order:', updatedOrder)

    return NextResponse.json({
      success: true,
      data: updatedOrder,
      message: 'سفارش حضوری با موفقیت به‌روزرسانی شد'
    })
  } catch (error) {
    console.error('Error updating dine-in order:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در به‌روزرسانی سفارش حضوری',
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

// DELETE /api/dine-in-orders - حذف سفارش حضوری
export async function DELETE(request: NextRequest) {
  let client: MongoClient | null = null
  
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'شناسه سفارش حضوری اجباری است' },
        { status: 400 }
      )
    }

    client = new MongoClient(MONGO_URI)
    await client.connect()
    const db = client.db('restoren')
    
    const result = await db.collection('dine_in_orders').deleteOne({ _id: new ObjectId(id) })

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'سفارش حضوری مورد نظر یافت نشد' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'سفارش حضوری با موفقیت حذف شد'
    })
  } catch (error) {
    console.error('Error deleting dine-in order:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در حذف سفارش حضوری',
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
