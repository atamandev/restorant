import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

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
    
    const updateFields: any = {
      status: String(status),
      updatedAt: new Date()
    }

    if (notes) {
      updateFields.notes = String(notes)
    }

    console.log('Updating dine-in order status with data:', updateFields)

    const result = await db.collection('dine_in_orders').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    )

    console.log('Status update result:', result)

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'سفارش حضوری مورد نظر یافت نشد' },
        { status: 404 }
      )
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
