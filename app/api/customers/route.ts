import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://restorenUser:1234@localhost:27017/restoren'
const DB_NAME = 'restoren'
const COLLECTION_NAME = 'customers'

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

// GET - دریافت تمام مشتریان با فیلتر و مرتب‌سازی (با امکان جستجو و دریافت اطلاعات کامل)
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()
    const customersCollection = db.collection(COLLECTION_NAME)
    const loyaltiesCollection = db.collection('customer_loyalties')
    const feedbackCollection = db.collection('customer_feedback')
    const ordersCollection = db.collection('orders')
    
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const customerType = searchParams.get('customerType')
    const sortBy = searchParams.get('sortBy') || 'registrationDate'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = parseInt(searchParams.get('skip') || '0')
    const search = searchParams.get('search') || '' // جستجو در نام، شماره تماس، ایمیل
    const phone = searchParams.get('phone') // جستجو بر اساس شماره تماس (برای POS)
    const customerId = searchParams.get('customerId') // دریافت مشتری خاص (برای POS)
    const includeStats = searchParams.get('includeStats') === 'true' // شامل آمار سفارش‌ها و بازخوردها

    // اگر customerId داده شده، مستقیماً برگردان
    if (customerId) {
      try {
        const customer = await customersCollection.findOne({ _id: new ObjectId(customerId) })
        if (!customer) {
          return NextResponse.json(
            { success: false, message: 'مشتری یافت نشد' },
            { status: 404 }
          )
        }

        // اگر includeStats=true باشد، آمار را هم بیاور
        if (includeStats) {
          const loyalty = await loyaltiesCollection.findOne({ customerId: customerId })
          const feedbackCount = await feedbackCollection.countDocuments({ customerId: customerId })
          const orderCount = await ordersCollection.countDocuments({ customerId: customerId })
          const totalSpentResult = await ordersCollection.aggregate([
            { $match: { customerId: customerId } },
            { $group: { _id: null, total: { $sum: '$total' } } }
          ]).toArray()

          return NextResponse.json({
            success: true,
            data: {
              ...customer,
              loyalty: loyalty || null,
              feedbackCount,
              orderCount,
              totalSpentFromOrders: totalSpentResult[0]?.total || 0
            }
          })
        }

        return NextResponse.json({
          success: true,
          data: customer
        })
      } catch (error) {
        return NextResponse.json(
          { success: false, message: 'شناسه مشتری نامعتبر است' },
          { status: 400 }
        )
      }
    }

    // اگر phone داده شده، بر اساس شماره تماس جستجو کن (برای POS)
    if (phone) {
      const customer = await customersCollection.findOne({ 
        phone: phone,
        status: { $ne: 'blocked' } // مشتریان مسدود شده را نشان نده
      })
      
      if (!customer) {
        return NextResponse.json({
          success: false,
          message: 'مشتری با این شماره تماس یافت نشد',
          data: null
        })
      }

      // اطلاعات کامل مشتری را برگردان
      const loyalty = await loyaltiesCollection.findOne({ customerId: customer._id.toString() })
      
      return NextResponse.json({
        success: true,
        data: {
          ...customer,
          loyalty: loyalty || null
        }
      })
    }

    // ساخت فیلتر
    const filter: any = {}
    if (status && status !== 'all') filter.status = status
    if (customerType && customerType !== 'all') filter.customerType = customerType
    
    // جستجو
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { customerNumber: { $regex: search, $options: 'i' } }
      ]
    }

    // ساخت مرتب‌سازی
    const sort: any = {}
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1

    // محدود کردن به حداکثر 200 برای عملکرد بهتر
    const maxLimit = Math.min(limit, 200)
    
    const customers = await customersCollection
      .find(filter, {
        projection: {
          _id: 1,
          name: 1,
          firstName: 1,
          lastName: 1,
          phone: 1,
          email: 1,
          customerNumber: 1,
          customerType: 1,
          status: 1,
          registrationDate: 1,
          totalSpent: 1,
          totalOrders: 1
        }
      })
      .sort(sort)
      .skip(skip)
      .limit(maxLimit)
      .toArray()

    // محاسبه آمار واقعی از سفارشات برای هر مشتری
    const orderStatsMap = new Map()
    const monthlyStatsMap = new Map()

    if (customers.length > 0) {
      try {
        const customerIds = customers.map(c => c._id.toString())
        const customerObjectIds = customerIds.map(id => new ObjectId(id))
        
        // محاسبه تعداد سفارشات و خرید کل از همه collection ها
        // فقط سفارشاتی که customerId دارند را در نظر می‌گیریم
        // 1. از collection orders
        const orderStatsFromOrders = await ordersCollection.aggregate([
          {
            $match: {
              customerId: { $in: customerObjectIds }
            }
          },
          {
            $group: {
              _id: {
                customerId: '$customerId',
                customerPhone: '$customerPhone'
              },
              totalOrders: { $sum: 1 },
              totalSpent: { $sum: { $ifNull: ['$total', 0] } },
              lastOrderDate: { $max: '$orderTime' }
            }
          }
        ]).toArray()

        // 2. از collection dine_in_orders
        const dineInOrdersCollection = db.collection('dine_in_orders')
        const orderStatsFromDineIn = await dineInOrdersCollection.aggregate([
          {
            $match: {
              customerId: { $in: customerObjectIds }
            }
          },
          {
            $group: {
              _id: {
                customerId: '$customerId',
                customerPhone: '$customerPhone'
              },
              totalOrders: { $sum: 1 },
              totalSpent: { $sum: { $ifNull: ['$total', 0] } },
              lastOrderDate: { $max: { $ifNull: ['$estimatedReadyTime', '$createdAt'] } }
            }
          }
        ]).toArray()

        // 3. از collection takeaway_orders
        const takeawayOrdersCollection = db.collection('takeaway_orders')
        const orderStatsFromTakeaway = await takeawayOrdersCollection.aggregate([
          {
            $match: {
              customerId: { $in: customerObjectIds }
            }
          },
          {
            $group: {
              _id: {
                customerId: '$customerId',
                customerPhone: '$customerPhone'
              },
              totalOrders: { $sum: 1 },
              totalSpent: { $sum: { $ifNull: ['$total', 0] } },
              lastOrderDate: { $max: { $ifNull: ['$estimatedReadyTime', '$createdAt'] } }
            }
          }
        ]).toArray()

        // 4. از collection delivery_orders
        const deliveryOrdersCollection = db.collection('delivery_orders')
        const orderStatsFromDelivery = await deliveryOrdersCollection.aggregate([
          {
            $match: {
              customerId: { $in: customerObjectIds }
            }
          },
          {
            $group: {
              _id: {
                customerId: '$customerId',
                customerPhone: '$customerPhone'
              },
              totalOrders: { $sum: 1 },
              totalSpent: { $sum: { $ifNull: ['$total', 0] } },
              lastOrderDate: { $max: { $ifNull: ['$estimatedDeliveryTime', '$createdAt'] } }
            }
          }
        ]).toArray()

        // ترکیب آمار از همه collection ها
        const allOrderStats = [
          ...orderStatsFromOrders,
          ...orderStatsFromDineIn,
          ...orderStatsFromTakeaway,
          ...orderStatsFromDelivery
        ]

        // گروه‌بندی و جمع‌آوری آمار بر اساس customerId
        // فقط سفارشاتی که customerId دارند را به مشتری‌ها اختصاص می‌دهیم
        // این کار از اختصاص سفارشات به مشتری اشتباه جلوگیری می‌کند
        for (const stat of allOrderStats) {
          const customerId = stat._id.customerId
          
          // فقط اگر customerId وجود داشته باشد، سفارش را به مشتری اختصاص می‌دهیم
          if (!customerId) {
            continue // سفارشات بدون customerId را نادیده می‌گیریم
          }
          
          // تبدیل customerId به string اگر ObjectId باشد
          const customerIdStr = customerId instanceof ObjectId 
            ? customerId.toString() 
            : String(customerId)
          
          // بررسی اینکه آیا این customerId در لیست مشتری‌های فعلی وجود دارد
          const customerExists = customers.some(c => c._id.toString() === customerIdStr)
          
          if (customerExists) {
            const existing = orderStatsMap.get(customerIdStr) || {
              totalOrders: 0,
              totalSpent: 0,
              lastOrderDate: null
            }
            
            orderStatsMap.set(customerIdStr, {
              totalOrders: existing.totalOrders + stat.totalOrders,
              totalSpent: existing.totalSpent + stat.totalSpent,
              lastOrderDate: existing.lastOrderDate && stat.lastOrderDate
                ? new Date(existing.lastOrderDate) > new Date(stat.lastOrderDate)
                  ? existing.lastOrderDate
                  : stat.lastOrderDate
                : existing.lastOrderDate || stat.lastOrderDate
            })
          }
        }

        // محاسبه خرید ماهانه (ماه جاری) از همه collection ها
        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

        const monthlyStatsFromOrders = await ordersCollection.aggregate([
          {
            $match: {
              customerId: { $in: customerObjectIds },
              orderTime: {
                $gte: startOfMonth,
                $lte: endOfMonth
              },
              status: { $in: ['completed', 'paid', 'delivered'] }
            }
          },
          {
            $group: {
              _id: {
                customerId: '$customerId',
                customerPhone: '$customerPhone'
              },
              monthlySpent: { $sum: { $ifNull: ['$total', 0] } },
              monthlyOrders: { $sum: 1 }
            }
          }
        ]).toArray()

        const monthlyStatsFromDineIn = await dineInOrdersCollection.aggregate([
          {
            $match: {
              customerId: { $in: customerObjectIds },
              createdAt: {
                $gte: startOfMonth,
                $lte: endOfMonth
              },
              status: { $in: ['completed', 'paid'] }
            }
          },
          {
            $group: {
              _id: {
                customerId: '$customerId',
                customerPhone: '$customerPhone'
              },
              monthlySpent: { $sum: { $ifNull: ['$total', 0] } },
              monthlyOrders: { $sum: 1 }
            }
          }
        ]).toArray()

        const monthlyStatsFromTakeaway = await takeawayOrdersCollection.aggregate([
          {
            $match: {
              customerId: { $in: customerObjectIds },
              createdAt: {
                $gte: startOfMonth,
                $lte: endOfMonth
              },
              status: { $in: ['completed', 'paid'] }
            }
          },
          {
            $group: {
              _id: {
                customerId: '$customerId',
                customerPhone: '$customerPhone'
              },
              monthlySpent: { $sum: { $ifNull: ['$total', 0] } },
              monthlyOrders: { $sum: 1 }
            }
          }
        ]).toArray()

        const monthlyStatsFromDelivery = await deliveryOrdersCollection.aggregate([
          {
            $match: {
              customerId: { $in: customerObjectIds },
              createdAt: {
                $gte: startOfMonth,
                $lte: endOfMonth
              },
              status: { $in: ['completed', 'paid', 'delivered'] }
            }
          },
          {
            $group: {
              _id: {
                customerId: '$customerId',
                customerPhone: '$customerPhone'
              },
              monthlySpent: { $sum: { $ifNull: ['$total', 0] } },
              monthlyOrders: { $sum: 1 }
            }
          }
        ]).toArray()

        // ترکیب آمار ماهانه از همه collection ها
        const allMonthlyStats = [
          ...monthlyStatsFromOrders,
          ...monthlyStatsFromDineIn,
          ...monthlyStatsFromTakeaway,
          ...monthlyStatsFromDelivery
        ]

        for (const stat of allMonthlyStats) {
          const customerId = stat._id.customerId
          
          // فقط اگر customerId وجود داشته باشد، سفارش را به مشتری اختصاص می‌دهیم
          if (!customerId) {
            continue // سفارشات بدون customerId را نادیده می‌گیریم
          }
          
          // تبدیل customerId به string اگر ObjectId باشد
          const customerIdStr = customerId instanceof ObjectId 
            ? customerId.toString() 
            : String(customerId)
          
          // بررسی اینکه آیا این customerId در لیست مشتری‌های فعلی وجود دارد
          const customerExists = customers.some(c => c._id.toString() === customerIdStr)
          
          if (customerExists) {
            const existing = monthlyStatsMap.get(customerIdStr) || {
              monthlySpent: 0,
              monthlyOrders: 0
            }
            
            monthlyStatsMap.set(customerIdStr, {
              monthlySpent: existing.monthlySpent + stat.monthlySpent,
              monthlyOrders: existing.monthlyOrders + stat.monthlyOrders
            })
          }
        }
      } catch (error) {
        console.error('[CUSTOMERS] Error calculating order stats:', error)
        // ادامه بده با مقادیر پیش‌فرض
      }
    }

    // به‌روزرسانی اطلاعات هر مشتری با آمار واقعی
    for (const customer of customers) {
      const customerIdStr = customer._id.toString()
      const orderStat = orderStatsMap.get(customerIdStr)
      const monthlyStat = monthlyStatsMap.get(customerIdStr)

      // به‌روزرسانی با آمار واقعی از سفارشات
      customer.totalOrders = orderStat?.totalOrders || 0
      customer.totalSpent = orderStat?.totalSpent || 0
      customer.lastOrderDate = orderStat?.lastOrderDate || null
      customer.monthlySpent = monthlyStat?.monthlySpent || 0
      customer.monthlyOrders = monthlyStat?.monthlyOrders || 0

      // اگر includeStats=true باشد، اطلاعات اضافی را هم بیاور
      if (includeStats) {
        try {
          const loyalty = await loyaltiesCollection.findOne({ customerId: customerIdStr })
          const feedbackCount = await feedbackCollection.countDocuments({ customerId: customerIdStr })
          
          customer.loyalty = loyalty || null
          customer.feedbackCount = feedbackCount
        } catch (error) {
          console.error(`[CUSTOMERS] Error fetching stats for customer ${customerIdStr}:`, error)
        }
      }
    }

    // آمار کلی
    const stats = await customersCollection.aggregate([
      {
        $group: {
          _id: null,
          totalCustomers: { $sum: 1 },
          totalRevenue: { $sum: '$totalSpent' },
          activeCustomers: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
          inactiveCustomers: { $sum: { $cond: [{ $eq: ['$status', 'inactive'] }, 1, 0] } },
          blockedCustomers: { $sum: { $cond: [{ $eq: ['$status', 'blocked'] }, 1, 0] } },
          goldenCustomers: { $sum: { $cond: [{ $eq: ['$customerType', 'golden'] }, 1, 0] } },
          vipCustomers: { $sum: { $cond: [{ $eq: ['$customerType', 'vip'] }, 1, 0] } }
        }
      }
    ]).toArray()

    return NextResponse.json({
      success: true,
      data: customers,
      stats: stats[0] || {
        totalCustomers: 0,
        totalRevenue: 0,
        activeCustomers: 0,
        inactiveCustomers: 0,
        blockedCustomers: 0,
        goldenCustomers: 0,
        vipCustomers: 0
      },
      pagination: {
        limit,
        skip,
        total: await customersCollection.countDocuments(filter)
      }
    })
  } catch (error) {
    console.error('Error fetching customers:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در دریافت مشتریان',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// POST - ایجاد مشتری جدید (با اتصال به باشگاه مشتریان)
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()
    const customersCollection = db.collection(COLLECTION_NAME)
    const loyaltiesCollection = db.collection('customer_loyalties')
    
    const body = await request.json()
    
    // بررسی تکراری نبودن شماره تماس
    if (body.phone) {
      const existingCustomer = await customersCollection.findOne({ phone: body.phone })
      if (existingCustomer) {
        return NextResponse.json(
          { success: false, message: 'مشتری با این شماره تماس قبلاً ثبت شده است' },
          { status: 400 }
        )
      }
    }
    
    // تولید شماره مشتری منحصر به فرد
    const customerCount = await customersCollection.countDocuments()
    const customerNumber = `CUST-${String(customerCount + 1).padStart(6, '0')}`
    
    const customer = {
      customerNumber,
      firstName: body.firstName || '',
      lastName: body.lastName || '',
      name: (body.firstName || '') + ' ' + (body.lastName || ''),
      phone: body.phone || '',
      email: body.email || '',
      address: body.address || '',
      birthDate: body.birthDate || null,
      registrationDate: body.registrationDate || new Date().toISOString(),
      totalOrders: 0,
      totalSpent: 0,
      lastOrderDate: null,
      status: body.status || 'active',
      notes: body.notes || '',
      tags: body.tags || [],
      loyaltyPoints: 0,
      customerType: body.customerType || 'regular',
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await customersCollection.insertOne(customer)
    const customerId = result.insertedId.toString()
    
    // ایجاد رکورد باشگاه مشتریان به صورت خودکار
    const loyalty = {
      customerId: customerId,
      customerName: customer.name,
      customerPhone: customer.phone,
      totalPoints: 0,
      currentTier: 'Bronze',
      pointsEarned: 0,
      pointsRedeemed: 0,
      pointsExpired: 0,
      totalOrders: 0,
      totalSpent: 0,
      lastOrderDate: null,
      nextTierPoints: 100, // برای دستیابی به Silver
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    await loyaltiesCollection.insertOne(loyalty)
    
    return NextResponse.json({
      success: true,
      data: { ...customer, _id: result.insertedId, loyalty },
      message: 'مشتری با موفقیت ایجاد شد و به باشگاه مشتریان اضافه شد'
    })
  } catch (error) {
    console.error('Error creating customer:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در ایجاد مشتری',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// DELETE - حذف مشتری
export async function DELETE(request: NextRequest) {
  try {
    await connectToDatabase()
    const customersCollection = db.collection(COLLECTION_NAME)
    const loyaltiesCollection = db.collection('customer_loyalties')
    const ordersCollection = db.collection('orders')
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'شناسه مشتری اجباری است' },
        { status: 400 }
      )
    }

    // بررسی وجود سفارش‌های مرتبط
    const hasOrders = await ordersCollection.countDocuments({ customerId: id }) > 0
    if (hasOrders) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'امکان حذف مشتری با سفارش موجود وجود ندارد. ابتدا مشتری را غیرفعال کنید.' 
        },
        { status: 400 }
      )
    }

    // حذف از باشگاه مشتریان
    await loyaltiesCollection.deleteMany({ customerId: id })
    
    const result = await customersCollection.deleteOne({ _id: new ObjectId(id) })
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'مشتری یافت نشد' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'مشتری با موفقیت حذف شد'
    })
  } catch (error) {
    console.error('Error deleting customer:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در حذف مشتری' },
      { status: 500 }
    )
  }
}
