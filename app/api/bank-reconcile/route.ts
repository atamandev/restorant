import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://restorenUser:1234@localhost:27017/restoren'
const DB_NAME = 'restoren'
const COLLECTION_NAME = 'bank_reconciliations'

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

// GET - دریافت تطبیق‌های حساب‌ها
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const { searchParams } = new URL(request.url)
    const accountId = searchParams.get('accountId')
    const status = searchParams.get('status') // pending, completed, disputed
    const fromDate = searchParams.get('fromDate')
    const toDate = searchParams.get('toDate')
    const sortBy = searchParams.get('sortBy') || 'reconciliationDate'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const limit = parseInt(searchParams.get('limit') || '100')
    const skip = parseInt(searchParams.get('skip') || '0')

    // ساخت فیلتر
    const filter: any = {}
    if (accountId && accountId !== 'all') filter.accountId = accountId
    if (status && status !== 'all') filter.status = status
    
    // فیلتر تاریخ
    if (fromDate || toDate) {
      filter.reconciliationDate = {}
      if (fromDate) filter.reconciliationDate.$gte = new Date(fromDate)
      if (toDate) filter.reconciliationDate.$lte = new Date(toDate)
    }

    // ساخت مرتب‌سازی
    const sort: any = {}
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1

    const reconciliations = await collection
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
          totalReconciliations: { $sum: 1 },
          pendingReconciliations: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          completedReconciliations: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          disputedReconciliations: { $sum: { $cond: [{ $eq: ['$status', 'disputed'] }, 1, 0] } },
          totalDiscrepancies: { $sum: '$discrepancyAmount' }
        }
      }
    ]).toArray()

    return NextResponse.json({
      success: true,
      data: reconciliations,
      stats: stats[0] || {
        totalReconciliations: 0,
        pendingReconciliations: 0,
        completedReconciliations: 0,
        disputedReconciliations: 0,
        totalDiscrepancies: 0
      },
      pagination: {
        limit,
        skip,
        total: await collection.countDocuments(filter)
      }
    })
  } catch (error) {
    console.error('Error fetching bank reconciliations:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت تطبیق‌های حساب‌ها' },
      { status: 500 }
    )
  }
}

// POST - ایجاد تطبیق حساب جدید
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const body = await request.json()
    
    const reconciliation = {
      accountId: body.accountId,
      reconciliationDate: new Date(body.reconciliationDate || new Date()),
      statementBalance: body.statementBalance,
      bookBalance: body.bookBalance,
      discrepancyAmount: body.discrepancyAmount || 0,
      status: body.status || 'pending', // pending, completed, disputed
      notes: body.notes || '',
      discrepancies: body.discrepancies || [],
      createdBy: body.createdBy || 'system',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const result = await collection.insertOne(reconciliation)
    
    return NextResponse.json({
      success: true,
      data: { ...reconciliation, _id: result.insertedId },
      message: 'تطبیق حساب با موفقیت ثبت شد'
    })
  } catch (error) {
    console.error('Error creating bank reconciliation:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در ثبت تطبیق حساب' },
      { status: 500 }
    )
  }
}

// PATCH - به‌روزرسانی تطبیق حساب
export async function PATCH(request: NextRequest) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const body = await request.json()
    const { id, ...updateData } = body
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'شناسه تطبیق حساب اجباری است' },
        { status: 400 }
      )
    }
    
    updateData.updatedAt = new Date().toISOString()
    
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    )
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'تطبیق حساب یافت نشد' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'تطبیق حساب با موفقیت به‌روزرسانی شد'
    })
  } catch (error) {
    console.error('Error updating bank reconciliation:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در به‌روزرسانی تطبیق حساب' },
      { status: 500 }
    )
  }
}

// DELETE - حذف تطبیق حساب
export async function DELETE(request: NextRequest) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'شناسه تطبیق حساب اجباری است' },
        { status: 400 }
      )
    }
    
    const result = await collection.deleteOne({ _id: new ObjectId(id) })
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'تطبیق حساب یافت نشد' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'تطبیق حساب با موفقیت حذف شد'
    })
  } catch (error) {
    console.error('Error deleting bank reconciliation:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در حذف تطبیق حساب' },
      { status: 500 }
    )
  }
}

