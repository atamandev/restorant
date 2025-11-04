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

// GET - دریافت تمام فاکتورها (با اتصال به منابع دیگر)
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()
    const invoicesCollection = db.collection(COLLECTION_NAME)
    const receiptsPaymentsCollection = db.collection('receipts_payments')
    const customersCollection = db.collection('customers')
    const suppliersCollection = db.collection('suppliers')
    
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // sales, purchase
    const status = searchParams.get('status') // draft, sent, paid, overdue, cancelled
    const customerId = searchParams.get('customerId')
    const supplierId = searchParams.get('supplierId')
    const branchId = searchParams.get('branchId')
    const cashierSessionId = searchParams.get('cashierSessionId')
    const fromDate = searchParams.get('fromDate')
    const toDate = searchParams.get('toDate')
    const sortBy = searchParams.get('sortBy') || 'date'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const limit = parseInt(searchParams.get('limit') || '100')
    const skip = parseInt(searchParams.get('skip') || '0')
    const includeRelated = searchParams.get('includeRelated') === 'true' // شامل اطلاعات مشتری/تامین‌کننده و تراکنش‌ها

    // ساخت فیلتر
    const filter: any = {}
    if (type && type !== 'all') filter.type = type
    if (status && status !== 'all') filter.status = status
    if (customerId) {
      try {
        filter.customerId = new ObjectId(customerId)
      } catch {
        filter.customerId = customerId
      }
    }
    if (supplierId) {
      try {
        filter.supplierId = new ObjectId(supplierId)
      } catch {
        filter.supplierId = supplierId
      }
    }
    if (branchId) {
      try {
        filter.branchId = new ObjectId(branchId)
      } catch {
        filter.branchId = branchId
      }
    }
    if (cashierSessionId) {
      try {
        filter.cashierSessionId = new ObjectId(cashierSessionId)
      } catch {
        filter.cashierSessionId = cashierSessionId
      }
    }
    
    // فیلتر تاریخ
    if (fromDate || toDate) {
      filter.date = {}
      if (fromDate) filter.date.$gte = new Date(fromDate)
      if (toDate) filter.date.$lte = new Date(toDate)
    }

    // ساخت مرتب‌سازی
    const sort: any = {}
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1

    const invoices = await invoicesCollection
      .find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .toArray()

    // اگر includeRelated=true باشد، اطلاعات مرتبط را هم بیاور
    if (includeRelated) {
      for (const invoice of invoices) {
        // اطلاعات مشتری/تامین‌کننده
        if (invoice.customerId) {
          try {
            const customer = await customersCollection.findOne({ _id: new ObjectId(invoice.customerId) })
            invoice.customer = customer || null
          } catch {
            invoice.customer = null
          }
        }
        if (invoice.supplierId) {
          try {
            const supplier = await suppliersCollection.findOne({ _id: new ObjectId(invoice.supplierId) })
            invoice.supplier = supplier || null
          } catch {
            invoice.supplier = null
          }
        }

        // تراکنش‌های مرتبط (receipts/payments)
        const relatedTransactions = await receiptsPaymentsCollection.find({
          reference: 'invoice',
          referenceId: invoice.invoiceNumber || invoice._id.toString()
        }).toArray()
        invoice.transactions = relatedTransactions
      }
    }

    // آمار کلی
    const stats = await invoicesCollection.aggregate([
      {
        $group: {
          _id: null,
          totalInvoices: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' },
          totalPaidAmount: { $sum: '$paidAmount' },
          totalPendingAmount: { $sum: { $subtract: ['$totalAmount', '$paidAmount'] } },
          salesInvoices: { $sum: { $cond: [{ $eq: ['$type', 'sales'] }, 1, 0] } },
          purchaseInvoices: { $sum: { $cond: [{ $eq: ['$type', 'purchase'] }, 1, 0] } },
          salesAmount: { $sum: { $cond: [{ $eq: ['$type', 'sales'] }, '$totalAmount', 0] } },
          purchaseAmount: { $sum: { $cond: [{ $eq: ['$type', 'purchase'] }, '$totalAmount', 0] } },
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
        salesAmount: 0,
        purchaseAmount: 0,
        draftInvoices: 0,
        sentInvoices: 0,
        paidInvoices: 0,
        overdueInvoices: 0,
        cancelledInvoices: 0
      },
      pagination: {
        limit,
        skip,
        total: await invoicesCollection.countDocuments(filter)
      }
    })
  } catch (error) {
    console.error('Error fetching invoices:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در دریافت فاکتورها',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// POST - ایجاد فاکتور جدید (از POS یا Inventory)
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()
    const invoicesCollection = db.collection(COLLECTION_NAME)
    const receiptsPaymentsCollection = db.collection('receipts_payments')
    
    const body = await request.json()
    
    // اگر invoiceNumber داده نشده، تولید کن
    const invoiceNumber = body.invoiceNumber || await generateInvoiceNumber(body.type || 'sales')
    
    const invoice = {
      invoiceNumber,
      type: body.type || 'sales', // sales, purchase
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
      branchId: body.branchId ? (typeof body.branchId === 'string' ? new ObjectId(body.branchId) : body.branchId) : null,
      cashRegisterId: body.cashRegisterId ? (typeof body.cashRegisterId === 'string' ? new ObjectId(body.cashRegisterId) : body.cashRegisterId) : null,
      cashierSessionId: body.cashierSessionId ? (typeof body.cashierSessionId === 'string' ? new ObjectId(body.cashierSessionId) : body.cashierSessionId) : null,
      orderId: body.orderId || null,
      orderNumber: body.orderNumber || null,
      purchaseId: body.purchaseId || null,
      createdBy: body.createdBy || 'system',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const result = await invoicesCollection.insertOne(invoice)
    const invoiceId = result.insertedId

    // اگر status='paid' و paidAmount > 0 است، تراکنش receipt/payment ایجاد کن
    if (invoice.status === 'paid' && invoice.paidAmount > 0) {
      const transactionNumber = await generateTransactionNumber(invoice.type === 'sales' ? 'receipt' : 'payment')
      const transaction = {
        transactionNumber,
        type: invoice.type === 'sales' ? 'receipt' : 'payment',
        amount: invoice.paidAmount,
        method: invoice.paymentMethod,
        status: 'completed',
        personId: invoice.type === 'sales' ? invoice.customerId : invoice.supplierId,
        personName: invoice.type === 'sales' ? invoice.customerName : invoice.supplierName,
        personType: invoice.type === 'sales' ? 'customer' : 'supplier',
        reference: 'invoice',
        referenceId: invoiceNumber,
        description: `${invoice.type === 'sales' ? 'دریافت' : 'پرداخت'} بابت فاکتور ${invoiceNumber}`,
        date: new Date(),
        bankAccountId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      await receiptsPaymentsCollection.insertOne(transaction)
    }
    
    return NextResponse.json({
      success: true,
      data: { ...invoice, _id: invoiceId },
      message: 'فاکتور با موفقیت ثبت شد' + (invoice.status === 'paid' ? ' و تراکنش مالی ثبت شد' : '')
    })
  } catch (error) {
    console.error('Error creating invoice:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در ثبت فاکتور',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// PUT - به‌روزرسانی فاکتور (مثلاً تغییر وضعیت به paid)
export async function PUT(request: NextRequest) {
  try {
    await connectToDatabase()
    const invoicesCollection = db.collection(COLLECTION_NAME)
    const receiptsPaymentsCollection = db.collection('receipts_payments')
    
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'شناسه فاکتور اجباری است' },
        { status: 400 }
      )
    }

    const currentInvoice = await invoicesCollection.findOne({ _id: new ObjectId(id) })
    if (!currentInvoice) {
      return NextResponse.json(
        { success: false, message: 'فاکتور یافت نشد' },
        { status: 404 }
      )
    }

    const oldStatus = currentInvoice.status
    const newStatus = updateData.status

    const updateFields: any = {
      updatedAt: new Date().toISOString()
    }

    // Update fields
    if (updateData.status !== undefined) updateFields.status = updateData.status
    if (updateData.paidAmount !== undefined) updateFields.paidAmount = Number(updateData.paidAmount)
    if (updateData.paymentMethod !== undefined) updateFields.paymentMethod = updateData.paymentMethod
    if (updateData.notes !== undefined) updateFields.notes = updateData.notes
    if (updateData.terms !== undefined) updateFields.terms = updateData.terms

    // اگر وضعیت به 'paid' تغییر کرد و قبلاً paid نبوده، تراکنش ایجاد کن
    if (oldStatus !== 'paid' && newStatus === 'paid' && currentInvoice.totalAmount > 0) {
      updateFields.paidDate = new Date().toISOString()
      updateFields.paidAmount = updateData.paidAmount !== undefined ? Number(updateData.paidAmount) : currentInvoice.totalAmount

      // بررسی اینکه آیا تراکنش قبلاً ثبت شده
      const existingTransaction = await receiptsPaymentsCollection.findOne({
        reference: 'invoice',
        referenceId: currentInvoice.invoiceNumber
      })

      if (!existingTransaction) {
        const transactionNumber = await generateTransactionNumber(currentInvoice.type === 'sales' ? 'receipt' : 'payment')
        const transaction = {
          transactionNumber,
          type: currentInvoice.type === 'sales' ? 'receipt' : 'payment',
          amount: updateFields.paidAmount,
          method: updateFields.paymentMethod || currentInvoice.paymentMethod || 'cash',
          status: 'completed',
          personId: currentInvoice.type === 'sales' ? currentInvoice.customerId : currentInvoice.supplierId,
          personName: currentInvoice.type === 'sales' ? currentInvoice.customerName : currentInvoice.supplierName,
          personType: currentInvoice.type === 'sales' ? 'customer' : 'supplier',
          reference: 'invoice',
          referenceId: currentInvoice.invoiceNumber,
          description: `${currentInvoice.type === 'sales' ? 'دریافت' : 'پرداخت'} بابت فاکتور ${currentInvoice.invoiceNumber}`,
          date: new Date(),
          bankAccountId: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }

        await receiptsPaymentsCollection.insertOne(transaction)
      }
    }

    await invoicesCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    )

    const updatedInvoice = await invoicesCollection.findOne({ _id: new ObjectId(id) })
    
    return NextResponse.json({
      success: true,
      data: updatedInvoice,
      message: 'فاکتور با موفقیت به‌روزرسانی شد'
    })
  } catch (error) {
    console.error('Error updating invoice:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در به‌روزرسانی فاکتور',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// DELETE - حذف فاکتور
export async function DELETE(request: NextRequest) {
  try {
    await connectToDatabase()
    const invoicesCollection = db.collection(COLLECTION_NAME)
    const receiptsPaymentsCollection = db.collection('receipts_payments')
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'شناسه فاکتور اجباری است' },
        { status: 400 }
      )
    }

    const invoice = await invoicesCollection.findOne({ _id: new ObjectId(id) })
    if (!invoice) {
      return NextResponse.json(
        { success: false, message: 'فاکتور یافت نشد' },
        { status: 404 }
      )
    }

    // اگر فاکتور پرداخت شده، تراکنش مرتبط را هم حذف کن
    if (invoice.status === 'paid') {
      await receiptsPaymentsCollection.deleteMany({
        reference: 'invoice',
        referenceId: invoice.invoiceNumber
      })
    }

    const result = await invoicesCollection.deleteOne({ _id: new ObjectId(id) })
    
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

// تابع تولید شماره تراکنش
async function generateTransactionNumber(type: string): Promise<string> {
  try {
    await connectToDatabase()
    const collection = db.collection('receipts_payments')
    
    const prefix = type === 'receipt' ? 'REC' : 'PAY'
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    
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
    return `${prefix}-${year}${month}${day}-${sequence}`
  } catch (error) {
    console.error('Error generating transaction number:', error)
    return `${type === 'receipt' ? 'REC' : 'PAY'}-${Date.now()}`
  }
}
