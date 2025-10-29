import { NextRequest, NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://restorenUser:1234@localhost:27017/restoren'
const DB_NAME = 'restoren'
const COLLECTION_NAME = 'warehouses'

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

// POST - اضافه کردن داده‌های نمونه انبارها
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    // پاک کردن داده‌های قبلی
    await collection.deleteMany({})
    
    // اضافه کردن انبارهای نمونه
    const sampleWarehouses = [
      {
        code: 'WH-001',
        name: 'انبار اصلی',
        type: 'main',
        location: 'طبقه همکف',
        address: 'تهران، خیابان ولیعصر، پلاک 123',
        capacity: 1000,
        usedCapacity: 750,
        availableCapacity: 250,
        temperature: 20,
        humidity: 45,
        manager: 'احمد محمدی',
        phone: '09123456789',
        email: 'ahmad@restaurant.com',
        description: 'انبار اصلی رستوران برای نگهداری مواد اولیه و محصولات',
        status: 'active',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        code: 'WH-002',
        name: 'انبار سرد',
        type: 'cold',
        location: 'زیرزمین',
        address: 'تهران، خیابان ولیعصر، پلاک 123',
        capacity: 500,
        usedCapacity: 320,
        availableCapacity: 180,
        temperature: 4,
        humidity: 60,
        manager: 'فاطمه کریمی',
        phone: '09123456790',
        email: 'fateme@restaurant.com',
        description: 'انبار سرد برای نگهداری مواد غذایی فاسدشدنی',
        status: 'active',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        code: 'WH-003',
        name: 'انبار خشک',
        type: 'dry',
        location: 'طبقه اول',
        address: 'تهران، خیابان ولیعصر، پلاک 123',
        capacity: 300,
        usedCapacity: 150,
        availableCapacity: 150,
        temperature: 25,
        humidity: 30,
        manager: 'رضا حسینی',
        phone: '09123456791',
        email: 'reza@restaurant.com',
        description: 'انبار خشک برای نگهداری مواد خشک و ادویه‌جات',
        status: 'active',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        code: 'WH-004',
        name: 'انبار مواد اولیه',
        type: 'storage',
        location: 'طبقه دوم',
        address: 'تهران، خیابان ولیعصر، پلاک 123',
        capacity: 800,
        usedCapacity: 600,
        availableCapacity: 200,
        temperature: 18,
        humidity: 40,
        manager: 'علی رضایی',
        phone: '09123456792',
        email: 'ali@restaurant.com',
        description: 'انبار مخصوص نگهداری مواد اولیه و خام',
        status: 'active',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        code: 'WH-005',
        name: 'انبار محصولات نهایی',
        type: 'storage',
        location: 'طبقه سوم',
        address: 'تهران، خیابان ولیعصر، پلاک 123',
        capacity: 400,
        usedCapacity: 200,
        availableCapacity: 200,
        temperature: 22,
        humidity: 35,
        manager: 'مریم احمدی',
        phone: '09123456793',
        email: 'maryam@restaurant.com',
        description: 'انبار نگهداری محصولات آماده و نهایی',
        status: 'maintenance',
        isActive: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        code: 'WH-006',
        name: 'انبار اضطراری',
        type: 'storage',
        location: 'ساختمان جانبی',
        address: 'تهران، خیابان ولیعصر، پلاک 125',
        capacity: 200,
        usedCapacity: 50,
        availableCapacity: 150,
        temperature: 20,
        humidity: 45,
        manager: 'حسن محمدی',
        phone: '09123456794',
        email: 'hasan@restaurant.com',
        description: 'انبار اضطراری برای مواقع خاص و ذخیره اضافی',
        status: 'inactive',
        isActive: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]

    const result = await collection.insertMany(sampleWarehouses)
    
    return NextResponse.json({
      success: true,
      message: `${result.insertedCount} انبار نمونه با موفقیت اضافه شد`,
      data: {
        insertedCount: result.insertedCount,
        insertedIds: result.insertedIds
      }
    })
  } catch (error) {
    console.error('Error adding sample warehouses:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در اضافه کردن انبارهای نمونه' },
      { status: 500 }
    )
  }
}
