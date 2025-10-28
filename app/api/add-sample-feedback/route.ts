import { NextRequest, NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://restorenUser:1234@localhost:27017/restoren'
const DB_NAME = 'restoren'
const COLLECTION_NAME = 'customer_feedback'

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

// POST - اضافه کردن داده‌های نمونه نظرات
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    // پاک کردن داده‌های قبلی
    await collection.deleteMany({})
    
    const sampleFeedbacks = [
      {
        customerId: 'CUST-000001',
        customerName: 'احمد محمدی',
        customerPhone: '09123456789',
        orderId: 'ORD-000001',
        rating: 5,
        comment: 'غذا خیلی خوشمزه بود و سرویس عالی. حتماً دوباره می‌آیم.',
        category: 'food',
        sentiment: 'positive',
        status: 'resolved',
        response: 'ممنون از نظر مثبت شما. خوشحالیم که راضی بودید.',
        respondedAt: '2024-01-15T10:30:00.000Z',
        createdAt: '2024-01-14T18:45:00.000Z',
        updatedAt: '2024-01-15T10:30:00.000Z'
      },
      {
        customerId: 'CUST-000002',
        customerName: 'فاطمه احمدی',
        customerPhone: '09198765432',
        orderId: 'ORD-000002',
        rating: 4,
        comment: 'غذا خوب بود ولی کمی دیر آماده شد. پیشنهاد می‌کنم سرعت سرویس را بهبود دهید.',
        category: 'service',
        sentiment: 'neutral',
        status: 'reviewed',
        response: 'نظر شما را دریافت کردیم و در حال بهبود سرعت سرویس هستیم.',
        respondedAt: '2024-01-13T14:20:00.000Z',
        createdAt: '2024-01-12T19:30:00.000Z',
        updatedAt: '2024-01-13T14:20:00.000Z'
      },
      {
        customerId: 'CUST-000003',
        customerName: 'علی رضایی',
        customerPhone: '09151234567',
        orderId: 'ORD-000003',
        rating: 3,
        comment: 'فضای رستوران خوب است ولی صدا زیاد است. غذا متوسط بود.',
        category: 'ambiance',
        sentiment: 'neutral',
        status: 'pending',
        response: '',
        respondedAt: '',
        createdAt: '2024-01-11T20:15:00.000Z',
        updatedAt: '2024-01-11T20:15:00.000Z'
      },
      {
        customerId: 'CUST-000004',
        customerName: 'مریم حسینی',
        customerPhone: '09187654321',
        orderId: 'ORD-000004',
        rating: 2,
        comment: 'سفارش من اشتباه آماده شد و وقتی تماس گرفتم، پاسخ مناسبی ندادند.',
        category: 'service',
        sentiment: 'negative',
        status: 'pending',
        response: '',
        respondedAt: '',
        createdAt: '2024-01-10T16:45:00.000Z',
        updatedAt: '2024-01-10T16:45:00.000Z'
      },
      {
        customerId: 'CUST-000005',
        customerName: 'حسن کریمی',
        customerPhone: '09134567890',
        orderId: 'ORD-000005',
        rating: 5,
        comment: 'بهترین رستوران شهر! غذا، سرویس و فضای عالی. به همه پیشنهاد می‌کنم.',
        category: 'food',
        sentiment: 'positive',
        status: 'resolved',
        response: 'سپاسگزاریم از اعتماد شما. افتخار خدمت‌رسانی به شما را داریم.',
        respondedAt: '2024-01-09T12:00:00.000Z',
        createdAt: '2024-01-08T21:30:00.000Z',
        updatedAt: '2024-01-09T12:00:00.000Z'
      },
      {
        customerId: 'CUST-000006',
        customerName: 'زهرا نوری',
        customerPhone: '09123456789',
        orderId: 'ORD-000006',
        rating: 4,
        comment: 'غذا خوشمزه بود ولی قیمت‌ها کمی بالا است. کیفیت خوب است.',
        category: 'food',
        sentiment: 'positive',
        status: 'reviewed',
        response: 'نظر شما را در نظر می‌گیریم و سعی می‌کنیم قیمت‌ها را مناسب‌تر کنیم.',
        respondedAt: '2024-01-07T15:30:00.000Z',
        createdAt: '2024-01-06T18:20:00.000Z',
        updatedAt: '2024-01-07T15:30:00.000Z'
      },
      {
        customerId: 'CUST-000007',
        customerName: 'محمد صادقی',
        customerPhone: '09156789012',
        orderId: 'ORD-000007',
        rating: 1,
        comment: 'سفارش من اصلاً آماده نشد و هیچ توضیحی ندادند. بسیار ناراضی‌ام.',
        category: 'service',
        sentiment: 'negative',
        status: 'pending',
        response: '',
        respondedAt: '',
        createdAt: '2024-01-05T19:45:00.000Z',
        updatedAt: '2024-01-05T19:45:00.000Z'
      },
      {
        customerId: 'CUST-000008',
        customerName: 'نرگس احمدی',
        customerPhone: '09167890123',
        orderId: 'ORD-000008',
        rating: 5,
        comment: 'دسرها فوق‌العاده بودند! پیشنهاد می‌کنم حتماً دسر بادام امتحان کنید.',
        category: 'food',
        sentiment: 'positive',
        status: 'resolved',
        response: 'ممنون! دسر بادام یکی از محبوب‌ترین دسرهای ما است.',
        respondedAt: '2024-01-04T11:15:00.000Z',
        createdAt: '2024-01-03T20:00:00.000Z',
        updatedAt: '2024-01-04T11:15:00.000Z'
      },
      {
        customerId: 'CUST-000009',
        customerName: 'رضا موسوی',
        customerPhone: '09178901234',
        orderId: 'ORD-000009',
        rating: 3,
        comment: 'فضای رستوران زیبا است ولی صندلی‌ها راحت نیستند. غذا متوسط بود.',
        category: 'ambiance',
        sentiment: 'neutral',
        status: 'pending',
        response: '',
        respondedAt: '',
        createdAt: '2024-01-02T17:30:00.000Z',
        updatedAt: '2024-01-02T17:30:00.000Z'
      },
      {
        customerId: 'CUST-000010',
        customerName: 'سارا رضایی',
        customerPhone: '09189012345',
        orderId: 'ORD-000010',
        rating: 4,
        comment: 'سرویس ارسال سریع بود و غذا گرم رسید. کیفیت خوب بود.',
        category: 'delivery',
        sentiment: 'positive',
        status: 'reviewed',
        response: 'خوشحالیم که سرویس ارسال ما رضایت شما را جلب کرده است.',
        respondedAt: '2024-01-01T13:45:00.000Z',
        createdAt: '2023-12-31T19:15:00.000Z',
        updatedAt: '2024-01-01T13:45:00.000Z'
      }
    ]

    const result = await collection.insertMany(sampleFeedbacks)

    return NextResponse.json({
      success: true,
      message: `${result.insertedCount} نظر نمونه اضافه شد`,
      data: result.insertedIds
    })
  } catch (error) {
    console.error('Error adding sample feedbacks:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در اضافه کردن نظرات نمونه' },
      { status: 500 }
    )
  }
}
