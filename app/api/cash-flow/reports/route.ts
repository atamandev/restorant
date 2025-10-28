import { NextRequest, NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'

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

// GET - گزارش‌های پیشرفته جریان نقدی
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const { searchParams } = new URL(request.url)
    const reportType = searchParams.get('reportType') // daily, weekly, monthly, yearly, category_analysis, branch_analysis
    const branchId = searchParams.get('branchId')
    const category = searchParams.get('category')
    const fromDate = searchParams.get('fromDate')
    const toDate = searchParams.get('toDate')
    const period = searchParams.get('period') // 7d, 30d, 90d, 1y

    let pipeline: any[] = []
    let matchStage: any = {}

    // فیلتر تاریخ
    if (fromDate || toDate) {
      matchStage.date = {}
      if (fromDate) matchStage.date.$gte = new Date(fromDate)
      if (toDate) matchStage.date.$lte = new Date(toDate)
    } else if (period) {
      const now = new Date()
      let startDate = new Date()
      
      switch (period) {
        case '7d':
          startDate.setDate(now.getDate() - 7)
          break
        case '30d':
          startDate.setDate(now.getDate() - 30)
          break
        case '90d':
          startDate.setDate(now.getDate() - 90)
          break
        case '1y':
          startDate.setFullYear(now.getFullYear() - 1)
          break
      }
      
      matchStage.date = { $gte: startDate, $lte: now }
    }

    // فیلتر شعبه
    if (branchId && branchId !== 'all') {
      matchStage.branchId = branchId
    }

    // فیلتر دسته‌بندی
    if (category && category !== 'all') {
      matchStage.category = category
    }

    if (Object.keys(matchStage).length > 0) {
      pipeline.push({ $match: matchStage })
    }

    switch (reportType) {
      case 'daily':
        // گزارش روزانه
        pipeline.push({
          $group: {
            _id: {
              year: { $year: '$date' },
              month: { $month: '$date' },
              day: { $dayOfMonth: '$date' }
            },
            date: { $first: '$date' },
            dailyInflow: { $sum: { $cond: [{ $eq: ['$type', 'inflow'] }, '$amount', 0] } },
            dailyOutflow: { $sum: { $cond: [{ $eq: ['$type', 'outflow'] }, '$amount', 0] } },
            dailyNet: { $sum: { $cond: [{ $eq: ['$type', 'inflow'] }, '$amount', { $multiply: ['$amount', -1] }] } },
            transactionCount: { $sum: 1 },
            inflowCount: { $sum: { $cond: [{ $eq: ['$type', 'inflow'] }, 1, 0] } },
            outflowCount: { $sum: { $cond: [{ $eq: ['$type', 'outflow'] }, 1, 0] } }
          }
        })
        pipeline.push({
          $sort: { date: -1 }
        })
        pipeline.push({
          $limit: 30
        })
        break

      case 'weekly':
        // گزارش هفتگی
        pipeline.push({
          $group: {
            _id: {
              year: { $year: '$date' },
              week: { $week: '$date' }
            },
            weekStart: { $first: '$date' },
            weeklyInflow: { $sum: { $cond: [{ $eq: ['$type', 'inflow'] }, '$amount', 0] } },
            weeklyOutflow: { $sum: { $cond: [{ $eq: ['$type', 'outflow'] }, '$amount', 0] } },
            weeklyNet: { $sum: { $cond: [{ $eq: ['$type', 'inflow'] }, '$amount', { $multiply: ['$amount', -1] }] } },
            transactionCount: { $sum: 1 }
          }
        })
        pipeline.push({
          $sort: { weekStart: -1 }
        })
        pipeline.push({
          $limit: 12
        })
        break

      case 'monthly':
        // گزارش ماهانه
        pipeline.push({
          $group: {
            _id: {
              year: { $year: '$date' },
              month: { $month: '$date' }
            },
            monthStart: { $first: '$date' },
            monthlyInflow: { $sum: { $cond: [{ $eq: ['$type', 'inflow'] }, '$amount', 0] } },
            monthlyOutflow: { $sum: { $cond: [{ $eq: ['$type', 'outflow'] }, '$amount', 0] } },
            monthlyNet: { $sum: { $cond: [{ $eq: ['$type', 'inflow'] }, '$amount', { $multiply: ['$amount', -1] }] } },
            transactionCount: { $sum: 1 }
          }
        })
        pipeline.push({
          $sort: { monthStart: -1 }
        })
        pipeline.push({
          $limit: 12
        })
        break

      case 'yearly':
        // گزارش سالانه
        pipeline.push({
          $group: {
            _id: { $year: '$date' },
            year: { $first: { $year: '$date' } },
            yearlyInflow: { $sum: { $cond: [{ $eq: ['$type', 'inflow'] }, '$amount', 0] } },
            yearlyOutflow: { $sum: { $cond: [{ $eq: ['$type', 'outflow'] }, '$amount', 0] } },
            yearlyNet: { $sum: { $cond: [{ $eq: ['$type', 'inflow'] }, '$amount', { $multiply: ['$amount', -1] }] } },
            transactionCount: { $sum: 1 }
          }
        })
        pipeline.push({
          $sort: { year: -1 }
        })
        break

      case 'category_analysis':
        // تحلیل بر اساس دسته‌بندی
        pipeline.push({
          $group: {
            _id: '$category',
            category: { $first: '$category' },
            totalInflow: { $sum: { $cond: [{ $eq: ['$type', 'inflow'] }, '$amount', 0] } },
            totalOutflow: { $sum: { $cond: [{ $eq: ['$type', 'outflow'] }, '$amount', 0] } },
            netAmount: { $sum: { $cond: [{ $eq: ['$type', 'inflow'] }, '$amount', { $multiply: ['$amount', -1] }] } },
            transactionCount: { $sum: 1 },
            avgAmount: { $avg: '$amount' },
            maxAmount: { $max: '$amount' },
            minAmount: { $min: '$amount' }
          }
        })
        pipeline.push({
          $sort: { netAmount: -1 }
        })
        break

      case 'branch_analysis':
        // تحلیل بر اساس شعبه
        pipeline.push({
          $group: {
            _id: '$branchId',
            branchId: { $first: '$branchId' },
            branchName: { $first: '$branchName' },
            totalInflow: { $sum: { $cond: [{ $eq: ['$type', 'inflow'] }, '$amount', 0] } },
            totalOutflow: { $sum: { $cond: [{ $eq: ['$type', 'outflow'] }, '$amount', 0] } },
            netAmount: { $sum: { $cond: [{ $eq: ['$type', 'inflow'] }, '$amount', { $multiply: ['$amount', -1] }] } },
            transactionCount: { $sum: 1 },
            avgAmount: { $avg: '$amount' }
          }
        })
        pipeline.push({
          $sort: { netAmount: -1 }
        })
        break

      case 'payment_method_analysis':
        // تحلیل بر اساس روش پرداخت
        pipeline.push({
          $group: {
            _id: '$paymentMethod',
            paymentMethod: { $first: '$paymentMethod' },
            totalInflow: { $sum: { $cond: [{ $eq: ['$type', 'inflow'] }, '$amount', 0] } },
            totalOutflow: { $sum: { $cond: [{ $eq: ['$type', 'outflow'] }, '$amount', 0] } },
            netAmount: { $sum: { $cond: [{ $eq: ['$type', 'inflow'] }, '$amount', { $multiply: ['$amount', -1] }] } },
            transactionCount: { $sum: 1 },
            avgAmount: { $avg: '$amount' }
          }
        })
        pipeline.push({
          $sort: { transactionCount: -1 }
        })
        break

      default:
        // گزارش کلی
        pipeline.push({
          $group: {
            _id: null,
            totalInflow: { $sum: { $cond: [{ $eq: ['$type', 'inflow'] }, '$amount', 0] } },
            totalOutflow: { $sum: { $cond: [{ $eq: ['$type', 'outflow'] }, '$amount', 0] } },
            netCashFlow: { $sum: { $cond: [{ $eq: ['$type', 'inflow'] }, '$amount', { $multiply: ['$amount', -1] }] } },
            totalTransactions: { $sum: 1 },
            avgTransactionAmount: { $avg: '$amount' },
            maxTransactionAmount: { $max: '$amount' },
            minTransactionAmount: { $min: '$amount' }
          }
        })
        break
    }

    const results = await collection.aggregate(pipeline).toArray()

    return NextResponse.json({
      success: true,
      data: results,
      reportType,
      generatedAt: new Date().toISOString(),
      filters: {
        branchId,
        category,
        fromDate,
        toDate,
        period
      }
    })
  } catch (error) {
    console.error('Error generating cash flow reports:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در تولید گزارش جریان نقدی' },
      { status: 500 }
    )
  }
}

