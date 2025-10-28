'use client'

import { useState, useEffect } from 'react'
import { 
  Utensils, 
  Users, 
  Clock, 
  DollarSign, 
  ShoppingBag, 
  Plus, 
  Minus, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Search, 
  Filter, 
  Printer, 
  Eye, 
  Edit, 
  Save, 
  X, 
  AlertCircle, 
  Info, 
  Star, 
  Package, 
  ChefHat, 
  Coffee, 
  Pizza, 
  IceCream, 
  MapPin, 
  Phone, 
  User, 
  CreditCard, 
  Receipt,
  Loader2
} from 'lucide-react'

interface MenuItem {
  _id?: string
  id?: string
  name: string
  price: number
  category: string
  image?: string
  preparationTime: number
  isAvailable?: boolean
}

interface OrderItem extends MenuItem {
  quantity: number
  notes?: string
}

interface Table {
  _id?: string
  id?: string
  number: string
  capacity: number
  status: 'available' | 'occupied' | 'reserved'
  location?: string
  currentOrder?: TableOrder
}

interface TableOrder {
  _id?: string
  id?: string
  tableNumber: string
  customerName?: string
  customerPhone?: string
  items: OrderItem[]
  subtotal: number
  tax: number
  serviceCharge: number
  discount: number
  total: number
  orderTime: string
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed'
  notes?: string
  paymentMethod: 'cash' | 'card' | 'credit'
  createdAt?: Date | string
}

