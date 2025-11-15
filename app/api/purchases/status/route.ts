import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://admin:StrongPassword123@185.204.169.107:27017/restaurant?authSource=admin'
const DB_NAME = 'restaurant'
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

// PATCH - به‌روزرسانی وضعیت خرید (با اتصال به انبار)
export async function PATCH(request: NextRequest) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    const inventoryCollection = db.collection('inventory_items')
    const ledgerCollection = db.collection('item_ledger')
    const invoicesCollection = db.collection('invoices')
    const receiptsPaymentsCollection = db.collection('receipts_payments')
    
    const body = await request.json()
    const { id, status, paymentStatus, paidAmount, notes, receivedBy } = body
    
    if (!id || (!status && !paymentStatus)) {
      return NextResponse.json(
        { success: false, message: 'شناسه خرید و وضعیت اجباری است' },
        { status: 400 }
      )
    }

    // دریافت خرید فعلی
    const currentPurchase = await collection.findOne({ _id: new ObjectId(id) })
    if (!currentPurchase) {
      return NextResponse.json(
        { success: false, message: 'خرید یافت نشد' },
        { status: 404 }
      )
    }

    const oldStatus = currentPurchase.status
    const newStatus = status

    // شروع تراکنش برای به‌روزرسانی همزمان انبار و حسابداری
    const session = client.startSession()
    
    try {
      await session.withTransaction(async () => {
        const updateData: any = {
          updatedAt: new Date().toISOString()
        }

        if (status) {
          updateData.status = status
          
          // اگر وضعیت به "received" تغییر کرد، تاریخ دریافت را تنظیم کن و موجودی را افزایش بده
          if (status === 'received') {
            updateData.receivedDate = new Date().toISOString()
            updateData.receivedBy = receivedBy || 'سیستم'

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
              date: new Date(),
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
              purchaseId: id,
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
          
          // اگر وضعیت به "approved" تغییر کرد، تاریخ تأیید را تنظیم کن
          if (status === 'approved') {
            updateData.approvedDate = new Date().toISOString()
            updateData.approvedBy = receivedBy || 'سیستم'
          }

          // اگر خرید لغو شد (از received به cancelled)
          if (oldStatus === 'received' && status === 'cancelled') {
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
        }

        if (paymentStatus) {
          updateData.paymentStatus = paymentStatus
        }

        if (paidAmount !== undefined) {
          updateData.paidAmount = paidAmount
        }

        if (notes) {
          updateData.notes = notes
        }

        await collection.updateOne(
          { _id: new ObjectId(id) },
          { $set: updateData },
          { session }
        )
      })
    } finally {
      await session.endSession()
    }

    const updatedPurchase = await collection.findOne({ _id: new ObjectId(id) })
    
    return NextResponse.json({
      success: true,
      data: updatedPurchase,
      message: newStatus === 'received' 
        ? 'خرید دریافت شد و موجودی انبار به‌روزرسانی شد'
        : 'وضعیت خرید با موفقیت به‌روزرسانی شد'
    })
  } catch (error) {
    console.error('Error updating purchase status:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در به‌روزرسانی وضعیت خرید',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
