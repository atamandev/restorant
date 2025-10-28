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
  ShoppingCart,
  Calendar,
  TrendingUp,
  Download
} from 'lucide-react'

interface CompletedOrder {
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
  completedTime: string
  status: 'completed'
  notes: string
  paymentMethod: 'cash' | 'card' | 'credit'
  priority: 'normal' | 'urgent'
  deliveryAddress?: string
  rating?: number
  feedback?: string
}

const mockCompletedOrders: CompletedOrder[] = [
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
    completedTime: '15:30',
    status: 'completed',
    notes: 'میز 2 - مشتری راضی بود',
    paymentMethod: 'cash',
    priority: 'normal',
    rating: 5,
    feedback: 'غذا بسیار خوشمزه بود و سرویس عالی'
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
    completedTime: '15:00',
    status: 'completed',
    notes: 'بیرون‌بر - تحویل داده شد',
    paymentMethod: 'card',
    priority: 'normal',
    rating: 4
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
    completedTime: '15:45',
    status: 'completed',
    notes: 'ارسال - تحویل به مشتری',
    paymentMethod: 'credit',
    priority: 'urgent',
    deliveryAddress: 'تهران، خیابان ولیعصر، پلاک 123',
    rating: 5,
    feedback: 'سفارش به موقع رسید و کیفیت عالی بود'
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
    completedTime: '15:15',
    status: 'completed',
    notes: 'میز 4 - پرداخت انجام شد',
    paymentMethod: 'card',
    priority: 'normal',
    rating: 4
  },
  {
    id: '5',
    orderNumber: 'DI-005',
    customerName: 'حسن رضایی',
    customerPhone: '09123456793',
    tableNumber: '6',
    orderType: 'dine-in',
    items: [
      { name: 'قرمه سبزی', quantity: 1, price: 110000 },
      { name: 'برنج', quantity: 1, price: 25000 },
      { name: 'دوغ محلی', quantity: 1, price: 18000 }
    ],
    subtotal: 153000,
    tax: 13770,
    serviceCharge: 15300,
    discount: 5000,
    total: 177070,
    orderTime: '13:45',
    estimatedReadyTime: '14:15',
    actualReadyTime: '14:10',
    completedTime: '14:45',
    status: 'completed',
    notes: 'میز 6 - مشتری راضی',
    paymentMethod: 'cash',
    priority: 'normal',
    rating: 5,
    feedback: 'غذا خیلی خوشمزه بود، حتماً دوباره می‌آیم'
  }
]

export default function CompletedOrdersPage() {
  const [orders, setOrders] = useState<CompletedOrder[]>(mockCompletedOrders)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterDate, setFilterDate] = useState('today')
  const [selectedOrder, setSelectedOrder] = useState<CompletedOrder | null>(null)

  const filteredOrders = orders.filter(order =>
    (filterType === 'all' || order.orderType === filterType) &&
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

  const getTotalOrders = () => orders.length
  const getTotalRevenue = () => orders.reduce((sum, order) => sum + order.total, 0)
  const getAverageOrderValue = () => {
    const total = orders.reduce((sum, order) => sum + order.total, 0)
    return Math.round(total / orders.length)
  }
  const getAverageRating = () => {
    const ratedOrders = orders.filter(order => order.rating)
    if (ratedOrders.length === 0) return 0
    const total = ratedOrders.reduce((sum, order) => sum + (order.rating || 0), 0)
    return (total / ratedOrders.length).toFixed(1)
  }

  const handleExport = () => {
    alert('گزارش سفارشات تکمیل شده به صورت CSV/Excel صادر شد.')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/80 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold gradient-text mb-2">سفارشات تکمیل شده</h1>
          <p className="text-gray-600 dark:text-gray-300">تاریخچه سفارشات تکمیل شده و تحویل داده شده</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="premium-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">کل سفارشات تکمیل شده</p>
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
                <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
          <div className="premium-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">میانگین امتیاز</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{getAverageRating()}/5</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <Star className="w-6 h-6 text-purple-600 dark:text-purple-400" />
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
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="today">امروز</option>
                <option value="yesterday">دیروز</option>
                <option value="week">این هفته</option>
                <option value="month">این ماه</option>
                <option value="all">همه زمان‌ها</option>
              </select>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <button
                onClick={handleExport}
                className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>صادر کردن</span>
              </button>
              <button className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                <Printer className="w-4 h-4" />
                <span>چاپ لیست</span>
              </button>
            </div>
          </div>
        </div>

        {/* Orders List */}
        <div className="premium-card p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">لیست سفارشات تکمیل شده</h2>
          
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">هیچ سفارش تکمیل شده‌ای وجود ندارد</h3>
              <p className="text-gray-600 dark:text-gray-400">تمام سفارشات تکمیل شده در اینجا نمایش داده می‌شوند</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead>
                  <tr className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-800/50">
                    <th className="px-4 py-3 rounded-r-lg">شماره سفارش</th>
                    <th className="px-4 py-3">مشتری</th>
                    <th className="px-4 py-3">نوع</th>
                    <th className="px-4 py-3">مبلغ کل</th>
                    <th className="px-4 py-3">روش پرداخت</th>
                    <th className="px-4 py-3">زمان تکمیل</th>
                    <th className="px-4 py-3">امتیاز</th>
                    <th className="px-4 py-3 rounded-l-lg">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredOrders.map(order => (
                    <tr key={order.id} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">{order.orderNumber}</td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-gray-900 dark:text-white font-medium">{order.customerName}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{order.customerPhone}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          {getOrderTypeIcon(order.orderType)}
                          <span className="text-gray-700 dark:text-gray-200">
                            {getOrderTypeText(order.orderType)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">
                        {order.total.toLocaleString('fa-IR')} تومان
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          {getPaymentMethodIcon(order.paymentMethod)}
                          <span className="text-gray-700 dark:text-gray-200">
                            {getPaymentMethodText(order.paymentMethod)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{order.completedTime}</td>
                      <td className="px-4 py-3">
                        {order.rating ? (
                          <div className="flex items-center space-x-1 space-x-reverse">
                            <Star className="w-4 h-4 text-yellow-500" />
                            <span className="text-gray-900 dark:text-white">{order.rating}/5</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex space-x-2 space-x-reverse">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="p-2 rounded-full text-primary-600 hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="p-2 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                            <Printer className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">زمان تکمیل</label>
                    <p className="text-gray-900 dark:text-white">{selectedOrder.completedTime}</p>
                  </div>
                  {selectedOrder.rating && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">امتیاز</label>
                      <div className="flex items-center space-x-1 space-x-reverse">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span className="text-gray-900 dark:text-white">{selectedOrder.rating}/5</span>
                      </div>
                    </div>
                  )}
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
                
                {selectedOrder.feedback && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">نظر مشتری</label>
                    <p className="text-gray-900 dark:text-white p-3 bg-green-50 dark:bg-green-900/30 rounded-lg">
                      {selectedOrder.feedback}
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
