import { NextRequest, NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'

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

// GET - گزارش‌های چک‌ها
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const { searchParams } = new URL(request.url)
    const reportType = searchParams.get('reportType') // due_soon, overdue, bounced, circulation, cash_flow
    const days = parseInt(searchParams.get('days') || '7')
    const personId = searchParams.get('personId')
    const bankName = searchParams.get('bankName')
    const fromDate = searchParams.get('fromDate')
    const toDate = searchParams.get('toDate')

    let pipeline: any[] = []
    let matchStage: any = {}

    // فیلتر تاریخ
    if (fromDate || toDate) {
      matchStage.dueDate = {}
      if (fromDate) matchStage.dueDate.$gte = new Date(fromDate)
      if (toDate) matchStage.dueDate.$lte = new Date(toDate)
    }

    // فیلتر شخص
    if (personId && personId !== 'all') {
      matchStage.personId = personId
    }

    // فیلتر بانک
    if (bankName && bankName !== 'all') {
      matchStage.bankName = bankName
    }

    if (Object.keys(matchStage).length > 0) {
      pipeline.push({ $match: matchStage })
    }

    switch (reportType) {
      case 'due_soon':
        // چک‌های در حال سررسید
        pipeline.push({
          $match: {
            dueDate: {
              $gte: new Date(),
              $lte: new Date(Date.now() + days * 24 * 60 * 60 * 1000)
            },
            status: { $in: ['in_hand', 'deposited'] }
          }
        })
        break

      case 'overdue':
        // چک‌های سررسید گذشته
        pipeline.push({
          $match: {
            dueDate: { $lt: new Date() },
            status: { $in: ['in_hand', 'deposited'] }
          }
        })
        break

      case 'bounced':
        // چک‌های برگشتی
        pipeline.push({
          $match: {
            status: 'returned'
          }
        })
        break

      case 'circulation':
        // گردش چک‌ها بر اساس شخص
        pipeline.push({
          $group: {
            _id: '$personId',
            personName: { $first: '$personName' },
            personPhone: { $first: '$personPhone' },
            totalCheques: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
            receivedCheques: { $sum: { $cond: [{ $eq: ['$chequeType', 'received'] }, 1, 0] } },
            paidCheques: { $sum: { $cond: [{ $eq: ['$chequeType', 'paid'] }, 1, 0] } },
            inHandCheques: { $sum: { $cond: [{ $eq: ['$status', 'in_hand'] }, 1, 0] } },
            clearedCheques: { $sum: { $cond: [{ $eq: ['$status', 'cleared'] }, 1, 0] } },
            returnedCheques: { $sum: { $cond: [{ $eq: ['$status', 'returned'] }, 1, 0] } },
            overdueCheques: { $sum: { $cond: [{ $lt: ['$dueDate', new Date()] }, 1, 0] } }
          }
        })
        pipeline.push({
          $sort: { totalAmount: -1 }
        })
        break

      case 'cash_flow':
        // پیش‌بینی جریان نقدی
        pipeline.push({
          $group: {
            _id: {
              year: { $year: '$dueDate' },
              month: { $month: '$dueDate' },
              day: { $dayOfMonth: '$dueDate' }
            },
            date: { $first: '$dueDate' },
            totalAmount: { $sum: '$amount' },
            receivedAmount: { $sum: { $cond: [{ $eq: ['$chequeType', 'received'] }, '$amount', 0] } },
            paidAmount: { $sum: { $cond: [{ $eq: ['$chequeType', 'paid'] }, '$amount', 0] } },
            clearedAmount: { $sum: { $cond: [{ $eq: ['$status', 'cleared'] }, '$amount', 0] } },
            pendingAmount: { $sum: { $cond: [{ $in: ['$status', ['in_hand', 'deposited']] }, '$amount', 0] } },
            chequeCount: { $sum: 1 }
          }
        })
        pipeline.push({
          $sort: { date: 1 }
        })
        break

      default:
        // گزارش کلی
        pipeline.push({
          $group: {
            _id: null,
            totalCheques: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
            receivedCheques: { $sum: { $cond: [{ $eq: ['$chequeType', 'received'] }, 1, 0] } },
            paidCheques: { $sum: { $cond: [{ $eq: ['$chequeType', 'paid'] }, 1, 0] } },
            inHandCheques: { $sum: { $cond: [{ $eq: ['$status', 'in_hand'] }, 1, 0] } },
            depositedCheques: { $sum: { $cond: [{ $eq: ['$status', 'deposited'] }, 1, 0] } },
            clearedCheques: { $sum: { $cond: [{ $eq: ['$status', 'cleared'] }, 1, 0] } },
            returnedCheques: { $sum: { $cond: [{ $eq: ['$status', 'returned'] }, 1, 0] } },
            endorsedCheques: { $sum: { $cond: [{ $eq: ['$status', 'endorsed'] }, 1, 0] } },
            overdueCheques: { $sum: { $cond: [{ $lt: ['$dueDate', new Date()] }, 1, 0] } },
            dueThisWeek: { $sum: { $cond: [{ $and: [{ $gte: ['$dueDate', new Date()] }, { $lte: ['$dueDate', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)] }] }, 1, 0] } },
            dueThisMonth: { $sum: { $cond: [{ $and: [{ $gte: ['$dueDate', new Date()] }, { $lte: ['$dueDate', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)] }] }, 1, 0] } }
          }
        })
        break
    }

    const results = await collection.aggregate(pipeline).toArray()

    return NextResponse.json({
      success: true,
      data: results,
      reportType,
      generatedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error generating cheque reports:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در تولید گزارش چک‌ها' },
      { status: 500 }
    )
  }
}
