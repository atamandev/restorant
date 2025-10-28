import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://restorenUser:1234@localhost:27017/restoren'
const DB_NAME = 'restoren'
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

// PATCH - به‌روزرسانی وضعیت فاکتور
export async function PATCH(request: NextRequest) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const body = await request.json()
    const { id, status, paidAmount, notes } = body
    
    if (!id || !status) {
      return NextResponse.json(
        { success: false, message: 'شناسه فاکتور و وضعیت اجباری است' },
        { status: 400 }
      )
    }

    const updateData: any = {
      status,
      updatedAt: new Date().toISOString()
    }

    // اگر وضعیت به "sent" تغییر کرد، تاریخ ارسال را تنظیم کن
    if (status === 'sent') {
      updateData.sentDate = new Date().toISOString()
    }
    
    // اگر وضعیت به "paid" تغییر کرد، تاریخ پرداخت را تنظیم کن
    if (status === 'paid') {
      updateData.paidDate = new Date().toISOString()
    }

    if (paidAmount !== undefined) {
      updateData.paidAmount = paidAmount
    }

    if (notes) {
      updateData.notes = notes
    }

    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    )
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'فاکتور یافت نشد' },
        { status: 404 }
      )
    }

    const updatedInvoice = await collection.findOne({ _id: new ObjectId(id) })
    
    return NextResponse.json({
      success: true,
      data: updatedInvoice,
      message: 'وضعیت فاکتور با موفقیت به‌روزرسانی شد'
    })
  } catch (error) {
    console.error('Error updating invoice status:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در به‌روزرسانی وضعیت فاکتور' },
      { status: 500 }
    )
  }
}

