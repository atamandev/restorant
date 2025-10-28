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

// POST - اضافه کردن داده‌های نمونه مشتریان
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()
    const collection = db.collection('customers')
    
    // پاک کردن داده‌های قبلی
    await collection.deleteMany({})
    
    // اضافه کردن مشتریان نمونه
    const sampleCustomers = [
      {
        customerNumber: 'CUST-001',
        firstName: 'احمد',
        lastName: 'محمدی',
        phone: '09123456789',
        email: 'ahmad@email.com',
        address: 'تهران، خیابان ولیعصر',
        birthDate: '1985-03-15',
        registrationDate: '2023-01-15',
        totalOrders: 45,
        totalSpent: 2500000,
        lastOrderDate: '2024-01-13',
        status: 'active',
        notes: 'مشتری وفادار',
        tags: ['وفادار', 'منظم'],
        loyaltyPoints: 1250,
        customerType: 'golden',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        customerNumber: 'CUST-002',
        firstName: 'فاطمه',
        lastName: 'احمدی',
        phone: '09198765432',
        email: 'fateme@email.com',
        address: 'کرج، خیابان آزادی',
        birthDate: '1990-07-22',
        registrationDate: '2023-07-15',
        totalOrders: 28,
        totalSpent: 1800000,
        lastOrderDate: '2024-01-10',
        status: 'active',
        notes: 'علاقه‌مند به غذاهای سنتی',
        tags: ['سنتی', 'منظم'],
        loyaltyPoints: 890,
        customerType: 'vip',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        customerNumber: 'CUST-003',
        firstName: 'علی',
        lastName: 'رضایی',
        phone: '09151234567',
        email: 'ali@email.com',
        address: 'اصفهان، خیابان چهارباغ',
        birthDate: '1988-11-08',
        registrationDate: '2023-10-15',
        totalOrders: 15,
        totalSpent: 950000,
        lastOrderDate: '2024-01-08',
        status: 'active',
        notes: 'مشتری جدید اما فعال',
        tags: ['جدید', 'فعال'],
        loyaltyPoints: 450,
        customerType: 'regular',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        customerNumber: 'CUST-004',
        firstName: 'مریم',
        lastName: 'حسینی',
        phone: '09187654321',
        email: 'maryam@email.com',
        address: 'شیراز، خیابان زند',
        birthDate: '1992-05-12',
        registrationDate: '2023-11-15',
        totalOrders: 8,
        totalSpent: 420000,
        lastOrderDate: '2024-01-05',
        status: 'active',
        notes: 'علاقه‌مند به دسرها',
        tags: ['دسر', 'جدید'],
        loyaltyPoints: 210,
        customerType: 'regular',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        customerNumber: 'CUST-005',
        firstName: 'حسن',
        lastName: 'کریمی',
        phone: '09134567890',
        email: 'hasan@email.com',
        address: 'مشهد، خیابان امام رضا',
        birthDate: '1983-09-30',
        registrationDate: '2022-01-15',
        totalOrders: 67,
        totalSpent: 4200000,
        lastOrderDate: '2024-01-14',
        status: 'active',
        notes: 'مشتری طلایی و بسیار وفادار',
        tags: ['طلایی', 'وفادار', 'VIP'],
        loyaltyPoints: 2100,
        customerType: 'golden',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        customerNumber: 'CUST-006',
        firstName: 'زهرا',
        lastName: 'نوری',
        phone: '09123456789',
        email: 'zahra@email.com',
        address: 'تبریز، خیابان آزادی',
        birthDate: '1995-12-03',
        registrationDate: '2023-12-15',
        totalOrders: 5,
        totalSpent: 180000,
        lastOrderDate: '2023-12-30',
        status: 'inactive',
        notes: 'مشتری جدید، نیاز به پیگیری',
        tags: ['جدید', 'نیاز پیگیری'],
        loyaltyPoints: 90,
        customerType: 'regular',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        customerNumber: 'CUST-007',
        firstName: 'محمد',
        lastName: 'صادقی',
        phone: '09156789012',
        email: 'mohammad@email.com',
        address: 'قم، خیابان امام خمینی',
        birthDate: '1987-04-18',
        registrationDate: '2023-08-15',
        totalOrders: 22,
        totalSpent: 1200000,
        lastOrderDate: '2024-01-12',
        status: 'active',
        notes: 'مشتری منظم و قابل اعتماد',
        tags: ['منظم', 'قابل اعتماد'],
        loyaltyPoints: 600,
        customerType: 'vip',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        customerNumber: 'CUST-008',
        firstName: 'نرگس',
        lastName: 'موسوی',
        phone: '09167890123',
        email: 'narges@email.com',
        address: 'اهواز، خیابان آزادگان',
        birthDate: '1993-08-25',
        registrationDate: '2023-09-15',
        totalOrders: 12,
        totalSpent: 680000,
        lastOrderDate: '2024-01-09',
        status: 'active',
        notes: 'علاقه‌مند به غذاهای محلی',
        tags: ['محلی', 'جدید'],
        loyaltyPoints: 340,
        customerType: 'regular',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]

    const result = await collection.insertMany(sampleCustomers)

    return NextResponse.json({
      success: true,
      message: `داده‌های نمونه مشتریان اضافه شد: ${sampleCustomers.length} مشتری`,
      data: {
        customers: result.insertedIds,
        summary: {
          totalCustomers: sampleCustomers.length,
          activeCustomers: sampleCustomers.filter(c => c.status === 'active').length,
          inactiveCustomers: sampleCustomers.filter(c => c.status === 'inactive').length,
          goldenCustomers: sampleCustomers.filter(c => c.customerType === 'golden').length,
          vipCustomers: sampleCustomers.filter(c => c.customerType === 'vip').length,
          regularCustomers: sampleCustomers.filter(c => c.customerType === 'regular').length
        }
      }
    })
  } catch (error) {
    console.error('Error adding sample customers:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در اضافه کردن داده‌های نمونه مشتریان' },
      { status: 500 }
    )
  }
}