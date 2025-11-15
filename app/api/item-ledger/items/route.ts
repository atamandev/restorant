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

// GET - دریافت لیست آیتم‌ها با اطلاعات کاردکس
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()
    const inventoryCollection = db.collection('inventory_items')
    const ledgerCollection = db.collection('item_ledger')
    
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category')
    const limit = parseInt(searchParams.get('limit') || '100')
    const skip = parseInt(searchParams.get('skip') || '0')

    // ساخت فیلتر
    const filter: any = {}
    if (search && search.trim() !== '') {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ]
    }
    if (category && category !== 'all' && category.trim() !== '') {
      filter.category = category
    }

    const items = await inventoryCollection
      .find(filter)
      .skip(skip)
      .limit(limit)
      .toArray()

    // برای هر آیتم، آخرین ورودی دفتر کل را پیدا کن
    const itemsWithLedger = []
    
    for (const item of items) {
      try {
        const itemIdStr = item._id?.toString() || String(item._id)
        
        let lastEntry = null
        let transactionCount = 0
        
        try {
          lastEntry = await ledgerCollection.findOne(
            { itemId: itemIdStr },
            { sort: { date: -1, createdAt: -1 } }
          )
          transactionCount = await ledgerCollection.countDocuments({ itemId: itemIdStr })
        } catch (err) {
          console.error('Error fetching ledger for item:', itemIdStr, err)
        }

        // تعیین روش ارزش‌گذاری (اگر وجود ندارد، default را تنظیم کن)
        const valuationMethod = item.valuationMethod || 'weighted_average'

        itemsWithLedger.push({
          _id: itemIdStr,
          id: itemIdStr,
          name: item.name || '',
          code: item.code || `ITEM-${itemIdStr.substring(0, 8)}`,
          category: item.category || '',
          unit: item.unit || 'عدد',
          currentStock: item.currentStock || 0,
          currentValue: item.totalValue || 0,
          averagePrice: item.unitPrice || 0,
          valuationMethod,
          lastTransactionDate: lastEntry?.date || null,
          transactionCount
        })
      } catch (error) {
        console.error('Error processing item:', error, item)
      }
    }

    // آمار کلی
    const totalItems = itemsWithLedger.length
    const totalValue = itemsWithLedger.reduce((sum, item) => sum + (item.currentValue || 0), 0)
    const outOfStockItems = itemsWithLedger.filter(item => (item.currentStock || 0) === 0).length
    
    // برای محاسبه lowStockItems، باید minStock را از inventory_items بگیریم
    let lowStockItems = 0
    try {
      const allItems = await inventoryCollection.find({}).toArray()
      lowStockItems = allItems.filter((item: any) => {
        const stock = item.currentStock || 0
        const minStock = item.minStock || 0
        return stock > 0 && stock <= minStock
      }).length
    } catch (err) {
      console.error('Error calculating lowStockItems:', err)
    }

    const stats = {
      totalItems,
      totalValue,
      lowStockItems,
      outOfStockItems
    }

    return NextResponse.json({
      success: true,
      data: itemsWithLedger,
      stats,
      pagination: {
        limit,
        skip,
        total: itemsWithLedger.length
      }
    })
  } catch (error) {
    console.error('Error fetching items with ledger info:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در دریافت لیست آیتم‌ها',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

