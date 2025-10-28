'use client'

import { useState } from 'react'
import { 
  ChefHat, 
  Clock, 
  User, 
  Phone, 
  MapPin,
  Utensils,
  Package,
  ShoppingCart,
  CheckCircle,
  XCircle,
  Eye,
  Timer,
  AlertCircle,
  Star,
  TrendingUp,
  BarChart3
} from 'lucide-react'

interface Order {
  id: string
  orderNumber: string
  customerName: string
  customerPhone: string
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
  actualTime?: string
  status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled'
  paymentMethod: 'cash' | 'card' | 'credit'
  notes?: string
  deliveryAddress?: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
  kitchenNotes?: string
}

interface OrderItem {
  id: string
  name: string
  quantity: number
  price: number
  total: number
  notes?: string
  preparationTime: number
  isReady: boolean
}

const preparingOrders: Order[] = [
  {
    id: '1',
    orderNumber: 'ORD-001',
    customerName: 'علی احمدی',
    customerPhone: '09123456789',
    orderType: 'dine-in',
    tableNumber: '5',
    items: [
      { id: '1', name: 'کباب کوبیده', quantity: 2, price: 85000, total: 170000, preparationTime: 25, isReady: false },
      { id: '2', name: 'نوشابه', quantity: 2, price: 15000, total: 30000, preparationTime: 1, isReady: true }
    ],
    subtotal: 200000,
    tax: 18000,
    serviceCharge: 20000,
    discount: 0,
    total: 238000,
    orderTime: '14:30',
    estimatedTime: '15:00',
    status: 'preparing',
    paymentMethod: 'cash',
    notes: 'کباب بدون ادویه',
    priority: 'normal',
    kitchenNotes: 'کباب را خوب بپزید'
  },
  {
    id: '2',
    orderNumber: 'ORD-002',
    customerName: 'سارا کریمی',
    customerPhone: '09123456790',
    orderType: 'takeaway',
    items: [
      { id: '3', name: 'قیمه نثار', quantity: 1, price: 75000, total: 75000, preparationTime: 30, isReady: false },
      { id: '4', name: 'سالاد فصل', quantity: 1, price: 25000, total: 25000, preparationTime: 5, isReady: false }
    ],
    subtotal: 100000,
    tax: 9000,
    serviceCharge: 0,
    discount: 10000,
    total: 99000,
    orderTime: '14:45',
    estimatedTime: '15:15',
    status: 'preparing',
    paymentMethod: 'card',
    notes: 'برای ساعت 15:30',
    priority: 'high',
    kitchenNotes: 'سریع آماده کنید'
  },
  {
    id: '3',
    orderNumber: 'ORD-003',
    customerName: 'رضا حسینی',
    customerPhone: '09123456791',
    orderType: 'delivery',
    items: [
      { id: '5', name: 'جوجه کباب', quantity: 3, price: 90000, total: 270000, preparationTime: 20, isReady: false },
      { id: '6', name: 'دوغ', quantity: 3, price: 12000, total: 36000, preparationTime: 1, isReady: true }
    ],
    subtotal: 306000,
    tax: 27540,
    serviceCharge: 0,
    discount: 0,
    total: 333540,
    orderTime: '15:00',
    estimatedTime: '15:45',
    status: 'preparing',
    paymentMethod: 'cash',
    deliveryAddress: 'تهران، خیابان ولیعصر، پلاک 123',
    notes: 'ارسال فوری',
    priority: 'urgent',
    kitchenNotes: 'اولویت بالا - ارسال فوری'
  }
]

