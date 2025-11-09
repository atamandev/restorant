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

// GET - کاردکس (ledger) یک کالا در یک انبار
export async function GET(request: NextRequest) {
  try {
    const db = await connectToDatabase()
    const movementCollection = db.collection('stock_movements')
    const balanceCollection = db.collection('inventory_balance')
    
    const { searchParams } = new URL(request.url)
    const itemId = searchParams.get('itemId')
    const warehouseName = searchParams.get('warehouseName')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const limit = parseInt(searchParams.get('limit') || '1000')
    const skip = parseInt(searchParams.get('skip') || '0')
    
    if (!itemId) {
      return NextResponse.json(
        { success: false, message: 'itemId اجباری است' },
        { status: 400 }
      )
    }
    
    // تبدیل itemId به ObjectId برای فیلتر
    const itemIdObj = new ObjectId(itemId)
    
    const filter: any = {
      itemId: itemIdObj // itemId در stock_movements به صورت ObjectId ذخیره می‌شود
    }
    
    if (warehouseName && warehouseName !== 'all') {
      filter.warehouseName = warehouseName
    }
    
    // فیلتر بازه زمانی
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
    
    // دریافت موجودی فعلی از Balance
    const balanceFilter: any = {
      itemId: itemIdObj
    }
    if (warehouseName && warehouseName !== 'all') {
      balanceFilter.warehouseName = warehouseName
    }
    const balance = await balanceCollection.findOne(balanceFilter)
    
    // دریافت تمام حرکات برای محاسبه موجودی ابتدا
    const allMovements = await movementCollection
      .find({
        itemId: itemIdObj,
        ...(warehouseName && warehouseName !== 'all' ? { warehouseName } : {})
      })
      .sort({ createdAt: 1 })
      .toArray()
    
    // محاسبه موجودی ابتدا (قبل از بازه زمانی)
    let initialBalance = 0
    let initialValue = 0
    if (dateFrom) {
      const startDate = new Date(dateFrom)
      for (const movement of allMovements) {
        const movementDate = new Date(movement.createdAt)
        if (movementDate < startDate) {
          initialBalance += movement.quantity || 0
          initialValue += movement.totalValue || 0
        } else {
          break
        }
      }
    }
    
    // دریافت حرکات در بازه زمانی
    const movements = await movementCollection
      .find(filter)
      .sort({ createdAt: 1 }) // از قدیمی به جدید
      .skip(skip)
      .limit(limit)
      .toArray()
    
    // محاسبه موجودی متحرک (running balance) از ابتدا
    let runningBalance = initialBalance
    let runningValue = initialValue
    
    // محاسبه جمع‌بندی
    let totalIn = 0
    let totalOut = 0
    let totalInValue = 0
    let totalOutValue = 0
    
    const ledgerEntries = movements.map((movement: any) => {
      const quantity = movement.quantity || 0
      const totalValue = movement.totalValue || 0
      
      runningBalance += quantity
      runningValue += totalValue
      
      // محاسبه ورودی/خروجی
      if (quantity > 0) {
        totalIn += quantity
        totalInValue += totalValue
      } else {
        totalOut += Math.abs(quantity)
        totalOutValue += Math.abs(totalValue)
      }
      
      return {
        ...movement,
        runningBalance,
        runningValue,
        averagePrice: runningBalance > 0 ? runningValue / runningBalance : 0,
        quantityIn: quantity > 0 ? quantity : 0,
        quantityOut: quantity < 0 ? Math.abs(quantity) : 0,
        valueIn: totalValue > 0 ? totalValue : 0,
        valueOut: totalValue < 0 ? Math.abs(totalValue) : 0
      }
    })
    
    const total = await movementCollection.countDocuments(filter)
    
    // محاسبه موجودی واقعی از Balance
    const actualBalance = balance?.quantity || 0
    const actualValue = balance?.totalValue || 0
    
    // محاسبه موجودی پایان
    const endingBalance = runningBalance
    const endingValue = runningValue
    
    // بهای مصرف دوره (خروجی‌های منفی)
    const costOfGoodsSold = totalOutValue
    
    return NextResponse.json({
      success: true,
      data: {
        itemId,
        warehouseName: warehouseName || 'همه انبارها',
        dateFrom: dateFrom || null,
        dateTo: dateTo || null,
        summary: {
          initialBalance,
          initialValue,
          totalIn,
          totalInValue,
          totalOut,
          totalOutValue,
          endingBalance,
          endingValue,
          costOfGoodsSold,
          averagePrice: endingBalance > 0 ? endingValue / endingBalance : 0
        },
        actualBalance, // موجودی واقعی از Balance
        actualValue,
        entries: ledgerEntries,
        total,
        limit,
        skip
      }
    })
  } catch (error) {
    console.error('Error fetching ledger:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت کاردکس' },
      { status: 500 }
    )
  }
}

