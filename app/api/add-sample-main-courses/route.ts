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
    const collection = db.collection('main_courses')

    const sampleMainCourses = [
      {
        name: 'کباب کوبیده',
        description: 'کباب کوبیده سنتی با گوشت گوساله تازه و ادویه‌های مخصوص',
        price: 120000,
        image: '/api/placeholder?width=200&height=150',
        preparationTime: 25,
        ingredients: ['گوشت گوساله', 'پیاز', 'زعفران', 'نمک', 'فلفل'],
        category: 'کباب',
        isAvailable: true,
        rating: 4.8,
        popularity: 95,
        calories: 450,
        allergens: ['گلوتن'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'جوجه کباب',
        description: 'جوجه کباب با سینه مرغ تازه و سس مخصوص',
        price: 135000,
        image: '/api/placeholder?width=200&height=150',
        preparationTime: 20,
        ingredients: ['سینه مرغ', 'ماست', 'زعفران', 'لیمو', 'ادویه‌جات'],
        category: 'کباب',
        isAvailable: true,
        rating: 4.6,
        popularity: 88,
        calories: 380,
        allergens: ['لبنیات'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'چلو گوشت',
        description: 'چلو گوشت با گوشت گوساله و برنج ایرانی',
        price: 180000,
        image: '/api/placeholder?width=200&height=150',
        preparationTime: 35,
        ingredients: ['گوشت گوساله', 'برنج', 'پیاز', 'زعفران', 'ادویه‌جات'],
        category: 'چلو',
        isAvailable: true,
        rating: 4.9,
        popularity: 92,
        calories: 520,
        allergens: ['گلوتن'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'قیمه نثار',
        description: 'قیمه نثار با گوشت گوساله و لپه',
        price: 95000,
        image: '/api/placeholder?width=200&height=150',
        preparationTime: 30,
        ingredients: ['گوشت گوساله', 'لپه', 'پیاز', 'رب گوجه', 'ادویه‌جات'],
        category: 'خورش',
        isAvailable: true,
        rating: 4.5,
        popularity: 75,
        calories: 420,
        allergens: ['گلوتن'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'قرمه سبزی',
        description: 'قرمه سبزی با گوشت گوساله و سبزیجات تازه',
        price: 110000,
        image: '/api/placeholder?width=200&height=150',
        preparationTime: 40,
        ingredients: ['گوشت گوساله', 'سبزی قرمه', 'لوبیا قرمز', 'لیمو عمانی'],
        category: 'خورش',
        isAvailable: true,
        rating: 4.7,
        popularity: 82,
        calories: 380,
        allergens: ['گلوتن'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'فسنجان',
        description: 'فسنجان با گوشت گوساله و سس انار',
        price: 150000,
        image: '/api/placeholder?width=200&height=150',
        preparationTime: 45,
        ingredients: ['گوشت گوساله', 'گردو', 'رب انار', 'پیاز', 'شکر'],
        category: 'خورش',
        isAvailable: false,
        rating: 4.9,
        popularity: 78,
        calories: 480,
        allergens: ['آجیل'],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]

    // Clear existing data
    await collection.deleteMany({})

    // Insert sample data
    const result = await collection.insertMany(sampleMainCourses)

    return NextResponse.json({
      success: true,
      message: 'داده‌های نمونه غذاهای اصلی با موفقیت اضافه شدند',
      data: {
        insertedCount: result.insertedCount,
        insertedIds: result.insertedIds
      }
    })
  } catch (error) {
    console.error('Error adding sample main courses:', error)
    return NextResponse.json({
      success: false,
      message: 'خطا در اضافه کردن داده‌های نمونه'
    }, { status: 500 })
  }
}

