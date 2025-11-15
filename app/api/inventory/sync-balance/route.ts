import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://admin:StrongPassword123@185.204.169.107:27017/restaurant?authSource=admin'
const DB_NAME = 'restaurant'

let client: MongoClient
let db: any

async function connectToDatabase() {
  try {
    if (!client) {
      client = new MongoClient(MONGO_URI)
      await client.connect()
      db = client.db(DB_NAME)
    } else if (!db) {
      db = client.db(DB_NAME)
    }
    
    if (db) {
      try {
        await db.admin().ping()
      } catch (pingError) {
        console.warn('MongoDB ping failed, but continuing:', pingError)
      }
    }
    
    if (!db) {
      throw new Error('Database connection failed: db is null')
    }
    
    return db
  } catch (error) {
    console.error('Database connection error:', error)
    if (client) {
      try {
        await client.close()
      } catch (e) {}
      client = null as any
    }
    db = null
    throw error
  }
}

// POST - همگام‌سازی موجودی inventory_items از Balance
export async function POST(request: NextRequest) {
  try {
    const db = await connectToDatabase()
    const balanceCollection = db.collection('inventory_balance')
    const inventoryCollection = db.collection('inventory_items')
    
    const body = await request.json()
    const { itemId, warehouseName } = body
    
    const filter: any = {}
    if (itemId) {
      try {
        filter.itemId = new ObjectId(itemId)
      } catch {
        filter.itemId = itemId
      }
    }
    if (warehouseName) {
      filter.warehouseName = warehouseName
    }
    
    // دریافت همه Balance ها
    const balances = await balanceCollection.find(filter).toArray()
    
    // گروه‌بندی بر اساس itemId و محاسبه مجموع
    const itemBalances: { [key: string]: { quantity: number; totalValue: number } } = {}
    
    for (const balance of balances) {
      const itemIdStr = balance.itemId?.toString() || balance.itemId
      if (!itemBalances[itemIdStr]) {
        itemBalances[itemIdStr] = { quantity: 0, totalValue: 0 }
      }
      itemBalances[itemIdStr].quantity += balance.quantity || 0
      itemBalances[itemIdStr].totalValue += balance.totalValue || 0
    }
    
    // به‌روزرسانی inventory_items
    const updates: any[] = []
    
    for (const [itemIdStr, totals] of Object.entries(itemBalances)) {
      try {
        const itemObjectId = new ObjectId(itemIdStr)
        const avgPrice = totals.totalValue > 0 && totals.quantity > 0 
          ? totals.totalValue / totals.quantity 
          : 0
        
        await inventoryCollection.updateOne(
          { _id: itemObjectId },
          {
            $set: {
              currentStock: totals.quantity,
              totalValue: totals.totalValue,
              unitPrice: avgPrice,
              lastUpdated: new Date().toISOString(),
              updatedAt: new Date()
            }
          }
        )
        
        updates.push({
          itemId: itemIdStr,
          quantity: totals.quantity,
          totalValue: totals.totalValue
        })
      } catch (error) {
        console.error(`Error updating item ${itemIdStr}:`, error)
      }
    }
    
    return NextResponse.json({
      success: true,
      data: {
        updatedCount: updates.length,
        updates
      },
      message: `${updates.length} آیتم به‌روزرسانی شد`
    })
  } catch (error) {
    console.error('Error syncing balance:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در همگام‌سازی موجودی' },
      { status: 500 }
    )
  }
}

// GET - محاسبه موجودی کل یک کالا از همه انبارها
export async function GET(request: NextRequest) {
  try {
    const db = await connectToDatabase()
    const balanceCollection = db.collection('inventory_balance')
    
    const { searchParams } = new URL(request.url)
    const itemId = searchParams.get('itemId')
    
    if (!itemId) {
      return NextResponse.json(
        { success: false, message: 'itemId اجباری است' },
        { status: 400 }
      )
    }
    
    const balances = await balanceCollection.find({
      itemId: new ObjectId(itemId)
    }).toArray()
    
    const totalQuantity = balances.reduce((sum, b) => sum + (b.quantity || 0), 0)
    const totalValue = balances.reduce((sum, b) => sum + (b.totalValue || 0), 0)
    
    return NextResponse.json({
      success: true,
      data: {
        itemId,
        totalQuantity,
        totalValue,
        averagePrice: totalQuantity > 0 ? totalValue / totalQuantity : 0,
        warehouses: balances.map(b => ({
          warehouseName: b.warehouseName,
          quantity: b.quantity || 0,
          value: b.totalValue || 0
        }))
      }
    })
  } catch (error) {
    console.error('Error calculating total balance:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در محاسبه موجودی کل' },
      { status: 500 }
    )
  }
}

