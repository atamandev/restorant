import { NextRequest, NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://restorenUser:1234@localhost:27017/restoren'
const DB_NAME = 'restoren'
const PURCHASES_COLLECTION = 'purchases'
const SUPPLIERS_COLLECTION = 'suppliers'

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

// POST - اضافه کردن داده‌های نمونه خریدها و تأمین‌کنندگان
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()
    const purchasesCollection = db.collection(PURCHASES_COLLECTION)
    const suppliersCollection = db.collection(SUPPLIERS_COLLECTION)
    
    // پاک کردن داده‌های قبلی
    await purchasesCollection.deleteMany({})
    await suppliersCollection.deleteMany({})
    
    // اضافه کردن تأمین‌کنندگان نمونه
    const sampleSuppliers = [
      {
        name: 'شرکت مواد غذایی تهران',
        contactPerson: 'احمد رضایی',
        phone: '021-12345678',
        email: 'info@tehranfood.com',
        address: 'تهران، خیابان ولیعصر، پلاک 123',
        category: 'food',
        status: 'active',
        creditLimit: 5000000,
        paymentTerms: 30,
        taxNumber: '1234567890',
        bankAccount: '1234567890123456',
        notes: 'تأمین‌کننده اصلی مواد غذایی',
        totalPurchases: 0,
        totalAmount: 0,
        lastPurchaseDate: null,
        createdAt: '2024-01-01T10:00:00.000Z',
        updatedAt: '2024-01-01T10:00:00.000Z'
      },
      {
        name: 'تأمین‌کننده سبزیجات',
        contactPerson: 'فاطمه احمدی',
        phone: '09123456789',
        email: 'vegetables@supplier.com',
        address: 'کرج، جاده مخصوص، کیلومتر 15',
        category: 'food',
        status: 'active',
        creditLimit: 2000000,
        paymentTerms: 15,
        taxNumber: '0987654321',
        bankAccount: '9876543210987654',
        notes: 'سبزیجات تازه روزانه',
        totalPurchases: 0,
        totalAmount: 0,
        lastPurchaseDate: null,
        createdAt: '2024-01-02T10:00:00.000Z',
        updatedAt: '2024-01-02T10:00:00.000Z'
      },
      {
        name: 'شرکت تجهیزات آشپزخانه',
        contactPerson: 'محمد کریمی',
        phone: '021-87654321',
        email: 'kitchen@equipment.com',
        address: 'تهران، خیابان آزادی، پلاک 456',
        category: 'equipment',
        status: 'active',
        creditLimit: 10000000,
        paymentTerms: 45,
        taxNumber: '1122334455',
        bankAccount: '1122334455667788',
        notes: 'تجهیزات آشپزخانه و رستوران',
        totalPurchases: 0,
        totalAmount: 0,
        lastPurchaseDate: null,
        createdAt: '2024-01-03T10:00:00.000Z',
        updatedAt: '2024-01-03T10:00:00.000Z'
      },
      {
        name: 'تأمین‌کننده نوشیدنی',
        contactPerson: 'زهرا موسوی',
        phone: '09187654321',
        email: 'beverages@supplier.com',
        address: 'اصفهان، خیابان چهارباغ، پلاک 789',
        category: 'food',
        status: 'active',
        creditLimit: 3000000,
        paymentTerms: 20,
        taxNumber: '5566778899',
        bankAccount: '5566778899001122',
        notes: 'نوشیدنی‌های سرد و گرم',
        totalPurchases: 0,
        totalAmount: 0,
        lastPurchaseDate: null,
        createdAt: '2024-01-04T10:00:00.000Z',
        updatedAt: '2024-01-04T10:00:00.000Z'
      },
      {
        name: 'شرکت خدمات نظافتی',
        contactPerson: 'علی صادقی',
        phone: '021-55554444',
        email: 'cleaning@service.com',
        address: 'تهران، خیابان کریمخان، پلاک 321',
        category: 'service',
        status: 'active',
        creditLimit: 1000000,
        paymentTerms: 7,
        taxNumber: '9988776655',
        bankAccount: '9988776655443322',
        notes: 'خدمات نظافت و شستشو',
        totalPurchases: 0,
        totalAmount: 0,
        lastPurchaseDate: null,
        createdAt: '2024-01-05T10:00:00.000Z',
        updatedAt: '2024-01-05T10:00:00.000Z'
      }
    ]

    const suppliersResult = await suppliersCollection.insertMany(sampleSuppliers)
    const supplierIds = Object.values(suppliersResult.insertedIds) as any[]

    // اضافه کردن خریدهای نمونه
    const samplePurchases = [
      {
        invoiceNumber: 'PINV-20240115-0001',
        supplierId: supplierIds[0]?.toString() || '',
        supplierName: 'شرکت مواد غذایی تهران',
        supplierPhone: '021-12345678',
        supplierAddress: 'تهران، خیابان ولیعصر، پلاک 123',
        date: new Date('2024-01-15T10:00:00.000Z'),
        dueDate: new Date('2024-02-14T00:00:00.000Z'),
        items: [
          {
            name: 'برنج ایرانی',
            quantity: 50,
            unit: 'کیلوگرم',
            unitPrice: 45000,
            totalPrice: 2250000
          },
          {
            name: 'روغن آفتابگردان',
            quantity: 20,
            unit: 'لیتر',
            unitPrice: 35000,
            totalPrice: 700000
          },
          {
            name: 'گوشت گوساله',
            quantity: 30,
            unit: 'کیلوگرم',
            unitPrice: 120000,
            totalPrice: 3600000
          }
        ],
        subtotal: 6550000,
        taxAmount: 655000,
        discountAmount: 200000,
        totalAmount: 7005000,
        paidAmount: 0,
        status: 'pending',
        paymentStatus: 'pending',
        paymentMethod: 'credit',
        notes: 'خرید مواد اولیه ماهانه',
        receivedDate: null,
        receivedBy: null,
        approvedBy: null,
        approvedDate: null,
        createdBy: 'manager-001',
        createdAt: '2024-01-15T10:00:00.000Z',
        updatedAt: '2024-01-15T10:00:00.000Z'
      },
      {
        invoiceNumber: 'PINV-20240114-0001',
        supplierId: supplierIds[1]?.toString() || '',
        supplierName: 'تأمین‌کننده سبزیجات',
        supplierPhone: '09123456789',
        supplierAddress: 'کرج، جاده مخصوص، کیلومتر 15',
        date: new Date('2024-01-14T08:30:00.000Z'),
        dueDate: new Date('2024-01-29T00:00:00.000Z'),
        items: [
          {
            name: 'گوجه فرنگی',
            quantity: 25,
            unit: 'کیلوگرم',
            unitPrice: 15000,
            totalPrice: 375000
          },
          {
            name: 'پیاز',
            quantity: 30,
            unit: 'کیلوگرم',
            unitPrice: 12000,
            totalPrice: 360000
          },
          {
            name: 'سیب زمینی',
            quantity: 40,
            unit: 'کیلوگرم',
            unitPrice: 10000,
            totalPrice: 400000
          }
        ],
        subtotal: 1135000,
        taxAmount: 113500,
        discountAmount: 50000,
        totalAmount: 1198500,
        paidAmount: 1198500,
        status: 'received',
        paymentStatus: 'paid',
        paymentMethod: 'cash',
        notes: 'سبزیجات روزانه',
        receivedDate: new Date('2024-01-14T09:00:00.000Z'),
        receivedBy: 'warehouse-001',
        approvedBy: 'manager-001',
        approvedDate: new Date('2024-01-14T08:45:00.000Z'),
        createdBy: 'manager-001',
        createdAt: '2024-01-14T08:30:00.000Z',
        updatedAt: '2024-01-14T09:00:00.000Z'
      },
      {
        invoiceNumber: 'PINV-20240113-0001',
        supplierId: supplierIds[2]?.toString() || '',
        supplierName: 'شرکت تجهیزات آشپزخانه',
        supplierPhone: '021-87654321',
        supplierAddress: 'تهران، خیابان آزادی، پلاک 456',
        date: new Date('2024-01-13T14:00:00.000Z'),
        dueDate: new Date('2024-02-27T00:00:00.000Z'),
        items: [
          {
            name: 'اجاق گاز صنعتی',
            quantity: 1,
            unit: 'عدد',
            unitPrice: 15000000,
            totalPrice: 15000000
          },
          {
            name: 'یخچال صنعتی',
            quantity: 1,
            unit: 'عدد',
            unitPrice: 12000000,
            totalPrice: 12000000
          }
        ],
        subtotal: 27000000,
        taxAmount: 2700000,
        discountAmount: 1000000,
        totalAmount: 28700000,
        paidAmount: 10000000,
        status: 'approved',
        paymentStatus: 'partial',
        paymentMethod: 'bank_transfer',
        notes: 'خرید تجهیزات آشپزخانه',
        receivedDate: null,
        receivedBy: null,
        approvedBy: 'manager-001',
        approvedDate: new Date('2024-01-13T15:00:00.000Z'),
        createdBy: 'manager-001',
        createdAt: '2024-01-13T14:00:00.000Z',
        updatedAt: '2024-01-13T15:00:00.000Z'
      },
      {
        invoiceNumber: 'PINV-20240112-0001',
        supplierId: supplierIds[3]?.toString() || '',
        supplierName: 'تأمین‌کننده نوشیدنی',
        supplierPhone: '09187654321',
        supplierAddress: 'اصفهان، خیابان چهارباغ، پلاک 789',
        date: new Date('2024-01-12T11:00:00.000Z'),
        dueDate: new Date('2024-02-01T00:00:00.000Z'),
        items: [
          {
            name: 'چای سیاه',
            quantity: 10,
            unit: 'کیلوگرم',
            unitPrice: 80000,
            totalPrice: 800000
          },
          {
            name: 'قهوه عربیکا',
            quantity: 5,
            unit: 'کیلوگرم',
            unitPrice: 200000,
            totalPrice: 1000000
          },
          {
            name: 'شیر',
            quantity: 50,
            unit: 'لیتر',
            unitPrice: 15000,
            totalPrice: 750000
          }
        ],
        subtotal: 2550000,
        taxAmount: 255000,
        discountAmount: 100000,
        totalAmount: 2705000,
        paidAmount: 2705000,
        status: 'received',
        paymentStatus: 'paid',
        paymentMethod: 'check',
        notes: 'نوشیدنی‌های ماهانه',
        receivedDate: new Date('2024-01-12T12:00:00.000Z'),
        receivedBy: 'warehouse-002',
        approvedBy: 'manager-001',
        approvedDate: new Date('2024-01-12T11:30:00.000Z'),
        createdBy: 'manager-001',
        createdAt: '2024-01-12T11:00:00.000Z',
        updatedAt: '2024-01-12T12:00:00.000Z'
      },
      {
        invoiceNumber: 'PINV-20240111-0001',
        supplierId: supplierIds[4]?.toString() || '',
        supplierName: 'شرکت خدمات نظافتی',
        supplierPhone: '021-55554444',
        supplierAddress: 'تهران، خیابان کریمخان، پلاک 321',
        date: new Date('2024-01-11T16:00:00.000Z'),
        dueDate: new Date('2024-01-18T00:00:00.000Z'),
        items: [
          {
            name: 'خدمات نظافت هفتگی',
            quantity: 4,
            unit: 'هفته',
            unitPrice: 500000,
            totalPrice: 2000000
          }
        ],
        subtotal: 2000000,
        taxAmount: 200000,
        discountAmount: 0,
        totalAmount: 2200000,
        paidAmount: 0,
        status: 'pending',
        paymentStatus: 'pending',
        paymentMethod: 'credit',
        notes: 'خدمات نظافت ماه ژانویه',
        receivedDate: null,
        receivedBy: null,
        approvedBy: null,
        approvedDate: null,
        createdBy: 'manager-001',
        createdAt: '2024-01-11T16:00:00.000Z',
        updatedAt: '2024-01-11T16:00:00.000Z'
      }
    ]

    const purchasesResult = await purchasesCollection.insertMany(samplePurchases)

    return NextResponse.json({
      success: true,
      message: `${suppliersResult.insertedCount} تأمین‌کننده و ${purchasesResult.insertedCount} خرید نمونه اضافه شد`,
      data: {
        suppliers: suppliersResult.insertedIds,
        purchases: purchasesResult.insertedIds
      }
    })
  } catch (error) {
    console.error('Error adding sample purchases:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در اضافه کردن خریدهای نمونه' },
      { status: 500 }
    )
  }
}

