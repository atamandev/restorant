import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://restorenUser:1234@localhost:27017/restoren'

// GET /api/quick-sales - دریافت لیست فروش‌های سریع
export async function GET(request: NextRequest) {
  let client: MongoClient | null = null
  
  try {
    client = new MongoClient(MONGO_URI)
    await client.connect()
    const db = client.db('restoren')
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const paymentMethod = searchParams.get('paymentMethod')
    
    const skip = (page - 1) * limit
    
    // Build query
    const query: any = {}
    if (search) {
      query.$or = [
        { customerName: { $regex: search, $options: 'i' } },
        { invoiceNumber: { $regex: search, $options: 'i' } }
      ]
    }
    if (paymentMethod) {
      query.paymentMethod = paymentMethod
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
    
    const sales = await db.collection('quick_sales')
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray()
    
    const total = await db.collection('quick_sales').countDocuments(query)
    
    return NextResponse.json({
      success: true,
      data: sales,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      message: 'لیست فروش‌های سریع با موفقیت دریافت شد'
    })
  } catch (error) {
    console.error('Error fetching quick sales:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در دریافت لیست فروش‌های سریع',
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

// POST /api/quick-sales - ایجاد فروش سریع جدید
export async function POST(request: NextRequest) {
  let client: MongoClient | null = null
  
  try {
    const body = await request.json()
    console.log('Received quick sale body:', body)
    
    const { 
      customerName,
      items,
      subtotal,
      discount,
      discountAmount,
      tax,
      total,
      paymentMethod,
      invoiceNumber
    } = body

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, message: 'لیست آیتم‌ها اجباری است' },
        { status: 400 }
      )
    }

    client = new MongoClient(MONGO_URI)
    await client.connect()
    const db = client.db('restoren')
    
    // Generate invoice number if not provided
    const finalInvoiceNumber = invoiceNumber || `QS${Date.now()}`
    
    const quickSaleData = {
      customerName: customerName ? String(customerName) : null,
      items: items.map((item: any) => ({
        id: String(item.id),
        name: String(item.name),
        price: Number(item.price),
        quantity: Number(item.quantity),
        total: Number(item.total)
      })),
      subtotal: Number(subtotal),
      discount: Number(discount || 0),
      discountAmount: Number(discountAmount || 0),
      tax: Number(tax || 0),
      total: Number(total),
      paymentMethod: String(paymentMethod || 'cash'),
      invoiceNumber: finalInvoiceNumber,
      status: 'completed',
      createdAt: new Date(),
      updatedAt: new Date()
    }

    console.log('Creating quick sale with data:', quickSaleData)

    const result = await db.collection('quick_sales').insertOne(quickSaleData)
    
    const quickSale = await db.collection('quick_sales').findOne({ _id: result.insertedId })

    console.log('Quick sale created successfully:', quickSale)

    return NextResponse.json({
      success: true,
      data: quickSale,
      message: 'فروش سریع با موفقیت ثبت شد'
    })
  } catch (error) {
    console.error('Error creating quick sale:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در ثبت فروش سریع',
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

// PUT /api/quick-sales - به‌روزرسانی فروش سریع
export async function PUT(request: NextRequest) {
  let client: MongoClient | null = null
  
  try {
    const body = await request.json()
    console.log('Received update body:', body)
    
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'شناسه فروش سریع اجباری است' },
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
    if (updateFields.customerName !== undefined) {
      updateFields.customerName = updateFields.customerName ? String(updateFields.customerName) : null
    }
    if (updateFields.items !== undefined) {
      updateFields.items = updateFields.items.map((item: any) => ({
        id: String(item.id),
        name: String(item.name),
        price: Number(item.price),
        quantity: Number(item.quantity),
        total: Number(item.total)
      }))
    }
    if (updateFields.subtotal !== undefined) {
      updateFields.subtotal = Number(updateFields.subtotal)
    }
    if (updateFields.discount !== undefined) {
      updateFields.discount = Number(updateFields.discount)
    }
    if (updateFields.discountAmount !== undefined) {
      updateFields.discountAmount = Number(updateFields.discountAmount)
    }
    if (updateFields.tax !== undefined) {
      updateFields.tax = Number(updateFields.tax)
    }
    if (updateFields.total !== undefined) {
      updateFields.total = Number(updateFields.total)
    }
    if (updateFields.paymentMethod !== undefined) {
      updateFields.paymentMethod = String(updateFields.paymentMethod)
    }
    if (updateFields.invoiceNumber !== undefined) {
      updateFields.invoiceNumber = String(updateFields.invoiceNumber)
    }
    if (updateFields.status !== undefined) {
      updateFields.status = String(updateFields.status)
    }

    console.log('Updating quick sale with data:', updateFields)

    const result = await db.collection('quick_sales').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    )

    console.log('Update result:', result)

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'فروش سریع مورد نظر یافت نشد' },
        { status: 404 }
      )
    }

    const updatedQuickSale = await db.collection('quick_sales').findOne({ _id: new ObjectId(id) })

    console.log('Updated quick sale:', updatedQuickSale)

    return NextResponse.json({
      success: true,
      data: updatedQuickSale,
      message: 'فروش سریع با موفقیت به‌روزرسانی شد'
    })
  } catch (error) {
    console.error('Error updating quick sale:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در به‌روزرسانی فروش سریع',
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

// DELETE /api/quick-sales - حذف فروش سریع
export async function DELETE(request: NextRequest) {
  let client: MongoClient | null = null
  
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'شناسه فروش سریع اجباری است' },
        { status: 400 }
      )
    }

    client = new MongoClient(MONGO_URI)
    await client.connect()
    const db = client.db('restoren')
    
    const result = await db.collection('quick_sales').deleteOne({ _id: new ObjectId(id) })

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'فروش سریع مورد نظر یافت نشد' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'فروش سریع با موفقیت حذف شد'
    })
  } catch (error) {
    console.error('Error deleting quick sale:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در حذف فروش سریع',
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
