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
    await connectToDatabase()
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

    // آمار کلی
    const stats = await collection.aggregate([
      {
        $group: {
          _id: null,
          totalWarehouses: { $sum: 1 },
          activeWarehouses: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
          inactiveWarehouses: { $sum: { $cond: [{ $eq: ['$status', 'inactive'] }, 1, 0] } },
          maintenanceWarehouses: { $sum: { $cond: [{ $eq: ['$status', 'maintenance'] }, 1, 0] } },
          totalCapacity: { $sum: '$capacity' },
          totalUsedCapacity: { $sum: '$usedCapacity' }
        }
      }
    ]).toArray()

    return NextResponse.json({
      success: true,
      data: warehouses,
      stats: stats[0] || {
        totalWarehouses: 0,
        activeWarehouses: 0,
        inactiveWarehouses: 0,
        maintenanceWarehouses: 0,
        totalCapacity: 0,
        totalUsedCapacity: 0
      },
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
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const body = await request.json()
    
    // تولید کد انبار منحصر به فرد
    const warehouseCount = await collection.countDocuments()
    const warehouseCode = `WH-${String(warehouseCount + 1).padStart(3, '0')}`
    
    const warehouse = {
      code: warehouseCode,
      name: body.name,
      type: body.type || 'main', // main, storage, cold, dry
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
      isActive: body.isActive !== undefined ? body.isActive : true,
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
    await connectToDatabase()
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
    await connectToDatabase()
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
