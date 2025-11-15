import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'
import { logStocktaking } from '@/lib/audit-logger'

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

// POST - تأیید برگه شمارش و تولید حرکات ADJUSTMENT
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = await connectToDatabase()
    const countsCollection = db.collection('inventory_counts')
    const countItemsCollection = db.collection('count_items')
    const balanceCollection = db.collection('inventory_balance')
    const movementCollection = db.collection('stock_movements')
    const inventoryItemsCollection = db.collection('inventory_items')
    
    const body = await request.json()
    const { approvedBy } = body
    
    // دریافت برگه شمارش
    const count = await countsCollection.findOne({ _id: new ObjectId(params.id) })
    
    if (!count) {
      return NextResponse.json(
        { success: false, message: 'برگه شمارش یافت نشد' },
        { status: 404 }
      )
    }
    
    // ذخیره وضعیت قبل برای لاگ
    const beforeState = {
      status: count.status,
      totalItems: count.totalItems,
      countedItems: count.countedItems,
      discrepancies: count.discrepancies,
      discrepancyValue: count.discrepancyValue
    }
    
    if (count.status !== 'ready_for_approval' && count.status !== 'counting') {
      return NextResponse.json(
        { success: false, message: `برگه شمارش در وضعیت "${count.status}" قابل تأیید نیست` },
        { status: 400 }
      )
    }
    
    // دریافت آیتم‌های شمارش
    const countItems = await countItemsCollection.find({ countId: params.id }).toArray()
    
    // بررسی اینکه همه آیتم‌ها شمارش شده‌اند
    const unCountedItems = countItems.filter((item: any) => 
      item.countedQuantity === null || item.countedQuantity === undefined
    )
    
    if (unCountedItems.length > 0) {
      return NextResponse.json(
        { success: false, message: `${unCountedItems.length} آیتم هنوز شمارش نشده است` },
        { status: 400 }
      )
    }
    
    // محاسبه کسری/اضافی بر اساس موجودی سیستم در لحظه نهایی‌سازی
    const movements = []
    let totalDiscrepancyValue = 0
    
    for (const item of countItems) {
      // دریافت موجودی فعلی از Balance
      const balance = await balanceCollection.findOne({
        itemId: new ObjectId(item.itemId),
        warehouseName: item.warehouse
      })
      
      const currentSystemQty = balance?.quantity || 0
      const countedQty = item.countedQuantity || 0
      const discrepancy = countedQty - currentSystemQty
      
      // به‌روزرسانی systemQuantityAtFinalization
      await countItemsCollection.updateOne(
        { _id: item._id },
        {
          $set: {
            systemQuantityAtFinalization: currentSystemQty,
            discrepancy: discrepancy,
            discrepancyValue: discrepancy * (item.unitPrice || 0),
            updatedAt: new Date().toISOString()
          }
        }
      )
      
      // اگر مغایرت وجود دارد، حرکت ADJUSTMENT ایجاد کن
      if (discrepancy !== 0) {
        const movementType = discrepancy > 0 ? 'ADJUSTMENT_INCREMENT' : 'ADJUSTMENT_DECREMENT'
        const quantity = Math.abs(discrepancy)
        const unitPrice = item.unitPrice || 0
        const totalValue = quantity * unitPrice
        
        const movement = {
          itemId: new ObjectId(item.itemId),
          warehouseId: null,
          warehouseName: item.warehouse,
          movementType: movementType,
          quantity: discrepancy, // مثبت برای افزایش، منفی برای کاهش
          unitPrice: unitPrice,
          totalValue: discrepancy * unitPrice,
          lotNumber: null,
          expirationDate: null,
          documentNumber: count.countNumber,
          documentType: 'STOCKTAKING',
          description: `انبارگردانی ${count.countNumber} - ${item.itemName} (${item.warehouse})`,
          referenceId: params.id,
          countId: params.id,
          createdBy: approvedBy || 'سیستم',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        
        movements.push(movement)
        totalDiscrepancyValue += Math.abs(discrepancy * unitPrice)
        
        // به‌روزرسانی Balance
        const newBalanceQty = currentSystemQty + discrepancy
        const newBalanceValue = (balance?.totalValue || 0) + (discrepancy * unitPrice)
        
        if (balance) {
          await balanceCollection.updateOne(
            { _id: balance._id },
            {
              $set: {
                quantity: newBalanceQty,
                totalValue: newBalanceValue,
                lastUpdated: new Date().toISOString(),
                updatedAt: new Date()
              }
            }
          )
        } else {
          await balanceCollection.insertOne({
            itemId: new ObjectId(item.itemId),
            warehouseId: null,
            warehouseName: item.warehouse,
            quantity: newBalanceQty,
            totalValue: newBalanceValue,
            lastUpdated: new Date().toISOString(),
            createdAt: new Date(),
            updatedAt: new Date()
          })
        }
        
        // همگام‌سازی inventory_items
        const inventoryItem = await inventoryItemsCollection.findOne({ _id: new ObjectId(item.itemId) })
        if (inventoryItem) {
          // محاسبه موجودی کل از همه انبارها
          const allBalances = await balanceCollection.find({
            itemId: new ObjectId(item.itemId)
          }).toArray()
          
          const totalStock = allBalances.reduce((sum: number, b: any) => sum + (b.quantity || 0), 0)
          const totalValue = allBalances.reduce((sum: number, b: any) => sum + (b.totalValue || 0), 0)
          
          await inventoryItemsCollection.updateOne(
            { _id: new ObjectId(item.itemId) },
            {
              $set: {
                currentStock: totalStock,
                totalValue: totalValue,
                unitPrice: totalStock > 0 ? totalValue / totalStock : unitPrice,
                lastUpdated: new Date().toISOString(),
                updatedAt: new Date()
              }
            }
          )
        }
      }
    }
    
    // ثبت حرکات
    if (movements.length > 0) {
      await movementCollection.insertMany(movements)
    }
    
    // به‌روزرسانی وضعیت برگه شمارش
    const discrepancies = countItems.filter((item: any) => {
      const disc = (item.countedQuantity || 0) - (item.systemQuantityAtFinalization || item.systemQuantity || 0)
      return disc !== 0
    }).length
    
    await countsCollection.updateOne(
      { _id: new ObjectId(params.id) },
      {
        $set: {
          status: 'approved',
          approvedBy: approvedBy || 'سیستم',
          approvedDate: new Date().toISOString(),
          completedDate: new Date().toISOString(),
          countedItems: countItems.length,
          discrepancies: discrepancies,
          discrepancyValue: totalDiscrepancyValue,
          updatedAt: new Date().toISOString()
        }
      }
    )
    
    // محاسبه مجدد هشدارها
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/stock-alerts/calculate`, {
        method: 'POST'
      })
    } catch (error) {
      console.warn('Error calculating alerts:', error)
    }
    
    return NextResponse.json({
      success: true,
      message: 'برگه شمارش با موفقیت تأیید شد',
      data: {
        movementsCreated: movements.length,
        totalDiscrepancyValue,
        discrepancies
      }
    })
  } catch (error) {
    console.error('Error approving inventory count:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در تأیید برگه شمارش', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

