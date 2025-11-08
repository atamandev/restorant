'use client'

import { useState, useEffect, Suspense } from 'react'
import dynamic from 'next/dynamic'
import { 
  ChefHat, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Search, 
  Filter, 
  Printer, 
  Bell, 
  Star, 
  Utensils, 
  Package, 
  Users, 
  Phone, 
  MapPin, 
  Edit, 
  Eye, 
  Plus, 
  Minus,
  Trash2,
  FileText,
  Volume2
} from 'lucide-react'

// Dynamic import for FiltersSelect with no SSR to completely avoid hydration issues
const FiltersSelect = dynamic(() => import('./FiltersSelect'), {
  ssr: false,
  loading: () => (
    <>
      <div className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 h-[42px] w-[150px] animate-pulse"></div>
      <div className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 h-[42px] w-[150px] animate-pulse"></div>
    </>
  )
})

interface KitchenOrder {
  _id?: string
  orderNumber: string
  orderType: 'dine-in' | 'takeaway' | 'delivery'
  tableNumber?: string
  customerName: string
  customerPhone?: string
  deliveryAddress?: string
  items: KitchenOrderItem[]
  orderTime: string
  estimatedReadyTime: string
  status: 'pending' | 'preparing' | 'ready' | 'completed'
  priority: 'normal' | 'urgent'
  notes?: string
  specialInstructions?: string
  createdAt?: Date
  updatedAt?: Date
}

interface KitchenOrderItem {
  id: string
  name: string
  quantity: number
  category: string
  preparationTime: number
  status: 'pending' | 'preparing' | 'ready' | 'completed'
  notes?: string
  image: string
}

