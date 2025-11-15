import { NextRequest, NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://admin:StrongPassword123@185.204.169.107:27017/restaurant?authSource=admin'
const DB_NAME = 'restaurant'
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

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)

    // بررسی اینکه آیا قالب‌های نمونه قبلاً اضافه شده‌اند
    const existingTemplates = await collection.find({ 
      name: { 
        $in: [
          'قالب عمودی با هدر بزرگ',
          'قالب دو ستونی افقی',
          'قالب کارتی با باکس‌های جداگانه'
        ] 
      } 
    }).toArray()

    if (existingTemplates.length > 0) {
      return NextResponse.json({
        success: false,
        message: 'قالب‌های نمونه قبلاً اضافه شده‌اند'
      })
    }

    const sampleTemplates = [
      {
        name: 'قالب عمودی با هدر بزرگ',
        type: 'general',
        description: 'قالب عمودی با هدر بزرگ و لوگو در مرکز، مناسب برای فاکتورهای رسمی و مهم',
        isDefault: true,
        isActive: true,
        fields: [
          {
            name: 'هدر بزرگ - لوگو مرکزی',
            type: 'image',
            position: { x: 150, y: 10 },
            size: { width: 120, height: 120 },
            content: '/logo.png',
            isVisible: true
          },
          {
            name: 'نام رستوران - مرکز',
            type: 'text',
            position: { x: 50, y: 140 },
            size: { width: 320, height: 35 },
            content: '{{restaurantName}}',
            isVisible: true
          },
          {
            name: 'آدرس - مرکز',
            type: 'text',
            position: { x: 50, y: 180 },
            size: { width: 320, height: 25 },
            content: '{{restaurantAddress}}',
            isVisible: true
          },
          {
            name: 'تماس و ایمیل - مرکز',
            type: 'text',
            position: { x: 50, y: 210 },
            size: { width: 320, height: 30 },
            content: 'تلفن: {{restaurantPhone}} | ایمیل: {{restaurantEmail}}',
            isVisible: true
          },
          {
            name: 'خط جداکننده هدر',
            type: 'text',
            position: { x: 20, y: 250 },
            size: { width: 380, height: 3 },
            content: '═══════════════════════════════════════════════════',
            isVisible: true
          },
          {
            name: 'عنوان فاکتور - بزرگ',
            type: 'text',
            position: { x: 120, y: 270 },
            size: { width: 180, height: 40 },
            content: 'فاکتور رسمی فروش',
            isVisible: true
          },
          {
            name: 'شماره فاکتور - سمت راست',
            type: 'text',
            position: { x: 20, y: 330 },
            size: { width: 180, height: 25 },
            content: 'شماره فاکتور: {{invoiceNumber}}',
            isVisible: true
          },
          {
            name: 'تاریخ و زمان - سمت چپ',
            type: 'text',
            position: { x: 220, y: 330 },
            size: { width: 180, height: 25 },
            content: '{{invoiceDate}} - {{invoiceTime}}',
            isVisible: true
          },
          {
            name: 'باکس اطلاعات مشتری',
            type: 'text',
            position: { x: 20, y: 370 },
            size: { width: 380, height: 80 },
            content: '┌─ اطلاعات مشتری ─────────────────────────────┐\n│ نام: {{customerName}}\n│ کد ملی: {{customerNationalId}}\n│ آدرس: {{customerAddress}}\n└────────────────────────────────────────────┘',
            isVisible: true
          },
          {
            name: 'جدول آیتم‌ها - کامل',
            type: 'text',
            position: { x: 20, y: 470 },
            size: { width: 380, height: 250 },
            content: '{{itemsTable}}',
            isVisible: true
          },
          {
            name: 'خلاصه مالی - سمت چپ',
            type: 'text',
            position: { x: 220, y: 740 },
            size: { width: 180, height: 100 },
            content: 'زیرمجموع: {{subtotal}}\nمالیات (۹٪): {{tax}}\nتخفیف: {{discount}}\n─────────────────\nمبلغ کل: {{total}}',
            isVisible: true
          },
          {
            name: 'QR کد - سمت راست',
            type: 'qr',
            position: { x: 20, y: 740 },
            size: { width: 120, height: 120 },
            content: '{{invoiceQRCode}}',
            isVisible: true
          },
          {
            name: 'مهر و امضا - پایین',
            type: 'stamp',
            position: { x: 300, y: 870 },
            size: { width: 100, height: 100 },
            content: '/stamp.png',
            isVisible: true
          },
          {
            name: 'امضا - پایین',
            type: 'signature',
            position: { x: 180, y: 870 },
            size: { width: 100, height: 100 },
            content: '{{signature}}',
            isVisible: true
          },
          {
            name: 'فوتر - مرکز',
            type: 'text',
            position: { x: 50, y: 990 },
            size: { width: 320, height: 50 },
            content: '{{footerText}}\n═══════════════════════════════════════\nبا تشکر از انتخاب شما',
            isVisible: true
          }
        ],
        settings: {
          paperSize: 'A4',
          orientation: 'portrait',
          margin: { top: 10, right: 10, bottom: 10, left: 10 },
          fontFamily: 'Tahoma, Arial, sans-serif',
          fontSize: 12,
          headerHeight: 120,
          footerHeight: 50
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        name: 'قالب دو ستونی افقی',
        type: 'general',
        description: 'قالب دو ستونی با اطلاعات در سمت راست و آیتم‌ها در سمت چپ، مناسب برای فاکتورهای طولانی',
        isDefault: false,
        isActive: true,
        fields: [
          {
            name: 'ستون راست - لوگو بالا',
            type: 'image',
            position: { x: 250, y: 10 },
            size: { width: 80, height: 80 },
            content: '/logo.png',
            isVisible: true
          },
          {
            name: 'ستون راست - نام رستوران',
            type: 'text',
            position: { x: 250, y: 100 },
            size: { width: 150, height: 25 },
            content: '{{restaurantName}}',
            isVisible: true
          },
          {
            name: 'ستون راست - آدرس',
            type: 'text',
            position: { x: 250, y: 130 },
            size: { width: 150, height: 40 },
            content: '{{restaurantAddress}}',
            isVisible: true
          },
          {
            name: 'ستون راست - تماس',
            type: 'text',
            position: { x: 250, y: 175 },
            size: { width: 150, height: 20 },
            content: '{{restaurantPhone}}',
            isVisible: true
          },
          {
            name: 'ستون راست - خط جداکننده',
            type: 'text',
            position: { x: 250, y: 205 },
            size: { width: 150, height: 2 },
            content: '────────────────────',
            isVisible: true
          },
          {
            name: 'ستون راست - عنوان فاکتور',
            type: 'text',
            position: { x: 250, y: 220 },
            size: { width: 150, height: 25 },
            content: 'INVOICE',
            isVisible: true
          },
          {
            name: 'ستون راست - شماره',
            type: 'text',
            position: { x: 250, y: 250 },
            size: { width: 150, height: 20 },
            content: '#{{invoiceNumber}}',
            isVisible: true
          },
          {
            name: 'ستون راست - تاریخ',
            type: 'text',
            position: { x: 250, y: 275 },
            size: { width: 150, height: 20 },
            content: '{{invoiceDate}}',
            isVisible: true
          },
          {
            name: 'ستون راست - زمان',
            type: 'text',
            position: { x: 250, y: 300 },
            size: { width: 150, height: 20 },
            content: '{{invoiceTime}}',
            isVisible: true
          },
          {
            name: 'ستون راست - خط جداکننده',
            type: 'text',
            position: { x: 250, y: 330 },
            size: { width: 150, height: 2 },
            content: '────────────────────',
            isVisible: true
          },
          {
            name: 'ستون راست - مشتری',
            type: 'text',
            position: { x: 250, y: 345 },
            size: { width: 150, height: 60 },
            content: 'Customer:\n{{customerName}}\n{{customerNationalId}}',
            isVisible: true
          },
          {
            name: 'ستون چپ - جدول آیتم‌ها',
            type: 'text',
            position: { x: 20, y: 10 },
            size: { width: 220, height: 600 },
            content: '{{itemsTable}}',
            isVisible: true
          },
          {
            name: 'ستون راست - خلاصه مالی',
            type: 'text',
            position: { x: 250, y: 420 },
            size: { width: 150, height: 120 },
            content: 'Subtotal:\n{{subtotal}}\n\nTax (9%):\n{{tax}}\n\nDiscount:\n{{discount}}\n\n──────────\nTotal:\n{{total}}',
            isVisible: true
          },
          {
            name: 'ستون راست - QR کد',
            type: 'qr',
            position: { x: 270, y: 560 },
            size: { width: 110, height: 110 },
            content: '{{invoiceQRCode}}',
            isVisible: true
          },
          {
            name: 'ستون راست - بارکد',
            type: 'barcode',
            position: { x: 250, y: 680 },
            size: { width: 150, height: 40 },
            content: '{{invoiceBarcode}}',
            isVisible: true
          },
          {
            name: 'ستون راست - فوتر',
            type: 'text',
            position: { x: 250, y: 730 },
            size: { width: 150, height: 30 },
            content: 'Thank you!',
            isVisible: true
          }
        ],
        settings: {
          paperSize: 'A4',
          orientation: 'portrait',
          margin: { top: 5, right: 5, bottom: 5, left: 5 },
          fontFamily: 'Arial, sans-serif',
          fontSize: 11,
          headerHeight: 100,
          footerHeight: 30
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        name: 'قالب کارتی با باکس‌های جداگانه',
        type: 'general',
        description: 'قالب کارتی با باکس‌های جداگانه برای هر بخش، مناسب برای فاکتورهای سازمان‌یافته',
        isDefault: false,
        isActive: true,
        fields: [
          {
            name: 'باکس هدر - لوگو',
            type: 'image',
            position: { x: 30, y: 20 },
            size: { width: 70, height: 70 },
            content: '/logo.png',
            isVisible: true
          },
          {
            name: 'باکس هدر - اطلاعات',
            type: 'text',
            position: { x: 110, y: 25 },
            size: { width: 280, height: 60 },
            content: '{{restaurantName}}\n{{restaurantAddress}}\nTel: {{restaurantPhone}}',
            isVisible: true
          },
          {
            name: 'باکس فاکتور - شماره',
            type: 'text',
            position: { x: 30, y: 110 },
            size: { width: 180, height: 50 },
            content: '┌─ Invoice Info ─────┐\n│ #{{invoiceNumber}} │\n│ {{invoiceDate}} │\n│ {{invoiceTime}} │\n└──────────────────┘',
            isVisible: true
          },
          {
            name: 'باکس مشتری',
            type: 'text',
            position: { x: 220, y: 110 },
            size: { width: 170, height: 50 },
            content: '┌─ Customer ────────┐\n│ {{customerName}} │\n│ ID: {{customerNationalId}} │\n└──────────────────┘',
            isVisible: true
          },
          {
            name: 'باکس آیتم‌ها - عنوان',
            type: 'text',
            position: { x: 30, y: 180 },
            size: { width: 360, height: 25 },
            content: '┌─ Items ─────────────────────────────────────────┐',
            isVisible: true
          },
          {
            name: 'باکس آیتم‌ها - محتوا',
            type: 'text',
            position: { x: 30, y: 205 },
            size: { width: 360, height: 350 },
            content: '{{itemsTable}}',
            isVisible: true
          },
          {
            name: 'باکس آیتم‌ها - پایین',
            type: 'text',
            position: { x: 30, y: 555 },
            size: { width: 360, height: 2 },
            content: '└────────────────────────────────────────────────┘',
            isVisible: true
          },
          {
            name: 'باکس خلاصه مالی',
            type: 'text',
            position: { x: 30, y: 580 },
            size: { width: 360, height: 120 },
            content: '┌─ Summary ─────────────────────────────────────┐\n│ Subtotal:        {{subtotal}} │\n│ Tax (9%):        {{tax}} │\n│ Discount:        {{discount}} │\n│ ───────────────────────────────────── │\n│ Total:           {{total}} │\n└────────────────────────────────────────┘',
            isVisible: true
          },
          {
            name: 'باکس QR و بارکد',
            type: 'qr',
            position: { x: 30, y: 720 },
            size: { width: 100, height: 100 },
            content: '{{invoiceQRCode}}',
            isVisible: true
          },
          {
            name: 'باکس بارکد',
            type: 'barcode',
            position: { x: 150, y: 720 },
            size: { width: 240, height: 50 },
            content: '{{invoiceBarcode}}',
            isVisible: true
          },
          {
            name: 'باکس مهر و امضا',
            type: 'stamp',
            position: { x: 250, y: 780 },
            size: { width: 70, height: 70 },
            content: '/stamp.png',
            isVisible: true
          },
          {
            name: 'باکس امضا',
            type: 'signature',
            position: { x: 150, y: 780 },
            size: { width: 80, height: 80 },
            content: '{{signature}}',
            isVisible: true
          },
          {
            name: 'باکس فوتر',
            type: 'text',
            position: { x: 30, y: 870 },
            size: { width: 360, height: 40 },
            content: '┌────────────────────────────────────────────┐\n│ {{footerText}} │\n│ Thank you for your business! │\n└────────────────────────────────────────────┘',
            isVisible: true
          }
        ],
        settings: {
          paperSize: 'A4',
          orientation: 'portrait',
          margin: { top: 10, right: 10, bottom: 10, left: 10 },
          fontFamily: 'Tahoma, Arial, sans-serif',
          fontSize: 10,
          headerHeight: 80,
          footerHeight: 20
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]

    const results = await collection.insertMany(sampleTemplates)

    return NextResponse.json({
      success: true,
      message: `${sampleTemplates.length} قالب نمونه با موفقیت اضافه شد`,
      data: {
        insertedCount: results.insertedCount,
        templates: sampleTemplates.map((template, index) => ({
          ...template,
          _id: results.insertedIds[index].toString(),
          id: results.insertedIds[index].toString()
        }))
      }
    })
  } catch (error) {
    console.error('Error adding sample templates:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در اضافه کردن قالب‌های نمونه' },
      { status: 500 }
    )
  }
}

