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

// GET - گزارش هشدارها و اقدامات انجام‌شده
export async function GET(request: NextRequest) {
  try {
    const db = await connectToDatabase()
    const alertsCollection = db.collection('stock_alerts')
    const itemsCollection = db.collection('inventory_items')
    const balanceCollection = db.collection('inventory_balance')
    
    const { searchParams } = new URL(request.url)
    const warehouseName = searchParams.get('warehouseName')
    const category = searchParams.get('category')
    const alertType = searchParams.get('alertType') // LOW_STOCK, NEAR_REORDER, OVERSTOCK, EXPIRY_SOON, OUT_OF_STOCK
    const alertStatus = searchParams.get('alertStatus') // critical, needs_action, resolved
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const includeActions = searchParams.get('includeActions') === 'true'
    
    // ساخت فیلتر
    const filter: any = {}
    
    if (warehouseName && warehouseName !== 'all') {
      filter.warehouseName = warehouseName
    }
    
    if (alertType && alertType !== 'all') {
      filter.alertTypeCode = alertType
    }
    
    if (alertStatus && alertStatus !== 'all') {
      filter.alertStatus = alertStatus
    }
    
    if (dateFrom || dateTo) {
      filter.createdAt = {}
      if (dateFrom) {
        filter.createdAt.$gte = new Date(dateFrom).toISOString()
      }
      if (dateTo) {
        const endDate = new Date(dateTo)
        endDate.setHours(23, 59, 59, 999)
        filter.createdAt.$lte = endDate.toISOString()
      }
    }
    
    // دریافت هشدارها
    const alerts = await alertsCollection.find(filter).sort({ createdAt: -1 }).toArray()
    
    // دریافت اطلاعات آیتم‌ها
    const itemIds = [...new Set(alerts.map((a: any) => a.itemId?.toString()).filter(Boolean))]
    const items = await itemsCollection.find({
      _id: { $in: itemIds.map((id: string) => new ObjectId(id)) }
    }).toArray()
    
    // فیلتر دسته‌بندی
    let filteredItems = items
    if (category && category !== 'all') {
      filteredItems = items.filter((item: any) => item.category === category)
    }
    
    // ساخت گزارش
    const reportData = []
    
    for (const alert of alerts) {
      const item = items.find((i: any) => i._id.toString() === alert.itemId?.toString())
      
      if (!item) continue
      
      // اگر category فیلتر شده و آیتم در دسته نیست، رد کن
      if (category && category !== 'all' && item.category !== category) {
        continue
      }
      
      // دریافت موجودی فعلی
      const balance = await balanceCollection.findOne({
        itemId: alert.itemId,
        warehouseName: alert.warehouseName
      })
      
      const actions = includeActions ? (alert.actions || []) : []
      
      reportData.push({
        alertId: alert._id.toString(),
        itemId: item._id.toString(),
        itemName: item.name,
        itemCode: item.code || '',
        category: item.category || '',
        unit: item.unit || '',
        warehouseName: alert.warehouseName || '',
        alertType: alert.alertTypeCode || '',
        alertStatus: alert.alertStatus || 'critical',
        currentStock: balance?.quantity || 0,
        minStock: alert.minQty || item.minStock || 0,
        reorderPoint: alert.reorderPoint || 0,
        maxStock: alert.maxQty || item.maxStock || 0,
        severity: alert.severity || 'medium',
        createdAt: alert.createdAt,
        resolvedAt: alert.resolvedAt || null,
        actionsCount: actions.length,
        actions: includeActions ? actions : undefined
      })
    }
    
    // آمار
    const criticalCount = reportData.filter((a: any) => a.alertStatus === 'critical').length
    const needsActionCount = reportData.filter((a: any) => a.alertStatus === 'needs_action').length
    const resolvedCount = reportData.filter((a: any) => a.alertStatus === 'resolved').length
    const totalActions = reportData.reduce((sum: number, a: any) => sum + a.actionsCount, 0)
    
    return NextResponse.json({
      success: true,
      data: reportData,
      summary: {
        totalAlerts: reportData.length,
        criticalCount,
        needsActionCount,
        resolvedCount,
        totalActions,
        byType: {
          LOW_STOCK: reportData.filter((a: any) => a.alertType === 'LOW_STOCK').length,
          NEAR_REORDER: reportData.filter((a: any) => a.alertType === 'NEAR_REORDER').length,
          OVERSTOCK: reportData.filter((a: any) => a.alertType === 'OVERSTOCK').length,
          EXPIRY_SOON: reportData.filter((a: any) => a.alertType === 'EXPIRY_SOON').length,
          OUT_OF_STOCK: reportData.filter((a: any) => a.alertType === 'OUT_OF_STOCK').length
        }
      },
      filters: {
        warehouseName: warehouseName || 'all',
        category: category || 'all',
        alertType: alertType || 'all',
        alertStatus: alertStatus || 'all',
        dateFrom: dateFrom || null,
        dateTo: dateTo || null
      }
    })
  } catch (error) {
    console.error('Error generating alerts report:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در تولید گزارش هشدارها', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

