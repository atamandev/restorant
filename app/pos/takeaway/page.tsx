'use client'

import { useState } from 'react'
import { 
  Package, 
  ShoppingBag, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  DollarSign, 
  CreditCard, 
  Receipt, 
  Clock, 
  User, 
  Phone, 
  MapPin, 
  Save, 
  X, 
  AlertCircle, 
  Info, 
  Star, 
  ChefHat, 
  Utensils, 
  Edit
} from 'lucide-react'

interface MenuItem {
  id: string
  name: string
  price: number
  category: string
  image: string
  preparationTime: number
  description: string
}

interface OrderItem extends MenuItem {
  quantity: number
  notes?: string
}

interface TakeawayOrder {
  id: string
  orderNumber: string
  customerName: string
  customerPhone: string
  items: OrderItem[]
  subtotal: number
  tax: number
  serviceCharge: number
  discount: number
  total: number
  orderTime: string
  estimatedReadyTime: string
  status: 'pending' | 'preparing' | 'ready' | 'completed'
  notes: string
  paymentMethod: 'cash' | 'card' | 'credit'
  priority: 'normal' | 'urgent'
}

const menuItems: MenuItem[] = [
  { id: '1', name: 'کباب کوبیده', price: 120000, category: 'غذاهای اصلی', image: '/api/placeholder/60/60', preparationTime: 25, description: 'کباب کوبیده سنتی با گوشت گوساله تازه' },
  { id: '2', name: 'جوجه کباب', price: 135000, category: 'غذاهای اصلی', image: '/api/placeholder/60/60', preparationTime: 20, description: 'جوجه کباب با سینه مرغ تازه و سس مخصوص' },
  { id: '3', name: 'سالاد سزار', price: 45000, category: 'پیش‌غذاها', image: '/api/placeholder/60/60', preparationTime: 10, description: 'سالاد سزار با کاهو تازه و پنیر پارمزان' },
  { id: '4', name: 'نوشابه', price: 15000, category: 'نوشیدنی‌ها', image: '/api/placeholder/60/60', preparationTime: 2, description: 'نوشابه گازدار سرد' },
  { id: '5', name: 'دوغ محلی', price: 18000, category: 'نوشیدنی‌ها', image: '/api/placeholder/60/60', preparationTime: 3, description: 'دوغ محلی تازه و خنک' },
  { id: '6', name: 'میرزا قاسمی', price: 70000, category: 'پیش‌غذاها', image: '/api/placeholder/60/60', preparationTime: 15, description: 'میرزا قاسمی با بادمجان کبابی و سیر' },
  { id: '7', name: 'چلو گوشت', price: 180000, category: 'غذاهای اصلی', image: '/api/placeholder/60/60', preparationTime: 35, description: 'چلو گوشت با گوشت گوساله و برنج ایرانی' },
  { id: '8', name: 'بستنی سنتی', price: 35000, category: 'دسرها', image: '/api/placeholder/60/60', preparationTime: 5, description: 'بستنی سنتی با طعم زعفران و گلاب' },
]

