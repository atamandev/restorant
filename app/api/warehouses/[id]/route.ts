import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://restorenUser:1234@localhost:27017/restoren'
const DB_NAME = 'restoren'
const COLLECTION_NAME = 'warehouses'

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

// GET - دریافت انبار خاص
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const warehouse = await collection.findOne({ _id: new ObjectId(params.id) })
    
    if (!warehouse) {
      return NextResponse.json(
        { success: false, message: 'انبار یافت نشد' },
        { status: 404 }
      )
    }

    // دریافت آیتم‌های موجودی در این انبار
    const inventoryCollection = db.collection('inventory_items')
    const inventoryItems = await inventoryCollection.find({ warehouse: params.id }).toArray()
    
    // محاسبه آمار انبار
    const stats = {
      totalItems: inventoryItems.length,
      lowStockItems: inventoryItems.filter(item => item.isLowStock).length,
      outOfStockItems: inventoryItems.filter(item => item.currentStock === 0).length,
      totalValue: inventoryItems.reduce((sum, item) => sum + (item.totalValue || 0), 0),
      usedCapacity: inventoryItems.reduce((sum, item) => sum + (item.currentStock || 0), 0)
    }

    return NextResponse.json({
      success: true,
      data: {
        ...warehouse,
        inventoryItems,
        stats
      }
    })
  } catch (error) {
    console.error('Error fetching warehouse:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت انبار' },
      { status: 500 }
    )
  }
}

// PUT - به‌روزرسانی انبار خاص
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const body = await request.json()
    
    // محاسبه ظرفیت موجود
    if (body.capacity !== undefined || body.usedCapacity !== undefined) {
      const currentWarehouse = await collection.findOne({ _id: new ObjectId(params.id) })
      if (currentWarehouse) {
        const capacity = body.capacity !== undefined ? body.capacity : currentWarehouse.capacity
        const usedCapacity = body.usedCapacity !== undefined ? body.usedCapacity : currentWarehouse.usedCapacity
        body.availableCapacity = capacity - usedCapacity
      }
    }

    const result = await collection.updateOne(
      { _id: new ObjectId(params.id) },
      { 
        $set: {
          ...body,
          updatedAt: new Date().toISOString()
        }
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'انبار یافت نشد' },
        { status: 404 }
      )
    }

    const updatedWarehouse = await collection.findOne({ _id: new ObjectId(params.id) })

    return NextResponse.json({
      success: true,
      data: updatedWarehouse,
      message: 'انبار با موفقیت به‌روزرسانی شد'
    })
  } catch (error) {
    console.error('Error updating warehouse:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در به‌روزرسانی انبار' },
      { status: 500 }
    )
  }
}

// DELETE - حذف انبار خاص
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    // بررسی وجود آیتم‌های موجودی در این انبار
    const inventoryCollection = db.collection('inventory_items')
    const itemsInWarehouse = await inventoryCollection.countDocuments({ warehouse: params.id })
    
    if (itemsInWarehouse > 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: `امکان حذف انبار وجود ندارد. ${itemsInWarehouse} آیتم موجودی در این انبار موجود است.` 
        },
        { status: 400 }
      )
    }

    const result = await collection.deleteOne({ _id: new ObjectId(params.id) })
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'انبار یافت نشد' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'انبار با موفقیت حذف شد'
    })
  } catch (error) {
    console.error('Error deleting warehouse:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در حذف انبار' },
      { status: 500 }
    )
  }
}
