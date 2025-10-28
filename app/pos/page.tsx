'use client'

import { useState } from 'react'
import { 
  ShoppingBag, 
  Utensils, 
  Package, 
  ShoppingCart, 
  ChefHat,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  DollarSign,
  Receipt,
  Printer,
  Search,
  Filter,
  Clock,
  User,
  MapPin,
  Phone
} from 'lucide-react'

interface MenuItem {
  id: string
  name: string
  price: number
  category: string
  image: string
  available: boolean
  description: string
}

interface OrderItem {
  id: string
  name: string
  price: number
  quantity: number
  total: number
  notes?: string
}

interface Customer {
  id: string
  name: string
  phone: string
  address?: string
}

const menuItems: MenuItem[] = [
  {
    id: '1',
    name: 'کباب کوبیده',
    price: 85000,
    category: 'غذاهای اصلی',
    image: '/api/placeholder/80/80',
    available: true,
    description: 'کباب کوبیده با برنج و سبزیجات'
  },
  {
    id: '2',
    name: 'قیمه نثار',
    price: 75000,
    category: 'غذاهای اصلی',
    image: '/api/placeholder/80/80',
    available: true,
    description: 'قیمه نثار با برنج و لوبیا'
  },
  {
    id: '3',
    name: 'جوجه کباب',
    price: 90000,
    category: 'غذاهای اصلی',
    image: '/api/placeholder/80/80',
    available: true,
    description: 'جوجه کباب با برنج و سالاد'
  },
  {
    id: '4',
    name: 'قورمه سبزی',
    price: 70000,
    category: 'غذاهای اصلی',
    image: '/api/placeholder/80/80',
    available: false,
    description: 'قورمه سبزی با برنج'
  },
  {
    id: '5',
    name: 'نوشابه',
    price: 15000,
    category: 'نوشیدنی‌ها',
    image: '/api/placeholder/80/80',
    available: true,
    description: 'نوشابه گازدار'
  },
  {
    id: '6',
    name: 'دوغ',
    price: 12000,
    category: 'نوشیدنی‌ها',
    image: '/api/placeholder/80/80',
    available: true,
    description: 'دوغ محلی'
  }
]

const categories = ['همه', 'غذاهای اصلی', 'نوشیدنی‌ها', 'پیش‌غذاها', 'دسرها']

