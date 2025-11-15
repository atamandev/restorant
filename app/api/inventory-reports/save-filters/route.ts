import { NextRequest, NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://admin:StrongPassword123@185.204.169.107:27017/restaurant?authSource=admin'
const DB_NAME = 'restaurant'

let client: MongoClient
let db: any

async function connectToDatabase() {
  if (!client) {
    client = new MongoClient(MONGO_URI)
    await client.connect()
    db = client.db(DB_NAME)
  }
  return db
}

// POST - ذخیره فیلترهای گزارش
export async function POST(request: NextRequest) {
  try {
    const db = await connectToDatabase()
    const collection = db.collection('report_filters')
    
    const body = await request.json()
    const { reportType, filters, name } = body
    
    if (!reportType || !filters) {
      return NextResponse.json(
        { success: false, message: 'نوع گزارش و فیلترها اجباری است' },
        { status: 400 }
      )
    }
    
    const filterDoc = {
      reportType,
      filters,
      name: name || `فیلتر ${reportType} - ${new Date().toLocaleString('fa-IR')}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    const result = await collection.insertOne(filterDoc)
    
    return NextResponse.json({
      success: true,
      data: {
        ...filterDoc,
        _id: result.insertedId.toString(),
        id: result.insertedId.toString()
      },
      message: 'فیلترها با موفقیت ذخیره شد'
    })
  } catch (error) {
    console.error('Error saving filters:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در ذخیره فیلترها', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// GET - دریافت فیلترهای ذخیره شده
export async function GET(request: NextRequest) {
  try {
    const db = await connectToDatabase()
    const collection = db.collection('report_filters')
    
    const { searchParams } = new URL(request.url)
    const reportType = searchParams.get('reportType')
    
    const filter: any = {}
    if (reportType && reportType !== 'all') {
      filter.reportType = reportType
    }
    
    const filters = await collection.find(filter).sort({ createdAt: -1 }).toArray()
    
    return NextResponse.json({
      success: true,
      data: filters.map((f: any) => ({
        ...f,
        _id: f._id.toString(),
        id: f._id.toString()
      }))
    })
  } catch (error) {
    console.error('Error fetching saved filters:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت فیلترها', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

