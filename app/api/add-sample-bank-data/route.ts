import { NextRequest, NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'

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

// POST - اضافه کردن داده‌های نمونه بانکی
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()
    const bankAccountsCollection = db.collection('bank_accounts')
    const bankTransactionsCollection = db.collection('bank_transactions')
    const bankReconciliationsCollection = db.collection('bank_reconciliations')
    
    // پاک کردن داده‌های قبلی
    await bankAccountsCollection.deleteMany({})
    await bankTransactionsCollection.deleteMany({})
    await bankReconciliationsCollection.deleteMany({})
    
    // اضافه کردن حساب‌های بانکی نمونه
    const sampleBankAccounts = [
      {
        accountNumber: '1234567890',
        accountName: 'حساب جاری شعبه مرکزی',
        bankName: 'بانک ملی ایران',
        bankCode: '017',
        branchName: 'شعبه مرکزی',
        branchCode: '001',
        accountType: 'checking',
        currency: 'IRR',
        initialBalance: 50000000,
        currentBalance: 50000000,
        status: 'active',
        branchId: 'BR-001',
        accountHolder: 'رستوران تهران',
        accountHolderId: 'REST-001',
        iban: 'IR123456789012345678901234',
        swiftCode: 'BMIRIRTH',
        openingDate: new Date('2023-01-01T00:00:00.000Z'),
        lastTransactionDate: null,
        notes: 'حساب اصلی رستوران',
        createdBy: 'system',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      },
      {
        accountNumber: '0987654321',
        accountName: 'حساب پس‌انداز شعبه مرکزی',
        bankName: 'بانک ملی ایران',
        bankCode: '017',
        branchName: 'شعبه مرکزی',
        branchCode: '001',
        accountType: 'savings',
        currency: 'IRR',
        initialBalance: 100000000,
        currentBalance: 100000000,
        status: 'active',
        branchId: 'BR-001',
        accountHolder: 'رستوران تهران',
        accountHolderId: 'REST-001',
        iban: 'IR098765432109876543210987',
        swiftCode: 'BMIRIRTH',
        openingDate: new Date('2023-01-01T00:00:00.000Z'),
        lastTransactionDate: null,
        notes: 'حساب پس‌انداز رستوران',
        createdBy: 'system',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      },
      {
        accountNumber: '1122334455',
        accountName: 'حساب جاری شعبه شمال',
        bankName: 'بانک صادرات ایران',
        bankCode: '019',
        branchName: 'شعبه شمال',
        branchCode: '002',
        accountType: 'checking',
        currency: 'IRR',
        initialBalance: 25000000,
        currentBalance: 25000000,
        status: 'active',
        branchId: 'BR-002',
        accountHolder: 'رستوران تهران',
        accountHolderId: 'REST-001',
        iban: 'IR112233445511223344551122',
        swiftCode: 'BKIDIRTH',
        openingDate: new Date('2023-06-01T00:00:00.000Z'),
        lastTransactionDate: null,
        notes: 'حساب شعبه شمال',
        createdBy: 'system',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      },
      {
        accountNumber: '5566778899',
        accountName: 'حساب تجاری شعبه جنوب',
        bankName: 'بانک تجارت',
        bankCode: '018',
        branchName: 'شعبه جنوب',
        branchCode: '003',
        accountType: 'business',
        currency: 'IRR',
        initialBalance: 75000000,
        currentBalance: 75000000,
        status: 'active',
        branchId: 'BR-003',
        accountHolder: 'رستوران تهران',
        accountHolderId: 'REST-001',
        iban: 'IR556677889955667788995566',
        swiftCode: 'BTEJIRTH',
        openingDate: new Date('2023-03-01T00:00:00.000Z'),
        lastTransactionDate: null,
        notes: 'حساب تجاری شعبه جنوب',
        createdBy: 'system',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      }
    ]

    const bankAccountsResult = await bankAccountsCollection.insertMany(sampleBankAccounts)
    const accountIds = Object.values(bankAccountsResult.insertedIds)

    // اضافه کردن تراکنش‌های بانکی نمونه
    const sampleTransactions = [
      {
        transactionNumber: 'TXN-20240101-0001',
        accountId: accountIds[0], // حساب جاری شعبه مرکزی
        transactionType: 'deposit',
        amount: 5000000,
        currency: 'IRR',
        date: new Date('2024-01-15T10:00:00.000Z'),
        description: 'واریز فروش روزانه',
        reference: 'SALE-001',
        fee: 0,
        balanceAfter: 55000000,
        status: 'completed',
        createdBy: 'system',
        createdAt: '2024-01-15T10:00:00.000Z',
        updatedAt: '2024-01-15T10:00:00.000Z'
      },
      {
        transactionNumber: 'TXN-20240115-0001',
        accountId: accountIds[0],
        transactionType: 'withdrawal',
        amount: 2000000,
        currency: 'IRR',
        date: new Date('2024-01-15T14:00:00.000Z'),
        description: 'برداشت برای خرید مواد اولیه',
        reference: 'PURCHASE-001',
        fee: 5000,
        balanceAfter: 52950000,
        status: 'completed',
        createdBy: 'system',
        createdAt: '2024-01-15T14:00:00.000Z',
        updatedAt: '2024-01-15T14:00:00.000Z'
      },
      {
        transactionNumber: 'TXN-20240116-0001',
        accountId: accountIds[0],
        transactionType: 'transfer',
        amount: 1000000,
        currency: 'IRR',
        date: new Date('2024-01-16T09:00:00.000Z'),
        description: 'انتقال به حساب پس‌انداز',
        reference: 'TRANSFER-001',
        relatedAccountId: accountIds[1], // حساب پس‌انداز
        fee: 10000,
        balanceAfter: 51940000,
        status: 'completed',
        createdBy: 'system',
        createdAt: '2024-01-16T09:00:00.000Z',
        updatedAt: '2024-01-16T09:00:00.000Z'
      },
      {
        transactionNumber: 'TXN-20240116-0002',
        accountId: accountIds[1], // حساب پس‌انداز
        transactionType: 'deposit',
        amount: 1000000,
        currency: 'IRR',
        date: new Date('2024-01-16T09:00:00.000Z'),
        description: 'دریافت انتقال از حساب جاری',
        reference: 'TRANSFER-001',
        relatedTransactionId: null,
        fee: 0,
        balanceAfter: 101000000,
        status: 'completed',
        createdBy: 'system',
        createdAt: '2024-01-16T09:00:00.000Z',
        updatedAt: '2024-01-16T09:00:00.000Z'
      },
      {
        transactionNumber: 'TXN-20240117-0001',
        accountId: accountIds[2], // حساب شعبه شمال
        transactionType: 'deposit',
        amount: 3000000,
        currency: 'IRR',
        date: new Date('2024-01-17T11:00:00.000Z'),
        description: 'واریز فروش شعبه شمال',
        reference: 'SALE-002',
        fee: 0,
        balanceAfter: 28000000,
        status: 'completed',
        createdBy: 'system',
        createdAt: '2024-01-17T11:00:00.000Z',
        updatedAt: '2024-01-17T11:00:00.000Z'
      },
      {
        transactionNumber: 'TXN-20240118-0001',
        accountId: accountIds[3], // حساب تجاری شعبه جنوب
        transactionType: 'withdrawal',
        amount: 5000000,
        currency: 'IRR',
        date: new Date('2024-01-18T15:00:00.000Z'),
        description: 'برداشت برای پرداخت حقوق کارکنان',
        reference: 'SALARY-001',
        fee: 15000,
        balanceAfter: 69985000,
        status: 'completed',
        createdBy: 'system',
        createdAt: '2024-01-18T15:00:00.000Z',
        updatedAt: '2024-01-18T15:00:00.000Z'
      },
      {
        transactionNumber: 'TXN-20240119-0001',
        accountId: accountIds[0],
        transactionType: 'fee',
        amount: 25000,
        currency: 'IRR',
        date: new Date('2024-01-19T00:00:00.000Z'),
        description: 'کارمزد ماهانه حساب',
        reference: 'MONTHLY-FEE',
        fee: 25000,
        balanceAfter: 51915000,
        status: 'completed',
        createdBy: 'system',
        createdAt: '2024-01-19T00:00:00.000Z',
        updatedAt: '2024-01-19T00:00:00.000Z'
      }
    ]

    const transactionsResult = await bankTransactionsCollection.insertMany(sampleTransactions)

    // اضافه کردن تطبیق‌های حساب نمونه
    const sampleReconciliations = [
      {
        accountId: accountIds[0],
        reconciliationDate: new Date('2024-01-31T00:00:00.000Z'),
        statementBalance: 51915000,
        bookBalance: 51915000,
        discrepancyAmount: 0,
        status: 'completed',
        notes: 'تطبیق ماهانه حساب جاری - بدون مغایرت',
        discrepancies: [],
        createdBy: 'system',
        createdAt: '2024-01-31T00:00:00.000Z',
        updatedAt: '2024-01-31T00:00:00.000Z'
      },
      {
        accountId: accountIds[1],
        reconciliationDate: new Date('2024-01-31T00:00:00.000Z'),
        statementBalance: 101000000,
        bookBalance: 101000000,
        discrepancyAmount: 0,
        status: 'completed',
        notes: 'تطبیق ماهانه حساب پس‌انداز - بدون مغایرت',
        discrepancies: [],
        createdBy: 'system',
        createdAt: '2024-01-31T00:00:00.000Z',
        updatedAt: '2024-01-31T00:00:00.000Z'
      }
    ]

    const reconciliationsResult = await bankReconciliationsCollection.insertMany(sampleReconciliations)

    return NextResponse.json({
      success: true,
      message: `داده‌های نمونه بانکی اضافه شد: ${sampleBankAccounts.length} حساب، ${sampleTransactions.length} تراکنش، ${sampleReconciliations.length} تطبیق`,
      data: {
        bankAccounts: bankAccountsResult.insertedIds,
        transactions: transactionsResult.insertedIds,
        reconciliations: reconciliationsResult.insertedIds
      }
    })
  } catch (error) {
    console.error('Error adding sample bank data:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در اضافه کردن داده‌های نمونه بانکی' },
      { status: 500 }
    )
  }
}

