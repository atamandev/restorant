'use client'

import { useState, useEffect } from 'react'
import { useMenuItems } from '@/hooks/useMenuItems'
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
  CheckCircle,
  AlertCircle,
  X,
  Loader2,
  Printer,
  RefreshCw
} from 'lucide-react'

interface OrderItem {
  id: string
  name: string
  price: number
  quantity: number
  total: number
  category: string
  image?: string
  preparationTime?: number
  uniqueId?: string
}

export default function QuickSalePage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [order, setOrder] = useState<OrderItem[]>([])
  const [customerName, setCustomerName] = useState('')
  const [discount, setDiscount] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'credit'>('cash')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [branchId, setBranchId] = useState<string | null>(null)

  // Load default branch
  useEffect(() => {
    const loadDefaultBranch = async () => {
      try {
        const response = await fetch('/api/branches')
        const result = await response.json()
        if (result.success && result.data && result.data.length > 0) {
          const activeBranch = result.data.find((b: any) => b.isActive) || result.data[0]
          if (activeBranch) {
            setBranchId(activeBranch._id || activeBranch.id)
          }
        }
      } catch (error) {
        console.error('Error loading branch:', error)
      }
    }
    loadDefaultBranch()
  }, [])

  // Load menu items from API - استفاده از hook مشترک
  const { menuItems: loadedMenuItems, loading: menuLoading, reload: reloadMenu } = useMenuItems({
    isAvailable: true, // فقط آیتم‌های موجود
    autoRefresh: true,
    refreshInterval: 30000 // هر 30 ثانیه به‌روزرسانی
  })

  // دریافت دسته‌بندی‌ها از menu items
  const categories = ['all', ...Array.from(new Set(loadedMenuItems.map(item => item.category))).filter(Boolean)]

  const filteredMenuItems = loadedMenuItems.filter(item =>
    (selectedCategory === 'all' || item.category === selectedCategory) &&
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const addToOrder = (item: any) => {
    setOrder(prevOrder => {
      // همیشه یک آیتم جدید اضافه می‌کنیم، حتی اگر همان محصول باشد
      const newOrderItem: OrderItem = { 
        id: item._id || item.id || '',
        name: item.name,
        price: item.price,
        quantity: 1,
        total: item.price,
        category: item.category,
        image: item.image,
        preparationTime: item.preparationTime,
        uniqueId: `${item._id || item.id}-${Date.now()}-${Math.random()}` // شناسه یکتا برای هر انتخاب
      }
      return [...prevOrder, newOrderItem]
    })
  }

  const updateQuantity = (uniqueId: string, delta: number) => {
    setOrder(prevOrder => {
      const updatedOrder = prevOrder.map(item =>
        item.uniqueId === uniqueId ? { ...item, quantity: item.quantity + delta, total: (item.quantity + delta) * item.price } : item
      ).filter(item => item.quantity > 0)
      return updatedOrder
    })
  }

  const removeItem = (uniqueId: string) => {
    setOrder(prevOrder => prevOrder.filter(item => item.uniqueId !== uniqueId))
  }

  const subtotal = order.reduce((sum, item) => sum + item.total, 0)
  const taxRate = 0.09
  const discountAmount = (subtotal * discount) / 100
  const tax = (subtotal - discountAmount) * taxRate
  const total = subtotal - discountAmount + tax

  const handleCheckout = async () => {
    if (order.length === 0) {
      alert('سبد خرید خالی است!')
      return
    }
    
    setLoading(true)
    
    try {
      const quickSaleData = {
        branchId: branchId || undefined,
        customerName,
        items: order.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          total: item.total
        })),
        subtotal,
        discount,
        discountAmount,
        tax,
        total,
        paymentMethod,
        notes
      }

      const response = await fetch('/api/quick-sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(quickSaleData)
      })

      const result = await response.json()
      
      if (!response.ok) {
        console.error('API Error:', result)
        alert(`خطا در ثبت فاکتور: ${result.message || result.error || 'خطای ناشناخته'}`)
        setLoading(false)
        return
      }
      
      if (result.success) {
        alert(`فاکتور با موفقیت ثبت شد!\nشماره فاکتور: ${result.data.invoiceNumber}\nمبلغ کل: ${total.toLocaleString('fa-IR')} تومان`)
        
        // Reset form
        setOrder([])
        setCustomerName('')
        setDiscount(0)
        setNotes('')
        setPaymentMethod('cash')
      } else {
        alert('خطا در ثبت فاکتور: ' + result.message)
      }
    } catch (error) {
      console.error('Error creating quick sale:', error)
      alert('خطا در ثبت فاکتور')
    } finally {
      setLoading(false)
    }
  }

  if (menuLoading) {
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
                  <Receipt className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    {new Date().toLocaleDateString('fa-IR')}
                  </span>
                </div>
                <button
                  onClick={reloadMenu}
                  className="flex items-center space-x-2 space-x-reverse bg-white dark:bg-gray-800 rounded-xl px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <RefreshCw className="w-5 h-5 text-primary-600" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">بروزرسانی منو</span>
                </button>
              </div>
            </div>
          </div>

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
                    {category === 'all' ? 'همه دسته‌ها' : category}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Menu Items Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredMenuItems.length === 0 ? (
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
              filteredMenuItems.map(item => (
                <div key={item._id || item.id} className="premium-card p-4 hover:shadow-glow transition-all duration-300 group">
                  <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-xl mb-4 flex items-center justify-center overflow-hidden">
                    {item.image ? (
                      <img 
                        src={item.image} 
                        alt={item.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `/api/placeholder/200/200`
                        }}
                      />
                    ) : (
                      <Package className="w-12 h-12 text-gray-400" />
                    )}
                  </div>
                  <div className="mb-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{item.name}</h3>
                    {item.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{item.description}</p>
                    )}
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
                    onClick={() => addToOrder(item)}
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
                  {order.length} آیتم
                </span>
              </div>
            </div>
            
            {/* Customer Info */}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  نام مشتری (اختیاری)
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="نام مشتری"
                  className="premium-input w-full"
                />
              </div>
            </div>
          </div>

          {/* Cart Items */}
          <div className="flex-1 p-6 card-scrollbar smooth-scroll overflow-y-auto">
            {order.length === 0 ? (
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
                {order.map(item => (
                  <div key={item.uniqueId} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900 dark:text-white">{item.name}</h4>
                      <button
                        onClick={() => removeItem(item.uniqueId!)}
                        className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <button
                          onClick={() => updateQuantity(item.uniqueId!, -1)}
                          className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center font-medium text-gray-900 dark:text-white">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.uniqueId!, 1)}
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

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                یادداشت (اختیاری)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="یادداشت..."
                className="premium-input w-full"
                rows={2}
              />
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
              disabled={order.length === 0 || loading}
              className="w-full premium-button bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 space-x-reverse"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
              <span>{loading ? 'در حال ثبت...' : 'تایید و چاپ فاکتور'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

