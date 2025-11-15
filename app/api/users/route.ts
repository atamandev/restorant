import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'
import bcrypt from 'bcryptjs'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://admin:StrongPassword123@185.204.169.107:27017/restaurant?authSource=admin'
const client = new MongoClient(MONGO_URI)

// GET /api/users - دریافت لیست کاربران
export async function GET(request: NextRequest) {
  try {
    await client.connect()
    const db = client.db('restaurant')
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role')
    const branchId = searchParams.get('branchId')
    const isActive = searchParams.get('isActive')
    
    const skip = (page - 1) * limit
    
    // Build query
    const query: any = {}
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } }
      ]
    }
    if (role) {
      query.role = role
    }
    if (branchId) {
      query.branchId = branchId
    }
    if (isActive !== null && isActive !== undefined) {
      query.isActive = isActive === 'true'
    }
    
    const users = await db.collection('users')
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray()
    
    // Remove password hash from response
    const usersWithoutPassword = users.map(user => {
      const { passwordHash, ...userWithoutPassword } = user
      return userWithoutPassword
    })
    
    const total = await db.collection('users').countDocuments(query)
    
    return NextResponse.json({
      success: true,
      data: usersWithoutPassword,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      message: 'لیست کاربران با موفقیت دریافت شد'
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در دریافت لیست کاربران',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  } finally {
    await client.close()
  }
}

// POST /api/users - ایجاد کاربر جدید
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Received body:', body)
    
    const { 
      username, 
      email, 
      password, 
      role, 
      firstName, 
      lastName, 
      phoneNumber, 
      branchId, 
      isActive 
    } = body

    // Validate required fields
    if (!username || !email || !password) {
      return NextResponse.json(
        { success: false, message: 'نام کاربری، ایمیل و رمز عبور اجباری است' },
        { status: 400 }
      )
    }

    await client.connect()
    const db = client.db('restaurant')
    
    // Check if username or email already exists
    const existingUser = await db.collection('users').findOne({
      $or: [
        { username },
        { email }
      ]
    })
    
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'نام کاربری یا ایمیل قبلاً استفاده شده است' },
        { status: 409 }
      )
    }
    
    // Hash password
    const saltRounds = 12
    const passwordHash = await bcrypt.hash(password, saltRounds)
    
    const userData = {
      username,
      email,
      passwordHash,
      role: role || 'CASHIER',
      firstName: firstName || null,
      lastName: lastName || null,
      phoneNumber: phoneNumber || null,
      branchId: branchId ? new ObjectId(branchId) : null,
      isActive: isActive !== undefined ? isActive : true,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    console.log('Creating user with data:', { ...userData, passwordHash: '[HIDDEN]' })

    const result = await db.collection('users').insertOne(userData)
    
    const user = await db.collection('users').findOne({ _id: result.insertedId })
    
    // Remove password hash from response
    const { passwordHash: _, ...userWithoutPassword } = user

    console.log('User created successfully:', userWithoutPassword)

    return NextResponse.json({
      success: true,
      data: userWithoutPassword,
      message: 'کاربر با موفقیت ایجاد شد'
    })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در ایجاد کاربر',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  } finally {
    await client.close()
  }
}

// PUT /api/users - به‌روزرسانی کاربر
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, password, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'شناسه کاربر اجباری است' },
        { status: 400 }
      )
    }

    await client.connect()
    const db = client.db('restaurant')
    
    const updateFields = {
      ...updateData,
      updatedAt: new Date()
    }

    // Hash password if provided
    if (password) {
      const saltRounds = 12
      updateFields.passwordHash = await bcrypt.hash(password, saltRounds)
    }

    // Convert ObjectId fields
    if (updateFields.branchId) {
      updateFields.branchId = new ObjectId(updateFields.branchId)
    }

    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'کاربر مورد نظر یافت نشد' },
        { status: 404 }
      )
    }

    const updatedUser = await db.collection('users').findOne({ _id: new ObjectId(id) })
    
    // Remove password hash from response
    const { passwordHash: _, ...userWithoutPassword } = updatedUser

    return NextResponse.json({
      success: true,
      data: userWithoutPassword,
      message: 'کاربر با موفقیت به‌روزرسانی شد'
    })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در به‌روزرسانی کاربر',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  } finally {
    await client.close()
  }
}

// DELETE /api/users - حذف کاربر
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'شناسه کاربر اجباری است' },
        { status: 400 }
      )
    }

    await client.connect()
    const db = client.db('restaurant')
    
    const result = await db.collection('users').deleteOne({ _id: new ObjectId(id) })

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'کاربر مورد نظر یافت نشد' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'کاربر با موفقیت حذف شد'
    })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در حذف کاربر',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  } finally {
    await client.close()
  }
}

