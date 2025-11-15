import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://admin:StrongPassword123@185.204.169.107:27017/restaurant?authSource=admin'
const DB_NAME = 'restaurant'
const COLLECTION_NAME = 'bank_accounts'

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

// GET - دریافت تمام حساب‌های بانکی
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const { searchParams } = new URL(request.url)
    const bankName = searchParams.get('bankName')
    const accountType = searchParams.get('accountType') // checking, savings, business
    const branchId = searchParams.get('branchId')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const limit = parseInt(searchParams.get('limit') || '100')
    const skip = parseInt(searchParams.get('skip') || '0')

    // ساخت فیلتر
    const filter: any = {}
    if (bankName && bankName !== 'all') filter.bankName = bankName
    if (accountType && accountType !== 'all') filter.accountType = accountType
    if (branchId && branchId !== 'all') filter.branchId = branchId

    // ساخت مرتب‌سازی
    const sort: any = {}
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1

    const bankAccounts = await collection
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
          totalAccounts: { $sum: 1 },
          totalBalance: { $sum: '$currentBalance' },
          checkingAccounts: { $sum: { $cond: [{ $eq: ['$accountType', 'checking'] }, 1, 0] } },
          savingsAccounts: { $sum: { $cond: [{ $eq: ['$accountType', 'savings'] }, 1, 0] } },
          businessAccounts: { $sum: { $cond: [{ $eq: ['$accountType', 'business'] }, 1, 0] } },
          activeAccounts: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
          inactiveAccounts: { $sum: { $cond: [{ $eq: ['$status', 'inactive'] }, 1, 0] } }
        }
      }
    ]).toArray()

    return NextResponse.json({
      success: true,
      data: bankAccounts,
      stats: stats[0] || {
        totalAccounts: 0,
        totalBalance: 0,
        checkingAccounts: 0,
        savingsAccounts: 0,
        businessAccounts: 0,
        activeAccounts: 0,
        inactiveAccounts: 0
      },
      pagination: {
        limit,
        skip,
        total: await collection.countDocuments(filter)
      }
    })
  } catch (error) {
    console.error('Error fetching bank accounts:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت حساب‌های بانکی' },
      { status: 500 }
    )
  }
}

// POST - ایجاد حساب بانکی جدید
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const body = await request.json()
    
    const bankAccount = {
      accountNumber: body.accountNumber,
      accountName: body.accountName,
      bankName: body.bankName,
      bankCode: body.bankCode,
      branchName: body.branchName,
      branchCode: body.branchCode,
      accountType: body.accountType, // checking, savings, business
      currency: body.currency || 'IRR',
      initialBalance: body.initialBalance || 0,
      currentBalance: body.initialBalance || 0,
      status: body.status || 'active', // active, inactive, frozen
      branchId: body.branchId,
      branchName: body.branchName,
      accountHolder: body.accountHolder,
      accountHolderId: body.accountHolderId,
      iban: body.iban,
      swiftCode: body.swiftCode,
      openingDate: new Date(body.openingDate || new Date()),
      lastTransactionDate: null,
      notes: body.notes || '',
      createdBy: body.createdBy || 'system',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const result = await collection.insertOne(bankAccount)
    
    return NextResponse.json({
      success: true,
      data: { ...bankAccount, _id: result.insertedId },
      message: 'حساب بانکی با موفقیت ثبت شد'
    })
  } catch (error) {
    console.error('Error creating bank account:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در ثبت حساب بانکی' },
      { status: 500 }
    )
  }
}

// DELETE - حذف حساب بانکی
export async function DELETE(request: NextRequest) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'شناسه حساب بانکی اجباری است' },
        { status: 400 }
      )
    }

    const result = await collection.deleteOne({ _id: new ObjectId(id) })
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'حساب بانکی یافت نشد' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'حساب بانکی با موفقیت حذف شد'
    })
  } catch (error) {
    console.error('Error deleting bank account:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در حذف حساب بانکی' },
      { status: 500 }
    )
  }
}

