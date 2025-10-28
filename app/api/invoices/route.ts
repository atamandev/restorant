import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://restorenUser:1234@localhost:27017/restoren'
const DB_NAME = 'restoren'
const COLLECTION_NAME = 'invoices'

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

// GET - دریافت تمام فاکتورها
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // sales, purchase
    const status = searchParams.get('status') // draft, sent, paid, overdue, cancelled
    const customerId = searchParams.get('customerId')
    const supplierId = searchParams.get('supplierId')
    const fromDate = searchParams.get('fromDate')
    const toDate = searchParams.get('toDate')
    const sortBy = searchParams.get('sortBy') || 'date'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const limit = parseInt(searchParams.get('limit') || '100')
    const skip = parseInt(searchParams.get('skip') || '0')

    // ساخت فیلتر
    const filter: any = {}
    if (type && type !== 'all') filter.type = type
    if (status && status !== 'all') filter.status = status
    if (customerId) filter.customerId = customerId
    if (supplierId) filter.supplierId = supplierId
    
    // فیلتر تاریخ
    if (fromDate || toDate) {
      filter.date = {}
      if (fromDate) filter.date.$gte = new Date(fromDate)
      if (toDate) filter.date.$lte = new Date(toDate)
    }

    // ساخت مرتب‌سازی
    const sort: any = {}
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1

    const invoices = await collection
      .find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .toArray()

    // آمار کلی
    const stats = await collection.aggregate([
      {
        $group: {
          _id: null,
          totalInvoices: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' },
          totalPaidAmount: { $sum: '$paidAmount' },
          totalPendingAmount: { $sum: { $subtract: ['$totalAmount', '$paidAmount'] } },
          salesInvoices: { $sum: { $cond: [{ $eq: ['$type', 'sales'] }, 1, 0] } },
          purchaseInvoices: { $sum: { $cond: [{ $eq: ['$type', 'purchase'] }, 1, 0] } },
          draftInvoices: { $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] } },
          sentInvoices: { $sum: { $cond: [{ $eq: ['$status', 'sent'] }, 1, 0] } },
          paidInvoices: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] } },
          overdueInvoices: { $sum: { $cond: [{ $eq: ['$status', 'overdue'] }, 1, 0] } },
          cancelledInvoices: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } }
        }
      }
    ]).toArray()

    return NextResponse.json({
      success: true,
      data: invoices,
      stats: stats[0] || {
        totalInvoices: 0,
        totalAmount: 0,
        totalPaidAmount: 0,
        totalPendingAmount: 0,
        salesInvoices: 0,
        purchaseInvoices: 0,
        draftInvoices: 0,
        sentInvoices: 0,
        paidInvoices: 0,
        overdueInvoices: 0,
        cancelledInvoices: 0
      },
      pagination: {
        limit,
        skip,
        total: await collection.countDocuments(filter)
      }
    })
  } catch (error) {
    console.error('Error fetching invoices:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت فاکتورها' },
      { status: 500 }
    )
  }
}

// POST - ایجاد فاکتور جدید
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const body = await request.json()
    
    // تولید شماره فاکتور
    const invoiceNumber = await generateInvoiceNumber(body.type)
    
    const invoice = {
      invoiceNumber,
      type: body.type, // sales, purchase
      customerId: body.customerId || null,
      customerName: body.customerName || '',
      customerPhone: body.customerPhone || '',
      customerAddress: body.customerAddress || '',
      supplierId: body.supplierId || null,
      supplierName: body.supplierName || '',
      supplierPhone: body.supplierPhone || '',
      supplierAddress: body.supplierAddress || '',
      date: new Date(body.date || new Date()),
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      items: body.items || [],
      subtotal: body.subtotal || 0,
      taxAmount: body.taxAmount || 0,
      discountAmount: body.discountAmount || 0,
      totalAmount: body.totalAmount || 0,
      paidAmount: body.paidAmount || 0,
      status: body.status || 'draft', // draft, sent, paid, overdue, cancelled
      paymentMethod: body.paymentMethod || 'cash', // cash, card, bank_transfer, credit, check
      notes: body.notes || '',
      terms: body.terms || '',
      sentDate: body.sentDate ? new Date(body.sentDate) : null,
      paidDate: body.paidDate ? new Date(body.paidDate) : null,
      createdBy: body.createdBy || 'system',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const result = await collection.insertOne(invoice)
    
    return NextResponse.json({
      success: true,
      data: { ...invoice, _id: result.insertedId },
      message: 'فاکتور با موفقیت ثبت شد'
    })
  } catch (error) {
    console.error('Error creating invoice:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در ثبت فاکتور' },
      { status: 500 }
    )
  }
}

// DELETE - حذف فاکتور
export async function DELETE(request: NextRequest) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'شناسه فاکتور اجباری است' },
        { status: 400 }
      )
    }

    const result = await collection.deleteOne({ _id: new ObjectId(id) })
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'فاکتور یافت نشد' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'فاکتور با موفقیت حذف شد'
    })
  } catch (error) {
    console.error('Error deleting invoice:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در حذف فاکتور' },
      { status: 500 }
    )
  }
}

// تابع تولید شماره فاکتور
async function generateInvoiceNumber(type: string): Promise<string> {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    
    // شمارش فاکتورهای امروز بر اساس نوع
    const startOfDay = new Date(year, today.getMonth(), today.getDate())
    const endOfDay = new Date(year, today.getMonth(), today.getDate() + 1)
    
    const count = await collection.countDocuments({
      type: type,
      createdAt: {
        $gte: startOfDay.toISOString(),
        $lt: endOfDay.toISOString()
      }
    })
    
    const sequence = String(count + 1).padStart(4, '0')
    const prefix = type === 'sales' ? 'SINV' : 'PINV'
    return `${prefix}-${year}${month}${day}-${sequence}`
  } catch (error) {
    console.error('Error generating invoice number:', error)
    return `${type === 'sales' ? 'SINV' : 'PINV'}-${Date.now()}`
  }
}
