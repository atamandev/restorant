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
    const db = await connectToDatabase()
    if (!db) {
      throw new Error('Database connection failed')
    }
    const collection = db.collection(COLLECTION_NAME)
    
    const warehouse = await collection.findOne({ _id: new ObjectId(params.id) })
    
    if (!warehouse) {
      return NextResponse.json(
        { success: false, message: 'انبار یافت نشد' },
        { status: 404 }
      )
    }

    // دریافت آیتم‌های موجودی در این انبار از inventory_balance (دقیق‌تر)
    const warehouseName = warehouse.name
    const balanceCollection = db.collection('inventory_balance')
    const inventoryItemsCollection = db.collection('inventory_items')
    
    // دریافت موجودی از inventory_balance برای این انبار
    const balances = await balanceCollection.find({ 
      warehouseName: warehouseName 
    }).toArray()
    
    console.log('=== Fetching inventory for warehouse ===')
    console.log('Warehouse name:', warehouseName)
    console.log('Balances found:', balances.length)
    
    // برای هر balance، اطلاعات کامل آیتم را از inventory_items بگیر
    const inventoryItems = []
    for (const balance of balances) {
      if (balance.quantity > 0) { // فقط آیتم‌هایی با موجودی بیشتر از صفر
        const item = await inventoryItemsCollection.findOne({ 
          _id: balance.itemId 
        })
        
        if (item) {
          // استفاده از موجودی از balance (دقیق‌تر)
          inventoryItems.push({
            ...item,
            currentStock: balance.quantity, // موجودی این انبار
            totalValue: balance.totalValue || (balance.quantity * (item.unitPrice || 0)),
            unitPrice: balance.quantity > 0 ? (balance.totalValue || 0) / balance.quantity : item.unitPrice || 0,
            warehouse: warehouseName,
            isLowStock: (balance.quantity || 0) <= (item.minStock || 0)
          })
        }
      }
    }
    
    // اگر balance خالی بود، از inventory_items استفاده کن (fallback)
    if (inventoryItems.length === 0) {
      console.log('No balances found, falling back to inventory_items')
      let items = await inventoryItemsCollection.find({ warehouse: warehouseName }).toArray()
      
      // اگر پیدا نشد، با case-insensitive جستجو کن
      if (items.length === 0) {
        items = await inventoryItemsCollection.find({ 
          warehouse: { $regex: new RegExp(`^${warehouseName}$`, 'i') } 
        }).toArray()
      }
      
      inventoryItems.push(...items)
    }
    
    console.log('Final inventory items count:', inventoryItems.length)
    
    // محاسبه آمار انبار
    const stats = {
      totalItems: inventoryItems.length,
      lowStockItems: inventoryItems.filter(item => item.isLowStock || (item.currentStock || 0) <= (item.minStock || 0)).length,
      outOfStockItems: inventoryItems.filter(item => (item.currentStock || 0) === 0).length,
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
    const db = await connectToDatabase()
    if (!db) {
      throw new Error('Database connection failed')
    }
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
    const db = await connectToDatabase()
    if (!db) {
      throw new Error('Database connection failed')
    }
    const collection = db.collection(COLLECTION_NAME)
    
    // بررسی وجود آیتم‌های موجودی در این انبار
    const inventoryCollection = db.collection('inventory_items')
    const currentWarehouse = await collection.findOne({ _id: new ObjectId(params.id) })
    const itemsInWarehouse = await inventoryCollection.countDocuments({ 
      $or: [
        { warehouse: currentWarehouse?.name },
        { warehouse: params.id }
      ]
    })
    
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
