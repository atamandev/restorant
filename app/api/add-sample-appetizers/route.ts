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
    const collection = db.collection('appetizers')

    const sampleAppetizers = [
      {
        name: 'سالاد سزار',
        description: 'سالاد سزار با کاهو تازه، پنیر پارمزان و سس مخصوص',
        price: 35000,
        image: '/api/placeholder?width=200&height=150',
        isAvailable: true,
        preparationTime: 10,
        ingredients: ['کاهو', 'پنیر پارمزان', 'سس سزار', 'نان تست'],
        allergens: ['لبنیات', 'گلوتن', 'تخم مرغ'],
        isPopular: true,
        isVegetarian: true,
        isSpicy: false,
        calories: 180,
        tags: ['سالاد', 'سالم', 'پیش غذا'],
        category: 'پیش‌غذاها',
        salesCount: 45,
        rating: 4.5,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'میرزا قاسمی',
        description: 'میرزا قاسمی سنتی با بادمجان کبابی و سیر',
        price: 45000,
        image: '/api/placeholder?width=200&height=150',
        isAvailable: true,
        preparationTime: 15,
        ingredients: ['بادمجان', 'سیر', 'گوجه فرنگی', 'ادویه‌های مخصوص'],
        allergens: [],
        isPopular: false,
        isVegetarian: true,
        isSpicy: false,
        calories: 120,
        tags: ['سنتی', 'گیاهی', 'میرزا قاسمی'],
        category: 'پیش‌غذاها',
        salesCount: 28,
        rating: 4.2,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'سالاد فصل',
        description: 'سالاد فصل با سبزیجات تازه و سس مخصوص',
        price: 25000,
        image: '/api/placeholder?width=200&height=150',
        isAvailable: true,
        preparationTime: 8,
        ingredients: ['سبزیجات فصل', 'سس مخصوص', 'ادویه‌ها'],
        allergens: [],
        isPopular: false,
        isVegetarian: true,
        isSpicy: false,
        calories: 90,
        tags: ['سالاد', 'فصلی', 'سالم'],
        category: 'پیش‌غذاها',
        salesCount: 32,
        rating: 4.0,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'کشک بادمجان',
        description: 'کشک بادمجان سنتی با کشک محلی و بادمجان کبابی',
        price: 55000,
        image: '/api/placeholder?width=200&height=150',
        isAvailable: false,
        preparationTime: 20,
        ingredients: ['بادمجان', 'کشک محلی', 'سیر', 'ادویه‌های مخصوص'],
        allergens: ['لبنیات'],
        isPopular: true,
        isVegetarian: true,
        isSpicy: false,
        calories: 150,
        tags: ['سنتی', 'کشک', 'بادمجان'],
        category: 'پیش‌غذاها',
        salesCount: 38,
        rating: 4.7,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'سالاد الویه',
        description: 'سالاد الویه کلاسیک با سیب زمینی و مرغ',
        price: 40000,
        image: '/api/placeholder?width=200&height=150',
        isAvailable: true,
        preparationTime: 12,
        ingredients: ['سیب زمینی', 'مرغ', 'تخم مرغ', 'سس مایونز'],
        allergens: ['تخم مرغ', 'لبنیات'],
        isPopular: false,
        isVegetarian: false,
        isSpicy: false,
        calories: 220,
        tags: ['الویه', 'کلاسیک', 'مرغ'],
        category: 'پیش‌غذاها',
        salesCount: 25,
        rating: 4.1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'سالاد کلم',
        description: 'سالاد کلم تازه با سس مخصوص',
        price: 20000,
        image: '/api/placeholder?width=200&height=150',
        isAvailable: true,
        preparationTime: 5,
        ingredients: ['کلم', 'سس مخصوص', 'ادویه‌ها'],
        allergens: [],
        isPopular: false,
        isVegetarian: true,
        isSpicy: false,
        calories: 60,
        tags: ['سالاد', 'کلم', 'ساده'],
        category: 'پیش‌غذاها',
        salesCount: 18,
        rating: 3.8,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]

    // Clear existing data
    await collection.deleteMany({})

    // Insert sample data
    const result = await collection.insertMany(sampleAppetizers)

    return NextResponse.json({
      success: true,
      message: 'داده‌های نمونه پیش‌غذاها با موفقیت اضافه شدند',
      data: {
        insertedCount: result.insertedCount,
        insertedIds: result.insertedIds
      }
    })
  } catch (error) {
    console.error('Error adding sample appetizers:', error)
    return NextResponse.json({
      success: false,
      message: 'خطا در اضافه کردن داده‌های نمونه'
    }, { status: 500 })
  }
}
