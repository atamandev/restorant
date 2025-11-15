import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://admin:StrongPassword123@185.204.169.107:27017/restaurant?authSource=admin'
const DB_NAME = 'restaurant'
const COLLECTION_NAME = 'cashier_sessions'

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

// GET /api/cashier-sessions - دریافت لیست جلسات صندوق (با آمار کامل)
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()
    const sessionsCollection = db.collection(COLLECTION_NAME)
    const invoicesCollection = db.collection('invoices')
    const receiptsPaymentsCollection = db.collection('receipts_payments')
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const userId = searchParams.get('userId')
    const branchId = searchParams.get('branchId')
    const includeStats = searchParams.get('includeStats') === 'true'
    
    const skip = (page - 1) * limit
    
    // Build query
    const query: any = {}
    if (status) {
      query.status = status
    }
    if (userId) {
      query.userId = userId
    }
    if (branchId) {
      query.branchId = branchId
    }
    if (dateFrom || dateTo) {
      query.createdAt = {}
      if (dateFrom) {
        query.createdAt.$gte = new Date(dateFrom)
      }
      if (dateTo) {
        query.createdAt.$lte = new Date(dateTo)
      }
    }
    
    const sessions = await sessionsCollection
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray()
    
    // اگر includeStats=true باشد، آمار دقیق‌تر را از invoices و receipts-payments محاسبه کن
    if (includeStats) {
      for (const session of sessions) {
        const sessionInvoices = await invoicesCollection.find({
          cashierSessionId: session._id.toString(),
          status: 'paid'
        }).toArray()

        let actualCashSales = 0
        let actualCardSales = 0
        let actualCreditSales = 0
        let actualTotalSales = 0

        for (const invoice of sessionInvoices) {
          actualTotalSales += invoice.paidAmount || 0
          if (invoice.paymentMethod === 'cash') {
            actualCashSales += invoice.paidAmount || 0
          } else if (invoice.paymentMethod === 'card') {
            actualCardSales += invoice.paidAmount || 0
          } else if (invoice.paymentMethod === 'credit') {
            actualCreditSales += invoice.paidAmount || 0
          }
        }

        session.actualCashSales = actualCashSales
        session.actualCardSales = actualCardSales
        session.actualCreditSales = actualCreditSales
        session.actualTotalSales = actualTotalSales
        session.invoiceCount = sessionInvoices.length
      }
    }
    
    const total = await sessionsCollection.countDocuments(query)
    
    // آمار کلی
    const stats = await sessionsCollection.aggregate([
      {
        $group: {
          _id: null,
          totalSessions: { $sum: 1 },
          openSessions: { $sum: { $cond: [{ $eq: ['$status', 'open'] }, 1, 0] } },
          closedSessions: { $sum: { $cond: [{ $eq: ['$status', 'closed'] }, 1, 0] } },
          totalSales: { $sum: '$totalSales' },
          totalCashSales: { $sum: '$cashSales' },
          totalCardSales: { $sum: '$cardSales' },
          totalCreditSales: { $sum: '$creditSales' },
          totalDiscounts: { $sum: '$discounts' },
          totalTaxes: { $sum: '$taxes' }
        }
      }
    ]).toArray()
    
    return NextResponse.json({
      success: true,
      data: sessions,
      stats: stats[0] || {
        totalSessions: 0,
        openSessions: 0,
        closedSessions: 0,
        totalSales: 0,
        totalCashSales: 0,
        totalCardSales: 0,
        totalCreditSales: 0,
        totalDiscounts: 0,
        totalTaxes: 0
      },
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      message: 'لیست جلسات صندوق با موفقیت دریافت شد'
    })
  } catch (error) {
    console.error('Error fetching cashier sessions:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در دریافت لیست جلسات صندوق',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// POST /api/cashier-sessions - ایجاد جلسه صندوق جدید
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()
    const sessionsCollection = db.collection(COLLECTION_NAME)
    const branchesCollection = db.collection('branches')
    const cashRegistersCollection = db.collection('cash_registers')
    
    const body = await request.json()
    
    const { 
      userId,
      branchId,
      cashRegisterId,
      startAmount,
      notes
    } = body

    // Validate required fields
    if (!userId || startAmount === undefined) {
      return NextResponse.json(
        { success: false, message: 'شناسه کاربر و موجودی اولیه اجباری است' },
        { status: 400 }
      )
    }

    // بررسی وجود شعبه و صندوق
    if (branchId) {
      const branch = await branchesCollection.findOne({ 
        _id: new ObjectId(branchId),
        isActive: true
      })
      if (!branch) {
        return NextResponse.json(
          { success: false, message: 'شعبه یافت نشد یا غیرفعال است' },
          { status: 404 }
        )
      }
    }

    if (cashRegisterId) {
      const cashRegister = await cashRegistersCollection.findOne({ 
        _id: new ObjectId(cashRegisterId),
        branchId: branchId ? new ObjectId(branchId) : undefined,
        isActive: true
      })
      if (!cashRegister) {
        return NextResponse.json(
          { success: false, message: 'صندوق یافت نشد یا به این شعبه تعلق ندارد' },
          { status: 404 }
        )
      }

      // بررسی اینکه آیا جلسه باز دیگری برای این صندوق وجود دارد
      const openSession = await sessionsCollection.findOne({
        cashRegisterId: cashRegisterId,
        status: 'open'
      })
      if (openSession) {
        return NextResponse.json(
          { success: false, message: 'یک جلسه صندوق باز برای این صندوق وجود دارد. ابتدا آن را ببندید.' },
          { status: 400 }
        )
      }
    }
    
    const sessionData = {
      userId: String(userId),
      branchId: branchId ? new ObjectId(branchId) : null,
      cashRegisterId: cashRegisterId ? new ObjectId(cashRegisterId) : null,
      startTime: new Date().toISOString(),
      startAmount: Number(startAmount),
      totalSales: 0,
      totalTransactions: 0,
      cashSales: 0,
      cardSales: 0,
      creditSales: 0,
      refunds: 0,
      discounts: 0,
      taxes: 0,
      serviceCharges: 0,
      status: 'open',
      notes: notes ? String(notes) : null,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await sessionsCollection.insertOne(sessionData)
    
    const session = await sessionsCollection.findOne({ _id: result.insertedId })

    return NextResponse.json({
      success: true,
      data: session,
      message: 'جلسه صندوق با موفقیت ایجاد شد'
    })
  } catch (error) {
    console.error('Error creating cashier session:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در ایجاد جلسه صندوق',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// PUT /api/cashier-sessions - به‌روزرسانی جلسه صندوق
export async function PUT(request: NextRequest) {
  try {
    await connectToDatabase()
    const sessionsCollection = db.collection(COLLECTION_NAME)
    
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'شناسه جلسه صندوق اجباری است' },
        { status: 400 }
      )
    }

    const updateFields: any = {
      updatedAt: new Date()
    }

    // Update fields
    if (updateData.userId !== undefined) updateFields.userId = String(updateData.userId)
    if (updateData.startAmount !== undefined) updateFields.startAmount = Number(updateData.startAmount)
    if (updateData.totalSales !== undefined) updateFields.totalSales = Number(updateData.totalSales)
    if (updateData.totalTransactions !== undefined) updateFields.totalTransactions = Number(updateData.totalTransactions)
    if (updateData.cashSales !== undefined) updateFields.cashSales = Number(updateData.cashSales)
    if (updateData.cardSales !== undefined) updateFields.cardSales = Number(updateData.cardSales)
    if (updateData.creditSales !== undefined) updateFields.creditSales = Number(updateData.creditSales)
    if (updateData.refunds !== undefined) updateFields.refunds = Number(updateData.refunds)
    if (updateData.discounts !== undefined) updateFields.discounts = Number(updateData.discounts)
    if (updateData.taxes !== undefined) updateFields.taxes = Number(updateData.taxes)
    if (updateData.serviceCharges !== undefined) updateFields.serviceCharges = Number(updateData.serviceCharges)
    if (updateData.status !== undefined) updateFields.status = String(updateData.status)
    if (updateData.notes !== undefined) updateFields.notes = updateData.notes ? String(updateData.notes) : null

    const result = await sessionsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'جلسه صندوق مورد نظر یافت نشد' },
        { status: 404 }
      )
    }

    const updatedSession = await sessionsCollection.findOne({ _id: new ObjectId(id) })

    return NextResponse.json({
      success: true,
      data: updatedSession,
      message: 'جلسه صندوق با موفقیت به‌روزرسانی شد'
    })
  } catch (error) {
    console.error('Error updating cashier session:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در به‌روزرسانی جلسه صندوق',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// DELETE /api/cashier-sessions - حذف جلسه صندوق
export async function DELETE(request: NextRequest) {
  try {
    await connectToDatabase()
    const sessionsCollection = db.collection(COLLECTION_NAME)
    const invoicesCollection = db.collection('invoices')
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'شناسه جلسه صندوق اجباری است' },
        { status: 400 }
      )
    }

    // بررسی اینکه آیا فاکتور مرتبط وجود دارد
    const hasInvoices = await invoicesCollection.countDocuments({ cashierSessionId: id }) > 0
    if (hasInvoices) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'امکان حذف جلسه صندوق با فاکتور مرتبط وجود ندارد' 
        },
        { status: 400 }
      )
    }
    
    const result = await sessionsCollection.deleteOne({ _id: new ObjectId(id) })

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'جلسه صندوق مورد نظر یافت نشد' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'جلسه صندوق با موفقیت حذف شد'
    })
  } catch (error) {
    console.error('Error deleting cashier session:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در حذف جلسه صندوق',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
