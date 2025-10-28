import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://restorenUser:1234@localhost:27017/restoren'
const DB_NAME = 'restoren'
const COLLECTION_NAME = 'cash_flow'

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

// GET - دریافت تراکنش جریان نقدی خاص
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const cashFlowTransaction = await collection.findOne({ _id: new ObjectId(params.id) })
    
    if (!cashFlowTransaction) {
      return NextResponse.json(
        { success: false, message: 'تراکنش یافت نشد' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: cashFlowTransaction
    })
  } catch (error) {
    console.error('Error fetching cash flow transaction:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت تراکنش' },
      { status: 500 }
    )
  }
}

// PUT - به‌روزرسانی تراکنش جریان نقدی
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const body = await request.json()
    
    const updateData = {
      transactionId: body.transactionId,
      type: body.type,
      category: body.category,
      amount: body.amount,
      currency: body.currency,
      description: body.description,
      reference: body.reference,
      referenceId: body.referenceId,
      branchId: body.branchId,
      branchName: body.branchName,
      accountId: body.accountId,
      accountName: body.accountName,
      paymentMethod: body.paymentMethod,
      date: body.date ? new Date(body.date) : undefined,
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
        { success: false, message: 'تراکنش یافت نشد' },
        { status: 404 }
      )
    }

    const updatedTransaction = await collection.findOne({ _id: new ObjectId(params.id) })
    
    return NextResponse.json({
      success: true,
      data: updatedTransaction,
      message: 'تراکنش با موفقیت به‌روزرسانی شد'
    })
  } catch (error) {
    console.error('Error updating cash flow transaction:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در به‌روزرسانی تراکنش' },
      { status: 500 }
    )
  }
}

// DELETE - حذف تراکنش جریان نقدی
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
        { success: false, message: 'تراکنش یافت نشد' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'تراکنش با موفقیت حذف شد'
    })
  } catch (error) {
    console.error('Error deleting cash flow transaction:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در حذف تراکنش' },
      { status: 500 }
    )
  }
}

