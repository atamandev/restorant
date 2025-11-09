/**
 * Audit Logger Utility
 * برای ثبت لاگ‌های ممیزی در سیستم
 */

export type AuditEventType = 
  | 'STOCK_MOVEMENT'
  | 'TRANSFER'
  | 'STOCKTAKING'
  | 'ORDER'
  | 'WAREHOUSE'
  | 'ITEM'
  | 'ALERT'
  | 'SETTINGS'

export type ReferenceType = 
  | 'stock_movement'
  | 'transfer'
  | 'inventory_count'
  | 'order'
  | 'warehouse'
  | 'inventory_item'
  | 'stock_alert'
  | 'settings'

export interface AuditLogData {
  eventType: AuditEventType
  referenceType: ReferenceType
  referenceId?: string
  userId: string
  description: string
  before?: any
  after?: any
  diff?: any
  reason?: string
  ipAddress?: string
  userAgent?: string
  metadata?: any
}

/**
 * ثبت لاگ ممیزی
 */
export async function logAuditEvent(data: AuditLogData): Promise<void> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    
    await fetch(`${baseUrl}/api/audit-logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    }).catch((err) => {
      console.warn('Warning: Could not log audit event:', err)
      // این خطا نباید باعث شکست عملیات اصلی شود
    })
  } catch (error) {
    console.warn('Warning: Error logging audit event:', error)
    // این خطا نباید باعث شکست عملیات اصلی شود
  }
}

/**
 * محاسبه diff بین دو object
 */
export function calculateDiff(before: any, after: any): any {
  if (!before && !after) return null
  if (!before) return { added: after }
  if (!after) return { removed: before }
  
  const diff: any = {}
  const allKeys = new Set([...Object.keys(before || {}), ...Object.keys(after || {})])
  
  for (const key of allKeys) {
    const beforeVal = before[key]
    const afterVal = after[key]
    
    if (JSON.stringify(beforeVal) !== JSON.stringify(afterVal)) {
      diff[key] = {
        before: beforeVal,
        after: afterVal
      }
    }
  }
  
  return Object.keys(diff).length > 0 ? diff : null
}

/**
 * Helper برای ثبت لاگ حرکت موجودی
 */
export async function logStockMovement(
  movementType: string,
  itemId: string,
  warehouseName: string,
  quantity: number,
  before: any,
  after: any,
  userId: string = 'سیستم',
  reason?: string
): Promise<void> {
  const diff = calculateDiff(before, after)
  
  await logAuditEvent({
    eventType: 'STOCK_MOVEMENT',
    referenceType: 'stock_movement',
    referenceId: itemId,
    userId,
    description: `حرکت ${movementType}: ${quantity} واحد در انبار ${warehouseName}`,
    before,
    after,
    diff,
    reason,
    metadata: {
      movementType,
      itemId,
      warehouseName,
      quantity
    }
  })
}

/**
 * Helper برای ثبت لاگ انتقال
 */
export async function logTransfer(
  transferId: string,
  action: string,
  before: any,
  after: any,
  userId: string = 'سیستم'
): Promise<void> {
  const diff = calculateDiff(before, after)
  
  await logAuditEvent({
    eventType: 'TRANSFER',
    referenceType: 'transfer',
    referenceId: transferId,
    userId,
    description: `انتقال: ${action}`,
    before,
    after,
    diff,
    metadata: {
      transferId,
      action
    }
  })
}

/**
 * Helper برای ثبت لاگ انبارگردانی
 */
export async function logStocktaking(
  countId: string,
  action: string,
  before: any,
  after: any,
  userId: string = 'سیستم',
  reason?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  const diff = calculateDiff(before, after)
  
  await logAuditEvent({
    eventType: 'STOCKTAKING',
    referenceType: 'inventory_count',
    referenceId: countId,
    userId,
    description: `انبارگردانی: ${action}`,
    before,
    after,
    diff,
    reason,
    ipAddress,
    userAgent,
    metadata: {
      countId,
      action
    }
  })
}

/**
 * Helper برای ثبت لاگ سفارش
 */
export async function logOrder(
  orderId: string,
  action: string,
  before: any,
  after: any,
  userId: string = 'سیستم'
): Promise<void> {
  const diff = calculateDiff(before, after)
  
  await logAuditEvent({
    eventType: 'ORDER',
    referenceType: 'order',
    referenceId: orderId,
    userId,
    description: `سفارش: ${action}`,
    before,
    after,
    diff,
    metadata: {
      orderId,
      action
    }
  })
}

