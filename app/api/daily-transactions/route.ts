import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://admin:StrongPassword123@185.204.169.107:27017/restaurant?authSource=admin'

// GET /api/daily-transactions - دریافت لیست تراکنش‌های روزانه
export async function GET(request: NextRequest) {
  let client: MongoClient | null = null
  
  try {
    client = new MongoClient(MONGO_URI)
    await client.connect()
    const db = client.db('restaurant')
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const type = searchParams.get('type')
    const paymentMethod = searchParams.get('paymentMethod')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const sessionId = searchParams.get('sessionId')
    
    const skip = (page - 1) * limit
    
    // Build query
    const query: any = {}
    if (type) {
      query.type = type
    }
    if (paymentMethod) {
      query.paymentMethod = paymentMethod
    }
    if (sessionId) {
      query.sessionId = sessionId
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
    
    const transactions = await db.collection('daily_transactions')
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray()
    
    const total = await db.collection('daily_transactions').countDocuments(query)
    
    return NextResponse.json({
      success: true,
      data: transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      message: 'لیست تراکنش‌های روزانه با موفقیت دریافت شد'
    })
  } catch (error) {
    console.error('Error fetching daily transactions:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در دریافت لیست تراکنش‌های روزانه',
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

// POST /api/daily-transactions - ایجاد تراکنش روزانه جدید
export async function POST(request: NextRequest) {
  let client: MongoClient | null = null
  
  try {
    const body = await request.json()
    console.log('Received daily transaction body:', body)
    
    const { 
      sessionId,
      type,
      amount,
      paymentMethod,
      description,
      orderNumber,
      customerName,
      notes
    } = body

    // Validate required fields
    if (!sessionId || !type || amount === undefined || !paymentMethod) {
      return NextResponse.json(
        { success: false, message: 'شناسه جلسه، نوع، مبلغ و روش پرداخت اجباری است' },
        { status: 400 }
      )
    }

    client = new MongoClient(MONGO_URI)
    await client.connect()
    const db = client.db('restaurant')
    
    const transactionData = {
      sessionId: String(sessionId),
      time: new Date().toLocaleTimeString('fa-IR'),
      type: String(type),
      amount: Number(amount),
      paymentMethod: String(paymentMethod),
      description: description ? String(description) : null,
      orderNumber: orderNumber ? String(orderNumber) : null,
      customerName: customerName ? String(customerName) : null,
      notes: notes ? String(notes) : null,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    console.log('Creating daily transaction with data:', transactionData)

    const result = await db.collection('daily_transactions').insertOne(transactionData)
    
    const transaction = await db.collection('daily_transactions').findOne({ _id: result.insertedId })

    console.log('Daily transaction created successfully:', transaction)

    return NextResponse.json({
      success: true,
      data: transaction,
      message: 'تراکنش روزانه با موفقیت ثبت شد'
    })
  } catch (error) {
    console.error('Error creating daily transaction:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در ثبت تراکنش روزانه',
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

// PUT /api/daily-transactions - به‌روزرسانی تراکنش روزانه
export async function PUT(request: NextRequest) {
  let client: MongoClient | null = null
  
  try {
    const body = await request.json()
    console.log('Received update body:', body)
    
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'شناسه تراکنش روزانه اجباری است' },
        { status: 400 }
      )
    }

    client = new MongoClient(MONGO_URI)
    await client.connect()
    const db = client.db('restaurant')
    
    const updateFields: any = {
      ...updateData,
      updatedAt: new Date()
    }

    // Convert fields
    if (updateFields.sessionId !== undefined) {
      updateFields.sessionId = String(updateFields.sessionId)
    }
    if (updateFields.time !== undefined) {
      updateFields.time = String(updateFields.time)
    }
    if (updateFields.type !== undefined) {
      updateFields.type = String(updateFields.type)
    }
    if (updateFields.amount !== undefined) {
      updateFields.amount = Number(updateFields.amount)
    }
    if (updateFields.paymentMethod !== undefined) {
      updateFields.paymentMethod = String(updateFields.paymentMethod)
    }
    if (updateFields.description !== undefined) {
      updateFields.description = updateFields.description ? String(updateFields.description) : null
    }
    if (updateFields.orderNumber !== undefined) {
      updateFields.orderNumber = updateFields.orderNumber ? String(updateFields.orderNumber) : null
    }
    if (updateFields.customerName !== undefined) {
      updateFields.customerName = updateFields.customerName ? String(updateFields.customerName) : null
    }
    if (updateFields.notes !== undefined) {
      updateFields.notes = updateFields.notes ? String(updateFields.notes) : null
    }

    console.log('Updating daily transaction with data:', updateFields)

    const result = await db.collection('daily_transactions').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    )

    console.log('Update result:', result)

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'تراکنش روزانه مورد نظر یافت نشد' },
        { status: 404 }
      )
    }

    const updatedTransaction = await db.collection('daily_transactions').findOne({ _id: new ObjectId(id) })

    console.log('Updated daily transaction:', updatedTransaction)

    return NextResponse.json({
      success: true,
      data: updatedTransaction,
      message: 'تراکنش روزانه با موفقیت به‌روزرسانی شد'
    })
  } catch (error) {
    console.error('Error updating daily transaction:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در به‌روزرسانی تراکنش روزانه',
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

// DELETE /api/daily-transactions - حذف تراکنش روزانه
export async function DELETE(request: NextRequest) {
  let client: MongoClient | null = null
  
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'شناسه تراکنش روزانه اجباری است' },
        { status: 400 }
      )
    }

    client = new MongoClient(MONGO_URI)
    await client.connect()
    const db = client.db('restaurant')
    
    const result = await db.collection('daily_transactions').deleteOne({ _id: new ObjectId(id) })

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'تراکنش روزانه مورد نظر یافت نشد' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'تراکنش روزانه با موفقیت حذف شد'
    })
  } catch (error) {
    console.error('Error deleting daily transaction:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در حذف تراکنش روزانه',
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
