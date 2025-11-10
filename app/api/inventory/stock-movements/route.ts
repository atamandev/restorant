import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'
import { logStockMovement } from '@/lib/audit-logger'
import { notifyStockMovement } from '@/lib/inventory-sync'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://restorenUser:1234@localhost:27017/restoren'
const DB_NAME = 'restoren'

let client: MongoClient
let db: any

async function connectToDatabase() {
  try {
    if (!client) {
      client = new MongoClient(MONGO_URI)
      await client.connect()
      db = client.db(DB_NAME)
    } else if (!db) {
      db = client.db(DB_NAME)
    }
    
    if (db) {
      try {
        await db.admin().ping()
      } catch (pingError) {
        console.warn('MongoDB ping failed, but continuing:', pingError)
      }
    }
    
    if (!db) {
      throw new Error('Database connection failed: db is null')
    }
    
    return db
  } catch (error) {
    console.error('Database connection error:', error)
    if (client) {
      try {
        await client.close()
      } catch (e) {}
      client = null as any
    }
    db = null
    throw error
  }
}

// انواع حرکت کالا
export type MovementType = 
  | 'INITIAL'
  | 'PURCHASE_IN'
  | 'SALE_CONSUMPTION'
  | 'TRANSFER_OUT'
  | 'TRANSFER_IN'
  | 'ADJUSTMENT_INCREMENT'
  | 'ADJUSTMENT_DECREMENT'
  | 'WASTAGE'
  | 'RETURN_IN'
  | 'RETURN_OUT'

// GET - دریافت حرکات کالا
export async function GET(request: NextRequest) {
  try {
    const db = await connectToDatabase()
    const movementCollection = db.collection('stock_movements')
    
    const { searchParams } = new URL(request.url)
    const itemId = searchParams.get('itemId')
    const warehouseName = searchParams.get('warehouseName')
    const movementType = searchParams.get('movementType')
    const limit = parseInt(searchParams.get('limit') || '100')
    const skip = parseInt(searchParams.get('skip') || '0')
    
    const filter: any = {}
    if (itemId) {
      try {
        filter.itemId = new ObjectId(itemId)
      } catch {
        filter.itemId = itemId
      }
    }
    if (warehouseName) {
      filter.warehouseName = warehouseName
    }
    if (movementType) {
      filter.movementType = movementType
    }
    
    const movements = await movementCollection
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray()
    
    const total = await movementCollection.countDocuments(filter)
    
    return NextResponse.json({
      success: true,
      data: movements,
      total,
      limit,
      skip
    })
  } catch (error) {
    console.error('Error fetching stock movements:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت حرکات کالا' },
      { status: 500 }
    )
  }
}

