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

// GET - دریافت لیست کامل آیتم‌های موجودی برای گزارش
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()
    const inventoryCollection = db.collection('inventory_items')
    
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') || 'all'
    const status = searchParams.get('status') || 'all'
    const sortBy = searchParams.get('sortBy') || 'name'
    const search = searchParams.get('search') || ''

    // ساخت فیلتر
    const filter: any = {}
    
    if (category !== 'all') {
      filter.category = category
    }
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { supplier: { $regex: search, $options: 'i' } }
      ]
    }

    if (status !== 'all') {
      if (status === 'low-stock') {
        filter.$or = [
          { isLowStock: true },
          { $expr: { $lte: ['$currentStock', '$minStock'] } }
        ]
      } else if (status === 'expiring') {
        const now = new Date()
        const expiryThreshold = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
        filter.expiryDate = { $gte: now.toISOString(), $lte: expiryThreshold.toISOString() }
      } else if (status === 'normal') {
        filter.isLowStock = { $ne: true }
        const now = new Date()
        const expiryThreshold = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
        filter.$or = [
          { expiryDate: { $exists: false } },
          { expiryDate: null },
          { expiryDate: { $gt: expiryThreshold.toISOString() } }
        ]
      }
    }

    // دریافت آیتم‌ها
    let items = await inventoryCollection.find(filter).toArray()

    // محاسبه فیلدهای اضافی
    items = items.map((item: any) => {
      const stock = item.currentStock || 0
      const price = item.unitPrice || 0
      const min = item.minStock || 0
      const totalValue = stock * price
      
      // بررسی انقضا
      let isExpiring = false
      if (item.expiryDate) {
        const expiry = new Date(item.expiryDate)
        const now = new Date()
        const threshold = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
        isExpiring = expiry <= threshold && expiry >= now
      }

      return {
        id: item._id?.toString() || item.id,
        _id: item._id?.toString() || item.id,
        name: item.name || '',
        category: item.category || 'سایر',
        currentStock: stock,
        minStock: min,
        maxStock: item.maxStock || 0,
        unitPrice: price,
        totalValue,
        lastUpdated: item.lastUpdated || item.updatedAt || item.createdAt,
        supplier: item.supplier || '',
        expiryDate: item.expiryDate || null,
        isLowStock: stock <= min || item.isLowStock || false,
        isExpiring,
        monthlyUsage: item.monthlyUsage || 0,
        turnoverRate: item.turnoverRate || 0
      }
    })

    // مرتب‌سازی
    items.sort((a: any, b: any) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'stock':
          return a.currentStock - b.currentStock
        case 'value':
          return b.totalValue - a.totalValue
        case 'usage':
          return b.monthlyUsage - a.monthlyUsage
        case 'turnover':
          return b.turnoverRate - a.turnoverRate
        default:
          return 0
      }
    })

    return NextResponse.json({
      success: true,
      data: items
    })
  } catch (error) {
    console.error('Error fetching inventory items:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت آیتم‌های موجودی', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

