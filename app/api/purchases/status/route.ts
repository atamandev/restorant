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

// PATCH - به‌روزرسانی وضعیت خرید
export async function PATCH(request: NextRequest) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const body = await request.json()
    const { id, status, paymentStatus, paidAmount, notes } = body
    
    if (!id || (!status && !paymentStatus)) {
      return NextResponse.json(
        { success: false, message: 'شناسه خرید و وضعیت اجباری است' },
        { status: 400 }
      )
    }

    const updateData: any = {
      updatedAt: new Date().toISOString()
    }

    if (status) {
      updateData.status = status
      
      // اگر وضعیت به "received" تغییر کرد، تاریخ دریافت را تنظیم کن
      if (status === 'received') {
        updateData.receivedDate = new Date().toISOString()
      }
      
      // اگر وضعیت به "approved" تغییر کرد، تاریخ تأیید را تنظیم کن
      if (status === 'approved') {
        updateData.approvedDate = new Date().toISOString()
      }
    }

    if (paymentStatus) {
      updateData.paymentStatus = paymentStatus
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
        { success: false, message: 'خرید یافت نشد' },
        { status: 404 }
      )
    }

    const updatedPurchase = await collection.findOne({ _id: new ObjectId(id) })
    
    return NextResponse.json({
      success: true,
      data: updatedPurchase,
      message: 'وضعیت خرید با موفقیت به‌روزرسانی شد'
    })
  } catch (error) {
    console.error('Error updating purchase status:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در به‌روزرسانی وضعیت خرید' },
      { status: 500 }
    )
  }
}

