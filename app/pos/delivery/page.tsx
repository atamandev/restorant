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
  const [branchId, setBranchId] = useState<string>('')

  const categories = ['all', 'Appetizers', 'Main Courses', 'Beverages', 'Desserts']

  const loadMenuItems = async () => {
    try {
      const response = await fetch('/api/menu-items')
      const result = await response.json()
      if (result.success) {
        // تبدیل _id به id برای سازگاری
        const formattedItems = result.data.map((item: any) => ({
          ...item,
          id: item._id || item.id || '',
          image: item.image || '/api/placeholder/60/60',
          preparationTime: item.preparationTime || 15,
          description: item.description || ''
        }))
        setMenuItems(formattedItems)
      }
    } catch (error) {
      console.error('Error loading menu items:', error)
    }
  }

  useEffect(() => {
    loadMenuItems()
    // دریافت شعبه پیش‌فرض
    const loadDefaultBranch = async () => {
      try {
        const response = await fetch('/api/branches')
        const result = await response.json()
        if (result.success && result.data && result.data.length > 0) {
          const activeBranch = result.data.find((branch: any) => branch.isActive) || result.data[0]
          if (activeBranch && activeBranch._id) {
            // تبدیل ObjectId به string
            const branchIdStr = typeof activeBranch._id === 'string' ? activeBranch._id : activeBranch._id.toString()
            setBranchId(branchIdStr)
            console.log('Branch ID loaded:', branchIdStr)
          }
        }
      } catch (error) {
        console.error('Error loading default branch:', error)
      }
    }
    loadDefaultBranch()
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
    
    // بررسی و trim کردن مقادیر - استفاده از مقادیر فعلی state
    const currentName = customerName || ''
    const currentPhone = customerPhone || ''
    const currentAddress = customerAddress || ''
    
    const trimmedName = currentName.trim()
    const trimmedPhone = currentPhone.trim()
    const trimmedAddress = currentAddress.trim()

    console.log('Form validation (before submit):', {
      customerName: { original: currentName, trimmed: trimmedName, length: currentName.length, isEmpty: !trimmedName },
      customerPhone: { original: currentPhone, trimmed: trimmedPhone, length: currentPhone.length, isEmpty: !trimmedPhone },
      customerAddress: { 
        original: currentAddress, 
        trimmed: trimmedAddress, 
        originalLength: currentAddress.length,
        trimmedLength: trimmedAddress.length,
        isEmpty: !trimmedAddress,
        hasOnlyWhitespace: currentAddress.trim().length === 0 && currentAddress.length > 0
      }
    })

    // Validation دقیق
    if (!trimmedName || trimmedName.length === 0) {
      alert('لطفاً نام مشتری را وارد کنید!')
      return
    }
    
    if (!trimmedPhone || trimmedPhone.length === 0) {
      alert('لطفاً شماره تلفن مشتری را وارد کنید!')
      return
    }
    
    if (!trimmedAddress || trimmedAddress.length === 0) {
      alert('لطفاً آدرس تحویل را وارد کنید!')
      // Focus on address field
      const addressField = document.getElementById('customerAddress') as HTMLTextAreaElement
      if (addressField) {
        addressField.focus()
      }
      return
    }

    // بررسی branchId و استفاده از default اگر خالی باشد
    let finalBranchId = branchId
    
    if (!finalBranchId) {
      // تلاش برای دریافت branchId از API
      try {
        const branchResponse = await fetch('/api/branches')
        const branchResult = await branchResponse.json()
        if (branchResult.success && branchResult.data && branchResult.data.length > 0) {
          const activeBranch = branchResult.data.find((b: any) => b.isActive) || branchResult.data[0]
          if (activeBranch && activeBranch._id) {
            finalBranchId = typeof activeBranch._id === 'string' ? activeBranch._id : activeBranch._id.toString()
          }
        }
      } catch (error) {
        console.error('Error fetching branch:', error)
      }
    }

    if (!finalBranchId) {
      alert('هیچ شعبه فعالی یافت نشد. لطفاً ابتدا یک شعبه ایجاد کنید.')
      return
    }
    
    setLoading(true)
    
    try {
      // ساخت deliveryOrder با استفاده از مقادیر trim شده - بررسی مجدد
      const finalDeliveryAddress = trimmedAddress.trim() // trim مجدد برای اطمینان
      
      if (!finalDeliveryAddress || finalDeliveryAddress.length === 0) {
        alert('خطا: آدرس تحویل خالی است. لطفاً دوباره تلاش کنید.')
        setLoading(false)
        return
      }

      const deliveryOrder = {
        orderNumber: `DL-${Date.now().toString().slice(-6)}`,
        branchId: finalBranchId,
        customerName: trimmedName,
        customerPhone: trimmedPhone,
        deliveryAddress: finalDeliveryAddress, // استفاده از trimmed value نهایی
        deliveryFee,
        items: order.map(item => {
          const itemId = item.id || item._id || item.menuItemId
          if (!itemId) {
            console.error('Item missing ID:', item)
            throw new Error(`آیتم ${item.name} شناسه ندارد`)
          }
          return {
            id: itemId,
            menuItemId: itemId,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            notes: item.notes || null
          }
        }),
        subtotal,
        tax,
        serviceCharge,
        discount: discount > 0 ? discount : 0,
        total,
        estimatedDeliveryTime: new Date(Date.now() + calculateEstimatedTime() * 60000).toISOString(),
        status: 'pending',
        notes,
        paymentMethod: paymentMethod as 'cash' | 'card' | 'credit',
        priority: priority as 'normal' | 'urgent',
        deliveryInstructions
      }

      // بررسی نهایی قبل از ارسال
      if (!deliveryOrder.deliveryAddress || deliveryOrder.deliveryAddress.trim().length === 0) {
        console.error('FINAL CHECK FAILED - deliveryAddress is empty!', {
          deliveryOrder,
          trimmedAddress,
          finalDeliveryAddress
        })
        alert('خطا: آدرس تحویل خالی است. لطفاً دوباره تلاش کنید.')
        setLoading(false)
        return
      }

      console.log('Sending delivery order:', { 
        orderNumber: deliveryOrder.orderNumber,
        branchId: deliveryOrder.branchId,
        customerName: deliveryOrder.customerName,
        customerPhone: deliveryOrder.customerPhone,
        deliveryAddress: deliveryOrder.deliveryAddress,
        deliveryAddressType: typeof deliveryOrder.deliveryAddress,
        deliveryAddressLength: deliveryOrder.deliveryAddress?.length,
        deliveryAddressIsEmpty: !deliveryOrder.deliveryAddress || deliveryOrder.deliveryAddress.trim().length === 0,
        deliveryAddressValue: JSON.stringify(deliveryOrder.deliveryAddress),
        itemsCount: deliveryOrder.items.length,
        items: deliveryOrder.items.map((item, itemIndex) => ({ id: item.id || `item-${itemIndex}`, name: item.name, quantity: item.quantity })),
        fullOrder: JSON.stringify(deliveryOrder, null, 2)
      })
      
      // بررسی نهایی قبل از stringify
      const jsonBody = JSON.stringify(deliveryOrder)
      const parsedBack = JSON.parse(jsonBody)
      
      console.log('Before sending - JSON check:', {
        originalDeliveryAddress: deliveryOrder.deliveryAddress,
        jsonStringified: jsonBody,
        parsedBackDeliveryAddress: parsedBack.deliveryAddress,
        parsedBackHasAddress: 'deliveryAddress' in parsedBack,
        parsedBackAddressLength: parsedBack.deliveryAddress?.length
      })
      
      if (!parsedBack.deliveryAddress || parsedBack.deliveryAddress.trim().length === 0) {
        console.error('CRITICAL: deliveryAddress lost in JSON stringify!', {
          before: deliveryOrder.deliveryAddress,
          after: parsedBack.deliveryAddress
        })
        alert('خطا در آماده‌سازی داده‌ها. لطفاً صفحه را refresh کنید و دوباره تلاش کنید.')
        setLoading(false)
        return
      }
      
      // بررسی نهایی قبل از ارسال - اطمینان از وجود deliveryAddress
      const finalCheckObject = JSON.parse(jsonBody)
      if (!finalCheckObject.deliveryAddress || typeof finalCheckObject.deliveryAddress !== 'string' || finalCheckObject.deliveryAddress.trim().length === 0) {
        console.error('❌ FINAL CHECK FAILED - deliveryAddress invalid in final check!', {
          original: deliveryOrder.deliveryAddress,
          originalType: typeof deliveryOrder.deliveryAddress,
          finalCheck: finalCheckObject.deliveryAddress,
          finalCheckType: typeof finalCheckObject.deliveryAddress,
          jsonBody: jsonBody.substring(0, 500)
        })
        alert('خطای داخلی: آدرس تحویل در داده‌ها یافت نشد یا نامعتبر است. لطفاً صفحه را refresh کنید و دوباره تلاش کنید.')
        setLoading(false)
        return
      }
      
      console.log('✅ Final check passed - sending to API:', {
        deliveryAddress: finalCheckObject.deliveryAddress,
        deliveryAddressType: typeof finalCheckObject.deliveryAddress,
        deliveryAddressLength: finalCheckObject.deliveryAddress.length,
        trimmedLength: finalCheckObject.deliveryAddress.trim().length
      })
      
      const response = await fetch('/api/delivery-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: jsonBody
      })

      const result = await response.json()
      
      console.log('Delivery order response status:', response.status)
      console.log('Delivery order response:', result)
      
      if (!response.ok) {
        console.error('Error details:', {
          status: response.status,
          statusText: response.statusText,
          message: result.message,
          error: result.error
        })
      }
      
      if (result.success) {
        const deliveryTime = new Date(deliveryOrder.estimatedDeliveryTime).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
        alert(`سفارش ارسال با موفقیت ثبت شد!\nشماره سفارش: ${deliveryOrder.orderNumber}\nزمان تخمینی تحویل: ${deliveryTime}\nمبلغ کل: ${total.toLocaleString('fa-IR')} تومان`)
        
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
        const errorMsg = result.message || result.error || 'خطای ناشناخته'
        console.error('API Error:', {
          message: errorMsg,
          status: response.status,
          body: result
        })
        alert(`خطا در ثبت سفارش: ${errorMsg}`)
      }
    } catch (error) {
      console.error('Error creating delivery order:', error)
      const errorMessage = error instanceof Error ? error.message : 'خطای ناشناخته'
      alert(`خطا در ثبت سفارش: ${errorMessage}`)
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
          <div key="left-menu-column" className="lg:col-span-2 premium-card p-6">
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
                  {categories.map((category, catIndex) => {
                    const key = category || `category-${catIndex}`
                    return (
                      <option key={key} value={category}>
                        {category === 'all' ? 'همه دسته‌ها' : category}
                      </option>
                    )
                  })}
                </select>
              </div>
            </div>

            {/* Menu Items Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto">
              {filteredMenuItems.map((item, index) => {
                const itemKey = item.id || `menu-item-${index}-${item.name || 'unnamed'}`
                return (
                  <div
                    key={itemKey}
                    className="premium-card p-4 flex flex-col items-center text-center cursor-pointer hover:shadow-glow transition-all duration-300"
                    onClick={() => addToOrder(item)}
                  >
                    <img 
                      src={item.image || `/api/placeholder/80/80`} 
                      alt={item.name} 
                      className="w-20 h-20 rounded-lg object-cover mb-3"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = `/api/placeholder/80/80`
                      }}
                    />
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
                )
              })}
            </div>
          </div>

          {/* Right Column: Order Summary & Checkout */}
          <div key="right-checkout-column" className="lg:col-span-1 premium-card p-6 flex flex-col">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">سفارش ارسال</h2>

            {/* Customer Info */}
            <div className="space-y-4 mb-6">
              <div key="customer-name-field">
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
              <div key="customer-phone-field">
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
              <div key="customer-address-field">
                <label htmlFor="customerAddress" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">آدرس تحویل</label>
                <textarea
                  id="customerAddress"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="آدرس کامل تحویل"
                  rows={3}
                  value={customerAddress}
                  onChange={(e) => {
                    const newValue = e.target.value
                    console.log('Address input changed:', { newValue, length: newValue.length, trimmed: newValue.trim() })
                    setCustomerAddress(newValue)
                  }}
                  onBlur={(e) => {
                    const trimmed = e.target.value.trim()
                    if (trimmed !== customerAddress) {
                      console.log('Address trimmed on blur:', { original: customerAddress, trimmed })
                      setCustomerAddress(trimmed)
                    }
                  }}
                />
              </div>
            </div>

            {/* Order Items */}
            <div className="flex-1 overflow-y-auto mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">
              {order.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">سبد خرید خالی است.</p>
              ) : (
                <div className="space-y-4">
                  {order.map((item, index) => {
                    const orderItemKey = item.uniqueId || `order-item-${index}-${item.id || 'unknown'}`
                    return (
                      <div key={orderItemKey} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
                        <div className="flex items-center space-x-3 space-x-reverse">
                          <img 
                            src={item.image || `/api/placeholder/40/40`} 
                            alt={item.name} 
                            className="w-10 h-10 rounded object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.src = `/api/placeholder/40/40`
                            }}
                          />
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
                    )
                  })}
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
              <div key="subtotal-row" className="flex justify-between text-sm text-gray-700 dark:text-gray-300">
                <span>جمع کل:</span>
                <span>{subtotal.toLocaleString('fa-IR')} تومان</span>
              </div>
              <div key="delivery-fee-row" className="flex justify-between text-sm text-gray-700 dark:text-gray-300">
                <span>هزینه ارسال:</span>
                <span>{deliveryFee.toLocaleString('fa-IR')} تومان</span>
              </div>
              <div key="tax-row" className="flex justify-between text-sm text-gray-700 dark:text-gray-300">
                <span>مالیات ({taxRate * 100}%):</span>
                <span>{tax.toLocaleString('fa-IR')} تومان</span>
              </div>
              <div key="discount-row" className="flex justify-between text-sm text-gray-700 dark:text-gray-300">
                <span>تخفیف:</span>
                <span>-{discount.toLocaleString('fa-IR')} تومان</span>
              </div>
              <div key="total-row" className="flex justify-between text-lg font-bold text-gray-900 dark:text-white border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
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
