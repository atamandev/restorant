'use client'

import { useState, useEffect } from 'react'
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  Calculator,
  CreditCard,
  DollarSign,
  Receipt,
  Search,
  Package,
  Star,
  Clock,
  CheckCircle,
  AlertCircle,
  X,
  Loader2,
  Printer
} from 'lucide-react'

interface MenuItem {
  _id?: string
  id?: string
  name: string
  price: number
  category: string
  image?: string
  description?: string
  isAvailable?: boolean
}

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  total: number
}

interface QuickSale {
  _id?: string
  customerName?: string
  items: CartItem[]
  subtotal: number
  discount: number
  discountAmount: number
  tax: number
  total: number
  paymentMethod: string
  invoiceNumber: string
  status: string
  createdAt?: Date | string
}

export default function QuickSalePage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('همه')
  const [customerName, setCustomerName] = useState('')
  const [discount, setDiscount] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'credit'>('cash')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [invoiceNumber, setInvoiceNumber] = useState('')

  // دریافت لیست آیتم‌های منو
  const fetchMenuItems = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/menu-items')
      const data = await response.json()
      
      if (data.success) {
        setMenuItems(data.data)
      } else {
        setError(data.message || 'خطا در دریافت لیست آیتم‌های منو')
      }
    } catch (error) {
      console.error('Error fetching menu items:', error)
      setError('خطا در اتصال به سرور')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMenuItems()
    // Generate invoice number
    setInvoiceNumber(`QS${Date.now()}`)
  }, [])

  const categories = ['همه', ...Array.from(new Set(menuItems.map(item => item.category)))]

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'همه' || item.category === selectedCategory
    const isAvailable = item.isAvailable !== false
    return matchesSearch && matchesCategory && isAvailable
  })

  const addToCart = (item: MenuItem) => {
    const existingItem = cart.find(cartItem => cartItem.id === (item._id || item.id))
    if (existingItem) {
      setCart(cart.map(cartItem =>
        cartItem.id === (item._id || item.id)
          ? { ...cartItem, quantity: cartItem.quantity + 1, total: (cartItem.quantity + 1) * cartItem.price }
          : cartItem
      ))
    } else {
      setCart([...cart, { 
        id: item._id || item.id || '', 
        name: item.name, 
        price: item.price, 
        quantity: 1, 
        total: item.price 
      }])
    }
  }

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(cart.filter(item => item.id !== id))
    } else {
      setCart(cart.map(item =>
        item.id === id ? { ...item, quantity, total: quantity * item.price } : item
      ))
    }
  }

  const removeFromCart = (id: string) => {
    setCart(cart.filter(item => item.id !== id))
  }

  const subtotal = cart.reduce((sum, item) => sum + item.total, 0)
  const discountAmount = (subtotal * discount) / 100
  const tax = (subtotal - discountAmount) * 0.09 // 9% tax
  const total = subtotal - discountAmount + tax

  const handleCheckout = async () => {
    if (cart.length === 0) {
      setError('سبد خرید خالی است')
      return
    }

    try {
      setSaving(true)
      setError('')

      const quickSaleData = {
        customerName,
        items: cart,
        subtotal,
        discount,
        discountAmount,
        tax,
        total,
        paymentMethod,
        invoiceNumber
      }

      console.log('Sending quick sale data:', quickSaleData)

      const response = await fetch('/api/quick-sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(quickSaleData),
      })

      const data = await response.json()

      console.log('Quick sale response:', data)

      if (data.success) {
        alert('فاکتور با موفقیت ثبت شد!')
        setCart([])
        setCustomerName('')
        setDiscount(0)
        setInvoiceNumber(`QS${Date.now()}`)
      } else {
        setError(data.message || 'خطا در ثبت فاکتور')
      }
    } catch (error) {
      console.error('Error creating quick sale:', error)
      setError('خطا در اتصال به سرور')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/80 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">در حال بارگذاری منو...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/80 dark:to-gray-900">
      <div className="flex h-screen">
        {/* Main Content - Left Side */}
        <div className="flex-1 p-6 main-scrollbar smooth-scroll overflow-y-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold gradient-text mb-2">فاکتور فروش سریع</h1>
                <p className="text-gray-600 dark:text-gray-300">ثبت سریع سفارشات و فاکتور فروش</p>
              </div>
              <div className="flex items-center space-x-4 space-x-reverse">
                <div className="flex items-center space-x-2 space-x-reverse bg-white dark:bg-gray-800 rounded-xl px-4 py-2">
                  <Clock className="w-5 h-5 text-primary-600" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    {new Date().toLocaleTimeString('fa-IR')}
                  </span>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse bg-white dark:bg-gray-800 rounded-xl px-4 py-2">
                  <Receipt className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    فاکتور #{invoiceNumber}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
              <div className="flex items-center space-x-2 space-x-reverse">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                <span className="text-red-700 dark:text-red-300">{error}</span>
              </div>
            </div>
          )}

          {/* Search and Filter */}
          <div className="premium-card p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="جستجو در منو..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="premium-input pr-10 pl-4 py-3 w-full"
                  />
                </div>
              </div>
              <div className="flex space-x-2 space-x-reverse overflow-x-auto">
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 whitespace-nowrap ${
                      selectedCategory === category
                        ? 'bg-primary-500 text-white shadow-glow'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Menu Items Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <Package className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-2">
                  هیچ آیتمی یافت نشد
                </h3>
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  آیتم‌های منو را بررسی کنید
                </p>
              </div>
            ) : (
              filteredItems.map(item => (
                <div key={item._id || item.id} className="premium-card p-4 hover:shadow-glow transition-all duration-300 group">
                  <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-xl mb-4 flex items-center justify-center">
                    <Package className="w-12 h-12 text-gray-400" />
                  </div>
                  <div className="mb-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{item.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{item.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
                        {item.price.toLocaleString('fa-IR')} تومان
                      </span>
                      <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full">
                        {item.category}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => addToCart(item)}
                    className="w-full premium-button flex items-center justify-center space-x-2 space-x-reverse group-hover:scale-105 transition-transform duration-300"
                  >
                    <Plus className="w-4 h-4" />
                    <span>افزودن به سبد</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Cart Sidebar - Right Side */}
        <div className="w-96 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col">
          {/* Cart Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">سبد خرید</h2>
              <div className="flex items-center space-x-2 space-x-reverse">
                <ShoppingCart className="w-6 h-6 text-primary-600" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  {cart.length} آیتم
                </span>
              </div>
            </div>
            
            {/* Customer Info */}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  نام مشتری
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="نام مشتری (اختیاری)"
                  className="premium-input w-full"
                />
              </div>
            </div>
          </div>

          {/* Cart Items */}
          <div className="flex-1 p-6 card-scrollbar smooth-scroll overflow-y-auto">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <ShoppingCart className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
                <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-2">
                  سبد خرید خالی است
                </h3>
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  آیتم‌هایی از منو انتخاب کنید
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.map(item => (
                  <div key={item.id} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900 dark:text-white">{item.name}</h4>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center font-medium text-gray-900 dark:text-white">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <span className="font-bold text-primary-600 dark:text-primary-400">
                        {item.total.toLocaleString('fa-IR')} تومان
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cart Summary */}
          <div className="p-6 border-t border-gray-200 dark:border-gray-700 space-y-4">
            {/* Discount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                تخفیف (%)
              </label>
              <input
                type="number"
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value))}
                min="0"
                max="100"
                className="premium-input w-full"
              />
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                روش پرداخت
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'cash', label: 'نقد', icon: DollarSign },
                  { value: 'card', label: 'کارت', icon: CreditCard },
                  { value: 'credit', label: 'اعتبار', icon: Calculator }
                ].map(method => (
                  <button
                    key={method.value}
                    onClick={() => setPaymentMethod(method.value as any)}
                    className={`flex flex-col items-center p-3 rounded-xl border transition-all duration-300 ${
                      paymentMethod === method.value
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    <method.icon className="w-5 h-5 mb-1" />
                    <span className="text-xs font-medium">{method.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-300">جمع کل:</span>
                <span className="text-gray-900 dark:text-white">{subtotal.toLocaleString('fa-IR')} تومان</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-300">تخفیف:</span>
                  <span className="text-red-600">-{discountAmount.toLocaleString('fa-IR')} تومان</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-300">مالیات (9%):</span>
                <span className="text-gray-900 dark:text-white">{tax.toLocaleString('fa-IR')} تومان</span>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-600 pt-2">
                <div className="flex justify-between text-lg font-bold">
                  <span className="text-gray-900 dark:text-white">مجموع:</span>
                  <span className="text-primary-600 dark:text-primary-400">
                    {total.toLocaleString('fa-IR')} تومان
                  </span>
                </div>
              </div>
            </div>

            {/* Checkout Button */}
            <button
              onClick={handleCheckout}
              disabled={cart.length === 0 || saving}
              className="w-full premium-button bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 space-x-reverse"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
              <span>{saving ? 'در حال ثبت...' : 'تایید و چاپ فاکتور'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}