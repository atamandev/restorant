import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://admin:StrongPassword123@185.204.169.107:27017/restaurant?authSource=admin'
const DB_NAME = 'restaurant'

let client: MongoClient | null = null
let db: any = null

async function connectToDatabase() {
  try {
    // اگر client وجود دارد اما اتصال قطع شده، دوباره اتصال برقرار کن
    if (client) {
      try {
        await client.db(DB_NAME).admin().ping()
        if (!db) {
          db = client.db(DB_NAME)
        }
        return db
      } catch (error) {
        // اتصال قطع شده، دوباره اتصال برقرار کن
        console.log('Connection lost, reconnecting...')
        client = null
        db = null
      }
    }
    
    // ایجاد اتصال جدید
    if (!client) {
      client = new MongoClient(MONGO_URI)
      await client.connect()
      db = client.db(DB_NAME)
    }
    
    return db
  } catch (error) {
    console.error('Database connection error:', error)
    // Reset connection on error
    if (client) {
      try {
        await client.close()
      } catch (e) {
        // Ignore close errors
      }
      client = null
    }
    db = null
    throw error
  }
}

// POST - به‌روزرسانی انبار همه آیتم‌ها به یک انبار مشخص
export async function POST(request: NextRequest) {
  try {
    const db = await connectToDatabase()
    if (!db) {
      throw new Error('Database connection failed')
    }
    const inventoryCollection = db.collection('inventory_items')
    
    const body = await request.json()
    const { warehouseName } = body
    
    if (!warehouseName) {
      return NextResponse.json(
        { success: false, message: 'نام انبار اجباری است' },
        { status: 400 }
      )
    }
    
    // به‌روزرسانی همه آیتم‌ها (حتی آنهایی که warehouse دارند)
    const result = await inventoryCollection.updateMany(
      {}, // همه آیتم‌ها
      { 
        $set: { 
          warehouse: warehouseName,
          updatedAt: new Date()
        } 
      }
    )
    
    console.log(`Updated ${result.modifiedCount} items to warehouse: ${warehouseName}`)
    
    return NextResponse.json({
      success: true,
      message: `انبار ${warehouseName} برای ${result.modifiedCount} آیتم به‌روزرسانی شد`,
      data: {
        modifiedCount: result.modifiedCount,
        matchedCount: result.matchedCount
      }
    })
  } catch (error) {
    console.error('Error updating warehouse for items:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'خطا در به‌روزرسانی انبار آیتم‌ها',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

