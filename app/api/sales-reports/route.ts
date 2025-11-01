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

// Helper function to fetch invoices with date filter
async function fetchSalesInvoices(invoicesCollection: any, dateFilter: any) {
  let invoices: any[] = []
  
  // اول با date امتحان کن
  try {
    invoices = await invoicesCollection.find({
      type: 'sales',
      date: { $gte: dateFilter.$gte, $lte: dateFilter.$lte },
      status: { $ne: 'cancelled' }
    }).toArray()
  } catch (e) {
    console.error('Error fetching with date field:', e)
  }
  
  // اگر نتیجه خالی بود، با createdAt امتحان کن
  if (invoices.length === 0) {
    try {
      invoices = await invoicesCollection.find({
        type: 'sales',
        createdAt: { $gte: dateFilter.$gte, $lte: dateFilter.$lte },
        status: { $ne: 'cancelled' }
      }).toArray()
    } catch (e) {
      console.error('Error fetching with createdAt field:', e)
    }
  }
  
  return invoices || []
}

// GET - گزارشات فروش
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()
    const invoicesCollection = db.collection('invoices')
    const ordersCollection = db.collection('orders')
    const receiptsPaymentsCollection = db.collection('receipts_payments')
    const menuItemsCollection = db.collection('menu_items')
    const customersCollection = db.collection('customers')
    
    const { searchParams } = new URL(request.url)
    const reportType = searchParams.get('reportType') || 'summary' // summary, daily, category, payment
    const dateRange = searchParams.get('dateRange') || 'week' // week, month, quarter, year
    const fromDate = searchParams.get('fromDate')
    const toDate = searchParams.get('toDate')
    const selectedPeriod = searchParams.get('period') || 'daily' // daily, weekly, monthly

    // محاسبه بازه زمانی
    const now = new Date()
    let startDate = new Date()
    let endDate = new Date()
    
    if (fromDate && toDate) {
      startDate = new Date(fromDate)
      endDate = new Date(toDate)
    } else {
      switch (dateRange) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          break
        case 'quarter':
          const quarter = Math.floor(now.getMonth() / 3)
          startDate = new Date(now.getFullYear(), quarter * 3, 1)
          break
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1)
          break
      }
    }

    // اطمینان از اینکه تاریخ‌ها معتبر هستند
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { success: false, message: 'تاریخ نامعتبر است' },
        { status: 400 }
      )
    }

    const dateFilter: any = {
      $gte: startDate,
      $lte: endDate
    }

    switch (reportType) {
      case 'summary':
        return await getSummaryReport(invoicesCollection, ordersCollection, dateFilter)
      case 'daily':
        return await getDailyReport(invoicesCollection, ordersCollection, dateFilter, selectedPeriod)
      case 'category':
        return await getCategoryReport(invoicesCollection, menuItemsCollection, dateFilter)
      case 'payment':
        return await getPaymentMethodReport(receiptsPaymentsCollection, invoicesCollection, dateFilter)
      default:
        return await getSummaryReport(invoicesCollection, ordersCollection, dateFilter)
    }
  } catch (error) {
    console.error('Error generating sales report:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در تولید گزارش', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// گزارش خلاصه
async function getSummaryReport(invoicesCollection: any, ordersCollection: any, dateFilter: any) {
  try {
    const salesInvoices = await fetchSalesInvoices(invoicesCollection, dateFilter)

    // محاسبه آمار
    const totalSales = salesInvoices.reduce((sum: number, inv: any) => sum + (inv.totalAmount || inv.total || 0), 0)
    const totalOrders = salesInvoices.length
    const totalCustomers = new Set(salesInvoices.map((inv: any) => (inv.customerId || inv.customer_id)?.toString()).filter(Boolean)).size
    const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0

    // محاسبه رشد (مقایسه با دوره قبل)
    const periodDuration = dateFilter.$lte.getTime() - dateFilter.$gte.getTime()
    const previousStartDate = new Date(dateFilter.$gte.getTime() - periodDuration)
    const previousEndDate = new Date(dateFilter.$gte.getTime() - 1)
    
    const previousDateFilter = {
      $gte: previousStartDate,
      $lte: previousEndDate
    }
    const previousSalesInvoices = await fetchSalesInvoices(invoicesCollection, previousDateFilter)
    
    const previousTotalSales = previousSalesInvoices.reduce((sum: number, inv: any) => sum + (inv.totalAmount || inv.total || 0), 0)
    const salesGrowth = previousTotalSales > 0 ? ((totalSales - previousTotalSales) / previousTotalSales) * 100 : 0

    const previousTotalOrders = previousSalesInvoices.length
    const orderGrowth = previousTotalOrders > 0 ? ((totalOrders - previousTotalOrders) / previousTotalOrders) * 100 : 0

    return NextResponse.json({
      success: true,
      data: {
        totalSales,
        totalOrders,
        totalCustomers,
        averageOrderValue,
        salesGrowth,
        orderGrowth
      }
    })
  } catch (error) {
    console.error('Error in getSummaryReport:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در تولید گزارش خلاصه', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// گزارش روزانه
async function getDailyReport(invoicesCollection: any, ordersCollection: any, dateFilter: any, period: string) {
  try {
    const salesInvoices = await fetchSalesInvoices(invoicesCollection, dateFilter)

    // گروه‌بندی بر اساس دوره
    const groupedData: any = {}
    
    salesInvoices.forEach((inv: any) => {
      // استفاده از date یا createdAt
      const invoiceDate = inv.date ? new Date(inv.date) : (inv.createdAt ? new Date(inv.createdAt) : new Date())
      
      if (!invoiceDate || isNaN(invoiceDate.getTime())) {
        return // skip invalid dates
      }
      
      let key = ''
      
      if (period === 'daily') {
        key = invoiceDate.toISOString().split('T')[0]
      } else if (period === 'weekly') {
        const week = Math.ceil(invoiceDate.getDate() / 7)
        key = `${invoiceDate.getFullYear()}-W${week}`
      } else if (period === 'monthly') {
        key = `${invoiceDate.getFullYear()}-${String(invoiceDate.getMonth() + 1).padStart(2, '0')}`
      }

      if (!key) return

      if (!groupedData[key]) {
        groupedData[key] = {
          date: key,
          totalSales: 0,
          orderCount: 0,
          customerCount: new Set(),
          averageOrderValue: 0
        }
      }

      groupedData[key].totalSales += inv.totalAmount || inv.total || 0
      groupedData[key].orderCount += 1
      const customerId = inv.customerId || inv.customer_id
      if (customerId) {
        groupedData[key].customerCount.add(customerId.toString())
      }
    })

    const dailyData = Object.entries(groupedData).map(([date, data]: [string, any]) => ({
      date,
      totalSales: data.totalSales,
      orderCount: data.orderCount,
      customerCount: data.customerCount.size,
      averageOrderValue: data.orderCount > 0 ? data.totalSales / data.orderCount : 0
    })).sort((a, b) => a.date.localeCompare(b.date))

    return NextResponse.json({
      success: true,
      data: dailyData
    })
  } catch (error) {
    console.error('Error in getDailyReport:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در تولید گزارش روزانه', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// گزارش دسته‌بندی
async function getCategoryReport(invoicesCollection: any, menuItemsCollection: any, dateFilter: any) {
  try {
    const salesInvoices = await fetchSalesInvoices(invoicesCollection, dateFilter)

    // دریافت تمام آیتم‌های منو
    let menuItems: any[] = []
    try {
      menuItems = await menuItemsCollection.find({}).toArray()
    } catch (e) {
      console.error('Error fetching menu items:', e)
    }
    
    const menuItemsMap = new Map(menuItems.map((item: any) => [
      item._id?.toString() || item.id?.toString(), 
      item
    ]))

    // محاسبه فروش بر اساس دسته‌بندی
    const categorySales: any = {}
    let totalSales = 0

    salesInvoices.forEach((inv: any) => {
      if (inv.items && Array.isArray(inv.items)) {
        inv.items.forEach((item: any) => {
          const itemId = item.itemId?.toString() || item.menuItemId?.toString() || item.id?.toString()
          const menuItem = itemId ? menuItemsMap.get(itemId) : null
          const category = menuItem?.category || item.category || 'سایر'
          const itemTotal = (item.quantity || 0) * (item.price || item.unitPrice || 0)

          if (!categorySales[category]) {
            categorySales[category] = {
              category,
              sales: 0,
              orderCount: 0
            }
          }

          categorySales[category].sales += itemTotal
          categorySales[category].orderCount += 1
          totalSales += itemTotal
        })
      } else {
        // اگر items وجود ندارد، از totalAmount استفاده کن
        const category = 'سایر'
        const itemTotal = inv.totalAmount || inv.total || 0
        
        if (!categorySales[category]) {
          categorySales[category] = {
            category,
            sales: 0,
            orderCount: 0
          }
        }
        
        categorySales[category].sales += itemTotal
        categorySales[category].orderCount += 1
        totalSales += itemTotal
      }
    })

    const categoryData = Object.values(categorySales)
      .map((cat: any) => ({
        ...cat,
        percentage: totalSales > 0 ? Math.round((cat.sales / totalSales) * 100) : 0
      }))
      .sort((a: any, b: any) => b.sales - a.sales)

    return NextResponse.json({
      success: true,
      data: categoryData
    })
  } catch (error) {
    console.error('Error in getCategoryReport:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در تولید گزارش دسته‌بندی', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// گزارش روش‌های پرداخت
async function getPaymentMethodReport(receiptsPaymentsCollection: any, invoicesCollection: any, dateFilter: any) {
  try {
    // دریافت پرداخت‌های فروش از receipts_payments
    let salesReceipts: any[] = []
    try {
      salesReceipts = await receiptsPaymentsCollection.find({
        type: 'receipt',
        personType: 'customer',
        date: { $gte: dateFilter.$gte, $lte: dateFilter.$lte }
      }).toArray()
    } catch (e) {
      try {
        salesReceipts = await receiptsPaymentsCollection.find({
          type: 'receipt',
          personType: 'customer',
          createdAt: { $gte: dateFilter.$gte, $lte: dateFilter.$lte }
        }).toArray()
      } catch (e2) {
        console.error('Error fetching receipts:', e2)
      }
    }

    // همچنین از invoices هم استفاده کن
    const salesInvoices = await fetchSalesInvoices(invoicesCollection, dateFilter)

    // محاسبه بر اساس روش پرداخت
    const methodData: any = {}
    let totalAmount = 0

    // از receipts
    salesReceipts.forEach((receipt: any) => {
      const method = receipt.paymentMethod || receipt.method || 'cash'
      const amount = receipt.amount || 0

      if (!methodData[method]) {
        methodData[method] = {
          method: method === 'cash' ? 'نقدی' : method === 'card' ? 'کارتی' : method === 'cheque' ? 'چک' : method === 'bank_transfer' ? 'حواله' : 'اعتباری',
          amount: 0,
          count: 0
        }
      }

      methodData[method].amount += amount
      methodData[method].count += 1
      totalAmount += amount
    })

    // از invoices
    salesInvoices.forEach((inv: any) => {
      const method = inv.paymentMethod || inv.payment_method || 'cash'
      const amount = inv.totalAmount || inv.total || 0

      if (!methodData[method]) {
        methodData[method] = {
          method: method === 'cash' ? 'نقدی' : method === 'card' ? 'کارتی' : method === 'cheque' ? 'چک' : method === 'bank_transfer' ? 'حواله' : 'اعتباری',
          amount: 0,
          count: 0
        }
      }

      methodData[method].amount += amount
      methodData[method].count += 1
      totalAmount += amount
    })

    const paymentMethods = Object.values(methodData)
      .map((method: any) => ({
        ...method,
        percentage: totalAmount > 0 ? Math.round((method.amount / totalAmount) * 100) : 0
      }))
      .sort((a: any, b: any) => b.amount - a.amount)

    return NextResponse.json({
      success: true,
      data: paymentMethods
    })
  } catch (error) {
    console.error('Error in getPaymentMethodReport:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در تولید گزارش پرداخت', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
