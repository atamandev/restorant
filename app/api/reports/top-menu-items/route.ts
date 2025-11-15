import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://admin:StrongPassword123@185.204.169.107:27017/restaurant?authSource=admin'
const DB_NAME = 'restaurant'

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

// GET - بیشترین سفارش مربوط به کدام غذاست؟
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()
    
    const { searchParams } = new URL(request.url)
    const branchId = searchParams.get('branchId')
    const fromDate = searchParams.get('fromDate')
    const toDate = searchParams.get('toDate')
    const limit = parseInt(searchParams.get('limit') || '20')
    const sortBy = searchParams.get('sortBy') || 'quantity' // quantity, revenue, orders

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const endOfToday = new Date(today)
    endOfToday.setHours(23, 59, 59, 999)

    const startDate = fromDate ? new Date(fromDate) : today
    const endDate = toDate ? new Date(toDate) : endOfToday

    const invoicesCollection = db.collection('invoices')
    const ordersCollection = db.collection('orders')
    const menuItemsCollection = db.collection('menu_items')

    // دریافت تمام آیتم‌های منو
    const menuItems = await menuItemsCollection.find({}).toArray()
    const menuItemsMap = new Map(menuItems.map((item: any) => [item._id.toString(), item]))

    // فیلتر invoices
    const invoiceFilter: any = {
      type: 'sales',
      status: { $ne: 'cancelled' },
      $or: [
        { date: { $gte: startDate, $lte: endDate } },
        { createdAt: { $gte: startDate.toISOString(), $lte: endDate.toISOString() } }
      ]
    }
    if (branchId && branchId !== 'all') {
      try {
        invoiceFilter.branchId = new ObjectId(branchId)
      } catch {
        invoiceFilter.branchId = branchId
      }
    }

    const invoices = await invoicesCollection.find(invoiceFilter).toArray()

    // فیلتر orders
    const orderFilter: any = {
      $or: [
        { createdAt: { $gte: startDate.toISOString(), $lte: endDate.toISOString() } },
        { orderTime: { $gte: startDate, $lte: endDate } }
      ]
    }
    if (branchId && branchId !== 'all') {
      try {
        orderFilter.branchId = new ObjectId(branchId)
      } catch {
        orderFilter.branchId = branchId
      }
    }

    const orders = await ordersCollection.find(orderFilter).toArray()

    // شمارش سفارشات هر غذا
    const itemSales: any = {}

    // از invoices
    invoices.forEach((inv: any) => {
      if (inv.items && Array.isArray(inv.items)) {
        inv.items.forEach((item: any) => {
          const itemId = item.itemId?.toString() || item.menuItemId?.toString()
          const menuItem = itemId ? menuItemsMap.get(itemId) : null
          const itemName = menuItem?.name || item.name || 'نامشخص'
          const quantity = item.quantity || 0
          const revenue = item.total || (item.price || 0) * quantity

          if (!itemSales[itemName]) {
            itemSales[itemName] = {
              name: itemName,
              menuItemId: itemId,
              category: menuItem?.category || item.category || 'سایر',
              image: menuItem?.image || item.image || null,
              quantity: 0,
              revenue: 0,
              orderCount: 0
            }
          }

          itemSales[itemName].quantity += quantity
          itemSales[itemName].revenue += revenue
          itemSales[itemName].orderCount += 1
        })
      }
    })

    // از orders
    orders.forEach((order: any) => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item: any) => {
          const itemId = item.menuItemId?.toString()
          const menuItem = itemId ? menuItemsMap.get(itemId) : null
          const itemName = menuItem?.name || item.name || 'نامشخص'
          const quantity = item.quantity || 0
          const revenue = item.total || (item.price || 0) * quantity

          if (!itemSales[itemName]) {
            itemSales[itemName] = {
              name: itemName,
              menuItemId: itemId,
              category: menuItem?.category || item.category || 'سایر',
              image: menuItem?.image || item.image || null,
              quantity: 0,
              revenue: 0,
              orderCount: 0
            }
          }

          itemSales[itemName].quantity += quantity
          itemSales[itemName].revenue += revenue
          itemSales[itemName].orderCount += 1
        })
      }
    })

    // مرتب‌سازی
    const sortedItems = Object.values(itemSales)
      .sort((a: any, b: any) => {
        switch (sortBy) {
          case 'revenue':
            return b.revenue - a.revenue
          case 'orders':
            return b.orderCount - a.orderCount
          default:
            return b.quantity - a.quantity
        }
      })
      .slice(0, limit)

    // محاسبه کل فروش برای درصد
    const totalRevenue = sortedItems.reduce((sum: number, item: any) => sum + item.revenue, 0)

    const topItems = sortedItems.map((item: any, index: number) => ({
      rank: index + 1,
      ...item,
      percentage: totalRevenue > 0 ? ((item.revenue / totalRevenue) * 100).toFixed(2) : 0
    }))

    return NextResponse.json({
      success: true,
      data: topItems,
      summary: {
        totalItems: Object.keys(itemSales).length,
        totalRevenue,
        period: {
          from: startDate.toISOString(),
          to: endDate.toISOString()
        }
      },
      message: 'بیشترین سفارش‌ها با موفقیت دریافت شد'
    })
  } catch (error) {
    console.error('Error fetching top menu items:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در دریافت بیشترین سفارش‌ها',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

