import { NextRequest, NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://restorenUser:1234@localhost:27017/restoren'

export async function POST(request: NextRequest) {
  let client: MongoClient | null = null
  
  try {
    console.log('Adding sample cashier session...')
    client = new MongoClient(MONGO_URI)
    await client.connect()
    
    const db = client.db('restoren')
    const sessionsCollection = db.collection('cashier_sessions')
    const transactionsCollection = db.collection('daily_transactions')
    
    // جلسه نمونه صندوق
    const sampleSession = {
      userId: "admin",
      startTime: "09:00",
      startAmount: 500000,
      totalSales: 12500000,
      totalTransactions: 45,
      cashSales: 8500000,
      cardSales: 3500000,
      creditSales: 500000,
      refunds: 150000,
      discounts: 300000,
      taxes: 1080000,
      serviceCharges: 1200000,
      status: "open",
      notes: "جلسه نمونه صندوق",
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    // حذف جلسات قبلی
    await sessionsCollection.deleteMany({})
    await transactionsCollection.deleteMany({})
    console.log('Cleared existing sessions and transactions')
    
    // اضافه کردن جلسه جدید
    const sessionResult = await sessionsCollection.insertOne(sampleSession)
    console.log(`Added session with ID: ${sessionResult.insertedId}`)
    
    // تراکنش‌های نمونه
    const sampleTransactions = [
      {
        sessionId: sessionResult.insertedId.toString(),
        time: "09:15",
        type: "sale",
        amount: 120000,
        paymentMethod: "cash",
        description: "فروش - کباب کوبیده",
        orderNumber: "ORD-001",
        customerName: "احمد محمدی",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        sessionId: sessionResult.insertedId.toString(),
        time: "09:30",
        type: "sale",
        amount: 135000,
        paymentMethod: "card",
        description: "فروش - جوجه کباب",
        orderNumber: "ORD-002",
        customerName: "سارا کریمی",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        sessionId: sessionResult.insertedId.toString(),
        time: "10:00",
        type: "sale",
        amount: 45000,
        paymentMethod: "cash",
        description: "فروش - سالاد سزار",
        orderNumber: "ORD-003",
        customerName: "رضا حسینی",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        sessionId: sessionResult.insertedId.toString(),
        time: "10:30",
        type: "refund",
        amount: -50000,
        paymentMethod: "cash",
        description: "مرجوعی - نوشابه",
        orderNumber: "ORD-004",
        customerName: "مریم نوری",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        sessionId: sessionResult.insertedId.toString(),
        time: "11:00",
        type: "sale",
        amount: 180000,
        paymentMethod: "card",
        description: "فروش - چلو گوشت",
        orderNumber: "ORD-005",
        customerName: "علی احمدی",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        sessionId: sessionResult.insertedId.toString(),
        time: "11:30",
        type: "cash_in",
        amount: 200000,
        paymentMethod: "cash",
        description: "ورود نقدی به صندوق",
        orderNumber: "",
        customerName: "",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        sessionId: sessionResult.insertedId.toString(),
        time: "12:00",
        type: "sale",
        amount: 70000,
        paymentMethod: "credit",
        description: "فروش - میرزا قاسمی",
        orderNumber: "ORD-006",
        customerName: "فاطمه رضایی",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        sessionId: sessionResult.insertedId.toString(),
        time: "12:30",
        type: "sale",
        amount: 35000,
        paymentMethod: "cash",
        description: "فروش - بستنی سنتی",
        orderNumber: "ORD-007",
        customerName: "حسن محمدی",
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]
    
    // اضافه کردن تراکنش‌ها
    const transactionsResult = await transactionsCollection.insertMany(sampleTransactions)
    console.log(`Added ${transactionsResult.insertedCount} transactions`)
    
    return NextResponse.json({
      success: true,
      message: `جلسه صندوق و ${transactionsResult.insertedCount} تراکنش با موفقیت اضافه شد`,
      sessionId: sessionResult.insertedId.toString(),
      transactionCount: transactionsResult.insertedCount
    })
  } catch (error) {
    console.error('Error adding sample cashier session:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در اضافه کردن جلسه نمونه صندوق',
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
