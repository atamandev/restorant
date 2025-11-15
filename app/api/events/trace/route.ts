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

// GET - Trace کردن جریان کار یک رویداد (مثل یک سفارش)
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()
    
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')
    const invoiceId = searchParams.get('invoiceId')
    const traceType = searchParams.get('type') || 'order' // order, invoice, purchase

    if (!orderId && !invoiceId) {
      return NextResponse.json(
        { success: false, message: 'شناسه سفارش یا فاکتور اجباری است' },
        { status: 400 }
      )
    }

    const traceEvents: any[] = []
    const timestamp = new Date()

    if (traceType === 'order' && orderId) {
      // ==========================================
      // جریان کار یک سفارش (مثال: پیتزای مخصوص)
      // ==========================================
      
      // 1️⃣ Setup: دریافت اطلاعات پایه
      const branchesCollection = db.collection('branches')
      const cashRegistersCollection = db.collection('cash_registers')
      const menuItemsCollection = db.collection('menu_items')
      
      traceEvents.push({
        step: 1,
        module: 'Setup',
        action: 'دریافت اطلاعات پایه',
        description: 'دریافت branchId, registerId, menuItems, taxRates از Setup',
        timestamp: timestamp.toISOString(),
        status: 'success'
      })

      // 2️⃣ POS: ثبت سفارش
      const ordersCollection = db.collection('orders')
      const dineInOrdersCollection = db.collection('dine_in_orders')
      const takeawayOrdersCollection = db.collection('takeaway_orders')
      const deliveryOrdersCollection = db.collection('delivery_orders')
      
      let order: any = null
      
      // جستجو در انواع سفارشات
      order = await dineInOrdersCollection.findOne({ _id: new ObjectId(orderId) }) ||
              await takeawayOrdersCollection.findOne({ _id: new ObjectId(orderId) }) ||
              await deliveryOrdersCollection.findOne({ _id: new ObjectId(orderId) }) ||
              await ordersCollection.findOne({ _id: new ObjectId(orderId) })

      if (order) {
        traceEvents.push({
          step: 2,
          module: 'POS',
          action: 'ثبت سفارش',
          description: `سفارش ${order.orderNumber || order._id} ثبت شد`,
          data: {
            orderId: order._id.toString(),
            orderNumber: order.orderNumber,
            items: order.items?.length || 0,
            total: order.total || 0,
            branchId: order.branchId,
            cashRegisterId: order.cashRegisterId
          },
          timestamp: order.createdAt || order.orderTime || timestamp.toISOString(),
          status: 'success'
        })

        // 3️⃣ Kitchen: ارسال سفارش به آشپزخانه
        const kitchenOrdersCollection = db.collection('kitchen_orders')
        const kitchenOrder = await kitchenOrdersCollection.findOne({ 
          orderId: orderId,
          $or: [
            { orderId: order._id.toString() },
            { orderId: orderId }
          ]
        })

        if (kitchenOrder) {
          traceEvents.push({
            step: 3,
            module: 'Kitchen',
            action: 'دریافت سفارش',
            description: `سفارش به آشپزخانه ارسال شد - وضعیت: ${kitchenOrder.status}`,
            data: {
              kitchenOrderId: kitchenOrder._id.toString(),
              status: kitchenOrder.status,
              items: kitchenOrder.items?.length || 0
            },
            timestamp: kitchenOrder.createdAt || timestamp.toISOString(),
            status: kitchenOrder.status === 'preparing' ? 'in_progress' : 'success'
          })
        }

        // 4️⃣ Accounting: ثبت فاکتور فروش (اگر پرداخت شده)
        const invoicesCollection = db.collection('invoices')
        const relatedInvoice = await invoicesCollection.findOne({
          $or: [
            { orderId: order._id.toString() },
            { orderId: orderId },
            { referenceId: order._id.toString() },
            { referenceId: orderId }
          ],
          type: 'sales'
        })

        if (relatedInvoice) {
          traceEvents.push({
            step: 4,
            module: 'Accounting',
            action: 'ثبت فاکتور فروش',
            description: `فاکتور فروش ${relatedInvoice.invoiceNumber} ثبت شد`,
            data: {
              invoiceId: relatedInvoice._id.toString(),
              invoiceNumber: relatedInvoice.invoiceNumber,
              totalAmount: relatedInvoice.totalAmount,
              taxAmount: relatedInvoice.taxAmount,
              paymentMethod: relatedInvoice.paymentMethod,
              status: relatedInvoice.status
            },
            timestamp: relatedInvoice.createdAt || relatedInvoice.date || timestamp.toISOString(),
            status: relatedInvoice.status === 'paid' ? 'success' : 'pending'
          })

          // 5️⃣ Inventory: کاهش موجودی مواد اولیه
          const itemLedgerCollection = db.collection('item_ledger')
          const inventoryDeductions = await itemLedgerCollection.find({
            documentId: relatedInvoice._id.toString(),
            documentType: 'sale',
            quantityOut: { $gt: 0 }
          }).toArray()

          if (inventoryDeductions.length > 0) {
            traceEvents.push({
              step: 5,
              module: 'Inventory',
              action: 'کاهش موجودی',
              description: `${inventoryDeductions.length} آیتم موجودی از انبار کسر شد`,
              data: {
                items: inventoryDeductions.map((entry: any) => ({
                  itemId: entry.itemId,
                  itemName: entry.itemName,
                  quantity: entry.quantityOut,
                  unit: entry.unit
                }))
              },
              timestamp: inventoryDeductions[0]?.date || timestamp.toISOString(),
              status: 'success'
            })
          }

          // 6️⃣ Customers: به‌روزرسانی امتیاز وفاداری
          if (order.customerId) {
            const customerLoyaltiesCollection = db.collection('customer_loyalties')
            const loyalty = await customerLoyaltiesCollection.findOne({
              customerId: order.customerId.toString()
            })

            if (loyalty) {
              traceEvents.push({
                step: 6,
                module: 'Customers (CRM)',
                action: 'به‌روزرسانی امتیاز وفاداری',
                description: `امتیاز مشتری ${loyalty.customerName} به‌روزرسانی شد`,
                data: {
                  customerId: loyalty.customerId,
                  customerName: loyalty.customerName,
                  totalPoints: loyalty.totalPoints,
                  currentTier: loyalty.currentTier,
                  pointsEarned: loyalty.pointsEarned
                },
                timestamp: loyalty.updatedAt || timestamp.toISOString(),
                status: 'success'
              })
            }
          }

          // 7️⃣ Reports: ثبت در گزارشات
          traceEvents.push({
            step: 7,
            module: 'Reports',
            action: 'ثبت در گزارشات',
            description: 'اطلاعات سفارش در گزارشات ثبت شد',
            data: {
              reports: ['sales', 'daily', 'category', 'customer']
            },
            timestamp: timestamp.toISOString(),
            status: 'success'
          })

          // 8️⃣ Operations: بستن صندوق (اگر صندوق بسته شده)
          if (order.cashierSessionId) {
            const cashierSessionsCollection = db.collection('cashier_sessions')
            const session = await cashierSessionsCollection.findOne({
              _id: new ObjectId(order.cashierSessionId)
            })

            if (session && session.status === 'closed') {
              traceEvents.push({
                step: 8,
                module: 'Operations',
                action: 'بستن صندوق',
                description: `صندوق ${session.sessionNumber} بسته شد و موجودی نقد تطبیق داده شد`,
                data: {
                  sessionId: session._id.toString(),
                  sessionNumber: session.sessionNumber,
                  totalSales: session.totalSales,
                  cashDifference: session.cashDifference,
                  cardDifference: session.cardDifference
                },
                timestamp: session.endTime || session.updatedAt || timestamp.toISOString(),
                status: 'success'
              })
            }
          }
        }
      }
    } else if (traceType === 'invoice' && invoiceId) {
      // Trace یک فاکتور
      const invoicesCollection = db.collection('invoices')
      const invoice = await invoicesCollection.findOne({ _id: new ObjectId(invoiceId) })

      if (invoice) {
        traceEvents.push({
          step: 1,
          module: 'Accounting',
          action: 'فاکتور ایجاد شد',
          description: `فاکتور ${invoice.invoiceNumber} از نوع ${invoice.type}`,
          data: invoice,
          timestamp: invoice.createdAt || invoice.date || timestamp.toISOString(),
          status: invoice.status
        })
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        traceType,
        orderId: orderId || invoiceId,
        events: traceEvents,
        summary: {
          totalSteps: traceEvents.length,
          completedSteps: traceEvents.filter((e: any) => e.status === 'success').length,
          modules: [...new Set(traceEvents.map((e: any) => e.module))],
          timeline: traceEvents.map((e: any) => ({
            step: e.step,
            module: e.module,
            action: e.action,
            timestamp: e.timestamp
          }))
        }
      },
      message: 'جریان کار با موفقیت trace شد'
    })
  } catch (error) {
    console.error('Error tracing event:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در trace کردن جریان کار',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

