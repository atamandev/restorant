import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://restorenUser:1234@localhost:27017/restoren'
const DB_NAME = 'restoren'

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

// GET - دریافت موجودی (Balance) برای یک کالا در یک انبار
export async function GET(request: NextRequest) {
  try {
    const db = await connectToDatabase()
    const balanceCollection = db.collection('inventory_balance')
    
    const { searchParams } = new URL(request.url)
    const itemId = searchParams.get('itemId')
    const warehouseId = searchParams.get('warehouseId')
    const warehouseName = searchParams.get('warehouseName')
    
    const filter: any = {}
    if (itemId) {
      try {
        filter.itemId = new ObjectId(itemId)
      } catch {
        filter.itemId = itemId
      }
    }
    if (warehouseId) {
      filter.warehouseId = warehouseId
    }
    if (warehouseName) {
      filter.warehouseName = warehouseName
    }
    
    const balances = await balanceCollection.find(filter).toArray()
    
    return NextResponse.json({
      success: true,
      data: balances
    })
  } catch (error) {
    console.error('Error fetching balance:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت موجودی' },
      { status: 500 }
    )
  }
}

// POST - ایجاد یا به‌روزرسانی موجودی (فقط برای INITIAL)
export async function POST(request: NextRequest) {
  try {
    const db = await connectToDatabase()
    const balanceCollection = db.collection('inventory_balance')
    const movementCollection = db.collection('stock_movements')
    
    const body = await request.json()
    const { itemId, warehouseId, warehouseName, quantity, unitPrice, lotNumber, expirationDate } = body
    
    if (!itemId || !warehouseName || quantity === undefined) {
      return NextResponse.json(
        { success: false, message: 'itemId، warehouseName و quantity اجباری است' },
        { status: 400 }
      )
    }
    
    // بررسی موجودی فعلی
    const existingBalance = await balanceCollection.findOne({
      itemId: new ObjectId(itemId),
      warehouseName: warehouseName
    })
    
    const session = client.startSession()
    
    try {
      await session.withTransaction(async () => {
        // ایجاد یا به‌روزرسانی Balance
        const balanceUpdate = {
          itemId: new ObjectId(itemId),
          warehouseId: warehouseId || null,
          warehouseName: warehouseName,
          quantity: (existingBalance?.quantity || 0) + quantity,
          totalValue: (existingBalance?.totalValue || 0) + (quantity * (unitPrice || 0)),
          lastUpdated: new Date().toISOString(),
          updatedAt: new Date()
        }
        
        if (existingBalance) {
          await balanceCollection.updateOne(
            { _id: existingBalance._id },
            { $set: balanceUpdate },
            { session }
          )
        } else {
          balanceUpdate['createdAt'] = new Date()
          await balanceCollection.insertOne(balanceUpdate, { session })
        }
        
        // ایجاد Stock Movement برای INITIAL
        const movement = {
          itemId: new ObjectId(itemId),
          warehouseId: warehouseId || null,
          warehouseName: warehouseName,
          movementType: 'INITIAL',
          quantity: quantity,
          unitPrice: unitPrice || 0,
          totalValue: quantity * (unitPrice || 0),
          lotNumber: lotNumber || null,
          expirationDate: expirationDate || null,
          documentNumber: `INIT-${Date.now()}`,
          documentType: 'INITIAL',
          description: 'موجودی اولیه',
          createdBy: 'سیستم',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        
        await movementCollection.insertOne(movement, { session })
      })
      
      return NextResponse.json({
        success: true,
        message: 'موجودی با موفقیت ثبت شد'
      })
    } finally {
      await session.endSession()
    }
  } catch (error) {
    console.error('Error creating balance:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در ثبت موجودی' },
      { status: 500 }
    )
  }
}

