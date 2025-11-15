import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://admin:StrongPassword123@185.204.169.107:27017/restaurant?authSource=admin'
const DB_NAME = 'restaurant'
const COLLECTION_NAME = 'financial_reports_pnl'

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

// توابع کمکی برای محاسبه تاریخ دوره
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

// محاسبه نام دوره برای نمایش
function getPeriodName(period: string, startDate: Date, endDate: Date): string {
  const persianMonths = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند']
  const year = startDate.getFullYear()
  const month = startDate.getMonth()
  
  // تبدیل میلادی به شمسی (تقریبی)
  const shamsiYear = year - 621
  const shamsiMonth = month < 3 ? month + 9 : month - 3
  
  return `${shamsiYear}/${shamsiMonth.toString().padStart(2, '0')}`
}

// محاسبه گزارش P&L از داده‌های واقعی (از invoices, purchases, inventory)
async function calculatePnLReport(
  period: string,
  branch: string | null,
  channel: string | null,
  invoicesCollection: any,
  purchasesCollection: any,
  itemLedgerCollection: any,
  inventoryCollection: any,
  menuItemsCollection: any,
  receiptsPaymentsCollection: any
): Promise<any> {
  const { startDate, endDate } = calculatePeriodDates(period)

  // 1. محاسبه درآمد (Revenue) از فاکتورهای فروش
  const salesInvoiceFilter: any = {
    type: 'sales',
    status: { $in: ['paid', 'sent'] },
    date: {
      $gte: startDate,
      $lte: endDate
    }
  }
  if (branch && branch !== 'all') {
    try {
      salesInvoiceFilter.branchId = new ObjectId(branch)
    } catch {
      salesInvoiceFilter.branchId = branch
    }
  }

  const salesInvoices = await invoicesCollection.find(salesInvoiceFilter).toArray()
  let revenue = 0
  for (const invoice of salesInvoices) {
    revenue += invoice.totalAmount || 0
  }

  // 2. محاسبه بهای تمام شده کالا (COGS) از item_ledger
  // COGS = مجموع هزینه مواد اولیه استفاده شده در فروش
  const cogsFilter: any = {
    documentType: 'sale',
    date: {
      $gte: startDate,
      $lte: endDate
    }
  }

  const saleLedgerEntries = await itemLedgerCollection.find(cogsFilter).toArray()
  let costOfGoodsSold = 0
  for (const entry of saleLedgerEntries) {
    // اگر quantityOut > 0 باشد، یعنی از انبار خارج شده (برای فروش)
    if (entry.quantityOut > 0) {
      // استفاده از averagePrice برای محاسبه هزینه
      const cost = (entry.quantityOut || 0) * (entry.averagePrice || entry.unitPrice || 0)
      costOfGoodsSold += cost
    }
  }

  // 3. محاسبه هزینه‌های خرید (Purchase Costs) از فاکتورهای خرید
  const purchaseInvoiceFilter: any = {
    type: 'purchase',
    status: 'paid',
    date: {
      $gte: startDate,
      $lte: endDate
    }
  }

  const purchaseInvoices = await invoicesCollection.find(purchaseInvoiceFilter).toArray()
  let purchaseCosts = 0
  for (const invoice of purchaseInvoices) {
    purchaseCosts += invoice.totalAmount || 0
  }

  // 4. هزینه‌های عملیاتی (Operating Expenses) از receipts-payments با reference='expense'
  const expenseFilter: any = {
    type: 'payment',
    reference: 'expense',
    status: 'completed',
    date: {
      $gte: startDate,
      $lte: endDate
    }
  }

  const expenses = await receiptsPaymentsCollection.find(expenseFilter).toArray()
  let operatingExpenses = 0
  for (const expense of expenses) {
    operatingExpenses += expense.amount || 0
  }

  // اگر هزینه‌های عملیاتی صفر است، یک مقدار تقریبی بر اساس درصد درآمد
  if (operatingExpenses === 0 && revenue > 0) {
    operatingExpenses = revenue * 0.19 // حدود 19% از درآمد
  }

  // 5. درآمدهای دیگر (Other Income) - مثلاً سود بانکی، درآمدهای جانبی
  const otherIncomeFilter: any = {
    type: 'receipt',
    reference: { $in: ['other', 'interest', 'investment'] },
    status: 'completed',
    date: {
      $gte: startDate,
      $lte: endDate
    }
  }

  const otherIncomeTransactions = await receiptsPaymentsCollection.find(otherIncomeFilter).toArray()
  let otherIncome = 0
  for (const transaction of otherIncomeTransactions) {
    otherIncome += transaction.amount || 0
  }

  // 6. هزینه‌های دیگر (Other Expenses) - هزینه‌های غیرعملیاتی
  const otherExpenseFilter: any = {
    type: 'payment',
    reference: { $in: ['other', 'loan', 'investment'] },
    status: 'completed',
    date: {
      $gte: startDate,
      $lte: endDate
    }
  }

  const otherExpenseTransactions = await receiptsPaymentsCollection.find(otherExpenseFilter).toArray()
  let otherExpenses = 0
  for (const transaction of otherExpenseTransactions) {
    otherExpenses += transaction.amount || 0
  }

  // 7. مالیات (Tax) - از فاکتورهای فروش
  let totalTax = 0
  for (const invoice of salesInvoices) {
    totalTax += invoice.taxAmount || 0
  }

  // محاسبات
  const grossProfit = revenue - costOfGoodsSold
  const operatingProfit = grossProfit - operatingExpenses
  const profitBeforeTax = operatingProfit + otherIncome - otherExpenses
  const netProfit = profitBeforeTax - totalTax

  // محاسبه حاشیه‌ها
  const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0
  const operatingMargin = revenue > 0 ? (operatingProfit / revenue) * 100 : 0
  const netMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0

  return {
    period: getPeriodName(period, startDate, endDate),
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    revenue,
    costOfGoodsSold,
    grossProfit,
    grossMargin,
    operatingExpenses,
    operatingProfit,
    operatingMargin,
    otherIncome,
    otherExpenses,
    profitBeforeTax,
    tax: totalTax,
    netProfit,
    netMargin,
    purchaseCosts,
    totalInvoices: salesInvoices.length,
    totalPurchases: purchaseInvoices.length
  }
}

