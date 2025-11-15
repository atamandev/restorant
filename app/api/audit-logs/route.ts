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

// انواع رویدادها
export type AuditEventType = 
  | 'STOCK_MOVEMENT'
  | 'TRANSFER'
  | 'STOCKTAKING'
  | 'ORDER'
  | 'WAREHOUSE'
  | 'ITEM'
  | 'ALERT'
  | 'SETTINGS'

// GET - دریافت لاگ‌های ممیزی
export async function GET(request: NextRequest) {
  try {
    const db = await connectToDatabase()
    const auditLogsCollection = db.collection('audit_logs')
    
    const { searchParams } = new URL(request.url)
    const eventType = searchParams.get('eventType')
    const referenceType = searchParams.get('referenceType')
    const referenceId = searchParams.get('referenceId')
    const userId = searchParams.get('userId')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const limit = parseInt(searchParams.get('limit') || '100')
    const skip = parseInt(searchParams.get('skip') || '0')
    const search = searchParams.get('search') || ''
    
    // ساخت فیلتر
    const filter: any = {}
    
    if (eventType && eventType !== 'all') {
      filter.eventType = eventType
    }
    
    if (referenceType && referenceType !== 'all') {
      filter.referenceType = referenceType
    }
    
    if (referenceId) {
      filter.referenceId = referenceId
    }
    
    if (userId && userId !== 'all') {
      filter.userId = userId
    }
    
    if (dateFrom || dateTo) {
      filter.timestamp = {}
      if (dateFrom) {
        filter.timestamp.$gte = new Date(dateFrom)
      }
      if (dateTo) {
        const endDate = new Date(dateTo)
        endDate.setHours(23, 59, 59, 999)
        filter.timestamp.$lte = endDate
      }
    }
    
    if (search) {
      filter.$or = [
        { description: { $regex: search, $options: 'i' } },
        { userId: { $regex: search, $options: 'i' } },
        { referenceId: { $regex: search, $options: 'i' } }
      ]
    }
    
    // دریافت لاگ‌ها
    const logs = await auditLogsCollection
      .find(filter)
      .sort({ timestamp: -1 }) // جدیدترین اول
      .skip(skip)
      .limit(limit)
      .toArray()
    
    const total = await auditLogsCollection.countDocuments(filter)
    
    // آمار کلی
    const stats = await auditLogsCollection.aggregate([
      {
        $group: {
          _id: null,
          totalLogs: { $sum: 1 },
          stockMovementLogs: { $sum: { $cond: [{ $eq: ['$eventType', 'STOCK_MOVEMENT'] }, 1, 0] } },
          transferLogs: { $sum: { $cond: [{ $eq: ['$eventType', 'TRANSFER'] }, 1, 0] } },
          stocktakingLogs: { $sum: { $cond: [{ $eq: ['$eventType', 'STOCKTAKING'] }, 1, 0] } },
          orderLogs: { $sum: { $cond: [{ $eq: ['$eventType', 'ORDER'] }, 1, 0] } }
        }
      }
    ]).toArray()
    
    return NextResponse.json({
      success: true,
      data: logs,
      stats: stats[0] || {
        totalLogs: 0,
        stockMovementLogs: 0,
        transferLogs: 0,
        stocktakingLogs: 0,
        orderLogs: 0
      },
      pagination: {
        total,
        limit,
        skip,
        hasMore: skip + limit < total
      }
    })
  } catch (error) {
    console.error('Error fetching audit logs:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت لاگ‌های ممیزی' },
      { status: 500 }
    )
  }
}

// POST - ثبت لاگ ممیزی
export async function POST(request: NextRequest) {
  try {
    const db = await connectToDatabase()
    const auditLogsCollection = db.collection('audit_logs')
    
    const body = await request.json()
    const {
      eventType,
      referenceType,
      referenceId,
      userId,
      description,
      before,
      after,
      diff,
      reason,
      ipAddress,
      userAgent,
      metadata
    } = body
    
    if (!eventType || !referenceType || !userId) {
      return NextResponse.json(
        { success: false, message: 'eventType، referenceType و userId اجباری است' },
        { status: 400 }
      )
    }
    
    // دریافت IP و User Agent از request
    const clientIp = ipAddress || request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const clientUserAgent = userAgent || request.headers.get('user-agent') || 'unknown'
    
    const log = {
      eventType,
      referenceType,
      referenceId: referenceId || null,
      userId,
      description: description || '',
      before: before || null,
      after: after || null,
      diff: diff || null,
      reason: reason || null,
      ipAddress: clientIp,
      userAgent: clientUserAgent,
      metadata: metadata || {},
      timestamp: new Date(),
      createdAt: new Date().toISOString()
    }
    
    const result = await auditLogsCollection.insertOne(log)
    
    return NextResponse.json({
      success: true,
      data: { ...log, _id: result.insertedId },
      message: 'لاگ با موفقیت ثبت شد'
    })
  } catch (error) {
    console.error('Error creating audit log:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در ثبت لاگ ممیزی' },
      { status: 500 }
    )
  }
}

