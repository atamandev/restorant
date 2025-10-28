import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://restorenUser:1234@localhost:27017/restoren'
const DB_NAME = 'restoren'
const COLLECTION_NAME = 'cheques'

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

// PATCH - به‌روزرسانی وضعیت چک
export async function PATCH(request: NextRequest) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const body = await request.json()
    const { id, status, notes, depositBank, depositAccount, returnReason, endorsementTo } = body
    
    if (!id || !status) {
      return NextResponse.json(
        { success: false, message: 'شناسه چک و وضعیت اجباری است' },
        { status: 400 }
      )
    }

    const updateData: any = {
      status,
      updatedAt: new Date().toISOString()
    }

    // اگر وضعیت به "deposited" تغییر کرد، تاریخ واریز را تنظیم کن
    if (status === 'deposited') {
      updateData.depositDate = new Date().toISOString()
      if (depositBank) updateData.depositBank = depositBank
      if (depositAccount) updateData.depositAccount = depositAccount
    }
    
    // اگر وضعیت به "cleared" تغییر کرد، تاریخ وصول را تنظیم کن
    if (status === 'cleared') {
      updateData.clearanceDate = new Date().toISOString()
    }
    
    // اگر وضعیت به "returned" تغییر کرد، تاریخ برگشت را تنظیم کن
    if (status === 'returned') {
      updateData.returnDate = new Date().toISOString()
      if (returnReason) updateData.returnReason = returnReason
    }
    
    // اگر وضعیت به "endorsed" تغییر کرد، تاریخ پشت‌نویسی را تنظیم کن
    if (status === 'endorsed') {
      updateData.endorsementDate = new Date().toISOString()
      if (endorsementTo) updateData.endorsementTo = endorsementTo
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
        { success: false, message: 'چک یافت نشد' },
        { status: 404 }
      )
    }

    const updatedCheque = await collection.findOne({ _id: new ObjectId(id) })
    
    return NextResponse.json({
      success: true,
      data: updatedCheque,
      message: 'وضعیت چک با موفقیت به‌روزرسانی شد'
    })
  } catch (error) {
    console.error('Error updating cheque status:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در به‌روزرسانی وضعیت چک' },
      { status: 500 }
    )
  }
}
