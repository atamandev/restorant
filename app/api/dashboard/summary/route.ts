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

// GET - خلاصه گزارشات سریع (برای کارت‌های داشبورد)
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()
    
    const { searchParams } = new URL(request.url)
    const branchId = searchParams.get('branchId')
    const period = searchParams.get('period') || 'today' // today, week, month

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const endOfToday = new Date(today)
    endOfToday.setHours(23, 59, 59, 999)

    let startDate = new Date(today)
    let endDate = new Date(endOfToday)

    switch (period) {
      case 'week':
        startDate = new Date(today)
        startDate.setDate(startDate.getDate() - 7)
        break
      case 'month':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1)
        break
      default:
        startDate = today
    }

    const invoicesCollection = db.collection('invoices')
    const ordersCollection = db.collection('orders')
    const customersCollection = db.collection('customers')
    const inventoryCollection = db.collection('inventory_items')
    const stockAlertsCollection = db.collection('stock_alerts')
    const cashierSessionsCollection = db.collection('cashier_sessions')

    const filter: any = {
      type: 'sales',
      status: { $ne: 'cancelled' },
      $or: [
        { date: { $gte: startDate, $lte: endDate } },
        { createdAt: { $gte: startDate.toISOString(), $lte: endDate.toISOString() } }
      ]
    }
    if (branchId && branchId !== 'all') {
      try {
        filter.branchId = new ObjectId(branchId)
      } catch {
        filter.branchId = branchId
      }
    }

    const invoices = await invoicesCollection.find(filter).toArray()

    // کل فروش
    const totalSales = invoices.reduce((sum: number, inv: any) => sum + (inv.totalAmount || 0), 0)

    // تعداد سفارشات
    const totalOrders = invoices.length

    // تعداد مشتریان
    const customersSet = new Set(
      invoices
        .map((inv: any) => (inv.customerId || inv.customer_id)?.toString())
        .filter(Boolean)
    )
    const totalCustomers = customersSet.size

    // موجودی کم
    const inventoryItems = await inventoryCollection.find({}).toArray()
    const lowStockItems = inventoryItems.filter((item: any) => {
      const stock = item.currentStock || 0
      const min = item.minStock || 0
      return stock <= min || item.isLowStock
    }).length

    // هشدارهای فعال
    const activeAlerts = await stockAlertsCollection.countDocuments({ status: 'active' })

    // صندوق‌های باز
    const openCashierSessions = await cashierSessionsCollection.countDocuments({ status: 'open' })

    return NextResponse.json({
      success: true,
      data: {
        totalSales,
        totalOrders,
        totalCustomers,
        lowStockItems,
        activeAlerts,
        openCashierSessions,
        period
      },
      message: 'خلاصه گزارشات با موفقیت دریافت شد'
    })
  } catch (error) {
    console.error('Error generating summary:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در تولید خلاصه گزارشات',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

