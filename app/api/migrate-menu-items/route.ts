import { NextRequest, NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://admin:StrongPassword123@185.204.169.107:27017/restaurant?authSource=admin'

let client: MongoClient
let clientPromise: Promise<MongoClient>

if (!client) {
  client = new MongoClient(MONGO_URI)
  clientPromise = client.connect()
}

/**
 * API endpoint برای انتقال داده‌های menu از collection های قدیمی به menu_items
 * این API باید یک بار اجرا شود تا داده‌های موجود منتقل شوند
 */
export async function POST(request: NextRequest) {
  try {
    const client = await clientPromise
    const db = client.db('restaurant')
    
    const menuItemsCollection = db.collection('menu_items')
    const mainCoursesCollection = db.collection('main_courses')
    const dessertsCollection = db.collection('desserts')
    const beveragesCollection = db.collection('beverages')
    const appetizersCollection = db.collection('appetizers')

    const migrated: { collection: string; count: number }[] = []
    let totalMigrated = 0

    // 1. انتقال غذاهای اصلی
    const mainCourses = await mainCoursesCollection.find({}).toArray()
    if (mainCourses.length > 0) {
      const itemsToInsert = mainCourses.map(item => ({
        ...item,
        category: item.category || 'غذاهای اصلی', // اطمینان از category صحیح
        salesCount: item.salesCount || item.popularity || 0,
        rating: item.rating || 4.5,
        updatedAt: new Date()
      }))
      
      // بررسی تکراری نبودن (بر اساس name و category)
      for (const item of itemsToInsert) {
        const existing = await menuItemsCollection.findOne({
          name: item.name,
          category: item.category
        })
        if (!existing) {
          await menuItemsCollection.insertOne(item)
          totalMigrated++
        }
      }
      migrated.push({ collection: 'main_courses', count: itemsToInsert.length })
    }

    // 2. انتقال دسرها
    const desserts = await dessertsCollection.find({}).toArray()
    if (desserts.length > 0) {
      const itemsToInsert = desserts.map(item => ({
        ...item,
        category: item.category || 'دسرها',
        salesCount: item.salesCount || item.popularity || 0,
        rating: item.rating || 4.5,
        updatedAt: new Date()
      }))
      
      for (const item of itemsToInsert) {
        const existing = await menuItemsCollection.findOne({
          name: item.name,
          category: item.category
        })
        if (!existing) {
          await menuItemsCollection.insertOne(item)
          totalMigrated++
        }
      }
      migrated.push({ collection: 'desserts', count: itemsToInsert.length })
    }

    // 3. انتقال نوشیدنی‌ها
    const beverages = await beveragesCollection.find({}).toArray()
    if (beverages.length > 0) {
      const itemsToInsert = beverages.map(item => ({
        ...item,
        category: item.category || 'نوشیدنی‌ها',
        salesCount: item.salesCount || item.popularity || 0,
        rating: item.rating || 4.5,
        updatedAt: new Date()
      }))
      
      for (const item of itemsToInsert) {
        const existing = await menuItemsCollection.findOne({
          name: item.name,
          category: item.category
        })
        if (!existing) {
          await menuItemsCollection.insertOne(item)
          totalMigrated++
        }
      }
      migrated.push({ collection: 'beverages', count: itemsToInsert.length })
    }

    // 4. انتقال پیش‌غذاها (اگر در collection جداگانه باشند)
    const appetizers = await appetizersCollection.find({}).toArray()
    if (appetizers.length > 0) {
      const itemsToInsert = appetizers.map(item => ({
        ...item,
        category: item.category || 'پیش‌غذاها',
        salesCount: item.salesCount || 0,
        rating: item.rating || 4.5,
        updatedAt: new Date()
      }))
      
      for (const item of itemsToInsert) {
        const existing = await menuItemsCollection.findOne({
          name: item.name,
          category: item.category
        })
        if (!existing) {
          await menuItemsCollection.insertOne(item)
          totalMigrated++
        }
      }
      migrated.push({ collection: 'appetizers', count: itemsToInsert.length })
    }

    return NextResponse.json({
      success: true,
      message: `Migration completed successfully`,
      data: {
        totalMigrated,
        migratedCollections: migrated,
        summary: {
          mainCourses: migrated.find(m => m.collection === 'main_courses')?.count || 0,
          desserts: migrated.find(m => m.collection === 'desserts')?.count || 0,
          beverages: migrated.find(m => m.collection === 'beverages')?.count || 0,
          appetizers: migrated.find(m => m.collection === 'appetizers')?.count || 0
        }
      }
    })
  } catch (error) {
    console.error('Error migrating menu items:', error)
    return NextResponse.json({
      success: false,
      message: 'خطا در انتقال داده‌ها',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * GET - بررسی وضعیت migration
 */
export async function GET(request: NextRequest) {
  try {
    const client = await clientPromise
    const db = client.db('restaurant')
    
    const menuItemsCollection = db.collection('menu_items')
    const mainCoursesCollection = db.collection('main_courses')
    const dessertsCollection = db.collection('desserts')
    const beveragesCollection = db.collection('beverages')
    const appetizersCollection = db.collection('appetizers')

    const counts = {
      menu_items: await menuItemsCollection.countDocuments(),
      main_courses: await mainCoursesCollection.countDocuments(),
      desserts: await dessertsCollection.countDocuments(),
      beverages: await beveragesCollection.countDocuments(),
      appetizers: await appetizersCollection.countDocuments()
    }

    return NextResponse.json({
      success: true,
      data: {
        counts,
        needsMigration: counts.main_courses > 0 || counts.desserts > 0 || counts.beverages > 0 || counts.appetizers > 0
      }
    })
  } catch (error) {
    console.error('Error checking migration status:', error)
    return NextResponse.json({
      success: false,
      message: 'خطا در بررسی وضعیت',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

