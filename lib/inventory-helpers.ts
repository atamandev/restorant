// Helper functions for inventory management

import { ObjectId } from 'mongodb'

export type MovementType = 
  | 'INITIAL'
  | 'PURCHASE_IN'
  | 'SALE_CONSUMPTION'
  | 'TRANSFER_OUT'
  | 'TRANSFER_IN'
  | 'ADJUSTMENT_INCREMENT'
  | 'ADJUSTMENT_DECREMENT'
  | 'WASTAGE'
  | 'RETURN_IN'
  | 'RETURN_OUT'

export interface Balance {
  _id?: ObjectId
  itemId: ObjectId | string
  warehouseId?: string | null
  warehouseName: string
  quantity: number
  totalValue: number
  lastUpdated: string
  createdAt?: Date
  updatedAt?: Date
}

export interface StockMovement {
  _id?: ObjectId
  itemId: ObjectId | string
  warehouseId?: string | null
  warehouseName: string
  movementType: MovementType
  quantity: number
  unitPrice: number
  totalValue: number
  lotNumber?: string | null
  expirationDate?: string | null
  documentNumber: string
  documentType: string
  description?: string
  referenceId?: string | null
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface FIFOLayer {
  _id?: ObjectId
  itemId: ObjectId | string
  warehouseId?: string | null
  warehouseName: string
  movementId?: ObjectId | null
  quantity: number
  remainingQuantity: number
  unitPrice: number
  lotNumber?: string | null
  expirationDate?: string | null
  createdAt: string
  updatedAt: string
}

/**
 * محاسبه موجودی کل یک کالا از همه انبارها
 */
export async function calculateTotalBalance(
  db: any,
  itemId: string | ObjectId
): Promise<{ totalQuantity: number; totalValue: number; averagePrice: number }> {
  const balanceCollection = db.collection('inventory_balance')
  
  const itemObjectId = typeof itemId === 'string' ? new ObjectId(itemId) : itemId
  
  const balances = await balanceCollection.find({
    itemId: itemObjectId
  }).toArray()
  
  const totalQuantity = balances.reduce((sum: number, b: Balance) => sum + (b.quantity || 0), 0)
  const totalValue = balances.reduce((sum: number, b: Balance) => sum + (b.totalValue || 0), 0)
  const averagePrice = totalQuantity > 0 ? totalValue / totalQuantity : 0
  
  return { totalQuantity, totalValue, averagePrice }
}

/**
 * دریافت موجودی یک کالا در یک انبار خاص
 */
export async function getBalance(
  db: any,
  itemId: string | ObjectId,
  warehouseName: string
): Promise<Balance | null> {
  const balanceCollection = db.collection('inventory_balance')
  
  const itemObjectId = typeof itemId === 'string' ? new ObjectId(itemId) : itemId
  
  return await balanceCollection.findOne({
    itemId: itemObjectId,
    warehouseName: warehouseName
  })
}

/**
 * بررسی امکان موجودی منفی
 */
export async function canAllowNegative(
  db: any,
  warehouseName: string,
  allowNegativeFlag?: boolean
): Promise<boolean> {
  if (allowNegativeFlag !== undefined) {
    return allowNegativeFlag
  }
  
  const warehouseCollection = db.collection('warehouses')
  const warehouse = await warehouseCollection.findOne({ name: warehouseName })
  
  return warehouse?.allowNegativeStock || false
}

/**
 * محاسبه قیمت تمام‌شده با FIFO
 */
export async function calculateFIFOCost(
  db: any,
  itemId: string | ObjectId,
  warehouseName: string,
  quantity: number
): Promise<number> {
  const fifoLayerCollection = db.collection('fifo_layers')
  
  const itemObjectId = typeof itemId === 'string' ? new ObjectId(itemId) : itemId
  
  const fifoLayers = await fifoLayerCollection
    .find({
      itemId: itemObjectId,
      warehouseName: warehouseName,
      remainingQuantity: { $gt: 0 }
    })
    .sort({ createdAt: 1 }) // FIFO: قدیمی‌ترین اول
    .toArray()
  
  let remainingQty = quantity
  let totalCost = 0
  
  for (const layer of fifoLayers) {
    if (remainingQty <= 0) break
    
    const consumedQty = Math.min(remainingQty, layer.remainingQuantity)
    totalCost += consumedQty * layer.unitPrice
    remainingQty -= consumedQty
  }
  
  // اگر FIFO کافی نبود، از میانگین استفاده کن
  if (remainingQty > 0) {
    const balance = await getBalance(db, itemId, warehouseName)
    if (balance && balance.quantity > 0) {
      const avgPrice = balance.totalValue / balance.quantity
      totalCost += remainingQty * avgPrice
    }
  }
  
  return totalCost
}

/**
 * همگام‌سازی موجودی inventory_items از Balance
 */
export async function syncInventoryFromBalance(
  db: any,
  itemId?: string | ObjectId,
  warehouseName?: string
): Promise<number> {
  const balanceCollection = db.collection('inventory_balance')
  const inventoryCollection = db.collection('inventory_items')
  
  const filter: any = {}
  if (itemId) {
    filter.itemId = typeof itemId === 'string' ? new ObjectId(itemId) : itemId
  }
  if (warehouseName) {
    filter.warehouseName = warehouseName
  }
  
  const balances = await balanceCollection.find(filter).toArray()
  
  // گروه‌بندی بر اساس itemId
  const itemBalances: { [key: string]: { quantity: number; totalValue: number } } = {}
  
  for (const balance of balances) {
    const itemIdStr = balance.itemId?.toString() || balance.itemId
    if (!itemBalances[itemIdStr]) {
      itemBalances[itemIdStr] = { quantity: 0, totalValue: 0 }
    }
    itemBalances[itemIdStr].quantity += balance.quantity || 0
    itemBalances[itemIdStr].totalValue += balance.totalValue || 0
  }
  
  // به‌روزرسانی inventory_items
  let updatedCount = 0
  
  for (const [itemIdStr, totals] of Object.entries(itemBalances)) {
    try {
      const itemObjectId = new ObjectId(itemIdStr)
      const avgPrice = totals.totalValue > 0 && totals.quantity > 0 
        ? totals.totalValue / totals.quantity 
        : 0
      
      await inventoryCollection.updateOne(
        { _id: itemObjectId },
        {
          $set: {
            currentStock: totals.quantity,
            totalValue: totals.totalValue,
            unitPrice: avgPrice,
            lastUpdated: new Date().toISOString(),
            updatedAt: new Date()
          }
        }
      )
      
      updatedCount++
    } catch (error) {
      console.error(`Error updating item ${itemIdStr}:`, error)
    }
  }
  
  return updatedCount
}

