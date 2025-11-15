import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://admin:StrongPassword123@185.204.169.107:27017/restaurant?authSource=admin'
const DB_NAME = 'restaurant'
const COLLECTION_NAME = 'inventory_reports'

let client: MongoClient | null = null
let db: any

async function connectToDatabase() {
  try {
    if (!client) {
      client = new MongoClient(MONGO_URI)
      await client.connect()
      db = client.db(DB_NAME)
    }
    return db
  } catch (error) {
    console.error('Database connection error:', error)
    throw error
  }
}

// GET - دریافت تمام گزارشات با فیلتر و مرتب‌سازی
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const type = searchParams.get('type') || 'all'
    const status = searchParams.get('status') || 'all'
    const period = searchParams.get('period') || 'all'
    const sortBy = searchParams.get('sortBy') || 'generatedDate'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const limit = parseInt(searchParams.get('limit') || '100')
    const skip = parseInt(searchParams.get('skip') || '0')

    // ساخت فیلتر
    const filter: any = {}
    if (search && search.trim() !== '') {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ]
    }
    if (type && type !== 'all') filter.type = type
    if (status && status !== 'all') filter.status = status
    if (period && period !== 'all') {
      // فیلتر بر اساس period (که در JSON ذخیره می‌شود)
      filter.period = period
    }

    // ساخت مرتب‌سازی
    const sort: any = {}
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1

    const reports = await collection
      .find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .toArray()

    // آمار کلی
    let stats: any = {
      totalReports: 0,
      readyReports: 0,
      generatingReports: 0,
      errorReports: 0,
      totalDownloads: 0
    }
    
    try {
      const statsArray = await collection.aggregate([
        {
          $group: {
            _id: null,
            totalReports: { $sum: 1 },
            readyReports: { $sum: { $cond: [{ $eq: ['$status', 'ready'] }, 1, 0] } },
            generatingReports: { $sum: { $cond: [{ $eq: ['$status', 'generating'] }, 1, 0] } },
            errorReports: { $sum: { $cond: [{ $eq: ['$status', 'error'] }, 1, 0] } },
            totalDownloads: { $sum: '$downloadCount' }
          }
        }
      ]).toArray()
      
      if (statsArray.length > 0) {
        stats = statsArray[0]
        delete stats._id
      }
    } catch (error) {
      console.error('Error calculating stats:', error)
    }

    const total = await collection.countDocuments(filter)

    return NextResponse.json({
      success: true,
      data: reports.map((report: any) => ({
        ...report,
        _id: report._id.toString(),
        id: report._id.toString()
      })),
      stats,
      pagination: {
        limit,
        skip,
        total
      }
    })
  } catch (error) {
    console.error('Error fetching inventory reports:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در دریافت گزارشات انبار',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// POST - ایجاد گزارش جدید یا تولید گزارش
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    const inventoryCollection = db.collection('inventory_items')
    const ledgerCollection = db.collection('item_ledger')
    const warehousesCollection = db.collection('warehouses')
    const transfersCollection = db.collection('transfers')
    const adjustmentsCollection = db.collection('adjustments')
    
    const body = await request.json()
    
    const {
      name,
      type,
      description,
      period,
      warehouse,
      generate
    } = body

    if (!type) {
      return NextResponse.json(
        { success: false, message: 'نوع گزارش اجباری است' },
        { status: 400 }
      )
    }

    // اگر generate=true باشد، گزارش را تولید کن
    if (generate) {
      return await generateReport(type, period, warehouse, collection, inventoryCollection, ledgerCollection, warehousesCollection, transfersCollection, adjustmentsCollection)
    }

    // در غیر این صورت، گزارش جدید ایجاد کن
    const report = {
      name: name || `گزارش ${getReportTypeName(type)}`,
      type,
      description: description || '',
      generatedDate: new Date().toISOString(),
      period: period || 'current_month',
      warehouse: warehouse || null,
      totalItems: 0,
      totalValue: 0,
      status: 'draft',
      fileSize: '0 MB',
      downloadCount: 0,
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const result = await collection.insertOne(report)

    return NextResponse.json({
      success: true,
      data: { ...report, _id: result.insertedId.toString(), id: result.insertedId.toString() },
      message: 'گزارش با موفقیت ایجاد شد'
    })
  } catch (error) {
    console.error('Error creating inventory report:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در ایجاد گزارش' },
      { status: 500 }
    )
  }
}

