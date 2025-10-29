import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://restorenUser:1234@localhost:27017/restoren'
const DB_NAME = 'restoren'
const COLLECTION_NAME = 'adjustments'

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

// POST - ثبت تعدیل در موجودی و دفتر کل
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase()
    const adjustmentsCollection = db.collection(COLLECTION_NAME)
    const inventoryCollection = db.collection('inventory_items')
    const ledgerCollection = db.collection('item_ledger')
    
    const body = await request.json()
    const { approvedBy } = body

    const adjustment = await adjustmentsCollection.findOne({ _id: new ObjectId(params.id) })
    
    if (!adjustment) {
      return NextResponse.json(
        { success: false, message: 'تعدیل یافت نشد' },
        { status: 404 }
      )
    }

    if (adjustment.status === 'posted') {
      return NextResponse.json(
        { success: false, message: 'این تعدیل قبلاً ثبت شده است' },
        { status: 400 }
      )
    }

    // اعمال تعدیلات به موجودی و ایجاد ورودی دفتر کل
    for (const item of adjustment.items) {
      const itemId = item.itemId
      const quantity = item.quantity
      const unitPrice = item.unitPrice

      // دریافت آیتم موجودی
      const inventoryItem = await inventoryCollection.findOne({ _id: new ObjectId(itemId) })
      
      if (!inventoryItem) {
        console.warn(`Item ${itemId} not found, skipping`)
        continue
      }

      // به‌روزرسانی موجودی
      const newStock = (inventoryItem.currentStock || 0) + quantity
      const newValue = newStock * (inventoryItem.unitPrice || unitPrice)

      await inventoryCollection.updateOne(
        { _id: new ObjectId(itemId) },
        {
          $set: {
            currentStock: newStock,
            totalValue: newValue,
            isLowStock: newStock <= (inventoryItem.minStock || 0),
            lastUpdated: new Date().toISOString(),
            updatedAt: new Date()
          }
        }
      )

      // ایجاد ورودی دفتر کل
      const lastEntry = await ledgerCollection
        .findOne(
          { itemId },
          { sort: { date: -1, createdAt: -1 } }
        )

      const lastBalance = lastEntry?.runningBalance || 0
      const lastValue = lastEntry?.runningValue || 0

      const newBalance = lastBalance + quantity
      const newRunningValue = lastValue + (quantity * unitPrice)
      const averagePrice = newBalance > 0 ? newRunningValue / newBalance : unitPrice

      const docNumber = `ADJ-${adjustment.adjustmentNumber.substring(4)}`

      const ledgerEntry = {
        itemId,
        itemName: item.itemName,
        itemCode: item.itemCode,
        date: new Date().toISOString().split('T')[0],
        documentNumber: docNumber,
        documentType: 'adjustment',
        description: `تعدیل موجودی: ${item.reason}`,
        warehouse: adjustment.warehouse,
        quantityIn: quantity > 0 ? quantity : 0,
        quantityOut: quantity < 0 ? Math.abs(quantity) : 0,
        unitPrice,
        totalValue: quantity * unitPrice,
        runningBalance: newBalance,
        runningValue: newRunningValue,
        averagePrice,
        reference: adjustment.adjustmentNumber,
        notes: `تعدیل از شمارش ${adjustment.countId}`,
        userId: approvedBy || adjustment.createdBy,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      await ledgerCollection.insertOne(ledgerEntry)
    }

    // تغییر وضعیت تعدیل به posted
    await adjustmentsCollection.updateOne(
      { _id: new ObjectId(params.id) },
      {
        $set: {
          status: 'posted',
          postedBy: approvedBy || adjustment.createdBy,
          postedDate: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      }
    )

    const updatedAdjustment = await adjustmentsCollection.findOne({ _id: new ObjectId(params.id) })

    return NextResponse.json({
      success: true,
      data: { ...updatedAdjustment, _id: updatedAdjustment._id.toString(), id: updatedAdjustment._id.toString() },
      message: 'تعدیل با موفقیت ثبت شد و در موجودی اعمال گردید'
    })
  } catch (error) {
    console.error('Error posting adjustment:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در ثبت تعدیل' },
      { status: 500 }
    )
  }
}


