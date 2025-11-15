import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://admin:StrongPassword123@185.204.169.107:27017/restaurant?authSource=admin'
const DB_NAME = 'restaurant'

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

// GET - گزارش مشتریان و تامین‌کنندگان
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()
    
    // تست اتصال
    const testCollection = db.collection('customers')
    const testCount = await testCollection.countDocuments().catch(() => 0)
    console.log(`Database connected. Customers count: ${testCount}`)
    
    const customersCollection = db.collection('customers')
    const suppliersCollection = db.collection('suppliers')
    const receiptsPaymentsCollection = db.collection('receipts_payments')
    const invoicesCollection = db.collection('invoices')
    const purchasesCollection = db.collection('purchases')
    
    const { searchParams } = new URL(request.url)
    const reportType = searchParams.get('reportType') || 'summary' // summary, transactions, top
    const type = searchParams.get('type') || 'all' // customer, supplier, all
    const fromDate = searchParams.get('fromDate')
    const toDate = searchParams.get('toDate')

    // فیلتر تاریخ برای تراکنش‌ها
    const dateFilter: any = {}
    if (fromDate || toDate) {
      dateFilter.date = {}
      if (fromDate) dateFilter.date.$gte = new Date(fromDate)
      if (toDate) dateFilter.date.$lte = new Date(toDate)
    }

    switch (reportType) {
      case 'summary':
        return await getSummaryReport(customersCollection, suppliersCollection, receiptsPaymentsCollection, invoicesCollection, purchasesCollection, type)
      case 'transactions':
        return await getTransactionsReport(customersCollection, suppliersCollection, receiptsPaymentsCollection, invoicesCollection, purchasesCollection, type, dateFilter)
      case 'top':
        return await getTopReport(customersCollection, suppliersCollection, receiptsPaymentsCollection, invoicesCollection, purchasesCollection, type, dateFilter)
      default:
        return await getSummaryReport(customersCollection, suppliersCollection, receiptsPaymentsCollection, invoicesCollection, purchasesCollection, type)
    }
  } catch (error) {
    console.error('Error generating customer-supplier report:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined
    console.error('Error stack:', errorStack)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در تولید گزارش',
        error: errorMessage,
        stack: process.env.NODE_ENV === 'development' ? errorStack : undefined
      },
      { status: 500 }
    )
  }
}

