import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://restorenUser:1234@localhost:27017/restoren'
const DB_NAME = 'restoren'
const COLLECTION_NAME = 'financial_reports_pnl'

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

// توابع کمکی برای محاسبه تاریخ دوره
function calculatePeriodDates(period: string): { startDate: Date; endDate: Date } {
  const endDate = new Date()
  let startDate = new Date()

  switch (period) {
    case 'current_month':
      startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1)
      break
    case 'last_month':
      startDate = new Date(endDate.getFullYear(), endDate.getMonth() - 1, 1)
      endDate.setDate(0) // آخرین روز ماه گذشته
      break
    case 'last_3_months':
      startDate = new Date(endDate.getFullYear(), endDate.getMonth() - 3, 1)
      break
    case 'last_6_months':
      startDate = new Date(endDate.getFullYear(), endDate.getMonth() - 6, 1)
      break
    case 'last_year':
      startDate = new Date(endDate.getFullYear() - 1, endDate.getMonth(), endDate.getDate())
      break
    default:
      startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1)
  }

  return { startDate, endDate }
}

// محاسبه نام دوره برای نمایش
function getPeriodName(period: string, startDate: Date, endDate: Date): string {
  const persianMonths = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند']
  const year = startDate.getFullYear()
  const month = startDate.getMonth()
  
  // تبدیل میلادی به شمسی (تقریبی)
  const shamsiYear = year - 621
  const shamsiMonth = month < 3 ? month + 9 : month - 3
  
  return `${shamsiYear}/${shamsiMonth.toString().padStart(2, '0')}`
}

// محاسبه گزارش P&L از داده‌های واقعی
async function calculatePnLReport(
  period: string,
  branch: string | null,
  channel: string | null,
  ordersCollection: any,
  invoicesCollection: any,
  inventoryCollection: any,
  menuItemsCollection: any
): Promise<any> {
  const { startDate, endDate } = calculatePeriodDates(period)

  // فیلتر برای سفارشات
  const orderFilter: any = {
    createdAt: {
      $gte: startDate.toISOString(),
      $lte: endDate.toISOString()
    }
  }
  if (branch && branch !== 'all') orderFilter.branch = branch
  if (channel && channel !== 'all') orderFilter.type = channel

  // درآمد از سفارشات و فاکتورها
  const orders = await ordersCollection.find(orderFilter).toArray()
  const invoices = await invoicesCollection.find({
    createdAt: {
      $gte: startDate.toISOString(),
      $lte: endDate.toISOString()
    }
  }).toArray()

  let revenue = 0
  orders.forEach((order: any) => {
    revenue += order.totalAmount || 0
  })
  invoices.forEach((invoice: any) => {
    revenue += invoice.totalAmount || 0
  })

  // بهای تمام شده کالا (COGS) - از آیتم‌های منو و موجودی
  let costOfGoodsSold = 0
  for (const order of orders) {
    if (order.items && Array.isArray(order.items)) {
      for (const item of order.items) {
        const menuItem = await menuItemsCollection.findOne({ _id: new ObjectId(item.menuItemId || item.id) })
        if (menuItem && menuItem.cost) {
          costOfGoodsSold += menuItem.cost * (item.quantity || 1)
        }
      }
    }
  }

  // هزینه‌های عملیاتی (می‌توان از جدول هزینه‌ها یا تنظیمات استفاده کرد)
  // فعلاً یک مقدار تقریبی بر اساس درصد درآمد
  const operatingExpenses = revenue * 0.19 // حدود 19% از درآمد

  // محاسبات
  const grossProfit = revenue - costOfGoodsSold
  const operatingProfit = grossProfit - operatingExpenses
  const otherIncome = 0 // درآمدهای دیگر
  const otherExpenses = 0 // هزینه‌های دیگر
  const netProfit = operatingProfit + otherIncome - otherExpenses

  // محاسبه حاشیه‌ها
  const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0
  const operatingMargin = revenue > 0 ? (operatingProfit / revenue) * 100 : 0
  const netMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0

  return {
    period: getPeriodName(period, startDate, endDate),
    revenue,
    costOfGoodsSold,
    grossProfit,
    operatingExpenses,
    operatingProfit,
    otherIncome,
    otherExpenses,
    netProfit,
    grossMargin,
    operatingMargin,
    netMargin
  }
}

