import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://restorenUser:1234@localhost:27017/restoren'
const DB_NAME = 'restoren'
const COLLECTION_NAME = 'purchases'

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

// GET - دریافت خرید خاص
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const purchase = await collection.findOne({ _id: new ObjectId(params.id) })
    
    if (!purchase) {
      return NextResponse.json(
        { success: false, message: 'خرید یافت نشد' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: purchase
    })
  } catch (error) {
    console.error('Error fetching purchase:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت خرید' },
      { status: 500 }
    )
  }
}

// PUT - به‌روزرسانی خرید (با اتصال به انبار)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    const inventoryCollection = db.collection('inventory_items')
    const ledgerCollection = db.collection('item_ledger')
    const invoicesCollection = db.collection('invoices')
    const receiptsPaymentsCollection = db.collection('receipts_payments')
    
    const body = await request.json()
    
    // دریافت خرید فعلی
    const currentPurchase = await collection.findOne({ _id: new ObjectId(params.id) })
    if (!currentPurchase) {
      return NextResponse.json(
        { success: false, message: 'خرید یافت نشد' },
        { status: 404 }
      )
    }

    const oldStatus = currentPurchase.status
    const newStatus = body.status
    
    // شروع تراکنش برای به‌روزرسانی همزمان انبار و حسابداری
    const session = client.startSession()
    
    try {
      await session.withTransaction(async () => {
        const updateData: any = {
          updatedAt: new Date().toISOString()
        }

        // به‌روزرسانی فیلدها
        if (body.supplierId !== undefined) updateData.supplierId = body.supplierId
        if (body.supplierName !== undefined) updateData.supplierName = body.supplierName
        if (body.supplierPhone !== undefined) updateData.supplierPhone = body.supplierPhone
        if (body.supplierAddress !== undefined) updateData.supplierAddress = body.supplierAddress
        if (body.date !== undefined) updateData.date = new Date(body.date)
        if (body.dueDate !== undefined) updateData.dueDate = body.dueDate ? new Date(body.dueDate) : null
        if (body.items !== undefined) updateData.items = body.items
        if (body.subtotal !== undefined) updateData.subtotal = Number(body.subtotal)
        if (body.taxAmount !== undefined) updateData.taxAmount = Number(body.taxAmount)
        if (body.discountAmount !== undefined) updateData.discountAmount = Number(body.discountAmount)
        if (body.totalAmount !== undefined) updateData.totalAmount = Number(body.totalAmount)
        if (body.paidAmount !== undefined) updateData.paidAmount = Number(body.paidAmount)
        if (body.paymentStatus !== undefined) updateData.paymentStatus = body.paymentStatus
        if (body.paymentMethod !== undefined) updateData.paymentMethod = body.paymentMethod
        if (body.notes !== undefined) updateData.notes = body.notes
        if (body.approvedBy !== undefined) updateData.approvedBy = body.approvedBy
        if (body.approvedDate !== undefined) updateData.approvedDate = body.approvedDate ? new Date(body.approvedDate) : null

        // مدیریت تغییر وضعیت به 'received' (دریافت شد)
        if (oldStatus !== 'received' && newStatus === 'received') {
          updateData.status = 'received'
          updateData.receivedDate = new Date().toISOString()
          updateData.receivedBy = body.receivedBy || 'سیستم'

          // 1. افزایش موجودی برای هر آیتم خریداری شده
          for (const item of currentPurchase.items || []) {
            const itemId = item.itemId || item.inventoryItemId
            if (!itemId) continue

            const inventoryItem = await inventoryCollection.findOne({ 
              _id: new ObjectId(itemId)
            }, { session })

            if (!inventoryItem) {
              console.warn(`Inventory item ${itemId} not found, skipping stock update`)
              continue
            }

            // دریافت آخرین ورودی دفتر کل
            const lastEntry = await ledgerCollection
              .findOne(
                { itemId },
                { sort: { date: -1, createdAt: -1 }, session }
              )

            const lastBalance = lastEntry?.runningBalance || inventoryItem.currentStock || 0
            const lastValue = lastEntry?.runningValue || (inventoryItem.totalValue || 0)
            
            const qtyIn = item.quantity || 0
            const unitPrice = item.unitPrice || item.price || inventoryItem.unitPrice || 0
            
            // محاسبه موجودی جدید (Weighted Average)
            const newBalance = lastBalance + qtyIn
            const totalValue = lastValue + (qtyIn * unitPrice)
            const avgPrice = newBalance > 0 ? totalValue / newBalance : unitPrice

            // ایجاد ورودی دفتر کل برای خرید
            const docNumber = `PURCH-${currentPurchase.invoiceNumber.substring(currentPurchase.invoiceNumber.length - 4)}`
            const ledgerEntry = {
              itemId,
              itemName: inventoryItem.name,
              itemCode: inventoryItem.code || '',
              date: new Date(),
              documentNumber: docNumber,
              documentType: 'receipt', // ورودی از خرید
              description: `خرید ${inventoryItem.name} - فاکتور ${currentPurchase.invoiceNumber}`,
              warehouse: inventoryItem.warehouse || 'انبار اصلی',
              quantityIn: qtyIn,
              quantityOut: 0,
              unitPrice: unitPrice,
              totalValue: qtyIn * unitPrice,
              runningBalance: newBalance,
              runningValue: totalValue,
              averagePrice: avgPrice,
              reference: currentPurchase.invoiceNumber,
              notes: `خرید از ${currentPurchase.supplierName || 'تامین‌کننده'} - ${currentPurchase.invoiceNumber}`,
              userId: updateData.receivedBy || 'سیستم',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }

            await ledgerCollection.insertOne(ledgerEntry, { session })

            // به‌روزرسانی موجودی آیتم
            await inventoryCollection.updateOne(
              { _id: new ObjectId(itemId) },
              {
                $set: {
                  currentStock: newBalance,
                  totalValue: totalValue,
                  unitPrice: avgPrice,
                  isLowStock: newBalance <= (inventoryItem.minStock || 0), // به‌روزرسانی هشدار کمبود
                  lastUpdated: new Date().toISOString(),
                  updatedAt: new Date()
                }
              },
              { session }
            )
          }

          // 2. ایجاد فاکتور خرید در حسابداری
          const purchaseInvoice = {
            invoiceNumber: currentPurchase.invoiceNumber,
            type: 'purchase',
            supplierId: currentPurchase.supplierId || null,
            supplierName: currentPurchase.supplierName || '',
            supplierPhone: currentPurchase.supplierPhone || null,
            supplierAddress: currentPurchase.supplierAddress || null,
            date: new Date(updateData.receivedDate || new Date()),
            dueDate: currentPurchase.dueDate || null,
            items: (currentPurchase.items || []).map((item: any) => ({
              itemId: item.itemId || item.inventoryItemId,
              name: item.name || item.itemName,
              price: item.unitPrice || item.price,
              quantity: item.quantity,
              total: (item.unitPrice || item.price) * (item.quantity || 0)
            })),
            subtotal: currentPurchase.subtotal || 0,
            taxAmount: currentPurchase.taxAmount || 0,
            discountAmount: currentPurchase.discountAmount || 0,
            totalAmount: currentPurchase.totalAmount || 0,
            paidAmount: currentPurchase.paidAmount || 0,
            status: currentPurchase.paymentStatus === 'paid' ? 'paid' : 'pending',
            paymentMethod: currentPurchase.paymentMethod || 'credit',
            notes: `فاکتور خرید ${currentPurchase.invoiceNumber}`,
            purchaseId: params.id,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }

          await invoicesCollection.insertOne(purchaseInvoice, { session })

          // 3. ایجاد تراکنش پرداخت (اگر پرداخت شده)
          if (currentPurchase.paymentStatus === 'paid' && currentPurchase.paidAmount > 0) {
            const paymentTransaction = {
              transactionNumber: `PAY-${currentPurchase.invoiceNumber.substring(currentPurchase.invoiceNumber.length - 4)}`,
              type: 'payment',
              amount: currentPurchase.paidAmount,
              method: currentPurchase.paymentMethod || 'cash',
              status: 'completed',
              personId: currentPurchase.supplierId || null,
              personName: currentPurchase.supplierName || '',
              personType: 'supplier',
              reference: 'purchase_invoice',
              referenceId: purchaseInvoice.invoiceNumber,
              description: `پرداخت بابت فاکتور خرید ${currentPurchase.invoiceNumber}`,
              date: new Date(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }

            await receiptsPaymentsCollection.insertOne(paymentTransaction, { session })
          }
        }
        // مدیریت لغو خرید (اگر از received به cancelled تغییر کرد)
        else if (oldStatus === 'received' && newStatus === 'cancelled') {
          updateData.status = 'cancelled'
          
          // برگرداندن موجودی برای هر آیتم
          for (const item of currentPurchase.items || []) {
            const itemId = item.itemId || item.inventoryItemId
            if (!itemId) continue

            const inventoryItem = await inventoryCollection.findOne({ 
              _id: new ObjectId(itemId)
            }, { session })

            if (!inventoryItem) continue

            const lastEntry = await ledgerCollection
              .findOne(
                { itemId },
                { sort: { date: -1, createdAt: -1 }, session }
              )

            const lastBalance = lastEntry?.runningBalance || inventoryItem.currentStock || 0
            const lastValue = lastEntry?.runningValue || (inventoryItem.totalValue || 0)
            
            const qtyOut = item.quantity || 0
            const unitPrice = item.unitPrice || item.price || inventoryItem.unitPrice || 0
            
            const newBalance = Math.max(0, lastBalance - qtyOut)
            const avgPrice = lastBalance > 0 ? lastValue / lastBalance : unitPrice
            const newValue = Math.max(0, lastValue - (qtyOut * avgPrice))

            // ایجاد ورودی دفتر کل برای لغو خرید
            const docNumber = `CANCEL-${currentPurchase.invoiceNumber.substring(currentPurchase.invoiceNumber.length - 4)}`
            const ledgerEntry = {
              itemId,
              itemName: inventoryItem.name,
              itemCode: inventoryItem.code || '',
              date: new Date(),
              documentNumber: docNumber,
              documentType: 'return',
              description: `لغو خرید ${inventoryItem.name} - فاکتور ${currentPurchase.invoiceNumber}`,
              warehouse: inventoryItem.warehouse || 'انبار اصلی',
              quantityIn: 0,
              quantityOut: qtyOut,
              unitPrice: unitPrice,
              totalValue: -(qtyOut * avgPrice),
              runningBalance: newBalance,
              runningValue: newValue,
              averagePrice: newBalance > 0 ? newValue / newBalance : avgPrice,
              reference: currentPurchase.invoiceNumber,
              notes: `لغو خرید از ${currentPurchase.supplierName || 'تامین‌کننده'}`,
              userId: 'سیستم',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }

            await ledgerCollection.insertOne(ledgerEntry, { session })

            await inventoryCollection.updateOne(
              { _id: new ObjectId(itemId) },
              {
                $set: {
                  currentStock: newBalance,
                  totalValue: newValue,
                  unitPrice: newBalance > 0 ? newValue / newBalance : avgPrice,
                  isLowStock: newBalance <= (inventoryItem.minStock || 0),
                  lastUpdated: new Date().toISOString(),
                  updatedAt: new Date()
                }
              },
              { session }
            )
          }
        }
        // به‌روزرسانی عادی
        else {
          if (newStatus !== undefined) updateData.status = newStatus
          if (body.receivedDate !== undefined) updateData.receivedDate = body.receivedDate ? new Date(body.receivedDate).toISOString() : null
          if (body.receivedBy !== undefined) updateData.receivedBy = body.receivedBy
        }

        // به‌روزرسانی خرید
        await collection.updateOne(
          { _id: new ObjectId(params.id) },
          { $set: updateData },
          { session }
        )
      })
    } finally {
      await session.endSession()
    }

    const updatedPurchase = await collection.findOne({ _id: new ObjectId(params.id) })
    
    return NextResponse.json({
      success: true,
      data: updatedPurchase,
      message: newStatus === 'received' 
        ? 'خرید دریافت شد و موجودی انبار به‌روزرسانی شد'
        : 'خرید با موفقیت به‌روزرسانی شد'
    })
  } catch (error) {
    console.error('Error updating purchase:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در به‌روزرسانی خرید',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// DELETE - حذف خرید
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    // بررسی وضعیت خرید
    const purchase = await collection.findOne({ _id: new ObjectId(params.id) })
    if (purchase && purchase.status === 'received') {
      return NextResponse.json(
        { 
          success: false, 
          message: 'امکان حذف خرید دریافت شده وجود ندارد. ابتدا خرید را لغو کنید.' 
        },
        { status: 400 }
      )
    }
    
    const result = await collection.deleteOne({ _id: new ObjectId(params.id) })
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'خرید یافت نشد' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'خرید با موفقیت حذف شد'
    })
  } catch (error) {
    console.error('Error deleting purchase:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در حذف خرید' },
      { status: 500 }
    )
  }
}
