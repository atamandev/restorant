import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://restorenUser:1234@localhost:27017/restoren'
const DB_NAME = 'restoren'
const COLLECTION_NAME = 'orders'

let client: MongoClient | undefined
let db: any

async function connectToDatabase() {
  try {
    if (!client) {
      client = new MongoClient(MONGO_URI)
      await client.connect()
      db = client.db(DB_NAME)
    } else if (!db) {
      db = client.db(DB_NAME)
    }
    return db
  } catch (error) {
    console.error('Database connection error:', error)
    throw error
  }
}

// GET - دریافت داده‌های نمودار از سفارشات
export async function GET(request: NextRequest) {
  try {
    const db = await connectToDatabase()
    if (!db) {
      throw new Error('Database connection failed')
    }
    const collection = db.collection(COLLECTION_NAME)
    
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'month' // today, month, 6months, year
    
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    
    let startDate: Date
    let endDate: Date = new Date(now)
    endDate.setHours(23, 59, 59, 999)
    
    // تعیین بازه زمانی
    switch (period) {
      case 'today':
        startDate = new Date(now)
        startDate.setHours(0, 0, 0, 0)
        break
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case '6months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1)
        break
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1)
        break
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    }
    
    // فیلتر سفارشات - فقط سفارشات تکمیل شده و پرداخت شده
    const filter: any = {
      $or: [
        { orderTime: { $gte: startDate, $lte: endDate } },
        { orderTime: { $gte: startDate.toISOString(), $lte: endDate.toISOString() } },
        { createdAt: { $gte: startDate, $lte: endDate } }
      ],
      status: { $in: ['completed', 'paid'] } // فقط سفارشات تکمیل شده و پرداخت شده
    }
    
    // دریافت سفارشات
    const orders = await collection.find(filter).toArray()
    
    // دریافت invoices برای محاسبه دقیق سود (از دیتابیس)
    const invoicesCollection = db.collection('invoices')
    const invoicesFilter: any = {
      type: 'sales',
      status: { $ne: 'cancelled' },
      $or: [
        { date: { $gte: startDate, $lte: endDate } },
        { createdAt: { $gte: startDate.toISOString(), $lte: endDate.toISOString() } }
      ]
    }
    const invoices = await invoicesCollection.find(invoicesFilter).toArray()
    
    // ایجاد map برای دسترسی سریع به invoice بر اساس orderNumber
    const invoiceMap = new Map()
    invoices.forEach((inv: any) => {
      if (inv.orderNumber) {
        invoiceMap.set(inv.orderNumber, inv)
      }
    })
    
    // گروه‌بندی بر اساس تاریخ و محاسبه فروش و سود
    const chartData: { [key: string]: { sales: number, profit: number } } = {}
    
    orders.forEach((order: any) => {
      // تعیین تاریخ سفارش
      let orderDate: Date
      if (order.orderTime) {
        orderDate = typeof order.orderTime === 'string' ? new Date(order.orderTime) : order.orderTime
      } else if (order.createdAt) {
        orderDate = typeof order.createdAt === 'string' ? new Date(order.createdAt) : order.createdAt
      } else {
        return // اگر تاریخ نداشت، رد کن
      }
      
      // تعیین کلید تاریخ بر اساس period
      let dateKey: string
      if (period === 'today') {
        // گروه‌بندی ساعتی
        const hour = orderDate.getHours()
        dateKey = `${hour}:00`
      } else if (period === 'month') {
        // گروه‌بندی روزانه
        const day = orderDate.getDate()
        const month = orderDate.getMonth() + 1
        const monthNames = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند']
        dateKey = `${day} ${monthNames[month - 1]}`
      } else if (period === '6months' || period === 'year') {
        // گروه‌بندی ماهانه
        const month = orderDate.getMonth() + 1
        const monthNames = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند']
        dateKey = monthNames[month - 1]
      } else {
        dateKey = orderDate.toLocaleDateString('fa-IR')
      }
      
      // محاسبه فروش (total سفارش)
      const sales = order.total || order.subtotal || 0
      
      // محاسبه سود از دیتابیس (اول از invoice، بعد از order، وگرنه 0)
      let profit = 0
      const invoice = order.orderNumber ? invoiceMap.get(order.orderNumber) : null
      if (invoice && invoice.profit !== undefined && invoice.profit !== null) {
        // استفاده از سود واقعی از invoice (از دیتابیس)
        profit = invoice.profit
      } else if (order.profit !== undefined && order.profit !== null) {
        // استفاده از سود از order (اگر موجود باشد)
        profit = order.profit
      }
      // اگر هیچ سودی پیدا نشد، profit = 0 (نه 30% از فروش)
      
      // اضافه کردن به chartData
      if (!chartData[dateKey]) {
        chartData[dateKey] = { sales: 0, profit: 0 }
      }
      chartData[dateKey].sales += sales
      chartData[dateKey].profit += profit
    })
    
    // تبدیل به آرایه و مرتب‌سازی
    const result = Object.entries(chartData)
      .map(([label, data]) => ({
        label,
        month: label,
        sales: data.sales,
        profit: data.profit
      }))
      .sort((a, b) => {
        // مرتب‌سازی بر اساس تاریخ
        if (period === 'today') {
          return parseInt(a.label.split(':')[0]) - parseInt(b.label.split(':')[0])
        } else if (period === 'month') {
          const monthNames = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند']
          const aDay = parseInt(a.label.split(' ')[0])
          const bDay = parseInt(b.label.split(' ')[0])
          return aDay - bDay
        } else {
          const monthNames = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند']
          const aIndex = monthNames.indexOf(a.label)
          const bIndex = monthNames.indexOf(b.label)
          return aIndex - bIndex
        }
      })
    
    return NextResponse.json({
      success: true,
      data: result,
      period,
      totalOrders: orders.length,
      totalSales: result.reduce((sum, item) => sum + item.sales, 0),
      totalProfit: result.reduce((sum, item) => sum + item.profit, 0)
    })
  } catch (error: any) {
    console.error('Error fetching chart data:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'خطا در دریافت داده‌های نمودار',
        data: []
      },
      { status: 500 }
    )
  }
}

