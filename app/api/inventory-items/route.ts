import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://restorenUser:1234@localhost:27017/restoren'

// GET /api/inventory-items - دریافت لیست آیتم‌های موجودی
export async function GET(request: NextRequest) {
  let client: MongoClient | null = null
  
  try {
    client = new MongoClient(MONGO_URI)
    await client.connect()
    const db = client.db('restoren')
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '100')
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category')
    const isLowStock = searchParams.get('isLowStock')
    
    const skip = (page - 1) * limit
    
    // Build query
    const query: any = {}
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { supplier: { $regex: search, $options: 'i' } }
      ]
    }
    if (category && category !== 'all') {
      query.category = category
    }
    if (isLowStock !== null && isLowStock !== undefined) {
      query.isLowStock = isLowStock === 'true'
    }
    
    const inventoryItems = await db.collection('inventory_items')
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray()
    
    const total = await db.collection('inventory_items').countDocuments(query)
    
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
  } finally {
    if (client) {
      await client.close()
    }
  }
}

// POST /api/inventory-items - ایجاد آیتم موجودی جدید
export async function POST(request: NextRequest) {
  let client: MongoClient | null = null
  
  try {
    const body = await request.json()
    console.log('Received body:', body)
    
    const { 
      name, 
      category, 
      unit, 
      currentStock, 
      minStock, 
      maxStock, 
      unitPrice, 
      expiryDate, 
      supplier 
    } = body

    // Validate required fields
    if (!name || !category || !unit) {
      return NextResponse.json(
        { success: false, message: 'نام، دسته‌بندی و واحد اجباری است' },
        { status: 400 }
      )
    }

    client = new MongoClient(MONGO_URI)
    await client.connect()
    const db = client.db('restoren')
    
    const stockValue = Number(currentStock) || 0
    const priceValue = Number(unitPrice) || 0
    const minValue = Number(minStock) || 0
    const maxValue = Number(maxStock) || 0
    
    const inventoryItemData = {
      name: String(name),
      category: String(category),
      unit: String(unit),
      currentStock: stockValue,
      minStock: minValue,
      maxStock: maxValue,
      unitPrice: priceValue,
      totalValue: stockValue * priceValue,
      expiryDate: expiryDate ? String(expiryDate) : null,
      supplier: supplier ? String(supplier) : null,
      isLowStock: stockValue <= minValue,
      lastUpdated: new Date().toISOString(),
      createdAt: new Date(),
      updatedAt: new Date()
    }

    console.log('Creating inventory item with data:', inventoryItemData)

    const result = await db.collection('inventory_items').insertOne(inventoryItemData)
    
    const inventoryItem = await db.collection('inventory_items').findOne({ _id: result.insertedId })

    console.log('Inventory item created successfully:', inventoryItem)

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
  } finally {
    if (client) {
      await client.close()
    }
  }
}

// PUT /api/inventory-items - به‌روزرسانی آیتم موجودی
export async function PUT(request: NextRequest) {
  let client: MongoClient | null = null
  
  try {
    const body = await request.json()
    console.log('Received update body:', body)
    
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'شناسه آیتم موجودی اجباری است' },
        { status: 400 }
      )
    }

    client = new MongoClient(MONGO_URI)
    await client.connect()
    const db = client.db('restoren')
    
    const updateFields: any = {
      updatedAt: new Date()
    }

    // Update fields
    if (updateData.name !== undefined) updateFields.name = String(updateData.name)
    if (updateData.category !== undefined) updateFields.category = String(updateData.category)
    if (updateData.unit !== undefined) updateFields.unit = String(updateData.unit)
    if (updateData.currentStock !== undefined) updateFields.currentStock = Number(updateData.currentStock)
    if (updateData.minStock !== undefined) updateFields.minStock = Number(updateData.minStock)
    if (updateData.maxStock !== undefined) updateFields.maxStock = Number(updateData.maxStock)
    if (updateData.unitPrice !== undefined) updateFields.unitPrice = Number(updateData.unitPrice)
    if (updateData.expiryDate !== undefined) updateFields.expiryDate = updateData.expiryDate ? String(updateData.expiryDate) : null
    if (updateData.supplier !== undefined) updateFields.supplier = updateData.supplier ? String(updateData.supplier) : null

    // Recalculate totalValue and isLowStock
    const currentItem = await db.collection('inventory_items').findOne({ _id: new ObjectId(id) })
    if (currentItem) {
      const stock = updateFields.currentStock !== undefined ? updateFields.currentStock : currentItem.currentStock
      const price = updateFields.unitPrice !== undefined ? updateFields.unitPrice : currentItem.unitPrice
      const min = updateFields.minStock !== undefined ? updateFields.minStock : currentItem.minStock
      
      updateFields.totalValue = stock * price
      updateFields.isLowStock = stock <= min
    }

    updateFields.lastUpdated = new Date().toISOString()

    console.log('Updating inventory item with data:', updateFields)

    const result = await db.collection('inventory_items').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    )

    console.log('Update result:', result)

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'آیتم موجودی مورد نظر یافت نشد' },
        { status: 404 }
      )
    }

    const updatedInventoryItem = await db.collection('inventory_items').findOne({ _id: new ObjectId(id) })

    console.log('Updated inventory item:', updatedInventoryItem)

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
  } finally {
    if (client) {
      await client.close()
    }
  }
}

// DELETE /api/inventory-items - حذف آیتم موجودی
export async function DELETE(request: NextRequest) {
  let client: MongoClient | null = null
  
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'شناسه آیتم موجودی اجباری است' },
        { status: 400 }
      )
    }

    client = new MongoClient(MONGO_URI)
    await client.connect()
    const db = client.db('restoren')
    
    const result = await db.collection('inventory_items').deleteOne({ _id: new ObjectId(id) })

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
  } finally {
    if (client) {
      await client.close()
    }
  }
}