'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { 
  Package, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  BarChart3,
  Download,
  RefreshCw,
  Eye,
  Edit,
  Plus,
  Trash2,
  X,
  FileText,
  Activity,
  Settings
} from 'lucide-react'
import PieChart from '@/components/Charts/PieChart'
import BarChart from '@/components/Charts/BarChart'

interface InventoryItem {
  id: string
  _id?: string
  name: string
  category: string
  currentStock: number
  minStock: number
  maxStock: number
  unitPrice: number
  totalValue: number
  lastUpdated: string
  supplier: string
  expiryDate?: string | null
  isLowStock: boolean
  isExpiring: boolean
  monthlyUsage: number
  turnoverRate: number
  unit?: string
}

interface SummaryData {
  totalItems: number
  totalValue: number
  lowStockItems: number
  expiringItems: number
  averageTurnover: number
  categoryData: Array<{
    category: string
    count: number
    value: number
    percentage: number
  }>
  topItems: Array<{
    id: string
    name: string
    category: string
    monthlyUsage: number
    turnoverRate: number
    currentStock: number
  }>
  slowMovingItems: number
}

export default function InventoryReportPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [sortBy, setSortBy] = useState('name')
  const [searchTerm, setSearchTerm] = useState('')
  const [showItemModal, setShowItemModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    unit: 'عدد',
    currentStock: 0,
    minStock: 0,
    maxStock: 0,
    unitPrice: 0,
    expiryDate: '',
    supplier: ''
  })
  const [categories, setCategories] = useState<string[]>([])

  // Fetch summary data
  const fetchSummary = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (filterCategory !== 'all') {
        params.append('category', filterCategory)
      }

      const response = await fetch(`/api/inventory-reports/summary?${params}`)
      const result = await response.json()
      
      if (result.success) {
        setSummaryData(result.data)
      }
    } catch (error) {
      console.error('Error fetching summary:', error)
    }
  }, [filterCategory])

  // Fetch inventory items
  const fetchInventory = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filterCategory !== 'all') {
        params.append('category', filterCategory)
      }
      if (filterStatus !== 'all') {
        params.append('status', filterStatus)
      }
      if (sortBy) {
        params.append('sortBy', sortBy)
      }
      if (searchTerm) {
        params.append('search', searchTerm)
      }

      const response = await fetch(`/api/inventory-reports/items?${params}`)
      const result = await response.json()
      
      if (result.success) {
        setInventory(result.data || [])
      }

      // Extract unique categories
      const uniqueCategories = Array.from(new Set((result.data || []).map((item: InventoryItem) => item.category).filter(Boolean))) as string[]
      setCategories(['all', ...uniqueCategories])
    } catch (error) {
      console.error('Error fetching inventory:', error)
      alert('خطا در دریافت اطلاعات موجودی')
    } finally {
      setLoading(false)
    }
  }, [filterCategory, filterStatus, sortBy, searchTerm])

  useEffect(() => {
    fetchSummary()
    fetchInventory()
  }, [fetchSummary, fetchInventory])

  // Filtered and sorted inventory
  const filteredInventory = useMemo(() => {
    return [...inventory].sort((a, b) => {
      switch (sortBy) {
        case 'name': return a.name.localeCompare(b.name)
        case 'stock': return a.currentStock - b.currentStock
        case 'value': return b.totalValue - a.totalValue
        case 'usage': return b.monthlyUsage - a.monthlyUsage
        case 'turnover': return b.turnoverRate - a.turnoverRate
        default: return 0
      }
    })
  }, [inventory, sortBy])

  // Stats from summary data
  const stats = useMemo(() => {
    if (summaryData) {
      return {
        totalItems: summaryData.totalItems,
        totalValue: summaryData.totalValue,
        lowStockItems: summaryData.lowStockItems,
        expiringItems: summaryData.expiringItems,
        averageTurnover: summaryData.averageTurnover
      }
    }
    return {
      totalItems: inventory.length,
      totalValue: inventory.reduce((sum, item) => sum + item.totalValue, 0),
      lowStockItems: inventory.filter(item => item.isLowStock).length,
      expiringItems: inventory.filter(item => item.isExpiring).length,
      averageTurnover: inventory.length > 0 
        ? inventory.reduce((sum, item) => sum + (item.turnoverRate || 0), 0) / inventory.length 
        : 0
    }
  }, [summaryData, inventory])

  // Chart data
  const pieChartData = useMemo(() => {
    if (!summaryData?.categoryData || summaryData.categoryData.length === 0) {
      return []
    }
    
    const colors = ['#22C55E', '#6366F1', '#A855F7', '#F97316', '#10B981', '#3B82F6', '#8B5CF6', '#EF4444', '#06B6D4']
    const sortedData = [...summaryData.categoryData].sort((a, b) => b.value - a.value)
    return sortedData.slice(0, 7).map((cat, index) => ({
      name: cat.category,
      value: cat.percentage,
      color: colors[index % colors.length]
    }))
  }, [summaryData])
  
  // Total categories for center label
  const totalCategories = useMemo(() => {
    return summaryData?.categoryData?.length || 0
  }, [summaryData])

  const barChartData = useMemo(() => {
    if (!summaryData?.categoryData || summaryData.categoryData.length === 0) {
      return []
    }
    
    return [{
      period: 'ارزش موجودی',
      revenue: summaryData.categoryData.reduce((sum, cat) => sum + cat.value, 0),
      ...Object.fromEntries(
        summaryData.categoryData.slice(0, 5).map(cat => [cat.category, cat.value])
      )
    }]
  }, [summaryData])

  // Handlers
  const handleViewItem = useCallback((item: InventoryItem) => {
    setSelectedItem(item)
    setShowItemModal(true)
  }, [])

  const handleEditItem = useCallback((item: InventoryItem) => {
    setSelectedItem(item)
    setFormData({
      name: item.name,
      category: item.category,
      unit: item.unit || 'عدد',
      currentStock: item.currentStock,
      minStock: item.minStock,
      maxStock: item.maxStock,
      unitPrice: item.unitPrice,
      expiryDate: item.expiryDate ? item.expiryDate.split('T')[0] : '',
      supplier: item.supplier
    })
    setShowEditModal(true)
  }, [])

  const handleDeleteItem = useCallback(async (item: InventoryItem) => {
    if (!confirm(`آیا از حذف "${item.name}" اطمینان دارید؟`)) {
      return
    }

    try {
      const itemId = item._id || item.id
      const response = await fetch(`/api/inventory-items?id=${itemId}`, {
        method: 'DELETE'
      })
      
      const result = await response.json()
      
      if (result.success) {
        alert('آیتم با موفقیت حذف شد')
        fetchInventory()
        fetchSummary()
      } else {
        alert(result.message || 'خطا در حذف آیتم')
      }
    } catch (error) {
      console.error('Error deleting item:', error)
      alert('خطا در حذف آیتم')
    }
  }, [fetchInventory, fetchSummary])

  const handleCreateItem = useCallback(() => {
    setFormData({
      name: '',
      category: '',
      unit: 'عدد',
      currentStock: 0,
      minStock: 0,
      maxStock: 0,
      unitPrice: 0,
      expiryDate: '',
      supplier: ''
    })
    setShowCreateModal(true)
  }, [])

  const handleSaveItem = useCallback(async () => {
    try {
      const url = selectedItem 
        ? `/api/inventory-items`
        : `/api/inventory-items`
      
      const method = selectedItem ? 'PUT' : 'POST'
      
      const body = selectedItem
        ? {
            id: selectedItem._id || selectedItem.id,
            ...formData
          }
        : formData

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      })

      const result = await response.json()

      if (result.success) {
        alert(selectedItem ? 'آیتم با موفقیت به‌روزرسانی شد' : 'آیتم با موفقیت ایجاد شد')
        setShowEditModal(false)
        setShowCreateModal(false)
        setSelectedItem(null)
        fetchInventory()
        fetchSummary()
      } else {
        alert(result.message || 'خطا در ذخیره آیتم')
      }
    } catch (error) {
      console.error('Error saving item:', error)
      alert('خطا در ذخیره آیتم')
    }
  }, [selectedItem, formData, fetchInventory, fetchSummary])

  const handleRefresh = useCallback(() => {
    fetchSummary()
    fetchInventory()
  }, [fetchSummary, fetchInventory])

  const handleExport = useCallback(() => {
    alert('قابلیت دانلود گزارش در حال توسعه است')
  }, [])

  const topItems = useMemo(() => {
    return summaryData?.topItems || inventory
      .sort((a, b) => (b.monthlyUsage || b.turnoverRate) - (a.monthlyUsage || a.turnoverRate))
      .slice(0, 5)
  }, [summaryData, inventory])

  const slowMovingItems = useMemo(() => {
    return summaryData?.slowMovingItems || inventory.filter(item => (item.turnoverRate || 0) < 1.0 && (item.turnoverRate || 0) > 0).length
  }, [summaryData, inventory])

  if (loading && inventory.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/80 dark:to-gray-900 p-6 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">در حال بارگذاری...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/80 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold gradient-text mb-2">گزارش موجودی</h1>
          <p className="text-gray-600 dark:text-gray-300">تحلیل و بررسی وضعیت موجودی انبار</p>
        </div>

        {/* Filters */}
        <div className="premium-card p-6 mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-4 space-x-reverse flex-wrap gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  دسته‌بندی
                </label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category === 'all' ? 'همه دسته‌ها' : category}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  وضعیت
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="all">همه وضعیت‌ها</option>
                  <option value="normal">عادی</option>
                  <option value="low-stock">موجودی کم</option>
                  <option value="expiring">در حال انقضا</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  مرتب‌سازی
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="name">نام</option>
                  <option value="stock">موجودی</option>
                  <option value="value">ارزش</option>
                  <option value="usage">مصرف ماهانه</option>
                  <option value="turnover">نرخ گردش</option>
                </select>
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  جستجو
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="جستجوی نام، دسته‌بندی یا تامین‌کننده..."
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <button
                onClick={handleCreateItem}
                className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>افزودن آیتم</span>
              </button>
              <button
                onClick={handleExport}
                className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>دانلود گزارش</span>
              </button>
              <button
                onClick={handleRefresh}
                className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>بروزرسانی</span>
              </button>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="premium-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">کل آیتم‌ها</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalItems}</p>
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
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.lowStockItems}</p>
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
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.expiringItems}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>
          <div className="premium-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">میانگین گردش</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.averageTurnover.toFixed(1)}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Category Distribution */}
          <div className="premium-card p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              توزیع بر اساس دسته‌بندی
            </h3>
            <div className="h-64 w-full">
              {pieChartData.length > 0 ? (
                <PieChart 
                  data={pieChartData}
                  title="توزیع دسته‌بندی"
                  centerLabel="کل دسته‌ها"
                  centerValue={`${totalCategories} دسته`}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  <p>داده‌ای برای نمایش وجود ندارد</p>
                </div>
              )}
            </div>
          </div>

          {/* Value Distribution */}
          <div className="premium-card p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              توزیع ارزش موجودی
            </h3>
            <div className="h-64 w-full">
              {barChartData.length > 0 && summaryData?.categoryData ? (
                <BarChart
                  data={barChartData}
                  categories={summaryData.categoryData.slice(0, 5).map(cat => cat.category)}
                  colors={['#22C55E', '#6366F1', '#A855F7', '#F97316', '#10B981']}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  <p>داده‌ای برای نمایش وجود ندارد</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Top Selling Items */}
        <div className="premium-card p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            پرفروش‌ترین آیتم‌ها
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {topItems.map((item, index) => (
              <div key={item.id} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    #{index + 1}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {item.monthlyUsage || 0} واحد
                  </span>
                </div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-1">{item.name}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">{item.category}</p>
                <div className="mt-2">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full"
                      style={{ 
                        width: `${topItems.length > 0 && Math.max(...topItems.map(i => i.monthlyUsage || 0)) > 0
                          ? ((item.monthlyUsage || 0) / Math.max(...topItems.map(i => i.monthlyUsage || 0))) * 100
                          : 0}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
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
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">ارزش</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">مصرف ماهانه</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">نرخ گردش</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">وضعیت</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventory.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-gray-500">
                      {loading ? 'در حال بارگذاری...' : 'آیتمی یافت نشد'}
                    </td>
                  </tr>
                ) : (
                  filteredInventory.map((item) => (
                    <tr key={item.id || item._id} className="border-b border-gray-100 dark:border-gray-700/30">
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{item.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{item.supplier}</p>
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
                        <span className="font-medium text-gray-900 dark:text-white">
                          {item.totalValue.toLocaleString('fa-IR')} تومان
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-gray-900 dark:text-white">{item.monthlyUsage || 0}</span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-1 space-x-reverse">
                          <span className="text-gray-900 dark:text-white">{(item.turnoverRate || 0).toFixed(1)}</span>
                          {(item.turnoverRate || 0) > 2 ? (
                            <TrendingUp className="w-4 h-4 text-green-500" />
                          ) : (item.turnoverRate || 0) < 1 ? (
                            <TrendingDown className="w-4 h-4 text-red-500" />
                          ) : null}
                        </div>
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
                          {item.isExpiring && (
                            <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-full text-xs font-medium">
                              در حال انقضا
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <button
                            onClick={() => handleViewItem(item)}
                            className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEditItem(item)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
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

        {/* Insights and Recommendations */}
        <div className="premium-card p-6 mt-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            بینش‌ها و توصیه‌ها
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center space-x-2 space-x-reverse mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h4 className="font-medium text-green-800 dark:text-green-300">نقاط قوت</h4>
              </div>
              <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                <li>• {stats.totalItems - stats.lowStockItems} آیتم با موجودی کافی</li>
                <li>• ارزش کل موجودی {stats.totalValue.toLocaleString('fa-IR')} تومان</li>
                <li>• میانگین نرخ گردش {stats.averageTurnover.toFixed(1)}</li>
              </ul>
            </div>
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <div className="flex items-center space-x-2 space-x-reverse mb-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <h4 className="font-medium text-red-800 dark:text-red-300">نیاز به توجه</h4>
              </div>
              <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                <li>• {stats.lowStockItems} آیتم با موجودی کم</li>
                <li>• {stats.expiringItems} آیتم در حال انقضا</li>
                <li>• {slowMovingItems} آیتم با گردش کند</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* View Item Modal - Modern Design */}
      {showItemModal && selectedItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-5xl mx-4 max-h-[95vh] overflow-hidden flex flex-col">
            {/* Header with Gradient */}
            <div className={`relative px-6 py-5 ${selectedItem.isLowStock ? 'bg-red-100 dark:bg-red-900/30 border-b border-red-200 dark:border-red-700' : 'bg-green-100 dark:bg-green-900/30 border-b border-green-200 dark:border-green-700'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 space-x-reverse flex-1">
                  <div className={`p-3 rounded-xl bg-white/20 dark:bg-gray-900/30 shadow-lg ${selectedItem.isLowStock ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                    <Package className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white truncate">{selectedItem.name}</h3>
                    <div className="flex items-center space-x-2 space-x-reverse mt-1">
                      <span className="px-2.5 py-1 bg-gray-500/20 dark:bg-gray-500/30 text-gray-700 dark:text-gray-300 rounded-full text-xs font-semibold">
                        {selectedItem.category}
                      </span>
                      {selectedItem.isLowStock && (
                        <span className="px-2.5 py-1 bg-red-500/20 dark:bg-red-500/30 text-red-700 dark:text-red-300 rounded-full text-xs font-semibold flex items-center space-x-1 space-x-reverse">
                          <AlertTriangle className="w-3 h-3" />
                          <span>موجودی کم</span>
                        </span>
                      )}
                      {selectedItem.isExpiring && (
                        <span className="px-2.5 py-1 bg-yellow-500/20 dark:bg-yellow-500/30 text-yellow-700 dark:text-yellow-300 rounded-full text-xs font-semibold flex items-center space-x-1 space-x-reverse">
                          <Clock className="w-3 h-3" />
                          <span>در حال انقضا</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowItemModal(false)
                    setSelectedItem(null)
                  }}
                  className="p-2 hover:bg-white/20 dark:hover:bg-gray-900/30 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Key Metrics Grid */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2 space-x-reverse">
                  <Activity className="w-5 h-5 text-primary-600" />
                  <span>وضعیت موجودی</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* موجودی فعلی */}
                  <div className="premium-card p-5 hover:shadow-lg transition-all duration-300">
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                        <Package className="w-5 h-5" />
                      </div>
                      {selectedItem.currentStock <= selectedItem.minStock && (
                        <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-[10px] font-semibold">
                          هشدار
                        </span>
                      )}
                    </div>
                    <h5 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">موجودی فعلی</h5>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {selectedItem.currentStock.toLocaleString('fa-IR')} {selectedItem.unit || 'عدد'}
                    </p>
                    <div className="mt-2 flex items-center space-x-2 space-x-reverse text-xs text-gray-500 dark:text-gray-400">
                      <span>حداقل: {selectedItem.minStock}</span>
                      <span>|</span>
                      <span>حداکثر: {selectedItem.maxStock}</span>
                    </div>
                  </div>

                  {/* ارزش کل */}
                  <div className="premium-card p-5 hover:shadow-lg transition-all duration-300">
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-green-600 text-white">
                        <DollarSign className="w-5 h-5" />
                      </div>
                    </div>
                    <h5 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">ارزش کل</h5>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {selectedItem.totalValue.toLocaleString('fa-IR')} تومان
                    </p>
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      قیمت واحد: {selectedItem.unitPrice.toLocaleString('fa-IR')} تومان
                    </div>
                  </div>

                  {/* نرخ گردش */}
                  <div className="premium-card p-5 hover:shadow-lg transition-all duration-300">
                    <div className="flex items-center justify-between mb-3">
                      <div className={`p-2 rounded-lg bg-gradient-to-br ${(selectedItem.turnoverRate || 0) > 2 ? 'from-green-500 to-green-600' : (selectedItem.turnoverRate || 0) < 1 ? 'from-red-500 to-red-600' : 'from-yellow-500 to-yellow-600'} text-white`}>
                        <TrendingUp className="w-5 h-5" />
                      </div>
                      {(selectedItem.turnoverRate || 0) > 2 && (
                        <TrendingUp className="w-4 h-4 text-green-500" />
                      )}
                      {(selectedItem.turnoverRate || 0) < 1 && (
                        <TrendingDown className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                    <h5 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">نرخ گردش</h5>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {(selectedItem.turnoverRate || 0).toFixed(1)}
                    </p>
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      مصرف ماهانه: {selectedItem.monthlyUsage || 0} واحد
                    </div>
                  </div>
                </div>
              </div>

              {/* Detailed Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="premium-card p-5">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2 space-x-reverse">
                    <FileText className="w-4 h-4 text-primary-600" />
                    <span>اطلاعات پایه</span>
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-400">دسته‌بندی:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{selectedItem.category}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-400">واحد:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{selectedItem.unit || 'عدد'}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-400">قیمت واحد:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{selectedItem.unitPrice.toLocaleString('fa-IR')} تومان</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-600 dark:text-gray-400">تامین‌کننده:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{selectedItem.supplier || '-'}</span>
                    </div>
                  </div>
                </div>

                <div className="premium-card p-5">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2 space-x-reverse">
                    <Settings className="w-4 h-4 text-primary-600" />
                    <span>تنظیمات موجودی</span>
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-400">حداقل موجودی:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{selectedItem.minStock.toLocaleString('fa-IR')}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-400">حداکثر موجودی:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{selectedItem.maxStock.toLocaleString('fa-IR')}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-400">وضعیت موجودی:</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        selectedItem.isLowStock 
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                          : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                      }`}>
                        {selectedItem.isLowStock ? 'موجودی کم' : 'کافی'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-600 dark:text-gray-400">آخرین بروزرسانی:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {selectedItem.lastUpdated ? new Date(selectedItem.lastUpdated).toLocaleDateString('fa-IR') : '-'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Expiry Information */}
              {selectedItem.expiryDate && (
                <div className="premium-card p-5 border-l-4 border-yellow-400">
                  <div className="flex items-start space-x-3 space-x-reverse">
                    <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">اطلاعات انقضا</h4>
                      <p className="text-gray-700 dark:text-gray-300">
                        تاریخ انقضا: <span className="font-medium">{selectedItem.expiryDate.split('T')[0]}</span>
                      </p>
                      {selectedItem.isExpiring && (
                        <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">
                          ⚠️ این آیتم در حال انقضا است
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Stock Status Visual */}
              <div className="premium-card p-5">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-4">وضعیت موجودی</h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600 dark:text-gray-400">حداقل</span>
                      <span className="text-gray-600 dark:text-gray-400">موجودی فعلی</span>
                      <span className="text-gray-600 dark:text-gray-400">حداکثر</span>
                    </div>
                    <div className="relative w-full h-8 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      {/* Min threshold */}
                      <div 
                        className="absolute left-0 top-0 h-full bg-red-500/30"
                        style={{ width: `${(selectedItem.minStock / selectedItem.maxStock) * 100}%` }}
                      ></div>
                      {/* Current stock */}
                      <div 
                        className={`absolute left-0 top-0 h-full transition-all duration-500 ${
                          selectedItem.isLowStock 
                            ? 'bg-red-500' 
                            : selectedItem.currentStock >= selectedItem.maxStock * 0.8
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min((selectedItem.currentStock / selectedItem.maxStock) * 100, 100)}%` }}
                      ></div>
                      {/* Current stock indicator */}
                      <div 
                        className="absolute top-0 bottom-0 w-1 bg-blue-600 shadow-lg"
                        style={{ left: `${Math.min((selectedItem.currentStock / selectedItem.maxStock) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                      <span>{selectedItem.minStock}</span>
                      <span className="font-bold text-gray-900 dark:text-white">{selectedItem.currentStock}</span>
                      <span>{selectedItem.maxStock}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer with Actions */}
            <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 bg-gray-50 dark:bg-gray-900/50">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => {
                    setShowItemModal(false)
                    setSelectedItem(null)
                  }}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                >
                  بستن
                </button>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <button
                    onClick={() => {
                      setShowItemModal(false)
                      handleEditItem(selectedItem)
                    }}
                    className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    <span>ویرایش</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowItemModal(false)
                      handleDeleteItem(selectedItem)
                    }}
                    className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>حذف</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit/Create Item Modal */}
      {(showEditModal || showCreateModal) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {showEditModal ? 'ویرایش آیتم' : 'ایجاد آیتم جدید'}
              </h3>
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setShowCreateModal(false)
                  setSelectedItem(null)
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  نام *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    دسته‌بندی *
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    واحد
                  </label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    موجودی فعلی
                  </label>
                  <input
                    type="number"
                    value={formData.currentStock}
                    onChange={(e) => setFormData({ ...formData, currentStock: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
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
                    onChange={(e) => setFormData({ ...formData, minStock: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
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
                    onChange={(e) => setFormData({ ...formData, maxStock: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    min="0"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    قیمت واحد
                  </label>
                  <input
                    type="number"
                    value={formData.unitPrice}
                    onChange={(e) => setFormData({ ...formData, unitPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
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
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  تامین‌کننده
                </label>
                <input
                  type="text"
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
              <div className="flex items-center justify-end space-x-2 space-x-reverse pt-4">
                <button
                  onClick={() => {
                    setShowEditModal(false)
                    setShowCreateModal(false)
                    setSelectedItem(null)
                  }}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  انصراف
                </button>
                <button
                  onClick={handleSaveItem}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  ذخیره
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
