import { NextRequest, NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://admin:StrongPassword123@185.204.169.107:27017/restaurant?authSource=admin'
const DB_NAME = 'restaurant'

let client: MongoClient | null = null
let db: any

async function connectToDatabase() {
  try {
    if (!client) {
      client = new MongoClient(MONGO_URI)
      await client.connect()
      db = client.db(DB_NAME)
    }
    return db
  } catch (error) {
    console.error('Database connection error:', error)
    throw error
  }
}

// GET - دریافت تحلیل گردش موجودی
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()
    const ledgerCollection = db.collection('item_ledger')
    const transfersCollection = db.collection('transfers')
    const adjustmentsCollection = db.collection('adjustments')
    
    const { searchParams } = new URL(request.url)
    const warehouse = searchParams.get('warehouse')
    const days = parseInt(searchParams.get('days') || '30')
    
    // محاسبه تاریخ شروع
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const dateQuery: any = {
      date: {
        $gte: startDate.toISOString().split('T')[0],
        $lte: endDate.toISOString().split('T')[0]
      }
    }
    if (warehouse && warehouse !== 'all') {
      dateQuery.warehouse = warehouse
    }

    // دریافت ورودی‌ها و خروجی‌ها از ledger
    const ledgerEntries = await ledgerCollection.find(dateQuery).toArray()
    
    // گروه‌بندی روزانه
    const dailyData: any = {}
    
    ledgerEntries.forEach((entry: any) => {
      const date = entry.date
      if (!dailyData[date]) {
        dailyData[date] = {
          date,
          receipts: 0,
          issues: 0,
          transfers: 0,
          adjustments: 0,
          netMovement: 0
        }
      }
      if (entry.quantityIn > 0) {
        dailyData[date].receipts += entry.quantityIn * (entry.unitPrice || 0)
      }
      if (entry.quantityOut > 0) {
        dailyData[date].issues += entry.quantityOut * (entry.unitPrice || 0)
      }
    })

    // دریافت انتقالات
    const transferQuery: any = {
      createdAt: {
        $gte: startDate.toISOString(),
        $lte: endDate.toISOString()
      }
    }
    if (warehouse && warehouse !== 'all') {
      transferQuery.$or = [
        { fromWarehouse: warehouse },
        { toWarehouse: warehouse }
      ]
    }
    const transfers = await transfersCollection.find(transferQuery).toArray()
    
    transfers.forEach((t: any) => {
      const date = t.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0]
      if (!dailyData[date]) {
        dailyData[date] = {
          date,
          receipts: 0,
          issues: 0,
          transfers: 0,
          adjustments: 0,
          netMovement: 0
        }
      }
      dailyData[date].transfers += t.totalValue || 0
    })

    // دریافت تعدیلات
    const adjustmentQuery: any = {
      createdDate: {
        $gte: startDate.toISOString(),
        $lte: endDate.toISOString()
      }
    }
    if (warehouse && warehouse !== 'all') {
      adjustmentQuery.warehouse = warehouse
    }
    const adjustments = await adjustmentsCollection.find(adjustmentQuery).toArray()
    
    adjustments.forEach((a: any) => {
      const date = a.createdDate?.split('T')[0] || new Date().toISOString().split('T')[0]
      if (!dailyData[date]) {
        dailyData[date] = {
          date,
          receipts: 0,
          issues: 0,
          transfers: 0,
          adjustments: 0,
          netMovement: 0
        }
      }
      dailyData[date].adjustments += a.totalValue || 0
    })

    // محاسبه netMovement
    Object.keys(dailyData).forEach(date => {
      const data = dailyData[date]
      data.netMovement = data.receipts - data.issues + data.transfers + data.adjustments
    })

    // تبدیل به آرایه و مرتب‌سازی بر اساس تاریخ
    const data = Object.values(dailyData).sort((a: any, b: any) => a.date.localeCompare(b.date))

    return NextResponse.json({
      success: true,
      data
    })
  } catch (error) {
    console.error('Error fetching movement analytics:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت تحلیل گردش موجودی' },
      { status: 500 }
    )
  }
}

