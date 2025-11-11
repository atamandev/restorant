import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'
import { ensureCustomerExists } from '../customers/helpers'
import { 
  reserveInventoryForOrder, 
  consumeReservedInventory, 
  releaseReservedInventory 
} from '../inventory-reservations/helpers'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://restorenUser:1234@localhost:27017/restoren'
const DB_NAME = 'restoren'

let client: MongoClient
let db: any

async function connectToDatabase() {
  try {
    if (!client) {
      client = new MongoClient(MONGO_URI)
      await client.connect()
      db = client.db(DB_NAME)
    } else if (!db) {
      db = client.db(DB_NAME)
    }
    
    // Test connection
    if (db) {
      try {
        await db.admin().ping()
      } catch (pingError) {
        console.warn('MongoDB ping failed, but continuing:', pingError)
      }
    }
    
    if (!db) {
      throw new Error('Database connection failed: db is null')
    }
    
    return db
  } catch (error) {
    console.error('Database connection error:', error)
    // Reset connection on error
    if (client) {
      try {
        await client.close()
      } catch (e) {
        // Ignore close errors
      }
      client = null as any
    }
    db = null
    throw error
  }
}

// تابع تولید شماره سفارش
async function generateOrderNumber(orderType: string = 'dine-in'): Promise<string> {
  try {
    const db = await connectToDatabase()
    const collection = db.collection('dine_in_orders')
    
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
    return `DI-${year}${month}${day}-${sequence}`
  } catch (error) {
    console.error('Error generating order number:', error)
    return `DI-${Date.now()}`
  }
}

// تابع تولید شماره فاکتور
async function generateInvoiceNumber(type: string = 'sales'): Promise<string> {
  try {
    const db = await connectToDatabase()
    const collection = db.collection('invoices')
    
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    
    const startOfDay = new Date(year, today.getMonth(), today.getDate())
    const endOfDay = new Date(year, today.getMonth(), today.getDate() + 1)
    
    const count = await collection.countDocuments({
      type: type,
      createdAt: {
        $gte: startOfDay.toISOString(),
        $lt: endOfDay.toISOString()
      }
    })
    
    const sequence = String(count + 1).padStart(4, '0')
    return `SINV-${year}${month}${day}-${sequence}`
  } catch (error) {
    console.error('Error generating invoice number:', error)
    return `SINV-${Date.now()}`
  }
}

