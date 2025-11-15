import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://admin:StrongPassword123@185.204.169.107:27017/restaurant?authSource=admin'
const DB_NAME = 'restaurant'
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

// GET - دریافت چک خاص
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const cheque = await collection.findOne({ _id: new ObjectId(params.id) })
    
    if (!cheque) {
      return NextResponse.json(
        { success: false, message: 'چک یافت نشد' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: cheque
    })
  } catch (error) {
    console.error('Error fetching cheque:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت چک' },
      { status: 500 }
    )
  }
}

// PUT - به‌روزرسانی چک
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const body = await request.json()
    
    const updateData = {
      chequeNumber: body.chequeNumber,
      chequeType: body.chequeType,
      amount: body.amount,
      currency: body.currency,
      bankName: body.bankName,
      bankCode: body.bankCode,
      branchName: body.branchName,
      branchCode: body.branchCode,
      accountNumber: body.accountNumber,
      issueDate: body.issueDate ? new Date(body.issueDate) : undefined,
      dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
      personId: body.personId,
      personName: body.personName,
      personPhone: body.personPhone,
      personAddress: body.personAddress,
      status: body.status,
      purpose: body.purpose,
      reference: body.reference,
      referenceId: body.referenceId,
      referenceType: body.referenceType,
      notes: body.notes,
      endorsementDate: body.endorsementDate ? new Date(body.endorsementDate) : null,
      endorsementTo: body.endorsementTo,
      depositDate: body.depositDate ? new Date(body.depositDate) : null,
      depositBank: body.depositBank,
      depositAccount: body.depositAccount,
      clearanceDate: body.clearanceDate ? new Date(body.clearanceDate) : null,
      returnDate: body.returnDate ? new Date(body.returnDate) : null,
      returnReason: body.returnReason,
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
        { success: false, message: 'چک یافت نشد' },
        { status: 404 }
      )
    }

    const updatedCheque = await collection.findOne({ _id: new ObjectId(params.id) })
    
    return NextResponse.json({
      success: true,
      data: updatedCheque,
      message: 'چک با موفقیت به‌روزرسانی شد'
    })
  } catch (error) {
    console.error('Error updating cheque:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در به‌روزرسانی چک' },
      { status: 500 }
    )
  }
}

// DELETE - حذف چک
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
        { success: false, message: 'چک یافت نشد' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'چک با موفقیت حذف شد'
    })
  } catch (error) {
    console.error('Error deleting cheque:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در حذف چک' },
      { status: 500 }
    )
  }
}

