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
  Trash2
} from 'lucide-react'

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
  isAvailable: boolean
  isPopular: boolean
  imageUrl?: string
  createdAt?: string
  updatedAt?: string
}

const categories = [
  { id: 'main_course', name: 'غذاهای اصلی', icon: Pizza, color: 'bg-orange-500' },
  { id: 'appetizer', name: 'پیش‌غذاها', icon: Utensils, color: 'bg-green-500' },
  { id: 'dessert', name: 'دسرها', icon: IceCream, color: 'bg-pink-500' },
  { id: 'beverage', name: 'نوشیدنی‌ها', icon: Coffee, color: 'bg-blue-500' },
  { id: 'other', name: 'سایر', icon: Package, color: 'bg-gray-500' }
]

export default function MenuSetupPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState<MenuItem>({
    name: '',
    category: 'main_course',
    price: 0,
    preparationTime: 15,
    description: '',
    ingredients: [],
    allergens: [],
    isAvailable: true,
    isPopular: false,
    imageUrl: ''
  })
  const [ingredientsText, setIngredientsText] = useState('')
  const [allergensText, setAllergensText] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['main_course'])

  // دریافت لیست آیتم‌های منو
  const fetchMenuItems = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/menu-items')
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
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMenuItems()
  }, [])

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

    try {
      setSaving(true)
      setError('')

      const url = '/api/menu-items'
      const method = editingItem ? 'PUT' : 'POST'
      
      const requestBody = editingItem 
        ? { 
            id: editingItem._id || editingItem.id, 
            ...formData,
            ingredients: ingredientsText.split(',').map(item => item.trim()).filter(item => item),
            allergens: allergensText.split(',').map(item => item.trim()).filter(item => item)
          }
        : {
            ...formData,
            ingredients: ingredientsText.split(',').map(item => item.trim()).filter(item => item),
            allergens: allergensText.split(',').map(item => item.trim()).filter(item => item)
          }

      console.log('Sending request:', { method, url, requestBody })

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      const data = await response.json()

      console.log('Response data:', data)

      if (data.success) {
        await fetchMenuItems() // دریافت مجدد لیست
        resetForm()
      } else {
        setError(data.message || 'خطا در ذخیره آیتم منو')
      }
    } catch (error) {
      console.error('Error saving menu item:', error)
      setError('خطا در اتصال به سرور')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (item: MenuItem) => {
    // فقط فیلدهای مورد نیاز را در formData قرار می‌دهیم
    setFormData({
      name: item.name,
      category: item.category,
      price: item.price,
      preparationTime: item.preparationTime,
      description: item.description || '',
      ingredients: item.ingredients || [],
      allergens: item.allergens || [],
      isAvailable: item.isAvailable,
      isPopular: item.isPopular,
      imageUrl: item.imageUrl || ''
    })
    setIngredientsText((item.ingredients || []).join(', '))
    setAllergensText((item.allergens || []).join(', '))
    setSelectedCategories([item.category])
    setEditingItem(item)
    setIsAddingNew(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('آیا مطمئن هستید که می‌خواهید این آیتم را حذف کنید؟')) return

    try {
      setSaving(true)
      const response = await fetch(`/api/menu-items?id=${id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        await fetchMenuItems() // دریافت مجدد لیست
      } else {
        setError(data.message || 'خطا در حذف آیتم منو')
      }
    } catch (error) {
      console.error('Error deleting menu item:', error)
      setError('خطا در اتصال به سرور')
    } finally {
      setSaving(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'main_course',
      price: 0,
      preparationTime: 15,
      description: '',
      ingredients: [],
      allergens: [],
      isAvailable: true,
      isPopular: false,
      imageUrl: ''
    })
    setIngredientsText('')
    setAllergensText('')
    setSelectedCategories(['main_course'])
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
              {/* Ingredients */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  مواد اولیه (با کاما جدا کنید)
                </label>
                <textarea
                  value={ingredientsText}
                  onChange={(e) => handleIngredientsChange(e.target.value)}
                  placeholder="گوشت گوساله، برنج، سبزیجات"
                  rows={3}
                  className="premium-input w-full resize-none"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  مواد اولیه را با کاما از هم جدا کنید
                </p>
              </div>

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {menuItems.map((item, index) => {
              const CategoryIcon = getCategoryIcon(item.category)
              const categoryColor = getCategoryColor(item.category)
              const category = categories.find(cat => cat.id === item.category)
              
              return (
                <div key={item._id || item.id || index} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 hover:shadow-medium transition-all duration-300">
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

                  {item.ingredients.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">مواد اولیه:</p>
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