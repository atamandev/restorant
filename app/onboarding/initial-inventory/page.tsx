'use client'

import { useState, useEffect, useMemo } from 'react'
import { get, post, patch, remove } from '@/lib/http'
import Drawer from '@/components/Drawer'
import Toast, { useToast } from '@/components/Toast'
import { 
  Warehouse, 
  Package, 
  DollarSign, 
  Search,
  Plus,
  Edit,
  Trash2,
  Save,
  CheckCircle,
  AlertTriangle,
  Loader2,
  X
} from 'lucide-react'

interface InventoryItem {
  id: string
  _id?: string
  name: string
  code?: string
  category: string
  unit: string
  currentStock: number
  minStock: number
  maxStock: number
  unitPrice: number
  totalValue: number
  expiryDate?: string
  supplier?: string
  warehouse?: string
  lastUpdated: string
  isLowStock: boolean
  status?: 'sufficient' | 'low' | 'warning'
  createdAt?: Date | string
  updatedAt?: Date | string
}

const categories = ['مواد اولیه', 'نوشیدنی', 'ادویه', 'سبزیجات', 'لبنیات', 'سایر']

const getStatusBadge = (status: 'sufficient' | 'low' | 'warning' | undefined, isLowStock: boolean) => {
  if (isLowStock || status === 'low') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
        کم
      </span>
    )
  }
  if (status === 'warning') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
        هشدار
      </span>
    )
  }
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
      کافی
    </span>
  )
}

interface Warehouse {
  _id: string
  id?: string
  name: string
  code: string
  status: string
}

