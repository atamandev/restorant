import { useState, useEffect, useCallback } from 'react'

export interface MenuItem {
  _id?: string
  id?: string
  name: string
  price: number
  category: string
  description?: string
  image?: string
  preparationTime?: number
  isAvailable?: boolean
  isPopular?: boolean
  ingredients?: string[]
  allergens?: string[]
  tags?: string[]
  recipe?: Array<{
    ingredientId: string
    quantity: number
    unit?: string
  }>
  salesCount?: number
  rating?: number
  nutritionalInfo?: {
    calories?: number
    protein?: number
    carbs?: number
    fat?: number
  }
  createdAt?: Date | string
  updatedAt?: Date | string
}

interface UseMenuItemsOptions {
  category?: string
  isAvailable?: boolean
  isPopular?: boolean
  searchTerm?: string
  autoRefresh?: boolean
  refreshInterval?: number
}

export function useMenuItems(options: UseMenuItemsOptions = {}) {
  const {
    category,
    isAvailable,
    isPopular,
    searchTerm,
    autoRefresh = false,
    refreshInterval = 60000 // 1 minute default
  } = options

  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadMenuItems = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (category && category !== 'all') {
        params.append('category', category)
      }
      if (isAvailable !== undefined) {
        params.append('isAvailable', String(isAvailable))
      }
      if (isPopular !== undefined) {
        params.append('isPopular', String(isPopular))
      }
      if (searchTerm) {
        params.append('name', searchTerm)
      }

      const url = `/api/menu-items${params.toString() ? '?' + params.toString() : ''}`
      const response = await fetch(url)
      const result = await response.json()

      if (result.success) {
        // Normalize IDs - بعضی جاها _id و بعضی جاها id استفاده می‌شود
        const normalizedItems = result.data.map((item: MenuItem) => ({
          ...item,
          id: item._id || item.id,
        }))
        setMenuItems(normalizedItems)
      } else {
        setError(result.message || 'خطا در دریافت آیتم‌های منو')
        setMenuItems([])
      }
    } catch (err) {
      console.error('Error loading menu items:', err)
      setError('خطا در اتصال به سرور')
      setMenuItems([])
    } finally {
      setLoading(false)
    }
  }, [category, isAvailable, isPopular, searchTerm])

  useEffect(() => {
    loadMenuItems()
  }, [loadMenuItems])

  // Auto refresh if enabled
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      loadMenuItems()
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, loadMenuItems])

  // Filter items based on availability
  const availableItems = menuItems.filter(item => item.isAvailable !== false)

  // Group by category
  const itemsByCategory = menuItems.reduce((acc, item) => {
    const cat = item.category || 'سایر'
    if (!acc[cat]) {
      acc[cat] = []
    }
    acc[cat].push(item)
    return acc
  }, {} as Record<string, MenuItem[]>)

  // Get categories
  const categories = Array.from(new Set(menuItems.map(item => item.category))).filter(Boolean)

  return {
    menuItems,
    availableItems,
    itemsByCategory,
    categories,
    loading,
    error,
    reload: loadMenuItems,
  }
}

