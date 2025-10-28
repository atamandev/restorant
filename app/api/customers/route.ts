import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://restorenUser:1234@localhost:27017/restoren'
const client = new MongoClient(MONGO_URI)

// GET /api/customers - دریافت لیست مشتریان
export async function GET(request: NextRequest) {
  try {
    await client.connect()
    const db = client.db('restoren')
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const isActive = searchParams.get('isActive')
    
    const skip = (page - 1) * limit
    
    // Build query
    const query: any = {}
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    }
    if (isActive !== null && isActive !== undefined) {
      query.isActive = isActive === 'true'
    }
    
    const customers = await db.collection('customers')
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray()
    
    const total = await db.collection('customers').countDocuments(query)
    
    return NextResponse.json({
      success: true,
      data: customers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      message: 'لیست مشتریان با موفقیت دریافت شد'
    })
  } catch (error) {
    console.error('Error fetching customers:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در دریافت لیست مشتریان',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  } finally {
    await client.close()
  }
}

// POST /api/customers - ایجاد مشتری جدید
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Received body:', body)
    
    const { firstName, lastName, phoneNumber, email, address, isActive } = body

    // Validate required fields
    if (!firstName || !lastName) {
      return NextResponse.json(
        { success: false, message: 'نام و نام خانوادگی اجباری است' },
        { status: 400 }
      )
    }

    await client.connect()
    const db = client.db('restoren')
    
    // Check if customer already exists
    const existingCustomer = await db.collection('customers').findOne({
      firstName,
      lastName
    })
    
    if (existingCustomer) {
      return NextResponse.json(
        { success: false, message: 'مشتری با این نام قبلاً ثبت شده است' },
        { status: 409 }
      )
    }
    
    const customerData = {
      firstName,
      lastName,
      phoneNumber: phoneNumber || null,
      email: email || null,
      address: address || null,
      isActive: isActive !== undefined ? isActive : true,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    console.log('Creating customer with data:', customerData)

    const result = await db.collection('customers').insertOne(customerData)
    
    const customer = await db.collection('customers').findOne({ _id: result.insertedId })

    console.log('Customer created successfully:', customer)

    return NextResponse.json({
      success: true,
      data: customer,
      message: 'مشتری با موفقیت ایجاد شد'
    })
  } catch (error) {
    console.error('Error creating customer:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در ایجاد مشتری',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  } finally {
    await client.close()
  }
}

// PUT /api/customers - به‌روزرسانی مشتری
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'شناسه مشتری اجباری است' },
        { status: 400 }
      )
    }

    await client.connect()
    const db = client.db('restoren')
    
    const updateFields = {
      ...updateData,
      updatedAt: new Date()
    }

    const result = await db.collection('customers').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'مشتری مورد نظر یافت نشد' },
        { status: 404 }
      )
    }

    const updatedCustomer = await db.collection('customers').findOne({ _id: new ObjectId(id) })

    return NextResponse.json({
      success: true,
      data: updatedCustomer,
      message: 'مشتری با موفقیت به‌روزرسانی شد'
    })
  } catch (error) {
    console.error('Error updating customer:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در به‌روزرسانی مشتری',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  } finally {
    await client.close()
  }
}

// DELETE /api/customers - حذف مشتری
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'شناسه مشتری اجباری است' },
        { status: 400 }
      )
    }

    await client.connect()
    const db = client.db('restoren')
    
    const result = await db.collection('customers').deleteOne({ _id: new ObjectId(id) })

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'مشتری مورد نظر یافت نشد' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'مشتری با موفقیت حذف شد'
    })
  } catch (error) {
    console.error('Error deleting customer:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در حذف مشتری',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  } finally {
    await client.close()
  }
}

