import { useState, useCallback } from 'react'

interface UseCRUDOptions<T> {
  fetchFn: () => Promise<T[]>
  deleteFn?: (id: string) => Promise<boolean>
  createFn?: (data: any) => Promise<T>
  updateFn?: (id: string, data: any) => Promise<T>
  optimisticUpdate?: boolean
}

export function useCRUD<T extends { _id?: string; id?: string }>(options: UseCRUDOptions<T>) {
  const { fetchFn, deleteFn, createFn, updateFn, optimisticUpdate = true } = options

  const [items, setItems] = useState<T[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Get unique ID (handles both _id and id)
  const getItemId = (item: T): string => {
    return (item._id || item.id || '') as string
  }

  // Fetch items
  const fetchItems = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchFn()
      setItems(data)
      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'خطا در دریافت داده‌ها'
      setError(errorMessage)
      console.error('Error fetching items:', err)
      return []
    } finally {
      setLoading(false)
    }
  }, [fetchFn])

  // Delete item with optimistic update
  const deleteItem = useCallback(async (id: string): Promise<boolean> => {
    if (!deleteFn) {
      console.error('deleteFn not provided')
      return false
    }

    // Optimistic update: remove from state immediately
    if (optimisticUpdate) {
      setItems(prev => prev.filter(item => getItemId(item) !== id))
    }

    try {
      const success = await deleteFn(id)
      
      if (!success) {
        // If delete failed, reload items to restore state
        if (optimisticUpdate) {
          await fetchItems()
        }
        return false
      }

      // Success - state already updated if optimistic
      if (!optimisticUpdate) {
        await fetchItems()
      }
      
      return true
    } catch (err) {
      // On error, reload items to restore state
      if (optimisticUpdate) {
        await fetchItems()
      }
      setError(err instanceof Error ? err.message : 'خطا در حذف')
      return false
    }
  }, [deleteFn, fetchItems, optimisticUpdate])

  // Create item
  const createItem = useCallback(async (data: any): Promise<T | null> => {
    if (!createFn) {
      console.error('createFn not provided')
      return null
    }

    try {
      const newItem = await createFn(data)
      
      // Add to state immediately
      setItems(prev => [...prev, newItem])
      
      return newItem
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در ایجاد')
      return null
    }
  }, [createFn])

  // Update item
  const updateItem = useCallback(async (id: string, data: any): Promise<T | null> => {
    if (!updateFn) {
      console.error('updateFn not provided')
      return null
    }

    // Optimistic update
    if (optimisticUpdate) {
      setItems(prev => prev.map(item => 
        getItemId(item) === id ? { ...item, ...data } : item
      ))
    }

    try {
      const updatedItem = await updateFn(id, data)
      
      if (!optimisticUpdate) {
        // Replace in state
        setItems(prev => prev.map(item => 
          getItemId(item) === id ? updatedItem : item
        ))
      } else {
        // Update with server response
        setItems(prev => prev.map(item => 
          getItemId(item) === id ? updatedItem : item
        ))
      }
      
      return updatedItem
    } catch (err) {
      // On error, reload items
      await fetchItems()
      setError(err instanceof Error ? err.message : 'خطا در به‌روزرسانی')
      return null
    }
  }, [updateFn, fetchItems, optimisticUpdate])

  // Toggle field (like isAvailable)
  const toggleField = useCallback(async (
    id: string, 
    field: keyof T, 
    apiFn: (id: string, value: any) => Promise<boolean>
  ): Promise<boolean> => {
    const item = items.find(i => getItemId(i) === id)
    if (!item) return false

    const currentValue = item[field]
    const newValue = !currentValue

    // Optimistic update
    if (optimisticUpdate) {
      setItems(prev => prev.map(i => 
        getItemId(i) === id ? { ...i, [field]: newValue } : i
      ))
    }

    try {
      const success = await apiFn(id, newValue)
      
      if (!success) {
        // If failed, restore state
        if (optimisticUpdate) {
          setItems(prev => prev.map(i => 
            getItemId(i) === id ? { ...i, [field]: currentValue } : i
          ))
        }
        return false
      }

      // If not optimistic, reload
      if (!optimisticUpdate) {
        await fetchItems()
      }
      
      return true
    } catch (err) {
      // On error, restore state
      if (optimisticUpdate) {
        setItems(prev => prev.map(i => 
          getItemId(i) === id ? { ...i, [field]: currentValue } : i
        ))
      } else {
        await fetchItems()
      }
      return false
    }
  }, [items, fetchItems, optimisticUpdate])

  return {
    items,
    setItems,
    loading,
    error,
    fetchItems,
    deleteItem,
    createItem,
    updateItem,
    toggleField,
    reload: fetchItems,
  }
}