// GET - دریافت لیست سفارشات حضوری
export async function GET(request: NextRequest) {
  try {
    const db = await connectToDatabase()
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const status = searchParams.get('status')
    const tableNumber = searchParams.get('tableNumber')
    const date = searchParams.get('date')
    const branchId = searchParams.get('branchId')
    
    const skip = (page - 1) * limit
    
    const query: any = {}
    if (status) {
      query.status = status
    }
    if (tableNumber) {
      query.tableNumber = tableNumber
    }
    if (branchId) {
      query.branchId = new ObjectId(branchId)
    }
    if (date) {
      const startOfDay = new Date(date)
      const endOfDay = new Date(date)
      endOfDay.setHours(23, 59, 59, 999)
      query.createdAt = {
        $gte: startOfDay,
        $lte: endOfDay
      }
    }
    
    const orders = await db.collection('dine_in_orders')
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray()
    
    const total = await db.collection('dine_in_orders').countDocuments(query)
    
    return NextResponse.json({
      success: true,
      data: orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      message: 'لیست سفارشات حضوری با موفقیت دریافت شد'
    })
  } catch (error) {
    console.error('Error fetching dine-in orders:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در دریافت لیست سفارشات حضوری',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// POST - ایجاد سفارش حضوری جدید (با اتصال به تمام بخش‌ها)
export async function POST(request: NextRequest) {
  try {
    const db = await connectToDatabase()
    const body = await request.json()
    
    console.log('Received request body:', JSON.stringify(body, null, 2))
    
    const { 
      orderNumber,
      branchId,
      cashRegisterId,
      tableNumber,
      customerId,
      customerName,
      customerPhone,
      items,
      subtotal,
      tax,
      serviceCharge,
      discount,
      discountAmount,
      total,
      estimatedReadyTime,
      status,
      notes,
      paymentMethod,
      priority
    } = body

    // Validate required fields
    if (!tableNumber || !items || !Array.isArray(items) || items.length === 0) {
      console.error('Validation failed:', { tableNumber, itemsCount: items?.length, items })
      return NextResponse.json(
        { success: false, message: 'شماره میز و لیست آیتم‌ها اجباری است' },
        { status: 400 }
      )
    }

    // اگر branchId ارائه نشده، از اولین شعبه فعال استفاده کن
    let finalBranchId = branchId
    if (!finalBranchId) {
      const defaultBranch = await db.collection('branches').findOne({ isActive: true })
      if (!defaultBranch) {
        return NextResponse.json(
          { success: false, message: 'هیچ شعبه فعالی یافت نشد. لطفاً ابتدا یک شعبه ایجاد کنید.' },
          { status: 400 }
        )
      }
      finalBranchId = defaultBranch._id.toString()
    }

    // بررسی وجود شعبه
    let branch
    try {
      branch = await db.collection('branches').findOne({ 
        _id: new ObjectId(finalBranchId),
        isActive: true
      })
    } catch (e) {
      return NextResponse.json(
        { success: false, message: 'شناسه شعبه نامعتبر است' },
        { status: 400 }
      )
    }
    
    if (!branch) {
      return NextResponse.json(
        { success: false, message: 'شعبه یافت نشد یا غیرفعال است' },
        { status: 404 }
      )
    }

    // بررسی وجود صندوق (اگر ارائه شده)
    if (cashRegisterId) {
      const cashRegister = await db.collection('cash_registers').findOne({ 
        _id: new ObjectId(cashRegisterId),
        branchId: new ObjectId(finalBranchId),
        isActive: true
      })
      if (!cashRegister) {
        return NextResponse.json(
          { success: false, message: 'صندوق یافت نشد یا به این شعبه تعلق ندارد' },
          { status: 404 }
        )
      }
    }

    // ثبت یا به‌روزرسانی مشتری بر اساس اطلاعات سفارش
    let finalCustomerId = customerId
    if (customerPhone || customerName) {
      // اطمینان از initialize شدن client برای session
      if (!client) {
        await connectToDatabase()
      }
      const session = client.startSession()
      try {
        const ensuredCustomerId = await ensureCustomerExists(
          db,
          session,
          customerId,
          customerName,
          customerPhone,
          null // address برای dine-in معمولاً null است
        )
        if (ensuredCustomerId) {
          finalCustomerId = ensuredCustomerId.toString()
        }
      } catch (error) {
        console.error('[DINE_IN] Error ensuring customer:', error)
        // ادامه بده حتی اگر ثبت مشتری با خطا مواجه شد
      } finally {
        await session.endSession()
      }
    }

    // دریافت تنظیمات رستوران (برای مالیات و service charge)
    const settingsCollection = db.collection('restaurant_settings')
    let settings = await settingsCollection.findOne({ type: 'restaurant' })
    if (!settings) {
      settings = {
        financial: { taxRate: 9, serviceCharge: 10 }
      }
    }
    const taxRate = settings.financial?.taxRate || 9
    const serviceChargeRate = settings.financial?.serviceCharge || 10

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
        return NextResponse.json(
          { success: false, message: `آیتم منو شناسه ندارد: ${JSON.stringify(item)}` },
          { status: 400 }
        )
      }
      
      let menuItem
      try {
        menuItem = await menuItemsCollection.findOne({ 
          _id: new ObjectId(itemId)
        })
      } catch (e) {
        console.error('Invalid ObjectId:', itemId, e)
        return NextResponse.json(
          { success: false, message: `شناسه آیتم نامعتبر است: ${itemId}` },
          { status: 400 }
        )
      }
      
      if (!menuItem) {
        console.error('Menu item not found:', itemId)
        return NextResponse.json(
          { success: false, message: `آیتم منو با شناسه ${itemId} یافت نشد` },
          { status: 404 }
        )
      }

      // بررسی موجودی مواد اولیه بر اساس recipe (قبل از ثبت سفارش)
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

      const processedItem = {
        menuItemId: menuItem._id.toString(),
        name: menuItem.name,
        price: menuItem.price || item.price, // قیمت همیشه از menu-item گرفته می‌شود
        quantity: item.quantity || 1,
        total: itemTotal,
        category: menuItem.category,
        image: menuItem.image || item.image || '',
        preparationTime: itemPrepTime,
        description: menuItem.description || item.description || '',
        notes: item.notes || null,
        inventoryItemId: menuItem.inventoryItemId || null,
        recipe: menuItem.recipe || [] // اضافه کردن recipe برای کاهش موجودی مواد اولیه
      }
      
      console.log(`[ORDER CREATE] Item ${processedItem.name} - Recipe:`, processedItem.recipe ? `${processedItem.recipe.length} ingredients` : 'none', processedItem.recipe)
      
      processedItems.push(processedItem)
    }

    // محاسبه مجدد مقادیر بر اساس قیمت‌های واقعی
    const calculatedSubtotal = processedItems.reduce((sum, item) => sum + item.total, 0)
    
    // محاسبه تخفیف مشتریان طلایی
    const { calculateGoldenCustomerDiscount } = await import('../customers/helpers')
    const goldenDiscount = await calculateGoldenCustomerDiscount(
      db,
      calculatedSubtotal,
      finalCustomerId,
      customerPhone
    )
    
    // محاسبه تخفیف کل (تخفیف دستی + تخفیف مشتریان طلایی)
    const manualDiscountAmount = discountAmount || (discount ? (calculatedSubtotal * discount / 100) : 0)
    const totalDiscountAmount = manualDiscountAmount + goldenDiscount.discountAmount
    const totalDiscountPercent = goldenDiscount.discountPercent > 0 
      ? (discount || 0) + goldenDiscount.discountPercent 
      : (discount || 0)
    
    const calculatedServiceCharge = serviceCharge || (calculatedSubtotal * serviceChargeRate / 100)
    const calculatedTax = tax || ((calculatedSubtotal + calculatedServiceCharge - totalDiscountAmount) * taxRate / 100)
    const calculatedTotal = calculatedSubtotal + calculatedServiceCharge - totalDiscountAmount + calculatedTax

    // تولید شماره سفارش
    const finalOrderNumber = orderNumber || await generateOrderNumber('dine-in')
    
    // محاسبه زمان آماده‌سازی (زمان فعلی + بیشترین زمان پخت + 10 دقیقه بافر)
    const estimatedReady = estimatedReadyTime || new Date(Date.now() + maxPreparationTime * 60 * 1000 + 10 * 60 * 1000)

    // اطمینان از اتصال به دیتابیس و شروع تراکنش
    await connectToDatabase()
    if (!client) {
      throw new Error('MongoDB client is not initialized')
    }
    
    // اجرای عملیات (با یا بدون تراکنش)
    const executeOperations = async (session?: any) => {
      const sessionOptions = session ? { session } : {}
        // 1. ایجاد سفارش حضوری
        const orderData = {
          orderNumber: finalOrderNumber,
          branchId: new ObjectId(finalBranchId),
          cashRegisterId: cashRegisterId ? new ObjectId(cashRegisterId) : null,
          tableNumber: String(tableNumber),
          customerId: finalCustomerId ? new ObjectId(finalCustomerId) : null,
          customerName: customerName || '',
          customerPhone: customerPhone || null,
          items: processedItems,
          subtotal: calculatedSubtotal,
          tax: calculatedTax,
          serviceCharge: calculatedServiceCharge,
          discount: totalDiscountPercent,
          discountAmount: totalDiscountAmount,
          goldenCustomerDiscount: goldenDiscount.discountAmount > 0 ? {
            percent: goldenDiscount.discountPercent,
            amount: goldenDiscount.discountAmount
          } : null,
          total: calculatedTotal,
          estimatedReadyTime: estimatedReady instanceof Date ? estimatedReady.toISOString() : estimatedReady,
          status: status || 'pending',
          notes: notes || null,
          paymentMethod: paymentMethod || 'cash',
          priority: priority || 'normal',
          createdAt: new Date(),
          updatedAt: new Date()
        }

        const orderResult = await db.collection('dine_in_orders').insertOne(orderData, sessionOptions)
        const orderId = orderResult.insertedId

        // 2. ایجاد سفارش آشپزخانه (همیشه، برای همه سفارشات)
        const kitchenOrder = {
          orderId: orderId.toString(),
          orderNumber: finalOrderNumber,
          orderType: 'dine-in',
          tableNumber: String(tableNumber),
          customerName: customerName || '',
          customerPhone: customerPhone || null,
          items: processedItems.map(item => ({
            id: item.menuItemId, // اضافه کردن id برای راحتی
            menuItemId: item.menuItemId,
            name: item.name,
            quantity: item.quantity,
            category: item.category,
            preparationTime: item.preparationTime || 0,
            image: item.image || '/api/placeholder/60/60',
            status: 'pending', // وضعیت اولیه هر آیتم
            notes: item.notes || null
          })),
          orderTime: new Date().toISOString(),
          estimatedReadyTime: estimatedReady instanceof Date ? estimatedReady.toISOString() : estimatedReady,
          status: 'pending', // وضعیت کلی سفارش
          priority: priority || 'normal',
          notes: notes || null,
          specialInstructions: notes || null, // برای سازگاری با frontend
          createdAt: new Date(),
          updatedAt: new Date()
        }

        await db.collection('kitchen_orders').insertOne(kitchenOrder, sessionOptions)

        // 3. ثبت در orders عمومی (برای گزارشات)
        const generalOrder = {
          orderNumber: finalOrderNumber,
          orderType: 'dine-in',
          tableNumber: String(tableNumber),
          customerId: finalCustomerId ? new ObjectId(finalCustomerId) : null,
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
          discount: totalDiscountAmount,
          total: calculatedTotal,
          orderTime: new Date(),
          estimatedTime: estimatedReady instanceof Date ? estimatedReady : new Date(estimatedReady),
          status: status || 'pending',
          notes: notes || '',
          paymentMethod: paymentMethod || 'cash',
          priority: priority || 'normal',
          branchId: new ObjectId(finalBranchId),
          createdAt: new Date(),
          updatedAt: new Date()
        }

        await db.collection('orders').insertOne(generalOrder, sessionOptions)
      }
    
    // تلاش برای استفاده از تراکنش، در صورت خطا بدون تراکنش اجرا کن
    const session = client.startSession()
    try {
      await session.withTransaction(async () => {
        await executeOperations(session)
      })
    } catch (transactionError: any) {
      console.warn('Transaction failed, proceeding without transaction:', transactionError?.message)
      // اگر تراکنش پشتیبانی نمی‌شود، بدون تراکنش اجرا کن
      if (transactionError?.errorLabels?.includes('TransientTransactionError') || 
          transactionError?.message?.includes('replica')) {
        await executeOperations()
      } else {
        throw transactionError
      }
    } finally {
      await session.endSession()
    }

    // دریافت سفارش ثبت شده
    const order = await db.collection('dine_in_orders').findOne({ 
      orderNumber: finalOrderNumber 
    })

    return NextResponse.json({
      success: true,
      data: order,
      message: 'سفارش حضوری با موفقیت ثبت شد'
    })
  } catch (error) {
    console.error('Error creating dine-in order:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined
    console.error('Error details:', { errorMessage, errorStack })
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در ثبت سفارش حضوری',
        error: errorMessage,
        ...(process.env.NODE_ENV === 'development' && { stack: errorStack })
      },
      { status: 500 }
    )
  }
}

