import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://restorenUser:1234@localhost:27017/restoren'
const client = new MongoClient(MONGO_URI)

// GET /api/tax-rates - دریافت لیست نرخ‌های مالیات
export async function GET(request: NextRequest) {
  try {
    await client.connect()
    const db = client.db('restoren')
    
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
    
    const taxRates = await db.collection('tax_rates')
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray()
    
    const total = await db.collection('tax_rates').countDocuments(query)
    
    return NextResponse.json({
      success: true,
      data: taxRates,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      message: 'لیست نرخ‌های مالیات با موفقیت دریافت شد'
    })
  } catch (error) {
    console.error('Error fetching tax rates:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در دریافت لیست نرخ‌های مالیات',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  } finally {
    await client.close()
  }
}

// POST /api/tax-rates - ایجاد نرخ مالیات جدید
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Received body:', body)
    
    const { name, rate, type, description, isActive, appliesTo } = body

    // Validate required fields
    if (!name || rate === undefined || !type) {
      return NextResponse.json(
        { success: false, message: 'نام، نرخ و نوع مالیات اجباری است' },
        { status: 400 }
      )
    }

    await client.connect()
    const db = client.db('restoren')
    
    const taxRateData = {
      name,
      rate: parseFloat(rate),
      type,
      description: description || '',
      isActive: isActive !== undefined ? isActive : true,
      appliesTo: appliesTo || [],
      createdAt: new Date(),
      updatedAt: new Date()
    }

    console.log('Creating tax rate with data:', taxRateData)

    const result = await db.collection('tax_rates').insertOne(taxRateData)
    
    const taxRate = await db.collection('tax_rates').findOne({ _id: result.insertedId })

    console.log('Tax rate created successfully:', taxRate)

    return NextResponse.json({
      success: true,
      data: taxRate,
      message: 'نرخ مالیات با موفقیت ایجاد شد'
    })
  } catch (error) {
    console.error('Error creating tax rate:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در ایجاد نرخ مالیات',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  } finally {
    await client.close()
  }
}

// PUT /api/tax-rates - به‌روزرسانی نرخ مالیات
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'شناسه نرخ مالیات اجباری است' },
        { status: 400 }
      )
    }

    await client.connect()
    const db = client.db('restoren')
    
    const updateFields = {
      ...updateData,
      updatedAt: new Date()
    }

    // Convert numeric fields
    if (updateFields.rate !== undefined) {
      updateFields.rate = parseFloat(updateFields.rate)
    }

    const result = await db.collection('tax_rates').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'نرخ مالیات مورد نظر یافت نشد' },
        { status: 404 }
      )
    }

    const updatedTaxRate = await db.collection('tax_rates').findOne({ _id: new ObjectId(id) })

    return NextResponse.json({
      success: true,
      data: updatedTaxRate,
      message: 'نرخ مالیات با موفقیت به‌روزرسانی شد'
    })
  } catch (error) {
    console.error('Error updating tax rate:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در به‌روزرسانی نرخ مالیات',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  } finally {
    await client.close()
  }
}

// DELETE /api/tax-rates - حذف نرخ مالیات
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'شناسه نرخ مالیات اجباری است' },
        { status: 400 }
      )
    }

    await client.connect()
    const db = client.db('restoren')
    
    const result = await db.collection('tax_rates').deleteOne({ _id: new ObjectId(id) })

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'نرخ مالیات مورد نظر یافت نشد' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'نرخ مالیات با موفقیت حذف شد'
    })
  } catch (error) {
    console.error('Error deleting tax rate:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در حذف نرخ مالیات',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  } finally {
    await client.close()
  }
}

