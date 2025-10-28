import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://restorenUser:1234@localhost:27017/restoren'
const DB_NAME = 'restoren'
const COLLECTION_NAME = 'bank_transactions'

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

// GET - دریافت تراکنش‌های بانکی
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    const bankAccountsCollection = db.collection('bank_accounts')
    
    const { searchParams } = new URL(request.url)
    const accountId = searchParams.get('accountId')
    const transactionType = searchParams.get('transactionType') // deposit, withdrawal, transfer, fee
    const fromDate = searchParams.get('fromDate')
    const toDate = searchParams.get('toDate')
    const sortBy = searchParams.get('sortBy') || 'date'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const limit = parseInt(searchParams.get('limit') || '100')
    const skip = parseInt(searchParams.get('skip') || '0')

    // ساخت فیلتر
    const filter: any = {}
    if (accountId && accountId !== 'all') filter.accountId = accountId
    if (transactionType && transactionType !== 'all') filter.transactionType = transactionType
    
    // فیلتر تاریخ
    if (fromDate || toDate) {
      filter.date = {}
      if (fromDate) filter.date.$gte = new Date(fromDate)
      if (toDate) filter.date.$lte = new Date(toDate)
    }

    // ساخت مرتب‌سازی
    const sort: any = {}
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1

    const transactions = await collection
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
          totalTransactions: { $sum: 1 },
          totalDeposits: { $sum: { $cond: [{ $eq: ['$transactionType', 'deposit'] }, '$amount', 0] } },
          totalWithdrawals: { $sum: { $cond: [{ $eq: ['$transactionType', 'withdrawal'] }, '$amount', 0] } },
          totalTransfers: { $sum: { $cond: [{ $eq: ['$transactionType', 'transfer'] }, '$amount', 0] } },
          totalFees: { $sum: { $cond: [{ $eq: ['$transactionType', 'fee'] }, '$amount', 0] } },
          depositCount: { $sum: { $cond: [{ $eq: ['$transactionType', 'deposit'] }, 1, 0] } },
          withdrawalCount: { $sum: { $cond: [{ $eq: ['$transactionType', 'withdrawal'] }, 1, 0] } },
          transferCount: { $sum: { $cond: [{ $eq: ['$transactionType', 'transfer'] }, 1, 0] } },
          feeCount: { $sum: { $cond: [{ $eq: ['$transactionType', 'fee'] }, 1, 0] } }
        }
      }
    ]).toArray()

    return NextResponse.json({
      success: true,
      data: transactions,
      stats: stats[0] || {
        totalTransactions: 0,
        totalDeposits: 0,
        totalWithdrawals: 0,
        totalTransfers: 0,
        totalFees: 0,
        depositCount: 0,
        withdrawalCount: 0,
        transferCount: 0,
        feeCount: 0
      },
      pagination: {
        limit,
        skip,
        total: await collection.countDocuments(filter)
      }
    })
  } catch (error) {
    console.error('Error fetching bank transactions:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت تراکنش‌های بانکی' },
      { status: 500 }
    )
  }
}

// POST - ایجاد تراکنش بانکی جدید
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    const bankAccountsCollection = db.collection('bank_accounts')
    
    const body = await request.json()
    
    // تولید شماره تراکنش
    const transactionNumber = await generateTransactionNumber()
    
    const transaction = {
      transactionNumber,
      accountId: body.accountId,
      transactionType: body.transactionType, // deposit, withdrawal, transfer, fee
      amount: body.amount,
      currency: body.currency || 'IRR',
      date: new Date(body.date || new Date()),
      description: body.description,
      reference: body.reference, // شماره مرجع
      relatedAccountId: body.relatedAccountId, // برای انتقال
      relatedTransactionId: body.relatedTransactionId,
      fee: body.fee || 0,
      balanceAfter: 0, // بعداً محاسبه می‌شود
      status: body.status || 'completed', // pending, completed, failed, cancelled
      createdBy: body.createdBy || 'system',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // به‌روزرسانی موجودی حساب
    const account = await bankAccountsCollection.findOne({ _id: new ObjectId(body.accountId) })
    if (!account) {
      return NextResponse.json(
        { success: false, message: 'حساب بانکی یافت نشد' },
        { status: 404 }
      )
    }

    let newBalance = account.currentBalance
    if (body.transactionType === 'deposit') {
      newBalance += body.amount
    } else if (body.transactionType === 'withdrawal' || body.transactionType === 'fee') {
      newBalance -= body.amount
    } else if (body.transactionType === 'transfer') {
      if (body.relatedAccountId) {
        // انتقال بین حساب‌ها
        newBalance -= body.amount
      } else {
        // انتقال خارجی
        newBalance -= body.amount
      }
    }

    transaction.balanceAfter = newBalance

    // شروع تراکنش دیتابیس
    const session = client.startSession()
    try {
      await session.withTransaction(async () => {
        // ثبت تراکنش
        const result = await collection.insertOne(transaction, { session })
        
        // به‌روزرسانی موجودی حساب
        await bankAccountsCollection.updateOne(
          { _id: new ObjectId(body.accountId) },
          { 
            $set: { 
              currentBalance: newBalance,
              lastTransactionDate: new Date(),
              updatedAt: new Date().toISOString()
            }
          },
          { session }
        )

        // اگر انتقال بین حساب‌ها است، حساب مقصد را نیز به‌روزرسانی کن
        if (body.transactionType === 'transfer' && body.relatedAccountId) {
          const relatedAccount = await bankAccountsCollection.findOne(
            { _id: new ObjectId(body.relatedAccountId) },
            { session }
          )
          
          if (relatedAccount) {
            const relatedNewBalance = relatedAccount.currentBalance + body.amount
            
            await bankAccountsCollection.updateOne(
              { _id: new ObjectId(body.relatedAccountId) },
              { 
                $set: { 
                  currentBalance: relatedNewBalance,
                  lastTransactionDate: new Date(),
                  updatedAt: new Date().toISOString()
                }
              },
              { session }
            )

            // ثبت تراکنش مربوطه
            const relatedTransaction = {
              ...transaction,
              transactionNumber: await generateTransactionNumber(),
              accountId: body.relatedAccountId,
              transactionType: 'deposit',
              amount: body.amount,
              balanceAfter: relatedNewBalance,
              relatedTransactionId: result.insertedId
            }
            
            await collection.insertOne(relatedTransaction, { session })
          }
        }
      })
    } finally {
      await session.endSession()
    }
    
    return NextResponse.json({
      success: true,
      data: { ...transaction, _id: result.insertedId },
      message: 'تراکنش بانکی با موفقیت ثبت شد'
    })
  } catch (error) {
    console.error('Error creating bank transaction:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در ثبت تراکنش بانکی' },
      { status: 500 }
    )
  }
}

// تابع تولید شماره تراکنش
async function generateTransactionNumber(): Promise<string> {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    
    // شمارش تراکنش‌های امروز
    const startOfDay = new Date(year, today.getMonth(), today.getDate())
    const endOfDay = new Date(year, today.getMonth(), today.getDate() + 1)
    
    const count = await collection.countDocuments({
      createdAt: {
        $gte: startOfDay.toISOString(),
        $lt: endOfDay.toISOString()
      }
    })
    
    const sequence = String(count + 1).padStart(4, '0')
    return `TXN-${year}${month}${day}-${sequence}`
  } catch (error) {
    console.error('Error generating transaction number:', error)
    return `TXN-${Date.now()}`
  }
}

