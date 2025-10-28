import { NextRequest, NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://restorenUser:1234@localhost:27017/restoren'

export async function GET(request: NextRequest) {
  let client: MongoClient | null = null
  
  try {
    console.log('Testing MongoDB connection...')
    client = new MongoClient(MONGO_URI)
    await client.connect()
    console.log('Connected to MongoDB')
    
    const db = client.db('restoren')
    const collections = await db.listCollections().toArray()
    console.log('Collections:', collections.map(c => c.name))
    
    return NextResponse.json({
      success: true,
      message: 'MongoDB connection successful',
      collections: collections.map(c => c.name)
    })
  } catch (error) {
    console.error('MongoDB connection error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'MongoDB connection failed',
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

