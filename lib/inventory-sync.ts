/**
 * Inventory synchronization utilities
 * Manages UI updates after stock movements
 */

// Event types for inventory updates
export type InventoryEventType = 
  | 'stock_movement_created'
  | 'stock_movement_updated'
  | 'balance_updated'
  | 'alert_updated'
  | 'warehouse_updated'
  | 'transfer_created'
  | 'transfer_completed'
  | 'count_approved'

export interface InventoryEvent {
  type: InventoryEventType
  data?: any
  timestamp: number
}

// Event listeners
type EventListener = (event: InventoryEvent) => void

class InventorySyncManager {
  private listeners: Map<string, Set<EventListener>> = new Map()
  private eventHistory: InventoryEvent[] = []
  private maxHistorySize = 100

  // Subscribe to inventory events
  subscribe(eventType: InventoryEventType, listener: EventListener): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set())
    }
    
    this.listeners.get(eventType)!.add(listener)
    
    // Return unsubscribe function
    return () => {
      this.listeners.get(eventType)?.delete(listener)
    }
  }

  // Emit an inventory event
  emit(eventType: InventoryEventType, data?: any): void {
    const event: InventoryEvent = {
      type: eventType,
      data,
      timestamp: Date.now()
    }
    
    // Add to history
    this.eventHistory.push(event)
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift()
    }
    
    // Notify listeners
    const listeners = this.listeners.get(eventType)
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(event)
        } catch (error) {
          console.error('Error in inventory event listener:', error)
        }
      })
    }
    
    // Also notify 'all' listeners
    const allListeners = this.listeners.get('all' as InventoryEventType)
    if (allListeners) {
      allListeners.forEach(listener => {
        try {
          listener(event)
        } catch (error) {
          console.error('Error in inventory event listener:', error)
        }
      })
    }
  }

  // Get event history
  getHistory(eventType?: InventoryEventType): InventoryEvent[] {
    if (eventType) {
      return this.eventHistory.filter(e => e.type === eventType)
    }
    return [...this.eventHistory]
  }

  // Clear history
  clearHistory(): void {
    this.eventHistory = []
  }
}

// Singleton instance
export const inventorySync = new InventorySyncManager()

// Helper function to trigger UI refresh after stock movement
export function notifyStockMovement(movementData: any): void {
  inventorySync.emit('stock_movement_created', movementData)
  inventorySync.emit('balance_updated', movementData)
  inventorySync.emit('alert_updated', movementData)
}

// Helper function to trigger UI refresh after transfer
export function notifyTransfer(transferData: any): void {
  inventorySync.emit('transfer_created', transferData)
  inventorySync.emit('balance_updated', transferData)
}

// Helper function to trigger UI refresh after count approval
export function notifyCountApproval(countData: any): void {
  inventorySync.emit('count_approved', countData)
  inventorySync.emit('balance_updated', countData)
  inventorySync.emit('alert_updated', countData)
}

