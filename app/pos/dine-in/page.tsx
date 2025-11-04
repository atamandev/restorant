'use client'

import { useState, useEffect } from 'react'
import { useMenuItems } from '@/hooks/useMenuItems'
import { 
  Utensils, 
  Users, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  CheckCircle, 
  DollarSign, 
  CreditCard, 
  Receipt, 
  Clock, 
  User, 
  Phone, 
  MapPin, 
  Save, 
  X, 
  Info, 
  Star, 
  ChefHat, 
  Package, 
  Edit,
  Square,
  Home,
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

interface Table {
  id: string
  number: string
  capacity: number
  status: 'available' | 'occupied' | 'reserved'
  currentOrder?: DineInOrder
}

interface DineInOrder {
  _id: string
  orderNumber: string
  tableNumber: string
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
  createdAt: string
  updatedAt: string
}

const initialTables: Table[] = [
  { id: '1', number: '1', capacity: 2, status: 'available' },
  { id: '2', number: '2', capacity: 4, status: 'occupied', currentOrder: {
    id: '1',
    orderNumber: 'DI-001',
    tableNumber: '2',
    customerName: 'احمد محمدی',
    customerPhone: '09123456789',
    items: [
      { id: '1', name: 'کباب کوبیده', price: 120000, category: 'غذاهای اصلی', image: '/api/placeholder/60/60', preparationTime: 25, description: 'کباب کوبیده سنتی با گوشت گوساله تازه', quantity: 2, notes: 'بدون پیاز' },
      { id: '4', name: 'نوشابه', price: 15000, category: 'نوشیدنی‌ها', image: '/api/placeholder/60/60', preparationTime: 2, description: 'نوشابه گازدار سرد', quantity: 2 }
    ],
    subtotal: 270000,
    tax: 24300,
    serviceCharge: 27000,
    discount: 0,
    total: 321300,
    orderTime: '14:30',
    estimatedReadyTime: '15:00',
    status: 'preparing',
    notes: 'میز 2 - مشتری منتظر است',
    paymentMethod: 'cash',
    priority: 'normal'
  }},
  { id: '3', number: '3', capacity: 6, status: 'available' },
  { id: '4', number: '4', capacity: 2, status: 'occupied', currentOrder: {
    id: '2',
    orderNumber: 'DI-002',
    tableNumber: '4',
    customerName: 'سارا کریمی',
    customerPhone: '09123456790',
    items: [
      { id: '2', name: 'جوجه کباب', price: 135000, category: 'غذاهای اصلی', image: '/api/placeholder/60/60', preparationTime: 20, description: 'جوجه کباب با سینه مرغ تازه و سس مخصوص', quantity: 1 },
      { id: '5', name: 'دوغ محلی', price: 18000, category: 'نوشیدنی‌ها', image: '/api/placeholder/60/60', preparationTime: 3, description: 'دوغ محلی تازه و خنک', quantity: 1 }
    ],
    subtotal: 153000,
    tax: 13770,
    serviceCharge: 15300,
    discount: 10000,
    total: 172070,
    orderTime: '14:25',
    estimatedReadyTime: '14:50',
    status: 'ready',
    notes: 'میز 4 - آماده تحویل',
    paymentMethod: 'card',
    priority: 'normal'
  }},
  { id: '5', number: '5', capacity: 4, status: 'reserved' },
  { id: '6', number: '6', capacity: 8, status: 'available' },
  { id: '7', number: '7', capacity: 2, status: 'available' },
  { id: '8', number: '8', capacity: 4, status: 'available' },
]

export default function DineInPage() {
  const [tables, setTables] = useState<Table[]>(initialTables)
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
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
  const [loading, setLoading] = useState(false)
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [dineInOrders, setDineInOrders] = useState<DineInOrder[]>([])
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

  useEffect(() => {
    // تبدیل فرمت به فرمت مورد نیاز component
    const formattedItems = loadedMenuItems.map(item => ({
      id: item._id || item.id || '',
      name: item.name,
      price: item.price,
      category: item.category,
      image: item.image || '/api/placeholder/60/60',
      preparationTime: item.preparationTime || 15,
      description: item.description || ''
    }))
    setMenuItems(formattedItems)
  }, [loadedMenuItems])

  // Load dine-in orders from API
  const loadDineInOrders = async () => {
    try {
      const response = await fetch('/api/dine-in-orders')
      const result = await response.json()
      if (result.success) {
        setDineInOrders(result.data)
        // Update tables with current orders
        updateTablesWithOrders(result.data)
      } else {
        console.error('Error loading dine-in orders:', result.message)
      }
    } catch (error) {
      console.error('Error loading dine-in orders:', error)
    }
  }

  // Update tables with current orders
  const updateTablesWithOrders = (orders: DineInOrder[]) => {
    setTables(prevTables => 
      prevTables.map(table => {
        const currentOrder = orders.find(order => 
          order.tableNumber === table.number && 
          ['pending', 'preparing', 'ready'].includes(order.status)
        )
        return {
          ...table,
          status: currentOrder ? 'occupied' : 'available',
          currentOrder: currentOrder || undefined
        }
      })
    )
  }

  // Load data on component mount
  useEffect(() => {
    loadDineInOrders()
  }, [])

  // Menu items از hook مشترک load می‌شوند

  // دریافت دسته‌بندی‌ها از menu items
  const categories = ['all', ...Array.from(new Set(menuItems.map(item => item.category))).filter(Boolean)]

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
    return maxPreparationTime + (totalQuantity * 2)
  }

  const subtotal = order.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const taxRate = 0.09
  const tax = subtotal * taxRate
  const serviceChargeRate = 0.10 // 10% service charge for dine-in
  const serviceCharge = subtotal * serviceChargeRate
  const total = subtotal + tax + serviceCharge - discount

  const handleCheckout = async () => {
    if (order.length === 0) {
      alert('سبد خرید خالی است!')
      return
    }
    
    if (!selectedTable) {
      alert('لطفاً یک میز انتخاب کنید!')
      return
    }
    
    if (!customerName || !customerPhone) {
      alert('لطفاً نام و شماره تلفن مشتری را وارد کنید!')
      return
    }
    
    setLoading(true)
    
    try {
      const dineInOrder = {
        orderNumber: `DI-${Date.now().toString().slice(-6)}`,
        branchId: branchId || undefined, // API will find default if not provided
        tableNumber: selectedTable.number,
        customerName,
        customerPhone,
        items: order,
        subtotal,
        tax,
        serviceCharge,
        discount,
        total,
        estimatedReadyTime: new Date(Date.now() + calculateEstimatedTime() * 60000).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
        status: 'pending',
        notes,
        paymentMethod: paymentMethod as 'cash' | 'card' | 'credit',
        priority: priority as 'normal' | 'urgent'
      }

      const response = await fetch('/api/dine-in-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dineInOrder)
      })

      const result = await response.json()
      
      if (!response.ok) {
        console.error('API Error:', result)
        alert(`خطا در ثبت سفارش: ${result.message || result.error || 'خطای ناشناخته'}`)
        setLoading(false)
        return
      }
      
      if (result.success) {
        // Update table status
        setTables(tables.map(table => 
          table.id === selectedTable.id 
            ? { ...table, status: 'occupied' as const, currentOrder: result.data }
            : table
        ))
        
        alert(`سفارش حضوری با موفقیت ثبت شد!\nشماره سفارش: ${dineInOrder.orderNumber}\nمیز: ${dineInOrder.tableNumber}\nزمان آماده‌سازی: ${dineInOrder.estimatedReadyTime}\nمبلغ کل: ${total.toLocaleString('fa-IR')} تومان`)
        
        // Reset form
        setOrder([])
        setCustomerName('')
        setCustomerPhone('')
        setDiscount(0)
        setNotes('')
        setPaymentMethod('cash')
        setPriority('normal')
        setSelectedTable(null)
        
        // Reload orders
        loadDineInOrders()
      } else {
        alert('خطا در ثبت سفارش: ' + result.message)
      }
    } catch (error) {
      console.error('Error creating dine-in order:', error)
      alert('خطا در ثبت سفارش')
    } finally {
      setLoading(false)
    }
  }

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
      case 'preparing': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
      case 'ready': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
      case 'completed': return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
    }
  }

  const getOrderStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'در انتظار'
      case 'preparing': return 'در حال آماده‌سازی'
      case 'ready': return 'آماده'
      case 'completed': return 'تکمیل شده'
      default: return 'نامشخص'
    }
  }

  const getTotalTables = () => tables.length
  const getAvailableTables = () => tables.filter(table => table.status === 'available').length
  const getOccupiedTables = () => tables.filter(table => table.status === 'occupied').length
  const getReservedTables = () => tables.filter(table => table.status === 'reserved').length

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/80 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold gradient-text mb-2">سفارش حضوری</h1>
          <p className="text-gray-600 dark:text-gray-300">ثبت سفارشات حضوری برای میزهای رستوران</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="premium-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">کل میزها</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{getTotalTables()}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <Square className="w-6 h-6 text-blue-600 dark:text-blue-400" />
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

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Tables Section */}
          <div className="lg:col-span-1">
            <div className="premium-card p-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-0 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
                  میزهای رستوران
                </h2>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">آنلاین</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {tables.map(table => (
                  <button
                    key={table.id}
                    onClick={() => {
                      setSelectedTable(table)
                      if (table.currentOrder) {
                        // Add uniqueId to items if they don't have it
                        const itemsWithUniqueId = table.currentOrder.items.map((item: OrderItem) => ({
                          ...item,
                          uniqueId: item.uniqueId || `${item.id}-${Date.now()}-${Math.random()}`
                        }))
                        setOrder(itemsWithUniqueId)
                        setCustomerName(table.currentOrder.customerName)
                        setCustomerPhone(table.currentOrder.customerPhone)
                        setNotes(table.currentOrder.notes)
                        setPaymentMethod(table.currentOrder.paymentMethod)
                        setPriority(table.currentOrder.priority)
                      } else {
                        setOrder([])
                        setCustomerName('')
                        setCustomerPhone('')
                        setNotes('')
                        setPaymentMethod('cash')
                        setPriority('normal')
                      }
                    }}
                    className={`group relative overflow-hidden rounded-2xl transition-all duration-500 transform hover:scale-105 aspect-square ${
                      selectedTable?.id === table.id
                        ? 'ring-4 ring-primary-500/50 shadow-2xl bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/50 dark:to-primary-800/50'
                        : 'hover:shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm'
                    }`}
                  >
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary-400 to-purple-400"></div>
                    </div>
                    
                    <div className="relative p-4 h-full flex flex-col justify-between">
                      <div className="text-center">
                        {/* Table Number Badge */}
                        <div className={`w-14 h-14 mx-auto mb-3 rounded-xl flex items-center justify-center transition-all duration-300 ${
                          table.status === 'available' 
                            ? 'bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 group-hover:from-primary-100 group-hover:to-primary-200 dark:group-hover:from-primary-800/30 dark:group-hover:to-primary-700/30' 
                            : table.status === 'occupied'
                            ? 'bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 group-hover:from-primary-100 group-hover:to-primary-200 dark:group-hover:from-primary-800/30 dark:group-hover:to-primary-700/30'
                            : 'bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 group-hover:from-primary-100 group-hover:to-primary-200 dark:group-hover:from-primary-800/30 dark:group-hover:to-primary-700/30'
                        }`}>
                          <span className={`text-base font-bold transition-colors duration-300 ${
                            table.status === 'available' 
                              ? 'text-primary-600 dark:text-primary-400' 
                              : table.status === 'occupied'
                              ? 'text-primary-600 dark:text-primary-400'
                              : 'text-primary-600 dark:text-primary-400'
                          }`}>
                            {table.number}
                          </span>
                        </div>
                        
                        {/* Table Number */}
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-300">
                          میز {table.number}
                        </h3>
                        
                        {/* Capacity */}
                        <div className="flex items-center justify-center space-x-1 space-x-reverse mb-3">
                          <Users className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                            {table.capacity} نفر
                          </span>
                        </div>
                      </div>
                      
                      {/* Status Section */}
                      <div className="flex flex-col items-center space-y-1">
                        {/* Status Badge */}
                        <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wide transition-all duration-300 ${
                          table.status === 'available' 
                            ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/25' 
                            : table.status === 'occupied'
                            ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/25'
                            : 'bg-gradient-to-r from-gray-500 to-slate-500 text-white shadow-lg shadow-gray-500/25'
                        }`}>
                          {getTableStatusText(table.status)}
                        </span>
                        
                        {/* Order Status */}
                        {table.currentOrder && (
                          <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wide transition-all duration-300 ${
                            table.currentOrder.status === 'pending'
                              ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-white shadow-lg shadow-yellow-500/25'
                              : table.currentOrder.status === 'preparing'
                              ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/25'
                              : table.currentOrder.status === 'ready'
                              ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/25'
                              : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25'
                          }`}>
                            {getOrderStatusText(table.currentOrder.status)}
                          </span>
                        )}
                      </div>
                      
                      {/* Hover Effect */}
                      <div className="absolute inset-0 bg-gradient-to-br from-primary-500/0 to-purple-500/0 group-hover:from-primary-500/5 group-hover:to-purple-500/5 transition-all duration-500 rounded-2xl"></div>
                    </div>
                  </button>
                ))}
              </div>
              
              {/* Table Summary */}
              <div className="mt-6 p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl backdrop-blur-sm">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {tables.filter(t => t.status === 'available').length}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">آزاد</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {tables.filter(t => t.status === 'occupied').length}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">اشغال</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                      {tables.filter(t => t.status === 'reserved').length}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">رزرو</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Menu and Order Section */}
          <div className="lg:col-span-3 premium-card p-6">
            {selectedTable ? (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    سفارش میز {selectedTable.number}
                  </h2>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <button
                      onClick={() => setShowOrderForm(true)}
                      className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>سفارش جدید</span>
                    </button>
                    <button
                      onClick={handleCheckout}
                      disabled={loading}
                      className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4" />
                      )}
                      <span>{loading ? 'در حال ثبت...' : 'ثبت سفارش'}</span>
                    </button>
                  </div>
                </div>

                {/* Current Order */}
                {order.length > 0 && (
                  <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">سفارش جاری</h3>
                    <div className="space-y-3">
                      {order.map((item, index) => (
                        <div key={item.uniqueId || `order-item-${index}-${item.id}`} className="flex items-center justify-between bg-white dark:bg-gray-700 p-3 rounded-lg">
                          <div className="flex items-center space-x-3 space-x-reverse">
                            <img 
                              src={item.image || `/api/placeholder/${60}/${60}`} 
                              alt={item.name} 
                              className="w-10 h-10 rounded object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = `/api/placeholder/${60}/${60}`
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
                      ))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                      <div className="flex items-center justify-between text-lg font-bold text-gray-900 dark:text-white">
                        <span>مبلغ نهایی:</span>
                        <span>{total.toLocaleString('fa-IR')} تومان</span>
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                    {filteredMenuItems.map(item => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                        onClick={() => addToOrder(item)}
                      >
                        <div className="flex items-center space-x-3 space-x-reverse">
                          <img 
                            src={item.image || `/api/placeholder/${60}/${60}`} 
                            alt={item.name} 
                            className="w-12 h-12 rounded object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = `/api/placeholder/${60}/${60}`
                            }}
                          />
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
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Square className="w-16 h-16 text-gray-400 mx-auto mb-4" />
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
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">اطلاعات سفارش</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    نام مشتری
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    تلفن مشتری
                  </label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    تخفیف (تومان)
                  </label>
                  <input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    روش پرداخت
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                    setOrder([])
                  }}
                  className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
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
