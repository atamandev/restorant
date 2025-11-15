import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://admin:StrongPassword123@185.204.169.107:27017/restaurant?authSource=admin'
const DB_NAME = 'restaurant'
const COLLECTION_NAME = 'audit_logs'

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

// GET - دریافت لاگ خاص
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase()
    const auditCollection = db.collection(COLLECTION_NAME)
    
    const log = await auditCollection.findOne({ _id: new ObjectId(params.id) })
    
    if (!log) {
      return NextResponse.json(
        { success: false, message: 'لاگ یافت نشد' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: { ...log, id: log._id.toString(), _id: log._id.toString() }
    })
  } catch (error) {
    console.error('Error fetching audit log:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت لاگ' },
      { status: 500 }
    )
  }
}

// PUT - به‌روزرسانی لاگ (معمولاً فقط برای فیلدهای غیرحساس)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase()
    const body = await request.json()
    const auditCollection = db.collection(COLLECTION_NAME)
    
    const allowedFields = ['details', 'location', 'status']
    const updateData: any = { updatedAt: new Date() }
    
    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    })
    
    const result = await auditCollection.updateOne(
      { _id: new ObjectId(params.id) },
      { $set: updateData }
    )
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'لاگ یافت نشد' },
        { status: 404 }
      )
    }
    
    const updated = await auditCollection.findOne({ _id: new ObjectId(params.id) })
    
    return NextResponse.json({
      success: true,
      data: { ...updated, id: updated._id.toString(), _id: updated._id.toString() },
      message: 'لاگ با موفقیت به‌روزرسانی شد'
    })
  } catch (error) {
    console.error('Error updating audit log:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در به‌روزرسانی لاگ' },
      { status: 500 }
    )
  }
}

