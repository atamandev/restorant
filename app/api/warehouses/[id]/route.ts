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
    // Trim کردن فاصله‌ها از نام انبار برای تطابق بهتر
    const warehouseName = warehouse.name?.trim() || warehouse.name
    const balanceCollection = db.collection('inventory_balance')
    const inventoryItemsCollection = db.collection('inventory_items')
    
    console.log('=== Fetching inventory for warehouse ===')
    console.log('Warehouse name (original):', warehouse.name)
    console.log('Warehouse name (trimmed):', warehouseName)
    
    // دریافت موجودی از inventory_balance برای این انبار
    let balances = await balanceCollection.find({ 
      warehouseName: warehouseName 
    }).toArray()
    
    console.log('Balances found (direct match):', balances.length)
    
    // اگر balance پیدا نشد، با نام‌های جایگزین جستجو کن
    if (balances.length === 0) {
      let alternativeNames: string[] = []
      
      if (warehouseName === 'انبار اصلی' || warehouseName.includes('انبار اصلی')) {
        alternativeNames = ['انبار اصلی', 'اصلی', 'تایماز', 'Taymaz', 'taymaz']
      } else if (warehouseName === 'اصلی') {
        alternativeNames = ['اصلی', 'انبار اصلی', 'تایماز', 'Taymaz', 'taymaz']
      } else if (warehouseName === 'تایماز' || warehouseName.toLowerCase().includes('taymaz')) {
        alternativeNames = ['تایماز', 'Taymaz', 'taymaz', 'انبار اصلی', 'اصلی']
      }
      
      if (alternativeNames.length > 0) {
        console.log('Trying alternative warehouse names for balance:', alternativeNames)
        for (const altName of alternativeNames) {
          const altBalances = await balanceCollection.find({ warehouseName: altName }).toArray()
          if (altBalances.length > 0) {
            balances = altBalances
            console.log(`Found ${altBalances.length} balances with alternative warehouse name: "${altName}"`)
            break
          }
        }
      }
    }
    
    console.log('Final balances found:', balances.length)
    
    // دریافت همه کالاهایی که warehouse field آنها برابر نام انبار است
    // استفاده از روش ساده‌تر: دریافت همه کالاها و فیلتر کردن با trim
    // این روش مطمئن‌تر است چون فاصله‌ها را در نظر می‌گیرد
    const allItems = await inventoryItemsCollection.find({}).toArray()
    
    // لیست نام‌های جایگزین برای جستجو
    let searchNames: string[] = [warehouseName]
    
    if (warehouseName === 'انبار اصلی' || warehouseName.includes('انبار اصلی')) {
      searchNames = ['انبار اصلی', 'اصلی', 'تایماز', 'Taymaz', 'taymaz']
    } else if (warehouseName === 'اصلی') {
      searchNames = ['اصلی', 'انبار اصلی', 'تایماز', 'Taymaz', 'taymaz']
    } else if (warehouseName === 'تایماز' || warehouseName.toLowerCase().includes('taymaz')) {
      searchNames = ['تایماز', 'Taymaz', 'taymaz', 'انبار اصلی', 'اصلی']
    }
    
    // فیلتر کردن کالاها بر اساس warehouse field (با trim)
    let itemsFromWarehouse = allItems.filter((item: any) => {
      const itemWarehouse = item.warehouse?.trim() || item.warehouse || ''
      return searchNames.some(searchName => itemWarehouse === searchName)
    })
    
    console.log(`Found ${itemsFromWarehouse.length} items from inventory_items with warehouse field matching:`, searchNames)
    console.log('Warehouse name searched:', warehouseName)
    
    // نمایش نمونه‌ای از warehouse field های موجود در دیتابیس برای دیباگ
    if (itemsFromWarehouse.length === 0) {
      const uniqueWarehouses = [...new Set(allItems.map((item: any) => item.warehouse).filter(Boolean))]
      console.log('All unique warehouse names in database:', uniqueWarehouses)
    }
    
    // ایجاد Map از balance ها برای دسترسی سریع
    const balanceMap = new Map<string, any>()
    for (const balance of balances) {
      const itemIdStr = balance.itemId?.toString() || String(balance.itemId || '')
      if (itemIdStr) {
        balanceMap.set(itemIdStr, balance)
      }
    }
    
    // برای هر balance، اطلاعات کامل آیتم را از inventory_items بگیر
    const inventoryItems = []
    const processedItemIds = new Set<string>() // برای جلوگیری از تکرار
    
    // ابتدا کالاهایی که balance دارند را پردازش کن
    for (const balance of balances) {
      // تبدیل itemId به ObjectId برای جستجو
      let itemId: any = balance.itemId
      if (typeof itemId === 'string') {
        try {
          itemId = new ObjectId(itemId)
        } catch (e) {
          console.warn(`Invalid itemId format: ${itemId}`, e)
          continue
        }
      }
      
      const itemIdStr = itemId.toString()
      
      // اگر قبلاً پردازش شده، رد کن
      if (processedItemIds.has(itemIdStr)) {
        continue
      }
      
      const item = await inventoryItemsCollection.findOne({ 
        _id: itemId
      })
      
      if (item) {
        processedItemIds.add(itemIdStr)
        const quantity = balance.quantity || 0
        const totalValue = balance.totalValue || (quantity * (item.unitPrice || 0))
        const unitPrice = quantity > 0 && balance.totalValue 
          ? balance.totalValue / quantity 
          : (item.unitPrice || 0)
        
        // استفاده از موجودی از balance (دقیق‌تر)
        // نمایش همه آیتم‌ها، حتی اگر موجودی صفر باشد
        inventoryItems.push({
          ...item,
          currentStock: quantity, // موجودی این انبار
          totalValue: totalValue,
          unitPrice: unitPrice,
          warehouse: warehouseName,
          isLowStock: quantity <= (item.minStock || 0)
        })
      } else {
        console.warn(`Item not found for balance itemId: ${itemIdStr}`)
      }
    }
    
    // حالا کالاهایی که در inventory_items هستند اما balance ندارند را اضافه کن
    console.log(`Processing ${itemsFromWarehouse.length} items from inventory_items that don't have balance`)
    for (const item of itemsFromWarehouse) {
      const itemIdStr = item._id?.toString() || String(item._id || '')
      
      // اگر قبلاً پردازش نشده (یعنی balance ندارد)
      if (!processedItemIds.has(itemIdStr)) {
        processedItemIds.add(itemIdStr)
        
        // استفاده از موجودی از inventory_items
        const quantity = item.currentStock || 0
        const unitPrice = item.unitPrice || 0
        const totalValue = item.totalValue || (quantity * unitPrice)
        
        console.log(`Adding item without balance: ${item.name}, warehouse: ${item.warehouse}, quantity: ${quantity}`)
        
        inventoryItems.push({
          ...item,
          currentStock: quantity,
          totalValue: totalValue,
          unitPrice: unitPrice,
          warehouse: warehouseName,
          isLowStock: quantity <= (item.minStock || 0)
        })
      } else {
        console.log(`Skipping item (already processed from balance): ${item.name}`)
      }
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
    const inventoryCollection = db.collection('inventory_items')
    const balanceCollection = db.collection('inventory_balance')
    const stockMovementsCollection = db.collection('stock_movements')
    const stockAlertsCollection = db.collection('stock_alerts')
    const transfersCollection = db.collection('transfers')
    const cashRegistersCollection = db.collection('cash_registers')
    
    // دریافت اطلاعات انبار قبل از حذف
    const currentWarehouse = await collection.findOne({ _id: new ObjectId(params.id) })
    
    if (!currentWarehouse) {
      return NextResponse.json(
        { success: false, message: 'انبار یافت نشد' },
        { status: 404 }
      )
    }
    
    const warehouseName = currentWarehouse.name
    const warehouseId = params.id
    
    console.log(`[DELETE] Starting deletion of warehouse ${warehouseName} (${warehouseId})`)
    
    // بررسی وجود آیتم‌های موجودی در این انبار
    const itemsInWarehouse = await inventoryCollection.countDocuments({ 
      $or: [
        { warehouse: warehouseName },
        { warehouse: warehouseId }
      ]
    })
    
    const balancesInWarehouse = await balanceCollection.countDocuments({
      warehouseName: warehouseName
    })
    
    console.log(`[DELETE] Found ${itemsInWarehouse} items and ${balancesInWarehouse} balances in warehouse`)
    
    // حذف از inventory_balance (موجودی این انبار)
    const balanceResult = await balanceCollection.deleteMany({
      warehouseName: warehouseName
    })
    console.log(`[DELETE] Deleted ${balanceResult.deletedCount} balance records`)
    
    // حذف از inventory_items (کالاهایی که warehouse field برابر نام انبار است)
    // توجه: این فقط کالاهایی را حذف می‌کند که warehouse field دقیقاً برابر نام انبار است
    // اگر می‌خواهید فقط warehouse field را پاک کنید به جای حذف کالا، می‌توانید update کنید
    const itemsResult = await inventoryCollection.deleteMany({
      $or: [
        { warehouse: warehouseName },
        { warehouse: warehouseId }
      ]
    })
    console.log(`[DELETE] Deleted ${itemsResult.deletedCount} inventory items`)
    
    // حذف از stock_movements (حرکات موجودی این انبار)
    const movementsResult = await stockMovementsCollection.deleteMany({
      $or: [
        { warehouseName: warehouseName },
        { warehouseId: warehouseId }
      ]
    })
    console.log(`[DELETE] Deleted ${movementsResult.deletedCount} stock movements`)
    
    // حذف از stock_alerts (هشدارهای این انبار)
    const alertsResult = await stockAlertsCollection.deleteMany({
      warehouse: warehouseName
    })
    console.log(`[DELETE] Deleted ${alertsResult.deletedCount} stock alerts`)
    
    // حذف از transfers (انتقالات مرتبط با این انبار)
    const transfersResult = await transfersCollection.deleteMany({
      $or: [
        { fromWarehouse: warehouseName },
        { toWarehouse: warehouseName }
      ]
    })
    console.log(`[DELETE] Deleted ${transfersResult.deletedCount} transfers`)
    
    // حذف از cash_registers (صندوق‌های مرتبط - اگر branchId یا warehouseId دارند)
    // این اختیاری است، بستگی به ساختار داده‌ها دارد
    
    // حذف خود انبار
    const result = await collection.deleteOne({ _id: new ObjectId(params.id) })
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'انبار یافت نشد' },
        { status: 404 }
      )
    }
    
    console.log(`[DELETE] Successfully deleted warehouse ${warehouseName} and all related data`)
    
    return NextResponse.json({
      success: true,
      message: 'انبار و تمام داده‌های مرتبط با موفقیت حذف شد',
      deletedCounts: {
        warehouse: result.deletedCount,
        items: itemsResult.deletedCount,
        balances: balanceResult.deletedCount,
        movements: movementsResult.deletedCount,
        alerts: alertsResult.deletedCount,
        transfers: transfersResult.deletedCount
      }
    })
  } catch (error) {
    console.error('Error deleting warehouse:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در حذف انبار',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
