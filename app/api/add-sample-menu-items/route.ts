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
    const collection = db.collection('menu_items')

    const sampleItems = [
      {
        name: 'کباب کوبیده',
        description: 'کباب کوبیده سنتی با گوشت گوساله تازه و ادویه‌های مخصوص',
        price: 120000,
        category: 'غذاهای اصلی',
        image: '/api/placeholder?width=200&height=200',
        isAvailable: true,
        isPopular: true,
        preparationTime: 25,
        ingredients: ['گوشت گوساله', 'پیاز', 'زعفران', 'نمک', 'فلفل'],
        allergens: ['گلوتن'],
        nutritionalInfo: {
          calories: 450,
          protein: 35,
          carbs: 15,
          fat: 25
        },
        tags: ['سنتی', 'پرفروش', 'گوشت'],
        salesCount: 1250,
        rating: 4.8,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'جوجه کباب',
        description: 'جوجه کباب با سینه مرغ تازه و سس مخصوص',
        price: 135000,
        category: 'غذاهای اصلی',
        image: '/api/placeholder?width=200&height=200',
        isAvailable: true,
        isPopular: true,
        preparationTime: 20,
        ingredients: ['سینه مرغ', 'ماست', 'زعفران', 'نمک', 'فلفل'],
        allergens: ['لبنیات'],
        nutritionalInfo: {
          calories: 380,
          protein: 40,
          carbs: 10,
          fat: 18
        },
        tags: ['سنتی', 'پرفروش', 'مرغ'],
        salesCount: 980,
        rating: 4.7,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'سالاد سزار',
        description: 'سالاد سزار با کاهو تازه، پنیر پارمزان و سس مخصوص',
        price: 45000,
        category: 'پیش‌غذاها',
        image: '/api/placeholder?width=200&height=200',
        isAvailable: true,
        isPopular: false,
        preparationTime: 10,
        ingredients: ['کاهو', 'پنیر پارمزان', 'سس سزار', 'نان تست'],
        allergens: ['لبنیات', 'گلوتن'],
        nutritionalInfo: {
          calories: 280,
          protein: 12,
          carbs: 20,
          fat: 18
        },
        tags: ['سالاد', 'سالم', 'پیش‌غذا'],
        salesCount: 320,
        rating: 4.3,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'نوشابه',
        description: 'نوشابه گازدار سرد',
        price: 15000,
        category: 'نوشیدنی‌ها',
        image: '/api/placeholder?width=200&height=200',
        isAvailable: true,
        isPopular: false,
        preparationTime: 2,
        ingredients: ['نوشابه'],
        allergens: [],
        nutritionalInfo: {
          calories: 140,
          protein: 0,
          carbs: 35,
          fat: 0
        },
        tags: ['نوشیدنی', 'سرد', 'گازدار'],
        salesCount: 2100,
        rating: 4.0,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'دوغ محلی',
        description: 'دوغ محلی تازه و خنک',
        price: 18000,
        category: 'نوشیدنی‌ها',
        image: '/api/placeholder?width=200&height=200',
        isAvailable: true,
        isPopular: true,
        preparationTime: 3,
        ingredients: ['دوغ', 'نمک', 'نعنا'],
        allergens: ['لبنیات'],
        nutritionalInfo: {
          calories: 80,
          protein: 6,
          carbs: 8,
          fat: 3
        },
        tags: ['نوشیدنی', 'سرد', 'محلی'],
        salesCount: 850,
        rating: 4.5,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'میرزا قاسمی',
        description: 'میرزا قاسمی با بادمجان کبابی و سیر',
        price: 70000,
        category: 'پیش‌غذاها',
        image: '/api/placeholder?width=200&height=200',
        isAvailable: true,
        isPopular: false,
        preparationTime: 15,
        ingredients: ['بادمجان', 'سیر', 'گوجه', 'تخم مرغ'],
        allergens: ['تخم مرغ'],
        nutritionalInfo: {
          calories: 220,
          protein: 8,
          carbs: 25,
          fat: 12
        },
        tags: ['سنتی', 'گیاهی', 'پیش‌غذا'],
        salesCount: 180,
        rating: 4.2,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'چلو گوشت',
        description: 'چلو گوشت با گوشت گوساله و برنج ایرانی',
        price: 180000,
        category: 'غذاهای اصلی',
        image: '/api/placeholder?width=200&height=200',
        isAvailable: false,
        isPopular: false,
        preparationTime: 35,
        ingredients: ['گوشت گوساله', 'برنج', 'پیاز', 'زعفران'],
        allergens: ['گلوتن'],
        nutritionalInfo: {
          calories: 650,
          protein: 45,
          carbs: 55,
          fat: 28
        },
        tags: ['سنتی', 'گوشت', 'گران'],
        salesCount: 95,
        rating: 4.6,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'بستنی سنتی',
        description: 'بستنی سنتی با طعم زعفران و گلاب',
        price: 35000,
        category: 'دسرها',
        image: '/api/placeholder?width=200&height=200',
        isAvailable: true,
        isPopular: true,
        preparationTime: 5,
        ingredients: ['شیر', 'خامه', 'زعفران', 'گلاب'],
        allergens: ['لبنیات'],
        nutritionalInfo: {
          calories: 320,
          protein: 8,
          carbs: 35,
          fat: 18
        },
        tags: ['دسر', 'سنتی', 'سرد'],
        salesCount: 650,
        rating: 4.9,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]

    // Clear existing data
    await collection.deleteMany({})

    // Insert sample data
    const result = await collection.insertMany(sampleItems)

    return NextResponse.json({
      success: true,
      message: 'داده‌های نمونه آیتم‌های منو با موفقیت اضافه شدند',
      data: {
        insertedCount: result.insertedCount,
        insertedIds: result.insertedIds
      }
    })
  } catch (error) {
    console.error('Error adding sample menu items:', error)
    return NextResponse.json({
      success: false,
      message: 'خطا در اضافه کردن داده‌های نمونه'
    }, { status: 500 })
  }
}