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
    const collection = db.collection('beverages')

    const sampleBeverages = [
      {
        name: 'نوشابه',
        description: 'نوشابه گازدار سرد',
        price: 15000,
        image: '/api/placeholder?width=200&height=150',
        preparationTime: 2,
        ingredients: ['آب', 'شکر', 'گاز', 'طعم‌دهنده'],
        category: 'نوشیدنی گازدار',
        isAvailable: true,
        rating: 4.2,
        popularity: 85,
        calories: 140,
        allergens: [],
        temperature: 'سرد',
        size: 'متوسط',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'دوغ محلی',
        description: 'دوغ محلی تازه و خنک',
        price: 18000,
        image: '/api/placeholder?width=200&height=150',
        preparationTime: 3,
        ingredients: ['شیر', 'ماست', 'نمک', 'نعنا'],
        category: 'نوشیدنی سنتی',
        isAvailable: true,
        rating: 4.6,
        popularity: 78,
        calories: 80,
        allergens: ['لبنیات'],
        temperature: 'سرد',
        size: 'متوسط',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'چای ایرانی',
        description: 'چای ایرانی با طعم و عطر مخصوص',
        price: 12000,
        image: '/api/placeholder?width=200&height=150',
        preparationTime: 5,
        ingredients: ['چای', 'آب', 'شکر'],
        category: 'نوشیدنی گرم',
        isAvailable: true,
        rating: 4.8,
        popularity: 95,
        calories: 5,
        allergens: [],
        temperature: 'داغ',
        size: 'کوچک',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'قهوه ترک',
        description: 'قهوه ترک با طعم قوی و غلیظ',
        price: 25000,
        image: '/api/placeholder?width=200&height=150',
        preparationTime: 8,
        ingredients: ['قهوه', 'آب', 'شکر'],
        category: 'نوشیدنی گرم',
        isAvailable: true,
        rating: 4.7,
        popularity: 82,
        calories: 15,
        allergens: [],
        temperature: 'داغ',
        size: 'کوچک',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'آب میوه طبیعی',
        description: 'آب میوه طبیعی با میوه‌های تازه',
        price: 22000,
        image: '/api/placeholder?width=200&height=150',
        preparationTime: 6,
        ingredients: ['میوه تازه', 'آب', 'شکر'],
        category: 'نوشیدنی طبیعی',
        isAvailable: true,
        rating: 4.5,
        popularity: 88,
        calories: 120,
        allergens: [],
        temperature: 'سرد',
        size: 'متوسط',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'شیر موز',
        description: 'شیر موز با موز تازه و شیر',
        price: 28000,
        image: '/api/placeholder?width=200&height=150',
        preparationTime: 7,
        ingredients: ['شیر', 'موز', 'عسل', 'یخ'],
        category: 'نوشیدنی طبیعی',
        isAvailable: false,
        rating: 4.4,
        popularity: 75,
        calories: 180,
        allergens: ['لبنیات'],
        temperature: 'سرد',
        size: 'بزرگ',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'کاپوچینو',
        description: 'کاپوچینو با فوم شیر و قهوه',
        price: 35000,
        image: '/api/placeholder?width=200&height=150',
        preparationTime: 10,
        ingredients: ['قهوه', 'شیر', 'فوم شیر', 'شکر'],
        category: 'نوشیدنی گرم',
        isAvailable: true,
        rating: 4.6,
        popularity: 80,
        calories: 120,
        allergens: ['لبنیات'],
        temperature: 'گرم',
        size: 'متوسط',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'لیموناد',
        description: 'لیموناد تازه با لیمو و نعنا',
        price: 20000,
        image: '/api/placeholder?width=200&height=150',
        preparationTime: 4,
        ingredients: ['لیمو', 'آب', 'شکر', 'نعنا'],
        category: 'نوشیدنی طبیعی',
        isAvailable: true,
        rating: 4.3,
        popularity: 72,
        calories: 90,
        allergens: [],
        temperature: 'سرد',
        size: 'متوسط',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]

    // Clear existing data
    await collection.deleteMany({})

    // Insert sample data
    const result = await collection.insertMany(sampleBeverages)

    return NextResponse.json({
      success: true,
      message: 'داده‌های نمونه نوشیدنی‌ها با موفقیت اضافه شدند',
      data: {
        insertedCount: result.insertedCount,
        insertedIds: result.insertedIds
      }
    })
  } catch (error) {
    console.error('Error adding sample beverages:', error)
    return NextResponse.json({
      success: false,
      message: 'خطا در اضافه کردن داده‌های نمونه'
    }, { status: 500 })
  }
}
