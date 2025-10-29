import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://restorenUser:1234@localhost:27017/restoren'
const DB_NAME = 'restoren'
const COLLECTION_NAME = 'transfers'

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

// GET - دریافت انتقال خاص
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const transfer = await collection.findOne({ _id: new ObjectId(params.id) })
    
    if (!transfer) {
      return NextResponse.json(
        { success: false, message: 'انتقال یافت نشد' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: transfer
    })
  } catch (error) {
    console.error('Error fetching transfer:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت انتقال' },
      { status: 500 }
    )
  }
}

// PUT - به‌روزرسانی انتقال خاص
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const body = await request.json()
    
    // محاسبه مجدد ارزش کل اگر آیتم‌ها تغییر کرده باشند
    if (body.items) {
      body.totalItems = body.items.length
      body.totalValue = body.items.reduce((sum: number, item: any) => 
        sum + (item.quantity * item.unitPrice), 0)
    }

    const result = await collection.updateOne(
      { _id: new ObjectId(params.id) },
      { 
        $set: {
          ...body,
          updatedAt: new Date().toISOString()
        }
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'انتقال یافت نشد' },
        { status: 404 }
      )
    }

    const updatedTransfer = await collection.findOne({ _id: new ObjectId(params.id) })

    return NextResponse.json({
      success: true,
      data: updatedTransfer,
      message: 'انتقال با موفقیت به‌روزرسانی شد'
    })
  } catch (error) {
    console.error('Error updating transfer:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در به‌روزرسانی انتقال' },
      { status: 500 }
    )
  }
}

// DELETE - حذف انتقال خاص
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    // بررسی وضعیت انتقال
    const transfer = await collection.findOne({ _id: new ObjectId(params.id) })
    if (transfer && transfer.status === 'completed') {
      return NextResponse.json(
        { 
          success: false, 
          message: 'امکان حذف انتقال تکمیل شده وجود ندارد' 
        },
        { status: 400 }
      )
    }

    const result = await collection.deleteOne({ _id: new ObjectId(params.id) })
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'انتقال یافت نشد' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'انتقال با موفقیت حذف شد'
    })
  } catch (error) {
    console.error('Error deleting transfer:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در حذف انتقال' },
      { status: 500 }
    )
  }
}
