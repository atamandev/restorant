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

// تنظیمات پیش‌فرض
const DEFAULT_MIN_STOCK = 10
const DEFAULT_REORDER_POINT = 20
const DEFAULT_MAX_STOCK = 100
const EXPIRY_WARNING_DAYS = 30

// POST - محاسبه و به‌روزرسانی هشدارها
export async function POST(request: NextRequest) {
  try {
    const db = await connectToDatabase()
    const balanceCollection = db.collection('inventory_balance')
    const inventoryItemsCollection = db.collection('inventory_items')
    const stockAlertsCollection = db.collection('stock_alerts')
    const categoriesCollection = db.collection('categories') // اگر وجود دارد
    
    // دریافت تمام موجودی‌ها از Balance
    let balances = await balanceCollection.find({}).toArray()
    
    // دریافت تمام آیتم‌ها
    const items = await inventoryItemsCollection.find({}).limit(10000).toArray()
    
    // اگر inventory_balance خالی است، از inventory_items استفاده کن
    if (balances.length === 0 && items.length > 0) {
      console.log('inventory_balance خالی است، استفاده از inventory_items برای محاسبه هشدارها')
      // ساخت balance از inventory_items
      balances = items.map(item => ({
        itemId: item._id.toString(),
        warehouseName: item.warehouse || 'تایماز',
        quantity: item.currentStock || 0,
        _id: item._id
      }))
    }
    
    // ایجاد map برای دسترسی سریع
    const itemsMap = new Map()
    items.forEach(item => {
      itemsMap.set(item._id.toString(), item)
    })
    
    // دریافت تنظیمات دسته‌بندی (اگر وجود دارد)
    const categories = await categoriesCollection.find({}).toArray().catch(() => [])
    const categorySettings = new Map()
    categories.forEach((cat: any) => {
      categorySettings.set(cat.name, {
        minStock: cat.minStock || DEFAULT_MIN_STOCK,
        reorderPoint: cat.reorderPoint || DEFAULT_REORDER_POINT,
        maxStock: cat.maxStock || DEFAULT_MAX_STOCK
      })
    })
    
    const alertsToCreate: any[] = []
    const alertsToUpdate: any[] = []
    const activeAlertIds = new Set<string>()
    
    // محاسبه تاریخ انقضا
    const today = new Date()
    const expiryWarningDate = new Date()
    expiryWarningDate.setDate(today.getDate() + EXPIRY_WARNING_DAYS)
    
    // بررسی هر balance
    for (const balance of balances) {
      const itemId = balance.itemId?.toString()
      const item = itemsMap.get(itemId)
      
      if (!item) continue
      
      const warehouseName = balance.warehouseName
      const currentStock = balance.quantity || 0
      
      // دریافت تنظیمات: اول از item × warehouse، سپس دسته، سپس پیش‌فرض
      const itemWarehouseSettings = item.warehouseSettings?.[warehouseName] || {}
      const categorySetting = categorySettings.get(item.category) || {}
      
      const minQty = itemWarehouseSettings.minQty || item.minStock || categorySetting.minStock || DEFAULT_MIN_STOCK
      const reorderPoint = itemWarehouseSettings.reorderPoint || item.reorderPoint || categorySetting.reorderPoint || DEFAULT_REORDER_POINT
      const maxQty = itemWarehouseSettings.maxQty || item.maxStock || categorySetting.maxStock || DEFAULT_MAX_STOCK
      
      // بررسی انواع هشدار
      
      // 1. LOW_STOCK: موجودی ≤ minQty
      if (currentStock <= minQty) {
        const severity = currentStock === 0 ? 'critical' : (currentStock <= minQty * 0.5 ? 'high' : 'medium')
        const alertType = currentStock === 0 ? 'out_of_stock' : 'low_stock'
        const alertTypeCode = currentStock === 0 ? 'OUT_OF_STOCK' : 'LOW_STOCK'
        
        const alertKey = `${itemId}-${warehouseName}-${alertTypeCode}`
        activeAlertIds.add(alertKey)
        
        // بررسی وجود هشدار فعال
        const existingAlert = await stockAlertsCollection.findOne({
          itemId: itemId,
          warehouse: warehouseName,
          type: alertType,
          status: 'active'
        })
        
        if (existingAlert) {
          // به‌روزرسانی هشدار موجود
          alertsToUpdate.push({
            _id: existingAlert._id,
            update: {
              $set: {
                currentStock,
                severity,
                message: currentStock === 0 
                  ? `${item.name} در انبار ${warehouseName} تمام شده است`
                  : `موجودی ${item.name} در انبار ${warehouseName} کم است (${currentStock} از ${minQty})`,
                updatedAt: new Date().toISOString()
              }
            }
          })
        } else {
          // ایجاد هشدار جدید
          alertsToCreate.push({
            itemId: itemId,
            itemName: item.name,
            itemCode: item.code || '',
            category: item.category || '',
            warehouse: warehouseName,
            type: alertType,
            alertTypeCode: alertTypeCode,
            severity,
            currentStock,
            minStock: minQty,
            reorderPoint,
            maxStock: maxQty,
            message: currentStock === 0 
              ? `${item.name} در انبار ${warehouseName} تمام شده است`
              : `موجودی ${item.name} در انبار ${warehouseName} کم است (${currentStock} از ${minQty})`,
            status: 'active',
            priority: severity === 'critical' ? 'urgent' : (severity === 'high' ? 'high' : 'normal'),
            actions: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          })
        }
      }
      
      // 2. NEAR_REORDER: موجودی ≤ reorderPoint و > minQty
      if (currentStock > minQty && currentStock <= reorderPoint) {
        const alertKey = `${itemId}-${warehouseName}-NEAR_REORDER`
        activeAlertIds.add(alertKey)
        
        const existingAlert = await stockAlertsCollection.findOne({
          itemId: itemId,
          warehouse: warehouseName,
          type: 'low_stock',
          alertTypeCode: 'NEAR_REORDER',
          status: 'active'
        })
        
        if (existingAlert) {
          alertsToUpdate.push({
            _id: existingAlert._id,
            update: {
              $set: {
                currentStock,
                severity: 'medium',
                message: `موجودی ${item.name} در انبار ${warehouseName} نزدیک به نقطه سفارش است (${currentStock} از ${reorderPoint})`,
                updatedAt: new Date().toISOString()
              }
            }
          })
        } else {
          alertsToCreate.push({
            itemId: itemId,
            itemName: item.name,
            itemCode: item.code || '',
            category: item.category || '',
            warehouse: warehouseName,
            type: 'low_stock',
            alertTypeCode: 'NEAR_REORDER',
            severity: 'medium',
            currentStock,
            minStock: minQty,
            reorderPoint,
            maxStock: maxQty,
            message: `موجودی ${item.name} در انبار ${warehouseName} نزدیک به نقطه سفارش است (${currentStock} از ${reorderPoint})`,
            status: 'active',
            priority: 'normal',
            actions: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          })
        }
      }
      
      // 3. OVERSTOCK: موجودی ≥ maxQty
      if (maxQty > 0 && currentStock >= maxQty) {
        const alertKey = `${itemId}-${warehouseName}-OVERSTOCK`
        activeAlertIds.add(alertKey)
        
        const existingAlert = await stockAlertsCollection.findOne({
          itemId: itemId,
          warehouse: warehouseName,
          type: 'overstock',
          status: 'active'
        })
        
        if (existingAlert) {
          alertsToUpdate.push({
            _id: existingAlert._id,
            update: {
              $set: {
                currentStock,
                severity: 'low',
                message: `موجودی ${item.name} در انبار ${warehouseName} بیش از حد است (${currentStock} از ${maxQty})`,
                updatedAt: new Date().toISOString()
              }
            }
          })
        } else {
          alertsToCreate.push({
            itemId: itemId,
            itemName: item.name,
            itemCode: item.code || '',
            category: item.category || '',
            warehouse: warehouseName,
            type: 'overstock',
            alertTypeCode: 'OVERSTOCK',
            severity: 'low',
            currentStock,
            minStock: minQty,
            reorderPoint,
            maxStock: maxQty,
            message: `موجودی ${item.name} در انبار ${warehouseName} بیش از حد است (${currentStock} از ${maxQty})`,
            status: 'active',
            priority: 'low',
            actions: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          })
        }
      }
      
      // 4. EXPIRY_SOON: بررسی تاریخ انقضا (اگر موجود باشد)
      if (balance.expirationDate || item.expiryDate) {
        const expiryDate = new Date(balance.expirationDate || item.expiryDate)
        
        if (expiryDate <= expiryWarningDate && expiryDate >= today) {
          const daysToExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
          
          const alertKey = `${itemId}-${warehouseName}-EXPIRY_SOON`
          activeAlertIds.add(alertKey)
          
          const existingAlert = await stockAlertsCollection.findOne({
            itemId: itemId,
            warehouse: warehouseName,
            type: 'expiry',
            alertTypeCode: 'EXPIRY_SOON',
            status: 'active'
          })
          
          if (existingAlert) {
            alertsToUpdate.push({
              _id: existingAlert._id,
              update: {
                $set: {
                  expiryDate: expiryDate.toISOString(),
                  daysToExpiry,
                  severity: daysToExpiry <= 7 ? 'critical' : (daysToExpiry <= 15 ? 'high' : 'medium'),
                  message: `${item.name} در انبار ${warehouseName} تا ${daysToExpiry} روز دیگر منقضی می‌شود`,
                  updatedAt: new Date().toISOString()
                }
              }
            })
          } else {
            alertsToCreate.push({
              itemId: itemId,
              itemName: item.name,
              itemCode: item.code || '',
              category: item.category || '',
              warehouse: warehouseName,
              type: 'expiry',
              alertTypeCode: 'EXPIRY_SOON',
              severity: daysToExpiry <= 7 ? 'critical' : (daysToExpiry <= 15 ? 'high' : 'medium'),
              currentStock,
              expiryDate: expiryDate.toISOString(),
              daysToExpiry,
              message: `${item.name} در انبار ${warehouseName} تا ${daysToExpiry} روز دیگر منقضی می‌شود`,
              status: 'active',
              priority: daysToExpiry <= 7 ? 'urgent' : (daysToExpiry <= 15 ? 'high' : 'normal'),
              actions: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            })
          }
        }
      }
    }
    
    // بستن هشدارهای غیرفعال (که دیگر شرایط را ندارند)
    const allActiveAlerts = await stockAlertsCollection.find({ status: 'active' }).toArray()
    const alertsToResolve: any[] = []
    
    for (const alert of allActiveAlerts) {
      const alertKey = `${alert.itemId}-${alert.warehouse}-${alert.alertTypeCode || alert.type.toUpperCase()}`
      
      if (!activeAlertIds.has(alertKey)) {
        // بررسی اینکه آیا واقعاً باید بسته شود
        const balance = balances.find(b => 
          b.itemId?.toString() === alert.itemId && 
          b.warehouseName === alert.warehouse
        )
        
        if (balance) {
          const currentStock = balance.quantity || 0
          const item = itemsMap.get(alert.itemId)
          
          if (item) {
            const itemWarehouseSettings = item.warehouseSettings?.[alert.warehouse] || {}
            const categorySetting = categorySettings.get(item.category) || {}
            
            const minQty = itemWarehouseSettings.minQty || item.minStock || categorySetting.minStock || DEFAULT_MIN_STOCK
            const reorderPoint = itemWarehouseSettings.reorderPoint || item.reorderPoint || categorySetting.reorderPoint || DEFAULT_REORDER_POINT
            const maxQty = itemWarehouseSettings.maxQty || item.maxStock || categorySetting.maxStock || DEFAULT_MAX_STOCK
            
            // بررسی اینکه آیا هشدار باید بسته شود
            let shouldResolve = false
            
            if (alert.type === 'out_of_stock') {
              // اگر موجودی بیشتر از 0 شد، هشدار را resolve کن
              shouldResolve = currentStock > 0
            } else if (alert.type === 'low_stock') {
              // اگر موجودی بیشتر از minQty شد، هشدار را resolve کن
              shouldResolve = currentStock > minQty
            } else if (alert.type === 'overstock') {
              // اگر موجودی کمتر از maxQty شد، هشدار را resolve کن
              shouldResolve = currentStock <= maxQty
            } else if (alert.type === 'expiry') {
              const expiryDate = alert.expiryDate ? new Date(alert.expiryDate) : null
              if (expiryDate) {
                const daysToExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                // اگر تاریخ انقضا گذشته یا بیشتر از 30 روز مانده، هشدار را resolve کن
                shouldResolve = daysToExpiry > EXPIRY_WARNING_DAYS || expiryDate < today
              }
            }
            
            if (shouldResolve) {
              alertsToResolve.push(alert._id)
            }
          }
        }
      }
    }
    
    // اجرای به‌روزرسانی‌ها
    for (const update of alertsToUpdate) {
      await stockAlertsCollection.updateOne(
        { _id: update._id },
        update.update
      )
    }
    
    // ایجاد هشدارهای جدید
    if (alertsToCreate.length > 0) {
      await stockAlertsCollection.insertMany(alertsToCreate)
    }
    
    // بستن هشدارهای حل شده
    if (alertsToResolve.length > 0) {
      await stockAlertsCollection.updateMany(
        { _id: { $in: alertsToResolve } },
        {
          $set: {
            status: 'resolved',
            resolvedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'هشدارها با موفقیت به‌روزرسانی شدند',
      data: {
        created: alertsToCreate.length,
        updated: alertsToUpdate.length,
        resolved: alertsToResolve.length
      }
    })
  } catch (error) {
    console.error('Error calculating stock alerts:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در محاسبه هشدارها' },
      { status: 500 }
    )
  }
}

