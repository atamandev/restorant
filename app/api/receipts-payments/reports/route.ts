import { NextRequest, NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'

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

// GET - گزارش‌های مالی دریافت و پرداخت
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const { searchParams } = new URL(request.url)
    const reportType = searchParams.get('type') || 'summary'
    const fromDate = searchParams.get('fromDate')
    const toDate = searchParams.get('toDate')
    const personId = searchParams.get('personId')
    const method = searchParams.get('method')

    // ساخت فیلتر تاریخ
    const dateFilter: any = {}
    if (fromDate) dateFilter.$gte = new Date(fromDate)
    if (toDate) dateFilter.$lte = new Date(toDate)

    const baseFilter: any = {}
    if (Object.keys(dateFilter).length > 0) {
      baseFilter.date = dateFilter
    }
    if (personId) baseFilter.personId = personId
    if (method) baseFilter.method = method

    switch (reportType) {
      case 'summary':
        return await getSummaryReport(collection, baseFilter)
      case 'daily':
        return await getDailyReport(collection, baseFilter)
      case 'monthly':
        return await getMonthlyReport(collection, baseFilter)
      case 'by_person':
        return await getByPersonReport(collection, baseFilter)
      case 'by_method':
        return await getByMethodReport(collection, baseFilter)
      case 'cash_flow':
        return await getCashFlowReport(collection, baseFilter)
      default:
        return await getSummaryReport(collection, baseFilter)
    }
  } catch (error) {
    console.error('Error generating financial report:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در تولید گزارش مالی' },
      { status: 500 }
    )
  }
}

// گزارش خلاصه
async function getSummaryReport(collection: any, filter: any) {
  const stats = await collection.aggregate([
    { $match: filter },
    {
      $group: {
        _id: null,
        totalTransactions: { $sum: 1 },
        totalReceipts: { $sum: { $cond: [{ $eq: ['$type', 'receipt'] }, 1, 0] } },
        totalPayments: { $sum: { $cond: [{ $eq: ['$type', 'payment'] }, 1, 0] } },
        totalReceiptAmount: { $sum: { $cond: [{ $eq: ['$type', 'receipt'] }, '$amount', 0] } },
        totalPaymentAmount: { $sum: { $cond: [{ $eq: ['$type', 'payment'] }, '$amount', 0] } },
        pendingReceipts: { $sum: { $cond: [{ $and: [{ $eq: ['$type', 'receipt'] }, { $eq: ['$status', 'pending'] }] }, 1, 0] } },
        pendingPayments: { $sum: { $cond: [{ $and: [{ $eq: ['$type', 'payment'] }, { $eq: ['$status', 'pending'] }] }, 1, 0] } },
        pendingReceiptAmount: { $sum: { $cond: [{ $and: [{ $eq: ['$type', 'receipt'] }, { $eq: ['$status', 'pending'] }] }, '$amount', 0] } },
        pendingPaymentAmount: { $sum: { $cond: [{ $and: [{ $eq: ['$type', 'payment'] }, { $eq: ['$status', 'pending'] }] }, '$amount', 0] } }
      }
    }
  ]).toArray()

  return NextResponse.json({
    success: true,
    data: stats[0] || {
      totalTransactions: 0,
      totalReceipts: 0,
      totalPayments: 0,
      totalReceiptAmount: 0,
      totalPaymentAmount: 0,
      pendingReceipts: 0,
      pendingPayments: 0,
      pendingReceiptAmount: 0,
      pendingPaymentAmount: 0
    }
  })
}

// گزارش روزانه
async function getDailyReport(collection: any, filter: any) {
  const dailyStats = await collection.aggregate([
    { $match: filter },
    {
      $group: {
        _id: {
          year: { $year: '$date' },
          month: { $month: '$date' },
          day: { $dayOfMonth: '$date' }
        },
        date: { $first: '$date' },
        totalReceipts: { $sum: { $cond: [{ $eq: ['$type', 'receipt'] }, '$amount', 0] } },
        totalPayments: { $sum: { $cond: [{ $eq: ['$type', 'payment'] }, '$amount', 0] } },
        receiptCount: { $sum: { $cond: [{ $eq: ['$type', 'receipt'] }, 1, 0] } },
        paymentCount: { $sum: { $cond: [{ $eq: ['$type', 'payment'] }, 1, 0] } }
      }
    },
    { $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1 } }
  ]).toArray()

  return NextResponse.json({
    success: true,
    data: dailyStats
  })
}

