import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://restorenUser:1234@localhost:27017/restoren'
const DB_NAME = 'restoren'
const COLLECTION_NAME = 'count_items'

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

// GET - دریافت آیتم‌های شمارش
export async function GET(request: NextRequest) {
  try {
    const db = await connectToDatabase()
    if (!db) {
      throw new Error('Database connection failed')
    }
    const collection = db.collection(COLLECTION_NAME)
    
    const { searchParams } = new URL(request.url)
    const countId = searchParams.get('countId')
    const limit = parseInt(searchParams.get('limit') || '1000')
    const skip = parseInt(searchParams.get('skip') || '0')

    const filter: any = {}
    if (countId) filter.countId = countId

    const allItems = await collection
      .find(filter)
      .skip(skip)
      .limit(limit)
      .toArray()

    // فیلتر آیتم‌ها و به‌روزرسانی systemQuantity از inventory_balance
    const balanceCollection = db.collection('inventory_balance')
    const validItems = []
    
    for (const item of allItems) {
      const balance = await balanceCollection.findOne({
        itemId: new ObjectId(item.itemId),
        warehouseName: item.warehouse
      })
      
      // اگر balance وجود دارد یا آیتم قبلاً شمارش شده (برای حفظ تاریخچه)
      if (balance || (item.countedQuantity !== null && item.countedQuantity !== undefined)) {
        // به‌روزرسانی systemQuantity از موجودی واقعی انبار
        // اگر systemQuantityAtFinalization وجود دارد، از آن استفاده نکن (برای حفظ تاریخچه)
        let currentSystemQty = item.systemQuantity || 0
        if (balance && (item.systemQuantityAtFinalization === null || item.systemQuantityAtFinalization === undefined)) {
          currentSystemQty = balance.quantity || 0
          // به‌روزرسانی systemQuantity در دیتابیس (فقط اگر approve نشده باشد)
          await collection.updateOne(
            { _id: item._id },
            { $set: { systemQuantity: currentSystemQty } }
          )
        } else if (item.systemQuantityAtFinalization !== null && item.systemQuantityAtFinalization !== undefined) {
          // اگر approve شده، از systemQuantityAtFinalization استفاده کن
          currentSystemQty = item.systemQuantityAtFinalization
        }
        
        validItems.push({
          ...item,
          systemQuantity: currentSystemQty
        })
      }
    }

    // محاسبه اختلافات
    const itemsWithDiscrepancy = validItems.map((item: any) => {
      const countedQty = item.countedQuantity ?? null
      // استفاده از systemQuantityAtFinalization اگر موجود باشد، در غیر این صورت systemQuantity
      const systemQty = item.systemQuantityAtFinalization !== null && item.systemQuantityAtFinalization !== undefined
        ? item.systemQuantityAtFinalization
        : item.systemQuantity || 0
      const discrepancy = countedQty !== null ? countedQty - systemQty : 0
      const discrepancyValue = discrepancy * (item.unitPrice || 0)

      return {
        ...item,
        _id: item._id.toString(),
        id: item._id.toString(),
        systemQuantity: systemQty, // استفاده از مقدار به‌روزرسانی شده
        discrepancy,
        discrepancyValue
      }
    })

    return NextResponse.json({
      success: true,
      data: itemsWithDiscrepancy,
      pagination: {
        limit,
        skip,
        total: validItems.length
      }
    })
  } catch (error) {
    console.error('Error fetching count items:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت آیتم‌های شمارش' },
      { status: 500 }
    )
  }
}

// POST - ایجاد/به‌روزرسانی آیتم شمارش
export async function POST(request: NextRequest) {
  try {
    const db = await connectToDatabase()
    if (!db) {
      throw new Error('Database connection failed')
    }
    const collection = db.collection(COLLECTION_NAME)
    const countsCollection = db.collection('inventory_counts')
    
    const body = await request.json()
    
    const {
      countId,
      itemId,
      warehouse, // برای شناسایی آیتم در چند انبار
      countedQuantity,
      countedBy,
      notes,
      roundNumber // شماره نوبت شمارش
    } = body

    if (!countId || !itemId) {
      return NextResponse.json(
        { success: false, message: 'شناسه شمارش و شناسه آیتم اجباری است' },
        { status: 400 }
      )
    }

    // مقدار 0 هم معتبر است، فقط null و undefined غیرمجاز هستند
    if (countedQuantity === null || countedQuantity === undefined) {
      return NextResponse.json(
        { success: false, message: 'مقدار شمارش اجباری است' },
        { status: 400 }
      )
    }

    // بررسی اینکه آیا آیتم قبلاً ثبت شده است
    const query: any = { countId, itemId }
    if (warehouse) {
      query.warehouse = warehouse
    }
    const existingItem = await collection.findOne(query)

    if (!existingItem) {
      return NextResponse.json(
        { success: false, message: 'آیتم شمارش یافت نشد' },
        { status: 404 }
      )
    }

    const systemQuantity = existingItem.systemQuantity || 0
    const unitPrice = existingItem.unitPrice || 0
    const countedQty = Number(countedQuantity)
    
    // اگر roundNumber داده شده، به countingRounds اضافه کن
    const countingRounds = existingItem.countingRounds || []
    if (roundNumber !== undefined && roundNumber !== null) {
      const roundIndex = countingRounds.findIndex((r: any) => r.roundNumber === roundNumber)
      const roundData = {
        roundNumber: roundNumber,
        quantity: countedQty,
        countedBy: countedBy || null,
        countedDate: new Date().toISOString(),
        notes: notes || ''
      }
      
      if (roundIndex >= 0) {
        countingRounds[roundIndex] = roundData
      } else {
        countingRounds.push(roundData)
      }
    }
    
    // محاسبه discrepancy بر اساس آخرین مقدار شمارش
    const discrepancy = countedQty - systemQuantity
    const discrepancyValue = discrepancy * unitPrice

    const itemData = {
      countedQuantity: countedQty,
      discrepancy,
      countedValue: countedQty * unitPrice,
      discrepancyValue,
      countedBy: countedBy || existingItem.countedBy,
      countedDate: new Date().toISOString(),
      countingRounds: countingRounds,
      notes: notes || existingItem.notes || '',
      updatedAt: new Date().toISOString()
    }

    // به‌روزرسانی
    await collection.updateOne(
      { _id: existingItem._id },
      { 
        $set: {
          ...itemData,
          itemName: existingItem.itemName,
          itemCode: existingItem.itemCode,
          category: existingItem.category,
          unit: existingItem.unit,
          warehouse: existingItem.warehouse,
          systemQuantity: existingItem.systemQuantity,
          unitPrice: existingItem.unitPrice,
          systemValue: existingItem.systemValue
        }
      }
    )
    const result = { insertedId: existingItem._id }

    // به‌روزرسانی آمار شمارش
    await updateCountStats(countId, countsCollection, collection)

    const updatedItem = await collection.findOne({ _id: result.insertedId || existingItem._id })

    return NextResponse.json({
      success: true,
      data: { ...updatedItem, _id: updatedItem._id.toString(), id: updatedItem._id.toString() },
      message: 'آیتم شمارش با موفقیت به‌روزرسانی شد'
    })
  } catch (error) {
    console.error('Error updating count item:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در به‌روزرسانی آیتم شمارش' },
      { status: 500 }
    )
  }
}

