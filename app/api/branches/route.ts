import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://restorenUser:1234@localhost:27017/restoren'
const DB_NAME = 'restoren'

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

// GET /api/branches - دریافت لیست شعبه‌ها
export async function GET(request: NextRequest) {
  try {
    const db = await connectToDatabase()
    
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
  }
}

// Helper function to sync tables for a branch
async function syncTablesForBranch(db: any, branchId: ObjectId, numberOfTables: number) {
  try {
    console.log(`[syncTablesForBranch] Starting sync for branch ${branchId}, target: ${numberOfTables} tables`)
    
    const targetCount = numberOfTables || 0
    
    // اگر تعداد میزها 0 یا کمتر باشد، همه میزهای موجود را حذف کن
    if (targetCount <= 0) {
      console.log(`[syncTablesForBranch] Target count is 0, deleting all tables for branch ${branchId}`)
      await db.collection('tables').deleteMany({ branchId: branchId })
      return
    }
    
    // Get current tables for this branch
    const currentTables = await db.collection('tables')
      .find({ branchId: branchId })
      .sort({ number: 1 })
      .toArray()
    
    console.log(`[syncTablesForBranch] Current tables count: ${currentTables.length}, target: ${targetCount}`)
    
    // بررسی میزهای دارای سفارش فعال
    const tablesWithActiveOrders: string[] = []
    for (const table of currentTables) {
      const activeOrders = await db.collection('table_orders').countDocuments({
        tableNumber: table.number,
        status: { $in: ['pending', 'confirmed', 'preparing', 'ready'] }
      })
      const activeDineInOrders = await db.collection('dine_in_orders').countDocuments({
        tableNumber: table.number,
        status: { $in: ['pending', 'preparing', 'ready'] }
      })
      
      if (activeOrders > 0 || activeDineInOrders > 0) {
        tablesWithActiveOrders.push(table.number)
      }
    }
    
    // اگر میزهای دارای سفارش فعال وجود ندارند، همه میزها را حذف کن و از ابتدا ایجاد کن
    if (tablesWithActiveOrders.length === 0) {
      console.log(`[syncTablesForBranch] No active orders, recreating all tables from scratch`)
      
      // حذف همه میزها
      await db.collection('tables').deleteMany({ branchId: branchId })
      
      // ایجاد میزهای جدید از 1 تا targetCount
      const tablesToCreate = []
      for (let i = 1; i <= targetCount; i++) {
        tablesToCreate.push({
          number: String(i),
          capacity: 4, // Default capacity
          status: 'available',
          branchId: branchId,
          createdAt: new Date(),
          updatedAt: new Date()
        })
      }
      
      if (tablesToCreate.length > 0) {
        console.log(`[syncTablesForBranch] Creating ${tablesToCreate.length} new tables starting from number 1`)
        const result = await db.collection('tables').insertMany(tablesToCreate)
        console.log(`[syncTablesForBranch] Successfully created ${result.insertedCount} tables for branch ${branchId}`)
      }
    } else {
      // اگر میزهای دارای سفارش فعال وجود دارند، فقط میزهای بدون سفارش را مدیریت کن
      console.log(`[syncTablesForBranch] ${tablesWithActiveOrders.length} tables have active orders, preserving them`)
      
      // حذف میزهای بدون سفارش فعال
      const tablesToDelete = currentTables.filter((t: any) => !tablesWithActiveOrders.includes(t.number))
      if (tablesToDelete.length > 0) {
        console.log(`[syncTablesForBranch] Deleting ${tablesToDelete.length} tables without active orders`)
        const tableIds = tablesToDelete.map((t: any) => t._id)
        await db.collection('tables').deleteMany({ _id: { $in: tableIds } })
      }
      
      // محاسبه تعداد میزهای مورد نیاز
      const currentCountAfterDelete = tablesWithActiveOrders.length
      const tablesToCreate = targetCount - currentCountAfterDelete
      
      if (tablesToCreate > 0) {
        console.log(`[syncTablesForBranch] Creating ${tablesToCreate} new tables`)
        
        // پیدا کردن آخرین شماره میز موجود
        const existingNumbers = currentTables
          .filter((t: any) => tablesWithActiveOrders.includes(t.number))
          .map((t: any) => parseInt(t.number) || 0)
        const maxNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0
        
        const newTables = []
        for (let i = 1; i <= tablesToCreate; i++) {
          newTables.push({
            number: String(maxNumber + i),
            capacity: 4,
            status: 'available',
            branchId: branchId,
            createdAt: new Date(),
            updatedAt: new Date()
          })
        }
        
        if (newTables.length > 0) {
          console.log(`[syncTablesForBranch] Tables to create:`, newTables)
          const result = await db.collection('tables').insertMany(newTables)
          console.log(`[syncTablesForBranch] Successfully created ${result.insertedCount} tables for branch ${branchId}`)
        }
      } else if (tablesToCreate < 0) {
        // اگر تعداد میزهای موجود بیشتر از هدف است، نمی‌توانیم میزهای دارای سفارش فعال را حذف کنیم
        console.warn(`[syncTablesForBranch] Warning: Cannot reduce tables below ${currentCountAfterDelete} (tables with active orders)`)
      }
    }
    
    // بررسی نهایی
    const finalTables = await db.collection('tables')
      .find({ branchId: branchId })
      .toArray()
    
    console.log(`[syncTablesForBranch] Sync completed. Final count: ${finalTables.length}, target: ${targetCount}`)
  } catch (error) {
    console.error('Error syncing tables for branch:', error)
    // Don't throw, just log the error
  }
}

