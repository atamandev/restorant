'use client'

import { useState, useEffect } from 'react'
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  ShoppingBag, 
  Clock, 
  Calendar, 
  Download, 
  Printer, 
  Filter, 
  Search, 
  Eye, 
  RefreshCw, 
  FileText, 
  PieChart, 
  LineChart, 
  Star, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Info, 
  Utensils, 
  CreditCard, 
  Receipt, 
  Calculator, 
  Target, 
  Award, 
  Zap,
  Check,
  X,
  Clock3
} from 'lucide-react'

interface DailyStats {
  date: string
  totalSales: number
  totalOrders: number
  totalCustomers: number
  averageOrderValue: number
  cashSales: number
  cardSales: number
  creditSales: number
  refunds: number
  discounts: number
  taxes: number
  serviceCharges: number
  netProfit: number
  topSellingItems: Array<{
    name: string
    quantity: number
    revenue: number
  }>
  hourlySales: Array<{
    hour: string
    sales: number
    orders: number
  }>
  paymentMethods: Array<{
    method: string
    amount: number
    percentage: number
  }>
}

interface OrderSummary {
  _id: string
  orderNumber: string
  customerName: string
  items: Array<{
    name: string
    quantity: number
    price: number
    total: number
  }>
  total: number
  paymentMethod: string
  status: string
  createdAt: string
  tableNumber?: string
}

const sampleDailyStats: DailyStats = {
  date: '1403/01/20',
  totalSales: 12500000,
  totalOrders: 45,
  totalCustomers: 38,
  averageOrderValue: 277777,
  cashSales: 8500000,
  cardSales: 3500000,
  creditSales: 500000,
  refunds: 150000,
  discounts: 300000,
  taxes: 1080000,
  serviceCharges: 1200000,
  netProfit: 10850000,
  topSellingItems: [
    { name: 'کباب کوبیده', quantity: 25, revenue: 3000000 },
    { name: 'جوجه کباب', quantity: 20, revenue: 2700000 },
    { name: 'نوشابه', quantity: 35, revenue: 525000 },
    { name: 'سالاد سزار', quantity: 15, revenue: 675000 },
    { name: 'دوغ محلی', quantity: 18, revenue: 324000 }
  ],
  hourlySales: [
    { hour: '09:00', sales: 450000, orders: 3 },
    { hour: '10:00', sales: 680000, orders: 5 },
    { hour: '11:00', sales: 920000, orders: 7 },
    { hour: '12:00', sales: 1500000, orders: 12 },
    { hour: '13:00', sales: 1800000, orders: 15 },
    { hour: '14:00', sales: 1200000, orders: 10 },
    { hour: '15:00', sales: 950000, orders: 8 },
    { hour: '16:00', sales: 780000, orders: 6 },
    { hour: '17:00', sales: 1100000, orders: 9 },
    { hour: '18:00', sales: 1400000, orders: 11 },
    { hour: '19:00', sales: 1600000, orders: 13 },
    { hour: '20:00', sales: 1350000, orders: 10 },
    { hour: '21:00', sales: 980000, orders: 8 },
    { hour: '22:00', sales: 720000, orders: 6 }
  ],
  paymentMethods: [
    { method: 'نقدی', amount: 8500000, percentage: 68 },
    { method: 'کارتخوان', amount: 3500000, percentage: 28 },
    { method: 'اعتباری', amount: 500000, percentage: 4 }
  ]
}

// Sample orders will be loaded from API

