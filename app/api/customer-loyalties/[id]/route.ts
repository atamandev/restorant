import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://restorenUser:1234@localhost:27017/restoren'
const DB_NAME = 'restoren'
const COLLECTION_NAME = 'customer_loyalties'

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

// GET - دریافت مشتری وفادار خاص
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const loyaltyId = params.id

    if (!ObjectId.isValid(loyaltyId)) {
      return NextResponse.json(
        { success: false, message: 'شناسه مشتری نامعتبر است' },
        { status: 400 }
      )
    }

    const loyalty = await collection.findOne({ _id: new ObjectId(loyaltyId) })

    if (!loyalty) {
      return NextResponse.json(
        { success: false, message: 'مشتری یافت نشد' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: loyalty
    })
  } catch (error) {
    console.error('Error fetching customer loyalty:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت مشتری وفادار' },
      { status: 500 }
    )
  }
}

// PUT - به‌روزرسانی مشتری وفادار
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const body = await request.json()
    const loyaltyId = params.id

    if (!ObjectId.isValid(loyaltyId)) {
      return NextResponse.json(
        { success: false, message: 'شناسه مشتری نامعتبر است' },
        { status: 400 }
      )
    }

    const updateData = {
      customerId: body.customerId,
      customerName: body.customerName,
      customerPhone: body.customerPhone,
      totalPoints: body.totalPoints || 0,
      currentTier: body.currentTier || 'Bronze',
      pointsEarned: body.pointsEarned || 0,
      pointsRedeemed: body.pointsRedeemed || 0,
      pointsExpired: body.pointsExpired || 0,
      totalOrders: body.totalOrders || 0,
      totalSpent: body.totalSpent || 0,
      lastOrderDate: body.lastOrderDate || '',
      nextTierPoints: body.nextTierPoints || 0,
      status: body.status || 'active',
      updatedAt: new Date().toISOString()
    }

    const result = await collection.updateOne(
      { _id: new ObjectId(loyaltyId) },
      { $set: updateData }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'مشتری یافت نشد' },
        { status: 404 }
      )
    }

    const updatedLoyalty = await collection.findOne({ _id: new ObjectId(loyaltyId) })

    return NextResponse.json({
      success: true,
      data: updatedLoyalty,
      message: 'مشتری با موفقیت به‌روزرسانی شد'
    })
  } catch (error) {
    console.error('Error updating customer loyalty:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در به‌روزرسانی مشتری' },
      { status: 500 }
    )
  }
}

// DELETE - حذف مشتری وفادار
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const loyaltyId = params.id

    if (!ObjectId.isValid(loyaltyId)) {
      return NextResponse.json(
        { success: false, message: 'شناسه مشتری نامعتبر است' },
        { status: 400 }
      )
    }

    const result = await collection.deleteOne({ _id: new ObjectId(loyaltyId) })
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'مشتری یافت نشد' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'مشتری با موفقیت حذف شد'
    })
  } catch (error) {
    console.error('Error deleting customer loyalty:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در حذف مشتری' },
      { status: 500 }
    )
  }
}

