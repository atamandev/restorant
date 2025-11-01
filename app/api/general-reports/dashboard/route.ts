import { NextRequest, NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'

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

// GET - دریافت آمار dashboard
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()
    
    const invoicesCollection = db.collection('invoices')
    const ordersCollection = db.collection('orders')
    const customersCollection = db.collection('customers')
    const inventoryCollection = db.collection('inventory_items')
    const generalReportsCollection = db.collection('general_reports')
    
    // امروز
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // دیروز
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    // هفته قبل
    const lastWeek = new Date(today)
    lastWeek.setDate(lastWeek.getDate() - 7)
    
    // فروش امروز
    const todayInvoices = await invoicesCollection.find({
      type: 'sales',
      $or: [
        { date: { $gte: today } },
        { createdAt: { $gte: today } }
      ]
    }).toArray()
    
    const todaySales = todayInvoices.reduce((sum: number, inv: any) => sum + (inv.totalAmount || inv.total || 0), 0)
    const todayOrders = todayInvoices.length
    
    // فروش دیروز
    const yesterdayInvoices = await invoicesCollection.find({
      type: 'sales',
      $or: [
        { date: { $gte: yesterday, $lt: today } },
        { createdAt: { $gte: yesterday, $lt: today } }
      ]
    }).toArray()
    
    const yesterdaySales = yesterdayInvoices.reduce((sum: number, inv: any) => sum + (inv.totalAmount || inv.total || 0), 0)
    const salesChange = yesterdaySales > 0 ? ((todaySales - yesterdaySales) / yesterdaySales) * 100 : 0
    
    // سفارشات جدید
    const yesterdayOrders = yesterdayInvoices.length
    const ordersChange = yesterdayOrders > 0 ? ((todayOrders - yesterdayOrders) / yesterdayOrders) * 100 : 0
    
    // مشتریان فعال (مشتریانی که در هفته گذشته خرید کرده‌اند)
    const activeCustomersInvoices = await invoicesCollection.find({
      type: 'sales',
      $or: [
        { date: { $gte: lastWeek } },
        { createdAt: { $gte: lastWeek } }
      ]
    }).toArray()
    
    const activeCustomersSet = new Set(
      activeCustomersInvoices
        .map((inv: any) => (inv.customerId || inv.customer_id)?.toString())
        .filter(Boolean)
    )
    const activeCustomers = activeCustomersSet.size
    
    const allCustomers = await customersCollection.countDocuments()
    const customersChange = allCustomers > 0 ? ((activeCustomers - allCustomers) / allCustomers) * 100 : 0
    
    // موجودی کم
    const allItems = await inventoryCollection.find({}).toArray()
    const lowStockItems = allItems.filter((item: any) => {
      const stock = item.currentStock || 0
      const min = item.minStock || 0
      return stock <= min || item.isLowStock
    }).length
    
    // آمار گزارشات
    const totalReports = await generalReportsCollection.countDocuments()
    const scheduledReports = await generalReportsCollection.countDocuments({ isScheduled: true })
    const publicReports = await generalReportsCollection.countDocuments({ isPublic: true })
    
    const todayReports = await generalReportsCollection.countDocuments({
      $or: [
        { lastUpdated: { $gte: today.toISOString() } },
        { createdAt: { $gte: today.toISOString() } }
      ]
    })
    
    const widgets = [
      {
        id: '1',
        title: 'فروش امروز',
        value: `${todaySales.toLocaleString('fa-IR')} تومان`,
        change: Math.round(salesChange * 10) / 10,
        changeType: salesChange >= 0 ? 'increase' : 'decrease',
        color: 'green'
      },
      {
        id: '2',
        title: 'سفارشات جدید',
        value: `${todayOrders} سفارش`,
        change: Math.round(ordersChange * 10) / 10,
        changeType: ordersChange >= 0 ? 'increase' : 'decrease',
        color: 'blue'
      },
      {
        id: '3',
        title: 'مشتریان فعال',
        value: `${activeCustomers} مشتری`,
        change: Math.round(Math.abs(customersChange) * 10) / 10,
        changeType: customersChange >= 0 ? 'increase' : 'decrease',
        color: 'purple'
      },
      {
        id: '4',
        title: 'موجودی کم',
        value: `${lowStockItems} آیتم`,
        change: 0,
        changeType: 'increase',
        color: 'red'
      }
    ]
    
    const stats = {
      totalReports,
      scheduledReports,
      publicReports,
      recentReports: todayReports
    }
    
    return NextResponse.json({
      success: true,
      data: {
        widgets,
        stats
      }
    })
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت آمار', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

