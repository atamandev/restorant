import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://restorenUser:1234@localhost:27017/restoren'
const client = new MongoClient(MONGO_URI)

// GET /api/menu-items - دریافت لیست آیتم‌های منو
export async function GET(request: NextRequest) {
  try {
    await client.connect()
    const db = client.db('restoren')
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category')
    const isAvailable = searchParams.get('isAvailable')
    const isPopular = searchParams.get('isPopular')
    
    const skip = (page - 1) * limit
    
    // Build query
    const query: any = {}
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { ingredients: { $regex: search, $options: 'i' } }
      ]
    }
    if (category) {
      query.category = category
    }
    if (isAvailable !== null && isAvailable !== undefined) {
      query.isAvailable = isAvailable === 'true'
    }
    if (isPopular !== null && isPopular !== undefined) {
      query.isPopular = isPopular === 'true'
    }
    
    const menuItems = await db.collection('menu_items')
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray()
    
    const total = await db.collection('menu_items').countDocuments(query)
    
    return NextResponse.json({
      success: true,
      data: menuItems,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      message: 'لیست آیتم‌های منو با موفقیت دریافت شد'
    })
  } catch (error) {
    console.error('Error fetching menu items:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در دریافت لیست آیتم‌های منو',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  } finally {
    await client.close()
  }
}

// POST /api/menu-items - ایجاد آیتم منو جدید
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Received body:', body)
    
    const { 
      name, 
      category, 
      price, 
      preparationTime, 
      description, 
      ingredients, 
      allergens, 
      isAvailable, 
      isPopular, 
      imageUrl 
    } = body

    // Validate required fields
    if (!name || !category || price === undefined) {
      return NextResponse.json(
        { success: false, message: 'نام، دسته‌بندی و قیمت اجباری است' },
        { status: 400 }
      )
    }

    await client.connect()
    const db = client.db('restoren')
    
    const menuItemData = {
      name: String(name),
      category: String(category),
      price: parseFloat(price),
      preparationTime: preparationTime ? parseInt(preparationTime) : 15,
      description: description ? String(description) : '',
      ingredients: Array.isArray(ingredients) ? ingredients.map(String) : [],
      allergens: Array.isArray(allergens) ? allergens.map(String) : [],
      isAvailable: isAvailable !== undefined ? Boolean(isAvailable) : true,
      isPopular: isPopular !== undefined ? Boolean(isPopular) : false,
      imageUrl: imageUrl ? String(imageUrl) : null,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    console.log('Creating menu item with data:', menuItemData)

    const result = await db.collection('menu_items').insertOne(menuItemData)
    
    const menuItem = await db.collection('menu_items').findOne({ _id: result.insertedId })

    console.log('Menu item created successfully:', menuItem)

    return NextResponse.json({
      success: true,
      data: menuItem,
      message: 'آیتم منو با موفقیت ایجاد شد'
    })
  } catch (error) {
    console.error('Error creating menu item:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در ایجاد آیتم منو',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  } finally {
    await client.close()
  }
}

// PUT /api/menu-items - به‌روزرسانی آیتم منو
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Received update body:', body)
    
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'شناسه آیتم منو اجباری است' },
        { status: 400 }
      )
    }

    await client.connect()
    const db = client.db('restoren')
    
    const updateFields: any = {
      ...updateData,
      updatedAt: new Date()
    }

    // Convert numeric fields
    if (updateFields.price !== undefined) {
      updateFields.price = parseFloat(updateFields.price)
    }
    if (updateFields.preparationTime !== undefined) {
      updateFields.preparationTime = parseInt(updateFields.preparationTime)
    }

    console.log('Updating menu item with data:', updateFields)

    const result = await db.collection('menu_items').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    )

    console.log('Update result:', result)

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'آیتم منو مورد نظر یافت نشد' },
        { status: 404 }
      )
    }

    const updatedMenuItem = await db.collection('menu_items').findOne({ _id: new ObjectId(id) })

    console.log('Updated menu item:', updatedMenuItem)

    return NextResponse.json({
      success: true,
      data: updatedMenuItem,
      message: 'آیتم منو با موفقیت به‌روزرسانی شد'
    })
  } catch (error) {
    console.error('Error updating menu item:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در به‌روزرسانی آیتم منو',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  } finally {
    await client.close()
  }
}

// DELETE /api/menu-items - حذف آیتم منو
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'شناسه آیتم منو اجباری است' },
        { status: 400 }
      )
    }

    await client.connect()
    const db = client.db('restoren')
    
    const result = await db.collection('menu_items').deleteOne({ _id: new ObjectId(id) })

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'آیتم منو مورد نظر یافت نشد' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'آیتم منو با موفقیت حذف شد'
    })
  } catch (error) {
    console.error('Error deleting menu item:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در حذف آیتم منو',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  } finally {
    await client.close()
  }
}