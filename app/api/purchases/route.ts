import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://admin:StrongPassword123@185.204.169.107:27017/restaurant?authSource=admin'
const DB_NAME = 'restaurant'
const COLLECTION_NAME = 'purchases'

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

// GET - دریافت تمام خریدها
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const { searchParams } = new URL(request.url)
    const supplierId = searchParams.get('supplierId')
    const status = searchParams.get('status') // pending, approved, received, cancelled
    const paymentStatus = searchParams.get('paymentStatus') // pending, partial, paid
    const fromDate = searchParams.get('fromDate')
    const toDate = searchParams.get('toDate')
    const sortBy = searchParams.get('sortBy') || 'date'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const limit = parseInt(searchParams.get('limit') || '100')
    const skip = parseInt(searchParams.get('skip') || '0')

    // ساخت فیلتر
    const filter: any = {}
    if (supplierId) filter.supplierId = supplierId
    if (status && status !== 'all') filter.status = status
    if (paymentStatus && paymentStatus !== 'all') filter.paymentStatus = paymentStatus
    
    // فیلتر تاریخ
    if (fromDate || toDate) {
      filter.date = {}
      if (fromDate) filter.date.$gte = new Date(fromDate)
      if (toDate) filter.date.$lte = new Date(toDate)
    }

    // ساخت مرتب‌سازی
    const sort: any = {}
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1

    const purchases = await collection
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
          totalPurchases: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' },
          totalPaidAmount: { $sum: '$paidAmount' },
          totalPendingAmount: { $sum: { $subtract: ['$totalAmount', '$paidAmount'] } },
          pendingPurchases: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          approvedPurchases: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
          receivedPurchases: { $sum: { $cond: [{ $eq: ['$status', 'received'] }, 1, 0] } },
          cancelledPurchases: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } }
        }
      }
    ]).toArray()

    return NextResponse.json({
      success: true,
      data: purchases,
      stats: stats[0] || {
        totalPurchases: 0,
        totalAmount: 0,
        totalPaidAmount: 0,
        totalPendingAmount: 0,
        pendingPurchases: 0,
        approvedPurchases: 0,
        receivedPurchases: 0,
        cancelledPurchases: 0
      },
      pagination: {
        limit,
        skip,
        total: await collection.countDocuments(filter)
      }
    })
  } catch (error) {
    console.error('Error fetching purchases:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت خریدها' },
      { status: 500 }
    )
  }
}

// POST - ایجاد خرید جدید
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const body = await request.json()
    
    // تولید شماره فاکتور خرید
    const invoiceNumber = await generatePurchaseInvoiceNumber()
    
    const purchase = {
      invoiceNumber,
      supplierId: body.supplierId,
      supplierName: body.supplierName,
      supplierPhone: body.supplierPhone,
      supplierAddress: body.supplierAddress,
      date: new Date(body.date || new Date()),
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      items: body.items || [],
      subtotal: body.subtotal || 0,
      taxAmount: body.taxAmount || 0,
      discountAmount: body.discountAmount || 0,
      totalAmount: body.totalAmount || 0,
      paidAmount: body.paidAmount || 0,
      status: body.status || 'pending', // pending, approved, received, cancelled
      paymentStatus: body.paymentStatus || 'pending', // pending, partial, paid
      paymentMethod: body.paymentMethod || 'credit', // cash, card, bank_transfer, credit, check
      notes: body.notes || '',
      receivedDate: body.receivedDate ? new Date(body.receivedDate) : null,
      receivedBy: body.receivedBy || null,
      approvedBy: body.approvedBy || null,
      approvedDate: body.approvedDate ? new Date(body.approvedDate) : null,
      createdBy: body.createdBy || 'system',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const result = await collection.insertOne(purchase)
    
    return NextResponse.json({
      success: true,
      data: { ...purchase, _id: result.insertedId },
      message: 'خرید با موفقیت ثبت شد'
    })
  } catch (error) {
    console.error('Error creating purchase:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در ثبت خرید' },
      { status: 500 }
    )
  }
}

// DELETE - حذف خرید
export async function DELETE(request: NextRequest) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'شناسه خرید اجباری است' },
        { status: 400 }
      )
    }

    const result = await collection.deleteOne({ _id: new ObjectId(id) })
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'خرید یافت نشد' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'خرید با موفقیت حذف شد'
    })
  } catch (error) {
    console.error('Error deleting purchase:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در حذف خرید' },
      { status: 500 }
    )
  }
}

// تابع تولید شماره فاکتور خرید
async function generatePurchaseInvoiceNumber(): Promise<string> {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    
    // شمارش خریدهای امروز
    const startOfDay = new Date(year, today.getMonth(), today.getDate())
    const endOfDay = new Date(year, today.getMonth(), today.getDate() + 1)
    
    const count = await collection.countDocuments({
      createdAt: {
        $gte: startOfDay.toISOString(),
        $lt: endOfDay.toISOString()
      }
    })
    
    const sequence = String(count + 1).padStart(4, '0')
    return `PINV-${year}${month}${day}-${sequence}`
  } catch (error) {
    console.error('Error generating purchase invoice number:', error)
    return `PINV-${Date.now()}`
  }
}

