import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://restorenUser:1234@localhost:27017/restoren'

// GET /api/cashier-sessions - دریافت لیست جلسات صندوق
export async function GET(request: NextRequest) {
  let client: MongoClient | null = null
  
  try {
    client = new MongoClient(MONGO_URI)
    await client.connect()
    const db = client.db('restoren')
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const userId = searchParams.get('userId')
    
    const skip = (page - 1) * limit
    
    // Build query
    const query: any = {}
    if (status) {
      query.status = status
    }
    if (userId) {
      query.userId = userId
    }
    if (dateFrom || dateTo) {
      query.createdAt = {}
      if (dateFrom) {
        query.createdAt.$gte = new Date(dateFrom)
      }
      if (dateTo) {
        query.createdAt.$lte = new Date(dateTo)
      }
    }
    
    const sessions = await db.collection('cashier_sessions')
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray()
    
    const total = await db.collection('cashier_sessions').countDocuments(query)
    
    return NextResponse.json({
      success: true,
      data: sessions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      message: 'لیست جلسات صندوق با موفقیت دریافت شد'
    })
  } catch (error) {
    console.error('Error fetching cashier sessions:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در دریافت لیست جلسات صندوق',
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

// POST /api/cashier-sessions - ایجاد جلسه صندوق جدید
export async function POST(request: NextRequest) {
  let client: MongoClient | null = null
  
  try {
    const body = await request.json()
    console.log('Received cashier session body:', body)
    
    const { 
      userId,
      startAmount,
      notes
    } = body

    // Validate required fields
    if (!userId || startAmount === undefined) {
      return NextResponse.json(
        { success: false, message: 'شناسه کاربر و موجودی اولیه اجباری است' },
        { status: 400 }
      )
    }

    client = new MongoClient(MONGO_URI)
    await client.connect()
    const db = client.db('restoren')
    
    const sessionData = {
      userId: String(userId),
      startTime: new Date().toLocaleTimeString('fa-IR'),
      startAmount: Number(startAmount),
      totalSales: 0,
      totalTransactions: 0,
      cashSales: 0,
      cardSales: 0,
      creditSales: 0,
      refunds: 0,
      discounts: 0,
      taxes: 0,
      serviceCharges: 0,
      status: 'open',
      notes: notes ? String(notes) : null,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    console.log('Creating cashier session with data:', sessionData)

    const result = await db.collection('cashier_sessions').insertOne(sessionData)
    
    const session = await db.collection('cashier_sessions').findOne({ _id: result.insertedId })

    console.log('Cashier session created successfully:', session)

    return NextResponse.json({
      success: true,
      data: session,
      message: 'جلسه صندوق با موفقیت ایجاد شد'
    })
  } catch (error) {
    console.error('Error creating cashier session:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در ایجاد جلسه صندوق',
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

// PUT /api/cashier-sessions - به‌روزرسانی جلسه صندوق
export async function PUT(request: NextRequest) {
  let client: MongoClient | null = null
  
  try {
    const body = await request.json()
    console.log('Received update body:', body)
    
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'شناسه جلسه صندوق اجباری است' },
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
    if (updateFields.userId !== undefined) {
      updateFields.userId = String(updateFields.userId)
    }
    if (updateFields.startTime !== undefined) {
      updateFields.startTime = String(updateFields.startTime)
    }
    if (updateFields.endTime !== undefined) {
      updateFields.endTime = String(updateFields.endTime)
    }
    if (updateFields.startAmount !== undefined) {
      updateFields.startAmount = Number(updateFields.startAmount)
    }
    if (updateFields.endAmount !== undefined) {
      updateFields.endAmount = Number(updateFields.endAmount)
    }
    if (updateFields.totalSales !== undefined) {
      updateFields.totalSales = Number(updateFields.totalSales)
    }
    if (updateFields.totalTransactions !== undefined) {
      updateFields.totalTransactions = Number(updateFields.totalTransactions)
    }
    if (updateFields.cashSales !== undefined) {
      updateFields.cashSales = Number(updateFields.cashSales)
    }
    if (updateFields.cardSales !== undefined) {
      updateFields.cardSales = Number(updateFields.cardSales)
    }
    if (updateFields.creditSales !== undefined) {
      updateFields.creditSales = Number(updateFields.creditSales)
    }
    if (updateFields.refunds !== undefined) {
      updateFields.refunds = Number(updateFields.refunds)
    }
    if (updateFields.discounts !== undefined) {
      updateFields.discounts = Number(updateFields.discounts)
    }
    if (updateFields.taxes !== undefined) {
      updateFields.taxes = Number(updateFields.taxes)
    }
    if (updateFields.serviceCharges !== undefined) {
      updateFields.serviceCharges = Number(updateFields.serviceCharges)
    }
    if (updateFields.status !== undefined) {
      updateFields.status = String(updateFields.status)
    }
    if (updateFields.notes !== undefined) {
      updateFields.notes = updateFields.notes ? String(updateFields.notes) : null
    }

    console.log('Updating cashier session with data:', updateFields)

    const result = await db.collection('cashier_sessions').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    )

    console.log('Update result:', result)

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'جلسه صندوق مورد نظر یافت نشد' },
        { status: 404 }
      )
    }

    const updatedSession = await db.collection('cashier_sessions').findOne({ _id: new ObjectId(id) })

    console.log('Updated cashier session:', updatedSession)

    return NextResponse.json({
      success: true,
      data: updatedSession,
      message: 'جلسه صندوق با موفقیت به‌روزرسانی شد'
    })
  } catch (error) {
    console.error('Error updating cashier session:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در به‌روزرسانی جلسه صندوق',
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

// DELETE /api/cashier-sessions - حذف جلسه صندوق
export async function DELETE(request: NextRequest) {
  let client: MongoClient | null = null
  
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'شناسه جلسه صندوق اجباری است' },
        { status: 400 }
      )
    }

    client = new MongoClient(MONGO_URI)
    await client.connect()
    const db = client.db('restoren')
    
    const result = await db.collection('cashier_sessions').deleteOne({ _id: new ObjectId(id) })

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'جلسه صندوق مورد نظر یافت نشد' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'جلسه صندوق با موفقیت حذف شد'
    })
  } catch (error) {
    console.error('Error deleting cashier session:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در حذف جلسه صندوق',
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
