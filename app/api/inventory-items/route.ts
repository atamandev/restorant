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

// GET /api/inventory-items - دریافت لیست آیتم‌های موجودی
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()
    const inventoryCollection = db.collection('inventory_items')
    const stockAlertsCollection = db.collection('stock_alerts')
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category')
    const isLowStock = searchParams.get('isLowStock')
    const includeAlerts = searchParams.get('includeAlerts') === 'true'
    
    const skip = (page - 1) * limit
    
    // Build query
    const query: any = {}
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { supplier: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } }
      ]
    }
    if (category && category !== 'all') {
      query.category = category
    }
    if (isLowStock !== null && isLowStock !== undefined) {
      query.isLowStock = isLowStock === 'true'
    }
    
    // محدود کردن به حداکثر 200 برای عملکرد بهتر
    const maxLimit = Math.min(limit, 200)
    
    const inventoryItems = await inventoryCollection
      .find(query, {
        projection: {
          _id: 1,
          name: 1,
          code: 1,
          category: 1,
          unit: 1,
          currentStock: 1,
          minStock: 1,
          maxStock: 1,
          unitPrice: 1,
          totalValue: 1,
          isLowStock: 1,
          supplier: 1,
          warehouse: 1,
          createdAt: 1,
          updatedAt: 1
        }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(maxLimit)
      .toArray()
    
    // اگر unitPrice وجود نداشته باشد، از inventory_balance بگیر
    const balanceCollection = db.collection('inventory_balance')
    const itemIdsNeedingPrice = inventoryItems
      .filter(item => !item.unitPrice || item.unitPrice === 0)
      .map(item => item._id)
    
    // دریافت همه balance ها در یک query (بهینه‌تر)
    let balancesMap = new Map()
    if (itemIdsNeedingPrice.length > 0) {
      // تبدیل به ObjectId برای جستجو
      const objectIds = itemIdsNeedingPrice.map(id => 
        typeof id === 'string' ? new ObjectId(id) : id
      )
      const stringIds = itemIdsNeedingPrice.map(id => id.toString())
      
      const balances = await balanceCollection.find({
        $or: [
          { itemId: { $in: objectIds } },
          { itemId: { $in: stringIds } }
        ]
      }).toArray()
      
      balances.forEach(balance => {
        if (balance.quantity > 0 && balance.totalValue) {
          const calculatedPrice = balance.totalValue / balance.quantity
          // ذخیره با هر دو فرمت (string و ObjectId)
          const itemIdStr = balance.itemId?.toString() || balance.itemId
          if (itemIdStr) {
            balancesMap.set(itemIdStr, calculatedPrice)
          }
        }
      })
    }
    
    // به‌روزرسانی unitPrice برای آیتم‌هایی که نیاز دارند
    for (const item of inventoryItems) {
      if (!item.unitPrice || item.unitPrice === 0) {
        const itemIdStr = item._id.toString()
        if (balancesMap.has(itemIdStr)) {
          item.unitPrice = balancesMap.get(itemIdStr)
        }
      }
      
      // اگر includeAlerts=true باشد، هشدارهای مرتبط را هم بیاور
      if (includeAlerts) {
        const activeAlert = await stockAlertsCollection.findOne({
          itemId: item._id.toString(),
          status: 'active'
        })
        item.alert = activeAlert || null
      }
    }
    
    const total = await inventoryCollection.countDocuments(query)
    
    return NextResponse.json({
      success: true,
      data: inventoryItems,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      message: 'لیست آیتم‌های موجودی با موفقیت دریافت شد'
    })
  } catch (error) {
    console.error('Error fetching inventory items:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در دریافت لیست آیتم‌های موجودی',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// POST /api/inventory-items - ایجاد آیتم موجودی جدید
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()
    const inventoryCollection = db.collection('inventory_items')
    const stockAlertsCollection = db.collection('stock_alerts')
    
    const body = await request.json()
    
    const { 
      name, 
      category, 
      unit, 
      currentStock, 
      minStock, 
      maxStock, 
      unitPrice, 
      expiryDate, 
      supplier,
      warehouse,
      code,
      description
    } = body

    // Validate required fields
    if (!name || !category || !unit) {
      return NextResponse.json(
        { success: false, message: 'نام، دسته‌بندی و واحد اجباری است' },
        { status: 400 }
      )
    }

    const stockValue = Number(currentStock) || 0
    const priceValue = Number(unitPrice) || 0
    const minValue = Number(minStock) || 0
    const maxValue = Number(maxStock) || 0
    
    const inventoryItemData = {
      name: String(name),
      category: String(category),
      unit: String(unit),
      code: code || `ITEM-${Date.now()}`,
      currentStock: stockValue,
      minStock: minValue,
      maxStock: maxValue,
      unitPrice: priceValue,
      totalValue: stockValue * priceValue,
      expiryDate: expiryDate ? new Date(expiryDate).toISOString() : null,
      supplier: supplier ? String(supplier) : null,
      warehouse: warehouse || 'انبار اصلی',
      description: description || '',
      isLowStock: stockValue <= minValue,
      lastUpdated: new Date().toISOString(),
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await inventoryCollection.insertOne(inventoryItemData)
    
    const inventoryItem = await inventoryCollection.findOne({ _id: result.insertedId })

    // اگر موجودی کم است، هشدار ایجاد کن
    if (inventoryItem.isLowStock) {
      const alertType = stockValue === 0 ? 'out_of_stock' : 'low_stock'
      const severity = stockValue === 0 ? 'critical' : 'medium'
      
      await stockAlertsCollection.insertOne({
        itemId: result.insertedId.toString(),
        itemName: inventoryItem.name,
        itemCode: inventoryItem.code,
        category: inventoryItem.category,
        warehouse: inventoryItem.warehouse,
        type: alertType,
        severity: severity,
        currentStock: stockValue,
        minStock: minValue,
        maxStock: maxValue,
        unit: inventoryItem.unit,
        message: stockValue === 0 
          ? `${inventoryItem.name} تمام شده است`
          : `موجودی ${inventoryItem.name} کم است (${stockValue} ${inventoryItem.unit})`,
        status: 'active',
        priority: severity === 'critical' ? 'urgent' : 'normal',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
    }

    return NextResponse.json({
      success: true,
      data: inventoryItem,
      message: 'آیتم موجودی با موفقیت ایجاد شد'
    })
  } catch (error) {
    console.error('Error creating inventory item:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در ایجاد آیتم موجودی',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// PUT /api/inventory-items - به‌روزرسانی آیتم موجودی
export async function PUT(request: NextRequest) {
  try {
    await connectToDatabase()
    const inventoryCollection = db.collection('inventory_items')
    const stockAlertsCollection = db.collection('stock_alerts')
    
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'شناسه آیتم موجودی اجباری است' },
        { status: 400 }
      )
    }

    const updateFields: any = {
      updatedAt: new Date()
    }

    // Update fields
    if (updateData.name !== undefined) updateFields.name = String(updateData.name)
    if (updateData.category !== undefined) updateFields.category = String(updateData.category)
    if (updateData.unit !== undefined) updateFields.unit = String(updateData.unit)
    if (updateData.code !== undefined) updateFields.code = String(updateData.code)
    if (updateData.currentStock !== undefined) updateFields.currentStock = Number(updateData.currentStock)
    if (updateData.minStock !== undefined) updateFields.minStock = Number(updateData.minStock)
    if (updateData.maxStock !== undefined) updateFields.maxStock = Number(updateData.maxStock)
    if (updateData.unitPrice !== undefined) updateFields.unitPrice = Number(updateData.unitPrice)
    if (updateData.expiryDate !== undefined) updateFields.expiryDate = updateData.expiryDate ? new Date(updateData.expiryDate).toISOString() : null
    if (updateData.supplier !== undefined) updateFields.supplier = updateData.supplier ? String(updateData.supplier) : null
    if (updateData.warehouse !== undefined) updateFields.warehouse = updateData.warehouse || 'انبار اصلی'
    if (updateData.description !== undefined) updateFields.description = String(updateData.description || '')

    // Recalculate totalValue and isLowStock
    const currentItem = await inventoryCollection.findOne({ _id: new ObjectId(id) })
    if (currentItem) {
      const stock = updateFields.currentStock !== undefined ? updateFields.currentStock : currentItem.currentStock
      const price = updateFields.unitPrice !== undefined ? updateFields.unitPrice : currentItem.unitPrice
      const min = updateFields.minStock !== undefined ? updateFields.minStock : currentItem.minStock
      
      updateFields.totalValue = stock * price
      updateFields.isLowStock = stock <= min
      updateFields.lastUpdated = new Date().toISOString()

      // مدیریت هشدار کمبود موجودی
      const wasLowStock = currentItem.isLowStock || false
      const isNowLowStock = updateFields.isLowStock

      // اگر موجودی کم شد، هشدار ایجاد/به‌روزرسانی کن
      if (!wasLowStock && isNowLowStock) {
        const alertType = stock === 0 ? 'out_of_stock' : 'low_stock'
        const severity = stock === 0 ? 'critical' : 'medium'

        // بررسی آیا هشدار فعال وجود دارد
        const existingAlert = await stockAlertsCollection.findOne({
          itemId: id,
          status: 'active'
        })

        if (existingAlert) {
          // به‌روزرسانی هشدار موجود
          await stockAlertsCollection.updateOne(
            { _id: existingAlert._id },
            {
              $set: {
                type: alertType,
                severity: severity,
                currentStock: stock,
                minStock: min,
                message: stock === 0
                  ? `${updateFields.name || currentItem.name} تمام شده است`
                  : `موجودی ${updateFields.name || currentItem.name} کم است (${stock} ${updateFields.unit || currentItem.unit})`,
                priority: severity === 'critical' ? 'urgent' : 'normal',
                updatedAt: new Date().toISOString()
              }
            }
          )
        } else {
          // ایجاد هشدار جدید
          await stockAlertsCollection.insertOne({
            itemId: id,
            itemName: updateFields.name || currentItem.name,
            itemCode: updateFields.code || currentItem.code,
            category: updateFields.category || currentItem.category,
            warehouse: updateFields.warehouse || currentItem.warehouse,
            type: alertType,
            severity: severity,
            currentStock: stock,
            minStock: min,
            maxStock: updateFields.maxStock || currentItem.maxStock,
            unit: updateFields.unit || currentItem.unit,
            message: stock === 0
              ? `${updateFields.name || currentItem.name} تمام شده است`
              : `موجودی ${updateFields.name || currentItem.name} کم است (${stock} ${updateFields.unit || currentItem.unit})`,
            status: 'active',
            priority: severity === 'critical' ? 'urgent' : 'normal',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          })
        }
      }
      // اگر موجودی به حالت عادی برگشت، هشدار را resolve کن
      else if (wasLowStock && !isNowLowStock) {
        await stockAlertsCollection.updateMany(
          { itemId: id, status: 'active' },
          {
            $set: {
              status: 'resolved',
              resolvedAt: new Date().toISOString(),
              resolution: 'موجودی به حالت عادی برگشت',
              updatedAt: new Date().toISOString()
            }
          }
        )
      }
    }

    const result = await inventoryCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'آیتم موجودی مورد نظر یافت نشد' },
        { status: 404 }
      )
    }

    const updatedInventoryItem = await inventoryCollection.findOne({ _id: new ObjectId(id) })

    return NextResponse.json({
      success: true,
      data: updatedInventoryItem,
      message: 'آیتم موجودی با موفقیت به‌روزرسانی شد'
    })
  } catch (error) {
    console.error('Error updating inventory item:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در به‌روزرسانی آیتم موجودی',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// DELETE /api/inventory-items - حذف آیتم موجودی
export async function DELETE(request: NextRequest) {
  try {
    await connectToDatabase()
    const inventoryCollection = db.collection('inventory_items')
    const stockAlertsCollection = db.collection('stock_alerts')
    const ledgerCollection = db.collection('item_ledger')
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'شناسه آیتم موجودی اجباری است' },
        { status: 400 }
      )
    }

    // حذف تاریخچه تراکنش‌های مرتبط (اختیاری - اگر می‌خواهید تاریخچه را نگه دارید، این خط را حذف کنید)
    // await ledgerCollection.deleteMany({ itemId: id })

    // حذف هشدارهای مرتبط
    await stockAlertsCollection.deleteMany({ itemId: id })
    
    const result = await inventoryCollection.deleteOne({ _id: new ObjectId(id) })

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'آیتم موجودی مورد نظر یافت نشد' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'آیتم موجودی با موفقیت حذف شد'
    })
  } catch (error) {
    console.error('Error deleting inventory item:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در حذف آیتم موجودی',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
