import { NextRequest, NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://restorenUser:1234@localhost:27017/restoren'

let client: MongoClient | undefined
let clientPromise: Promise<MongoClient> | undefined

if (!clientPromise) {
  client = new MongoClient(MONGO_URI)
  clientPromise = client.connect()
}

export async function POST(request: NextRequest) {
  try {
    if (!clientPromise) {
      client = new MongoClient(MONGO_URI)
      clientPromise = client.connect()
    }
    const dbClient = await clientPromise
    const db = dbClient.db('restoren')
    const collection = db.collection('takeaway_orders')

    const sampleOrders = [
      {
        orderNumber: 'TW-000001',
        customerName: 'احمد محمدی',
        customerPhone: '09123456789',
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
            id: '69006d81f638386801d543c7',
            name: 'Soft Drink',
            price: 15000,
            category: 'Beverages',
            image: '',
            preparationTime: 2,
            description: 'Cold carbonated drink',
            quantity: 1
          }
        ],
        subtotal: 105000,
        tax: 9450,
        serviceCharge: 0,
        discount: 5000,
        total: 109450,
        orderTime: '14:30',
        estimatedReadyTime: '14:45',
        status: 'pending',
        notes: 'بدون پیاز',
        paymentMethod: 'cash',
        priority: 'normal',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        orderNumber: 'TW-000002',
        customerName: 'فاطمه احمدی',
        customerPhone: '09123456790',
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
        subtotal: 140000,
        tax: 12600,
        serviceCharge: 0,
        discount: 0,
        total: 152600,
        orderTime: '15:15',
        estimatedReadyTime: '15:35',
        status: 'preparing',
        notes: 'بستنی با طعم زعفران',
        paymentMethod: 'card',
        priority: 'urgent',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        orderNumber: 'TW-000003',
        customerName: 'محمد رضایی',
        customerPhone: '09123456791',
        items: [
          {
            id: '69006d7bf638386801d543c6',
            name: 'Caesar Salad',
            price: 45000,
            category: 'Appetizers',
            image: '',
            preparationTime: 10,
            description: 'Fresh lettuce with parmesan',
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
            quantity: 1
          }
        ],
        subtotal: 165000,
        tax: 14850,
        serviceCharge: 0,
        discount: 10000,
        total: 169850,
        orderTime: '16:00',
        estimatedReadyTime: '16:20',
        status: 'ready',
        notes: 'سفارش بزرگ',
        paymentMethod: 'cash',
        priority: 'normal',
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
      message: 'داده‌های نمونه سفارشات بیرون‌بر با موفقیت اضافه شدند',
      data: {
        insertedCount: result.insertedCount,
        insertedIds: result.insertedIds
      }
    })
  } catch (error) {
    console.error('Error adding sample takeaway orders:', error)
    return NextResponse.json({
      success: false,
      message: 'خطا در اضافه کردن داده‌های نمونه'
    }, { status: 500 })
  }
}
