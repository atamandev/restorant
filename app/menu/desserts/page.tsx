'use client'

import { useState, useEffect } from 'react'
import { 
  Star, 
  Search, 
  Plus, 
  Minus, 
  Edit, 
  Trash2, 
  Clock, 
  DollarSign, 
  Package, 
  Eye, 
  Save, 
  X, 
  CheckCircle,
  AlertCircle
} from 'lucide-react'

interface Dessert {
  _id?: string
  name: string
  description: string
  price: number
  image: string
  preparationTime: number
  ingredients: string[]
  category: string
  isAvailable: boolean
  rating: number
  popularity: number
  calories: number
  allergens: string[]
  sweetness: 'کم' | 'متوسط' | 'زیاد'
  createdAt?: Date
  updatedAt?: Date
}

export default function DessertsPage() {
  const [desserts, setDesserts] = useState<Dessert[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editingDessert, setEditingDessert] = useState<Dessert | null>(null)
  const [showDetails, setShowDetails] = useState<Dessert | null>(null)
  const [loading, setLoading] = useState(false)

  const loadDesserts = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/desserts')
      const result = await response.json()
      if (result.success) {
        setDesserts(result.data)
      }
    } catch (error) {
      console.error('Error loading desserts:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDesserts()
  }, [])

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    image: '',
    preparationTime: 0,
    ingredients: '',
    category: '',
    isAvailable: true,
    calories: 0,
    allergens: '',
    sweetness: 'متوسط' as 'کم' | 'متوسط' | 'زیاد'
  })

  const categories = ['all', 'بستنی', 'شیرینی', 'کیک', 'پودینگ', 'ترافل', 'ماکارون']

  const filteredDesserts = desserts.filter(dessert =>
    (selectedCategory === 'all' || dessert.category === selectedCategory) &&
    dessert.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSave = async () => {
    try {
      setLoading(true)
      
      if (editingDessert) {
        // Update existing item
        const response = await fetch(`/api/desserts/${editingDessert._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
          },
          body: JSON.stringify({
            ...formData,
            ingredients: formData.ingredients.split(',').map(ing => ing.trim()).filter(ing => ing),
            allergens: formData.allergens.split(',').map(all => all.trim()).filter(all => all),
            image: '/api/placeholder?width=200&height=150'
          })
        })

        const result = await response.json()
        if (result.success) {
          // Optimistic update: update state immediately
          setDesserts(prev => prev.map(item => 
            (item._id || item.id) === editingDessert._id ? { ...item, ...formData } : item
          ))
          setShowForm(false)
          setEditingDessert(null)
          resetForm()
          // Reload to get fresh data from server
          await loadDesserts()
        } else {
          alert('خطا در به‌روزرسانی دسر: ' + result.message)
        }
      } else {
        // Create new item
        const response = await fetch('/api/desserts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
          },
          body: JSON.stringify({
            ...formData,
            ingredients: formData.ingredients.split(',').map(ing => ing.trim()).filter(ing => ing),
            allergens: formData.allergens.split(',').map(all => all.trim()).filter(all => all),
            image: '/api/placeholder?width=200&height=150'
          })
        })

        const result = await response.json()
        if (result.success) {
          // Optimistic update: add to state immediately
          if (result.data) {
            setDesserts(prev => [...prev, result.data])
          }
          setShowForm(false)
          resetForm()
          // Reload to get fresh data from server
          await loadDesserts()
        } else {
          alert('خطا در ایجاد دسر: ' + result.message)
        }
      }
    } catch (error) {
      console.error('Error saving dessert:', error)
      alert('خطا در ذخیره دسر')
    } finally {
      setLoading(false)
    }
  }

  const deleteDessert = async (id: string) => {
    if (!confirm('آیا از حذف این دسر مطمئن هستید؟')) {
      return
    }

    try {
      setLoading(true)
      
      // Optimistic update: remove from state immediately
      setDesserts(prev => prev.filter(item => (item._id || item.id) !== id))
      
      const response = await fetch(`/api/desserts?id=${id}`, {
        method: 'DELETE'
      })

      const result = await response.json()
      
      if (!result.success) {
        // If delete failed, reload items to restore state
        await loadDesserts()
        alert('خطا در حذف دسر: ' + result.message)
      }
      // If successful, state already updated (optimistic)
      // Also reload to sync with server
      await loadDesserts()
    } catch (error) {
      console.error('Error deleting dessert:', error)
      // On error, reload to restore state
      await loadDesserts()
      alert('خطا در حذف دسر')
    } finally {
      setLoading(false)
    }
  }

  const openAddForm = () => {
    setEditingDessert(null)
    resetForm()
    setShowForm(true)
  }

  const openEditForm = (dessert: Dessert) => {
    setEditingDessert(dessert)
    setFormData({
      name: dessert.name,
      description: dessert.description,
      price: dessert.price,
      image: dessert.image,
      preparationTime: dessert.preparationTime,
      ingredients: dessert.ingredients.join(', '),
      category: dessert.category,
      isAvailable: dessert.isAvailable,
      calories: dessert.calories,
      allergens: dessert.allergens.join(', '),
      sweetness: dessert.sweetness
    })
    setShowForm(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: 0,
      image: '',
      preparationTime: 0,
      ingredients: '',
      category: '',
      isAvailable: true,
      calories: 0,
      allergens: '',
      sweetness: 'متوسط'
    })
  }

  const getTotalDesserts = () => desserts.length
  const getAvailableDesserts = () => desserts.filter(dessert => dessert.isAvailable).length
  const getAveragePrice = () => {
    const total = desserts.reduce((sum, dessert) => sum + dessert.price, 0)
    return Math.round(total / desserts.length)
  }
  const getAverageRating = () => {
    const total = desserts.reduce((sum, dessert) => sum + dessert.rating, 0)
    return (total / desserts.length).toFixed(1)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/80 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold gradient-text mb-2">دسرها</h1>
          <p className="text-gray-600 dark:text-gray-300">مدیریت دسرهای رستوران</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="premium-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">کل دسرها</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{getTotalDesserts()}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <Star className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
          <div className="premium-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">موجود</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{getAvailableDesserts()}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
          <div className="premium-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">میانگین قیمت</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{getAveragePrice().toLocaleString('fa-IR')}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>
          <div className="premium-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">میانگین امتیاز</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{getAverageRating()}</p>
              </div>
              <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/30 rounded-lg flex items-center justify-center">
                <Star className="w-6 h-6 text-pink-600 dark:text-pink-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="premium-card p-6 mb-8">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="جستجو در دسرها..."
                  className="w-64 pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'همه دسته‌ها' : category}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={openAddForm}
              className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>افزودن دسر</span>
            </button>
          </div>
        </div>

        {/* Desserts Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">در حال بارگذاری دسرها...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDesserts.map(dessert => (
              <div key={dessert._id} className="premium-card p-6">
                <div className="relative mb-4">
                  <img src={dessert.image} alt={dessert.name} className="w-full h-48 object-cover rounded-lg" />
                  <div className="absolute top-2 right-2 flex space-x-1 space-x-reverse">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      dessert.isAvailable 
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                    }`}>
                      {dessert.isAvailable ? 'موجود' : 'ناموجود'}
                    </span>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                      {dessert.category}
                    </span>
                  </div>
                </div>

                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{dessert.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">{dessert.description}</p>
                  
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">{dessert.rating}</span>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">{dessert.preparationTime} دقیقه</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Package className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">{dessert.calories} کالری</span>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        dessert.sweetness === 'کم' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                        dessert.sweetness === 'متوسط' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' :
                        'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                      }`}>
                        شیرینی: {dessert.sweetness}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-primary-600 dark:text-primary-400">
                      {dessert.price.toLocaleString('fa-IR')} تومان
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setShowDetails(dessert)}
                    className="flex items-center space-x-1 space-x-reverse px-3 py-2 text-primary-600 hover:text-primary-700 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    <span>جزئیات</span>
                  </button>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <button
                      onClick={() => openEditForm(dessert)}
                      className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteDessert(dessert._id!)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add/Edit Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {editingDessert ? 'ویرایش دسر' : 'افزودن دسر جدید'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    نام دسر
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
                    دسته‌بندی
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">انتخاب دسته‌بندی</option>
                    <option value="بستنی">بستنی</option>
                    <option value="شیرینی">شیرینی</option>
                    <option value="کیک">کیک</option>
                    <option value="پودینگ">پودینگ</option>
                    <option value="ترافل">ترافل</option>
                    <option value="ماکارون">ماکارون</option>
                  </select>
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
                    میزان شیرینی
                  </label>
                  <select
                    value={formData.sweetness}
                    onChange={(e) => setFormData({...formData, sweetness: e.target.value as 'کم' | 'متوسط' | 'زیاد'})}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="کم">کم</option>
                    <option value="متوسط">متوسط</option>
                    <option value="زیاد">زیاد</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    وضعیت
                  </label>
                  <select
                    value={formData.isAvailable ? 'available' : 'unavailable'}
                    onChange={(e) => setFormData({...formData, isAvailable: e.target.value === 'available'})}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="available">موجود</option>
                    <option value="unavailable">ناموجود</option>
                  </select>
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
                    مواد اولیه (جدا شده با کاما)
                  </label>
                  <textarea
                    value={formData.ingredients}
                    onChange={(e) => setFormData({...formData, ingredients: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    آلرژن‌ها (جدا شده با کاما)
                  </label>
                  <textarea
                    value={formData.allergens}
                    onChange={(e) => setFormData({...formData, allergens: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex items-center justify-end space-x-3 space-x-reverse mt-6">
                <button
                  onClick={() => {
                    setShowForm(false)
                    setEditingDessert(null)
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

        {/* Details Modal */}
        {showDetails && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  جزئیات {showDetails.name}
                </h3>
                <button
                  onClick={() => setShowDetails(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <img src={showDetails.image} alt={showDetails.name} className="w-full h-48 object-cover rounded-lg" />
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">قیمت</label>
                    <p className="text-gray-900 dark:text-white">{showDetails.price.toLocaleString('fa-IR')} تومان</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">زمان آماده‌سازی</label>
                    <p className="text-gray-900 dark:text-white">{showDetails.preparationTime} دقیقه</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">امتیاز</label>
                    <p className="text-gray-900 dark:text-white">{showDetails.rating}/5</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">محبوبیت</label>
                    <p className="text-gray-900 dark:text-white">{showDetails.popularity}%</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">کالری</label>
                    <p className="text-gray-900 dark:text-white">{showDetails.calories} کالری</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">میزان شیرینی</label>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      showDetails.sweetness === 'کم' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                      showDetails.sweetness === 'متوسط' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' :
                      'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                    }`}>
                      {showDetails.sweetness}
                    </span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">توضیحات</label>
                  <p className="text-gray-900 dark:text-white">{showDetails.description}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">مواد اولیه</label>
                  <div className="flex flex-wrap gap-2">
                    {showDetails.ingredients.map((ingredient, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm">
                        {ingredient}
                      </span>
                    ))}
                  </div>
                </div>
                
                {showDetails.allergens.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">آلرژن‌ها</label>
                    <div className="flex flex-wrap gap-2">
                      {showDetails.allergens.map((allergen, index) => (
                        <span key={index} className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-sm">
                          {allergen}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}