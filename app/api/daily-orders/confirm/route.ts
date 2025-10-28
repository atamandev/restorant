import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://restorenUser:1234@localhost:27017/restoren'

// PATCH /api/daily-orders/confirm - تایید سفارش
export async function PATCH(request: NextRequest) {
  let client: MongoClient | null = null
  
  try {
    const body = await request.json()
    console.log('Received confirm body:', body)
    
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

    console.log('Confirming daily order with data:', updateFields)

    const result = await db.collection('daily_orders').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    )

    console.log('Confirm result:', result)

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'سفارش روزانه مورد نظر یافت نشد' },
        { status: 404 }
      )
    }

    const updatedOrder = await db.collection('daily_orders').findOne({ _id: new ObjectId(id) })

    console.log('Confirmed daily order:', updatedOrder)

    return NextResponse.json({
      success: true,
      data: updatedOrder,
      message: `سفارش با موفقیت ${status === 'completed' ? 'تایید' : 'رد'} شد`
    })
  } catch (error) {
    console.error('Error confirming daily order:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در تایید سفارش',
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
