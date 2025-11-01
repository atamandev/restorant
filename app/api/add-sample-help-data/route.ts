import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://restorenUser:1234@localhost:27017/restoren'
const DB_NAME = 'restoren'
const FAQ_COLLECTION = 'help_faqs'
const ARTICLES_COLLECTION = 'help_articles'
const SECTIONS_COLLECTION = 'help_sections'

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

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()
    
    const faqsCollection = db.collection(FAQ_COLLECTION)
    const articlesCollection = db.collection(ARTICLES_COLLECTION)
    const sectionsCollection = db.collection(SECTIONS_COLLECTION)

    // Clear existing data (optional - you might want to keep existing data)
    // await faqsCollection.deleteMany({})
    // await articlesCollection.deleteMany({})
    // await sectionsCollection.deleteMany({})

    // Sample Sections
    const sampleSections = [
      {
        title: 'شروع کار',
        description: 'راهنمای شروع کار با سیستم مدیریت رستوران',
        icon: 'BookOpen',
        order: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: 'مدیریت سفارشات',
        description: 'نحوه ثبت، پیگیری و مدیریت سفارشات',
        icon: 'ShoppingCart',
        order: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: 'مدیریت موجودی',
        description: 'راهنمای مدیریت موجودی و انبار',
        icon: 'Package',
        order: 3,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: 'گزارشات',
        description: 'نحوه استفاده از گزارشات و آمار',
        icon: 'BarChart3',
        order: 4,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: 'تنظیمات',
        description: 'راهنمای تنظیمات سیستم',
        icon: 'Settings',
        order: 5,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]

    // Insert sections and get their IDs
    const insertedSections = await sectionsCollection.insertMany(sampleSections)
    const sectionIds = Object.values(insertedSections.insertedIds)

    // Sample FAQs
    const sampleFAQs = [
      {
        question: 'چگونه می‌توانم یک سفارش جدید ثبت کنم؟',
        answer: 'برای ثبت سفارش جدید، به بخش "سفارشات" بروید و روی دکمه "سفارش جدید" کلیک کنید. سپس اطلاعات مشتری و آیتم‌های سفارش را وارد کنید.',
        category: 'سفارشات',
        tags: ['سفارش', 'ثبت', 'مشتری'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        question: 'چگونه موجودی کالا را به‌روزرسانی کنم؟',
        answer: 'در بخش "موجودی" می‌توانید موجودی کالاها را مشاهده و ویرایش کنید. همچنین می‌توانید از بخش "تنظیمات" تنظیمات خودکار موجودی را فعال کنید.',
        category: 'موجودی',
        tags: ['موجودی', 'کالا', 'انبار'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        question: 'چگونه گزارش فروش را مشاهده کنم؟',
        answer: 'به بخش "گزارشات" بروید و "گزارش فروش" را انتخاب کنید. می‌توانید گزارش را برای دوره‌های زمانی مختلف فیلتر کنید.',
        category: 'گزارشات',
        tags: ['گزارش', 'فروش', 'آمار'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        question: 'چگونه اطلاعات رستوران را ویرایش کنم؟',
        answer: 'به بخش "تنظیمات" و سپس "اطلاعات رستوران" بروید. در این بخش می‌توانید نام، آدرس، شماره تماس و سایر اطلاعات را ویرایش کنید.',
        category: 'تنظیمات',
        tags: ['تنظیمات', 'رستوران', 'اطلاعات'],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]

    // Sample Articles
    const sampleArticles = [
      {
        title: 'راهنمای نصب و راه‌اندازی',
        description: 'مراحل کامل نصب و راه‌اندازی سیستم',
        content: 'برای نصب سیستم مدیریت رستوران:\n\n1. سیستم را دانلود کنید\n2. فایل را استخراج کنید\n3. دستورات نصب را اجرا کنید\n4. پایگاه داده را تنظیم کنید\n5. سیستم را راه‌اندازی کنید',
        category: 'عمومی',
        difficulty: 'beginner',
        estimatedTime: '15 دقیقه',
        tags: ['نصب', 'راه‌اندازی', 'پیکربندی'],
        sectionId: sectionIds[0].toString(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: 'ثبت سفارش جدید',
        description: 'نحوه ثبت سفارش برای مشتری',
        content: 'برای ثبت سفارش:\n\n1. به بخش POS بروید\n2. نوع سفارش را انتخاب کنید (داخل رستوران، بیرون‌بر، ارسال)\n3. میز یا اطلاعات مشتری را وارد کنید\n4. آیتم‌های منو را انتخاب کنید\n5. سفارش را ثبت کنید',
        category: 'سفارشات',
        difficulty: 'beginner',
        estimatedTime: '5 دقیقه',
        tags: ['سفارش', 'POS', 'ثبت'],
        sectionId: sectionIds[1].toString(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: 'مدیریت موجودی و انبار',
        description: 'راهنمای کامل مدیریت موجودی',
        content: 'برای مدیریت موجودی:\n\n1. به بخش "موجودی" بروید\n2. لیست کالاها را مشاهده کنید\n3. برای افزودن کالای جدید، روی "افزودن" کلیک کنید\n4. اطلاعات کالا را وارد کنید\n5. موجودی اولیه را تنظیم کنید\n6. هشدار کمبود موجودی را فعال کنید',
        category: 'موجودی',
        difficulty: 'intermediate',
        estimatedTime: '10 دقیقه',
        tags: ['موجودی', 'انبار', 'کالا'],
        sectionId: sectionIds[2].toString(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: 'مشاهده گزارشات فروش',
        description: 'نحوه مشاهده و تحلیل گزارشات',
        content: 'برای مشاهده گزارشات:\n\n1. به بخش "گزارشات" بروید\n2. نوع گزارش را انتخاب کنید (فروش، موجودی، مشتری)\n3. دوره زمانی را تعیین کنید\n4. فیلترها را اعمال کنید\n5. گزارش را مشاهده یا دانلود کنید',
        category: 'گزارشات',
        difficulty: 'beginner',
        estimatedTime: '5 دقیقه',
        tags: ['گزارش', 'فروش', 'آمار'],
        sectionId: sectionIds[3].toString(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: 'تنظیمات سیستم',
        description: 'راهنمای تنظیمات سیستم',
        content: 'برای تنظیمات سیستم:\n\n1. به بخش "تنظیمات" بروید\n2. بخش مورد نظر را انتخاب کنید\n3. تنظیمات را تغییر دهید\n4. تغییرات را ذخیره کنید',
        category: 'تنظیمات',
        difficulty: 'intermediate',
        estimatedTime: '10 دقیقه',
        tags: ['تنظیمات', 'پیکربندی', 'سیستم'],
        sectionId: sectionIds[4].toString(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]

    // Insert FAQs and Articles
    await faqsCollection.insertMany(sampleFAQs)
    await articlesCollection.insertMany(sampleArticles)

    return NextResponse.json({
      success: true,
      message: `✅ ${sampleSections.length} بخش، ${sampleFAQs.length} سوال متداول و ${sampleArticles.length} مقاله نمونه با موفقیت اضافه شدند`,
      data: {
        sections: sampleSections.length,
        faqs: sampleFAQs.length,
        articles: sampleArticles.length
      }
    })
  } catch (error) {
    console.error('Error adding sample help data:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در افزودن داده‌های نمونه' },
      { status: 500 }
    )
  }
}