export default function POSPage() {
  const [selectedCategory, setSelectedCategory] = useState('همه')
  const [cart, setCart] = useState<OrderItem[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [orderType, setOrderType] = useState<'dine-in' | 'takeaway' | 'delivery'>('dine-in')
  const [searchTerm, setSearchTerm] = useState('')

  const filteredMenuItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory === 'همه' || item.category === selectedCategory
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch && item.available
  })

  const addToCart = (item: MenuItem) => {
    const existingItem = cart.find(cartItem => cartItem.id === item.id)
    if (existingItem) {
      setCart(cart.map(cartItem =>
        cartItem.id === item.id
          ? { ...cartItem, quantity: cartItem.quantity + 1, total: (cartItem.quantity + 1) * cartItem.price }
          : cartItem
      ))
    } else {
      setCart([...cart, {
        id: item.id,
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
        item.id === id
          ? { ...item, quantity, total: quantity * item.price }
          : item
      ))
    }
  }

  const removeFromCart = (id: string) => {
    setCart(cart.filter(item => item.id !== id))
  }

  const getSubtotal = () => {
    return cart.reduce((sum, item) => sum + item.total, 0)
  }

  const getTax = () => {
    return getSubtotal() * 0.09 // 9% tax
  }

  const getTotal = () => {
    return getSubtotal() + getTax()
  }

  const processOrder = () => {
    // Process order logic here
    console.log('Processing order:', { cart, customer: selectedCustomer, orderType })
    setCart([])
    setSelectedCustomer(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/80 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold gradient-text mb-2">فروش غذا (POS)</h1>
          <p className="text-gray-600 dark:text-gray-300">ثبت سفارش و فاکتور فروش</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Menu Section */}
          <div className="lg:col-span-2">
            {/* Order Type Selection */}
            <div className="premium-card p-4 mb-6">
              <div className="flex items-center space-x-4 space-x-reverse">
                <button
                  onClick={() => setOrderType('dine-in')}
                  className={`flex items-center space-x-2 space-x-reverse px-4 py-2 rounded-lg transition-all duration-300 ${
                    orderType === 'dine-in'
                      ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <Utensils className="w-4 h-4" />
                  <span>حضوری</span>
                </button>
                <button
                  onClick={() => setOrderType('takeaway')}
                  className={`flex items-center space-x-2 space-x-reverse px-4 py-2 rounded-lg transition-all duration-300 ${
                    orderType === 'takeaway'
                      ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <Package className="w-4 h-4" />
                  <span>بیرون‌بر</span>
                </button>
                <button
                  onClick={() => setOrderType('delivery')}
                  className={`flex items-center space-x-2 space-x-reverse px-4 py-2 rounded-lg transition-all duration-300 ${
                    orderType === 'delivery'
                      ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>ارسال</span>
                </button>
              </div>
            </div>

            {/* Search and Filter */}
            <div className="premium-card p-4 mb-6">
              <div className="flex items-center space-x-4 space-x-reverse">
                <div className="flex-1 relative">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="جستجو در منو..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Filter className="w-5 h-5 text-gray-400" />
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Menu Items Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredMenuItems.map((item) => (
                <div
                  key={item.id}
                  className="premium-card p-4 cursor-pointer hover:shadow-glow hover:scale-105 transition-all duration-300"
                  onClick={() => addToCart(item)}
                >
                  <div className="w-full h-24 bg-gray-200 dark:bg-gray-700 rounded-lg mb-3 flex items-center justify-center">
                    <span className="text-gray-500 dark:text-gray-400 text-sm">تصویر</span>
                  </div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-1">{item.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{item.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
                      {item.price.toLocaleString('fa-IR')} تومان
                    </span>
                    <button className="w-8 h-8 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full flex items-center justify-center hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-colors">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cart Section */}
          <div className="lg:col-span-1">
            <div className="premium-card p-6 sticky top-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">سبد خرید</h2>

              {/* Customer Info */}
              <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="flex items-center space-x-2 space-x-reverse mb-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">مشتری:</span>
                </div>
                {selectedCustomer ? (
                  <div>
                    <p className="text-sm text-gray-900 dark:text-white">{selectedCustomer.name}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-300">{selectedCustomer.phone}</p>
                  </div>
                ) : (
                  <button className="text-sm text-primary-600 dark:text-primary-400 hover:underline">
                    انتخاب مشتری
                  </button>
                )}
              </div>

              {/* Cart Items */}
              <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center space-x-3 space-x-reverse p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{item.name}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-300">
                        {item.price.toLocaleString('fa-IR')} تومان
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-6 h-6 bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-full flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-sm font-medium text-gray-900 dark:text-white w-6 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-6 h-6 bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-full flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="w-6 h-6 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Order Summary */}
              {cart.length > 0 && (
                <div className="border-t border-gray-200 dark:border-gray-600/30 pt-4">
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-300">جمع کل:</span>
                      <span className="text-gray-900 dark:text-white">
                        {getSubtotal().toLocaleString('fa-IR')} تومان
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-300">مالیات (9%):</span>
                      <span className="text-gray-900 dark:text-white">
                        {getTax().toLocaleString('fa-IR')} تومان
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-lg font-bold border-t border-gray-200 dark:border-gray-600/30 pt-2">
                      <span className="text-gray-900 dark:text-white">مجموع:</span>
                      <span className="text-primary-600 dark:text-primary-400">
                        {getTotal().toLocaleString('fa-IR')} تومان
                      </span>
                    </div>
                  </div>

                  {/* Payment Methods */}
                  <div className="space-y-2 mb-4">
                    <button className="w-full flex items-center justify-center space-x-2 space-x-reverse py-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors">
                      <DollarSign className="w-5 h-5" />
                      <span>پرداخت نقدی</span>
                    </button>
                    <button className="w-full flex items-center justify-center space-x-2 space-x-reverse py-3 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors">
                      <CreditCard className="w-5 h-5" />
                      <span>پرداخت کارتی</span>
                    </button>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    <button
                      onClick={processOrder}
                      className="w-full py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                    >
                      ثبت سفارش
                    </button>
                    <button className="w-full flex items-center justify-center space-x-2 space-x-reverse py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
                      <Printer className="w-4 h-4" />
                      <span>پرینت رسید</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
