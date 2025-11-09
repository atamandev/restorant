import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'
import { logStocktaking } from '@/lib/audit-logger'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://restorenUser:1234@localhost:27017/restoren'
const DB_NAME = 'restoren'

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

// PUT - تغییر وضعیت برگه شمارش
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = await connectToDatabase()
    const countsCollection = db.collection('inventory_counts')
    
    const body = await request.json()
    const { status, performedBy } = body
    
    const validStatuses = ['draft', 'counting', 'ready_for_approval', 'approved', 'closed', 'cancelled']
    
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, message: `وضعیت نامعتبر. وضعیت‌های معتبر: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }
    
    // دریافت برگه شمارش
    const count = await countsCollection.findOne({ _id: new ObjectId(params.id) })
    
    if (!count) {
      return NextResponse.json(
        { success: false, message: 'برگه شمارش یافت نشد' },
        { status: 404 }
      )
    }
    
    // بررسی انتقال‌های مجاز
    const currentStatus = count.status
    const updateData: any = {
      status,
      updatedAt: new Date().toISOString()
    }
    
    // تنظیم تاریخ‌ها بر اساس وضعیت
    if (status === 'counting' && currentStatus === 'draft') {
      updateData.startedDate = new Date().toISOString()
    }
    
    if (status === 'ready_for_approval' && currentStatus === 'counting') {
      // بررسی اینکه همه آیتم‌ها شمارش شده‌اند
      const countItemsCollection = db.collection('count_items')
      const items = await countItemsCollection.find({ countId: params.id }).toArray()
      const unCountedItems = items.filter((item: any) => 
        item.countedQuantity === null || item.countedQuantity === undefined
      )
      
      if (unCountedItems.length > 0) {
        return NextResponse.json(
          { success: false, message: `${unCountedItems.length} آیتم هنوز شمارش نشده است` },
          { status: 400 }
        )
      }
    }
    
    if (status === 'cancelled') {
      updateData.cancelledBy = performedBy || 'سیستم'
      updateData.cancelledDate = new Date().toISOString()
    }
    
    if (status === 'closed') {
      if (currentStatus !== 'approved') {
        return NextResponse.json(
          { success: false, message: 'فقط برگه‌های تأیید شده قابل بستن هستند' },
          { status: 400 }
        )
      }
      updateData.closedBy = performedBy || 'سیستم'
      updateData.closedDate = new Date().toISOString()
    }
    
    await countsCollection.updateOne(
      { _id: new ObjectId(params.id) },
      { $set: updateData }
    )
    
    const updatedCount = await countsCollection.findOne({ _id: new ObjectId(params.id) })
    
    // ثبت لاگ ممیزی
    try {
      const afterState = {
        status: updatedCount?.status
      }
      
      const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
      const userAgent = request.headers.get('user-agent') || 'unknown'
      
      await logStocktaking(
        params.id,
        `تغییر وضعیت به ${status}`,
        beforeState,
        afterState,
        body.userId || body.performedBy || 'سیستم',
        undefined,
        clientIp,
        userAgent
      )
    } catch (error) {
      console.warn('Warning: Error logging audit event:', error)
    }
    
    return NextResponse.json({
      success: true,
      message: `وضعیت برگه شمارش به "${status}" تغییر یافت`,
      data: { ...updatedCount, _id: updatedCount._id.toString(), id: updatedCount._id.toString() }
    })
  } catch (error) {
    console.error('Error updating count status:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در تغییر وضعیت برگه شمارش', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
