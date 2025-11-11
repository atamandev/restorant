import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://restorenUser:1234@localhost:27017/restoren'

// GET /api/tables - دریافت لیست میزها
export async function GET(request: NextRequest) {
  let client: MongoClient | null = null
  
  try {
    client = new MongoClient(MONGO_URI)
    await client.connect()
    const db = client.db('restoren')
    
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const branchId = searchParams.get('branchId')
    
    console.log('Tables API: Request params - status:', status, 'branchId:', branchId)
    
    // Build query
    const query: any = {}
    if (status) {
      query.status = status
    }
    if (branchId) {
      try {
        query.branchId = new ObjectId(branchId)
        console.log('Tables API: Query with branchId:', query)
      } catch (error) {
        console.error('Tables API: Invalid branchId format:', branchId, error)
        return NextResponse.json({
          success: false,
          message: 'فرمت شناسه شعبه نامعتبر است',
          error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 400 })
      }
    }
    
    const tables = await db.collection('tables')
      .find(query)
      .toArray()
    
    // Sort tables by number (numerically)
    tables.sort((a: any, b: any) => {
      const numA = parseInt(a.number) || 0
      const numB = parseInt(b.number) || 0
      return numA - numB
    })
    
    console.log('Tables API: Found', tables.length, 'tables (sorted by number)')
    
    return NextResponse.json({
      success: true,
      data: tables,
      message: 'لیست میزها با موفقیت دریافت شد'
    })
  } catch (error) {
    console.error('Error fetching tables:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در دریافت لیست میزها',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  } finally {
    if (client) {
      await client.close()
    }
  }
}

// POST /api/tables - ایجاد میز جدید
export async function POST(request: NextRequest) {
  let client: MongoClient | null = null
  
  try {
    const body = await request.json()
    console.log('Received table body:', body)
    
    const { 
      number,
      capacity,
      status,
      location
    } = body

    // Validate required fields
    if (!number || !capacity) {
      return NextResponse.json(
        { success: false, message: 'شماره میز و ظرفیت اجباری است' },
        { status: 400 }
      )
    }

    client = new MongoClient(MONGO_URI)
    await client.connect()
    const db = client.db('restoren')
    
    const tableData = {
      number: String(number),
      capacity: Number(capacity),
      status: String(status || 'available'),
      location: location ? String(location) : null,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    console.log('Creating table with data:', tableData)

    const result = await db.collection('tables').insertOne(tableData)
    
    const table = await db.collection('tables').findOne({ _id: result.insertedId })

    console.log('Table created successfully:', table)

    return NextResponse.json({
      success: true,
      data: table,
      message: 'میز با موفقیت ایجاد شد'
    })
  } catch (error) {
    console.error('Error creating table:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در ایجاد میز',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  } finally {
    if (client) {
      await client.close()
    }
  }
}

// PUT /api/tables - به‌روزرسانی میز
export async function PUT(request: NextRequest) {
  let client: MongoClient | null = null
  
  try {
    const body = await request.json()
    console.log('Received update body:', body)
    
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'شناسه میز اجباری است' },
        { status: 400 }
      )
    }

    client = new MongoClient(MONGO_URI)
    await client.connect()
    const db = client.db('restoren')
    
    const updateFields: any = {
      ...updateData,
      updatedAt: new Date()
    }

    // Convert fields
    if (updateFields.number !== undefined) {
      updateFields.number = String(updateFields.number)
    }
    if (updateFields.capacity !== undefined) {
      updateFields.capacity = Number(updateFields.capacity)
    }
    if (updateFields.status !== undefined) {
      updateFields.status = String(updateFields.status)
    }
    if (updateFields.location !== undefined) {
      updateFields.location = updateFields.location ? String(updateFields.location) : null
    }

    console.log('Updating table with data:', updateFields)

    const result = await db.collection('tables').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    )

    console.log('Update result:', result)

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'میز مورد نظر یافت نشد' },
        { status: 404 }
      )
    }

    const updatedTable = await db.collection('tables').findOne({ _id: new ObjectId(id) })

    console.log('Updated table:', updatedTable)

    return NextResponse.json({
      success: true,
      data: updatedTable,
      message: 'میز با موفقیت به‌روزرسانی شد'
    })
  } catch (error) {
    console.error('Error updating table:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در به‌روزرسانی میز',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  } finally {
    if (client) {
      await client.close()
    }
  }
}

// DELETE /api/tables - حذف میز
export async function DELETE(request: NextRequest) {
  let client: MongoClient | null = null
  
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'شناسه میز اجباری است' },
        { status: 400 }
      )
    }

    client = new MongoClient(MONGO_URI)
    await client.connect()
    const db = client.db('restoren')
    
    const result = await db.collection('tables').deleteOne({ _id: new ObjectId(id) })

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'میز مورد نظر یافت نشد' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'میز با موفقیت حذف شد'
    })
  } catch (error) {
    console.error('Error deleting table:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در حذف میز',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  } finally {
    if (client) {
      await client.close()
    }
  }
}
