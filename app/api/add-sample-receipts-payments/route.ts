import { NextRequest, NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://restorenUser:1234@localhost:27017/restoren'
const DB_NAME = 'restoren'
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

// POST - اضافه کردن داده‌های نمونه دریافت و پرداخت
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    // پاک کردن داده‌های قبلی
    await collection.deleteMany({})
    
    const sampleTransactions = [
      // دریافت‌ها (Receipts)
      {
        transactionNumber: 'REC-20240115-0001',
        type: 'receipt',
        amount: 150000,
        method: 'cash',
        status: 'completed',
        personId: 'CUST-000001',
        personName: 'احمد محمدی',
        personType: 'customer',
        reference: 'invoice',
        referenceId: 'INV-000001',
        description: 'پرداخت فاکتور فروش',
        notes: 'پرداخت نقدی کامل',
        date: new Date('2024-01-15T14:30:00.000Z'),
        dueDate: null,
        bankAccountId: null,
        checkNumber: null,
        checkBank: null,
        checkDueDate: null,
        createdBy: 'cashier-001',
        createdAt: '2024-01-15T14:30:00.000Z',
        updatedAt: '2024-01-15T14:30:00.000Z'
      },
      {
        transactionNumber: 'REC-20240115-0002',
        type: 'receipt',
        amount: 250000,
        method: 'card',
        status: 'completed',
        personId: 'CUST-000002',
        personName: 'فاطمه احمدی',
        personType: 'customer',
        reference: 'invoice',
        referenceId: 'INV-000002',
        description: 'پرداخت فاکتور فروش',
        notes: 'پرداخت با کارت بانکی',
        date: new Date('2024-01-15T16:45:00.000Z'),
        dueDate: null,
        bankAccountId: 'BANK-001',
        checkNumber: null,
        checkBank: null,
        checkDueDate: null,
        createdBy: 'cashier-001',
        createdAt: '2024-01-15T16:45:00.000Z',
        updatedAt: '2024-01-15T16:45:00.000Z'
      },
      {
        transactionNumber: 'REC-20240114-0001',
        type: 'receipt',
        amount: 100000,
        method: 'check',
        status: 'pending',
        personId: 'CUST-000003',
        personName: 'علی رضایی',
        personType: 'customer',
        reference: 'invoice',
        referenceId: 'INV-000003',
        description: 'پرداخت فاکتور فروش',
        notes: 'چک در انتظار وصول',
        date: new Date('2024-01-14T18:20:00.000Z'),
        dueDate: new Date('2024-01-20T00:00:00.000Z'),
        bankAccountId: null,
        checkNumber: 'CHK-001234',
        checkBank: 'بانک ملی',
        checkDueDate: new Date('2024-01-20T00:00:00.000Z'),
        createdBy: 'cashier-002',
        createdAt: '2024-01-14T18:20:00.000Z',
        updatedAt: '2024-01-14T18:20:00.000Z'
      },
      {
        transactionNumber: 'REC-20240113-0001',
        type: 'receipt',
        amount: 50000,
        method: 'bank_transfer',
        status: 'completed',
        personId: 'CUST-000004',
        personName: 'مریم حسینی',
        personType: 'customer',
        reference: 'prepayment',
        referenceId: 'PRE-000001',
        description: 'پیش‌پرداخت سفارش',
        notes: 'انتقال بانکی',
        date: new Date('2024-01-13T10:15:00.000Z'),
        dueDate: null,
        bankAccountId: 'BANK-001',
        checkNumber: null,
        checkBank: null,
        checkDueDate: null,
        createdBy: 'manager-001',
        createdAt: '2024-01-13T10:15:00.000Z',
        updatedAt: '2024-01-13T10:15:00.000Z'
      },
      {
        transactionNumber: 'REC-20240112-0001',
        type: 'receipt',
        amount: 300000,
        method: 'credit',
        status: 'completed',
        personId: 'CUST-000005',
        personName: 'حسن کریمی',
        personType: 'customer',
        reference: 'invoice',
        referenceId: 'INV-000004',
        description: 'پرداخت فاکتور فروش',
        notes: 'پرداخت اعتباری',
        date: new Date('2024-01-12T19:30:00.000Z'),
        dueDate: new Date('2024-02-12T00:00:00.000Z'),
        bankAccountId: null,
        checkNumber: null,
        checkBank: null,
        checkDueDate: null,
        createdBy: 'cashier-001',
        createdAt: '2024-01-12T19:30:00.000Z',
        updatedAt: '2024-01-12T19:30:00.000Z'
      },
      
      // پرداخت‌ها (Payments)
      {
        transactionNumber: 'PAY-20240115-0001',
        type: 'payment',
        amount: 200000,
        method: 'cash',
        status: 'completed',
        personId: 'SUPP-000001',
        personName: 'شرکت مواد غذایی تهران',
        personType: 'supplier',
        reference: 'invoice',
        referenceId: 'PINV-000001',
        description: 'پرداخت فاکتور خرید مواد اولیه',
        notes: 'پرداخت نقدی',
        date: new Date('2024-01-15T11:00:00.000Z'),
        dueDate: null,
        bankAccountId: null,
        checkNumber: null,
        checkBank: null,
        checkDueDate: null,
        createdBy: 'manager-001',
        createdAt: '2024-01-15T11:00:00.000Z',
        updatedAt: '2024-01-15T11:00:00.000Z'
      },
      {
        transactionNumber: 'PAY-20240114-0001',
        type: 'payment',
        amount: 150000,
        method: 'bank_transfer',
        status: 'completed',
        personId: 'SUPP-000002',
        personName: 'تأمین‌کننده سبزیجات',
        personType: 'supplier',
        reference: 'invoice',
        referenceId: 'PINV-000002',
        description: 'پرداخت فاکتور خرید سبزیجات',
        notes: 'انتقال بانکی',
        date: new Date('2024-01-14T09:30:00.000Z'),
        dueDate: null,
        bankAccountId: 'BANK-002',
        checkNumber: null,
        checkBank: null,
        checkDueDate: null,
        createdBy: 'manager-001',
        createdAt: '2024-01-14T09:30:00.000Z',
        updatedAt: '2024-01-14T09:30:00.000Z'
      },
      {
        transactionNumber: 'PAY-20240113-0001',
        type: 'payment',
        amount: 80000,
        method: 'check',
        status: 'pending',
        personId: 'EMP-000001',
        personName: 'محمد احمدی',
        personType: 'employee',
        reference: 'expense',
        referenceId: 'EXP-000001',
        description: 'پرداخت حقوق کارمند',
        notes: 'چک در انتظار وصول',
        date: new Date('2024-01-13T16:00:00.000Z'),
        dueDate: new Date('2024-01-18T00:00:00.000Z'),
        bankAccountId: null,
        checkNumber: 'CHK-005678',
        checkBank: 'بانک صادرات',
        checkDueDate: new Date('2024-01-18T00:00:00.000Z'),
        createdBy: 'manager-001',
        createdAt: '2024-01-13T16:00:00.000Z',
        updatedAt: '2024-01-13T16:00:00.000Z'
      },
      {
        transactionNumber: 'PAY-20240112-0001',
        type: 'payment',
        amount: 120000,
        method: 'card',
        status: 'completed',
        personId: 'SUPP-000003',
        personName: 'شرکت تجهیزات آشپزخانه',
        personType: 'supplier',
        reference: 'invoice',
        referenceId: 'PINV-000003',
        description: 'پرداخت فاکتور خرید تجهیزات',
        notes: 'پرداخت با کارت بانکی',
        date: new Date('2024-01-12T14:15:00.000Z'),
        dueDate: null,
        bankAccountId: 'BANK-001',
        checkNumber: null,
        checkBank: null,
        checkDueDate: null,
        createdBy: 'manager-001',
        createdAt: '2024-01-12T14:15:00.000Z',
        updatedAt: '2024-01-12T14:15:00.000Z'
      },
      {
        transactionNumber: 'PAY-20240111-0001',
        type: 'payment',
        amount: 50000,
        method: 'cash',
        status: 'completed',
        personId: 'SUPP-000004',
        personName: 'تأمین‌کننده نوشیدنی',
        personType: 'supplier',
        reference: 'deposit',
        referenceId: 'DEP-000001',
        description: 'پرداخت پیش‌پرداخت سفارش',
        notes: 'پرداخت نقدی',
        date: new Date('2024-01-11T10:45:00.000Z'),
        dueDate: null,
        bankAccountId: null,
        checkNumber: null,
        checkBank: null,
        checkDueDate: null,
        createdBy: 'cashier-002',
        createdAt: '2024-01-11T10:45:00.000Z',
        updatedAt: '2024-01-11T10:45:00.000Z'
      }
    ]

    const result = await collection.insertMany(sampleTransactions)

    return NextResponse.json({
      success: true,
      message: `${result.insertedCount} تراکنش نمونه اضافه شد`,
      data: result.insertedIds
    })
  } catch (error) {
    console.error('Error adding sample transactions:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در اضافه کردن تراکنش‌های نمونه' },
      { status: 500 }
    )
  }
}

