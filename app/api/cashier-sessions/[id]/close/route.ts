import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://restorenUser:1234@localhost:27017/restoren'
const DB_NAME = 'restoren'

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

// POST - بستن جلسه صندوق (با محاسبه موجودی مورد انتظار)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase()
    const sessionsCollection = db.collection('cashier_sessions')
    const receiptsPaymentsCollection = db.collection('receipts_payments')
    const invoicesCollection = db.collection('invoices')
    
    const body = await request.json()
    const { actualCashAmount, actualCardAmount, notes } = body

    // دریافت جلسه صندوق
    const session = await sessionsCollection.findOne({ _id: new ObjectId(params.id) })
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'جلسه صندوق یافت نشد' },
        { status: 404 }
      )
    }

    if (session.status !== 'open') {
      return NextResponse.json(
        { success: false, message: 'این جلسه صندوق قبلاً بسته شده است' },
        { status: 400 }
      )
    }

    // محاسبه موجودی مورد انتظار بر اساس تراکنش‌ها
    // 1. بررسی تمام فاکتورهای این جلسه که پرداخت نقدی یا کارتی دارند
    const sessionInvoices = await invoicesCollection.find({
      cashierSessionId: params.id,
      status: 'paid'
    }).toArray()

    let expectedCashAmount = session.startAmount || 0
    let expectedCardAmount = 0

    for (const invoice of sessionInvoices) {
      if (invoice.paymentMethod === 'cash') {
        expectedCashAmount += invoice.paidAmount || 0
      } else if (invoice.paymentMethod === 'card') {
        expectedCardAmount += invoice.paidAmount || 0
      }
    }

    // 2. بررسی تراکنش‌های مستقیم (receipts/payments) که به این جلسه مرتبط هستند
    const sessionTransactions = await receiptsPaymentsCollection.find({
      reference: 'cashier_session',
      referenceId: params.id,
      status: 'completed'
    }).toArray()

    for (const transaction of sessionTransactions) {
      if (transaction.type === 'receipt') {
        if (transaction.method === 'cash') {
          expectedCashAmount += transaction.amount || 0
        } else if (transaction.method === 'card') {
          expectedCardAmount += transaction.amount || 0
        }
      } else if (transaction.type === 'payment') {
        if (transaction.method === 'cash') {
          expectedCashAmount -= transaction.amount || 0
        } else if (transaction.method === 'card') {
          expectedCardAmount -= transaction.amount || 0
        }
      }
    }

    // استفاده از داده‌های session (که از POS به‌روزرسانی شده)
    expectedCashAmount = session.startAmount + (session.cashSales || 0)
    expectedCardAmount = session.cardSales || 0

    // محاسبه تفاوت (کمبود یا اضافه)
    const actualCash = Number(actualCashAmount) || 0
    const actualCard = Number(actualCardAmount) || 0
    const cashDifference = actualCash - expectedCashAmount
    const cardDifference = actualCard - expectedCardAmount
    const totalDifference = cashDifference + cardDifference

    // به‌روزرسانی جلسه
    const updateData = {
      status: 'closed',
      endTime: new Date().toLocaleTimeString('fa-IR'),
      endAmount: actualCash + actualCard,
      expectedCashAmount,
      expectedCardAmount,
      actualCashAmount: actualCash,
      actualCardAmount: actualCard,
      cashDifference,
      cardDifference,
      totalDifference,
      closingNotes: notes || '',
      closedAt: new Date(),
      updatedAt: new Date()
    }

    await sessionsCollection.updateOne(
      { _id: new ObjectId(params.id) },
      { $set: updateData }
    )

    const closedSession = await sessionsCollection.findOne({ _id: new ObjectId(params.id) })

    return NextResponse.json({
      success: true,
      data: closedSession,
      summary: {
        startAmount: session.startAmount,
        expectedCashAmount,
        expectedCardAmount,
        actualCashAmount: actualCash,
        actualCardAmount: actualCard,
        cashDifference,
        cardDifference,
        totalDifference,
        totalSales: session.totalSales || 0,
        totalTransactions: session.totalTransactions || 0,
        cashSales: session.cashSales || 0,
        cardSales: session.cardSales || 0,
        creditSales: session.creditSales || 0,
        discounts: session.discounts || 0,
        taxes: session.taxes || 0
      },
      message: `جلسه صندوق با موفقیت بسته شد. ${totalDifference !== 0 ? `تفاوت: ${totalDifference.toLocaleString()} ریال` : 'موجودی صندوق صحیح است.'}`
    })
  } catch (error) {
    console.error('Error closing cashier session:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در بستن جلسه صندوق',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

