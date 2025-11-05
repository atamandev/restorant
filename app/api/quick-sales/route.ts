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

      processedItems.push({
        menuItemId: menuItem._id.toString(),
        name: menuItem.name,
        price: menuItem.price || item.price, // قیمت همیشه از menu-item گرفته می‌شود
        quantity: item.quantity || 1,
        total: (menuItem.price || item.price) * (item.quantity || 1),
        category: menuItem.category,
        inventoryItemId: menuItem.inventoryItemId || null,
        recipe: menuItem.recipe || [] // اضافه کردن recipe برای کاهش موجودی مواد اولیه
      })
    }

    // محاسبه مجدد مقادیر بر اساس قیمت‌های واقعی
    const calculatedSubtotal = processedItems.reduce((sum, item) => sum + item.total, 0)
    const calculatedDiscountAmount = discountAmount || (discount ? (calculatedSubtotal * discount / 100) : 0)
    const calculatedTax = tax || ((calculatedSubtotal - calculatedDiscountAmount) * taxRate / 100)
    const calculatedTotal = calculatedSubtotal - calculatedDiscountAmount + calculatedTax

    // تولید شماره فاکتور
    const finalInvoiceNumber = invoiceNumber || await generateInvoiceNumber('sales')

    // شروع تراکنش (استفاده از session برای atomicity)
    const session = client.startSession()
    
    try {
      await session.withTransaction(async () => {
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

        const invoiceResult = await db.collection('invoices').insertOne(invoice, { session })
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

        await db.collection('receipts_payments').insertOne(receipt, { session })

        // 3. کاهش موجودی انبار بر اساس recipe (مواد اولیه)
        const ledgerCollection = db.collection('item_ledger')
        
        for (const item of processedItems) {
          const menuItemQuantity = item.quantity || 1
          
          // اگر recipe وجود دارد، از مواد اولیه موجودی کم کن
          if (item.recipe && Array.isArray(item.recipe) && item.recipe.length > 0) {
            for (const ingredient of item.recipe) {
              if (ingredient.ingredientId) {
                const ingredientId = ingredient.ingredientId
                const requiredQuantity = (ingredient.quantity || 0) * menuItemQuantity // مقدار مورد نیاز × تعداد سفارش
                
                // دریافت اطلاعات موجودی ماده اولیه
                const inventoryItem = await inventoryItemsCollection.findOne({ 
                  _id: new ObjectId(ingredientId)
                }, { session })
                
                if (inventoryItem) {
                  // بررسی موجودی کافی
                  const lastEntry = await ledgerCollection
                    .findOne(
                      { itemId: ingredientId },
                      { sort: { date: -1, createdAt: -1 }, session }
                    )

                  const lastBalance = lastEntry?.runningBalance || inventoryItem.currentStock || 0
                  
                  if (lastBalance < requiredQuantity) {
                    throw new Error(
                      `موجودی ${inventoryItem.name} برای ${item.name} کافی نیست. موجودی: ${lastBalance}, مورد نیاز: ${requiredQuantity}`
                    )
                  }

                  const lastValue = lastEntry?.runningValue || (inventoryItem.totalValue || 0)
                  const unitPrice = inventoryItem.unitPrice || 0
                  const newBalance = lastBalance - requiredQuantity
                  
                  // محاسبه ارزش جدید (Weighted Average)
                  const avgPrice = lastBalance > 0 ? lastValue / lastBalance : unitPrice
                  const newValue = lastValue - (requiredQuantity * avgPrice)

                  // ایجاد ورودی دفتر کل
                  const docNumber = `SALE-${finalInvoiceNumber.substring(finalInvoiceNumber.length - 4)}`
                  const ledgerEntry = {
                    itemId: ingredientId,
                    itemName: inventoryItem.name,
                    itemCode: inventoryItem.code || '',
                    date: new Date(),
                    documentNumber: docNumber,
                    documentType: 'sale',
                    description: `فروش ${item.name} (${menuItemQuantity} عدد) - فاکتور ${finalInvoiceNumber}`,
                    warehouse: inventoryItem.warehouse || 'انبار اصلی',
                    quantityIn: 0,
                    quantityOut: requiredQuantity,
                    unitPrice: unitPrice,
                    totalValue: -(requiredQuantity * avgPrice),
                    runningBalance: newBalance,
                    runningValue: newValue,
                    averagePrice: newBalance > 0 ? newValue / newBalance : avgPrice,
                    reference: finalInvoiceNumber,
                    notes: `مواد اولیه ${item.name}: ${ingredient.ingredientName || inventoryItem.name} (${requiredQuantity} ${ingredient.unit || inventoryItem.unit || 'گرم'})`,
                    userId: 'سیستم',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                  }

                  await ledgerCollection.insertOne(ledgerEntry, { session })

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
                    { session }
                  )
                }
              }
            }
          } 
          // اگر recipe وجود ندارد اما inventoryItemId مستقیم وجود دارد (برای سازگاری با کد قبلی)
          else if (item.inventoryItemId) {
            const inventoryItem = await inventoryItemsCollection.findOne({ 
              _id: new ObjectId(item.inventoryItemId)
            }, { session })
            
            if (inventoryItem) {
              const lastEntry = await ledgerCollection
                .findOne(
                  { itemId: item.inventoryItemId },
                  { sort: { date: -1, createdAt: -1 }, session }
                )

              const lastBalance = lastEntry?.runningBalance || inventoryItem.currentStock || 0
              const lastValue = lastEntry?.runningValue || (inventoryItem.totalValue || 0)
              
              const qtyOut = menuItemQuantity
              const unitPrice = inventoryItem.unitPrice || item.price
              const newBalance = lastBalance - qtyOut
              
              const avgPrice = lastBalance > 0 ? lastValue / lastBalance : unitPrice
              const newValue = lastValue - (qtyOut * avgPrice)

              const docNumber = `SALE-${finalInvoiceNumber.substring(finalInvoiceNumber.length - 4)}`
              const ledgerEntry = {
                itemId: item.inventoryItemId,
                itemName: inventoryItem.name,
                itemCode: inventoryItem.code || '',
                date: new Date(),
                documentNumber: docNumber,
                documentType: 'sale',
                description: `فروش ${item.name} - فاکتور ${finalInvoiceNumber}`,
                warehouse: inventoryItem.warehouse || 'انبار اصلی',
                quantityIn: 0,
                quantityOut: qtyOut,
                unitPrice: unitPrice,
                totalValue: -(qtyOut * unitPrice),
                runningBalance: newBalance,
                runningValue: newValue,
                averagePrice: newBalance > 0 ? newValue / newBalance : unitPrice,
                reference: finalInvoiceNumber,
                notes: `فروش سریع - ${item.name}`,
                userId: 'سیستم',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              }

              await ledgerCollection.insertOne(ledgerEntry, { session })

              await inventoryItemsCollection.updateOne(
                { _id: new ObjectId(item.inventoryItemId) },
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
                { session }
              )
            }
          }
        }

        // 4. به‌روزرسانی باشگاه مشتریان (اگر customerId وجود دارد)
        if (customerId) {
          const loyaltiesCollection = db.collection('customer_loyalties')
          const loyalty = await loyaltiesCollection.findOne({ 
            customerId: customerId 
          }, { session })

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
              },
              { session }
            )
          }
        }

        // 5. به‌روزرسانی جلسه صندوق (اگر cashierSessionId وجود دارد)
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
            },
            { session }
          )
        }

        // 6. ذخیره فروش سریع
        const quickSaleData = {
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
          status: 'completed',
          createdAt: new Date(),
          updatedAt: new Date()
        }

        await db.collection('quick_sales').insertOne(quickSaleData, { session })
      })
    } finally {
      await session.endSession()
    }

    // دریافت فروش ثبت شده
    const quickSale = await db.collection('quick_sales').findOne({ 
      invoiceNumber: finalInvoiceNumber 
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

// PUT - به‌روزرسانی فروش سریع
export async function PUT(request: NextRequest) {
  try {
    const db = await connectToDatabase()
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'شناسه فروش سریع اجباری است' },
        { status: 400 }
      )
    }
    
    const updateFields: any = {
      ...updateData,
      updatedAt: new Date()
    }

    // Convert fields
    if (updateFields.items !== undefined) {
      updateFields.items = updateFields.items.map((item: any) => ({
        id: String(item.id),
        name: String(item.name),
        price: Number(item.price),
        quantity: Number(item.quantity),
        total: Number(item.total)
      }))
    }
    if (updateFields.subtotal !== undefined) {
      updateFields.subtotal = Number(updateFields.subtotal)
    }
    if (updateFields.discount !== undefined) {
      updateFields.discount = Number(updateFields.discount)
    }
    if (updateFields.discountAmount !== undefined) {
      updateFields.discountAmount = Number(updateFields.discountAmount)
    }
    if (updateFields.tax !== undefined) {
      updateFields.tax = Number(updateFields.tax)
    }
    if (updateFields.total !== undefined) {
      updateFields.total = Number(updateFields.total)
    }

    const result = await db.collection('quick_sales').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'فروش سریع مورد نظر یافت نشد' },
        { status: 404 }
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
