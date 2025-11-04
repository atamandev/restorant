import { NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

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
    const countsCollection = db.collection('inventory_counts')
    const countItemsCollection = db.collection('count_items')
    const adjustmentsCollection = db.collection('adjustments')
    const inventoryCollection = db.collection('inventory_items')
    const warehousesCollection = db.collection('warehouses')

    // دریافت انبارها و آیتم‌های موجودی
    const warehouses = await warehousesCollection.find({}).toArray()
    if (warehouses.length === 0) {
      return NextResponse.json(
        { success: false, message: 'لطفاً ابتدا انبارها را اضافه کنید' },
        { status: 400 }
      )
    }

    const inventoryItems = await inventoryCollection.find({}).limit(10).toArray()
    if (inventoryItems.length === 0) {
      return NextResponse.json(
        { success: false, message: 'لطفاً ابتدا آیتم‌های موجودی را اضافه کنید' },
        { status: 400 }
      )
    }

    const warehouse1 = warehouses[0].name
    const warehouse2 = warehouses.length > 1 ? warehouses[1].name : warehouses[0].name

    // شمارش 1: تکمیل شده با اختلاف
    const count1 = {
      countNumber: 'CNT-001',
      type: 'cycle',
      warehouse: warehouse1,
      status: 'completed',
      createdBy: 'احمد محمدی',
      createdDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      startedDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      completedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      totalItems: 3,
      countedItems: 3,
      discrepancies: 3,
      totalValue: 3740000,
      discrepancyValue: 295000,
      notes: 'شمارش دوره‌ای انبار اصلی',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    }

    const count1Result = await countsCollection.insertOne(count1)
    const count1Id = count1Result.insertedId.toString()

    // آیتم‌های شمارش 1
    const count1Items = [
      {
        countId: count1Id,
        itemId: inventoryItems[0]._id.toString(),
        itemName: inventoryItems[0].name,
        itemCode: inventoryItems[0].code || `ITEM-${inventoryItems[0]._id.toString().substring(0, 8)}`,
        category: inventoryItems[0].category,
        unit: inventoryItems[0].unit,
        systemQuantity: inventoryItems[0].currentStock || 50,
        countedQuantity: 48,
        discrepancy: -2,
        unitPrice: inventoryItems[0].unitPrice || 45000,
        systemValue: (inventoryItems[0].currentStock || 50) * (inventoryItems[0].unitPrice || 45000),
        countedValue: 48 * (inventoryItems[0].unitPrice || 45000),
        discrepancyValue: -2 * (inventoryItems[0].unitPrice || 45000),
        countedBy: 'احمد محمدی',
        countedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        notes: 'کمبود 2 واحد',
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        countId: count1Id,
        itemId: inventoryItems[1]?._id.toString() || inventoryItems[0]._id.toString(),
        itemName: inventoryItems[1]?.name || inventoryItems[0].name,
        itemCode: inventoryItems[1]?.code || inventoryItems[0].code || `ITEM-${inventoryItems[0]._id.toString().substring(0, 8)}`,
        category: inventoryItems[1]?.category || inventoryItems[0].category,
        unit: inventoryItems[1]?.unit || inventoryItems[0].unit,
        systemQuantity: inventoryItems[1]?.currentStock || 8,
        countedQuantity: 9,
        discrepancy: 1,
        unitPrice: inventoryItems[1]?.unitPrice || 180000,
        systemValue: (inventoryItems[1]?.currentStock || 8) * (inventoryItems[1]?.unitPrice || 180000),
        countedValue: 9 * (inventoryItems[1]?.unitPrice || 180000),
        discrepancyValue: 1 * (inventoryItems[1]?.unitPrice || 180000),
        countedBy: 'احمد محمدی',
        countedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        notes: 'زیادی 1 واحد',
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        countId: count1Id,
        itemId: inventoryItems[2]?._id.toString() || inventoryItems[0]._id.toString(),
        itemName: inventoryItems[2]?.name || inventoryItems[0].name,
        itemCode: inventoryItems[2]?.code || inventoryItems[0].code || `ITEM-${inventoryItems[0]._id.toString().substring(0, 8)}`,
        category: inventoryItems[2]?.category || inventoryItems[0].category,
        unit: inventoryItems[2]?.unit || inventoryItems[0].unit,
        systemQuantity: inventoryItems[2]?.currentStock || 20,
        countedQuantity: 19,
        discrepancy: -1,
        unitPrice: inventoryItems[2]?.unitPrice || 25000,
        systemValue: (inventoryItems[2]?.currentStock || 20) * (inventoryItems[2]?.unitPrice || 25000),
        countedValue: 19 * (inventoryItems[2]?.unitPrice || 25000),
        discrepancyValue: -1 * (inventoryItems[2]?.unitPrice || 25000),
        countedBy: 'احمد محمدی',
        countedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        notes: 'کمبود 1 واحد',
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]

    await countItemsCollection.insertMany(count1Items)

    // تعدیل از شمارش 1
    const adjustment1 = {
      adjustmentNumber: 'ADJ-001',
      countId: count1Id,
      warehouse: warehouse1,
      type: 'decrease',
      totalItems: 2,
      totalValue: 115000,
      createdBy: 'احمد محمدی',
      createdDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'posted',
      items: [
        {
          itemId: inventoryItems[0]._id.toString(),
          itemName: inventoryItems[0].name,
          itemCode: inventoryItems[0].code || `ITEM-${inventoryItems[0]._id.toString().substring(0, 8)}`,
          quantity: -2,
          unitPrice: inventoryItems[0].unitPrice || 45000,
          totalValue: -90000,
          reason: 'کمبود در شمارش'
        },
        {
          itemId: inventoryItems[2]?._id.toString() || inventoryItems[0]._id.toString(),
          itemName: inventoryItems[2]?.name || inventoryItems[0].name,
          itemCode: inventoryItems[2]?.code || inventoryItems[0].code || `ITEM-${inventoryItems[0]._id.toString().substring(0, 8)}`,
          quantity: -1,
          unitPrice: inventoryItems[2]?.unitPrice || 25000,
          totalValue: -25000,
          reason: 'کمبود در شمارش'
        }
      ],
      postedBy: 'احمد محمدی',
      postedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    }

    await adjustmentsCollection.insertOne(adjustment1)

    // شمارش 2: در حال انجام
    const count2 = {
      countNumber: 'CNT-002',
      type: 'full',
      warehouse: warehouse2,
      status: 'in_progress',
      createdBy: 'فاطمه کریمی',
      createdDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      startedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      completedDate: null,
      totalItems: 5,
      countedItems: 2,
      discrepancies: 0,
      totalValue: 8000000,
      discrepancyValue: 0,
      notes: 'شمارش کامل انبار',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    }

    const count2Result = await countsCollection.insertOne(count2)
    const count2Id = count2Result.insertedId.toString()

    // آیتم‌های شمارش 2 (فقط 2 تا شمارش شده)
    const count2Items = [
      {
        countId: count2Id,
        itemId: inventoryItems[3]?._id.toString() || inventoryItems[0]._id.toString(),
        itemName: inventoryItems[3]?.name || inventoryItems[0].name,
        itemCode: inventoryItems[3]?.code || inventoryItems[0].code || `ITEM-${inventoryItems[0]._id.toString().substring(0, 8)}`,
        category: inventoryItems[3]?.category || inventoryItems[0].category,
        unit: inventoryItems[3]?.unit || inventoryItems[0].unit,
        systemQuantity: inventoryItems[3]?.currentStock || 30,
        countedQuantity: 30,
        discrepancy: 0,
        unitPrice: inventoryItems[3]?.unitPrice || 50000,
        systemValue: (inventoryItems[3]?.currentStock || 30) * (inventoryItems[3]?.unitPrice || 50000),
        countedValue: 30 * (inventoryItems[3]?.unitPrice || 50000),
        discrepancyValue: 0,
        countedBy: 'فاطمه کریمی',
        countedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        notes: '',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        countId: count2Id,
        itemId: inventoryItems[4]?._id.toString() || inventoryItems[0]._id.toString(),
        itemName: inventoryItems[4]?.name || inventoryItems[0].name,
        itemCode: inventoryItems[4]?.code || inventoryItems[0].code || `ITEM-${inventoryItems[0]._id.toString().substring(0, 8)}`,
        category: inventoryItems[4]?.category || inventoryItems[0].category,
        unit: inventoryItems[4]?.unit || inventoryItems[0].unit,
        systemQuantity: inventoryItems[4]?.currentStock || 25,
        countedQuantity: 25,
        discrepancy: 0,
        unitPrice: inventoryItems[4]?.unitPrice || 40000,
        systemValue: (inventoryItems[4]?.currentStock || 25) * (inventoryItems[4]?.unitPrice || 40000),
        countedValue: 25 * (inventoryItems[4]?.unitPrice || 40000),
        discrepancyValue: 0,
        countedBy: 'فاطمه کریمی',
        countedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        notes: '',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]

    // اضافه کردن آیتم‌های شمارش نشده
    for (let i = 5; i < Math.min(8, inventoryItems.length); i++) {
      count2Items.push({
        countId: count2Id,
        itemId: inventoryItems[i]._id.toString(),
        itemName: inventoryItems[i].name,
        itemCode: inventoryItems[i].code || `ITEM-${inventoryItems[i]._id.toString().substring(0, 8)}`,
        category: inventoryItems[i].category,
        unit: inventoryItems[i].unit,
        systemQuantity: inventoryItems[i].currentStock || 0,
        countedQuantity: 0,
        discrepancy: 0,
        unitPrice: inventoryItems[i].unitPrice || 0,
        systemValue: (inventoryItems[i].currentStock || 0) * (inventoryItems[i].unitPrice || 0),
        countedValue: 0,
        discrepancyValue: 0,
        countedBy: null as any,
        countedDate: null as any,
        notes: '',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      })
    }

    await countItemsCollection.insertMany(count2Items)

    // شمارش 3: پیش‌نویس
    const count3 = {
      countNumber: 'CNT-003',
      type: 'cycle',
      warehouse: warehouse1,
      status: 'draft',
      createdBy: 'رضا حسینی',
      createdDate: new Date().toISOString(),
      startedDate: null,
      completedDate: null,
      totalItems: 3,
      countedItems: 0,
      discrepancies: 0,
      totalValue: 5000000,
      discrepancyValue: 0,
      notes: 'شمارش دوره‌ای آینده',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const count3Result = await countsCollection.insertOne(count3)
    const count3Id = count3Result.insertedId.toString()

    // آیتم‌های شمارش 3 (هنوز شمارش نشده)
    const count3Items = inventoryItems.slice(0, 3).map((item: any) => ({
      countId: count3Id,
      itemId: item._id.toString(),
      itemName: item.name,
      itemCode: item.code || `ITEM-${item._id.toString().substring(0, 8)}`,
      category: item.category,
      unit: item.unit,
      systemQuantity: item.currentStock || 0,
      countedQuantity: 0,
      discrepancy: 0,
      unitPrice: item.unitPrice || 0,
      systemValue: (item.currentStock || 0) * (item.unitPrice || 0),
      countedValue: 0,
      discrepancyValue: 0,
      countedBy: null,
      countedDate: null,
      notes: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }))

    await countItemsCollection.insertMany(count3Items)

    return NextResponse.json({
      success: true,
      message: 'داده‌های نمونه انبارگردانی با موفقیت اضافه شد',
      data: {
        counts: 3,
        items: count1Items.length + count2Items.length + count3Items.length,
        adjustments: 1
      }
    })
  } catch (error) {
    console.error('Error adding sample audit data:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در اضافه کردن داده‌های نمونه: ' + (error as Error).message },
      { status: 500 }
    )
  }
}


