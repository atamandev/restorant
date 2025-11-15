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

// GET - گزارش خلاصه موجودی
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()
    const inventoryCollection = db.collection('inventory_items')
    const itemLedgerCollection = db.collection('item_ledger')
    
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') || 'all'
    const warehouse = searchParams.get('warehouse') || 'all'

    // ساخت فیلتر
    const filter: any = {}
    if (category !== 'all') {
      filter.category = category
    }
    if (warehouse !== 'all') {
      filter.warehouse = warehouse
    }

    // دریافت تمام آیتم‌های موجودی
    const items = await inventoryCollection.find(filter).toArray()

    // محاسبه آمار
    const totalItems = items.length
    const totalValue = items.reduce((sum: number, item: any) => {
      const stock = item.currentStock || 0
      const price = item.unitPrice || 0
      return sum + (stock * price)
    }, 0)
    
    const lowStockItems = items.filter((item: any) => {
      const stock = item.currentStock || 0
      const min = item.minStock || 0
      return stock <= min || item.isLowStock
    }).length

    // محاسبه آیتم‌های در حال انقضا (در 30 روز آینده)
    const now = new Date()
    const expiryThreshold = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    const expiringItems = items.filter((item: any) => {
      if (!item.expiryDate) return false
      const expiry = new Date(item.expiryDate)
      return expiry <= expiryThreshold && expiry >= now
    }).length

    // محاسبه نرخ گردش متوسط
    const itemsWithUsage = items.filter((item: any) => item.turnoverRate !== undefined && item.turnoverRate !== null)
    const averageTurnover = itemsWithUsage.length > 0
      ? itemsWithUsage.reduce((sum: number, item: any) => sum + (item.turnoverRate || 0), 0) / itemsWithUsage.length
      : 0

    // محاسبه توزیع بر اساس دسته‌بندی
    const categoryDistribution: any = {}
    items.forEach((item: any) => {
      const cat = item.category || 'سایر'
      if (!categoryDistribution[cat]) {
        categoryDistribution[cat] = {
          category: cat,
          count: 0,
          value: 0,
          sales: 0
        }
      }
      categoryDistribution[cat].count++
      const itemValue = (item.currentStock || 0) * (item.unitPrice || 0)
      categoryDistribution[cat].value += itemValue
      categoryDistribution[cat].sales += item.monthlyUsage || 0
    })

    const categoryData = Object.values(categoryDistribution).map((cat: any) => ({
      ...cat,
      percentage: totalValue > 0 ? Math.round((cat.value / totalValue) * 100) : 0
    }))

    // محاسبه آیتم‌های پرفروش (بر اساس monthlyUsage یا turnover)
    const topItems = items
      .map((item: any) => ({
        id: item._id?.toString() || item.id,
        name: item.name || '',
        category: item.category || '',
        monthlyUsage: item.monthlyUsage || 0,
        turnoverRate: item.turnoverRate || 0,
        currentStock: item.currentStock || 0
      }))
      .sort((a, b) => (b.monthlyUsage || b.turnoverRate) - (a.monthlyUsage || a.turnoverRate))
      .slice(0, 5)

    // آیتم‌های با گردش کند
    const slowMovingItems = items.filter((item: any) => {
      const turnover = item.turnoverRate || 0
      return turnover < 1.0 && turnover > 0
    }).length

    return NextResponse.json({
      success: true,
      data: {
        totalItems,
        totalValue,
        lowStockItems,
        expiringItems,
        averageTurnover,
        categoryData,
        topItems,
        slowMovingItems
      }
    })
  } catch (error) {
    console.error('Error generating inventory summary:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در تولید گزارش', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

