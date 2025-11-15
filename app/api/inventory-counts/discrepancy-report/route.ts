import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://admin:StrongPassword123@185.204.169.107:27017/restaurant?authSource=admin'
const DB_NAME = 'restaurant'

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

// GET - گزارش مغایرت به تفکیک دسته‌بندی/بخش/شمارنده
export async function GET(request: NextRequest) {
  try {
    const db = await connectToDatabase()
    const countsCollection = db.collection('inventory_counts')
    const countItemsCollection = db.collection('count_items')
    
    const { searchParams } = new URL(request.url)
    const countId = searchParams.get('countId')
    const category = searchParams.get('category')
    const section = searchParams.get('section')
    const warehouse = searchParams.get('warehouse')
    const groupBy = searchParams.get('groupBy') || 'category' // category, section, warehouse, countedBy
    
    // دریافت آیتم‌های شمارش با مغایرت
    const filter: any = {}
    if (countId) {
      filter.countId = countId
    }
    
    const allItems = await countItemsCollection.find(filter).toArray()
    
    // فیلتر آیتم‌ها: فقط آیتم‌هایی که در inventory_balance موجود هستند
    const balanceCollection = db.collection('inventory_balance')
    const validItems = []
    
    for (const item of allItems) {
      const balance = await balanceCollection.findOne({
        itemId: new ObjectId(item.itemId),
        warehouseName: item.warehouse
      })
      
      // اگر balance وجود دارد یا آیتم قبلاً شمارش شده (برای حفظ تاریخچه)
      if (balance || (item.countedQuantity !== null && item.countedQuantity !== undefined)) {
        validItems.push(item)
      }
    }
    
    // فیلتر مغایرت‌ها
    let discrepancies = validItems.filter((item: any) => {
      const disc = (item.countedQuantity || 0) - (item.systemQuantityAtFinalization || item.systemQuantity || 0)
      return disc !== 0
    })
    
    // اعمال فیلترها
    if (category && category !== 'all') {
      discrepancies = discrepancies.filter((item: any) => item.category === category)
    }
    
    if (section && section !== 'all') {
      // اگر countId داده شده، از count.section استفاده کن
      if (countId) {
        const count = await countsCollection.findOne({ _id: new ObjectId(countId) })
        if (count && count.section !== section) {
          discrepancies = []
        }
      }
    }
    
    if (warehouse && warehouse !== 'all') {
      discrepancies = discrepancies.filter((item: any) => item.warehouse === warehouse)
    }
    
    // گروه‌بندی
    const grouped: any = {}
    
    for (const item of discrepancies) {
      let key = ''
      
      switch (groupBy) {
        case 'category':
          key = item.category || 'بدون دسته‌بندی'
          break
        case 'section':
          key = 'همه' // در آینده می‌توان از count.section استفاده کرد
          break
        case 'warehouse':
          key = item.warehouse || 'بدون انبار'
          break
        case 'countedBy':
          key = item.countedBy || 'بدون شمارنده'
          break
        default:
          key = item.category || 'بدون دسته‌بندی'
      }
      
      if (!grouped[key]) {
        grouped[key] = {
          key,
          items: [],
          totalDiscrepancy: 0,
          totalDiscrepancyValue: 0,
          positiveDiscrepancies: 0, // اضافی
          negativeDiscrepancies: 0 // کسری
        }
      }
      
      const disc = (item.countedQuantity || 0) - (item.systemQuantityAtFinalization || item.systemQuantity || 0)
      const discValue = disc * (item.unitPrice || 0)
      
      grouped[key].items.push({
        ...item,
        discrepancy: disc,
        discrepancyValue: discValue
      })
      
      grouped[key].totalDiscrepancy += disc
      grouped[key].totalDiscrepancyValue += Math.abs(discValue)
      
      if (disc > 0) {
        grouped[key].positiveDiscrepancies++
      } else {
        grouped[key].negativeDiscrepancies++
      }
    }
    
    // تبدیل به آرایه
    const report = Object.values(grouped).map((group: any) => ({
      ...group,
      itemsCount: group.items.length
    }))
    
    // محاسبه آمار کلی
    const totalDiscrepancies = discrepancies.length
    const totalDiscrepancyValue = discrepancies.reduce((sum: number, item: any) => {
      const disc = (item.countedQuantity || 0) - (item.systemQuantityAtFinalization || item.systemQuantity || 0)
      return sum + Math.abs(disc * (item.unitPrice || 0))
    }, 0)
    
    const positiveCount = discrepancies.filter((item: any) => {
      const disc = (item.countedQuantity || 0) - (item.systemQuantityAtFinalization || item.systemQuantity || 0)
      return disc > 0
    }).length
    
    const negativeCount = discrepancies.filter((item: any) => {
      const disc = (item.countedQuantity || 0) - (item.systemQuantityAtFinalization || item.systemQuantity || 0)
      return disc < 0
    }).length
    
    return NextResponse.json({
      success: true,
      data: {
        report,
        summary: {
          totalDiscrepancies,
          totalDiscrepancyValue,
          positiveCount,
          negativeCount,
          groupBy
        },
        filters: {
          countId: countId || null,
          category: category || null,
          section: section || null,
          warehouse: warehouse || null
        }
      }
    })
  } catch (error) {
    console.error('Error generating discrepancy report:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در تولید گزارش مغایرت', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

