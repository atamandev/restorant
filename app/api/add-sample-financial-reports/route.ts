import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://restorenUser:1234@localhost:27017/restoren'
const DB_NAME = 'restoren'

let client: MongoClient | null = null
let db: any

async function connectToDatabase() {
  try {
    if (!client) {
      client = new MongoClient(MONGO_URI)
      await client.connect()
      db = client.db(DB_NAME)
    }
    return db
  } catch (error) {
    console.error('Database connection error:', error)
    throw error
  }
}

// POST - اضافه کردن داده نمونه برای گزارشات مالی
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()
    const pnlCollection = db.collection('financial_reports_pnl')
    const agingCollection = db.collection('financial_reports_aging')
    const trendsCollection = db.collection('financial_reports_trends')

    // داده نمونه برای P&L
    const samplePnLData = [
      {
        period: '1403/09',
        periodType: 'current_month',
        branch: null,
        channel: null,
        revenue: 185000000,
        costOfGoodsSold: 120000000,
        grossProfit: 65000000,
        operatingExpenses: 35000000,
        operatingProfit: 30000000,
        otherIncome: 2000000,
        otherExpenses: 1000000,
        netProfit: 31000000,
        grossMargin: 35.14,
        operatingMargin: 16.22,
        netMargin: 16.76,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        period: '1403/08',
        periodType: 'last_month',
        branch: null,
        channel: null,
        revenue: 165000000,
        costOfGoodsSold: 110000000,
        grossProfit: 55000000,
        operatingExpenses: 32000000,
        operatingProfit: 23000000,
        otherIncome: 1500000,
        otherExpenses: 800000,
        netProfit: 23700000,
        grossMargin: 33.33,
        operatingMargin: 13.94,
        netMargin: 14.36,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        period: '1403/07',
        periodType: 'last_3_months',
        branch: null,
        channel: null,
        revenue: 175000000,
        costOfGoodsSold: 115000000,
        grossProfit: 60000000,
        operatingExpenses: 33000000,
        operatingProfit: 27000000,
        otherIncome: 1800000,
        otherExpenses: 900000,
        netProfit: 27900000,
        grossMargin: 34.29,
        operatingMargin: 15.43,
        netMargin: 15.94,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]

    // داده نمونه برای Aging
    const sampleAgingData = {
      data: [
        {
          customerId: 'sample1',
          customerName: 'علی احمدی',
          totalBalance: 2500000,
          current: 1000000,
          days30: 800000,
          days60: 500000,
          days90: 200000,
          over90: 0,
          lastPaymentDate: '1403/09/10',
          creditLimit: 5000000
        },
        {
          customerId: 'sample2',
          customerName: 'فاطمه کریمی',
          totalBalance: 1800000,
          current: 600000,
          days30: 500000,
          days60: 400000,
          days90: 300000,
          over90: 0,
          lastPaymentDate: '1403/09/08',
          creditLimit: 3000000
        },
        {
          customerId: 'sample3',
          customerName: 'رضا حسینی',
          totalBalance: 3200000,
          current: 0,
          days30: 0,
          days60: 1200000,
          days90: 1000000,
          over90: 1000000,
          lastPaymentDate: '1403/08/15',
          creditLimit: 4000000
        }
      ],
      generatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // داده نمونه برای Trends
    const sampleTrendsData = {
      data: [
        { month: 'فروردین', revenue: 150000000, expenses: 120000000, profit: 30000000, margin: 20.0 },
        { month: 'اردیبهشت', revenue: 160000000, expenses: 125000000, profit: 35000000, margin: 21.9 },
        { month: 'خرداد', revenue: 170000000, expenses: 130000000, profit: 40000000, margin: 23.5 },
        { month: 'تیر', revenue: 165000000, expenses: 128000000, profit: 37000000, margin: 22.4 },
        { month: 'مرداد', revenue: 175000000, expenses: 135000000, profit: 40000000, margin: 22.9 },
        { month: 'شهریور', revenue: 185000000, expenses: 140000000, profit: 45000000, margin: 24.3 }
      ],
      months: 6,
      generatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // حذف داده‌های قبلی
    await pnlCollection.deleteMany({})
    await agingCollection.deleteMany({})
    await trendsCollection.deleteMany({})

    // اضافه کردن داده‌های جدید
    const pnlResult = await pnlCollection.insertMany(samplePnLData)
    const agingResult = await agingCollection.insertOne(sampleAgingData)
    const trendsResult = await trendsCollection.insertOne(sampleTrendsData)

    return NextResponse.json({
      success: true,
      data: {
        pnl: pnlResult.insertedCount,
        aging: agingResult.insertedId ? 1 : 0,
        trends: trendsResult.insertedId ? 1 : 0
      },
      message: 'داده‌های نمونه با موفقیت اضافه شدند'
    })
  } catch (error) {
    console.error('Error adding sample financial reports:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در اضافه کردن داده‌های نمونه' },
      { status: 500 }
    )
  }
}