export default function TakeawayPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [order, setOrder] = useState<OrderItem[]>([])
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [discount, setDiscount] = useState(0)
  const [notes, setNotes] = useState('')
  const [priority, setPriority] = useState('normal')
  const [showOrderForm, setShowOrderForm] = useState(false)

  const categories = ['all', 'غذاهای اصلی', 'پیش‌غذاها', 'نوشیدنی‌ها', 'دسرها']

  const filteredMenuItems = menuItems.filter(item =>
    (selectedCategory === 'all' || item.category === selectedCategory) &&
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const addToOrder = (item: MenuItem) => {
    setOrder(prevOrder => {
      const existingItem = prevOrder.find(orderItem => orderItem.id === item.id)
      if (existingItem) {
        return prevOrder.map(orderItem =>
          orderItem.id === item.id ? { ...orderItem, quantity: orderItem.quantity + 1 } : orderItem
        )
      }
      return [...prevOrder, { ...item, quantity: 1 }]
    })
  }

  const updateQuantity = (id: string, delta: number) => {
    setOrder(prevOrder => {
      const updatedOrder = prevOrder.map(item =>
        item.id === id ? { ...item, quantity: item.quantity + delta } : item
      ).filter(item => item.quantity > 0)
      return updatedOrder
    })
  }

  const removeItem = (id: string) => {
    setOrder(prevOrder => prevOrder.filter(item => item.id !== id))
  }

  const calculateEstimatedTime = () => {
    if (order.length === 0) return 0
    const maxPreparationTime = Math.max(...order.map(item => item.preparationTime))
    const totalQuantity = order.reduce((sum, item) => sum + item.quantity, 0)
    return maxPreparationTime + (totalQuantity * 2) // 2 minutes per additional item
  }

  const subtotal = order.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const taxRate = 0.09
  const tax = subtotal * taxRate
  const serviceChargeRate = 0 // No service charge for takeaway
  const serviceCharge = subtotal * serviceChargeRate
  const total = subtotal + tax + serviceCharge - discount

  const handleCheckout = () => {
    if (order.length === 0) {
      alert('سبد خرید خالی است!')
      return
    }
    
    if (!customerName || !customerPhone) {
      alert('لطفاً نام و شماره تلفن مشتری را وارد کنید!')
      return
    }
    
    const takeawayOrder: TakeawayOrder = {
      id: Date.now().toString(),
      orderNumber: `TW-${Date.now().toString().slice(-6)}`,
      customerName,
      customerPhone,
      items: order,
      subtotal,
      tax,
      serviceCharge,
      discount,
      total,
      orderTime: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
      estimatedReadyTime: new Date(Date.now() + calculateEstimatedTime() * 60000).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
      status: 'pending',
      notes,
      paymentMethod: paymentMethod as 'cash' | 'card' | 'credit',
      priority: priority as 'normal' | 'urgent'
    }
    
    alert(`سفارش بیرون‌بر با موفقیت ثبت شد!\nشماره سفارش: ${takeawayOrder.orderNumber}\nزمان آماده‌سازی: ${takeawayOrder.estimatedReadyTime}\nمبلغ کل: ${total.toLocaleString('fa-IR')} تومان`)
    
    // Reset form
    setOrder([])
    setCustomerName('')
    setCustomerPhone('')
    setDiscount(0)
    setNotes('')
    setPaymentMethod('cash')
    setPriority('normal')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/80 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold gradient-text mb-2">سفارش بیرون‌بر</h1>
          <p className="text-gray-600 dark:text-gray-300">ثبت سفارشات بیرون‌بر برای مشتریان</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Menu Items */}
          <div className="lg:col-span-2 premium-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">منوی رستوران</h2>
              <div className="flex items-center space-x-4 space-x-reverse">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="جستجو در منو..."
                    className="w-64 pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category === 'all' ? 'همه دسته‌ها' : category}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Menu Items Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto">
              {filteredMenuItems.map(item => (
                <div
                  key={item.id}
                  className="premium-card p-4 flex flex-col items-center text-center cursor-pointer hover:shadow-glow transition-all duration-300"
                  onClick={() => addToOrder(item)}
                >
                  <img src={item.image} alt={item.name} className="w-20 h-20 rounded-lg object-cover mb-3" />
                  <h3 className="font-medium text-gray-900 dark:text-white mb-1">{item.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{item.category}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 line-clamp-2">{item.description}</p>
                  <div className="flex items-center space-x-2 space-x-reverse mb-2">
                    <Clock className="w-3 h-3 text-gray-400" />
                    <span className="text-xs text-gray-500 dark:text-gray-400">{item.preparationTime} دقیقه</span>
                  </div>
                  <p className="text-lg font-bold text-primary-600 dark:text-primary-400">
                    {item.price.toLocaleString('fa-IR')} <span className="text-sm">تومان</span>
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Order Summary & Checkout */}
          <div className="lg:col-span-1 premium-card p-6 flex flex-col">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">سفارش بیرون‌بر</h2>

            {/* Customer Info */}
            <div className="space-y-4 mb-6">
              <div>
                <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">نام مشتری</label>
                <input
                  type="text"
                  id="customerName"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="نام مشتری را وارد کنید"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="customerPhone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">تلفن مشتری</label>
                <input
                  type="tel"
                  id="customerPhone"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="شماره تلفن مشتری"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                />
              </div>
            </div>

            {/* Order Items */}
            <div className="flex-1 overflow-y-auto mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">
              {order.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">سبد خرید خالی است.</p>
              ) : (
                <div className="space-y-4">
                  {order.map(item => (
                    <div key={item.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
                      <div className="flex items-center space-x-3 space-x-reverse">
                        <img src={item.image} alt={item.name} className="w-10 h-10 rounded object-cover" />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{item.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {(item.price * item.quantity).toLocaleString('fa-IR')} تومان
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="p-1 rounded-full bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="font-medium text-gray-900 dark:text-white">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="p-1 rounded-full bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-1 rounded-full bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Estimated Time */}
            {order.length > 0 && (
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Timer className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-blue-800 dark:text-blue-300">
                    زمان تخمینی آماده‌سازی: {calculateEstimatedTime()} دقیقه
                  </span>
                </div>
              </div>
            )}

            {/* Totals */}
            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-sm text-gray-700 dark:text-gray-300">
                <span>جمع کل:</span>
                <span>{subtotal.toLocaleString('fa-IR')} تومان</span>
              </div>
              <div className="flex justify-between text-sm text-gray-700 dark:text-gray-300">
                <span>مالیات ({taxRate * 100}%):</span>
                <span>{tax.toLocaleString('fa-IR')} تومان</span>
              </div>
              <div className="flex justify-between text-sm text-gray-700 dark:text-gray-300">
                <span>تخفیف:</span>
                <span>-{discount.toLocaleString('fa-IR')} تومان</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-white border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
                <span>مبلغ نهایی:</span>
                <span>{total.toLocaleString('fa-IR')} تومان</span>
              </div>
            </div>

            {/* Discount Input */}
            <div className="mb-4">
              <label htmlFor="discount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">تخفیف (تومان)</label>
              <input
                type="number"
                id="discount"
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value))}
              />
            </div>

            {/* Priority */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">اولویت</label>
              <div className="flex space-x-2 space-x-reverse">
                <button
                  onClick={() => setPriority('normal')}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    priority === 'normal' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  عادی
                </button>
                <button
                  onClick={() => setPriority('urgent')}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    priority === 'urgent' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  فوری
                </button>
              </div>
            </div>

            {/* Payment Method */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">روش پرداخت</label>
              <div className="flex space-x-2 space-x-reverse">
                <button
                  onClick={() => setPaymentMethod('cash')}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    paymentMethod === 'cash' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <DollarSign className="inline-block w-4 h-4 ml-2" /> نقدی
                </button>
                <button
                  onClick={() => setPaymentMethod('card')}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    paymentMethod === 'card' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <CreditCard className="inline-block w-4 h-4 ml-2" /> کارتخوان
                </button>
              </div>
            </div>

            {/* Notes */}
            <div className="mb-6">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">یادداشت</label>
              <textarea
                id="notes"
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                rows={3}
                placeholder="یادداشت‌های اضافی..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {/* Checkout Buttons */}
            <div className="flex space-x-3 space-x-reverse mt-auto">
              <button
                onClick={handleCheckout}
                className="premium-button flex-1 flex items-center justify-center space-x-2 space-x-reverse"
              >
                <CheckCircle className="w-5 h-5" />
                <span>ثبت سفارش</span>
              </button>
              <button className="p-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                <Receipt className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
