import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'
import { ensureCustomerExists } from '../customers/helpers'
import { 
  reserveInventoryForOrder, 
  consumeReservedInventory, 
  releaseReservedInventory 
} from '../inventory-reservations/helpers'

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

// تابع تولید شماره سفارش
async function generateOrderNumber(orderType: string = 'table-order'): Promise<string> {
  try {
    const db = await connectToDatabase()
    const collection = db.collection('table_orders')
    
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    
    const startOfDay = new Date(year, today.getMonth(), today.getDate())
    const endOfDay = new Date(year, today.getMonth(), today.getDate() + 1)
    
    const count = await collection.countDocuments({
      createdAt: {
        $gte: startOfDay,
        $lt: endOfDay
      }
    })
    
    const sequence = String(count + 1).padStart(4, '0')
    return `TO-${year}${month}${day}-${sequence}`
  } catch (error) {
    console.error('Error generating order number:', error)
    return `TO-${Date.now()}`
  }
}

// GET /api/table-orders - دریافت لیست سفارشات میز
export async function GET(request: NextRequest) {
  try {
    const db = await connectToDatabase()
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const tableNumber = searchParams.get('tableNumber')
    const status = searchParams.get('status')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const branchId = searchParams.get('branchId')
    
    const skip = (page - 1) * limit
    
    // Build query
    const query: any = {}
    if (search) {
      query.$or = [
        { customerName: { $regex: search, $options: 'i' } },
        { customerPhone: { $regex: search, $options: 'i' } },
        { tableNumber: { $regex: search, $options: 'i' } }
      ]
    }
    if (tableNumber) {
      query.tableNumber = tableNumber
    }
    if (status) {
      query.status = status
    }
    if (branchId) {
      query.branchId = new ObjectId(branchId)
    }
    if (dateFrom || dateTo) {
      query.createdAt = {}
      if (dateFrom) {
        query.createdAt.$gte = new Date(dateFrom)
      }
      if (dateTo) {
        query.createdAt.$lte = new Date(dateTo)
      }
    }
    
    const orders = await db.collection('table_orders')
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray()
    
    const total = await db.collection('table_orders').countDocuments(query)
    
    return NextResponse.json({
      success: true,
      data: orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      message: 'لیست سفارشات میز با موفقیت دریافت شد'
    })
  } catch (error) {
    console.error('Error fetching table orders:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در دریافت لیست سفارشات میز',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// POST /api/table-orders - ایجاد سفارش میز جدید (با اتصال به آشپزخانه و موجودی)
export async function POST(request: NextRequest) {
  try {
    const db = await connectToDatabase()
    const body = await request.json()
    
    console.log('Received table order body:', body)
    
    const { 
      tableNumber,
      customerName,
      customerPhone,
      items,
      subtotal,
      tax,
      serviceCharge,
      discount,
      total,
      orderTime,
      status,
      notes,
      paymentMethod,
      branchId
    } = body

    // Validate required fields
    if (!tableNumber || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, message: 'شماره میز و لیست آیتم‌ها اجباری است' },
        { status: 400 }
      )
    }

    // اگر branchId ارائه نشده، از اولین شعبه فعال استفاده کن
    let finalBranchId = branchId
    if (!finalBranchId) {
      const defaultBranch = await db.collection('branches').findOne({ isActive: true })
      if (defaultBranch) {
        finalBranchId = defaultBranch._id.toString()
      }
    }

    // دریافت اطلاعات منو برای هر آیتم
    const menuItemsCollection = db.collection('menu_items')
    const inventoryItemsCollection = db.collection('inventory_items')
    
    interface ProcessedItem {
      menuItemId: string
      name: string
      price: number
      quantity: number
      total: number
      category: string
      image?: string
      preparationTime?: number
      description?: string
      notes?: string | null
      inventoryItemId?: string | null
      recipe?: Array<{
        ingredientId: string
        ingredientName?: string
        quantity: number
        unit?: string
      }>
    }
    
    const processedItems: ProcessedItem[] = []
    let maxPreparationTime = 0
    
    for (const item of items) {
      const itemId = item.id || item.menuItemId
      if (!itemId) {
        console.error('Item missing id:', item)
        continue
      }
      
      let menuItem
      try {
        menuItem = await menuItemsCollection.findOne({ 
          _id: new ObjectId(itemId)
        })
      } catch (e) {
        console.error('Invalid ObjectId:', itemId, e)
        continue
      }
      
      if (!menuItem) {
        console.error('Menu item not found:', itemId)
        continue
      }

      // بررسی موجودی مواد اولیه بر اساس recipe
      if (menuItem.recipe && Array.isArray(menuItem.recipe) && menuItem.recipe.length > 0) {
        const requestedQty = item.quantity || 1
        
        for (const ingredient of menuItem.recipe) {
          if (ingredient.ingredientId) {
            const inventoryItem = await inventoryItemsCollection.findOne({ 
              _id: new ObjectId(ingredient.ingredientId)
            })
            
            if (inventoryItem && inventoryItem.currentStock !== undefined) {
              const requiredQuantity = (ingredient.quantity || 0) * requestedQty
              
              if (inventoryItem.currentStock < requiredQuantity) {
                return NextResponse.json(
                  { 
                    success: false, 
                    message: `موجودی ${ingredient.ingredientName || inventoryItem.name} برای ${menuItem.name} کافی نیست. موجودی: ${inventoryItem.currentStock} ${inventoryItem.unit || 'گرم'}, مورد نیاز: ${requiredQuantity} ${ingredient.unit || inventoryItem.unit || 'گرم'}` 
                  },
                  { status: 400 }
                )
              }
            }
          }
        }
      }

      const itemTotal = (menuItem.price || item.price) * (item.quantity || 1)
      const itemPrepTime = menuItem.preparationTime || item.preparationTime || 0
      if (itemPrepTime > maxPreparationTime) {
        maxPreparationTime = itemPrepTime
      }

      processedItems.push({
        menuItemId: menuItem._id.toString(),
        name: menuItem.name,
        price: menuItem.price || item.price,
        quantity: item.quantity || 1,
        total: itemTotal,
        category: menuItem.category,
        image: menuItem.image || item.image || '',
        preparationTime: itemPrepTime,
        description: menuItem.description || item.description || '',
        notes: item.notes || null,
        inventoryItemId: menuItem.inventoryItemId || null,
        recipe: menuItem.recipe || []
      })
    }

    // محاسبه مجدد مقادیر بر اساس قیمت‌های واقعی
    const calculatedSubtotal = processedItems.reduce((sum, item) => sum + item.total, 0)
    const calculatedServiceCharge = serviceCharge || (calculatedSubtotal * 0.1) // 10% service charge
    const calculatedTax = tax || ((calculatedSubtotal + calculatedServiceCharge) * 0.09) // 9% tax
    const calculatedDiscount = discount || 0
    const calculatedTotal = calculatedSubtotal + calculatedServiceCharge + calculatedTax - calculatedDiscount

    // تولید شماره سفارش
    const orderNumber = await generateOrderNumber('table-order')
    
    // محاسبه زمان آماده‌سازی
    const estimatedReady = new Date(Date.now() + maxPreparationTime * 60 * 1000 + 10 * 60 * 1000)
    
    // ثبت یا به‌روزرسانی مشتری در سیستم
    let finalCustomerId: ObjectId | null = null
    if (customerPhone || customerName) {
      try {
        finalCustomerId = await ensureCustomerExists(
          db,
          null, // بدون session (MongoDB standalone)
          null, // customerId (هنوز نداریم)
          customerName || null,
          customerPhone || null,
          null // customerAddress (در سفارش میز نداریم)
        )
        if (finalCustomerId) {
          console.log(`[TABLE_ORDER] Customer ensured: ${finalCustomerId.toString()}`)
        }
      } catch (error) {
        console.error('[TABLE_ORDER] Error ensuring customer:', error)
        // ادامه بده حتی اگر ثبت مشتری با خطا مواجه شد
      }
    }
    
    // 1. ایجاد سفارش میز (با status: 'pending' برای مدیریت موجودی)
    const tableOrderData = {
      orderNumber: orderNumber,
      tableNumber: String(tableNumber),
      customerId: finalCustomerId,
      customerName: customerName ? String(customerName) : null,
      customerPhone: customerPhone ? String(customerPhone) : null,
      items: processedItems,
      subtotal: calculatedSubtotal,
      tax: calculatedTax,
      serviceCharge: calculatedServiceCharge,
      discount: calculatedDiscount,
      total: calculatedTotal,
      orderTime: orderTime ? String(orderTime) : new Date().toISOString(),
      estimatedReadyTime: estimatedReady.toISOString(),
      status: 'pending', // ابتدا pending، بعد به preparing و سپس completed می‌شود
      notes: notes ? String(notes) : null,
      paymentMethod: String(paymentMethod || 'cash'),
      branchId: finalBranchId ? new ObjectId(finalBranchId) : null,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await db.collection('table_orders').insertOne(tableOrderData)
    const tableOrderId = result.insertedId.toString()

    // 2. ایجاد سفارش آشپزخانه (همیشه، برای همه سفارشات)
    const kitchenOrder = {
      orderId: tableOrderId,
      orderNumber: orderNumber,
      orderType: 'table-order',
      tableNumber: String(tableNumber),
      customerName: customerName || '',
      customerPhone: customerPhone || null,
      items: processedItems.map(item => ({
        id: item.menuItemId,
        menuItemId: item.menuItemId,
        name: item.name,
        quantity: item.quantity,
        category: item.category,
        preparationTime: item.preparationTime || 0,
        image: item.image || '/api/placeholder/60/60',
        status: 'pending',
        notes: item.notes || null
      })),
      orderTime: new Date().toISOString(),
      estimatedReadyTime: estimatedReady.toISOString(),
      status: 'pending',
      priority: 'normal',
      notes: notes || null,
      specialInstructions: notes || null,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    await db.collection('kitchen_orders').insertOne(kitchenOrder)

    // 3. ثبت در orders عمومی (برای گزارشات)
    const generalOrder = {
      orderNumber: orderNumber,
      orderType: 'table-order',
      tableNumber: String(tableNumber),
      customerId: finalCustomerId,
      customerName: customerName || '',
      customerPhone: customerPhone || null,
      items: processedItems.map(item => ({
        menuItemId: item.menuItemId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        total: item.total
      })),
      subtotal: calculatedSubtotal,
      tax: calculatedTax,
      serviceCharge: calculatedServiceCharge,
      discount: calculatedDiscount,
      total: calculatedTotal,
      orderTime: new Date(),
      estimatedTime: estimatedReady,
      status: 'pending',
      notes: notes || '',
      paymentMethod: paymentMethod || 'cash',
      priority: 'normal',
      branchId: finalBranchId ? new ObjectId(finalBranchId) : null,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    await db.collection('orders').insertOne(generalOrder)

    // 4. رزرو موجودی برای سفارش
    try {
      const reserveResult = await reserveInventoryForOrder(
        db,
        null, // بدون session (MongoDB standalone)
        tableOrderId,
        orderNumber,
        'table-order' as any,
        processedItems
      )

      if (!reserveResult.success) {
        console.warn('[TABLE_ORDER] Warning: Could not reserve inventory:', reserveResult.message)
      }
    } catch (error) {
      console.error('[TABLE_ORDER] Error reserving inventory:', error)
    }
    
    const tableOrder = await db.collection('table_orders').findOne({ _id: result.insertedId })

    return NextResponse.json({
      success: true,
      data: tableOrder,
      message: 'سفارش میز با موفقیت ثبت شد'
    })
  } catch (error) {
    console.error('Error creating table order:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در ثبت سفارش میز',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// PUT /api/table-orders - به‌روزرسانی سفارش میز (با مدیریت وضعیت و موجودی)
export async function PUT(request: NextRequest) {
  try {
    const db = await connectToDatabase()
    const body = await request.json()
    const { id, status: newStatus, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'شناسه سفارش میز اجباری است' },
        { status: 400 }
      )
    }

    // دریافت سفارش فعلی
    const currentTableOrder = await db.collection('table_orders').findOne({ 
      _id: new ObjectId(id) 
    })
    
    if (!currentTableOrder) {
      return NextResponse.json(
        { success: false, message: 'سفارش میز مورد نظر یافت نشد' },
        { status: 404 }
      )
    }

    const oldStatus = currentTableOrder.status
    const finalStatus = newStatus || oldStatus

    const updateFields: any = {
      ...updateData,
      updatedAt: new Date()
    }

    if (newStatus) {
      updateFields.status = finalStatus
    }

    // اگر وضعیت به 'preparing' تغییر کرد، سفارش آشپزخانه را به‌روزرسانی کن
    if (oldStatus !== 'preparing' && finalStatus === 'preparing') {
      await db.collection('kitchen_orders').updateOne(
        { orderId: id },
        { 
          $set: { 
            status: 'preparing', 
            updatedAt: new Date() 
          } 
        }
      )
    }

    // اگر وضعیت به 'ready' تغییر کرد، سفارش آشپزخانه را به‌روزرسانی کن
    if (oldStatus !== 'ready' && finalStatus === 'ready') {
      await db.collection('kitchen_orders').updateOne(
        { orderId: id },
        { 
          $set: { 
            status: 'ready', 
            updatedAt: new Date() 
          } 
        }
      )
    }

    // مصرف موجودی رزرو شده در وضعیت 'completed' یا 'paid'
    if ((oldStatus !== 'completed' && oldStatus !== 'paid') && 
        (finalStatus === 'completed' || finalStatus === 'paid')) {
      
      console.log(`[TABLE_ORDER] Order ${currentTableOrder.orderNumber}: Consuming reserved inventory`)
      
      const consumeResult = await consumeReservedInventory(
        db,
        null, // بدون session (MongoDB standalone)
        id,
        currentTableOrder.orderNumber || `TO-${id}`
      )

      if (!consumeResult.success) {
        console.warn(`[TABLE_ORDER] Warning: ${consumeResult.message}`)
      }

      // به‌روزرسانی باشگاه مشتریان (اگر customerId وجود دارد)
      if (currentTableOrder.customerId) {
        try {
          const loyaltiesCollection = db.collection('customer_loyalties')
          const loyalty = await loyaltiesCollection.findOne({ 
            customerId: currentTableOrder.customerId.toString()
          })

          if (loyalty) {
            const pointsToAdd = Math.floor((currentTableOrder.total || 0) / 1000)
            const newTotalPoints = (loyalty.totalPoints || 0) + pointsToAdd
            const newPointsEarned = (loyalty.pointsEarned || 0) + pointsToAdd
            const newTotalOrders = (loyalty.totalOrders || 0) + 1
            const newTotalSpent = (loyalty.totalSpent || 0) + (currentTableOrder.total || 0)

            let newTier = 'Bronze'
            if (newTotalPoints >= 1000) newTier = 'Platinum'
            else if (newTotalPoints >= 500) newTier = 'Gold'
            else if (newTotalPoints >= 100) newTier = 'Silver'

            await loyaltiesCollection.updateOne(
              { customerId: currentTableOrder.customerId.toString() },
              {
                $set: {
                  totalPoints: newTotalPoints,
                  pointsEarned: newPointsEarned,
                  totalOrders: newTotalOrders,
                  totalSpent: newTotalSpent,
                  currentTier: newTier,
                  lastOrderDate: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                }
              }
            )

            // به‌روزرسانی آمار مشتری در collection customers
            const customersCollection = db.collection('customers')
            await customersCollection.updateOne(
              { _id: new ObjectId(currentTableOrder.customerId.toString()) },
              {
                $set: {
                  totalOrders: newTotalOrders,
                  totalSpent: newTotalSpent,
                  lastOrderDate: new Date().toISOString(),
                  loyaltyPoints: newTotalPoints,
                  updatedAt: new Date()
                }
              }
            )

            console.log(`[TABLE_ORDER] ✅ Updated customer stats for ${currentTableOrder.customerId}`)
          }
        } catch (error) {
          console.error(`[TABLE_ORDER] Error updating customer stats:`, error)
          // ادامه بده حتی اگر به‌روزرسانی آمار مشتری با خطا مواجه شد
        }
      }
    }

    // آزاد کردن رزرو در وضعیت 'cancelled'
    if (oldStatus !== 'cancelled' && finalStatus === 'cancelled') {
      
      console.log(`[TABLE_ORDER] Order ${currentTableOrder.orderNumber}: Releasing reserved inventory`)
      
      const releaseResult = await releaseReservedInventory(
        db,
        null, // بدون session (MongoDB standalone)
        id,
        currentTableOrder.orderNumber || `TO-${id}`
      )

      if (!releaseResult.success) {
        console.warn(`[TABLE_ORDER] Warning: ${releaseResult.message}`)
      }
    }

    // به‌روزرسانی سفارش
    await db.collection('table_orders').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    )

    // به‌روزرسانی سفارش عمومی
    if (currentTableOrder.orderNumber) {
      await db.collection('orders').updateOne(
        { orderNumber: currentTableOrder.orderNumber },
        { $set: { status: finalStatus, updatedAt: new Date() } }
      )
    }

    const updatedTableOrder = await db.collection('table_orders').findOne({ _id: new ObjectId(id) })

    return NextResponse.json({
      success: true,
      data: updatedTableOrder,
      message: 'سفارش میز با موفقیت به‌روزرسانی شد'
    })
  } catch (error) {
    console.error('Error updating table order:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در به‌روزرسانی سفارش میز',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// DELETE /api/table-orders - حذف سفارش میز
export async function DELETE(request: NextRequest) {
  try {
    const db = await connectToDatabase()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'شناسه سفارش میز اجباری است' },
        { status: 400 }
      )
    }
    
    const result = await db.collection('table_orders').deleteOne({ _id: new ObjectId(id) })

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'سفارش میز مورد نظر یافت نشد' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'سفارش میز با موفقیت حذف شد'
    })
  } catch (error) {
    console.error('Error deleting table order:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در حذف سفارش میز',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
