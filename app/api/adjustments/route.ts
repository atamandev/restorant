import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://restorenUser:1234@localhost:27017/restoren'
const DB_NAME = 'restoren'
const COLLECTION_NAME = 'adjustments'

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

// GET - دریافت تعدیلات
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const { searchParams } = new URL(request.url)
    const countId = searchParams.get('countId')
    const warehouse = searchParams.get('warehouse')
    const status = searchParams.get('status')
    const sortBy = searchParams.get('sortBy') || 'createdDate'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const limit = parseInt(searchParams.get('limit') || '100')
    const skip = parseInt(searchParams.get('skip') || '0')

    const filter: any = {}
    if (countId) filter.countId = countId
    if (warehouse && warehouse !== 'all') filter.warehouse = warehouse
    if (status && status !== 'all') filter.status = status

    const sort: any = {}
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1

    const adjustments = await collection
      .find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .toArray()

    return NextResponse.json({
      success: true,
      data: adjustments.map((adj: any) => ({
        ...adj,
        _id: adj._id.toString(),
        id: adj._id.toString()
      })),
      pagination: {
        limit,
        skip,
        total: await collection.countDocuments(filter)
      }
    })
  } catch (error) {
    console.error('Error fetching adjustments:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت تعدیلات' },
      { status: 500 }
    )
  }
}

// POST - ایجاد تعدیل از شمارش
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    const countsCollection = db.collection('inventory_counts')
    const countItemsCollection = db.collection('count_items')
    const inventoryCollection = db.collection('inventory_items')
    const ledgerCollection = db.collection('item_ledger')
    
    const body = await request.json()
    
    const {
      countId,
      createdBy
    } = body

    if (!countId || !createdBy) {
      return NextResponse.json(
        { success: false, message: 'شناسه شمارش و ایجادکننده اجباری است' },
        { status: 400 }
      )
    }

    // بررسی شمارش
    const count = await countsCollection.findOne({ _id: new ObjectId(countId) })
    if (!count) {
      return NextResponse.json(
        { success: false, message: 'شمارش یافت نشد' },
        { status: 404 }
      )
    }

    if (count.status !== 'completed') {
      return NextResponse.json(
        { success: false, message: 'فقط شمارش‌های تکمیل شده قابل تعدیل هستند' },
        { status: 400 }
      )
    }

    // دریافت آیتم‌های شمارش با اختلاف
    const allCountItems = await countItemsCollection.find({ countId }).toArray()
    const countItems = allCountItems.filter((item: any) => {
      if (item.countedQuantity === null || item.countedQuantity === undefined) return false
      return item.countedQuantity !== item.systemQuantity
    })

    if (countItems.length === 0) {
      return NextResponse.json(
        { success: false, message: 'هیچ اختلافی برای تعدیل وجود ندارد' },
        { status: 400 }
      )
    }

    // تولید شماره تعدیل
    const adjustmentCount = await collection.countDocuments()
    const adjustmentNumber = `ADJ-${String(adjustmentCount + 1).padStart(3, '0')}`

    // ساخت آیتم‌های تعدیل
    const adjustmentItems = countItems.map((item: any) => {
      const quantity = (item.countedQuantity || 0) - (item.systemQuantity || 0)
      return {
        itemId: item.itemId,
        itemName: item.itemName,
        itemCode: item.itemCode,
        quantity,
        unitPrice: item.unitPrice,
        totalValue: quantity * item.unitPrice,
        reason: `تعدیل از شمارش ${count.countNumber}: ${item.notes || 'اختلاف در شمارش'}`
      }
    })

    // تعیین نوع تعدیل (افزایش یا کاهش)
    const totalValue = adjustmentItems.reduce((sum: number, item: any) => sum + item.totalValue, 0)
    const type = totalValue > 0 ? 'increase' : 'decrease'

    const adjustment = {
      adjustmentNumber,
      countId,
      warehouse: count.warehouse,
      type,
      totalItems: adjustmentItems.length,
      totalValue: Math.abs(totalValue),
      createdBy,
      createdDate: new Date().toISOString(),
      status: 'draft',
      items: adjustmentItems,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const result = await collection.insertOne(adjustment)

    return NextResponse.json({
      success: true,
      data: { ...adjustment, _id: result.insertedId.toString(), id: result.insertedId.toString() },
      message: 'تعدیل با موفقیت ایجاد شد'
    })
  } catch (error) {
    console.error('Error creating adjustment:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در ایجاد تعدیل' },
      { status: 500 }
    )
  }
}

// PUT - به‌روزرسانی تعدیل
export async function PUT(request: NextRequest) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'شناسه تعدیل اجباری است' },
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
        { success: false, message: 'تعدیل یافت نشد' },
        { status: 404 }
      )
    }

    const updatedAdjustment = await collection.findOne({ _id: new ObjectId(id) })

    return NextResponse.json({
      success: true,
      data: { ...updatedAdjustment, _id: updatedAdjustment._id.toString(), id: updatedAdjustment._id.toString() },
      message: 'تعدیل با موفقیت به‌روزرسانی شد'
    })
  } catch (error) {
    console.error('Error updating adjustment:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در به‌روزرسانی تعدیل' },
      { status: 500 }
    )
  }
}

// DELETE - حذف تعدیل
export async function DELETE(request: NextRequest) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'شناسه تعدیل اجباری است' },
        { status: 400 }
      )
    }

    const adjustment = await collection.findOne({ _id: new ObjectId(id) })
    
    if (adjustment && adjustment.status === 'posted') {
      return NextResponse.json(
        { success: false, message: 'تعدیل ثبت شده قابل حذف نیست' },
        { status: 400 }
      )
    }

    const result = await collection.deleteOne({ _id: new ObjectId(id) })
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'تعدیل یافت نشد' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'تعدیل با موفقیت حذف شد'
    })
  } catch (error) {
    console.error('Error deleting adjustment:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در حذف تعدیل' },
      { status: 500 }
    )
  }
}

