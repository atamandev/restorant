import { NextRequest, NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://restorenUser:1234@localhost:27017/restoren'
const DB_NAME = 'restoren'
const COLLECTION_NAME = 'orders'

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

// POST - اضافه کردن داده‌های نمونه سفارشات
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    // پاک کردن داده‌های قبلی
    await collection.deleteMany({})
    
    const sampleOrders = [
      {
        orderNumber: 'ORD-000001',
        customerName: 'احمد محمدی',
        customerPhone: '09123456789',
        customerAddress: 'تهران، خیابان ولیعصر، پلاک 123',
        orderType: 'delivery',
        tableNumber: '',
        items: [
          { id: '1', name: 'کباب کوبیده', quantity: 2, price: 45000, notes: 'بدون پیاز' },
          { id: '2', name: 'نوشابه کوکاکولا', quantity: 1, price: 15000 }
        ],
        subtotal: 105000,
        tax: 10500,
        serviceCharge: 5000,
        discount: 0,
        total: 120500,
        orderTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 ساعت پیش
        estimatedTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 دقیقه دیگر
        status: 'pending',
        notes: 'سفارش فوری - مشتری منتظر است',
        paymentMethod: 'cash',
        priority: 'urgent',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
      },
      {
        orderNumber: 'ORD-000002',
        customerName: 'فاطمه احمدی',
        customerPhone: '09198765432',
        customerAddress: '',
        orderType: 'dine-in',
        tableNumber: '5',
        items: [
          { id: '3', name: 'قیمه بادمجان', quantity: 1, price: 35000 },
          { id: '4', name: 'دوغ', quantity: 1, price: 12000 },
          { id: '5', name: 'نان سنگک', quantity: 2, price: 8000 }
        ],
        subtotal: 55000,
        tax: 5500,
        serviceCharge: 0,
        discount: 5000,
        total: 55500,
        orderTime: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 ساعت پیش
        estimatedTime: new Date(Date.now() + 20 * 60 * 1000).toISOString(), // 20 دقیقه دیگر
        status: 'confirmed',
        notes: '',
        paymentMethod: 'card',
        priority: 'normal',
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 30 * 60 * 1000)
      },
      {
        orderNumber: 'ORD-000003',
        customerName: 'علی رضایی',
        customerPhone: '09151234567',
        customerAddress: '',
        orderType: 'takeaway',
        tableNumber: '',
        items: [
          { id: '6', name: 'جوجه کباب', quantity: 1, price: 55000 },
          { id: '7', name: 'برنج', quantity: 1, price: 25000 },
          { id: '8', name: 'سالاد فصل', quantity: 1, price: 18000 }
        ],
        subtotal: 98000,
        tax: 9800,
        serviceCharge: 0,
        discount: 0,
        total: 107800,
        orderTime: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 دقیقه پیش
        estimatedTime: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 دقیقه دیگر
        status: 'preparing',
        notes: 'بدون ادویه تند',
        paymentMethod: 'cash',
        priority: 'high',
        createdAt: new Date(Date.now() - 45 * 60 * 1000),
        updatedAt: new Date(Date.now() - 20 * 60 * 1000)
      },
      {
        orderNumber: 'ORD-000004',
        customerName: 'مریم حسینی',
        customerPhone: '09187654321',
        customerAddress: 'کرج، خیابان آزادی، پلاک 456',
        orderType: 'delivery',
        tableNumber: '',
        items: [
          { id: '9', name: 'قرمه سبزی', quantity: 1, price: 40000 },
          { id: '10', name: 'برنج', quantity: 1, price: 25000 },
          { id: '11', name: 'ماست', quantity: 1, price: 15000 }
        ],
        subtotal: 80000,
        tax: 8000,
        serviceCharge: 8000,
        discount: 0,
        total: 96000,
        orderTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 دقیقه پیش
        estimatedTime: new Date(Date.now()).toISOString(), // الان
        status: 'ready',
        notes: '',
        paymentMethod: 'card',
        priority: 'normal',
        createdAt: new Date(Date.now() - 30 * 60 * 1000),
        updatedAt: new Date(Date.now() - 5 * 60 * 1000)
      },
      {
        orderNumber: 'ORD-000005',
        customerName: 'حسن کریمی',
        customerPhone: '09134567890',
        customerAddress: '',
        orderType: 'dine-in',
        tableNumber: '3',
        items: [
          { id: '12', name: 'کباب بختیاری', quantity: 1, price: 65000 },
          { id: '13', name: 'برنج', quantity: 1, price: 25000 },
          { id: '14', name: 'نوشابه فانتا', quantity: 1, price: 15000 }
        ],
        subtotal: 105000,
        tax: 10500,
        serviceCharge: 0,
        discount: 10000,
        total: 105500,
        orderTime: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 ساعت پیش
        estimatedTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 ساعت پیش
        status: 'completed',
        notes: '',
        paymentMethod: 'cash',
        priority: 'normal',
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
      },
      {
        orderNumber: 'ORD-000006',
        customerName: 'زهرا نوری',
        customerPhone: '09123456789',
        customerAddress: '',
        orderType: 'takeaway',
        tableNumber: '',
        items: [
          { id: '15', name: 'فیش اند چیپس', quantity: 1, price: 42000 },
          { id: '16', name: 'نوشابه اسپرایت', quantity: 1, price: 15000 }
        ],
        subtotal: 57000,
        tax: 5700,
        serviceCharge: 0,
        discount: 0,
        total: 62700,
        orderTime: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 دقیقه پیش
        estimatedTime: new Date(Date.now() + 25 * 60 * 1000).toISOString(), // 25 دقیقه دیگر
        status: 'pending',
        notes: 'بدون نمک اضافی',
        paymentMethod: 'card',
        priority: 'normal',
        createdAt: new Date(Date.now() - 15 * 60 * 1000),
        updatedAt: new Date(Date.now() - 15 * 60 * 1000)
      },
      {
        orderNumber: 'ORD-000007',
        customerName: 'محمد صادقی',
        customerPhone: '09156789012',
        customerAddress: 'اصفهان، خیابان چهارباغ، پلاک 789',
        orderType: 'delivery',
        tableNumber: '',
        items: [
          { id: '17', name: 'کباب برگ', quantity: 2, price: 50000 },
          { id: '18', name: 'برنج', quantity: 2, price: 25000 },
          { id: '19', name: 'سالاد شیرازی', quantity: 1, price: 20000 }
        ],
        subtotal: 120000,
        tax: 12000,
        serviceCharge: 12000,
        discount: 15000,
        total: 129000,
        orderTime: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 دقیقه پیش
        estimatedTime: new Date(Date.now() + 40 * 60 * 1000).toISOString(), // 40 دقیقه دیگر
        status: 'confirmed',
        notes: 'آدرس دقیق: کوچه 15، پلاک 12',
        paymentMethod: 'cash',
        priority: 'high',
        createdAt: new Date(Date.now() - 10 * 60 * 1000),
        updatedAt: new Date(Date.now() - 5 * 60 * 1000)
      },
      {
        orderNumber: 'ORD-000008',
        customerName: 'نرگس احمدی',
        customerPhone: '09167890123',
        customerAddress: '',
        orderType: 'dine-in',
        tableNumber: '7',
        items: [
          { id: '20', name: 'قیمه بادمجان', quantity: 1, price: 35000 },
          { id: '21', name: 'دوغ', quantity: 1, price: 12000 },
          { id: '22', name: 'نان بربری', quantity: 2, price: 10000 }
        ],
        subtotal: 57000,
        tax: 5700,
        serviceCharge: 0,
        discount: 0,
        total: 62700,
        orderTime: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 دقیقه پیش
        estimatedTime: new Date(Date.now() + 25 * 60 * 1000).toISOString(), // 25 دقیقه دیگر
        status: 'preparing',
        notes: '',
        paymentMethod: 'card',
        priority: 'normal',
        createdAt: new Date(Date.now() - 5 * 60 * 1000),
        updatedAt: new Date(Date.now() - 2 * 60 * 1000)
      }
    ]

    const result = await collection.insertMany(sampleOrders)

    return NextResponse.json({
      success: true,
      message: `${result.insertedCount} سفارش نمونه اضافه شد`,
      data: result.insertedIds
    })
  } catch (error) {
    console.error('Error adding sample orders:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در اضافه کردن سفارشات نمونه' },
      { status: 500 }
    )
  }
}

