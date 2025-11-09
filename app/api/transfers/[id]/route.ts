import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'
import { logTransfer } from '@/lib/audit-logger'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://restorenUser:1234@localhost:27017/restoren'
const DB_NAME = 'restoren'

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

const TRANSFER_MODE = process.env.TRANSFER_MODE || 'simple'

// GET - دریافت یک انتقال
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = await connectToDatabase()
    const transferCollection = db.collection('transfers')
    
    const transfer = await transferCollection.findOne({ _id: new ObjectId(params.id) })
    
    if (!transfer) {
      return NextResponse.json(
        { success: false, message: 'انتقال یافت نشد' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: transfer
    })
  } catch (error) {
    console.error('Error fetching transfer:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت انتقال' },
      { status: 500 }
    )
  }
}

// PUT - به‌روزرسانی انتقال
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = client.startSession()
  
  try {
    const db = await connectToDatabase()
    const transferCollection = db.collection('transfers')
    const balanceCollection = db.collection('inventory_balance')
    const movementCollection = db.collection('stock_movements')
    const fifoLayerCollection = db.collection('fifo_layers')
    const warehouseCollection = db.collection('warehouses')
    
    const body = await request.json()
    const { action, approvedBy } = body // action: 'approve', 'complete', 'cancel', 'receive'
    
    const transfer = await transferCollection.findOne({ _id: new ObjectId(params.id) })
    
    if (!transfer) {
      return NextResponse.json(
        { success: false, message: 'انتقال یافت نشد' },
        { status: 404 }
      )
    }
    
    // ذخیره وضعیت قبل برای لاگ
    const beforeState = {
      status: transfer.status,
      items: transfer.items,
      inTransit: transfer.inTransit || {}
    }
    
    await session.withTransaction(async () => {
      if (action === 'approve') {
        // تأیید انتقال
        if (transfer.status !== 'draft' && transfer.status !== 'pending') {
          throw new Error('فقط انتقال‌های پیش‌نویس یا در انتظار قابل تأیید هستند')
        }
        
        if (transfer.transferMode === 'simple') {
          // مدل ساده: ثبت دو حرکت اتمیک
          const transferRef = `TRF-${transfer.transferNumber}-${Date.now()}`
          
          // ثبت TRANSFER_OUT و TRANSFER_IN برای هر آیتم
          for (const item of transfer.items) {
            const itemId = new ObjectId(item.itemId)
            
            // دریافت FIFO layers برای انبار مبدا
            const fifoLayers = await fifoLayerCollection
              .find({
                itemId,
                warehouseName: transfer.fromWarehouse,
                remainingQuantity: { $gt: 0 }
              })
              .sort({ createdAt: 1 }) // FIFO: قدیمی‌ترین اول
              .toArray()
            
            let remainingToTransfer = item.quantity
            const transferLayers: any[] = []
            
            // مصرف از لایه‌های FIFO
            for (const layer of fifoLayers) {
              if (remainingToTransfer <= 0) break
              
              const transferQty = Math.min(remainingToTransfer, layer.remainingQuantity)
              const transferValue = transferQty * layer.unitPrice
              
              // به‌روزرسانی لایه مبدا
              await fifoLayerCollection.updateOne(
                { _id: layer._id },
                { $inc: { remainingQuantity: -transferQty } },
                { session }
              )
              
              // ایجاد لایه جدید در مقصد
              await fifoLayerCollection.insertOne({
                itemId,
                warehouseName: transfer.toWarehouse,
                quantity: transferQty,
                remainingQuantity: transferQty,
                unitPrice: layer.unitPrice,
                totalValue: transferValue,
                lotNumber: layer.lotNumber || null,
                expirationDate: layer.expirationDate || null,
                sourceMovementId: transferRef,
                createdAt: new Date(),
                updatedAt: new Date()
              }, { session })
              
              transferLayers.push({
                fromLayerId: layer._id,
                quantity: transferQty,
                unitPrice: layer.unitPrice
              })
              
              remainingToTransfer -= transferQty
            }
            
            // اگر FIFO نداریم، از میانگین استفاده کن
            if (fifoLayers.length === 0) {
              const balance = await balanceCollection.findOne({
                itemId,
                warehouseName: transfer.fromWarehouse
              })
              
              const avgPrice = balance && balance.quantity > 0 
                ? balance.totalValue / balance.quantity 
                : item.unitPrice
              
              // ایجاد لایه در مقصد
              await fifoLayerCollection.insertOne({
                itemId,
                warehouseName: transfer.toWarehouse,
                quantity: item.quantity,
                remainingQuantity: item.quantity,
                unitPrice: avgPrice,
                totalValue: item.quantity * avgPrice,
                lotNumber: null,
                expirationDate: null,
                sourceMovementId: transferRef,
                createdAt: new Date(),
                updatedAt: new Date()
              }, { session })
            }
            
            // ثبت TRANSFER_OUT
            await movementCollection.insertOne({
              itemId,
              warehouseName: transfer.fromWarehouse,
              movementType: 'TRANSFER_OUT',
              quantity: -item.quantity,
              unitPrice: item.unitPrice,
              totalValue: -item.totalValue,
              documentNumber: transfer.transferNumber,
              documentType: 'TRANSFER',
              description: `انتقال به ${transfer.toWarehouse}`,
              referenceId: transferRef,
              transferRef,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }, { session })
            
            // ثبت TRANSFER_IN
            await movementCollection.insertOne({
              itemId,
              warehouseName: transfer.toWarehouse,
              movementType: 'TRANSFER_IN',
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalValue: item.totalValue,
              documentNumber: transfer.transferNumber,
              documentType: 'TRANSFER',
              description: `انتقال از ${transfer.fromWarehouse}`,
              referenceId: transferRef,
              transferRef,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }, { session })
            
            // به‌روزرسانی Balance مبدا
            await balanceCollection.updateOne(
              { itemId, warehouseName: transfer.fromWarehouse },
              {
                $inc: {
                  quantity: -item.quantity,
                  totalValue: -item.totalValue
                },
                $set: {
                  lastUpdated: new Date().toISOString(),
                  updatedAt: new Date()
                }
              },
              { session, upsert: false }
            )
            
            // به‌روزرسانی Balance مقصد
            await balanceCollection.updateOne(
              { itemId, warehouseName: transfer.toWarehouse },
              {
                $inc: {
                  quantity: item.quantity,
                  totalValue: item.totalValue
                },
                $set: {
                  lastUpdated: new Date().toISOString(),
                  updatedAt: new Date()
                }
              },
              { session, upsert: true }
            )
          }
          
          // به‌روزرسانی وضعیت انتقال
          await transferCollection.updateOne(
            { _id: transfer._id },
            {
              $set: {
                status: 'completed',
                approvedBy,
                approvedAt: new Date().toISOString(),
                completedAt: new Date().toISOString(),
                transferRef,
                updatedAt: new Date().toISOString()
              }
            },
            { session }
          )
          
          // محاسبه مجدد هشدارها بعد از انتقال
          // این کار بعد از commit transaction انجام می‌شود
        } else {
          // مدل دو مرحله‌ای: فقط TRANSFER_OUT
          const transferRef = `TRF-${transfer.transferNumber}-${Date.now()}`
          const inTransit: any = {}
          
          for (const item of transfer.items) {
            const itemId = new ObjectId(item.itemId)
            
            // ثبت TRANSFER_OUT
            await movementCollection.insertOne({
              itemId,
              warehouseName: transfer.fromWarehouse,
              movementType: 'TRANSFER_OUT',
              quantity: -item.quantity,
              unitPrice: item.unitPrice,
              totalValue: -item.totalValue,
              documentNumber: transfer.transferNumber,
              documentType: 'TRANSFER',
              description: `انتقال به ${transfer.toWarehouse} (در راه)`,
              referenceId: transferRef,
              transferRef,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }, { session })
            
            // به‌روزرسانی Balance مبدا
            await balanceCollection.updateOne(
              { itemId, warehouseName: transfer.fromWarehouse },
              {
                $inc: {
                  quantity: -item.quantity,
                  totalValue: -item.totalValue
                },
                $set: {
                  lastUpdated: new Date().toISOString(),
                  updatedAt: new Date()
                }
              },
              { session, upsert: false }
            )
            
            // ثبت inTransit برای مقصد
            inTransit[item.itemId] = item.quantity
          }
          
          await transferCollection.updateOne(
            { _id: transfer._id },
            {
              $set: {
                status: 'in_transit',
                approvedBy,
                approvedAt: new Date().toISOString(),
                transferRef,
                inTransit,
                updatedAt: new Date().toISOString()
              }
            },
            { session }
          )
        }
      } else if (action === 'receive') {
        // رسید در مقصد (فقط برای مدل دو مرحله‌ای)
        if (transfer.transferMode !== 'two_stage') {
          throw new Error('این عمل فقط برای مدل دو مرحله‌ای قابل استفاده است')
        }
        
        if (transfer.status !== 'in_transit') {
          throw new Error('فقط انتقال‌های در حال انتقال قابل دریافت هستند')
        }
        
        const transferRef = transfer.transferRef || `TRF-${transfer.transferNumber}-${Date.now()}`
        
        for (const item of transfer.items) {
          const itemId = new ObjectId(item.itemId)
          const inTransitQty = transfer.inTransit?.[item.itemId] || item.quantity
          
          // ثبت TRANSFER_IN
          await movementCollection.insertOne({
            itemId,
            warehouseName: transfer.toWarehouse,
            movementType: 'TRANSFER_IN',
            quantity: inTransitQty,
            unitPrice: item.unitPrice,
            totalValue: inTransitQty * item.unitPrice,
            documentNumber: transfer.transferNumber,
            documentType: 'TRANSFER',
            description: `رسید از ${transfer.fromWarehouse}`,
            referenceId: transferRef,
            transferRef,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }, { session })
          
          // به‌روزرسانی Balance مقصد
          await balanceCollection.updateOne(
            { itemId, warehouseName: transfer.toWarehouse },
            {
              $inc: {
                quantity: inTransitQty,
                totalValue: inTransitQty * item.unitPrice
              },
              $set: {
                lastUpdated: new Date().toISOString(),
                updatedAt: new Date()
              }
            },
            { session, upsert: true }
          )
        }
        
        await transferCollection.updateOne(
          { _id: transfer._id },
          {
            $set: {
              status: 'completed',
              completedAt: new Date().toISOString(),
              inTransit: {},
              updatedAt: new Date().toISOString()
            }
          },
          { session }
        )
      } else if (action === 'cancel') {
        // لغو انتقال
        if (transfer.status === 'completed') {
          throw new Error('انتقال تکمیل شده قابل لغو نیست')
        }
        
        await transferCollection.updateOne(
          { _id: transfer._id },
          {
            $set: {
              status: 'cancelled',
              cancelledAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          },
          { session }
        )
      } else {
        // به‌روزرسانی عادی
        const updateData: any = {
          ...body,
          updatedAt: new Date().toISOString()
        }
        delete updateData.action
        delete updateData.approvedBy
        
        await transferCollection.updateOne(
          { _id: transfer._id },
          { $set: updateData },
          { session }
        )
      }
    })
    
    const updatedTransfer = await transferCollection.findOne({ _id: transfer._id })
    
    // ثبت لاگ ممیزی
    if (action && ['approve', 'receive', 'cancel'].includes(action)) {
      try {
        const afterState = {
          status: updatedTransfer?.status,
          items: updatedTransfer?.items,
          inTransit: updatedTransfer?.inTransit || {}
        }
        
        const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
        const userAgent = request.headers.get('user-agent') || 'unknown'
        
        await logTransfer(
          transfer._id.toString(),
          action,
          beforeState,
          afterState,
          body.approvedBy || body.userId || 'سیستم',
          clientIp,
          userAgent
        )
      } catch (error) {
        console.warn('Warning: Error logging audit event:', error)
      }
    }
    
    // محاسبه مجدد هشدارها بعد از انتقال (بعد از commit transaction)
    if (action === 'approve' || action === 'receive') {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
        await fetch(`${baseUrl}/api/stock-alerts/calculate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        }).catch((err) => {
          console.warn('Warning: Could not recalculate alerts after transfer:', err)
        })
      } catch (error) {
        console.warn('Warning: Error recalculating alerts after transfer:', error)
      }
    }
    
    return NextResponse.json({
      success: true,
      data: updatedTransfer,
      message: 'انتقال با موفقیت به‌روزرسانی شد'
    })
  } catch (error: any) {
    console.error('Error updating transfer:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'خطا در به‌روزرسانی انتقال' },
      { status: 500 }
    )
  } finally {
    await session.endSession()
  }
}