// گزارش خلاصه
async function getSummaryReport(
  customersCollection: any,
  suppliersCollection: any,
  receiptsPaymentsCollection: any,
  invoicesCollection: any,
  purchasesCollection: any,
  type: string
) {
  try {
    const filter: any = {}
    if (type === 'customer') filter.type = 'customer'
    if (type === 'supplier') filter.type = 'supplier'

    // دریافت مشتریان
    let customers: any[] = []
    try {
      const customerFilter: any = {}
      if (type !== 'supplier') {
        customerFilter.status = { $ne: 'blocked' }
      }
      customers = await customersCollection.find(customerFilter).toArray()
    } catch (e) {
      console.error('Error fetching customers:', e)
      customers = []
    }
    
    // دریافت تامین‌کنندگان
    let suppliers: any[] = []
    try {
      const supplierFilter: any = {}
      if (type !== 'customer') {
        supplierFilter.status = { $ne: 'blocked' }
      }
      suppliers = await suppliersCollection.find(supplierFilter).toArray()
    } catch (e) {
      console.error('Error fetching suppliers:', e)
      suppliers = []
    }

    // محاسبه مطالبات از فاکتورها و تراکنش‌های مشتریان
    let customerInvoices: any[] = []
    let customerTransactions: any[] = []
    try {
      customerInvoices = await invoicesCollection.find({ type: 'sales' }).toArray()
    } catch (e) {
      console.error('Error fetching customer invoices:', e)
    }
    
    try {
      customerTransactions = await receiptsPaymentsCollection.find({
        type: 'receipt',
        personType: 'customer'
      }).toArray()
    } catch (e) {
      console.error('Error fetching customer transactions:', e)
    }

    // محاسبه بدهی‌ها از خریدها و تراکنش‌های تامین‌کنندگان
    let supplierPurchases: any[] = []
    let supplierTransactions: any[] = []
    try {
      supplierPurchases = await purchasesCollection.find({}).toArray()
    } catch (e) {
      console.error('Error fetching supplier purchases:', e)
    }
    
    try {
      supplierTransactions = await receiptsPaymentsCollection.find({
        type: 'payment',
        personType: 'supplier'
      }).toArray()
    } catch (e) {
      console.error('Error fetching supplier transactions:', e)
    }

    // ترکیب داده‌ها
    const persons: any[] = []

    // پردازش مشتریان
    if (!customers) customers = []
    for (const customer of customers) {
      if (!customer || !customer._id) continue
      const customerId = customer._id.toString()
      const customerInvs = customerInvoices.filter((inv: any) => {
        const invCustomerId = inv.customerId ? (typeof inv.customerId === 'string' ? inv.customerId : inv.customerId.toString()) : null
        return invCustomerId === customerId || invCustomerId === customer._id.toString()
      })
      const customerTrans = customerTransactions.filter((t: any) => {
        const tPersonId = t.personId ? (typeof t.personId === 'string' ? t.personId : t.personId.toString()) : null
        return tPersonId === customerId || tPersonId === customer._id.toString()
      })

      const totalInvoices = customerInvs.reduce((sum: number, inv: any) => sum + (inv.totalAmount || 0), 0)
      const totalReceipts = customerTrans.reduce((sum: number, t: any) => sum + (t.amount || 0), 0)
      const currentBalance = totalInvoices - totalReceipts

      persons.push({
        id: customerId,
        _id: customerId,
        name: customer.name || `${customer.firstName || ''} ${customer.lastName || ''}`.trim(),
        type: 'customer',
        category: customer.customerType === 'vip' ? 'مشتری VIP' : customer.customerType === 'golden' ? 'مشتری طلایی' : 'مشتری عادی',
        phone: customer.phone || '',
        email: customer.email || '',
        address: customer.address || '',
        creditLimit: customer.creditLimit || 0,
        currentBalance: currentBalance,
        totalTransactions: customerInvs.length + customerTrans.length,
        totalAmount: totalInvoices,
        lastTransactionDate: customer.lastOrderDate || customer.registrationDate || '',
        averageTransactionAmount: customer.totalOrders > 0 ? (customer.totalSpent || 0) / customer.totalOrders : 0,
        paymentTerms: '30 روز',
        status: customer.status || 'active',
        notes: customer.notes || ''
      })
    }

    // پردازش تامین‌کنندگان
    if (!suppliers) suppliers = []
    for (const supplier of suppliers) {
      if (!supplier || !supplier._id) continue
      const supplierId = supplier._id.toString()
      const supplierPurchs = supplierPurchases.filter((p: any) => {
        const pSupplierId = p.supplierId ? (typeof p.supplierId === 'string' ? p.supplierId : p.supplierId.toString()) : null
        return pSupplierId === supplierId || pSupplierId === supplier._id.toString()
      })
      const supplierTrans = supplierTransactions.filter((t: any) => {
        const tPersonId = t.personId ? (typeof t.personId === 'string' ? t.personId : t.personId.toString()) : null
        return tPersonId === supplierId || tPersonId === supplier._id.toString()
      })

      const totalPurchases = supplierPurchs.reduce((sum: number, p: any) => sum + (p.totalAmount || 0), 0)
      const totalPayments = supplierTrans.reduce((sum: number, t: any) => sum + (t.amount || 0), 0)
      const currentBalance = totalPayments - totalPurchases // منفی یعنی بدهی

      persons.push({
        id: supplierId,
        _id: supplierId,
        name: supplier.name || '',
        type: 'supplier',
        category: supplier.category === 'food' ? 'مواد غذایی' : supplier.category === 'equipment' ? 'تجهیزات' : 'سایر',
        phone: supplier.phone || '',
        email: supplier.email || '',
        address: supplier.address || '',
        creditLimit: supplier.creditLimit || 0,
        currentBalance: -currentBalance, // منفی نشان می‌دهد بدهی است
        totalTransactions: supplierPurchs.length + supplierTrans.length,
        totalAmount: totalPurchases,
        lastTransactionDate: supplier.lastPurchaseDate || supplier.createdAt || '',
        averageTransactionAmount: supplier.totalPurchases > 0 ? (supplier.totalAmount || 0) / supplier.totalPurchases : 0,
        paymentTerms: `${supplier.paymentTerms || 30} روز`,
        status: supplier.status || 'active',
        notes: supplier.notes || ''
      })
    }

    // آمار کلی
    const totalPersons = persons.length
    const totalCustomers = persons.filter(p => p.type === 'customer').length
    const totalSuppliers = persons.filter(p => p.type === 'supplier').length
    const activePersons = persons.filter(p => p.status === 'active').length
    const totalReceivables = persons
      .filter(p => p.type === 'customer' && p.currentBalance > 0)
      .reduce((sum, p) => sum + p.currentBalance, 0)
    const totalPayables = persons
      .filter(p => p.type === 'supplier' && p.currentBalance < 0)
      .reduce((sum, p) => sum + Math.abs(p.currentBalance), 0)

    return NextResponse.json({
      success: true,
      data: persons,
      stats: {
        totalPersons,
        totalCustomers,
        totalSuppliers,
        activePersons,
        totalReceivables,
        totalPayables
      }
    })
  } catch (error) {
    console.error('Error in getSummaryReport:', error)
    throw error
  }
}

