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
    const collection = db.collection('kitchen_orders')

    const sampleOrders = [
      {
        orderNumber: 'DI-001',
        orderType: 'dine-in',
        tableNumber: '2',
        customerName: 'احمد محمدی',
        customerPhone: '09123456789',
        items: [
          {
            id: '69006d8ef638386801d543c9',
            name: 'Mirza Ghasemi',
            quantity: 2,
            category: 'Appetizers',
            preparationTime: 15,
            status: 'preparing',
            notes: 'بدون پیاز',
            image: ''
          },
          {
            id: '69006d81f638386801d543c7',
            name: 'Soft Drink',
            quantity: 2,
            category: 'Beverages',
            preparationTime: 2,
            status: 'ready',
            image: ''
          }
        ],
        orderTime: '14:30',
        estimatedReadyTime: '15:00',
        status: 'preparing',
        priority: 'normal',
        notes: 'میز 2 - مشتری منتظر است',
        specialInstructions: 'کباب را خوب کباب کنید',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        orderNumber: 'TW-002',
        orderType: 'takeaway',
        customerName: 'سارا کریمی',
        customerPhone: '09123456790',
        items: [
          {
            id: '69006d7bf638386801d543c6',
            name: 'Caesar Salad',
            quantity: 1,
            category: 'Appetizers',
            preparationTime: 10,
            status: 'ready',
            image: ''
          },
          {
            id: '69006d9af638386801d543cb',
            name: 'Traditional Ice Cream',
            quantity: 1,
            category: 'Desserts',
            preparationTime: 5,
            status: 'ready',
            image: ''
          }
        ],
        orderTime: '14:25',
        estimatedReadyTime: '14:50',
        status: 'ready',
        priority: 'normal',
        notes: 'بیرون‌بر - مشتری منتظر است',
        specialInstructions: 'جوجه را تازه کباب کنید',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        orderNumber: 'DL-003',
        orderType: 'delivery',
        customerName: 'رضا حسینی',
        customerPhone: '09123456791',
        items: [
          {
            id: '69006d8ef638386801d543c9',
            name: 'Mirza Ghasemi',
            quantity: 1,
            category: 'Appetizers',
            preparationTime: 15,
            status: 'pending',
            image: ''
          },
          {
            id: '69006d7bf638386801d543c6',
            name: 'Caesar Salad',
            quantity: 1,
            category: 'Appetizers',
            preparationTime: 10,
            status: 'pending',
            image: ''
          }
        ],
        orderTime: '14:20',
        estimatedReadyTime: '15:00',
        status: 'pending',
        priority: 'urgent',
        notes: 'ارسال - آدرس: تهران، خیابان ولیعصر',
        specialInstructions: 'گوشت را نرم کباب کنید',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        orderNumber: 'DI-004',
        orderType: 'dine-in',
        tableNumber: '5',
        customerName: 'فاطمه احمدی',
        customerPhone: '09123456792',
        items: [
          {
            id: '69006d8ef638386801d543c9',
            name: 'Mirza Ghasemi',
            quantity: 1,
            category: 'Appetizers',
            preparationTime: 15,
            status: 'completed',
            image: ''
          },
          {
            id: '69006d81f638386801d543c7',
            name: 'Soft Drink',
            quantity: 3,
            category: 'Beverages',
            preparationTime: 2,
            status: 'completed',
            image: ''
          },
          {
            id: '69006d9af638386801d543cb',
            name: 'Traditional Ice Cream',
            quantity: 2,
            category: 'Desserts',
            preparationTime: 5,
            status: 'completed',
            image: ''
          }
        ],
        orderTime: '13:45',
        estimatedReadyTime: '14:15',
        status: 'completed',
        priority: 'normal',
        notes: 'میز 5 - سفارش تکمیل شده',
        specialInstructions: 'همه چیز آماده است',
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
      message: 'داده‌های نمونه سفارشات آشپزخانه با موفقیت اضافه شدند',
      data: {
        insertedCount: result.insertedCount,
        insertedIds: result.insertedIds
      }
    })
  } catch (error) {
    console.error('Error adding sample kitchen orders:', error)
    return NextResponse.json({
      success: false,
      message: 'خطا در اضافه کردن داده‌های نمونه'
    }, { status: 500 })
  }
}
