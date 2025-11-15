import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://admin:StrongPassword123@185.204.169.107:27017/restaurant?authSource=admin'
const DB_NAME = 'restaurant'
const COLLECTION_NAME = 'financial_reports_aging'

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

// محاسبه مانده اشخاص از داده‌های واقعی
async function calculateAgingReport(
  customersCollection: any,
  invoicesCollection: any,
  receiptsPaymentsCollection: any
): Promise<any[]> {
  const customers = await customersCollection.find({}).toArray()
  const agingData: any[] = []

  for (const customer of customers) {
    // دریافت فاکتورهای پرداخت نشده
    const unpaidInvoices = await invoicesCollection.find({
      customerId: customer._id.toString(),
      status: { $in: ['pending', 'partial'] }
    }).toArray()

    let totalBalance = 0
    let current = 0
    let days30 = 0
    let days60 = 0
    let days90 = 0
    let over90 = 0
    let lastPaymentDate = ''

    // دریافت آخرین پرداخت
    const lastPayment = await receiptsPaymentsCollection.findOne({
      customerId: customer._id.toString(),
      type: 'receipt'
    }, { sort: { date: -1 } })

    if (lastPayment) {
      lastPaymentDate = lastPayment.date
    }

    const now = new Date()

    for (const invoice of unpaidInvoices) {
      const invoiceDate = new Date(invoice.createdAt || invoice.date)
      const daysDiff = Math.floor((now.getTime() - invoiceDate.getTime()) / (1000 * 60 * 60 * 24))
      const balance = invoice.totalAmount - (invoice.paidAmount || 0)

      totalBalance += balance

      if (daysDiff <= 30) {
        current += balance
      } else if (daysDiff <= 60) {
        days30 += balance
      } else if (daysDiff <= 90) {
        days60 += balance
      } else if (daysDiff <= 120) {
        days90 += balance
      } else {
        over90 += balance
      }
    }

    if (totalBalance > 0 || lastPayment) {
      agingData.push({
        customerId: customer._id.toString(),
        customerName: customer.name || customer.firstName + ' ' + customer.lastName,
        totalBalance,
        current,
        days30,
        days60,
        days90,
        over90,
        lastPaymentDate: lastPaymentDate || '-',
        creditLimit: customer.creditLimit || 0
      })
    }
  }

  return agingData
}

// GET - دریافت گزارش مانده اشخاص
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const { searchParams } = new URL(request.url)
    const generate = searchParams.get('generate') === 'true'
    const search = searchParams.get('search') || ''

    if (generate) {
      // محاسبه از داده‌های واقعی
      const customersCollection = db.collection('customers')
      const invoicesCollection = db.collection('invoices')
      const receiptsPaymentsCollection = db.collection('receipts_payments')

      const agingData = await calculateAgingReport(
        customersCollection,
        invoicesCollection,
        receiptsPaymentsCollection
      )

      // ذخیره در دیتابیس
      const report = {
        data: agingData,
        generatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      const result = await collection.insertOne(report)

      // فیلتر بر اساس جستجو
      let filteredData = agingData
      if (search) {
        filteredData = agingData.filter((item: any) =>
          item.customerName.toLowerCase().includes(search.toLowerCase())
        )
      }

      return NextResponse.json({
        success: true,
        data: filteredData,
        reportId: result.insertedId.toString(),
        message: 'گزارش مانده اشخاص با موفقیت تولید شد'
      })
    }

    // دریافت گزارشات ذخیره شده
    const reports = await collection
      .find({})
      .sort({ createdAt: -1 })
      .limit(1)
      .toArray()

    if (reports.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        message: 'هیچ گزارشی یافت نشد'
      })
    }

    let data = reports[0].data || []
    
    // فیلتر بر اساس جستجو
    if (search) {
      data = data.filter((item: any) =>
        item.customerName.toLowerCase().includes(search.toLowerCase())
      )
    }

    return NextResponse.json({
      success: true,
      data: data.map((item: any) => ({
        ...item,
        id: item.customerId || item._id?.toString() || Math.random().toString()
      }))
    })
  } catch (error) {
    console.error('Error fetching aging report:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت گزارش مانده اشخاص' },
      { status: 500 }
    )
  }
}

// POST - ایجاد گزارش مانده اشخاص جدید
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const body = await request.json()
    const { data } = body

    const report = {
      data: data || [],
      generatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const result = await collection.insertOne(report)

    return NextResponse.json({
      success: true,
      data: { ...report, _id: result.insertedId.toString(), id: result.insertedId.toString() },
      message: 'گزارش مانده اشخاص با موفقیت ایجاد شد'
    })
  } catch (error) {
    console.error('Error creating aging report:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در ایجاد گزارش مانده اشخاص' },
      { status: 500 }
    )
  }
}

