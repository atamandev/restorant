import { NextRequest, NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://restorenUser:1234@localhost:27017/restoren'
const DB_NAME = 'restoren'
const COLLECTION_NAME = 'transfers'

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

// POST - اضافه کردن داده‌های نمونه انتقالات
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    // پاک کردن داده‌های قبلی
    await collection.deleteMany({})
    
    // اضافه کردن انتقالات نمونه
    const sampleTransfers = [
      {
        transferNumber: 'TRF-000001',
        type: 'internal',
        fromWarehouse: 'انبار اصلی',
        toWarehouse: 'انبار سرد',
        items: [
          {
            itemId: 'item1',
            itemName: 'گوشت گوساله',
            itemCode: 'MEAT-001',
            category: 'مواد اولیه',
            quantity: 10,
            unit: 'کیلوگرم',
            unitPrice: 180000,
            totalValue: 1800000
          },
          {
            itemId: 'item2',
            itemName: 'شیر',
            itemCode: 'MILK-001',
            category: 'لبنیات',
            quantity: 20,
            unit: 'لیتر',
            unitPrice: 35000,
            totalValue: 700000
          }
        ],
        totalItems: 2,
        totalValue: 2500000,
        requestedBy: 'احمد محمدی',
        approvedBy: 'فاطمه کریمی',
        status: 'completed',
        priority: 'high',
        scheduledDate: '2024-01-15T10:00:00.000Z',
        actualDate: '2024-01-15T10:30:00.000Z',
        notes: 'انتقال فوری برای تهیه غذاهای امروز',
        reason: 'نیاز فوری به مواد اولیه',
        createdAt: '2024-01-15T09:00:00.000Z',
        updatedAt: '2024-01-15T10:30:00.000Z'
      },
      {
        transferNumber: 'TRF-000002',
        type: 'internal',
        fromWarehouse: 'انبار مواد اولیه',
        toWarehouse: 'انبار خشک',
        items: [
          {
            itemId: 'item3',
            itemName: 'برنج ایرانی',
            itemCode: 'RICE-001',
            category: 'مواد اولیه',
            quantity: 50,
            unit: 'کیلوگرم',
            unitPrice: 45000,
            totalValue: 2250000
          },
          {
            itemId: 'item4',
            itemName: 'نمک',
            itemCode: 'SALT-001',
            category: 'مواد اولیه',
            quantity: 5,
            unit: 'کیلوگرم',
            unitPrice: 5000,
            totalValue: 25000
          }
        ],
        totalItems: 2,
        totalValue: 2275000,
        requestedBy: 'رضا حسینی',
        approvedBy: null,
        status: 'in_transit',
        priority: 'normal',
        scheduledDate: '2024-01-16T14:00:00.000Z',
        actualDate: '2024-01-16T14:15:00.000Z',
        notes: 'انتقال برای ذخیره‌سازی در انبار خشک',
        reason: 'بهینه‌سازی فضای انبار',
        createdAt: '2024-01-16T13:00:00.000Z',
        updatedAt: '2024-01-16T14:15:00.000Z'
      },
      {
        transferNumber: 'TRF-000003',
        type: 'return',
        fromWarehouse: 'انبار محصولات نهایی',
        toWarehouse: 'انبار اصلی',
        items: [
          {
            itemId: 'item5',
            itemName: 'نان',
            itemCode: 'BREAD-001',
            category: 'مواد اولیه',
            quantity: 30,
            unit: 'عدد',
            unitPrice: 5000,
            totalValue: 150000
          }
        ],
        totalItems: 1,
        totalValue: 150000,
        requestedBy: 'علی رضایی',
        approvedBy: 'مریم احمدی',
        status: 'pending',
        priority: 'low',
        scheduledDate: '2024-01-17T16:00:00.000Z',
        actualDate: null,
        notes: 'بازگشت نان‌های اضافی',
        reason: 'موجودی اضافی',
        createdAt: '2024-01-17T15:00:00.000Z',
        updatedAt: '2024-01-17T15:00:00.000Z'
      },
      {
        transferNumber: 'TRF-000004',
        type: 'adjustment',
        fromWarehouse: 'انبار اضطراری',
        toWarehouse: 'انبار اصلی',
        items: [
          {
            itemId: 'item6',
            itemName: 'روغن آفتابگردان',
            itemCode: 'OIL-001',
            category: 'مواد اولیه',
            quantity: 15,
            unit: 'لیتر',
            unitPrice: 25000,
            totalValue: 375000
          },
          {
            itemId: 'item7',
            itemName: 'پیاز',
            itemCode: 'VEG-001',
            category: 'سبزیجات',
            quantity: 25,
            unit: 'کیلوگرم',
            unitPrice: 8000,
            totalValue: 200000
          }
        ],
        totalItems: 2,
        totalValue: 575000,
        requestedBy: 'حسن محمدی',
        approvedBy: null,
        status: 'cancelled',
        priority: 'normal',
        scheduledDate: '2024-01-18T11:00:00.000Z',
        actualDate: null,
        notes: 'انتقال لغو شد به دلیل مشکل در انبار اضطراری',
        reason: 'تعدیل موجودی',
        createdAt: '2024-01-18T10:00:00.000Z',
        updatedAt: '2024-01-18T12:00:00.000Z'
      },
      {
        transferNumber: 'TRF-000005',
        type: 'external',
        fromWarehouse: 'انبار اصلی',
        toWarehouse: 'مشتری - آقای احمدی',
        items: [
          {
            itemId: 'item8',
            itemName: 'نوشابه',
            itemCode: 'DRINK-001',
            category: 'نوشیدنی',
            quantity: 24,
            unit: 'قوطی',
            unitPrice: 8000,
            totalValue: 192000
          }
        ],
        totalItems: 1,
        totalValue: 192000,
        requestedBy: 'فاطمه کریمی',
        approvedBy: 'احمد محمدی',
        status: 'completed',
        priority: 'urgent',
        scheduledDate: '2024-01-19T09:00:00.000Z',
        actualDate: '2024-01-19T09:30:00.000Z',
        notes: 'ارسال به مشتری VIP',
        reason: 'سفارش مشتری',
        createdAt: '2024-01-19T08:00:00.000Z',
        updatedAt: '2024-01-19T09:30:00.000Z'
      }
    ]

    const result = await collection.insertMany(sampleTransfers)
    
    return NextResponse.json({
      success: true,
      message: `${result.insertedCount} انتقال نمونه با موفقیت اضافه شد`,
      data: {
        insertedCount: result.insertedCount,
        insertedIds: result.insertedIds
      }
    })
  } catch (error) {
    console.error('Error adding sample transfers:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در اضافه کردن انتقالات نمونه' },
      { status: 500 }
    )
  }
}
