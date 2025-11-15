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

// GET - گزارش اقلام کم‌گردش/راکد (turnover پایین)
export async function GET(request: NextRequest) {
  try {
    const db = await connectToDatabase()
    const movementCollection = db.collection('stock_movements')
    const balanceCollection = db.collection('inventory_balance')
    const itemsCollection = db.collection('inventory_items')
    
    const { searchParams } = new URL(request.url)
    const warehouseName = searchParams.get('warehouseName')
    const category = searchParams.get('category')
    const dateFrom = searchParams.get('dateFrom') || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString() // پیش‌فرض 90 روز
    const dateTo = searchParams.get('dateTo') || new Date().toISOString()
    const minTurnover = parseFloat(searchParams.get('minTurnover') || '0.1') // حداقل نرخ گردش
    const maxTurnover = parseFloat(searchParams.get('maxTurnover') || '1') // حداکثر نرخ گردش برای "کم‌گردش"
    
    // ساخت فیلتر
    const movementFilter: any = {
      createdAt: {
        $gte: new Date(dateFrom).toISOString(),
        $lte: new Date(dateTo).toISOString()
      }
    }
    
    if (warehouseName && warehouseName !== 'all') {
      movementFilter.warehouseName = warehouseName
    }
    
    // دریافت حرکات در بازه زمانی
    const movements = await movementCollection.find(movementFilter).toArray()
    
    // دریافت موجودی‌های فعلی
    const balanceFilter: any = {}
    if (warehouseName && warehouseName !== 'all') {
      balanceFilter.warehouseName = warehouseName
    }
    const balances = await balanceCollection.find(balanceFilter).toArray()
    
    // دریافت اطلاعات آیتم‌ها
    const itemIds = [...new Set([
      ...movements.map((m: any) => m.itemId?.toString()),
      ...balances.map((b: any) => b.itemId?.toString())
    ].filter(Boolean))]
    
    const items = await itemsCollection.find({
      _id: { $in: itemIds.map((id: string) => new ObjectId(id)) }
    }).toArray()
    
    // فیلتر دسته‌بندی
    let filteredItems = items
    if (category && category !== 'all') {
      filteredItems = items.filter((item: any) => item.category === category)
    }
    
    // محاسبه نرخ گردش برای هر آیتم
    const reportData = []
    const days = Math.ceil((new Date(dateTo).getTime() - new Date(dateFrom).getTime()) / (1000 * 60 * 60 * 24))
    
    for (const item of filteredItems) {
      const itemMovements = movements.filter((m: any) => 
        m.itemId?.toString() === item._id.toString()
      )
      
      const itemBalances = balances.filter((b: any) => 
        b.itemId?.toString() === item._id.toString()
      )
      
      // محاسبه خروجی (مصرف/فروش)
      const totalOut = itemMovements
        .filter((m: any) => (m.quantity || 0) < 0)
        .reduce((sum: number, m: any) => sum + Math.abs(m.quantity || 0), 0)
      
      // موجودی متوسط (میانگین موجودی در بازه زمانی)
      const currentBalance = itemBalances.reduce((sum: number, b: any) => sum + (b.quantity || 0), 0)
      
      // محاسبه موجودی متوسط (ساده: موجودی فعلی)
      const averageStock = currentBalance
      
      // نرخ گردش = خروجی / موجودی متوسط
      const turnoverRate = averageStock > 0 ? totalOut / averageStock : 0
      
      // تعداد روزهای راکد (روزهایی که هیچ حرکتی نداشته)
      const movementDates = itemMovements.map((m: any) => new Date(m.createdAt).toISOString().split('T')[0])
      const uniqueDates = new Set(movementDates)
      const idleDays = days - uniqueDates.size
      
      // آخرین حرکت
      const lastMovement = itemMovements.length > 0 
        ? itemMovements.sort((a: any, b: any) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )[0]
        : null
      
      const lastMovementDate = lastMovement ? new Date(lastMovement.createdAt) : null
      const daysSinceLastMovement = lastMovementDate 
        ? Math.ceil((new Date().getTime() - lastMovementDate.getTime()) / (1000 * 60 * 60 * 24))
        : days
      
      // طبقه‌بندی: راكد، کم‌گردش، عادی
      let status = 'normal'
      if (turnoverRate < minTurnover || daysSinceLastMovement > 90) {
        status = 'idle' // راكد
      } else if (turnoverRate < maxTurnover) {
        status = 'low_turnover' // کم‌گردش
      }
      
      reportData.push({
        itemId: item._id.toString(),
        itemName: item.name,
        itemCode: item.code || '',
        category: item.category || '',
        unit: item.unit || '',
        currentBalance,
        averageStock,
        totalOut,
        turnoverRate: turnoverRate.toFixed(4),
        daysSinceLastMovement,
        idleDays,
        lastMovementDate: lastMovementDate ? lastMovementDate.toISOString() : null,
        movementsCount: itemMovements.length,
        status,
        warehouses: itemBalances.map((b: any) => ({
          warehouseName: b.warehouseName,
          quantity: b.quantity || 0
        }))
      })
    }
    
    // فیلتر بر اساس نرخ گردش
    const filteredData = reportData.filter((item: any) => {
      const turnover = parseFloat(item.turnoverRate)
      return turnover < maxTurnover || item.status === 'idle'
    })
    
    // مرتب‌سازی بر اساس نرخ گردش (کمترین اول)
    filteredData.sort((a: any, b: any) => 
      parseFloat(a.turnoverRate) - parseFloat(b.turnoverRate)
    )
    
    // آمار
    const idleCount = filteredData.filter((item: any) => item.status === 'idle').length
    const lowTurnoverCount = filteredData.filter((item: any) => item.status === 'low_turnover').length
    const totalIdleValue = filteredData
      .filter((item: any) => item.status === 'idle')
      .reduce((sum: number, item: any) => {
        // محاسبه ارزش از Balance
        const itemBalances = balances.filter((b: any) => 
          b.itemId?.toString() === item.itemId
        )
        return sum + itemBalances.reduce((s: number, b: any) => s + (b.totalValue || 0), 0)
      }, 0)
    
    return NextResponse.json({
      success: true,
      data: filteredData,
      summary: {
        totalItems: filteredData.length,
        idleCount,
        lowTurnoverCount,
        normalCount: filteredData.length - idleCount - lowTurnoverCount,
        totalIdleValue,
        averageTurnover: filteredData.length > 0 
          ? (filteredData.reduce((sum: number, item: any) => sum + parseFloat(item.turnoverRate), 0) / filteredData.length).toFixed(4)
          : '0'
      },
      filters: {
        warehouseName: warehouseName || 'all',
        category: category || 'all',
        dateFrom,
        dateTo,
        minTurnover,
        maxTurnover,
        days
      }
    })
  } catch (error) {
    console.error('Error generating turnover report:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در تولید گزارش گردش کالا', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

