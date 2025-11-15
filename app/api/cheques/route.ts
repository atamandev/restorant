import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://admin:StrongPassword123@185.204.169.107:27017/restaurant?authSource=admin'
const DB_NAME = 'restaurant'
const COLLECTION_NAME = 'cheques'

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

// GET - دریافت تمام چک‌ها
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const { searchParams } = new URL(request.url)
    const chequeType = searchParams.get('chequeType') // received, paid
    const status = searchParams.get('status') // in_hand, deposited, cleared, returned, endorsed
    const bankName = searchParams.get('bankName')
    const personId = searchParams.get('personId')
    const fromDate = searchParams.get('fromDate')
    const toDate = searchParams.get('toDate')
    const dueFromDate = searchParams.get('dueFromDate')
    const dueToDate = searchParams.get('dueToDate')
    const sortBy = searchParams.get('sortBy') || 'dueDate'
    const sortOrder = searchParams.get('sortOrder') || 'asc'
    const limit = parseInt(searchParams.get('limit') || '100')
    const skip = parseInt(searchParams.get('skip') || '0')

    // ساخت فیلتر
    const filter: any = {}
    if (chequeType && chequeType !== 'all') filter.chequeType = chequeType
    if (status && status !== 'all') filter.status = status
    if (bankName && bankName !== 'all') filter.bankName = bankName
    if (personId && personId !== 'all') filter.personId = personId
    
    // فیلتر تاریخ صدور
    if (fromDate || toDate) {
      filter.issueDate = {}
      if (fromDate) filter.issueDate.$gte = new Date(fromDate)
      if (toDate) filter.issueDate.$lte = new Date(toDate)
    }
    
    // فیلتر تاریخ سررسید
    if (dueFromDate || dueToDate) {
      filter.dueDate = {}
      if (dueFromDate) filter.dueDate.$gte = new Date(dueFromDate)
      if (dueToDate) filter.dueDate.$lte = new Date(dueToDate)
    }

    // ساخت مرتب‌سازی
    const sort: any = {}
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1

    const cheques = await collection
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
          totalCheques: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          receivedCheques: { $sum: { $cond: [{ $eq: ['$chequeType', 'received'] }, 1, 0] } },
          paidCheques: { $sum: { $cond: [{ $eq: ['$chequeType', 'paid'] }, 1, 0] } },
          inHandCheques: { $sum: { $cond: [{ $eq: ['$status', 'in_hand'] }, 1, 0] } },
          depositedCheques: { $sum: { $cond: [{ $eq: ['$status', 'deposited'] }, 1, 0] } },
          clearedCheques: { $sum: { $cond: [{ $eq: ['$status', 'cleared'] }, 1, 0] } },
          returnedCheques: { $sum: { $cond: [{ $eq: ['$status', 'returned'] }, 1, 0] } },
          endorsedCheques: { $sum: { $cond: [{ $eq: ['$status', 'endorsed'] }, 1, 0] } },
          overdueCheques: { $sum: { $cond: [{ $lt: ['$dueDate', new Date()] }, 1, 0] } },
          dueThisWeek: { $sum: { $cond: [{ $and: [{ $gte: ['$dueDate', new Date()] }, { $lte: ['$dueDate', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)] }] }, 1, 0] } },
          dueThisMonth: { $sum: { $cond: [{ $and: [{ $gte: ['$dueDate', new Date()] }, { $lte: ['$dueDate', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)] }] }, 1, 0] } }
        }
      }
    ]).toArray()

    return NextResponse.json({
      success: true,
      data: cheques,
      stats: stats[0] || {
        totalCheques: 0,
        totalAmount: 0,
        receivedCheques: 0,
        paidCheques: 0,
        inHandCheques: 0,
        depositedCheques: 0,
        clearedCheques: 0,
        returnedCheques: 0,
        endorsedCheques: 0,
        overdueCheques: 0,
        dueThisWeek: 0,
        dueThisMonth: 0
      },
      pagination: {
        limit,
        skip,
        total: await collection.countDocuments(filter)
      }
    })
  } catch (error) {
    console.error('Error fetching cheques:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت چک‌ها' },
      { status: 500 }
    )
  }
}

// POST - ایجاد چک جدید
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const body = await request.json()
    
    const cheque = {
      chequeNumber: body.chequeNumber,
      chequeType: body.chequeType, // received, paid
      amount: body.amount,
      currency: body.currency || 'IRR',
      bankName: body.bankName,
      bankCode: body.bankCode,
      branchName: body.branchName,
      branchCode: body.branchCode,
      accountNumber: body.accountNumber,
      issueDate: new Date(body.issueDate),
      dueDate: new Date(body.dueDate),
      personId: body.personId,
      personName: body.personName,
      personPhone: body.personPhone,
      personAddress: body.personAddress,
      status: body.status || 'in_hand', // in_hand, deposited, cleared, returned, endorsed
      purpose: body.purpose, // babat - دلیل صدور چک
      reference: body.reference, // marja - مرجع (فاکتور، قرارداد، ...)
      referenceId: body.referenceId,
      referenceType: body.referenceType, // invoice, contract, advance, expense
      notes: body.notes || '',
      endorsementDate: body.endorsementDate ? new Date(body.endorsementDate) : null,
      endorsementTo: body.endorsementTo,
      depositDate: body.depositDate ? new Date(body.depositDate) : null,
      depositBank: body.depositBank,
      depositAccount: body.depositAccount,
      clearanceDate: body.clearanceDate ? new Date(body.clearanceDate) : null,
      returnDate: body.returnDate ? new Date(body.returnDate) : null,
      returnReason: body.returnReason,
      createdBy: body.createdBy || 'system',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const result = await collection.insertOne(cheque)
    
    return NextResponse.json({
      success: true,
      data: { ...cheque, _id: result.insertedId },
      message: 'چک با موفقیت ثبت شد'
    })
  } catch (error) {
    console.error('Error creating cheque:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در ثبت چک' },
      { status: 500 }
    )
  }
}

// DELETE - حذف چک
export async function DELETE(request: NextRequest) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'شناسه چک اجباری است' },
        { status: 400 }
      )
    }

    const result = await collection.deleteOne({ _id: new ObjectId(id) })
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'چک یافت نشد' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'چک با موفقیت حذف شد'
    })
  } catch (error) {
    console.error('Error deleting cheque:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در حذف چک' },
      { status: 500 }
    )
  }
}

