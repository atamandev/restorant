import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://restorenUser:1234@localhost:27017/restoren'
const DB_NAME = 'restoren'
const COLLECTION_NAME = 'staff'

let client: MongoClient
let db: any

async function connectToDatabase() {
  if (!client) {
    client = new MongoClient(MONGO_URI)
    await client.connect()
    db = client.db(DB_NAME)
  }
  return db
}

// GET - دریافت لیست کارکنان با فیلتر و pagination
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()
    const staffCollection = db.collection(COLLECTION_NAME)
    const { searchParams } = new URL(request.url)
    
    const type = searchParams.get('type') // 'list' or 'stats'
    
    if (type === 'stats') {
      // آمار کلی کارکنان
      const totalStaff = await staffCollection.countDocuments({})
      const activeStaff = await staffCollection.countDocuments({ status: 'active' })
      const inactiveStaff = await staffCollection.countDocuments({ status: 'inactive' })
      const suspendedStaff = await staffCollection.countDocuments({ status: 'suspended' })
      
      // محاسبه کل حقوق
      const staffList = await staffCollection.find({}).toArray()
      const totalSalary = staffList.reduce((sum: number, member: any) => sum + (member.salary || 0), 0)
      
      // محاسبه میانگین عملکرد
      const avgRating = staffList.length > 0
        ? staffList.reduce((sum: number, member: any) => sum + (member.performance?.rating || 0), 0) / staffList.length
        : 0
      
      // آمار بر اساس بخش
      const departmentStats = await staffCollection.aggregate([
        { $group: { _id: '$department', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]).toArray()
      
      // آمار بر اساس سمت
      const positionStats = await staffCollection.aggregate([
        { $group: { _id: '$position', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]).toArray()
      
      return NextResponse.json({
        success: true,
        data: {
          totalStaff,
          activeStaff,
          inactiveStaff,
          suspendedStaff,
          totalSalary,
          averageRating: avgRating,
          departmentStats,
          positionStats
        }
      })
    } else {
      // دریافت لیست کارکنان
      const search = searchParams.get('search') || ''
      const department = searchParams.get('department')
      const status = searchParams.get('status')
      const sortBy = searchParams.get('sortBy') || 'name'
      const sortOrder = searchParams.get('sortOrder') || 'asc'
      const limit = parseInt(searchParams.get('limit') || '100')
      const skip = parseInt(searchParams.get('skip') || '0')
      
      // ساخت فیلتر
      const filter: any = {}
      
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
          { position: { $regex: search, $options: 'i' } }
        ]
      }
      
      if (department && department !== 'all') {
        filter.department = department
      }
      
      if (status && status !== 'all') {
        filter.status = status
      }
      
      // ساخت مرتب‌سازی
      const sort: any = {}
      if (sortBy === 'hireDate') {
        sort.hireDate = sortOrder === 'asc' ? 1 : -1
      } else if (sortBy === 'salary') {
        sort.salary = sortOrder === 'asc' ? 1 : -1
      } else if (sortBy === 'performance') {
        sort['performance.rating'] = sortOrder === 'asc' ? 1 : -1
      } else {
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1
      }
      
      const staff = await staffCollection
        .find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .toArray()
      
      const total = await staffCollection.countDocuments(filter)
      
      // Format staff data
      const formattedStaff = staff.map((member: any) => ({
        ...member,
        id: member._id.toString(),
        _id: member._id.toString()
      }))
      
      return NextResponse.json({
        success: true,
        data: formattedStaff,
        total,
        page: Math.floor(skip / limit) + 1,
        totalPages: Math.ceil(total / limit)
      })
    }
  } catch (error) {
    console.error('Error fetching staff:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت لیست کارکنان' },
      { status: 500 }
    )
  }
}

