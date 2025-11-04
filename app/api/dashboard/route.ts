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

// GET - داشبورد جامع مدیریتی (چشم مدیر 👁️)
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()
    
    const { searchParams } = new URL(request.url)
    const branchId = searchParams.get('branchId')
    const date = searchParams.get('date') // تاریخ خاص (پیش‌فرض: امروز)

    // تاریخ امروز
    const today = date ? new Date(date) : new Date()
    today.setHours(0, 0, 0, 0)
    const endOfToday = new Date(today)
    endOfToday.setHours(23, 59, 59, 999)

    // دیروز
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    // هفته گذشته
    const lastWeek = new Date(today)
    lastWeek.setDate(lastWeek.getDate() - 7)

    // ماه گذشته
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0)

    // Collections
    const invoicesCollection = db.collection('invoices')
    const ordersCollection = db.collection('orders')
    const menuItemsCollection = db.collection('menu_items')
    const customerLoyaltiesCollection = db.collection('customer_loyalties')
    const inventoryCollection = db.collection('inventory_items')
    const stockAlertsCollection = db.collection('stock_alerts')
    const itemLedgerCollection = db.collection('item_ledger')
    const customersCollection = db.collection('customers')
    const cashierSessionsCollection = db.collection('cashier_sessions')
    const receiptsPaymentsCollection = db.collection('receipts_payments')

    // ==========================================
    // 1. فروش امروز چقدر بوده؟ 💰
    // ==========================================
    const todaySalesFilter: any = {
      type: 'sales',
      status: { $ne: 'cancelled' },
      $or: [
        { date: { $gte: today, $lte: endOfToday } },
        { createdAt: { $gte: today.toISOString(), $lte: endOfToday.toISOString() } }
      ]
    }
    if (branchId && branchId !== 'all') {
      try {
        todaySalesFilter.branchId = new ObjectId(branchId)
      } catch {
        todaySalesFilter.branchId = branchId
      }
    }

    const todayInvoices = await invoicesCollection.find(todaySalesFilter).toArray()
    const todaySales = todayInvoices.reduce((sum: number, inv: any) => sum + (inv.totalAmount || 0), 0)
    const todayOrders = todayInvoices.length

    // فروش دیروز برای مقایسه
    const yesterdaySalesFilter: any = {
      type: 'sales',
      status: { $ne: 'cancelled' },
      $or: [
        { date: { $gte: yesterday, $lt: today } },
        { createdAt: { $gte: yesterday.toISOString(), $lt: today.toISOString() } }
      ]
    }
    if (branchId && branchId !== 'all') {
      try {
        yesterdaySalesFilter.branchId = new ObjectId(branchId)
      } catch {
        yesterdaySalesFilter.branchId = branchId
      }
    }

    const yesterdayInvoices = await invoicesCollection.find(yesterdaySalesFilter).toArray()
    const yesterdaySales = yesterdayInvoices.reduce((sum: number, inv: any) => sum + (inv.totalAmount || 0), 0)
    const salesChange = yesterdaySales > 0 ? ((todaySales - yesterdaySales) / yesterdaySales) * 100 : 0

    // ==========================================
    // 2. بیشترین سفارش مربوط به کدام غذاست؟ 🍕
    // ==========================================
    const menuItemsMap = new Map()
    const menuItems = await menuItemsCollection.find({}).toArray()
    menuItems.forEach((item: any) => {
      menuItemsMap.set(item._id.toString(), item)
    })

    // شمارش سفارشات هر غذا از invoices امروز
    const itemSales: any = {}
    todayInvoices.forEach((inv: any) => {
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

    // همچنین از orders امروز
    const todayOrdersFilter: any = {
      $or: [
        { createdAt: { $gte: today.toISOString(), $lte: endOfToday.toISOString() } },
        { orderTime: { $gte: today, $lte: endOfToday } }
      ]
    }
    if (branchId && branchId !== 'all') {
      try {
        todayOrdersFilter.branchId = new ObjectId(branchId)
      } catch {
        todayOrdersFilter.branchId = branchId
      }
    }

    const todayOrdersList = await ordersCollection.find(todayOrdersFilter).toArray()
    todayOrdersList.forEach((order: any) => {
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

    const topSellingItems = Object.values(itemSales)
      .sort((a: any, b: any) => b.quantity - a.quantity)
      .slice(0, 10)

    // ==========================================
    // 3. مشتریان وفادار کیان؟ 👑
    // ==========================================
    const loyalCustomers = await customerLoyaltiesCollection
      .find({
        status: 'active'
      })
      .sort({ totalPoints: -1 })
      .limit(10)
      .toArray()

    // محاسبه رشد مشتریان وفادار
    const totalLoyalCustomers = await customerLoyaltiesCollection.countDocuments({ status: 'active' })
    const newLoyalCustomersThisMonth = await customerLoyaltiesCollection.countDocuments({
      status: 'active',
      createdAt: { $gte: lastMonth.toISOString() }
    })

    // ==========================================
    // 4. مواد اولیه تا چند روز دیگر تمام می‌شوند؟ ⚠️
    // ==========================================
    const allInventoryItems = await inventoryCollection.find({}).toArray()
    const stockAlerts = await stockAlertsCollection.find({ status: 'active' }).toArray()

    // محاسبه زمان تمام شدن موجودی بر اساس مصرف متوسط
    const inventoryItemsWithDaysRemaining = []
    for (const item of allInventoryItems) {
      const stock = item.currentStock || 0
      const minStock = item.minStock || 0
      const unit = item.unit || 'عدد'

      if (stock <= minStock) {
        // محاسبه مصرف متوسط در 30 روز گذشته
        const thirtyDaysAgo = new Date(today)
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const consumptionEntries = await itemLedgerCollection
          .find({
            itemId: item._id.toString(),
            documentType: 'sale',
            date: { $gte: thirtyDaysAgo }
          })
          .toArray()

        const totalConsumption = consumptionEntries.reduce((sum: number, entry: any) => {
          return sum + (entry.quantityOut || 0)
        }, 0)

        const averageDailyConsumption = totalConsumption / 30

        let daysRemaining = 0
        if (averageDailyConsumption > 0) {
          daysRemaining = Math.floor(stock / averageDailyConsumption)
        } else if (stock > 0) {
          daysRemaining = 999 // اگر مصرف صفر است، هنوز موجودی دارد
        } else {
          daysRemaining = 0 // تمام شده
        }

        inventoryItemsWithDaysRemaining.push({
          itemId: item._id.toString(),
          name: item.name,
          code: item.code,
          currentStock: stock,
          minStock: minStock,
          unit: unit,
          daysRemaining,
          averageDailyConsumption,
          isOutOfStock: stock === 0,
          alert: stockAlerts.find((alert: any) => alert.itemId === item._id.toString())
        })
      }
    }

    // مرتب‌سازی بر اساس daysRemaining
    inventoryItemsWithDaysRemaining.sort((a, b) => a.daysRemaining - b.daysRemaining)

    // ==========================================
    // 5. سود ناخالص چقدر بوده؟ 📊
    // ==========================================
    // Revenue (درآمد) - از invoices امروز
    const revenue = todaySales

    // COGS (بهای تمام شده کالا) - از item_ledger امروز
    const todayLedgerFilter: any = {
      documentType: 'sale',
      date: { $gte: today, $lte: endOfToday }
    }

    const todaySaleEntries = await itemLedgerCollection.find(todayLedgerFilter).toArray()
    let costOfGoodsSold = 0
    for (const entry of todaySaleEntries) {
      if (entry.quantityOut > 0) {
        const cost = (entry.quantityOut || 0) * (entry.averagePrice || entry.unitPrice || 0)
        costOfGoodsSold += cost
      }
    }

    // Gross Profit
    const grossProfit = revenue - costOfGoodsSold
    const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0

    // ==========================================
    // آمارهای اضافی
    // ==========================================
    // مشتریان فعال امروز
    const todayCustomersSet = new Set(
      todayInvoices
        .map((inv: any) => (inv.customerId || inv.customer_id)?.toString())
        .filter(Boolean)
    )
    const todayActiveCustomers = todayCustomersSet.size

    // متوسط ارزش سفارش امروز
    const averageOrderValue = todayOrders > 0 ? todaySales / todayOrders : 0

    // روش‌های پرداخت امروز
    const paymentMethodsData: any = {}
    todayInvoices.forEach((inv: any) => {
      const method = inv.paymentMethod || 'cash'
      const amount = inv.totalAmount || 0

      if (!paymentMethodsData[method]) {
        paymentMethodsData[method] = {
          method,
          amount: 0,
          count: 0
        }
      }

      paymentMethodsData[method].amount += amount
      paymentMethodsData[method].count += 1
    })

    const paymentMethods = Object.values(paymentMethodsData).map((method: any) => ({
      ...method,
      percentage: todaySales > 0 ? (method.amount / todaySales) * 100 : 0
    }))

    // وضعیت صندوق‌ها
    const openCashierSessions = await cashierSessionsCollection
      .find({ status: 'open' })
      .toArray()

    const cashierSessionsSummary = openCashierSessions.map((session: any) => ({
      sessionId: session._id.toString(),
      userId: session.userId,
      branchId: session.branchId?.toString(),
      startAmount: session.startAmount || 0,
      totalSales: session.totalSales || 0,
      cashSales: session.cashSales || 0,
      cardSales: session.cardSales || 0,
      expectedCash: (session.startAmount || 0) + (session.cashSales || 0),
      expectedCard: session.cardSales || 0
    }))

    // ==========================================
    // جمع‌بندی
    // ==========================================
    return NextResponse.json({
      success: true,
      data: {
        // 1. فروش امروز
        todaySales: {
          amount: todaySales,
          orders: todayOrders,
          customers: todayActiveCustomers,
          averageOrderValue,
          change: salesChange,
          comparison: {
            today: todaySales,
            yesterday: yesterdaySales,
            change: todaySales - yesterdaySales
          }
        },

        // 2. بیشترین سفارش
        topSellingItems: topSellingItems.map((item: any, index: number) => ({
          rank: index + 1,
          ...item
        })),

        // 3. مشتریان وفادار
        loyalCustomers: loyalCustomers.map((customer: any, index: number) => ({
          rank: index + 1,
          customerId: customer.customerId,
          customerName: customer.customerName,
          totalPoints: customer.totalPoints || 0,
          currentTier: customer.currentTier || 'Bronze',
          totalOrders: customer.totalOrders || 0,
          totalSpent: customer.totalSpent || 0
        })),
        loyalCustomersStats: {
          total: totalLoyalCustomers,
          newThisMonth: newLoyalCustomersThisMonth
        },

        // 4. مواد اولیه در حال اتمام
        inventoryAlerts: {
          critical: inventoryItemsWithDaysRemaining.filter(item => item.daysRemaining <= 3 || item.isOutOfStock),
          warning: inventoryItemsWithDaysRemaining.filter(item => item.daysRemaining > 3 && item.daysRemaining <= 7),
          totalAlerts: stockAlerts.length,
          activeAlerts: stockAlerts.filter((alert: any) => alert.status === 'active').length,
          itemsRunningOut: inventoryItemsWithDaysRemaining.slice(0, 10) // 10 مورد اول
        },

        // 5. سود ناخالص
        grossProfit: {
          revenue,
          costOfGoodsSold,
          grossProfit,
          grossMargin: grossMargin.toFixed(2),
          period: 'امروز'
        },

        // آمارهای اضافی
        additionalStats: {
          paymentMethods,
          cashierSessions: {
            open: openCashierSessions.length,
            summary: cashierSessionsSummary
          },
          inventorySummary: {
            totalItems: allInventoryItems.length,
            lowStockItems: allInventoryItems.filter(item => {
              const stock = item.currentStock || 0
              const min = item.minStock || 0
              return stock <= min || item.isLowStock
            }).length,
            outOfStockItems: allInventoryItems.filter(item => (item.currentStock || 0) === 0).length
          }
        }
      },
      message: 'داشبورد مدیریتی با موفقیت دریافت شد'
    })
  } catch (error) {
    console.error('Error generating dashboard:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در تولید داشبورد',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

