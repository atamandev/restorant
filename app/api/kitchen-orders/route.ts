import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://restorenUser:1234@localhost:27017/restoren'
const DB_NAME = 'restoren'

let client: MongoClient
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
      client = null as any
    }
    db = null
    throw error
  }
}

export async function GET(request: NextRequest) {
  try {
    const db = await connectToDatabase()
    const collection = db.collection('kitchen_orders')

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const orderType = searchParams.get('orderType')
    const priority = searchParams.get('priority')
    const orderNumber = searchParams.get('orderNumber')
    const customerName = searchParams.get('customerName')

    let query: any = {}

    if (status) {
      if (status === 'all') {
        // اگر all باشد، همه سفارشات را نمایش بده (مثل completed هم)
        query = {}
      } else {
        query.status = status
      }
    } else {
      // به صورت پیش‌فرض فقط سفارشات فعال را نمایش بده (نه completed یا cancelled)
      query.status = { $in: ['pending', 'preparing', 'ready'] }
    }
    
    if (orderType) {
      query.orderType = orderType
    }
    if (priority) {
      query.priority = priority
    }
    if (orderNumber) {
      query.orderNumber = { $regex: orderNumber, $options: 'i' }
    }
    if (customerName) {
      query.customerName = { $regex: customerName, $options: 'i' }
    }

    const orders = await collection.find(query).sort({ createdAt: -1 }).toArray()
    
    // تبدیل _id به string برای frontend
    const formattedOrders = orders.map(order => ({
      ...order,
      _id: order._id.toString(),
      // اطمینان از اینکه items دارای id هستند
      items: order.items?.map((item: any, index: number) => ({
        ...item,
        id: item.id || item.menuItemId || `item-${index}`,
        status: item.status || 'pending', // اطمینان از وجود status
        image: item.image || '/api/placeholder/60/60'
      })) || []
    }))

    return NextResponse.json({
      success: true,
      data: formattedOrders
    })
  } catch (error) {
    console.error('Error fetching kitchen orders:', error)
    return NextResponse.json({
      success: false,
      message: 'خطا در دریافت سفارشات آشپزخانه'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = await connectToDatabase()
    const collection = db.collection('kitchen_orders')

    const body = await request.json()
    
    // آشپزخانه سفارش تولید نمی‌کند، فقط دستور کار می‌گیرد
    // این endpoint معمولاً توسط POS فراخوانی می‌شود
    // Generate order number if not provided
    if (!body.orderNumber) {
      const count = await collection.countDocuments()
      const prefix = body.orderType === 'dine-in' ? 'DI' : 
                    body.orderType === 'takeaway' ? 'TW' : 'DL'
      body.orderNumber = `${prefix}-${String(count + 1).padStart(3, '0')}`
    }

    const kitchenOrder = {
      ...body,
      status: body.status || 'pending', // pending, preparing, ready, delivered, cancelled
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await collection.insertOne(kitchenOrder)

    return NextResponse.json({
      success: true,
      data: {
        _id: result.insertedId,
        ...kitchenOrder
      },
      message: 'دستور کار آشپزخانه با موفقیت ثبت شد'
    })
  } catch (error) {
    console.error('Error creating kitchen order:', error)
    return NextResponse.json({
      success: false,
      message: 'خطا در ثبت سفارش آشپزخانه'
    }, { status: 500 })
  }
}

// PUT - به‌روزرسانی سفارش آشپزخانه (تغییر وضعیت پخت)
// آشپزخانه فقط وضعیت را تغییر می‌دهد و به POS اطلاع می‌دهد
export async function PUT(request: NextRequest) {
  try {
    const db = await connectToDatabase()
    const collection = db.collection('kitchen_orders')

    const body = await request.json()
    const { id, status: newStatus, ...updateData } = body

    if (!id) {
      return NextResponse.json({
        success: false,
        message: 'شناسه سفارش اجباری است'
      }, { status: 400 })
    }

    const orderId = typeof id === 'string' ? new ObjectId(id) : id

    // دریافت سفارش آشپزخانه
    const kitchenOrder = await collection.findOne({ _id: orderId })
    
    if (!kitchenOrder) {
      return NextResponse.json({
        success: false,
        message: 'سفارش یافت نشد'
      }, { status: 404 })
    }

    const oldStatus = kitchenOrder.status
    const finalStatus = newStatus || oldStatus

    // اگر سفارش لغو می‌شود، باید به DELETE endpoint مراجعه کند
    if (finalStatus === 'cancelled') {
      return NextResponse.json({
        success: false,
        message: 'برای لغو سفارش از endpoint DELETE استفاده کنید'
      }, { status: 400 })
    }

    // اطمینان از initialize شدن client قبل از استفاده
    if (!client) {
      await connectToDatabase()
    }
    
    if (!client) {
      throw new Error('MongoDB client is not initialized')
    }
    
    // شروع تراکنش برای به‌روزرسانی همزمان سفارش اصلی در POS
    const session = client.startSession()
    
    try {
      await session.withTransaction(async () => {
        // به‌روزرسانی سفارش آشپزخانه
        await collection.updateOne(
          { _id: orderId },
          { 
            $set: {
              ...updateData,
              status: finalStatus,
              updatedAt: new Date()
            }
          },
          { session }
        )

        // به‌روزرسانی سفارش اصلی در POS بر اساس orderType
        if (kitchenOrder.orderId) {
          let orderCollection
          if (kitchenOrder.orderType === 'dine-in') {
            orderCollection = db.collection('dine_in_orders')
          } else if (kitchenOrder.orderType === 'takeaway') {
            orderCollection = db.collection('takeaway_orders')
          } else if (kitchenOrder.orderType === 'delivery') {
            orderCollection = db.collection('delivery_orders')
          }

          if (orderCollection) {
            const orderIdObj = typeof kitchenOrder.orderId === 'string' 
              ? new ObjectId(kitchenOrder.orderId) 
              : kitchenOrder.orderId

            // دریافت سفارش اصلی
            const originalOrder = await orderCollection.findOne({ _id: orderIdObj }, { session })
            
            if (originalOrder) {
              // تغییر وضعیت بر اساس وضعیت آشپزخانه
              let posStatus = originalOrder.status

              // در حال آماده‌سازی → POS هم preparing می‌شود
              if (oldStatus !== 'preparing' && finalStatus === 'preparing') {
                posStatus = 'preparing'
              }
              // آماده → POS هم ready می‌شود (غذا آماده است!)
              else if (oldStatus !== 'ready' && finalStatus === 'ready') {
                posStatus = 'ready'
                // به POS اطلاع می‌دهیم که غذا آماده است
              }
              // تحویل داده شد → POS هم delivered می‌شود
              else if (oldStatus !== 'delivered' && finalStatus === 'delivered') {
                posStatus = 'delivered'
              }

              // به‌روزرسانی سفارش اصلی در POS
              await orderCollection.updateOne(
                { _id: orderIdObj },
                { 
                  $set: { 
                    status: posStatus,
                    updatedAt: new Date()
                  } 
                },
                { session }
              )

              // به‌روزرسانی در orders عمومی
              await db.collection('orders').updateOne(
                { orderNumber: kitchenOrder.orderNumber },
                { 
                  $set: { 
                    status: posStatus,
                    updatedAt: new Date()
                  } 
                },
                { session }
              )
            }
          }
        }
      })
    } finally {
      await session.endSession()
    }

    const updatedKitchenOrder = await collection.findOne({ _id: orderId })

    // پیام مناسب بر اساس وضعیت
    let message = 'سفارش با موفقیت به‌روزرسانی شد'
    if (oldStatus !== 'ready' && finalStatus === 'ready') {
      message = '✅ غذا آماده است! به POS اطلاع داده شد.'
    } else if (oldStatus !== 'preparing' && finalStatus === 'preparing') {
      message = 'در حال آماده‌سازی...'
    } else if (oldStatus !== 'delivered' && finalStatus === 'delivered') {
      message = 'تحویل داده شد.'
    }

    return NextResponse.json({
      success: true,
      data: updatedKitchenOrder,
      message,
      notification: finalStatus === 'ready' ? {
        type: 'kitchen_ready',
        orderNumber: kitchenOrder.orderNumber,
        orderType: kitchenOrder.orderType,
        message: 'غذا آماده است!'
      } : undefined
    })
  } catch (error) {
    console.error('Error updating kitchen order:', error)
    return NextResponse.json({
      success: false,
      message: 'خطا در به‌روزرسانی سفارش',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// DELETE - لغو سفارش آشپزخانه
// وقتی سفارش لغو می‌شود، باید حسابداری و انبار اصلاح شوند
export async function DELETE(request: NextRequest) {
  try {
    const db = await connectToDatabase()
    const collection = db.collection('kitchen_orders')

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const reason = searchParams.get('reason') || 'لغو توسط آشپزخانه'

    if (!id) {
      return NextResponse.json({
        success: false,
        message: 'شناسه سفارش اجباری است'
      }, { status: 400 })
    }

    const orderId = new ObjectId(id)

    // دریافت سفارش آشپزخانه
    const kitchenOrder = await collection.findOne({ _id: orderId })
    
    if (!kitchenOrder) {
      return NextResponse.json({
        success: false,
        message: 'سفارش یافت نشد'
      }, { status: 404 })
    }

    // اطمینان از initialize شدن client قبل از استفاده
    if (!client) {
      await connectToDatabase()
    }
    
    if (!client) {
      throw new Error('MongoDB client is not initialized')
    }
    
    // شروع تراکنش برای لغو سفارش و اصلاح انبار و حسابداری
    const session = client.startSession()
    
    try {
      await session.withTransaction(async () => {
        // 1. به‌روزرسانی سفارش آشپزخانه به cancelled
        await collection.updateOne(
          { _id: orderId },
          { 
            $set: {
              status: 'cancelled',
              cancelledAt: new Date(),
              cancellationReason: reason,
              updatedAt: new Date()
            }
          },
          { session }
        )

        // 2. به‌روزرسانی سفارش اصلی در POS
        if (kitchenOrder.orderId) {
          let orderCollection
          if (kitchenOrder.orderType === 'dine-in') {
            orderCollection = db.collection('dine_in_orders')
          } else if (kitchenOrder.orderType === 'takeaway') {
            orderCollection = db.collection('takeaway_orders')
          } else if (kitchenOrder.orderType === 'delivery') {
            orderCollection = db.collection('delivery_orders')
          }

          if (orderCollection) {
            const orderIdObj = typeof kitchenOrder.orderId === 'string' 
              ? new ObjectId(kitchenOrder.orderId) 
              : kitchenOrder.orderId

            // دریافت سفارش اصلی
            const originalOrder = await orderCollection.findOne({ _id: orderIdObj }, { session })
            
            if (originalOrder) {
              // 3. اگر سفارش پرداخت شده بود، باید موجودی برگردانده شود
              // بررسی اینکه آیا موجودی کم شده است یا نه
              const orderStatus = originalOrder.status
              const isPaidOrCompleted = orderStatus === 'paid' || orderStatus === 'completed' || orderStatus === 'ready'

              if (isPaidOrCompleted && originalOrder.items) {
                // برگرداندن موجودی انبار
                const inventoryItemsCollection = db.collection('inventory_items')
                const ledgerCollection = db.collection('item_ledger')

                for (const item of originalOrder.items) {
                  const inventoryItemId = item.inventoryItemId || item.menuItemId
                  if (inventoryItemId) {
                    const inventoryItem = await inventoryItemsCollection.findOne({ 
                      _id: new ObjectId(inventoryItemId)
                    }, { session })
                    
                    if (inventoryItem && inventoryItem.currentStock !== undefined) {
                      const lastEntry = await ledgerCollection
                        .findOne(
                          { itemId: inventoryItemId },
                          { sort: { date: -1, createdAt: -1 }, session }
                        )

                      const lastBalance = lastEntry?.runningBalance || inventoryItem.currentStock || 0
                      const lastValue = lastEntry?.runningValue || (inventoryItem.totalValue || 0)
                      
                      const qtyIn = item.quantity || 1 // برگرداندن مقدار
                      const unitPrice = inventoryItem.unitPrice || item.price || 0
                      const newBalance = lastBalance + qtyIn // اضافه کردن به موجودی
                      
                      const avgPrice = lastBalance > 0 ? lastValue / lastBalance : unitPrice
                      const newValue = lastValue + (qtyIn * avgPrice)

                      // ایجاد ورودی دفتر کل برای برگرداندن موجودی
                      const docNumber = `CANCEL-${kitchenOrder.orderNumber.substring(kitchenOrder.orderNumber.length - 4)}`
                      const ledgerEntry = {
                        itemId: inventoryItemId,
                        itemName: inventoryItem.name,
                        itemCode: inventoryItem.code || '',
                        date: new Date(),
                        documentNumber: docNumber,
                        documentType: 'return',
                        description: `لغو سفارش ${item.name} - سفارش ${kitchenOrder.orderNumber}`,
                        warehouse: inventoryItem.warehouse || 'انبار اصلی',
                        quantityIn: qtyIn,
                        quantityOut: 0,
                        unitPrice: unitPrice,
                        totalValue: qtyIn * unitPrice,
                        runningBalance: newBalance,
                        runningValue: newValue,
                        averagePrice: newBalance > 0 ? newValue / newBalance : unitPrice,
                        reference: kitchenOrder.orderNumber,
                        notes: `لغو سفارش - ${reason}`,
                        userId: 'آشپزخانه',
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                      }

                      await ledgerCollection.insertOne(ledgerEntry, { session })

                      await inventoryItemsCollection.updateOne(
                        { _id: new ObjectId(inventoryItemId) },
                        {
                          $set: {
                            currentStock: newBalance,
                            totalValue: newValue,
                            unitPrice: newBalance > 0 ? newValue / newBalance : unitPrice,
                            isLowStock: newBalance <= (inventoryItem.minStock || 0),
                            lastUpdated: new Date().toISOString(),
                            updatedAt: new Date()
                          }
                        },
                        { session }
                      )
                    }
                  }
                }

                // 4. لغو یا به‌روزرسانی فاکتور (اگر ایجاد شده بود)
                const invoicesCollection = db.collection('invoices')
                const invoice = await invoicesCollection.findOne({
                  orderId: orderIdObj.toString(),
                  orderNumber: kitchenOrder.orderNumber
                }, { session })

                if (invoice) {
                  await invoicesCollection.updateOne(
                    { _id: invoice._id },
                    {
                      $set: {
                        status: 'cancelled',
                        notes: `لغو شده: ${reason}`,
                        updatedAt: new Date().toISOString()
                      }
                    },
                    { session }
                  )
                }

                // 5. اصلاح باشگاه مشتریان (اگر امتیاز اضافه شده بود)
                if (originalOrder.customerId) {
                  const loyaltiesCollection = db.collection('customer_loyalties')
                  const loyalty = await loyaltiesCollection.findOne({ 
                    customerId: originalOrder.customerId.toString()
                  }, { session })

                  if (loyalty) {
                    const pointsToSubtract = Math.floor((originalOrder.total || 0) / 1000)
                    const newTotalPoints = Math.max(0, (loyalty.totalPoints || 0) - pointsToSubtract)
                    const newTotalOrders = Math.max(0, (loyalty.totalOrders || 0) - 1)
                    const newTotalSpent = Math.max(0, (loyalty.totalSpent || 0) - (originalOrder.total || 0))

                    // محاسبه tier جدید
                    let newTier = 'Bronze'
                    if (newTotalPoints >= 1000) newTier = 'Platinum'
                    else if (newTotalPoints >= 500) newTier = 'Gold'
                    else if (newTotalPoints >= 100) newTier = 'Silver'

                    await loyaltiesCollection.updateOne(
                      { customerId: originalOrder.customerId.toString() },
                      {
                        $set: {
                          totalPoints: newTotalPoints,
                          totalOrders: newTotalOrders,
                          totalSpent: newTotalSpent,
                          currentTier: newTier,
                          updatedAt: new Date().toISOString()
                        }
                      },
                      { session }
                    )
                  }
                }
              }

              // 6. به‌روزرسانی سفارش اصلی به cancelled
              await orderCollection.updateOne(
                { _id: orderIdObj },
                {
                  $set: {
                    status: 'cancelled',
                    cancelledAt: new Date(),
                    cancellationReason: reason,
                    updatedAt: new Date()
                  }
                },
                { session }
              )
            }
          }
        }

        // 7. به‌روزرسانی orders عمومی
        await db.collection('orders').updateOne(
          { orderNumber: kitchenOrder.orderNumber },
          {
            $set: {
              status: 'cancelled',
              cancelledAt: new Date(),
              cancellationReason: reason,
              updatedAt: new Date()
            }
          },
          { session }
        )
      })
    } finally {
      await session.endSession()
    }

    return NextResponse.json({
      success: true,
      message: 'سفارش لغو شد و انبار و حسابداری اصلاح شدند',
      notification: {
        type: 'order_cancelled',
        orderNumber: kitchenOrder.orderNumber,
        orderType: kitchenOrder.orderType,
        message: `سفارش ${kitchenOrder.orderNumber} لغو شد. موجودی و حسابداری اصلاح شدند.`
      }
    })
  } catch (error) {
    console.error('Error cancelling kitchen order:', error)
    return NextResponse.json({
      success: false,
      message: 'خطا در لغو سفارش',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
