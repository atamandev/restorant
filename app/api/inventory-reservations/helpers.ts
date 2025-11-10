import { MongoClient, ObjectId, ClientSession } from 'mongodb'
import { notifyStockMovement } from '@/lib/inventory-sync'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://restorenUser:1234@localhost:27017/restoren'

/**
 * رزرو مواد اولیه برای یک سفارش
 * در وضعیت Accepted/Confirmed فراخوانی می‌شود
 */
export async function reserveInventoryForOrder(
  db: any,
  session: ClientSession | null,
  orderId: string,
  orderNumber: string,
  orderType: 'dine-in' | 'takeaway' | 'delivery' | 'table-order' | 'quick-sale',
  items: any[]
): Promise<{ success: boolean; message?: string; reservations?: any[] }> {
  try {
    const inventoryItemsCollection = db.collection('inventory_items')
    const reservationsCollection = db.collection('inventory_reservations')
    const menuItemsCollection = db.collection('menu_items')

    const reservations: any[] = []

    for (const item of items || []) {
      const menuItemQuantity = item.quantity || 1
      
      // دریافت recipe از سفارش یا menu item
      let recipe = item.recipe
      if ((!recipe || !Array.isArray(recipe) || recipe.length === 0) && item.menuItemId) {
        try {
          const menuItem = await menuItemsCollection.findOne({ 
            _id: new ObjectId(item.menuItemId)
          }, session ? { session } : {})
          if (menuItem && menuItem.recipe && Array.isArray(menuItem.recipe) && menuItem.recipe.length > 0) {
            recipe = menuItem.recipe
          }
        } catch (e) {
          console.error('[RESERVE] Error fetching menu item for recipe:', e)
        }
      }

      if (recipe && Array.isArray(recipe) && recipe.length > 0) {
        for (const ingredient of recipe) {
          if (ingredient.ingredientId) {
            const ingredientId = ingredient.ingredientId
            const requiredQuantity = (ingredient.quantity || 0) * menuItemQuantity

            // بررسی موجودی از Balance
            const inventoryItem = await inventoryItemsCollection.findOne({ 
              _id: new ObjectId(ingredientId)
            }, session ? { session } : {})

            if (!inventoryItem) {
              throw new Error(`مواد اولیه با شناسه ${ingredientId} یافت نشد`)
            }

            // دریافت انبار عملیاتی رستوران (پیش‌فرض: تایماز)
            const restaurantWarehouse = process.env.RESTAURANT_WAREHOUSE || 'تایماز'
            const targetWarehouse = inventoryItem.warehouse || restaurantWarehouse
            
            // بررسی موجودی از Balance
            const balanceCollection = db.collection('inventory_balance')
            const balance = await balanceCollection.findOne({
              itemId: new ObjectId(ingredientId),
              warehouseName: targetWarehouse
            }, session ? { session } : {})
            
            const currentStock = balance?.quantity || inventoryItem.currentStock || 0
            
            // دریافت رزروهای فعال برای محاسبه available
            const reservationsCollection = db.collection('inventory_reservations')
            const activeReservations = await reservationsCollection.aggregate([
              {
                $match: {
                  ingredientId: new ObjectId(ingredientId),
                  status: 'reserved'
                }
              },
              {
                $group: {
                  _id: null,
                  totalReserved: { $sum: '$reservedQuantity' }
                }
              }
            ], session ? { session } : {}).toArray()
            
            const totalReserved = activeReservations[0]?.totalReserved || 0
            const availableStock = currentStock - totalReserved

            if (availableStock < requiredQuantity) {
              throw new Error(
                `موجودی ${inventoryItem.name} کافی نیست. موجودی: ${currentStock}, رزرو شده: ${totalReserved}, موجودی قابل استفاده: ${availableStock}, مورد نیاز: ${requiredQuantity}`
              )
            }

            // ایجاد رزرو
            const reservation = {
              orderId: new ObjectId(orderId),
              orderNumber: orderNumber,
              orderType: orderType,
              menuItemId: item.menuItemId || null,
              menuItemName: item.name || '',
              ingredientId: ingredientId,
              ingredientName: ingredient.ingredientName || inventoryItem.name,
              reservedQuantity: requiredQuantity,
              unit: ingredient.unit || inventoryItem.unit || 'گرم',
              status: 'reserved', // reserved, consumed, released
              createdAt: new Date(),
              updatedAt: new Date()
            }

            await reservationsCollection.insertOne(reservation, session ? { session } : {})

            // به‌روزرسانی reservedStock در inventory_items (برای سازگاری با سیستم قدیمی)
            // اما available از Balance - totalReserved محاسبه می‌شود
            await inventoryItemsCollection.updateOne(
              { _id: new ObjectId(ingredientId) },
              {
                $inc: { reservedStock: requiredQuantity },
                $set: { 
                  lastUpdated: new Date().toISOString(),
                  updatedAt: new Date()
                }
              },
              session ? { session } : {}
            )

            reservations.push(reservation)
            console.log(`[RESERVE] ✅ Reserved ${requiredQuantity} ${inventoryItem.name} for order ${orderNumber}`)
          }
        }
      }
    }

    return { success: true, reservations }
  } catch (error: any) {
    console.error('[RESERVE] Error reserving inventory:', error)
    return { success: false, message: error.message || 'خطا در رزرو موجودی' }
  }
}

