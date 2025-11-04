'use client'

import { useState, useEffect } from 'react'
import { 
  Clock, 
  User, 
  Phone, 
  MapPin, 
  ShoppingBag, 
  ChefHat, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Printer, 
  Star, 
  Timer, 
  Utensils, 
  Package, 
  Truck,
  Search,
  SortAsc,
  SortDesc,
  Plus,
  TrendingUp,
  BarChart3
} from 'lucide-react'

interface OrderItem {
  id: string
  name: string
  quantity: number
  price: number
  notes?: string
}

interface Order {
  _id?: string
  orderNumber: string
  customerName: string
  customerPhone: string
  customerAddress?: string
  orderType: 'dine-in' | 'takeaway' | 'delivery'
  tableNumber?: string
  items: OrderItem[]
  subtotal: number
  tax: number
  serviceCharge: number
  discount: number
  total: number
  orderTime: string
  estimatedTime: string
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed'
  notes: string
  paymentMethod: 'cash' | 'card' | 'credit'
  priority: 'normal' | 'high' | 'urgent'
  createdAt?: Date
  updatedAt?: Date
}

export default function OrdersManagementClient() {
  const [mounted, setMounted] = useState(false)
  const [orders, setOrders] = useState<Order[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')
  const [sortBy, setSortBy] = useState('orderTime')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('all')

  const loadOrders = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/orders')
      const result = await response.json()
      if (result.success) {
        // پاکسازی آیتم‌های تکراری از هر سفارش
        const cleanedOrders = result.data.map((order: Order, orderIdx: number) => {
          if (order.items && Array.isArray(order.items)) {
            const originalLength = order.items.length
            // حذف آیتم‌های تکراری بر اساس id یا menuItemId
            // فقط اولین آیتم با هر id نگه داشته می‌شود
            const uniqueItems = order.items.filter((item: any, index: number, self: any[]) => {
              const itemId = item.id || item.menuItemId
              if (!itemId) {
                // اگر id نداشت، همه آیتم‌های بدون id را نگه دار
                return true
              }
              // پیدا کردن اولین آیتم با این id
              const firstIndex = self.findIndex((i: any) => 
                (i.id || i.menuItemId) === itemId
              )
              return index === firstIndex
            })
            
            // بررسی و لاگ کردن در صورت حذف آیتم‌های تکراری
            if (uniqueItems.length < originalLength) {
              console.log(`✅ سفارش ${orderIdx} (${order.orderNumber}): ${originalLength} آیتم → ${uniqueItems.length} آیتم (${originalLength - uniqueItems.length} آیتم تکراری حذف شد)`)
            }
            
            return {
              ...order,
              items: uniqueItems
            }
          }
          return order
        })
        
        // لاگ کردن تعداد آیتم‌های هر سفارش برای بررسی
        console.log('📊 تعداد آیتم‌های هر سفارش:', cleanedOrders.map(o => ({ 
          orderNumber: o.orderNumber, 
          itemsCount: o.items?.length || 0 
        })))
        
        setOrders(cleanedOrders)
      }
    } catch (error) {
      console.error('Error loading orders:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setMounted(true)
    loadOrders()
    
    // Auto-refresh هر 5 ثانیه برای به‌روزرسانی خودکار
    const interval = setInterval(() => {
      loadOrders()
    }, 5000)
    
    return () => clearInterval(interval)
  }, [])

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customerPhone.includes(searchTerm)
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus
    const matchesType = filterType === 'all' || order.orderType === filterType
    const matchesPriority = filterPriority === 'all' || order.priority === filterPriority
    return matchesSearch && matchesStatus && matchesType && matchesPriority
  }).filter(order => {
    if (activeTab === 'all') return true
    return order.status === activeTab
  }).sort((a, b) => {
    let comparison = 0
    switch (sortBy) {
      case 'orderTime':
        comparison = new Date(a.orderTime).getTime() - new Date(b.orderTime).getTime()
        break
      case 'estimatedTime':
        comparison = new Date(a.estimatedTime).getTime() - new Date(b.estimatedTime).getTime()
        break
      case 'total':
        comparison = a.total - b.total
        break
      case 'customerName':
        comparison = a.customerName.localeCompare(b.customerName)
        break
      case 'priority':
        const priorityOrder = { urgent: 3, high: 2, normal: 1 }
        comparison = priorityOrder[a.priority] - priorityOrder[b.priority]
        break
      default:
        comparison = 0
    }
    return sortOrder === 'asc' ? comparison : -comparison
  })

  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    // Optimistic update: به‌روزرسانی فوری UI قبل از دریافت پاسخ از سرور
    const previousOrders = [...orders]
    setOrders(prevOrders => 
      prevOrders.map(order => 
        order._id === orderId 
          ? { ...order, status: newStatus }
          : order
      )
    )

    try {
      setLoading(true)
      const response = await fetch('/api/orders/status', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify({
          id: orderId,
          field: 'status',
          value: newStatus
        })
      })

      const result = await response.json()
      if (result.success) {
        // به‌روزرسانی با داده‌های واقعی از سرور
        await loadOrders()
      } else {
        // در صورت خطا، به حالت قبلی برگردان
        setOrders(previousOrders)
        alert('خطا در به‌روزرسانی وضعیت سفارش: ' + result.message)
      }
    } catch (error) {
      // در صورت خطا، به حالت قبلی برگردان
      setOrders(previousOrders)
      console.error('Error updating order status:', error)
      alert('خطا در به‌روزرسانی وضعیت سفارش')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
      case 'confirmed': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
      case 'preparing': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
      case 'ready': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
      case 'completed': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'در انتظار'
      case 'confirmed': return 'تایید شده'
      case 'preparing': return 'در حال آماده‌سازی'
      case 'ready': return 'آماده'
      case 'completed': return 'تکمیل شده'
      default: return 'نامشخص'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
      case 'high': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
      case 'normal': return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
    }
  }

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'فوری'
      case 'high': return 'بالا'
      case 'normal': return 'عادی'
      default: return 'نامشخص'
    }
  }

  const getOrderTypeIcon = (type: string) => {
    switch (type) {
      case 'dine-in': return <Utensils className="w-4 h-4" />
      case 'takeaway': return <Package className="w-4 h-4" />
      case 'delivery': return <Truck className="w-4 h-4" />
      default: return <ShoppingBag className="w-4 h-4" />
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
  const getConfirmedOrders = () => orders.filter(order => order.status === 'confirmed').length
  const getPreparingOrders = () => orders.filter(order => order.status === 'preparing').length
  const getReadyOrders = () => orders.filter(order => order.status === 'ready').length
  const getCompletedOrders = () => orders.filter(order => order.status === 'completed').length
  const getTotalRevenue = () => orders.reduce((sum, order) => sum + order.total, 0)

  const addSampleData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/add-sample-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        }
      })
      
      const result = await response.json()
      if (result.success) {
        await loadOrders()
        alert('داده‌های نمونه با موفقیت اضافه شد')
      } else {
        alert('خطا در اضافه کردن داده‌های نمونه: ' + result.message)
      }
    } catch (error) {
      console.error('Error adding sample data:', error)
      alert('خطا در اضافه کردن داده‌های نمونه')
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'all', label: 'همه سفارشات', count: getTotalOrders(), icon: BarChart3 },
    { id: 'pending', label: 'در انتظار', count: getPendingOrders(), icon: Clock },
    { id: 'confirmed', label: 'تایید شده', count: getConfirmedOrders(), icon: CheckCircle },
    { id: 'preparing', label: 'در حال آماده‌سازی', count: getPreparingOrders(), icon: ChefHat },
    { id: 'ready', label: 'آماده', count: getReadyOrders(), icon: Timer },
    { id: 'completed', label: 'تکمیل شده', count: getCompletedOrders(), icon: Star }
  ]

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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold gradient-text mb-2">مدیریت سفارشات</h1>
              <p className="text-gray-600 dark:text-gray-300">مدیریت جامع تمام سفارشات رستوران</p>
            </div>
            <div className="flex items-center space-x-3 space-x-reverse">
              <button
                onClick={async () => {
                  if (!confirm('آیا مطمئن هستید که می‌خواهید تمام سفارشات تست (ORD-000001 تا ORD-000008) را حذف کنید؟')) {
                    return
                  }
                  try {
                    setLoading(true)
                    const response = await fetch('/api/orders/cleanup-test', {
                      method: 'DELETE'
                    })
                    const result = await response.json()
                    if (result.success) {
                      alert(`${result.data.deletedCount} سفارش تست حذف شد`)
                      await loadOrders()
                    } else {
                      alert('خطا در حذف سفارشات: ' + result.message)
                    }
                  } catch (error) {
                    console.error('Error deleting test orders:', error)
                    alert('خطا در حذف سفارشات تست')
                  } finally {
                    setLoading(false)
                  }
                }}
                disabled={loading}
                className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                <XCircle className="w-4 h-4" />
                <span>حذف سفارشات تست</span>
              </button>
              <button
                onClick={addSampleData}
                disabled={loading}
                className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                <Plus className="w-4 h-4" />
                <span>اضافه کردن داده‌های نمونه</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
          <div className="premium-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-300">کل سفارشات</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{getTotalOrders()}</p>
              </div>
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <ShoppingBag className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
          <div className="premium-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-300">در انتظار</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{getPendingOrders()}</p>
              </div>
              <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                <Clock className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>
          <div className="premium-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-300">تایید شده</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{getConfirmedOrders()}</p>
              </div>
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
          <div className="premium-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-300">آماده‌سازی</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{getPreparingOrders()}</p>
              </div>
              <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                <ChefHat className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </div>
          <div className="premium-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-300">آماده</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{getReadyOrders()}</p>
              </div>
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <Timer className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
          <div className="premium-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-300">تکمیل شده</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{getCompletedOrders()}</p>
              </div>
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <Star className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Revenue Card */}
        <div className="premium-card p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">درآمد کل امروز</h3>
              <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">
                {getTotalRevenue().toLocaleString('fa-IR')} تومان
              </p>
            </div>
            <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="premium-card p-2 mb-8">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab, tabIndex) => {
              const Icon = tab.icon
              // اطمینان از key منحصر به فرد با ترکیب id و index
              const tabKey = `${tab.id || 'tab'}-${tabIndex}`
              return (
                <button
                  key={tabKey}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 space-x-reverse px-4 py-3 rounded-lg transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-primary-600 text-white shadow-lg'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium">{tab.label}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                    activeTab === tab.id
                      ? 'bg-white/20 text-white'
                      : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="premium-card p-6 mb-8">
          <div className="flex flex-col lg:flex-row items-center justify-between space-y-4 lg:space-y-0">
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="جستجو در سفارشات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64 pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="all">همه وضعیت‌ها</option>
                <option value="pending">در انتظار</option>
                <option value="confirmed">تایید شده</option>
                <option value="preparing">در حال آماده‌سازی</option>
                <option value="ready">آماده</option>
                <option value="completed">تکمیل شده</option>
              </select>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="all">همه انواع</option>
                <option value="dine-in">حضوری</option>
                <option value="takeaway">بیرون‌بر</option>
                <option value="delivery">ارسال</option>
              </select>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="all">همه اولویت‌ها</option>
                <option value="urgent">فوری</option>
                <option value="high">بالا</option>
                <option value="normal">عادی</option>
              </select>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="orderTime">زمان سفارش</option>
                <option value="estimatedTime">زمان تخمینی</option>
                <option value="total">مبلغ کل</option>
                <option value="customerName">نام مشتری</option>
                <option value="priority">اولویت</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">در حال بارگذاری سفارشات...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order, orderIndex) => {
              // استفاده از ترکیب _id و orderIndex برای اطمینان از کلید منحصر به فرد
              // حتی اگر _id تکراری باشد، با orderIndex ترکیب می‌شود
              const orderKey = order._id ? `${order._id}-${orderIndex}` : `order-${orderIndex}`
              return (
                <div key={orderKey} className="premium-card p-6 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4 space-x-reverse">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <span className="text-lg font-bold text-gray-900 dark:text-white">{order.orderNumber}</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(order.priority)}`}>
                        {getPriorityText(order.priority)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse text-sm text-gray-600 dark:text-gray-400">
                      {getOrderTypeIcon(order.orderType)}
                      <span>{getOrderTypeText(order.orderType)}</span>
                      {order.tableNumber && <span>میز {order.tableNumber}</span>}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors">
                      <Printer className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {/* Customer Info */}
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">اطلاعات مشتری</h4>
                    <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <User className="w-4 h-4" />
                        <span>{order.customerName}</span>
                      </div>
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <Phone className="w-4 h-4" />
                        <span>{order.customerPhone}</span>
                      </div>
                      {order.customerAddress && (
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <MapPin className="w-4 h-4" />
                          <span className="truncate">{order.customerAddress}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Order Items */}
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">آیتم‌های سفارش</h4>
                    <div className="space-y-1">
                      {order.items && Array.isArray(order.items) ? order.items.slice(0, 3).map((item: any, itemIndex: number) => {
                        // استفاده از ترکیب item.id و index برای کلید یکتا
                        // بعد از پاکسازی، item.id ها یکتا هستند، اما برای اطمینان با index ترکیب می‌کنیم
                        const itemId = item.id || item.menuItemId || `item-${itemIndex}`
                        const uniqueItemKey = `${orderKey}-${itemId}-${itemIndex}`
                        return (
                          <div key={uniqueItemKey} className="flex items-center justify-between text-sm">
                          <div>
                            <span className="text-gray-900 dark:text-white">{item.name}</span>
                            {item.notes && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">{item.notes}</p>
                            )}
                          </div>
                          <div className="text-gray-600 dark:text-gray-400">
                            {item.quantity} × {item.price.toLocaleString('fa-IR')}
                          </div>
                        </div>
                        )
                      }) : null}
                      {order.items && Array.isArray(order.items) && order.items.length > 3 && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          +{order.items.length - 3} آیتم دیگر
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Order Summary */}
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">خلاصه سفارش</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400">زمان سفارش:</span>
                        <span className="text-gray-900 dark:text-white">{order.orderTime}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400">زمان تخمینی:</span>
                        <span className="text-gray-900 dark:text-white">{order.estimatedTime}</span>
                      </div>
                      <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-600/30 pt-1">
                        <span className="font-medium text-gray-900 dark:text-white">مبلغ نهایی:</span>
                        <span className="font-bold text-primary-600 dark:text-primary-400">{order.total.toLocaleString('fa-IR')} تومان</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">عملیات</h4>
                    <div className="space-y-2">
                      {order.status === 'pending' && (
                        <button
                          onClick={() => updateOrderStatus(order._id!, 'confirmed')}
                          disabled={loading}
                          className="w-full flex items-center justify-center space-x-2 space-x-reverse px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>تایید سفارش</span>
                        </button>
                      )}
                      {order.status === 'confirmed' && (
                        <button
                          onClick={() => updateOrderStatus(order._id!, 'preparing')}
                          disabled={loading}
                          className="w-full flex items-center justify-center space-x-2 space-x-reverse px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        >
                          <ChefHat className="w-4 h-4" />
                          <span>شروع آماده‌سازی</span>
                        </button>
                      )}
                      {order.status === 'preparing' && (
                        <button
                          onClick={() => updateOrderStatus(order._id!, 'ready')}
                          disabled={loading}
                          className="w-full flex items-center justify-center space-x-2 space-x-reverse px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        >
                          <Timer className="w-4 h-4" />
                          <span>آماده شد</span>
                        </button>
                      )}
                      {order.status === 'ready' && (
                        <button
                          onClick={() => updateOrderStatus(order._id!, 'completed')}
                          disabled={loading}
                          className="w-full flex items-center justify-center space-x-2 space-x-reverse px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        >
                          <Star className="w-4 h-4" />
                          <span>تکمیل سفارش</span>
                        </button>
                      )}
                      <button className="w-full flex items-center justify-center space-x-2 space-x-reverse px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm">
                        <Printer className="w-4 h-4" />
                        <span>چاپ</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              )
            })}
          </div>
        )}

        {/* Order Details Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  جزئیات سفارش {selectedOrder.orderNumber}
                </h3>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">اطلاعات مشتری</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600 dark:text-gray-400">نام:</span>
                      <span className="text-gray-900 dark:text-white font-medium">{selectedOrder.customerName}</span>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600 dark:text-gray-400">تلفن:</span>
                      <span className="text-gray-900 dark:text-white font-medium">{selectedOrder.customerPhone}</span>
                    </div>
                    {selectedOrder.customerAddress && (
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-400">آدرس:</span>
                        <span className="text-gray-900 dark:text-white">{selectedOrder.customerAddress}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">جزئیات سفارش</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">نوع سفارش:</span>
                      <span className="text-gray-900 dark:text-white">{getOrderTypeText(selectedOrder.orderType)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">وضعیت:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedOrder.status)}`}>
                        {getStatusText(selectedOrder.status)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">اولویت:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(selectedOrder.priority)}`}>
                        {getPriorityText(selectedOrder.priority)}
                      </span>
                    </div>
                    {selectedOrder.tableNumber && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400">میز:</span>
                        <span className="text-gray-900 dark:text-white">{selectedOrder.tableNumber}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">آیتم‌های سفارش</h4>
                <div className="space-y-2">
                  {selectedOrder.items && Array.isArray(selectedOrder.items) ? selectedOrder.items.map((item: any, index: number) => {
                    // استفاده از ترکیب item.id و index برای کلید یکتا
                    // بعد از پاکسازی، item.id ها یکتا هستند، اما برای اطمینان با index ترکیب می‌کنیم
                    const orderId = selectedOrder._id || selectedOrder.orderNumber || 'order'
                    const itemId = item.id || item.menuItemId || `item-${index}`
                    const detailItemKey = `modal-${orderId}-${itemId}-${index}`
                    return (
                      <div key={detailItemKey} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div>
                        <span className="text-gray-900 dark:text-white font-medium">{item.name}</span>
                        {item.notes && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{item.notes}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-gray-900 dark:text-white font-medium">
                          {item.quantity} × {item.price.toLocaleString('fa-IR')} تومان
                        </div>
                        <div className="text-primary-600 dark:text-primary-400 font-bold">
                          {(item.quantity * item.price).toLocaleString('fa-IR')} تومان
                        </div>
                      </div>
                    </div>
                    )
                  }) : null}
                </div>
              </div>

              <div className="mt-6 border-t border-gray-200 dark:border-gray-600/30 pt-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">زیرمجموع:</span>
                    <span className="text-gray-900 dark:text-white">{selectedOrder.subtotal.toLocaleString('fa-IR')} تومان</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">مالیات:</span>
                    <span className="text-gray-900 dark:text-white">{selectedOrder.tax.toLocaleString('fa-IR')} تومان</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">کارمزد سرویس:</span>
                    <span className="text-gray-900 dark:text-white">{selectedOrder.serviceCharge.toLocaleString('fa-IR')} تومان</span>
                  </div>
                  {selectedOrder.discount > 0 && (
                    <div className="flex items-center justify-between text-green-600 dark:text-green-400">
                      <span>تخفیف:</span>
                      <span>-{selectedOrder.discount.toLocaleString('fa-IR')} تومان</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-600/30 pt-2">
                    <span className="text-lg font-semibold text-gray-900 dark:text-white">مبلغ کل:</span>
                    <span className="text-xl font-bold text-primary-600 dark:text-primary-400">
                      {selectedOrder.total.toLocaleString('fa-IR')} تومان
                    </span>
                  </div>
                </div>
              </div>

              {selectedOrder.notes && (
                <div className="mt-6">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">یادداشت‌ها</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                    {selectedOrder.notes}
                  </p>
                </div>
              )}

              <div className="mt-6 flex items-center justify-end space-x-3 space-x-reverse">
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  بستن
                </button>
                <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2 space-x-reverse">
                  <Printer className="w-4 h-4" />
                  <span>چاپ</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}



