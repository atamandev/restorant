import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://restorenUser:1234@localhost:27017/restoren'
const client = new MongoClient(MONGO_URI)

// GET /api/orders - دریافت لیست سفارشات
export async function GET(request: NextRequest) {
  try {
    await client.connect()
    const db = client.db('restoren')
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const branchId = searchParams.get('branchId')
    const paymentStatus = searchParams.get('paymentStatus')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    
    const skip = (page - 1) * limit
    
    // Build query
    const query: any = {}
    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { tableNumber: { $regex: search, $options: 'i' } }
      ]
    }
    if (status) {
      query.status = status
    }
    if (type) {
      query.type = type
    }
    if (branchId) {
      query.branchId = branchId
    }
    if (paymentStatus) {
      query.paymentStatus = paymentStatus
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
    
    const orders = await db.collection('orders')
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray()
    
    const total = await db.collection('orders').countDocuments(query)
    
    return NextResponse.json({
      success: true,
      data: orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      message: 'لیست سفارشات با موفقیت دریافت شد'
    })
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در دریافت لیست سفارشات',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  } finally {
    await client.close()
  }
}

// POST /api/orders - ایجاد سفارش جدید
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Received body:', body)
    
    const { 
      tableNumber, 
      customerName, 
      customerId, 
      type, 
      items, 
      totalAmount, 
      discountAmount, 
      taxAmount, 
      serviceCharge, 
      finalAmount, 
      paymentMethod, 
      notes, 
      branchId, 
      createdBy 
    } = body

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, message: 'لیست آیتم‌ها اجباری است' },
        { status: 400 }
      )
    }

    if (!totalAmount || !finalAmount || !createdBy) {
      return NextResponse.json(
        { success: false, message: 'مبلغ کل، مبلغ نهایی و شناسه کاربر اجباری است' },
        { status: 400 }
      )
    }

    await client.connect()
    const db = client.db('restoren')
    
    // Generate order number
    const orderCount = await db.collection('orders').countDocuments()
    const orderNumber = `ORD-${String(orderCount + 1).padStart(6, '0')}`
    
    const orderData = {
      orderNumber,
      tableNumber: tableNumber || null,
      customerName: customerName || null,
      customerId: customerId ? new ObjectId(customerId) : null,
      type: type || 'DINE_IN',
      status: 'PENDING',
      items: items.map((item: any) => ({
        menuItemId: new ObjectId(item.menuItemId),
        name: item.name,
        quantity: parseInt(item.quantity),
        price: parseFloat(item.price),
        notes: item.notes || null
      })),
      totalAmount: parseFloat(totalAmount),
      discountAmount: discountAmount ? parseFloat(discountAmount) : 0,
      taxAmount: taxAmount ? parseFloat(taxAmount) : 0,
      serviceCharge: serviceCharge ? parseFloat(serviceCharge) : 0,
      finalAmount: parseFloat(finalAmount),
      paymentMethod: paymentMethod || null,
      paymentStatus: 'PENDING',
      notes: notes || null,
      branchId: branchId ? new ObjectId(branchId) : null,
      createdBy: new ObjectId(createdBy),
      createdAt: new Date(),
      updatedAt: new Date()
    }

    console.log('Creating order with data:', orderData)

    const result = await db.collection('orders').insertOne(orderData)
    
    const order = await db.collection('orders').findOne({ _id: result.insertedId })

    console.log('Order created successfully:', order)

    return NextResponse.json({
      success: true,
      data: order,
      message: 'سفارش با موفقیت ایجاد شد'
    })
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در ایجاد سفارش',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  } finally {
    await client.close()
  }
}

// PUT /api/orders - به‌روزرسانی سفارش
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'شناسه سفارش اجباری است' },
        { status: 400 }
      )
    }

    await client.connect()
    const db = client.db('restoren')
    
    const updateFields = {
      ...updateData,
      updatedAt: new Date()
    }

    // Convert numeric fields
    if (updateFields.totalAmount) {
      updateFields.totalAmount = parseFloat(updateFields.totalAmount)
    }
    if (updateFields.discountAmount) {
      updateFields.discountAmount = parseFloat(updateFields.discountAmount)
    }
    if (updateFields.taxAmount) {
      updateFields.taxAmount = parseFloat(updateFields.taxAmount)
    }
    if (updateFields.serviceCharge) {
      updateFields.serviceCharge = parseFloat(updateFields.serviceCharge)
    }
    if (updateFields.finalAmount) {
      updateFields.finalAmount = parseFloat(updateFields.finalAmount)
    }

    // Convert ObjectId fields
    if (updateFields.customerId) {
      updateFields.customerId = new ObjectId(updateFields.customerId)
    }
    if (updateFields.branchId) {
      updateFields.branchId = new ObjectId(updateFields.branchId)
    }
    if (updateFields.createdBy) {
      updateFields.createdBy = new ObjectId(updateFields.createdBy)
    }

    const result = await db.collection('orders').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'سفارش مورد نظر یافت نشد' },
        { status: 404 }
      )
    }

    const updatedOrder = await db.collection('orders').findOne({ _id: new ObjectId(id) })

    return NextResponse.json({
      success: true,
      data: updatedOrder,
      message: 'سفارش با موفقیت به‌روزرسانی شد'
    })
  } catch (error) {
    console.error('Error updating order:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در به‌روزرسانی سفارش',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  } finally {
    await client.close()
  }
}

// DELETE /api/orders - حذف سفارش
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'شناسه سفارش اجباری است' },
        { status: 400 }
      )
    }

    await client.connect()
    const db = client.db('restoren')
    
    const result = await db.collection('orders').deleteOne({ _id: new ObjectId(id) })

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'سفارش مورد نظر یافت نشد' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'سفارش با موفقیت حذف شد'
    })
  } catch (error) {
    console.error('Error deleting order:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در حذف سفارش',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  } finally {
    await client.close()
  }
}

