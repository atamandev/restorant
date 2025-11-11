'use client'

import { useState, useEffect } from 'react'
import { 
  Plus, 
  Save, 
  X, 
  Upload, 
  Image as ImageIcon,
  Clock,
  DollarSign,
  Package,
  AlertTriangle,
  Star,
  CheckCircle,
  ChefHat,
  Coffee,
  Pizza,
  IceCream,
  Utensils,
  Loader2,
  Edit,
  Trash2,
  Search,
  Warehouse
} from 'lucide-react'

interface InventoryItem {
  _id: string
  name: string
  category: string
  unit: string
  currentStock: number
  code?: string
  unitPrice?: number
}

interface RecipeItem {
  ingredientId: string
  ingredientName: string
  quantity: number
  unit: string
}

interface MenuItem {
  _id?: string
  id?: string
  name: string
  category: string
  price: number
  preparationTime: number
  description: string
  ingredients: string[]
  allergens: string[]
  recipe?: RecipeItem[]
  isAvailable: boolean
  isPopular: boolean
  imageUrl?: string
  createdAt?: string
  updatedAt?: string
}

const categories = [
  { id: 'غذاهای اصلی', name: 'غذاهای اصلی', icon: Pizza, color: 'bg-orange-500' },
  { id: 'پیش‌غذاها', name: 'پیش‌غذاها', icon: Utensils, color: 'bg-green-500' },
  { id: 'دسرها', name: 'دسرها', icon: IceCream, color: 'bg-pink-500' },
  { id: 'نوشیدنی‌ها', name: 'نوشیدنی‌ها', icon: Coffee, color: 'bg-blue-500' },
  { id: 'سایر', name: 'سایر', icon: Package, color: 'bg-gray-500' }
]

