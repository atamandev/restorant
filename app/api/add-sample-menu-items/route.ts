import { NextRequest, NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://restorenUser:1234@localhost:27017/restoren'

export async function POST(request: NextRequest) {
  let client: MongoClient | null = null
  
  try {
    console.log('Adding sample menu items...')
    client = new MongoClient(MONGO_URI)
    await client.connect()
    
    const db = client.db('restoren')
    const collection = db.collection('menu_items')
    
    // آیتم‌های نمونه منو
    const sampleMenuItems = [
      {
        name: "کباب کوبیده",
        category: "غذاهای اصلی",
        price: 120000,
        preparationTime: 25,
        description: "کباب کوبیده سنتی با گوشت گوساله تازه",
        ingredients: ["گوشت گوساله", "پیاز", "نمک", "فلفل", "زعفران"],
        allergens: [],
        isAvailable: true,
        isPopular: true,
        imageUrl: "",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: "جوجه کباب",
        category: "غذاهای اصلی",
        price: 135000,
        preparationTime: 20,
        description: "جوجه کباب با سینه مرغ و ادویه‌های مخصوص",
        ingredients: ["سینه مرغ", "ماست", "زعفران", "لیمو", "ادویه"],
        allergens: ["لاکتوز"],
        isAvailable: true,
        isPopular: true,
        imageUrl: "",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: "سالاد سزار",
        category: "پیش‌غذاها",
        price: 45000,
        preparationTime: 10,
        description: "سالاد سزار با کاهو، پنیر پارمزان و سس مخصوص",
        ingredients: ["کاهو", "پنیر پارمزان", "نان تست", "سس سزار"],
        allergens: ["لاکتوز", "گلوتن"],
        isAvailable: true,
        isPopular: false,
        imageUrl: "",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: "نوشابه",
        category: "نوشیدنی‌ها",
        price: 15000,
        preparationTime: 2,
        description: "نوشابه گازدار سرد",
        ingredients: ["آب گازدار", "شکر", "طعم‌دهنده"],
        allergens: [],
        isAvailable: true,
        isPopular: true,
        imageUrl: "",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: "دوغ محلی",
        category: "نوشیدنی‌ها",
        price: 18000,
        preparationTime: 3,
        description: "دوغ محلی تازه و خنک",
        ingredients: ["ماست", "آب", "نمک", "نعنا"],
        allergens: ["لاکتوز"],
        isAvailable: true,
        isPopular: false,
        imageUrl: "",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: "میرزا قاسمی",
        category: "پیش‌غذاها",
        price: 70000,
        preparationTime: 15,
        description: "میرزا قاسمی با بادمجان کبابی و گوجه",
        ingredients: ["بادمجان", "گوجه", "پیاز", "سیر", "تخم مرغ"],
        allergens: [],
        isAvailable: true,
        isPopular: true,
        imageUrl: "",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: "چلو گوشت",
        category: "غذاهای اصلی",
        price: 180000,
        preparationTime: 35,
        description: "چلو گوشت با برنج ایرانی و گوشت گوساله",
        ingredients: ["برنج ایرانی", "گوشت گوساله", "پیاز", "زعفران", "ادویه"],
        allergens: [],
        isAvailable: true,
        isPopular: true,
        imageUrl: "",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: "بستنی سنتی",
        category: "دسرها",
        price: 35000,
        preparationTime: 5,
        description: "بستنی سنتی با طعم‌های مختلف",
        ingredients: ["شیر", "شکر", "خامه", "طعم‌دهنده"],
        allergens: ["لاکتوز"],
        isAvailable: true,
        isPopular: false,
        imageUrl: "",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: "قیمه",
        category: "غذاهای اصلی",
        price: 95000,
        preparationTime: 30,
        description: "قیمه با لپه و گوشت گوساله",
        ingredients: ["لپه", "گوشت گوساله", "پیاز", "رب گوجه", "لیمو عمانی"],
        allergens: [],
        isAvailable: true,
        isPopular: false,
        imageUrl: "",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: "آب دوغ خیار",
        category: "نوشیدنی‌ها",
        price: 25000,
        preparationTime: 5,
        description: "آب دوغ خیار با نعنا و خیار تازه",
        ingredients: ["دوغ", "خیار", "نعنا", "نمک", "آب"],
        allergens: ["لاکتوز"],
        isAvailable: true,
        isPopular: true,
        imageUrl: "",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: "کباب بختیاری",
        category: "غذاهای اصلی",
        price: 150000,
        preparationTime: 30,
        description: "کباب بختیاری با گوشت و جوجه",
        ingredients: ["گوشت گوساله", "سینه مرغ", "پیاز", "زعفران", "ادویه"],
        allergens: [],
        isAvailable: true,
        isPopular: true,
        imageUrl: "",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: "زرشک پلو",
        category: "غذاهای اصلی",
        price: 110000,
        preparationTime: 25,
        description: "زرشک پلو با مرغ و زرشک",
        ingredients: ["برنج", "مرغ", "زرشک", "پیاز", "زعفران"],
        allergens: [],
        isAvailable: true,
        isPopular: false,
        imageUrl: "",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: "چای",
        category: "نوشیدنی‌ها",
        price: 5000,
        preparationTime: 3,
        description: "چای ایرانی داغ",
        ingredients: ["چای", "آب", "شکر"],
        allergens: [],
        isAvailable: true,
        isPopular: true,
        imageUrl: "",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: "قهوه ترک",
        category: "نوشیدنی‌ها",
        price: 25000,
        preparationTime: 5,
        description: "قهوه ترک اصیل",
        ingredients: ["قهوه ترک", "آب", "شکر"],
        allergens: [],
        isAvailable: true,
        isPopular: false,
        imageUrl: "",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: "کوفته تبریزی",
        category: "غذاهای اصلی",
        price: 85000,
        preparationTime: 40,
        description: "کوفته تبریزی با برنج و گوشت",
        ingredients: ["برنج", "گوشت گوساله", "پیاز", "زعفران", "ادویه"],
        allergens: [],
        isAvailable: true,
        isPopular: false,
        imageUrl: "",
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]
    
    // حذف آیتم‌های قبلی
    await collection.deleteMany({})
    console.log('Cleared existing menu items')
    
    // اضافه کردن آیتم‌های جدید
    const result = await collection.insertMany(sampleMenuItems)
    console.log(`Added ${result.insertedCount} menu items`)
    
    return NextResponse.json({
      success: true,
      message: `${result.insertedCount} آیتم منو با موفقیت اضافه شد`,
      count: result.insertedCount
    })
  } catch (error) {
    console.error('Error adding menu items:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در اضافه کردن آیتم‌های منو',
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
