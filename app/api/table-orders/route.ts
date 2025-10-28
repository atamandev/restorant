import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://restorenUser:1234@localhost:27017/restoren'

// GET /api/table-orders - دریافت لیست سفارشات میز
export async function GET(request: NextRequest) {
  let client: MongoClient | null = null
  
  try {
    client = new MongoClient(MONGO_URI)
    await client.connect()
    const db = client.db('restoren')
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const tableNumber = searchParams.get('tableNumber')
    const status = searchParams.get('status')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    
    const skip = (page - 1) * limit
    
    // Build query
    const query: any = {}
    if (search) {
      query.$or = [
        { customerName: { $regex: search, $options: 'i' } },
        { customerPhone: { $regex: search, $options: 'i' } },
        { tableNumber: { $regex: search, $options: 'i' } }
      ]
    }
    if (tableNumber) {
      query.tableNumber = tableNumber
    }
    if (status) {
      query.status = status
    }
    if (dateFrom || dateTo) {
      query.createdAt = {}
      if (dateFrom) {
        query.createdAt.$gte = new Date(dateFrom)
      }
      if (dateTo) {
        query.createdAt.$lte = new Date(dateTo)
      }
    }
    
    const orders = await db.collection('table_orders')
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray()
    
    const total = await db.collection('table_orders').countDocuments(query)
    
    return NextResponse.json({
      success: true,
      data: orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      message: 'لیست سفارشات میز با موفقیت دریافت شد'
    })
  } catch (error) {
    console.error('Error fetching table orders:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در دریافت لیست سفارشات میز',
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

// POST /api/table-orders - ایجاد سفارش میز جدید
export async function POST(request: NextRequest) {
  let client: MongoClient | null = null
  
  try {
    const body = await request.json()
    console.log('Received table order body:', body)
    
    const { 
      tableNumber,
      customerName,
      customerPhone,
      items,
      subtotal,
      tax,
      serviceCharge,
      discount,
      total,
      orderTime,
      status,
      notes,
      paymentMethod
    } = body

    // Validate required fields
    if (!tableNumber || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, message: 'شماره میز و لیست آیتم‌ها اجباری است' },
        { status: 400 }
      )
    }

    client = new MongoClient(MONGO_URI)
    await client.connect()
    const db = client.db('restoren')
    
    const tableOrderData = {
      tableNumber: String(tableNumber),
      customerName: customerName ? String(customerName) : null,
      customerPhone: customerPhone ? String(customerPhone) : null,
      items: items.map((item: any) => ({
        id: String(item.id),
        name: String(item.name),
        price: Number(item.price),
        category: String(item.category),
        image: String(item.image || ''),
        preparationTime: Number(item.preparationTime || 0),
        quantity: Number(item.quantity),
        notes: item.notes ? String(item.notes) : null
      })),
      subtotal: Number(subtotal || 0),
      tax: Number(tax || 0),
      serviceCharge: Number(serviceCharge || 0),
      discount: Number(discount || 0),
      total: Number(total || 0),
      orderTime: orderTime ? String(orderTime) : new Date().toLocaleTimeString('fa-IR'),
      status: String(status || 'pending'),
      notes: notes ? String(notes) : null,
      paymentMethod: String(paymentMethod || 'cash'),
      createdAt: new Date(),
      updatedAt: new Date()
    }

    console.log('Creating table order with data:', tableOrderData)

    const result = await db.collection('table_orders').insertOne(tableOrderData)
    
    const tableOrder = await db.collection('table_orders').findOne({ _id: result.insertedId })

    console.log('Table order created successfully:', tableOrder)

    return NextResponse.json({
      success: true,
      data: tableOrder,
      message: 'سفارش میز با موفقیت ثبت شد'
    })
  } catch (error) {
    console.error('Error creating table order:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در ثبت سفارش میز',
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

// PUT /api/table-orders - به‌روزرسانی سفارش میز
export async function PUT(request: NextRequest) {
  let client: MongoClient | null = null
  
  try {
    const body = await request.json()
    console.log('Received update body:', body)
    
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'شناسه سفارش میز اجباری است' },
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
    if (updateFields.tableNumber !== undefined) {
      updateFields.tableNumber = String(updateFields.tableNumber)
    }
    if (updateFields.customerName !== undefined) {
      updateFields.customerName = updateFields.customerName ? String(updateFields.customerName) : null
    }
    if (updateFields.customerPhone !== undefined) {
      updateFields.customerPhone = updateFields.customerPhone ? String(updateFields.customerPhone) : null
    }
    if (updateFields.items !== undefined) {
      updateFields.items = updateFields.items.map((item: any) => ({
        id: String(item.id),
        name: String(item.name),
        price: Number(item.price),
        category: String(item.category),
        image: String(item.image || ''),
        preparationTime: Number(item.preparationTime || 0),
        quantity: Number(item.quantity),
        notes: item.notes ? String(item.notes) : null
      }))
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
    if (updateFields.orderTime !== undefined) {
      updateFields.orderTime = String(updateFields.orderTime)
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

    console.log('Updating table order with data:', updateFields)

    const result = await db.collection('table_orders').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    )

    console.log('Update result:', result)

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'سفارش میز مورد نظر یافت نشد' },
        { status: 404 }
      )
    }

    const updatedTableOrder = await db.collection('table_orders').findOne({ _id: new ObjectId(id) })

    console.log('Updated table order:', updatedTableOrder)

    return NextResponse.json({
      success: true,
      data: updatedTableOrder,
      message: 'سفارش میز با موفقیت به‌روزرسانی شد'
    })
  } catch (error) {
    console.error('Error updating table order:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در به‌روزرسانی سفارش میز',
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

// DELETE /api/table-orders - حذف سفارش میز
export async function DELETE(request: NextRequest) {
  let client: MongoClient | null = null
  
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'شناسه سفارش میز اجباری است' },
        { status: 400 }
      )
    }

    client = new MongoClient(MONGO_URI)
    await client.connect()
    const db = client.db('restoren')
    
    const result = await db.collection('table_orders').deleteOne({ _id: new ObjectId(id) })

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'سفارش میز مورد نظر یافت نشد' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'سفارش میز با موفقیت حذف شد'
    })
  } catch (error) {
    console.error('Error deleting table order:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در حذف سفارش میز',
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
