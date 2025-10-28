import { NextRequest, NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://restorenUser:1234@localhost:27017/restoren'

let client: MongoClient
let clientPromise: Promise<MongoClient>

if (!client) {
  client = new MongoClient(MONGO_URI)
  clientPromise = client.connect()
}

export async function POST(request: NextRequest) {
  try {
    const client = await clientPromise
    const db = client.db('restoren')
    const collection = db.collection('pending_orders')

    const sampleOrders = [
      {
        orderNumber: 'ORD-001',
        customerName: 'احمد محمدی',
        customerPhone: '09123456789',
        customerAddress: 'تهران، خیابان ولیعصر، پلاک 123',
        orderType: 'delivery',
        tableNumber: null,
        items: [
          { id: '1', name: 'کباب کوبیده', quantity: 2, price: 120000, notes: 'بدون پیاز' },
          { id: '2', name: 'نوشابه', quantity: 2, price: 15000 },
          { id: '3', name: 'سالاد سزار', quantity: 1, price: 45000 }
        ],
        subtotal: 300000,
        tax: 27000,
        serviceCharge: 0,
        discount: 0,
        total: 327000,
        orderTime: '14:30',
        estimatedTime: '15:15',
        status: 'pending',
        notes: 'سفارش فوری - مشتری منتظر است',
        paymentMethod: 'cash',
        priority: 'urgent',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        orderNumber: 'ORD-002',
        customerName: 'سارا کریمی',
        customerPhone: '09123456790',
        customerAddress: null,
        orderType: 'dine-in',
        tableNumber: '5',
        items: [
          { id: '4', name: 'جوجه کباب', quantity: 1, price: 135000 },
          { id: '5', name: 'دوغ محلی', quantity: 1, price: 18000 },
          { id: '6', name: 'بستنی سنتی', quantity: 1, price: 35000 }
        ],
        subtotal: 188000,
        tax: 16920,
        serviceCharge: 18800,
        discount: 10000,
        total: 213720,
        orderTime: '14:25',
        estimatedTime: '15:00',
        status: 'confirmed',
        notes: 'میز 5 - مشتری VIP',
        paymentMethod: 'card',
        priority: 'high',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        orderNumber: 'ORD-003',
        customerName: 'رضا حسینی',
        customerPhone: '09123456791',
        customerAddress: null,
        orderType: 'takeaway',
        tableNumber: null,
        items: [
          { id: '7', name: 'چلو گوشت', quantity: 1, price: 180000 },
          { id: '8', name: 'نوشابه', quantity: 1, price: 15000 }
        ],
        subtotal: 195000,
        tax: 17550,
        serviceCharge: 0,
        discount: 0,
        total: 212550,
        orderTime: '14:20',
        estimatedTime: '14:50',
        status: 'preparing',
        notes: 'بیرون‌بر - مشتری منتظر است',
        paymentMethod: 'cash',
        priority: 'normal',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        orderNumber: 'ORD-004',
        customerName: 'مریم نوری',
        customerPhone: '09123456792',
        customerAddress: 'تهران، خیابان انقلاب، پلاک 321',
        orderType: 'delivery',
        tableNumber: null,
        items: [
          { id: '9', name: 'میرزا قاسمی', quantity: 1, price: 70000 },
          { id: '10', name: 'نوشابه', quantity: 1, price: 15000 },
          { id: '11', name: 'سالاد سزار', quantity: 1, price: 45000 }
        ],
        subtotal: 130000,
        tax: 11700,
        serviceCharge: 0,
        discount: 5000,
        total: 136700,
        orderTime: '14:15',
        estimatedTime: '15:00',
        status: 'pending',
        notes: 'ارسال به آدرس مشخص شده',
        paymentMethod: 'card',
        priority: 'normal',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        orderNumber: 'ORD-005',
        customerName: 'علی احمدی',
        customerPhone: '09123456793',
        customerAddress: null,
        orderType: 'dine-in',
        tableNumber: '12',
        items: [
          { id: '12', name: 'قیمه نثار', quantity: 1, price: 95000 },
          { id: '13', name: 'چای ایرانی', quantity: 2, price: 12000 },
          { id: '14', name: 'شیرینی تر', quantity: 1, price: 45000 }
        ],
        subtotal: 152000,
        tax: 13680,
        serviceCharge: 15200,
        discount: 0,
        total: 180880,
        orderTime: '14:10',
        estimatedTime: '14:45',
        status: 'ready',
        notes: 'میز 12 - سفارش آماده',
        paymentMethod: 'card',
        priority: 'normal',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        orderNumber: 'ORD-006',
        customerName: 'فاطمه رضایی',
        customerPhone: '09123456794',
        customerAddress: 'تهران، خیابان کریمخان، پلاک 456',
        orderType: 'delivery',
        tableNumber: null,
        items: [
          { id: '15', name: 'قرمه سبزی', quantity: 1, price: 110000 },
          { id: '16', name: 'برنج', quantity: 1, price: 25000 },
          { id: '17', name: 'دوغ محلی', quantity: 1, price: 18000 }
        ],
        subtotal: 153000,
        tax: 13770,
        serviceCharge: 0,
        discount: 10000,
        total: 156770,
        orderTime: '14:05',
        estimatedTime: '14:40',
        status: 'preparing',
        notes: 'ارسال به آدرس کریمخان',
        paymentMethod: 'cash',
        priority: 'high',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]

    // Clear existing data
    await collection.deleteMany({})

    // Insert sample data
    const result = await collection.insertMany(sampleOrders)

    return NextResponse.json({
      success: true,
      message: 'داده‌های نمونه سفارشات در انتظار با موفقیت اضافه شدند',
      data: {
        insertedCount: result.insertedCount,
        insertedIds: result.insertedIds
      }
    })
  } catch (error) {
    console.error('Error adding sample pending orders:', error)
    return NextResponse.json({
      success: false,
      message: 'خطا در اضافه کردن داده‌های نمونه'
    }, { status: 500 })
  }
}
