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

// GET - دریافت آمار روزانه (فروش، سفارشات، مشتریان)
export async function GET(request: NextRequest) {
  try {
    const db = await connectToDatabase()
    const ordersCollection = db.collection('orders')

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') // تاریخ به صورت YYYY-MM-DD (اختیاری، پیش‌فرض: امروز)

    // تاریخ امروز
    const today = date ? new Date(date + 'T00:00:00') : new Date()
    today.setHours(0, 0, 0, 0)
    const endOfToday = new Date(today)
    endOfToday.setHours(23, 59, 59, 999)

    // تاریخ دیروز برای محاسبه درصد تغییر
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const endOfYesterday = new Date(yesterday)
    endOfYesterday.setHours(23, 59, 59, 999)

    console.log('[DAILY_REPORT_STATS] Date range:', {
      today: today.toISOString(),
      endOfToday: endOfToday.toISOString(),
      yesterday: yesterday.toISOString(),
      endOfYesterday: endOfYesterday.toISOString()
    })

    // Query برای سفارشات امروز - شامل تمام سفارشات که امروز ثبت شده‌اند
    // فیلتر بر اساس orderTime یا createdAt
    const todayFilter: any = {
      $or: [
        // اگر orderTime string است
        { 
          orderTime: { 
            $gte: today.toISOString(), 
            $lte: endOfToday.toISOString() 
          } 
        },
        // اگر orderTime Date است
        { 
          orderTime: { 
            $gte: today, 
            $lte: endOfToday 
          } 
        },
        // اگر createdAt Date است
        { 
          createdAt: { 
            $gte: today, 
            $lte: endOfToday 
          } 
        }
      ]
    }

    // Query برای سفارشات دیروز
    const yesterdayFilter: any = {
      $or: [
        { 
          orderTime: { 
            $gte: yesterday.toISOString(), 
            $lte: endOfYesterday.toISOString() 
          } 
        },
        { 
          orderTime: { 
            $gte: yesterday, 
            $lte: endOfYesterday 
          } 
        },
        { 
          createdAt: { 
            $gte: yesterday, 
            $lte: endOfYesterday 
          } 
        }
      ]
    }

    // دریافت همه سفارشات امروز (بدون فیلتر status)
    const allTodayOrders = await ordersCollection.find(todayFilter).toArray()
    
    // فیلتر کردن فقط سفارشات completed, paid, delivered برای محاسبه فروش
    const todayOrders = allTodayOrders.filter(order => 
      ['completed', 'paid', 'delivered'].includes(order.status)
    )
    
    console.log('[DAILY_REPORT_STATS] All today orders:', allTodayOrders.length)
    console.log('[DAILY_REPORT_STATS] Completed/paid/delivered today orders:', todayOrders.length)

    if (todayOrders.length > 0) {
      console.log('[DAILY_REPORT_STATS] Sample order:', {
        orderNumber: todayOrders[0].orderNumber,
        total: todayOrders[0].total,
        status: todayOrders[0].status,
        orderTime: todayOrders[0].orderTime,
        createdAt: todayOrders[0].createdAt,
        customerId: todayOrders[0].customerId,
        customerPhone: todayOrders[0].customerPhone
      })
    }
    
    // کل فروش امروز و تجزیه فروش
    let totalSalesToday = 0
    let cashSalesToday = 0
    let cardSalesToday = 0
    let creditSalesToday = 0
    let totalDiscountsToday = 0
    let totalTaxesToday = 0
    let totalServiceChargesToday = 0

    todayOrders.forEach(order => {
      const total = order.total || 0
      totalSalesToday += total

      // تجزیه بر اساس روش پرداخت
      const paymentMethod = order.paymentMethod || 'cash'
      if (paymentMethod === 'cash' || paymentMethod === 'نقدی') {
        cashSalesToday += total
      } else if (paymentMethod === 'card' || paymentMethod === 'کارتخوان') {
        cardSalesToday += total
      } else if (paymentMethod === 'credit' || paymentMethod === 'اعتباری') {
        creditSalesToday += total
      }

      // کسرها
      totalDiscountsToday += order.discount || 0
      totalTaxesToday += order.tax || 0
      totalServiceChargesToday += order.serviceCharge || 0
    })

    // تعداد سفارشات امروز
    const totalOrdersToday = todayOrders.length

    // تعداد مشتریان یونیک امروز (بدون تکرار)
    const uniqueCustomersToday = new Set<string>()
    todayOrders.forEach(order => {
      if (order.customerId) {
        uniqueCustomersToday.add(order.customerId.toString())
      } else if (order.customerPhone) {
        uniqueCustomersToday.add(order.customerPhone.trim())
      } else if (order.customerName) {
        // اگر customerId و customerPhone نبود، از customerName استفاده کن
        uniqueCustomersToday.add(order.customerName.trim())
      }
    })
    const totalCustomersToday = uniqueCustomersToday.size

    // محاسبه فروش خالص و سود خالص
    const netSalesToday = totalSalesToday - totalDiscountsToday
    const netProfitToday = netSalesToday + totalServiceChargesToday - totalTaxesToday
    const profitRate = totalSalesToday > 0 ? (netProfitToday / totalSalesToday) * 100 : 0

    // مرجوعی‌ها - اگر در orders موجود باشد
    let totalRefundsToday = 0
    const refundOrders = allTodayOrders.filter(order => 
      order.status === 'cancelled' || order.status === 'refunded'
    )
    refundOrders.forEach(order => {
      totalRefundsToday += order.total || 0
    })

    // محاسبه پرفروش‌ترین آیتم‌ها
    const itemSalesMap = new Map<string, { name: string; quantity: number; revenue: number }>()
    
    todayOrders.forEach(order => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item: any) => {
          const itemName = item.name || 'نامشخص'
          const quantity = item.quantity || 0
          const price = item.price || 0
          const revenue = quantity * price

          if (itemSalesMap.has(itemName)) {
            const existing = itemSalesMap.get(itemName)!
            existing.quantity += quantity
            existing.revenue += revenue
          } else {
            itemSalesMap.set(itemName, {
              name: itemName,
              quantity,
              revenue
            })
          }
        })
      }
    })

    // تبدیل به آرایه و مرتب‌سازی بر اساس revenue
    const topSellingItems = Array.from(itemSalesMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10) // فقط 10 آیتم برتر

    // محاسبه فروش ساعتی
    const hourlySalesMap = new Map<number, { hour: string; sales: number; orders: number }>()
    
    // مقداردهی اولیه برای تمام ساعات (0 تا 23)
    for (let i = 0; i < 24; i++) {
      hourlySalesMap.set(i, {
        hour: `${String(i).padStart(2, '0')}:00`,
        sales: 0,
        orders: 0
      })
    }

    todayOrders.forEach(order => {
      // استخراج ساعت از orderTime یا createdAt
      let orderDate: Date | null = null
      
      if (order.orderTime) {
        if (typeof order.orderTime === 'string') {
          orderDate = new Date(order.orderTime)
        } else if (order.orderTime instanceof Date) {
          orderDate = order.orderTime
        }
      } else if (order.createdAt) {
        if (typeof order.createdAt === 'string') {
          orderDate = new Date(order.createdAt)
        } else if (order.createdAt instanceof Date) {
          orderDate = order.createdAt
        }
      }

      if (orderDate && !isNaN(orderDate.getTime())) {
        const hour = orderDate.getHours()
        const existing = hourlySalesMap.get(hour)!
        existing.sales += order.total || 0
        existing.orders += 1
      }
    })

    // تبدیل به آرایه و مرتب‌سازی بر اساس ساعت
    const hourlySales = Array.from(hourlySalesMap.values())
      .sort((a, b) => parseInt(a.hour.split(':')[0]) - parseInt(b.hour.split(':')[0]))

    // محاسبه آمار دیروز برای درصد تغییر
    const allYesterdayOrders = await ordersCollection.find(yesterdayFilter).toArray()
    const yesterdayOrders = allYesterdayOrders.filter(order => 
      ['completed', 'paid', 'delivered'].includes(order.status)
    )
    
    console.log('[DAILY_REPORT_STATS] All yesterday orders:', allYesterdayOrders.length)
    console.log('[DAILY_REPORT_STATS] Completed/paid/delivered yesterday orders:', yesterdayOrders.length)
    
    // محاسبه آمار دیروز
    let totalSalesYesterday = 0
    let cashSalesYesterday = 0
    let cardSalesYesterday = 0
    let creditSalesYesterday = 0
    let totalDiscountsYesterday = 0
    let totalTaxesYesterday = 0
    let totalServiceChargesYesterday = 0

    yesterdayOrders.forEach(order => {
      const total = order.total || 0
      totalSalesYesterday += total

      const paymentMethod = order.paymentMethod || 'cash'
      if (paymentMethod === 'cash' || paymentMethod === 'نقدی') {
        cashSalesYesterday += total
      } else if (paymentMethod === 'card' || paymentMethod === 'کارتخوان') {
        cardSalesYesterday += total
      } else if (paymentMethod === 'credit' || paymentMethod === 'اعتباری') {
        creditSalesYesterday += total
      }

      totalDiscountsYesterday += order.discount || 0
      totalTaxesYesterday += order.tax || 0
      totalServiceChargesYesterday += order.serviceCharge || 0
    })

    const totalOrdersYesterday = yesterdayOrders.length

    const uniqueCustomersYesterday = new Set<string>()
    yesterdayOrders.forEach(order => {
      if (order.customerId) {
        uniqueCustomersYesterday.add(order.customerId.toString())
      } else if (order.customerPhone) {
        uniqueCustomersYesterday.add(order.customerPhone.trim())
      } else if (order.customerName) {
        uniqueCustomersYesterday.add(order.customerName.trim())
      }
    })
    const totalCustomersYesterday = uniqueCustomersYesterday.size

    // محاسبه درصد تغییر
    const salesChange = totalSalesYesterday > 0 
      ? ((totalSalesToday - totalSalesYesterday) / totalSalesYesterday) * 100 
      : (totalSalesToday > 0 ? 100 : 0)

    const ordersChange = totalOrdersYesterday > 0
      ? ((totalOrdersToday - totalOrdersYesterday) / totalOrdersYesterday) * 100
      : (totalOrdersToday > 0 ? 100 : 0)

    const customersChange = totalCustomersYesterday > 0
      ? ((totalCustomersToday - totalCustomersYesterday) / totalCustomersYesterday) * 100
      : (totalCustomersToday > 0 ? 100 : 0)

    console.log('[DAILY_REPORT_STATS] Results:', {
      totalSalesToday,
      cashSalesToday,
      cardSalesToday,
      creditSalesToday,
      totalDiscountsToday,
      totalTaxesToday,
      totalServiceChargesToday,
      totalRefundsToday,
      totalOrdersToday,
      totalCustomersToday,
      totalSalesYesterday,
      totalOrdersYesterday,
      totalCustomersYesterday,
      salesChange,
      ordersChange,
      customersChange
    })

    return NextResponse.json({
      success: true,
      data: {
        totalSales: totalSalesToday,
        totalOrders: totalOrdersToday,
        totalCustomers: totalCustomersToday,
        salesChange: salesChange,
        ordersChange: ordersChange,
        customersChange: customersChange,
        // تجزیه فروش
        cashSales: cashSalesToday,
        cardSales: cardSalesToday,
        creditSales: creditSalesToday,
        // کسرها
        refunds: totalRefundsToday,
        discounts: totalDiscountsToday,
        taxes: totalTaxesToday,
        serviceCharges: totalServiceChargesToday,
        // خلاصه مالی
        netSales: netSalesToday,
        netProfit: netProfitToday,
        profitRate: profitRate,
        // پرفروش‌ترین آیتم‌ها
        topSellingItems: topSellingItems,
        // فروش ساعتی
        hourlySales: hourlySales,
        yesterday: {
          totalSales: totalSalesYesterday,
          totalOrders: totalOrdersYesterday,
          totalCustomers: totalCustomersYesterday,
          cashSales: cashSalesYesterday,
          cardSales: cardSalesYesterday,
          creditSales: creditSalesYesterday,
          discounts: totalDiscountsYesterday,
          taxes: totalTaxesYesterday,
          serviceCharges: totalServiceChargesYesterday
        }
      },
      date: today.toISOString().split('T')[0]
    })
  } catch (error) {
    console.error('Error fetching daily report stats:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'خطا در دریافت آمار روزانه',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

