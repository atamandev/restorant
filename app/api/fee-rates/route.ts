import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://admin:StrongPassword123@185.204.169.107:27017/restaurant?authSource=admin'
const client = new MongoClient(MONGO_URI)

// GET /api/fee-rates - دریافت لیست نرخ‌های کارمزد
export async function GET(request: NextRequest) {
  try {
    await client.connect()
    const db = client.db('restaurant')
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const isActive = searchParams.get('isActive')
    
    const skip = (page - 1) * limit
    
    // Build query
    const query: any = {}
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ]
    }
    if (isActive !== null && isActive !== undefined) {
      query.isActive = isActive === 'true'
    }
    
    const feeRates = await db.collection('fee_rates')
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray()
    
    const total = await db.collection('fee_rates').countDocuments(query)
    
    return NextResponse.json({
      success: true,
      data: feeRates,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      message: 'لیست نرخ‌های کارمزد با موفقیت دریافت شد'
    })
  } catch (error) {
    console.error('Error fetching fee rates:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در دریافت لیست نرخ‌های کارمزد',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  } finally {
    await client.close()
  }
}

// POST /api/fee-rates - ایجاد نرخ کارمزد جدید
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Received body:', body)
    
    const { name, rate, type, description, isActive, appliesTo } = body

    // Validate required fields
    if (!name || rate === undefined || !type) {
      return NextResponse.json(
        { success: false, message: 'نام، نرخ و نوع کارمزد اجباری است' },
        { status: 400 }
      )
    }

    await client.connect()
    const db = client.db('restaurant')
    
    const feeRateData = {
      name,
      rate: parseFloat(rate),
      type,
      description: description || '',
      isActive: isActive !== undefined ? isActive : true,
      appliesTo: appliesTo || [],
      createdAt: new Date(),
      updatedAt: new Date()
    }

    console.log('Creating fee rate with data:', feeRateData)

    const result = await db.collection('fee_rates').insertOne(feeRateData)
    
    const feeRate = await db.collection('fee_rates').findOne({ _id: result.insertedId })

    console.log('Fee rate created successfully:', feeRate)

    return NextResponse.json({
      success: true,
      data: feeRate,
      message: 'نرخ کارمزد با موفقیت ایجاد شد'
    })
  } catch (error) {
    console.error('Error creating fee rate:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در ایجاد نرخ کارمزد',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  } finally {
    await client.close()
  }
}

// PUT /api/fee-rates - به‌روزرسانی نرخ کارمزد
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'شناسه نرخ کارمزد اجباری است' },
        { status: 400 }
      )
    }

    await client.connect()
    const db = client.db('restaurant')
    
    const updateFields = {
      ...updateData,
      updatedAt: new Date()
    }

    // Convert numeric fields
    if (updateFields.rate !== undefined) {
      updateFields.rate = parseFloat(updateFields.rate)
    }

    const result = await db.collection('fee_rates').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'نرخ کارمزد مورد نظر یافت نشد' },
        { status: 404 }
      )
    }

    const updatedFeeRate = await db.collection('fee_rates').findOne({ _id: new ObjectId(id) })

    return NextResponse.json({
      success: true,
      data: updatedFeeRate,
      message: 'نرخ کارمزد با موفقیت به‌روزرسانی شد'
    })
  } catch (error) {
    console.error('Error updating fee rate:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در به‌روزرسانی نرخ کارمزد',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  } finally {
    await client.close()
  }
}

// DELETE /api/fee-rates - حذف نرخ کارمزد
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'شناسه نرخ کارمزد اجباری است' },
        { status: 400 }
      )
    }

    await client.connect()
    const db = client.db('restaurant')
    
    const result = await db.collection('fee_rates').deleteOne({ _id: new ObjectId(id) })

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'نرخ کارمزد مورد نظر یافت نشد' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'نرخ کارمزد با موفقیت حذف شد'
    })
  } catch (error) {
    console.error('Error deleting fee rate:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در حذف نرخ کارمزد',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  } finally {
    await client.close()
  }
}

