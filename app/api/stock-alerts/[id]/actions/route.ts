import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://restorenUser:1234@localhost:27017/restoren'
const DB_NAME = 'restoren'

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

// POST - ثبت اقدام برای هشدار
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = await connectToDatabase()
    const stockAlertsCollection = db.collection('stock_alerts')
    
    const body = await request.json()
    const {
      actionType, // 'purchase_order', 'transfer', 'adjustment', 'other'
      description,
      performedBy = 'سیستم',
      metadata = {}
    } = body
    
    if (!actionType || !description) {
      return NextResponse.json(
        { success: false, message: 'نوع اقدام و توضیحات اجباری است' },
        { status: 400 }
      )
    }
    
    const alert = await stockAlertsCollection.findOne({ _id: new ObjectId(params.id) })
    
    if (!alert) {
      return NextResponse.json(
        { success: false, message: 'هشدار یافت نشد' },
        { status: 404 }
      )
    }
    
    const action = {
      actionType,
      description,
      performedBy,
      metadata,
      performedAt: new Date().toISOString()
    }
    
    // افزودن اقدام به آرایه actions
    await stockAlertsCollection.updateOne(
      { _id: alert._id },
      {
        $push: { actions: action },
        $set: { updatedAt: new Date().toISOString() }
      }
    )
    
    return NextResponse.json({
      success: true,
      message: 'اقدام با موفقیت ثبت شد',
      data: action
    })
  } catch (error) {
    console.error('Error adding action to alert:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در ثبت اقدام' },
      { status: 500 }
    )
  }
}

// GET - دریافت اقدامات یک هشدار
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = await connectToDatabase()
    const stockAlertsCollection = db.collection('stock_alerts')
    
    const alert = await stockAlertsCollection.findOne({ _id: new ObjectId(params.id) })
    
    if (!alert) {
      return NextResponse.json(
        { success: false, message: 'هشدار یافت نشد' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: alert.actions || []
    })
  } catch (error) {
    console.error('Error fetching alert actions:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت اقدامات' },
      { status: 500 }
    )
  }
}

