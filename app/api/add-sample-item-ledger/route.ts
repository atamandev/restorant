import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://restorenUser:1234@localhost:27017/restoren'
const DB_NAME = 'restoren'
const COLLECTION_NAME = 'item_ledger'

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

// POST - اضافه کردن داده‌های نمونه دفتر کل
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()
    const ledgerCollection = db.collection(COLLECTION_NAME)
    const inventoryCollection = db.collection('inventory_items')
    
    // دریافت آیتم‌های موجودی
    const items = await inventoryCollection.find({}).limit(5).toArray()
    
    if (items.length === 0) {
      return NextResponse.json(
        { success: false, message: 'ابتدا باید آیتم‌های موجودی اضافه کنید' },
        { status: 400 }
      )
    }

    // پاک کردن داده‌های قبلی
    await ledgerCollection.deleteMany({})

    const sampleEntries = []

    for (const item of items) {
      const itemId = item._id.toString()
      let runningBalance = 0
      let runningValue = 0

      // ایجاد ورودی‌های نمونه
      const entries = [
        {
          itemId,
          itemName: item.name,
          itemCode: item.code || `ITEM-${itemId.substring(0, 8)}`,
          date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          documentNumber: 'REC-001',
          documentType: 'receipt',
          description: `خرید ${item.name}`,
          warehouse: item.warehouse || 'انبار اصلی',
          quantityIn: 20,
          quantityOut: 0,
          unitPrice: item.unitPrice || 10000,
          totalValue: 20 * (item.unitPrice || 10000),
          runningBalance: 20,
          runningValue: 20 * (item.unitPrice || 10000),
          averagePrice: item.unitPrice || 10000,
          reference: 'PO-001',
          notes: 'خرید اولیه',
          userId: 'احمد محمدی',
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          itemId,
          itemName: item.name,
          itemCode: item.code || `ITEM-${itemId.substring(0, 8)}`,
          date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          documentNumber: 'ISS-001',
          documentType: 'issue',
          description: `مصرف ${item.name}`,
          warehouse: item.warehouse || 'انبار اصلی',
          quantityIn: 0,
          quantityOut: 5,
          unitPrice: item.unitPrice || 10000,
          totalValue: -5 * (item.unitPrice || 10000),
          runningBalance: 15,
          runningValue: 15 * (item.unitPrice || 10000),
          averagePrice: item.unitPrice || 10000,
          reference: 'KIT-001',
          notes: 'مصرف در آشپزخانه',
          userId: 'فاطمه کریمی',
          createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          itemId,
          itemName: item.name,
          itemCode: item.code || `ITEM-${itemId.substring(0, 8)}`,
          date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          documentNumber: 'REC-002',
          documentType: 'receipt',
          description: `خرید مجدد ${item.name}`,
          warehouse: item.warehouse || 'انبار اصلی',
          quantityIn: 10,
          quantityOut: 0,
          unitPrice: (item.unitPrice || 10000) * 1.1,
          totalValue: 10 * (item.unitPrice || 10000) * 1.1,
          runningBalance: 25,
          runningValue: (15 * (item.unitPrice || 10000)) + (10 * (item.unitPrice || 10000) * 1.1),
          averagePrice: ((15 * (item.unitPrice || 10000)) + (10 * (item.unitPrice || 10000) * 1.1)) / 25,
          reference: 'PO-002',
          notes: 'خرید با قیمت جدید',
          userId: 'رضا حسینی',
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          itemId,
          itemName: item.name,
          itemCode: item.code || `ITEM-${itemId.substring(0, 8)}`,
          date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          documentNumber: 'ISS-002',
          documentType: 'issue',
          description: `مصرف ${item.name}`,
          warehouse: item.warehouse || 'انبار اصلی',
          quantityIn: 0,
          quantityOut: 7,
          unitPrice: ((15 * (item.unitPrice || 10000)) + (10 * (item.unitPrice || 10000) * 1.1)) / 25,
          totalValue: -7 * ((15 * (item.unitPrice || 10000)) + (10 * (item.unitPrice || 10000) * 1.1)) / 25,
          runningBalance: 18,
          runningValue: ((15 * (item.unitPrice || 10000)) + (10 * (item.unitPrice || 10000) * 1.1)) - (7 * ((15 * (item.unitPrice || 10000)) + (10 * (item.unitPrice || 10000) * 1.1)) / 25),
          averagePrice: ((15 * (item.unitPrice || 10000)) + (10 * (item.unitPrice || 10000) * 1.1)) / 25,
          reference: 'KIT-002',
          notes: 'مصرف برای تولید',
          userId: 'فاطمه کریمی',
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          itemId,
          itemName: item.name,
          itemCode: item.code || `ITEM-${itemId.substring(0, 8)}`,
          date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          documentNumber: 'ADJ-001',
          documentType: 'adjustment',
          description: `تعدیل موجودی ${item.name}`,
          warehouse: item.warehouse || 'انبار اصلی',
          quantityIn: 0,
          quantityOut: 1,
          unitPrice: ((15 * (item.unitPrice || 10000)) + (10 * (item.unitPrice || 10000) * 1.1)) / 25,
          totalValue: -1 * ((15 * (item.unitPrice || 10000)) + (10 * (item.unitPrice || 10000) * 1.1)) / 25,
          runningBalance: 17,
          runningValue: ((15 * (item.unitPrice || 10000)) + (10 * (item.unitPrice || 10000) * 1.1)) - (8 * ((15 * (item.unitPrice || 10000)) + (10 * (item.unitPrice || 10000) * 1.1)) / 25),
          averagePrice: ((15 * (item.unitPrice || 10000)) + (10 * (item.unitPrice || 10000) * 1.1)) / 25,
          reference: 'AUD-001',
          notes: 'تعدیل پس از انبارگردانی',
          userId: 'مدیر انبار',
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]

      sampleEntries.push(...entries)
    }

    const result = await ledgerCollection.insertMany(sampleEntries)

    // به‌روزرسانی موجودی آیتم‌ها بر اساس آخرین ورودی
    for (const item of items) {
      const lastEntry = await ledgerCollection
        .findOne(
          { itemId: item._id.toString() },
          { sort: { date: -1, createdAt: -1 } }
        )

      if (lastEntry) {
        await inventoryCollection.updateOne(
          { _id: item._id },
          {
            $set: {
              currentStock: lastEntry.runningBalance,
              totalValue: lastEntry.runningValue,
              unitPrice: lastEntry.averagePrice,
              isLowStock: lastEntry.runningBalance <= (item.minStock || 0),
              lastUpdated: new Date().toISOString(),
              updatedAt: new Date()
            }
          }
        )
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `${result.insertedCount} ورودی نمونه با موفقیت اضافه شد`,
      data: {
        insertedCount: result.insertedCount,
        insertedIds: result.insertedIds
      }
    })
  } catch (error) {
    console.error('Error adding sample ledger entries:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در اضافه کردن ورودی‌های نمونه' },
      { status: 500 }
    )
  }
}