// گزارش تراکنش‌ها
async function getTransactionsReport(
  customersCollection: any,
  suppliersCollection: any,
  receiptsPaymentsCollection: any,
  invoicesCollection: any,
  purchasesCollection: any,
  type: string,
  dateFilter: any
) {
  const transactions: any[] = []

  // تراکنش‌های مشتریان
  if (type === 'all' || type === 'customer') {
    const invoiceQuery: any = { type: 'sales' }
    if (dateFilter.date) {
      invoiceQuery.createdAt = dateFilter.date
    }
    const customerInvoices = await invoicesCollection.find(invoiceQuery).toArray()
    
    const receiptQuery: any = { type: 'receipt', personType: 'customer' }
    if (dateFilter.date) {
      receiptQuery.date = dateFilter.date
    }
    const customerReceipts = await receiptsPaymentsCollection.find(receiptQuery).toArray()

    customerInvoices.forEach((inv: any) => {
      transactions.push({
        id: inv._id.toString(),
        _id: inv._id.toString(),
        date: inv.createdAt || inv.date || new Date().toISOString(),
        type: 'sale',
        amount: inv.totalAmount || 0,
        balance: 0, // باید محاسبه شود
        reference: inv.invoiceNumber || `INV-${inv._id.toString().slice(0, 8)}`,
        description: 'فاکتور فروش',
        personId: inv.customerId,
        personName: inv.customerName || ''
      })
    })

    customerReceipts.forEach((t: any) => {
      transactions.push({
        id: t._id.toString(),
        _id: t._id.toString(),
        date: t.date || t.createdAt || new Date().toISOString(),
        type: 'receipt',
        amount: t.amount || 0,
        balance: 0,
        reference: t.transactionNumber || t.reference || '',
        description: t.description || '',
        personId: t.personId,
        personName: t.personName || ''
      })
    })
  }

  // تراکنش‌های تامین‌کنندگان
  if (type === 'all' || type === 'supplier') {
    const purchaseQuery: any = {}
    if (dateFilter.date) {
      purchaseQuery.createdAt = dateFilter.date
    }
    const supplierPurchases = await purchasesCollection.find(purchaseQuery).toArray()
    
    const paymentQuery: any = { type: 'payment', personType: 'supplier' }
    if (dateFilter.date) {
      paymentQuery.date = dateFilter.date
    }
    const supplierPayments = await receiptsPaymentsCollection.find(paymentQuery).toArray()

    supplierPurchases.forEach((p: any) => {
      transactions.push({
        id: p._id.toString(),
        _id: p._id.toString(),
        date: p.createdAt || p.date || new Date().toISOString(),
        type: 'purchase',
        amount: p.totalAmount || 0,
        balance: 0,
        reference: p.purchaseNumber || `PUR-${p._id.toString().slice(0, 8)}`,
        description: 'خرید از تامین‌کننده',
        personId: p.supplierId,
        personName: p.supplierName || ''
      })
    })

    supplierPayments.forEach((t: any) => {
      transactions.push({
        id: t._id.toString(),
        _id: t._id.toString(),
        date: t.date || t.createdAt || new Date().toISOString(),
        type: 'payment',
        amount: -(t.amount || 0),
        balance: 0,
        reference: t.transactionNumber || t.reference || '',
        description: t.description || '',
        personId: t.personId,
        personName: t.personName || ''
      })
    })
  }

  // مرتب‌سازی بر اساس تاریخ
  transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return NextResponse.json({
    success: true,
    data: transactions
  })
}