export default function TableOrderPage() {
  const [tables, setTables] = useState<Table[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const [showOrderForm, setShowOrderForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [currentOrder, setCurrentOrder] = useState<TableOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [orderForm, setOrderForm] = useState({
    customerName: '',
    customerPhone: '',
    notes: '',
    paymentMethod: 'cash' as 'cash' | 'card' | 'credit'
  })

  // دریافت لیست میزها
  const fetchTables = async () => {
    try {
      const response = await fetch('/api/tables')
      const data = await response.json()
      
      if (data.success) {
        setTables(data.data)
      } else {
        setError(data.message || 'خطا در دریافت لیست میزها')
      }
    } catch (error) {
      console.error('Error fetching tables:', error)
      setError('خطا در اتصال به سرور')
    }
  }

  // دریافت لیست آیتم‌های منو
  const fetchMenuItems = async () => {
    try {
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
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([fetchTables(), fetchMenuItems()])
      setLoading(false)
    }
    loadData()
  }, [])

  const categories = ['all', ...Array.from(new Set(menuItems.map(item => item.category)))]

  const filteredMenuItems = menuItems.filter(item =>
    (selectedCategory === 'all' || item.category === selectedCategory) &&
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    item.isAvailable !== false
  )

  const getTableStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
      case 'occupied': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
      case 'reserved': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
    }
  }

  const getTableStatusText = (status: string) => {
    switch (status) {
      case 'available': return 'خالی'
      case 'occupied': return 'اشغال'
      case 'reserved': return 'رزرو'
      default: return 'نامشخص'
    }
  }

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
      case 'confirmed': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
      case 'preparing': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
      case 'ready': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
      case 'completed': return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
    }
  }

  const getOrderStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'در انتظار'
      case 'confirmed': return 'تایید شده'
      case 'preparing': return 'در حال آماده‌سازی'
      case 'ready': return 'آماده'
      case 'completed': return 'تکمیل شده'
      default: return 'نامشخص'
    }
  }

  const addToOrder = (item: MenuItem) => {
    if (!currentOrder) {
      const newOrder: TableOrder = {
        tableNumber: selectedTable?.number || '',
        customerName: orderForm.customerName,
        customerPhone: orderForm.customerPhone,
        items: [{ ...item, quantity: 1 }],
        subtotal: item.price,
        tax: item.price * 0.09,
        serviceCharge: item.price * 0.10,
        discount: 0,
        total: item.price * 1.19,
        orderTime: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
        status: 'pending',
        notes: orderForm.notes,
        paymentMethod: orderForm.paymentMethod
      }
      setCurrentOrder(newOrder)
    } else {
      const existingItem = currentOrder.items.find(orderItem => orderItem.id === (item._id || item.id))
      if (existingItem) {
        setCurrentOrder(prev => prev ? {
          ...prev,
          items: prev.items.map(orderItem =>
            orderItem.id === (item._id || item.id) ? { ...orderItem, quantity: orderItem.quantity + 1 } : orderItem
          )
        } : null)
      } else {
        setCurrentOrder(prev => prev ? {
          ...prev,
          items: [...prev.items, { ...item, quantity: 1 }]
        } : null)
      }
    }
  }

  const updateQuantity = (itemId: string, delta: number) => {
    if (!currentOrder) return
    
    setCurrentOrder(prev => prev ? {
      ...prev,
      items: prev.items.map(item =>
        item.id === itemId ? { ...item, quantity: item.quantity + delta } : item
      ).filter(item => item.quantity > 0)
    } : null)
  }

  const removeItem = (itemId: string) => {
    if (!currentOrder) return
    
    setCurrentOrder(prev => prev ? {
      ...prev,
      items: prev.items.filter(item => item.id !== itemId)
    } : null)
  }

  const calculateTotals = (order: TableOrder) => {
    const subtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const tax = subtotal * 0.09
    const serviceCharge = subtotal * 0.10
    const discount = 0
    const total = subtotal + tax + serviceCharge - discount
    
    return { subtotal, tax, serviceCharge, discount, total }
  }

  const saveOrder = async () => {
    if (!currentOrder || !selectedTable) return
    
    try {
      setSaving(true)
      setError('')

      const totals = calculateTotals(currentOrder)
      const finalOrder = { ...currentOrder, ...totals }

      console.log('Saving table order:', finalOrder)

      const response = await fetch('/api/table-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(finalOrder),
      })

      const data = await response.json()

      console.log('Table order response:', data)

      if (data.success) {
        // Update table status to occupied
        await fetchTables()
        setCurrentOrder(null)
        setSelectedTable(null)
        setShowOrderForm(false)
        setOrderForm({
          customerName: '',
          customerPhone: '',
          notes: '',
          paymentMethod: 'cash'
        })
        alert('سفارش با موفقیت ثبت شد!')
      } else {
        setError(data.message || 'خطا در ثبت سفارش')
      }
    } catch (error) {
      console.error('Error saving order:', error)
      setError('خطا در اتصال به سرور')
    } finally {
      setSaving(false)
    }
  }

  const getTotalTables = () => tables.length
  const getAvailableTables = () => tables.filter(table => table.status === 'available').length
  const getOccupiedTables = () => tables.filter(table => table.status === 'occupied').length
  const getReservedTables = () => tables.filter(table => table.status === 'reserved').length

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/80 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">در حال بارگذاری...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/80 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold gradient-text mb-2">ثبت سفارش میز</h1>
          <p className="text-gray-600 dark:text-gray-300">مدیریت سفارشات میزهای رستوران</p>
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

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="premium-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">کل میزها</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{getTotalTables()}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <Utensils className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
          <div className="premium-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">میزهای خالی</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{getAvailableTables()}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
          <div className="premium-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">میزهای اشغال</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{getOccupiedTables()}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </div>
          <div className="premium-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">میزهای رزرو</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{getReservedTables()}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tables Section */}
          <div className="lg:col-span-1 premium-card p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">میزهای رستوران</h2>
            <div className="grid grid-cols-2 gap-4">
              {tables.length === 0 ? (
                <div className="col-span-2 text-center py-8">
                  <Utensils className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">هیچ میزی تعریف نشده است</p>
                </div>
              ) : (
                tables.map(table => (
                  <button
                    key={table._id || table.id}
                    onClick={() => {
                      setSelectedTable(table)
                      if (table.currentOrder) {
                        setCurrentOrder(table.currentOrder)
                      } else {
                        setCurrentOrder(null)
                      }
                    }}
                    className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                      selectedTable?.id === table.id || selectedTable?._id === table._id
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                        : 'border-gray-200 dark:border-gray-600 hover:border-primary-300 dark:hover:border-primary-600'
                    }`}
                  >
                    <div className="text-center">
                      <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <Utensils className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">میز {table.number}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{table.capacity} نفر</p>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTableStatusColor(table.status)}`}>
                        {getTableStatusText(table.status)}
                      </span>
                      {table.currentOrder && (
                        <div className="mt-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getOrderStatusColor(table.currentOrder.status)}`}>
                            {getOrderStatusText(table.currentOrder.status)}
                          </span>
                        </div>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Menu and Order Section */}
          <div className="lg:col-span-2 premium-card p-6">
            {selectedTable ? (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    سفارش میز {selectedTable.number}
                  </h2>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <button
                      onClick={() => setShowOrderForm(true)}
                      className="premium-button flex items-center space-x-2 space-x-reverse"
                    >
                      <Plus className="w-4 h-4" />
                      <span>سفارش جدید</span>
                    </button>
                    {currentOrder && (
                      <button
                        onClick={saveOrder}
                        disabled={saving}
                        className="premium-button bg-green-500 hover:bg-green-600 flex items-center space-x-2 space-x-reverse disabled:opacity-50"
                      >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        <span>ذخیره سفارش</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Current Order */}
                {currentOrder && (
                  <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">سفارش جاری</h3>
                    <div className="space-y-3">
                      {currentOrder.items.map(item => (
                        <div key={item.id} className="flex items-center justify-between bg-white dark:bg-gray-700 p-3 rounded-lg">
                          <div className="flex items-center space-x-3 space-x-reverse">
                            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded flex items-center justify-center">
                              <Package className="w-5 h-5 text-gray-500" />
                            </div>
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
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                      <div className="flex items-center justify-between text-lg font-bold text-gray-900 dark:text-white">
                        <span>مبلغ نهایی:</span>
                        <span>{calculateTotals(currentOrder).total.toLocaleString('fa-IR')} تومان</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Menu Items */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white">منوی رستوران</h3>
                    <div className="flex items-center space-x-4 space-x-reverse">
                      <div className="relative">
                        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="text"
                          placeholder="جستجو..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="premium-input w-64 pr-10"
                        />
                      </div>
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="premium-input"
                      >
                        {categories.map(category => (
                          <option key={category} value={category}>
                            {category === 'all' ? 'همه دسته‌ها' : category}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                    {filteredMenuItems.length === 0 ? (
                      <div className="col-span-full text-center py-8">
                        <Package className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">هیچ آیتمی یافت نشد</p>
                      </div>
                    ) : (
                      filteredMenuItems.map(item => (
                        <div
                          key={item._id || item.id}
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                          onClick={() => addToOrder(item)}
                        >
                          <div className="flex items-center space-x-3 space-x-reverse">
                            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded flex items-center justify-center">
                              <Package className="w-6 h-6 text-gray-500" />
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900 dark:text-white">{item.name}</h4>
                              <p className="text-sm text-gray-500 dark:text-gray-400">{item.category}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{item.preparationTime} دقیقه</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-gray-900 dark:text-white">
                              {item.price.toLocaleString('fa-IR')} تومان
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Utensils className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">میز را انتخاب کنید</h3>
                <p className="text-gray-600 dark:text-gray-400">برای شروع سفارش، ابتدا یک میز انتخاب کنید</p>
              </div>
            )}
          </div>
        </div>

        {/* Order Form Modal */}
        {showOrderForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">اطلاعات سفارش</h3>
                <button
                  onClick={() => setShowOrderForm(false)}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    نام مشتری
                  </label>
                  <input
                    type="text"
                    value={orderForm.customerName}
                    onChange={(e) => setOrderForm({...orderForm, customerName: e.target.value})}
                    className="premium-input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    تلفن مشتری
                  </label>
                  <input
                    type="tel"
                    value={orderForm.customerPhone}
                    onChange={(e) => setOrderForm({...orderForm, customerPhone: e.target.value})}
                    className="premium-input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    روش پرداخت
                  </label>
                  <select
                    value={orderForm.paymentMethod}
                    onChange={(e) => setOrderForm({...orderForm, paymentMethod: e.target.value as 'cash' | 'card' | 'credit'})}
                    className="premium-input w-full"
                  >
                    <option value="cash">نقدی</option>
                    <option value="card">کارتخوان</option>
                    <option value="credit">اعتباری</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    یادداشت
                  </label>
                  <textarea
                    value={orderForm.notes}
                    onChange={(e) => setOrderForm({...orderForm, notes: e.target.value})}
                    className="premium-input w-full"
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex items-center justify-end space-x-3 space-x-reverse mt-6">
                <button
                  onClick={() => setShowOrderForm(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                >
                  انصراف
                </button>
                <button
                  onClick={() => {
                    setShowOrderForm(false)
                    setCurrentOrder({
                      tableNumber: selectedTable?.number || '',
                      customerName: orderForm.customerName,
                      customerPhone: orderForm.customerPhone,
                      items: [],
                      subtotal: 0,
                      tax: 0,
                      serviceCharge: 0,
                      discount: 0,
                      total: 0,
                      orderTime: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
                      status: 'pending',
                      notes: orderForm.notes,
                      paymentMethod: orderForm.paymentMethod
                    })
                  }}
                  className="premium-button flex items-center space-x-2 space-x-reverse"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>شروع سفارش</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}