// POST - ایجاد حرکت کالا
export async function POST(request: NextRequest) {
  try {
    const db = await connectToDatabase()
    const balanceCollection = db.collection('inventory_balance')
    const movementCollection = db.collection('stock_movements')
    const fifoLayerCollection = db.collection('fifo_layers')
    const warehouseCollection = db.collection('warehouses')
    
    const body = await request.json()
    const {
      itemId,
      warehouseId,
      warehouseName,
      movementType,
      quantity,
      unitPrice,
      lotNumber,
      expirationDate,
      documentNumber,
      documentType,
      description,
      referenceId,
      allowNegative = false,
      createdBy = 'سیستم'
    } = body
    
    // اعتبارسنجی
    if (!itemId || !warehouseName || !movementType || quantity === undefined) {
      return NextResponse.json(
        { success: false, message: 'itemId، warehouseName، movementType و quantity اجباری است' },
        { status: 400 }
      )
    }
    
    // بررسی تنظیمات انبار (اجازه موجودی منفی و وضعیت انبار)
    const warehouse = await warehouseCollection.findOne({ 
      $or: [
        { name: warehouseName },
        { name: { $regex: warehouseName, $options: 'i' } }
      ]
    })
    
    if (!warehouse) {
      return NextResponse.json(
        { success: false, message: `انبار "${warehouseName}" یافت نشد` },
        { status: 400 }
      )
    }
    
    // بررسی وضعیت انبار برای حرکات ورودی (IN)
    const isInMovement = ['INITIAL', 'PURCHASE_IN', 'TRANSFER_IN', 'ADJUSTMENT_INCREMENT', 'RETURN_IN'].includes(movementType)
    if (isInMovement && warehouse.status === 'inactive') {
      return NextResponse.json(
        { success: false, message: `انبار "${warehouseName}" غیرفعال است و نمی‌تواند ورود کالا بپذیرد` },
        { status: 400 }
      )
    }
    
    // بررسی وضعیت انبار برای انتقال به انبار غیرفعال
    if (movementType === 'TRANSFER_OUT') {
      // بررسی انبار مقصد در referenceId یا description
      // این بررسی در API transfers انجام می‌شود
    }
    
    const allowNegativeStock = allowNegative || warehouse?.allowNegativeStock || false
    
    // دریافت موجودی فعلی
    const balance = await balanceCollection.findOne({
      itemId: new ObjectId(itemId),
      warehouseName: warehouseName
    })
    
    const currentQuantity = balance?.quantity || 0
    const currentValue = balance?.totalValue || 0
    
    // محاسبه تغییر موجودی
    let quantityChange = 0
    let valueChange = 0
    
    switch (movementType) {
      case 'INITIAL':
      case 'PURCHASE_IN':
      case 'TRANSFER_IN':
      case 'ADJUSTMENT_INCREMENT':
      case 'RETURN_IN':
        quantityChange = quantity
        valueChange = quantity * (unitPrice || 0)
        break
      case 'SALE_CONSUMPTION':
      case 'TRANSFER_OUT':
      case 'ADJUSTMENT_DECREMENT':
      case 'WASTAGE':
      case 'RETURN_OUT':
        quantityChange = -quantity
        // برای خروج، قیمت از FIFO یا میانگین محاسبه می‌شود
        if (movementType === 'SALE_CONSUMPTION' || movementType === 'TRANSFER_OUT') {
          // استفاده از FIFO
          const fifoLayers = await fifoLayerCollection
            .find({
              itemId: new ObjectId(itemId),
              warehouseName: warehouseName,
              remainingQuantity: { $gt: 0 }
            })
            .sort({ createdAt: 1 }) // FIFO: قدیمی‌ترین اول
            .toArray()
          
          let remainingQty = quantity
          let totalCost = 0
          
          for (const layer of fifoLayers) {
            if (remainingQty <= 0) break
            
            const consumedQty = Math.min(remainingQty, layer.remainingQuantity)
            totalCost += consumedQty * layer.unitPrice
            remainingQty -= consumedQty
          }
          
          // اگر FIFO کافی نبود، از میانگین استفاده کن
          if (remainingQty > 0 && currentQuantity > 0) {
            const avgPrice = currentValue / currentQuantity
            totalCost += remainingQty * avgPrice
          }
          
          valueChange = -totalCost
        } else {
          // برای سایر انواع، از میانگین استفاده کن
          const avgPrice = currentQuantity > 0 ? currentValue / currentQuantity : (unitPrice || 0)
          valueChange = -quantity * avgPrice
        }
        break
      default:
        return NextResponse.json(
          { success: false, message: 'نوع حرکت نامعتبر است' },
          { status: 400 }
        )
    }
    
    // بررسی موجودی منفی
    const newQuantity = currentQuantity + quantityChange
    if (newQuantity < 0 && !allowNegativeStock) {
      return NextResponse.json(
        { 
          success: false, 
          message: `موجودی منفی مجاز نیست. موجودی فعلی: ${currentQuantity}، درخواست: ${quantity}` 
        },
        { status: 400 }
      )
    }
    
    // ذخیره وضعیت قبل برای لاگ
    const beforeState = balance ? {
      quantity: balance.quantity,
      totalValue: balance.totalValue
    } : null
    
    // به‌روزرسانی Balance
    const newValue = currentValue + valueChange
    
    if (balance) {
      await balanceCollection.updateOne(
        { _id: balance._id },
        {
          $set: {
            quantity: newQuantity,
            totalValue: newValue,
            lastUpdated: new Date().toISOString(),
            updatedAt: new Date()
          }
        }
      )
    } else {
      await balanceCollection.insertOne({
        itemId: new ObjectId(itemId),
        warehouseId: warehouseId || null,
        warehouseName: warehouseName,
        quantity: newQuantity,
        totalValue: newValue,
        lastUpdated: new Date().toISOString(),
        createdAt: new Date(),
        updatedAt: new Date()
      })
    }
    
    // ایجاد Stock Movement
    const movement = {
      itemId: new ObjectId(itemId),
      warehouseId: warehouseId || null,
      warehouseName: warehouseName,
      movementType: movementType,
      quantity: quantityChange,
      unitPrice: unitPrice || 0,
      totalValue: valueChange,
      lotNumber: lotNumber || null,
      expirationDate: expirationDate || null,
      documentNumber: documentNumber || `MOV-${Date.now()}`,
      documentType: documentType || movementType,
      description: description || '',
      referenceId: referenceId || null,
      createdBy: createdBy,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    const movementResult = await movementCollection.insertOne(movement)
    const movementId = movementResult.insertedId
    
    // مدیریت FIFO Layers (فقط برای ورود)
    if (movementType === 'PURCHASE_IN' || movementType === 'INITIAL' || movementType === 'TRANSFER_IN') {
      await fifoLayerCollection.insertOne({
        itemId: new ObjectId(itemId),
        warehouseId: warehouseId || null,
        warehouseName: warehouseName,
        movementId: movementId,
        quantity: quantity,
        remainingQuantity: quantity,
        unitPrice: unitPrice || 0,
        lotNumber: lotNumber || null,
        expirationDate: expirationDate || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
    }
    
    // به‌روزرسانی FIFO Layers برای خروج
    if (movementType === 'SALE_CONSUMPTION' || movementType === 'TRANSFER_OUT') {
      const fifoLayers = await fifoLayerCollection
        .find({
          itemId: new ObjectId(itemId),
          warehouseName: warehouseName,
          remainingQuantity: { $gt: 0 }
        })
        .sort({ createdAt: 1 })
        .toArray()
      
      let remainingQty = quantity
      
      for (const layer of fifoLayers) {
        if (remainingQty <= 0) break
        
        const consumedQty = Math.min(remainingQty, layer.remainingQuantity)
        const newRemainingQty = layer.remainingQuantity - consumedQty
        
        await fifoLayerCollection.updateOne(
          { _id: layer._id },
          {
            $set: {
              remainingQuantity: newRemainingQty,
              updatedAt: new Date()
            }
          }
        )
        
        remainingQty -= consumedQty
      }
    }
    
    // ثبت لاگ ممیزی
    try {
      const afterState = {
        quantity: newQuantity,
        totalValue: newValue
      }
      
      const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
      const userAgent = request.headers.get('user-agent') || 'unknown'
      
      await logStockMovement(
        movementType,
        itemId,
        warehouseName,
        quantityChange,
        beforeState,
        afterState,
        createdBy,
        description || undefined,
        clientIp,
        userAgent
      )
    } catch (error) {
      console.warn('Warning: Error logging audit event:', error)
      // این خطا نباید باعث شکست کل عملیات شود
    }
    
    // تریگر event برای به‌روزرسانی کش‌های قدیمی
    try {
      notifyStockMovement({
        itemId: itemId.toString(),
        warehouseName: warehouseName,
        quantity: quantityChange,
        movementType: movementType
      })
    } catch (error) {
      console.warn('Warning: Error notifying stock movement:', error)
    }
    
    // محاسبه مجدد هشدارها بعد از ثبت حرکت
    try {
      // استفاده از fetch داخلی برای محاسبه هشدارها
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
      await fetch(`${baseUrl}/api/stock-alerts/calculate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      }).catch((err) => {
        console.warn('Warning: Could not recalculate alerts:', err)
        // این خطا نباید باعث شکست کل عملیات شود
      })
    } catch (error) {
      console.warn('Warning: Error recalculating alerts after stock movement:', error)
      // این خطا نباید باعث شکست کل عملیات شود
    }
    
    return NextResponse.json({
      success: true,
      message: 'حرکت کالا با موفقیت ثبت شد'
    })
  } catch (error) {
    console.error('Error creating stock movement:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در ثبت حرکت کالا', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

