'use client'

import { useState, useEffect } from 'react'
import { 
  Clock, 
  User, 
  Phone, 
  MapPin, 
  ShoppingBag, 
  DollarSign, 
  ChefHat, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Printer, 
  MessageSquare, 
  Star, 
  AlertCircle, 
  Timer, 
  Utensils, 
  Package, 
  Truck,
  Search,
  Filter,
  SortAsc,
  SortDesc
} from 'lucide-react'

interface OrderItem {
  id: string
  name: string
  quantity: number
  price: number
  notes?: string
}

interface PendingOrder {
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
  status: 'pending' | 'confirmed' | 'preparing' | 'ready'
  notes: string
  paymentMethod: 'cash' | 'card' | 'credit'
  priority: 'normal' | 'high' | 'urgent'
  createdAt?: Date
  updatedAt?: Date
}

export default function PendingOrdersPage() {
  const [orders, setOrders] = useState<PendingOrder[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')
  const [sortBy, setSortBy] = useState('orderTime')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [selectedOrder, setSelectedOrder] = useState<PendingOrder | null>(null)
  const [loading, setLoading] = useState(false)

  const loadOrders = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/pending-orders')
      const result = await response.json()
      if (result.success) {
        setOrders(result.data)
      }
    } catch (error) {
      console.error('Error loading orders:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()
  }, [])

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customerPhone.includes(searchTerm)
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus
    const matchesType = filterType === 'all' || order.orderType === filterType
    const matchesPriority = filterPriority === 'all' || order.priority === filterPriority
    return matchesSearch && matchesStatus && matchesType && matchesPriority
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

  const updateOrderStatus = async (orderId: string, newStatus: PendingOrder['status']) => {
    try {
      setLoading(true)
      const response = await fetch('/api/pending-orders/status', {
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
        await loadOrders()
      } else {
        alert('خطا در به‌روزرسانی وضعیت سفارش: ' + result.message)
      }
    } catch (error) {
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
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'در انتظار'
      case 'confirmed': return 'تایید شده'
      case 'preparing': return 'در حال آماده‌سازی'
      case 'ready': return 'آماده'
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
  const getPreparingOrders = () => orders.filter(order => order.status === 'preparing').length
  const getReadyOrders = () => orders.filter(order => order.status === 'ready').length

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/80 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold gradient-text mb-2">سفارشات در انتظار</h1>
          <p className="text-gray-600 dark:text-gray-300">مدیریت و پیگیری سفارشات در حال انجام</p>
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
                <ShoppingBag className="w-6 h-6 text-blue-600 dark:text-blue-400" />
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
                <ChefHat className="w-6 h-6 text-orange-600 dark:text-orange-400" />
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

        {/* Filters and Actions */}
        <div className="premium-card p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="flex-1 relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="جستجو در سفارشات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
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
            {filteredOrders.map(order => (
              <div key={order._id} className="premium-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4 space-x-reverse">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <span className="text-lg font-bold text-gray-900 dark:text-white">{order.orderNumber}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(order.priority)}`}>
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                          <span>{order.customerAddress}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Order Items */}
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">آیتم‌های سفارش</h4>
                    <div className="space-y-2">
                      {order.items.map(item => (
                        <div key={item.id} className="flex items-center justify-between text-sm">
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
                      ))}
                    </div>
                  </div>

                  {/* Order Summary */}
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">خلاصه سفارش</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400">زمان سفارش:</span>
                        <span className="text-gray-900 dark:text-white">{order.orderTime}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400">زمان تخمینی:</span>
                        <span className="text-gray-900 dark:text-white">{order.estimatedTime}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400">جمع کل:</span>
                        <span className="text-gray-900 dark:text-white">{order.subtotal.toLocaleString('fa-IR')} تومان</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400">مالیات:</span>
                        <span className="text-gray-900 dark:text-white">{order.tax.toLocaleString('fa-IR')} تومان</span>
                      </div>
                      {order.serviceCharge > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 dark:text-gray-400">حق سرویس:</span>
                          <span className="text-gray-900 dark:text-white">{order.serviceCharge.toLocaleString('fa-IR')} تومان</span>
                        </div>
                      )}
                      {order.discount > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600 dark:text-gray-400">تخفیف:</span>
                          <span className="text-gray-900 dark:text-white">-{order.discount.toLocaleString('fa-IR')} تومان</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-600/30 pt-2">
                        <span className="font-medium text-gray-900 dark:text-white">مبلغ نهایی:</span>
                        <span className="font-bold text-gray-900 dark:text-white">{order.total.toLocaleString('fa-IR')} تومان</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Notes */}
                {order.notes && order.status !== 'ready' && (
                  <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <MessageSquare className="w-4 h-4 text-yellow-600" />
                      <span className="text-sm text-yellow-800 dark:text-yellow-300">{order.notes}</span>
                    </div>
                  </div>
                )}
                
                {/* Ready Order Message */}
                {order.status === 'ready' && (
                  <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/30 rounded-lg">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-800 dark:text-green-300">سفارش آماده است - مشتری می‌تواند تحویل بگیرد</span>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-end space-x-3 space-x-reverse mt-4 pt-4 border-t border-gray-200 dark:border-gray-600/30">
                  {order.status === 'pending' && (
                    <button
                      onClick={() => updateOrderStatus(order._id!, 'confirmed')}
                      disabled={loading}
                      className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>تایید سفارش</span>
                    </button>
                  )}
                  {order.status === 'confirmed' && (
                    <button
                      onClick={() => updateOrderStatus(order._id!, 'preparing')}
                      disabled={loading}
                      className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChefHat className="w-4 h-4" />
                      <span>شروع آماده‌سازی</span>
                    </button>
                  )}
                  {order.status === 'preparing' && (
                    <button
                      onClick={() => updateOrderStatus(order._id!, 'ready')}
                      disabled={loading}
                      className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>آماده شد</span>
                    </button>
                  )}
                  <button className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                    <Printer className="w-4 h-4" />
                    <span>چاپ</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Order Detail Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">اطلاعات مشتری</h4>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">نام:</span>
                      <span className="mr-2 text-gray-900 dark:text-white">{selectedOrder.customerName}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">تلفن:</span>
                      <span className="mr-2 text-gray-900 dark:text-white">{selectedOrder.customerPhone}</span>
                    </div>
                    {selectedOrder.customerAddress && (
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">آدرس:</span>
                        <span className="mr-2 text-gray-900 dark:text-white">{selectedOrder.customerAddress}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">نوع سفارش:</span>
                      <span className="mr-2 text-gray-900 dark:text-white">{getOrderTypeText(selectedOrder.orderType)}</span>
                    </div>
                    {selectedOrder.tableNumber && (
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">میز:</span>
                        <span className="mr-2 text-gray-900 dark:text-white">{selectedOrder.tableNumber}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">جزئیات سفارش</h4>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">زمان سفارش:</span>
                      <span className="mr-2 text-gray-900 dark:text-white">{selectedOrder.orderTime}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">زمان تخمینی:</span>
                      <span className="mr-2 text-gray-900 dark:text-white">{selectedOrder.estimatedTime}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">وضعیت:</span>
                      <span className={`mr-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedOrder.status)}`}>
                        {getStatusText(selectedOrder.status)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">اولویت:</span>
                      <span className={`mr-2 px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(selectedOrder.priority)}`}>
                        {getPriorityText(selectedOrder.priority)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">روش پرداخت:</span>
                      <span className="mr-2 text-gray-900 dark:text-white">
                        {selectedOrder.paymentMethod === 'cash' ? 'نقدی' : 
                         selectedOrder.paymentMethod === 'card' ? 'کارتخوان' : 'اعتباری'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">آیتم‌های سفارش</h4>
                <div className="space-y-3">
                  {selectedOrder.items.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div>
                        <span className="font-medium text-gray-900 dark:text-white">{item.name}</span>
                        {item.notes && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">{item.notes}</p>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {item.quantity} × {item.price.toLocaleString('fa-IR')} = {(item.quantity * item.price).toLocaleString('fa-IR')} تومان
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">خلاصه مالی</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">جمع کل:</span>
                    <span className="text-gray-900 dark:text-white">{selectedOrder.subtotal.toLocaleString('fa-IR')} تومان</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">مالیات:</span>
                    <span className="text-gray-900 dark:text-white">{selectedOrder.tax.toLocaleString('fa-IR')} تومان</span>
                  </div>
                  {selectedOrder.serviceCharge > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">حق سرویس:</span>
                      <span className="text-gray-900 dark:text-white">{selectedOrder.serviceCharge.toLocaleString('fa-IR')} تومان</span>
                    </div>
                  )}
                  {selectedOrder.discount > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">تخفیف:</span>
                      <span className="text-gray-900 dark:text-white">-{selectedOrder.discount.toLocaleString('fa-IR')} تومان</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-600/30 pt-2">
                    <span className="font-medium text-gray-900 dark:text-white">مبلغ نهایی:</span>
                    <span className="font-bold text-gray-900 dark:text-white">{selectedOrder.total.toLocaleString('fa-IR')} تومان</span>
                  </div>
                </div>
              </div>

              {selectedOrder.notes && selectedOrder.status !== 'ready' && (
                <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">یادداشت‌ها</h4>
                  <p className="text-sm text-yellow-800 dark:text-yellow-300">{selectedOrder.notes}</p>
                </div>
              )}
              
              {selectedOrder.status === 'ready' && (
                <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/30 rounded-lg">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">وضعیت سفارش</h4>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <p className="text-sm text-green-800 dark:text-green-300">سفارش آماده است - مشتری می‌تواند تحویل بگیرد</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}