// گزارش ماهانه
async function getMonthlyReport(collection: any, filter: any) {
  const monthlyStats = await collection.aggregate([
    { $match: filter },
    {
      $group: {
        _id: {
          year: { $year: '$date' },
          month: { $month: '$date' }
        },
        month: { $first: '$date' },
        totalReceipts: { $sum: { $cond: [{ $eq: ['$type', 'receipt'] }, '$amount', 0] } },
        totalPayments: { $sum: { $cond: [{ $eq: ['$type', 'payment'] }, '$amount', 0] } },
        receiptCount: { $sum: { $cond: [{ $eq: ['$type', 'receipt'] }, 1, 0] } },
        paymentCount: { $sum: { $cond: [{ $eq: ['$type', 'payment'] }, 1, 0] } }
      }
    },
    { $sort: { '_id.year': -1, '_id.month': -1 } }
  ]).toArray()

  return NextResponse.json({
    success: true,
    data: monthlyStats
  })
}

// گزارش بر اساس شخص
async function getByPersonReport(collection: any, filter: any) {
  const personStats = await collection.aggregate([
    { $match: filter },
    {
      $group: {
        _id: '$personId',
        personName: { $first: '$personName' },
        personType: { $first: '$personType' },
        totalReceipts: { $sum: { $cond: [{ $eq: ['$type', 'receipt'] }, '$amount', 0] } },
        totalPayments: { $sum: { $cond: [{ $eq: ['$type', 'payment'] }, '$amount', 0] } },
        receiptCount: { $sum: { $cond: [{ $eq: ['$type', 'receipt'] }, 1, 0] } },
        paymentCount: { $sum: { $cond: [{ $eq: ['$type', 'payment'] }, 1, 0] } },
        balance: { $sum: { $cond: [{ $eq: ['$type', 'receipt'] }, '$amount', { $multiply: ['$amount', -1] }] } }
      }
    },
    { $sort: { balance: -1 } }
  ]).toArray()

  return NextResponse.json({
    success: true,
    data: personStats
  })
}

// گزارش بر اساس روش پرداخت
async function getByMethodReport(collection: any, filter: any) {
  const methodStats = await collection.aggregate([
    { $match: filter },
    {
      $group: {
        _id: '$method',
        totalReceipts: { $sum: { $cond: [{ $eq: ['$type', 'receipt'] }, '$amount', 0] } },
        totalPayments: { $sum: { $cond: [{ $eq: ['$type', 'payment'] }, '$amount', 0] } },
        receiptCount: { $sum: { $cond: [{ $eq: ['$type', 'receipt'] }, 1, 0] } },
        paymentCount: { $sum: { $cond: [{ $eq: ['$type', 'payment'] }, 1, 0] } }
      }
    },
    { $sort: { totalReceipts: -1 } }
  ]).toArray()

  return NextResponse.json({
    success: true,
    data: methodStats
  })
}

// گزارش جریان نقدی
async function getCashFlowReport(collection: any, filter: any) {
  const cashFlow = await collection.aggregate([
    { $match: { ...filter, method: 'cash' } },
    {
      $group: {
        _id: {
          year: { $year: '$date' },
          month: { $month: '$date' },
          day: { $dayOfMonth: '$date' }
        },
        date: { $first: '$date' },
        cashReceipts: { $sum: { $cond: [{ $eq: ['$type', 'receipt'] }, '$amount', 0] } },
        cashPayments: { $sum: { $cond: [{ $eq: ['$type', 'payment'] }, '$amount', 0] } },
        netCashFlow: { $sum: { $cond: [{ $eq: ['$type', 'receipt'] }, '$amount', { $multiply: ['$amount', -1] }] } }
      }
    },
    { $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1 } }
  ]).toArray()

  return NextResponse.json({
    success: true,
    data: cashFlow
  })
}