/**
 * مصرف مواد اولیه از رزرو
 * در وضعیت Completed فراخوانی می‌شود
 * اگر رزروی وجود نداشت، مستقیماً از recipe سفارش موجودی را کم می‌کند
 */
export async function consumeReservedInventory(
  db: any,
  session: ClientSession | null,
  orderId: string,
  orderNumber: string
): Promise<{ success: boolean; message?: string; consumed?: any[] }> {
  try {
    const inventoryItemsCollection = db.collection('inventory_items')
    const reservationsCollection = db.collection('inventory_reservations')

    // دریافت تمام رزروهای فعال این سفارش
    const reservations = await reservationsCollection.find({
      orderId: new ObjectId(orderId),
      status: 'reserved'
            }, session ? { session } : {}).toArray()

    // اگر رزروی وجود نداشت، مستقیماً از سفارش موجودی را کم کن
    if (reservations.length === 0) {
      console.warn(`[CONSUME] No reservations found for order ${orderNumber}, consuming directly from order`)
      
      // جستجو در همه collection ها برای پیدا کردن سفارش
      const collections = ['dine_in_orders', 'takeaway_orders', 'delivery_orders', 'table_orders', 'quick_sales']
      let foundOrder = null
      
      for (const collName of collections) {
        const order = await db.collection(collName).findOne(
          { _id: new ObjectId(orderId) },
          session ? { session } : {}
        )
        if (order) {
          foundOrder = order
          break
        }
      }
      
      if (!foundOrder) {
        console.error(`[CONSUME] Order ${orderNumber} not found in any collection`)
        return { success: false, message: `سفارش ${orderNumber} یافت نشد` }
      }
      
      // مصرف مستقیم از recipe سفارش
      return await consumeInventoryDirectly(db, session, orderId, orderNumber, foundOrder.items || [])
    }

    const consumed: any[] = []

    for (const reservation of reservations) {
      // تبدیل ingredientId به ObjectId (ممکن است string یا ObjectId باشد)
      const ingredientId = reservation.ingredientId instanceof ObjectId 
        ? reservation.ingredientId 
        : new ObjectId(reservation.ingredientId)
      const reservedQuantity = reservation.reservedQuantity

      // دریافت موجودی
      const inventoryItem = await inventoryItemsCollection.findOne({ 
        _id: ingredientId
            }, session ? { session } : {})

      if (!inventoryItem) {
        console.error(`[CONSUME] Inventory item not found: ${ingredientId}`)
        continue
      }

      // دریافت انبار عملیاتی رستوران (پیش‌فرض: تایماز)
      // در آینده می‌توان از تنظیمات رستوران خواند
      const restaurantWarehouse = process.env.RESTAURANT_WAREHOUSE || 'تایماز'
      const targetWarehouse = inventoryItem.warehouse || restaurantWarehouse
      
      // بررسی موجودی از Balance
      const balanceCollection = db.collection('inventory_balance')
      const balance = await balanceCollection.findOne({
        itemId: ingredientId,
        warehouseName: targetWarehouse
      }, session ? { session } : {})
      
      const currentStock = balance?.quantity || inventoryItem.currentStock || 0
      
      // بررسی اینکه موجودی کافی است
      if (currentStock < reservedQuantity) {
        // بررسی تنظیمات انبار برای اجازه موجودی منفی
        const warehouseCollection = db.collection('warehouses')
        const warehouse = await warehouseCollection.findOne({
          $or: [
            { name: targetWarehouse },
            { name: { $regex: targetWarehouse, $options: 'i' } }
          ]
        }, session ? { session } : {})
        
        const allowNegative = warehouse?.allowNegativeStock || false
        
        if (!allowNegative) {
          throw new Error(
            `موجودی ${inventoryItem.name} برای مصرف کافی نیست. موجودی: ${currentStock}, مورد نیاز: ${reservedQuantity}`
          )
        }
      }
      
      const unitPrice = inventoryItem.unitPrice || 0

      // ایجاد Stock Movement برای مصرف فروش
      const movementCollection = db.collection('stock_movements')
      const fifoLayerCollection = db.collection('fifo_layers')
      
      // محاسبه قیمت با FIFO
      const fifoLayers = await fifoLayerCollection
        .find({
          itemId: ingredientId,
          warehouseName: targetWarehouse,
          remainingQuantity: { $gt: 0 }
        })
        .sort({ createdAt: 1 })
        .toArray()
      
      let remainingQty = reservedQuantity
      let totalCost = 0
      
      for (const layer of fifoLayers) {
        if (remainingQty <= 0) break
        const consumedQty = Math.min(remainingQty, layer.remainingQuantity)
        totalCost += consumedQty * layer.unitPrice
        remainingQty -= consumedQty
      }
      
      // اگر FIFO کافی نبود، از میانگین استفاده کن
      if (remainingQty > 0 && balance && balance.quantity > 0) {
        const avgPrice = balance.totalValue / balance.quantity
        totalCost += remainingQty * avgPrice
      }
      
      // ایجاد Stock Movement
      const docNumber = `SALE-${orderNumber.substring(orderNumber.length - 4)}`
      const movement = {
        itemId: ingredientId,
        warehouseId: null,
        warehouseName: targetWarehouse,
        movementType: 'SALE_CONSUMPTION',
        quantity: -reservedQuantity,
        unitPrice: reservedQuantity > 0 ? totalCost / reservedQuantity : 0,
        totalValue: -totalCost,
        lotNumber: null,
        expirationDate: null,
        documentNumber: docNumber,
        documentType: 'ORDER',
        description: `فروش ${reservation.menuItemName} - سفارش ${orderNumber}`,
        referenceId: orderId,
        orderNumber: orderNumber,
        createdBy: 'سیستم',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      const movementResult = await movementCollection.insertOne(movement, session ? { session } : {})
      
      // به‌روزرسانی Balance
      const newBalanceQty = (balance?.quantity || 0) - reservedQuantity
      const newBalanceValue = (balance?.totalValue || 0) - totalCost
      
      // بررسی موجودی منفی (اگر اجازه داده نشده باشد)
      if (newBalanceQty < 0) {
        const warehouseCollection = db.collection('warehouses')
        const warehouse = await warehouseCollection.findOne({
          $or: [
            { name: targetWarehouse },
            { name: { $regex: targetWarehouse, $options: 'i' } }
          ]
        }, session ? { session } : {})
        
        const allowNegative = warehouse?.allowNegativeStock || false
        
        if (!allowNegative) {
          throw new Error(
            `مصرف موجودی ${inventoryItem.name} منجر به موجودی منفی می‌شود. موجودی فعلی: ${balance?.quantity || 0}, مصرف: ${reservedQuantity}`
          )
        }
      }
      
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
          },
          session ? { session } : {}
        )
      } else {
        await balanceCollection.insertOne({
          itemId: ingredientId,
          warehouseId: null,
          warehouseName: targetWarehouse,
          quantity: newBalanceQty,
          totalValue: newBalanceValue,
          lastUpdated: new Date().toISOString(),
          createdAt: new Date(),
          updatedAt: new Date()
        }, session ? { session } : {})
      }
      
      // به‌روزرسانی FIFO Layers
      remainingQty = reservedQuantity
      for (const layer of fifoLayers) {
        if (remainingQty <= 0) break
        const consumedQty = Math.min(remainingQty, layer.remainingQuantity)
        const newRemainingQty = layer.remainingQuantity - consumedQty
        
        await fifoLayerCollection.updateOne(
          { _id: layer._id },
          {
            $set: {
              remainingQuantity: newRemainingQty,
              updatedAt: new Date()
            }
          },
          session ? { session } : {}
        )
        
        remainingQty -= consumedQty
      }
      
      // کاردکس از stock_movements خوانده می‌شود، نیازی به ledgerCollection نیست

      // به‌روزرسانی موجودی از Balance (همگام‌سازی)
      const ingredientIdObj = ingredientId instanceof ObjectId 
        ? ingredientId 
        : new ObjectId(ingredientId)
      
      await inventoryItemsCollection.updateOne(
        { _id: ingredientIdObj },
        {
          $set: {
            currentStock: newBalanceQty,
            reservedStock: Math.max(0, (inventoryItem.reservedStock || 0) - reservedQuantity),
            totalValue: newBalanceValue,
            unitPrice: newBalanceQty > 0 ? newBalanceValue / newBalanceQty : unitPrice,
            isLowStock: newBalanceQty <= (inventoryItem.minStock || 0),
            lastUpdated: new Date().toISOString(),
            updatedAt: new Date()
          }
        },
        session ? { session } : {}
      )

      // به‌روزرسانی وضعیت رزرو به consumed
      await reservationsCollection.updateOne(
        { _id: reservation._id },
        {
          $set: {
            status: 'consumed',
            consumedAt: new Date(),
            updatedAt: new Date()
          }
        },
        session ? { session } : {}
      )

      consumed.push(reservation)
      console.log(`[CONSUME] ✅ Consumed ${reservedQuantity} ${inventoryItem.name} from reservation for order ${orderNumber}`)
      
      // تریگر event برای به‌روزرسانی کش‌های قدیمی
      try {
        notifyStockMovement({
          itemId: ingredientId.toString(),
          warehouseName: targetWarehouse,
          quantity: -reservedQuantity,
          movementType: 'SALE_CONSUMPTION',
          orderNumber
        })
      } catch (error) {
        console.warn('[CONSUME] Warning: Error notifying stock movement:', error)
      }
    }

    // محاسبه مجدد هشدارها بعد از مصرف موجودی
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
      await fetch(`${baseUrl}/api/stock-alerts/calculate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      }).catch((err) => {
        console.warn('[CONSUME] Warning: Could not recalculate alerts:', err)
      })
    } catch (error) {
      console.warn('[CONSUME] Warning: Error recalculating alerts after consumption:', error)
    }

    return { success: true, consumed }
  } catch (error: any) {
    console.error('[CONSUME] Error consuming reserved inventory:', error)
    return { success: false, message: error.message || 'خطا در مصرف موجودی رزرو شده' }
  }
}

/**
 * مصرف مستقیم موجودی از recipe سفارش (بدون رزرو)
 */
async function consumeInventoryDirectly(
  db: any,
  session: ClientSession | null,
  orderId: string,
  orderNumber: string,
  items: any[]
): Promise<{ success: boolean; message?: string; consumed?: any[] }> {
  try {
    const inventoryItemsCollection = db.collection('inventory_items')
    const menuItemsCollection = db.collection('menu_items')

    const consumed: any[] = []

    for (const item of items || []) {
      const menuItemQuantity = item.quantity || 1
      
      // دریافت recipe از سفارش یا menu item
      let recipe = item.recipe
      if ((!recipe || !Array.isArray(recipe) || recipe.length === 0) && item.menuItemId) {
        try {
          const menuItem = await menuItemsCollection.findOne({ 
            _id: new ObjectId(item.menuItemId)
          }, session ? { session } : {})
          if (menuItem && menuItem.recipe && Array.isArray(menuItem.recipe) && menuItem.recipe.length > 0) {
            recipe = menuItem.recipe
          }
        } catch (e) {
          console.error('[CONSUME DIRECT] Error fetching menu item for recipe:', e)
        }
      }

      if (recipe && Array.isArray(recipe) && recipe.length > 0) {
        for (const ingredient of recipe) {
          if (ingredient.ingredientId) {
            const ingredientId = ingredient.ingredientId
            const requiredQuantity = (ingredient.quantity || 0) * menuItemQuantity

            // دریافت موجودی
            const inventoryItem = await inventoryItemsCollection.findOne({ 
              _id: new ObjectId(ingredientId)
            }, session ? { session } : {})

            if (!inventoryItem) {
              console.error(`[CONSUME DIRECT] Inventory item not found: ${ingredientId}`)
              continue
            }

            // دریافت انبار عملیاتی رستوران (پیش‌فرض: تایماز)
            const restaurantWarehouse = process.env.RESTAURANT_WAREHOUSE || 'تایماز'
            const targetWarehouse = inventoryItem.warehouse || restaurantWarehouse
            
            // بررسی موجودی از Balance
            const balanceCollection = db.collection('inventory_balance')
            const balance = await balanceCollection.findOne({
              itemId: new ObjectId(ingredientId),
              warehouseName: targetWarehouse
            }, session ? { session } : {})
            
            const currentStock = balance?.quantity || inventoryItem.currentStock || 0

            // بررسی اینکه موجودی کافی است
            if (currentStock < requiredQuantity) {
              // بررسی تنظیمات انبار برای اجازه موجودی منفی
              const warehouseCollection = db.collection('warehouses')
              const warehouse = await warehouseCollection.findOne({
                $or: [
                  { name: targetWarehouse },
                  { name: { $regex: targetWarehouse, $options: 'i' } }
                ]
              }, session ? { session } : {})
              
              const allowNegative = warehouse?.allowNegativeStock || false
              
              if (!allowNegative) {
                throw new Error(
                  `موجودی ${inventoryItem.name} برای مصرف کافی نیست. موجودی: ${currentStock}, مورد نیاز: ${requiredQuantity}`
                )
              }
            }
            
            // محاسبه قیمت با FIFO
            const movementCollection = db.collection('stock_movements')
            const fifoLayerCollection = db.collection('fifo_layers')
            
            const fifoLayers = await fifoLayerCollection
              .find({
                itemId: new ObjectId(ingredientId),
                warehouseName: targetWarehouse,
                remainingQuantity: { $gt: 0 }
              })
              .sort({ createdAt: 1 })
              .toArray()
            
            let remainingQty = requiredQuantity
            let totalCost = 0
            
            for (const layer of fifoLayers) {
              if (remainingQty <= 0) break
              const consumedQty = Math.min(remainingQty, layer.remainingQuantity)
              totalCost += consumedQty * layer.unitPrice
              remainingQty -= consumedQty
            }
            
            // اگر FIFO کافی نبود، از میانگین استفاده کن
            if (remainingQty > 0 && balance && balance.quantity > 0) {
              const avgPrice = balance.totalValue / balance.quantity
              totalCost += remainingQty * avgPrice
            } else if (remainingQty > 0) {
              const unitPrice = inventoryItem.unitPrice || 0
              totalCost += remainingQty * unitPrice
            }
            
            const avgPrice = requiredQuantity > 0 ? totalCost / requiredQuantity : (inventoryItem.unitPrice || 0)

            // بررسی موجودی منفی
            const newBalance = currentStock - requiredQuantity
            const newBalanceValue = (balance?.totalValue || 0) - totalCost
            
            if (newBalance < 0) {
              const warehouseCollection = db.collection('warehouses')
              const warehouse = await warehouseCollection.findOne({
                $or: [
                  { name: targetWarehouse },
                  { name: { $regex: targetWarehouse, $options: 'i' } }
                ]
              }, session ? { session } : {})
              
              const allowNegative = warehouse?.allowNegativeStock || false
              
              if (!allowNegative) {
                throw new Error(
                  `مصرف موجودی ${inventoryItem.name} منجر به موجودی منفی می‌شود. موجودی فعلی: ${currentStock}, مصرف: ${requiredQuantity}`
                )
              }
            }
            
            // ایجاد Stock Movement
            const docNumber = `SALE-${orderNumber.substring(orderNumber.length - 4)}`
            const movement = {
              itemId: new ObjectId(ingredientId),
              warehouseId: null,
              warehouseName: targetWarehouse,
              movementType: 'SALE_CONSUMPTION',
              quantity: -requiredQuantity,
              unitPrice: avgPrice,
              totalValue: -totalCost,
              lotNumber: null,
              expirationDate: null,
              documentNumber: docNumber,
              documentType: 'ORDER',
              description: `فروش ${item.name || 'آیتم'} - سفارش ${orderNumber}`,
              referenceId: orderId,
              orderNumber: orderNumber,
              createdBy: 'سیستم',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
            
            await movementCollection.insertOne(movement, session ? { session } : {})
            
            // به‌روزرسانی Balance
            if (balance) {
              await balanceCollection.updateOne(
                { _id: balance._id },
                {
                  $set: {
                    quantity: newBalance,
                    totalValue: newBalanceValue,
                    lastUpdated: new Date().toISOString(),
                    updatedAt: new Date()
                  }
                },
                session ? { session } : {}
              )
            } else {
              await balanceCollection.insertOne({
                itemId: new ObjectId(ingredientId),
                warehouseId: null,
                warehouseName: targetWarehouse,
                quantity: newBalance,
                totalValue: newBalanceValue,
                lastUpdated: new Date().toISOString(),
                createdAt: new Date(),
                updatedAt: new Date()
              }, session ? { session } : {})
            }
            
            // به‌روزرسانی FIFO Layers
            remainingQty = requiredQuantity
            for (const layer of fifoLayers) {
              if (remainingQty <= 0) break
              const consumedQty = Math.min(remainingQty, layer.remainingQuantity)
              const newRemainingQty = layer.remainingQuantity - consumedQty
              
              await fifoLayerCollection.updateOne(
                { _id: layer._id },
                {
                  $set: {
                    remainingQuantity: newRemainingQty,
                    updatedAt: new Date()
                  }
                },
                session ? { session } : {}
              )
              
              remainingQty -= consumedQty
            }
            
            // همگام‌سازی inventory_items از Balance
            await inventoryItemsCollection.updateOne(
              { _id: new ObjectId(ingredientId) },
              {
                $set: {
                  currentStock: newBalance,
                  totalValue: newBalanceValue,
                  unitPrice: newBalance > 0 ? newBalanceValue / newBalance : avgPrice,
                  isLowStock: newBalance <= (inventoryItem.minStock || 0),
                  lastUpdated: new Date().toISOString(),
                  updatedAt: new Date()
                }
              },
              session ? { session } : {}
            )

            consumed.push({
              ingredientId: ingredientId.toString(),
              ingredientName: ingredient.ingredientName || inventoryItem.name,
              quantity: requiredQuantity,
              menuItemName: item.name || 'آیتم'
            })
            
            console.log(`[CONSUME DIRECT] ✅ Consumed ${requiredQuantity} ${inventoryItem.name} directly for order ${orderNumber}`)
            
            // تریگر event برای به‌روزرسانی کش‌های قدیمی
            try {
              notifyStockMovement({
                itemId: ingredientId.toString(),
                warehouseName: targetWarehouse,
                quantity: -requiredQuantity,
                movementType: 'SALE_CONSUMPTION',
                orderNumber
              })
            } catch (error) {
              console.warn('[CONSUME DIRECT] Warning: Error notifying stock movement:', error)
            }
          }
        }
      }
    }

    // محاسبه مجدد هشدارها بعد از مصرف موجودی
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
      await fetch(`${baseUrl}/api/stock-alerts/calculate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      }).catch((err) => {
        console.warn('[CONSUME DIRECT] Warning: Could not recalculate alerts:', err)
      })
    } catch (error) {
      console.warn('[CONSUME DIRECT] Warning: Error recalculating alerts after consumption:', error)
    }

    return { success: true, consumed }
  } catch (error: any) {
    console.error('[CONSUME DIRECT] Error consuming inventory directly:', error)
    return { success: false, message: error.message || 'خطا در مصرف مستقیم موجودی' }
  }
}

