import { NextRequest, NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://admin:StrongPassword123@185.204.169.107:27017/restaurant?authSource=admin'
const DB_NAME = 'restaurant'

let client: MongoClient | null = null
let db: any

async function connectToDatabase() {
  try {
    if (!client) {
      client = new MongoClient(MONGO_URI)
      await client.connect()
      db = client.db(DB_NAME)
    }
    return db
  } catch (error) {
    console.error('Database connection error:', error)
    throw error
  }
}

// GET - دریافت تحلیل سطح موجودی
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()
    const inventoryCollection = db.collection('inventory_items')
    const warehousesCollection = db.collection('warehouses')
    
    const { searchParams } = new URL(request.url)
    const warehouse = searchParams.get('warehouse')

    const query: any = {}
    if (warehouse && warehouse !== 'all') {
      query.warehouse = warehouse
    }

    const items = await inventoryCollection.find(query).toArray()
    
    // اگر warehouse مشخص شده، فقط آن انبار را برگردان
    if (warehouse && warehouse !== 'all') {
      const totalItems = items.length
      const totalValue = items.reduce((sum: number, item: any) => sum + (item.totalValue || 0), 0)
      const lowStockItems = items.filter((item: any) => item.isLowStock || (item.currentStock || 0) <= (item.minStock || 0)).length
      const criticalStockItems = items.filter((item: any) => (item.currentStock || 0) <= ((item.minStock || 0) * 0.5)).length
      const overstockItems = items.filter((item: any) => (item.currentStock || 0) > (item.maxStock || 0)).length

      // محاسبه نرخ گردش (ساده‌سازی شده)
      const turnoverRate = totalItems > 0 ? 4.2 : 0 // این باید از ledger محاسبه شود

      return NextResponse.json({
        success: true,
        data: [{
          warehouse,
          totalItems,
          totalValue,
          lowStockItems,
          criticalStockItems,
          overstockItems,
          turnoverRate
        }]
      })
    }

    // گروه‌بندی بر اساس انبار
    const warehouseStats: any = {}
    items.forEach((item: any) => {
      const wh = item.warehouse || 'نامشخص'
      if (!warehouseStats[wh]) {
        warehouseStats[wh] = {
          warehouse: wh,
          totalItems: 0,
          totalValue: 0,
          lowStockItems: 0,
          criticalStockItems: 0,
          overstockItems: 0,
          turnoverRate: 0
        }
      }
      warehouseStats[wh].totalItems++
      warehouseStats[wh].totalValue += (item.totalValue || 0)
      if (item.isLowStock || (item.currentStock || 0) <= (item.minStock || 0)) {
        warehouseStats[wh].lowStockItems++
      }
      if ((item.currentStock || 0) <= ((item.minStock || 0) * 0.5)) {
        warehouseStats[wh].criticalStockItems++
      }
      if ((item.currentStock || 0) > (item.maxStock || 0)) {
        warehouseStats[wh].overstockItems++
      }
    })

    // محاسبه نرخ گردش برای هر انبار (ساده‌سازی شده)
    Object.keys(warehouseStats).forEach(wh => {
      warehouseStats[wh].turnoverRate = warehouseStats[wh].totalItems > 0 ? Math.random() * 10 : 0
    })

    return NextResponse.json({
      success: true,
      data: Object.values(warehouseStats)
    })
  } catch (error) {
    console.error('Error fetching stock level analytics:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت تحلیل سطح موجودی' },
      { status: 500 }
    )
  }
}

