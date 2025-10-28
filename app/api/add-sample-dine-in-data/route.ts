import { NextRequest, NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://restorenUser:1234@localhost:27017/restoren'

// POST /api/add-sample-dine-in-data - اضافه کردن داده‌های نمونه برای سفارشات حضوری
export async function POST(request: NextRequest) {
  let client: MongoClient | null = null
  
  try {
    client = new MongoClient(MONGO_URI)
    await client.connect()
    const db = client.db('restoren')
    
    // Sample dine-in orders data
    const sampleDineInOrders = [
      {
        orderNumber: 'DI-001',
        tableNumber: '2',
        customerName: 'احمد محمدی',
        customerPhone: '09123456789',
        items: [
          {
            id: '1',
            name: 'کباب کوبیده',
            price: 120000,
            category: 'غذاهای اصلی',
            image: '/api/placeholder/60/60',
            preparationTime: 25,
            description: 'کباب کوبیده سنتی با گوشت گوساله تازه',
            quantity: 2,
            notes: 'بدون پیاز'
          },
          {
            id: '4',
            name: 'نوشابه',
            price: 15000,
            category: 'نوشیدنی‌ها',
            image: '/api/placeholder/60/60',
            preparationTime: 2,
            description: 'نوشابه گازدار سرد',
            quantity: 2
          }
        ],
        subtotal: 270000,
        tax: 24300,
        serviceCharge: 27000,
        discount: 0,
        total: 321300,
        estimatedReadyTime: '15:00',
        status: 'preparing',
        notes: 'میز 2 - مشتری منتظر است',
        paymentMethod: 'cash',
        priority: 'normal',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        orderNumber: 'DI-002',
        tableNumber: '4',
        customerName: 'سارا کریمی',
        customerPhone: '09123456790',
        items: [
          {
            id: '2',
            name: 'جوجه کباب',
            price: 135000,
            category: 'غذاهای اصلی',
            image: '/api/placeholder/60/60',
            preparationTime: 20,
            description: 'جوجه کباب با سینه مرغ تازه و سس مخصوص',
            quantity: 1
          },
          {
            id: '5',
            name: 'دوغ محلی',
            price: 18000,
            category: 'نوشیدنی‌ها',
            image: '/api/placeholder/60/60',
            preparationTime: 3,
            description: 'دوغ محلی تازه و خنک',
            quantity: 1
          }
        ],
        subtotal: 153000,
        tax: 13770,
        serviceCharge: 15300,
        discount: 10000,
        total: 172070,
        estimatedReadyTime: '14:50',
        status: 'ready',
        notes: 'میز 4 - آماده تحویل',
        paymentMethod: 'card',
        priority: 'normal',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        orderNumber: 'DI-003',
        tableNumber: '6',
        customerName: 'رضا حسینی',
        customerPhone: '09123456791',
        items: [
          {
            id: '7',
            name: 'چلو گوشت',
            price: 180000,
            category: 'غذاهای اصلی',
            image: '/api/placeholder/60/60',
            preparationTime: 35,
            description: 'چلو گوشت با گوشت گوساله و برنج ایرانی',
            quantity: 1
          },
          {
            id: '3',
            name: 'سالاد سزار',
            price: 45000,
            category: 'پیش‌غذاها',
            image: '/api/placeholder/60/60',
            preparationTime: 10,
            description: 'سالاد سزار با کاهو تازه و پنیر پارمزان',
            quantity: 1
          },
          {
            id: '4',
            name: 'نوشابه',
            price: 15000,
            category: 'نوشیدنی‌ها',
            image: '/api/placeholder/60/60',
            preparationTime: 2,
            description: 'نوشابه گازدار سرد',
            quantity: 2
          }
        ],
        subtotal: 255000,
        tax: 22950,
        serviceCharge: 25500,
        discount: 0,
        total: 303450,
        estimatedReadyTime: '15:30',
        status: 'pending',
        notes: 'میز 6 - سفارش جدید',
        paymentMethod: 'cash',
        priority: 'normal',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]

    console.log('Adding sample dine-in orders...')
    const ordersResult = await db.collection('dine_in_orders').insertMany(sampleDineInOrders)
    console.log('Sample dine-in orders added:', ordersResult.insertedIds)

    return NextResponse.json({
      success: true,
      message: 'داده‌های نمونه سفارشات حضوری با موفقیت اضافه شدند',
      data: {
        ordersCount: ordersResult.insertedCount
      }
    })
  } catch (error) {
    console.error('Error adding sample dine-in data:', error)
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
