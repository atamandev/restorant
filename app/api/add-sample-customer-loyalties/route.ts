import { NextRequest, NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://restorenUser:1234@localhost:27017/restoren'
const DB_NAME = 'restoren'
const COLLECTION_NAME = 'customer_loyalties'

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

// POST - اضافه کردن داده‌های نمونه مشتریان وفادار
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    // پاک کردن داده‌های قبلی
    await collection.deleteMany({})
    
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
      },
      {
        customerId: 'CUST-000006',
        customerName: 'زهرا نوری',
        customerPhone: '09123456794',
        totalPoints: 150,
        currentTier: 'Bronze',
        pointsEarned: 200,
        pointsRedeemed: 50,
        pointsExpired: 0,
        totalOrders: 5,
        totalSpent: 120000,
        lastOrderDate: '2024-01-08T15:10:00.000Z',
        nextTierPoints: 350,
        status: 'inactive',
        createdAt: '2024-01-06T10:00:00.000Z',
        updatedAt: '2024-01-08T15:10:00.000Z'
      },
      {
        customerId: 'CUST-000007',
        customerName: 'محمد صادقی',
        customerPhone: '09123456795',
        totalPoints: 6800,
        currentTier: 'Diamond',
        pointsEarned: 7500,
        pointsRedeemed: 700,
        pointsExpired: 0,
        totalOrders: 95,
        totalSpent: 3200000,
        lastOrderDate: '2024-01-16T20:15:00.000Z',
        nextTierPoints: 0,
        status: 'active',
        createdAt: '2024-01-07T10:00:00.000Z',
        updatedAt: '2024-01-16T20:15:00.000Z'
      },
      {
        customerId: 'CUST-000008',
        customerName: 'نرگس مهدوی',
        customerPhone: '09123456796',
        totalPoints: 950,
        currentTier: 'Bronze',
        pointsEarned: 1200,
        pointsRedeemed: 250,
        pointsExpired: 0,
        totalOrders: 22,
        totalSpent: 650000,
        lastOrderDate: '2024-01-12T13:45:00.000Z',
        nextTierPoints: 50,
        status: 'active',
        createdAt: '2024-01-08T10:00:00.000Z',
        updatedAt: '2024-01-12T13:45:00.000Z'
      }
    ]

    const result = await collection.insertMany(sampleCustomers)

    return NextResponse.json({
      success: true,
      message: `${result.insertedCount} مشتری وفادار نمونه اضافه شد`,
      data: result.insertedIds
    })
  } catch (error) {
    console.error('Error adding sample customer loyalties:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در اضافه کردن مشتریان وفادار نمونه' },
      { status: 500 }
    )
  }
}