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

// GET - مشتریان وفادار کیان؟
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()
    
    const { searchParams } = new URL(request.url)
    const tier = searchParams.get('tier') // Bronze, Silver, Gold, Platinum
    const limit = parseInt(searchParams.get('limit') || '20')
    const sortBy = searchParams.get('sortBy') || 'totalPoints' // totalPoints, totalSpent, totalOrders

    const customerLoyaltiesCollection = db.collection('customer_loyalties')
    const customersCollection = db.collection('customers')

    // فیلتر
    const filter: any = {
      status: 'active'
    }
    if (tier && tier !== 'all') {
      filter.currentTier = tier
    }

    // مرتب‌سازی
    const sort: any = {}
    switch (sortBy) {
      case 'totalSpent':
        sort.totalSpent = -1
        break
      case 'totalOrders':
        sort.totalOrders = -1
        break
      default:
        sort.totalPoints = -1
    }

    const loyalCustomers = await customerLoyaltiesCollection
      .find(filter)
      .sort(sort)
      .limit(limit)
      .toArray()

    // افزودن اطلاعات مشتری
    const loyalCustomersWithDetails = []
    for (const loyalty of loyalCustomers) {
      let customer = null
      if (loyalty.customerId) {
        try {
          customer = await customersCollection.findOne({ _id: new ObjectId(loyalty.customerId) })
        } catch {
          // customerId نامعتبر است
        }
      }

      loyalCustomersWithDetails.push({
        loyaltyId: loyalty._id.toString(),
        customerId: loyalty.customerId,
        customerName: loyalty.customerName || customer?.name || 'نامشخص',
        customerPhone: loyalty.customerPhone || customer?.phone || '',
        customerEmail: customer?.email || '',
        totalPoints: loyalty.totalPoints || 0,
        currentTier: loyalty.currentTier || 'Bronze',
        pointsEarned: loyalty.pointsEarned || 0,
        pointsRedeemed: loyalty.pointsRedeemed || 0,
        totalOrders: loyalty.totalOrders || 0,
        totalSpent: loyalty.totalSpent || 0,
        lastOrderDate: loyalty.lastOrderDate,
        nextTierPoints: loyalty.nextTierPoints || 0,
        customer: customer ? {
          name: customer.name,
          phone: customer.phone,
          email: customer.email,
          address: customer.address,
          customerType: customer.customerType
        } : null
      })
    }

    // آمار کلی
    const stats = await customerLoyaltiesCollection.aggregate([
      {
        $match: { status: 'active' }
      },
      {
        $group: {
          _id: null,
          totalCustomers: { $sum: 1 },
          totalPoints: { $sum: '$totalPoints' },
          totalSpent: { $sum: '$totalSpent' },
          bronze: { $sum: { $cond: [{ $eq: ['$currentTier', 'Bronze'] }, 1, 0] } },
          silver: { $sum: { $cond: [{ $eq: ['$currentTier', 'Silver'] }, 1, 0] } },
          gold: { $sum: { $cond: [{ $eq: ['$currentTier', 'Gold'] }, 1, 0] } },
          platinum: { $sum: { $cond: [{ $eq: ['$currentTier', 'Platinum'] }, 1, 0] } }
        }
      }
    ]).toArray()

    return NextResponse.json({
      success: true,
      data: loyalCustomersWithDetails.map((customer: any, index: number) => ({
        rank: index + 1,
        ...customer
      })),
      stats: stats[0] || {
        totalCustomers: 0,
        totalPoints: 0,
        totalSpent: 0,
        bronze: 0,
        silver: 0,
        gold: 0,
        platinum: 0
      },
      message: 'مشتریان وفادار با موفقیت دریافت شد'
    })
  } catch (error) {
    console.error('Error fetching loyal customers:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در دریافت مشتریان وفادار',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

