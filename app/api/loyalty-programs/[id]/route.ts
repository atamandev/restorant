import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://admin:StrongPassword123@185.204.169.107:27017/restaurant?authSource=admin'
const DB_NAME = 'restaurant'
const COLLECTION_NAME = 'loyalty_programs'

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

// GET - دریافت برنامه وفاداری خاص
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const programId = params.id

    if (!ObjectId.isValid(programId)) {
      return NextResponse.json(
        { success: false, message: 'شناسه برنامه نامعتبر است' },
        { status: 400 }
      )
    }

    const program = await collection.findOne({ _id: new ObjectId(programId) })

    if (!program) {
      return NextResponse.json(
        { success: false, message: 'برنامه یافت نشد' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: program
    })
  } catch (error) {
    console.error('Error fetching loyalty program:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت برنامه وفاداری' },
      { status: 500 }
    )
  }
}

// PUT - به‌روزرسانی برنامه وفاداری
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const body = await request.json()
    const programId = params.id

    if (!ObjectId.isValid(programId)) {
      return NextResponse.json(
        { success: false, message: 'شناسه برنامه نامعتبر است' },
        { status: 400 }
      )
    }

    const updateData = {
      name: body.name,
      description: body.description,
      type: body.type,
      status: body.status,
      rules: {
        pointsPerRial: body.rules?.pointsPerRial || 1,
        minOrderAmount: body.rules?.minOrderAmount || 100000,
        maxPointsPerOrder: body.rules?.maxPointsPerOrder || 1000,
        expiryDays: body.rules?.expiryDays || 365
      },
      rewards: body.rewards || [],
      tiers: body.tiers || [],
      updatedAt: new Date().toISOString()
    }

    const result = await collection.updateOne(
      { _id: new ObjectId(programId) },
      { $set: updateData }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'برنامه یافت نشد' },
        { status: 404 }
      )
    }

    const updatedProgram = await collection.findOne({ _id: new ObjectId(programId) })

    return NextResponse.json({
      success: true,
      data: updatedProgram,
      message: 'برنامه با موفقیت به‌روزرسانی شد'
    })
  } catch (error) {
    console.error('Error updating loyalty program:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در به‌روزرسانی برنامه' },
      { status: 500 }
    )
  }
}

// DELETE - حذف برنامه وفاداری
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const programId = params.id

    if (!ObjectId.isValid(programId)) {
      return NextResponse.json(
        { success: false, message: 'شناسه برنامه نامعتبر است' },
        { status: 400 }
      )
    }

    const result = await collection.deleteOne({ _id: new ObjectId(programId) })
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'برنامه یافت نشد' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'برنامه با موفقیت حذف شد'
    })
  } catch (error) {
    console.error('Error deleting loyalty program:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در حذف برنامه' },
      { status: 500 }
    )
  }
}

