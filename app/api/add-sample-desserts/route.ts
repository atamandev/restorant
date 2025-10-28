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
    const collection = db.collection('desserts')

    const sampleDesserts = [
      {
        name: 'بستنی سنتی',
        description: 'بستنی سنتی با طعم زعفران و گلاب',
        price: 35000,
        image: '/api/placeholder?width=200&height=150',
        preparationTime: 5,
        ingredients: ['شیر', 'خامه', 'زعفران', 'گلاب', 'شکر'],
        category: 'بستنی',
        isAvailable: true,
        rating: 4.8,
        popularity: 92,
        calories: 180,
        allergens: ['لبنیات'],
        sweetness: 'متوسط',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'شیرینی تر',
        description: 'شیرینی تر با خامه و توت فرنگی',
        price: 45000,
        image: '/api/placeholder?width=200&height=150',
        preparationTime: 10,
        ingredients: ['آرد', 'خامه', 'توت فرنگی', 'شکر', 'تخم مرغ'],
        category: 'شیرینی',
        isAvailable: true,
        rating: 4.6,
        popularity: 85,
        calories: 320,
        allergens: ['گلوتن', 'لبنیات', 'تخم مرغ'],
        sweetness: 'زیاد',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'کیک شکلاتی',
        description: 'کیک شکلاتی با گاناش و توت فرنگی',
        price: 55000,
        image: '/api/placeholder?width=200&height=150',
        preparationTime: 15,
        ingredients: ['آرد', 'شکلات', 'کره', 'شکر', 'تخم مرغ', 'توت فرنگی'],
        category: 'کیک',
        isAvailable: true,
        rating: 4.9,
        popularity: 88,
        calories: 450,
        allergens: ['گلوتن', 'لبنیات', 'تخم مرغ'],
        sweetness: 'زیاد',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'پودینگ وانیل',
        description: 'پودینگ وانیل با توت فرنگی تازه',
        price: 25000,
        image: '/api/placeholder?width=200&height=150',
        preparationTime: 8,
        ingredients: ['شیر', 'وانیل', 'شکر', 'توت فرنگی', 'ژلاتین'],
        category: 'پودینگ',
        isAvailable: true,
        rating: 4.4,
        popularity: 78,
        calories: 150,
        allergens: ['لبنیات'],
        sweetness: 'متوسط',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'ترافل شکلاتی',
        description: 'ترافل شکلاتی با پودر کاکائو',
        price: 40000,
        image: '/api/placeholder?width=200&height=150',
        preparationTime: 12,
        ingredients: ['شکلات', 'خامه', 'کره', 'پودر کاکائو'],
        category: 'ترافل',
        isAvailable: false,
        rating: 4.7,
        popularity: 82,
        calories: 280,
        allergens: ['لبنیات'],
        sweetness: 'زیاد',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'ماکارون',
        description: 'ماکارون با طعم وانیل و توت فرنگی',
        price: 60000,
        image: '/api/placeholder?width=200&height=150',
        preparationTime: 20,
        ingredients: ['بادام', 'شکر', 'تخم مرغ', 'وانیل', 'توت فرنگی'],
        category: 'ماکارون',
        isAvailable: true,
        rating: 4.8,
        popularity: 90,
        calories: 200,
        allergens: ['آجیل', 'تخم مرغ'],
        sweetness: 'زیاد',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]

    // Clear existing data
    await collection.deleteMany({})

    // Insert sample data
    const result = await collection.insertMany(sampleDesserts)

    return NextResponse.json({
      success: true,
      message: 'داده‌های نمونه دسرها با موفقیت اضافه شدند',
      data: {
        insertedCount: result.insertedCount,
        insertedIds: result.insertedIds
      }
    })
  } catch (error) {
    console.error('Error adding sample desserts:', error)
    return NextResponse.json({
      success: false,
      message: 'خطا در اضافه کردن داده‌های نمونه'
    }, { status: 500 })
  }
}
