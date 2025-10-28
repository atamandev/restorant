'use client'

import { useState } from 'react'
import { 
  CheckCircle, 
  Search, 
  Filter, 
  Clock, 
  User, 
  Phone, 
  MapPin, 
  DollarSign, 
  CreditCard, 
  Banknote, 
  Eye, 
  Edit, 
  Printer, 
  Star, 
  AlertCircle,
  Package,
  Utensils,
  ShoppingCart
} from 'lucide-react'

interface ReadyOrder {
  id: string
  orderNumber: string
  customerName: string
  customerPhone: string
  tableNumber?: string
  orderType: 'dine-in' | 'takeaway' | 'delivery'
  items: Array<{
    name: string
    quantity: number
    price: number
  }>
  subtotal: number
  tax: number
  serviceCharge: number
  discount: number
  total: number
  orderTime: string
  estimatedReadyTime: string
  actualReadyTime: string
  status: 'ready'
  notes: string
  paymentMethod: 'cash' | 'card' | 'credit'
  priority: 'normal' | 'urgent'
  deliveryAddress?: string
}

const mockReadyOrders: ReadyOrder[] = [
  {
    id: '1',
    orderNumber: 'DI-001',
    customerName: 'احمد محمدی',
    customerPhone: '09123456789',
    tableNumber: '2',
    orderType: 'dine-in',
    items: [
      { name: 'کباب کوبیده', quantity: 2, price: 120000 },
      { name: 'نوشابه', quantity: 2, price: 15000 }
    ],
    subtotal: 270000,
    tax: 24300,
    serviceCharge: 27000,
    discount: 0,
    total: 321300,
    orderTime: '14:30',
    estimatedReadyTime: '15:00',
    actualReadyTime: '14:55',
    status: 'ready',
    notes: 'میز 2 - مشتری منتظر است',
    paymentMethod: 'cash',
    priority: 'normal'
  },
  {
    id: '2',
    orderNumber: 'TW-002',
    customerName: 'سارا کریمی',
    customerPhone: '09123456790',
    orderType: 'takeaway',
    items: [
      { name: 'جوجه کباب', quantity: 1, price: 135000 },
      { name: 'دوغ محلی', quantity: 1, price: 18000 }
    ],
    subtotal: 153000,
    tax: 13770,
    serviceCharge: 0,
    discount: 10000,
    total: 156770,
    orderTime: '14:25',
    estimatedReadyTime: '14:50',
    actualReadyTime: '14:48',
    status: 'ready',
    notes: 'بیرون‌بر - آماده تحویل',
    paymentMethod: 'card',
    priority: 'normal'
  },
  {
    id: '3',
    orderNumber: 'DL-003',
    customerName: 'رضا حسینی',
    customerPhone: '09123456791',
    orderType: 'delivery',
    items: [
      { name: 'چلو گوشت', quantity: 1, price: 180000 },
      { name: 'سالاد سزار', quantity: 1, price: 45000 }
    ],
    subtotal: 225000,
    tax: 20250,
    serviceCharge: 0,
    discount: 0,
    total: 245250,
    orderTime: '14:20',
    estimatedReadyTime: '15:00',
    actualReadyTime: '14:58',
    status: 'ready',
    notes: 'ارسال - آدرس: تهران، خیابان ولیعصر',
    paymentMethod: 'credit',
    priority: 'urgent',
    deliveryAddress: 'تهران، خیابان ولیعصر، پلاک 123'
  },
  {
    id: '4',
    orderNumber: 'DI-004',
    customerName: 'مریم نوری',
    customerPhone: '09123456792',
    tableNumber: '4',
    orderType: 'dine-in',
    items: [
      { name: 'میرزا قاسمی', quantity: 1, price: 70000 },
      { name: 'نوشابه', quantity: 1, price: 15000 }
    ],
    subtotal: 85000,
    tax: 7650,
    serviceCharge: 8500,
    discount: 0,
    total: 101150,
    orderTime: '14:15',
    estimatedReadyTime: '14:35',
    actualReadyTime: '14:32',
    status: 'ready',
    notes: 'میز 4 - آماده تحویل',
    paymentMethod: 'card',
    priority: 'normal'
  }
]

