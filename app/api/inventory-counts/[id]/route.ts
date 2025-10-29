import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://restorenUser:1234@localhost:27017/restoren'
const DB_NAME = 'restoren'
const COLLECTION_NAME = 'inventory_counts'

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

// GET - دریافت شمارش خاص
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    const countItemsCollection = db.collection('count_items')
    
    const count = await collection.findOne({ _id: new ObjectId(params.id) })
    
    if (!count) {
      return NextResponse.json(
        { success: false, message: 'شمارش یافت نشد' },
        { status: 404 }
      )
    }

    // دریافت آیتم‌های شمارش
    const items = await countItemsCollection.find({ countId: params.id }).toArray()

    // محاسبه آمار
    const countedItems = items.filter((item: any) => item.countedQuantity !== null && item.countedQuantity !== undefined).length
    const discrepancies = items.filter((item: any) => {
      const disc = item.countedQuantity - item.systemQuantity
      return disc !== 0
    }).length
    
    const discrepancyValue = items.reduce((sum: number, item: any) => {
      const disc = (item.countedQuantity || 0) - (item.systemQuantity || 0)
      return sum + (disc * (item.unitPrice || 0))
    }, 0)

    return NextResponse.json({
      success: true,
      data: {
        ...count,
        _id: count._id.toString(),
        id: count._id.toString(),
        items,
        countedItems,
        discrepancies,
        discrepancyValue: Math.abs(discrepancyValue)
      }
    })
  } catch (error) {
    console.error('Error fetching inventory count:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت شمارش' },
      { status: 500 }
    )
  }
}

// PUT - به‌روزرسانی شمارش خاص
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const body = await request.json()
    
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
        { success: false, message: 'شمارش یافت نشد' },
        { status: 404 }
      )
    }

    const updatedCount = await collection.findOne({ _id: new ObjectId(params.id) })

    return NextResponse.json({
      success: true,
      data: { ...updatedCount, _id: updatedCount._id.toString(), id: updatedCount._id.toString() },
      message: 'شمارش با موفقیت به‌روزرسانی شد'
    })
  } catch (error) {
    console.error('Error updating inventory count:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در به‌روزرسانی شمارش' },
      { status: 500 }
    )
  }
}

// DELETE - حذف شمارش خاص
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    const countItemsCollection = db.collection('count_items')
    
    // حذف آیتم‌های شمارش
    await countItemsCollection.deleteMany({ countId: params.id })

    const result = await collection.deleteOne({ _id: new ObjectId(params.id) })
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'شمارش یافت نشد' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'شمارش با موفقیت حذف شد'
    })
  } catch (error) {
    console.error('Error deleting inventory count:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در حذف شمارش' },
      { status: 500 }
    )
  }
}


