import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://restorenUser:1234@localhost:27017/restoren'

let client: MongoClient
let clientPromise: Promise<MongoClient>

if (!client) {
  client = new MongoClient(MONGO_URI)
  clientPromise = client.connect()
}

export async function GET(request: NextRequest) {
  try {
    const client = await clientPromise
    const db = client.db('restoren')
    const collection = db.collection('menu_items')

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const isAvailable = searchParams.get('isAvailable')
    const isPopular = searchParams.get('isPopular')
    const name = searchParams.get('name')
    const includeRecipe = searchParams.get('includeRecipe') === 'true'
    const sortBy = searchParams.get('sortBy') || 'name'
    const sortOrder = searchParams.get('sortOrder') || 'asc'

    let query: any = {}

    if (category && category !== 'all') {
      query.category = category
    }
    if (isAvailable !== null && isAvailable !== undefined) {
      query.isAvailable = isAvailable === 'true'
    }
    if (isPopular !== null && isPopular !== undefined) {
      query.isPopular = isPopular === 'true'
    }
    if (name) {
      query.name = { $regex: name, $options: 'i' }
    }

    let sortOptions: any = {}
    switch (sortBy) {
      case 'name':
        sortOptions.name = sortOrder === 'desc' ? -1 : 1
        break
      case 'price':
        sortOptions.price = sortOrder === 'desc' ? -1 : 1
        break
      case 'preparationTime':
        sortOptions.preparationTime = sortOrder === 'desc' ? -1 : 1
        break
      case 'salesCount':
        sortOptions.salesCount = sortOrder === 'desc' ? -1 : 1
        break
      case 'rating':
        sortOptions.rating = sortOrder === 'desc' ? -1 : 1
        break
      case 'createdAt':
        sortOptions.createdAt = sortOrder === 'desc' ? -1 : 1
        break
      default:
        sortOptions.name = 1
    }

    let items = await collection.find(query).sort(sortOptions).toArray()

    // اگر includeRecipe=true باشد، اطلاعات کامل مواد اولیه را برگردان
    if (includeRecipe) {
      const inventoryCollection = db.collection('inventory_items')
      for (const item of items) {
        if (item.recipe && Array.isArray(item.recipe)) {
          const recipeWithDetails = await Promise.all(
            item.recipe.map(async (ingredient: any) => {
              if (ingredient.ingredientId) {
                const inventoryItem = await inventoryCollection.findOne({
                  _id: new ObjectId(ingredient.ingredientId)
                })
                if (inventoryItem) {
                  return {
                    ...ingredient,
                    ingredientName: inventoryItem.name,
                    currentStock: inventoryItem.currentStock,
                    unit: inventoryItem.unit || ingredient.unit || 'گرم',
                    isAvailable: (inventoryItem.currentStock || 0) >= (ingredient.quantity || 0)
                  }
                }
              }
              return ingredient
            })
          )
          item.recipe = recipeWithDetails
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: items
    })
  } catch (error) {
    console.error('Error fetching menu items:', error)
    return NextResponse.json({
      success: false,
      message: 'خطا در دریافت آیتم‌های منو'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const client = await clientPromise
    const db = client.db('restoren')
    const collection = db.collection('menu_items')
    const inventoryCollection = db.collection('inventory_items')

    const body = await request.json()
    
    // اعتبارسنجی recipe (مواد اولیه)
    if (body.recipe && Array.isArray(body.recipe)) {
      for (const ingredient of body.recipe) {
        if (ingredient.ingredientId) {
          // بررسی وجود ماده اولیه در inventory
          const inventoryItem = await inventoryCollection.findOne({
            _id: new ObjectId(ingredient.ingredientId)
          })
          
          if (!inventoryItem) {
            return NextResponse.json({
              success: false,
              message: `ماده اولیه با شناسه ${ingredient.ingredientId} در انبار یافت نشد`
            }, { status: 404 })
          }

          // اطمینان از وجود مقدار
          if (!ingredient.quantity || ingredient.quantity <= 0) {
            return NextResponse.json({
              success: false,
              message: `مقدار ماده اولیه ${inventoryItem.name} باید بیشتر از صفر باشد`
            }, { status: 400 })
          }
        }
      }
    }

    const menuItem = {
      ...body,
      salesCount: body.salesCount || 0,
      rating: body.rating || 0,
      // اطمینان از وجود recipe به صورت آرایه
      recipe: body.recipe || [],
      // قیمت باید همیشه از menu-item گرفته شود (نه از frontend)
      price: Number(body.price) || 0,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    console.log(`[MENU ITEM CREATE] ${menuItem.name} - Recipe:`, menuItem.recipe ? `${menuItem.recipe.length} ingredients` : 'none', menuItem.recipe)

    const result = await collection.insertOne(menuItem)

    return NextResponse.json({
      success: true,
      data: {
        _id: result.insertedId,
        ...menuItem
      },
      message: 'آیتم منو با موفقیت ایجاد شد'
    })
  } catch (error) {
    console.error('Error creating menu item:', error)
    return NextResponse.json({
      success: false,
      message: 'خطا در ثبت آیتم منو',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const client = await clientPromise
    const db = client.db('restoren')
    const collection = db.collection('menu_items')
    const inventoryCollection = db.collection('inventory_items')

    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({
        success: false,
        message: 'شناسه آیتم اجباری است'
      }, { status: 400 })
    }

    // Remove salesCount and rating from updateData if they exist
    delete updateData.salesCount
    delete updateData.rating

    // اعتبارسنجی recipe (اگر به‌روزرسانی می‌شود)
    if (updateData.recipe && Array.isArray(updateData.recipe)) {
      for (const ingredient of updateData.recipe) {
        if (ingredient.ingredientId) {
          const inventoryItem = await inventoryCollection.findOne({
            _id: new ObjectId(ingredient.ingredientId)
          })
          
          if (!inventoryItem) {
            return NextResponse.json({
              success: false,
              message: `ماده اولیه با شناسه ${ingredient.ingredientId} در انبار یافت نشد`
            }, { status: 404 })
          }

          if (!ingredient.quantity || ingredient.quantity <= 0) {
            return NextResponse.json({
              success: false,
              message: `مقدار ماده اولیه ${inventoryItem.name} باید بیشتر از صفر باشد`
            }, { status: 400 })
          }
        }
      }
    }

    // اگر قیمت تغییر می‌کند، این تغییر روی سفارش‌های بعدی اعمال می‌شود
    // (سفارش‌های فعلی تغییر نمی‌کنند)
    if (updateData.price !== undefined) {
      updateData.price = Number(updateData.price)
    }

    // اطمینان از وجود recipe در updateData
    if (updateData.recipe === undefined) {
      // اگر recipe در updateData نیست، از body بگیر
      updateData.recipe = body.recipe || []
    }
    
    console.log(`[MENU ITEM UPDATE] ID: ${id} - Recipe:`, updateData.recipe ? `${updateData.recipe.length} ingredients` : 'none', updateData.recipe)
    
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: {
          ...updateData,
          updatedAt: new Date()
        }
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({
        success: false,
        message: 'آیتم یافت نشد'
      }, { status: 404 })
    }

    // اگر قیمت تغییر کرد، به کاربر اطلاع بده که روی سفارش‌های بعدی اعمال می‌شود
    const message = updateData.price !== undefined 
      ? 'آیتم با موفقیت به‌روزرسانی شد. قیمت جدید روی سفارش‌های بعدی اعمال می‌شود.'
      : 'آیتم با موفقیت به‌روزرسانی شد'

    return NextResponse.json({
      success: true,
      message
    })
  } catch (error) {
    console.error('Error updating menu item:', error)
    return NextResponse.json({
      success: false,
      message: 'خطا در به‌روزرسانی آیتم',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const client = await clientPromise
    const db = client.db('restoren')
    const collection = db.collection('menu_items')

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({
        success: false,
        message: 'شناسه آیتم اجباری است'
      }, { status: 400 })
    }

    const result = await collection.deleteOne({ _id: new ObjectId(id) })

    if (result.deletedCount === 0) {
      return NextResponse.json({
        success: false,
        message: 'آیتم یافت نشد'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'آیتم با موفقیت حذف شد'
    })
  } catch (error) {
    console.error('Error deleting menu item:', error)
    return NextResponse.json({
      success: false,
      message: 'خطا در حذف آیتم'
    }, { status: 500 })
  }
}
