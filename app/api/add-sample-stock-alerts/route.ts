import { NextRequest, NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://restorenUser:1234@localhost:27017/restoren'
const DB_NAME = 'restoren'
const COLLECTION_NAME = 'stock_alerts'

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

// POST - اضافه کردن داده‌های نمونه هشدارهای موجودی
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    // پاک کردن داده‌های قبلی
    await collection.deleteMany({})
    
    // اضافه کردن هشدارهای نمونه
    const sampleAlerts = [
      {
        itemId: 'item1',
        itemName: 'گوشت گوساله',
        itemCode: 'MEAT-001',
        category: 'مواد اولیه',
        warehouse: 'انبار سرد',
        type: 'low_stock',
        severity: 'high',
        currentStock: 5,
        minStock: 15,
        maxStock: 50,
        expiryDate: '2024-01-25',
        daysToExpiry: 3,
        message: 'موجودی گوشت گوساله به حداقل رسیده است. نیاز به تامین فوری دارد.',
        status: 'active',
        priority: 'urgent',
        assignedTo: 'احمد محمدی',
        resolvedBy: null,
        resolvedAt: null,
        resolution: null,
        notes: 'این آیتم برای تهیه غذاهای اصلی ضروری است',
        createdAt: '2024-01-22T10:00:00.000Z',
        updatedAt: '2024-01-22T10:00:00.000Z'
      },
      {
        itemId: 'item2',
        itemName: 'پیاز',
        itemCode: 'VEG-001',
        category: 'سبزیجات',
        warehouse: 'انبار اصلی',
        type: 'out_of_stock',
        severity: 'critical',
        currentStock: 0,
        minStock: 10,
        maxStock: 30,
        expiryDate: null,
        daysToExpiry: null,
        message: 'پیاز تمام شده است. نیاز به تامین فوری دارد.',
        status: 'active',
        priority: 'urgent',
        assignedTo: 'فاطمه کریمی',
        resolvedBy: null,
        resolvedAt: null,
        resolution: null,
        notes: 'پیاز برای اکثر غذاها ضروری است',
        createdAt: '2024-01-22T11:30:00.000Z',
        updatedAt: '2024-01-22T11:30:00.000Z'
      },
      {
        itemId: 'item3',
        itemName: 'شیر',
        itemCode: 'MILK-001',
        category: 'لبنیات',
        warehouse: 'انبار سرد',
        type: 'expiry',
        severity: 'medium',
        currentStock: 20,
        minStock: 5,
        maxStock: 30,
        expiryDate: '2024-01-24',
        daysToExpiry: 1,
        message: 'شیر تا 1 روز دیگر منقضی می‌شود. نیاز به استفاده فوری دارد.',
        status: 'active',
        priority: 'high',
        assignedTo: 'رضا حسینی',
        resolvedBy: null,
        resolvedAt: null,
        resolution: null,
        notes: 'شیر منقضی شده باید دور ریخته شود',
        createdAt: '2024-01-23T08:00:00.000Z',
        updatedAt: '2024-01-23T08:00:00.000Z'
      },
      {
        itemId: 'item4',
        itemName: 'برنج ایرانی',
        itemCode: 'RICE-001',
        category: 'مواد اولیه',
        warehouse: 'انبار خشک',
        type: 'overstock',
        severity: 'low',
        currentStock: 120,
        minStock: 20,
        maxStock: 100,
        expiryDate: '2024-12-31',
        daysToExpiry: 365,
        message: 'موجودی برنج بیش از حد مجاز است. فضای انبار اشغال شده است.',
        status: 'active',
        priority: 'normal',
        assignedTo: 'علی رضایی',
        resolvedBy: null,
        resolvedAt: null,
        resolution: null,
        notes: 'برنج اضافی را می‌توان به انبار دیگری منتقل کرد',
        createdAt: '2024-01-20T14:00:00.000Z',
        updatedAt: '2024-01-20T14:00:00.000Z'
      },
      {
        itemId: 'item5',
        itemName: 'روغن آفتابگردان',
        itemCode: 'OIL-001',
        category: 'مواد اولیه',
        warehouse: 'انبار اصلی',
        type: 'low_stock',
        severity: 'medium',
        currentStock: 8,
        minStock: 10,
        maxStock: 25,
        expiryDate: '2024-08-20',
        daysToExpiry: 180,
        message: 'موجودی روغن آفتابگردان کم است. نیاز به تامین دارد.',
        status: 'resolved',
        priority: 'normal',
        assignedTo: 'مریم احمدی',
        resolvedBy: 'احمد محمدی',
        resolvedAt: '2024-01-21T16:00:00.000Z',
        resolution: 'روغن جدید سفارش داده شد و موجودی تکمیل شد',
        notes: 'روغن برای پخت و پز ضروری است',
        createdAt: '2024-01-21T09:00:00.000Z',
        updatedAt: '2024-01-21T16:00:00.000Z'
      },
      {
        itemId: 'item6',
        itemName: 'نان',
        itemCode: 'BREAD-001',
        category: 'مواد اولیه',
        warehouse: 'انبار اصلی',
        type: 'expiry',
        severity: 'high',
        currentStock: 50,
        minStock: 20,
        maxStock: 100,
        expiryDate: '2024-01-23',
        daysToExpiry: 0,
        message: 'نان امروز منقضی می‌شود. نیاز به استفاده فوری یا دور ریختن دارد.',
        status: 'dismissed',
        priority: 'high',
        assignedTo: 'حسن محمدی',
        resolvedBy: 'مدیر انبار',
        resolvedAt: '2024-01-23T12:00:00.000Z',
        resolution: 'نان منقضی شده دور ریخته شد',
        notes: 'نان منقضی شده قابل استفاده نیست',
        createdAt: '2024-01-23T06:00:00.000Z',
        updatedAt: '2024-01-23T12:00:00.000Z'
      },
      {
        itemId: 'item7',
        itemName: 'نمک',
        itemCode: 'SALT-001',
        category: 'مواد اولیه',
        warehouse: 'انبار خشک',
        type: 'low_stock',
        severity: 'low',
        currentStock: 3,
        minStock: 5,
        maxStock: 15,
        expiryDate: '2025-12-31',
        daysToExpiry: 365,
        message: 'موجودی نمک کم است. نیاز به تامین دارد.',
        status: 'active',
        priority: 'low',
        assignedTo: null,
        resolvedBy: null,
        resolvedAt: null,
        resolution: null,
        notes: 'نمک برای طعم‌دهی غذا ضروری است',
        createdAt: '2024-01-23T15:00:00.000Z',
        updatedAt: '2024-01-23T15:00:00.000Z'
      },
      {
        itemId: 'item8',
        itemName: 'نوشابه',
        itemCode: 'DRINK-001',
        category: 'نوشیدنی',
        warehouse: 'انبار اصلی',
        type: 'overstock',
        severity: 'low',
        currentStock: 300,
        minStock: 50,
        maxStock: 200,
        expiryDate: '2024-12-31',
        daysToExpiry: 300,
        message: 'موجودی نوشابه بیش از حد مجاز است. فضای انبار اشغال شده است.',
        status: 'active',
        priority: 'low',
        assignedTo: null,
        resolvedBy: null,
        resolvedAt: null,
        resolution: null,
        notes: 'نوشابه اضافی را می‌توان در فروشگاه استفاده کرد',
        createdAt: '2024-01-22T16:00:00.000Z',
        updatedAt: '2024-01-22T16:00:00.000Z'
      }
    ]

    const result = await collection.insertMany(sampleAlerts)
    
    return NextResponse.json({
      success: true,
      message: `${result.insertedCount} هشدار نمونه با موفقیت اضافه شد`,
      data: {
        insertedCount: result.insertedCount,
        insertedIds: result.insertedIds
      }
    })
  } catch (error) {
    console.error('Error adding sample stock alerts:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در اضافه کردن هشدارهای نمونه' },
      { status: 500 }
    )
  }
}
