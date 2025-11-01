import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://restorenUser:1234@localhost:27017/restoren'
const DB_NAME = 'restoren'
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

// GET - دریافت تامین‌کننده خاص
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const supplierId = params.id

    if (!ObjectId.isValid(supplierId)) {
      return NextResponse.json(
        { success: false, message: 'شناسه تامین‌کننده نامعتبر است' },
        { status: 400 }
      )
    }

    const supplier = await collection.findOne({ _id: new ObjectId(supplierId) })

    if (!supplier) {
      return NextResponse.json(
        { success: false, message: 'تامین‌کننده یافت نشد' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: supplier
    })
  } catch (error) {
    console.error('Error fetching supplier:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت تامین‌کننده' },
      { status: 500 }
    )
  }
}

// PUT - به‌روزرسانی کامل تامین‌کننده
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const body = await request.json()
    const supplierId = params.id

    if (!ObjectId.isValid(supplierId)) {
      return NextResponse.json(
        { success: false, message: 'شناسه تامین‌کننده نامعتبر است' },
        { status: 400 }
      )
    }

    const updateData = {
      name: body.name,
      contactPerson: body.contactPerson || '',
      phone: body.phone,
      email: body.email || '',
      address: body.address || '',
      category: body.category || 'other',
      status: body.status || 'active',
      creditLimit: body.creditLimit || 0,
      paymentTerms: body.paymentTerms || 30,
      taxNumber: body.taxNumber || '',
      bankAccount: body.bankAccount || '',
      notes: body.notes || '',
      updatedAt: new Date().toISOString()
    }

    const result = await collection.updateOne(
      { _id: new ObjectId(supplierId) },
      { $set: updateData }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'تامین‌کننده یافت نشد' },
        { status: 404 }
      )
    }

    const updatedSupplier = await collection.findOne({ _id: new ObjectId(supplierId) })

    return NextResponse.json({
      success: true,
      data: updatedSupplier,
      message: 'تامین‌کننده با موفقیت به‌روزرسانی شد'
    })
  } catch (error) {
    console.error('Error updating supplier:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در به‌روزرسانی تامین‌کننده' },
      { status: 500 }
    )
  }
}

// DELETE - حذف تامین‌کننده
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const supplierId = params.id

    if (!ObjectId.isValid(supplierId)) {
      return NextResponse.json(
        { success: false, message: 'شناسه تامین‌کننده نامعتبر است' },
        { status: 400 }
      )
    }

    const result = await collection.deleteOne({ _id: new ObjectId(supplierId) })
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'تامین‌کننده یافت نشد' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'تامین‌کننده با موفقیت حذف شد'
    })
  } catch (error) {
    console.error('Error deleting supplier:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در حذف تامین‌کننده' },
      { status: 500 }
    )
  }
}

