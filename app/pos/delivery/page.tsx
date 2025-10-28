'use client'

import { useState, useEffect } from 'react'
import { 
  Truck, 
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
  Edit,
  Package,
  Timer,
  RefreshCw
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
  uniqueId?: string
}

interface DeliveryOrder {
  _id?: string
  orderNumber: string
  customerName: string
  customerPhone: string
  customerAddress: string
  deliveryFee: number
  items: OrderItem[]
  subtotal: number
  tax: number
  serviceCharge: number
  discount: number
  total: number
  orderTime: string
  estimatedDeliveryTime: string
  status: 'pending' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled'
  notes: string
  paymentMethod: 'cash' | 'card' | 'credit'
  priority: 'normal' | 'urgent'
  deliveryInstructions?: string
  createdAt?: Date
  updatedAt?: Date
}

export default function DeliveryPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [order, setOrder] = useState<OrderItem[]>([])
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerAddress, setCustomerAddress] = useState('')
  const [deliveryFee, setDeliveryFee] = useState(15000)
  const [discount, setDiscount] = useState(0)
  const [notes, setNotes] = useState('')
  const [deliveryInstructions, setDeliveryInstructions] = useState('')
  const [priority, setPriority] = useState('normal')
  const [showOrderForm, setShowOrderForm] = useState(false)
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(false)

  const categories = ['all', 'Appetizers', 'Main Courses', 'Beverages', 'Desserts']

  const loadMenuItems = async () => {
    try {
      const response = await fetch('/api/menu-items')
      const result = await response.json()
      if (result.success) {
        setMenuItems(result.data)
      }
    } catch (error) {
      console.error('Error loading menu items:', error)
    }
  }

  useEffect(() => {
    loadMenuItems()
  }, [])

  const filteredMenuItems = menuItems.filter(item =>
    (selectedCategory === 'all' || item.category === selectedCategory) &&
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const addToOrder = (item: MenuItem) => {
    setOrder(prevOrder => {
      // همیشه یک آیتم جدید اضافه می‌کنیم، حتی اگر همان محصول باشد
      const newOrderItem = { 
        ...item, 
        quantity: 1,
        uniqueId: `${item.id}-${Date.now()}-${Math.random()}` // شناسه یکتا برای هر انتخاب
      }
      return [...prevOrder, newOrderItem]
    })
  }

  const updateQuantity = (uniqueId: string, delta: number) => {
    setOrder(prevOrder => {
      const updatedOrder = prevOrder.map(item =>
        item.uniqueId === uniqueId ? { ...item, quantity: item.quantity + delta } : item
      ).filter(item => item.quantity > 0)
      return updatedOrder
    })
  }

  const removeItem = (uniqueId: string) => {
    setOrder(prevOrder => prevOrder.filter(item => item.uniqueId !== uniqueId))
  }

  const calculateEstimatedTime = () => {
    if (order.length === 0) return 0
    const maxPreparationTime = Math.max(...order.map(item => item.preparationTime))
    const totalQuantity = order.reduce((sum, item) => sum + item.quantity, 0)
    const preparationTime = maxPreparationTime + (totalQuantity * 2)
    const deliveryTime = 30 // 30 minutes for delivery
    return preparationTime + deliveryTime
  }

  const subtotal = order.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const taxRate = 0.09
  const tax = subtotal * taxRate
  const serviceChargeRate = 0 // No service charge for delivery
  const serviceCharge = subtotal * serviceChargeRate
  const total = subtotal + tax + serviceCharge + deliveryFee - discount

  const handleCheckout = async () => {
    if (order.length === 0) {
      alert('سبد خرید خالی است!')
      return
    }
    
    if (!customerName || !customerPhone || !customerAddress) {
      alert('لطفاً تمام اطلاعات مشتری را وارد کنید!')
      return
    }
    
    setLoading(true)
    
    try {
      const deliveryOrder: DeliveryOrder = {
        orderNumber: `DL-${Date.now().toString().slice(-6)}`,
        customerName,
        customerPhone,
        customerAddress,
        deliveryFee,
        items: order,
        subtotal,
        tax,
        serviceCharge,
        discount,
        total,
        orderTime: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
        estimatedDeliveryTime: new Date(Date.now() + calculateEstimatedTime() * 60000).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
        status: 'pending',
        notes,
        paymentMethod: paymentMethod as 'cash' | 'card' | 'credit',
        priority: priority as 'normal' | 'urgent',
        deliveryInstructions
      }

      const response = await fetch('/api/delivery-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(deliveryOrder)
      })

      const result = await response.json()
      
      if (result.success) {
        alert(`سفارش ارسال با موفقیت ثبت شد!\nشماره سفارش: ${deliveryOrder.orderNumber}\nزمان تخمینی تحویل: ${deliveryOrder.estimatedDeliveryTime}\nمبلغ کل: ${total.toLocaleString('fa-IR')} تومان`)
        
        // Reset form
        setOrder([])
        setCustomerName('')
        setCustomerPhone('')
        setCustomerAddress('')
        setDeliveryFee(15000)
        setDiscount(0)
        setNotes('')
        setDeliveryInstructions('')
        setPaymentMethod('cash')
        setPriority('normal')
      } else {
        alert('خطا در ثبت سفارش: ' + result.message)
      }
    } catch (error) {
      console.error('Error creating delivery order:', error)
      alert('خطا در ثبت سفارش')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/80 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold gradient-text mb-2">سفارش ارسال</h1>
          <p className="text-gray-600 dark:text-gray-300">ثبت سفارشات ارسال برای مشتریان</p>
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
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">سفارش ارسال</h2>

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
              <div>
                <label htmlFor="customerAddress" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">آدرس تحویل</label>
                <textarea
                  id="customerAddress"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="آدرس کامل تحویل"
                  rows={3}
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
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
                    <div key={item.uniqueId} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
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
                          onClick={() => updateQuantity(item.uniqueId!, -1)}
                          className="p-1 rounded-full bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="font-medium text-gray-900 dark:text-white">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.uniqueId!, 1)}
                          className="p-1 rounded-full bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => removeItem(item.uniqueId!)}
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
                    زمان تخمینی تحویل: {calculateEstimatedTime()} دقیقه
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
                <span>هزینه ارسال:</span>
                <span>{deliveryFee.toLocaleString('fa-IR')} تومان</span>
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

            {/* Delivery Fee */}
            <div className="mb-4">
              <label htmlFor="deliveryFee" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">هزینه ارسال (تومان)</label>
              <input
                type="number"
                id="deliveryFee"
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                value={deliveryFee}
                onChange={(e) => setDeliveryFee(Number(e.target.value))}
              />
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

            {/* Delivery Instructions */}
            <div className="mb-4">
              <label htmlFor="deliveryInstructions" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">دستورات ارسال</label>
              <textarea
                id="deliveryInstructions"
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                rows={2}
                placeholder="دستورات خاص برای ارسال..."
                value={deliveryInstructions}
                onChange={(e) => setDeliveryInstructions(e.target.value)}
              />
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
                disabled={loading}
                className="premium-button flex-1 flex items-center justify-center space-x-2 space-x-reverse disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <CheckCircle className="w-5 h-5" />
                )}
                <span>{loading ? 'در حال ثبت...' : 'ثبت سفارش'}</span>
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
