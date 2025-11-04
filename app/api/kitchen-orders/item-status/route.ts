import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

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
    const collection = db.collection('kitchen_orders')

    const body = await request.json()
    const { orderId, itemId, status } = body

    if (!orderId) {
      return NextResponse.json({
        success: false,
        message: 'شناسه سفارش اجباری است'
      }, { status: 400 })
    }

    if (!itemId) {
      return NextResponse.json({
        success: false,
        message: 'شناسه آیتم اجباری است'
      }, { status: 400 })
    }

    if (!status) {
      return NextResponse.json({
        success: false,
        message: 'وضعیت آیتم اجباری است'
      }, { status: 400 })
    }

    const validStatuses = ['pending', 'preparing', 'ready', 'completed']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({
        success: false,
        message: 'وضعیت نامعتبر است'
      }, { status: 400 })
    }

    // Update the specific item status
    // دریافت سفارش و پیدا کردن آیتم
    const order = await collection.findOne({ _id: new ObjectId(orderId) })
    if (!order) {
      return NextResponse.json({
        success: false,
        message: 'سفارش یافت نشد'
      }, { status: 404 })
    }

    // پیدا کردن و به‌روزرسانی آیتم
    const items = order.items.map((item: any) => {
      if (item.id === itemId || item.menuItemId === itemId) {
        return { ...item, status }
      }
      return item
    })

    // بررسی اینکه آیا آیتم پیدا شد
    const itemFound = items.some((item: any) => 
      (item.id === itemId || item.menuItemId === itemId) && item.status === status
    )

    if (!itemFound && order.items.every((item: any) => item.id !== itemId && item.menuItemId !== itemId)) {
      return NextResponse.json({
        success: false,
        message: 'آیتم در سفارش یافت نشد'
      }, { status: 404 })
    }

    // به‌روزرسانی آیتم‌ها
    const result = await collection.updateOne(
      { _id: new ObjectId(orderId) },
      { 
        $set: {
          items: items,
          updatedAt: new Date()
        }
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({
        success: false,
        message: 'سفارش یا آیتم یافت نشد'
      }, { status: 404 })
    }

    // Get the updated order to check overall status
    const updatedOrder = await collection.findOne({ _id: new ObjectId(orderId) })
    
    if (updatedOrder) {
      // Calculate overall order status based on item statuses
      const allItemsCompleted = updatedOrder.items.every((item: any) => item.status === 'completed')
      const allItemsReady = updatedOrder.items.every((item: any) => item.status === 'ready' || item.status === 'completed')
      const hasPreparingItems = updatedOrder.items.some((item: any) => item.status === 'preparing')
      
      let newOrderStatus = updatedOrder.status
      // وقتی همه آیتم‌ها ready یا completed شدند، سفارش را completed کن
      if (allItemsReady && allItemsCompleted) {
        newOrderStatus = 'completed'
      } else if (allItemsReady) {
        // وقتی همه آیتم‌ها ready شدند، سفارش را completed کن (نه ready)
        newOrderStatus = 'completed'
      } else if (hasPreparingItems) {
        newOrderStatus = 'preparing'
      }

      // Update overall order status if it changed
      if (newOrderStatus !== updatedOrder.status) {
        await collection.updateOne(
          { _id: new ObjectId(orderId) },
          { 
            $set: {
              status: newOrderStatus,
              updatedAt: new Date()
            }
          }
        )
      }
    }

    return NextResponse.json({
      success: true,
      message: 'وضعیت آیتم با موفقیت به‌روزرسانی شد'
    })
  } catch (error) {
    console.error('Error updating item status:', error)
    return NextResponse.json({
      success: false,
      message: 'خطا در به‌روزرسانی وضعیت آیتم'
    }, { status: 500 })
  }
}
