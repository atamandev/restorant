import { NextRequest, NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://restorenUser:1234@localhost:27017/restoren'

let client: MongoClient | undefined = undefined
let clientPromise: Promise<MongoClient> | undefined = undefined

async function connectToDatabase() {
  if (!clientPromise) {
    client = new MongoClient(MONGO_URI)
    clientPromise = client.connect()
  }
  return await clientPromise
}

export async function POST(request: NextRequest) {
  try {
    const dbClient = await connectToDatabase()
    const db = dbClient.db('restoren')
    const collection = db.collection('delivery_orders')

    const sampleOrders = [
      {
        orderNumber: 'DL-000001',
        customerName: 'علی احمدی',
        customerPhone: '09123456789',
        customerAddress: 'تهران، خیابان ولیعصر، پلاک 123، طبقه 2',
        deliveryFee: 15000,
        items: [
          {
            id: '69006d8ef638386801d543c9',
            name: 'Mirza Ghasemi',
            price: 70000,
            category: 'Appetizers',
            image: '',
            preparationTime: 15,
            description: 'Grilled eggplant with garlic',
            quantity: 1
          },
          {
            id: '69006d81f638386801d543c7',
            name: 'Soft Drink',
            price: 15000,
            category: 'Beverages',
            image: '',
            preparationTime: 2,
            description: 'Cold carbonated drink',
            quantity: 2
          }
        ],
        subtotal: 100000,
        tax: 9000,
        serviceCharge: 0,
        discount: 5000,
        total: 119000,
        orderTime: '18:30',
        estimatedDeliveryTime: '19:15',
        status: 'pending',
        notes: 'بدون پیاز',
        paymentMethod: 'cash',
        priority: 'normal',
        deliveryInstructions: 'زنگ بزنید و در ورودی منتظر بمانید',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        orderNumber: 'DL-000002',
        customerName: 'فاطمه محمدی',
        customerPhone: '09123456790',
        customerAddress: 'تهران، خیابان کریمخان زند، پلاک 456، واحد 3',
        deliveryFee: 20000,
        items: [
          {
            id: '69006d7bf638386801d543c6',
            name: 'Caesar Salad',
            price: 45000,
            category: 'Appetizers',
            image: '',
            preparationTime: 10,
            description: 'Fresh lettuce with parmesan',
            quantity: 2
          },
          {
            id: '69006d9af638386801d543cb',
            name: 'Traditional Ice Cream',
            price: 35000,
            category: 'Desserts',
            image: '',
            preparationTime: 5,
            description: 'Traditional Persian ice cream',
            quantity: 1
          }
        ],
        subtotal: 125000,
        tax: 11250,
        serviceCharge: 0,
        discount: 0,
        total: 156250,
        orderTime: '19:00',
        estimatedDeliveryTime: '19:45',
        status: 'preparing',
        notes: 'سفارش فوری',
        paymentMethod: 'card',
        priority: 'urgent',
        deliveryInstructions: 'سریع تحویل دهید',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        orderNumber: 'DL-000003',
        customerName: 'محمد رضایی',
        customerPhone: '09123456791',
        customerAddress: 'تهران، خیابان آزادی، پلاک 789، طبقه 1',
        deliveryFee: 18000,
        items: [
          {
            id: '69006d8ef638386801d543c9',
            name: 'Mirza Ghasemi',
            price: 70000,
            category: 'Appetizers',
            image: '',
            preparationTime: 15,
            description: 'Grilled eggplant with garlic',
            quantity: 1
          },
          {
            id: '69006d81f638386801d543c7',
            name: 'Soft Drink',
            price: 15000,
            category: 'Beverages',
            image: '',
            preparationTime: 2,
            description: 'Cold carbonated drink',
            quantity: 3
          },
          {
            id: '69006d9af638386801d543cb',
            name: 'Traditional Ice Cream',
            price: 35000,
            category: 'Desserts',
            image: '',
            preparationTime: 5,
            description: 'Traditional Persian ice cream',
            quantity: 2
          }
        ],
        subtotal: 175000,
        tax: 15750,
        serviceCharge: 0,
        discount: 10000,
        total: 198750,
        orderTime: '20:15',
        estimatedDeliveryTime: '21:00',
        status: 'out_for_delivery',
        notes: 'سفارش بزرگ',
        paymentMethod: 'cash',
        priority: 'normal',
        deliveryInstructions: 'تماس بگیرید قبل از رسیدن',
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
      message: 'داده‌های نمونه سفارشات ارسال با موفقیت اضافه شدند',
      data: {
        insertedCount: result.insertedCount,
        insertedIds: result.insertedIds
      }
    })
  } catch (error) {
    console.error('Error adding sample delivery orders:', error)
    return NextResponse.json({
      success: false,
      message: 'خطا در اضافه کردن داده‌های نمونه'
    }, { status: 500 })
  }
}