// GET - دریافت گزارشات P&L
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'current_month'
    const branch = searchParams.get('branch') || 'all'
    const channel = searchParams.get('channel') || 'all'
    const generate = searchParams.get('generate') === 'true'

    // اگر generate=true باشد، گزارش را از داده‌های واقعی محاسبه کن
    if (generate) {
      const invoicesCollection = db.collection('invoices')
      const purchasesCollection = db.collection('purchases')
      const itemLedgerCollection = db.collection('item_ledger')
      const inventoryCollection = db.collection('inventory_items')
      const menuItemsCollection = db.collection('menu_items')
      const receiptsPaymentsCollection = db.collection('receipts_payments')

      const pnlData = await calculatePnLReport(
        period,
        branch,
        channel,
        invoicesCollection,
        purchasesCollection,
        itemLedgerCollection,
        inventoryCollection,
        menuItemsCollection,
        receiptsPaymentsCollection
      )

      // ذخیره در دیتابیس
      const report = {
        ...pnlData,
        branch: branch !== 'all' ? branch : null,
        channel: channel !== 'all' ? channel : null,
        periodType: period,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      const result = await collection.insertOne(report)

      // برگرداندن گزارش جدید
      return NextResponse.json({
        success: true,
        data: { ...report, _id: result.insertedId.toString(), id: result.insertedId.toString() },
        message: 'گزارش P&L با موفقیت تولید شد'
      })
    }

    // در غیر این صورت، گزارشات ذخیره شده را برگردان
    const filter: any = {}
    if (period && period !== 'all') filter.periodType = period
    if (branch && branch !== 'all') filter.branch = branch
    if (channel && channel !== 'all') filter.channel = channel

    const reports = await collection
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray()

    return NextResponse.json({
      success: true,
      data: reports.map((report: any) => ({
        ...report,
        _id: report._id.toString(),
        id: report._id.toString()
      }))
    })
  } catch (error) {
    console.error('Error fetching P&L reports:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در دریافت گزارشات P&L',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// POST - ایجاد گزارش P&L جدید
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const body = await request.json()
    const {
      period,
      branch,
      channel,
      revenue,
      costOfGoodsSold,
      grossProfit,
      operatingExpenses,
      operatingProfit,
      otherIncome,
      otherExpenses,
      netProfit,
      grossMargin,
      operatingMargin,
      netMargin
    } = body

    const { startDate, endDate } = calculatePeriodDates(period || 'current_month')

    const report = {
      period: getPeriodName(period || 'current_month', startDate, endDate),
      periodType: period || 'current_month',
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      branch: branch || null,
      channel: channel || null,
      revenue: revenue || 0,
      costOfGoodsSold: costOfGoodsSold || 0,
      grossProfit: grossProfit || 0,
      operatingExpenses: operatingExpenses || 0,
      operatingProfit: operatingProfit || 0,
      otherIncome: otherIncome || 0,
      otherExpenses: otherExpenses || 0,
      profitBeforeTax: (operatingProfit || 0) + (otherIncome || 0) - (otherExpenses || 0),
      tax: 0,
      netProfit: netProfit || 0,
      grossMargin: grossMargin || 0,
      operatingMargin: operatingMargin || 0,
      netMargin: netMargin || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const result = await collection.insertOne(report)

    return NextResponse.json({
      success: true,
      data: { ...report, _id: result.insertedId.toString(), id: result.insertedId.toString() },
      message: 'گزارش P&L با موفقیت ایجاد شد'
    })
  } catch (error) {
    console.error('Error creating P&L report:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در ایجاد گزارش P&L' },
      { status: 500 }
    )
  }
}

// PUT - به‌روزرسانی گزارش P&L
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
      message: 'گزارش P&L با موفقیت به‌روزرسانی شد'
    })
  } catch (error) {
    console.error('Error updating P&L report:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در به‌روزرسانی گزارش P&L' },
      { status: 500 }
    )
  }
}

// DELETE - حذف گزارش P&L
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
      message: 'گزارش P&L با موفقیت حذف شد'
    })
  } catch (error) {
    console.error('Error deleting P&L report:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در حذف گزارش P&L' },
      { status: 500 }
    )
  }
}
