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

    // دریافت آیتم‌های موجودی در این انبار
    const inventoryCollection = db.collection('inventory_items')
    
    // لاگ برای دیباگ
    const warehouseName = warehouse.name
    console.log('=== Fetching inventory for warehouse ===')
    console.log('Warehouse name:', warehouseName)
    console.log('Warehouse ID:', warehouse._id.toString())
    
    // ابتدا بررسی کن که چه کالاهایی در دیتابیس هستند
    const allItems = await inventoryCollection.find({}).toArray()
    console.log('Total items in database:', allItems.length)
    
    // نمایش warehouse همه کالاها
    const warehouseCounts: { [key: string]: number } = {}
    allItems.forEach(item => {
      const wh = item.warehouse || 'بدون انبار'
      warehouseCounts[wh] = (warehouseCounts[wh] || 0) + 1
    })
    console.log('Items by warehouse:', warehouseCounts)
    
    // جستجو دقیق بر اساس نام انبار
    let inventoryItems = await inventoryCollection.find({ warehouse: warehouseName }).toArray()
    console.log('Found inventory items with exact match:', inventoryItems.length)
    
    // اگر محصولی پیدا نشد، با case-insensitive جستجو کن
    if (inventoryItems.length === 0) {
      const caseInsensitiveQuery = { 
        warehouse: { $regex: new RegExp(`^${warehouseName}$`, 'i') } 
      }
      inventoryItems = await inventoryCollection.find(caseInsensitiveQuery).toArray()
      console.log('Found inventory items with case-insensitive:', inventoryItems.length)
    }
    
    // اگر هنوز محصولی پیدا نشد، سعی کن با جستجوی جزئی (partial match) پیدا کن
    if (inventoryItems.length === 0) {
      const partialQuery = { 
        warehouse: { $regex: new RegExp(warehouseName, 'i') } 
      }
      inventoryItems = await inventoryCollection.find(partialQuery).toArray()
      console.log('Found inventory items with partial match:', inventoryItems.length)
    }
    
    // اگر هنوز محصولی پیدا نشد، سعی کن با نام‌های مختلف (مثل "تایماز" و "Taymaz") جستجو کن
    if (inventoryItems.length === 0) {
      // اگر انبار "تایماز" است، با نام‌های مختلف جستجو کن
      if (warehouseName === 'تایماز' || warehouseName.toLowerCase().includes('taymaz') || warehouseName.includes('تایماز')) {
        const alternativeNames = ['تایماز', 'Taymaz', 'taymaz', 'تایماز (WH-001)', 'تایماز(WH-001)']
        for (const altName of alternativeNames) {
          const altItems = await inventoryCollection.find({ warehouse: altName }).toArray()
          if (altItems.length > 0) {
            console.log(`Found ${altItems.length} items with alternative name: ${altName}`)
            inventoryItems = altItems
            break
          }
        }
      }
      
      // اگر هنوز محصولی پیدا نشد، سعی کن با جستجوی معکوس (یعنی اگر نام انبار در warehouse کالاها وجود دارد)
      if (inventoryItems.length === 0) {
        // جستجو برای کالاهایی که warehouse آنها شامل نام انبار است
        const reverseQuery = { 
          warehouse: { $regex: new RegExp(warehouseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') } 
        }
        inventoryItems = await inventoryCollection.find(reverseQuery).toArray()
        console.log('Found inventory items with reverse match:', inventoryItems.length)
      }
    }
    
    console.log('Final inventory items count:', inventoryItems.length)
    if (inventoryItems.length > 0) {
      console.log('Sample items:', inventoryItems.slice(0, 5).map(item => ({
        name: item.name,
        warehouse: item.warehouse || 'بدون انبار'
      })))
    } else {
      console.log('No items found for warehouse:', warehouseName)
      console.log('Available warehouse names in items:', Object.keys(warehouseCounts))
    }
    
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
