import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://restorenUser:1234@localhost:27017/restoren'
const DB_NAME = 'restoren'
const COLLECTION_NAME = 'customers'

let client: MongoClient
let db: any

async function connectToDatabase() {
  if (!client) {
    client = new MongoClient(MONGO_URI)
    await client.connect()
    db = client.db(DB_NAME)
  }
  return db
}

// GET - دریافت تمام مشتریان با فیلتر و مرتب‌سازی
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const customerType = searchParams.get('customerType')
    const sortBy = searchParams.get('sortBy') || 'registrationDate'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const limit = parseInt(searchParams.get('limit') || '100')
    const skip = parseInt(searchParams.get('skip') || '0')

    // ساخت فیلتر
    const filter: any = {}
    if (status && status !== 'all') filter.status = status
    if (customerType && customerType !== 'all') filter.customerType = customerType

    // ساخت مرتب‌سازی
    const sort: any = {}
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1

    const customers = await collection
      .find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .toArray()

    // آمار کلی
    const stats = await collection.aggregate([
      {
        $group: {
          _id: null,
          totalCustomers: { $sum: 1 },
          totalRevenue: { $sum: '$totalSpent' },
          activeCustomers: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
          inactiveCustomers: { $sum: { $cond: [{ $eq: ['$status', 'inactive'] }, 1, 0] } },
          blockedCustomers: { $sum: { $cond: [{ $eq: ['$status', 'blocked'] }, 1, 0] } },
          goldenCustomers: { $sum: { $cond: [{ $eq: ['$customerType', 'golden'] }, 1, 0] } },
          vipCustomers: { $sum: { $cond: [{ $eq: ['$customerType', 'vip'] }, 1, 0] } }
        }
      }
    ]).toArray()

    return NextResponse.json({
      success: true,
      data: customers,
      stats: stats[0] || {
        totalCustomers: 0,
        totalRevenue: 0,
        activeCustomers: 0,
        inactiveCustomers: 0,
        blockedCustomers: 0,
        goldenCustomers: 0,
        vipCustomers: 0
      },
      pagination: {
        limit,
        skip,
        total: await collection.countDocuments(filter)
      }
    })
  } catch (error) {
    console.error('Error fetching customers:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت مشتریان' },
      { status: 500 }
    )
  }
}

// POST - ایجاد مشتری جدید
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const body = await request.json()
    
    // تولید شماره مشتری منحصر به فرد
    const customerCount = await collection.countDocuments()
    const customerNumber = `CUST-${String(customerCount + 1).padStart(6, '0')}`
    
    const customer = {
      customerNumber,
      firstName: body.firstName,
      lastName: body.lastName,
      name: body.firstName + ' ' + body.lastName,
      phone: body.phone,
      email: body.email || '',
      address: body.address || '',
      birthDate: body.birthDate || '',
      registrationDate: body.registrationDate || new Date().toISOString(),
      totalOrders: body.totalOrders || 0,
      totalSpent: body.totalSpent || 0,
      lastOrderDate: body.lastOrderDate || '',
      status: body.status || 'active',
      notes: body.notes || '',
      tags: body.tags || [],
      loyaltyPoints: body.loyaltyPoints || 0,
      customerType: body.customerType || 'regular',
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await collection.insertOne(customer)
    
    return NextResponse.json({
      success: true,
      data: { ...customer, _id: result.insertedId },
      message: 'مشتری با موفقیت ایجاد شد'
    })
  } catch (error) {
    console.error('Error creating customer:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در ایجاد مشتری' },
      { status: 500 }
    )
  }
}

// DELETE - حذف مشتری
export async function DELETE(request: NextRequest) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'شناسه مشتری اجباری است' },
        { status: 400 }
      )
    }

    const result = await collection.deleteOne({ _id: new ObjectId(id) })
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'مشتری یافت نشد' },
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
      { success: false, message: 'خطا در حذف مشتری' },
      { status: 500 }
    )
  }
}