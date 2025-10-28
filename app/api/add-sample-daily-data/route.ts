import { NextRequest, NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://restorenUser:1234@localhost:27017/restoren'

// POST /api/add-sample-daily-data - اضافه کردن داده‌های نمونه برای گزارش روزانه
export async function POST(request: NextRequest) {
  let client: MongoClient | null = null
  
  try {
    client = new MongoClient(MONGO_URI)
    await client.connect()
    const db = client.db('restoren')
    
    // Sample daily report data
    const sampleDailyReport = {
      date: new Date(),
      branchId: null,
      totalSales: 12500000,
      totalOrders: 45,
      totalCustomers: 38,
      averageOrderValue: 277777,
      cashSales: 8500000,
      cardSales: 3500000,
      creditSales: 500000,
      refunds: 150000,
      discounts: 300000,
      taxes: 1080000,
      serviceCharges: 1200000,
      netProfit: 10850000,
      topSellingItems: [
        { name: 'کباب کوبیده', quantity: 25, revenue: 3000000 },
        { name: 'جوجه کباب', quantity: 20, revenue: 2700000 },
        { name: 'نوشابه', quantity: 35, revenue: 525000 },
        { name: 'سالاد سزار', quantity: 15, revenue: 675000 },
        { name: 'دوغ محلی', quantity: 18, revenue: 324000 }
      ],
      hourlySales: [
        { hour: '09:00', sales: 450000, orders: 3 },
        { hour: '10:00', sales: 680000, orders: 5 },
        { hour: '11:00', sales: 920000, orders: 7 },
        { hour: '12:00', sales: 1500000, orders: 12 },
        { hour: '13:00', sales: 1800000, orders: 15 },
        { hour: '14:00', sales: 1200000, orders: 10 },
        { hour: '15:00', sales: 950000, orders: 8 },
        { hour: '16:00', sales: 780000, orders: 6 },
        { hour: '17:00', sales: 1100000, orders: 9 },
        { hour: '18:00', sales: 1400000, orders: 11 },
        { hour: '19:00', sales: 1600000, orders: 13 },
        { hour: '20:00', sales: 1350000, orders: 10 },
        { hour: '21:00', sales: 980000, orders: 8 },
        { hour: '22:00', sales: 720000, orders: 6 }
      ],
      paymentMethods: [
        { method: 'نقدی', amount: 8500000, percentage: 68 },
        { method: 'کارتخوان', amount: 3500000, percentage: 28 },
        { method: 'اعتباری', amount: 500000, percentage: 4 }
      ],
      notes: 'گزارش روزانه نمونه',
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // Sample daily orders data
    const sampleDailyOrders = [
      {
        orderNumber: 'ORD-001',
        customerName: 'احمد محمدی',
        items: [
          { name: 'کباب کوبیده', quantity: 2, price: 120000, total: 240000 },
          { name: 'نوشابه', quantity: 1, price: 15000, total: 15000 }
        ],
        total: 255000,
        paymentMethod: 'نقدی',
        status: 'completed',
        tableNumber: '5',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        orderNumber: 'ORD-002',
        customerName: 'سارا کریمی',
        items: [
          { name: 'جوجه کباب', quantity: 1, price: 135000, total: 135000 }
        ],
        total: 135000,
        paymentMethod: 'کارتخوان',
        status: 'completed',
        tableNumber: '3',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        orderNumber: 'ORD-003',
        customerName: 'رضا حسینی',
        items: [
          { name: 'کباب کوبیده', quantity: 1, price: 120000, total: 120000 },
          { name: 'سالاد سزار', quantity: 1, price: 45000, total: 45000 },
          { name: 'نوشابه', quantity: 2, price: 15000, total: 30000 }
        ],
        total: 195000,
        paymentMethod: 'نقدی',
        status: 'completed',
        tableNumber: '7',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        orderNumber: 'ORD-004',
        customerName: 'مریم نوری',
        items: [
          { name: 'دوغ محلی', quantity: 1, price: 18000, total: 18000 }
        ],
        total: 18000,
        paymentMethod: 'اعتباری',
        status: 'completed',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        orderNumber: 'ORD-005',
        customerName: 'علی احمدی',
        items: [
          { name: 'جوجه کباب', quantity: 2, price: 135000, total: 270000 },
          { name: 'سالاد سزار', quantity: 1, price: 45000, total: 45000 },
          { name: 'نوشابه', quantity: 2, price: 15000, total: 30000 }
        ],
        total: 345000,
        paymentMethod: 'کارتخوان',
        status: 'completed',
        tableNumber: '12',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        orderNumber: 'ORD-006',
        customerName: 'فاطمه رضایی',
        items: [
          { name: 'کباب کوبیده', quantity: 1, price: 120000, total: 120000 }
        ],
        total: 120000,
        paymentMethod: 'نقدی',
        status: 'completed',
        tableNumber: '8',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        orderNumber: 'ORD-007',
        customerName: 'حسن محمدی',
        items: [
          { name: 'جوجه کباب', quantity: 1, price: 135000, total: 135000 },
          { name: 'دوغ محلی', quantity: 1, price: 18000, total: 18000 }
        ],
        total: 153000,
        paymentMethod: 'نقدی',
        status: 'completed',
        tableNumber: '4',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        orderNumber: 'ORD-008',
        customerName: 'زهرا کریمی',
        items: [
          { name: 'کباب کوبیده', quantity: 1, price: 120000, total: 120000 },
          { name: 'سالاد سزار', quantity: 1, price: 45000, total: 45000 }
        ],
        total: 165000,
        paymentMethod: 'کارتخوان',
        status: 'completed',
        tableNumber: '9',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]

    console.log('Adding sample daily report...')
    const reportResult = await db.collection('daily_reports').insertOne(sampleDailyReport)
    console.log('Sample daily report added:', reportResult.insertedId)

    console.log('Adding sample daily orders...')
    const ordersResult = await db.collection('daily_orders').insertMany(sampleDailyOrders)
    console.log('Sample daily orders added:', ordersResult.insertedIds)

    return NextResponse.json({
      success: true,
      message: 'داده‌های نمونه گزارش روزانه با موفقیت اضافه شدند',
      data: {
        reportId: reportResult.insertedId,
        ordersCount: ordersResult.insertedCount
      }
    })
  } catch (error) {
    console.error('Error adding sample daily data:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در اضافه کردن داده‌های نمونه',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  } finally {
    if (client) {
      await client.close()
    }
  }
}