// POST - ایجاد کارمند جدید
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()
    const body = await request.json()
    const staffCollection = db.collection(COLLECTION_NAME)
    
    // Validate required fields
    if (!body.name || !body.email || !body.position || !body.department) {
      return NextResponse.json(
        { success: false, message: 'نام، ایمیل، سمت و بخش اجباری هستند' },
        { status: 400 }
      )
    }
    
    // Check if email already exists
    const existing = await staffCollection.findOne({ email: body.email })
    if (existing) {
      return NextResponse.json(
        { success: false, message: 'کاربری با این ایمیل قبلاً وجود دارد' },
        { status: 409 }
      )
    }
    
    const staffMember = {
      name: body.name,
      email: body.email,
      phone: body.phone || '',
      position: body.position,
      department: body.department,
      hireDate: body.hireDate || new Date().toISOString().split('T')[0],
      salary: body.salary || 0,
      status: body.status || 'active',
      permissions: body.permissions || [],
      lastLogin: null,
      avatar: body.avatar || null,
      address: body.address || '',
      emergencyContact: body.emergencyContact || '',
      emergencyPhone: body.emergencyPhone || '',
      notes: body.notes || '',
      performance: {
        rating: 0,
        totalOrders: 0,
        totalSales: 0,
        customerSatisfaction: 0
      },
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    const result = await staffCollection.insertOne(staffMember)
    
    return NextResponse.json({
      success: true,
      data: { ...staffMember, _id: result.insertedId.toString(), id: result.insertedId.toString() },
      message: 'کارمند با موفقیت ایجاد شد'
    })
  } catch (error) {
    console.error('Error creating staff member:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در ایجاد کارمند' },
      { status: 500 }
    )
  }
}

// PUT - به‌روزرسانی کارمند
export async function PUT(request: NextRequest) {
  try {
    await connectToDatabase()
    const body = await request.json()
    const staffCollection = db.collection(COLLECTION_NAME)
    
    if (!body.id && !body._id) {
      return NextResponse.json(
        { success: false, message: 'شناسه کارمند لازم است' },
        { status: 400 }
      )
    }
    
    const staffId = body.id || body._id
    
    // Check if email is being changed and if it conflicts
    if (body.email) {
      const existing = await staffCollection.findOne({ 
        email: body.email,
        _id: { $ne: new ObjectId(staffId) }
      })
      if (existing) {
        return NextResponse.json(
          { success: false, message: 'کاربری با این ایمیل قبلاً وجود دارد' },
          { status: 409 }
        )
      }
    }
    
    const updateData: any = {
      updatedAt: new Date()
    }
    
    const allowedFields = [
      'name', 'email', 'phone', 'position', 'department', 'hireDate',
      'salary', 'status', 'permissions', 'address', 'emergencyContact',
      'emergencyPhone', 'notes', 'avatar'
    ]
    
    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    })
    
    // Update performance if provided
    if (body.performance) {
      updateData.performance = {
        ...body.performance
      }
    }
    
    const result = await staffCollection.updateOne(
      { _id: new ObjectId(staffId) },
      { $set: updateData }
    )
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'کارمند یافت نشد' },
        { status: 404 }
      )
    }
    
    const updated = await staffCollection.findOne({ _id: new ObjectId(staffId) })
    
    return NextResponse.json({
      success: true,
      data: { ...updated, id: updated._id.toString(), _id: updated._id.toString() },
      message: 'کارمند با موفقیت به‌روزرسانی شد'
    })
  } catch (error) {
    console.error('Error updating staff member:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در به‌روزرسانی کارمند' },
      { status: 500 }
    )
  }
}

// DELETE - حذف کارمند
export async function DELETE(request: NextRequest) {
  try {
    await connectToDatabase()
    const { searchParams } = new URL(request.url)
    const staffCollection = db.collection(COLLECTION_NAME)
    
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'شناسه کارمند لازم است' },
        { status: 400 }
      )
    }
    
    const result = await staffCollection.deleteOne({ _id: new ObjectId(id) })
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'کارمند یافت نشد' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'کارمند با موفقیت حذف شد'
    })
  } catch (error) {
    console.error('Error deleting staff member:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در حذف کارمند' },
      { status: 500 }
    )
  }
}

