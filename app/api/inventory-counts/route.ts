import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://restorenUser:1234@localhost:27017/restoren'
const DB_NAME = 'restoren'
const COLLECTION_NAME = 'inventory_counts'

let client: MongoClient | null = null
let db: any

async function connectToDatabase() {
  try {
    if (!client) {
      client = new MongoClient(MONGO_URI)
      await client.connect()
      db = client.db(DB_NAME)
    }
    return db
  } catch (error) {
    console.error('Database connection error:', error)
    throw error
  }
}

// GET - دریافت تمام شمارش‌های انبارگردانی
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    const countItemsCollection = db.collection('count_items')
    
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || 'all'
    const type = searchParams.get('type') || 'all'
    const warehouse = searchParams.get('warehouse') || 'all'
    const sortBy = searchParams.get('sortBy') || 'createdDate'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const limit = parseInt(searchParams.get('limit') || '100')
    const skip = parseInt(searchParams.get('skip') || '0')

    // ساخت فیلتر
    const filter: any = {}
    if (search && search.trim() !== '') {
      filter.$or = [
        { countNumber: { $regex: search, $options: 'i' } },
        { warehouse: { $regex: search, $options: 'i' } },
        { createdBy: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } }
      ]
    }
    if (status && status !== 'all') filter.status = status
    if (type && type !== 'all') filter.type = type
    if (warehouse && warehouse !== 'all') filter.warehouse = warehouse

    // ساخت مرتب‌سازی
    const sort: any = {}
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1

    const counts = await collection
      .find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .toArray()

    // برای هر شمارش، آمار آیتم‌ها را محاسبه کن
    const countsWithStats = await Promise.all(
      counts.map(async (count: any) => {
        try {
          const countId = count._id.toString()
          const items = await countItemsCollection.find({ countId }).toArray()
          
          const countedItems = items.filter((item: any) => item.countedQuantity !== null && item.countedQuantity !== undefined).length
          const discrepancies = items.filter((item: any) => {
            if (item.countedQuantity === null || item.countedQuantity === undefined) return false
            const disc = (item.countedQuantity || 0) - (item.systemQuantity || 0)
            return disc !== 0
          }).length
          
          const discrepancyValue = items.reduce((sum: number, item: any) => {
            const disc = (item.countedQuantity || 0) - (item.systemQuantity || 0)
            return sum + (disc * (item.unitPrice || 0))
          }, 0)

          return {
            ...count,
            _id: count._id.toString(),
            id: count._id.toString(),
            totalItems: items.length,
            countedItems,
            discrepancies,
            discrepancyValue: Math.abs(discrepancyValue)
          }
        } catch (error) {
          console.error(`Error processing count ${count._id}:`, error)
          return {
            ...count,
            _id: count._id.toString(),
            id: count._id.toString(),
            totalItems: 0,
            countedItems: 0,
            discrepancies: 0,
            discrepancyValue: 0
          }
        }
      })
    )

    // آمار کلی
    let stats: any = {
      totalCounts: 0,
      completedCounts: 0,
      inProgressCounts: 0,
      draftCounts: 0,
      cancelledCounts: 0
    }
    
    try {
      const statsArray = await collection.aggregate([
        {
          $group: {
            _id: null,
            totalCounts: { $sum: 1 },
            completedCounts: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
            inProgressCounts: { $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] } },
            draftCounts: { $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] } },
            cancelledCounts: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } }
          }
        }
      ]).toArray()
      
      if (statsArray.length > 0) {
        stats = statsArray[0]
        delete stats._id
      }
    } catch (error) {
      console.error('Error calculating stats:', error)
    }

    const total = await collection.countDocuments(filter)

    return NextResponse.json({
      success: true,
      data: countsWithStats,
      stats,
      pagination: {
        limit,
        skip,
        total
      }
    })
  } catch (error) {
    console.error('Error fetching inventory counts:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در دریافت شمارش‌های انبارگردانی',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// POST - ایجاد شمارش جدید
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    const inventoryCollection = db.collection('inventory_items')
    const countItemsCollection = db.collection('count_items')
    
    const body = await request.json()
    
    const {
      type,
      warehouse,
      warehouses, // برای چند انبار
      section, // بازه/بخش
      freezeMovements, // فریز حرکت یا شمارش زنده
      createdBy,
      notes,
      itemIds,
      category, // فیلتر دسته‌بندی
      autoAddItems // اضافه کردن خودکار آیتم‌ها
    } = body

    if (!warehouse && (!warehouses || warehouses.length === 0)) {
      return NextResponse.json(
        { success: false, message: 'حداقل یک انبار اجباری است' },
        { status: 400 }
      )
    }

    if (!createdBy) {
      return NextResponse.json(
        { success: false, message: 'ایجادکننده اجباری است' },
        { status: 400 }
      )
    }

    // تعیین انبار(ها)
    const targetWarehouses = warehouses && warehouses.length > 0 ? warehouses : [warehouse]
    const freezeMode = freezeMovements === true || freezeMovements === 'true'

    // تولید شماره شمارش
    const countNumber = await generateCountNumber(collection)

    // دریافت آیتم‌های موجودی برای انبار(ها)
    let items = []
    const balanceCollection = db.collection('inventory_balance')
    
    // بررسی وجود آیتم‌های موجودی
    const totalItemsCount = await inventoryCollection.countDocuments({})
    if (totalItemsCount === 0) {
      return NextResponse.json(
        { success: false, message: 'هیچ آیتم موجودی در سیستم وجود ندارد. لطفاً ابتدا آیتم‌های موجودی را اضافه کنید.' },
        { status: 400 }
      )
    }

    if (itemIds && itemIds.length > 0) {
      // آیتم‌های انتخابی
      const objectIds = itemIds.map((id: string) => new ObjectId(id))
      items = await inventoryCollection.find({ _id: { $in: objectIds } }).toArray()
      
      // اگر category فیلتر شده، اعمال کن
      if (category && category !== 'all') {
        items = items.filter((item: any) => item.category === category)
      }
    } else if (autoAddItems !== false) {
      // اضافه کردن خودکار بر اساس موجودی Balance
      const query: any = {}
      if (category && category !== 'all') {
        query.category = category
      }
      
      // دریافت آیتم‌ها از inventory_items
      const allItems = await inventoryCollection.find(query).toArray()
      
      // فیلتر بر اساس انبار(ها) از Balance
      for (const item of allItems) {
        for (const wh of targetWarehouses) {
          const balance = await balanceCollection.findOne({
            itemId: item._id,
            warehouseName: wh
          })
          
          if (balance && balance.quantity > 0) {
            // اگر قبلاً اضافه نشده، اضافه کن
            if (!items.find((i: any) => i._id.toString() === item._id.toString())) {
              items.push(item)
            }
            break
          }
        }
      }
    }

    if (items.length === 0) {
      return NextResponse.json(
        { success: false, message: 'هیچ آیتمی برای شمارش یافت نشد.' },
        { status: 400 }
      )
    }

    const count = {
      countNumber,
      type: type || 'full', // full, partial, cycle
      warehouse: warehouse || targetWarehouses[0], // برای سازگاری
      warehouses: targetWarehouses, // چند انبار
      section: section || null, // بازه/بخش
      freezeMovements: freezeMode, // فریز حرکت یا شمارش زنده
      status: 'draft', // draft, counting, ready_for_approval, approved, closed, cancelled
      createdBy,
      approvedBy: null,
      approvedDate: null,
      createdDate: new Date().toISOString(),
      startedDate: null,
      completedDate: null,
      totalItems: items.length,
      countedItems: 0,
      discrepancies: 0,
      totalValue: items.reduce((sum: number, item: any) => sum + (item.totalValue || 0), 0),
      discrepancyValue: 0,
      notes: notes || '',
      category: category || null, // فیلتر دسته‌بندی
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const result = await collection.insertOne(count)

    // ایجاد آیتم‌های شمارش
    const countId = result.insertedId.toString()
    const countItems = []
    
    for (const item of items) {
      // برای هر انبار، یک آیتم شمارش ایجاد کن
      for (const wh of targetWarehouses) {
        // دریافت موجودی از Balance
        const balance = await balanceCollection.findOne({
          itemId: item._id,
          warehouseName: wh
        })
        
        const systemQty = balance?.quantity || item.currentStock || 0
        const unitPrice = item.unitPrice || 0
        
        countItems.push({
          countId,
          itemId: item._id.toString(),
          itemName: item.name,
          itemCode: item.code || `ITEM-${item._id.toString().substring(0, 8)}`,
          category: item.category,
          unit: item.unit,
          warehouse: wh,
          systemQuantity: systemQty, // موجودی سیستم در زمان ایجاد
          systemQuantityAtFinalization: null, // موجودی سیستم در زمان نهایی‌سازی
          countedQuantity: null,
          discrepancy: 0,
          unitPrice: unitPrice,
          systemValue: systemQty * unitPrice,
          countedValue: 0,
          discrepancyValue: 0,
          countedBy: null,
          countedDate: null,
          countingRounds: [], // چند نوبت شمارش
          notes: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
      }
    }

    await countItemsCollection.insertMany(countItems)

    return NextResponse.json({
      success: true,
      data: { ...count, _id: countId, id: countId },
      message: 'شمارش با موفقیت ایجاد شد'
    })
  } catch (error) {
    console.error('Error creating inventory count:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در ایجاد شمارش' },
      { status: 500 }
    )
  }
}

// PUT - به‌روزرسانی شمارش
export async function PUT(request: NextRequest) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'شناسه شمارش اجباری است' },
        { status: 400 }
      )
    }

    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: {
          ...updateData,
          updatedAt: new Date().toISOString()
        }
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'شمارش یافت نشد' },
        { status: 404 }
      )
    }

    const updatedCount = await collection.findOne({ _id: new ObjectId(id) })

    return NextResponse.json({
      success: true,
      data: { ...updatedCount, _id: updatedCount._id.toString(), id: updatedCount._id.toString() },
      message: 'شمارش با موفقیت به‌روزرسانی شد'
    })
  } catch (error) {
    console.error('Error updating inventory count:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در به‌روزرسانی شمارش' },
      { status: 500 }
    )
  }
}

// DELETE - حذف شمارش
export async function DELETE(request: NextRequest) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    const countItemsCollection = db.collection('count_items')
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'شناسه شمارش اجباری است' },
        { status: 400 }
      )
    }

    // حذف آیتم‌های شمارش
    await countItemsCollection.deleteMany({ countId: id })

    const result = await collection.deleteOne({ _id: new ObjectId(id) })
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'شمارش یافت نشد' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'شمارش با موفقیت حذف شد'
    })
  } catch (error) {
    console.error('Error deleting inventory count:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در حذف شمارش' },
      { status: 500 }
    )
  }
}

// تابع کمکی برای تولید شماره شمارش
async function generateCountNumber(collection: any): Promise<string> {
  const count = await collection.countDocuments()
  return `CNT-${String(count + 1).padStart(3, '0')}`
}

