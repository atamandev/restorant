import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'
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
  if (!client) {
    client = new MongoClient(MONGO_URI)
    await client.connect()
    db = client.db(DB_NAME)
  }
  return db
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

// تابع تولید شماره تراکنش
async function generateTransactionNumber(type: string = 'receipt'): Promise<string> {
  try {
    const db = await connectToDatabase()
    const collection = db.collection('receipts_payments')
    
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
    const prefix = type === 'receipt' ? 'REC' : 'PAY'
    return `${prefix}-${year}${month}${day}-${sequence}`
  } catch (error) {
    console.error('Error generating transaction number:', error)
    return `${type === 'receipt' ? 'REC' : 'PAY'}-${Date.now()}`
  }
}

// GET - دریافت لیست فروش‌های سریع
export async function GET(request: NextRequest) {
  try {
    const db = await connectToDatabase()
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const paymentMethod = searchParams.get('paymentMethod')
    
    const skip = (page - 1) * limit
    
    const query: any = {}
    if (search) {
      query.$or = [
        { customerName: { $regex: search, $options: 'i' } },
        { invoiceNumber: { $regex: search, $options: 'i' } }
      ]
    }
    if (paymentMethod) {
      query.paymentMethod = paymentMethod
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
    
    const sales = await db.collection('quick_sales')
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray()
    
    const total = await db.collection('quick_sales').countDocuments(query)
    
    return NextResponse.json({
      success: true,
      data: sales,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      message: 'لیست فروش‌های سریع با موفقیت دریافت شد'
    })
  } catch (error) {
    console.error('Error fetching quick sales:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در دریافت لیست فروش‌های سریع',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// POST - ایجاد فروش سریع جدید (با اتصال به تمام بخش‌ها)
export async function POST(request: NextRequest) {
  try {
    const db = await connectToDatabase()
    const body = await request.json()
    
    const { 
      branchId,
      cashRegisterId,
      cashierSessionId,
      customerId,
      customerName,
      items,
      subtotal,
      discount,
      discountAmount,
      tax,
      total,
      paymentMethod,
      invoiceNumber,
      notes
    } = body

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, message: 'لیست آیتم‌ها اجباری است' },
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
      console.log('[QUICK_SALES] Using default branch:', finalBranchId)
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

    // دریافت تنظیمات رستوران (برای مالیات)
    const settingsCollection = db.collection('restaurant_settings')
    let settings = await settingsCollection.findOne({ type: 'restaurant' })
    if (!settings) {
      // ایجاد تنظیمات پیش‌فرض
      settings = {
        financial: { taxRate: 9, serviceCharge: 10 }
      }
    }
    const taxRate = settings.financial?.taxRate || 9

    // دریافت اطلاعات منو برای هر آیتم و محاسبه موجودی
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
      inventoryItemId: string | null
      recipe?: Array<{
        ingredientId: string
        ingredientName?: string
        quantity: number
        unit?: string
      }>
    }
    
    const processedItems: ProcessedItem[] = []
    for (const item of items) {
      const menuItem = await menuItemsCollection.findOne({ 
        _id: new ObjectId(item.id || item.menuItemId)
      })
      
      if (!menuItem) {
        return NextResponse.json(
          { success: false, message: `آیتم منو با شناسه ${item.id} یافت نشد` },
          { status: 404 }
        )
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
      // بررسی موجودی (اگر inventoryItemId مستقیم وجود دارد - برای سازگاری)
      else if (menuItem.inventoryItemId) {
        const inventoryItem = await inventoryItemsCollection.findOne({ 
          _id: new ObjectId(menuItem.inventoryItemId)
        })
        
        if (inventoryItem && inventoryItem.currentStock !== undefined) {
          const requestedQty = item.quantity || 1
          if (inventoryItem.currentStock < requestedQty) {
            return NextResponse.json(
              { 
                success: false, 
                message: `موجودی ${menuItem.name} کافی نیست. موجودی: ${inventoryItem.currentStock}, درخواستی: ${requestedQty}` 
              },
              { status: 400 }
            )
          }
        }
      }

      const itemTotal = (menuItem.price || item.price) * (item.quantity || 1)
      const itemPrepTime = menuItem.preparationTime || item.preparationTime || 0

      processedItems.push({
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
      })
    }

    // محاسبه مجدد مقادیر بر اساس قیمت‌های واقعی
    const calculatedSubtotal = processedItems.reduce((sum, item) => sum + item.total, 0)
    const calculatedDiscountAmount = discountAmount || (discount ? (calculatedSubtotal * discount / 100) : 0)
    const calculatedTax = tax || ((calculatedSubtotal - calculatedDiscountAmount) * taxRate / 100)
    const calculatedTotal = calculatedSubtotal - calculatedDiscountAmount + calculatedTax

    // تولید شماره سفارش و فاکتور
    const orderNumber = `QS-${Date.now()}`
    const finalInvoiceNumber = invoiceNumber || await generateInvoiceNumber('sales')
    
    // محاسبه زمان آماده‌سازی
    const maxPreparationTime = Math.max(...processedItems.map(item => item.preparationTime || 0), 0)
    const estimatedReady = new Date(Date.now() + maxPreparationTime * 60 * 1000 + 10 * 60 * 1000)

    // 1. ایجاد فاکتور فروش
    const invoice = {
      invoiceNumber: finalInvoiceNumber,
      type: 'sales',
      customerId: customerId || null,
      customerName: customerName || '',
      customerPhone: null,
      customerAddress: null,
      date: new Date(),
      dueDate: null,
      items: processedItems.map(item => ({
        itemId: item.menuItemId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        total: item.total,
        category: item.category
      })),
      subtotal: calculatedSubtotal,
      taxAmount: calculatedTax,
      discountAmount: calculatedDiscountAmount,
      totalAmount: calculatedTotal,
      paidAmount: calculatedTotal, // فروش سریع معمولاً فوری پرداخت می‌شود
      status: 'paid',
      paymentMethod: paymentMethod || 'cash',
      notes: notes || '',
      branchId: new ObjectId(finalBranchId),
      cashRegisterId: cashRegisterId ? new ObjectId(cashRegisterId) : null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const invoiceResult = await db.collection('invoices').insertOne(invoice)
    const invoiceId = invoiceResult.insertedId

    // 2. ایجاد تراکنش دریافت (receipt)
    const transactionNumber = await generateTransactionNumber('receipt')
    const receipt = {
      transactionNumber,
      type: 'receipt',
      amount: calculatedTotal,
      method: paymentMethod || 'cash',
      status: 'completed',
      personId: customerId || null,
      personName: customerName || '',
      personType: customerId ? 'customer' : null,
      reference: 'invoice',
      referenceId: invoiceId.toString(),
      description: `دریافت بابت فاکتور ${finalInvoiceNumber}`,
      date: new Date(),
      bankAccountId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    await db.collection('receipts_payments').insertOne(receipt)

    // 3. ایجاد سفارش سریع (با status: 'pending' برای مدیریت موجودی)
    const quickSaleData = {
      orderNumber: orderNumber,
      invoiceId: invoiceId.toString(),
      branchId: finalBranchId,
      cashRegisterId: cashRegisterId || null,
      cashierSessionId: cashierSessionId || null,
      customerId: customerId || null,
      customerName: customerName || null,
      items: processedItems,
      subtotal: calculatedSubtotal,
      discount: discount || 0,
      discountAmount: calculatedDiscountAmount,
      tax: calculatedTax,
      total: calculatedTotal,
      paymentMethod: paymentMethod || 'cash',
      invoiceNumber: finalInvoiceNumber,
      status: 'pending', // ابتدا pending، بعد به preparing و سپس completed می‌شود
      estimatedReadyTime: estimatedReady.toISOString(),
      notes: notes || null,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const quickSaleResult = await db.collection('quick_sales').insertOne(quickSaleData)
    const quickSaleId = quickSaleResult.insertedId.toString()

    // 4. ایجاد سفارش آشپزخانه (همیشه، برای همه سفارشات)
    const kitchenOrder = {
      orderId: quickSaleId,
      orderNumber: orderNumber,
      orderType: 'quick-sale',
      customerName: customerName || '',
      customerPhone: null,
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

    // 5. ثبت در orders عمومی (برای گزارشات)
    const generalOrder = {
      orderNumber: orderNumber,
      orderType: 'quick-sale',
      customerId: customerId || null,
      customerName: customerName || '',
      customerPhone: null,
      items: processedItems.map(item => ({
        menuItemId: item.menuItemId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        total: item.total
      })),
      subtotal: calculatedSubtotal,
      tax: calculatedTax,
      discount: calculatedDiscountAmount,
      total: calculatedTotal,
      orderTime: new Date(),
      estimatedTime: estimatedReady,
      status: 'pending',
      notes: notes || '',
      paymentMethod: paymentMethod || 'cash',
      priority: 'normal',
      branchId: new ObjectId(finalBranchId),
      createdAt: new Date(),
      updatedAt: new Date()
    }

    await db.collection('orders').insertOne(generalOrder)

    // 6. رزرو موجودی برای سفارش
    try {
      const reserveResult = await reserveInventoryForOrder(
        db,
        null, // بدون session (MongoDB standalone)
        quickSaleId,
        orderNumber,
        'quick-sale' as any,
        processedItems
      )

      if (!reserveResult.success) {
        console.warn('[QUICK_SALE] Warning: Could not reserve inventory:', reserveResult.message)
        // ادامه می‌دهیم حتی اگر رزرو با خطا مواجه شد
      }
    } catch (error) {
      console.error('[QUICK_SALE] Error reserving inventory:', error)
      // ادامه می‌دهیم حتی اگر رزرو با خطا مواجه شد
    }

    // 7. به‌روزرسانی باشگاه مشتریان (اگر customerId وجود دارد)
    if (customerId) {
      const loyaltiesCollection = db.collection('customer_loyalties')
      const loyalty = await loyaltiesCollection.findOne({ 
        customerId: customerId 
      })

      if (loyalty) {
        // محاسبه امتیاز (مثلاً 1 امتیاز برای هر 1000 تومان)
        const pointsToAdd = Math.floor(calculatedTotal / 1000)
        const newTotalPoints = (loyalty.totalPoints || 0) + pointsToAdd
        const newPointsEarned = (loyalty.pointsEarned || 0) + pointsToAdd
        const newTotalOrders = (loyalty.totalOrders || 0) + 1
        const newTotalSpent = (loyalty.totalSpent || 0) + calculatedTotal

        // تعیین tier جدید (Bronze < 100, Silver < 500, Gold < 1000, Platinum >= 1000)
        let newTier = 'Bronze'
        if (newTotalPoints >= 1000) newTier = 'Platinum'
        else if (newTotalPoints >= 500) newTier = 'Gold'
        else if (newTotalPoints >= 100) newTier = 'Silver'

        await loyaltiesCollection.updateOne(
          { customerId: customerId },
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
      }
    }

    // 8. به‌روزرسانی جلسه صندوق (اگر cashierSessionId وجود دارد)
    if (cashierSessionId) {
      const sessionsCollection = db.collection('cashier_sessions')
      await sessionsCollection.updateOne(
        { _id: new ObjectId(cashierSessionId), status: 'open' },
        {
          $inc: {
            totalSales: calculatedTotal,
            totalTransactions: 1,
            [paymentMethod === 'cash' ? 'cashSales' : 
             paymentMethod === 'card' ? 'cardSales' : 'creditSales']: calculatedTotal,
            discounts: calculatedDiscountAmount,
            taxes: calculatedTax
          }
        }
      )
    }

    // دریافت فروش ثبت شده
    const quickSale = await db.collection('quick_sales').findOne({ 
      _id: quickSaleResult.insertedId
    })

    return NextResponse.json({
      success: true,
      data: quickSale,
      message: 'فروش سریع با موفقیت ثبت شد'
    })
  } catch (error) {
    console.error('Error creating quick sale:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در ثبت فروش سریع',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// PUT - به‌روزرسانی فروش سریع (با مدیریت وضعیت و موجودی)
export async function PUT(request: NextRequest) {
  try {
    const db = await connectToDatabase()
    const body = await request.json()
    const { id, status: newStatus, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'شناسه فروش سریع اجباری است' },
        { status: 400 }
      )
    }

    // دریافت سفارش فعلی
    const currentQuickSale = await db.collection('quick_sales').findOne({ 
      _id: new ObjectId(id) 
    })
    
    if (!currentQuickSale) {
      return NextResponse.json(
        { success: false, message: 'فروش سریع مورد نظر یافت نشد' },
        { status: 404 }
      )
    }

    const oldStatus = currentQuickSale.status
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
      
      console.log(`[QUICK_SALE] Order ${currentQuickSale.orderNumber}: Consuming reserved inventory`)
      
      const consumeResult = await consumeReservedInventory(
        db,
        null, // بدون session (MongoDB standalone)
        id,
        currentQuickSale.orderNumber || `QS-${id}`
      )

      if (!consumeResult.success) {
        console.warn(`[QUICK_SALE] Warning: ${consumeResult.message}`)
        // ادامه می‌دهیم حتی اگر مصرف موجودی با خطا مواجه شد
      }
    }

    // آزاد کردن رزرو در وضعیت 'cancelled'
    if (oldStatus !== 'cancelled' && finalStatus === 'cancelled') {
      
      console.log(`[QUICK_SALE] Order ${currentQuickSale.orderNumber}: Releasing reserved inventory`)
      
      const releaseResult = await releaseReservedInventory(
        db,
        null, // بدون session (MongoDB standalone)
        id,
        currentQuickSale.orderNumber || `QS-${id}`
      )

      if (!releaseResult.success) {
        console.warn(`[QUICK_SALE] Warning: ${releaseResult.message}`)
      }
    }

    // به‌روزرسانی سفارش
    await db.collection('quick_sales').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    )

    // به‌روزرسانی سفارش عمومی
    if (currentQuickSale.orderNumber) {
      await db.collection('orders').updateOne(
        { orderNumber: currentQuickSale.orderNumber },
        { $set: { status: finalStatus, updatedAt: new Date() } }
      )
    }

    const updatedQuickSale = await db.collection('quick_sales').findOne({ _id: new ObjectId(id) })

    return NextResponse.json({
      success: true,
      data: updatedQuickSale,
      message: 'فروش سریع با موفقیت به‌روزرسانی شد'
    })
  } catch (error) {
    console.error('Error updating quick sale:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در به‌روزرسانی فروش سریع',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// DELETE - حذف فروش سریع
export async function DELETE(request: NextRequest) {
  try {
    const db = await connectToDatabase()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'شناسه فروش سریع اجباری است' },
        { status: 400 }
      )
    }
    
    const result = await db.collection('quick_sales').deleteOne({ _id: new ObjectId(id) })

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'فروش سریع مورد نظر یافت نشد' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'فروش سریع با موفقیت حذف شد'
    })
  } catch (error) {
    console.error('Error deleting quick sale:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در حذف فروش سریع',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
