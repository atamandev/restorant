'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  ShoppingCart,
  Plus,
  Minus,
  X,
  Search,
  ChefHat,
  Clock,
  Star,
  CheckCircle,
  Loader2,
  Trash2,
  CreditCard,
  User,
  Phone,
  Sparkles,
  Zap,
  Heart,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
  ChevronUp
} from 'lucide-react'

interface MenuItem {
  _id?: string
  id?: string
  name: string
  description?: string
  price: number
  category: string
  image?: string
  isAvailable?: boolean
  isPopular?: boolean
  preparationTime?: number
  rating?: number
}

interface CartItem {
  menuItem: MenuItem
  quantity: number
  notes?: string
}

export default function CustomerOrderPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [filteredItems, setFilteredItems] = useState<MenuItem[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [categories, setCategories] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<'name' | 'price-asc' | 'price-desc' | 'rating' | 'time'>('name')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showCart, setShowCart] = useState(false) // همیشه بسته باشد تا کاربر روی دکمه کلیک کند
  const [showCheckout, setShowCheckout] = useState(false)
  const [showProductModal, setShowProductModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<MenuItem | null>(null)
  const [productQuantity, setProductQuantity] = useState(1)
  const [productNotes, setProductNotes] = useState('')
  const [isEditingCartItem, setIsEditingCartItem] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    tableNumber: ''
  })
  const [orderSuccess, setOrderSuccess] = useState(false)
  const [orderNumber, setOrderNumber] = useState('')

  // Load menu items
  const loadMenuItems = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Add timeout to prevent hanging
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
      
      try {
        // استفاده از همان API که /menu/all-items استفاده می‌کند
        const response = await fetch('/api/menu-items', {
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json'
          }
        })
        
        clearTimeout(timeoutId)
        
        if (!response.ok) {
          const errorText = await response.text()
          console.error('API Error:', response.status, errorText)
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const result = await response.json()
        
        if (result.success && result.data) {
          // فیلتر کردن فقط محصولات موجود (مثل قبل)
          const availableItems = result.data.filter((item: any) => item.isAvailable !== false)
          const items = availableItems.map((item: any) => ({
            ...item,
            id: item._id || item.id
          }))
          setMenuItems(items)
          
          // Extract unique categories
          const uniqueCategories = Array.from(new Set(items.map((item: MenuItem) => item.category || 'بدون دسته'))) as string[]
          setCategories(uniqueCategories)
          
          console.log(`✅ Loaded ${items.length} menu items, ${uniqueCategories.length} categories`)
        } else {
          console.warn('API returned unsuccessful response:', result)
          // Set empty arrays to show page anyway
          setMenuItems([])
          setCategories([])
        }
      } catch (fetchError: any) {
        clearTimeout(timeoutId)
        if (fetchError.name === 'AbortError') {
          console.error('Request timeout: API took too long to respond')
          setError('زمان اتصال به سرور به پایان رسید. لطفاً دوباره تلاش کنید.')
        } else {
          console.error('Fetch error:', fetchError)
          setError(`خطا در اتصال به سرور: ${fetchError.message || 'خطای ناشناخته'}`)
        }
        // Set empty arrays to show page anyway
        setMenuItems([])
        setCategories([])
      }
    } catch (error: any) {
      console.error('Error loading menu items:', error)
      setError(`خطا در بارگذاری منو: ${error.message || 'خطای ناشناخته'}`)
      // Set empty arrays to show page anyway (better UX than infinite loading)
      setMenuItems([])
      setCategories([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadMenuItems()
  }, [loadMenuItems])

  // سبد خرید همیشه بسته باشد - کاربر باید روی دکمه کلیک کند

  // Filter and Sort menu items
  useEffect(() => {
    let filtered = menuItems.filter(item => item.isAvailable !== false)
    
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory)
    }
    
    // Sort items
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name, 'fa')
        case 'price-asc':
          return a.price - b.price
        case 'price-desc':
          return b.price - a.price
        case 'rating':
          return (b.rating || 0) - (a.rating || 0)
        case 'time':
          return (a.preparationTime || 999) - (b.preparationTime || 999)
        default:
          return 0
      }
    })
    
    setFilteredItems(sorted)
  }, [menuItems, searchTerm, selectedCategory, sortBy])

  // Add to cart directly (without modal)
  const addToCart = (item: MenuItem) => {
    const existingItem = cart.find(cartItem => cartItem.menuItem.id === item.id)
    
    if (existingItem) {
      setCart(cart.map(cartItem =>
        cartItem.menuItem.id === item.id
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      ))
    } else {
      setCart([...cart, { menuItem: item, quantity: 1, notes: '' }])
    }
    
    // سبد خرید را باز نکن - کاربر باید روی دکمه پایین صفحه کلیک کند
  }

  // Open product modal for editing (from cart)
  const openProductModalForEdit = (cartItem: CartItem) => {
    setSelectedProduct(cartItem.menuItem)
    setProductQuantity(cartItem.quantity)
    setProductNotes(cartItem.notes || '')
    setIsEditingCartItem(true)
    setShowProductModal(true)
  }

  // Open product modal for new selection (optional - if user wants to specify quantity/notes before adding)
  const openProductModal = (item: MenuItem) => {
    setSelectedProduct(item)
    setProductQuantity(1)
    setProductNotes('')
    setIsEditingCartItem(false)
    setShowProductModal(true)
  }

  // Add to cart from modal
  const addToCartFromModal = () => {
    if (!selectedProduct) return
    
    const existingItem = cart.find(cartItem => cartItem.menuItem.id === selectedProduct.id)
    
    if (existingItem) {
      setCart(cart.map(cartItem =>
        cartItem.menuItem.id === selectedProduct.id
          ? { ...cartItem, quantity: productQuantity, notes: productNotes }
          : cartItem
      ))
    } else {
      setCart([...cart, { menuItem: selectedProduct, quantity: productQuantity, notes: productNotes }])
    }
    
    setShowProductModal(false)
    setSelectedProduct(null)
    setProductQuantity(1)
    setProductNotes('')
    setIsEditingCartItem(false)
    
    // سبد خرید را باز نکن - کاربر باید روی دکمه پایین صفحه کلیک کند
  }

  // Remove from cart
  const removeFromCart = (itemId: string) => {
    setCart(cart.filter(item => item.menuItem.id !== itemId))
  }

  // Update quantity
  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId)
      return
    }
    setCart(cart.map(item =>
      item.menuItem.id === itemId
        ? { ...item, quantity }
        : item
    ))
  }

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + (item.menuItem.price * item.quantity), 0)
  const total = subtotal

  // Submit order
  const submitOrder = async () => {
    if (cart.length === 0) {
      alert('سبد خرید خالی است')
      return
    }

    if (!customerInfo.name || !customerInfo.phone) {
      alert('لطفاً نام و شماره تماس خود را وارد کنید')
      return
    }

    try {
      setSubmitting(true)
      
      const orderData = {
        tableNumber: customerInfo.tableNumber || 'QR-ORDER',
        customerName: customerInfo.name,
        customerPhone: customerInfo.phone,
        items: cart.map(item => ({
          id: item.menuItem.id || item.menuItem._id, // API expects 'id' or 'menuItemId'
          menuItemId: item.menuItem.id || item.menuItem._id,
          name: item.menuItem.name,
          price: item.menuItem.price,
          quantity: item.quantity,
          total: item.menuItem.price * item.quantity,
          notes: item.notes || ''
        })),
        subtotal,
        tax: 0, // API will calculate tax automatically
        serviceCharge: 0, // API will calculate service charge automatically
        discount: 0,
        total, // API will recalculate based on actual prices
        orderType: 'table-order',
        status: 'pending',
        paymentMethod: 'cash',
        notes: ''
      }

      const response = await fetch('/api/table-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
      })

      const result = await response.json()

      if (result.success) {
        const orderNumber = result.data?.orderNumber || result.data?._id || 'N/A'
        setOrderNumber(orderNumber)
        setOrderSuccess(true)
        setCart([])
        setCustomerInfo({ name: '', phone: '', tableNumber: '' })
        setShowCheckout(false)
        setShowCart(false)
        
        // Reset after 5 seconds
        setTimeout(() => {
          setOrderSuccess(false)
          setOrderNumber('')
        }, 5000)
      } else {
        console.error('Order submission error:', result)
        alert(result.message || 'خطا در ثبت سفارش')
      }
    } catch (error) {
      console.error('Error submitting order:', error)
      alert('خطا در ثبت سفارش. لطفاً دوباره تلاش کنید.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-purple-50/40 dark:from-slate-900 dark:via-slate-800/90 dark:to-slate-900 flex items-center justify-center relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-300/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-300/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
        
        <div className="text-center relative z-10">
          <div className="relative inline-block">
            <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl animate-pulse">
              <ChefHat className="w-10 h-10 text-white" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-purple-600 rounded-2xl blur-xl opacity-50 animate-pulse"></div>
          </div>
          <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto mt-6 mb-4" />
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">در حال بارگذاری منو...</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">لطفاً صبر کنید</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 dark:from-slate-900 dark:via-slate-800/80 dark:to-slate-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-primary-200/30 to-transparent rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-purple-200/30 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-blue-200/20 via-purple-200/20 to-pink-200/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Premium Header - بهینه برای موبایل */}
      <header className="sticky top-0 z-50 premium-header border-b border-gray-200/30 dark:border-gray-700/30 shadow-2xl backdrop-blur-2xl bg-white/90 dark:bg-gray-900/90">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex items-center justify-between py-3 sm:py-4 lg:py-5">
            {/* Logo and Title Section */}
            <div className="flex items-center space-x-3 sm:space-x-4 lg:space-x-5 space-x-reverse flex-1 min-w-0">
              {/* Premium Logo with Glow */}
              <div className="relative group flex-shrink-0">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-400 to-purple-500 rounded-xl sm:rounded-2xl blur-xl opacity-60 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-primary-500 via-primary-600 to-purple-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-2xl floating-card pulse-glow transform group-hover:scale-110 transition-transform duration-300">
                  <ChefHat className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white drop-shadow-lg" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full border-2 sm:border-[3px] border-white dark:border-gray-900 shadow-lg animate-pulse">
                  <div className="w-full h-full bg-green-400 rounded-full animate-ping opacity-75"></div>
                </div>
              </div>
              
              {/* Title Section */}
              <div className="flex flex-col min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold gradient-text dark:text-white mb-0.5 sm:mb-1 tracking-tight truncate">
                  منوی رستوران
                </h1>
                <div className="flex items-center space-x-1.5 sm:space-x-2 space-x-reverse flex-wrap">
                  <div className="flex items-center space-x-1 sm:space-x-1.5 space-x-reverse px-2 sm:px-3 py-0.5 sm:py-1 bg-gradient-to-r from-primary-100/50 to-purple-100/50 dark:from-primary-900/20 dark:to-purple-900/20 rounded-lg border border-primary-200/50 dark:border-primary-700/50">
                    <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary-600 dark:text-primary-400" />
                    <span className="text-[10px] sm:text-xs font-semibold text-primary-700 dark:text-primary-300">سفارش آنلاین</span>
                  </div>
                  <div className="h-3 sm:h-4 w-px bg-gray-300 dark:bg-gray-600 hidden sm:block"></div>
                  <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium hidden sm:inline">
                    {filteredItems.length} محصول
                  </span>
                </div>
              </div>
            </div>
            
            {/* Cart Badge - نمایش تعداد آیتم‌ها - بهینه برای موبایل */}
            {cart.length > 0 && (
              <button
                onClick={() => setShowCart(true)}
                className="relative flex-shrink-0 ml-2 sm:ml-4"
              >
                <div className="flex items-center space-x-1.5 sm:space-x-2 space-x-reverse premium-card px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2">
                  <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600 dark:text-primary-400" />
                  <span className="font-bold text-sm sm:text-base text-gray-900 dark:text-white">
                    {cart.reduce((sum, item) => sum + item.quantity, 0)}
                  </span>
                  <span className="text-[10px] sm:text-sm text-gray-600 dark:text-gray-400 hidden sm:inline">
                    ({subtotal.toLocaleString('fa-IR')} تومان)
                  </span>
                </div>
              </button>
            )}
          </div>
        </div>
        
        {/* Decorative Bottom Border */}
        <div className="h-1 bg-gradient-to-r from-transparent via-primary-500/30 to-transparent"></div>
      </header>

      {/* Success Message with Premium Design */}
      {orderSuccess && (
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in">
          <div className="premium-card p-6 shadow-2xl border-2 border-green-400/50 neon-glow-green">
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                <CheckCircle className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="font-bold text-lg text-gray-900 dark:text-white">سفارش شما با موفقیت ثبت شد!</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">شماره سفارش: <span className="font-mono font-bold text-primary-600 dark:text-primary-400">{orderNumber}</span></p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content with Cart Sidebar */}
      <div className="flex relative z-10">
        {/* Menu Items Section - Right Side - در RTL این سمت راست است */}
        <div className="flex-1 transition-all duration-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Premium Search and Filter Section */}
        <div className="mb-10 space-y-6">
          {/* Search and Sort Row - بهینه برای موبایل */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            {/* Premium Search Bar */}
            <div className="relative group flex-1">
              <div className="absolute inset-0 bg-gradient-to-r from-primary-500/20 to-purple-500/20 rounded-xl sm:rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative premium-card p-1">
                <div className="relative">
                  <Search className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 sm:w-6 sm:h-6 z-10" />
                  <input
                    type="text"
                    placeholder="جستجوی غذا، نوشیدنی یا دسر..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="premium-input pr-11 sm:pr-14 pl-3 sm:pl-4 py-3 sm:py-4 lg:py-5 text-base sm:text-lg w-full"
                  />
                </div>
              </div>
            </div>

            {/* Professional Sort Dropdown */}
            <div className="relative group sm:w-auto w-full">
              <div className="absolute inset-0 bg-gradient-to-r from-primary-500/20 to-purple-500/20 rounded-xl sm:rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative premium-card p-1">
                <div className="relative">
                  <Filter className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5 z-10" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="premium-input pr-10 sm:pr-12 pl-3 sm:pl-4 py-3 sm:py-4 lg:py-5 text-sm sm:text-base w-full appearance-none cursor-pointer bg-white dark:bg-gray-800"
                  >
                    <option value="name">مرتب‌سازی: نام</option>
                    <option value="price-asc">قیمت: کم به زیاد</option>
                    <option value="price-desc">قیمت: زیاد به کم</option>
                    <option value="rating">امتیاز: بالا به پایین</option>
                    <option value="time">زمان آماده‌سازی: کم به زیاد</option>
                  </select>
                  <ArrowUpDown className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Premium Category Pills - بهینه برای موبایل */}
          <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-2 sm:pb-3 scrollbar-hide">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 sm:px-5 lg:px-6 py-2 sm:py-2.5 lg:py-3.5 rounded-lg sm:rounded-xl whitespace-nowrap font-semibold text-sm sm:text-base transition-all duration-300 transform hover:scale-105 ${
                selectedCategory === 'all'
                  ? 'premium-button shadow-xl text-white'
                  : 'premium-card hover:shadow-lg text-gray-700 dark:text-gray-300'
              }`}
            >
              <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 inline ml-1.5 sm:ml-2" />
              همه
            </button>
            {categories.map((category, index) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 sm:px-5 lg:px-6 py-2 sm:py-2.5 lg:py-3.5 rounded-lg sm:rounded-xl whitespace-nowrap font-semibold text-sm sm:text-base transition-all duration-300 transform hover:scale-105 ${
                  selectedCategory === category
                    ? 'premium-button shadow-xl text-white'
                    : 'premium-card hover:shadow-lg text-gray-700 dark:text-gray-300'
                }`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 premium-card p-5 border-2 border-red-400/50 bg-red-50/50 dark:bg-red-900/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center">
                  <X className="w-5 h-5 text-white" />
                </div>
                <p className="text-sm font-medium text-red-700 dark:text-red-300">{error}</p>
              </div>
              <button
                onClick={() => {
                  setError(null)
                  loadMenuItems()
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-colors shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                تلاش مجدد
              </button>
            </div>
          </div>
        )}

        {/* Premium Menu Items Grid - بهینه برای موبایل */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 items-stretch">
          {filteredItems.map((item, index) => (
            <div
              key={item.id || item._id}
              className="group relative rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 flex flex-col h-full"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Animated Glow Effect - کاملاً واضح */}
              <div className="absolute -inset-1 rounded-3xl opacity-100 -z-10 pointer-events-none">
                <div className="w-full h-full rounded-3xl bg-gradient-to-r from-primary-400 to-primary-500 animate-pulse"></div>
              </div>
              
              {/* Animated Border Wrapper - کاملاً واضح */}
              <div className="relative rounded-3xl p-[2px] bg-gradient-to-r from-primary-500 via-primary-600 to-primary-500 opacity-100 animate-gradient-xy" style={{
                backgroundSize: '200% 200%'
              }}>
                {/* Card Content Wrapper - با ارتفاع یکسان */}
                <div className="relative rounded-3xl bg-white dark:bg-gray-800 overflow-hidden flex flex-col h-full">
                {/* Always-On Gradient Animation - بالا - کاملاً واضح */}
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-primary-500 to-primary-600 opacity-100 animate-gradient-xy rounded-t-3xl z-10"></div>
                {/* Always-On Gradient Animation - پایین - کاملاً واضح */}
                <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-primary-500 to-primary-600 opacity-100 animate-gradient-xy rounded-b-3xl z-10"></div>
              {/* Premium Image Container - بهینه برای موبایل */}
              <div className="relative h-48 sm:h-56 lg:h-72 flex-shrink-0 bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 overflow-hidden z-10">
                {item.image && item.image !== '/api/placeholder/200/200' ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600">
                    <ChefHat className="w-20 h-20 text-slate-400 dark:text-slate-500" />
                  </div>
                )}
                
                {/* Subtle Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                {/* Popular Badge - Elegant Design */}
                {item.isPopular && (
                  <div className="absolute top-3 right-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white px-3 py-1.5 rounded-lg shadow-lg flex items-center space-x-1.5 space-x-reverse backdrop-blur-sm">
                    <Star className="w-3.5 h-3.5 fill-white" />
                    <span className="text-xs font-bold">محبوب</span>
                  </div>
                )}
                
              </div>

              {/* Premium Content - بهینه برای موبایل */}
              <div className="relative p-4 sm:p-5 lg:p-6 bg-white dark:bg-gray-800 flex-1 flex flex-col">
                <div className="flex items-start justify-between mb-3 sm:mb-4">
                  <h3 className="font-bold text-lg sm:text-xl text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors flex-1 leading-tight">
                    {item.name}
                  </h3>
                  {item.rating ? (
                    <div className="flex items-center space-x-1.5 space-x-reverse bg-amber-50 dark:bg-amber-900/20 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-amber-200 dark:border-amber-800 ml-2 sm:ml-3 flex-shrink-0">
                      <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-amber-400 text-amber-400" />
                      <span className="text-xs sm:text-sm font-bold text-amber-700 dark:text-amber-300">{item.rating.toFixed(1)}</span>
                    </div>
                  ) : (
                    <div className="w-12 sm:w-16 h-6 sm:h-8 ml-2 sm:ml-3 flex-shrink-0"></div>
                  )}
                </div>
                
                <div className="flex-1 mb-3 sm:mb-4 lg:mb-5">
                  {item.description ? (
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed min-h-[2.5rem] sm:min-h-[3rem]">
                      {item.description}
                    </p>
                  ) : (
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed min-h-[2.5rem] sm:min-h-[3rem]"></p>
                  )}
                </div>
                
                <div className="flex items-center justify-between mb-3 sm:mb-4 lg:mb-5">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    {item.preparationTime ? (
                      <div className="flex items-center space-x-1.5 space-x-reverse text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 rounded-lg border border-gray-200 dark:border-gray-600">
                        <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span className="font-semibold text-xs sm:text-sm">{item.preparationTime} دقیقه</span>
                      </div>
                    ) : (
                      <div className="w-16 sm:w-20 h-8 sm:h-10"></div>
                    )}
                  </div>
                  <div className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">
                    <span className="text-primary-600 dark:text-primary-400">{item.price.toLocaleString('fa-IR')}</span>
                    <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mr-1 font-normal">تومان</span>
                  </div>
                </div>

                <button
                  onClick={() => addToCart(item)}
                  className="w-full bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white py-3 sm:py-3.5 lg:py-4 rounded-xl font-bold text-sm sm:text-base shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center space-x-2 space-x-reverse mt-auto"
                >
                  <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
                  <span>افزودن به سبد</span>
                </button>
              </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredItems.length === 0 && !loading && (
          <div className="text-center py-20 premium-card">
            <div className="w-24 h-24 bg-gradient-to-br from-primary-100 to-purple-100 dark:from-primary-900/20 dark:to-purple-900/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <ChefHat className="w-12 h-12 text-primary-400 dark:text-primary-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {error ? 'خطا در بارگذاری منو' : 'هیچ محصولی یافت نشد'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {error ? 'لطفاً دوباره تلاش کنید' : 'لطفاً فیلترهای جستجو را تغییر دهید'}
            </p>
            {error && (
              <button
                onClick={() => {
                  setError(null)
                  loadMenuItems()
                }}
                className="premium-button px-8 py-3 rounded-xl font-bold shadow-xl hover:shadow-2xl"
              >
                تلاش مجدد
              </button>
            )}
          </div>
        )}
          </div>
        </div>

        {/* Backdrop برای موبایل */}
        {showCart && (
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
            onClick={() => setShowCart(false)}
          ></div>
        )}
        
        {/* Cart Sidebar - Mobile Bottom Sheet / Desktop Sidebar */}
        <div className={`fixed right-0 top-0 h-screen w-full sm:w-96 lg:w-80 bg-white dark:bg-gray-900 shadow-2xl border-r-2 border-primary-500/30 dark:border-primary-700/30 z-40 flex flex-col transform transition-transform duration-300 ${showCart ? 'translate-x-0' : 'translate-x-full'}`}>
          {/* Animated Border - بالا */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 to-primary-600 opacity-100 animate-gradient-xy"></div>
          
          <div className="relative h-full flex flex-col bg-white dark:bg-gray-900 overflow-hidden">
            {/* Premium Cart Header - مدرن و شیک */}
            <div className="relative p-6 border-b-2 border-primary-500/20 dark:border-primary-700/20 bg-gradient-to-br from-primary-50 via-white to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-between backdrop-blur-sm">
              <div className="flex items-center space-x-4 space-x-reverse">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity"></div>
                  <div className="relative w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center shadow-xl transform group-hover:scale-110 transition-transform">
                    <ShoppingCart className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="flex flex-col">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">سبد خرید</h2>
                  {cart.length > 0 && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {cart.reduce((sum, item) => sum + item.quantity, 0)} قلم محصول
                    </span>
                  )}
                </div>
              </div>
              {cart.length > 0 && (
                <div className="relative">
                  <div className="absolute inset-0 bg-primary-500 rounded-full blur-md opacity-30 animate-pulse"></div>
                  <span className="relative px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-full text-sm font-bold shadow-lg">
                    {cart.reduce((sum, item) => sum + item.quantity, 0)}
                  </span>
                </div>
              )}
              {/* Toggle Button - برای بستن/باز کردن در موبایل */}
              <button
                onClick={() => setShowCart(!showCart)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors lg:hidden"
                aria-label="بستن سبد خرید"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Items with Modern Premium Design */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide bg-gradient-to-b from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
              {cart.length === 0 ? (
                <div className="text-center py-20">
                  <div className="relative inline-block mb-6">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-200 to-primary-400 rounded-3xl blur-2xl opacity-30 animate-pulse"></div>
                    <div className="relative w-24 h-24 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-800/30 rounded-3xl flex items-center justify-center shadow-xl">
                      <ShoppingCart className="w-12 h-12 text-primary-500 dark:text-primary-400" />
                    </div>
                  </div>
                  <p className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-2">سبد خرید خالی است</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">محصولات را به سبد اضافه کنید</p>
                </div>
              ) : (
                cart.map((item, index) => (
                  <div
                    key={item.menuItem.id || item.menuItem._id}
                    className="group relative bg-white dark:bg-gray-800 rounded-2xl p-4 border-2 border-gray-100 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {/* Animated Border - حذف شده */}
                    
                    <div className="relative">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <h4 
                              onClick={() => openProductModalForEdit(item)}
                              className="font-bold text-lg text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors cursor-pointer flex-1"
                              title="کلیک برای ویرایش"
                            >
                              {item.menuItem.name}
                            </h4>
                            <button
                              onClick={() => removeFromCart(item.menuItem.id || item.menuItem._id || '')}
                              className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all duration-300 group/delete hover:scale-110 mr-2"
                            >
                              <Trash2 className="w-5 h-5 text-red-500 group-hover/delete:rotate-12 transition-transform" />
                            </button>
                          </div>
                          <div className="flex items-center space-x-2 space-x-reverse mb-2">
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {item.menuItem.price.toLocaleString('fa-IR')} تومان
                            </span>
                            <span className="text-gray-300 dark:text-gray-600">×</span>
                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                              {item.quantity}
                            </span>
                          </div>
                          {item.notes && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 italic">
                              📝 {item.notes}
                            </p>
                          )}
                          <p className="text-lg font-bold text-gray-900 dark:text-white mt-2">
                            {(item.menuItem.price * item.quantity).toLocaleString('fa-IR')} تومان
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 space-x-reverse">
                        <button
                          onClick={() => updateQuantity(item.menuItem.id || item.menuItem._id || '', item.quantity - 1)}
                          className="w-11 h-11 flex items-center justify-center bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl transition-all duration-300 hover:scale-110 shadow-sm hover:shadow-md"
                        >
                          <Minus className="w-5 h-5" />
                        </button>
                        <div className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-xl py-2 px-4 text-center border-2 border-gray-200 dark:border-gray-700">
                          <span className="font-bold text-xl text-gray-900 dark:text-white">
                            {item.quantity}
                          </span>
                        </div>
                        <button
                          onClick={() => updateQuantity(item.menuItem.id || item.menuItem._id || '', item.quantity + 1)}
                          className="w-11 h-11 flex items-center justify-center bg-gray-800 dark:bg-gray-700 hover:bg-gray-900 dark:hover:bg-gray-600 text-white rounded-xl transition-all duration-300 hover:scale-110 shadow-lg hover:shadow-xl"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Premium Cart Footer - مدرن و شیک */}
            {cart.length > 0 && (
              <div className="relative border-t-2 border-primary-500/20 dark:border-primary-700/20 p-6 space-y-5 bg-gradient-to-t from-primary-50/50 via-white to-white dark:from-gray-800 dark:via-gray-900 dark:to-gray-900 backdrop-blur-sm">
                {/* Animated Border - پایین */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 to-primary-600 opacity-100 animate-gradient-xy"></div>
                
                <div className="space-y-3">
                  <div className="pt-4">
                    <div className="flex justify-between items-center p-4 bg-gradient-to-r from-primary-50 to-primary-100/50 dark:from-primary-900/30 dark:to-primary-800/30 rounded-2xl border-2 border-primary-200 dark:border-primary-700">
                      <span className="text-xl font-bold text-gray-900 dark:text-white">مبلغ نهایی:</span>
                      <span className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
                        {subtotal.toLocaleString('fa-IR')} تومان
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowCheckout(true)
                  }}
                  className="w-full bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white py-4 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center space-x-2 space-x-reverse relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                  <CreditCard className="w-6 h-6 relative z-10" />
                  <span className="relative z-10">تکمیل سفارش</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Cart Button - دکمه ثابت پایین صفحه - مشکی/نقره‌ای شیک */}
      {cart.length > 0 && (
        <button
          onClick={() => setShowCart(true)}
          className="group fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40 overflow-hidden rounded-2xl shadow-2xl hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-500 transform hover:scale-105 active:scale-95 min-w-[300px] sm:min-w-[360px]"
        >
          {/* Animated Gradient Background - مشکی/نقره‌ای */}
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-[length:200%_100%] animate-gradient-xy"></div>
          
          {/* Silver Overlay for Depth */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-700/40 via-slate-600/30 to-gray-900/50"></div>
          
          {/* Metallic Shine Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-300/40 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
          
          {/* Content */}
          <div className="relative px-6 py-4 flex items-center justify-between space-x-4 space-x-reverse">
            {/* Left Side - Icon with Badge */}
            <div className="relative flex-shrink-0">
              <div className="relative w-14 h-14 bg-gradient-to-br from-slate-200/30 to-slate-300/20 backdrop-blur-md rounded-xl flex items-center justify-center border-2 border-slate-300/40 group-hover:from-slate-200/40 group-hover:to-slate-300/30 group-hover:border-slate-200/50 transition-all duration-300 group-hover:scale-110 shadow-lg">
                <ShoppingCart className="w-7 h-7 text-slate-100 drop-shadow-xl" />
              </div>
              {/* Badge */}
              {cart.reduce((sum, item) => sum + item.quantity, 0) > 0 && (
                <div className="absolute -top-2 -right-2">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-400 to-slate-300 rounded-full animate-ping opacity-75"></div>
                    <span className="relative bg-gradient-to-r from-slate-400 via-slate-300 to-slate-400 text-gray-900 text-xs font-bold rounded-full w-7 h-7 flex items-center justify-center border-[3px] border-gray-900 shadow-xl">
                      {cart.reduce((sum, item) => sum + item.quantity, 0)}
                    </span>
                  </div>
                </div>
              )}
            </div>
            
            {/* Center - Text Info */}
            <div className="flex-1 flex flex-col items-start space-y-1">
              <div className="flex items-center space-x-2 space-x-reverse">
                <span className="text-sm font-semibold text-slate-100 drop-shadow-lg">سبد خرید</span>
                <div className="w-1.5 h-1.5 bg-slate-300/70 rounded-full shadow-sm"></div>
                <span className="text-xs font-medium text-slate-200/90">
                  {cart.length} {cart.length === 1 ? 'محصول' : 'محصول'}
                </span>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <span className="text-2xl font-bold text-slate-50 drop-shadow-xl bg-gradient-to-r from-slate-100 to-slate-200 bg-clip-text text-transparent">
                  {subtotal.toLocaleString('fa-IR')}
                </span>
                <span className="text-sm font-semibold text-slate-200/90 drop-shadow-md">تومان</span>
              </div>
            </div>
            
            {/* Right Side - Arrow */}
            <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-slate-200/30 to-slate-300/20 backdrop-blur-md rounded-xl flex items-center justify-center border-2 border-slate-300/40 group-hover:from-slate-200/40 group-hover:to-slate-300/30 group-hover:border-slate-200/50 transition-all duration-300 group-hover:translate-y-[-2px] shadow-lg">
              <ChevronUp className="w-5 h-5 text-slate-100 drop-shadow-xl" />
            </div>
          </div>
          
          {/* Bottom Glow Effect - Silver */}
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-slate-300/60 to-transparent"></div>
          
          {/* Top Glow Effect - Silver */}
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-slate-300/40 to-transparent"></div>
        </button>
      )}

      {/* Product Selection Modal */}
      {showProductModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="premium-card w-full max-w-md p-6 sm:p-8 shadow-2xl border-2 border-primary-200/50 dark:border-primary-700/50 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl sm:text-2xl font-bold gradient-text dark:text-white">
                {isEditingCartItem ? 'ویرایش محصول' : 'انتخاب محصول'}
              </h2>
              <button
                onClick={() => {
                  setShowProductModal(false)
                  setSelectedProduct(null)
                  setProductQuantity(1)
                  setProductNotes('')
                  setIsEditingCartItem(false)
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Product Info */}
            <div className="space-y-4">
              <div className="flex items-start space-x-4 space-x-reverse">
                {selectedProduct.image && selectedProduct.image !== '/api/placeholder/200/200' ? (
                  <img
                    src={selectedProduct.image}
                    alt={selectedProduct.name}
                    className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                    <ChefHat className="w-12 h-12 text-gray-400" />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {selectedProduct.name}
                  </h3>
                  {selectedProduct.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {selectedProduct.description}
                    </p>
                  )}
                  <p className="text-xl font-bold text-primary-600 dark:text-primary-400">
                    {selectedProduct.price.toLocaleString('fa-IR')} تومان
                  </p>
                </div>
              </div>

              {/* Quantity Selection */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                  تعداد
                </label>
                <div className="flex items-center space-x-3 space-x-reverse">
                  <button
                    onClick={() => setProductQuantity(Math.max(1, productQuantity - 1))}
                    className="w-12 h-12 flex items-center justify-center bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl transition-all duration-300 hover:scale-110 shadow-sm"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <div className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-xl py-3 px-4 text-center border-2 border-gray-200 dark:border-gray-700">
                    <span className="font-bold text-2xl text-gray-900 dark:text-white">
                      {productQuantity}
                    </span>
                  </div>
                  <button
                    onClick={() => setProductQuantity(productQuantity + 1)}
                    className="w-12 h-12 flex items-center justify-center bg-gray-800 dark:bg-gray-700 hover:bg-gray-900 dark:hover:bg-gray-600 text-white rounded-xl transition-all duration-300 hover:scale-110 shadow-lg"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  یادداشت (اختیاری)
                </label>
                <textarea
                  value={productNotes}
                  onChange={(e) => setProductNotes(e.target.value)}
                  placeholder="مثال: بدون پیاز، تند نباشد..."
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
                  rows={3}
                />
              </div>

              {/* Total Price */}
              <div className="p-4 bg-gradient-to-r from-primary-50 to-primary-100/50 dark:from-primary-900/30 dark:to-primary-800/30 rounded-xl border-2 border-primary-200 dark:border-primary-700">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-700 dark:text-gray-300">مبلغ کل:</span>
                  <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                    {(selectedProduct.price * productQuantity).toLocaleString('fa-IR')} تومان
                  </span>
                </div>
              </div>

              {/* Add to Cart Button */}
              <button
                onClick={addToCartFromModal}
                className="w-full bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white py-4 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center space-x-2 space-x-reverse"
              >
                {isEditingCartItem ? (
                  <>
                    <CheckCircle className="w-6 h-6" />
                    <span>به‌روزرسانی</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-6 h-6" />
                    <span>افزودن به سبد خرید</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Premium Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="premium-card w-full max-w-md p-8 shadow-2xl border-2 border-primary-200/50 dark:border-primary-700/50 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-bold gradient-text dark:text-white">تکمیل سفارش</h2>
              <button
                onClick={() => setShowCheckout(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center space-x-2 space-x-reverse">
                  <User className="w-4 h-4" />
                  <span>نام و نام خانوادگی</span>
                </label>
                <input
                  type="text"
                  value={customerInfo.name}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                  className="premium-input w-full"
                  placeholder="نام خود را وارد کنید"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center space-x-2 space-x-reverse">
                  <Phone className="w-4 h-4" />
                  <span>شماره تماس</span>
                </label>
                <input
                  type="tel"
                  value={customerInfo.phone}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                  className="premium-input w-full"
                  placeholder="09xxxxxxxxx"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  شماره میز (اختیاری)
                </label>
                <input
                  type="text"
                  value={customerInfo.tableNumber}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, tableNumber: e.target.value })}
                  className="premium-input w-full"
                  placeholder="مثال: 5"
                />
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center mb-6 p-4 premium-card">
                  <span className="text-lg font-bold text-gray-700 dark:text-gray-300">مبلغ نهایی:</span>
                  <span className="text-3xl font-bold gradient-text">
                    {subtotal.toLocaleString('fa-IR')} تومان
                  </span>
                </div>
                <button
                  onClick={submitOrder}
                  disabled={submitting}
                  className="w-full premium-button py-4 rounded-xl font-bold text-lg shadow-2xl hover:shadow-3xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <span className="flex items-center justify-center space-x-2 space-x-reverse">
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <span>در حال ثبت...</span>
                    </span>
                  ) : (
                    <span className="flex items-center justify-center space-x-2 space-x-reverse">
                      <CheckCircle className="w-6 h-6" />
                      <span>ثبت سفارش</span>
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