// PUT - به‌روزرسانی گزارش
export async function PUT(request: NextRequest) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'شناسه گزارش اجباری است' },
        { status: 400 }
      )
    }

    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: {
          ...updateData,
          updatedAt: new Date().toISOString()
        }
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'گزارش یافت نشد' },
        { status: 404 }
      )
    }

    const updatedReport = await collection.findOne({ _id: new ObjectId(id) })

    return NextResponse.json({
      success: true,
      data: { ...updatedReport, _id: updatedReport._id.toString(), id: updatedReport._id.toString() },
      message: 'گزارش با موفقیت به‌روزرسانی شد'
    })
  } catch (error) {
    console.error('Error updating inventory report:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در به‌روزرسانی گزارش' },
      { status: 500 }
    )
  }
}

// DELETE - حذف گزارش
export async function DELETE(request: NextRequest) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'شناسه گزارش اجباری است' },
        { status: 400 }
      )
    }

    const result = await collection.deleteOne({ _id: new ObjectId(id) })
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'گزارش یافت نشد' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'گزارش با موفقیت حذف شد'
    })
  } catch (error) {
    console.error('Error deleting inventory report:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در حذف گزارش' },
      { status: 500 }
    )
  }
}

// تابع کمکی برای تولید گزارش
async function generateReport(
  type: string,
  period: string,
  warehouse: string | null,
  reportsCollection: any,
  inventoryCollection: any,
  ledgerCollection: any,
  warehousesCollection: any,
  transfersCollection: any,
  adjustmentsCollection: any
) {
  try {
    // محاسبه تاریخ شروع و پایان بر اساس period
    const { startDate, endDate } = calculatePeriodDates(period)
    
    let reportData: any = {}
    let totalItems = 0
    let totalValue = 0

    switch (type) {
      case 'stock_level':
        reportData = await generateStockLevelReport(warehouse, inventoryCollection)
        totalItems = reportData.totalItems || 0
        totalValue = reportData.totalValue || 0
        break
      case 'movement':
        reportData = await generateMovementReport(startDate, endDate, warehouse, ledgerCollection, transfersCollection, adjustmentsCollection)
        totalItems = reportData.totalItems || 0
        totalValue = reportData.totalValue || 0
        break
      case 'valuation':
        reportData = await generateValuationReport(warehouse, inventoryCollection)
        totalItems = reportData.totalItems || 0
        totalValue = reportData.totalValue || 0
        break
      case 'turnover':
        reportData = await generateTurnoverReport(startDate, endDate, warehouse, inventoryCollection, ledgerCollection)
        totalItems = reportData.totalItems || 0
        totalValue = reportData.totalValue || 0
        break
      case 'aging':
        reportData = await generateAgingReport(warehouse, inventoryCollection, ledgerCollection)
        totalItems = reportData.totalItems || 0
        totalValue = reportData.totalValue || 0
        break
      default:
        return NextResponse.json(
          { success: false, message: 'نوع گزارش نامعتبر است' },
          { status: 400 }
        )
    }

    // محاسبه حجم فایل (تقریبی)
    const fileSize = calculateFileSize(reportData)

    // ایجاد گزارش در دیتابیس
    const report = {
      name: `گزارش ${getReportTypeName(type)}`,
      type,
      description: `گزارش ${getReportTypeName(type)} برای دوره ${getPeriodName(period)}`,
      generatedDate: new Date().toISOString(),
      period,
      warehouse: warehouse || null,
      totalItems,
      totalValue,
      status: 'ready',
      fileSize,
      downloadCount: 0,
      metadata: reportData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const result = await reportsCollection.insertOne(report)

    return NextResponse.json({
      success: true,
      data: { ...report, _id: result.insertedId.toString(), id: result.insertedId.toString() },
      message: 'گزارش با موفقیت تولید شد'
    })
  } catch (error) {
    console.error('Error generating report:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در تولید گزارش: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    )
  }
}

// توابع تولید انواع گزارشات
async function generateStockLevelReport(warehouse: string | null, inventoryCollection: any) {
  const db = await connectToDatabase()
  const balanceCollection = db.collection('inventory_balance')
  
  // دریافت موجودی‌ها از Balance (دقیق‌تر)
  const balanceQuery: any = {}
  if (warehouse) {
    balanceQuery.warehouseName = warehouse
  }
  const balances = await balanceCollection.find(balanceQuery).toArray()
  
  // دریافت همه itemId های منحصر به فرد از balance ها
  const allBalanceItemIds = [...new Set(balances.map((b: any) => {
    const itemId = b.itemId?.toString() || String(b.itemId || '')
    return itemId
  }).filter(Boolean))]
  
  // دریافت اطلاعات آیتم‌ها از balance (فقط کالاهایی که در inventory_items هستند)
  const itemsFromBalance = allBalanceItemIds.length > 0 
    ? await inventoryCollection.find({
        _id: { $in: allBalanceItemIds.map((id: string) => {
          try {
            return new ObjectId(id)
          } catch {
            return null
          }
        }).filter(Boolean) }
      }).toArray()
    : []
  
  // اگر warehouse فیلتر شده، فیلتر کردن items
  let filteredItems = itemsFromBalance
  if (warehouse) {
    // همچنین از inventory_items استفاده کن برای کالاهایی که balance ندارند
    const itemsQuery: any = { warehouse: warehouse }
    const itemsFromWarehouse = await inventoryCollection.find(itemsQuery).toArray()
    
    // ترکیب: کالاهایی که balance دارند + کالاهایی که balance ندارند
    const itemsWithBalance = new Set(itemsFromBalance.map((i: any) => i._id.toString()))
    const itemsWithoutBalance = itemsFromWarehouse.filter((i: any) => !itemsWithBalance.has(i._id.toString()))
    filteredItems = [...itemsFromBalance, ...itemsWithoutBalance]
  } else {
    // اگر warehouse فیلتر نشده، همه کالاهایی که balance دارند را بگیر
    // همچنین کالاهایی که balance ندارند اما در inventory_items هستند
    const allItems = await inventoryCollection.find({}).toArray()
    const itemsWithBalance = new Set(itemsFromBalance.map((i: any) => i._id.toString()))
    const itemsWithoutBalance = allItems.filter((i: any) => !itemsWithBalance.has(i._id.toString()))
    filteredItems = [...itemsFromBalance, ...itemsWithoutBalance]
  }
  
  // همچنین balance هایی که کالایشان در inventory_items نیست را هم اضافه کن
  // (برای این balance ها، یک آیتم موقت ایجاد می‌کنیم)
  const itemsWithBalanceIds = new Set(filteredItems.map((i: any) => i._id.toString()))
  const balanceItemIdsWithoutItem = allBalanceItemIds.filter(id => !itemsWithBalanceIds.has(id))
  
  // برای balance هایی که کالایشان در inventory_items نیست، از اطلاعات balance استفاده کن
  for (const itemId of balanceItemIdsWithoutItem) {
    const itemBalances = balances.filter((b: any) => {
      const balanceItemId = b.itemId?.toString() || String(b.itemId || '')
      return balanceItemId === itemId
    })
    
    if (itemBalances.length > 0) {
      // ایجاد یک آیتم موقت از balance
      const tempItem = {
        _id: new ObjectId(itemId),
        name: `کالای ${itemId.substring(0, 8)}...`,
        code: '',
        category: 'نامشخص',
        unit: 'عدد',
        currentStock: 0,
        totalValue: 0,
        minStock: 0,
        maxStock: 0,
        warehouse: itemBalances[0].warehouseName || 'نامشخص',
        isTemp: true // نشان می‌دهد که این یک آیتم موقت است
      }
      filteredItems.push(tempItem)
    }
  }
  
  // محاسبه آمار بر اساس موجودی واقعی از Balance
  let totalItems = 0
  let totalValue = 0
  let lowStockItems = 0
  let criticalStockItems = 0
  let overstockItems = 0
  
  const warehouseStats: any = {}
  
  for (const item of filteredItems) {
    const itemId = item._id.toString()
    
    // دریافت موجودی از Balance (همه balance های این کالا، از همه انبارها)
    const itemBalances = balances.filter((b: any) => {
      const balanceItemId = b.itemId?.toString() || String(b.itemId || '')
      return balanceItemId === itemId
    })
    
    // محاسبه موجودی کل از Balance (از همه انبارها)
    const currentStock = itemBalances.reduce((sum: number, b: any) => sum + (b.quantity || 0), 0)
    const currentValue = itemBalances.reduce((sum: number, b: any) => sum + (b.totalValue || 0), 0)
    
    // اگر balance برای این کالا وجود دارد، از balance استفاده کن (حتی اگر صفر باشد)
    // در غیر این صورت از inventory_items استفاده کن
    const hasBalance = itemBalances.length > 0
    const finalStock = hasBalance ? currentStock : (item.currentStock || 0)
    const finalValue = hasBalance ? currentValue : (item.totalValue || 0)
    
    const minStock = item.minStock || 0
    const maxStock = item.maxStock || 0
    
    // اگر warehouse فیلتر شده، فقط balance های آن انبار را در نظر بگیر
    if (warehouse) {
      const warehouseBalances = itemBalances.filter((b: any) => b.warehouseName === warehouse)
      const warehouseStock = warehouseBalances.reduce((sum: number, b: any) => sum + (b.quantity || 0), 0)
      const warehouseValue = warehouseBalances.reduce((sum: number, b: any) => sum + (b.totalValue || 0), 0)
      const wh = warehouse
      
      if (!warehouseStats[wh]) {
        warehouseStats[wh] = {
          warehouse: wh,
          totalItems: 0,
          totalValue: 0,
          lowStockItems: 0,
          criticalStockItems: 0,
          overstockItems: 0
        }
      }
      
      warehouseStats[wh].totalItems++
      warehouseStats[wh].totalValue += (warehouseBalances.length > 0 ? warehouseValue : finalValue)
      
      if (warehouseStock <= minStock) {
        warehouseStats[wh].lowStockItems++
      }
      if (warehouseStock <= (minStock * 0.5)) {
        warehouseStats[wh].criticalStockItems++
      }
      if (warehouseStock > maxStock && maxStock > 0) {
        warehouseStats[wh].overstockItems++
      }
    } else {
      // اگر warehouse فیلتر نشده، بر اساس انبارهای موجود در balance گروه‌بندی کن
      const warehouseMap = new Map<string, { stock: number, value: number }>()
      
      itemBalances.forEach((b: any) => {
        const wh = b.warehouseName || item.warehouse || 'نامشخص'
        if (!warehouseMap.has(wh)) {
          warehouseMap.set(wh, { stock: 0, value: 0 })
        }
        const stats = warehouseMap.get(wh)!
        stats.stock += (b.quantity || 0)
        stats.value += (b.totalValue || 0)
      })
      
      // اگر balance نداریم، از warehouse کالا استفاده کن
      if (itemBalances.length === 0) {
        const wh = item.warehouse || 'نامشخص'
        warehouseMap.set(wh, { stock: finalStock, value: finalValue })
      }
      
      // اضافه کردن به آمار هر انبار
      warehouseMap.forEach((stats, wh) => {
        if (!warehouseStats[wh]) {
          warehouseStats[wh] = {
            warehouse: wh,
            totalItems: 0,
            totalValue: 0,
            lowStockItems: 0,
            criticalStockItems: 0,
            overstockItems: 0
          }
        }
        
        warehouseStats[wh].totalItems++
        warehouseStats[wh].totalValue += stats.value
        
        if (stats.stock <= minStock) {
          warehouseStats[wh].lowStockItems++
        }
        if (stats.stock <= (minStock * 0.5)) {
          warehouseStats[wh].criticalStockItems++
        }
        if (stats.stock > maxStock && maxStock > 0) {
          warehouseStats[wh].overstockItems++
        }
      })
    }
    
    totalItems++
    totalValue += finalValue
    
    if (finalStock <= minStock) {
      lowStockItems++
    }
    if (finalStock <= (minStock * 0.5)) {
      criticalStockItems++
    }
    if (finalStock > maxStock && maxStock > 0) {
      overstockItems++
    }
  }

  return {
    totalItems,
    totalValue,
    lowStockItems,
    criticalStockItems,
    overstockItems,
    warehouseStats: Object.values(warehouseStats)
  }
}

async function generateMovementReport(
  startDate: Date,
  endDate: Date,
  warehouse: string | null,
  ledgerCollection: any,
  transfersCollection: any,
  adjustmentsCollection: any
) {
  const dateQuery: any = {
    date: {
      $gte: startDate.toISOString().split('T')[0],
      $lte: endDate.toISOString().split('T')[0]
    }
  }
  if (warehouse) {
    dateQuery.warehouse = warehouse
  }

  // دریافت ورودی‌ها و خروجی‌ها از ledger
  const ledgerEntries = await ledgerCollection.find(dateQuery).toArray()
  
  const receipts = ledgerEntries
    .filter((entry: any) => (entry.quantityIn || 0) > 0)
    .reduce((sum: number, entry: any) => sum + (entry.quantityIn || 0) * (entry.unitPrice || 0), 0)
  
  const issues = ledgerEntries
    .filter((entry: any) => (entry.quantityOut || 0) > 0)
    .reduce((sum: number, entry: any) => sum + (entry.quantityOut || 0) * (entry.unitPrice || 0), 0)

  // دریافت انتقالات
  const transferQuery: any = {
    createdAt: {
      $gte: startDate.toISOString(),
      $lte: endDate.toISOString()
    }
  }
  if (warehouse) {
    transferQuery.$or = [
      { fromWarehouse: warehouse },
      { toWarehouse: warehouse }
    ]
  }
  const transfers = await transfersCollection.find(transferQuery).toArray()
  const transfersValue = transfers.reduce((sum: number, t: any) => sum + (t.totalValue || 0), 0)

  // دریافت تعدیلات
  const adjustmentQuery: any = {
    createdDate: {
      $gte: startDate.toISOString(),
      $lte: endDate.toISOString()
    }
  }
  if (warehouse) {
    adjustmentQuery.warehouse = warehouse
  }
  const adjustments = await adjustmentsCollection.find(adjustmentQuery).toArray()
  const adjustmentsValue = adjustments.reduce((sum: number, a: any) => sum + (a.totalValue || 0), 0)

  // گروه‌بندی روزانه
  const dailyData: any = {}
  ledgerEntries.forEach((entry: any) => {
    const date = entry.date
    if (!dailyData[date]) {
      dailyData[date] = {
        date,
        receipts: 0,
        issues: 0,
        transfers: 0,
        adjustments: 0,
        netMovement: 0
      }
    }
    if (entry.quantityIn > 0) {
      dailyData[date].receipts += entry.quantityIn * (entry.unitPrice || 0)
    }
    if (entry.quantityOut > 0) {
      dailyData[date].issues += entry.quantityOut * (entry.unitPrice || 0)
    }
  })

  transfers.forEach((t: any) => {
    const date = t.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0]
    if (!dailyData[date]) {
      dailyData[date] = {
        date,
        receipts: 0,
        issues: 0,
        transfers: 0,
        adjustments: 0,
        netMovement: 0
      }
    }
    dailyData[date].transfers += t.totalValue || 0
  })

  adjustments.forEach((a: any) => {
    const date = a.createdDate?.split('T')[0] || new Date().toISOString().split('T')[0]
    if (!dailyData[date]) {
      dailyData[date] = {
        date,
        receipts: 0,
        issues: 0,
        transfers: 0,
        adjustments: 0,
        netMovement: 0
      }
    }
    dailyData[date].adjustments += a.totalValue || 0
  })

  // محاسبه netMovement
  Object.keys(dailyData).forEach(date => {
    const data = dailyData[date]
    data.netMovement = data.receipts - data.issues + data.transfers + data.adjustments
  })

  return {
    totalItems: ledgerEntries.length,
    totalValue: receipts + issues + transfersValue + adjustmentsValue,
    receipts,
    issues,
    transfers: transfersValue,
    adjustments: adjustmentsValue,
    netMovement: receipts - issues + transfersValue + adjustmentsValue,
    dailyData: Object.values(dailyData).sort((a: any, b: any) => a.date.localeCompare(b.date))
  }
}

async function generateValuationReport(warehouse: string | null, inventoryCollection: any) {
  const db = await connectToDatabase()
  const balanceCollection = db.collection('inventory_balance')
  
  // دریافت موجودی‌ها از Balance (دقیق‌تر)
  const balanceQuery: any = {}
  if (warehouse) {
    balanceQuery.warehouseName = warehouse
  }
  const balances = await balanceCollection.find(balanceQuery).toArray()
  
  // دریافت اطلاعات آیتم‌ها
  const itemIds = [...new Set(balances.map((b: any) => b.itemId?.toString()).filter(Boolean))]
  let items = await inventoryCollection.find({
    _id: { $in: itemIds.map((id: string) => new ObjectId(id)) }
  }).toArray()
  
  // اگر warehouse فیلتر شده، فیلتر کردن items
  if (warehouse) {
    const itemsQuery: any = { warehouse: warehouse }
    const itemsFromWarehouse = await inventoryCollection.find(itemsQuery).toArray()
    const itemsWithBalance = new Set(items.map((i: any) => i._id.toString()))
    const itemsWithoutBalance = itemsFromWarehouse.filter((i: any) => !itemsWithBalance.has(i._id.toString()))
    items = [...items, ...itemsWithoutBalance]
  }
  
  // محاسبه ارزش بر اساس موجودی واقعی از Balance
  let totalItems = 0
  let totalValue = 0
  
  // گروه‌بندی بر اساس روش ارزش‌گذاری
  const valuationStats: any = {
    fifo: { count: 0, value: 0 },
    lifo: { count: 0, value: 0 },
    weighted_average: { count: 0, value: 0 }
  }
  
  for (const item of items) {
    const itemId = item._id.toString()
    const itemBalances = balances.filter((b: any) => b.itemId?.toString() === itemId)
    const currentValue = itemBalances.reduce((sum: number, b: any) => sum + (b.totalValue || 0), 0)
    // اگر balance برای این کالا وجود دارد، از balance استفاده کن (حتی اگر صفر باشد)
    const hasBalance = itemBalances.length > 0
    const finalValue = hasBalance ? currentValue : (item.totalValue || 0)
    
    totalItems++
    totalValue += finalValue
    
    // استفاده از روش پیش‌فرض (weighted_average) اگر روش مشخص نشده
    const valuationMethod = item.valuationMethod || 'weighted_average'
    if (valuationStats[valuationMethod]) {
      valuationStats[valuationMethod].count++
      valuationStats[valuationMethod].value += finalValue
    } else {
      valuationStats.weighted_average.count++
      valuationStats.weighted_average.value += finalValue
    }
  }

  return {
    totalItems,
    totalValue,
    valuationStats
  }
}

async function generateTurnoverReport(
  startDate: Date,
  endDate: Date,
  warehouse: string | null,
  inventoryCollection: any,
  ledgerCollection: any
) {
  const db = await connectToDatabase()
  const balanceCollection = db.collection('inventory_balance')
  
  // دریافت موجودی‌ها از Balance
  const balanceQuery: any = {}
  if (warehouse) {
    balanceQuery.warehouseName = warehouse
  }
  const balances = await balanceCollection.find(balanceQuery).toArray()
  
  // دریافت اطلاعات آیتم‌ها
  const itemIds = [...new Set(balances.map((b: any) => b.itemId?.toString()).filter(Boolean))]
  let items = await inventoryCollection.find({
    _id: { $in: itemIds.map((id: string) => new ObjectId(id)) }
  }).toArray()
  
  // اگر warehouse فیلتر شده، فیلتر کردن items
  if (warehouse) {
    const itemsQuery: any = { warehouse: warehouse }
    const itemsFromWarehouse = await inventoryCollection.find(itemsQuery).toArray()
    const itemsWithBalance = new Set(items.map((i: any) => i._id.toString()))
    const itemsWithoutBalance = itemsFromWarehouse.filter((i: any) => !itemsWithBalance.has(i._id.toString()))
    items = [...items, ...itemsWithoutBalance]
  }
  
  const dateQuery: any = {
    date: {
      $gte: startDate.toISOString().split('T')[0],
      $lte: endDate.toISOString().split('T')[0]
    }
  }
  if (warehouse) {
    dateQuery.warehouse = warehouse
  }

  // محاسبه نرخ گردش برای هر آیتم
  const turnoverData = await Promise.all(items.map(async (item: any) => {
    const itemLedger = await ledgerCollection.find({
      ...dateQuery,
      itemId: item._id.toString()
    }).toArray()

    const totalOut = itemLedger.reduce((sum: number, entry: any) => sum + (entry.quantityOut || 0), 0)
    
    // دریافت موجودی واقعی از Balance
    const itemBalances = balances.filter((b: any) => b.itemId?.toString() === item._id.toString())
    const hasBalance = itemBalances.length > 0
    const avgStock = hasBalance 
      ? itemBalances.reduce((sum: number, b: any) => sum + (b.quantity || 0), 0)
      : (item.currentStock || 0)
    const turnoverRate = avgStock > 0 ? totalOut / avgStock : 0
    
    // محاسبه ارزش از Balance
    const totalValue = hasBalance
      ? itemBalances.reduce((sum: number, b: any) => sum + (b.totalValue || 0), 0)
      : (item.totalValue || 0)

    return {
      itemId: item._id.toString(),
      itemName: item.name,
      totalOut,
      avgStock,
      turnoverRate,
      totalValue
    }
  }))

  // تحلیل ABC
  turnoverData.sort((a, b) => b.turnoverRate - a.turnoverRate)
  const abcAnalysis = {
    A: turnoverData.slice(0, Math.ceil(turnoverData.length * 0.2)),
    B: turnoverData.slice(Math.ceil(turnoverData.length * 0.2), Math.ceil(turnoverData.length * 0.5)),
    C: turnoverData.slice(Math.ceil(turnoverData.length * 0.5))
  }

  const totalValue = turnoverData.reduce((sum: number, item: any) => sum + (item.totalValue || 0), 0)

  return {
    totalItems: items.length,
    totalValue,
    turnoverData,
    abcAnalysis
  }
}

async function generateAgingReport(warehouse: string | null, inventoryCollection: any, ledgerCollection: any) {
  const db = await connectToDatabase()
  const balanceCollection = db.collection('inventory_balance')
  
  // دریافت موجودی‌ها از Balance
  const balanceQuery: any = {}
  if (warehouse) {
    balanceQuery.warehouseName = warehouse
  }
  const balances = await balanceCollection.find(balanceQuery).toArray()
  
  // دریافت اطلاعات آیتم‌ها
  const itemIds = [...new Set(balances.map((b: any) => b.itemId?.toString()).filter(Boolean))]
  let items = await inventoryCollection.find({
    _id: { $in: itemIds.map((id: string) => new ObjectId(id)) }
  }).toArray()
  
  // اگر warehouse فیلتر شده، فیلتر کردن items
  if (warehouse) {
    const itemsQuery: any = { warehouse: warehouse }
    const itemsFromWarehouse = await inventoryCollection.find(itemsQuery).toArray()
    const itemsWithBalance = new Set(items.map((i: any) => i._id.toString()))
    const itemsWithoutBalance = itemsFromWarehouse.filter((i: any) => !itemsWithBalance.has(i._id.toString()))
    items = [...items, ...itemsWithoutBalance]
  }
  
  // محاسبه سن موجودی‌ها بر اساس آخرین ورود
  const agingData = await Promise.all(items.map(async (item: any) => {
    const lastEntry = await ledgerCollection.findOne(
      {
        itemId: item._id.toString(),
        quantityIn: { $gt: 0 }
      },
      { sort: { date: -1, createdAt: -1 } }
    )

    const lastEntryDate = lastEntry ? new Date(lastEntry.date) : new Date(item.createdAt || new Date())
    const daysAged = Math.floor((new Date().getTime() - lastEntryDate.getTime()) / (1000 * 60 * 60 * 24))
    
    // دریافت موجودی واقعی از Balance
    const itemBalances = balances.filter((b: any) => b.itemId?.toString() === item._id.toString())
    const hasBalance = itemBalances.length > 0
    const currentStock = hasBalance
      ? itemBalances.reduce((sum: number, b: any) => sum + (b.quantity || 0), 0)
      : (item.currentStock || 0)
    const currentValue = hasBalance
      ? itemBalances.reduce((sum: number, b: any) => sum + (b.totalValue || 0), 0)
      : (item.totalValue || 0)

    return {
      itemId: item._id.toString(),
      itemName: item.name,
      currentStock,
      value: currentValue,
      lastEntryDate: lastEntryDate.toISOString(),
      daysAged,
      agingCategory: daysAged < 30 ? 'نو' : daysAged < 90 ? 'متوسط' : daysAged < 180 ? 'قدیمی' : 'بسیار قدیمی'
    }
  }))

  // گروه‌بندی بر اساس دسته‌بندی سن
  const agingStats: any = {
    نو: { count: 0, value: 0 },
    متوسط: { count: 0, value: 0 },
    قدیمی: { count: 0, value: 0 },
    'بسیار قدیمی': { count: 0, value: 0 }
  }

  agingData.forEach((data: any) => {
    const category = data.agingCategory
    if (agingStats[category]) {
      agingStats[category].count++
      agingStats[category].value += data.value
    }
  })

  const totalValue = agingData.reduce((sum: number, data: any) => sum + (data.value || 0), 0)

  return {
    totalItems: items.length,
    totalValue,
    agingData,
    agingStats
  }
}

// توابع کمکی
function calculatePeriodDates(period: string): { startDate: Date; endDate: Date } {
  const endDate = new Date()
  let startDate = new Date()

  switch (period) {
    case 'current_month':
      startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1)
      break
    case 'last_month':
      startDate = new Date(endDate.getFullYear(), endDate.getMonth() - 1, 1)
      endDate.setDate(0) // آخرین روز ماه گذشته
      break
    case 'last_3_months':
      startDate = new Date(endDate.getFullYear(), endDate.getMonth() - 3, 1)
      break
    case 'last_6_months':
      startDate = new Date(endDate.getFullYear(), endDate.getMonth() - 6, 1)
      break
    case 'last_year':
      startDate = new Date(endDate.getFullYear() - 1, endDate.getMonth(), endDate.getDate())
      break
    default:
      startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1)
  }

  return { startDate, endDate }
}

function getReportTypeName(type: string): string {
  const names: any = {
    stock_level: 'سطح موجودی',
    movement: 'گردش موجودی',
    valuation: 'ارزش‌گذاری',
    turnover: 'گردش کالا',
    aging: 'کهنگی موجودی'
  }
  return names[type] || type
}

function getPeriodName(period: string): string {
  const names: any = {
    current_month: 'ماه جاری',
    last_month: 'ماه گذشته',
    last_3_months: '3 ماه گذشته',
    last_6_months: '6 ماه گذشته',
    last_year: 'سال گذشته'
  }
  return names[period] || period
}

function calculateFileSize(data: any): string {
  // محاسبه تقریبی حجم فایل بر اساس حجم داده JSON
  const jsonSize = JSON.stringify(data).length
  const sizeInMB = (jsonSize / 1024 / 1024).toFixed(2)
  return `${sizeInMB} MB`
}

