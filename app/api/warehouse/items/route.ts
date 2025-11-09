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

// GET - دریافت لیست آیتم‌های انبار
export async function GET(request: NextRequest) {
  try {
    const db = await connectToDatabase()
    if (!db) {
      throw new Error('Database connection failed')
    }
    const inventoryCollection = db.collection('inventory_items')
    
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category')
    const status = searchParams.get('status') // 'sufficient', 'low', 'warning'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '1000') // افزایش limit برای دریافت همه داده‌ها
    const skip = (page - 1) * limit
    
    // ساخت فیلتر
    const query: any = {}
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { supplier: { $regex: search, $options: 'i' } }
      ]
    }
    
    if (category && category !== 'all') {
      query.category = category
    }
    
    // فیلتر بر اساس وضعیت موجودی - بعد از دریافت داده‌ها اعمال می‌شود
    // (برای جلوگیری از مشکل در query)
    
    // برای دریافت همه داده‌ها، limit را به 10000 افزایش می‌دهیم
    const maxLimit = Math.min(limit, 10000)
    
    // اگر skip > 0 نباشد، همه داده‌ها را برمی‌گردانیم (برای صفحه اول)
    // دریافت همه داده‌ها بدون projection محدود
    // لاگ برای دیباگ
    console.log('Query:', JSON.stringify(query))
    console.log('Max limit:', maxLimit)
    
    const items = await inventoryCollection
      .find(query)
      .sort({ createdAt: -1 })
      .limit(maxLimit)
      .toArray()
    
    console.log('Items found in DB:', items.length)
    
    // محاسبه وضعیت برای هر آیتم
    let itemsWithStatus = items.map((item: any) => {
      const stock = item.currentStock || 0
      const min = item.minStock || 0
      let itemStatus = 'sufficient'
      
      if (stock <= min) {
        itemStatus = 'low'
      } else if (min > 0 && stock <= min * 1.5) {
        itemStatus = 'warning'
      }
      
      return {
        ...item,
        id: item._id?.toString() || item.id,
        status: itemStatus
      }
    })
    
    // اعمال فیلتر status بعد از محاسبه وضعیت
    if (status && status !== 'all') {
      itemsWithStatus = itemsWithStatus.filter((item: any) => item.status === status)
    }
    
    // محاسبه total - اگر status filter اعمال شده، باید از itemsWithStatus استفاده کنیم
    const total = status && status !== 'all' 
      ? itemsWithStatus.length 
      : await inventoryCollection.countDocuments(query)
    
    return NextResponse.json({
      success: true,
      data: itemsWithStatus,
      pagination: {
        page,
        limit: maxLimit,
        total,
        pages: Math.ceil(total / maxLimit)
      }
    })
  } catch (error) {
    console.error('Error fetching warehouse items:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'خطا در دریافت لیست کالاها',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// POST - ایجاد کالای جدید
export async function POST(request: NextRequest) {
  try {
    const db = await connectToDatabase()
    if (!db) {
      throw new Error('Database connection failed')
    }
    const inventoryCollection = db.collection('inventory_items')
    
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
    
    // اعتبارسنجی
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
    
    // اطمینان از اینکه warehouse تنظیم شده است
    let finalWarehouse = warehouse && warehouse.trim() ? warehouse.trim() : ''
    
    // اگر warehouse شامل "تایماز" است، فقط "تایماز" را نگه دار (برای حذف کد انبار مثل "تایماز (WH-001)")
    if (finalWarehouse && finalWarehouse.includes('تایماز')) {
      finalWarehouse = 'تایماز'
    }
    
    // اگر warehouse خالی است، به "تایماز" تنظیم کن (پیش‌فرض)
    if (!finalWarehouse || finalWarehouse === '' || finalWarehouse === 'undefined') {
      finalWarehouse = 'تایماز'
    }
    
    console.log('=== Creating new inventory item ===')
    console.log('Original warehouse from request:', warehouse)
    console.log('Final warehouse:', finalWarehouse)
    console.log('Full request body:', JSON.stringify(body, null, 2))
    
    const itemData = {
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
      warehouse: finalWarehouse,
      description: description || '',
      isLowStock: stockValue <= minValue,
      lastUpdated: new Date().toISOString(),
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    console.log('Item data to insert:', JSON.stringify(itemData, null, 2))
    const result = await inventoryCollection.insertOne(itemData)
    console.log('Item inserted with ID:', result.insertedId)

    // بررسی که آیا کالا با warehouse درست ذخیره شد
    const newItem = await inventoryCollection.findOne({ _id: result.insertedId })
    console.log('Inserted item warehouse:', newItem?.warehouse)
    console.log('Inserted item name:', newItem?.name)
    console.log('Full inserted item:', JSON.stringify(newItem, null, 2))
    
    // بررسی همه کالاهای این انبار
    const itemsInWarehouse = await inventoryCollection.find({ warehouse: finalWarehouse }).toArray()
    console.log(`Total items in warehouse "${finalWarehouse}":`, itemsInWarehouse.length)
    
    return NextResponse.json({
      success: true,
      data: {
        ...newItem,
        id: newItem._id?.toString()
      },
      message: 'کالا با موفقیت ایجاد شد'
    })
  } catch (error) {
    console.error('Error creating warehouse item:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'خطا در ایجاد کالا',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

