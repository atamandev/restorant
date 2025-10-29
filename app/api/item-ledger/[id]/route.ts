import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://restorenUser:1234@localhost:27017/restoren'
const DB_NAME = 'restoren'
const COLLECTION_NAME = 'item_ledger'

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

// GET - دریافت ورودی خاص
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const entry = await collection.findOne({ _id: new ObjectId(params.id) })
    
    if (!entry) {
      return NextResponse.json(
        { success: false, message: 'ورودی یافت نشد' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: entry
    })
  } catch (error) {
    console.error('Error fetching ledger entry:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت ورودی' },
      { status: 500 }
    )
  }
}

// PUT - به‌روزرسانی ورودی خاص
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase()
    const ledgerCollection = db.collection(COLLECTION_NAME)
    const inventoryCollection = db.collection('inventory_items')
    
    const body = await request.json()
    
    const entry = await ledgerCollection.findOne({ _id: new ObjectId(params.id) })
    if (!entry) {
      return NextResponse.json(
        { success: false, message: 'ورودی یافت نشد' },
        { status: 404 }
      )
    }

    const result = await ledgerCollection.updateOne(
      { _id: new ObjectId(params.id) },
      {
        $set: {
          ...body,
          updatedAt: new Date().toISOString()
        }
      }
    )

    // محاسبه مجدد مانده‌ها
    const { recalculateBalances } = await import('../route')
    await recalculateBalances(entry.itemId, ledgerCollection, inventoryCollection)

    const updatedEntry = await ledgerCollection.findOne({ _id: new ObjectId(params.id) })

    return NextResponse.json({
      success: true,
      data: updatedEntry,
      message: 'ورودی با موفقیت به‌روزرسانی شد'
    })
  } catch (error) {
    console.error('Error updating ledger entry:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در به‌روزرسانی ورودی' },
      { status: 500 }
    )
  }
}

// DELETE - حذف ورودی خاص
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase()
    const ledgerCollection = db.collection(COLLECTION_NAME)
    const inventoryCollection = db.collection('inventory_items')
    
    const entry = await ledgerCollection.findOne({ _id: new ObjectId(params.id) })
    if (!entry) {
      return NextResponse.json(
        { success: false, message: 'ورودی یافت نشد' },
        { status: 404 }
      )
    }

    const itemId = entry.itemId
    await ledgerCollection.deleteOne({ _id: new ObjectId(params.id) })

    // محاسبه مجدد مانده‌ها
    const { recalculateBalances: recalcBalances } = await import('../route')
    await recalcBalances(itemId, ledgerCollection, inventoryCollection)

    return NextResponse.json({
      success: true,
      message: 'ورودی با موفقیت حذف شد'
    })
  } catch (error) {
    console.error('Error deleting ledger entry:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در حذف ورودی' },
      { status: 500 }
    )
  }
}