export default function KitchenOrdersPage() {
  const [orders, setOrders] = useState<KitchenOrder[]>([])
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedPriority, setSelectedPriority] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<KitchenOrder | null>(null)
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const loadOrders = async () => {
    try {
      setLoading(true)
      // اگر status خاصی انتخاب شده، آن را به API بفرست
      const params = new URLSearchParams()
      // اگر all انتخاب شده، همه سفارشات را بگیر (شامل completed)
      if (selectedStatus === 'all') {
        params.append('status', 'all')
      } else if (selectedStatus !== 'all') {
        params.append('status', selectedStatus)
      }
      if (selectedPriority !== 'all') {
        params.append('priority', selectedPriority)
      }
      // به صورت پیش‌فرض فقط سفارشات امروز را نمایش بده
      params.append('date', 'today')
      
      const url = `/api/kitchen-orders${params.toString() ? `?${params.toString()}` : ''}`
      const response = await fetch(url)
      const result = await response.json()
      
      if (result.success) {
        // پاکسازی آیتم‌های تکراری از هر سفارش
        const cleanedOrders = (result.data || []).map((order: KitchenOrder, orderIdx: number) => {
          if (order.items && Array.isArray(order.items)) {
            const originalLength = order.items.length
            // حذف آیتم‌های تکراری بر اساس id
            // فقط اولین آیتم با هر id نگه داشته می‌شود
            const uniqueItems = order.items.filter((item: KitchenOrderItem, index: number, self: KitchenOrderItem[]) => {
              const itemId = item.id
              if (!itemId) {
                // اگر id نداشت، همه آیتم‌های بدون id را نگه دار
                return true
              }
              // پیدا کردن اولین آیتم با این id
              const firstIndex = self.findIndex((i: KitchenOrderItem) => i.id === itemId)
              return index === firstIndex
            })
            
            return {
              ...order,
              items: uniqueItems
            }
          }
          return order
        })
        
        setOrders(cleanedOrders)
      } else {
        console.error('Error loading kitchen orders:', result.message)
        setOrders([])
      }
    } catch (error) {
      console.error('Error loading kitchen orders:', error)
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()
    // Auto-refresh every 2 minutes (بهینه شده)
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        loadOrders()
      }
    }, 120000) // 2 دقیقه - کاهش بار سرور
    
    return () => clearInterval(interval)
  }, [selectedStatus, selectedPriority])

  const filteredOrders = orders.filter(order => {
    const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus
    const matchesPriority = selectedPriority === 'all' || order.priority === selectedPriority
    const matchesSearch = searchTerm === '' || 
                         order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customerName?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesStatus && matchesPriority && matchesSearch
  })

  const updateItemStatus = async (orderId: string, itemId: string, newStatus: KitchenOrderItem['status']) => {
    try {
      const response = await fetch('/api/kitchen-orders/item-status', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          itemId,
          status: newStatus
        })
      })

      const result = await response.json()
      
      if (result.success) {
        // Reload orders to get updated data
        await loadOrders()
      } else {
        alert('خطا در به‌روزرسانی وضعیت: ' + result.message)
      }
    } catch (error) {
      console.error('Error updating item status:', error)
      alert('خطا در به‌روزرسانی وضعیت')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
      case 'preparing': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
      case 'ready': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
      case 'completed': return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'در انتظار'
      case 'preparing': return 'در حال آماده‌سازی'
      case 'ready': return 'آماده'
      case 'completed': return 'تکمیل شده'
      default: return 'نامشخص'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
      case 'normal': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
    }
  }

  const getOrderTypeColor = (type: string) => {
    switch (type) {
      case 'dine-in': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
      case 'takeaway': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
      case 'delivery': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
    }
  }

  const getOrderTypeText = (type: string) => {
    switch (type) {
      case 'dine-in': return 'حضوری'
      case 'takeaway': return 'بیرون‌بر'
      case 'delivery': return 'ارسال'
      default: return 'نامشخص'
    }
  }

  const getTotalOrders = () => orders.length
  const getPendingOrders = () => orders.filter(order => order.status === 'pending').length
  const getPreparingOrders = () => orders.filter(order => order.status === 'preparing').length
  const getReadyOrders = () => orders.filter(order => order.status === 'ready').length

  // جلوگیری از Hydration Error - فقط بعد از mount رندر کن
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/80 dark:to-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">در حال بارگذاری...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/80 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold gradient-text mb-2">سفارشات آشپزخانه</h1>
          <p className="text-gray-600 dark:text-gray-300">مدیریت و پیگیری سفارشات آشپزخانه</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="premium-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">کل سفارشات</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{getTotalOrders()}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <ChefHat className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
          <div className="premium-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">در انتظار</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{getPendingOrders()}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>
          <div className="premium-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">در حال آماده‌سازی</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{getPreparingOrders()}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                <Utensils className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </div>
          <div className="premium-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">آماده</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{getReadyOrders()}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="premium-card p-6 mb-8">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="جستجو در سفارشات..."
                  className="w-64 pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              {mounted && (
                <Suspense
                  fallback={
                    <>
                      <div className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 h-[42px] w-[150px] animate-pulse"></div>
                      <div className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 h-[42px] w-[150px] animate-pulse"></div>
                    </>
                  }
                >
                  <FiltersSelect
                    selectedStatus={selectedStatus}
                    selectedPriority={selectedPriority}
                    onStatusChange={setSelectedStatus}
                    onPriorityChange={setSelectedPriority}
                  />
                </Suspense>
              )}
            </div>
            <div className="flex items-center space-x-3 space-x-reverse flex-wrap gap-3">
              {/* گروه عملیات اصلی */}
              <div className="flex items-center space-x-2 space-x-reverse bg-gray-50 dark:bg-gray-800/50 rounded-lg p-1">
                <button 
                  className="flex items-center space-x-2 space-x-reverse px-4 py-2.5 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-all shadow-sm hover:shadow-md border border-gray-200 dark:border-gray-600"
                  title="چاپ دستور کار آشپزخانه"
                >
                  <Printer className="w-4 h-4" />
                  <span className="font-medium">چاپ KOT</span>
                </button>
                <button 
                  className="flex items-center space-x-2 space-x-reverse px-4 py-2.5 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-all shadow-sm hover:shadow-md border border-gray-200 dark:border-gray-600"
                  title="اعلان آماده شدن سفارشات"
                >
                  <Volume2 className="w-4 h-4" />
                  <span className="font-medium">اعلان آماده</span>
                </button>
              </div>

              {/* جداکننده */}
              <div className="h-8 w-px bg-gray-300 dark:bg-gray-600"></div>

              {/* گروه مدیریت */}
              <div className="flex items-center space-x-2 space-x-reverse">
                <button
                  onClick={async () => {
                    // ابتدا از API تعداد سفارشات completed را بگیر
                    try {
                      const checkResponse = await fetch('/api/kitchen-orders?status=completed')
                      const checkResult = await checkResponse.json()
                      const completedCount = checkResult.success ? (checkResult.data?.length || 0) : 0
                      
                      if (completedCount === 0) {
                        alert('هیچ سفارش تکمیل شده‌ای برای حذف وجود ندارد')
                        return
                      }
                      
                      if (confirm(`آیا از حذف ${completedCount} سفارش تکمیل شده اطمینان دارید؟`)) {
                        const response = await fetch('/api/kitchen-orders/cleanup-completed', {
                          method: 'DELETE'
                        })
                        const result = await response.json()
                        if (result.success) {
                          alert(result.message)
                          await loadOrders()
                        } else {
                          alert('خطا: ' + result.message)
                        }
                      }
                    } catch (error) {
                      console.error('Error deleting completed orders:', error)
                      alert('خطا در حذف سفارشات تکمیل شده')
                    }
                  }}
                  className="flex items-center space-x-2 space-x-reverse px-4 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all shadow-md hover:shadow-lg transform hover:scale-105"
                  title="حذف سفارشات تکمیل شده"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="font-medium">حذف تکمیل شده</span>
                </button>
                <button
                  onClick={async () => {
                    if (confirm('آیا از حذف سفارشات تستی اطمینان دارید؟')) {
                      try {
                        const response = await fetch('/api/kitchen-orders/cleanup-test', {
                          method: 'DELETE'
                        })
                        const result = await response.json()
                        if (result.success) {
                          alert(result.message)
                          await loadOrders()
                        } else {
                          alert('خطا: ' + result.message)
                        }
                      } catch (error) {
                        console.error('Error deleting test orders:', error)
                        alert('خطا در حذف سفارشات تستی')
                      }
                    }
                  }}
                  className="flex items-center space-x-2 space-x-reverse px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all shadow-md hover:shadow-lg transform hover:scale-105"
                  title="حذف سفارشات تستی"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="font-medium">حذف تستی</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs برای تفکیک سفارشات بر اساس وضعیت */}
        <div className="mb-6 flex space-x-2 space-x-reverse border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setSelectedStatus('all')}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
              selectedStatus === 'all'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            همه سفارشات ({getTotalOrders()})
          </button>
          <button
            onClick={() => setSelectedStatus('pending')}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
              selectedStatus === 'pending'
                ? 'border-yellow-500 text-yellow-600 dark:text-yellow-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            در انتظار ({getPendingOrders()})
          </button>
          <button
            onClick={() => setSelectedStatus('preparing')}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
              selectedStatus === 'preparing'
                ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            در حال آماده‌سازی ({getPreparingOrders()})
          </button>
          <button
            onClick={() => setSelectedStatus('ready')}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
              selectedStatus === 'ready'
                ? 'border-green-500 text-green-600 dark:text-green-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            آماده ({getReadyOrders()})
          </button>
        </div>

        {/* Orders List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {loading ? (
            <div className="col-span-2 flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">در حال بارگذاری سفارشات...</p>
              </div>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="col-span-2 text-center py-12">
              <ChefHat className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                {selectedStatus === 'ready' ? 'هیچ سفارش آماده‌ای یافت نشد' : 'هیچ سفارشی یافت نشد'}
              </p>
              {selectedStatus === 'ready' && (
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                  سفارشات آماده در بخش <a href="/orders/management" className="text-primary-600 hover:underline">مدیریت سفارشات</a> قابل تحویل هستند
                </p>
              )}
            </div>
          ) : (
            filteredOrders.map((order, index) => {
              // Create a unique key by combining multiple identifiers to avoid duplicates
              // Create a unique key using order ID, number, and index
              const uniqueKey = order._id 
                ? `${order._id}-${index}` 
                : order.orderNumber 
                  ? `${order.orderNumber}-${index}` 
                  : `order-${index}`
              
              return (
              <div key={uniqueKey} className="premium-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                      <ChefHat className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{order.orderNumber}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{order.customerName}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getOrderTypeColor(order.orderType)}`}>
                      {getOrderTypeText(order.orderType)}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(order.priority)}`}>
                      {order.priority === 'urgent' ? 'فوری' : 'عادی'}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center space-x-2 space-x-reverse text-sm text-gray-600 dark:text-gray-400">
                    <Clock className="w-4 h-4" />
                    <span>سفارش: {order.orderTime ? new Date(order.orderTime).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }) : 'نامشخص'}</span>
                    <span>•</span>
                    <span>آماده: {order.estimatedReadyTime ? new Date(order.estimatedReadyTime).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }) : 'نامشخص'}</span>
                  </div>
                  {order.tableNumber && (
                    <div className="flex items-center space-x-2 space-x-reverse text-sm text-gray-600 dark:text-gray-400">
                      <Users className="w-4 h-4" />
                      <span>میز: {order.tableNumber}</span>
                    </div>
                  )}
                  {order.customerPhone && (
                    <div className="flex items-center space-x-2 space-x-reverse text-sm text-gray-600 dark:text-gray-400">
                      <Phone className="w-4 h-4" />
                      <span>{order.customerPhone}</span>
                    </div>
                  )}
                  {order.orderType === 'delivery' && order.deliveryAddress && (
                    <div className="flex items-start space-x-2 space-x-reverse text-sm text-gray-600 dark:text-gray-400">
                      <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-2">آدرس: {order.deliveryAddress}</span>
                    </div>
                  )}
                </div>

                {/* Order Items */}
                <div className="space-y-3 mb-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">آیتم‌های سفارش:</h4>
                  {order.items.map((item, itemIndex) => {
                    // استفاده از ترکیب order._id و item.id و itemIndex برای کلید یکتا
                    // حتی اگر item.id تکراری باشد، با order._id و itemIndex ترکیب می‌شود
                    const orderId = order._id || order.orderNumber || 'order'
                    const itemId = item.id || `item-${itemIndex}`
                    const uniqueItemKey = `${orderId}-${itemId}-${itemIndex}`
                    return (
                      <div key={uniqueItemKey} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-2 border-transparent hover:border-primary-200 dark:hover:border-primary-800 transition-all">
                        <div className="flex items-center space-x-3 space-x-reverse flex-1">
                          <img 
                            src={item.image || '/api/placeholder/60/60'} 
                            alt={item.name} 
                            className="w-12 h-12 rounded-lg object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.src = '/api/placeholder/60/60'
                            }}
                          />
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 dark:text-white">{item.name}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {item.quantity} عدد • {item.preparationTime || 15} دقیقه
                            </p>
                            {item.notes && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{item.notes}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                            {getStatusText(item.status)}
                          </span>
                          <div className="flex space-x-1 space-x-reverse border-r border-gray-300 dark:border-gray-600 pr-2">
                            <button
                              onClick={() => updateItemStatus(order._id!, item.id, 'preparing')}
                              className={`p-2 rounded-lg transition-all ${
                                item.status === 'preparing' 
                                  ? 'bg-orange-500 text-white shadow-lg' 
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-orange-100 dark:hover:bg-orange-900/30 hover:text-orange-600 dark:hover:text-orange-400'
                              }`}
                              title="در حال آماده‌سازی"
                            >
                              <Utensils className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => updateItemStatus(order._id!, item.id, 'ready')}
                              className={`p-2 rounded-lg transition-all ${
                                item.status === 'ready' || item.status === 'completed'
                                  ? 'bg-green-500 text-white shadow-lg' 
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-green-100 dark:hover:bg-green-900/30 hover:text-green-600 dark:hover:text-green-400'
                              }`}
                              title="آماده است ✓"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Special Instructions */}
                {order.specialInstructions && (
                  <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg">
                    <div className="flex items-center space-x-2 space-x-reverse mb-1">
                      <AlertCircle className="w-4 h-4 text-yellow-600" />
                      <span className="text-sm font-medium text-yellow-800 dark:text-yellow-300">دستورات خاص:</span>
                    </div>
                    <p className="text-sm text-yellow-700 dark:text-yellow-400">{order.specialInstructions}</p>
                  </div>
                )}

                {/* Notes */}
                {order.notes && (
                  <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                    <div className="flex items-center space-x-2 space-x-reverse mb-1">
                      <Star className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800 dark:text-blue-300">یادداشت:</span>
                    </div>
                    <p className="text-sm text-blue-700 dark:text-blue-400">{order.notes}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-end space-x-2 space-x-reverse">
                  {order.status === 'ready' && (
                    <a
                      href="/orders/management"
                      className="flex items-center space-x-1 space-x-reverse px-3 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
                    >
                      <Package className="w-4 h-4" />
                      <span>تحویل در مدیریت سفارشات</span>
                    </a>
                  )}
                  {order.status !== 'ready' && order.status !== 'completed' && (
                    <button
                      onClick={async () => {
                        if (confirm('آیا از تکمیل این سفارش اطمینان دارید؟ سفارش به بخش مدیریت سفارشات منتقل می‌شود.')) {
                          try {
                            const response = await fetch('/api/kitchen-orders', {
                              method: 'PUT',
                              headers: {
                                'Content-Type': 'application/json',
                              },
                              body: JSON.stringify({
                                id: order._id,
                                status: 'ready'
                              })
                            })
                            const result = await response.json()
                            if (result.success) {
                              await loadOrders()
                              alert('سفارش آماده شد و به بخش مدیریت سفارشات منتقل شد')
                            } else {
                              alert('خطا: ' + result.message)
                            }
                          } catch (error) {
                            console.error('Error completing order:', error)
                            alert('خطا در تکمیل سفارش')
                          }
                        }
                      }}
                      className="flex items-center space-x-1 space-x-reverse px-3 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>آماده است - ارسال به مدیریت</span>
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="flex items-center space-x-1 space-x-reverse px-3 py-2 text-primary-600 hover:text-primary-700 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    <span>جزئیات</span>
                  </button>
                  <button className="flex items-center space-x-1 space-x-reverse px-3 py-2 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors">
                    <Printer className="w-4 h-4" />
                    <span>چاپ</span>
                  </button>
                </div>
              </div>
              )
            })
          )}
        </div>

        {/* Order Details Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  جزئیات سفارش {selectedOrder.orderNumber}
                </h3>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">مشتری</label>
                    <p className="text-gray-900 dark:text-white">{selectedOrder.customerName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">تلفن</label>
                    <p className="text-gray-900 dark:text-white">{selectedOrder.customerPhone}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">نوع سفارش</label>
                    <p className="text-gray-900 dark:text-white">{getOrderTypeText(selectedOrder.orderType)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">وضعیت</label>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedOrder.status)}`}>
                      {getStatusText(selectedOrder.status)}
                    </span>
                  </div>
                </div>
                
                {selectedOrder.specialInstructions && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">دستورات خاص</label>
                    <p className="text-gray-900 dark:text-white">{selectedOrder.specialInstructions}</p>
                  </div>
                )}
                
                {selectedOrder.notes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">یادداشت</label>
                    <p className="text-gray-900 dark:text-white">{selectedOrder.notes}</p>
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