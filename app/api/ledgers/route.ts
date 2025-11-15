import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://admin:StrongPassword123@185.204.169.107:27017/restaurant?authSource=admin'
const DB_NAME = 'restaurant'
const COLLECTION_NAME = 'general_ledger'

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

// GET - دریافت دفاتر کل و معین
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    const receiptsPaymentsCollection = db.collection('receipts_payments')
    const invoicesCollection = db.collection('invoices')
    const purchasesCollection = db.collection('purchases')
    const bankAccountsCollection = db.collection('bank_accounts')
    
    const { searchParams } = new URL(request.url)
    const reportType = searchParams.get('reportType') // 'general', 'subsidiary', 'journal'
    const accountCode = searchParams.get('accountCode')
    const accountName = searchParams.get('accountName')
    const entityId = searchParams.get('entityId') // برای دفتر معین
    const entityType = searchParams.get('entityType') // 'customer', 'supplier', 'employee'
    const fromDate = searchParams.get('fromDate')
    const toDate = searchParams.get('toDate')
    const sortBy = searchParams.get('sortBy') || 'date'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const limit = parseInt(searchParams.get('limit') || '1000')
    const skip = parseInt(searchParams.get('skip') || '0')

    // اگر reportType = 'journal' باشد، از receipts_payments و invoices و purchases استفاده کن
    if (reportType === 'journal') {
      const journalEntries: any[] = []
      
      // دریافت از receipts_payments
      const receiptsPaymentsFilter: any = {}
      if (fromDate || toDate) {
        receiptsPaymentsFilter.date = {}
        if (fromDate) receiptsPaymentsFilter.date.$gte = new Date(fromDate)
        if (toDate) receiptsPaymentsFilter.date.$lte = new Date(toDate)
      }
      
      const receiptsPayments = await receiptsPaymentsCollection
        .find(receiptsPaymentsFilter)
        .sort({ date: -1 })
        .limit(limit)
        .skip(skip)
        .toArray()

      for (const transaction of receiptsPayments) {
        // بدهکار: صندوق/بانک (دریافت)
        if (transaction.type === 'receipt') {
          journalEntries.push({
            id: transaction._id?.toString() || '',
            date: transaction.date,
            documentNumber: `RP-${transaction._id?.toString().substring(0, 8) || ''}`,
            description: transaction.description || `دریافت از ${transaction.personName || 'نامشخص'}`,
            account: transaction.method === 'cash' ? 'صندوق' : transaction.method === 'bank_transfer' ? 'بانک' : 'صندوق',
            debit: transaction.amount || 0,
            credit: 0,
            balance: 0,
            reference: transaction.reference || '',
            branch: transaction.branchName || 'نامشخص',
            user: transaction.createdBy || 'system'
          })
          
          // بستانکار: حساب دریافتنی/فروش
          journalEntries.push({
            id: `${transaction._id?.toString()}-credit`,
            date: transaction.date,
            documentNumber: `RP-${transaction._id?.toString().substring(0, 8) || ''}`,
            description: transaction.description || `دریافت از ${transaction.personName || 'نامشخص'}`,
            account: transaction.referenceType === 'invoice' ? 'فروش' : 'دریافتنی',
            debit: 0,
            credit: transaction.amount || 0,
            balance: 0,
            reference: transaction.reference || '',
            branch: transaction.branchName || 'نامشخص',
            user: transaction.createdBy || 'system'
          })
        } else if (transaction.type === 'payment') {
          // بدهکار: حساب پرداختنی/خرید
          journalEntries.push({
            id: transaction._id?.toString() || '',
            date: transaction.date,
            documentNumber: `RP-${transaction._id?.toString().substring(0, 8) || ''}`,
            description: transaction.description || `پرداخت به ${transaction.personName || 'نامشخص'}`,
            account: transaction.referenceType === 'purchase' ? 'خرید' : 'پرداختنی',
            debit: transaction.amount || 0,
            credit: 0,
            balance: 0,
            reference: transaction.reference || '',
            branch: transaction.branchName || 'نامشخص',
            user: transaction.createdBy || 'system'
          })
          
          // بستانکار: صندوق/بانک (پرداخت)
          journalEntries.push({
            id: `${transaction._id?.toString()}-credit`,
            date: transaction.date,
            documentNumber: `RP-${transaction._id?.toString().substring(0, 8) || ''}`,
            description: transaction.description || `پرداخت به ${transaction.personName || 'نامشخص'}`,
            account: transaction.method === 'cash' ? 'صندوق' : transaction.method === 'bank_transfer' ? 'بانک' : 'صندوق',
            debit: 0,
            credit: transaction.amount || 0,
            balance: 0,
            reference: transaction.reference || '',
            branch: transaction.branchName || 'نامشخص',
            user: transaction.createdBy || 'system'
          })
        }
      }

      // دریافت از invoices (فروش)
      const invoicesFilter: any = {}
      if (fromDate || toDate) {
        invoicesFilter.createdAt = {}
        if (fromDate) invoicesFilter.createdAt.$gte = new Date(fromDate)
        if (toDate) invoicesFilter.createdAt.$lte = new Date(toDate)
      }
      
      const invoices = await invoicesCollection
        .find(invoicesFilter)
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .toArray()

      for (const invoice of invoices) {
        const totalAmount = invoice.totalAmount || invoice.amount || 0
        
        // بدهکار: حساب دریافتنی/صندوق
        journalEntries.push({
          id: invoice._id?.toString() || '',
          date: invoice.createdAt || new Date(),
          documentNumber: invoice.invoiceNumber || `INV-${invoice._id?.toString().substring(0, 8) || ''}`,
          description: `فروش - فاکتور ${invoice.invoiceNumber || ''}`,
          account: invoice.paymentMethod === 'cash' ? 'صندوق' : 'دریافتنی',
          debit: totalAmount,
          credit: 0,
          balance: 0,
          reference: invoice.invoiceNumber || '',
          branch: invoice.branchName || 'نامشخص',
          user: invoice.createdBy || 'system'
        })
        
        // بستانکار: فروش
        journalEntries.push({
          id: `${invoice._id?.toString()}-credit`,
          date: invoice.createdAt || new Date(),
          documentNumber: invoice.invoiceNumber || `INV-${invoice._id?.toString().substring(0, 8) || ''}`,
          description: `فروش - فاکتور ${invoice.invoiceNumber || ''}`,
          account: 'فروش',
          debit: 0,
          credit: totalAmount,
          balance: 0,
          reference: invoice.invoiceNumber || '',
          branch: invoice.branchName || 'نامشخص',
          user: invoice.createdBy || 'system'
        })
      }

      // دریافت از purchases (خرید)
      const purchasesFilter: any = {}
      if (fromDate || toDate) {
        purchasesFilter.createdAt = {}
        if (fromDate) purchasesFilter.createdAt.$gte = new Date(fromDate)
        if (toDate) purchasesFilter.createdAt.$lte = new Date(toDate)
      }
      
      const purchases = await purchasesCollection
        .find(purchasesFilter)
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .toArray()

      for (const purchase of purchases) {
        const totalAmount = purchase.totalAmount || purchase.amount || 0
        
        // بدهکار: خرید/موجودی
        journalEntries.push({
          id: purchase._id?.toString() || '',
          date: purchase.createdAt || new Date(),
          documentNumber: purchase.invoiceNumber || `PUR-${purchase._id?.toString().substring(0, 8) || ''}`,
          description: `خرید - فاکتور ${purchase.invoiceNumber || ''}`,
          account: 'خرید',
          debit: totalAmount,
          credit: 0,
          balance: 0,
          reference: purchase.invoiceNumber || '',
          branch: purchase.branchName || 'نامشخص',
          user: purchase.createdBy || 'system'
        })
        
        // بستانکار: حساب پرداختنی/بانک
        journalEntries.push({
          id: `${purchase._id?.toString()}-credit`,
          date: purchase.createdAt || new Date(),
          documentNumber: purchase.invoiceNumber || `PUR-${purchase._id?.toString().substring(0, 8) || ''}`,
          description: `خرید - فاکتور ${purchase.invoiceNumber || ''}`,
          account: purchase.paymentMethod === 'bank_transfer' ? 'بانک' : 'پرداختنی',
          debit: 0,
          credit: totalAmount,
          balance: 0,
          reference: purchase.invoiceNumber || '',
          branch: purchase.branchName || 'نامشخص',
          user: purchase.createdBy || 'system'
        })
      }

      // مرتب‌سازی بر اساس تاریخ
      journalEntries.sort((a, b) => {
        const dateA = new Date(a.date).getTime()
        const dateB = new Date(b.date).getTime()
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA
      })

      return NextResponse.json({
        success: true,
        data: journalEntries,
        message: 'دفتر روزنامه با موفقیت دریافت شد'
      })
    }

    // اگر reportType = 'general' باشد، خلاصه حساب‌ها را برگردان
    if (reportType === 'general') {
      const accountsMap = new Map<string, {
        code: string
        name: string
        type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'
        debitTotal: number
        creditTotal: number
        balance: number
        entries: number
      }>()

      // دریافت از receipts_payments
      const receiptsPaymentsFilter: any = {}
      if (fromDate || toDate) {
        receiptsPaymentsFilter.date = {}
        if (fromDate) receiptsPaymentsFilter.date.$gte = new Date(fromDate)
        if (toDate) receiptsPaymentsFilter.date.$lte = new Date(toDate)
      }

      const receiptsPayments = await receiptsPaymentsCollection.find(receiptsPaymentsFilter).toArray()

      for (const transaction of receiptsPayments) {
        if (transaction.type === 'receipt') {
          const accountName = transaction.method === 'cash' ? 'صندوق' : transaction.method === 'bank_transfer' ? 'بانک' : 'صندوق'
          if (!accountsMap.has(accountName)) {
            accountsMap.set(accountName, {
              code: accountName,
              name: accountName,
              type: 'asset',
              debitTotal: 0,
              creditTotal: 0,
              balance: 0,
              entries: 0
            })
          }
          const account = accountsMap.get(accountName)!
          account.debitTotal += transaction.amount || 0
          account.entries++
        } else {
          const accountName = transaction.method === 'cash' ? 'صندوق' : transaction.method === 'bank_transfer' ? 'بانک' : 'صندوق'
          if (!accountsMap.has(accountName)) {
            accountsMap.set(accountName, {
              code: accountName,
              name: accountName,
              type: 'asset',
              debitTotal: 0,
              creditTotal: 0,
              balance: 0,
              entries: 0
            })
          }
          const account = accountsMap.get(accountName)!
          account.creditTotal += transaction.amount || 0
          account.entries++
        }
      }

      // دریافت از invoices
      const invoicesFilter: any = {}
      if (fromDate || toDate) {
        invoicesFilter.createdAt = {}
        if (fromDate) invoicesFilter.createdAt.$gte = new Date(fromDate)
        if (toDate) invoicesFilter.createdAt.$lte = new Date(toDate)
      }

      const invoices = await invoicesCollection.find(invoicesFilter).toArray()

      for (const invoice of invoices) {
        const totalAmount = invoice.totalAmount || invoice.amount || 0
        
        // حساب فروش
        if (!accountsMap.has('فروش')) {
          accountsMap.set('فروش', {
            code: '4000',
            name: 'فروش',
            type: 'revenue',
            debitTotal: 0,
            creditTotal: 0,
            balance: 0,
            entries: 0
          })
        }
        const salesAccount = accountsMap.get('فروش')!
        salesAccount.creditTotal += totalAmount
        salesAccount.entries++
      }

      // دریافت از purchases
      const purchasesFilter: any = {}
      if (fromDate || toDate) {
        purchasesFilter.createdAt = {}
        if (fromDate) purchasesFilter.createdAt.$gte = new Date(fromDate)
        if (toDate) purchasesFilter.createdAt.$lte = new Date(toDate)
      }

      const purchases = await purchasesCollection.find(purchasesFilter).toArray()

      for (const purchase of purchases) {
        const totalAmount = purchase.totalAmount || purchase.amount || 0
        
        // حساب خرید
        if (!accountsMap.has('خرید')) {
          accountsMap.set('خرید', {
            code: '5000',
            name: 'خرید',
            type: 'expense',
            debitTotal: 0,
            creditTotal: 0,
            balance: 0,
            entries: 0
          })
        }
        const purchaseAccount = accountsMap.get('خرید')!
        purchaseAccount.debitTotal += totalAmount
        purchaseAccount.entries++
      }

      // محاسبه مانده
      for (const account of accountsMap.values()) {
        if (account.type === 'asset' || account.type === 'expense') {
          account.balance = account.debitTotal - account.creditTotal
        } else {
          account.balance = account.creditTotal - account.debitTotal
        }
      }

      const accounts = Array.from(accountsMap.values())

      return NextResponse.json({
        success: true,
        data: accounts,
        message: 'دفتر کل با موفقیت دریافت شد'
      })
    }

    // اگر reportType = 'subsidiary' باشد، دفتر معین را برگردان
    if (reportType === 'subsidiary') {
      const subsidiaryEntries: any[] = []
      
      if (entityId && entityType) {
        const receiptsPaymentsFilter: any = {
          personId: entityId
        }
        if (fromDate || toDate) {
          receiptsPaymentsFilter.date = {}
          if (fromDate) receiptsPaymentsFilter.date.$gte = new Date(fromDate)
          if (toDate) receiptsPaymentsFilter.date.$lte = new Date(toDate)
        }

        const transactions = await receiptsPaymentsCollection
          .find(receiptsPaymentsFilter)
          .sort({ date: -1 })
          .limit(limit)
          .skip(skip)
          .toArray()

        let runningBalance = 0

        for (const transaction of transactions) {
          if (transaction.type === 'receipt') {
            runningBalance += transaction.amount || 0
          } else {
            runningBalance -= transaction.amount || 0
          }

          subsidiaryEntries.push({
            id: transaction._id?.toString() || '',
            date: transaction.date,
            documentNumber: transaction.reference || `RP-${transaction._id?.toString().substring(0, 8) || ''}`,
            description: transaction.description || `${transaction.type === 'receipt' ? 'دریافت' : 'پرداخت'} ${transaction.reference || ''}`,
            entityName: transaction.personName || 'نامشخص',
            entityType: transaction.personType || entityType,
            debit: transaction.type === 'receipt' ? transaction.amount || 0 : 0,
            credit: transaction.type === 'payment' ? transaction.amount || 0 : 0,
            balance: runningBalance,
            reference: transaction.reference || ''
          })
        }
      }

      return NextResponse.json({
        success: true,
        data: subsidiaryEntries,
        message: 'دفتر معین با موفقیت دریافت شد'
      })
    }

    // پیش‌فرض: برگرداندن همه
    return NextResponse.json({
      success: true,
      data: [],
      message: 'لطفاً reportType را مشخص کنید (journal, general, subsidiary)'
    })
  } catch (error) {
    console.error('Error fetching ledgers:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت دفاتر', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

