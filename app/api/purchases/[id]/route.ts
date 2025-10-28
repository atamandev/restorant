import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://restorenUser:1234@localhost:27017/restoren'
const DB_NAME = 'restoren'
const COLLECTION_NAME = 'purchases'

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

// GET - دریافت خرید خاص
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const purchase = await collection.findOne({ _id: new ObjectId(params.id) })
    
    if (!purchase) {
      return NextResponse.json(
        { success: false, message: 'خرید یافت نشد' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: purchase
    })
  } catch (error) {
    console.error('Error fetching purchase:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت خرید' },
      { status: 500 }
    )
  }
}

// PUT - به‌روزرسانی خرید
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const body = await request.json()
    
    const updateData = {
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
      paymentStatus: body.paymentStatus,
      paymentMethod: body.paymentMethod,
      notes: body.notes,
      receivedDate: body.receivedDate ? new Date(body.receivedDate) : null,
      receivedBy: body.receivedBy,
      approvedBy: body.approvedBy,
      approvedDate: body.approvedDate ? new Date(body.approvedDate) : null,
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
        { success: false, message: 'خرید یافت نشد' },
        { status: 404 }
      )
    }

    const updatedPurchase = await collection.findOne({ _id: new ObjectId(params.id) })
    
    return NextResponse.json({
      success: true,
      data: updatedPurchase,
      message: 'خرید با موفقیت به‌روزرسانی شد'
    })
  } catch (error) {
    console.error('Error updating purchase:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در به‌روزرسانی خرید' },
      { status: 500 }
    )
  }
}

// DELETE - حذف خرید
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
        { success: false, message: 'خرید یافت نشد' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'خرید با موفقیت حذف شد'
    })
  } catch (error) {
    console.error('Error deleting purchase:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در حذف خرید' },
      { status: 500 }
    )
  }
}
