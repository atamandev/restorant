'use client'

import { useState, useEffect } from 'react'
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
  Minus
} from 'lucide-react'

interface KitchenOrder {
  _id?: string
  orderNumber: string
  orderType: 'dine-in' | 'takeaway' | 'delivery'
  tableNumber?: string
  customerName: string
  customerPhone: string
  items: KitchenOrderItem[]
  orderTime: string
  estimatedReadyTime: string
  status: 'pending' | 'preparing' | 'ready' | 'completed'
  priority: 'normal' | 'urgent'
  notes: string
  specialInstructions: string
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

  const loadOrders = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/kitchen-orders')
      const result = await response.json()
      if (result.success) {
        setOrders(result.data)
      }
    } catch (error) {
      console.error('Error loading kitchen orders:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()
  }, [])

  const filteredOrders = orders.filter(order => {
    const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus
    const matchesPriority = selectedPriority === 'all' || order.priority === selectedPriority
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customerName.toLowerCase().includes(searchTerm.toLowerCase())
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
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">همه وضعیت‌ها</option>
                <option value="pending">در انتظار</option>
                <option value="preparing">در حال آماده‌سازی</option>
                <option value="ready">آماده</option>
                <option value="completed">تکمیل شده</option>
              </select>
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">همه اولویت‌ها</option>
                <option value="normal">عادی</option>
                <option value="urgent">فوری</option>
              </select>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <button className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                <Printer className="w-4 h-4" />
                <span>چاپ KOT</span>
              </button>
              <button className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                <Bell className="w-4 h-4" />
                <span>اعلان آماده</span>
              </button>
            </div>
          </div>
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
              <p className="text-gray-600 dark:text-gray-400">هیچ سفارشی یافت نشد</p>
            </div>
          ) : (
            filteredOrders.map(order => (
              <div key={order._id} className="premium-card p-6">
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
                    <span>سفارش: {order.orderTime}</span>
                    <span>•</span>
                    <span>آماده: {order.estimatedReadyTime}</span>
                  </div>
                  {order.tableNumber && (
                    <div className="flex items-center space-x-2 space-x-reverse text-sm text-gray-600 dark:text-gray-400">
                      <Users className="w-4 h-4" />
                      <span>میز: {order.tableNumber}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2 space-x-reverse text-sm text-gray-600 dark:text-gray-400">
                    <Phone className="w-4 h-4" />
                    <span>{order.customerPhone}</span>
                  </div>
                  {order.orderType === 'delivery' && (
                    <div className="flex items-center space-x-2 space-x-reverse text-sm text-gray-600 dark:text-gray-400">
                      <MapPin className="w-4 h-4" />
                      <span>ارسال</span>
                    </div>
                  )}
                </div>

                {/* Order Items */}
                <div className="space-y-3 mb-4">
                  <h4 className="font-medium text-gray-900 dark:text-white">آیتم‌های سفارش:</h4>
                  {order.items.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <div className="flex items-center space-x-3 space-x-reverse">
                        <img src={item.image} alt={item.name} className="w-10 h-10 rounded object-cover" />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{item.name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {item.quantity} عدد • {item.preparationTime} دقیقه
                          </p>
                          {item.notes && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">{item.notes}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                          {getStatusText(item.status)}
                        </span>
                        <div className="flex space-x-1 space-x-reverse">
                          <button
                            onClick={() => updateItemStatus(order._id!, item.id, 'preparing')}
                            className={`p-1 rounded ${item.status === 'preparing' ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-600 hover:bg-orange-100 hover:text-orange-600'}`}
                            title="شروع آماده‌سازی"
                          >
                            <Utensils className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => updateItemStatus(order._id!, item.id, 'ready')}
                            className={`p-1 rounded ${item.status === 'ready' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600 hover:bg-green-100 hover:text-green-600'}`}
                            title="آماده"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => updateItemStatus(order._id!, item.id, 'completed')}
                            className={`p-1 rounded ${item.status === 'completed' ? 'bg-gray-100 text-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            title="تکمیل شده"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
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
            ))
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