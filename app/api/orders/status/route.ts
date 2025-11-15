import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'
import { 
  reserveInventoryForOrder, 
  consumeReservedInventory, 
  releaseReservedInventory 
} from '../../inventory-reservations/helpers'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://restorenUser:1234@localhost:27017/restoren'
const DB_NAME = 'restoren'
const COLLECTION_NAME = 'orders'

let client: MongoClient
let db: any

async function connectToDatabase() {
  if (!client) {
    client = new MongoClient(MONGO_URI)
    await client.connect()
    db = client.db(DB_NAME)
  }
  // اطمینان از اینکه db هم initialize شده
  if (!db) {
    db = client.db(DB_NAME)
  }
  return db
}

// PATCH - تغییر وضعیت سفارش
export async function PATCH(request: NextRequest) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const body = await request.json()
    const { id, field, value } = body

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'شناسه سفارش اجباری است' },
        { status: 400 }
      )
    }

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: 'شناسه سفارش نامعتبر است' },
        { status: 400 }
      )
    }

    // دریافت سفارش فعلی از collection orders
    const currentOrder = await collection.findOne({ _id: new ObjectId(id) })
    if (!currentOrder) {
      return NextResponse.json(
        { success: false, message: 'سفارش یافت نشد' },
        { status: 404 }
      )
    }

    // اگر field برابر 'status' است، منطق رزرو/مصرف موجودی را اجرا کن
    if (field === 'status') {
      const oldStatus = currentOrder.status
      const newStatus = value
      const orderType = currentOrder.orderType || 'dine-in'
      const orderNumber = currentOrder.orderNumber

      // پیدا کردن سفارش اصلی بر اساس orderType و orderNumber
      let sourceCollection: string
      switch (orderType) {
        case 'dine-in':
          sourceCollection = 'dine_in_orders'
          break
        case 'takeaway':
          sourceCollection = 'takeaway_orders'
          break
        case 'delivery':
          sourceCollection = 'delivery_orders'
          break
        case 'table-order':
          sourceCollection = 'table_orders'
          break
        default:
          sourceCollection = 'dine_in_orders'
      }

      const sourceOrder = await db.collection(sourceCollection).findOne({ 
        orderNumber: orderNumber 
      })

      if (!sourceOrder) {
        console.warn(`[ORDERS/STATUS] Source order not found for ${orderNumber} in ${sourceCollection}`)
        // اگر سفارش اصلی پیدا نشد، فقط در collection orders به‌روزرسانی کن
        const updateData: any = {
          status: newStatus,
          updatedAt: new Date()
        }

        await collection.updateOne(
          { _id: new ObjectId(id) },
          { $set: updateData }
        )

        const updatedOrder = await collection.findOne({ _id: new ObjectId(id) })
        return NextResponse.json({
          success: true,
          data: updatedOrder,
          message: 'وضعیت سفارش با موفقیت تغییر کرد'
        })
      }

      // بررسی اینکه sourceOrder._id وجود دارد
      if (!sourceOrder._id) {
        console.error(`[ORDERS/STATUS] Source order ${orderNumber} has no _id`)
        return NextResponse.json(
          { 
            success: false, 
            message: 'خطا: سفارش اصلی فاقد شناسه است' 
          },
          { status: 500 }
        )
      }

      // اجرای عملیات بدون transaction (MongoDB standalone از transaction پشتیبانی نمی‌کند)
      // اطمینان از اینکه client متصل است
      if (!client) {
        throw new Error('Database client is not initialized')
      }
      
      // به‌روزرسانی وضعیت در collection orders
      await collection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { status: newStatus, updatedAt: new Date() } }
      )

      // به‌روزرسانی وضعیت در سفارش اصلی
      await db.collection(sourceCollection).updateOne(
        { orderNumber: orderNumber },
        { $set: { status: newStatus, updatedAt: new Date() } }
      )

        // منطق رزرو/مصرف/آزاد کردن موجودی بر اساس وضعیت
        
        // 1. رزرو موجودی در وضعیت 'preparing' یا 'confirmed' یا 'accepted'
        if ((oldStatus !== 'preparing' && oldStatus !== 'confirmed' && oldStatus !== 'accepted') && 
            (newStatus === 'preparing' || newStatus === 'confirmed' || newStatus === 'accepted')) {
          
          console.log(`[RESERVE] Order ${orderNumber}: Reserving inventory for status ${newStatus}`)
          console.log(`[RESERVE] Source order ID: ${sourceOrder._id}, Items count: ${(sourceOrder.items || []).length}`)
          
          try {
            // اجرای رزرو بدون session (MongoDB standalone از session پشتیبانی نمی‌کند)
            const reserveResult = await reserveInventoryForOrder(
              db,
              null, // بدون session
              sourceOrder._id.toString(),
              orderNumber,
              orderType as 'dine-in' | 'takeaway' | 'delivery' | 'table-order',
              sourceOrder.items || []
            )

            if (!reserveResult.success) {
              throw new Error(reserveResult.message || 'خطا در رزرو موجودی')
            }
          } catch (error: any) {
            console.error(`[RESERVE] Error reserving inventory for order ${orderNumber}:`, error)
            throw error
          }
        }

        // 2. مصرف موجودی رزرو شده در وضعیت 'completed' یا 'paid' یا 'delivered'
        if ((oldStatus !== 'completed' && oldStatus !== 'paid' && oldStatus !== 'delivered') && 
            (newStatus === 'completed' || newStatus === 'paid' || newStatus === 'delivered')) {
          
          console.log(`[CONSUME] Order ${orderNumber}: Consuming reserved inventory`)
          console.log(`[CONSUME] Source order ID: ${sourceOrder._id}`)
          
          try {
            // اجرای مصرف بدون session (MongoDB standalone از session پشتیبانی نمی‌کند)
            const consumeResult = await consumeReservedInventory(
              db,
              null, // بدون session
              sourceOrder._id.toString(),
              orderNumber
            )

            if (!consumeResult.success) {
              throw new Error(consumeResult.message || 'خطا در مصرف موجودی رزرو شده')
            }
          } catch (error: any) {
            console.error(`[CONSUME] Error consuming inventory for order ${orderNumber}:`, error)
            throw error
          }
        }

        // 3. آزاد کردن رزرو در وضعیت 'cancelled'
        if (oldStatus !== 'cancelled' && newStatus === 'cancelled') {
          
          console.log(`[RELEASE] Order ${orderNumber}: Releasing reserved inventory`)
          console.log(`[RELEASE] Source order ID: ${sourceOrder._id}`)
          
          try {
            // اجرای آزاد کردن بدون session (MongoDB standalone از session پشتیبانی نمی‌کند)
            const releaseResult = await releaseReservedInventory(
              db,
              null, // بدون session
              sourceOrder._id.toString(),
              orderNumber
            )

            if (!releaseResult.success) {
              console.warn(`[RELEASE] Warning: ${releaseResult.message}`)
              // در صورت لغو، خطا را throw نمی‌کنیم چون ممکن است سفارش قبلاً مصرف شده باشد
            }
          } catch (error: any) {
            console.error(`[RELEASE] Error releasing inventory for order ${orderNumber}:`, error)
            // در صورت لغو، خطا را throw نمی‌کنیم چون ممکن است سفارش قبلاً مصرف شده باشد
            console.warn(`[RELEASE] Continuing despite error...`)
          }
        }

      const updatedOrder = await collection.findOne({ _id: new ObjectId(id) })
      
      return NextResponse.json({
        success: true,
        data: updatedOrder,
        message: 'وضعیت سفارش با موفقیت تغییر کرد'
      })
    } else {
      // برای سایر فیلدها، فقط به‌روزرسانی ساده
      const updateData: any = {
        updatedAt: new Date()
      }
      updateData[field] = value

      const result = await collection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData }
      )

      if (result.matchedCount === 0) {
        return NextResponse.json(
          { success: false, message: 'سفارش یافت نشد' },
          { status: 404 }
        )
      }

      const updatedOrder = await collection.findOne({ _id: new ObjectId(id) })

      return NextResponse.json({
        success: true,
        data: updatedOrder,
        message: 'وضعیت سفارش با موفقیت تغییر کرد'
      })
    }
  } catch (error) {
    console.error('Error updating order status:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در تغییر وضعیت سفارش',
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

