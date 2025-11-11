import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://restorenUser:1234@localhost:27017/restoren'
const DB_NAME = 'restoren'

let client: MongoClient | undefined
let db: any

async function connectToDatabase() {
  try {
    if (!client) {
      client = new MongoClient(MONGO_URI)
      await client.connect()
      db = client.db(DB_NAME)
    } else if (!db) {
      db = client.db(DB_NAME)
    }
    return db
  } catch (error) {
    console.error('Database connection error:', error)
    throw error
  }
}

// GET - دریافت تنظیمات چاپگر
export async function GET(request: NextRequest) {
  try {
    const db = await connectToDatabase()
    const collection = db.collection('printer_config')
    
    // دریافت آخرین تنظیمات
    const config = await collection.findOne({}, { sort: { updatedAt: -1 } })
    
    if (!config) {
      // تنظیمات پیش‌فرض
      const defaultConfig = {
        printer: {
          enabled: true,
          paperSize: '80mm',
          fontSize: 10,
          fontFamily: 'Tahoma, Arial, sans-serif',
          margin: 5,
          header: {
            show: true,
            title: 'فاکتور سفارش',
            showLogo: false,
            logoUrl: '',
            showDate: true,
            showTime: true
          },
          footer: {
            show: true,
            text: 'با تشکر از انتخاب شما',
            showDate: true
          },
          items: {
            showNotes: true,
            showImage: false,
            columns: ['name', 'quantity', 'price', 'total']
          },
          summary: {
            showSubtotal: true,
            showTax: true,
            showServiceCharge: true,
            showDiscount: true,
            showTotal: true
          }
        },
        laser: {
          enabled: true,
          paperSize: 'A4',
          fontSize: 12,
          fontFamily: 'Tahoma, Arial, sans-serif',
          margin: 10,
          header: {
            show: true,
            title: 'فاکتور سفارش',
            showLogo: false,
            logoUrl: '',
            showDate: true,
            showTime: true
          },
          footer: {
            show: true,
            text: 'با تشکر از انتخاب شما',
            showDate: true
          },
          items: {
            showNotes: true,
            showImage: false,
            columns: ['name', 'quantity', 'price', 'total']
          },
          summary: {
            showSubtotal: true,
            showTax: true,
            showServiceCharge: true,
            showDiscount: true,
            showTotal: true
          }
        },
        general: {
          autoPrint: false,
          showPrintDialog: true,
          copies: 1,
          orientation: 'portrait'
        }
      }
      
      return NextResponse.json({
        success: true,
        data: defaultConfig,
        message: 'تنظیمات پیش‌فرض بارگذاری شد'
      })
    }
    
    return NextResponse.json({
      success: true,
      data: config.config || config,
      message: 'تنظیمات با موفقیت دریافت شد'
    })
  } catch (error) {
    console.error('Error fetching printer config:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در دریافت تنظیمات چاپگر',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// POST - ذخیره تنظیمات چاپگر
export async function POST(request: NextRequest) {
  try {
    const db = await connectToDatabase()
    const collection = db.collection('printer_config')
    const body = await request.json()
    
    const configData = {
      config: body,
      updatedAt: new Date(),
      createdAt: new Date()
    }
    
    // بررسی وجود تنظیمات قبلی
    const existingConfig = await collection.findOne({}, { sort: { updatedAt: -1 } })
    
    if (existingConfig) {
      // به‌روزرسانی تنظیمات موجود
      await collection.updateOne(
        { _id: existingConfig._id },
        { 
          $set: {
            config: body,
            updatedAt: new Date()
          }
        }
      )
    } else {
      // ایجاد تنظیمات جدید
      await collection.insertOne(configData)
    }
    
    return NextResponse.json({
      success: true,
      message: 'تنظیمات با موفقیت ذخیره شد'
    })
  } catch (error) {
    console.error('Error saving printer config:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در ذخیره تنظیمات چاپگر',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
