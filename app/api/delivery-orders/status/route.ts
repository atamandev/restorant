import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'
import { 
  reserveInventoryForOrder, 
  consumeReservedInventory, 
  releaseReservedInventory 
} from '../../inventory-reservations/helpers'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://restorenUser:1234@localhost:27017/restoren'

let client: MongoClient
let clientPromise: Promise<MongoClient>

if (!client) {
  client = new MongoClient(MONGO_URI)
  clientPromise = client.connect()
}

export async function PATCH(request: NextRequest) {
  try {
    const client = await clientPromise
    const db = client.db('restoren')
    const collection = db.collection('delivery_orders')

    const body = await request.json()
    const { id, status } = body

    if (!id) {
      return NextResponse.json({
        success: false,
        message: 'شناسه سفارش اجباری است'
      }, { status: 400 })
    }

    if (!status) {
      return NextResponse.json({
        success: false,
        message: 'وضعیت سفارش اجباری است'
      }, { status: 400 })
    }

    const validStatuses = ['pending', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({
        success: false,
        message: 'وضعیت نامعتبر است'
      }, { status: 400 })
    }

    // دریافت سفارش فعلی
    const currentOrder = await collection.findOne({ _id: new ObjectId(id) })
    if (!currentOrder) {
      return NextResponse.json({
        success: false,
        message: 'سفارش یافت نشد'
      }, { status: 404 })
    }

    const oldStatus = currentOrder.status
    const finalStatus = String(status)
    
    console.log(`[STATUS UPDATE] Delivery Order ${currentOrder.orderNumber}: ${oldStatus} → ${finalStatus}`)

    // استفاده از transaction
    const session = client.startSession()
    
    try {
      await session.withTransaction(async () => {
        // به‌روزرسانی status
        await collection.updateOne(
          { _id: new ObjectId(id) },
          { 
            $set: {
              status: finalStatus,
              updatedAt: new Date()
            }
          },
          { session }
        )

        // منطق رزرو/مصرف/آزاد کردن موجودی بر اساس وضعیت
        
        // 1. رزرو موجودی در وضعیت 'preparing' یا 'confirmed' یا 'accepted'
        if ((oldStatus !== 'preparing' && oldStatus !== 'confirmed' && oldStatus !== 'accepted') && 
            (finalStatus === 'preparing' || finalStatus === 'confirmed' || finalStatus === 'accepted')) {
          
          console.log(`[RESERVE] Delivery Order ${currentOrder.orderNumber}: Reserving inventory`)
          
          const reserveResult = await reserveInventoryForOrder(
            db,
            session,
            id,
            currentOrder.orderNumber,
            'delivery',
            currentOrder.items || []
          )

          if (!reserveResult.success) {
            throw new Error(reserveResult.message || 'خطا در رزرو موجودی')
          }
        }

        // 2. مصرف موجودی رزرو شده در وضعیت 'completed' یا 'paid' یا 'delivered'
        if ((oldStatus !== 'completed' && oldStatus !== 'paid' && oldStatus !== 'delivered') && 
            (finalStatus === 'completed' || finalStatus === 'paid' || finalStatus === 'delivered')) {
          
          console.log(`[CONSUME] Delivery Order ${currentOrder.orderNumber}: Consuming reserved inventory`)
          
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
          
          console.log(`[RELEASE] Delivery Order ${currentOrder.orderNumber}: Releasing reserved inventory`)
          
          const releaseResult = await releaseReservedInventory(
            db,
            session,
            id,
            currentOrder.orderNumber
          )

          if (!releaseResult.success) {
            console.warn(`[RELEASE] Warning: ${releaseResult.message}`)
          }
        }
      })
    } finally {
      await session.endSession()
    }

    return NextResponse.json({
      success: true,
      message: 'وضعیت سفارش با موفقیت به‌روزرسانی شد'
    })
  } catch (error) {
    console.error('Error updating delivery order status:', error)
    return NextResponse.json({
      success: false,
      message: 'خطا در به‌روزرسانی وضعیت سفارش'
    }, { status: 500 })
  }
}
