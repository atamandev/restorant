import { NextRequest, NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://restorenUser:1234@localhost:27017/restoren'
const DB_NAME = 'restoren'
const COLLECTION_NAME = 'loyalty_programs'

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

// POST - اضافه کردن داده‌های نمونه برنامه وفاداری و مشتریان وفادار
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()
    const programsCollection = db.collection(COLLECTION_NAME)
    const customersCollection = db.collection('customer_loyalties')
    
    // پاک کردن داده‌های قبلی
    await programsCollection.deleteMany({})
    await customersCollection.deleteMany({})
    
    const samplePrograms = [
      {
        name: 'برنامه امتیازی طلایی',
        description: 'برنامه امتیازی ویژه برای مشتریان وفادار با امتیازات بالا و جوایز متنوع',
        type: 'points',
        status: 'active',
        rules: {
          pointsPerRial: 2,
          minOrderAmount: 50000,
          maxPointsPerOrder: 2000,
          expiryDays: 365
        },
        rewards: [
          {
            points: 100,
            discount: 10,
            description: 'تخفیف 10 درصدی'
          },
          {
            points: 500,
            discount: 25,
            description: 'تخفیف 25 درصدی'
          },
          {
            points: 1000,
            discount: 50,
            description: 'تخفیف 50 درصدی'
          }
        ],
        tiers: [
          {
            name: 'Bronze',
            minPoints: 0,
            benefits: ['امتیاز پایه', 'تخفیف 5 درصدی'],
            color: 'orange'
          },
          {
            name: 'Silver',
            minPoints: 500,
            benefits: ['تخفیف 10 درصدی', 'ارسال رایگان'],
            color: 'gray'
          },
          {
            name: 'Gold',
            minPoints: 1500,
            benefits: ['تخفیف 15 درصدی', 'ارسال رایگان', 'هدیه ویژه'],
            color: 'yellow'
          },
          {
            name: 'Platinum',
            minPoints: 3000,
            benefits: ['تخفیف 20 درصدی', 'ارسال رایگان', 'هدیه ویژه', 'اولویت سرویس'],
            color: 'purple'
          }
        ],
        createdAt: '2024-01-01T10:00:00.000Z',
        updatedAt: '2024-01-01T10:00:00.000Z'
      },
      {
        name: 'برنامه نقدی ویژه',
        description: 'برنامه بازگشت نقدی برای مشتریان ویژه',
        type: 'cashback',
        status: 'active',
        rules: {
          pointsPerRial: 1,
          minOrderAmount: 100000,
          maxPointsPerOrder: 1000,
          expiryDays: 180
        },
        rewards: [
          {
            points: 200,
            discount: 5,
            description: 'بازگشت نقدی 5 درصدی'
          },
          {
            points: 500,
            discount: 10,
            description: 'بازگشت نقدی 10 درصدی'
          }
        ],
        tiers: [
          {
            name: 'Regular',
            minPoints: 0,
            benefits: ['بازگشت نقدی پایه'],
            color: 'blue'
          },
          {
            name: 'VIP',
            minPoints: 1000,
            benefits: ['بازگشت نقدی دوبرابر', 'سرویس ویژه'],
            color: 'purple'
          }
        ],
        createdAt: '2024-01-02T10:00:00.000Z',
        updatedAt: '2024-01-02T10:00:00.000Z'
      },
      {
        name: 'برنامه تخفیفی فصلی',
        description: 'برنامه تخفیفات فصلی برای مشتریان',
        type: 'discount',
        status: 'draft',
        rules: {
          pointsPerRial: 1,
          minOrderAmount: 75000,
          maxPointsPerOrder: 500,
          expiryDays: 90
        },
        rewards: [
          {
            points: 50,
            discount: 5,
            description: 'تخفیف 5 درصدی'
          },
          {
            points: 100,
            discount: 10,
            description: 'تخفیف 10 درصدی'
          }
        ],
        tiers: [
          {
            name: 'Spring',
            minPoints: 0,
            benefits: ['تخفیف فصلی'],
            color: 'green'
          }
        ],
        createdAt: '2024-01-03T10:00:00.000Z',
        updatedAt: '2024-01-03T10:00:00.000Z'
      }
    ]

    const sampleCustomers = [
      {
        customerId: 'CUST-000001',
        customerName: 'احمد محمدی',
        customerPhone: '09123456789',
        totalPoints: 2500,
        currentTier: 'Gold',
        pointsEarned: 3000,
        pointsRedeemed: 500,
        pointsExpired: 0,
        totalOrders: 45,
        totalSpent: 1500000,
        lastOrderDate: '2024-01-15T14:30:00.000Z',
        nextTierPoints: 500,
        status: 'active',
        createdAt: '2024-01-01T10:00:00.000Z',
        updatedAt: '2024-01-15T14:30:00.000Z'
      },
      {
        customerId: 'CUST-000002',
        customerName: 'فاطمه احمدی',
        customerPhone: '09123456790',
        totalPoints: 1200,
        currentTier: 'Silver',
        pointsEarned: 1500,
        pointsRedeemed: 300,
        pointsExpired: 0,
        totalOrders: 28,
        totalSpent: 850000,
        lastOrderDate: '2024-01-14T12:15:00.000Z',
        nextTierPoints: 300,
        status: 'active',
        createdAt: '2024-01-02T10:00:00.000Z',
        updatedAt: '2024-01-14T12:15:00.000Z'
      },
      {
        customerId: 'CUST-000003',
        customerName: 'علی رضایی',
        customerPhone: '09123456791',
        totalPoints: 4500,
        currentTier: 'Platinum',
        pointsEarned: 5000,
        pointsRedeemed: 500,
        pointsExpired: 0,
        totalOrders: 78,
        totalSpent: 2500000,
        lastOrderDate: '2024-01-16T16:45:00.000Z',
        nextTierPoints: 0,
        status: 'active',
        createdAt: '2024-01-03T10:00:00.000Z',
        updatedAt: '2024-01-16T16:45:00.000Z'
      },
      {
        customerId: 'CUST-000004',
        customerName: 'مریم حسینی',
        customerPhone: '09123456792',
        totalPoints: 800,
        currentTier: 'Bronze',
        pointsEarned: 1000,
        pointsRedeemed: 200,
        pointsExpired: 0,
        totalOrders: 15,
        totalSpent: 400000,
        lastOrderDate: '2024-01-10T11:20:00.000Z',
        nextTierPoints: 200,
        status: 'active',
        createdAt: '2024-01-04T10:00:00.000Z',
        updatedAt: '2024-01-10T11:20:00.000Z'
      },
      {
        customerId: 'CUST-000005',
        customerName: 'حسن کریمی',
        customerPhone: '09123456793',
        totalPoints: 3200,
        currentTier: 'Gold',
        pointsEarned: 3800,
        pointsRedeemed: 600,
        pointsExpired: 0,
        totalOrders: 52,
        totalSpent: 1800000,
        lastOrderDate: '2024-01-13T19:30:00.000Z',
        nextTierPoints: 800,
        status: 'active',
        createdAt: '2024-01-05T10:00:00.000Z',
        updatedAt: '2024-01-13T19:30:00.000Z'
      }
    ]

    const programsResult = await programsCollection.insertMany(samplePrograms)
    const customersResult = await customersCollection.insertMany(sampleCustomers)

    return NextResponse.json({
      success: true,
      message: `${programsResult.insertedCount} برنامه وفاداری و ${customersResult.insertedCount} مشتری وفادار نمونه اضافه شد`,
      data: {
        programs: programsResult.insertedIds,
        customers: customersResult.insertedIds
      }
    })
  } catch (error) {
    console.error('Error adding sample loyalty programs:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در اضافه کردن برنامه‌های وفاداری نمونه' },
      { status: 500 }
    )
  }
}
