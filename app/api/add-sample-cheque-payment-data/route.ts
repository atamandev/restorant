import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://restorenUser:1234@localhost:27017/restoren'
const DB_NAME = 'restoren'

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

// POST - اضافه کردن داده نمونه
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()
    
    const chequesCollection = db.collection('cheques')
    const receiptsPaymentsCollection = db.collection('receipts_payments')
    
    const now = new Date()
    
    // داده نمونه چک‌ها
    const sampleCheques = [
      {
        chequeNumber: 'CH-001',
        chequeType: 'received',
        amount: 5000000,
        currency: 'IRR',
        bankName: 'بانک ملی',
        bankCode: '017',
        branchName: 'شعبه مرکزی',
        branchCode: '001',
        accountNumber: '1234567890',
        issueDate: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
        dueDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
        personId: 'person1',
        personName: 'علی احمدی',
        personPhone: '09123456789',
        personAddress: 'تهران، خیابان ولیعصر',
        status: 'in_hand',
        purpose: 'فروش',
        reference: 'INV-001',
        referenceId: 'inv1',
        referenceType: 'invoice',
        notes: 'چک فروش',
        createdBy: 'system',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        chequeNumber: 'CH-002',
        chequeType: 'received',
        amount: 3000000,
        currency: 'IRR',
        bankName: 'بانک صادرات',
        bankCode: '019',
        branchName: 'شعبه 1',
        branchCode: '002',
        accountNumber: '0987654321',
        issueDate: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000),
        dueDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
        personId: 'person2',
        personName: 'فاطمه کریمی',
        personPhone: '09123456780',
        personAddress: 'تهران، خیابان انقلاب',
        status: 'deposited',
        purpose: 'فروش',
        reference: 'INV-002',
        referenceId: 'inv2',
        referenceType: 'invoice',
        depositDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        depositBank: 'بانک ملی',
        depositAccount: '1111111111',
        notes: 'چک واریز شده',
        createdBy: 'system',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        chequeNumber: 'CH-003',
        chequeType: 'received',
        amount: 8000000,
        currency: 'IRR',
        bankName: 'بانک تجارت',
        bankCode: '018',
        branchName: 'شعبه 2',
        branchCode: '003',
        accountNumber: '1122334455',
        issueDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        dueDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
        personId: 'person3',
        personName: 'رضا حسینی',
        personPhone: '09123456781',
        personAddress: 'تهران، خیابان آزادی',
        status: 'cleared',
        purpose: 'فروش',
        reference: 'INV-003',
        referenceId: 'inv3',
        referenceType: 'invoice',
        clearanceDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        notes: 'چک پاس شده',
        createdBy: 'system',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        chequeNumber: 'CH-004',
        chequeType: 'received',
        amount: 2000000,
        currency: 'IRR',
        bankName: 'بانک ملت',
        bankCode: '012',
        branchName: 'شعبه 3',
        branchCode: '004',
        accountNumber: '5566778899',
        issueDate: new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000),
        dueDate: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
        personId: 'person4',
        personName: 'مریم نوری',
        personPhone: '09123456782',
        personAddress: 'تهران， خیابان ولیعصر',
        status: 'returned',
        purpose: 'فروش',
        reference: 'INV-004',
        referenceId: 'inv4',
        referenceType: 'invoice',
        returnDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        returnReason: 'کافی نبودن موجودی',
        notes: 'چک برگشت خورده',
        createdBy: 'system',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]

    // داده نمونه پرداخت‌ها
    const samplePayments = [
      {
        transactionNumber: 'PAY-001',
        type: 'payment',
        amount: 1500000,
        method: 'cash',
        status: 'completed',
        personId: 'supplier1',
        personName: 'تامین‌کننده مواد غذایی',
        personType: 'supplier',
        reference: 'purchase',
        referenceId: 'po1',
        description: 'پرداخت نقدی خرید مواد اولیه',
        notes: 'پرداخت به تامین‌کننده',
        date: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
        createdBy: 'system',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        transactionNumber: 'PAY-002',
        type: 'payment',
        amount: 800000,
        method: 'bank_transfer',
        status: 'completed',
        personId: 'employee1',
        personName: 'کارکنان رستوران',
        personType: 'employee',
        reference: 'salary',
        referenceId: 'sal1',
        description: 'پرداخت حقوق کارکنان',
        notes: 'حقوق ماهانه',
        date: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
        createdBy: 'system',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        transactionNumber: 'PAY-003',
        type: 'payment',
        amount: 500000,
        method: 'card',
        status: 'completed',
        personId: 'vendor1',
        personName: 'شرکت خدمات',
        personType: 'supplier',
        reference: 'expense',
        referenceId: 'exp1',
        description: 'پرداخت هزینه‌های عملیاتی',
        notes: 'هزینه خدمات',
        date: new Date(now.getTime() - 11 * 24 * 60 * 60 * 1000),
        createdBy: 'system',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        transactionNumber: 'REC-001',
        type: 'receipt',
        amount: 12000000,
        method: 'cash',
        status: 'completed',
        personId: 'customer1',
        personName: 'مشتری نقدی',
        personType: 'customer',
        reference: 'sale',
        referenceId: 'sale1',
        description: 'دریافت نقدی فروش',
        notes: 'فروش روزانه',
        date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        createdBy: 'system',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        transactionNumber: 'REC-002',
        type: 'receipt',
        amount: 5000000,
        method: 'card',
        status: 'completed',
        personId: 'customer2',
        personName: 'مشتری کارتی',
        personType: 'customer',
        reference: 'sale',
        referenceId: 'sale2',
        description: 'دریافت کارتی فروش',
        notes: 'فروش با کارت',
        date: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
        createdBy: 'system',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]

    // بررسی وجود داده
    const existingCheques = await chequesCollection.countDocuments()
    const existingPayments = await receiptsPaymentsCollection.countDocuments()

    if (existingCheques === 0) {
      await chequesCollection.insertMany(sampleCheques)
    }

    if (existingPayments === 0) {
      await receiptsPaymentsCollection.insertMany(samplePayments)
    }

    return NextResponse.json({
      success: true,
      message: 'داده‌های نمونه با موفقیت اضافه شدند',
      data: {
        chequesAdded: existingCheques === 0 ? sampleCheques.length : 0,
        paymentsAdded: existingPayments === 0 ? samplePayments.length : 0
      }
    })
  } catch (error) {
    console.error('Error adding sample data:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در اضافه کردن داده‌های نمونه', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

