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
    if (alertIds && alertIds.length > 0) {
      const alertObjectIds = alertIds.map((id: string) => {
        try {
          return { _id: new ObjectId(id) }
        } catch {
          return { _id: id }
        }
      })
      alerts = await stockAlertsCollection.find({
        $or: alertObjectIds,
        status: 'active'
      }).toArray()
    } else {
      // اگر هیچ هشدار انتخاب نشده، همه هشدارهای فعال کم‌موجود را بگیر
      alerts = await stockAlertsCollection.find({
        status: 'active',
        type: { $in: ['low_stock', 'out_of_stock'] }
      }).toArray()
    }

    // اگر هیچ هشدار فعالی وجود ندارد، از آیتم‌های موجودی استفاده کن
    if (alerts.length === 0) {
      const inventoryCollection = db.collection('inventory_items')
      
      // دریافت آیتم‌های کم‌موجود از موجودی
      const lowStockItems = await inventoryCollection.find({
        $expr: {
          $lte: ['$currentStock', '$minStock']
        }
      }).toArray()

      if (lowStockItems.length === 0) {
        return NextResponse.json(
          { success: false, message: 'هیچ آیتم کم‌موجودی برای ایجاد سفارش یافت نشد' },
          { status: 400 }
        )
      }

      // تبدیل آیتم‌های موجودی به فرمت هشدار
      alerts = lowStockItems.map((item: any) => ({
        _id: item._id,
        itemId: item._id.toString(),
        itemName: item.name,
        itemCode: item.code || `ITEM-${item._id.toString().substring(0, 8)}`,
        category: item.category,
        warehouse: item.warehouse || 'انبار اصلی',
        type: item.currentStock === 0 ? 'out_of_stock' : 'low_stock',
        severity: item.currentStock === 0 ? 'critical' : 'medium',
        currentStock: item.currentStock || 0,
        minStock: item.minStock || 0,
        maxStock: item.maxStock || 0,
        unit: item.unit || 'عدد',
        message: item.currentStock === 0 
          ? `${item.name} تمام شده است`
          : `موجودی ${item.name} کم است`
      }))
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