export default function PreparingOrdersPage() {
  const [orders, setOrders] = useState<Order[]>(preparingOrders)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [filterType, setFilterType] = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')

  const filteredOrders = orders.filter(order => {
    const matchesType = filterType === 'all' || order.orderType === filterType
    const matchesPriority = filterPriority === 'all' || order.priority === filterPriority
    return matchesType && matchesPriority
  })

  const getOrderTypeIcon = (type: string) => {
    switch (type) {
      case 'dine-in': return <Utensils className="w-4 h-4" />
      case 'takeaway': return <Package className="w-4 h-4" />
      case 'delivery': return <ShoppingCart className="w-4 h-4" />
      default: return <Utensils className="w-4 h-4" />
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

  const getOrderTypeColor = (type: string) => {
    switch (type) {
      case 'dine-in': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
      case 'takeaway': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
      case 'delivery': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
      case 'high': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
      case 'normal': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
      case 'low': return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
    }
  }

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'فوری'
      case 'high': return 'بالا'
      case 'normal': return 'عادی'
      case 'low': return 'پایین'
      default: return 'نامشخص'
    }
  }

  const updateOrderStatus = (orderId: string, newStatus: string) => {
    setOrders(orders.map(order => 
      order.id === orderId ? { ...order, status: newStatus as any } : order
    ))
  }

  const updateItemStatus = (orderId: string, itemId: string, isReady: boolean) => {
    setOrders(orders.map(order => 
      order.id === orderId 
        ? {
            ...order,
            items: order.items.map(item =>
              item.id === itemId ? { ...item, isReady } : item
            )
          }
        : order
    ))
  }

  const getTotalOrders = () => orders.length
  const getTotalValue = () => orders.reduce((sum, order) => sum + order.total, 0)
  const getAveragePreparationTime = () => {
    const totalTime = orders.reduce((sum, order) => 
      sum + order.items.reduce((itemSum, item) => itemSum + item.preparationTime, 0), 0
    )
    const totalItems = orders.reduce((sum, order) => sum + order.items.length, 0)
    return totalItems > 0 ? totalTime / totalItems : 0
  }

  const getUrgentOrders = () => orders.filter(order => order.priority === 'urgent').length

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/80 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold gradient-text mb-2">سفارشات در حال آماده‌سازی</h1>
          <p className="text-gray-600 dark:text-gray-300">مدیریت سفارشات در حال آماده‌سازی در آشپزخانه</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="premium-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">کل سفارشات</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{getTotalOrders()}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                <ChefHat className="w-6 h-6 text-orange-600 dark:text-orange-400" />
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
                <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
          <div className="premium-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">میانگین زمان</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {getAveragePreparationTime().toFixed(0)} دقیقه
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <Timer className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
          <div className="premium-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">سفارشات فوری</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{getUrgentOrders()}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="premium-card p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 space-x-reverse">
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
                <option value="low">پایین</option>
              </select>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <span className="text-sm text-gray-600 dark:text-gray-300">آخرین بروزرسانی:</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {new Date().toLocaleTimeString('fa-IR')}
              </span>
            </div>
          </div>
        </div>

        {/* Orders List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredOrders.map((order) => (
            <div key={order.id} className="premium-card p-6 hover:shadow-glow transition-all duration-300">
              {/* Order Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    {order.orderNumber}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getOrderTypeColor(order.orderType)}`}>
                    {getOrderTypeIcon(order.orderType)}
                    <span className="mr-1">{getOrderTypeText(order.orderType)}</span>
                  </span>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(order.priority)}`}>
                    {getPriorityText(order.priority)}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{order.orderTime}</span>
                </div>
              </div>

              {/* Customer Info */}
              <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="flex items-center space-x-2 space-x-reverse mb-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="font-medium text-gray-900 dark:text-white">{order.customerName}</span>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse mb-1">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">{order.customerPhone}</span>
                </div>
                {order.tableNumber && (
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Utensils className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">میز {order.tableNumber}</span>
                  </div>
                )}
                {order.deliveryAddress && (
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">{order.deliveryAddress}</span>
                  </div>
                )}
              </div>

              {/* Order Items */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">آیتم‌های سفارش:</h4>
                <div className="space-y-2">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {item.name} × {item.quantity}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {item.preparationTime} دقیقه
                        </p>
                      </div>
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.isReady 
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                            : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                        }`}>
                          {item.isReady ? 'آماده' : 'در حال آماده‌سازی'}
                        </span>
                        <button
                          onClick={() => updateItemStatus(order.id, item.id, !item.isReady)}
                          className={`p-1 rounded-full ${
                            item.isReady 
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                              : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'
                          }`}
                        >
                          {item.isReady ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Summary */}
              <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-300">مجموع:</span>
                  <span className="text-primary-600 dark:text-primary-400 font-bold">
                    {order.total.toLocaleString('fa-IR')} تومان
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-gray-600 dark:text-gray-300">زمان تخمینی:</span>
                  <span className="text-gray-900 dark:text-white">{order.estimatedTime}</span>
                </div>
              </div>

              {/* Kitchen Notes */}
              {order.kitchenNotes && (
                <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <p className="text-sm text-yellow-800 dark:text-yellow-300">{order.kitchenNotes}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center space-x-2 space-x-reverse">
                <button
                  onClick={() => {
                    setSelectedOrder(order)
                    setShowOrderModal(true)
                  }}
                  className="flex-1 flex items-center justify-center space-x-2 space-x-reverse py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  <span>مشاهده</span>
                </button>
                <button
                  onClick={() => updateOrderStatus(order.id, 'ready')}
                  className="flex-1 flex items-center justify-center space-x-2 space-x-reverse py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>آماده</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Order Detail Modal */}
        {showOrderModal && selectedOrder && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                جزئیات سفارش {selectedOrder.orderNumber}
              </h3>
              
              {/* Customer Info */}
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">اطلاعات مشتری</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-900 dark:text-white">{selectedOrder.customerName}</span>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600 dark:text-gray-300">{selectedOrder.customerPhone}</span>
                  </div>
                  {selectedOrder.tableNumber && (
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Utensils className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-600 dark:text-gray-300">میز {selectedOrder.tableNumber}</span>
                    </div>
                  )}
                  {selectedOrder.deliveryAddress && (
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-600 dark:text-gray-300">{selectedOrder.deliveryAddress}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Items */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">آیتم‌های سفارش</h4>
                <div className="space-y-3">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">{item.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">تعداد: {item.quantity}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">زمان آماده‌سازی: {item.preparationTime} دقیقه</p>
                      </div>
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.isReady 
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                            : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                        }`}>
                          {item.isReady ? 'آماده' : 'در حال آماده‌سازی'}
                        </span>
                        <button
                          onClick={() => updateItemStatus(selectedOrder.id, item.id, !item.isReady)}
                          className={`p-2 rounded-full ${
                            item.isReady 
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                              : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'
                          }`}
                        >
                          {item.isReady ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Kitchen Notes */}
              {selectedOrder.kitchenNotes && (
                <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <h4 className="font-medium text-yellow-800 dark:text-yellow-300 mb-2">یادداشت آشپزخانه</h4>
                  <p className="text-sm text-yellow-800 dark:text-yellow-300">{selectedOrder.kitchenNotes}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center space-x-3 space-x-reverse">
                <button
                  onClick={() => setShowOrderModal(false)}
                  className="flex-1 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                >
                  بستن
                </button>
                <button
                  onClick={() => updateOrderStatus(selectedOrder.id, 'ready')}
                  className="flex-1 flex items-center justify-center space-x-2 space-x-reverse py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>علامت‌گذاری آماده</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
