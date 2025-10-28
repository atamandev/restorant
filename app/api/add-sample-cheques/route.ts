import { NextRequest, NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://restorenUser:1234@localhost:27017/restoren'
const DB_NAME = 'restoren'
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

// POST - اضافه کردن داده‌های نمونه چک‌ها
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    // پاک کردن داده‌های قبلی
    await collection.deleteMany({})
    
    // اضافه کردن چک‌های نمونه
    const sampleCheques = [
      {
        chequeNumber: '1234567890',
        chequeType: 'received',
        amount: 5000000,
        currency: 'IRR',
        bankName: 'بانک ملی ایران',
        bankCode: '017',
        branchName: 'شعبه مرکزی',
        branchCode: '001',
        accountNumber: '1234567890',
        issueDate: new Date('2024-01-10T00:00:00.000Z'),
        dueDate: new Date('2024-02-10T00:00:00.000Z'),
        personId: 'CUST-001',
        personName: 'احمد رضایی',
        personPhone: '09123456789',
        personAddress: 'تهران، خیابان ولیعصر، پلاک 123',
        status: 'in_hand',
        purpose: 'پرداخت فاکتور فروش',
        reference: 'INV-2024-001',
        referenceId: 'invoice-001',
        referenceType: 'invoice',
        notes: 'چک دریافتی از مشتری',
        endorsementDate: null,
        endorsementTo: null,
        depositDate: null,
        depositBank: null,
        depositAccount: null,
        clearanceDate: null,
        returnDate: null,
        returnReason: null,
        createdBy: 'system',
        createdAt: '2024-01-10T00:00:00.000Z',
        updatedAt: '2024-01-10T00:00:00.000Z'
      },
      {
        chequeNumber: '0987654321',
        chequeType: 'received',
        amount: 3000000,
        currency: 'IRR',
        bankName: 'بانک صادرات ایران',
        bankCode: '019',
        branchName: 'شعبه شمال',
        branchCode: '002',
        accountNumber: '0987654321',
        issueDate: new Date('2024-01-15T00:00:00.000Z'),
        dueDate: new Date('2024-02-15T00:00:00.000Z'),
        personId: 'CUST-002',
        personName: 'فاطمه احمدی',
        personPhone: '09187654321',
        personAddress: 'تهران، خیابان کریمخان، پلاک 456',
        status: 'deposited',
        purpose: 'پرداخت فاکتور فروش',
        reference: 'INV-2024-002',
        referenceId: 'invoice-002',
        referenceType: 'invoice',
        notes: 'چک واریز شده به حساب بانکی',
        endorsementDate: null,
        endorsementTo: null,
        depositDate: new Date('2024-01-16T00:00:00.000Z'),
        depositBank: 'بانک ملی ایران',
        depositAccount: '1234567890',
        clearanceDate: null,
        returnDate: null,
        returnReason: null,
        createdBy: 'system',
        createdAt: '2024-01-15T00:00:00.000Z',
        updatedAt: '2024-01-16T00:00:00.000Z'
      },
      {
        chequeNumber: '1122334455',
        chequeType: 'received',
        amount: 7500000,
        currency: 'IRR',
        bankName: 'بانک تجارت',
        bankCode: '018',
        branchName: 'شعبه جنوب',
        branchCode: '003',
        accountNumber: '1122334455',
        issueDate: new Date('2024-01-20T00:00:00.000Z'),
        dueDate: new Date('2024-02-20T00:00:00.000Z'),
        personId: 'CUST-003',
        personName: 'محمد کریمی',
        personPhone: '09111223344',
        personAddress: 'تهران، خیابان آزادی، پلاک 789',
        status: 'cleared',
        purpose: 'پرداخت فاکتور فروش',
        reference: 'INV-2024-003',
        referenceId: 'invoice-003',
        referenceType: 'invoice',
        notes: 'چک وصول شده',
        endorsementDate: null,
        endorsementTo: null,
        depositDate: new Date('2024-01-21T00:00:00.000Z'),
        depositBank: 'بانک ملی ایران',
        depositAccount: '1234567890',
        clearanceDate: new Date('2024-01-25T00:00:00.000Z'),
        returnDate: null,
        returnReason: null,
        createdBy: 'system',
        createdAt: '2024-01-20T00:00:00.000Z',
        updatedAt: '2024-01-25T00:00:00.000Z'
      },
      {
        chequeNumber: '5566778899',
        chequeType: 'received',
        amount: 2000000,
        currency: 'IRR',
        bankName: 'بانک ملی ایران',
        bankCode: '017',
        branchName: 'شعبه مرکزی',
        branchCode: '001',
        accountNumber: '1234567890',
        issueDate: new Date('2024-01-05T00:00:00.000Z'),
        dueDate: new Date('2024-01-25T00:00:00.000Z'),
        personId: 'CUST-004',
        personName: 'زهرا موسوی',
        personPhone: '09187654321',
        personAddress: 'تهران، خیابان کریمخان، پلاک 321',
        status: 'returned',
        purpose: 'پرداخت فاکتور فروش',
        reference: 'INV-2024-004',
        referenceId: 'invoice-004',
        referenceType: 'invoice',
        notes: 'چک برگشتی - موجودی کافی نیست',
        endorsementDate: null,
        endorsementTo: null,
        depositDate: new Date('2024-01-26T00:00:00.000Z'),
        depositBank: 'بانک ملی ایران',
        depositAccount: '1234567890',
        clearanceDate: null,
        returnDate: new Date('2024-01-27T00:00:00.000Z'),
        returnReason: 'موجودی کافی نیست',
        createdBy: 'system',
        createdAt: '2024-01-05T00:00:00.000Z',
        updatedAt: '2024-01-27T00:00:00.000Z'
      },
      {
        chequeNumber: '9988776655',
        chequeType: 'paid',
        amount: 4000000,
        currency: 'IRR',
        bankName: 'بانک ملی ایران',
        bankCode: '017',
        branchName: 'شعبه مرکزی',
        branchCode: '001',
        accountNumber: '1234567890',
        issueDate: new Date('2024-01-12T00:00:00.000Z'),
        dueDate: new Date('2024-02-12T00:00:00.000Z'),
        personId: 'SUPP-001',
        personName: 'شرکت مواد غذایی تهران',
        personPhone: '021-12345678',
        personAddress: 'تهران، خیابان ولیعصر، پلاک 123',
        status: 'in_hand',
        purpose: 'پرداخت فاکتور خرید',
        reference: 'PINV-2024-001',
        referenceId: 'purchase-001',
        referenceType: 'invoice',
        notes: 'چک پرداختی به تأمین‌کننده',
        endorsementDate: null,
        endorsementTo: null,
        depositDate: null,
        depositBank: null,
        depositAccount: null,
        clearanceDate: null,
        returnDate: null,
        returnReason: null,
        createdBy: 'system',
        createdAt: '2024-01-12T00:00:00.000Z',
        updatedAt: '2024-01-12T00:00:00.000Z'
      },
      {
        chequeNumber: '4433221100',
        chequeType: 'paid',
        amount: 1500000,
        currency: 'IRR',
        bankName: 'بانک صادرات ایران',
        bankCode: '019',
        branchName: 'شعبه شمال',
        branchCode: '002',
        accountNumber: '0987654321',
        issueDate: new Date('2024-01-18T00:00:00.000Z'),
        dueDate: new Date('2024-02-18T00:00:00.000Z'),
        personId: 'SUPP-002',
        personName: 'تأمین‌کننده سبزیجات',
        personPhone: '09123456789',
        personAddress: 'کرج، جاده مخصوص، کیلومتر 15',
        status: 'endorsed',
        purpose: 'پرداخت فاکتور خرید',
        reference: 'PINV-2024-002',
        referenceId: 'purchase-002',
        referenceType: 'invoice',
        notes: 'چک پشت‌نویسی شده',
        endorsementDate: new Date('2024-01-19T00:00:00.000Z'),
        endorsementTo: 'شرکت مواد غذایی تهران',
        depositDate: null,
        depositBank: null,
        depositAccount: null,
        clearanceDate: null,
        returnDate: null,
        returnReason: null,
        createdBy: 'system',
        createdAt: '2024-01-18T00:00:00.000Z',
        updatedAt: '2024-01-19T00:00:00.000Z'
      },
      {
        chequeNumber: '7788990011',
        chequeType: 'received',
        amount: 6000000,
        currency: 'IRR',
        bankName: 'بانک تجارت',
        bankCode: '018',
        branchName: 'شعبه جنوب',
        branchCode: '003',
        accountNumber: '1122334455',
        issueDate: new Date('2024-01-25T00:00:00.000Z'),
        dueDate: new Date('2024-02-25T00:00:00.000Z'),
        personId: 'CUST-005',
        personName: 'علی نوری',
        personPhone: '09199887766',
        personAddress: 'تهران، خیابان نیاوران، پلاک 555',
        status: 'in_hand',
        purpose: 'پیش‌پرداخت سفارش',
        reference: 'ADV-2024-001',
        referenceId: 'advance-001',
        referenceType: 'advance',
        notes: 'چک پیش‌پرداخت سفارش بزرگ',
        endorsementDate: null,
        endorsementTo: null,
        depositDate: null,
        depositBank: null,
        depositAccount: null,
        clearanceDate: null,
        returnDate: null,
        returnReason: null,
        createdBy: 'system',
        createdAt: '2024-01-25T00:00:00.000Z',
        updatedAt: '2024-01-25T00:00:00.000Z'
      }
    ]

    const result = await collection.insertMany(sampleCheques)

    return NextResponse.json({
      success: true,
      message: `${result.insertedCount} چک نمونه اضافه شد`,
      data: {
        cheques: result.insertedIds
      }
    })
  } catch (error) {
    console.error('Error adding sample cheques:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در اضافه کردن چک‌های نمونه' },
      { status: 500 }
    )
  }
}