export default function InitialInventoryPage() {
  const { toast, showToast, hideToast } = useToast()
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showDrawer, setShowDrawer] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    unit: '',
    currentStock: 0,
    minStock: 0,
    maxStock: 0,
    unitPrice: 0,
    expiryDate: '',
    supplier: '',
    warehouse: ''
  })

  // دریافت لیست انبارها
  const fetchWarehouses = async () => {
    try {
      const response = await get('/api/warehouses?status=active&limit=100')
      console.log('Warehouses API Response:', response) // برای دیباگ
      if (response.success && response.data) {
        // از API warehouses، response.data مستقیماً array است
        const warehousesList = Array.isArray(response.data) ? response.data : []
        console.log('Warehouses loaded:', warehousesList.length) // برای دیباگ
        setWarehouses(warehousesList)
        
        // پیدا کردن انبار "تایماز" یا اولین انبار
        const taymazWarehouse = warehousesList.find((w: Warehouse) => 
          w.name === 'تایماز' || w.name.toLowerCase().includes('taymaz')
        )
        const defaultWarehouse = taymazWarehouse || warehousesList[0]
        
        console.log('Taymaz warehouse found:', taymazWarehouse?.name)
        console.log('Default warehouse:', defaultWarehouse?.name)
        console.log('Current formData.warehouse:', formData.warehouse)
        
        // اگر انباری وجود دارد و warehouse در formData خالی است، "تایماز" را انتخاب کن
        if (defaultWarehouse) {
          const warehouseName = defaultWarehouse.name
          if (!formData.warehouse || formData.warehouse === '') {
            console.log('Setting default warehouse to:', warehouseName)
            setFormData(prev => ({ ...prev, warehouse: warehouseName }))
          }
        }
      } else {
        console.error('Failed to fetch warehouses:', response)
      }
    } catch (error) {
      console.error('Error fetching warehouses:', error)
    }
  }

  // دریافت لیست کالاها
  const fetchItems = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.append('limit', '10000') // دریافت همه داده‌ها
      if (searchTerm) params.append('search', searchTerm)
      if (filterCategory !== 'all') params.append('category', filterCategory)
      if (filterStatus !== 'all') params.append('status', filterStatus)
      
      const response = await get<{ data: InventoryItem[]; pagination: any }>(`/api/warehouse/items?${params.toString()}`)
      
      console.log('API Response:', response) // برای دیباگ
      
      if (response.success) {
        // response.data مستقیماً array است (از API route)
        const items = Array.isArray(response.data) ? response.data : []
        console.log('Items found:', items.length) // برای دیباگ
        setInventory(items)
      } else {
        showToast(response.message || 'خطا در دریافت لیست کالاها', 'error')
      }
    } catch (error) {
      console.error('Error fetching items:', error)
      showToast('خطا در اتصال به سرور', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWarehouses()
    fetchItems()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, filterCategory, filterStatus])

  // Auto-refresh برای به‌روزرسانی real-time موجودی
  useEffect(() => {
    // Refresh هر 5 ثانیه
    const interval = setInterval(() => {
      fetchItems()
    }, 5000) // 5 ثانیه

    // Cleanup interval وقتی component unmount می‌شود
    return () => clearInterval(interval)
  }, []) // فقط یکبار اجرا می‌شود

  // فیلتر و مرتب‌سازی داده‌ها
  const filteredItems = useMemo(() => {
    return [...inventory].sort((a, b) => a.name.localeCompare(b.name))
  }, [inventory])

  // ذخیره کالا
  const handleSave = async () => {
    // اطمینان از اینکه warehouse انتخاب شده است
    let finalWarehouse = formData.warehouse && formData.warehouse.trim() 
      ? formData.warehouse.trim() 
      : (warehouses.find(w => w.name === 'تایماز' || w.name.toLowerCase().includes('taymaz'))?.name || 'تایماز')
    
    // اگر warehouse شامل "تایماز" است، فقط "تایماز" را نگه دار (برای حذف کد انبار مثل "تایماز (WH-001)")
    if (finalWarehouse && finalWarehouse.includes('تایماز')) {
      finalWarehouse = 'تایماز'
    }
    
    // اگر warehouse خالی است، به "تایماز" تنظیم کن
    if (!finalWarehouse || finalWarehouse === '') {
      finalWarehouse = 'تایماز'
    }
    
    if (!formData.name.trim() || !formData.category.trim() || !formData.unit.trim()) {
      showToast('نام، دسته‌بندی و واحد اجباری است', 'warning')
      return
    }

    try {
      setSaving(true)
      
      // آماده‌سازی داده‌ها با warehouse نهایی
      const submitData = {
        ...formData,
        warehouse: finalWarehouse
      }
      
      console.log('=== Saving item ===')
      console.log('Form data warehouse:', formData.warehouse)
      console.log('Final warehouse:', finalWarehouse)
      console.log('All warehouses:', warehouses.map(w => w.name))
      console.log('Submit data:', JSON.stringify(submitData, null, 2))
      
      if (editingItem) {
        // ویرایش
        const response = await patch<{ data: InventoryItem }>(
          `/api/warehouse/items/${editingItem.id}`,
          submitData
        )
        
        console.log('Update API response:', response)
        
        if (response.success) {
          showToast('کالا با موفقیت به‌روزرسانی شد', 'success')
          setShowDrawer(false)
          resetForm()
          await fetchItems()
        } else {
          showToast(response.message || 'خطا در به‌روزرسانی کالا', 'error')
        }
      } else {
        // ایجاد جدید
        const response = await post<{ data: InventoryItem }>(
          '/api/warehouse/items',
          submitData
        )
        
        console.log('Create API response:', response)
        console.log('Created item warehouse:', (response.data as any)?.warehouse)
        
        if (response.success) {
          showToast('کالا با موفقیت ایجاد شد', 'success')
          setShowDrawer(false)
          resetForm()
          await fetchItems()
        } else {
          showToast(response.message || 'خطا در ایجاد کالا', 'error')
        }
      }
    } catch (error) {
      console.error('Error saving item:', error)
      showToast('خطا در ذخیره کالا', 'error')
    } finally {
      setSaving(false)
    }
  }

  // ویرایش کالا
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
      supplier: item.supplier || '',
      warehouse: item.warehouse || (warehouses.length > 0 ? warehouses[0].name : '')
    })
    setEditingItem(item)
    setShowDrawer(true)
  }

  // حذف کالا
  const handleDelete = async (id: string) => {
    if (!confirm('آیا مطمئن هستید که می‌خواهید این کالا را حذف کنید؟')) return

    try {
      setSaving(true)
      const response = await remove(`/api/warehouse/items/${id}`)
      
      if (response.success) {
        showToast('کالا با موفقیت حذف شد', 'success')
        await fetchItems()
      } else {
        showToast(response.message || 'خطا در حذف کالا', 'error')
      }
    } catch (error) {
      console.error('Error deleting item:', error)
      showToast('خطا در حذف کالا', 'error')
    } finally {
      setSaving(false)
    }
  }

  const resetForm = () => {
    // پیدا کردن انبار "تایماز" یا اولین انبار
    const taymazWarehouse = warehouses.find(w => 
      w.name === 'تایماز' || w.name.toLowerCase().includes('taymaz')
    )
    const defaultWarehouse = taymazWarehouse || warehouses[0]
    const warehouseName = defaultWarehouse ? defaultWarehouse.name : 'تایماز'
    
    console.log('Resetting form with warehouse:', warehouseName)
    console.log('Available warehouses:', warehouses.map(w => w.name))
    
    setFormData({
      name: '',
      category: '',
      unit: '',
      currentStock: 0,
      minStock: 0,
      maxStock: 0,
      unitPrice: 0,
      expiryDate: '',
      supplier: '',
      warehouse: warehouseName
    })
    setEditingItem(null)
  }

  const handleAddNew = () => {
    resetForm()
    setShowDrawer(true)
  }

  const handleCloseDrawer = () => {
    setShowDrawer(false)
    resetForm()
  }

  // این useEffect حذف شد چون دیگر نیازی به به‌روزرسانی خودکار همه کالاها به "تایماز" نیست
  // کالاها هنگام ایجاد با warehouse درست ذخیره می‌شوند

  // محاسبه آمار
  const stats = useMemo(() => {
    const totalValue = inventory.reduce((sum, item) => sum + (item.totalValue || 0), 0)
    const lowStockCount = inventory.filter(item => item.isLowStock || item.status === 'low').length
    const warningCount = inventory.filter(item => item.status === 'warning').length
    const sufficientCount = inventory.filter(item => item.status === 'sufficient').length
    
    return {
      total: inventory.length,
      totalValue,
      lowStock: lowStockCount,
      warning: warningCount,
      sufficient: sufficientCount
    }
  }, [inventory])

  if (loading && inventory.length === 0) {
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
    <div className="fade-in-animation">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold gradient-text mb-2">موجودی اولیه</h1>
        <p className="text-gray-600 dark:text-gray-300">مدیریت موجودی کالاهای انبار</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="premium-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">کل کالاها</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
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
                {stats.totalValue.toLocaleString('fa-IR')} تومان
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
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.lowStock}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </div>
        <div className="premium-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">وضعیت هشدار</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.warning}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="premium-card p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1 flex items-center gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="جستجو در نام، کد، دسته‌بندی..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10 pl-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            
            {/* Category Filter */}
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">همه دسته‌ها</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            
            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">همه وضعیت‌ها</option>
              <option value="sufficient">کافی</option>
              <option value="warning">هشدار</option>
              <option value="low">کم</option>
            </select>
          </div>
          
          {/* Add Button */}
          <button
            onClick={handleAddNew}
            className="premium-button flex items-center space-x-2 space-x-reverse whitespace-nowrap"
          >
            <Plus className="w-5 h-5" />
            <span>افزودن کالا</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="premium-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full" dir="rtl">
            <thead className="bg-gray-50 dark:bg-gray-800/50 sticky top-0 z-10">
              <tr>
                <th className="text-right py-4 px-6 text-sm font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                  نام کالا
                </th>
                <th className="text-right py-4 px-6 text-sm font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                  کد
                </th>
                <th className="text-right py-4 px-6 text-sm font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                  دسته‌بندی
                </th>
                <th className="text-right py-4 px-6 text-sm font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                  موجودی
                </th>
                <th className="text-right py-4 px-6 text-sm font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                  قیمت واحد
                </th>
                <th className="text-right py-4 px-6 text-sm font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                  ارزش کل
                </th>
                <th className="text-right py-4 px-6 text-sm font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                  وضعیت
                </th>
                <th className="text-right py-4 px-6 text-sm font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                  عملیات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12">
                    <Package className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-2">
                      هیچ کالایی یافت نشد
                    </h3>
                    <p className="text-sm text-gray-400 dark:text-gray-500">
                      {searchTerm || filterCategory !== 'all' || filterStatus !== 'all'
                        ? 'لطفاً فیلترها را تغییر دهید'
                        : 'برای شروع، کالای جدید اضافه کنید'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, index) => (
                  <tr
                    key={item.id || item._id}
                    className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                      index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50/50 dark:bg-gray-800/50'
                    }`}
                  >
                    <td className="py-4 px-6">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{item.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{item.unit}</p>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {item.code || '-'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-sm">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div>
                        <span className="text-gray-900 dark:text-white font-medium">
                          {item.currentStock.toLocaleString('fa-IR')}
                        </span>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          حداقل: {item.minStock} | حداکثر: {item.maxStock}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-gray-900 dark:text-white">
                        {item.unitPrice.toLocaleString('fa-IR')} تومان
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {item.totalValue.toLocaleString('fa-IR')} تومان
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      {getStatusBadge(item.status, item.isLowStock)}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <button
                          onClick={() => handleEdit(item)}
                          disabled={saving}
                          className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors disabled:opacity-50"
                          title="ویرایش"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id || item._id || '')}
                          disabled={saving}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50"
                          title="حذف"
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

      {/* Drawer for Add/Edit */}
      <Drawer
        isOpen={showDrawer}
        onClose={handleCloseDrawer}
        title={editingItem ? 'ویرایش کالا' : 'افزودن کالا جدید'}
        size="lg"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                نام کالا *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="نام کالا را وارد کنید"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                دسته‌بندی *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                انبار *
              </label>
              <select
                value={formData.warehouse || ''}
                onChange={(e) => {
                  const selectedWarehouse = e.target.value
                  console.log('Warehouse selected:', selectedWarehouse)
                  setFormData({...formData, warehouse: selectedWarehouse})
                }}
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              >
                <option value="">انتخاب انبار</option>
                {warehouses.length > 0 ? (
                  warehouses.map(warehouse => (
                    <option key={warehouse._id || warehouse.id} value={warehouse.name}>
                      {warehouse.name} {warehouse.code ? `(${warehouse.code})` : ''}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>در حال بارگذاری انبارها...</option>
                )}
              </select>
              {formData.warehouse && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  انبار انتخاب شده: {formData.warehouse}
                </p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                موجودی فعلی
              </label>
              <input
                type="number"
                value={formData.currentStock}
                onChange={(e) => setFormData({...formData, currentStock: Number(e.target.value)})}
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                min="0"
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
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                min="0"
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
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                min="0"
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
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                min="0"
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
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                تامین‌کننده
              </label>
              <input
                type="text"
                value={formData.supplier}
                onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="نام تامین‌کننده"
              />
            </div>
          </div>
          
          <div className="flex items-center justify-end space-x-3 space-x-reverse pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleCloseDrawer}
              className="px-6 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              انصراف
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="premium-button flex items-center space-x-2 space-x-reverse disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>در حال ذخیره...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>ذخیره</span>
                </>
              )}
            </button>
          </div>
        </div>
      </Drawer>

      {/* Toast */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
    </div>
  )
}
