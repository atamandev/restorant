import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://admin:StrongPassword123@185.204.169.107:27017/restaurant?authSource=admin'
const DB_NAME = 'restaurant'
const COLLECTION_NAME = 'audit_logs'

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

// GET - دریافت لاگ‌های audit با فیلتر و pagination
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()
    const auditCollection = db.collection(COLLECTION_NAME)
    const { searchParams } = new URL(request.url)
    
    const type = searchParams.get('type') // 'logs', 'stats', 'analytics'
    
    if (type === 'stats') {
      // آمار کلی
      const totalLogs = await auditCollection.countDocuments({})
      const successLogs = await auditCollection.countDocuments({ status: 'success' })
      const failedLogs = await auditCollection.countDocuments({ status: 'failed' })
      const warningLogs = await auditCollection.countDocuments({ status: 'warning' })
      
      // آمار بر اساس action
      const actionStats = await auditCollection.aggregate([
        { $group: { _id: '$action', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]).toArray()
      
      // فعال‌ترین کاربران
      const topUsers = await auditCollection.aggregate([
        { $group: { _id: '$userId', userName: { $first: '$userName' }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]).toArray()
      
      return NextResponse.json({
        success: true,
        data: {
          totalLogs,
          successLogs,
          failedLogs,
          warningLogs,
          actionStats,
          topUsers
        }
      })
    } else if (type === 'analytics') {
      // Analytics پیشرفته
      const actionStats = await auditCollection.aggregate([
        { $group: { _id: '$action', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]).toArray()
      
      const entityStats = await auditCollection.aggregate([
        { $group: { _id: '$entity', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]).toArray()
      
      const statusStats = await auditCollection.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]).toArray()
      
      const topUsers = await auditCollection.aggregate([
        { $group: { _id: '$userId', userName: { $first: '$userName' }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]).toArray()
      
      // فعالیت‌های روزانه (آخرین 30 روز)
      const dailyActivity = await auditCollection.aggregate([
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: -1 } },
        { $limit: 30 }
      ]).toArray()
      
      return NextResponse.json({
        success: true,
        data: {
          actionStats,
          entityStats,
          statusStats,
          topUsers,
          dailyActivity
        }
      })
    } else {
      // دریافت لاگ‌ها با فیلتر
      const userId = searchParams.get('userId')
      const action = searchParams.get('action')
      const entity = searchParams.get('entity')
      const status = searchParams.get('status')
      const ipAddress = searchParams.get('ipAddress')
      const dateFrom = searchParams.get('dateFrom')
      const dateTo = searchParams.get('dateTo')
      const search = searchParams.get('search') || ''
      const sortBy = searchParams.get('sortBy') || 'timestamp'
      const sortOrder = searchParams.get('sortOrder') || 'desc'
      const limit = parseInt(searchParams.get('limit') || '100')
      const skip = parseInt(searchParams.get('skip') || '0')
      
      // ساخت فیلتر
      const filter: any = {}
      
      if (userId) filter.userId = userId
      if (action) filter.action = action
      if (entity) filter.entity = entity
      if (status) filter.status = status
      if (ipAddress) filter.ipAddress = { $regex: ipAddress, $options: 'i' }
      
      if (dateFrom || dateTo) {
        filter.timestamp = {}
        if (dateFrom) {
          filter.timestamp.$gte = new Date(dateFrom)
        }
        if (dateTo) {
          filter.timestamp.$lte = new Date(dateTo)
        }
      }
      
      if (search) {
        filter.$or = [
          { userName: { $regex: search, $options: 'i' } },
          { entityName: { $regex: search, $options: 'i' } },
          { details: { $regex: search, $options: 'i' } },
          { entityId: { $regex: search, $options: 'i' } }
        ]
      }
      
      // ساخت مرتب‌سازی
      const sort: any = {}
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1
      
      const logs = await auditCollection
        .find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .toArray()
      
      const total = await auditCollection.countDocuments(filter)
      
      // Format logs
      const formattedLogs = logs.map((log: any) => ({
        ...log,
        id: log._id.toString(),
        _id: log._id.toString()
      }))
      
      return NextResponse.json({
        success: true,
        data: formattedLogs,
        total,
        page: Math.floor(skip / limit) + 1,
        totalPages: Math.ceil(total / limit)
      })
    }
  } catch (error) {
    console.error('Error fetching audit logs:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت لاگ‌ها' },
      { status: 500 }
    )
  }
}

// POST - ایجاد لاگ جدید (معمولاً برای تست یا اضافه کردن دستی)
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()
    const body = await request.json()
    const auditCollection = db.collection(COLLECTION_NAME)
    
    // Validate required fields
    if (!body.action || !body.entity || !body.userId) {
      return NextResponse.json(
        { success: false, message: 'action، entity و userId اجباری هستند' },
        { status: 400 }
      )
    }
    
    const auditLog = {
      userId: body.userId,
      userName: body.userName || 'نامشخص',
      action: body.action,
      entity: body.entity,
      entityId: body.entityId || '',
      entityName: body.entityName || '',
      timestamp: body.timestamp ? new Date(body.timestamp) : new Date(),
      ipAddress: body.ipAddress || '127.0.0.1',
      userAgent: body.userAgent || '',
      status: body.status || 'success',
      details: body.details || '',
      beforeData: body.beforeData || null,
      afterData: body.afterData || null,
      changes: body.changes || [],
      sessionId: body.sessionId || `SESS-${Date.now()}`,
      location: body.location || null,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    const result = await auditCollection.insertOne(auditLog)
    
    return NextResponse.json({
      success: true,
      data: { ...auditLog, _id: result.insertedId.toString(), id: result.insertedId.toString() },
      message: 'لاگ با موفقیت ایجاد شد'
    })
  } catch (error) {
    console.error('Error creating audit log:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در ایجاد لاگ' },
      { status: 500 }
    )
  }
}

// DELETE - حذف لاگ‌ها (بر اساس فیلتر یا ID)
export async function DELETE(request: NextRequest) {
  try {
    await connectToDatabase()
    const { searchParams } = new URL(request.url)
    const auditCollection = db.collection(COLLECTION_NAME)
    
    const id = searchParams.get('id')
    const deleteBefore = searchParams.get('deleteBefore') // تاریخ قبل از این تاریخ
    const action = searchParams.get('action') // 'clear-old' برای پاک کردن لاگ‌های قدیمی
    
    if (action === 'clear-old' && deleteBefore) {
      // حذف لاگ‌های قدیمی‌تر از تاریخ مشخص
      const result = await auditCollection.deleteMany({
        timestamp: { $lt: new Date(deleteBefore) }
      })
      
      return NextResponse.json({
        success: true,
        message: `${result.deletedCount} لاگ قدیمی حذف شد`,
        deletedCount: result.deletedCount
      })
    } else if (id) {
      // حذف لاگ خاص
      const result = await auditCollection.deleteOne({ _id: new ObjectId(id) })
      
      if (result.deletedCount === 0) {
        return NextResponse.json(
          { success: false, message: 'لاگ یافت نشد' },
          { status: 404 }
        )
      }
      
      return NextResponse.json({
        success: true,
        message: 'لاگ با موفقیت حذف شد'
      })
    } else {
      return NextResponse.json(
        { success: false, message: 'شناسه یا تاریخ لازم است' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error deleting audit log:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در حذف لاگ' },
      { status: 500 }
    )
  }
}

