import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://admin:StrongPassword123@185.204.169.107:27017/restaurant?authSource=admin'
const DB_NAME = 'restaurant'

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

// POST - ایجاد سفارش خرید فوری برای آیتم‌های کم‌موجود
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()
    const stockAlertsCollection = db.collection('stock_alerts')
    const purchaseOrdersCollection = db.collection('purchase_orders')
    
    const body = await request.json()
    const { alertIds, supplierId, supplierName, notes } = body

    // دریافت هشدارهای انتخاب شده
    let alerts = []
    const balanceCollection = db.collection('inventory_balance')
    const inventoryItemsCollection = db.collection('inventory_items')
    
    // دریافت تمام موجودی‌ها از Balance و inventory_items
    const balances = await balanceCollection.find({}).toArray()
    const items = await inventoryItemsCollection.find({}).limit(10000).toArray()
    
    // ساخت map برای بررسی سریع موجودی
    const balanceMap = new Map()
    balances.forEach(balance => {
      const key = `${balance.itemId?.toString() || balance.itemId}-${balance.warehouseName || ''}`
      balanceMap.set(key, balance.quantity || 0)
    })
    
    const itemsMap = new Map()
    items.forEach(item => {
      const key = `${item._id?.toString() || item.id}-${item.warehouse || ''}`
      itemsMap.set(key, item.currentStock || 0)
    })
    
    if (alertIds && alertIds.length > 0) {
      const alertObjectIds = alertIds.map((id: string) => {
        try {
          return { _id: new ObjectId(id) }
        } catch {
          return { _id: id }
        }
      })
      const allAlerts = await stockAlertsCollection.find({
        $or: alertObjectIds,
        status: 'active'
      }).toArray()
      
      // فیلتر کردن هشدارها: فقط هشدارهایی که کالا در انبار موجود است
      alerts = allAlerts.filter((alert: any) => {
        const itemId = alert.itemId?.toString() || alert.itemId
        const warehouse = alert.warehouse || ''
        
        if (!itemId || !warehouse) return false
        
        // بررسی در balance
        const balanceKey = `${itemId}-${warehouse}`
        const balanceQty = balanceMap.get(balanceKey)
        
        if (balanceQty !== undefined && balanceQty > 0) {
          return true
        }
        
        // بررسی در inventory_items
        const itemKey = `${itemId}-${warehouse}`
        const itemStock = itemsMap.get(itemKey)
        
        if (itemStock !== undefined && itemStock > 0) {
          return true
        }
        
        // برای out_of_stock: اگر کالا در این انبار موجودی ندارد، هشدار را نمایش بده
        if (alert.type === 'out_of_stock') {
          return true
        }
        
        return false
      })
    } else {
      // اگر هیچ هشدار انتخاب نشده، همه هشدارهای فعال کم‌موجود را بگیر
      const allAlerts = await stockAlertsCollection.find({
        status: 'active',
        type: { $in: ['low_stock', 'out_of_stock'] }
      }).toArray()
      
      // فیلتر کردن هشدارها: فقط هشدارهایی که کالا در انبار موجود است
      alerts = allAlerts.filter((alert: any) => {
        const itemId = alert.itemId?.toString() || alert.itemId
        const warehouse = alert.warehouse || ''
        
        if (!itemId || !warehouse) return false
        
        // بررسی در balance
        const balanceKey = `${itemId}-${warehouse}`
        const balanceQty = balanceMap.get(balanceKey)
        
        if (balanceQty !== undefined && balanceQty > 0) {
          return true
        }
        
        // بررسی در inventory_items
        const itemKey = `${itemId}-${warehouse}`
        const itemStock = itemsMap.get(itemKey)
        
        if (itemStock !== undefined && itemStock > 0) {
          return true
        }
        
        // برای out_of_stock: اگر کالا در این انبار موجودی ندارد، هشدار را نمایش بده
        if (alert.type === 'out_of_stock') {
          return true
        }
        
        return false
      })
    }

    // اگر هیچ هشدار فعالی وجود ندارد، از آیتم‌های موجودی استفاده کن
    if (alerts.length === 0) {
      const inventoryCollection = db.collection('inventory_items')
      const balanceCollection = db.collection('inventory_balance')
      
      // دریافت تمام موجودی‌ها از Balance
      const balances = await balanceCollection.find({}).toArray()
      
      // ساخت map برای بررسی سریع موجودی
      const balanceMap = new Map()
      balances.forEach(balance => {
        const key = `${balance.itemId?.toString() || balance.itemId}-${balance.warehouseName || ''}`
        balanceMap.set(key, balance.quantity || 0)
      })
      
      // دریافت آیتم‌های کم‌موجود از موجودی (بر اساس داده‌های واقعی)
      const lowStockItems = await inventoryCollection.find({
        $or: [
          { $expr: { $lte: ['$currentStock', '$minStock'] } },
          { currentStock: 0 }
        ]
      }).limit(1000).toArray()
      
      // فیلتر کردن آیتم‌هایی که:
      // 1. موجودی آنها کمتر یا مساوی حداقل است
      // 2. در انبارها موجودی دارند (از balance یا inventory_items)
      const filteredItems = lowStockItems.filter((item: any) => {
        const currentStock = item.currentStock || 0
        const minStock = item.minStock || 0
        
        // بررسی اینکه آیا کالا در انبار موجودی دارد
        const itemId = item._id?.toString() || item.id
        const warehouse = item.warehouse || ''
        const balanceKey = `${itemId}-${warehouse}`
        const balanceQty = balanceMap.get(balanceKey)
        
        // اگر در balance موجودی دارد یا در inventory_items موجودی دارد
        const hasStock = (balanceQty !== undefined && balanceQty > 0) || currentStock > 0
        
        // فقط کالاهایی که در انبار موجودی دارند و کم‌موجود هستند
        return hasStock && (currentStock === 0 || currentStock <= minStock)
      })

      if (filteredItems.length === 0) {
        return NextResponse.json(
          { success: false, message: 'هیچ آیتم کم‌موجودی برای ایجاد سفارش یافت نشد' },
          { status: 400 }
        )
      }

      // تبدیل آیتم‌های موجودی به فرمت هشدار (بر اساس داده‌های واقعی)
      alerts = filteredItems.map((item: any) => {
        const currentStock = item.currentStock || 0
        const minStock = item.minStock || 0
        const isOutOfStock = currentStock === 0
        const isLowStock = currentStock > 0 && currentStock <= minStock
        
        return {
          _id: item._id,
          itemId: item._id?.toString() || item.id,
          itemName: item.name || 'نامشخص',
          itemCode: item.code || item.itemCode || `ITEM-${(item._id?.toString() || item.id || '').substring(0, 8)}`,
          category: item.category || 'عمومی',
          warehouse: item.warehouse || 'انبار اصلی',
          type: isOutOfStock ? 'out_of_stock' : 'low_stock',
          severity: isOutOfStock ? 'critical' : (currentStock <= minStock * 0.5 ? 'high' : 'medium'),
          currentStock: currentStock,
          minStock: minStock,
          maxStock: item.maxStock || 0,
          unit: item.unit || 'عدد',
          message: isOutOfStock 
            ? `${item.name || 'کالا'} تمام شده است`
            : `موجودی ${item.name || 'کالا'} کم است (${currentStock} از ${minStock})`
        }
      })
    }

    // ساخت آیتم‌های سفارش خرید
    const orderItems = alerts.map((alert: any) => {
      const suggestedQuantity = Math.max(
        alert.minStock * 2 - alert.currentStock,
        alert.minStock - alert.currentStock + 10
      )
      
      return {
        itemId: alert.itemId,
        itemName: alert.itemName,
        itemCode: alert.itemCode,
        category: alert.category,
        quantity: suggestedQuantity,
        unit: alert.unit || 'عدد',
        unitPrice: 0, // باید از تامین‌کننده دریافت شود
        totalPrice: 0,
        alertId: alert._id.toString()
      }
    })

    // محاسبه ارزش کل
    const totalValue = orderItems.reduce((sum: number, item: any) => sum + item.totalPrice, 0)

    // تولید شماره سفارش
    const orderCount = await purchaseOrdersCollection.countDocuments()
    const orderNumber = `PO-${String(orderCount + 1).padStart(6, '0')}`

    // ایجاد سفارش خرید
    const purchaseOrder = {
      orderNumber,
      supplierId: supplierId || null,
      supplierName: supplierName || 'تامین‌کننده عمومی',
      items: orderItems,
      totalItems: orderItems.length,
      totalValue,
      status: 'pending',
      priority: 'urgent',
      type: 'quick_order',
      notes: notes || `سفارش فوری برای ${orderItems.length} آیتم کم‌موجود`,
      requestedBy: 'سیستم',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const result = await purchaseOrdersCollection.insertOne(purchaseOrder)

    // به‌روزرسانی وضعیت هشدارها (فقط هشدارهای واقعی که در دیتابیس وجود دارند)
    const realAlertIds = alerts
      .filter((alert: any) => alert._id && typeof alert._id === 'object') // فقط ObjectId ها
      .map((alert: any) => alert._id)
    
    if (realAlertIds.length > 0) {
      await stockAlertsCollection.updateMany(
        { _id: { $in: realAlertIds } },
        { 
          $set: { 
            status: 'resolved',
            resolution: `سفارش خرید ${orderNumber} ایجاد شد`,
            resolvedBy: 'سیستم',
            resolvedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        ...purchaseOrder,
        _id: result.insertedId
      },
      message: `سفارش خرید ${orderNumber} برای ${orderItems.length} آیتم با موفقیت ایجاد شد`
    })
  } catch (error) {
    console.error('Error creating quick purchase order:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در ایجاد سفارش خرید فوری' },
      { status: 500 }
    )
  }
}
