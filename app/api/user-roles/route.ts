import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://admin:StrongPassword123@185.204.169.107:27017/restaurant?authSource=admin'
const DB_NAME = 'restaurant'

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

// GET - دریافت نقش‌ها
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'roles' // roles, users, permissions, stats
    
    if (type === 'roles') {
      const rolesCollection = db.collection('user_roles')
      const roles = await rolesCollection.find({}).toArray()
      
      // Get user count for each role
      const usersCollection = db.collection('users')
      const rolesWithCount = await Promise.all(
        roles.map(async (role: any) => {
          const userCount = await usersCollection.countDocuments({ 
            role: role.name || role._id.toString() 
          })
          return {
            ...role,
            id: role._id.toString(),
            _id: role._id.toString(),
            userCount
          }
        })
      )
      
      return NextResponse.json({
        success: true,
        data: rolesWithCount
      })
    } else if (type === 'users') {
      const usersCollection = db.collection('users')
      const rolesCollection = db.collection('user_roles')
      
      const search = searchParams.get('search') || ''
      const roleFilter = searchParams.get('role') || 'all'
      const statusFilter = searchParams.get('status') || 'all'
      
      const query: any = {}
      if (search) {
        query.$or = [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { username: { $regex: search, $options: 'i' } }
        ]
      }
      if (roleFilter !== 'all') {
        query.role = roleFilter
      }
      if (statusFilter !== 'all') {
        if (statusFilter === 'active') {
          query.isActive = true
        } else if (statusFilter === 'inactive') {
          query.isActive = false
        }
      }
      
      const users = await usersCollection.find(query).toArray()
      
      // Get role details
      const usersWithRoles = await Promise.all(
        users.map(async (user: any) => {
          const role = await rolesCollection.findOne({ 
            name: user.role 
          }) || await rolesCollection.findOne({ 
            _id: new ObjectId(user.role) 
          })
          
          return {
            id: user._id.toString(),
            _id: user._id.toString(),
            name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username,
            email: user.email,
            username: user.username,
            role: role?.name || user.role,
            roleId: role?._id?.toString() || user.role,
            status: user.isActive ? 'active' : (user.isSuspended ? 'suspended' : 'inactive'),
            lastLogin: user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('fa-IR') : '-',
            branch: user.branchId ? 'شعبه مرکزی' : '-',
            createdAt: user.createdAt ? new Date(user.createdAt).toLocaleDateString('fa-IR') : '-'
          }
        })
      )
      
      return NextResponse.json({
        success: true,
        data: usersWithRoles
      })
    } else if (type === 'permissions') {
      // Return standard permissions list
      const permissions = [
        // Dashboard
        { id: 'dashboard_view', name: 'مشاهده داشبورد', description: 'دسترسی به صفحه اصلی و آمار کلی', category: 'داشبورد', actions: ['view'] },
        // POS
        { id: 'pos_create', name: 'ایجاد سفارش', description: 'ثبت سفارشات جدید در سیستم POS', category: 'فروش', actions: ['create'] },
        { id: 'pos_update', name: 'ویرایش سفارش', description: 'تغییر سفارشات موجود', category: 'فروش', actions: ['update'] },
        { id: 'pos_delete', name: 'حذف سفارش', description: 'حذف سفارشات', category: 'فروش', actions: ['delete'] },
        { id: 'pos_view', name: 'مشاهده سفارشات', description: 'دیدن لیست سفارشات', category: 'فروش', actions: ['view'] },
        // Menu Management
        { id: 'menu_create', name: 'افزودن آیتم منو', description: 'اضافه کردن آیتم‌های جدید به منو', category: 'منو', actions: ['create'] },
        { id: 'menu_update', name: 'ویرایش منو', description: 'تغییر آیتم‌های منو', category: 'منو', actions: ['update'] },
        { id: 'menu_delete', name: 'حذف آیتم منو', description: 'حذف آیتم‌ها از منو', category: 'منو', actions: ['delete'] },
        { id: 'menu_view', name: 'مشاهده منو', description: 'دیدن منوی رستوران', category: 'منو', actions: ['view'] },
        // Inventory
        { id: 'inventory_create', name: 'ورود موجودی', description: 'ثبت ورود کالا به انبار', category: 'انبارداری', actions: ['create'] },
        { id: 'inventory_update', name: 'ویرایش موجودی', description: 'تغییر موجودی کالاها', category: 'انبارداری', actions: ['update'] },
        { id: 'inventory_delete', name: 'حذف موجودی', description: 'حذف رکوردهای موجودی', category: 'انبارداری', actions: ['delete'] },
        { id: 'inventory_view', name: 'مشاهده موجودی', description: 'دیدن موجودی انبار', category: 'انبارداری', actions: ['view'] },
        // Accounting
        { id: 'accounting_create', name: 'ثبت تراکنش مالی', description: 'ثبت دریافت و پرداخت', category: 'حسابداری', actions: ['create'] },
        { id: 'accounting_update', name: 'ویرایش تراکنش', description: 'تغییر تراکنش‌های مالی', category: 'حسابداری', actions: ['update'] },
        { id: 'accounting_delete', name: 'حذف تراکنش', description: 'حذف تراکنش‌های مالی', category: 'حسابداری', actions: ['delete'] },
        { id: 'accounting_view', name: 'مشاهده تراکنش‌ها', description: 'دیدن تراکنش‌های مالی', category: 'حسابداری', actions: ['view'] },
        { id: 'accounting_approve', name: 'تایید تراکنش', description: 'تایید تراکنش‌های مالی', category: 'حسابداری', actions: ['approve'] },
        // Reports
        { id: 'reports_view', name: 'مشاهده گزارشات', description: 'دسترسی به گزارشات سیستم', category: 'گزارشات', actions: ['view'] },
        { id: 'reports_export', name: 'صادرات گزارش', description: 'خروجی گرفتن از گزارشات', category: 'گزارشات', actions: ['export'] },
        // User Management
        { id: 'users_create', name: 'ایجاد کاربر', description: 'اضافه کردن کاربر جدید', category: 'مدیریت کاربران', actions: ['create'] },
        { id: 'users_update', name: 'ویرایش کاربر', description: 'تغییر اطلاعات کاربران', category: 'مدیریت کاربران', actions: ['update'] },
        { id: 'users_delete', name: 'حذف کاربر', description: 'حذف کاربران از سیستم', category: 'مدیریت کاربران', actions: ['delete'] },
        { id: 'users_view', name: 'مشاهده کاربران', description: 'دیدن لیست کاربران', category: 'مدیریت کاربران', actions: ['view'] },
        // Settings
        { id: 'settings_view', name: 'مشاهده تنظیمات', description: 'دسترسی به تنظیمات سیستم', category: 'تنظیمات', actions: ['view'] },
        { id: 'settings_update', name: 'ویرایش تنظیمات', description: 'تغییر تنظیمات سیستم', category: 'تنظیمات', actions: ['update'] }
      ]
      
      return NextResponse.json({
        success: true,
        data: permissions
      })
    } else if (type === 'stats') {
      const rolesCollection = db.collection('user_roles')
      const usersCollection = db.collection('users')
      
      const totalRoles = await rolesCollection.countDocuments({})
      const totalUsers = await usersCollection.countDocuments({})
      const activeUsers = await usersCollection.countDocuments({ isActive: true })
      const rolesWithUsers = await rolesCollection.find({}).toArray()
      
      const rolesData = await Promise.all(
        rolesWithUsers.map(async (role: any) => {
          const userCount = await usersCollection.countDocuments({ 
            role: role.name || role._id.toString() 
          })
          return {
            name: role.name,
            count: userCount
          }
        })
      )
      
      return NextResponse.json({
        success: true,
        data: {
          totalRoles,
          totalUsers,
          activeUsers,
          inactiveUsers: totalUsers - activeUsers,
          rolesData
        }
      })
    }
    
    return NextResponse.json({
      success: false,
      message: 'Invalid type parameter'
    }, { status: 400 })
  } catch (error) {
    console.error('Error in user-roles API:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت داده‌ها', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// POST - ایجاد نقش یا کاربر
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()
    const body = await request.json()
    const { entity } = body // 'role' or 'user'
    
    if (entity === 'role') {
      const rolesCollection = db.collection('user_roles')
      const { name, description, permissions, isSystem } = body
      
      if (!name) {
        return NextResponse.json(
          { success: false, message: 'نام نقش اجباری است' },
          { status: 400 }
        )
      }
      
      // Check if role already exists
      const existing = await rolesCollection.findOne({ name })
      if (existing) {
        return NextResponse.json(
          { success: false, message: 'نقش با این نام قبلاً وجود دارد' },
          { status: 409 }
        )
      }
      
      const role = {
        name,
        description: description || '',
        permissions: permissions || [],
        isSystem: isSystem || false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      const result = await rolesCollection.insertOne(role)
      const createdRole = await rolesCollection.findOne({ _id: result.insertedId })
      
      return NextResponse.json({
        success: true,
        data: { ...createdRole, id: createdRole._id.toString(), _id: createdRole._id.toString() },
        message: 'نقش با موفقیت ایجاد شد'
      })
    } else if (entity === 'user') {
      const usersCollection = db.collection('users')
      const { name, email, username, role, branch, password } = body
      
      if (!name || !email || !role) {
        return NextResponse.json(
          { success: false, message: 'نام، ایمیل و نقش اجباری است' },
          { status: 400 }
        )
      }
      
      // Check if user already exists
      const existing = await usersCollection.findOne({ 
        $or: [{ email }, { username }] 
      })
      if (existing) {
        return NextResponse.json(
          { success: false, message: 'کاربر با این ایمیل یا نام کاربری قبلاً وجود دارد' },
          { status: 409 }
        )
      }
      
      const nameParts = name.split(' ')
      const user = {
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        email,
        username: username || email.split('@')[0],
        role,
        branchId: branch ? new ObjectId(branch) : null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      const result = await usersCollection.insertOne(user)
      const createdUser = await usersCollection.findOne({ _id: result.insertedId })
      
      return NextResponse.json({
        success: true,
        data: {
          id: createdUser._id.toString(),
          _id: createdUser._id.toString(),
          name: `${createdUser.firstName || ''} ${createdUser.lastName || ''}`.trim() || createdUser.username,
          email: createdUser.email,
          username: createdUser.username,
          role: createdUser.role,
          status: 'active',
          branch: branch ? 'شعبه مرکزی' : '-'
        },
        message: 'کاربر با موفقیت ایجاد شد'
      })
    }
    
    return NextResponse.json(
      { success: false, message: 'Invalid entity type' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error creating entity:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در ایجاد', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// PUT - به‌روزرسانی نقش یا کاربر
export async function PUT(request: NextRequest) {
  try {
    await connectToDatabase()
    const body = await request.json()
    const { entity, id } = body
    
    if (entity === 'role') {
      const rolesCollection = db.collection('user_roles')
      const { name, description, permissions } = body
      
      const updateData: any = {
        updatedAt: new Date().toISOString()
      }
      if (name) updateData.name = name
      if (description !== undefined) updateData.description = description
      if (permissions !== undefined) updateData.permissions = permissions
      
      const result = await rolesCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData }
      )
      
      if (result.matchedCount === 0) {
        return NextResponse.json(
          { success: false, message: 'نقش مورد نظر یافت نشد' },
          { status: 404 }
        )
      }
      
      const updatedRole = await rolesCollection.findOne({ _id: new ObjectId(id) })
      return NextResponse.json({
        success: true,
        data: { ...updatedRole, id: updatedRole._id.toString(), _id: updatedRole._id.toString() },
        message: 'نقش با موفقیت به‌روزرسانی شد'
      })
    } else if (entity === 'user') {
      const usersCollection = db.collection('users')
      const { name, email, role, branch, status } = body
      
      const updateData: any = {
        updatedAt: new Date()
      }
      
      if (name) {
        const nameParts = name.split(' ')
        updateData.firstName = nameParts[0] || ''
        updateData.lastName = nameParts.slice(1).join(' ') || ''
      }
      if (email) updateData.email = email
      if (role) updateData.role = role
      if (branch) updateData.branchId = new ObjectId(branch)
      if (status !== undefined) {
        updateData.isActive = status === 'active'
        updateData.isSuspended = status === 'suspended'
      }
      
      const result = await usersCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData }
      )
      
      if (result.matchedCount === 0) {
        return NextResponse.json(
          { success: false, message: 'کاربر مورد نظر یافت نشد' },
          { status: 404 }
        )
      }
      
      const updatedUser = await usersCollection.findOne({ _id: new ObjectId(id) })
      return NextResponse.json({
        success: true,
        data: {
          id: updatedUser._id.toString(),
          _id: updatedUser._id.toString(),
          name: `${updatedUser.firstName || ''} ${updatedUser.lastName || ''}`.trim() || updatedUser.username,
          email: updatedUser.email,
          username: updatedUser.username,
          role: updatedUser.role,
          status: updatedUser.isActive ? 'active' : (updatedUser.isSuspended ? 'suspended' : 'inactive'),
          branch: updatedUser.branchId ? 'شعبه مرکزی' : '-'
        },
        message: 'کاربر با موفقیت به‌روزرسانی شد'
      })
    }
    
    return NextResponse.json(
      { success: false, message: 'Invalid entity type' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error updating entity:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در به‌روزرسانی', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// DELETE - حذف نقش یا کاربر
export async function DELETE(request: NextRequest) {
  try {
    await connectToDatabase()
    const { searchParams } = new URL(request.url)
    const entity = searchParams.get('entity') // 'role' or 'user'
    const id = searchParams.get('id')
    
    if (!entity || !id) {
      return NextResponse.json(
        { success: false, message: 'entity و id اجباری است' },
        { status: 400 }
      )
    }
    
    if (entity === 'role') {
      const rolesCollection = db.collection('user_roles')
      const role = await rolesCollection.findOne({ _id: new ObjectId(id) })
      
      if (role?.isSystem) {
        return NextResponse.json(
          { success: false, message: 'نقش سیستم را نمی‌توان حذف کرد' },
          { status: 403 }
        )
      }
      
      const result = await rolesCollection.deleteOne({ _id: new ObjectId(id) })
      
      if (result.deletedCount === 0) {
        return NextResponse.json(
          { success: false, message: 'نقش مورد نظر یافت نشد' },
          { status: 404 }
        )
      }
      
      return NextResponse.json({
        success: true,
        message: 'نقش با موفقیت حذف شد'
      })
    } else if (entity === 'user') {
      const usersCollection = db.collection('users')
      const result = await usersCollection.deleteOne({ _id: new ObjectId(id) })
      
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
    }
    
    return NextResponse.json(
      { success: false, message: 'Invalid entity type' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error deleting entity:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در حذف', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

