import { MongoClient, ObjectId, ClientSession } from 'mongodb'

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
  orderType: 'dine-in' | 'takeaway' | 'delivery',
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

            // بررسی موجودی (currentStock - reservedStock)
            const inventoryItem = await inventoryItemsCollection.findOne({ 
              _id: new ObjectId(ingredientId)
            }, session ? { session } : {})

            if (!inventoryItem) {
              throw new Error(`مواد اولیه با شناسه ${ingredientId} یافت نشد`)
            }

            const currentStock = inventoryItem.currentStock || 0
            const reservedStock = inventoryItem.reservedStock || 0
            const availableStock = currentStock - reservedStock

            if (availableStock < requiredQuantity) {
              throw new Error(
                `موجودی ${inventoryItem.name} کافی نیست. موجودی: ${currentStock}, رزرو شده: ${reservedStock}, موجودی قابل استفاده: ${availableStock}, مورد نیاز: ${requiredQuantity}`
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

            // به‌روزرسانی reservedStock در inventory_items
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
    const ledgerCollection = db.collection('item_ledger')

    // دریافت تمام رزروهای فعال این سفارش
    const reservations = await reservationsCollection.find({
      orderId: new ObjectId(orderId),
      status: 'reserved'
            }, session ? { session } : {}).toArray()

    // اگر رزروی وجود نداشت، مستقیماً از سفارش موجودی را کم کن
    if (reservations.length === 0) {
      console.warn(`[CONSUME] No reservations found for order ${orderNumber}, consuming directly from order`)
      
      // جستجو در همه collection ها برای پیدا کردن سفارش
      const collections = ['dine_in_orders', 'takeaway_orders', 'delivery_orders']
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

      // دریافت آخرین ورودی دفتر کل برای محاسبه قیمت متوسط
      const lastEntry = await ledgerCollection
        .findOne(
          { itemId: ingredientId.toString() },
          { sort: { date: -1, createdAt: -1 }, session }
        )

      // استفاده از currentStock فعلی (نه lastBalance) چون باید از موجودی واقعی کم کنیم
      const currentStock = inventoryItem.currentStock || 0
      const lastValue = lastEntry?.runningValue || (inventoryItem.totalValue || 0)
      const lastBalance = lastEntry?.runningBalance || currentStock

      // بررسی اینکه موجودی کافی است
      if (currentStock < reservedQuantity) {
        throw new Error(
          `موجودی ${inventoryItem.name} برای مصرف کافی نیست. موجودی: ${currentStock}, مورد نیاز: ${reservedQuantity}`
        )
      }

      const unitPrice = inventoryItem.unitPrice || 0
      const newBalance = Math.max(0, currentStock - reservedQuantity)
      const avgPrice = lastBalance > 0 ? lastValue / lastBalance : unitPrice
      const newValue = Math.max(0, lastValue - (reservedQuantity * avgPrice))

      // ایجاد ورودی دفتر کل
      const docNumber = `SALE-${orderNumber.substring(orderNumber.length - 4)}`
      const ledgerEntry = {
        itemId: ingredientId.toString(),
        itemName: inventoryItem.name,
        itemCode: inventoryItem.code || '',
        date: new Date(),
        documentNumber: docNumber,
        documentType: 'sale',
        description: `فروش ${reservation.menuItemName} - سفارش ${orderNumber}`,
        warehouse: inventoryItem.warehouse || 'انبار اصلی',
        quantityIn: 0,
        quantityOut: reservedQuantity,
        unitPrice: unitPrice,
        totalValue: -(reservedQuantity * avgPrice),
        runningBalance: newBalance,
        runningValue: newValue,
        averagePrice: newBalance > 0 ? newValue / newBalance : avgPrice,
        reference: orderNumber,
        notes: `مواد اولیه ${reservation.menuItemName}: ${reservation.ingredientName} (${reservedQuantity} ${reservation.unit})`,
        userId: 'سیستم',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      await ledgerCollection.insertOne(ledgerEntry, session ? { session } : {})

      // به‌روزرسانی موجودی
      // تبدیل ingredientId به ObjectId برای استفاده در updateOne
      const ingredientIdObj = ingredientId instanceof ObjectId 
        ? ingredientId 
        : new ObjectId(ingredientId)
      
      await inventoryItemsCollection.updateOne(
        { _id: ingredientIdObj },
        {
          $set: {
            currentStock: newBalance,
            reservedStock: Math.max(0, (inventoryItem.reservedStock || 0) - reservedQuantity),
            totalValue: newValue,
            unitPrice: newBalance > 0 ? newValue / newBalance : unitPrice,
            isLowStock: newBalance <= (inventoryItem.minStock || 0),
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
    const ledgerCollection = db.collection('item_ledger')
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

            // دریافت آخرین ورودی دفتر کل برای محاسبه قیمت متوسط
            const lastEntry = await ledgerCollection
              .findOne(
                { itemId: ingredientId.toString() },
                { sort: { date: -1, createdAt: -1 }, session }
              )

            const currentStock = inventoryItem.currentStock || 0
            const lastValue = lastEntry?.runningValue || (inventoryItem.totalValue || 0)
            const lastBalance = lastEntry?.runningBalance || currentStock

            // بررسی اینکه موجودی کافی است
            if (currentStock < requiredQuantity) {
              throw new Error(
                `موجودی ${inventoryItem.name} برای مصرف کافی نیست. موجودی: ${currentStock}, مورد نیاز: ${requiredQuantity}`
              )
            }

            const unitPrice = inventoryItem.unitPrice || 0
            const newBalance = Math.max(0, currentStock - requiredQuantity)
            const avgPrice = lastBalance > 0 ? lastValue / lastBalance : unitPrice
            const newValue = Math.max(0, lastValue - (requiredQuantity * avgPrice))

            // ایجاد ورودی دفتر کل
            const docNumber = `SALE-${orderNumber.substring(orderNumber.length - 4)}`
            const ledgerEntry = {
              itemId: ingredientId.toString(),
              itemName: inventoryItem.name,
              itemCode: inventoryItem.code || '',
              date: new Date(),
              documentNumber: docNumber,
              documentType: 'sale',
              description: `فروش ${item.name || 'آیتم'} - سفارش ${orderNumber}`,
              warehouse: inventoryItem.warehouse || 'انبار اصلی',
              quantityIn: 0,
              quantityOut: requiredQuantity,
              unitPrice: unitPrice,
              totalValue: -(requiredQuantity * avgPrice),
              runningBalance: newBalance,
              runningValue: newValue,
              averagePrice: newBalance > 0 ? newValue / newBalance : avgPrice,
              reference: orderNumber,
              notes: `مواد اولیه ${item.name || 'آیتم'}: ${ingredient.ingredientName || inventoryItem.name} (${requiredQuantity} ${ingredient.unit || inventoryItem.unit || 'گرم'})`,
              userId: 'سیستم',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }

            await ledgerCollection.insertOne(ledgerEntry, session ? { session } : {})

            // به‌روزرسانی موجودی
            await inventoryItemsCollection.updateOne(
              { _id: new ObjectId(ingredientId) },
              {
                $set: {
                  currentStock: newBalance,
                  totalValue: newValue,
                  unitPrice: newBalance > 0 ? newValue / newBalance : unitPrice,
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
            
            console.log(`[CONSUME DIRECT] ✅ Consumed ${requiredQuantity} ${inventoryItem.name} directly from order ${orderNumber}`)
          }
        }
      }
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

