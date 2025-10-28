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

// POST - اضافه کردن داده‌های نمونه جریان نقدی
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()
    const collection = db.collection('cash_flow')
    
    // پاک کردن داده‌های قبلی
    await collection.deleteMany({})
    
    // اضافه کردن تراکنش‌های جریان نقدی نمونه
    const sampleCashFlow = [
      // ورودی‌ها (Inflow)
      {
        transactionId: 'CF-IN-001',
        type: 'inflow',
        category: 'sales',
        amount: 2500000,
        currency: 'IRR',
        description: 'فروش غذاهای اصلی',
        reference: 'invoice',
        referenceId: 'INV-001',
        branchId: 'BR-001',
        branchName: 'شعبه مرکزی',
        accountId: 'ACC-001',
        accountName: 'حساب نقدی',
        paymentMethod: 'cash',
        date: new Date('2024-01-15T14:30:00.000Z'),
        createdBy: 'system',
        createdAt: '2024-01-15T14:30:00.000Z',
        updatedAt: '2024-01-15T14:30:00.000Z'
      },
      {
        transactionId: 'CF-IN-002',
        type: 'inflow',
        category: 'sales',
        amount: 1800000,
        currency: 'IRR',
        description: 'فروش نوشیدنی‌ها',
        reference: 'invoice',
        referenceId: 'INV-002',
        branchId: 'BR-001',
        branchName: 'شعبه مرکزی',
        accountId: 'ACC-001',
        accountName: 'حساب نقدی',
        paymentMethod: 'card',
        date: new Date('2024-01-15T15:45:00.000Z'),
        createdBy: 'system',
        createdAt: '2024-01-15T15:45:00.000Z',
        updatedAt: '2024-01-15T15:45:00.000Z'
      },
      {
        transactionId: 'CF-IN-003',
        type: 'inflow',
        category: 'sales',
        amount: 3200000,
        currency: 'IRR',
        description: 'فروش دسرها',
        reference: 'invoice',
        referenceId: 'INV-003',
        branchId: 'BR-002',
        branchName: 'شعبه شمال',
        accountId: 'ACC-002',
        accountName: 'حساب بانکی',
        paymentMethod: 'bank_transfer',
        date: new Date('2024-01-15T16:20:00.000Z'),
        createdBy: 'system',
        createdAt: '2024-01-15T16:20:00.000Z',
        updatedAt: '2024-01-15T16:20:00.000Z'
      },
      {
        transactionId: 'CF-IN-004',
        type: 'inflow',
        category: 'loans',
        amount: 5000000,
        currency: 'IRR',
        description: 'وام بانکی',
        reference: 'loan',
        referenceId: 'LOAN-001',
        branchId: 'BR-001',
        branchName: 'شعبه مرکزی',
        accountId: 'ACC-003',
        accountName: 'حساب بانکی اصلی',
        paymentMethod: 'bank_transfer',
        date: new Date('2024-01-14T10:00:00.000Z'),
        createdBy: 'system',
        createdAt: '2024-01-14T10:00:00.000Z',
        updatedAt: '2024-01-14T10:00:00.000Z'
      },
      {
        transactionId: 'CF-IN-005',
        type: 'inflow',
        category: 'investments',
        amount: 10000000,
        currency: 'IRR',
        description: 'سرمایه‌گذاری جدید',
        reference: 'investment',
        referenceId: 'INV-001',
        branchId: 'BR-001',
        branchName: 'شعبه مرکزی',
        accountId: 'ACC-003',
        accountName: 'حساب بانکی اصلی',
        paymentMethod: 'bank_transfer',
        date: new Date('2024-01-13T09:00:00.000Z'),
        createdBy: 'system',
        createdAt: '2024-01-13T09:00:00.000Z',
        updatedAt: '2024-01-13T09:00:00.000Z'
      },

      // خروجی‌ها (Outflow)
      {
        transactionId: 'CF-OUT-001',
        type: 'outflow',
        category: 'purchases',
        amount: 1500000,
        currency: 'IRR',
        description: 'خرید مواد اولیه',
        reference: 'purchase',
        referenceId: 'PUR-001',
        branchId: 'BR-001',
        branchName: 'شعبه مرکزی',
        accountId: 'ACC-001',
        accountName: 'حساب نقدی',
        paymentMethod: 'cash',
        date: new Date('2024-01-15T08:00:00.000Z'),
        createdBy: 'system',
        createdAt: '2024-01-15T08:00:00.000Z',
        updatedAt: '2024-01-15T08:00:00.000Z'
      },
      {
        transactionId: 'CF-OUT-002',
        type: 'outflow',
        category: 'expenses',
        amount: 800000,
        currency: 'IRR',
        description: 'هزینه برق و گاز',
        reference: 'expense',
        referenceId: 'EXP-001',
        branchId: 'BR-001',
        branchName: 'شعبه مرکزی',
        accountId: 'ACC-002',
        accountName: 'حساب بانکی',
        paymentMethod: 'bank_transfer',
        date: new Date('2024-01-15T11:30:00.000Z'),
        createdBy: 'system',
        createdAt: '2024-01-15T11:30:00.000Z',
        updatedAt: '2024-01-15T11:30:00.000Z'
      },
      {
        transactionId: 'CF-OUT-003',
        type: 'outflow',
        category: 'expenses',
        amount: 1200000,
        currency: 'IRR',
        description: 'حقوق کارکنان',
        reference: 'salary',
        referenceId: 'SAL-001',
        branchId: 'BR-001',
        branchName: 'شعبه مرکزی',
        accountId: 'ACC-002',
        accountName: 'حساب بانکی',
        paymentMethod: 'bank_transfer',
        date: new Date('2024-01-14T12:00:00.000Z'),
        createdBy: 'system',
        createdAt: '2024-01-14T12:00:00.000Z',
        updatedAt: '2024-01-14T12:00:00.000Z'
      },
      {
        transactionId: 'CF-OUT-004',
        type: 'outflow',
        category: 'purchases',
        amount: 2000000,
        currency: 'IRR',
        description: 'خرید تجهیزات آشپزخانه',
        reference: 'purchase',
        referenceId: 'PUR-002',
        branchId: 'BR-002',
        branchName: 'شعبه شمال',
        accountId: 'ACC-004',
        accountName: 'حساب بانکی شعبه شمال',
        paymentMethod: 'cheque',
        date: new Date('2024-01-13T14:15:00.000Z'),
        createdBy: 'system',
        createdAt: '2024-01-13T14:15:00.000Z',
        updatedAt: '2024-01-13T14:15:00.000Z'
      },
      {
        transactionId: 'CF-OUT-005',
        type: 'outflow',
        category: 'expenses',
        amount: 600000,
        currency: 'IRR',
        description: 'هزینه بازاریابی',
        reference: 'expense',
        referenceId: 'EXP-002',
        branchId: 'BR-001',
        branchName: 'شعبه مرکزی',
        accountId: 'ACC-001',
        accountName: 'حساب نقدی',
        paymentMethod: 'cash',
        date: new Date('2024-01-12T16:45:00.000Z'),
        createdBy: 'system',
        createdAt: '2024-01-12T16:45:00.000Z',
        updatedAt: '2024-01-12T16:45:00.000Z'
      },
      {
        transactionId: 'CF-OUT-006',
        type: 'outflow',
        category: 'investments',
        amount: 3000000,
        currency: 'IRR',
        description: 'سرمایه‌گذاری در تجهیزات',
        reference: 'investment',
        referenceId: 'INV-002',
        branchId: 'BR-003',
        branchName: 'شعبه جنوب',
        accountId: 'ACC-005',
        accountName: 'حساب بانکی شعبه جنوب',
        paymentMethod: 'bank_transfer',
        date: new Date('2024-01-11T10:30:00.000Z'),
        createdBy: 'system',
        createdAt: '2024-01-11T10:30:00.000Z',
        updatedAt: '2024-01-11T10:30:00.000Z'
      },
      {
        transactionId: 'CF-OUT-007',
        type: 'outflow',
        category: 'expenses',
        amount: 400000,
        currency: 'IRR',
        description: 'هزینه بیمه',
        reference: 'expense',
        referenceId: 'EXP-003',
        branchId: 'BR-001',
        branchName: 'شعبه مرکزی',
        accountId: 'ACC-002',
        accountName: 'حساب بانکی',
        paymentMethod: 'bank_transfer',
        date: new Date('2024-01-10T09:15:00.000Z'),
        createdBy: 'system',
        createdAt: '2024-01-10T09:15:00.000Z',
        updatedAt: '2024-01-10T09:15:00.000Z'
      },
      {
        transactionId: 'CF-OUT-008',
        type: 'outflow',
        category: 'purchases',
        amount: 900000,
        currency: 'IRR',
        description: 'خرید مواد غذایی',
        reference: 'purchase',
        referenceId: 'PUR-003',
        branchId: 'BR-004',
        branchName: 'شعبه شرق',
        accountId: 'ACC-006',
        accountName: 'حساب بانکی شعبه شرق',
        paymentMethod: 'card',
        date: new Date('2024-01-09T13:20:00.000Z'),
        createdBy: 'system',
        createdAt: '2024-01-09T13:20:00.000Z',
        updatedAt: '2024-01-09T13:20:00.000Z'
      }
    ]

    const result = await collection.insertMany(sampleCashFlow)

    return NextResponse.json({
      success: true,
      message: `داده‌های نمونه جریان نقدی اضافه شد: ${sampleCashFlow.length} تراکنش`,
      data: {
        transactions: result.insertedIds,
        summary: {
          totalInflow: sampleCashFlow.filter(t => t.type === 'inflow').reduce((sum, t) => sum + t.amount, 0),
          totalOutflow: sampleCashFlow.filter(t => t.type === 'outflow').reduce((sum, t) => sum + t.amount, 0),
          netCashFlow: sampleCashFlow.filter(t => t.type === 'inflow').reduce((sum, t) => sum + t.amount, 0) - 
                      sampleCashFlow.filter(t => t.type === 'outflow').reduce((sum, t) => sum + t.amount, 0)
        }
      }
    })
  } catch (error) {
    console.error('Error adding sample cash flow data:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در اضافه کردن داده‌های نمونه جریان نقدی' },
      { status: 500 }
    )
  }
}
