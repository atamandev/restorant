import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://restorenUser:1234@localhost:27017/restoren'
const DB_NAME = 'restoren'
const COLLECTION_NAME = 'financial_reports_trends'

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

// نام ماه‌های شمسی
const persianMonths = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند']

// تبدیل تاریخ میلادی به ماه شمسی (تقریبی)
function getPersianMonth(date: Date): string {
  const month = date.getMonth()
  return persianMonths[month]
}

// محاسبه گزارش روند از داده‌های واقعی
async function calculateTrendReport(
  ordersCollection: any,
  invoicesCollection: any,
  menuItemsCollection: any,
  months: number = 6
): Promise<any[]> {
  const trends: any[] = []
  const now = new Date()

  for (let i = months - 1; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59)

    // دریافت سفارشات و فاکتورهای این ماه
    const orders = await ordersCollection.find({
      createdAt: {
        $gte: monthStart.toISOString(),
        $lte: monthEnd.toISOString()
      }
    }).toArray()

    const invoices = await invoicesCollection.find({
      createdAt: {
        $gte: monthStart.toISOString(),
        $lte: monthEnd.toISOString()
      }
    }).toArray()

    let revenue = 0
    orders.forEach((order: any) => {
      revenue += order.totalAmount || 0
    })
    invoices.forEach((invoice: any) => {
      revenue += invoice.totalAmount || 0
    })

    // محاسبه هزینه‌ها
    let expenses = 0
    for (const order of orders) {
      if (order.items && Array.isArray(order.items)) {
        for (const item of order.items) {
          const menuItem = await menuItemsCollection.findOne({ _id: new ObjectId(item.menuItemId || item.id) })
          if (menuItem && menuItem.cost) {
            expenses += menuItem.cost * (item.quantity || 1)
          }
        }
      }
    }

    // اضافه کردن هزینه‌های عملیاتی (تقریبی)
    expenses += revenue * 0.19

    const profit = revenue - expenses
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0

    trends.push({
      month: getPersianMonth(monthStart),
      revenue,
      expenses,
      profit,
      margin
    })
  }

  return trends
}

// GET - دریافت گزارش روندها
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const { searchParams } = new URL(request.url)
    const generate = searchParams.get('generate') === 'true'
    const months = parseInt(searchParams.get('months') || '6')

    if (generate) {
      // محاسبه از داده‌های واقعی
      const ordersCollection = db.collection('orders')
      const invoicesCollection = db.collection('invoices')
      const menuItemsCollection = db.collection('menu_items')

      const trendsData = await calculateTrendReport(
        ordersCollection,
        invoicesCollection,
        menuItemsCollection,
        months
      )

      // ذخیره در دیتابیس
      const report = {
        data: trendsData,
        months,
        generatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      const result = await collection.insertOne(report)

      return NextResponse.json({
        success: true,
        data: trendsData,
        reportId: result.insertedId.toString(),
        message: 'گزارش روندها با موفقیت تولید شد'
      })
    }

    // دریافت گزارشات ذخیره شده
    const reports = await collection
      .find({})
      .sort({ createdAt: -1 })
      .limit(1)
      .toArray()

    if (reports.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        message: 'هیچ گزارشی یافت نشد'
      })
    }

    return NextResponse.json({
      success: true,
      data: reports[0].data || []
    })
  } catch (error) {
    console.error('Error fetching trends report:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت گزارش روندها' },
      { status: 500 }
    )
  }
}

// POST - ایجاد گزارش روند جدید
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const body = await request.json()
    const { data, months } = body

    const report = {
      data: data || [],
      months: months || 6,
      generatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const result = await collection.insertOne(report)

    return NextResponse.json({
      success: true,
      data: { ...report, _id: result.insertedId.toString(), id: result.insertedId.toString() },
      message: 'گزارش روندها با موفقیت ایجاد شد'
    })
  } catch (error) {
    console.error('Error creating trends report:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در ایجاد گزارش روندها' },
      { status: 500 }
    )
  }
}