export default function DailyReportPage() {
  const [mounted, setMounted] = useState(false)
  const [dailyStats, setDailyStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    totalCustomers: 0,
    salesChange: 0,
    ordersChange: 0,
    customersChange: 0,
    cashSales: 0,
    cardSales: 0,
    creditSales: 0,
    refunds: 0,
    discounts: 0,
    taxes: 0,
    serviceCharges: 0,
    netSales: 0,
    netProfit: 0,
    profitRate: 0,
    topSellingItems: [] as Array<{ name: string; quantity: number; revenue: number }>,
    hourlySales: [] as Array<{ hour: string; sales: number; orders: number }>
  })
  const [stats, setStats] = useState<DailyStats>(sampleDailyStats)
  const [orders, setOrders] = useState<OrderSummary[]>([])
  const [todayCustomers, setTodayCustomers] = useState<Array<{
    customerId: string | null
    customerPhone: string | null
    customerName: string
    customerNumber: string
    phone: string
    email: string
    address: string
    orderCount: number
    totalSpent: number
    totalOrders: number
    customerType: string
    firstOrderTime: Date
    lastOrderTime: Date
  }>>([])
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPayment, setFilterPayment] = useState('all')
  const [viewMode, setViewMode] = useState<'summary' | 'detailed'>('summary')
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  // Load daily stats from orders (real-time)
  const loadDailyStats = async () => {
    try {
      setRefreshing(true)
      const response = await fetch(`/api/daily-report/stats?date=${selectedDate}`)
      const result = await response.json()
      if (result.success && result.data) {
        setDailyStats({
          totalSales: result.data.totalSales || 0,
          totalOrders: result.data.totalOrders || 0,
          totalCustomers: result.data.totalCustomers || 0,
          salesChange: result.data.salesChange || 0,
          ordersChange: result.data.ordersChange || 0,
          customersChange: result.data.customersChange || 0,
          cashSales: result.data.cashSales || 0,
          cardSales: result.data.cardSales || 0,
          creditSales: result.data.creditSales || 0,
          refunds: result.data.refunds || 0,
          discounts: result.data.discounts || 0,
          taxes: result.data.taxes || 0,
          serviceCharges: result.data.serviceCharges || 0,
          netSales: result.data.netSales || 0,
          netProfit: result.data.netProfit || 0,
          profitRate: result.data.profitRate || 0,
          topSellingItems: result.data.topSellingItems || [],
          hourlySales: result.data.hourlySales || []
        })
      }
    } catch (error) {
      console.error('Error loading daily stats:', error)
    } finally {
      setRefreshing(false)
    }
  }

  // Load orders from orders collection (real-time) - فقط سفارشات امروز
  const loadOrders = async () => {
    try {
      // ساخت تاریخ دقیق برای امروز (بر اساس selectedDate)
      const selectedDateObj = new Date(selectedDate + 'T00:00:00')
      const startOfDay = new Date(selectedDateObj)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(selectedDateObj)
      endOfDay.setHours(23, 59, 59, 999)

      console.log('[DAILY_REPORT] Loading orders for date:', selectedDate, {
        start: startOfDay.toISOString(),
        end: endOfDay.toISOString(),
        startLocal: startOfDay.toLocaleString('fa-IR'),
        endLocal: endOfDay.toLocaleString('fa-IR')
      })

      const response = await fetch(`/api/orders?startDate=${startOfDay.toISOString()}&endDate=${endOfDay.toISOString()}&limit=1000`)
      const result = await response.json()
      if (result.success && result.data) {
        console.log('[DAILY_REPORT] Received orders from API:', result.data.length)
        
        // تبدیل به فرمت مورد نیاز و فیلتر دقیق فقط امروز
        const formattedOrders = result.data
          .map((order: any) => {
            // استخراج تاریخ سفارش
            let orderDate: Date | null = null
            if (order.orderTime) {
              orderDate = typeof order.orderTime === 'string' ? new Date(order.orderTime) : new Date(order.orderTime)
            } else if (order.createdAt) {
              orderDate = typeof order.createdAt === 'string' ? new Date(order.createdAt) : new Date(order.createdAt)
            }
            
            if (!orderDate || isNaN(orderDate.getTime())) {
              console.log('[DAILY_REPORT] Invalid date for order:', order.orderNumber)
              return null
            }
            
            // مقایسه فقط روز (بدون ساعت)
            const orderDateStr = orderDate.toISOString().split('T')[0]
            const selectedDateStr = selectedDate
            
            console.log('[DAILY_REPORT] Order date check:', {
              orderNumber: order.orderNumber,
              orderDate: orderDate.toISOString(),
              orderDateStr,
              selectedDateStr,
              matches: orderDateStr === selectedDateStr
            })
            
            // اگر تاریخ سفارش با تاریخ انتخاب شده مطابقت نداشت، فیلتر کن
            if (orderDateStr !== selectedDateStr) {
              return null
            }
            
            // همچنین بررسی کن که در محدوده زمانی باشد
            if (orderDate < startOfDay || orderDate > endOfDay) {
              return null
            }
            
            return {
              _id: order._id?.toString() || '',
              orderNumber: order.orderNumber || '',
              customerName: order.customerName || 'مشتری ناشناس',
              items: order.items || [],
              total: order.total || 0,
              paymentMethod: order.paymentMethod || 'cash',
              status: order.status || 'pending',
              createdAt: order.orderTime || order.createdAt || new Date().toISOString(),
              tableNumber: order.tableNumber
            }
          })
          .filter((order: any) => order !== null) // حذف سفارشات null
        
        console.log('[DAILY_REPORT] Filtered orders for selected date:', formattedOrders.length)
        
        // مرتب‌سازی بر اساس تاریخ (جدیدترین اول)
        formattedOrders.sort((a: any, b: any) => {
          const dateA = new Date(a.createdAt).getTime()
          const dateB = new Date(b.createdAt).getTime()
          return dateB - dateA
        })
        setOrders(formattedOrders)
      }
    } catch (error) {
      console.error('Error loading orders:', error)
    }
  }

  // Load daily report from API (for other stats)
  const loadDailyReport = async () => {
    try {
      const response = await fetch(`/api/daily-reports?dateFrom=${selectedDate}&dateTo=${selectedDate}&limit=1`)
      const result = await response.json()
      if (result.success && result.data.length > 0) {
        const report = result.data[0]
        setStats({
          date: selectedDate,
          totalSales: report.totalSales || dailyStats.totalSales,
          totalOrders: report.totalOrders || dailyStats.totalOrders,
          totalCustomers: report.totalCustomers || dailyStats.totalCustomers,
          averageOrderValue: report.averageOrderValue || 0,
          cashSales: report.cashSales || 0,
          cardSales: report.cardSales || 0,
          creditSales: report.creditSales || 0,
          refunds: report.refunds || 0,
          discounts: report.discounts || 0,
          taxes: report.taxes || 0,
          serviceCharges: report.serviceCharges || 0,
          netProfit: report.netProfit || 0,
          topSellingItems: report.topSellingItems || [],
          hourlySales: report.hourlySales || [],
          paymentMethods: report.paymentMethods || []
        })
      } else {
        // اگر گزارش موجود نباشد، از آمار روزانه استفاده کن
        const avgOrderValue = dailyStats.totalOrders > 0 
          ? dailyStats.totalSales / dailyStats.totalOrders 
          : 0
        setStats({
          ...stats,
          totalSales: dailyStats.totalSales,
          totalOrders: dailyStats.totalOrders,
          totalCustomers: dailyStats.totalCustomers,
          averageOrderValue: avgOrderValue
        })
      }
    } catch (error) {
      console.error('Error loading daily report:', error)
    }
  }

  // Load today's customers (real-time)
  const loadTodayCustomers = async () => {
    try {
      const response = await fetch(`/api/daily-report/customers?date=${selectedDate}`)
      const result = await response.json()
      if (result.success && result.data) {
        setTodayCustomers(result.data)
      }
    } catch (error) {
      console.error('Error loading today customers:', error)
    }
  }

  // Load all data
  const loadAllData = async () => {
    await Promise.all([
      loadDailyStats(),
      loadOrders(),
      loadDailyReport(),
      loadTodayCustomers()
    ])
  }

  // Set mounted to true after component mounts on client
  useEffect(() => {
    setMounted(true)
  }, [])

  // Load data on component mount and when date changes
  useEffect(() => {
    if (mounted) {
      loadAllData()
    }
  }, [selectedDate, mounted])

  // Real-time update every 3 minutes (بهینه شده - کاهش بار سرور)
  useEffect(() => {
    if (!mounted) return
    
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        loadAllData()
      }
    }, 180000) // 3 دقیقه - بهبود عملکرد

    return () => clearInterval(interval)
  }, [selectedDate, mounted])

  // فیلتر سفارشات - فقط سفارشات امروز (بر اساس selectedDate)
  const filteredOrders = orders.filter(order => {
    // بررسی تاریخ سفارش - فقط سفارشات امروز (مقایسه فقط روز)
    const orderDate = new Date(order.createdAt)
    if (isNaN(orderDate.getTime())) {
      return false
    }
    
    // تبدیل به string برای مقایسه فقط روز
    const orderDateStr = orderDate.toISOString().split('T')[0]
    const selectedDateStr = selectedDate
    
    // اگر تاریخ سفارش با تاریخ انتخاب شده مطابقت نداشت، فیلتر کن
    if (orderDateStr !== selectedDateStr) {
      return false
    }
    
    // فیلتر وضعیت
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus
    
    // فیلتر روش پرداخت (هم انگلیسی و هم فارسی)
    let matchesPayment = false
    if (filterPayment === 'all') {
      matchesPayment = true
    } else {
      const paymentLower = (order.paymentMethod || '').toLowerCase()
      if (filterPayment === 'cash' || filterPayment === 'نقدی') {
        matchesPayment = paymentLower === 'cash' || paymentLower === 'نقدی'
      } else if (filterPayment === 'card' || filterPayment === 'کارتخوان') {
        matchesPayment = paymentLower === 'card' || paymentLower === 'کارتخوان'
      } else if (filterPayment === 'credit' || filterPayment === 'اعتباری') {
        matchesPayment = paymentLower === 'credit' || paymentLower === 'اعتباری'
      } else {
        matchesPayment = order.paymentMethod === filterPayment
      }
    }
    
    return matchesStatus && matchesPayment
  })

  const getGrowthRate = (current: number, previous: number) => {
    if (previous === 0) return 0
    return ((current - previous) / previous) * 100
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
      case 'pending': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
      case 'cancelled': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
    }
  }

  const getPaymentMethodColor = (method: string) => {
    switch (method) {
      case 'نقدی': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
      case 'کارتخوان': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
      case 'اعتباری': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleExport = () => {
    alert('گزارش با موفقیت صادر شد!')
  }

  const handleRefresh = () => {
    loadAllData()
  }

  // تایید یا رد سفارش
  const handleConfirmOrder = async (orderId: string, status: 'completed' | 'cancelled', notes?: string) => {
    try {
      const response = await fetch('/api/daily-orders/confirm', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: orderId,
          status: status,
          notes: notes
        })
      })

      const result = await response.json()
      
      if (result.success) {
        // به‌روزرسانی لیست سفارشات
        loadOrders()
        alert(result.message)
      } else {
        alert('خطا در تایید سفارش: ' + result.message)
      }
    } catch (error) {
      console.error('Error confirming order:', error)
      alert('خطا در تایید سفارش')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/80 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold gradient-text mb-2">گزارش روزانه</h1>
              <p className="text-gray-600 dark:text-gray-300">خلاصه فعالیت‌ها و فروش روزانه</p>
            </div>
            <div className="flex items-center space-x-3 space-x-reverse">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <button
                onClick={handleRefresh}
                className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>به‌روزرسانی</span>
              </button>
              <button
                onClick={handleExport}
                className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>صادر کردن</span>
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Printer className="w-4 h-4" />
                <span>چاپ</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Stats - Real-time */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="premium-card p-6 relative">
            {refreshing && (
              <div className="absolute top-2 right-2">
                <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
              </div>
            )}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">کل فروش</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {mounted ? `${dailyStats.totalSales.toLocaleString('fa-IR')} تومان` : '۰ تومان'}
                </p>
                {mounted && (
                <div className="flex items-center space-x-1 space-x-reverse mt-1">
                    {dailyStats.salesChange >= 0 ? (
                      <>
                  <TrendingUp className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-green-600 dark:text-green-400">
                          +{dailyStats.salesChange.toFixed(1)}%
                        </span>
                      </>
                    ) : (
                      <>
                        <TrendingDown className="w-4 h-4 text-red-500" />
                        <span className="text-sm text-red-600 dark:text-red-400">
                          {dailyStats.salesChange.toFixed(1)}%
                        </span>
                      </>
                    )}
                </div>
                )}
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
          <div className="premium-card p-6 relative">
            {refreshing && (
              <div className="absolute top-2 right-2">
                <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
              </div>
            )}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">تعداد سفارشات</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {mounted ? String(dailyStats.totalOrders) : '۰'}
                </p>
                {mounted && (
                <div className="flex items-center space-x-1 space-x-reverse mt-1">
                    {dailyStats.ordersChange >= 0 ? (
                      <>
                  <TrendingUp className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-green-600 dark:text-green-400">
                          +{dailyStats.ordersChange.toFixed(1)}%
                        </span>
                      </>
                    ) : (
                      <>
                        <TrendingDown className="w-4 h-4 text-red-500" />
                        <span className="text-sm text-red-600 dark:text-red-400">
                          {dailyStats.ordersChange.toFixed(1)}%
                        </span>
                      </>
                    )}
                </div>
                )}
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
          <div className="premium-card p-6 relative">
            {refreshing && (
              <div className="absolute top-2 right-2">
                <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
              </div>
            )}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">تعداد مشتریان</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {mounted ? String(dailyStats.totalCustomers) : '۰'}
                </p>
                {mounted && (
                <div className="flex items-center space-x-1 space-x-reverse mt-1">
                    {dailyStats.customersChange >= 0 ? (
                      <>
                  <TrendingUp className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-green-600 dark:text-green-400">
                          +{dailyStats.customersChange.toFixed(1)}%
                        </span>
                      </>
                    ) : (
                      <>
                        <TrendingDown className="w-4 h-4 text-red-500" />
                        <span className="text-sm text-red-600 dark:text-red-400">
                          {dailyStats.customersChange.toFixed(1)}%
                        </span>
                      </>
                    )}
                </div>
                )}
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Financial Breakdown - Real-time */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="premium-card p-6 relative">
            {refreshing && (
              <div className="absolute top-2 right-2">
                <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
              </div>
            )}
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">تجزیه فروش</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">فروش نقدی</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {mounted ? `${dailyStats.cashSales.toLocaleString('fa-IR')} تومان` : '۰ تومان'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">فروش کارتخوان</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {mounted ? `${dailyStats.cardSales.toLocaleString('fa-IR')} تومان` : '۰ تومان'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">فروش اعتباری</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {mounted ? `${dailyStats.creditSales.toLocaleString('fa-IR')} تومان` : '۰ تومان'}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-600/30 pt-2">
                <span className="font-medium text-gray-900 dark:text-white">کل فروش</span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {mounted ? `${dailyStats.totalSales.toLocaleString('fa-IR')} تومان` : '۰ تومان'}
                </span>
              </div>
            </div>
          </div>
          <div className="premium-card p-6 relative">
            {refreshing && (
              <div className="absolute top-2 right-2">
                <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
              </div>
            )}
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">کسرها</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">مرجوعی‌ها</span>
                <span className="font-semibold text-red-600 dark:text-red-400">
                  {mounted ? `-${dailyStats.refunds.toLocaleString('fa-IR')} تومان` : '-۰ تومان'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">تخفیف‌ها</span>
                <span className="font-semibold text-red-600 dark:text-red-400">
                  {mounted ? `-${dailyStats.discounts.toLocaleString('fa-IR')} تومان` : '-۰ تومان'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">مالیات</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {mounted ? `${dailyStats.taxes.toLocaleString('fa-IR')} تومان` : '۰ تومان'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">حق سرویس</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {mounted ? `${dailyStats.serviceCharges.toLocaleString('fa-IR')} تومان` : '۰ تومان'}
                </span>
              </div>
            </div>
          </div>
          <div className="premium-card p-6 relative">
            {refreshing && (
              <div className="absolute top-2 right-2">
                <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
              </div>
            )}
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">خلاصه مالی</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">فروش خالص</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {mounted ? `${dailyStats.netSales.toLocaleString('fa-IR')} تومان` : '۰ تومان'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">سود خالص</span>
                <span className="font-bold text-green-600 dark:text-green-400">
                  {mounted ? `${dailyStats.netProfit.toLocaleString('fa-IR')} تومان` : '۰ تومان'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">نرخ سود</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {mounted && !isNaN(dailyStats.profitRate) && isFinite(dailyStats.profitRate) 
                    ? dailyStats.profitRate.toFixed(1) 
                    : '۰'}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Top Selling Items - Real-time */}
        <div className="premium-card p-6 mb-8 relative">
          {refreshing && (
            <div className="absolute top-2 right-2">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
            </div>
          )}
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">پرفروش‌ترین آیتم‌ها</h3>
          {!mounted ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              در حال بارگذاری...
            </div>
          ) : dailyStats.topSellingItems.length > 0 ? (
          <div className="space-y-4">
              {dailyStats.topSellingItems.map((item, index) => (
                <div key={`item-${index}-${item.name}`} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-primary-600 dark:text-primary-400">#{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{item.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{item.quantity} فروش</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900 dark:text-white">
                    {item.revenue.toLocaleString('fa-IR')} تومان
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                      {dailyStats.totalSales > 0 
                        ? ((item.revenue / dailyStats.totalSales) * 100).toFixed(1) 
                        : '۰'}% از کل فروش
                  </p>
                </div>
              </div>
            ))}
          </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              هیچ آیتمی یافت نشد
            </div>
          )}
        </div>

        {/* Hourly Sales Chart - Real-time */}
        <div className="premium-card p-6 mb-8 relative">
          {refreshing && (
            <div className="absolute top-2 right-2">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
            </div>
          )}
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">فروش ساعتی</h3>
          {!mounted ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              در حال بارگذاری...
            </div>
          ) : dailyStats.hourlySales.length > 0 ? (
          <div className="grid grid-cols-7 gap-2">
              {dailyStats.hourlySales.map((hour, index) => {
                const maxSales = Math.max(...dailyStats.hourlySales.map(h => h.sales), 1)
                const heightPercentage = maxSales > 0 ? (hour.sales / maxSales) * 100 : 0
                return (
                  <div key={`hour-${index}-${hour.hour}`} className="text-center">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">{hour.hour}</div>
                <div 
                      className="bg-primary-100 dark:bg-primary-900/30 rounded-t-lg mx-auto transition-all duration-300"
                  style={{ 
                        height: `${Math.max(heightPercentage, 5)}px`,
                    minHeight: '20px',
                    width: '20px'
                  }}
                ></div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {hour.sales > 0 ? (hour.sales >= 1000000 
                        ? `${(hour.sales / 1000000).toFixed(1)}M`
                        : hour.sales >= 1000
                        ? `${(hour.sales / 1000).toFixed(1)}K`
                        : hour.sales.toLocaleString('fa-IR')
                      ) : '۰'}
                </div>
              </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              هیچ داده‌ای یافت نشد
            </div>
          )}
        </div>

        {/* Today's Customers - Real-time */}
        <div className="premium-card p-6 mb-8 relative">
          {refreshing && (
            <div className="absolute top-2 right-2">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
            </div>
          )}
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            مشتریان امروز{mounted && <span> ({todayCustomers.length})</span>}
          </h3>
          {!mounted ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              در حال بارگذاری...
            </div>
          ) : todayCustomers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-600/30">
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">نام مشتری</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">شماره تماس</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">تعداد سفارشات</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">مجموع خرید</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">نوع مشتری</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">اولین سفارش</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">آخرین سفارش</th>
                  </tr>
                </thead>
                <tbody>
                  {todayCustomers.map((customer, index) => (
                    <tr key={`customer-${index}-${customer.customerId || customer.customerPhone || customer.customerName}`} className="border-b border-gray-100 dark:border-gray-700/30 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="py-4 px-4">
                        <span className="font-medium text-gray-900 dark:text-white">{customer.customerName}</span>
                        {customer.customerNumber && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 block">{customer.customerNumber}</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-gray-900 dark:text-white">{customer.phone || 'ندارد'}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-gray-900 dark:text-white">{customer.orderCount}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-bold text-gray-900 dark:text-white">
                          {customer.totalSpent.toLocaleString('fa-IR')} تومان
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          customer.customerType === 'gold' || customer.customerType === 'طلایی' 
                            ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                            : customer.customerType === 'silver' || customer.customerType === 'نقره‌ای'
                            ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                            : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        }`}>
                          {customer.customerType === 'gold' || customer.customerType === 'طلایی' ? 'طلایی' :
                           customer.customerType === 'silver' || customer.customerType === 'نقره‌ای' ? 'نقره‌ای' :
                           'عادی'}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-gray-900 dark:text-white text-sm">
                          {new Date(customer.firstOrderTime).toLocaleTimeString('fa-IR', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-gray-900 dark:text-white text-sm">
                          {new Date(customer.lastOrderTime).toLocaleTimeString('fa-IR', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
          </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              هیچ مشتریی یافت نشد
            </div>
          )}
        </div>

        {/* Orders List - Real-time */}
        <div className="premium-card p-6 relative">
          {refreshing && (
            <div className="absolute top-2 right-2">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
            </div>
          )}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              لیست سفارشات{mounted && <span> ({filteredOrders.length})</span>}
            </h3>
            <div className="flex items-center space-x-4 space-x-reverse">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">همه وضعیت‌ها</option>
                <option value="pending">در انتظار</option>
                <option value="confirmed">تایید شده</option>
                <option value="preparing">در حال آماده‌سازی</option>
                <option value="ready">آماده</option>
                <option value="completed">تکمیل شده</option>
                <option value="paid">پرداخت شده</option>
                <option value="delivered">تحویل داده شده</option>
                <option value="cancelled">لغو شده</option>
              </select>
              <select
                value={filterPayment}
                onChange={(e) => setFilterPayment(e.target.value)}
                className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">همه روش‌ها</option>
                <option value="cash">نقدی</option>
                <option value="card">کارتخوان</option>
                <option value="credit">اعتباری</option>
                <option value="نقدی">نقدی</option>
                <option value="کارتخوان">کارتخوان</option>
                <option value="اعتباری">اعتباری</option>
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-600/30">
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">شماره سفارش</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">زمان</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">مشتری</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">تعداد آیتم</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">مبلغ</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">روش پرداخت</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">وضعیت</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {!mounted ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center">
                      <div className="flex items-center justify-center space-x-2 space-x-reverse">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span className="text-gray-600 dark:text-gray-400">در حال بارگذاری...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center">
                      <span className="text-gray-600 dark:text-gray-400">هیچ سفارشی یافت نشد</span>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map(order => (
                    <tr key={order._id} className="border-b border-gray-100 dark:border-gray-700/30 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="py-4 px-4">
                        <span className="font-medium text-gray-900 dark:text-white">{order.orderNumber}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-gray-900 dark:text-white">
                          {new Date(order.createdAt).toLocaleTimeString('fa-IR', { 
                            hour: '2-digit', 
                            minute: '2-digit',
                            second: '2-digit'
                          })}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-gray-900 dark:text-white">{order.customerName}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-gray-900 dark:text-white">{order.items.length}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-bold text-gray-900 dark:text-white">
                          {order.total.toLocaleString('fa-IR')} تومان
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentMethodColor(order.paymentMethod)}`}>
                          {order.paymentMethod === 'cash' ? 'نقدی' : order.paymentMethod === 'card' ? 'کارتخوان' : order.paymentMethod === 'credit' ? 'اعتباری' : order.paymentMethod}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {order.status === 'pending' ? 'در انتظار' : 
                           order.status === 'confirmed' ? 'تایید شده' :
                           order.status === 'preparing' ? 'در حال آماده‌سازی' :
                           order.status === 'ready' ? 'آماده' :
                           order.status === 'completed' ? 'تکمیل شده' :
                           order.status === 'paid' ? 'پرداخت شده' :
                           order.status === 'delivered' ? 'تحویل داده شده' :
                           order.status === 'cancelled' ? 'لغو شده' :
                           order.status}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          {order.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleConfirmOrder(order._id, 'completed')}
                                className="flex items-center space-x-1 space-x-reverse px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                                title="تایید سفارش"
                              >
                                <Check className="w-4 h-4" />
                                <span className="text-xs">تایید</span>
                              </button>
                              <button
                                onClick={() => handleConfirmOrder(order._id, 'cancelled')}
                                className="flex items-center space-x-1 space-x-reverse px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                                title="رد سفارش"
                              >
                                <X className="w-4 h-4" />
                                <span className="text-xs">رد</span>
                              </button>
                            </>
                          )}
                          {order.status === 'completed' && (
                            <span className="flex items-center space-x-1 space-x-reverse text-green-600 dark:text-green-400">
                              <CheckCircle className="w-4 h-4" />
                              <span className="text-xs">تایید شده</span>
                            </span>
                          )}
                          {order.status === 'cancelled' && (
                            <span className="flex items-center space-x-1 space-x-reverse text-red-600 dark:text-red-400">
                              <XCircle className="w-4 h-4" />
                              <span className="text-xs">رد شده</span>
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
