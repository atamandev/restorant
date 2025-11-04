import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://restorenUser:1234@localhost:27017/restoren'

let client: MongoClient
let clientPromise: Promise<MongoClient>

if (!client) {
  client = new MongoClient(MONGO_URI)
  clientPromise = client.connect()
}

/**
 * DELETE - حذف همه سفارشات تست (ORD-000001 تا ORD-000008)
 */
export async function DELETE(request: NextRequest) {
  try {
    const client = await clientPromise
    const db = client.db('restoren')
    const collection = db.collection('orders')

    // لیست orderNumber های تست که باید حذف شوند
    const testOrderNumbers = [
      'ORD-000001',
      'ORD-000002',
      'ORD-000003',
      'ORD-000004',
      'ORD-000005',
      'ORD-000006',
      'ORD-000007',
      'ORD-000008'
    ]

    // حذف همه سفارشات با این orderNumber ها
    const result = await collection.deleteMany({
      orderNumber: { $in: testOrderNumbers }
    })

    return NextResponse.json({
      success: true,
      message: `${result.deletedCount} سفارش تست حذف شد`,
      data: {
        deletedCount: result.deletedCount,
        orderNumbers: testOrderNumbers
      }
    })
  } catch (error) {
    console.error('Error deleting test orders:', error)
    return NextResponse.json({
      success: false,
      message: 'خطا در حذف سفارشات تست',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * GET - بررسی سفارشات تست موجود
 */
export async function GET(request: NextRequest) {
  try {
    const client = await clientPromise
    const db = client.db('restoren')
    const collection = db.collection('orders')

    const testOrderNumbers = [
      'ORD-000001',
      'ORD-000002',
      'ORD-000003',
      'ORD-000004',
      'ORD-000005',
      'ORD-000006',
      'ORD-000007',
      'ORD-000008'
    ]

    const testOrders = await collection.find({
      orderNumber: { $in: testOrderNumbers }
    }).toArray()

    return NextResponse.json({
      success: true,
      data: {
        count: testOrders.length,
        orders: testOrders.map(order => ({
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          status: order.status,
          total: order.total
        }))
      }
    })
  } catch (error) {
    console.error('Error checking test orders:', error)
    return NextResponse.json({
      success: false,
      message: 'خطا در بررسی سفارشات تست',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

