import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

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

// GET - دریافت تمام نظرات مشتریان
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    const customersCollection = db.collection('customers')
    
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const category = searchParams.get('category')
    const sentiment = searchParams.get('sentiment')
    const customerId = searchParams.get('customerId') // فیلتر بر اساس مشتری خاص
    const orderId = searchParams.get('orderId') // فیلتر بر اساس سفارش خاص
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const limit = parseInt(searchParams.get('limit') || '100')
    const skip = parseInt(searchParams.get('skip') || '0')

    // ساخت فیلتر
    const filter: any = {}
    if (status && status !== 'all') filter.status = status
    if (category && category !== 'all') filter.category = category
    if (sentiment && sentiment !== 'all') filter.sentiment = sentiment
    if (customerId) {
      try {
        filter.customerId = customerId
      } catch {
        filter.customerId = customerId
      }
    }
    if (orderId) filter.orderId = orderId

    // ساخت مرتب‌سازی
    const sort: any = {}
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1

    const feedbacks = await collection
      .find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .toArray()

    // اگر customerId داده شده، اطلاعات مشتری را هم بیاور
    if (customerId) {
      try {
        const customer = await customersCollection.findOne({ _id: new ObjectId(customerId) })
        return NextResponse.json({
          success: true,
          data: feedbacks,
          customer: customer || null,
          stats: await getFeedbackStats(collection, customerId),
          pagination: {
            limit,
            skip,
            total: await collection.countDocuments(filter)
          }
        })
      } catch {
        // customerId نامعتبر است، بدون اطلاعات مشتری برگردان
      }
    }

    // آمار کلی
    const stats = await collection.aggregate([
      {
        $group: {
          _id: null,
          totalFeedbacks: { $sum: 1 },
          averageRating: { $avg: '$rating' },
          pendingFeedbacks: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          reviewedFeedbacks: { $sum: { $cond: [{ $eq: ['$status', 'reviewed'] }, 1, 0] } },
          resolvedFeedbacks: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
          positiveFeedbacks: { $sum: { $cond: [{ $eq: ['$sentiment', 'positive'] }, 1, 0] } },
          negativeFeedbacks: { $sum: { $cond: [{ $eq: ['$sentiment', 'negative'] }, 1, 0] } }
        }
      }
    ]).toArray()

    return NextResponse.json({
      success: true,
      data: feedbacks,
      stats: stats[0] || {
        totalFeedbacks: 0,
        averageRating: 0,
        pendingFeedbacks: 0,
        reviewedFeedbacks: 0,
        resolvedFeedbacks: 0,
        positiveFeedbacks: 0,
        negativeFeedbacks: 0
      },
      pagination: {
        limit,
        skip,
        total: await collection.countDocuments(filter)
      }
    })
  } catch (error) {
    console.error('Error fetching feedbacks:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در دریافت نظرات',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// POST - ایجاد نظر جدید (با به‌روزرسانی خودکار در customer record)
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()
    const feedbackCollection = db.collection(COLLECTION_NAME)
    const customersCollection = db.collection('customers')
    
    const body = await request.json()
    
    // اگر customerId داده نشده اما customerPhone داده شده، مشتری را پیدا کن
    let finalCustomerId = body.customerId
    let customerInfo = null
    
    if (!finalCustomerId && body.customerPhone) {
      const customer = await customersCollection.findOne({ phone: body.customerPhone })
      if (customer) {
        finalCustomerId = customer._id.toString()
        customerInfo = customer
      }
    } else if (finalCustomerId) {
      try {
        customerInfo = await customersCollection.findOne({ _id: new ObjectId(finalCustomerId) })
      } catch {
        // customerId نامعتبر است
      }
    }

    // اگر customerId هنوز نداریم اما customerName یا customerPhone داده شده، سعی کن مشتری جدید ایجاد کنی (اختیاری)
    // یا اینکه فقط feedback را بدون customerId ذخیره کن

    // تعیین sentiment خودکار بر اساس rating
    let sentiment = body.sentiment || 'neutral'
    if (body.rating !== undefined) {
      if (body.rating >= 4) sentiment = 'positive'
      else if (body.rating <= 2) sentiment = 'negative'
      else sentiment = 'neutral'
    }

    // اگر comment منفی باشد، sentiment را negative کن
    if (body.comment) {
      const negativeKeywords = ['بد', 'ضعیف', 'خراب', 'ناراضی', 'مشکل', 'خطا', 'اشتباه', 'شکایت']
      const positiveKeywords = ['خوب', 'عالی', 'عالیه', 'خیلی خوب', 'ممتاز', 'راضی']
      
      const lowerComment = body.comment.toLowerCase()
      if (negativeKeywords.some(keyword => lowerComment.includes(keyword))) {
        sentiment = 'negative'
      } else if (positiveKeywords.some(keyword => lowerComment.includes(keyword))) {
        sentiment = 'positive'
      }
    }

    const feedback = {
      customerId: finalCustomerId || null,
      customerName: body.customerName || customerInfo?.name || '',
      customerPhone: body.customerPhone || customerInfo?.phone || '',
      orderId: body.orderId || null,
      rating: body.rating || 0,
      comment: body.comment || '',
      category: body.category || 'other', // food_quality, service, delivery, price, other
      sentiment: sentiment,
      status: body.status || 'pending',
      response: body.response || '',
      respondedAt: body.respondedAt || null,
      respondedBy: body.respondedBy || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const result = await feedbackCollection.insertOne(feedback)

    // اگر customerId وجود دارد، اطلاعات مشتری را به‌روزرسانی کن
    if (finalCustomerId && customerInfo) {
      // محاسبه میانگین rating مشتری
      const allFeedbacks = await feedbackCollection.find({ customerId: finalCustomerId }).toArray()
      const avgRating = allFeedbacks.length > 0
        ? allFeedbacks.reduce((sum, fb) => sum + (fb.rating || 0), 0) / allFeedbacks.length
        : feedback.rating

      // به‌روزرسانی customer record
      await customersCollection.updateOne(
        { _id: new ObjectId(finalCustomerId) },
        {
          $set: {
            lastFeedbackDate: new Date().toISOString(),
            averageRating: avgRating,
            updatedAt: new Date()
          },
          $inc: {
            feedbackCount: 1
          }
        }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: { ...feedback, _id: result.insertedId },
      message: 'نظر با موفقیت ثبت شد' + (finalCustomerId ? ' و اطلاعات مشتری به‌روزرسانی شد' : '')
    })
  } catch (error) {
    console.error('Error creating feedback:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در ثبت نظر',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// PUT - به‌روزرسانی نظر (مثلاً پاسخ دادن یا تغییر وضعیت)
export async function PUT(request: NextRequest) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'شناسه نظر اجباری است' },
        { status: 400 }
      )
    }

    const updateFields: any = {
      updatedAt: new Date().toISOString()
    }

    if (updateData.status !== undefined) updateFields.status = updateData.status
    if (updateData.response !== undefined) {
      updateFields.response = updateData.response
      updateFields.respondedAt = new Date().toISOString()
      updateFields.respondedBy = updateData.respondedBy || 'سیستم'
    }
    if (updateData.rating !== undefined) updateFields.rating = updateData.rating
    if (updateData.comment !== undefined) updateFields.comment = updateData.comment
    if (updateData.category !== undefined) updateFields.category = updateData.category

    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'نظر یافت نشد' },
        { status: 404 }
      )
    }

    const updatedFeedback = await collection.findOne({ _id: new ObjectId(id) })

    // اگر customerId دارد، اطلاعات مشتری را به‌روزرسانی کن
    if (updatedFeedback.customerId) {
      const customersCollection = db.collection('customers')
      const allFeedbacks = await collection.find({ customerId: updatedFeedback.customerId }).toArray()
      const avgRating = allFeedbacks.length > 0
        ? allFeedbacks.reduce((sum, fb) => sum + (fb.rating || 0), 0) / allFeedbacks.length
        : updatedFeedback.rating

      await customersCollection.updateOne(
        { _id: new ObjectId(updatedFeedback.customerId) },
        {
          $set: {
            averageRating: avgRating,
            updatedAt: new Date()
          }
        }
      )
    }

    return NextResponse.json({
      success: true,
      data: updatedFeedback,
      message: 'نظر با موفقیت به‌روزرسانی شد'
    })
  } catch (error) {
    console.error('Error updating feedback:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در به‌روزرسانی نظر',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// DELETE - حذف نظر
export async function DELETE(request: NextRequest) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    const customersCollection = db.collection('customers')
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'شناسه نظر اجباری است' },
        { status: 400 }
      )
    }

    const feedback = await collection.findOne({ _id: new ObjectId(id) })
    if (!feedback) {
      return NextResponse.json(
        { success: false, message: 'نظر یافت نشد' },
        { status: 404 }
      )
    }

    const result = await collection.deleteOne({ _id: new ObjectId(id) })

    // اگر customerId دارد، اطلاعات مشتری را به‌روزرسانی کن
    if (feedback.customerId) {
      await customersCollection.updateOne(
        { _id: new ObjectId(feedback.customerId) },
        {
          $inc: {
            feedbackCount: -1
          },
          $set: {
            updatedAt: new Date()
          }
        }
      )

      // محاسبه مجدد میانگین rating
      const allFeedbacks = await collection.find({ customerId: feedback.customerId }).toArray()
      const avgRating = allFeedbacks.length > 0
        ? allFeedbacks.reduce((sum, fb) => sum + (fb.rating || 0), 0) / allFeedbacks.length
        : 0

      await customersCollection.updateOne(
        { _id: new ObjectId(feedback.customerId) },
        {
          $set: {
            averageRating: avgRating,
            updatedAt: new Date()
          }
        }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'نظر با موفقیت حذف شد'
    })
  } catch (error) {
    console.error('Error deleting feedback:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در حذف نظر' },
      { status: 500 }
    )
  }
}

// تابع کمکی برای محاسبه آمار بازخورد مشتری
async function getFeedbackStats(collection: any, customerId: string) {
  const stats = await collection.aggregate([
    { $match: { customerId } },
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

  return stats[0] || {
    totalFeedbacks: 0,
    averageRating: 0,
    positiveFeedbacks: 0,
    negativeFeedbacks: 0
  }
}
