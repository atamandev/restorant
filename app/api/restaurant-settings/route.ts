import { NextRequest, NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://admin:StrongPassword123@185.204.169.107:27017/restaurant?authSource=admin'
const DB_NAME = 'restaurant'
const COLLECTION_NAME = 'restaurant_settings'

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

// GET - دریافت تنظیمات رستوران
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()
    const settingsCollection = db.collection(COLLECTION_NAME)
    
    // دریافت تنظیمات (یا ایجاد تنظیمات پیش‌فرض اگر وجود نداشت)
    let settings = await settingsCollection.findOne({ type: 'restaurant' })
    
    if (!settings) {
      // تنظیمات پیش‌فرض
      const defaultSettings = {
        type: 'restaurant',
        basicInfo: {
          name: 'رستوران سنتی ایرانی',
          description: 'رستوران سنتی با غذاهای اصیل ایرانی و محیطی گرم و دوستانه',
          address: 'تهران، خیابان ولیعصر، پلاک 123',
          phone: '021-12345678',
          email: 'info@restaurant.com',
          website: 'www.restaurant.com',
          logo: '/api/placeholder/200/200'
        },
        businessHours: {
          saturday: { open: '09:00', close: '23:00', isOpen: true },
          sunday: { open: '09:00', close: '23:00', isOpen: true },
          monday: { open: '09:00', close: '23:00', isOpen: true },
          tuesday: { open: '09:00', close: '23:00', isOpen: true },
          wednesday: { open: '09:00', close: '23:00', isOpen: true },
          thursday: { open: '09:00', close: '23:00', isOpen: true },
          friday: { open: '14:00', close: '23:00', isOpen: true }
        },
        financial: {
          currency: 'IRR',
          taxRate: 9,
          serviceCharge: 10,
          discountLimit: 20,
          minimumOrder: 50000,
          goldenCustomerDiscount: 2 // درصد تخفیف برای مشتریان طلایی (پیش‌فرض 2%)
        },
        pos: {
          receiptPrinter: 'EPSON TM-T20III',
          kitchenPrinter: 'EPSON TM-T20III',
          cashDrawer: 'EPSON TM-T20III',
          barcodeScanner: 'Honeywell 1450g',
          customerDisplay: 'Samsung 15"'
        },
        notifications: {
          email: true,
          sms: true,
          push: true,
          lowStock: true,
          newOrder: true,
          paymentReceived: true
        },
        security: {
          requirePassword: true,
          sessionTimeout: 30,
          backupFrequency: 'daily',
          dataRetention: 365
        },
        integrations: {
          paymentGateway: 'ZarinPal',
          deliveryService: 'SnappFood',
          accountingSoftware: 'پارسیان',
          inventorySystem: 'انبار آنلاین'
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      const result = await settingsCollection.insertOne(defaultSettings)
      settings = { ...defaultSettings, _id: result.insertedId }
    }
    
    // حذف _id از خروجی یا تبدیل به string
    const { _id, ...settingsData } = settings
    
    return NextResponse.json({
      success: true,
      data: settingsData
    })
  } catch (error) {
    console.error('Error fetching restaurant settings:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت تنظیمات' },
      { status: 500 }
    )
  }
}

// PUT - به‌روزرسانی تنظیمات رستوران
export async function PUT(request: NextRequest) {
  try {
    await connectToDatabase()
    const settingsCollection = db.collection(COLLECTION_NAME)
    const body = await request.json()
    
    // دریافت تنظیمات فعلی
    let currentSettings = await settingsCollection.findOne({ type: 'restaurant' })
    
    if (!currentSettings) {
      // اگر تنظیمات وجود نداشت، ابتدا ایجاد کن
      await GET(request)
      currentSettings = await settingsCollection.findOne({ type: 'restaurant' })
    }
    
    // ادغام تنظیمات جدید با تنظیمات موجود
    const updateData: any = {
      updatedAt: new Date()
    }
    
    // به‌روزرسانی هر بخش به صورت مستقل
    if (body.basicInfo) {
      updateData.basicInfo = {
        ...currentSettings.basicInfo,
        ...body.basicInfo
      }
    }
    
    if (body.businessHours) {
      updateData.businessHours = {
        ...currentSettings.businessHours,
        ...body.businessHours
      }
    }
    
    if (body.financial) {
      updateData.financial = {
        ...currentSettings.financial,
        ...body.financial
      }
    }
    
    if (body.pos) {
      updateData.pos = {
        ...currentSettings.pos,
        ...body.pos
      }
    }
    
    if (body.notifications) {
      updateData.notifications = {
        ...currentSettings.notifications,
        ...body.notifications
      }
    }
    
    if (body.security) {
      updateData.security = {
        ...currentSettings.security,
        ...body.security
      }
    }
    
    if (body.integrations) {
      updateData.integrations = {
        ...currentSettings.integrations,
        ...body.integrations
      }
    }
    
    // به‌روزرسانی در دیتابیس
    const result = await settingsCollection.updateOne(
      { type: 'restaurant' },
      { $set: updateData }
    )
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'تنظیمات یافت نشد' },
        { status: 404 }
      )
    }
    
    // دریافت تنظیمات به‌روز شده
    const updatedSettings = await settingsCollection.findOne({ type: 'restaurant' })
    const { _id, ...settingsData } = updatedSettings
    
    return NextResponse.json({
      success: true,
      data: settingsData,
      message: 'تنظیمات با موفقیت به‌روزرسانی شد'
    })
  } catch (error) {
    console.error('Error updating restaurant settings:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در به‌روزرسانی تنظیمات' },
      { status: 500 }
    )
  }
}

