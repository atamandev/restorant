import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://restorenUser:1234@localhost:27017/restoren'
const client = new MongoClient(MONGO_URI)

// GET /api/cash-registers - دریافت لیست صندوق‌ها
export async function GET(request: NextRequest) {
  try {
    await client.connect()
    const db = client.db('restoren')
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const branchId = searchParams.get('branchId')
    const isActive = searchParams.get('isActive')
    
    const skip = (page - 1) * limit
    
    // Build query
    const query: any = {}
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ]
    }
    if (branchId) {
      query.branchId = branchId
    }
    if (isActive !== null && isActive !== undefined) {
      query.isActive = isActive === 'true'
    }
    
    const cashRegisters = await db.collection('cash_registers')
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray()
    
    const total = await db.collection('cash_registers').countDocuments(query)
    
    return NextResponse.json({
      success: true,
      data: cashRegisters,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      message: 'لیست صندوق‌ها با موفقیت دریافت شد'
    })
  } catch (error) {
    console.error('Error fetching cash registers:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در دریافت لیست صندوق‌ها',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  } finally {
    await client.close()
  }
}

// POST /api/cash-registers - ایجاد صندوق جدید
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Received body:', body)
    
    const { name, location, branchId, isActive, currentAmount } = body

    // Validate required fields
    if (!name || !branchId) {
      return NextResponse.json(
        { success: false, message: 'نام صندوق و شناسه شعبه اجباری است' },
        { status: 400 }
      )
    }

    await client.connect()
    const db = client.db('restoren')
    
    // Check if branch exists
    const branch = await db.collection('branches').findOne({ _id: new ObjectId(branchId) })
    if (!branch) {
      return NextResponse.json(
        { success: false, message: 'شعبه مورد نظر یافت نشد' },
        { status: 404 }
      )
    }
    
    const cashRegisterData = {
      name,
      location: location || null,
      branchId: new ObjectId(branchId),
      isActive: isActive !== undefined ? isActive : true,
      currentAmount: currentAmount ? parseFloat(currentAmount) : 0,
      lastUsed: null,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    console.log('Creating cash register with data:', cashRegisterData)

    const result = await db.collection('cash_registers').insertOne(cashRegisterData)
    
    const cashRegister = await db.collection('cash_registers').findOne({ _id: result.insertedId })

    console.log('Cash register created successfully:', cashRegister)

    return NextResponse.json({
      success: true,
      data: cashRegister,
      message: 'صندوق با موفقیت ایجاد شد'
    })
  } catch (error) {
    console.error('Error creating cash register:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در ایجاد صندوق',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  } finally {
    await client.close()
  }
}

// PUT /api/cash-registers - به‌روزرسانی صندوق
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'شناسه صندوق اجباری است' },
        { status: 400 }
      )
    }

    await client.connect()
    const db = client.db('restoren')
    
    const updateFields = {
      ...updateData,
      updatedAt: new Date()
    }

    // Convert branchId to ObjectId if provided
    if (updateFields.branchId) {
      updateFields.branchId = new ObjectId(updateFields.branchId)
    }

    const result = await db.collection('cash_registers').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'صندوق مورد نظر یافت نشد' },
        { status: 404 }
      )
    }

    const updatedCashRegister = await db.collection('cash_registers').findOne({ _id: new ObjectId(id) })

    return NextResponse.json({
      success: true,
      data: updatedCashRegister,
      message: 'صندوق با موفقیت به‌روزرسانی شد'
    })
  } catch (error) {
    console.error('Error updating cash register:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در به‌روزرسانی صندوق',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  } finally {
    await client.close()
  }
}

// DELETE /api/cash-registers - حذف صندوق
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'شناسه صندوق اجباری است' },
        { status: 400 }
      )
    }

    await client.connect()
    const db = client.db('restoren')
    
    const result = await db.collection('cash_registers').deleteOne({ _id: new ObjectId(id) })

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'صندوق مورد نظر یافت نشد' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'صندوق با موفقیت حذف شد'
    })
  } catch (error) {
    console.error('Error deleting cash register:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در حذف صندوق',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  } finally {
    await client.close()
  }
}