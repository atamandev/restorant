import { NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://restorenUser:1234@localhost:27017/restoren'
const DB_NAME = 'restoren'

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

export async function POST() {
  try {
    await connectToDatabase()
    const collection = db.collection('inventory_reports')
    
    // حذف گزارشات نمونه قبلی (اختیاری)
    // await collection.deleteMany({ _id: { $exists: true } })

    const sampleReports = [
      {
        name: 'گزارش سطح موجودی',
        type: 'stock_level',
        description: 'گزارش کامل سطح موجودی تمام انبارها',
        generatedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        period: 'current_month',
        warehouse: null,
        totalItems: 150,
        totalValue: 25000000,
        status: 'ready',
        fileSize: '2.5 MB',
        downloadCount: 12,
        metadata: {},
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        name: 'گزارش گردش موجودی',
        type: 'movement',
        description: 'تحلیل گردش موجودی‌ها در 30 روز گذشته',
        generatedDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        period: 'last_month',
        warehouse: null,
        totalItems: 85,
        totalValue: 18000000,
        status: 'ready',
        fileSize: '1.8 MB',
        downloadCount: 8,
        metadata: {},
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        name: 'گزارش ارزش موجودی',
        type: 'valuation',
        description: 'ارزش‌گذاری موجودی‌ها بر اساس روش FIFO',
        generatedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        period: 'current_month',
        warehouse: null,
        totalItems: 150,
        totalValue: 25000000,
        status: 'ready',
        fileSize: '3.2 MB',
        downloadCount: 15,
        metadata: {},
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        name: 'گزارش گردش کالا',
        type: 'turnover',
        description: 'نرخ گردش کالا و تحلیل ABC',
        generatedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        period: 'last_3_months',
        warehouse: null,
        totalItems: 120,
        totalValue: 22000000,
        status: 'generating',
        fileSize: '0 MB',
        downloadCount: 0,
        metadata: {},
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        name: 'گزارش کهنگی موجودی',
        type: 'aging',
        description: 'تحلیل کهنگی و انقضای موجودی‌ها',
        generatedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        period: 'last_6_months',
        warehouse: null,
        totalItems: 95,
        totalValue: 15000000,
        status: 'ready',
        fileSize: '2.1 MB',
        downloadCount: 6,
        metadata: {},
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]

    const result = await collection.insertMany(sampleReports)

    return NextResponse.json({
      success: true,
      message: 'داده‌های نمونه گزارشات با موفقیت اضافه شد',
      data: {
        reports: result.insertedCount
      }
    })
  } catch (error) {
    console.error('Error adding sample inventory reports:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در اضافه کردن داده‌های نمونه: ' + (error as Error).message },
      { status: 500 }
    )
  }
}

