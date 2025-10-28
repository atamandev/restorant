'use client'

import { useState, useEffect } from 'react'
import { 
  Warehouse, 
  Package, 
  DollarSign, 
  Calendar, 
  AlertTriangle,
  Plus,
  Edit,
  Trash2,
  Save,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Loader2,
  AlertCircle,
  X
} from 'lucide-react'

interface InventoryItem {
  _id?: string
  id?: string
  name: string
  category: string
  unit: string
  currentStock: number
  minStock: number
  maxStock: number
  unitPrice: number
  totalValue: number
  expiryDate?: string
  supplier?: string
  lastUpdated: string
  isLowStock: boolean
  createdAt?: Date | string
  updatedAt?: Date | string
}

const categories = ['مواد اولیه', 'نوشیدنی', 'ادویه', 'سبزیجات', 'لبنیات', 'سایر']

export default function InitialInventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [filterCategory, setFilterCategory] = useState('all')
  const [sortBy, setSortBy] = useState('name')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    unit: '',
    currentStock: 0,
    minStock: 0,
    maxStock: 0,
    unitPrice: 0,
    expiryDate: '',
    supplier: ''
  })

  // دریافت لیست آیتم‌های موجودی
  const fetchInventoryItems = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/inventory-items')
      const data = await response.json()
      
      if (data.success) {
        setInventory(data.data)
      } else {
        setError(data.message || 'خطا در دریافت لیست آیتم‌های موجودی')
      }
    } catch (error) {
      console.error('Error fetching inventory items:', error)
      setError('خطا در اتصال به سرور')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInventoryItems()
  }, [])

  const filteredInventory = inventory.filter(item => 
    filterCategory === 'all' || item.category === filterCategory
  ).sort((a, b) => {
    switch (sortBy) {
      case 'name': return a.name.localeCompare(b.name)
      case 'stock': return a.currentStock - b.currentStock
      case 'value': return b.totalValue - a.totalValue
      case 'expiry': return new Date(a.expiryDate || '').getTime() - new Date(b.expiryDate || '').getTime()
      default: return 0
    }
  })

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.category.trim() || !formData.unit.trim()) {
      setError('نام، دسته‌بندی و واحد اجباری است')
      return
    }

    try {
      setSaving(true)
      setError('')

      const url = '/api/inventory-items'
      const method = editingItem ? 'PUT' : 'POST'
      
      const requestBody = editingItem 
        ? { 
            id: editingItem._id || editingItem.id, 
            ...formData
          }
        : formData

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
        await fetchInventoryItems() // دریافت مجدد لیست
        resetForm()
      } else {
        setError(data.message || 'خطا در ذخیره آیتم موجودی')
      }
    } catch (error) {
      console.error('Error saving inventory item:', error)
      setError('خطا در اتصال به سرور')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (item: InventoryItem) => {
    setFormData({
      name: item.name,
      category: item.category,
      unit: item.unit,
      currentStock: item.currentStock,
      minStock: item.minStock,
      maxStock: item.maxStock,
      unitPrice: item.unitPrice,
      expiryDate: item.expiryDate || '',
      supplier: item.supplier || ''
    })
    setEditingItem(item)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('آیا مطمئن هستید که می‌خواهید این آیتم را حذف کنید؟')) return

    try {
      setSaving(true)
      const response = await fetch(`/api/inventory-items?id=${id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        await fetchInventoryItems() // دریافت مجدد لیست
      } else {
        setError(data.message || 'خطا در حذف آیتم موجودی')
      }
    } catch (error) {
      console.error('Error deleting inventory item:', error)
      setError('خطا در اتصال به سرور')
    } finally {
      setSaving(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      unit: '',
      currentStock: 0,
      minStock: 0,
      maxStock: 0,
      unitPrice: 0,
      expiryDate: '',
      supplier: ''
    })
    setShowForm(false)
    setEditingItem(null)
    setError('')
  }

  const getTotalValue = () => {
    return inventory.reduce((sum, item) => sum + item.totalValue, 0)
  }

  const getLowStockItems = () => {
    return inventory.filter(item => item.isLowStock).length
  }

  const getExpiringItems = () => {
    const today = new Date()
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
    return inventory.filter(item => {
      if (!item.expiryDate) return false
      const expiryDate = new Date(item.expiryDate)
      return expiryDate <= nextWeek
    }).length
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
        <h1 className="text-3xl font-bold gradient-text mb-2">موجودی اولیه</h1>
        <p className="text-gray-600 dark:text-gray-300">ثبت موجودی اولیه مواد اولیه و کالاها</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
          <div className="flex items-center space-x-2 space-x-reverse">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <span className="text-red-700 dark:text-red-300">{error}</span>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="premium-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">کل آیتم‌ها</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{inventory.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>
        <div className="premium-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">ارزش کل</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {getTotalValue().toLocaleString('fa-IR')} تومان
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>
        <div className="premium-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">موجودی کم</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{getLowStockItems()}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </div>
        <div className="premium-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">در حال انقضا</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{getExpiringItems()}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="premium-card p-6 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 space-x-reverse">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                دسته‌بندی
              </label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">همه دسته‌ها</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                مرتب‌سازی
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="name">نام</option>
                <option value="stock">موجودی</option>
                <option value="value">ارزش</option>
                <option value="expiry">تاریخ انقضا</option>
              </select>
            </div>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="premium-button flex items-center space-x-2 space-x-reverse"
          >
            <Plus className="w-5 h-5" />
            <span>آیتم جدید</span>
          </button>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="premium-card p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">لیست موجودی</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-600/30">
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">نام کالا</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">دسته‌بندی</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">موجودی</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">قیمت واحد</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">ارزش کل</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">تاریخ انقضا</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">وضعیت</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12">
                    <Package className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-2">
                      هیچ آیتمی در موجودی وجود ندارد
                    </h3>
                    <p className="text-sm text-gray-400 dark:text-gray-500">
                      برای شروع، آیتم موجودی جدید اضافه کنید
                    </p>
                  </td>
                </tr>
              ) : (
                filteredInventory.map((item, index) => (
                  <tr key={item._id || item.id || index} className="border-b border-gray-100 dark:border-gray-700/30">
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{item.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{item.unit}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-sm">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <span className="text-gray-900 dark:text-white">{item.currentStock}</span>
                        {item.isLowStock && (
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        حداقل: {item.minStock} | حداکثر: {item.maxStock}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-gray-900 dark:text-white">
                        {item.unitPrice.toLocaleString('fa-IR')} تومان
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {item.totalValue.toLocaleString('fa-IR')} تومان
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-gray-900 dark:text-white">
                        {item.expiryDate || 'نامحدود'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-col space-y-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.isLowStock 
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                            : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                        }`}>
                          {item.isLowStock ? 'موجودی کم' : 'کافی'}
                        </span>
                        {item.expiryDate && new Date(item.expiryDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) && (
                          <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-full text-xs font-medium">
                            در حال انقضا
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <button
                          onClick={() => handleEdit(item)}
                          disabled={saving}
                          className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item._id || item.id || '')}
                          disabled={saving}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingItem ? 'ویرایش آیتم موجودی' : 'آیتم موجودی جدید'}
              </h3>
              <button
                onClick={resetForm}
                className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  نام کالا *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="premium-input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  دسته‌بندی *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="premium-input w-full"
                >
                  <option value="">انتخاب کنید</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  واحد *
                </label>
                <select
                  value={formData.unit}
                  onChange={(e) => setFormData({...formData, unit: e.target.value})}
                  className="premium-input w-full"
                >
                  <option value="">انتخاب کنید</option>
                  <option value="کیلوگرم">کیلوگرم</option>
                  <option value="گرم">گرم</option>
                  <option value="لیتر">لیتر</option>
                  <option value="میلی‌لیتر">میلی‌لیتر</option>
                  <option value="عدد">عدد</option>
                  <option value="قوطی">قوطی</option>
                  <option value="بسته">بسته</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  موجودی فعلی
                </label>
                <input
                  type="number"
                  value={formData.currentStock}
                  onChange={(e) => setFormData({...formData, currentStock: Number(e.target.value)})}
                  className="premium-input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  حداقل موجودی
                </label>
                <input
                  type="number"
                  value={formData.minStock}
                  onChange={(e) => setFormData({...formData, minStock: Number(e.target.value)})}
                  className="premium-input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  حداکثر موجودی
                </label>
                <input
                  type="number"
                  value={formData.maxStock}
                  onChange={(e) => setFormData({...formData, maxStock: Number(e.target.value)})}
                  className="premium-input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  قیمت واحد (تومان)
                </label>
                <input
                  type="number"
                  value={formData.unitPrice}
                  onChange={(e) => setFormData({...formData, unitPrice: Number(e.target.value)})}
                  className="premium-input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  تاریخ انقضا
                </label>
                <input
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
                  className="premium-input w-full"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  تامین‌کننده
                </label>
                <input
                  type="text"
                  value={formData.supplier}
                  onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                  className="premium-input w-full"
                />
              </div>
            </div>
            <div className="flex items-center justify-end space-x-3 space-x-reverse mt-6">
              <button
                onClick={resetForm}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              >
                انصراف
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="premium-button bg-green-500 hover:bg-green-600 flex items-center space-x-2 space-x-reverse disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                <span>ذخیره</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}