// POST /api/branches - ایجاد شعبه جدید
export async function POST(request: NextRequest) {
  try {
    const db = await connectToDatabase()
    const body = await request.json()
    
    const { name, address, phoneNumber, email, manager, capacity, numberOfTables, openingHours, isActive } = body

    // Validate required fields
    if (!name || !address) {
      return NextResponse.json(
        { success: false, message: 'نام و آدرس شعبه اجباری است' },
        { status: 400 }
      )
    }
    
    const branchData = {
      name,
      address,
      phoneNumber: phoneNumber || null,
      email: email || null,
      manager: manager || null,
      capacity: capacity ? parseInt(capacity) : null,
      numberOfTables: numberOfTables ? parseInt(numberOfTables) : 0,
      isActive: isActive !== undefined ? isActive : true,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await db.collection('branches').insertOne(branchData)
    
    const branch = await db.collection('branches').findOne({ _id: result.insertedId })
    
    // Add empty cashRegisters array to new branch
    branch.cashRegisters = []

    // Sync tables for the new branch
    if (numberOfTables && numberOfTables > 0) {
      await syncTablesForBranch(db, result.insertedId, numberOfTables)
    }

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
  }
}

// PUT /api/branches - به‌روزرسانی شعبه
export async function PUT(request: NextRequest) {
  try {
    const db = await connectToDatabase()
    const body = await request.json()
    const { id, numberOfTables, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'شناسه شعبه اجباری است' },
        { status: 400 }
      )
    }
    
    const branchId = new ObjectId(id)
    
    // Get current branch to check if numberOfTables changed
    const currentBranch = await db.collection('branches').findOne({ _id: branchId })
    const currentNumberOfTables = currentBranch?.numberOfTables || 0
    const newNumberOfTables = numberOfTables ? parseInt(numberOfTables) : currentNumberOfTables
    
    const updateFields = {
      ...updateData,
      numberOfTables: newNumberOfTables,
      updatedAt: new Date()
    }

    const result = await db.collection('branches').updateOne(
      { _id: branchId },
      { $set: updateFields }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'شعبه مورد نظر یافت نشد' },
        { status: 404 }
      )
    }

    // Sync tables if numberOfTables changed
    if (newNumberOfTables !== currentNumberOfTables) {
      await syncTablesForBranch(db, branchId, newNumberOfTables)
    }

    const updatedBranch = await db.collection('branches').findOne({ _id: branchId })
    
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
  }
}

// DELETE /api/branches - حذف شعبه
export async function DELETE(request: NextRequest) {
  try {
    const db = await connectToDatabase()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'شناسه شعبه اجباری است' },
        { status: 400 }
      )
    }
    
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
  }
}