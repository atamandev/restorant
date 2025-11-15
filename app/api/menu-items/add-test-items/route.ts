import { NextRequest, NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://restorenUser:1234@localhost:27017/restoren'

let client: MongoClient | undefined
let clientPromise: Promise<MongoClient>

if (!client) {
  client = new MongoClient(MONGO_URI)
  clientPromise = client.connect()
}

export async function POST(request: NextRequest) {
  try {
    const client = await clientPromise
    const db = client.db('restoren')
    const collection = db.collection('menu_items')

    // محصولات تستی با طراحی حرفه‌ای
    const testItems = [
      {
        name: 'کباب کوبیده ویژه',
        description: 'کباب کوبیده با گوشت تازه و برنج دودی، همراه با سبزیجات تازه و نان محلی',
        category: 'غذاهای اصلی',
        price: 125000,
        isAvailable: true,
        isPopular: true,
        preparationTime: 25,
        rating: 4.8,
        image: '/api/placeholder/400/300',
        ingredients: ['گوشت گوساله', 'برنج', 'سبزیجات', 'ادویه مخصوص'],
        allergens: ['گلوتن'],
        tags: ['محبوب', 'ویژه'],
        salesCount: 0,
        nutritionalInfo: {
          calories: 650,
          protein: 45,
          carbs: 55,
          fat: 25
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'جوجه کباب ترش',
        description: 'جوجه کباب با سس مخصوص ترش و برنج زعفرانی، همراه با سالاد فصل',
        category: 'غذاهای اصلی',
        price: 98000,
        isAvailable: true,
        isPopular: true,
        preparationTime: 20,
        rating: 4.6,
        image: '/api/placeholder/400/300',
        ingredients: ['جوجه', 'برنج زعفرانی', 'سالاد', 'سس ترش'],
        allergens: ['گلوتن'],
        tags: ['محبوب'],
        salesCount: 0,
        nutritionalInfo: {
          calories: 580,
          protein: 38,
          carbs: 48,
          fat: 20
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'قیمه سنتی',
        description: 'قیمه اصیل ایرانی با لپه و برنج، همراه با ترشی و سبزی',
        category: 'غذاهای اصلی',
        price: 85000,
        isAvailable: true,
        isPopular: false,
        preparationTime: 30,
        rating: 4.5,
        image: '/api/placeholder/400/300',
        ingredients: ['گوشت', 'لپه', 'برنج', 'ادویه'],
        allergens: ['گلوتن'],
        tags: ['سنتی'],
        salesCount: 0,
        nutritionalInfo: {
          calories: 520,
          protein: 32,
          carbs: 60,
          fat: 18
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'چای ماسالا',
        description: 'چای هندی معطر با ادویه‌های مخصوص و شیر',
        category: 'نوشیدنی',
        price: 25000,
        isAvailable: true,
        isPopular: true,
        preparationTime: 5,
        rating: 4.7,
        image: '/api/placeholder/400/300',
        ingredients: ['چای', 'ادویه ماسالا', 'شیر', 'عسل'],
        allergens: ['لبنیات'],
        tags: ['گرم', 'محبوب'],
        salesCount: 0,
        nutritionalInfo: {
          calories: 80,
          protein: 2,
          carbs: 15,
          fat: 3
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'قهوه اسپرسو',
        description: 'قهوه اسپرسو ایتالیایی با کف خامه‌ای',
        category: 'نوشیدنی',
        price: 35000,
        isAvailable: true,
        isPopular: false,
        preparationTime: 3,
        rating: 4.9,
        image: '/api/placeholder/400/300',
        ingredients: ['قهوه', 'آب'],
        allergens: [],
        tags: ['گرم', 'قوی'],
        salesCount: 0,
        nutritionalInfo: {
          calories: 5,
          protein: 0,
          carbs: 1,
          fat: 0
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'کشک بادمجان',
        description: 'کشک بادمجان سنتی با نان تازه و گردو',
        category: 'پیش غذا',
        price: 65000,
        isAvailable: true,
        isPopular: true,
        preparationTime: 15,
        rating: 4.6,
        image: '/api/placeholder/400/300',
        ingredients: ['بادمجان', 'کشک', 'گردو', 'نان'],
        allergens: ['گلوتن', 'لبنیات'],
        tags: ['سنتی', 'محبوب'],
        salesCount: 0,
        nutritionalInfo: {
          calories: 320,
          protein: 12,
          carbs: 35,
          fat: 15
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'سالاد فصل',
        description: 'سالاد تازه با سبزیجات محلی و سس مخصوص',
        category: 'پیش غذا',
        price: 45000,
        isAvailable: true,
        isPopular: false,
        preparationTime: 8,
        rating: 4.4,
        image: '/api/placeholder/400/300',
        ingredients: ['کاهو', 'گوجه', 'خیار', 'سس'],
        allergens: [],
        tags: ['تازه'],
        salesCount: 0,
        nutritionalInfo: {
          calories: 120,
          protein: 3,
          carbs: 15,
          fat: 5
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'بستنی سنتی',
        description: 'بستنی سنتی با طعم زعفران و پسته',
        category: 'دسر',
        price: 55000,
        isAvailable: true,
        isPopular: true,
        preparationTime: 2,
        rating: 4.8,
        image: '/api/placeholder/400/300',
        ingredients: ['شیر', 'زعفران', 'پسته', 'خامه'],
        allergens: ['لبنیات'],
        tags: ['سرد', 'محبوب'],
        salesCount: 0,
        nutritionalInfo: {
          calories: 280,
          protein: 6,
          carbs: 35,
          fat: 12
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]

    // بررسی اینکه آیا محصولات تستی قبلاً اضافه شده‌اند
    const existingTestItems = await collection.find({
      name: { $in: testItems.map(item => item.name) }
    }).toArray()

    if (existingTestItems.length > 0) {
      return NextResponse.json({
        success: false,
        message: `${existingTestItems.length} محصول تستی قبلاً اضافه شده است`,
        data: { existingCount: existingTestItems.length }
      })
    }

    // اضافه کردن محصولات تستی
    const result = await collection.insertMany(testItems)

    return NextResponse.json({
      success: true,
      message: `${result.insertedCount} محصول تستی با موفقیت اضافه شد`,
      data: {
        insertedCount: result.insertedCount,
        items: testItems.map((item, index) => ({
          name: item.name,
          category: item.category,
          price: item.price
        }))
      }
    })
  } catch (error) {
    console.error('Error adding test menu items:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'خطا در اضافه کردن محصولات تستی',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// DELETE - حذف محصولات تستی
export async function DELETE(request: NextRequest) {
  try {
    const client = await clientPromise
    const db = client.db('restoren')
    const collection = db.collection('menu_items')

    // لیست نام محصولات تستی
    const testItemNames = [
      'کباب کوبیده ویژه',
      'جوجه کباب ترش',
      'قیمه سنتی',
      'چای ماسالا',
      'قهوه اسپرسو',
      'کشک بادمجان',
      'سالاد فصل',
      'بستنی سنتی'
    ]

    const result = await collection.deleteMany({
      name: { $in: testItemNames }
    })

    return NextResponse.json({
      success: true,
      message: `${result.deletedCount} محصول تستی با موفقیت حذف شد`,
      data: { deletedCount: result.deletedCount }
    })
  } catch (error) {
    console.error('Error deleting test menu items:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'خطا در حذف محصولات تستی',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

