import { NextRequest, NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'

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

// GET - گزارش تحلیلی هشدارهای موجودی
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()
    const stockAlertsCollection = db.collection('stock_alerts')
    const inventoryCollection = db.collection('inventory_items')
    
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30' // روز

    // محاسبه تاریخ شروع
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - parseInt(period))

    // آمار کلی هشدارها
    const alertStats = await stockAlertsCollection.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate.toISOString() }
        }
      },
      {
        $group: {
          _id: null,
          totalAlerts: { $sum: 1 },
          activeAlerts: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
          resolvedAlerts: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
          byType: {
            $push: {
              type: '$type',
              severity: '$severity',
              status: '$status'
            }
          }
        }
      }
    ]).toArray()

    // آمار بر اساس نوع
    const alertsByType = await stockAlertsCollection.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate.toISOString() }
        }
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
          resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]).toArray()

    // آمار بر اساس شدت
    const alertsBySeverity = await stockAlertsCollection.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate.toISOString() },
          status: 'active'
        }
      },
      {
        $group: {
          _id: '$severity',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]).toArray()

    // آیتم‌های با بیشترین هشدار
    const topAlertedItems = await stockAlertsCollection.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate.toISOString() }
        }
      },
      {
        $group: {
          _id: '$itemId',
          itemName: { $first: '$itemName' },
          itemCode: { $first: '$itemCode' },
          alertCount: { $sum: 1 },
          activeAlerts: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } }
        }
      },
      {
        $sort: { alertCount: -1 }
      },
      {
        $limit: 10
      }
    ]).toArray()

    // روند هشدارها در طول زمان
    let alertsTrend = []
    try {
      alertsTrend = await stockAlertsCollection.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate.toISOString() }
          }
        },
        {
          $addFields: {
            dateField: {
              $dateFromString: {
                dateString: '$createdAt',
                onError: new Date()
              }
            }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$dateField'
              }
            },
            count: { $sum: 1 },
            active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
            resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } }
          }
        },
        {
          $sort: { _id: 1 }
        }
      ]).toArray()
    } catch (error) {
      console.error('Error processing alerts trend:', error)
      // اگر مشکل بود، از روش ساده‌تر استفاده کن
      alertsTrend = []
    }

    // آمار انبارها
    const alertsByWarehouse = await stockAlertsCollection.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate.toISOString() }
        }
      },
      {
        $group: {
          _id: '$warehouse',
          count: { $sum: 1 },
          active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]).toArray()

    // آمار موجودی کلی (بر اساس داده‌های واقعی)
    const inventoryStats = await inventoryCollection.aggregate([
      {
        $group: {
          _id: null,
          totalItems: { $sum: 1 },
          lowStockItems: { 
            $sum: { 
              $cond: [
                { 
                  $or: [
                    { $lte: ['$currentStock', { $ifNull: ['$minStock', 0] }] },
                    { $expr: { $lte: ['$currentStock', '$minStock'] } }
                  ]
                }, 
                1, 
                0
              ] 
            } 
          },
          outOfStockItems: { 
            $sum: { 
              $cond: [
                { 
                  $or: [
                    { $eq: ['$currentStock', 0] },
                    { $eq: [{ $ifNull: ['$currentStock', 0] }, 0] }
                  ]
                }, 
                1, 
                0
              ] 
            } 
          },
          totalValue: { 
            $sum: { 
              $ifNull: ['$totalValue', { $multiply: [{ $ifNull: ['$currentStock', 0] }, { $ifNull: ['$unitPrice', 0] }] }]
            } 
          }
        }
      }
    ]).toArray()

    return NextResponse.json({
      success: true,
      data: {
        summary: alertStats[0] || {
          totalAlerts: 0,
          activeAlerts: 0,
          resolvedAlerts: 0
        },
        alertsByType,
        alertsBySeverity,
        topAlertedItems,
        alertsTrend,
        alertsByWarehouse,
        inventoryStats: inventoryStats[0] || {
          totalItems: 0,
          lowStockItems: 0,
          outOfStockItems: 0,
          totalValue: 0
        },
        period: parseInt(period),
        generatedAt: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Error generating analytical report:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در تولید گزارش تحلیلی' },
      { status: 500 }
    )
  }
}
