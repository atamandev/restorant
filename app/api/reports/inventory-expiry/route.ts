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

// GET - مواد اولیه تا چند روز دیگر تمام می‌شوند؟
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()
    
    const { searchParams } = new URL(request.url)
    const warehouse = searchParams.get('warehouse')
    const criticalOnly = searchParams.get('criticalOnly') === 'true' // فقط موارد بحرانی (3 روز یا کمتر)

    const inventoryCollection = db.collection('inventory_items')
    const itemLedgerCollection = db.collection('item_ledger')
    const stockAlertsCollection = db.collection('stock_alerts')

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // فیلتر انبار
    const inventoryFilter: any = {}
    if (warehouse && warehouse !== 'all') {
      inventoryFilter.warehouse = warehouse
    }

    const allInventoryItems = await inventoryCollection.find(inventoryFilter).toArray()
    const stockAlerts = await stockAlertsCollection.find({ status: 'active' }).toArray()

    // محاسبه زمان تمام شدن موجودی
    const itemsWithExpiry = []
    const thirtyDaysAgo = new Date(today)
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    for (const item of allInventoryItems) {
      const stock = item.currentStock || 0
      const minStock = item.minStock || 0
      const unit = item.unit || 'عدد'

      // محاسبه مصرف متوسط در 30 روز گذشته
      const consumptionEntries = await itemLedgerCollection
        .find({
          itemId: item._id.toString(),
          documentType: 'sale',
          date: { $gte: thirtyDaysAgo }
        })
        .toArray()

      const totalConsumption = consumptionEntries.reduce((sum: number, entry: any) => {
        return sum + (entry.quantityOut || 0)
      }, 0)

      const averageDailyConsumption = totalConsumption / 30

      let daysRemaining = 0
      let status: 'out' | 'critical' | 'warning' | 'normal' = 'normal'

      if (stock === 0) {
        daysRemaining = 0
        status = 'out'
      } else if (averageDailyConsumption > 0) {
        daysRemaining = Math.floor(stock / averageDailyConsumption)
        if (daysRemaining <= 3) {
          status = 'critical'
        } else if (daysRemaining <= 7) {
          status = 'warning'
        }
      } else if (stock > 0) {
        daysRemaining = 999 // اگر مصرف صفر است، هنوز موجودی دارد
        status = 'normal'
      }

      // فقط موارد کمبود موجودی یا بحرانی را نشان بده
      if (stock <= minStock || status === 'out' || status === 'critical' || status === 'warning') {
        if (criticalOnly && status !== 'out' && status !== 'critical') {
          continue
        }

        const alert = stockAlerts.find((alert: any) => alert.itemId === item._id.toString())

        itemsWithExpiry.push({
          itemId: item._id.toString(),
          name: item.name,
          code: item.code,
          category: item.category,
          warehouse: item.warehouse,
          currentStock: stock,
          minStock: minStock,
          maxStock: item.maxStock || 0,
          unit: unit,
          daysRemaining,
          averageDailyConsumption: averageDailyConsumption.toFixed(2),
          status,
          isOutOfStock: stock === 0,
          alert: alert ? {
            type: alert.type,
            severity: alert.severity,
            message: alert.message
          } : null
        })
      }
    }

    // مرتب‌سازی بر اساس daysRemaining
    itemsWithExpiry.sort((a, b) => {
      // اول موارد تمام شده، سپس بحرانی، سپس هشدار
      if (a.status === 'out') return -1
      if (b.status === 'out') return 1
      if (a.status === 'critical') return -1
      if (b.status === 'critical') return 1
      return a.daysRemaining - b.daysRemaining
    })

    // آمار
    const stats = {
      outOfStock: itemsWithExpiry.filter(item => item.status === 'out').length,
      critical: itemsWithExpiry.filter(item => item.status === 'critical').length,
      warning: itemsWithExpiry.filter(item => item.status === 'warning').length,
      total: itemsWithExpiry.length
    }

    return NextResponse.json({
      success: true,
      data: itemsWithExpiry,
      stats,
      message: 'مواد اولیه در حال اتمام با موفقیت دریافت شد'
    })
  } catch (error) {
    console.error('Error fetching inventory expiry:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در دریافت مواد اولیه در حال اتمام',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

