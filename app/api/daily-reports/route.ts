import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://restorenUser:1234@localhost:27017/restoren'

// GET /api/daily-reports - دریافت لیست گزارشات روزانه
export async function GET(request: NextRequest) {
  let client: MongoClient | null = null
  
  try {
    client = new MongoClient(MONGO_URI)
    await client.connect()
    const db = client.db('restoren')
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const branchId = searchParams.get('branchId')
    
    const skip = (page - 1) * limit
    
    // Build query
    const query: any = {}
    if (branchId) {
      query.branchId = branchId
    }
    if (dateFrom || dateTo) {
      query.date = {}
      if (dateFrom) {
        query.date.$gte = new Date(dateFrom)
      }
      if (dateTo) {
        query.date.$lte = new Date(dateTo)
      }
    }
    
    const reports = await db.collection('daily_reports')
      .find(query)
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)
      .toArray()
    
    const total = await db.collection('daily_reports').countDocuments(query)
    
    return NextResponse.json({
      success: true,
      data: reports,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      message: 'لیست گزارشات روزانه با موفقیت دریافت شد'
    })
  } catch (error) {
    console.error('Error fetching daily reports:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در دریافت لیست گزارشات روزانه',
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

// POST /api/daily-reports - ایجاد گزارش روزانه جدید
export async function POST(request: NextRequest) {
  let client: MongoClient | null = null
  
  try {
    const body = await request.json()
    console.log('Received daily report body:', body)
    
    const { 
      date,
      branchId,
      totalSales,
      totalOrders,
      totalCustomers,
      averageOrderValue,
      cashSales,
      cardSales,
      creditSales,
      refunds,
      discounts,
      taxes,
      serviceCharges,
      netProfit,
      topSellingItems,
      hourlySales,
      paymentMethods,
      notes
    } = body

    // Validate required fields
    if (!date || totalSales === undefined || totalOrders === undefined) {
      return NextResponse.json(
        { success: false, message: 'تاریخ، کل فروش و تعداد سفارشات اجباری است' },
        { status: 400 }
      )
    }

    client = new MongoClient(MONGO_URI)
    await client.connect()
    const db = client.db('restoren')
    
    const reportData = {
      date: new Date(date),
      branchId: branchId ? String(branchId) : null,
      totalSales: Number(totalSales),
      totalOrders: Number(totalOrders),
      totalCustomers: Number(totalCustomers || 0),
      averageOrderValue: Number(averageOrderValue || 0),
      cashSales: Number(cashSales || 0),
      cardSales: Number(cardSales || 0),
      creditSales: Number(creditSales || 0),
      refunds: Number(refunds || 0),
      discounts: Number(discounts || 0),
      taxes: Number(taxes || 0),
      serviceCharges: Number(serviceCharges || 0),
      netProfit: Number(netProfit || 0),
      topSellingItems: Array.isArray(topSellingItems) ? topSellingItems.map((item: any) => ({
        name: String(item.name),
        quantity: Number(item.quantity),
        revenue: Number(item.revenue)
      })) : [],
      hourlySales: Array.isArray(hourlySales) ? hourlySales.map((hour: any) => ({
        hour: String(hour.hour),
        sales: Number(hour.sales),
        orders: Number(hour.orders)
      })) : [],
      paymentMethods: Array.isArray(paymentMethods) ? paymentMethods.map((method: any) => ({
        method: String(method.method),
        amount: Number(method.amount),
        percentage: Number(method.percentage)
      })) : [],
      notes: notes ? String(notes) : null,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    console.log('Creating daily report with data:', reportData)

    const result = await db.collection('daily_reports').insertOne(reportData)
    
    const report = await db.collection('daily_reports').findOne({ _id: result.insertedId })

    console.log('Daily report created successfully:', report)

    return NextResponse.json({
      success: true,
      data: report,
      message: 'گزارش روزانه با موفقیت ایجاد شد'
    })
  } catch (error) {
    console.error('Error creating daily report:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در ایجاد گزارش روزانه',
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

// PUT /api/daily-reports - به‌روزرسانی گزارش روزانه
export async function PUT(request: NextRequest) {
  let client: MongoClient | null = null
  
  try {
    const body = await request.json()
    console.log('Received update body:', body)
    
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'شناسه گزارش روزانه اجباری است' },
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
    if (updateFields.date !== undefined) {
      updateFields.date = new Date(updateFields.date)
    }
    if (updateFields.branchId !== undefined) {
      updateFields.branchId = updateFields.branchId ? String(updateFields.branchId) : null
    }
    if (updateFields.totalSales !== undefined) {
      updateFields.totalSales = Number(updateFields.totalSales)
    }
    if (updateFields.totalOrders !== undefined) {
      updateFields.totalOrders = Number(updateFields.totalOrders)
    }
    if (updateFields.totalCustomers !== undefined) {
      updateFields.totalCustomers = Number(updateFields.totalCustomers)
    }
    if (updateFields.averageOrderValue !== undefined) {
      updateFields.averageOrderValue = Number(updateFields.averageOrderValue)
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
    if (updateFields.netProfit !== undefined) {
      updateFields.netProfit = Number(updateFields.netProfit)
    }
    if (updateFields.topSellingItems !== undefined) {
      updateFields.topSellingItems = Array.isArray(updateFields.topSellingItems) ? updateFields.topSellingItems.map((item: any) => ({
        name: String(item.name),
        quantity: Number(item.quantity),
        revenue: Number(item.revenue)
      })) : []
    }
    if (updateFields.hourlySales !== undefined) {
      updateFields.hourlySales = Array.isArray(updateFields.hourlySales) ? updateFields.hourlySales.map((hour: any) => ({
        hour: String(hour.hour),
        sales: Number(hour.sales),
        orders: Number(hour.orders)
      })) : []
    }
    if (updateFields.paymentMethods !== undefined) {
      updateFields.paymentMethods = Array.isArray(updateFields.paymentMethods) ? updateFields.paymentMethods.map((method: any) => ({
        method: String(method.method),
        amount: Number(method.amount),
        percentage: Number(method.percentage)
      })) : []
    }
    if (updateFields.notes !== undefined) {
      updateFields.notes = updateFields.notes ? String(updateFields.notes) : null
    }

    console.log('Updating daily report with data:', updateFields)

    const result = await db.collection('daily_reports').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    )

    console.log('Update result:', result)

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'گزارش روزانه مورد نظر یافت نشد' },
        { status: 404 }
      )
    }

    const updatedReport = await db.collection('daily_reports').findOne({ _id: new ObjectId(id) })

    console.log('Updated daily report:', updatedReport)

    return NextResponse.json({
      success: true,
      data: updatedReport,
      message: 'گزارش روزانه با موفقیت به‌روزرسانی شد'
    })
  } catch (error) {
    console.error('Error updating daily report:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در به‌روزرسانی گزارش روزانه',
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

// DELETE /api/daily-reports - حذف گزارش روزانه
export async function DELETE(request: NextRequest) {
  let client: MongoClient | null = null
  
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'شناسه گزارش روزانه اجباری است' },
        { status: 400 }
      )
    }

    client = new MongoClient(MONGO_URI)
    await client.connect()
    const db = client.db('restoren')
    
    const result = await db.collection('daily_reports').deleteOne({ _id: new ObjectId(id) })

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'گزارش روزانه مورد نظر یافت نشد' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'گزارش روزانه با موفقیت حذف شد'
    })
  } catch (error) {
    console.error('Error deleting daily report:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در حذف گزارش روزانه',
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
