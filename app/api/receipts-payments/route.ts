import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://restorenUser:1234@localhost:27017/restoren'
const DB_NAME = 'restoren'
const COLLECTION_NAME = 'receipts_payments'

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

// GET - دریافت تمام تراکنش‌های دریافت و پرداخت
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // receipt, payment
    const method = searchParams.get('method') // cash, card, bank_transfer, credit, check
    const status = searchParams.get('status') // pending, completed, cancelled
    const personId = searchParams.get('personId')
    const fromDate = searchParams.get('fromDate')
    const toDate = searchParams.get('toDate')
    const sortBy = searchParams.get('sortBy') || 'date'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const limit = parseInt(searchParams.get('limit') || '100')
    const skip = parseInt(searchParams.get('skip') || '0')

    // ساخت فیلتر
    const filter: any = {}
    if (type && type !== 'all') filter.type = type
    if (method && method !== 'all') filter.method = method
    if (status && status !== 'all') filter.status = status
    if (personId) filter.personId = personId
    
    // فیلتر تاریخ
    if (fromDate || toDate) {
      filter.date = {}
      if (fromDate) filter.date.$gte = new Date(fromDate)
      if (toDate) filter.date.$lte = new Date(toDate)
    }

    // ساخت مرتب‌سازی
    const sort: any = {}
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1

    const transactions = await collection
      .find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .toArray()

    // آمار کلی
    const stats = await collection.aggregate([
      {
        $group: {
          _id: null,
          totalTransactions: { $sum: 1 },
          totalReceipts: { $sum: { $cond: [{ $eq: ['$type', 'receipt'] }, 1, 0] } },
          totalPayments: { $sum: { $cond: [{ $eq: ['$type', 'payment'] }, 1, 0] } },
          totalReceiptAmount: { $sum: { $cond: [{ $eq: ['$type', 'receipt'] }, '$amount', 0] } },
          totalPaymentAmount: { $sum: { $cond: [{ $eq: ['$type', 'payment'] }, '$amount', 0] } },
          pendingTransactions: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          completedTransactions: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } }
        }
      }
    ]).toArray()

    return NextResponse.json({
      success: true,
      data: transactions,
      stats: stats[0] || {
        totalTransactions: 0,
        totalReceipts: 0,
        totalPayments: 0,
        totalReceiptAmount: 0,
        totalPaymentAmount: 0,
        pendingTransactions: 0,
        completedTransactions: 0
      },
      pagination: {
        limit,
        skip,
        total: await collection.countDocuments(filter)
      }
    })
  } catch (error) {
    console.error('Error fetching receipts/payments:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت تراکنش‌ها' },
      { status: 500 }
    )
  }
}

// POST - ایجاد تراکنش جدید
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const body = await request.json()
    
    // تولید شماره تراکنش
    const transactionNumber = await generateTransactionNumber(body.type)
    
    const transaction = {
      transactionNumber,
      type: body.type, // receipt, payment
      amount: body.amount,
      method: body.method, // cash, card, bank_transfer, credit, check
      status: body.status || 'pending',
      personId: body.personId,
      personName: body.personName,
      personType: body.personType, // customer, supplier, employee
      reference: body.reference, // invoice, prepayment, deposit, expense
      referenceId: body.referenceId,
      description: body.description,
      notes: body.notes || '',
      date: new Date(body.date || new Date()),
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      bankAccountId: body.bankAccountId || null,
      checkNumber: body.checkNumber || null,
      checkBank: body.checkBank || null,
      checkDueDate: body.checkDueDate ? new Date(body.checkDueDate) : null,
      createdBy: body.createdBy || 'system',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const result = await collection.insertOne(transaction)
    
    return NextResponse.json({
      success: true,
      data: { ...transaction, _id: result.insertedId },
      message: 'تراکنش با موفقیت ثبت شد'
    })
  } catch (error) {
    console.error('Error creating transaction:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در ثبت تراکنش' },
      { status: 500 }
    )
  }
}

// DELETE - حذف تراکنش
export async function DELETE(request: NextRequest) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'شناسه تراکنش اجباری است' },
        { status: 400 }
      )
    }

    const result = await collection.deleteOne({ _id: new ObjectId(id) })
    
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
    console.error('Error deleting transaction:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در حذف تراکنش' },
      { status: 500 }
    )
  }
}

// تابع تولید شماره تراکنش
async function generateTransactionNumber(type: string): Promise<string> {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const prefix = type === 'receipt' ? 'REC' : 'PAY'
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    
    // شمارش تراکنش‌های امروز
    const startOfDay = new Date(year, today.getMonth(), today.getDate())
    const endOfDay = new Date(year, today.getMonth(), today.getDate() + 1)
    
    const count = await collection.countDocuments({
      type: type,
      createdAt: {
        $gte: startOfDay.toISOString(),
        $lt: endOfDay.toISOString()
      }
    })
    
    const sequence = String(count + 1).padStart(4, '0')
    return `${prefix}-${year}${month}${day}-${sequence}`
  } catch (error) {
    console.error('Error generating transaction number:', error)
    return `${type === 'receipt' ? 'REC' : 'PAY'}-${Date.now()}`
  }
}