// PUT - به‌روزرسانی آیتم شمارش
export async function PUT(request: NextRequest) {
  try {
    const db = await connectToDatabase()
    if (!db) {
      throw new Error('Database connection failed')
    }
    const collection = db.collection(COLLECTION_NAME)
    const countsCollection = db.collection('inventory_counts')
    
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'شناسه آیتم اجباری است' },
        { status: 400 }
      )
    }

    // اگر countedQuantity تغییر کرده، discrepancy را دوباره محاسبه کن
    if (updateData.countedQuantity !== undefined) {
      const currentItem = await collection.findOne({ _id: new ObjectId(id) })
      const discrepancy = updateData.countedQuantity - (currentItem.systemQuantity || 0)
      updateData.discrepancy = discrepancy
      updateData.discrepancyValue = discrepancy * (currentItem.unitPrice || 0)
      updateData.countedValue = updateData.countedQuantity * (currentItem.unitPrice || 0)
      if (!updateData.countedDate) {
        updateData.countedDate = new Date().toISOString()
      }
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
        { success: false, message: 'آیتم یافت نشد' },
        { status: 404 }
      )
    }

    // به‌روزرسانی آمار شمارش
    const item = await collection.findOne({ _id: new ObjectId(id) })
    if (item.countId) {
      await updateCountStats(item.countId, countsCollection, collection)
    }

    const updatedItem = await collection.findOne({ _id: new ObjectId(id) })

    return NextResponse.json({
      success: true,
      data: { ...updatedItem, _id: updatedItem._id.toString(), id: updatedItem._id.toString() },
      message: 'آیتم با موفقیت به‌روزرسانی شد'
    })
  } catch (error) {
    console.error('Error updating count item:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در به‌روزرسانی آیتم' },
      { status: 500 }
    )
  }
}

// DELETE - حذف آیتم شمارش
export async function DELETE(request: NextRequest) {
  try {
    const db = await connectToDatabase()
    if (!db) {
      throw new Error('Database connection failed')
    }
    const collection = db.collection(COLLECTION_NAME)
    const countsCollection = db.collection('inventory_counts')
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'شناسه آیتم اجباری است' },
        { status: 400 }
      )
    }

    const item = await collection.findOne({ _id: new ObjectId(id) })
    const countId = item?.countId

    const result = await collection.deleteOne({ _id: new ObjectId(id) })
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'آیتم یافت نشد' },
        { status: 404 }
      )
    }

    // به‌روزرسانی آمار شمارش
    if (countId) {
      await updateCountStats(countId, countsCollection, collection)
    }

    return NextResponse.json({
      success: true,
      message: 'آیتم با موفقیت حذف شد'
    })
  } catch (error) {
    console.error('Error deleting count item:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در حذف آیتم' },
      { status: 500 }
    )
  }
}

// تابع کمکی برای به‌روزرسانی آمار شمارش
async function updateCountStats(countId: string, countsCollection: any, itemsCollection: any) {
  const items = await itemsCollection.find({ countId }).toArray()
  
  const countedItems = items.filter((item: any) => item.countedQuantity !== null && item.countedQuantity !== undefined).length
  const discrepancies = items.filter((item: any) => {
    const disc = (item.countedQuantity || 0) - (item.systemQuantity || 0)
    return disc !== 0
  }).length
  
  const discrepancyValue = items.reduce((sum: number, item: any) => {
    const disc = (item.countedQuantity || 0) - (item.systemQuantity || 0)
    return sum + Math.abs(disc * (item.unitPrice || 0))
  }, 0)

  await countsCollection.updateOne(
    { _id: new ObjectId(countId) },
    {
      $set: {
        countedItems,
        discrepancies,
        discrepancyValue,
        updatedAt: new Date().toISOString()
      }
    }
  )
}