export default function ReadyOrdersPage() {
  const [orders, setOrders] = useState<ReadyOrder[]>(mockReadyOrders)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState<ReadyOrder | null>(null)

  const filteredOrders = orders.filter(order =>
    (filterType === 'all' || order.orderType === filterType) &&
    (filterPriority === 'all' || order.priority === filterPriority) &&
    (order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerPhone.includes(searchTerm))
  )

  const getOrderTypeIcon = (type: string) => {
    switch (type) {
      case 'dine-in': return <Utensils className="w-4 h-4 text-blue-600" />
      case 'takeaway': return <Package className="w-4 h-4 text-green-600" />
      case 'delivery': return <ShoppingCart className="w-4 h-4 text-purple-600" />
      default: return null
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

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'cash': return <Banknote className="w-4 h-4 text-green-600" />
      case 'card': return <CreditCard className="w-4 h-4 text-blue-600" />
      case 'credit': return <DollarSign className="w-4 h-4 text-purple-600" />
      default: return null
    }
  }

  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case 'cash': return 'نقدی'
      case 'card': return 'کارتخوان'
      case 'credit': return 'اعتباری'
      default: return 'نامشخص'
    }
  }

  const markAsCompleted = (orderId: string) => {
    if (confirm('آیا این سفارش را به عنوان تکمیل شده علامت‌گذاری می‌کنید؟')) {
      setOrders(orders.filter(order => order.id !== orderId))
      alert('سفارش با موفقیت تکمیل شد!')
    }
  }

  const getTotalOrders = () => orders.length
  const getUrgentOrders = () => orders.filter(order => order.priority === 'urgent').length
  const getTotalRevenue = () => orders.reduce((sum, order) => sum + order.total, 0)
  const getAverageOrderValue = () => {
    const total = orders.reduce((sum, order) => sum + order.total, 0)
    return Math.round(total / orders.length)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/80 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold gradient-text mb-2">سفارشات آماده</h1>
          <p className="text-gray-600 dark:text-gray-300">سفارشات آماده برای تحویل به مشتریان</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="premium-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">کل سفارشات آماده</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{getTotalOrders()}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
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
          <div className="premium-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">کل درآمد</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{getTotalRevenue().toLocaleString('fa-IR')}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>
          <div className="premium-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">میانگین ارزش سفارش</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{getAverageOrderValue().toLocaleString('fa-IR')}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <Star className="w-6 h-6 text-blue-600 dark:text-blue-400" />
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
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">همه انواع</option>
                <option value="dine-in">حضوری</option>
                <option value="takeaway">بیرون‌بر</option>
                <option value="delivery">ارسال</option>
              </select>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
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
                <span>چاپ لیست</span>
              </button>
            </div>
          </div>
        </div>

        {/* Orders List */}
        <div className="premium-card p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">لیست سفارشات آماده</h2>
          
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">هیچ سفارش آماده‌ای وجود ندارد</h3>
              <p className="text-gray-600 dark:text-gray-400">تمام سفارشات آماده در اینجا نمایش داده می‌شوند</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredOrders.map(order => (
                <div key={order.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        {getOrderTypeIcon(order.orderType)}
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {getOrderTypeText(order.orderType)}
                        </span>
                      </div>
                      {order.priority === 'urgent' && (
                        <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-xs font-medium">
                          فوری
                        </span>
                      )}
                    </div>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      {order.orderNumber}
                    </span>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900 dark:text-white">{order.customerName}</span>
                    </div>
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-700 dark:text-gray-300">{order.customerPhone}</span>
                    </div>
                    {order.tableNumber && (
                      <div className="flex items-center space-x-3 space-x-reverse">
                        <Utensils className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-700 dark:text-gray-300">میز {order.tableNumber}</span>
                      </div>
                    )}
                    {order.deliveryAddress && (
                      <div className="flex items-center space-x-3 space-x-reverse">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-700 dark:text-gray-300">{order.deliveryAddress}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-700 dark:text-gray-300">
                        آماده شده در: {order.actualReadyTime}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-600 pt-4 mb-4">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">آیتم‌های سفارش:</h4>
                    <div className="space-y-1">
                      {order.items.map((item, index) => (
                        <div key={index} className="flex justify-between text-sm text-gray-700 dark:text-gray-300">
                          <span>{item.name} × {item.quantity}</span>
                          <span>{(item.price * item.quantity).toLocaleString('fa-IR')} تومان</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        {getPaymentMethodIcon(order.paymentMethod)}
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {getPaymentMethodText(order.paymentMethod)}
                        </span>
                      </div>
                      <span className="text-lg font-bold text-gray-900 dark:text-white">
                        {order.total.toLocaleString('fa-IR')} تومان
                      </span>
                    </div>
                  </div>

                  {order.notes && (
                    <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg">
                      <p className="text-sm text-yellow-800 dark:text-yellow-300">
                        <strong>یادداشت:</strong> {order.notes}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="flex items-center space-x-2 space-x-reverse px-3 py-2 text-primary-600 hover:text-primary-700 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      <span>جزئیات</span>
                    </button>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors">
                        <Printer className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => markAsCompleted(order.id)}
                        className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>تکمیل شد</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
                  <X className="w-5 h-5" />
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">روش پرداخت</label>
                    <p className="text-gray-900 dark:text-white">{getPaymentMethodText(selectedOrder.paymentMethod)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">زمان سفارش</label>
                    <p className="text-gray-900 dark:text-white">{selectedOrder.orderTime}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">زمان آماده‌سازی</label>
                    <p className="text-gray-900 dark:text-white">{selectedOrder.actualReadyTime}</p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">آیتم‌های سفارش</label>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{item.name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">تعداد: {item.quantity}</p>
                        </div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {(item.price * item.quantity).toLocaleString('fa-IR')} تومان
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-gray-700 dark:text-gray-300">
                      <span>جمع کل:</span>
                      <span>{selectedOrder.subtotal.toLocaleString('fa-IR')} تومان</span>
                    </div>
                    {selectedOrder.serviceCharge > 0 && (
                      <div className="flex justify-between text-gray-700 dark:text-gray-300">
                        <span>حق سرویس:</span>
                        <span>{selectedOrder.serviceCharge.toLocaleString('fa-IR')} تومان</span>
                      </div>
                    )}
                    <div className="flex justify-between text-gray-700 dark:text-gray-300">
                      <span>مالیات:</span>
                      <span>{selectedOrder.tax.toLocaleString('fa-IR')} تومان</span>
                    </div>
                    {selectedOrder.discount > 0 && (
                      <div className="flex justify-between text-gray-700 dark:text-gray-300">
                        <span>تخفیف:</span>
                        <span>-{selectedOrder.discount.toLocaleString('fa-IR')} تومان</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-white border-t border-gray-200 dark:border-gray-600 pt-2">
                      <span>مبلغ نهایی:</span>
                      <span>{selectedOrder.total.toLocaleString('fa-IR')} تومان</span>
                    </div>
                  </div>
                </div>
                
                {selectedOrder.notes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">یادداشت</label>
                    <p className="text-gray-900 dark:text-white p-3 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg">
                      {selectedOrder.notes}
                    </p>
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
