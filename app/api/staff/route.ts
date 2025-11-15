import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://admin:StrongPassword123@185.204.169.107:27017/restaurant?authSource=admin'
const DB_NAME = 'restaurant'
const COLLECTION_NAME = 'staff'

let client: MongoClient | undefined
let db: any

async function connectToDatabase() {
  try {
    if (!client) {
      client = new MongoClient(MONGO_URI)
      await client.connect()
      db = client.db(DB_NAME)
    } else if (!db) {
      db = client.db(DB_NAME)
    }
    
    // Test connection
    if (db) {
      try {
        await db.admin().ping()
      } catch (pingError) {
        console.warn('MongoDB ping failed, but continuing:', pingError)
      }
    }
    
    if (!db) {
      throw new Error('Database connection failed: db is null')
    }
    
    return db
  } catch (error) {
    console.error('Database connection error:', error)
    // Reset connection on error
    if (client) {
      try {
        await client.close()
      } catch (e) {
        // Ignore close errors
      }
      client = undefined
    }
    db = null
    throw error
  }
}

// GET - دریافت لیست کارکنان با فیلتر و pagination
export async function GET(request: NextRequest) {
  try {
    const db = await connectToDatabase()
    if (!db) {
      return NextResponse.json(
        { success: false, message: 'خطا در اتصال به دیتابیس' },
        { status: 500 }
      )
    }
    const staffCollection = db.collection(COLLECTION_NAME)
    const { searchParams } = new URL(request.url)
    
    const type = searchParams.get('type') // 'list' or 'stats'
    
    if (type === 'stats') {
      // آمار کلی کارکنان
      const totalStaff = await staffCollection.countDocuments({})
      const activeStaff = await staffCollection.countDocuments({ status: 'active' })
      const inactiveStaff = await staffCollection.countDocuments({ status: 'inactive' })
      const suspendedStaff = await staffCollection.countDocuments({ status: 'suspended' })
      
      // بهینه‌سازی: استفاده از aggregate برای محاسبه همه آمار به صورت موازی
      const [salaryResult, ratingResult, departmentStats, positionStats] = await Promise.all([
        // محاسبه کل حقوق
        staffCollection.aggregate([
          { $group: { _id: null, totalSalary: { $sum: '$salary' } } }
        ]).toArray(),
        // محاسبه میانگین عملکرد
        staffCollection.aggregate([
          { $group: { _id: null, avgRating: { $avg: '$performance.rating' }, count: { $sum: 1 } } }
        ]).toArray(),
        // آمار بر اساس بخش
        staffCollection.aggregate([
          { $group: { _id: '$department', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ]).toArray(),
        // آمار بر اساس سمت
        staffCollection.aggregate([
          { $group: { _id: '$position', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ]).toArray()
      ])
      
      const totalSalary = salaryResult[0]?.totalSalary || 0
      const avgRating = ratingResult[0]?.avgRating || 0
      
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
      
      // بهینه‌سازی: استفاده از text search یا regex بهینه
      if (search && search.trim()) {
        const searchRegex = { $regex: search.trim(), $options: 'i' }
        filter.$or = [
          { name: searchRegex },
          { email: searchRegex },
          { phone: searchRegex },
          { position: searchRegex }
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
      
      // بهینه‌سازی: استفاده از projection برای کاهش حجم داده
      const projection = {
        name: 1,
        email: 1,
        phone: 1,
        position: 1,
        department: 1,
        hireDate: 1,
        salary: 1,
        status: 1,
        permissions: 1,
        address: 1,
        notes: 1,
        performance: 1,
        createdAt: 1,
        updatedAt: 1
      }
      
      // بهینه‌سازی: اجرای موازی query و count
      const [staff, total] = await Promise.all([
        staffCollection
          .find(filter, { projection })
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .toArray(),
        staffCollection.countDocuments(filter)
      ])
      
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
    const db = await connectToDatabase()
    if (!db) {
      return NextResponse.json(
        { success: false, message: 'خطا در اتصال به دیتابیس' },
        { status: 500 }
      )
    }
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
    const db = await connectToDatabase()
    if (!db) {
      return NextResponse.json(
        { success: false, message: 'خطا در اتصال به دیتابیس' },
        { status: 500 }
      )
    }
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
    const db = await connectToDatabase()
    if (!db) {
      return NextResponse.json(
        { success: false, message: 'خطا در اتصال به دیتابیس' },
        { status: 500 }
      )
    }
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