// PUT - به‌روزرسانی سفارش حضوری (با مدیریت وضعیت و اتصال به بخش‌ها)
export async function PUT(request: NextRequest) {
  try {
    const db = await connectToDatabase()
    const body = await request.json()
    const { id, status: newStatus, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'شناسه سفارش حضوری اجباری است' },
        { status: 400 }
      )
    }

    // دریافت سفارش فعلی
    const currentOrder = await db.collection('dine_in_orders').findOne({ 
      _id: new ObjectId(id) 
    })
    
    if (!currentOrder) {
      return NextResponse.json(
        { success: false, message: 'سفارش حضوری مورد نظر یافت نشد' },
        { status: 404 }
      )
    }

    const oldStatus = currentOrder.status
    const finalStatus = newStatus || oldStatus

    // اطمینان از اتصال به دیتابیس و شروع تراکنش
    if (!client) {
      await connectToDatabase()
    }
    const session = client.startSession()
    
    try {
      await session.withTransaction(async () => {
        const updateFields: any = {
          ...updateData,
          updatedAt: new Date()
        }

        if (newStatus) {
          updateFields.status = finalStatus
        }

        // اگر وضعیت به 'preparing' تغییر کرد، سفارش آشپزخانه ایجاد کن
        if (oldStatus !== 'preparing' && finalStatus === 'preparing') {
          const kitchenOrder = {
            orderId: id,
            orderNumber: currentOrder.orderNumber,
            orderType: 'dine-in',
            tableNumber: currentOrder.tableNumber,
            customerName: currentOrder.customerName || '',
            items: (currentOrder.items || []).map((item: any) => ({
              menuItemId: item.menuItemId || item.id,
              name: item.name,
              quantity: item.quantity,
              category: item.category,
              preparationTime: item.preparationTime || 0,
              notes: item.notes
            })),
            estimatedReadyTime: currentOrder.estimatedReadyTime,
            status: 'preparing',
            priority: currentOrder.priority || 'normal',
            createdAt: new Date(),
            updatedAt: new Date()
          }

          // بررسی اینکه آیا سفارش آشپزخانه از قبل وجود دارد
          const existingKitchenOrder = await db.collection('kitchen_orders').findOne({
            orderId: id
          }, { session })

          if (!existingKitchenOrder) {
            await db.collection('kitchen_orders').insertOne(kitchenOrder, { session })
          } else {
            await db.collection('kitchen_orders').updateOne(
              { orderId: id },
              { $set: { status: 'preparing', updatedAt: new Date() } },
              { session }
            )
          }
        }

        // اگر وضعیت به 'ready' تغییر کرد، سفارش آشپزخانه را به‌روزرسانی کن
        if (oldStatus !== 'ready' && finalStatus === 'ready') {
          await db.collection('kitchen_orders').updateOne(
            { orderId: id },
            { $set: { status: 'ready', updatedAt: new Date() } },
            { session }
          )
        }

        // 2. مصرف موجودی رزرو شده در وضعیت 'completed' یا 'paid'
        if ((oldStatus !== 'completed' && oldStatus !== 'paid') && 
            (finalStatus === 'completed' || finalStatus === 'paid')) {
          
          console.log(`[CONSUME] Order ${currentOrder.orderNumber}: Consuming reserved inventory`)
          
          const consumeResult = await consumeReservedInventory(
            db,
            session,
            id,
            currentOrder.orderNumber
          )

          if (!consumeResult.success) {
            throw new Error(consumeResult.message || 'خطا در مصرف موجودی رزرو شده')
          }
        }

        // 3. آزاد کردن رزرو در وضعیت 'cancelled'
        if (oldStatus !== 'cancelled' && finalStatus === 'cancelled') {
          
          console.log(`[RELEASE] Order ${currentOrder.orderNumber}: Releasing reserved inventory`)
          
          const releaseResult = await releaseReservedInventory(
            db,
            session,
            id,
            currentOrder.orderNumber
          )

          if (!releaseResult.success) {
            console.warn(`[RELEASE] Warning: ${releaseResult.message}`)
          }
        }

        // 2. ایجاد فاکتور فروش (اگر پرداخت شده)
        if (finalStatus === 'paid' || finalStatus === 'completed') {
          // محاسبه سود
          const { calculateOrderProfit } = await import('@/lib/profit-helpers')
          const profitData = await calculateOrderProfit(
            db,
            currentOrder.items || [],
            currentOrder.discountAmount || currentOrder.discount || 0
          )
          
          const invoiceNumber = await generateInvoiceNumber('sales')
          const invoice = {
            invoiceNumber,
            type: 'sales',
            customerId: currentOrder.customerId || null,
            customerName: currentOrder.customerName || '',
            customerPhone: currentOrder.customerPhone || null,
            date: new Date(),
            dueDate: null,
            items: (currentOrder.items || []).map((item: any, index: number) => {
              const itemProfit = profitData.itemProfits[index] || { profit: 0, ingredientCost: 0, discount: 0 }
              return {
                itemId: item.menuItemId || item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                total: item.total,
                category: item.category,
                profit: itemProfit.profit,
                ingredientCost: itemProfit.ingredientCost,
                discount: itemProfit.discount
              }
            }),
            subtotal: currentOrder.subtotal || 0,
            taxAmount: currentOrder.tax || 0,
            discountAmount: currentOrder.discountAmount || currentOrder.discount || 0,
            totalAmount: currentOrder.total || 0,
            paidAmount: currentOrder.total || 0,
            profit: profitData.totalProfit,
            costOfGoods: profitData.itemProfits.reduce((sum, item) => sum + item.ingredientCost, 0),
            status: 'paid',
            paymentMethod: currentOrder.paymentMethod || 'cash',
            notes: `سفارش حضوری میز ${currentOrder.tableNumber} - ${currentOrder.orderNumber}`,
            branchId: currentOrder.branchId,
            cashRegisterId: currentOrder.cashRegisterId,
            orderId: id,
            orderNumber: currentOrder.orderNumber,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }

          await db.collection('invoices').insertOne(invoice, { session })
          
          // ذخیره سود در سفارش
          updateFields.profit = profitData.totalProfit
          updateFields.costOfGoods = profitData.itemProfits.reduce((sum, item) => sum + item.ingredientCost, 0)
          updateFields.itemProfits = profitData.itemProfits

          // به‌روزرسانی باشگاه مشتریان (اگر customerId وجود دارد)
          if (currentOrder.customerId) {
            const loyaltiesCollection = db.collection('customer_loyalties')
            const loyalty = await loyaltiesCollection.findOne({ 
              customerId: currentOrder.customerId.toString()
            }, { session })

            if (loyalty) {
              const pointsToAdd = Math.floor((currentOrder.total || 0) / 1000)
              const newTotalPoints = (loyalty.totalPoints || 0) + pointsToAdd
              const newPointsEarned = (loyalty.pointsEarned || 0) + pointsToAdd
              const newTotalOrders = (loyalty.totalOrders || 0) + 1
              const newTotalSpent = (loyalty.totalSpent || 0) + (currentOrder.total || 0)

              let newTier = 'Bronze'
              if (newTotalPoints >= 1000) newTier = 'Platinum'
              else if (newTotalPoints >= 500) newTier = 'Gold'
              else if (newTotalPoints >= 100) newTier = 'Silver'

              await loyaltiesCollection.updateOne(
                { customerId: currentOrder.customerId.toString() },
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
                },
                { session }
              )
            }
          }
        }

        // به‌روزرسانی سفارش
        await db.collection('dine_in_orders').updateOne(
          { _id: new ObjectId(id) },
          { $set: updateFields },
          { session }
        )

        // به‌روزرسانی سفارش عمومی
        await db.collection('orders').updateOne(
          { orderNumber: currentOrder.orderNumber },
          { $set: { status: finalStatus, updatedAt: new Date() } },
          { session }
        )
      })
    } finally {
      await session.endSession()
    }

    const updatedOrder = await db.collection('dine_in_orders').findOne({ _id: new ObjectId(id) })

    return NextResponse.json({
      success: true,
      data: updatedOrder,
      message: 'سفارش حضوری با موفقیت به‌روزرسانی شد'
    })
  } catch (error) {
    console.error('Error updating dine-in order:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در به‌روزرسانی سفارش حضوری',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// DELETE - حذف سفارش حضوری
export async function DELETE(request: NextRequest) {
  try {
    const db = await connectToDatabase()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'شناسه سفارش حضوری اجباری است' },
        { status: 400 }
      )
    }
    
    const result = await db.collection('dine_in_orders').deleteOne({ _id: new ObjectId(id) })

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'سفارش حضوری مورد نظر یافت نشد' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'سفارش حضوری با موفقیت حذف شد'
    })
  } catch (error) {
    console.error('Error deleting dine-in order:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در حذف سفارش حضوری',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
