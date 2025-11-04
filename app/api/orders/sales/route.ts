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

// GET - دریافت داده‌های فروش از orders برای نمودار
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()
    const ordersCollection = db.collection('orders')
    
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'month' // today, month, 6months, year
    
    const now = new Date()
    let startDate: Date
    let endDate: Date = new Date(now)
    endDate.setHours(23, 59, 59, 999)
    
    // تعیین بازه زمانی بر اساس period
    switch (period) {
      case 'today':
        startDate = new Date(now)
        startDate.setHours(0, 0, 0, 0)
        break
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        startDate.setHours(0, 0, 0, 0)
        break
      case '6months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1)
        startDate.setHours(0, 0, 0, 0)
        break
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1)
        startDate.setHours(0, 0, 0, 0)
        break
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        startDate.setHours(0, 0, 0, 0)
    }
    
    // فیلتر سفارشات تکمیل شده
    const filter: any = {
      status: { $in: ['completed', 'paid', 'delivered'] },
      $or: [
        { orderTime: { $gte: startDate, $lte: endDate } },
        { createdAt: { $gte: startDate.toISOString(), $lte: endDate.toISOString() } }
      ]
    }
    
    // دریافت سفارشات
    const orders = await ordersCollection.find(filter).toArray()
    
    // گروه‌بندی بر اساس دوره
    let groupedData: any = {}
    const monthNames = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند']
    
    orders.forEach((order: any) => {
      let orderDate: Date
      try {
        if (order.orderTime) {
          orderDate = order.orderTime instanceof Date ? order.orderTime : new Date(order.orderTime)
        } else if (order.createdAt) {
          orderDate = order.createdAt instanceof Date ? order.createdAt : new Date(order.createdAt)
        } else {
          return
        }
      } catch {
        return
      }
      
      let key: string
      let label: string
      
      switch (period) {
        case 'today':
          // گروه‌بندی ساعتی برای امروز
          const hour = orderDate.getHours()
          key = `${hour}:00`
          label = `${hour}:00`
          break
        case 'month':
          // گروه‌بندی روزانه برای یک ماه
          const day = orderDate.getDate()
          const month = orderDate.getMonth() + 1
          key = `${orderDate.getFullYear()}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
          label = `${day} ${monthNames[month - 1]}`
          break
        case '6months':
        case 'year':
          // گروه‌بندی ماهانه برای 6 ماه و یک سال
          const monthIndex = orderDate.getMonth()
          const year = orderDate.getFullYear()
          key = `${year}-${(monthIndex + 1).toString().padStart(2, '0')}`
          label = `${monthNames[monthIndex]} ${year}`
          break
        default:
          return
      }
      
      if (!groupedData[key]) {
        groupedData[key] = {
          label,
          key,
          totalSales: 0,
          totalProfit: 0,
          orderCount: 0
        }
      }
      
      const orderTotal = order.total || 0
      groupedData[key].totalSales += orderTotal
      groupedData[key].orderCount += 1
      // محاسبه سود (تقریبی 30% از فروش)
      groupedData[key].totalProfit += orderTotal * 0.3
    })
    
    // تبدیل به آرایه و مرتب‌سازی
    let chartData = Object.values(groupedData).sort((a: any, b: any) => {
      return a.key.localeCompare(b.key)
    })
    
    // پر کردن نقاط خالی برای نمایش کامل
    if (period === 'today') {
      // برای امروز: 24 ساعت
      const filledData: any[] = []
      for (let hour = 0; hour < 24; hour++) {
        const hourKey = `${hour}:00`
        const existing = chartData.find((item: any) => item.key === hourKey)
        filledData.push(existing || {
          label: `${hour}:00`,
          key: hourKey,
          totalSales: 0,
          totalProfit: 0,
          orderCount: 0
        })
      }
      chartData = filledData
    } else if (period === 'month') {
      // برای یک ماه: تمام روزهای ماه
      const filledData: any[] = []
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(now.getFullYear(), now.getMonth(), day)
        const month = date.getMonth() + 1
        const key = `${date.getFullYear()}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
        const existing = chartData.find((item: any) => item.key === key)
        filledData.push(existing || {
          label: `${day} ${monthNames[month - 1]}`,
          key,
          totalSales: 0,
          totalProfit: 0,
          orderCount: 0
        })
      }
      chartData = filledData
    } else if (period === '6months') {
      // برای 6 ماه: 6 ماه گذشته
      const filledData: any[] = []
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const monthIndex = date.getMonth()
        const year = date.getFullYear()
        const key = `${year}-${(monthIndex + 1).toString().padStart(2, '0')}`
        const existing = chartData.find((item: any) => item.key === key)
        filledData.push(existing || {
          label: `${monthNames[monthIndex]} ${year}`,
          key,
          totalSales: 0,
          totalProfit: 0,
          orderCount: 0
        })
      }
      chartData = filledData
    } else if (period === 'year') {
      // برای یک سال: 12 ماه
      const filledData: any[] = []
      for (let month = 0; month < 12; month++) {
        const date = new Date(now.getFullYear(), month, 1)
        const year = date.getFullYear()
        const key = `${year}-${(month + 1).toString().padStart(2, '0')}`
        const existing = chartData.find((item: any) => item.key === key)
        filledData.push(existing || {
          label: `${monthNames[month]} ${year}`,
          key,
          totalSales: 0,
          totalProfit: 0,
          orderCount: 0
        })
      }
      chartData = filledData
    }
    
    // تبدیل به فرمت مورد نیاز نمودار
    const formattedData = chartData.map((item: any) => ({
      label: item.label,
      sales: item.totalSales,
      profit: item.totalProfit,
      amount: item.totalSales,
      totalSales: item.totalSales,
      totalProfit: item.totalProfit
    }))
    
    return NextResponse.json({
      success: true,
      data: formattedData,
      period,
      summary: {
        totalSales: formattedData.reduce((sum: number, item: any) => sum + item.sales, 0),
        totalProfit: formattedData.reduce((sum: number, item: any) => sum + item.profit, 0),
        totalOrders: orders.length
      }
    })
  } catch (error) {
    console.error('Error fetching orders sales:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'خطا در دریافت داده‌های فروش',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

