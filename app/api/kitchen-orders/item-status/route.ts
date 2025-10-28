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
    const result = await collection.updateOne(
      { 
        _id: new ObjectId(orderId),
        'items.id': itemId
      },
      { 
        $set: {
          'items.$.status': status,
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
      if (allItemsCompleted) {
        newOrderStatus = 'completed'
      } else if (allItemsReady) {
        newOrderStatus = 'ready'
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
