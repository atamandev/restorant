import { NextRequest, NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://restorenUser:1234@localhost:27017/restoren'
const DB_NAME = 'restoren'
const COLLECTION_NAME = 'invoice_templates'

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

// POST - اضافه کردن قالب‌های نمونه
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    // پاک کردن داده‌های قبلی
    await collection.deleteMany({})
    
    const sampleTemplates = [
      {
        name: 'قالب فاکتور سالن',
        type: 'dine-in',
        description: 'قالب مخصوص فاکتورهای فروش در سالن رستوران با طراحی کلاسیک',
        isDefault: true,
        isActive: true,
        fields: [
          {
            id: 'field-1',
            name: 'لوگو رستوران',
            type: 'image',
            position: { x: 10, y: 10 },
            size: { width: 100, height: 50 },
            content: '/images/logo.png',
            isVisible: true
          },
          {
            id: 'field-2',
            name: 'نام رستوران',
            type: 'text',
            position: { x: 120, y: 20 },
            size: { width: 200, height: 30 },
            content: 'رستوران سنتی ایرانی',
            isVisible: true
          },
          {
            id: 'field-3',
            name: 'آدرس رستوران',
            type: 'text',
            position: { x: 120, y: 50 },
            size: { width: 200, height: 20 },
            content: 'تهران، خیابان ولیعصر، پلاک ۱۰',
            isVisible: true
          },
          {
            id: 'field-4',
            name: 'شماره فاکتور',
            type: 'text',
            position: { x: 10, y: 80 },
            size: { width: 150, height: 20 },
            content: 'شماره: {invoice_number}',
            isVisible: true
          },
          {
            id: 'field-5',
            name: 'تاریخ فاکتور',
            type: 'text',
            position: { x: 170, y: 80 },
            size: { width: 150, height: 20 },
            content: 'تاریخ: {invoice_date}',
            isVisible: true
          },
          {
            id: 'field-6',
            name: 'شماره میز',
            type: 'text',
            position: { x: 10, y: 110 },
            size: { width: 150, height: 20 },
            content: 'میز: {table_number}',
            isVisible: true
          },
          {
            id: 'field-7',
            name: 'QR کد',
            type: 'qr',
            position: { x: 250, y: 80 },
            size: { width: 50, height: 50 },
            content: '{invoice_qr}',
            isVisible: true
          },
          {
            id: 'field-8',
            name: 'مهر رستوران',
            type: 'stamp',
            position: { x: 200, y: 450 },
            size: { width: 80, height: 80 },
            content: '/images/stamp.png',
            isVisible: true
          }
        ],
        settings: {
          paperSize: '80mm',
          fontSize: 12,
          fontFamily: 'Arial',
          margins: { top: 10, right: 10, bottom: 10, left: 10 }
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        name: 'قالب فاکتور بیرون‌بر',
        type: 'takeaway',
        description: 'قالب مخصوص فاکتورهای بیرون‌بر با اطلاعات تماس مشتری',
        isDefault: false,
        isActive: true,
        fields: [
          {
            id: 'field-1',
            name: 'لوگو رستوران',
            type: 'image',
            position: { x: 10, y: 10 },
            size: { width: 80, height: 40 },
            content: '/images/logo.png',
            isVisible: true
          },
          {
            id: 'field-2',
            name: 'نام رستوران',
            type: 'text',
            position: { x: 100, y: 15 },
            size: { width: 180, height: 25 },
            content: 'رستوران سنتی ایرانی',
            isVisible: true
          },
          {
            id: 'field-3',
            name: 'شماره تماس',
            type: 'text',
            position: { x: 100, y: 40 },
            size: { width: 180, height: 20 },
            content: 'تلفن: 021-12345678',
            isVisible: true
          },
          {
            id: 'field-4',
            name: 'شماره فاکتور',
            type: 'text',
            position: { x: 10, y: 70 },
            size: { width: 140, height: 20 },
            content: 'فاکتور: {invoice_number}',
            isVisible: true
          },
          {
            id: 'field-5',
            name: 'تاریخ',
            type: 'text',
            position: { x: 150, y: 70 },
            size: { width: 130, height: 20 },
            content: 'تاریخ: {invoice_date}',
            isVisible: true
          },
          {
            id: 'field-6',
            name: 'نام مشتری',
            type: 'text',
            position: { x: 10, y: 100 },
            size: { width: 270, height: 20 },
            content: 'مشتری: {customer_name}',
            isVisible: true
          },
          {
            id: 'field-7',
            name: 'شماره تماس مشتری',
            type: 'text',
            position: { x: 10, y: 125 },
            size: { width: 270, height: 20 },
            content: 'تلفن: {customer_phone}',
            isVisible: true
          },
          {
            id: 'field-8',
            name: 'QR کد',
            type: 'qr',
            position: { x: 220, y: 380 },
            size: { width: 60, height: 60 },
            content: '{invoice_qr}',
            isVisible: true
          },
          {
            id: 'field-9',
            name: 'بارکد',
            type: 'barcode',
            position: { x: 10, y: 380 },
            size: { width: 200, height: 40 },
            content: '{invoice_barcode}',
            isVisible: true
          }
        ],
        settings: {
          paperSize: '80mm',
          fontSize: 11,
          fontFamily: 'Arial',
          margins: { top: 10, right: 10, bottom: 10, left: 10 }
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        name: 'قالب فاکتور ارسال',
        type: 'delivery',
        description: 'قالب مخصوص فاکتورهای ارسال با آدرس کامل مشتری',
        isDefault: false,
        isActive: true,
        fields: [
          {
            id: 'field-1',
            name: 'لوگو رستوران',
            type: 'image',
            position: { x: 15, y: 10 },
            size: { width: 90, height: 45 },
            content: '/images/logo.png',
            isVisible: true
          },
          {
            id: 'field-2',
            name: 'نام رستوران',
            type: 'text',
            position: { x: 110, y: 15 },
            size: { width: 170, height: 25 },
            content: 'رستوران سنتی ایرانی',
            isVisible: true
          },
          {
            id: 'field-3',
            name: 'آدرس رستوران',
            type: 'text',
            position: { x: 110, y: 40 },
            size: { width: 170, height: 35 },
            content: 'تهران، خیابان ولیعصر، پلاک ۱۰\nتلفن: 021-12345678',
            isVisible: true
          },
          {
            id: 'field-4',
            name: 'شماره فاکتور',
            type: 'text',
            position: { x: 10, y: 85 },
            size: { width: 130, height: 20 },
            content: 'شماره سفارش: {invoice_number}',
            isVisible: true
          },
          {
            id: 'field-5',
            name: 'تاریخ و زمان',
            type: 'text',
            position: { x: 145, y: 85 },
            size: { width: 135, height: 20 },
            content: '{invoice_date} - {invoice_time}',
            isVisible: true
          },
          {
            id: 'field-6',
            name: 'اطلاعات مشتری',
            type: 'text',
            position: { x: 10, y: 115 },
            size: { width: 270, height: 60 },
            content: 'مشتری: {customer_name}\nتلفن: {customer_phone}\nآدرس: {customer_address}',
            isVisible: true
          },
          {
            id: 'field-7',
            name: 'QR کد',
            type: 'qr',
            position: { x: 200, y: 420 },
            size: { width: 80, height: 80 },
            content: '{invoice_qr}',
            isVisible: true
          },
          {
            id: 'field-8',
            name: 'مهر',
            type: 'stamp',
            position: { x: 10, y: 420 },
            size: { width: 90, height: 90 },
            content: '/images/stamp.png',
            isVisible: true
          }
        ],
        settings: {
          paperSize: '80mm',
          fontSize: 10,
          fontFamily: 'Arial',
          margins: { top: 10, right: 10, bottom: 10, left: 10 }
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        name: 'قالب فاکتور عمومی',
        type: 'general',
        description: 'قالب عمومی برای انواع فاکتورها با طراحی ساده و کاربردی',
        isDefault: false,
        isActive: true,
        fields: [
          {
            id: 'field-1',
            name: 'لوگو رستوران',
            type: 'image',
            position: { x: 20, y: 15 },
            size: { width: 70, height: 35 },
            content: '/images/logo.png',
            isVisible: true
          },
          {
            id: 'field-2',
            name: 'نام رستوران',
            type: 'text',
            position: { x: 100, y: 20 },
            size: { width: 180, height: 25 },
            content: 'رستوران سنتی ایرانی',
            isVisible: true
          },
          {
            id: 'field-3',
            name: 'شماره فاکتور',
            type: 'text',
            position: { x: 10, y: 65 },
            size: { width: 135, height: 18 },
            content: 'شماره: {invoice_number}',
            isVisible: true
          },
          {
            id: 'field-4',
            name: 'تاریخ',
            type: 'text',
            position: { x: 150, y: 65 },
            size: { width: 130, height: 18 },
            content: 'تاریخ: {invoice_date}',
            isVisible: true
          },
          {
            id: 'field-5',
            name: 'QR کد',
            type: 'qr',
            position: { x: 210, y: 400 },
            size: { width: 70, height: 70 },
            content: '{invoice_qr}',
            isVisible: true
          },
          {
            id: 'field-6',
            name: 'بارکد',
            type: 'barcode',
            position: { x: 10, y: 400 },
            size: { width: 190, height: 50 },
            content: '{invoice_barcode}',
            isVisible: true
          }
        ],
        settings: {
          paperSize: '80mm',
          fontSize: 11,
          fontFamily: 'Arial',
          margins: { top: 10, right: 10, bottom: 10, left: 10 }
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        name: 'قالب فاکتور لوکس',
        type: 'dine-in',
        description: 'قالب لوکس و زیبا برای فاکتورهای ویژه با طراحی مدرن',
        isDefault: false,
        isActive: true,
        fields: [
          {
            id: 'field-1',
            name: 'لوگو رستوران',
            type: 'image',
            position: { x: 15, y: 15 },
            size: { width: 120, height: 60 },
            content: '/images/logo.png',
            isVisible: true
          },
          {
            id: 'field-2',
            name: 'نام رستوران',
            type: 'text',
            position: { x: 10, y: 85 },
            size: { width: 270, height: 35 },
            content: 'رستوران سنتی ایرانی\nتجربه‌ای فراموش‌نشدنی',
            isVisible: true
          },
          {
            id: 'field-3',
            name: 'آدرس کامل',
            type: 'text',
            position: { x: 10, y: 125 },
            size: { width: 270, height: 40 },
            content: 'تهران، خیابان ولیعصر، پلاک ۱۰\nتلفن: 021-12345678 | ایمیل: info@restaurant.com',
            isVisible: true
          },
          {
            id: 'field-4',
            name: 'شماره فاکتور',
            type: 'text',
            position: { x: 10, y: 180 },
            size: { width: 135, height: 22 },
            content: 'شماره فاکتور: {invoice_number}',
            isVisible: true
          },
          {
            id: 'field-5',
            name: 'تاریخ و زمان',
            type: 'text',
            position: { x: 150, y: 180 },
            size: { width: 130, height: 22 },
            content: '{invoice_date} - {invoice_time}',
            isVisible: true
          },
          {
            id: 'field-6',
            name: 'میز و خدمه',
            type: 'text',
            position: { x: 10, y: 210 },
            size: { width: 270, height: 25 },
            content: 'میز: {table_number} | خدمه: {waiter_name}',
            isVisible: true
          },
          {
            id: 'field-7',
            name: 'QR کد',
            type: 'qr',
            position: { x: 200, y: 430 },
            size: { width: 80, height: 80 },
            content: '{invoice_qr}',
            isVisible: true
          },
          {
            id: 'field-8',
            name: 'امضا مدیر',
            type: 'signature',
            position: { x: 10, y: 430 },
            size: { width: 180, height: 60 },
            content: '/images/signature.png',
            isVisible: true
          },
          {
            id: 'field-9',
            name: 'مهر رستوران',
            type: 'stamp',
            position: { x: 100, y: 500 },
            size: { width: 90, height: 90 },
            content: '/images/stamp.png',
            isVisible: true
          }
        ],
        settings: {
          paperSize: 'A4',
          fontSize: 12,
          fontFamily: 'Tahoma',
          margins: { top: 15, right: 15, bottom: 15, left: 15 }
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        name: 'قالب فاکتور ساده',
        type: 'general',
        description: 'قالب ساده و سریع برای چاپ فوری',
        isDefault: false,
        isActive: false,
        fields: [
          {
            id: 'field-1',
            name: 'نام رستوران',
            type: 'text',
            position: { x: 10, y: 10 },
            size: { width: 270, height: 25 },
            content: 'رستوران سنتی ایرانی',
            isVisible: true
          },
          {
            id: 'field-2',
            name: 'شماره فاکتور',
            type: 'text',
            position: { x: 10, y: 45 },
            size: { width: 135, height: 18 },
            content: 'فاکتور: {invoice_number}',
            isVisible: true
          },
          {
            id: 'field-3',
            name: 'تاریخ',
            type: 'text',
            position: { x: 150, y: 45 },
            size: { width: 130, height: 18 },
            content: '{invoice_date}',
            isVisible: true
          },
          {
            id: 'field-4',
            name: 'QR کد',
            type: 'qr',
            position: { x: 200, y: 350 },
            size: { width: 80, height: 80 },
            content: '{invoice_qr}',
            isVisible: true
          }
        ],
        settings: {
          paperSize: '80mm',
          fontSize: 10,
          fontFamily: 'Arial',
          margins: { top: 5, right: 5, bottom: 5, left: 5 }
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]
    
    // Insert sample templates
    const result = await collection.insertMany(sampleTemplates)
    
    return NextResponse.json({
      success: true,
      message: `${result.insertedCount} قالب نمونه با موفقیت اضافه شد`,
      data: {
        insertedCount: result.insertedCount,
        insertedIds: result.insertedIds
      }
    })
  } catch (error) {
    console.error('Error adding sample invoice templates:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'خطا در اضافه کردن قالب‌های نمونه'
      },
      { status: 500 }
    )
  }
}

