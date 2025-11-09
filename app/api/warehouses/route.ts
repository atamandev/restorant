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

// GET - دریافت تمام انبارها با فیلتر و مرتب‌سازی
export async function GET(request: NextRequest) {
  try {
    const db = await connectToDatabase()
    if (!db) {
      throw new Error('Database connection failed')
    }
    const collection = db.collection(COLLECTION_NAME)
    
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // active, inactive, maintenance
    const type = searchParams.get('type') // main, storage, cold, dry
    const sortBy = searchParams.get('sortBy') || 'name'
    const sortOrder = searchParams.get('sortOrder') || 'asc'
    const limit = parseInt(searchParams.get('limit') || '100')
    const skip = parseInt(searchParams.get('skip') || '0')
    const search = searchParams.get('search') || ''

    // ساخت فیلتر
    const filter: any = {}
    if (status && status !== 'all') filter.status = status
    if (type && type !== 'all') filter.type = type
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ]
    }

    // ساخت مرتب‌سازی
    const sort: any = {}
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1

    const warehouses = await collection
      .find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .toArray()

    // محاسبه usedCapacity بر اساس موجودی واقعی کالاها برای هر انبار
    const inventoryCollection = db.collection('inventory_items')
    const warehousesWithRealCapacity = await Promise.all(
      warehouses.map(async (warehouse) => {
        const warehouseName = warehouse.name
        
        // جستجوی کالاهای این انبار
        let inventoryItems = await inventoryCollection.find({ warehouse: warehouseName }).toArray()
        
        // اگر محصولی پیدا نشد، با case-insensitive جستجو کن
        if (inventoryItems.length === 0) {
          const caseInsensitiveQuery = { 
            warehouse: { $regex: new RegExp(`^${warehouseName}$`, 'i') } 
          }
          inventoryItems = await inventoryCollection.find(caseInsensitiveQuery).toArray()
        }
        
        // اگر هنوز محصولی پیدا نشد و انبار "تایماز" است، با نام‌های مختلف جستجو کن
        if (inventoryItems.length === 0 && (warehouseName === 'تایماز' || warehouseName.toLowerCase().includes('taymaz'))) {
          const alternativeNames = ['تایماز', 'Taymaz', 'taymaz', 'تایماز (WH-001)', 'تایماز(WH-001)']
          for (const altName of alternativeNames) {
            const altItems = await inventoryCollection.find({ warehouse: altName }).toArray()
            if (altItems.length > 0) {
              inventoryItems = altItems
              break
            }
          }
        }
        
        // محاسبه usedCapacity بر اساس موجودی واقعی
        const realUsedCapacity = inventoryItems.reduce((sum, item) => sum + (item.currentStock || 0), 0)
        
        return {
          ...warehouse,
          usedCapacity: realUsedCapacity,
          availableCapacity: (warehouse.capacity || 0) - realUsedCapacity
        }
      })
    )

    // محاسبه آمار کلی بر اساس usedCapacity واقعی
    const totalUsedCapacity = warehousesWithRealCapacity.reduce((sum, w) => sum + (w.usedCapacity || 0), 0)
    
    // محاسبه ارزش کل موجودی و موجودی کم
    const balanceCollection = db.collection('inventory_balance')
    const stockAlertsCollection = db.collection('stock_alerts')
    
    const allBalances = await balanceCollection.find({}).toArray()
    const totalInventoryValue = allBalances.reduce((sum: number, b: any) => sum + (b.totalValue || 0), 0)
    
    // محاسبه موجودی کم (کالاهایی که currentStock <= minStock)
    const lowStockItems = await inventoryCollection.find({
      $expr: {
        $lte: ['$currentStock', { $ifNull: ['$minStock', 0] }]
      }
    }).toArray()
    const lowStockCount = lowStockItems.length
    
    // محاسبه هشدارهای فعال و بحرانی
    const activeAlerts = await stockAlertsCollection.countDocuments({ status: 'active' })
    const criticalAlerts = await stockAlertsCollection.countDocuments({ 
      status: 'active',
      $or: [
        { severity: 'critical' },
        { alertStatus: 'critical' }
      ]
    })
    
    const stats = {
      totalWarehouses: warehouses.length,
      activeWarehouses: warehouses.filter(w => w.status === 'active').length,
      inactiveWarehouses: warehouses.filter(w => w.status === 'inactive').length,
      maintenanceWarehouses: warehouses.filter(w => w.status === 'maintenance').length,
      totalCapacity: warehouses.reduce((sum, w) => sum + (w.capacity || 0), 0),
      totalUsedCapacity: totalUsedCapacity,
      totalInventoryValue: totalInventoryValue,
      lowStockItems: lowStockCount,
      activeAlerts: activeAlerts,
      criticalAlerts: criticalAlerts
    }

    return NextResponse.json({
      success: true,
      data: warehousesWithRealCapacity,
      stats: stats,
      pagination: {
        limit,
        skip,
        total: await collection.countDocuments(filter)
      }
    })
  } catch (error) {
    console.error('Error fetching warehouses:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت انبارها' },
      { status: 500 }
    )
  }
}

