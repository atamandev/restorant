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

// GET - گزارش موجودی لحظه‌ای (On-Hand) + ارزش موجودی
export async function GET(request: NextRequest) {
  try {
    const db = await connectToDatabase()
    const balanceCollection = db.collection('inventory_balance')
    const itemsCollection = db.collection('inventory_items')
    const warehousesCollection = db.collection('warehouses')
    
    const { searchParams } = new URL(request.url)
    const warehouseName = searchParams.get('warehouseName')
    const category = searchParams.get('category')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const format = searchParams.get('format') || 'json' // json, excel, pdf
    
    // ساخت فیلتر
    const filter: any = {}
    
    if (warehouseName && warehouseName !== 'all') {
      filter.warehouseName = warehouseName
    }
    
    // دریافت موجودی‌ها از Balance
    const balances = await balanceCollection.find(filter).toArray()
    
    // دریافت اطلاعات آیتم‌ها
    const itemIds = [...new Set(balances.map((b: any) => b.itemId))]
    const items = await itemsCollection.find({
      _id: { $in: itemIds.map((id: any) => new ObjectId(id)) }
    }).toArray()
    
    // فیلتر دسته‌بندی
    let filteredItems = items
    if (category && category !== 'all') {
      filteredItems = items.filter((item: any) => item.category === category)
    }
    
    // ساخت گزارش
    const reportData = []
    let totalValue = 0
    let totalQuantity = 0
    
    for (const item of filteredItems) {
      const itemBalances = balances.filter((b: any) => 
        b.itemId.toString() === item._id.toString()
      )
      
      const totalQty = itemBalances.reduce((sum: number, b: any) => sum + (b.quantity || 0), 0)
      const totalVal = itemBalances.reduce((sum: number, b: any) => sum + (b.totalValue || 0), 0)
      const avgPrice = totalQty > 0 ? totalVal / totalQty : item.unitPrice || 0
      
      if (totalQty > 0) {
        reportData.push({
          itemId: item._id.toString(),
          itemName: item.name,
          itemCode: item.code || '',
          category: item.category || '',
          unit: item.unit || '',
          totalQuantity: totalQty,
          totalValue: totalVal,
          averagePrice: avgPrice,
          warehouses: itemBalances.map((b: any) => ({
            warehouseName: b.warehouseName,
            quantity: b.quantity || 0,
            value: b.totalValue || 0
          }))
        })
        
        totalQuantity += totalQty
        totalValue += totalVal
      }
    }
    
    // اگر format excel یا pdf است، خروجی بگیر
    if (format === 'excel' || format === 'pdf') {
      // در اینجا می‌توانید از کتابخانه‌های Excel/PDF استفاده کنید
      return NextResponse.json({
        success: true,
        message: 'خروجی Excel/PDF در حال توسعه است',
        data: reportData,
        summary: {
          totalItems: reportData.length,
          totalQuantity,
          totalValue
        }
      })
    }
    
    return NextResponse.json({
      success: true,
      data: reportData,
      summary: {
        totalItems: reportData.length,
        totalQuantity,
        totalValue,
        averageValue: reportData.length > 0 ? totalValue / reportData.length : 0
      },
      filters: {
        warehouseName: warehouseName || 'all',
        category: category || 'all',
        dateFrom: dateFrom || null,
        dateTo: dateTo || null
      }
    })
  } catch (error) {
    console.error('Error generating on-hand report:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در تولید گزارش موجودی لحظه‌ای', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

