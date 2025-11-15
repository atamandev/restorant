import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://admin:StrongPassword123@185.204.169.107:27017/restaurant?authSource=admin'
const DB_NAME = 'restaurant'
const COLLECTION_NAME = 'suppliers'

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

// GET - دریافت تمام تأمین‌کنندگان
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // active, inactive, blocked
    const category = searchParams.get('category') // food, equipment, service, other
    const sortBy = searchParams.get('sortBy') || 'name'
    const sortOrder = searchParams.get('sortOrder') || 'asc'
    const limit = parseInt(searchParams.get('limit') || '100')
    const skip = parseInt(searchParams.get('skip') || '0')

    // ساخت فیلتر
    const filter: any = {}
    if (status && status !== 'all') filter.status = status
    if (category && category !== 'all') filter.category = category

    // ساخت مرتب‌سازی
    const sort: any = {}
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1

    const suppliers = await collection
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
          totalSuppliers: { $sum: 1 },
          activeSuppliers: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
          inactiveSuppliers: { $sum: { $cond: [{ $eq: ['$status', 'inactive'] }, 1, 0] } },
          blockedSuppliers: { $sum: { $cond: [{ $eq: ['$status', 'blocked'] }, 1, 0] } }
        }
      }
    ]).toArray()

    return NextResponse.json({
      success: true,
      data: suppliers,
      stats: stats[0] || {
        totalSuppliers: 0,
        activeSuppliers: 0,
        inactiveSuppliers: 0,
        blockedSuppliers: 0
      },
      pagination: {
        limit,
        skip,
        total: await collection.countDocuments(filter)
      }
    })
  } catch (error) {
    console.error('Error fetching suppliers:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت تأمین‌کنندگان' },
      { status: 500 }
    )
  }
}

// POST - ایجاد تأمین‌کننده جدید
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const body = await request.json()
    
    const supplier = {
      name: body.name,
      contactPerson: body.contactPerson || '',
      phone: body.phone,
      email: body.email || '',
      address: body.address || '',
      category: body.category || 'other', // food, equipment, service, other
      status: body.status || 'active', // active, inactive, blocked
      creditLimit: body.creditLimit || 0,
      paymentTerms: body.paymentTerms || 30, // روزهای پرداخت
      taxNumber: body.taxNumber || '',
      bankAccount: body.bankAccount || '',
      notes: body.notes || '',
      totalPurchases: 0,
      totalAmount: 0,
      lastPurchaseDate: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const result = await collection.insertOne(supplier)
    
    return NextResponse.json({
      success: true,
      data: { ...supplier, _id: result.insertedId },
      message: 'تأمین‌کننده با موفقیت ثبت شد'
    })
  } catch (error) {
    console.error('Error creating supplier:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در ثبت تأمین‌کننده' },
      { status: 500 }
    )
  }
}

// DELETE - حذف تأمین‌کننده
export async function DELETE(request: NextRequest) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'شناسه تأمین‌کننده اجباری است' },
        { status: 400 }
      )
    }

    const result = await collection.deleteOne({ _id: new ObjectId(id) })
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'تأمین‌کننده یافت نشد' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'تأمین‌کننده با موفقیت حذف شد'
    })
  } catch (error) {
    console.error('Error deleting supplier:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در حذف تأمین‌کننده' },
      { status: 500 }
    )
  }
}

