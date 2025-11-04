'use client'

import { useState, useEffect } from 'react'
import { 
  Coffee, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Filter,
  Save,
  Image,
  DollarSign,
  Clock,
  Star,
  Eye,
  EyeOff,
  Tag,
  Package,
  ChefHat,
  TrendingUp,
  TrendingDown
} from 'lucide-react'

interface AppetizerItem {
  _id?: string
  name: string
  description: string
  price: number
  image: string
  isAvailable: boolean
  preparationTime: number
  ingredients: string[]
  allergens: string[]
  isPopular: boolean
  isVegetarian: boolean
  isSpicy: boolean
  calories?: number
  tags: string[]
  category: string
  createdAt?: Date
  updatedAt?: Date
  salesCount: number
  rating: number
}

export default function AppetizersPage() {
  const [appetizers, setAppetizers] = useState<AppetizerItem[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState<AppetizerItem | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterAvailability, setFilterAvailability] = useState('all')
  const [filterPopularity, setFilterPopularity] = useState('all')
  const [sortBy, setSortBy] = useState('name')
  const [loading, setLoading] = useState(false)

  const loadAppetizers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/appetizers')
      const result = await response.json()
      if (result.success) {
        setAppetizers(result.data)
      }
    } catch (error) {
      console.error('Error loading appetizers:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAppetizers()
  }, [])

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    isAvailable: true,
    preparationTime: 0,
    ingredients: '',
    allergens: '',
    isPopular: false,
    isVegetarian: false,
    isSpicy: false,
    calories: 0,
    tags: ''
  })

  const filteredAppetizers = appetizers.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesAvailability = filterAvailability === 'all' || 
                               (filterAvailability === 'available' && item.isAvailable) ||
                               (filterAvailability === 'unavailable' && !item.isAvailable)
    const matchesPopularity = filterPopularity === 'all' || 
                              (filterPopularity === 'popular' && item.isPopular) ||
                              (filterPopularity === 'not-popular' && !item.isPopular)
    return matchesSearch && matchesAvailability && matchesPopularity
  }).sort((a, b) => {
    switch (sortBy) {
      case 'name': return a.name.localeCompare(b.name)
      case 'price': return a.price - b.price
      case 'sales': return b.salesCount - a.salesCount
      case 'rating': return b.rating - a.rating
      case 'preparation': return a.preparationTime - b.preparationTime
      default: return 0
    }
  })

  const handleSave = async () => {
    try {
      setLoading(true)
      
      if (editingItem) {
        // Update existing item
        const response = await fetch(`/api/appetizers/${editingItem._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
          },
          body: JSON.stringify({
            ...formData,
            ingredients: formData.ingredients.split(',').map(i => i.trim()).filter(i => i),
            allergens: formData.allergens.split(',').map(a => a.trim()).filter(a => a),
            tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
            image: '/api/placeholder?width=200&height=150'
          })
        })

        const result = await response.json()
        if (result.success) {
        // Optimistic update: update state immediately
        setAppetizers(prev => prev.map(item => 
          (item._id || item.id) === editingItem._id ? { ...item, ...formData } : item
        ))
          setShowForm(false)
          setEditingItem(null)
          resetForm()
        // Reload to get fresh data from server
        await loadAppetizers()
        } else {
          alert('خطا در به‌روزرسانی پیش‌غذا: ' + result.message)
        }
      } else {
        // Create new item
        const response = await fetch('/api/appetizers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
          },
          body: JSON.stringify({
            ...formData,
            ingredients: formData.ingredients.split(',').map(i => i.trim()).filter(i => i),
            allergens: formData.allergens.split(',').map(a => a.trim()).filter(a => a),
            tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
            image: '/api/placeholder?width=200&height=150'
          })
        })

        const result = await response.json()
        if (result.success) {
        // Optimistic update: add to state immediately
        if (result.data) {
          setAppetizers(prev => [...prev, result.data])
        }
          setShowForm(false)
          resetForm()
        // Reload to get fresh data from server
        await loadAppetizers()
        } else {
          alert('خطا در ایجاد پیش‌غذا: ' + result.message)
        }
      }
    } catch (error) {
      console.error('Error saving appetizer:', error)
      alert('خطا در ذخیره پیش‌غذا')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: 0,
      isAvailable: true,
      preparationTime: 0,
      ingredients: '',
      allergens: '',
      isPopular: false,
      isVegetarian: false,
      isSpicy: false,
      calories: 0,
      tags: ''
    })
  }

  const deleteItem = async (id: string) => {
    if (!confirm('آیا مطمئن هستید که می‌خواهید این پیش‌غذا را حذف کنید؟')) {
      return
    }

    try {
      setLoading(true)
      
      // Optimistic update: remove from state immediately
      setAppetizers(prev => prev.filter(item => (item._id || item.id) !== id))
      
      const response = await fetch(`/api/appetizers?id=${id}`, {
        method: 'DELETE'
      })

      const result = await response.json()
      
      if (!result.success) {
        // If delete failed, reload items to restore state
        await loadAppetizers()
        alert('خطا در حذف پیش‌غذا: ' + result.message)
      }
      // If successful, state already updated (optimistic)
    } catch (error) {
      console.error('Error deleting appetizer:', error)
      // On error, reload to restore state
      await loadAppetizers()
      alert('خطا در حذف پیش‌غذا')
    } finally {
      setLoading(false)
    }
  }

  const toggleAvailability = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch('/api/appetizers/status', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify({
          id,
          field: 'isAvailable',
          value: !currentStatus
        })
      })

      const result = await response.json()
      if (result.success) {
        // Optimistic update: update state immediately
        setAppetizers(prev => prev.map(item => 
          (item._id || item.id) === id ? { ...item, isAvailable: !currentStatus } : item
        ))
        // Reload to sync with server
        await loadAppetizers()
      } else {
        // On error, reload to restore state
        await loadAppetizers()
        alert('خطا در تغییر وضعیت: ' + result.message)
      }
    } catch (error) {
      console.error('Error toggling availability:', error)
      alert('خطا در تغییر وضعیت')
    }
  }

  const getTotalItems = () => appetizers.length
  const getAvailableItems = () => appetizers.filter(item => item.isAvailable).length
  const getPopularItems = () => appetizers.filter(item => item.isPopular).length
  const getAveragePrice = () => appetizers.length > 0 ? appetizers.reduce((sum, item) => sum + item.price, 0) / appetizers.length : 0
  const getTotalSales = () => appetizers.reduce((sum, item) => sum + item.salesCount, 0)
  const getAverageRating = () => appetizers.length > 0 ? appetizers.reduce((sum, item) => sum + item.rating, 0) / appetizers.length : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/80 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold gradient-text mb-2">پیش‌غذاها</h1>
          <p className="text-gray-600 dark:text-gray-300">مدیریت پیش‌غذاها و سالادها</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
          <div className="premium-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">کل آیتم‌ها</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{getTotalItems()}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <Coffee className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
          <div className="premium-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">موجود</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{getAvailableItems()}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
          <div className="premium-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">محبوب</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{getPopularItems()}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                <Star className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>
          <div className="premium-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">میانگین قیمت</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {getAveragePrice().toLocaleString('fa-IR')} تومان
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
          <div className="premium-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">کل فروش</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{getTotalSales()}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </div>
          <div className="premium-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">میانگین امتیاز</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {getAverageRating().toFixed(1)}
                </p>
              </div>
              <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/30 rounded-lg flex items-center justify-center">
                <Star className="w-6 h-6 text-pink-600 dark:text-pink-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="premium-card p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="flex-1 relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="جستجو در پیش‌غذاها..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
              <select
                value={filterAvailability}
                onChange={(e) => setFilterAvailability(e.target.value)}
                className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="all">همه وضعیت‌ها</option>
                <option value="available">موجود</option>
                <option value="unavailable">ناموجود</option>
              </select>
              <select
                value={filterPopularity}
                onChange={(e) => setFilterPopularity(e.target.value)}
                className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="all">همه محبوبیت‌ها</option>
                <option value="popular">محبوب</option>
                <option value="not-popular">غیرمحبوب</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="name">نام</option>
                <option value="price">قیمت</option>
                <option value="sales">فروش</option>
                <option value="rating">امتیاز</option>
                <option value="preparation">زمان آماده‌سازی</option>
              </select>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>پیش‌غذای جدید</span>
            </button>
          </div>
        </div>

        {/* Appetizers Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">در حال بارگذاری پیش‌غذاها...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAppetizers.map((item) => (
              <div key={item._id} className="premium-card p-6 hover:shadow-glow transition-all duration-300">
                {/* Item Image */}
                <div className="relative mb-4">
                  <div className="w-full h-32 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                    <Image className="w-8 h-8 text-gray-400" />
                  </div>
                  <div className="absolute top-2 left-2 flex space-x-1 space-x-reverse">
                    {item.isPopular && (
                      <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-full text-xs font-medium">
                        <Star className="inline-block w-3 h-3 ml-1" />
                        محبوب
                      </span>
                    )}
                    {item.isVegetarian && (
                      <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-medium">
                        گیاهی
                      </span>
                    )}
                    {item.isSpicy && (
                      <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-xs font-medium">
                        تند
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => toggleAvailability(item._id!, item.isAvailable)}
                    className={`absolute top-2 right-2 p-1 rounded-full ${
                      item.isAvailable 
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' 
                        : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                    }`}
                  >
                    {item.isAvailable ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </div>

                {/* Item Info */}
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{item.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 line-clamp-2">{item.description}</p>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
                      {item.price.toLocaleString('fa-IR')} تومان
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {item.preparationTime} دقیقه
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1 space-x-reverse">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {item.rating.toFixed(1)} ({item.salesCount} فروش)
                      </span>
                    </div>
                    {item.calories && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {item.calories} کالری
                      </span>
                    )}
                  </div>
                </div>

                {/* Tags */}
                {item.tags.length > 0 && (
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-1">
                      {item.tags.slice(0, 3).map((tag, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs">
                          {tag}
                        </span>
                      ))}
                      {item.tags.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs">
                          +{item.tags.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center space-x-2 space-x-reverse">
                  <button
                    onClick={() => {
                      setEditingItem(item)
                      setFormData({
                        name: item.name,
                        description: item.description,
                        price: item.price,
                        isAvailable: item.isAvailable,
                        preparationTime: item.preparationTime,
                        ingredients: item.ingredients.join(', '),
                        allergens: item.allergens.join(', '),
                        isPopular: item.isPopular,
                        isVegetarian: item.isVegetarian,
                        isSpicy: item.isSpicy,
                        calories: item.calories || 0,
                        tags: item.tags.join(', ')
                      })
                      setShowForm(true)
                    }}
                    className="flex-1 flex items-center justify-center space-x-2 space-x-reverse py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    <span>ویرایش</span>
                  </button>
                  <button
                    onClick={() => deleteItem(item._id!)}
                    className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {editingItem ? 'ویرایش پیش‌غذا' : 'پیش‌غذای جدید'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    نام پیش‌غذا
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    قیمت (تومان)
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    توضیحات
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    زمان آماده‌سازی (دقیقه)
                  </label>
                  <input
                    type="number"
                    value={formData.preparationTime}
                    onChange={(e) => setFormData({...formData, preparationTime: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    کالری
                  </label>
                  <input
                    type="number"
                    value={formData.calories}
                    onChange={(e) => setFormData({...formData, calories: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    مواد اولیه (جدا شده با کاما)
                  </label>
                  <input
                    type="text"
                    value={formData.ingredients}
                    onChange={(e) => setFormData({...formData, ingredients: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    آلرژن‌ها (جدا شده با کاما)
                  </label>
                  <input
                    type="text"
                    value={formData.allergens}
                    onChange={(e) => setFormData({...formData, allergens: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    تگ‌ها (جدا شده با کاما)
                  </label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({...formData, tags: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div className="md:col-span-2">
                  <div className="flex items-center space-x-6 space-x-reverse">
                    <label className="flex items-center space-x-2 space-x-reverse">
                      <input
                        type="checkbox"
                        checked={formData.isAvailable}
                        onChange={(e) => setFormData({...formData, isAvailable: e.target.checked})}
                        className="w-4 h-4 text-primary-600"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">موجود</span>
                    </label>
                    <label className="flex items-center space-x-2 space-x-reverse">
                      <input
                        type="checkbox"
                        checked={formData.isPopular}
                        onChange={(e) => setFormData({...formData, isPopular: e.target.checked})}
                        className="w-4 h-4 text-primary-600"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">محبوب</span>
                    </label>
                    <label className="flex items-center space-x-2 space-x-reverse">
                      <input
                        type="checkbox"
                        checked={formData.isVegetarian}
                        onChange={(e) => setFormData({...formData, isVegetarian: e.target.checked})}
                        className="w-4 h-4 text-primary-600"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">گیاهی</span>
                    </label>
                    <label className="flex items-center space-x-2 space-x-reverse">
                      <input
                        type="checkbox"
                        checked={formData.isSpicy}
                        onChange={(e) => setFormData({...formData, isSpicy: e.target.checked})}
                        className="w-4 h-4 text-primary-600"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">تند</span>
                    </label>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end space-x-3 space-x-reverse mt-6">
                <button
                  onClick={() => {
                    setShowForm(false)
                    setEditingItem(null)
                    resetForm()
                  }}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                >
                  انصراف
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  <span>{loading ? 'در حال ذخیره...' : 'ذخیره'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}