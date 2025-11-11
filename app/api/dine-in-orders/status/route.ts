import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'
import { 
  reserveInventoryForOrder, 
  consumeReservedInventory, 
  releaseReservedInventory 
} from '../../inventory-reservations/helpers'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://restorenUser:1234@localhost:27017/restoren'

// PATCH /api/dine-in-orders/status - به‌روزرسانی وضعیت سفارش حضوری
export async function PATCH(request: NextRequest) {
  let client: MongoClient | null = null
  
  try {
    const body = await request.json()
    console.log('Received status update body:', body)
    
    const { id, status, notes } = body

    if (!id || !status) {
      return NextResponse.json(
        { success: false, message: 'شناسه سفارش و وضعیت اجباری است' },
        { status: 400 }
      )
    }

    client = new MongoClient(MONGO_URI)
    await client.connect()
    const db = client.db('restoren')
    
    // دریافت سفارش فعلی
    const currentOrder = await db.collection('dine_in_orders').findOne({ _id: new ObjectId(id) })
    if (!currentOrder) {
      return NextResponse.json(
        { success: false, message: 'سفارش حضوری مورد نظر یافت نشد' },
        { status: 404 }
      )
    }

    const oldStatus = currentOrder.status
    const finalStatus = String(status)
    
    const updateFields: any = {
      status: finalStatus,
      updatedAt: new Date()
    }

    if (notes) {
      updateFields.notes = String(notes)
    }

    console.log(`[STATUS UPDATE] Order ${currentOrder.orderNumber}: ${oldStatus} → ${finalStatus}`)

    // استفاده از transaction برای اطمینان از همگام‌سازی
    const session = client.startSession()
    
    try {
      await session.withTransaction(async () => {
        // به‌روزرسانی status
        await db.collection('dine_in_orders').updateOne(
          { _id: new ObjectId(id) },
          { $set: updateFields },
          { session }
        )

        // منطق رزرو/مصرف/آزاد کردن موجودی بر اساس وضعیت
        
        // 1. رزرو موجودی در وضعیت 'preparing' یا 'confirmed' یا 'accepted'
        if ((oldStatus !== 'preparing' && oldStatus !== 'confirmed' && oldStatus !== 'accepted') && 
            (finalStatus === 'preparing' || finalStatus === 'confirmed' || finalStatus === 'accepted')) {
          
          console.log(`[RESERVE] Order ${currentOrder.orderNumber}: Reserving inventory for status ${finalStatus}`)
          
          const reserveResult = await reserveInventoryForOrder(
            db,
            session,
            id,
            currentOrder.orderNumber,
            'dine-in',
            currentOrder.items || []
          )

          if (!reserveResult.success) {
            throw new Error(reserveResult.message || 'خطا در رزرو موجودی')
          }
        }

        // 2. مصرف موجودی رزرو شده در وضعیت 'completed' یا 'paid'
        if ((oldStatus !== 'completed' && oldStatus !== 'paid') && 
            (finalStatus === 'completed' || finalStatus === 'paid')) {
          
          console.log(`[CONSUME] Order ${currentOrder.orderNumber}: Consuming reserved inventory`)
          
          const consumeResult = await consumeReservedInventory(
            db,
            session,
            id,
            currentOrder.orderNumber
          )

          if (!consumeResult.success) {
            throw new Error(consumeResult.message || 'خطا در مصرف موجودی رزرو شده')
          }
        }

        // 3. آزاد کردن رزرو در وضعیت 'cancelled'
        if (oldStatus !== 'cancelled' && finalStatus === 'cancelled') {
          
          console.log(`[RELEASE] Order ${currentOrder.orderNumber}: Releasing reserved inventory`)
          
          const releaseResult = await releaseReservedInventory(
            db,
            session,
            id,
            currentOrder.orderNumber
          )

          if (!releaseResult.success) {
            console.warn(`[RELEASE] Warning: ${releaseResult.message}`)
            // در صورت لغو، خطا را throw نمی‌کنیم چون ممکن است سفارش قبلاً مصرف شده باشد
          }
        }
      })
    } finally {
      await session.endSession()
    }

    const updatedOrder = await db.collection('dine_in_orders').findOne({ _id: new ObjectId(id) })

    console.log('Updated dine-in order status:', updatedOrder)

    return NextResponse.json({
      success: true,
      data: updatedOrder,
      message: `وضعیت سفارش به ${status} تغییر یافت`
    })
  } catch (error) {
    console.error('Error updating dine-in order status:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در به‌روزرسانی وضعیت سفارش',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  } finally {
    if (client) {
      await client.close()
    }
  }
}
