import { NextRequest, NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://admin:StrongPassword123@185.204.169.107:27017/restaurant?authSource=admin'

let client: MongoClient
let clientPromise: Promise<MongoClient>

if (!client) {
  client = new MongoClient(MONGO_URI)
  clientPromise = client.connect()
}

// GET - دریافت دسته‌بندی‌های منو
export async function GET(request: NextRequest) {
  try {
    const client = await clientPromise
    const db = client.db('restaurant')
    const collection = db.collection('menu_items')

    // دریافت همه دسته‌بندی‌های موجود
    const categories = await collection.distinct('category')
    
    // تعداد آیتم‌های هر دسته
    const categoryCounts = await collection.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          availableCount: {
            $sum: { $cond: [{ $ne: ['$isAvailable', false] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          category: '$_id',
          count: 1,
          availableCount: 1,
          _id: 0
        }
      }
    ]).toArray()

    return NextResponse.json({
      success: true,
      data: {
        categories: categories.filter(Boolean),
        counts: categoryCounts
      }
    })
  } catch (error) {
    console.error('Error fetching menu categories:', error)
    return NextResponse.json({
      success: false,
      message: 'خطا در دریافت دسته‌بندی‌های منو'
    }, { status: 500 })
  }
}

