/**
 * Utility functions for optimistic UI updates
 * استفاده از این توابع برای به‌روزرسانی فوری UI بدون نیاز به refresh
 */

export interface ItemWithId {
  _id?: string
  id?: string
}

/**
 * Get unique ID from item (handles both _id and id)
 */
export function getItemId<T extends ItemWithId>(item: T): string {
  return (item._id || item.id || '') as string
}

/**
 * Optimistic delete - removes item from array immediately
 */
export function optimisticDelete<T extends ItemWithId>(
  items: T[],
  id: string
): T[] {
  return items.filter(item => getItemId(item) !== id)
}

/**
 * Optimistic add - adds item to array immediately
 */
export function optimisticAdd<T extends ItemWithId>(
  items: T[],
  newItem: T
): T[] {
  return [...items, newItem]
}

/**
 * Optimistic update - updates item in array immediately
 */
export function optimisticUpdate<T extends ItemWithId>(
  items: T[],
  id: string,
  updates: Partial<T>
): T[] {
  return items.map(item => 
    getItemId(item) === id ? { ...item, ...updates } : item
  )
}

/**
 * Optimistic toggle - toggles a boolean field immediately
 */
export function optimisticToggle<T extends ItemWithId>(
  items: T[],
  id: string,
  field: keyof T
): T[] {
  return items.map(item => {
    if (getItemId(item) === id) {
      const currentValue = item[field]
      if (typeof currentValue === 'boolean') {
        return { ...item, [field]: !currentValue } as T
      }
    }
    return item
  })
}

/**
 * Generic delete handler with optimistic update
 */
export async function handleDeleteWithOptimistic<T extends ItemWithId>(
  id: string,
  deleteFn: (id: string) => Promise<{ success: boolean; message?: string }>,
  items: T[],
  setItems: (items: T[]) => void,
  reloadFn?: () => Promise<void>
): Promise<boolean> {
  // Optimistic update: remove immediately
  setItems(optimisticDelete(items, id))

  try {
    const result = await deleteFn(id)

    if (!result.success) {
      // If failed, reload to restore state
      if (reloadFn) {
        await reloadFn()
      }
      return false
    }

    // Success - optionally reload to sync with server
    if (reloadFn) {
      await reloadFn()
    }

    return true
  } catch (error) {
    // On error, reload to restore state
    if (reloadFn) {
      await reloadFn()
    }
    console.error('Error deleting item:', error)
    return false
  }
}

/**
 * Generic create handler with optimistic update
 */
export async function handleCreateWithOptimistic<T extends ItemWithId>(
  createFn: (data: any) => Promise<{ success: boolean; data?: T; message?: string }>,
  data: any,
  items: T[],
  setItems: (items: T[]) => void,
  reloadFn?: () => Promise<void>
): Promise<T | null> {
  try {
    const result = await createFn(data)

    if (result.success && result.data) {
      // Add to state immediately
      setItems(optimisticAdd(items, result.data))

      // Optionally reload to sync with server
      if (reloadFn) {
        await reloadFn()
      }

      return result.data
    }

    return null
  } catch (error) {
    console.error('Error creating item:', error)
    return null
  }
}

/**
 * Generic update handler with optimistic update
 */
export async function handleUpdateWithOptimistic<T extends ItemWithId>(
  id: string,
  updateFn: (id: string, data: any) => Promise<{ success: boolean; data?: T; message?: string }>,
  data: any,
  items: T[],
  setItems: (items: T[]) => void,
  reloadFn?: () => Promise<void>
): Promise<T | null> {
  // Optimistic update: update immediately
  setItems(optimisticUpdate(items, id, data))

  try {
    const result = await updateFn(id, data)

    if (result.success && result.data) {
      // Update with server response
      setItems(optimisticUpdate(items, id, result.data))

      // Optionally reload to sync
      if (reloadFn) {
        await reloadFn()
      }

      return result.data
    }

    // If failed, reload to restore state
    if (reloadFn) {
      await reloadFn()
    }

    return null
  } catch (error) {
    // On error, reload to restore state
    if (reloadFn) {
      await reloadFn()
    }
    console.error('Error updating item:', error)
    return null
  }
}