// POST - ایجاد انبار جدید
export async function POST(request: NextRequest) {
  try {
    const db = await connectToDatabase()
    if (!db) {
      throw new Error('Database connection failed')
    }
    const collection = db.collection(COLLECTION_NAME)
    
    const body = await request.json()
    
    // تولید کد انبار منحصر به فرد (اگر ارائه نشده باشد)
    let warehouseCode = body.code
    if (!warehouseCode || warehouseCode.trim() === '') {
      const warehouseCount = await collection.countDocuments()
      warehouseCode = `WH-${String(warehouseCount + 1).padStart(3, '0')}`
    }
    
    // بررسی تکراری نبودن کد
    const existingWarehouse = await collection.findOne({ code: warehouseCode })
    if (existingWarehouse) {
      return NextResponse.json(
        { success: false, message: `کد انبار "${warehouseCode}" تکراری است` },
        { status: 400 }
      )
    }
    
    const warehouse = {
      code: warehouseCode,
      name: body.name,
      type: body.type || 'general', // general, raw_materials, main, storage, cold, dry
      location: body.location || '',
      address: body.address || '',
      capacity: body.capacity || 0,
      usedCapacity: body.usedCapacity || 0,
      availableCapacity: (body.capacity || 0) - (body.usedCapacity || 0),
      temperature: body.temperature || null,
      humidity: body.humidity || null,
      manager: body.manager || '',
      phone: body.phone || '',
      email: body.email || '',
      description: body.description || '',
      status: body.status || 'active', // active, inactive, maintenance
      isActive: body.status === 'active',
      allowNegativeStock: body.allowNegativeStock || false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const result = await collection.insertOne(warehouse)
    
    return NextResponse.json({
      success: true,
      data: { ...warehouse, _id: result.insertedId },
      message: 'انبار با موفقیت ایجاد شد'
    })
  } catch (error) {
    console.error('Error creating warehouse:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در ایجاد انبار' },
      { status: 500 }
    )
  }
}

// PUT - به‌روزرسانی انبار
export async function PUT(request: NextRequest) {
  try {
    const db = await connectToDatabase()
    if (!db) {
      throw new Error('Database connection failed')
    }
    const collection = db.collection(COLLECTION_NAME)
    
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'شناسه انبار اجباری است' },
        { status: 400 }
      )
    }

    // محاسبه ظرفیت موجود
    if (updateData.capacity !== undefined || updateData.usedCapacity !== undefined) {
      const currentWarehouse = await collection.findOne({ _id: new ObjectId(id) })
      if (currentWarehouse) {
        const capacity = updateData.capacity !== undefined ? updateData.capacity : currentWarehouse.capacity
        const usedCapacity = updateData.usedCapacity !== undefined ? updateData.usedCapacity : currentWarehouse.usedCapacity
        updateData.availableCapacity = capacity - usedCapacity
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
        { success: false, message: 'انبار یافت نشد' },
        { status: 404 }
      )
    }

    const updatedWarehouse = await collection.findOne({ _id: new ObjectId(id) })

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

// DELETE - حذف انبار
export async function DELETE(request: NextRequest) {
  try {
    const db = await connectToDatabase()
    if (!db) {
      throw new Error('Database connection failed')
    }
    const collection = db.collection(COLLECTION_NAME)
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'شناسه انبار اجباری است' },
        { status: 400 }
      )
    }

    // بررسی وجود آیتم‌های موجودی در این انبار
    const inventoryCollection = db.collection('inventory_items')
    const itemsInWarehouse = await inventoryCollection.countDocuments({ warehouse: id })
    
    if (itemsInWarehouse > 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: `امکان حذف انبار وجود ندارد. ${itemsInWarehouse} آیتم موجودی در این انبار موجود است.` 
        },
        { status: 400 }
      )
    }

    const result = await collection.deleteOne({ _id: new ObjectId(id) })
    
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