export default function MenuSetupPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [refreshTrigger, setRefreshTrigger] = useState(0) // برای force re-render
  
  const [formData, setFormData] = useState<MenuItem>({
    name: '',
    category: 'غذاهای اصلی', // استفاده از نام فارسی برای یکپارچگی
    price: 0,
    preparationTime: 15,
    description: '',
    ingredients: [],
    allergens: [],
    recipe: [],
    isAvailable: true,
    isPopular: false,
    imageUrl: ''
  })
  const [ingredientsText, setIngredientsText] = useState('')
  const [allergensText, setAllergensText] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['غذاهای اصلی'])
  
  // Recipe management states
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [recipeItems, setRecipeItems] = useState<RecipeItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedInventoryIds, setSelectedInventoryIds] = useState<Set<string>>(new Set())
  const [quantities, setQuantities] = useState<Record<string, number>>({})

  // دریافت لیست آیتم‌های منو
  const fetchMenuItems = async (showLoading = false) => {
    try {
      if (showLoading) {
        setLoading(true)
      }
      const response = await fetch('/api/menu-items?includeRecipe=true')
      const data = await response.json()
      
      if (data.success) {
        setMenuItems(data.data)
      } else {
        setError(data.message || 'خطا در دریافت لیست آیتم‌های منو')
      }
    } catch (error) {
      console.error('Error fetching menu items:', error)
      setError('خطا در اتصال به سرور')
    } finally {
      if (showLoading) {
        setLoading(false)
      }
    }
  }

  // دریافت لیست آیتم‌های موجودی
  const fetchInventoryItems = async () => {
    try {
      const response = await fetch('/api/inventory-items?limit=1000')
      const data = await response.json()
      
      if (data.success) {
        setInventoryItems(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching inventory items:', error)
    }
  }

  // محاسبه مجموع قیمت کالاهای استفاده شده در recipe
  const calculateTotalIngredientCost = () => {
    let total = 0
    recipeItems.forEach(recipeItem => {
      const inventoryItem = inventoryItems.find(item => item._id.toString() === recipeItem.ingredientId)
      if (inventoryItem && inventoryItem.unitPrice) {
        total += inventoryItem.unitPrice * recipeItem.quantity
      }
    })
    return total
  }

  useEffect(() => {
    fetchMenuItems(true) // فقط در بارگذاری اولیه loading نمایش بده
    fetchInventoryItems()
    
    // Auto-refresh هر 60 ثانیه برای به‌روزرسانی خودکار منو (بهینه شده)
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchMenuItems(false) // بدون نمایش loading
      }
    }, 60000)
    
    return () => clearInterval(interval)
  }, [])

  // فیلتر کردن inventory items بر اساس جستجو
  const filteredInventoryItems = inventoryItems.filter(item => {
    const searchLower = searchTerm.toLowerCase()
    return item.name.toLowerCase().includes(searchLower) ||
           item.code?.toLowerCase().includes(searchLower) ||
           item.category.toLowerCase().includes(searchLower)
  })

  // تیک زدن/بردارن کردن checkbox
  const handleToggleInventoryItem = (itemId: string) => {
    const newSelectedIds = new Set(selectedInventoryIds)
    if (newSelectedIds.has(itemId)) {
      newSelectedIds.delete(itemId)
      // حذف از recipe items
      const updatedRecipeItems = recipeItems.filter(item => item.ingredientId !== itemId)
      setRecipeItems(updatedRecipeItems)
      // به‌روزرسانی فیلد نمایشی
      setIngredientsText(updatedRecipeItems.map(item => item.ingredientName).join(', '))
      // حذف از quantities
      const newQuantities = { ...quantities }
      delete newQuantities[itemId]
      setQuantities(newQuantities)
    } else {
      newSelectedIds.add(itemId)
      const selectedItem = inventoryItems.find(item => item._id.toString() === itemId)
      if (selectedItem) {
        const quantity = quantities[itemId] || 1
        const newRecipeItem: RecipeItem = {
          ingredientId: itemId,
          ingredientName: selectedItem.name,
          quantity: quantity,
          unit: selectedItem.unit
        }
        const updatedRecipeItems = [...recipeItems, newRecipeItem]
        setRecipeItems(updatedRecipeItems)
        // به‌روزرسانی فیلد نمایشی
        setIngredientsText(updatedRecipeItems.map(item => item.ingredientName).join(', '))
      }
    }
    setSelectedInventoryIds(newSelectedIds)
    setError('')
  }

  // تغییر مقدار ماده اولیه
  const handleQuantityChange = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      setError('مقدار باید بیشتر از صفر باشد')
      return
    }
    setQuantities({ ...quantities, [itemId]: quantity })
    // به‌روزرسانی recipe items
    setRecipeItems(recipeItems.map(item => 
      item.ingredientId === itemId 
        ? { ...item, quantity: quantity }
        : item
    ))
    setError('')
  }

  // حذف ماده اولیه از recipe
  const handleRemoveRecipeItem = (ingredientId: string) => {
    const updatedRecipeItems = recipeItems.filter(item => item.ingredientId !== ingredientId)
    setRecipeItems(updatedRecipeItems)
    // به‌روزرسانی فیلد نمایشی
    setIngredientsText(updatedRecipeItems.map(item => item.ingredientName).join(', '))
    const newSelectedIds = new Set(selectedInventoryIds)
    newSelectedIds.delete(ingredientId)
    setSelectedInventoryIds(newSelectedIds)
    const newQuantities = { ...quantities }
    delete newQuantities[ingredientId]
    setQuantities(newQuantities)
  }


  const handleInputChange = (field: keyof MenuItem, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleIngredientsChange = (value: string) => {
    setIngredientsText(value)
    const ingredients = value.split(',').map(item => item.trim()).filter(item => item)
    setFormData(prev => ({
      ...prev,
      ingredients
    }))
  }

  const handleAllergensChange = (value: string) => {
    setAllergensText(value)
    const allergens = value.split(',').map(item => item.trim()).filter(item => item)
    setFormData(prev => ({
      ...prev,
      allergens
    }))
  }

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId)
      } else {
        return [...prev, categoryId]
      }
    })
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setError('نام آیتم الزامی است')
      return
    }

    // Optimistic update: به‌روزرسانی فوری UI قبل از دریافت پاسخ
    const previousMenuItems = [...menuItems]
    const recipe = recipeItems.map(item => ({
      ingredientId: item.ingredientId,
      quantity: item.quantity,
      unit: item.unit
    }))

    if (editingItem) {
      // به‌روزرسانی فوری آیتم موجود
      const editId = editingItem._id || editingItem.id
      const updatedItem: MenuItem = {
        ...formData,
        _id: editId,
        id: editId,
        ingredients: ingredientsText.split(',').map(item => item.trim()).filter(item => item),
        allergens: allergensText.split(',').map(item => item.trim()).filter(item => item),
        recipe: recipe
      }
      setMenuItems(prevItems => prevItems.map(item => {
        const itemId = item._id || item.id
        return (itemId === editId || itemId === editId?.toString()) ? updatedItem : item
      }))
      setRefreshTrigger(prev => prev + 1)
    } else {
      // اضافه کردن فوری آیتم جدید
      const newItem: MenuItem = {
        ...formData,
        _id: `temp-${Date.now()}`,
        id: `temp-${Date.now()}`,
        ingredients: ingredientsText.split(',').map(item => item.trim()).filter(item => item),
        allergens: allergensText.split(',').map(item => item.trim()).filter(item => item),
        recipe: recipe
      }
      setMenuItems(prev => [...prev, newItem])
      setRefreshTrigger(prev => prev + 1)
    }

    try {
      setSaving(true)
      setError('')

      const url = '/api/menu-items'
      const method = editingItem ? 'PUT' : 'POST'
      
      // تبدیل recipeItems به فرمت مورد نیاز API
      const recipe = recipeItems.map(item => ({
        ingredientId: item.ingredientId,
        quantity: item.quantity,
        unit: item.unit
      }))
      
      const requestBody = editingItem 
        ? { 
            id: editingItem._id || editingItem.id, 
            ...formData,
            ingredients: ingredientsText.split(',').map(item => item.trim()).filter(item => item),
            allergens: allergensText.split(',').map(item => item.trim()).filter(item => item),
            recipe: recipe
          }
        : {
            ...formData,
            ingredients: ingredientsText.split(',').map(item => item.trim()).filter(item => item),
            allergens: allergensText.split(',').map(item => item.trim()).filter(item => item),
            recipe: recipe
          }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      const data = await response.json()

      if (data.success) {
        // به‌روزرسانی با داده‌های واقعی از سرور
        if (editingItem) {
          // ویرایش: به‌روزرسانی آیتم با داده‌های واقعی
          const editId = editingItem._id || editingItem.id
          const updatedItem: MenuItem = {
            ...data.data,
            _id: data.data?._id || editId,
            id: data.data?._id || editId,
            recipe: recipe
          }
          
          setMenuItems(prevItems => prevItems.map(item => {
            const itemId = item._id || item.id
            return (itemId === editId || itemId === editId?.toString()) ? updatedItem : item
          }))
          setRefreshTrigger(prev => prev + 1)
        } else {
          // افزودن جدید: جایگزین کردن آیتم موقت با داده‌های واقعی
          const newItem: MenuItem = {
            ...data.data,
            _id: data.data?._id || data.data?.id,
            id: data.data?._id || data.data?.id,
            recipe: recipe,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
          
          setMenuItems(prevItems => {
            // بررسی اینکه آیا قبلاً اضافه نشده
            const exists = prevItems.some(item => {
              const itemId = item._id || item.id
              const newId = newItem._id || newItem.id
              return itemId === newId || itemId === newId?.toString()
            })
            if (!exists) {
              return [...prevItems, newItem]
            }
            return prevItems
          })
          // Force re-render
          setRefreshTrigger(prev => prev + 1)
        }
        
        resetForm()
      } else {
        // در صورت خطا، به حالت قبلی برگردان
        setMenuItems(previousMenuItems)
        setRefreshTrigger(prev => prev + 1)
        setError(data.message || 'خطا در ذخیره آیتم منو')
      }
    } catch (error) {
      // در صورت خطا، به حالت قبلی برگردان
      setMenuItems(previousMenuItems)
      setRefreshTrigger(prev => prev + 1)
      console.error('Error saving menu item:', error)
      setError('خطا در اتصال به سرور')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = async (item: MenuItem) => {
    // فقط فیلدهای مورد نیاز را در formData قرار می‌دهیم
    setFormData({
      name: item.name,
      category: item.category,
      price: item.price,
      preparationTime: item.preparationTime,
      description: item.description || '',
      ingredients: item.ingredients || [],
      allergens: item.allergens || [],
      recipe: item.recipe || [],
      isAvailable: item.isAvailable,
      isPopular: item.isPopular,
      imageUrl: item.imageUrl || ''
    })
    setIngredientsText((item.ingredients || []).join(', '))
    setAllergensText((item.allergens || []).join(', '))
    setSelectedCategories([item.category])
    
    // بارگذاری recipe items
    if (item.recipe && item.recipe.length > 0) {
      // اگر recipe با جزئیات کامل است (از API با includeRecipe=true)
      const loadedRecipeItems: RecipeItem[] = item.recipe.map((r: any) => ({
        ingredientId: r.ingredientId || r._id || '',
        ingredientName: r.ingredientName || r.name || '',
        quantity: r.quantity || 1,
        unit: r.unit || 'عدد'
      }))
      setRecipeItems(loadedRecipeItems)
      // تنظیم selectedInventoryIds و quantities
      const newSelectedIds = new Set<string>()
      const newQuantities: Record<string, number> = {}
      loadedRecipeItems.forEach(ri => {
        newSelectedIds.add(ri.ingredientId)
        newQuantities[ri.ingredientId] = ri.quantity
      })
      setSelectedInventoryIds(newSelectedIds)
      setQuantities(newQuantities)
    } else {
      setRecipeItems([])
      setSelectedInventoryIds(new Set())
      setQuantities({})
    }
    
    setEditingItem(item)
    setIsAddingNew(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('آیا مطمئن هستید که می‌خواهید این آیتم را حذف کنید؟')) return

    try {
      setSaving(true)
      setError('')
      
      // حذف فوری از UI (optimistic update) - با استفاده از callback برای اطمینان از update
      setMenuItems(prevItems => {
        const filtered = prevItems.filter(item => {
          const itemId = item._id || item.id
          return itemId !== id && itemId !== id.toString()
        })
        return filtered
      })
      // Force re-render
      setRefreshTrigger(prev => prev + 1)
      
      // اگر در حال ویرایش همان آیتم هستیم، فرم را ببند
      if (editingItem && ((editingItem._id || editingItem.id) === id)) {
        resetForm()
      }
      
      const response = await fetch(`/api/menu-items?id=${id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!data.success) {
        // اگر خطا رخ داد، لیست را دوباره دریافت کن
        await fetchMenuItems(false)
        setError(data.message || 'خطا در حذف آیتم منو')
      }
      // اگر موفق بود، نیازی به fetch مجدد نیست چون قبلاً از UI حذف کردیم
    } catch (error) {
      console.error('Error deleting menu item:', error)
      // در صورت خطا، لیست را دوباره دریافت کن
      await fetchMenuItems(false)
      setError('خطا در اتصال به سرور')
    } finally {
      setSaving(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'غذاهای اصلی', // استفاده از نام فارسی
      price: 0,
      preparationTime: 15,
      description: '',
      ingredients: [],
      allergens: [],
      recipe: [],
      isAvailable: true,
      isPopular: false,
      imageUrl: ''
    })
    setIngredientsText('')
    setAllergensText('')
    setSelectedCategories(['غذاهای اصلی'])
    setRecipeItems([])
    setSelectedInventoryIds(new Set())
    setQuantities({})
    setSearchTerm('')
    setIsAddingNew(false)
    setEditingItem(null)
    setError('')
  }

  const getCategoryIcon = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId)
    return category?.icon || Package
  }

  const getCategoryColor = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId)
    return category?.color || 'bg-gray-500'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/80 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">در حال بارگذاری...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2">مدیریت منو</h1>
            <p className="text-gray-600 dark:text-gray-300">ایجاد و مدیریت آیتم‌های منو</p>
          </div>
          <button
            onClick={() => setIsAddingNew(true)}
            className="premium-button flex items-center space-x-2 space-x-reverse"
          >
            <Plus className="w-5 h-5" />
            <span>آیتم منو جدید</span>
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
          <div className="flex items-center space-x-2 space-x-reverse">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <span className="text-red-700 dark:text-red-300">{error}</span>
          </div>
        </div>
      )}

      {/* Add/Edit Form */}
      {isAddingNew && (
        <div className="premium-card p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {editingItem ? 'ویرایش آیتم' : 'آیتم منو جدید'}
            </h2>
            <button
              onClick={resetForm}
              className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Item Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  نام آیتم *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="نام آیتم را وارد کنید"
                  className="premium-input w-full"
                />
              </div>

              {/* Category Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  دسته‌بندی *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {categories.map(category => {
                    const Icon = category.icon
                    const isSelected = selectedCategories.includes(category.id)
                    return (
                      <button
                        key={category.id}
                        onClick={() => {
                          setSelectedCategories([category.id])
                          handleInputChange('category', category.id)
                        }}
                        className={`flex items-center space-x-2 space-x-reverse p-3 rounded-xl border transition-all duration-300 ${
                          isSelected
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600'
                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                        }`}
                      >
                        <div className={`w-8 h-8 ${category.color} rounded-lg flex items-center justify-center`}>
                          <Icon className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-sm font-medium">{category.name}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  قیمت (تومان) *
                </label>
                <div className="relative">
                  <DollarSign className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', Number(e.target.value))}
                    placeholder="0"
                    className="premium-input pr-10 w-full"
                  />
                </div>
              </div>

              {/* Preparation Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  زمان آماده‌سازی (دقیقه)
                </label>
                <div className="relative">
                  <Clock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="number"
                    value={formData.preparationTime}
                    onChange={(e) => handleInputChange('preparationTime', Number(e.target.value))}
                    placeholder="15"
                    className="premium-input pr-10 w-full"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  توضیحات
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="توضیحات آیتم را وارد کنید"
                  rows={3}
                  className="premium-input w-full resize-none"
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Recipe Editor - Materials - FIRST AND MAIN */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border-2 border-blue-300 dark:border-blue-700 rounded-xl p-5 shadow-md">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-base font-bold text-gray-900 dark:text-white flex items-center space-x-2 space-x-reverse">
                    <Warehouse className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    <span>مواد اولیه و مقادیر مصرفی *</span>
                  </label>
                  <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded-full">ضروری</span>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 mb-3 border border-blue-200 dark:border-blue-700">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">📝 راهنمای استفاده:</p>
                  <ol className="text-xs text-gray-600 dark:text-gray-400 space-y-1 mr-4 list-decimal">
                    <li>مواد اولیه مورد نیاز را از لیست زیر با تیک زدن انتخاب کنید</li>
                    <li>مقدار مصرفی هر ماده را در کنار آن وارد کنید</li>
                    <li>واحد به صورت خودکار نمایش داده می‌شود</li>
                    <li>مواد انتخاب شده در بخش "مواد اولیه انتخاب شده" نمایش داده می‌شوند</li>
                  </ol>
                </div>

                {/* Search Input for filtering */}
                <div className="relative mb-3">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="جستجوی ماده اولیه..."
                    className="premium-input pr-10 w-full"
                  />
                </div>

                {/* Inventory Items List with Checkboxes */}
                <div className="max-h-96 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 p-3 mb-3">
                  {filteredInventoryItems.length === 0 ? (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                      هیچ ماده اولیه‌ای یافت نشد
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {filteredInventoryItems.map((item) => {
                        const itemId = item._id.toString()
                        const isSelected = selectedInventoryIds.has(itemId)
                        const quantity = quantities[itemId] || 1
                        
                        return (
                          <div
                            key={item._id}
                            className={`flex items-center space-x-3 space-x-reverse p-3 rounded-lg border transition-all ${
                              isSelected
                                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
                                : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleInventoryItem(itemId)}
                              className="w-5 h-5 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 cursor-pointer"
                            />
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-white">{item.name}</p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {item.category} • موجودی: {item.currentStock} {item.unit}
                                  </p>
                                </div>
                              </div>
                              {isSelected && (
                                <div className="mt-2 flex items-center space-x-2 space-x-reverse">
                                  <label className="text-xs text-gray-600 dark:text-gray-400">مقدار:</label>
                                  <input
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    value={quantity}
                                    onChange={(e) => handleQuantityChange(itemId, Number(e.target.value))}
                                    className="premium-input w-24 text-sm h-8"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                  <span className="text-xs text-gray-500 dark:text-gray-400">{item.unit}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Recipe Items List - Selected Items Summary */}
                {recipeItems.length > 0 && (
                  <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-semibold text-green-800 dark:text-green-200 flex items-center space-x-2 space-x-reverse">
                        <CheckCircle className="w-5 h-5" />
                        <span>مواد اولیه انتخاب شده ({recipeItems.length} مورد):</span>
                      </p>
                      <div className="flex items-center space-x-2 space-x-reverse bg-white dark:bg-gray-800 px-3 py-1 rounded-lg border border-green-300 dark:border-green-700">
                        <DollarSign className="w-4 h-4 text-green-600 dark:text-green-400" />
                        <span className="text-sm font-bold text-green-700 dark:text-green-300">
                          مجموع قیمت: {calculateTotalIngredientCost().toLocaleString('fa-IR')} تومان
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {recipeItems.map((item) => {
                        const inventoryItem = inventoryItems.find(inv => inv._id.toString() === item.ingredientId)
                        const itemCost = inventoryItem && inventoryItem.unitPrice 
                          ? inventoryItem.unitPrice * item.quantity 
                          : 0
                        return (
                          <div
                            key={item.ingredientId}
                            className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded-lg border border-green-200 dark:border-green-700"
                          >
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {item.ingredientName}
                              </p>
                              <div className="flex items-center space-x-3 space-x-reverse mt-1">
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                  مقدار: <span className="font-semibold">{item.quantity} {item.unit}</span>
                                </p>
                                {inventoryItem && inventoryItem.unitPrice && (
                                  <p className="text-xs text-gray-600 dark:text-gray-400">
                                    قیمت واحد: <span className="font-semibold">{inventoryItem.unitPrice.toLocaleString('fa-IR')} تومان</span>
                                  </p>
                                )}
                                {itemCost > 0 && (
                                  <p className="text-xs font-semibold text-green-600 dark:text-green-400">
                                    = {itemCost.toLocaleString('fa-IR')} تومان
                                  </p>
                                )}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveRecipeItem(item.ingredientId)}
                              className="p-2 text-red-500 hover:text-red-700 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              title="حذف"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Example Section */}
                {recipeItems.length === 0 && (
                  <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <p className="text-xs font-medium text-yellow-800 dark:text-yellow-200 mb-2">💡 مثال:</p>
                    <div className="text-xs text-yellow-700 dark:text-yellow-300 space-y-1">
                      <p><strong>قرمه سبزی:</strong></p>
                      <ul className="mr-4 list-disc space-y-0.5">
                        <li>گوشت گوساله: 300 گرم</li>
                        <li>برنج: 200 گرم</li>
                        <li>تره: 50 گرم</li>
                      </ul>
                      <p className="mt-2"><strong>نوشابه:</strong></p>
                      <ul className="mr-4 list-disc">
                        <li>نوشابه: 1 عدد</li>
                      </ul>
                    </div>
                  </div>
                )}

                <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                  ✅ مواد اولیه را از لیست موجودی انتخاب کنید و مقدار مصرفی را وارد کنید
                </p>
              </div>

              {/* Ingredients (for display only - kept for backward compatibility) - HIDDEN/DISABLED */}
              <details className="border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <summary className="cursor-pointer p-4 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200">
                  <span className="flex items-center space-x-2 space-x-reverse">
                    <AlertTriangle className="w-4 h-4" />
                    <span>مواد اولیه نمایشی (اختیاری - فقط برای نمایش در منو)</span>
                  </span>
                </summary>
                <div className="p-4 pt-0">
                  <textarea
                    value={ingredientsText}
                    onChange={(e) => handleIngredientsChange(e.target.value)}
                    placeholder="گوشت گوساله، برنج، سبزیجات"
                    rows={2}
                    className="premium-input w-full resize-none"
                  />
                  <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2 flex items-center space-x-1 space-x-reverse">
                    <AlertTriangle className="w-3 h-3" />
                    <span>این فیلد فقط برای نمایش در منو است و در محاسبه موجودی استفاده نمی‌شود. برای کنترل موجودی از بخش "مواد اولیه و مقادیر مصرفی" استفاده کنید.</span>
                  </p>
                </div>
              </details>

              {/* Allergens */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  آلرژن‌ها (با کاما جدا کنید)
                </label>
                <textarea
                  value={allergensText}
                  onChange={(e) => handleAllergensChange(e.target.value)}
                  placeholder="گلوتن، لاکتوز"
                  rows={2}
                  className="premium-input w-full resize-none"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  آلرژن‌ها را با کاما از هم جدا کنید
                </p>
              </div>

              {/* Status Options */}
              <div className="space-y-4">
                <div className="flex items-center space-x-4 space-x-reverse">
                  <label className="flex items-center space-x-2 space-x-reverse cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isAvailable}
                      onChange={(e) => handleInputChange('isAvailable', e.target.checked)}
                      className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">موجود</span>
                  </label>
                </div>

                <div className="flex items-center space-x-4 space-x-reverse">
                  <label className="flex items-center space-x-2 space-x-reverse cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isPopular}
                      onChange={(e) => handleInputChange('isPopular', e.target.checked)}
                      className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <Star className="w-5 h-5 text-yellow-600" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">محبوب</span>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4 space-x-reverse pt-4">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 premium-button bg-green-500 hover:bg-green-600 flex items-center justify-center space-x-2 space-x-reverse disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  <span>ذخیره</span>
                </button>
                <button
                  onClick={resetForm}
                  className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  انصراف
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Menu Items List */}
      <div className="premium-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">لیست آیتم‌های منو</h2>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {menuItems.length} آیتم
          </div>
        </div>

        {menuItems.length === 0 ? (
          <div className="text-center py-12">
            <ChefHat className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-2">
              هیچ آیتمی در منو وجود ندارد
            </h3>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              برای شروع، آیتم منو جدید اضافه کنید
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" key={refreshTrigger}>
            {menuItems.map((item, index) => {
              const CategoryIcon = getCategoryIcon(item.category)
              const categoryColor = getCategoryColor(item.category)
              const category = categories.find(cat => cat.id === item.category)
              
              return (
                <div key={`${item._id || item.id || index}-${refreshTrigger}`} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 hover:shadow-medium transition-all duration-300">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <div className={`w-10 h-10 ${categoryColor} rounded-lg flex items-center justify-center`}>
                        <CategoryIcon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{item.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{category?.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      {item.isPopular && (
                        <Star className="w-4 h-4 text-yellow-500" />
                      )}
                      {item.isAvailable ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-300">قیمت:</span>
                      <span className="font-semibold text-primary-600 dark:text-primary-400">
                        {item.price.toLocaleString('fa-IR')} تومان
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-300">زمان آماده‌سازی:</span>
                      <span className="text-sm text-gray-700 dark:text-gray-200">{item.preparationTime} دقیقه</span>
                    </div>
                  </div>

                  {item.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                      {item.description}
                    </p>
                  )}

                  {/* Recipe Display */}
                  {item.recipe && item.recipe.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 flex items-center space-x-1 space-x-reverse">
                        <Warehouse className="w-3 h-3" />
                        <span>مواد اولیه (Recipe):</span>
                      </p>
                      <div className="space-y-1">
                        {item.recipe.slice(0, 3).map((recipeItem: any, index: number) => (
                          <div key={index} className="text-xs bg-blue-50 dark:bg-blue-900/20 text-gray-700 dark:text-gray-300 px-2 py-1 rounded flex items-center justify-between">
                            <span>{recipeItem.ingredientName || recipeItem.name || 'نامشخص'}</span>
                            <span className="text-gray-500 dark:text-gray-400">
                              {recipeItem.quantity} {recipeItem.unit || 'عدد'}
                            </span>
                          </div>
                        ))}
                        {item.recipe.length > 3 && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            +{item.recipe.length - 3} ماده اولیه بیشتر
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Ingredients Display (for backward compatibility) */}
                  {item.ingredients && item.ingredients.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">مواد اولیه نمایشی:</p>
                      <div className="flex flex-wrap gap-1">
                        {item.ingredients.slice(0, 3).map((ingredient, index) => (
                          <span key={index} className="text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-2 py-1 rounded">
                            {ingredient}
                          </span>
                        ))}
                        {item.ingredients.length > 3 && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            +{item.ingredients.length - 3} بیشتر
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex space-x-2 space-x-reverse">
                    <button
                      onClick={() => handleEdit(item)}
                      disabled={saving}
                      className="flex-1 px-3 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-sm disabled:opacity-50"
                    >
                      ویرایش
                    </button>
                    <button
                      onClick={() => handleDelete(item._id || item.id || '')}
                      disabled={saving}
                      className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm disabled:opacity-50"
                    >
                      حذف
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}