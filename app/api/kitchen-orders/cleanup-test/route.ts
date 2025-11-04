import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://restorenUser:1234@localhost:27017/restoren'
const DB_NAME = 'restoren'

let client: MongoClient
let db: any

async function connectToDatabase() {
  try {
    if (!client) {
      client = new MongoClient(MONGO_URI)
      await client.connect()
      db = client.db(DB_NAME)
    } else if (!db) {
      db = client.db(DB_NAME)
    }
    
    if (!db) {
      throw new Error('Database connection failed: db is null')
    }
    
    return db
  } catch (error) {
    console.error('Database connection error:', error)
    if (client) {
      try {
        await client.close()
      } catch (e) {
        // Ignore close errors
      }
      client = null as any
    }
    db = null
    throw error
  }
}

// DELETE - حذف سفارشات تستی
export async function DELETE(request: NextRequest) {
  try {
    const db = await connectToDatabase()
    const collection = db.collection('kitchen_orders')

    // شماره‌های سفارشات تستی که باید حذف شوند
    const testOrderNumbers = [
      'DI-001',
      'TW-002',
      'DL-003',
      'DI-004',
      'DL-695759',
      'TW-703271',
      'DI-562988'
    ]

    // حذف سفارشات با شماره‌های تستی
    const result = await collection.deleteMany({
      orderNumber: { $in: testOrderNumbers }
    })

    console.log(`Deleted ${result.deletedCount} test kitchen orders`)

    return NextResponse.json({
      success: true,
      message: `${result.deletedCount} سفارش تستی با موفقیت حذف شد`,
      deletedCount: result.deletedCount
    })
  } catch (error) {
    console.error('Error deleting test kitchen orders:', error)
    return NextResponse.json({
      success: false,
      message: 'خطا در حذف سفارشات تستی',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

