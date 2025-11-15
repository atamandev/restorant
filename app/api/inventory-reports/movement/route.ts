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

// GET - گزارش گردش کالا (ورود/خروج/مانده) با امکان دریل‌داون
export async function GET(request: NextRequest) {
  try {
    const db = await connectToDatabase()
    const movementCollection = db.collection('stock_movements')
    const balanceCollection = db.collection('inventory_balance')
    const itemsCollection = db.collection('inventory_items')
    
    const { searchParams } = new URL(request.url)
    const warehouseName = searchParams.get('warehouseName')
    const category = searchParams.get('category')
    const itemId = searchParams.get('itemId') // برای دریل‌داون
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const groupBy = searchParams.get('groupBy') || 'item' // item, category, warehouse, date
    
    // ساخت فیلتر
    const filter: any = {}
    
    if (warehouseName && warehouseName !== 'all') {
      filter.warehouseName = warehouseName
    }
    
    if (itemId) {
      filter.itemId = new ObjectId(itemId)
    }
    
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
    
    // دریافت حرکات
    const movements = await movementCollection.find(filter).sort({ createdAt: 1 }).toArray()
    
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
    
    // محاسبه گردش برای هر آیتم
    const reportData = []
    
    for (const item of filteredItems) {
      const itemMovements = movements.filter((m: any) => 
        m.itemId?.toString() === item._id.toString()
      )
      
      const itemBalances = balances.filter((b: any) => 
        b.itemId?.toString() === item._id.toString()
      )
      
      // محاسبه ورودی/خروجی
      let totalIn = 0
      let totalOut = 0
      let totalInValue = 0
      let totalOutValue = 0
      
      for (const movement of itemMovements) {
        const qty = movement.quantity || 0
        const val = movement.totalValue || 0
        
        if (qty > 0) {
          totalIn += qty
          totalInValue += val
        } else {
          totalOut += Math.abs(qty)
          totalOutValue += Math.abs(val)
        }
      }
      
      // موجودی فعلی
      const currentBalance = itemBalances.reduce((sum: number, b: any) => sum + (b.quantity || 0), 0)
      const currentValue = itemBalances.reduce((sum: number, b: any) => sum + (b.totalValue || 0), 0)
      
      // موجودی ابتدا (محاسبه از حرکات قبل از بازه زمانی)
      let initialBalance = 0
      let initialValue = 0
      if (dateFrom) {
        const startDate = new Date(dateFrom)
        const beforeMovements = await movementCollection.find({
          itemId: new ObjectId(item._id),
          createdAt: { $lt: startDate.toISOString() },
          ...(warehouseName && warehouseName !== 'all' ? { warehouseName } : {})
        }).toArray()
        
        for (const m of beforeMovements) {
          initialBalance += m.quantity || 0
          initialValue += m.totalValue || 0
        }
      }
      
      reportData.push({
        itemId: item._id.toString(),
        itemName: item.name,
        itemCode: item.code || '',
        category: item.category || '',
        unit: item.unit || '',
        initialBalance,
        initialValue,
        totalIn,
        totalInValue,
        totalOut,
        totalOutValue,
        currentBalance,
        currentValue,
        netMovement: totalIn - totalOut,
        netValue: totalInValue - totalOutValue,
        movementsCount: itemMovements.length,
        warehouses: itemBalances.map((b: any) => ({
          warehouseName: b.warehouseName,
          quantity: b.quantity || 0,
          value: b.totalValue || 0
        }))
      })
    }
    
    // گروه‌بندی
    let groupedData: any = {}
    if (groupBy === 'category') {
      groupedData = reportData.reduce((acc: any, item: any) => {
        const key = item.category || 'بدون دسته‌بندی'
        if (!acc[key]) {
          acc[key] = {
            key,
            items: [],
            totalIn: 0,
            totalOut: 0,
            totalInValue: 0,
            totalOutValue: 0,
            currentBalance: 0,
            currentValue: 0
          }
        }
        acc[key].items.push(item)
        acc[key].totalIn += item.totalIn
        acc[key].totalOut += item.totalOut
        acc[key].totalInValue += item.totalInValue
        acc[key].totalOutValue += item.totalOutValue
        acc[key].currentBalance += item.currentBalance
        acc[key].currentValue += item.currentValue
        return acc
      }, {})
    } else if (groupBy === 'warehouse') {
      // گروه‌بندی بر اساس انبار
      for (const item of reportData) {
        for (const wh of item.warehouses) {
          const key = wh.warehouseName
          if (!groupedData[key]) {
            groupedData[key] = {
              key,
              items: [],
              totalIn: 0,
              totalOut: 0,
              totalInValue: 0,
              totalOutValue: 0,
              currentBalance: 0,
              currentValue: 0
            }
          }
          groupedData[key].currentBalance += wh.quantity
          groupedData[key].currentValue += wh.value
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      data: groupBy === 'item' ? reportData : Object.values(groupedData),
      summary: {
        totalItems: reportData.length,
        totalIn: reportData.reduce((sum: number, item: any) => sum + item.totalIn, 0),
        totalOut: reportData.reduce((sum: number, item: any) => sum + item.totalOut, 0),
        totalCurrentBalance: reportData.reduce((sum: number, item: any) => sum + item.currentBalance, 0),
        totalCurrentValue: reportData.reduce((sum: number, item: any) => sum + item.currentValue, 0)
      },
      filters: {
        warehouseName: warehouseName || 'all',
        category: category || 'all',
        itemId: itemId || null,
        dateFrom: dateFrom || null,
        dateTo: dateTo || null,
        groupBy
      }
    })
  } catch (error) {
    console.error('Error generating movement report:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در تولید گزارش گردش کالا', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