// GET - دریافت گزارشات P&L
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'current_month'
    const branch = searchParams.get('branch') || 'all'
    const channel = searchParams.get('channel') || 'all'
    const generate = searchParams.get('generate') === 'true'

    // اگر generate=true باشد، گزارش را از داده‌های واقعی محاسبه کن
    if (generate) {
      const ordersCollection = db.collection('orders')
      const invoicesCollection = db.collection('invoices')
      const inventoryCollection = db.collection('inventory_items')
      const menuItemsCollection = db.collection('menu_items')

      const pnlData = await calculatePnLReport(
        period,
        branch,
        channel,
        ordersCollection,
        invoicesCollection,
        inventoryCollection,
        menuItemsCollection
      )

      // ذخیره در دیتابیس
      const report = {
        ...pnlData,
        branch: branch !== 'all' ? branch : null,
        channel: channel !== 'all' ? channel : null,
        periodType: period,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      const result = await collection.insertOne(report)

      // برگرداندن لیست کامل گزارشات
      const filter: any = {}
      if (period && period !== 'all') filter.periodType = period
      if (branch && branch !== 'all') filter.branch = branch
      if (channel && channel !== 'all') filter.channel = channel

      const reports = await collection
        .find(filter)
        .sort({ createdAt: -1 })
        .limit(100)
        .toArray()

      return NextResponse.json({
        success: true,
        data: reports.map((r: any) => ({
          ...r,
          _id: r._id.toString(),
          id: r._id.toString()
        })),
        message: 'گزارش P&L با موفقیت تولید شد'
      })
    }

    // در غیر این صورت، گزارشات ذخیره شده را برگردان
    const filter: any = {}
    if (period && period !== 'all') filter.periodType = period
    if (branch && branch !== 'all') filter.branch = branch
    if (channel && channel !== 'all') filter.channel = channel

    const reports = await collection
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray()

    return NextResponse.json({
      success: true,
      data: reports.map((report: any) => ({
        ...report,
        _id: report._id.toString(),
        id: report._id.toString()
      }))
    })
  } catch (error) {
    console.error('Error fetching P&L reports:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت گزارشات P&L' },
      { status: 500 }
    )
  }
}

// POST - ایجاد گزارش P&L جدید
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const body = await request.json()
    const {
      period,
      branch,
      channel,
      revenue,
      costOfGoodsSold,
      grossProfit,
      operatingExpenses,
      operatingProfit,
      otherIncome,
      otherExpenses,
      netProfit,
      grossMargin,
      operatingMargin,
      netMargin
    } = body

    const { startDate, endDate } = calculatePeriodDates(period || 'current_month')

    const report = {
      period: getPeriodName(period || 'current_month', startDate, endDate),
      periodType: period || 'current_month',
      branch: branch || null,
      channel: channel || null,
      revenue: revenue || 0,
      costOfGoodsSold: costOfGoodsSold || 0,
      grossProfit: grossProfit || 0,
      operatingExpenses: operatingExpenses || 0,
      operatingProfit: operatingProfit || 0,
      otherIncome: otherIncome || 0,
      otherExpenses: otherExpenses || 0,
      netProfit: netProfit || 0,
      grossMargin: grossMargin || 0,
      operatingMargin: operatingMargin || 0,
      netMargin: netMargin || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const result = await collection.insertOne(report)

    return NextResponse.json({
      success: true,
      data: { ...report, _id: result.insertedId.toString(), id: result.insertedId.toString() },
      message: 'گزارش P&L با موفقیت ایجاد شد'
    })
  } catch (error) {
    console.error('Error creating P&L report:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در ایجاد گزارش P&L' },
      { status: 500 }
    )
  }
}

// PUT - به‌روزرسانی گزارش P&L
export async function PUT(request: NextRequest) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'شناسه گزارش اجباری است' },
        { status: 400 }
      )
    }

    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: {
          ...updateData,
          updatedAt: new Date().toISOString()
        }
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'گزارش یافت نشد' },
        { status: 404 }
      )
    }

    const updatedReport = await collection.findOne({ _id: new ObjectId(id) })

    return NextResponse.json({
      success: true,
      data: { ...updatedReport, _id: updatedReport._id.toString(), id: updatedReport._id.toString() },
      message: 'گزارش P&L با موفقیت به‌روزرسانی شد'
    })
  } catch (error) {
    console.error('Error updating P&L report:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در به‌روزرسانی گزارش P&L' },
      { status: 500 }
    )
  }
}

// DELETE - حذف گزارش P&L
export async function DELETE(request: NextRequest) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'شناسه گزارش اجباری است' },
        { status: 400 }
      )
    }

    const result = await collection.deleteOne({ _id: new ObjectId(id) })
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'گزارش یافت نشد' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'گزارش P&L با موفقیت حذف شد'
    })
  } catch (error) {
    console.error('Error deleting P&L report:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در حذف گزارش P&L' },
      { status: 500 }
    )
  }
}

