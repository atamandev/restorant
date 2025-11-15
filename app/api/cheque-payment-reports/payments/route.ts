import { NextRequest, NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://admin:StrongPassword123@185.204.169.107:27017/restaurant?authSource=admin'
const DB_NAME = 'restaurant'
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

// GET - گزارش پرداخت‌ها (تحلیل روش‌های پرداخت)
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const { searchParams } = new URL(request.url)
    const method = searchParams.get('method') || 'all'
    const type = searchParams.get('type') || 'all'
    const fromDate = searchParams.get('fromDate')
    const toDate = searchParams.get('toDate')

    // ساخت فیلتر
    const filter: any = {}
    if (method && method !== 'all') filter.method = method
    if (type && type !== 'all') filter.type = type
    
    // فیلتر تاریخ
    if (fromDate || toDate) {
      filter.date = {}
      if (fromDate) filter.date.$gte = new Date(fromDate)
      if (toDate) filter.date.$lte = new Date(toDate)
    }

    const transactions = await collection.find(filter).sort({ date: -1 }).toArray()
    
    const transactionsWithFormat = transactions.map((t: any) => ({
      ...t,
      _id: t._id.toString(),
      id: t._id.toString(),
      paymentNumber: t.transactionNumber || `PAY-${t._id.toString().slice(0, 8)}`,
      date: t.date ? new Date(t.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
    }))

    // تحلیل روش‌های پرداخت
    const methodAnalysis = await collection.aggregate([
      { ...(Object.keys(filter).length > 0 ? { $match: filter } : {}) },
      {
        $group: {
          _id: '$method',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          avgAmount: { $avg: '$amount' },
          minAmount: { $min: '$amount' },
          maxAmount: { $max: '$amount' }
        }
      },
      {
        $sort: { totalAmount: -1 }
      }
    ]).toArray()

    // تحلیل نوع پرداخت (receipt vs payment)
    const typeAnalysis = await collection.aggregate([
      { ...(Object.keys(filter).length > 0 ? { $match: filter } : {}) },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]).toArray()

    // تحلیل روزانه
    const dailyAnalysis = await collection.aggregate([
      { ...(Object.keys(filter).length > 0 ? { $match: filter } : {}) },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$date' }
          },
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          receipts: { $sum: { $cond: [{ $eq: ['$type', 'receipt'] }, '$amount', 0] } },
          payments: { $sum: { $cond: [{ $eq: ['$type', 'payment'] }, '$amount', 0] } }
        }
      },
      {
        $sort: { _id: -1 }
      },
      {
        $limit: 30
      }
    ]).toArray()

    return NextResponse.json({
      success: true,
      data: transactionsWithFormat,
      analysis: {
        methodBreakdown: methodAnalysis.map((m: any) => ({
          method: m._id,
          count: m.count,
          totalAmount: m.totalAmount,
          avgAmount: m.avgAmount,
          minAmount: m.minAmount,
          maxAmount: m.maxAmount,
          percentage: 0 // will be calculated in frontend
        })),
        typeBreakdown: typeAnalysis.map((t: any) => ({
          type: t._id,
          count: t.count,
          totalAmount: t.totalAmount
        })),
        dailyTrend: dailyAnalysis.map((d: any) => ({
          date: d._id,
          count: d.count,
          totalAmount: d.totalAmount,
          receipts: d.receipts,
          payments: d.payments,
          netFlow: d.receipts - d.payments
        })),
        summary: {
          totalTransactions: transactions.length,
          totalAmount: transactions.reduce((sum: number, t: any) => sum + (t.amount || 0), 0),
          totalReceipts: transactions.filter((t: any) => t.type === 'receipt').length,
          totalPayments: transactions.filter((t: any) => t.type === 'payment').length,
          receiptAmount: transactions.filter((t: any) => t.type === 'receipt').reduce((sum: number, t: any) => sum + (t.amount || 0), 0),
          paymentAmount: transactions.filter((t: any) => t.type === 'payment').reduce((sum: number, t: any) => sum + (t.amount || 0), 0)
        }
      }
    })
  } catch (error) {
    console.error('Error generating payment report:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در تولید گزارش پرداخت‌ها', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

