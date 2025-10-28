import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://restorenUser:1234@localhost:27017/restoren'
const client = new MongoClient(MONGO_URI)

// GET /api/branches - دریافت لیست شعبه‌ها
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
        { address: { $regex: search, $options: 'i' } },
        { manager: { $regex: search, $options: 'i' } }
      ]
    }
    if (isActive !== null && isActive !== undefined) {
      query.isActive = isActive === 'true'
    }
    
    const branches = await db.collection('branches')
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray()
    
    // Add cashRegisters to each branch
    for (let branch of branches) {
      const cashRegisters = await db.collection('cash_registers')
        .find({ branchId: branch._id })
        .toArray()
      branch.cashRegisters = cashRegisters
    }
    
    const total = await db.collection('branches').countDocuments(query)
    
    return NextResponse.json({
      success: true,
      data: branches,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      message: 'لیست شعبه‌ها با موفقیت دریافت شد'
    })
  } catch (error) {
    console.error('Error fetching branches:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در دریافت لیست شعبه‌ها',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  } finally {
    await client.close()
  }
}

// POST /api/branches - ایجاد شعبه جدید
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Received body:', body)
    
    const { name, address, phoneNumber, email, manager, capacity, openingHours, isActive } = body

    // Validate required fields
    if (!name || !address) {
      return NextResponse.json(
        { success: false, message: 'نام و آدرس شعبه اجباری است' },
        { status: 400 }
      )
    }

    await client.connect()
    const db = client.db('restoren')
    
    const branchData = {
      name,
      address,
      phoneNumber: phoneNumber || null,
      email: email || null,
      manager: manager || null,
      capacity: capacity ? parseInt(capacity) : null,
      isActive: isActive !== undefined ? isActive : true,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    console.log('Creating branch with data:', branchData)

    const result = await db.collection('branches').insertOne(branchData)
    
    const branch = await db.collection('branches').findOne({ _id: result.insertedId })
    
    // Add empty cashRegisters array to new branch
    branch.cashRegisters = []

    console.log('Branch created successfully:', branch)

    return NextResponse.json({
      success: true,
      data: branch,
      message: 'شعبه با موفقیت ایجاد شد'
    })
  } catch (error) {
    console.error('Error creating branch:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در ایجاد شعبه',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  } finally {
    await client.close()
  }
}

// PUT /api/branches - به‌روزرسانی شعبه
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'شناسه شعبه اجباری است' },
        { status: 400 }
      )
    }

    await client.connect()
    const db = client.db('restoren')
    
    const updateFields = {
      ...updateData,
      updatedAt: new Date()
    }

    const result = await db.collection('branches').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'شعبه مورد نظر یافت نشد' },
        { status: 404 }
      )
    }

    const updatedBranch = await db.collection('branches').findOne({ _id: new ObjectId(id) })
    
    // Add cashRegisters to updated branch
    const cashRegisters = await db.collection('cash_registers')
      .find({ branchId: updatedBranch._id })
      .toArray()
    updatedBranch.cashRegisters = cashRegisters

    return NextResponse.json({
      success: true,
      data: updatedBranch,
      message: 'شعبه با موفقیت به‌روزرسانی شد'
    })
  } catch (error) {
    console.error('Error updating branch:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در به‌روزرسانی شعبه',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  } finally {
    await client.close()
  }
}

// DELETE /api/branches - حذف شعبه
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'شناسه شعبه اجباری است' },
        { status: 400 }
      )
    }

    await client.connect()
    const db = client.db('restoren')
    
    const result = await db.collection('branches').deleteOne({ _id: new ObjectId(id) })

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'شعبه مورد نظر یافت نشد' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'شعبه با موفقیت حذف شد'
    })
  } catch (error) {
    console.error('Error deleting branch:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در حذف شعبه',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  } finally {
    await client.close()
  }
}