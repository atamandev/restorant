import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://admin:StrongPassword123@185.204.169.107:27017/restaurant?authSource=admin'
const DB_NAME = 'restaurant'
const COLLECTION_NAME = 'bank_accounts'

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

// GET - دریافت حساب بانکی خاص
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const bankAccount = await collection.findOne({ _id: new ObjectId(params.id) })
    
    if (!bankAccount) {
      return NextResponse.json(
        { success: false, message: 'حساب بانکی یافت نشد' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: bankAccount
    })
  } catch (error) {
    console.error('Error fetching bank account:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت حساب بانکی' },
      { status: 500 }
    )
  }
}

// PUT - به‌روزرسانی حساب بانکی
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const body = await request.json()
    
    const updateData = {
      accountNumber: body.accountNumber,
      accountName: body.accountName,
      bankName: body.bankName,
      bankCode: body.bankCode,
      branchName: body.branchName,
      branchCode: body.branchCode,
      accountType: body.accountType,
      currency: body.currency,
      currentBalance: body.currentBalance,
      status: body.status,
      branchId: body.branchId,
      branchName: body.branchName,
      accountHolder: body.accountHolder,
      accountHolderId: body.accountHolderId,
      iban: body.iban,
      swiftCode: body.swiftCode,
      openingDate: body.openingDate ? new Date(body.openingDate) : undefined,
      notes: body.notes,
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
        { success: false, message: 'حساب بانکی یافت نشد' },
        { status: 404 }
      )
    }

    const updatedBankAccount = await collection.findOne({ _id: new ObjectId(params.id) })
    
    return NextResponse.json({
      success: true,
      data: updatedBankAccount,
      message: 'حساب بانکی با موفقیت به‌روزرسانی شد'
    })
  } catch (error) {
    console.error('Error updating bank account:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در به‌روزرسانی حساب بانکی' },
      { status: 500 }
    )
  }
}

// DELETE - حذف حساب بانکی
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
        { success: false, message: 'حساب بانکی یافت نشد' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'حساب بانکی با موفقیت حذف شد'
    })
  } catch (error) {
    console.error('Error deleting bank account:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در حذف حساب بانکی' },
      { status: 500 }
    )
  }
}

