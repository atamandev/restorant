import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://restorenUser:1234@localhost:27017/restoren'
const DB_NAME = 'restoren'
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
  const query: any = {}
  if (warehouse) {
    query.warehouse = warehouse
  }

  const items = await inventoryCollection.find(query).toArray()
  
  const totalItems = items.length
  const totalValue = items.reduce((sum: number, item: any) => sum + (item.totalValue || 0), 0)
  const lowStockItems = items.filter((item: any) => item.isLowStock || (item.currentStock || 0) <= (item.minStock || 0)).length
  const criticalStockItems = items.filter((item: any) => (item.currentStock || 0) <= ((item.minStock || 0) * 0.5)).length
  const overstockItems = items.filter((item: any) => (item.currentStock || 0) > (item.maxStock || 0)).length

  // گروه‌بندی بر اساس انبار
  const warehouseStats: any = {}
  items.forEach((item: any) => {
    const wh = item.warehouse || 'نامشخص'
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
    warehouseStats[wh].totalValue += (item.totalValue || 0)
    if (item.isLowStock || (item.currentStock || 0) <= (item.minStock || 0)) {
      warehouseStats[wh].lowStockItems++
    }
    if ((item.currentStock || 0) <= ((item.minStock || 0) * 0.5)) {
      warehouseStats[wh].criticalStockItems++
    }
    if ((item.currentStock || 0) > (item.maxStock || 0)) {
      warehouseStats[wh].overstockItems++
    }
  })

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
  const query: any = {}
  if (warehouse) {
    query.warehouse = warehouse
  }

  const items = await inventoryCollection.find(query).toArray()
  
  const totalItems = items.length
  const totalValue = items.reduce((sum: number, item: any) => sum + (item.totalValue || 0), 0)
  
  // گروه‌بندی بر اساس روش ارزش‌گذاری
  const valuationStats: any = {
    fifo: { count: 0, value: 0 },
    lifo: { count: 0, value: 0 },
    weighted_average: { count: 0, value: 0 }
  }

  items.forEach((item: any) => {
    const method = item.valuationMethod || 'weighted_average'
    if (valuationStats[method]) {
      valuationStats[method].count++
      valuationStats[method].value += (item.totalValue || 0)
    }
  })

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
  const query: any = {}
  if (warehouse) {
    query.warehouse = warehouse
  }

  const items = await inventoryCollection.find(query).toArray()
  
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
    const avgStock = (item.currentStock || 0) // ساده‌سازی شده
    const turnoverRate = avgStock > 0 ? totalOut / avgStock : 0

    return {
      itemId: item._id.toString(),
      itemName: item.name,
      totalOut,
      avgStock,
      turnoverRate
    }
  }))

  // تحلیل ABC
  turnoverData.sort((a, b) => b.turnoverRate - a.turnoverRate)
  const abcAnalysis = {
    A: turnoverData.slice(0, Math.ceil(turnoverData.length * 0.2)),
    B: turnoverData.slice(Math.ceil(turnoverData.length * 0.2), Math.ceil(turnoverData.length * 0.5)),
    C: turnoverData.slice(Math.ceil(turnoverData.length * 0.5))
  }

  return {
    totalItems: items.length,
    totalValue: items.reduce((sum: number, item: any) => sum + (item.totalValue || 0), 0),
    turnoverData,
    abcAnalysis
  }
}

async function generateAgingReport(warehouse: string | null, inventoryCollection: any, ledgerCollection: any) {
  const query: any = {}
  if (warehouse) {
    query.warehouse = warehouse
  }

  const items = await inventoryCollection.find(query).toArray()
  
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

    return {
      itemId: item._id.toString(),
      itemName: item.name,
      currentStock: item.currentStock || 0,
      value: item.totalValue || 0,
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

  return {
    totalItems: items.length,
    totalValue: items.reduce((sum: number, item: any) => sum + (item.totalValue || 0), 0),
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

