import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://admin:StrongPassword123@185.204.169.107:27017/restaurant?authSource=admin'
const DB_NAME = 'restaurant'
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

// GET - دریافت مشتری خاص (با آمار کامل)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase()
    const customersCollection = db.collection(COLLECTION_NAME)
    const loyaltiesCollection = db.collection('customer_loyalties')
    const feedbackCollection = db.collection('customer_feedback')
    const ordersCollection = db.collection('orders')
    const invoicesCollection = db.collection('invoices')
    
    const customer = await customersCollection.findOne({ _id: new ObjectId(params.id) })
    
    if (!customer) {
      return NextResponse.json(
        { success: false, message: 'مشتری یافت نشد' },
        { status: 404 }
      )
    }

    // دریافت اطلاعات کامل مشتری
    const loyalty = await loyaltiesCollection.findOne({ customerId: params.id })
    
    const feedbackStats = await feedbackCollection.aggregate([
      { $match: { customerId: params.id } },
      {
        $group: {
          _id: null,
          totalFeedbacks: { $sum: 1 },
          averageRating: { $avg: '$rating' },
          positiveFeedbacks: { $sum: { $cond: [{ $eq: ['$sentiment', 'positive'] }, 1, 0] } },
          negativeFeedbacks: { $sum: { $cond: [{ $eq: ['$sentiment', 'negative'] }, 1, 0] } }
        }
      }
    ]).toArray()

    const orderStats = await ordersCollection.aggregate([
      { $match: { customerId: params.id } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: '$total' },
          averageOrderValue: { $avg: '$total' }
        }
      }
    ]).toArray()

    const recentOrders = await ordersCollection
      .find({ customerId: params.id })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray()

    const recentFeedbacks = await feedbackCollection
      .find({ customerId: params.id })
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray()

    return NextResponse.json({
      success: true,
      data: {
        ...customer,
        loyalty: loyalty || null,
        stats: {
          feedbacks: feedbackStats[0] || {
            totalFeedbacks: 0,
            averageRating: 0,
            positiveFeedbacks: 0,
            negativeFeedbacks: 0
          },
          orders: orderStats[0] || {
            totalOrders: 0,
            totalSpent: 0,
            averageOrderValue: 0
          }
        },
        recentOrders,
        recentFeedbacks
      }
    })
  } catch (error) {
    console.error('Error fetching customer:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در دریافت مشتری',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// PUT - به‌روزرسانی مشتری (با به‌روزرسانی خودکار در باشگاه مشتریان)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase()
    const customersCollection = db.collection(COLLECTION_NAME)
    const loyaltiesCollection = db.collection('customer_loyalties')
    
    const body = await request.json()
    
    // دریافت مشتری فعلی
    const currentCustomer = await customersCollection.findOne({ _id: new ObjectId(params.id) })
    if (!currentCustomer) {
      return NextResponse.json(
        { success: false, message: 'مشتری یافت نشد' },
        { status: 404 }
      )
    }

    // بررسی تکراری نبودن شماره تماس (اگر تغییر کرده)
    if (body.phone && body.phone !== currentCustomer.phone) {
      const existingCustomer = await customersCollection.findOne({ 
        phone: body.phone,
        _id: { $ne: new ObjectId(params.id) }
      })
      if (existingCustomer) {
        return NextResponse.json(
          { success: false, message: 'مشتری دیگری با این شماره تماس وجود دارد' },
          { status: 400 }
        )
      }
    }

    const updateData: any = {
      updatedAt: new Date()
    }

    // به‌روزرسانی فیلدها
    if (body.firstName !== undefined) {
      updateData.firstName = body.firstName
      updateData.name = `${body.firstName} ${body.lastName || currentCustomer.lastName || ''}`.trim()
    }
    if (body.lastName !== undefined) {
      updateData.lastName = body.lastName
      updateData.name = `${body.firstName !== undefined ? body.firstName : currentCustomer.firstName || ''} ${body.lastName}`.trim()
    }
    if (body.phone !== undefined) updateData.phone = body.phone
    if (body.email !== undefined) updateData.email = body.email
    if (body.address !== undefined) updateData.address = body.address
    if (body.birthDate !== undefined) updateData.birthDate = body.birthDate
    if (body.status !== undefined) updateData.status = body.status
    if (body.customerType !== undefined) updateData.customerType = body.customerType
    if (body.notes !== undefined) updateData.notes = body.notes
    if (body.tags !== undefined) updateData.tags = body.tags

    await customersCollection.updateOne(
      { _id: new ObjectId(params.id) },
      { $set: updateData }
    )

    // به‌روزرسانی اطلاعات در باشگاه مشتریان (اگر نام یا شماره تماس تغییر کرده)
    if (updateData.name || updateData.phone) {
      const loyaltyUpdate: any = {}
      if (updateData.name) loyaltyUpdate.customerName = updateData.name
      if (updateData.phone) loyaltyUpdate.customerPhone = updateData.phone
      loyaltyUpdate.updatedAt = new Date().toISOString()

      await loyaltiesCollection.updateOne(
        { customerId: params.id },
        { $set: loyaltyUpdate }
      )
    }

    const updatedCustomer = await customersCollection.findOne({ _id: new ObjectId(params.id) })
    
    return NextResponse.json({
      success: true,
      data: updatedCustomer,
      message: 'مشتری با موفقیت به‌روزرسانی شد'
    })
  } catch (error) {
    console.error('Error updating customer:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در به‌روزرسانی مشتری',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// DELETE - حذف مشتری
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase()
    const customersCollection = db.collection(COLLECTION_NAME)
    const loyaltiesCollection = db.collection('customer_loyalties')
    const ordersCollection = db.collection('orders')
    
    // بررسی وجود سفارش‌های مرتبط
    const hasOrders = await ordersCollection.countDocuments({ customerId: params.id }) > 0
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
    await loyaltiesCollection.deleteMany({ customerId: params.id })
    
    const result = await customersCollection.deleteOne({ _id: new ObjectId(params.id) })
    
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
