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

// GET - دریافت تمام گزارشات عمومی
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()
    
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'all'
    const category = searchParams.get('category') || 'all'
    const sortBy = searchParams.get('sortBy') || 'lastUpdated'
    
    // دریافت گزارشات کاربر-ساخت از دیتابیس
    const reportsCollection = db.collection('general_reports')
    const userReports = await reportsCollection.find({}).toArray()
    
    // تبدیل _id به string برای consistency
    const formattedUserReports = userReports.map((report: any) => ({
      ...report,
      id: report._id.toString(),
      _id: report._id.toString()
    }))
    
    // دریافت داده‌های مختلف
    const invoicesCollection = db.collection('invoices')
    const ordersCollection = db.collection('orders')
    const inventoryCollection = db.collection('inventory_items')
    const customersCollection = db.collection('customers')
    const receiptsPaymentsCollection = db.collection('receipts_payments')
    
    const reports: any[] = [...formattedUserReports]
    
    // گزارش فروش
    if (type === 'all' || type === 'sales') {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const salesInvoices = await invoicesCollection.find({
        type: 'sales',
        $or: [
          { date: { $gte: today } },
          { createdAt: { $gte: today } }
        ]
      }).toArray()
      
      const totalSales = salesInvoices.reduce((sum: number, inv: any) => sum + (inv.totalAmount || inv.total || 0), 0)
      const orderCount = salesInvoices.length
      const averageOrder = orderCount > 0 ? totalSales / orderCount : 0
      
      if (salesInvoices.length > 0 || type === 'sales') {
        reports.push({
          id: 'sales-daily',
          _id: 'sales-daily',
          title: 'گزارش فروش روزانه',
          description: 'گزارش کامل فروش روزانه با جزئیات سفارشات',
          type: 'sales',
          category: 'فروش',
          data: {
            totalSales,
            orderCount,
            averageOrder: Math.round(averageOrder)
          },
          lastUpdated: new Date().toISOString(),
          isScheduled: true,
          scheduleFrequency: 'روزانه',
          isPublic: true,
          createdBy: 'سیستم'
        })
      }
    }
    
    // گزارش موجودی
    if (type === 'all' || type === 'inventory') {
      const items = await inventoryCollection.find({}).toArray()
      const totalItems = items.length
      const lowStockItems = items.filter((item: any) => {
        const stock = item.currentStock || 0
        const min = item.minStock || 0
        return stock <= min || item.isLowStock
      }).length
      const totalValue = items.reduce((sum: number, item: any) => {
        const stock = item.currentStock || 0
        const price = item.unitPrice || 0
        return sum + (stock * price)
      }, 0)
      
      if (items.length > 0 || type === 'inventory') {
        reports.push({
          id: 'inventory-status',
          _id: 'inventory-status',
          title: 'گزارش موجودی انبار',
          description: 'گزارش وضعیت موجودی و آیتم‌های کم‌موجود',
          type: 'inventory',
          category: 'موجودی',
          data: {
            totalItems,
            lowStockItems,
            totalValue: Math.round(totalValue)
          },
          lastUpdated: new Date().toISOString(),
          isScheduled: true,
          scheduleFrequency: 'هفتگی',
          isPublic: false,
          createdBy: 'سیستم'
        })
      }
    }
    
    // گزارش مشتریان
    if (type === 'all' || type === 'customers') {
      const customers = await customersCollection.find({}).toArray()
      const totalCustomers = customers.length
      
      // محاسبه VIP customers (مشتریان با بیشترین خرید)
      const customerPurchases: any = {}
      const invoices = await invoicesCollection.find({ type: 'sales' }).toArray()
      
      invoices.forEach((inv: any) => {
        const customerId = inv.customerId?.toString() || inv.customer_id?.toString()
        if (customerId) {
          if (!customerPurchases[customerId]) {
            customerPurchases[customerId] = 0
          }
          customerPurchases[customerId] += (inv.totalAmount || inv.total || 0)
        }
      })
      
      const sortedCustomers = Object.entries(customerPurchases)
        .sort(([, a]: [string, any], [, b]: [string, any]) => b - a)
        .slice(0, 25)
      
      const vipCustomers = sortedCustomers.length
      const totalSpent = sortedCustomers.reduce((sum: number, [, amount]: [string, any]) => sum + amount, 0)
      const averageSpent = vipCustomers > 0 ? totalSpent / vipCustomers : 0
      
      if (customers.length > 0 || type === 'customers') {
        reports.push({
          id: 'customers-vip',
          _id: 'customers-vip',
          title: 'گزارش مشتریان VIP',
          description: 'گزارش مشتریان VIP و خریدهای آن‌ها',
          type: 'customers',
          category: 'مشتریان',
          data: {
            vipCustomers,
            totalSpent: Math.round(totalSpent),
            averageSpent: Math.round(averageSpent),
            totalCustomers
          },
          lastUpdated: new Date().toISOString(),
          isScheduled: false,
          scheduleFrequency: '',
          isPublic: false,
          createdBy: 'سیستم'
        })
      }
    }
    
    // گزارش مالی
    if (type === 'all' || type === 'financial') {
      const invoices = await invoicesCollection.find({ type: 'sales' }).toArray()
      const purchases = await invoicesCollection.find({ type: 'purchase' }).toArray()
      
      const thisMonth = new Date()
      thisMonth.setDate(1)
      thisMonth.setHours(0, 0, 0, 0)
      
      const monthlyInvoices = invoices.filter((inv: any) => {
        const invDate = inv.date ? new Date(inv.date) : (inv.createdAt ? new Date(inv.createdAt) : new Date())
        return invDate >= thisMonth
      })
      
      const monthlyPurchases = purchases.filter((pur: any) => {
        const purDate = pur.date ? new Date(pur.date) : (pur.createdAt ? new Date(pur.createdAt) : new Date())
        return purDate >= thisMonth
      })
      
      const revenue = monthlyInvoices.reduce((sum: number, inv: any) => sum + (inv.totalAmount || inv.total || 0), 0)
      const expenses = monthlyPurchases.reduce((sum: number, pur: any) => sum + (pur.totalAmount || pur.total || 0), 0)
      const profit = revenue - expenses
      
      if (monthlyInvoices.length > 0 || monthlyPurchases.length > 0 || type === 'financial') {
        reports.push({
          id: 'financial-monthly',
          _id: 'financial-monthly',
          title: 'گزارش مالی ماهانه',
          description: 'گزارش کامل مالی شامل درآمد، هزینه و سود',
          type: 'financial',
          category: 'مالی',
          data: {
            revenue: Math.round(revenue),
            expenses: Math.round(expenses),
            profit: Math.round(profit)
          },
          lastUpdated: new Date().toISOString(),
          isScheduled: true,
          scheduleFrequency: 'ماهانه',
          isPublic: true,
          createdBy: 'سیستم'
        })
      }
    }
    
    // گزارش سفارشات
    if (type === 'all' || type === 'orders') {
      const pendingOrders = await ordersCollection.find({ status: 'pending' }).toArray()
      const preparingOrders = await ordersCollection.find({ status: 'preparing' }).toArray()
      const readyOrders = await ordersCollection.find({ status: 'ready' }).toArray()
      
      if (pendingOrders.length > 0 || preparingOrders.length > 0 || readyOrders.length > 0 || type === 'orders') {
        reports.push({
          id: 'orders-kitchen',
          _id: 'orders-kitchen',
          title: 'گزارش سفارشات آشپزخانه',
          description: 'گزارش سفارشات در حال آماده‌سازی و زمان‌های تحویل',
          type: 'orders',
          category: 'سفارشات',
          data: {
            pendingOrders: pendingOrders.length,
            preparingOrders: preparingOrders.length,
            readyOrders: readyOrders.length
          },
          lastUpdated: new Date().toISOString(),
          isScheduled: false,
          scheduleFrequency: '',
          isPublic: false,
          createdBy: 'سیستم'
        })
      }
    }
    
    // فیلتر بر اساس type
    let filteredReports = reports
    if (type !== 'all') {
      filteredReports = filteredReports.filter(r => r.type === type)
    }
    
    // فیلتر بر اساس category
    if (category !== 'all') {
      filteredReports = filteredReports.filter(r => r.category === category)
    }
    
    // مرتب‌سازی
    filteredReports.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title)
        case 'lastUpdated':
          return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
        case 'category':
          return a.category.localeCompare(b.category)
        default:
          return 0
      }
    })
    
    return NextResponse.json({
      success: true,
      data: filteredReports
    })
  } catch (error) {
    console.error('Error fetching general reports:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت گزارشات', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// POST - ایجاد گزارش جدید
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()
    const collection = db.collection('general_reports')
    
    const body = await request.json()
    const {
      title,
      description,
      type,
      category,
      data,
      isScheduled,
      scheduleFrequency,
      isPublic,
      createdBy
    } = body
    
    if (!title || !type) {
      return NextResponse.json(
        { success: false, message: 'عنوان و نوع گزارش اجباری است' },
        { status: 400 }
      )
    }
    
    const report = {
      title,
      description: description || '',
      type,
      category: category || type,
      data: data || {},
      lastUpdated: new Date().toISOString(),
      isScheduled: isScheduled || false,
      scheduleFrequency: scheduleFrequency || '',
      isPublic: isPublic || false,
      createdBy: createdBy || 'کاربر',
      createdAt: new Date().toISOString()
    }
    
    const result = await collection.insertOne(report)
    
    return NextResponse.json({
      success: true,
      data: { ...report, _id: result.insertedId.toString(), id: result.insertedId.toString() },
      message: 'گزارش با موفقیت ایجاد شد'
    })
  } catch (error) {
    console.error('Error creating general report:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در ایجاد گزارش', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// PUT - به‌روزرسانی گزارش
export async function PUT(request: NextRequest) {
  try {
    await connectToDatabase()
    const collection = db.collection('general_reports')
    
    const body = await request.json()
    const { id, ...updateData } = body
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'شناسه گزارش اجباری است' },
        { status: 400 }
      )
    }
    
    updateData.lastUpdated = new Date().toISOString()
    updateData.updatedAt = new Date().toISOString()
    
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    )
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'گزارش مورد نظر یافت نشد' },
        { status: 404 }
      )
    }
    
    const updatedReport = await collection.findOne({ _id: new ObjectId(id) })
    
    return NextResponse.json({
      success: true,
      data: { ...updatedReport, _id: updatedReport._id.toString(), id: updatedReport._id.toString() },
      message: 'گزارش با موفقیت به‌روزرسانی شد'
    })
  } catch (error) {
    console.error('Error updating general report:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در به‌روزرسانی گزارش', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// DELETE - حذف گزارش
export async function DELETE(request: NextRequest) {
  try {
    await connectToDatabase()
    const collection = db.collection('general_reports')
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'شناسه گزارش اجباری است' },
        { status: 400 }
      )
    }
    
    const result = await collection.deleteOne({ _id: new ObjectId(id) })
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'گزارش مورد نظر یافت نشد' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'گزارش با موفقیت حذف شد'
    })
  } catch (error) {
    console.error('Error deleting general report:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در حذف گزارش', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

