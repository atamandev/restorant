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

// POST - تنظیم حداقل موجودی برای آیتم‌ها
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()
    const inventoryCollection = db.collection('inventory_items')
    const stockAlertsCollection = db.collection('stock_alerts')
    
    const body = await request.json()
    const { strategy, adjustmentFactor } = body

    // strategy: 'auto', 'percentage', 'custom'
    // adjustmentFactor: برای درصد تغییر (مثلاً 1.2 برای 20% افزایش)

    let updatedCount = 0
    const updates: any[] = []

    if (strategy === 'auto') {
      // محاسبه خودکار بر اساس میانگین مصرف (بر اساس داده‌های واقعی)
      const items = await inventoryCollection.find({}).limit(10000).toArray()
      
      for (const item of items) {
        const currentStock = item.currentStock || 0
        const minStock = item.minStock || 0
        
        // اگر موجودی فعلی بیشتر از حداقل است، حداقل را به 50% موجودی فعلی تنظیم کن
        if (currentStock > minStock) {
          const newMinStock = Math.ceil(currentStock * 0.5)
          const newMaxStock = Math.ceil(currentStock * 1.5)
          
          await inventoryCollection.updateOne(
            { _id: item._id },
            { 
              $set: { 
                minStock: newMinStock,
                maxStock: newMaxStock,
                updatedAt: new Date()
              }
            }
          )
          
          updates.push({
            itemId: item._id.toString(),
            itemName: item.name,
            oldMinStock: minStock,
            newMinStock,
            oldMaxStock: item.maxStock || 0,
            newMaxStock
          })
          
          updatedCount++
        }
      }
    } else if (strategy === 'percentage') {
      // افزایش یا کاهش درصدی (بر اساس داده‌های واقعی)
      const factor = adjustmentFactor || 1.2
      const items = await inventoryCollection.find({}).limit(10000).toArray()
      
      for (const item of items) {
        const oldMinStock = item.minStock || 0
        const oldMaxStock = item.maxStock || 0
        const newMinStock = Math.ceil(oldMinStock * factor)
        const newMaxStock = Math.ceil(oldMaxStock * factor)
        
        await inventoryCollection.updateOne(
          { _id: item._id },
          { 
            $set: { 
              minStock: newMinStock,
              maxStock: newMaxStock,
              updatedAt: new Date()
            }
          }
        )
        
        updates.push({
          itemId: item._id.toString(),
          itemName: item.name,
          oldMinStock,
          newMinStock,
          oldMaxStock,
          newMaxStock
        })
        
        updatedCount++
      }
    } else if (strategy === 'custom') {
      // تنظیمات سفارشی برای آیتم‌های خاص
      const items = body.items || []
      
      for (const itemUpdate of items) {
        await inventoryCollection.updateOne(
          { _id: new ObjectId(itemUpdate.itemId) },
          { 
            $set: { 
              minStock: itemUpdate.minStock,
              maxStock: itemUpdate.maxStock,
              updatedAt: new Date()
            }
          }
        )
        
        updates.push({
          itemId: itemUpdate.itemId,
          itemName: itemUpdate.itemName,
          oldMinStock: itemUpdate.oldMinStock,
          newMinStock: itemUpdate.minStock,
          oldMaxStock: itemUpdate.oldMaxStock,
          newMaxStock: itemUpdate.maxStock
        })
        
        updatedCount++
      }
    }

    // به‌روزرسانی هشدارهای مربوطه
    await stockAlertsCollection.updateMany(
      { status: 'active' },
      { 
        $set: { 
          updatedAt: new Date().toISOString()
        }
      }
    )

    return NextResponse.json({
      success: true,
      data: {
        updatedCount,
        updates
      },
      message: `${updatedCount} آیتم با موفقیت به‌روزرسانی شد`
    })
  } catch (error) {
    console.error('Error updating min stock levels:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در تنظیم حداقل موجودی' },
      { status: 500 }
    )
  }
}
