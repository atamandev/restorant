import { NextRequest, NextResponse } from 'next/server'
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

// PATCH - به‌روزرسانی کالا
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = await connectToDatabase()
    if (!db) {
      throw new Error('Database connection failed')
    }
    const inventoryCollection = db.collection('inventory_items')
    
    const body = await request.json()
    const itemId = params.id
    
    // تبدیل به ObjectId
    let objectId
    try {
      objectId = new ObjectId(itemId)
    } catch {
      return NextResponse.json(
        { success: false, message: 'شناسه کالا نامعتبر است' },
        { status: 400 }
      )
    }
    
    // اطمینان از اینکه warehouse تنظیم شده است
    let finalWarehouse = body.warehouse && body.warehouse.trim() ? body.warehouse.trim() : ''
    
    // اگر warehouse شامل "تایماز" است، فقط "تایماز" را نگه دار (برای حذف کد انبار مثل "تایماز (WH-001)")
    if (finalWarehouse && finalWarehouse.includes('تایماز')) {
      finalWarehouse = 'تایماز'
    }
    
    // اگر warehouse خالی است، به "تایماز" تنظیم کن (پیش‌فرض)
    if (!finalWarehouse || finalWarehouse === '' || finalWarehouse === 'undefined') {
      finalWarehouse = 'تایماز'
    }
    
    if (body.warehouse !== undefined) {
      body.warehouse = finalWarehouse
    }
    
    console.log('Updating item with warehouse:', finalWarehouse, 'Original warehouse:', body.warehouse)
    
    // محاسبه totalValue اگر currentStock یا unitPrice تغییر کرده
    const updateData: any = {
      ...body,
      updatedAt: new Date()
    }
    
    if (body.currentStock !== undefined || body.unitPrice !== undefined) {
      const existingItem = await inventoryCollection.findOne({ _id: objectId })
      const stock = body.currentStock !== undefined ? Number(body.currentStock) : (existingItem?.currentStock || 0)
      const price = body.unitPrice !== undefined ? Number(body.unitPrice) : (existingItem?.unitPrice || 0)
      updateData.totalValue = stock * price
    }
    
    // محاسبه isLowStock
    if (body.currentStock !== undefined || body.minStock !== undefined) {
      const existingItem = await inventoryCollection.findOne({ _id: objectId })
      const stock = body.currentStock !== undefined ? Number(body.currentStock) : (existingItem?.currentStock || 0)
      const min = body.minStock !== undefined ? Number(body.minStock) : (existingItem?.minStock || 0)
      updateData.isLowStock = stock <= min
    }
    
    if (body.expiryDate) {
      updateData.expiryDate = new Date(body.expiryDate).toISOString()
    }
    
    if (body.lastUpdated === undefined) {
      updateData.lastUpdated = new Date().toISOString()
    }
    
    const result = await inventoryCollection.updateOne(
      { _id: objectId },
      { $set: updateData }
    )
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'کالا یافت نشد' },
        { status: 404 }
      )
    }
    
    const updatedItem = await inventoryCollection.findOne({ _id: objectId })
    
    return NextResponse.json({
      success: true,
      data: {
        ...updatedItem,
        id: updatedItem._id?.toString()
      },
      message: 'کالا با موفقیت به‌روزرسانی شد'
    })
  } catch (error) {
    console.error('Error updating warehouse item:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'خطا در به‌روزرسانی کالا',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// DELETE - حذف کالا
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = await connectToDatabase()
    if (!db) {
      throw new Error('Database connection failed')
    }
    const inventoryCollection = db.collection('inventory_items')
    
    const itemId = params.id
    
    // تبدیل به ObjectId
    let objectId
    try {
      objectId = new ObjectId(itemId)
    } catch {
      return NextResponse.json(
        { success: false, message: 'شناسه کالا نامعتبر است' },
        { status: 400 }
      )
    }
    
    const result = await inventoryCollection.deleteOne({ _id: objectId })
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'کالا یافت نشد' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'کالا با موفقیت حذف شد'
    })
  } catch (error) {
    console.error('Error deleting warehouse item:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'خطا در حذف کالا',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

