import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://admin:StrongPassword123@185.204.169.107:27017/restaurant?authSource=admin'
const DB_NAME = 'restaurant'

let client: MongoClient | null = null

async function connectToDatabase() {
  if (!client) {
    client = new MongoClient(MONGO_URI)
    await client.connect()
  }
  return client.db(DB_NAME)
}

// GET - دریافت لیست مشتریان امروز (که سفارش داده‌اند)
export async function GET(request: NextRequest) {
  try {
    const db = await connectToDatabase()
    const ordersCollection = db.collection('orders')
    const customersCollection = db.collection('customers')

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') // تاریخ به صورت YYYY-MM-DD (اختیاری، پیش‌فرض: امروز)

    // تاریخ امروز
    const today = date ? new Date(date + 'T00:00:00') : new Date()
    today.setHours(0, 0, 0, 0)
    const endOfToday = new Date(today)
    endOfToday.setHours(23, 59, 59, 999)

    console.log('[DAILY_REPORT_CUSTOMERS] Date range:', {
      today: today.toISOString(),
      endOfToday: endOfToday.toISOString()
    })

    // Query برای سفارشات امروز (فقط completed, paid, delivered)
    const todayFilter: any = {
      status: { $in: ['completed', 'paid', 'delivered'] },
      $or: [
        { orderTime: { $gte: today.toISOString(), $lte: endOfToday.toISOString() } },
        { orderTime: { $gte: today, $lte: endOfToday } },
        { createdAt: { $gte: today, $lte: endOfToday } }
      ]
    }

    // دریافت سفارشات امروز
    const todayOrders = await ordersCollection.find(todayFilter).toArray()
    
    console.log('[DAILY_REPORT_CUSTOMERS] Today orders:', todayOrders.length)

    // استخراج مشتریان یونیک از سفارشات
    const customerMap = new Map<string, {
      customerId: string | null
      customerPhone: string | null
      customerName: string
      orderCount: number
      totalSpent: number
      firstOrderTime: Date
      lastOrderTime: Date
    }>()

    todayOrders.forEach(order => {
      const customerKey = order.customerId?.toString() || order.customerPhone || order.customerName || 'unknown'
      
      if (customerMap.has(customerKey)) {
        const existing = customerMap.get(customerKey)!
        existing.orderCount += 1
        existing.totalSpent += order.total || 0
        const orderTime = order.orderTime ? new Date(order.orderTime) : (order.createdAt ? new Date(order.createdAt) : new Date())
        if (orderTime < existing.firstOrderTime) {
          existing.firstOrderTime = orderTime
        }
        if (orderTime > existing.lastOrderTime) {
          existing.lastOrderTime = orderTime
        }
      } else {
        const orderTime = order.orderTime ? new Date(order.orderTime) : (order.createdAt ? new Date(order.createdAt) : new Date())
        customerMap.set(customerKey, {
          customerId: order.customerId?.toString() || null,
          customerPhone: order.customerPhone || null,
          customerName: order.customerName || 'مشتری ناشناس',
          orderCount: 1,
          totalSpent: order.total || 0,
          firstOrderTime: orderTime,
          lastOrderTime: orderTime
        })
      }
    })

    // تبدیل به آرایه و مرتب‌سازی بر اساس تعداد سفارشات (بیشترین اول)
    const customersList = Array.from(customerMap.values())
      .sort((a, b) => b.orderCount - a.orderCount || b.totalSpent - a.totalSpent)

    // اگر customerId موجود باشد، اطلاعات کامل مشتری را از collection customers بگیر
    const enrichedCustomers = await Promise.all(
      customersList.map(async (customer) => {
        if (customer.customerId) {
          try {
            const fullCustomer = await customersCollection.findOne({
              _id: new ObjectId(customer.customerId)
            })
            if (fullCustomer) {
              return {
                ...customer,
                customerNumber: fullCustomer.customerNumber || '',
                phone: fullCustomer.phone || customer.customerPhone || '',
                email: fullCustomer.email || '',
                address: fullCustomer.address || '',
                totalOrders: fullCustomer.totalOrders || customer.orderCount,
                totalSpent: fullCustomer.totalSpent || customer.totalSpent,
                customerType: fullCustomer.customerType || 'regular'
              }
            }
          } catch (e) {
            console.log('[DAILY_REPORT_CUSTOMERS] Error fetching customer:', e)
          }
        }
        return {
          ...customer,
          customerNumber: '',
          phone: customer.customerPhone || '',
          email: '',
          address: '',
          totalOrders: customer.orderCount,
          totalSpent: customer.totalSpent,
          customerType: 'regular'
        }
      })
    )

    console.log('[DAILY_REPORT_CUSTOMERS] Customers found:', enrichedCustomers.length)

    return NextResponse.json({
      success: true,
      data: enrichedCustomers,
      date: today.toISOString().split('T')[0],
      total: enrichedCustomers.length
    })
  } catch (error) {
    console.error('Error fetching daily report customers:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'خطا در دریافت لیست مشتریان',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