/**
 * آزاد کردن رزروهای یک سفارش
 * در وضعیت Canceled فراخوانی می‌شود
 */
export async function releaseReservedInventory(
  db: any,
  session: ClientSession | null,
  orderId: string,
  orderNumber: string
): Promise<{ success: boolean; message?: string; released?: any[] }> {
  try {
    const inventoryItemsCollection = db.collection('inventory_items')
    const reservationsCollection = db.collection('inventory_reservations')

    // دریافت تمام رزروهای فعال این سفارش
    const reservations = await reservationsCollection.find({
      orderId: new ObjectId(orderId),
      status: 'reserved'
            }, session ? { session } : {}).toArray()

    if (reservations.length === 0) {
      console.warn(`[RELEASE] No reservations found for order ${orderNumber}`)
      return { success: true, released: [] }
    }

    const released: any[] = []

    for (const reservation of reservations) {
      const ingredientId = reservation.ingredientId
      const reservedQuantity = reservation.reservedQuantity

      // دریافت موجودی
      const inventoryItem = await inventoryItemsCollection.findOne({ 
        _id: new ObjectId(ingredientId)
            }, session ? { session } : {})

      if (!inventoryItem) {
        console.error(`[RELEASE] Inventory item not found: ${ingredientId}`)
        continue
      }

      // کاهش reservedStock
      await inventoryItemsCollection.updateOne(
        { _id: new ObjectId(ingredientId) },
        {
          $inc: { reservedStock: -reservedQuantity },
          $set: { 
            lastUpdated: new Date().toISOString(),
            updatedAt: new Date()
          }
        },
        session ? { session } : {}
      )

      // به‌روزرسانی وضعیت رزرو به released
      await reservationsCollection.updateOne(
        { _id: reservation._id },
        {
          $set: {
            status: 'released',
            releasedAt: new Date(),
            updatedAt: new Date()
          }
        },
        session ? { session } : {}
      )

      released.push(reservation)
      console.log(`[RELEASE] ✅ Released ${reservedQuantity} ${inventoryItem.name} from reservation for order ${orderNumber}`)
    }

    return { success: true, released }
  } catch (error: any) {
    console.error('[RELEASE] Error releasing reserved inventory:', error)
    return { success: false, message: error.message || 'خطا در آزاد کردن رزرو' }
  }
}


