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

// GET - محاسبه ترازنامه (Balance Sheet)
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()
    
    const { searchParams } = new URL(request.url)
    const asOfDate = searchParams.get('asOfDate') // تاریخ ترازنامه (پیش‌فرض: امروز)
    const branchId = searchParams.get('branchId')

    const date = asOfDate ? new Date(asOfDate) : new Date()

    // 1. دارایی‌ها (Assets)
    // 1.1 دارایی‌های جاری (Current Assets)
    // - موجودی نقد و بانک (Cash & Bank)
    const bankAccountsCollection = db.collection('bank_accounts')
    const receiptsPaymentsCollection = db.collection('receipts_payments')
    const invoicesCollection = db.collection('invoices')
    const purchasesCollection = db.collection('purchases')
    const inventoryCollection = db.collection('inventory_items')
    const chequesCollection = db.collection('cheques')
    const customersCollection = db.collection('customers')

    // موجودی حساب‌های بانکی
    const bankAccounts = await bankAccountsCollection.find({
      isActive: true,
      ...(branchId && branchId !== 'all' ? { branchId: new ObjectId(branchId) } : {})
    }).toArray()
    let cashAndBank = 0
    for (const account of bankAccounts) {
      cashAndBank += account.balance || 0
    }

    // موجودی نقد صندوق (از cashier sessions باز)
    const cashierSessionsCollection = db.collection('cashier_sessions')
    const openSessions = await cashierSessionsCollection.find({
      status: 'open',
      ...(branchId && branchId !== 'all' ? { branchId: new ObjectId(branchId) } : {})
    }).toArray()
    for (const session of openSessions) {
      cashAndBank += (session.startAmount || 0) + (session.cashSales || 0)
    }

    // حساب‌های دریافتنی (Accounts Receivable) - فاکتورهای فروش پرداخت نشده
    const unpaidSalesInvoices = await invoicesCollection.aggregate([
      {
        $match: {
          type: 'sales',
          status: { $in: ['sent', 'overdue'] },
          date: { $lte: date },
          ...(branchId && branchId !== 'all' ? { branchId: new ObjectId(branchId) } : {})
        }
      },
      {
        $project: {
          receivable: { $subtract: ['$totalAmount', { $ifNull: ['$paidAmount', 0] }] }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$receivable' }
        }
      }
    ]).toArray()
    const accountsReceivable = unpaidSalesInvoices[0]?.total || 0

    // موجودی کالا (Inventory) - ارزش موجودی
    const inventoryFilter: any = {}
    if (branchId && branchId !== 'all') {
      // اگر branchId داده شده، باید بررسی کنیم که inventory items مربوط به کدام branch هستند
      // برای سادگی، همه موجودی‌ها را در نظر می‌گیریم
    }
    const inventoryItems = await inventoryCollection.find(inventoryFilter).toArray()
    let inventoryValue = 0
    for (const item of inventoryItems) {
      inventoryValue += item.totalValue || 0
    }

    // چک‌های دریافتنی (Cheques Receivable)
    const receivedCheques = await chequesCollection.aggregate([
      {
        $match: {
          chequeType: 'received',
          status: { $in: ['in_hand', 'deposited'] },
          dueDate: { $lte: date }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]).toArray()
    const chequesReceivable = receivedCheques[0]?.total || 0

    const currentAssets = cashAndBank + accountsReceivable + inventoryValue + chequesReceivable

    // 1.2 دارایی‌های ثابت (Fixed Assets)
    // در این پروژه، دارایی‌های ثابت را از receipts-payments با reference='asset' محاسبه می‌کنیم
    const fixedAssetsFilter: any = {
      reference: 'asset',
      type: 'payment',
      status: 'completed',
      date: { $lte: date }
    }
    const fixedAssetsTransactions = await receiptsPaymentsCollection.find(fixedAssetsFilter).toArray()
    let fixedAssets = 0
    for (const transaction of fixedAssetsTransactions) {
      fixedAssets += transaction.amount || 0
    }

    const totalAssets = currentAssets + fixedAssets

    // 2. بدهی‌ها (Liabilities)
    // 2.1 بدهی‌های جاری (Current Liabilities)
    // حساب‌های پرداختنی (Accounts Payable) - فاکتورهای خرید پرداخت نشده
    const unpaidPurchaseInvoices = await invoicesCollection.aggregate([
      {
        $match: {
          type: 'purchase',
          status: { $in: ['sent', 'overdue'] },
          date: { $lte: date },
          ...(branchId && branchId !== 'all' ? { branchId: new ObjectId(branchId) } : {})
        }
      },
      {
        $project: {
          payable: { $subtract: ['$totalAmount', { $ifNull: ['$paidAmount', 0] }] }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$payable' }
        }
      }
    ]).toArray()
    const accountsPayable = unpaidPurchaseInvoices[0]?.total || 0

    // چک‌های پرداختنی (Cheques Payable)
    const paidCheques = await chequesCollection.aggregate([
      {
        $match: {
          chequeType: 'paid',
          status: { $in: ['in_hand', 'deposited'] },
          dueDate: { $lte: date }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]).toArray()
    const chequesPayable = paidCheques[0]?.total || 0

    // مالیات پرداختنی (Tax Payable) - مالیات جمع‌آوری شده اما پرداخت نشده
    const salesInvoicesForTax = await invoicesCollection.aggregate([
      {
        $match: {
          type: 'sales',
          status: 'paid',
          date: { $lte: date },
          ...(branchId && branchId !== 'all' ? { branchId: new ObjectId(branchId) } : {})
        }
      },
      {
        $group: {
          _id: null,
          totalTax: { $sum: { $ifNull: ['$taxAmount', 0] } }
        }
      }
    ]).toArray()
    const taxPayable = salesInvoicesForTax[0]?.totalTax || 0 // می‌تواند دقیق‌تر شود با بررسی پرداخت‌های مالیاتی

    const currentLiabilities = accountsPayable + chequesPayable + taxPayable

    // 2.2 بدهی‌های بلندمدت (Long-term Liabilities)
    // در این پروژه، بدهی‌های بلندمدت را از receipts-payments با reference='loan' محاسبه می‌کنیم
    const longTermLiabilitiesFilter: any = {
      reference: 'loan',
      type: 'receipt',
      status: 'completed',
      date: { $lte: date }
    }
    const longTermLiabilitiesTransactions = await receiptsPaymentsCollection.find(longTermLiabilitiesFilter).toArray()
    let longTermLiabilities = 0
    for (const transaction of longTermLiabilitiesTransactions) {
      longTermLiabilities += transaction.amount || 0
    }

    const totalLiabilities = currentLiabilities + longTermLiabilities

    // 3. سرمایه (Equity)
    // سرمایه اولیه + سود انباشته (Retained Earnings)
    // سود انباشته = مجموع سود خالص از تمام دوره‌ها
    const pnlCollection = db.collection('financial_reports_pnl')
    const pnlReports = await pnlCollection.find({
      ...(branchId && branchId !== 'all' ? { branch: branchId } : {})
    }).toArray()
    let retainedEarnings = 0
    for (const report of pnlReports) {
      retainedEarnings += report.netProfit || 0
    }

    // سرمایه اولیه (می‌توان از تنظیمات یا یک مقدار ثابت استفاده کرد)
    const initialCapital = 100000000 // 100 میلیون تومان (می‌تواند از restaurant_settings خوانده شود)

    const totalEquity = initialCapital + retainedEarnings

    // بررسی: آیا Assets = Liabilities + Equity؟
    const balanceCheck = totalAssets - (totalLiabilities + totalEquity)

    return NextResponse.json({
      success: true,
      data: {
        asOfDate: date.toISOString(),
        assets: {
          current: {
            cashAndBank,
            accountsReceivable,
            inventory: inventoryValue,
            chequesReceivable,
            total: currentAssets
          },
          fixed: {
            fixedAssets,
            total: fixedAssets
          },
          total: totalAssets
        },
        liabilities: {
          current: {
            accountsPayable,
            chequesPayable,
            taxPayable,
            total: currentLiabilities
          },
          longTerm: {
            loans: longTermLiabilities,
            total: longTermLiabilities
          },
          total: totalLiabilities
        },
        equity: {
          initialCapital,
          retainedEarnings,
          total: totalEquity
        },
        balanceCheck: {
          difference: balanceCheck,
          isBalanced: Math.abs(balanceCheck) < 0.01 // با خطای جزئی برای محاسبات اعشاری
        }
      },
      message: 'ترازنامه با موفقیت محاسبه شد'
    })
  } catch (error) {
    console.error('Error calculating balance sheet:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در محاسبه ترازنامه',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

