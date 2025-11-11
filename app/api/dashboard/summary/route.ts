import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://restorenUser:1234@localhost:27017/restoren'
const DB_NAME = 'restoren'

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
    
    // Test connection
    if (db) {
      try {
        await db.admin().ping()
      } catch (pingError) {
        console.warn('MongoDB ping failed, but continuing:', pingError)
      }
    }
    
    if (!db) {
      throw new Error('Database connection failed: db is null')
    }
    
    return db
  } catch (error) {
    console.error('Database connection error:', error)
    // Reset connection on error
    if (client) {
      try {
        await client.close()
      } catch (e) {
        // Ignore close errors
      }
      client = undefined
    }
    db = null
    throw error
  }
}

// GET - خلاصه گزارشات سریع (برای کارت‌های داشبورد)
export async function GET(request: NextRequest) {
  try {
    const db = await connectToDatabase()
    if (!db) {
      return NextResponse.json(
        { success: false, message: 'خطا در اتصال به دیتابیس' },
        { status: 500 }
      )
    }
    
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

    // موجودی کم - استفاده از inventory_balance برای موجودی واقعی
    const inventoryBalanceCollection = db.collection('inventory_balance')
    const inventoryItems = await inventoryCollection.find({}).toArray()
    
    // دریافت موجودی واقعی از inventory_balance
    const balances = await inventoryBalanceCollection.find({}).toArray()
    const balanceMap = new Map()
    balances.forEach((balance: any) => {
      const itemId = balance.itemId?.toString()
      if (itemId) {
        if (!balanceMap.has(itemId)) {
          balanceMap.set(itemId, 0)
        }
        balanceMap.set(itemId, balanceMap.get(itemId) + (balance.quantity || 0))
      }
    })
    
    const lowStockItems = inventoryItems.filter((item: any) => {
      const itemId = item._id.toString()
      // استفاده از موجودی واقعی از inventory_balance
      const stock = balanceMap.get(itemId) || item.currentStock || 0
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

