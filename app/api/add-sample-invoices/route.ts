import { NextRequest, NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://restorenUser:1234@localhost:27017/restoren'
const DB_NAME = 'restoren'
const COLLECTION_NAME = 'invoices'

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

// POST - اضافه کردن داده‌های نمونه فاکتورها
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    // پاک کردن داده‌های قبلی
    await collection.deleteMany({})
    
    // اضافه کردن فاکتورهای نمونه
    const sampleInvoices = [
      {
        invoiceNumber: 'SINV-20240115-0001',
        type: 'sales',
        customerId: 'customer-001',
        customerName: 'احمد رضایی',
        customerPhone: '09123456789',
        customerAddress: 'تهران، خیابان ولیعصر، پلاک 123',
        supplierId: null,
        supplierName: '',
        supplierPhone: '',
        supplierAddress: '',
        date: new Date('2024-01-15T10:00:00.000Z'),
        dueDate: new Date('2024-01-22T00:00:00.000Z'),
        items: [
          {
            name: 'کباب کوبیده',
            quantity: 2,
            unit: 'عدد',
            unitPrice: 85000,
            totalPrice: 170000
          },
          {
            name: 'نوشابه',
            quantity: 2,
            unit: 'عدد',
            unitPrice: 15000,
            totalPrice: 30000
          }
        ],
        subtotal: 200000,
        taxAmount: 20000,
        discountAmount: 10000,
        totalAmount: 210000,
        paidAmount: 210000,
        status: 'paid',
        paymentMethod: 'cash',
        notes: 'سفارش تحویل در محل',
        terms: 'پرداخت نقدی',
        sentDate: new Date('2024-01-15T10:30:00.000Z'),
        paidDate: new Date('2024-01-15T10:30:00.000Z'),
        createdBy: 'cashier-001',
        createdAt: '2024-01-15T10:00:00.000Z',
        updatedAt: '2024-01-15T10:30:00.000Z'
      },
      {
        invoiceNumber: 'SINV-20240114-0001',
        type: 'sales',
        customerId: 'customer-002',
        customerName: 'فاطمه احمدی',
        customerPhone: '09187654321',
        customerAddress: 'تهران، خیابان کریمخان، پلاک 456',
        supplierId: null,
        supplierName: '',
        supplierPhone: '',
        supplierAddress: '',
        date: new Date('2024-01-14T14:00:00.000Z'),
        dueDate: new Date('2024-01-21T00:00:00.000Z'),
        items: [
          {
            name: 'قرمه سبزی',
            quantity: 1,
            unit: 'عدد',
            unitPrice: 75000,
            totalPrice: 75000
          },
          {
            name: 'برنج',
            quantity: 1,
            unit: 'عدد',
            unitPrice: 25000,
            totalPrice: 25000
          },
          {
            name: 'دوغ',
            quantity: 1,
            unit: 'عدد',
            unitPrice: 12000,
            totalPrice: 12000
          }
        ],
        subtotal: 112000,
        taxAmount: 11200,
        discountAmount: 5000,
        totalAmount: 118200,
        paidAmount: 0,
        status: 'sent',
        paymentMethod: 'credit',
        notes: 'سفارش نسیه - تحویل فردا',
        terms: 'پرداخت تا 7 روز',
        sentDate: new Date('2024-01-14T14:30:00.000Z'),
        paidDate: null,
        createdBy: 'cashier-001',
        createdAt: '2024-01-14T14:00:00.000Z',
        updatedAt: '2024-01-14T14:30:00.000Z'
      },
      {
        invoiceNumber: 'PINV-20240113-0001',
        type: 'purchase',
        customerId: null,
        customerName: '',
        customerPhone: '',
        customerAddress: '',
        supplierId: 'supplier-001',
        supplierName: 'شرکت مواد غذایی تهران',
        supplierPhone: '021-12345678',
        supplierAddress: 'تهران، خیابان ولیعصر، پلاک 123',
        date: new Date('2024-01-13T09:00:00.000Z'),
        dueDate: new Date('2024-02-12T00:00:00.000Z'),
        items: [
          {
            name: 'گوشت گوساله',
            quantity: 20,
            unit: 'کیلوگرم',
            unitPrice: 120000,
            totalPrice: 2400000
          },
          {
            name: 'مرغ',
            quantity: 15,
            unit: 'کیلوگرم',
            unitPrice: 80000,
            totalPrice: 1200000
          }
        ],
        subtotal: 3600000,
        taxAmount: 360000,
        discountAmount: 100000,
        totalAmount: 3860000,
        paidAmount: 2000000,
        status: 'sent',
        paymentMethod: 'bank_transfer',
        notes: 'مواد اولیه هفتگی',
        terms: 'پرداخت تا 30 روز',
        sentDate: new Date('2024-01-13T09:30:00.000Z'),
        paidDate: null,
        createdBy: 'manager-001',
        createdAt: '2024-01-13T09:00:00.000Z',
        updatedAt: '2024-01-13T09:30:00.000Z'
      },
      {
        invoiceNumber: 'SINV-20240112-0001',
        type: 'sales',
        customerId: 'customer-003',
        customerName: 'محمد کریمی',
        customerPhone: '09123456789',
        customerAddress: 'تهران، خیابان آزادی، پلاک 789',
        supplierId: null,
        supplierName: '',
        supplierPhone: '',
        supplierAddress: '',
        date: new Date('2024-01-12T19:00:00.000Z'),
        dueDate: new Date('2024-01-19T00:00:00.000Z'),
        items: [
          {
            name: 'جوجه کباب',
            quantity: 1,
            unit: 'عدد',
            unitPrice: 95000,
            totalPrice: 95000
          },
          {
            name: 'سالاد فصل',
            quantity: 1,
            unit: 'عدد',
            unitPrice: 35000,
            totalPrice: 35000
          },
          {
            name: 'چای',
            quantity: 2,
            unit: 'عدد',
            unitPrice: 8000,
            totalPrice: 16000
          }
        ],
        subtotal: 146000,
        taxAmount: 14600,
        discountAmount: 0,
        totalAmount: 160600,
        paidAmount: 160600,
        status: 'paid',
        paymentMethod: 'card',
        notes: 'سفارش شام',
        terms: 'پرداخت نقدی',
        sentDate: new Date('2024-01-12T19:15:00.000Z'),
        paidDate: new Date('2024-01-12T19:15:00.000Z'),
        createdBy: 'cashier-002',
        createdAt: '2024-01-12T19:00:00.000Z',
        updatedAt: '2024-01-12T19:15:00.000Z'
      },
      {
        invoiceNumber: 'PINV-20240111-0001',
        type: 'purchase',
        customerId: null,
        customerName: '',
        customerPhone: '',
        customerAddress: '',
        supplierId: 'supplier-002',
        supplierName: 'تأمین‌کننده سبزیجات',
        supplierPhone: '09123456789',
        supplierAddress: 'کرج، جاده مخصوص، کیلومتر 15',
        date: new Date('2024-01-11T08:00:00.000Z'),
        dueDate: new Date('2024-01-26T00:00:00.000Z'),
        items: [
          {
            name: 'گوجه فرنگی',
            quantity: 10,
            unit: 'کیلوگرم',
            unitPrice: 15000,
            totalPrice: 150000
          },
          {
            name: 'پیاز',
            quantity: 15,
            unit: 'کیلوگرم',
            unitPrice: 12000,
            totalPrice: 180000
          },
          {
            name: 'سیب زمینی',
            quantity: 20,
            unit: 'کیلوگرم',
            unitPrice: 10000,
            totalPrice: 200000
          }
        ],
        subtotal: 530000,
        taxAmount: 53000,
        discountAmount: 20000,
        totalAmount: 563000,
        paidAmount: 0,
        status: 'draft',
        paymentMethod: 'credit',
        notes: 'سبزیجات روزانه',
        terms: 'پرداخت تا 15 روز',
        sentDate: null,
        paidDate: null,
        createdBy: 'manager-001',
        createdAt: '2024-01-11T08:00:00.000Z',
        updatedAt: '2024-01-11T08:00:00.000Z'
      },
      {
        invoiceNumber: 'SINV-20240110-0001',
        type: 'sales',
        customerId: 'customer-004',
        customerName: 'زهرا موسوی',
        customerPhone: '09187654321',
        customerAddress: 'تهران، خیابان کریمخان، پلاک 321',
        supplierId: null,
        supplierName: '',
        supplierPhone: '',
        supplierAddress: '',
        date: new Date('2024-01-10T12:00:00.000Z'),
        dueDate: new Date('2024-01-17T00:00:00.000Z'),
        items: [
          {
            name: 'میرزا قاسمی',
            quantity: 1,
            unit: 'عدد',
            unitPrice: 70000,
            totalPrice: 70000
          },
          {
            name: 'نان',
            quantity: 2,
            unit: 'عدد',
            unitPrice: 5000,
            totalPrice: 10000
          },
          {
            name: 'دوغ',
            quantity: 1,
            unit: 'عدد',
            unitPrice: 12000,
            totalPrice: 12000
          }
        ],
        subtotal: 92000,
        taxAmount: 9200,
        discountAmount: 5000,
        totalAmount: 96200,
        paidAmount: 50000,
        status: 'sent',
        paymentMethod: 'check',
        notes: 'پرداخت جزئی - باقی مانده فردا',
        terms: 'پرداخت تا 7 روز',
        sentDate: new Date('2024-01-10T12:30:00.000Z'),
        paidDate: null,
        createdBy: 'cashier-001',
        createdAt: '2024-01-10T12:00:00.000Z',
        updatedAt: '2024-01-10T12:30:00.000Z'
      }
    ]

    const result = await collection.insertMany(sampleInvoices)

    return NextResponse.json({
      success: true,
      message: `${result.insertedCount} فاکتور نمونه اضافه شد`,
      data: {
        invoices: result.insertedIds
      }
    })
  } catch (error) {
    console.error('Error adding sample invoices:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در اضافه کردن فاکتورهای نمونه' },
      { status: 500 }
    )
  }
}

