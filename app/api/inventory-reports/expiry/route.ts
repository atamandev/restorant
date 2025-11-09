import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://restorenUser:1234@localhost:27017/restoren'
const DB_NAME = 'restoren'

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

// GET - گزارش انقضا (اقلام منقضی یا نزدیک انقضا)
export async function GET(request: NextRequest) {
  try {
    const db = await connectToDatabase()
    const movementCollection = db.collection('stock_movements')
    const balanceCollection = db.collection('inventory_balance')
    const itemsCollection = db.collection('inventory_items')
    
    const { searchParams } = new URL(request.url)
    const warehouseName = searchParams.get('warehouseName')
    const category = searchParams.get('category')
    const alertDays = parseInt(searchParams.get('alertDays') || '30') // روزهای هشدار
    const status = searchParams.get('status') || 'all' // all, expired, expiring_soon, normal
    
    // دریافت حرکات با تاریخ انقضا
    const movementFilter: any = {
      expirationDate: { $exists: true, $ne: null }
    }
    
    if (warehouseName && warehouseName !== 'all') {
      movementFilter.warehouseName = warehouseName
    }
    
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
    
    // ساخت گزارش
    const reportData = []
    const today = new Date()
    const alertDate = new Date(today.getTime() + alertDays * 24 * 60 * 60 * 1000)
    
    // گروه‌بندی حرکات بر اساس itemId و expirationDate
    const expiryMap = new Map<string, any>()
    
    for (const movement of movements) {
      if (!movement.expirationDate) continue
      
      const itemId = movement.itemId?.toString()
      const expiryDate = new Date(movement.expirationDate)
      const key = `${itemId}_${expiryDate.toISOString().split('T')[0]}`
      
      if (!expiryMap.has(key)) {
        expiryMap.set(key, {
          itemId,
          expirationDate: expiryDate,
          quantity: 0,
          value: 0,
          warehouseName: movement.warehouseName,
          lotNumber: movement.lotNumber || null
        })
      }
      
      const entry = expiryMap.get(key)!
      entry.quantity += Math.abs(movement.quantity || 0)
      entry.value += Math.abs(movement.totalValue || 0)
    }
    
    // ساخت گزارش برای هر آیتم
    for (const item of filteredItems) {
      const itemExpiries = Array.from(expiryMap.values()).filter((e: any) => 
        e.itemId === item._id.toString()
      )
      
      if (itemExpiries.length === 0) continue
      
      for (const expiry of itemExpiries) {
        const daysUntilExpiry = Math.ceil((expiry.expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        
        let expiryStatus = 'normal'
        if (daysUntilExpiry < 0) {
          expiryStatus = 'expired'
        } else if (daysUntilExpiry <= alertDays) {
          expiryStatus = 'expiring_soon'
        }
        
        // فیلتر بر اساس status
        if (status !== 'all' && expiryStatus !== status) {
          continue
        }
        
        reportData.push({
          itemId: item._id.toString(),
          itemName: item.name,
          itemCode: item.code || '',
          category: item.category || '',
          unit: item.unit || '',
          warehouseName: expiry.warehouseName,
          lotNumber: expiry.lotNumber,
          expirationDate: expiry.expirationDate.toISOString(),
          daysUntilExpiry,
          quantity: expiry.quantity,
          value: expiry.value,
          status: expiryStatus,
          isExpired: daysUntilExpiry < 0,
          isExpiringSoon: daysUntilExpiry >= 0 && daysUntilExpiry <= alertDays
        })
      }
    }
    
    // مرتب‌سازی: منقضی شده اول، سپس نزدیک انقضا
    reportData.sort((a: any, b: any) => {
      if (a.isExpired && !b.isExpired) return -1
      if (!a.isExpired && b.isExpired) return 1
      return a.daysUntilExpiry - b.daysUntilExpiry
    })
    
    // آمار
    const expiredCount = reportData.filter((item: any) => item.isExpired).length
    const expiringSoonCount = reportData.filter((item: any) => item.isExpiringSoon).length
    const expiredValue = reportData
      .filter((item: any) => item.isExpired)
      .reduce((sum: number, item: any) => sum + item.value, 0)
    const expiringSoonValue = reportData
      .filter((item: any) => item.isExpiringSoon)
      .reduce((sum: number, item: any) => sum + item.value, 0)
    
    return NextResponse.json({
      success: true,
      data: reportData,
      summary: {
        totalItems: reportData.length,
        expiredCount,
        expiringSoonCount,
        normalCount: reportData.length - expiredCount - expiringSoonCount,
        expiredValue,
        expiringSoonValue,
        totalValue: reportData.reduce((sum: number, item: any) => sum + item.value, 0)
      },
      filters: {
        warehouseName: warehouseName || 'all',
        category: category || 'all',
        alertDays,
        status
      }
    })
  } catch (error) {
    console.error('Error generating expiry report:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در تولید گزارش انقضا', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

