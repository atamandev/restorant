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

// DELETE - حذف سفارشات تکمیل شده
export async function DELETE(request: NextRequest) {
  try {
    const db = await connectToDatabase()
    const collection = db.collection('kitchen_orders')

    // حذف سفارشات با وضعیت 'completed'
    const result = await collection.deleteMany({
      status: 'completed'
    })

    console.log(`Deleted ${result.deletedCount} completed kitchen orders`)

    return NextResponse.json({
      success: true,
      message: `${result.deletedCount} سفارش تکمیل شده با موفقیت حذف شد`,
      deletedCount: result.deletedCount
    })
  } catch (error) {
    console.error('Error deleting completed kitchen orders:', error)
    return NextResponse.json({
      success: false,
      message: 'خطا در حذف سفارشات تکمیل شده',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

