import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://admin:StrongPassword123@185.204.169.107:27017/restaurant?authSource=admin'
const DB_NAME = 'restaurant'
const COLLECTION_NAME = 'receipts_payments'

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

// GET - دریافت تمام تراکنش‌های دریافت و پرداخت (با اتصال به منابع)
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()
    const transactionsCollection = db.collection(COLLECTION_NAME)
    const invoicesCollection = db.collection('invoices')
    const purchasesCollection = db.collection('purchases')
    const customersCollection = db.collection('customers')
    const suppliersCollection = db.collection('suppliers')
    const bankAccountsCollection = db.collection('bank_accounts')
    
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // receipt, payment
    const method = searchParams.get('method') // cash, card, bank_transfer, credit, check
    const status = searchParams.get('status') // pending, completed, cancelled
    const personId = searchParams.get('personId')
    const reference = searchParams.get('reference') // invoice, purchase, prepayment, deposit, expense
    const referenceId = searchParams.get('referenceId')
    const fromDate = searchParams.get('fromDate')
    const toDate = searchParams.get('toDate')
    const sortBy = searchParams.get('sortBy') || 'date'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const limit = parseInt(searchParams.get('limit') || '100')
    const skip = parseInt(searchParams.get('skip') || '0')
    const includeRelated = searchParams.get('includeRelated') === 'true' // شامل اطلاعات مرجع (invoice, purchase, etc)

    // ساخت فیلتر
    const filter: any = {}
    if (type && type !== 'all') filter.type = type
    if (method && method !== 'all') filter.method = method
    if (status && status !== 'all') filter.status = status
    if (personId) {
      try {
        filter.personId = new ObjectId(personId)
      } catch {
        filter.personId = personId
      }
    }
    if (reference && reference !== 'all') filter.reference = reference
    if (referenceId) filter.referenceId = referenceId
    
    // فیلتر تاریخ
    if (fromDate || toDate) {
      filter.date = {}
      if (fromDate) filter.date.$gte = new Date(fromDate)
      if (toDate) filter.date.$lte = new Date(toDate)
    }

    // ساخت مرتب‌سازی
    const sort: any = {}
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1

    const transactions = await transactionsCollection
      .find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .toArray()

    // اگر includeRelated=true باشد، اطلاعات مرجع را هم بیاور
    if (includeRelated) {
      for (const transaction of transactions) {
        // اطلاعات invoice
        if (transaction.reference === 'invoice' && transaction.referenceId) {
          const invoice = await invoicesCollection.findOne({ 
            invoiceNumber: transaction.referenceId 
          })
          transaction.invoice = invoice || null
        }

        // اطلاعات purchase
        if (transaction.reference === 'purchase' && transaction.referenceId) {
          const purchase = await purchasesCollection.findOne({ 
            invoiceNumber: transaction.referenceId 
          })
          transaction.purchase = purchase || null
        }

        // اطلاعات person
        if (transaction.personId) {
          if (transaction.personType === 'customer') {
            try {
              const customer = await customersCollection.findOne({ _id: new ObjectId(transaction.personId) })
              transaction.person = customer || null
            } catch {
              transaction.person = null
            }
          } else if (transaction.personType === 'supplier') {
            try {
              const supplier = await suppliersCollection.findOne({ _id: new ObjectId(transaction.personId) })
              transaction.person = supplier || null
            } catch {
              transaction.person = null
            }
          }
        }

        // اطلاعات حساب بانکی
        if (transaction.bankAccountId) {
          try {
            const bankAccount = await bankAccountsCollection.findOne({ _id: new ObjectId(transaction.bankAccountId) })
            transaction.bankAccount = bankAccount || null
          } catch {
            transaction.bankAccount = null
          }
        }
      }
    }

    // آمار کلی
    const stats = await transactionsCollection.aggregate([
      {
        $group: {
          _id: null,
          totalTransactions: { $sum: 1 },
          totalReceipts: { $sum: { $cond: [{ $eq: ['$type', 'receipt'] }, 1, 0] } },
          totalPayments: { $sum: { $cond: [{ $eq: ['$type', 'payment'] }, 1, 0] } },
          totalReceiptAmount: { $sum: { $cond: [{ $eq: ['$type', 'receipt'] }, '$amount', 0] } },
          totalPaymentAmount: { $sum: { $cond: [{ $eq: ['$type', 'payment'] }, '$amount', 0] } },
          netAmount: { $sum: { $cond: [{ $eq: ['$type', 'receipt'] }, '$amount', { $multiply: ['$amount', -1] }] } },
          pendingTransactions: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          completedTransactions: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          cashTransactions: { $sum: { $cond: [{ $eq: ['$method', 'cash'] }, 1, 0] } },
          cardTransactions: { $sum: { $cond: [{ $eq: ['$method', 'card'] }, 1, 0] } },
          bankTransferTransactions: { $sum: { $cond: [{ $eq: ['$method', 'bank_transfer'] }, 1, 0] } },
          chequeTransactions: { $sum: { $cond: [{ $eq: ['$method', 'check'] }, 1, 0] } }
        }
      }
    ]).toArray()

    return NextResponse.json({
      success: true,
      data: transactions,
      stats: stats[0] || {
        totalTransactions: 0,
        totalReceipts: 0,
        totalPayments: 0,
        totalReceiptAmount: 0,
        totalPaymentAmount: 0,
        netAmount: 0,
        pendingTransactions: 0,
        completedTransactions: 0,
        cashTransactions: 0,
        cardTransactions: 0,
        bankTransferTransactions: 0,
        chequeTransactions: 0
      },
      pagination: {
        limit,
        skip,
        total: await transactionsCollection.countDocuments(filter)
      }
    })
  } catch (error) {
    console.error('Error fetching receipts/payments:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در دریافت تراکنش‌ها',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// POST - ایجاد تراکنش جدید (از invoices, purchases, یا دستی)
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()
    const transactionsCollection = db.collection(COLLECTION_NAME)
    const invoicesCollection = db.collection('invoices')
    const purchasesCollection = db.collection('purchases')
    
    const body = await request.json()
    
    // تولید شماره تراکنش
    const transactionNumber = body.transactionNumber || await generateTransactionNumber(body.type)
    
    // بررسی اینکه آیا تراکنش برای invoice/purchase است و آیا باید invoice/purchase را به‌روزرسانی کنیم
    let shouldUpdateInvoice = false
    let shouldUpdatePurchase = false
    
    if (body.reference === 'invoice' && body.referenceId) {
      const invoice = await invoicesCollection.findOne({ 
        invoiceNumber: body.referenceId 
      })
      if (invoice && invoice.status !== 'paid' && body.status === 'completed') {
        shouldUpdateInvoice = true
      }
    }

    if (body.reference === 'purchase' && body.referenceId) {
      const purchase = await purchasesCollection.findOne({ 
        invoiceNumber: body.referenceId 
      })
      if (purchase && purchase.paymentStatus !== 'paid' && body.status === 'completed') {
        shouldUpdatePurchase = true
      }
    }
    
    const transaction = {
      transactionNumber,
      type: body.type, // receipt, payment
      amount: Number(body.amount),
      method: body.method || 'cash', // cash, card, bank_transfer, credit, check
      status: body.status || 'pending',
      personId: body.personId || null,
      personName: body.personName || '',
      personType: body.personType || null, // customer, supplier, employee
      reference: body.reference || null, // invoice, purchase, prepayment, deposit, expense, cashier_session
      referenceId: body.referenceId || null,
      description: body.description || '',
      notes: body.notes || '',
      date: new Date(body.date || new Date()),
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      bankAccountId: body.bankAccountId ? (typeof body.bankAccountId === 'string' ? new ObjectId(body.bankAccountId) : body.bankAccountId) : null,
      checkNumber: body.checkNumber || null,
      checkBank: body.checkBank || null,
      checkDueDate: body.checkDueDate ? new Date(body.checkDueDate) : null,
      cashierSessionId: body.cashierSessionId ? (typeof body.cashierSessionId === 'string' ? new ObjectId(body.cashierSessionId) : body.cashierSessionId) : null,
      createdBy: body.createdBy || 'system',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const result = await transactionsCollection.insertOne(transaction)

    // به‌روزرسانی invoice/purchase اگر لازم است
    if (shouldUpdateInvoice) {
      const invoice = await invoicesCollection.findOne({ invoiceNumber: body.referenceId })
      if (invoice) {
        const newPaidAmount = (invoice.paidAmount || 0) + Number(body.amount)
        const isFullyPaid = newPaidAmount >= invoice.totalAmount
        
        await invoicesCollection.updateOne(
          { invoiceNumber: body.referenceId },
          {
            $set: {
              paidAmount: newPaidAmount,
              status: isFullyPaid ? 'paid' : invoice.status,
              paidDate: isFullyPaid ? new Date().toISOString() : invoice.paidDate,
              updatedAt: new Date().toISOString()
            }
          }
        )
      }
    }

    if (shouldUpdatePurchase) {
      const purchase = await purchasesCollection.findOne({ invoiceNumber: body.referenceId })
      if (purchase) {
        const newPaidAmount = (purchase.paidAmount || 0) + Number(body.amount)
        const isFullyPaid = newPaidAmount >= purchase.totalAmount
        
        await purchasesCollection.updateOne(
          { invoiceNumber: body.referenceId },
          {
            $set: {
              paidAmount: newPaidAmount,
              paymentStatus: isFullyPaid ? 'paid' : (newPaidAmount > 0 ? 'partial' : 'pending'),
              updatedAt: new Date().toISOString()
            }
          }
        )
      }
    }
    
    return NextResponse.json({
      success: true,
      data: { ...transaction, _id: result.insertedId },
      message: 'تراکنش با موفقیت ثبت شد' + (shouldUpdateInvoice || shouldUpdatePurchase ? ' و فاکتور/خرید به‌روزرسانی شد' : '')
    })
  } catch (error) {
    console.error('Error creating transaction:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در ثبت تراکنش',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// PUT - به‌روزرسانی تراکنش
export async function PUT(request: NextRequest) {
  try {
    await connectToDatabase()
    const transactionsCollection = db.collection(COLLECTION_NAME)
    
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'شناسه تراکنش اجباری است' },
        { status: 400 }
      )
    }

    const updateFields: any = {
      updatedAt: new Date().toISOString()
    }

    if (updateData.status !== undefined) updateFields.status = updateData.status
    if (updateData.amount !== undefined) updateFields.amount = Number(updateData.amount)
    if (updateData.method !== undefined) updateFields.method = updateData.method
    if (updateData.description !== undefined) updateFields.description = updateData.description
    if (updateData.notes !== undefined) updateFields.notes = updateData.notes
    if (updateData.date !== undefined) updateFields.date = new Date(updateData.date)
    if (updateData.bankAccountId !== undefined) {
      updateFields.bankAccountId = updateData.bankAccountId ? (typeof updateData.bankAccountId === 'string' ? new ObjectId(updateData.bankAccountId) : updateData.bankAccountId) : null
    }

    const result = await transactionsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'تراکنش یافت نشد' },
        { status: 404 }
      )
    }

    const updatedTransaction = await transactionsCollection.findOne({ _id: new ObjectId(id) })

    return NextResponse.json({
      success: true,
      data: updatedTransaction,
      message: 'تراکنش با موفقیت به‌روزرسانی شد'
    })
  } catch (error) {
    console.error('Error updating transaction:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در به‌روزرسانی تراکنش',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// DELETE - حذف تراکنش
export async function DELETE(request: NextRequest) {
  try {
    await connectToDatabase()
    const transactionsCollection = db.collection(COLLECTION_NAME)
    const invoicesCollection = db.collection('invoices')
    const purchasesCollection = db.collection('purchases')
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'شناسه تراکنش اجباری است' },
        { status: 400 }
      )
    }

    const transaction = await transactionsCollection.findOne({ _id: new ObjectId(id) })
    if (!transaction) {
      return NextResponse.json(
        { success: false, message: 'تراکنش یافت نشد' },
        { status: 404 }
      )
    }

    // اگر تراکنش مربوط به invoice/purchase است و status=completed است، invoice/purchase را به‌روزرسانی کن
    if (transaction.status === 'completed') {
      if (transaction.reference === 'invoice' && transaction.referenceId) {
        const invoice = await invoicesCollection.findOne({ invoiceNumber: transaction.referenceId })
        if (invoice) {
          const newPaidAmount = Math.max(0, (invoice.paidAmount || 0) - (transaction.amount || 0))
          await invoicesCollection.updateOne(
            { invoiceNumber: transaction.referenceId },
            {
              $set: {
                paidAmount: newPaidAmount,
                status: newPaidAmount < invoice.totalAmount ? 'sent' : 'paid',
                updatedAt: new Date().toISOString()
              }
            }
          )
        }
      }

      if (transaction.reference === 'purchase' && transaction.referenceId) {
        const purchase = await purchasesCollection.findOne({ invoiceNumber: transaction.referenceId })
        if (purchase) {
          const newPaidAmount = Math.max(0, (purchase.paidAmount || 0) - (transaction.amount || 0))
          await purchasesCollection.updateOne(
            { invoiceNumber: transaction.referenceId },
            {
              $set: {
                paidAmount: newPaidAmount,
                paymentStatus: newPaidAmount === 0 ? 'pending' : (newPaidAmount >= purchase.totalAmount ? 'paid' : 'partial'),
                updatedAt: new Date().toISOString()
              }
            }
          )
        }
      }
    }

    const result = await transactionsCollection.deleteOne({ _id: new ObjectId(id) })

    return NextResponse.json({
      success: true,
      message: 'تراکنش با موفقیت حذف شد'
    })
  } catch (error) {
    console.error('Error deleting transaction:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در حذف تراکنش' },
      { status: 500 }
    )
  }
}

// تابع تولید شماره تراکنش
async function generateTransactionNumber(type: string): Promise<string> {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
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