// گزارش برترین‌ها
async function getTopReport(
  customersCollection: any,
  suppliersCollection: any,
  receiptsPaymentsCollection: any,
  invoicesCollection: any,
  purchasesCollection: any,
  type: string,
  dateFilter: any
) {
  const topCustomers: any[] = []
  const topSuppliers: any[] = []

  // برترین مشتریان
  if (type === 'all' || type === 'customer') {
    const customers = await customersCollection.find({}).toArray()
    const invoiceQuery: any = { type: 'sales' }
    if (dateFilter.date) {
      invoiceQuery.createdAt = dateFilter.date
    }
    const customerInvoices = await invoicesCollection.find(invoiceQuery).toArray()

    for (const customer of customers) {
      const customerId = customer._id.toString()
      const customerInvs = customerInvoices.filter((inv: any) => {
        const invCustomerId = inv.customerId ? (typeof inv.customerId === 'string' ? inv.customerId : inv.customerId.toString()) : null
        return invCustomerId === customerId || invCustomerId === customer._id.toString()
      })
      const totalAmount = customerInvs.reduce((sum: number, inv: any) => sum + (inv.totalAmount || 0), 0)
      
      if (totalAmount > 0) {
        topCustomers.push({
          id: customerId,
          name: customer.name || `${customer.firstName || ''} ${customer.lastName || ''}`.trim(),
          totalAmount: totalAmount,
          transactionCount: customerInvs.length,
          averageAmount: customerInvs.length > 0 ? totalAmount / customerInvs.length : 0,
          lastTransactionDate: customer.lastOrderDate || customer.registrationDate || '',
          growthRate: 0 // باید محاسبه شود
        })
      }
    }

    topCustomers.sort((a, b) => b.totalAmount - a.totalAmount)
  }

  // برترین تامین‌کنندگان
  if (type === 'all' || type === 'supplier') {
    const suppliers = await suppliersCollection.find({}).toArray()
    const purchaseQuery: any = {}
    if (dateFilter.date) {
      purchaseQuery.createdAt = dateFilter.date
    }
    const supplierPurchases = await purchasesCollection.find(purchaseQuery).toArray()

    for (const supplier of suppliers) {
      const supplierId = supplier._id.toString()
      const supplierPurchs = supplierPurchases.filter((p: any) => {
        const pSupplierId = p.supplierId ? (typeof p.supplierId === 'string' ? p.supplierId : p.supplierId.toString()) : null
        return pSupplierId === supplierId || pSupplierId === supplier._id.toString()
      })
      const totalAmount = supplierPurchs.reduce((sum: number, p: any) => sum + (p.totalAmount || 0), 0)
      
      if (totalAmount > 0) {
        topSuppliers.push({
          id: supplierId,
          name: supplier.name || '',
          totalAmount: totalAmount,
          transactionCount: supplierPurchs.length,
          averageAmount: supplierPurchs.length > 0 ? totalAmount / supplierPurchs.length : 0,
          lastTransactionDate: supplier.lastPurchaseDate || supplier.createdAt || '',
          paymentTerms: `${supplier.paymentTerms || 30} روز`
        })
      }
    }

    topSuppliers.sort((a, b) => b.totalAmount - a.totalAmount)
  }

  return NextResponse.json({
    success: true,
    data: {
      topCustomers: topCustomers.slice(0, 10),
      topSuppliers: topSuppliers.slice(0, 10)
    }
  })
}

