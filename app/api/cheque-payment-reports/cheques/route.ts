import { NextRequest, NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://restorenUser:1234@localhost:27017/restoren'
const DB_NAME = 'restoren'
const COLLECTION_NAME = 'cheques'

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

// GET - گزارش چک‌ها (وضعیت و سررسید)
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'
    const bankName = searchParams.get('bankName') || 'all'
    const fromDate = searchParams.get('fromDate')
    const toDate = searchParams.get('toDate')
    const dueFromDate = searchParams.get('dueFromDate')
    const dueToDate = searchParams.get('dueToDate')

    // ساخت فیلتر
    const filter: any = {}
    if (status && status !== 'all') filter.status = status
    if (bankName && bankName !== 'all') filter.bankName = bankName
    
    // فیلتر تاریخ صدور
    if (fromDate || toDate) {
      filter.issueDate = {}
      if (fromDate) filter.issueDate.$gte = new Date(fromDate)
      if (toDate) filter.issueDate.$lte = new Date(toDate)
    }
    
    // فیلتر تاریخ سررسید
    if (dueFromDate || dueToDate) {
      filter.dueDate = {}
      if (dueFromDate) filter.dueDate.$gte = new Date(dueFromDate)
      if (dueToDate) filter.dueDate.$lte = new Date(dueToDate)
    }

    const cheques = await collection.find(filter).sort({ dueDate: 1 }).toArray()
    
    // محاسبه آمار
    const now = new Date()
    const chequesWithStats = cheques.map((cheque: any) => {
      const dueDate = new Date(cheque.dueDate)
      const daysDiff = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      const isOverdue = dueDate < now && cheque.status !== 'cleared'
      
      return {
        ...cheque,
        _id: cheque._id.toString(),
        id: cheque._id.toString(),
        daysToDue: daysDiff,
        isOverdue
      }
    })

    // آمار کلی
    const stats = await collection.aggregate([
      {
        $facet: {
          statusCounts: [
            {
              $group: {
                _id: '$status',
                count: { $sum: 1 },
                totalAmount: { $sum: '$amount' }
              }
            }
          ],
          overdueCheques: [
            {
              $match: {
                dueDate: { $lt: now },
                status: { $ne: 'cleared' }
              }
            },
            {
              $group: {
                _id: null,
                count: { $sum: 1 },
                totalAmount: { $sum: '$amount' }
              }
            }
          ],
          dueThisWeek: [
            {
              $match: {
                dueDate: {
                  $gte: now,
                  $lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
                }
              }
            },
            {
              $group: {
                _id: null,
                count: { $sum: 1 },
                totalAmount: { $sum: '$amount' }
              }
            }
          ],
          dueThisMonth: [
            {
              $match: {
                dueDate: {
                  $gte: now,
                  $lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
                }
              }
            },
            {
              $group: {
                _id: null,
                count: { $sum: 1 },
                totalAmount: { $sum: '$amount' }
              }
            }
          ]
        }
      }
    ]).toArray()

    return NextResponse.json({
      success: true,
      data: chequesWithStats,
      stats: {
        totalCheques: cheques.length,
        totalAmount: cheques.reduce((sum: number, c: any) => sum + (c.amount || 0), 0),
        overdueCheques: stats[0]?.overdueCheques[0]?.count || 0,
        overdueAmount: stats[0]?.overdueCheques[0]?.totalAmount || 0,
        dueThisWeek: stats[0]?.dueThisWeek[0]?.count || 0,
        dueThisWeekAmount: stats[0]?.dueThisWeek[0]?.totalAmount || 0,
        dueThisMonth: stats[0]?.dueThisMonth[0]?.count || 0,
        dueThisMonthAmount: stats[0]?.dueThisMonth[0]?.totalAmount || 0,
        statusBreakdown: stats[0]?.statusCounts || []
      }
    })
  } catch (error) {
    console.error('Error generating cheque report:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در تولید گزارش چک‌ها', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

