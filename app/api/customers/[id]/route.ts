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

// PUT - به‌روزرسانی کامل مشتری
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const body = await request.json()
    const customerId = params.id

    if (!ObjectId.isValid(customerId)) {
      return NextResponse.json(
        { success: false, message: 'شناسه مشتری نامعتبر است' },
        { status: 400 }
      )
    }

    const updateData = {
      firstName: body.firstName,
      lastName: body.lastName,
      name: body.firstName + ' ' + body.lastName,
      phone: body.phone,
      email: body.email || '',
      address: body.address || '',
      birthDate: body.birthDate || '',
      status: body.status || 'active',
      notes: body.notes || '',
      tags: body.tags || [],
      customerType: body.customerType || 'regular',
      updatedAt: new Date()
    }

    const result = await collection.updateOne(
      { _id: new ObjectId(customerId) },
      { $set: updateData }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'مشتری یافت نشد' },
        { status: 404 }
      )
    }

    const updatedCustomer = await collection.findOne({ _id: new ObjectId(customerId) })

    return NextResponse.json({
      success: true,
      data: updatedCustomer,
      message: 'مشتری با موفقیت به‌روزرسانی شد'
    })
  } catch (error) {
    console.error('Error updating customer:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در به‌روزرسانی مشتری' },
      { status: 500 }
    )
  }
}

// GET - دریافت مشتری خاص
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const customerId = params.id

    if (!ObjectId.isValid(customerId)) {
      return NextResponse.json(
        { success: false, message: 'شناسه مشتری نامعتبر است' },
        { status: 400 }
      )
    }

    const customer = await collection.findOne({ _id: new ObjectId(customerId) })

    if (!customer) {
      return NextResponse.json(
        { success: false, message: 'مشتری یافت نشد' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: customer
    })
  } catch (error) {
    console.error('Error fetching customer:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت مشتری' },
      { status: 500 }
    )
  }
}

// DELETE - حذف مشتری
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const customerId = params.id

    if (!ObjectId.isValid(customerId)) {
      return NextResponse.json(
        { success: false, message: 'شناسه مشتری نامعتبر است' },
        { status: 400 }
      )
    }

    const result = await collection.deleteOne({ _id: new ObjectId(customerId) })
    
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
