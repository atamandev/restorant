import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://restorenUser:1234@localhost:27017/restoren'
const DB_NAME = 'restoren'
const COLLECTION_NAME = 'cash_flow'

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

// GET - دریافت جریان نقدی
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // inflow, outflow, net
    const category = searchParams.get('category') // sales, purchases, expenses, investments
    const branchId = searchParams.get('branchId')
    const accountId = searchParams.get('accountId')
    const fromDate = searchParams.get('fromDate')
    const toDate = searchParams.get('toDate')
    const sortBy = searchParams.get('sortBy') || 'date'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const limit = parseInt(searchParams.get('limit') || '100')
    const skip = parseInt(searchParams.get('skip') || '0')

    // ساخت فیلتر
    const filter: any = {}
    if (type && type !== 'all') filter.type = type
    if (category && category !== 'all') filter.category = category
    if (branchId && branchId !== 'all') filter.branchId = branchId
    if (accountId && accountId !== 'all') filter.accountId = accountId
    
    // فیلتر تاریخ
    if (fromDate || toDate) {
      filter.date = {}
      if (fromDate) filter.date.$gte = new Date(fromDate)
      if (toDate) filter.date.$lte = new Date(toDate)
    }

    // ساخت مرتب‌سازی
    const sort: any = {}
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1

    const cashFlow = await collection
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
          totalInflow: { $sum: { $cond: [{ $eq: ['$type', 'inflow'] }, '$amount', 0] } },
          totalOutflow: { $sum: { $cond: [{ $eq: ['$type', 'outflow'] }, '$amount', 0] } },
          netCashFlow: { $sum: { $cond: [{ $eq: ['$type', 'inflow'] }, '$amount', { $multiply: ['$amount', -1] }] } },
          totalTransactions: { $sum: 1 },
          inflowTransactions: { $sum: { $cond: [{ $eq: ['$type', 'inflow'] }, 1, 0] } },
          outflowTransactions: { $sum: { $cond: [{ $eq: ['$type', 'outflow'] }, 1, 0] } }
        }
      }
    ]).toArray()

    // آمار بر اساس دسته‌بندی
    const categoryStats = await collection.aggregate([
      {
        $group: {
          _id: '$category',
          totalAmount: { $sum: '$amount' },
          transactionCount: { $sum: 1 },
          avgAmount: { $avg: '$amount' }
        }
      },
      {
        $sort: { totalAmount: -1 }
      }
    ]).toArray()

    // آمار روزانه
    const dailyStats = await collection.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            day: { $dayOfMonth: '$date' }
          },
          date: { $first: '$date' },
          dailyInflow: { $sum: { $cond: [{ $eq: ['$type', 'inflow'] }, '$amount', 0] } },
          dailyOutflow: { $sum: { $cond: [{ $eq: ['$type', 'outflow'] }, '$amount', 0] } },
          dailyNet: { $sum: { $cond: [{ $eq: ['$type', 'inflow'] }, '$amount', { $multiply: ['$amount', -1] }] } },
          transactionCount: { $sum: 1 }
        }
      },
      {
        $sort: { date: -1 }
      },
      {
        $limit: 30
      }
    ]).toArray()

    return NextResponse.json({
      success: true,
      data: cashFlow,
      stats: stats[0] || {
        totalInflow: 0,
        totalOutflow: 0,
        netCashFlow: 0,
        totalTransactions: 0,
        inflowTransactions: 0,
        outflowTransactions: 0
      },
      categoryStats,
      dailyStats,
      pagination: {
        limit,
        skip,
        total: await collection.countDocuments(filter)
      }
    })
  } catch (error) {
    console.error('Error fetching cash flow:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت جریان نقدی' },
      { status: 500 }
    )
  }
}

// POST - ایجاد تراکنش جریان نقدی جدید
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const body = await request.json()
    
    const cashFlowTransaction = {
      transactionId: body.transactionId,
      type: body.type, // inflow, outflow
      category: body.category, // sales, purchases, expenses, investments, loans, etc.
      amount: body.amount,
      currency: body.currency || 'IRR',
      description: body.description,
      reference: body.reference, // invoice, purchase, expense, etc.
      referenceId: body.referenceId,
      branchId: body.branchId,
      branchName: body.branchName,
      accountId: body.accountId,
      accountName: body.accountName,
      paymentMethod: body.paymentMethod, // cash, card, bank_transfer, cheque
      date: body.date ? new Date(body.date) : new Date(),
      createdBy: body.createdBy || 'system',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const result = await collection.insertOne(cashFlowTransaction)
    
    return NextResponse.json({
      success: true,
      data: { ...cashFlowTransaction, _id: result.insertedId },
      message: 'تراکنش جریان نقدی با موفقیت ثبت شد'
    })
  } catch (error) {
    console.error('Error creating cash flow transaction:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در ثبت تراکنش جریان نقدی' },
      { status: 500 }
    )
  }
}

// DELETE - حذف تراکنش جریان نقدی
export async function DELETE(request: NextRequest) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'شناسه تراکنش اجباری است' },
        { status: 400 }
      )
    }

    const result = await collection.deleteOne({ _id: new ObjectId(id) })
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'تراکنش یافت نشد' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'تراکنش با موفقیت حذف شد'
    })
  } catch (error) {
    console.error('Error deleting cash flow transaction:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در حذف تراکنش' },
      { status: 500 }
    )
  }
}
