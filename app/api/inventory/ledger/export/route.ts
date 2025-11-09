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

// GET - خروجی Excel یا PDF کاردکس
export async function GET(request: NextRequest) {
  try {
    const db = await connectToDatabase()
    const movementCollection = db.collection('stock_movements')
    const balanceCollection = db.collection('inventory_balance')
    const inventoryItemsCollection = db.collection('inventory_items')
    
    const { searchParams } = new URL(request.url)
    const itemId = searchParams.get('itemId')
    const warehouseName = searchParams.get('warehouseName')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const format = searchParams.get('format') || 'excel'
    
    if (!itemId) {
      return NextResponse.json(
        { success: false, message: 'itemId اجباری است' },
        { status: 400 }
      )
    }
    
    // دریافت اطلاعات کالا
    const item = await inventoryItemsCollection.findOne({ _id: new ObjectId(itemId) })
    if (!item) {
      return NextResponse.json(
        { success: false, message: 'کالا یافت نشد' },
        { status: 404 }
      )
    }
    
    const filter: any = {
      itemId: new ObjectId(itemId)
    }
    
    if (warehouseName && warehouseName !== 'all') {
      filter.warehouseName = warehouseName
    }
    
    if (dateFrom || dateTo) {
      filter.createdAt = {}
      if (dateFrom) {
        filter.createdAt.$gte = new Date(dateFrom).toISOString()
      }
      if (dateTo) {
        const endDate = new Date(dateTo)
        endDate.setHours(23, 59, 59, 999)
        filter.createdAt.$lte = endDate.toISOString()
      }
    }
    
    // دریافت حرکات
    const movements = await movementCollection
      .find(filter)
      .sort({ createdAt: 1 })
      .toArray()
    
    // محاسبه موجودی ابتدا
    const allMovements = await movementCollection
      .find({
        itemId: new ObjectId(itemId),
        ...(warehouseName && warehouseName !== 'all' ? { warehouseName } : {})
      })
      .sort({ createdAt: 1 })
      .toArray()
    
    let initialBalance = 0
    let initialValue = 0
    if (dateFrom) {
      const startDate = new Date(dateFrom)
      for (const movement of allMovements) {
        const movementDate = new Date(movement.createdAt)
        if (movementDate < startDate) {
          initialBalance += movement.quantity || 0
          initialValue += movement.totalValue || 0
        } else {
          break
        }
      }
    }
    
    // محاسبه running balance
    let runningBalance = initialBalance
    let runningValue = initialValue
    
    let totalIn = 0
    let totalOut = 0
    let totalInValue = 0
    let totalOutValue = 0
    
    const ledgerData = movements.map((movement: any) => {
      const quantity = movement.quantity || 0
      const totalValue = movement.totalValue || 0
      
      runningBalance += quantity
      runningValue += totalValue
      
      if (quantity > 0) {
        totalIn += quantity
        totalInValue += totalValue
      } else {
        totalOut += Math.abs(quantity)
        totalOutValue += Math.abs(totalValue)
      }
      
      return {
        تاریخ: new Date(movement.createdAt).toLocaleString('fa-IR'),
        'نوع حرکت': movement.movementType,
        'شماره سند': movement.documentNumber || '',
        مرجع: movement.orderNumber || movement.referenceId?.toString() || '',
        انبار: movement.warehouseName || '',
        ورودی: quantity > 0 ? quantity : 0,
        خروجی: quantity < 0 ? Math.abs(quantity) : 0,
        'موجودی مانده': runningBalance,
        'قیمت واحد': movement.unitPrice || 0,
        'ارزش حرکت': totalValue,
        'ارزش مانده': runningValue,
        'Lot Number': movement.lotNumber || '',
        'تاریخ انقضا': movement.expirationDate ? new Date(movement.expirationDate).toLocaleDateString('fa-IR') : '',
        توضیحات: movement.description || ''
      }
    })
    
    // برای Excel: برگرداندن JSON (در سمت کلاینت به Excel تبدیل می‌شود)
    if (format === 'excel') {
      return NextResponse.json({
        success: true,
        data: {
          item: {
            name: item.name,
            code: item.code || '',
            unit: item.unit || ''
          },
          summary: {
            initialBalance,
            initialValue,
            totalIn,
            totalInValue,
            totalOut,
            totalOutValue,
            endingBalance: runningBalance,
            endingValue: runningValue,
            costOfGoodsSold: totalOutValue
          },
          entries: ledgerData
        }
      })
    }
    
    // برای PDF: در آینده می‌توان از کتابخانه PDF استفاده کرد
    return NextResponse.json({
      success: false,
      message: 'خروجی PDF در حال توسعه است'
    }, { status: 501 })
  } catch (error) {
    console.error('Error exporting ledger:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در خروجی گرفتن کاردکس' },
      { status: 500 }
    )
  }
}

