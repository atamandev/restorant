import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://restorenUser:1234@localhost:27017/restoren'
const DB_NAME = 'restoren'

let client: MongoClient | undefined
let clientPromise: Promise<MongoClient>

async function connectToDatabase() {
  if (!client) {
    client = new MongoClient(MONGO_URI)
    clientPromise = client.connect()
  }
  return await clientPromise
}

// تابع تولید شماره سفارش
async function generateOrderNumber(db: any): Promise<string> {
  try {
    const collection = db.collection('delivery_orders')
    
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    
    const startOfDay = new Date(year, today.getMonth(), today.getDate())
    const endOfDay = new Date(year, today.getMonth(), today.getDate() + 1)
    
    const count = await collection.countDocuments({
      createdAt: {
        $gte: startOfDay,
        $lt: endOfDay
      }
    })
    
    const sequence = String(count + 1).padStart(4, '0')
    return `DL-${year}${month}${day}-${sequence}`
  } catch (error) {
    console.error('Error generating order number:', error)
    return `DL-${Date.now()}`
  }
}

export async function POST(request: NextRequest) {
  try {
    const mongoClient = await connectToDatabase()
    const db = mongoClient.db(DB_NAME)
    const deliveryOrdersCollection = db.collection('delivery_orders')
    const menuItemsCollection = db.collection('menu_items')
    const customersCollection = db.collection('customers')

    // بررسی اینکه آیا داده‌های نمونه قبلاً اضافه شده‌اند
    const existingSampleOrders = await deliveryOrdersCollection.find({ 
      notes: { $regex: /^\[SAMPLE\]/, $options: 'i' }
    }).toArray()

    if (existingSampleOrders.length > 0) {
      return NextResponse.json({
        success: false,
        message: 'داده‌های نمونه قبلاً اضافه شده‌اند'
      })
    }

    // دریافت چند منو آیتم برای استفاده در سفارشات نمونه
    const menuItems = await menuItemsCollection.find({}).limit(10).toArray()
    if (menuItems.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'ابتدا باید منو آیتم‌ها را اضافه کنید'
      })
    }

    // دریافت یا ایجاد مشتری نمونه
    let sampleCustomer = await customersCollection.findOne({ 
      phone: '09123456789' 
    })

    if (!sampleCustomer) {
      const customerResult = await customersCollection.insertOne({
        customerNumber: 'CUST-0001',
        firstName: 'مشتری',
        lastName: 'نمونه',
        phone: '09123456789',
        email: 'sample@example.com',
        customerType: 'regular',
        createdAt: new Date(),
        updatedAt: new Date()
      })
      sampleCustomer = await customersCollection.findOne({ _id: customerResult.insertedId })
    }

    const customerId = sampleCustomer?._id?.toString() || new ObjectId().toString()

    // ایجاد سفارشات نمونه
    const sampleOrders = []
    const now = new Date()

    for (let i = 0; i < 5; i++) {
      const orderDate = new Date(now)
      orderDate.setDate(orderDate.getDate() - i)
      
      const orderNumber = await generateOrderNumber(db)
      
      // انتخاب 2-4 آیتم تصادفی از منو
      const selectedItems = menuItems
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.floor(Math.random() * 3) + 2)
        .map((item: any, index: number) => ({
          menuItemId: item._id?.toString() || new ObjectId().toString(),
          name: item.name || `آیتم ${index + 1}`,
          quantity: Math.floor(Math.random() * 3) + 1,
          price: item.price || 50000,
          unitPrice: item.price || 50000,
          category: item.category || 'غذاهای اصلی',
          total: (item.price || 50000) * (Math.floor(Math.random() * 3) + 1),
          notes: null
        }))

      const subtotal = selectedItems.reduce((sum: number, item: any) => sum + item.total, 0)
      const tax = Math.floor(subtotal * 0.09)
      const serviceCharge = Math.floor(subtotal * 0.1)
      const deliveryFee = 15000
      const discount = 0
      const total = subtotal + tax + serviceCharge + deliveryFee - discount

      const estimatedReady = new Date(orderDate)
      estimatedReady.setMinutes(estimatedReady.getMinutes() + 30)

      const estimatedDelivery = new Date(estimatedReady)
      estimatedDelivery.setMinutes(estimatedDelivery.getMinutes() + 20)

      const statuses = ['pending', 'preparing', 'ready', 'delivered', 'completed']
      const status = statuses[Math.floor(Math.random() * statuses.length)]

      const addresses = [
        'تهران، خیابان ولیعصر، پلاک 123',
        'تهران، میدان ونک، خیابان ملاصدرا، پلاک 45',
        'تهران، خیابان انقلاب، پلاک 789',
        'تهران، خیابان آزادی، پلاک 321',
        'تهران، خیابان شریعتی، پلاک 654'
      ]

      const sampleOrder = {
        orderNumber,
        branchId: null,
        cashRegisterId: null,
        customerId: customerId,
        customerName: 'مشتری نمونه',
        customerPhone: '09123456789',
        deliveryAddress: addresses[i % addresses.length],
        deliveryFee: deliveryFee,
        items: selectedItems,
        subtotal: subtotal,
        tax: tax,
        serviceCharge: serviceCharge,
        discount: discount,
        discountAmount: 0,
        total: total,
        estimatedReadyTime: estimatedReady.toISOString(),
        estimatedDeliveryTime: estimatedDelivery.toISOString(),
        status: status,
        notes: '[SAMPLE] سفارش نمونه برای تست',
        paymentMethod: i % 2 === 0 ? 'cash' : 'card',
        priority: i % 3 === 0 ? 'urgent' : 'normal',
        deliveryInstructions: i % 2 === 0 ? 'لطفاً با احتیاط تحویل دهید' : null,
        createdAt: orderDate,
        updatedAt: orderDate
      }

      sampleOrders.push(sampleOrder)
    }

    // Insert sample orders
    const result = await deliveryOrdersCollection.insertMany(sampleOrders)

    return NextResponse.json({
      success: true,
      message: 'داده‌های نمونه سفارشات ارسال با موفقیت اضافه شدند',
      data: {
        insertedCount: result.insertedCount,
        insertedIds: result.insertedIds
      }
    })
  } catch (error) {
    console.error('Error adding sample delivery data:', error)
    return NextResponse.json({
      success: false,
      message: 'خطا در اضافه کردن داده‌های نمونه'
    }, { status: 500 })
  }
}

