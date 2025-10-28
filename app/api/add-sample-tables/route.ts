import { NextRequest, NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://restorenUser:1234@localhost:27017/restoren'

export async function POST(request: NextRequest) {
  let client: MongoClient | null = null
  
  try {
    console.log('Adding sample tables...')
    client = new MongoClient(MONGO_URI)
    await client.connect()
    
    const db = client.db('restoren')
    const collection = db.collection('tables')
    
    // میزهای نمونه رستوران
    const sampleTables = [
      {
        number: "1",
        capacity: 2,
        status: "available",
        location: "سالن اصلی",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        number: "2",
        capacity: 4,
        status: "occupied",
        location: "سالن اصلی",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        number: "3",
        capacity: 6,
        status: "available",
        location: "سالن اصلی",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        number: "4",
        capacity: 2,
        status: "occupied",
        location: "سالن اصلی",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        number: "5",
        capacity: 4,
        status: "reserved",
        location: "سالن اصلی",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        number: "6",
        capacity: 8,
        status: "available",
        location: "سالن VIP",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        number: "7",
        capacity: 2,
        status: "available",
        location: "سالن VIP",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        number: "8",
        capacity: 4,
        status: "available",
        location: "سالن VIP",
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]
    
    // حذف میزهای قبلی
    await collection.deleteMany({})
    console.log('Cleared existing tables')
    
    // اضافه کردن میزهای جدید
    const result = await collection.insertMany(sampleTables)
    console.log(`Added ${result.insertedCount} tables`)
    
    return NextResponse.json({
      success: true,
      message: `${result.insertedCount} میز با موفقیت اضافه شد`,
      count: result.insertedCount
    })
  } catch (error) {
    console.error('Error adding tables:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در اضافه کردن میزها',
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
