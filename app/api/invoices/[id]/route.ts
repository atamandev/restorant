import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://admin:StrongPassword123@185.204.169.107:27017/restaurant?authSource=admin'
const DB_NAME = 'restaurant'
const COLLECTION_NAME = 'invoices'

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

// GET - دریافت فاکتور خاص
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const invoice = await collection.findOne({ _id: new ObjectId(params.id) })
    
    if (!invoice) {
      return NextResponse.json(
        { success: false, message: 'فاکتور یافت نشد' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: invoice
    })
  } catch (error) {
    console.error('Error fetching invoice:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت فاکتور' },
      { status: 500 }
    )
  }
}

// PUT - به‌روزرسانی فاکتور
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const body = await request.json()
    
    const updateData = {
      customerId: body.customerId,
      customerName: body.customerName,
      customerPhone: body.customerPhone,
      customerAddress: body.customerAddress,
      supplierId: body.supplierId,
      supplierName: body.supplierName,
      supplierPhone: body.supplierPhone,
      supplierAddress: body.supplierAddress,
      date: body.date ? new Date(body.date) : undefined,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      items: body.items,
      subtotal: body.subtotal,
      taxAmount: body.taxAmount,
      discountAmount: body.discountAmount,
      totalAmount: body.totalAmount,
      paidAmount: body.paidAmount,
      status: body.status,
      paymentMethod: body.paymentMethod,
      notes: body.notes,
      terms: body.terms,
      sentDate: body.sentDate ? new Date(body.sentDate) : null,
      paidDate: body.paidDate ? new Date(body.paidDate) : null,
      updatedAt: new Date().toISOString()
    }

    // حذف فیلدهای undefined
    Object.keys(updateData).forEach(key => {
      if (updateData[key as keyof typeof updateData] === undefined) {
        delete updateData[key as keyof typeof updateData]
      }
    })

    const result = await collection.updateOne(
      { _id: new ObjectId(params.id) },
      { $set: updateData }
    )
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'فاکتور یافت نشد' },
        { status: 404 }
      )
    }

    const updatedInvoice = await collection.findOne({ _id: new ObjectId(params.id) })
    
    return NextResponse.json({
      success: true,
      data: updatedInvoice,
      message: 'فاکتور با موفقیت به‌روزرسانی شد'
    })
  } catch (error) {
    console.error('Error updating invoice:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در به‌روزرسانی فاکتور' },
      { status: 500 }
    )
  }
}

// DELETE - حذف فاکتور
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const result = await collection.deleteOne({ _id: new ObjectId(params.id) })
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'فاکتور یافت نشد' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'فاکتور با موفقیت حذف شد'
    })
  } catch (error) {
    console.error('Error deleting invoice:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در حذف فاکتور' },
      { status: 500 }
    )
  }
}

