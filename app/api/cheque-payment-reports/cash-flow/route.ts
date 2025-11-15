import { NextRequest, NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://admin:StrongPassword123@185.204.169.107:27017/restaurant?authSource=admin'
const DB_NAME = 'restaurant'
const RECEIPTS_PAYMENTS_COLLECTION = 'receipts_payments'
const CHEQUES_COLLECTION = 'cheques'

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

// GET - گزارش جریان نقدی (پیش‌بینی نقدینگی)
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()
    const receiptsPaymentsCollection = db.collection(RECEIPTS_PAYMENTS_COLLECTION)
    const chequesCollection = db.collection(CHEQUES_COLLECTION)
    
    const { searchParams } = new URL(request.url)
    const fromDate = searchParams.get('fromDate')
    const toDate = searchParams.get('toDate')
    const days = parseInt(searchParams.get('days') || '30')

    const now = new Date()
    const startDate = fromDate ? new Date(fromDate) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const endDate = toDate ? new Date(toDate) : new Date(now.getTime() + days * 24 * 60 * 60 * 1000)

    // دریافت تراکنش‌های گذشته
    const pastTransactions = await receiptsPaymentsCollection.find({
      date: {
        $gte: startDate,
        $lte: now
      },
      status: 'completed'
    }).sort({ date: 1 }).toArray()

    // دریافت چک‌های آینده
    const futureCheques = await chequesCollection.find({
      dueDate: {
        $gte: now,
        $lte: endDate
      }
    }).sort({ dueDate: 1 }).toArray()

    // تحلیل جریان نقدی روزانه از تراکنش‌های گذشته
    const dailyCashFlow = await receiptsPaymentsCollection.aggregate([
      {
        $match: {
          date: {
            $gte: startDate,
            $lte: now
          },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$date' }
          },
          cashIn: { $sum: { $cond: [{ $eq: ['$type', 'receipt'] }, '$amount', 0] } },
          cashOut: { $sum: { $cond: [{ $eq: ['$type', 'payment'] }, '$amount', 0] } }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]).toArray()

    // تحلیل چک‌های آینده
    const futureChequesByDate = await chequesCollection.aggregate([
      {
        $match: {
          dueDate: {
            $gte: now,
            $lte: endDate
          }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$dueDate' }
          },
          receivedCheques: {
            $sum: { $cond: [{ $eq: ['$chequeType', 'received'] }, '$amount', 0] }
          },
          paidCheques: {
            $sum: { $cond: [{ $eq: ['$chequeType', 'paid'] }, '$amount', 0] }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]).toArray()

    // ساخت جریان نقدی روزانه
    const cashFlowData: any[] = []
    const currentDate = new Date(startDate)
    let runningBalance = 0

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0]
      
      // تراکنش‌های این روز (گذشته)
      const dayTransaction = dailyCashFlow.find((d: any) => d._id === dateStr)
      
      // چک‌های سررسید این روز (آینده)
      const dayCheques = futureChequesByDate.find((d: any) => d._id === dateStr)
      
      const cashIn = (dayTransaction?.cashIn || 0) + (dayCheques?.receivedCheques || 0)
      const cashOut = (dayTransaction?.cashOut || 0) + (dayCheques?.paidCheques || 0)
      const netFlow = cashIn - cashOut
      
      runningBalance += netFlow
      
      cashFlowData.push({
        date: dateStr,
        cashIn,
        cashOut,
        netFlow,
        balance: runningBalance,
        isFuture: currentDate > now
      })
      
      currentDate.setDate(currentDate.getDate() + 1)
    }

    // محاسبه آمار
    const totalCashIn = cashFlowData.reduce((sum, d) => sum + d.cashIn, 0)
    const totalCashOut = cashFlowData.reduce((sum, d) => sum + d.cashOut, 0)
    const netCashFlow = totalCashIn - totalCashOut
    const currentBalance = cashFlowData[cashFlowData.length - 1]?.balance || 0

    // پیش‌بینی نقدینگی
    const forecast = {
      minimumBalance: Math.min(...cashFlowData.map(d => d.balance)),
      maximumBalance: Math.max(...cashFlowData.map(d => d.balance)),
      averageDailyFlow: netCashFlow / cashFlowData.length,
      riskDays: cashFlowData.filter(d => d.balance < 0).length,
      upcomingCheques: futureCheques.length,
      upcomingChequesAmount: futureCheques.reduce((sum, c) => sum + (c.amount || 0), 0)
    }

    return NextResponse.json({
      success: true,
      data: cashFlowData,
      summary: {
        totalCashIn,
        totalCashOut,
        netCashFlow,
        currentBalance
      },
      forecast
    })
  } catch (error) {
    console.error('Error generating cash flow report:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در تولید گزارش جریان نقدی', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

