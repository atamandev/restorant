import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://restorenUser:1234@localhost:27017/restoren'
const DB_NAME = 'restoren'
const COLLECTION_NAME = 'transfers'

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

// GET - دریافت تمام انتقالات با فیلتر و مرتب‌سازی
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // pending, in_transit, completed, cancelled
    const type = searchParams.get('type') // internal, external, return, adjustment
    const fromWarehouse = searchParams.get('fromWarehouse')
    const toWarehouse = searchParams.get('toWarehouse')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const limit = parseInt(searchParams.get('limit') || '100')
    const skip = parseInt(searchParams.get('skip') || '0')
    const search = searchParams.get('search') || ''

    // ساخت فیلتر
    const filter: any = {}
    if (status && status !== 'all') filter.status = status
    if (type && type !== 'all') filter.type = type
    if (fromWarehouse && fromWarehouse !== 'all') filter.fromWarehouse = fromWarehouse
    if (toWarehouse && toWarehouse !== 'all') filter.toWarehouse = toWarehouse
    if (search) {
      filter.$or = [
        { transferNumber: { $regex: search, $options: 'i' } },
        { fromWarehouse: { $regex: search, $options: 'i' } },
        { toWarehouse: { $regex: search, $options: 'i' } },
        { requestedBy: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } }
      ]
    }

    // ساخت مرتب‌سازی
    const sort: any = {}
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1

    const transfers = await collection
      .find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .toArray()

    // آمار کلی
    const stats = await collection.aggregate([
      {
        $group: {
          _id: null,
          totalTransfers: { $sum: 1 },
          pendingTransfers: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          inTransitTransfers: { $sum: { $cond: [{ $eq: ['$status', 'in_transit'] }, 1, 0] } },
          completedTransfers: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          cancelledTransfers: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
          totalItems: { $sum: { $size: '$items' } },
          totalValue: { $sum: '$totalValue' }
        }
      }
    ]).toArray()

    return NextResponse.json({
      success: true,
      data: transfers,
      stats: stats[0] || {
        totalTransfers: 0,
        pendingTransfers: 0,
        inTransitTransfers: 0,
        completedTransfers: 0,
        cancelledTransfers: 0,
        totalItems: 0,
        totalValue: 0
      },
      pagination: {
        limit,
        skip,
        total: await collection.countDocuments(filter)
      }
    })
  } catch (error) {
    console.error('Error fetching transfers:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت انتقالات' },
      { status: 500 }
    )
  }
}

// POST - ایجاد انتقال جدید
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const body = await request.json()
    
    // تولید شماره انتقال منحصر به فرد
    const transferCount = await collection.countDocuments()
    const transferNumber = `TRF-${String(transferCount + 1).padStart(6, '0')}`
    
    // محاسبه ارزش کل
    const totalValue = body.items?.reduce((sum: number, item: any) => 
      sum + (item.quantity * item.unitPrice), 0) || 0
    
    const transfer = {
      transferNumber,
      type: body.type || 'internal', // internal, external, return, adjustment
      fromWarehouse: body.fromWarehouse,
      toWarehouse: body.toWarehouse,
      items: body.items || [],
      totalItems: body.items?.length || 0,
      totalValue,
      requestedBy: body.requestedBy,
      approvedBy: body.approvedBy || null,
      status: body.status || 'pending', // pending, in_transit, completed, cancelled
      priority: body.priority || 'normal', // low, normal, high, urgent
      scheduledDate: body.scheduledDate || null,
      actualDate: body.actualDate || null,
      notes: body.notes || '',
      reason: body.reason || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const result = await collection.insertOne(transfer)
    
    return NextResponse.json({
      success: true,
      data: { ...transfer, _id: result.insertedId },
      message: 'انتقال با موفقیت ایجاد شد'
    })
  } catch (error) {
    console.error('Error creating transfer:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در ایجاد انتقال' },
      { status: 500 }
    )
  }
}

// PUT - به‌روزرسانی انتقال
export async function PUT(request: NextRequest) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'شناسه انتقال اجباری است' },
        { status: 400 }
      )
    }

    // محاسبه مجدد ارزش کل اگر آیتم‌ها تغییر کرده باشند
    if (updateData.items) {
      updateData.totalItems = updateData.items.length
      updateData.totalValue = updateData.items.reduce((sum: number, item: any) => 
        sum + (item.quantity * item.unitPrice), 0)
    }

    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: {
          ...updateData,
          updatedAt: new Date().toISOString()
        }
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'انتقال یافت نشد' },
        { status: 404 }
      )
    }

    const updatedTransfer = await collection.findOne({ _id: new ObjectId(id) })

    return NextResponse.json({
      success: true,
      data: updatedTransfer,
      message: 'انتقال با موفقیت به‌روزرسانی شد'
    })
  } catch (error) {
    console.error('Error updating transfer:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در به‌روزرسانی انتقال' },
      { status: 500 }
    )
  }
}

// DELETE - حذف انتقال
export async function DELETE(request: NextRequest) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'شناسه انتقال اجباری است' },
        { status: 400 }
      )
    }

    // بررسی وضعیت انتقال
    const transfer = await collection.findOne({ _id: new ObjectId(id) })
    if (transfer && transfer.status === 'completed') {
      return NextResponse.json(
        { 
          success: false, 
          message: 'امکان حذف انتقال تکمیل شده وجود ندارد' 
        },
        { status: 400 }
      )
    }

    const result = await collection.deleteOne({ _id: new ObjectId(id) })
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'انتقال یافت نشد' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'انتقال با موفقیت حذف شد'
    })
  } catch (error) {
    console.error('Error deleting transfer:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در حذف انتقال' },
      { status: 500 }
    )
  }
}
