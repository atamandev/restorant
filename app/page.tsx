'use client'

import { useState, useEffect, useCallback, useMemo, useTransition } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'

// Lazy load heavy chart components
const LineChart = dynamic(
  () => import('@/components/Charts/LineChart'),
  {
    loading: () => <div className="w-full h-80 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>,
    ssr: false
  }
)

const PieChart = dynamic(
  () => import('@/components/Charts/PieChart'),
  {
    loading: () => <div className="w-full h-80 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>,
    ssr: false
  }
)
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Star,
  ChefHat,
  ShoppingCart,
  Package,
  Clock,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  Activity,
  CreditCard,
  Receipt,
  FileText,
  Printer,
  Eye,
  RefreshCw,
  Download,
  TrendingDown,
  Database,
  Shield,
  Wifi,
  Sun,
  Bell,
  Server
} from 'lucide-react'

// Helper functions
const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
    case 'paid': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
    case 'overdue': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
    case 'sent': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
    case 'in_hand': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
    case 'deposited': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
    case 'cleared': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
    case 'returned': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'pending': return 'در انتظار'
    case 'paid': return 'پرداخت شده'
    case 'overdue': return 'سررسید گذشته'
    case 'sent': return 'ارسال شده'
    case 'in_hand': return 'در دست'
    case 'deposited': return 'واریز شده'
    case 'cleared': return 'پاس شده'
    case 'returned': return 'برگشت خورده'
    default: return status
  }
}

const getNotificationColor = (type: string) => {
  switch (type) {
    case 'success': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
    case 'warning': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
    case 'error': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
    case 'info': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
  }
}

export default function Dashboard() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [loading, setLoading] = useState(false) // تغییر به false برای نمایش فوری داشبورد
  const [refreshing, setRefreshing] = useState(false)
  
  // Dashboard data
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [summaryData, setSummaryData] = useState<any>(null)
  const [salesChartData, setSalesChartData] = useState<any[]>([])
  const [paymentMethodsData, setPaymentMethodsData] = useState<any[]>([])
  const [topMenuItems, setTopMenuItems] = useState<any[]>([])
  const [recentInvoices, setRecentInvoices] = useState<any[]>([])
  const [recentCheques, setRecentCheques] = useState<any[]>([])
  const [notifications, setNotifications] = useState<any[]>([])
  const [chartPeriod, setChartPeriod] = useState<'today' | 'month' | '6months' | 'year'>('month')
  const [activeCustomersCount, setActiveCustomersCount] = useState(0)
  const [newCustomersThisMonth, setNewCustomersThisMonth] = useState(0)
  const [isPending, startTransition] = useTransition()

  // Cache key for sessionStorage
  const getCacheKey = (key: string, period?: string) => `dashboard_${key}_${period || chartPeriod}`
  const CACHE_DURATION = 120000 // 2 minutes cache (increased)

  // Fetch dashboard data - optimized with caching and reduced API calls
  const fetchDashboardData = useCallback(async (period?: 'today' | 'month' | '6months' | 'year', forceRefresh = false) => {
    const selectedPeriod = period || chartPeriod
    try {
      setRefreshing(true)
      
      // Check cache first (unless force refresh)
      if (!forceRefresh && typeof window !== 'undefined') {
        try {
          const cached = sessionStorage.getItem(getCacheKey('main', selectedPeriod))
          if (cached) {
            const { data, timestamp } = JSON.parse(cached)
            if (Date.now() - timestamp < CACHE_DURATION) {
              // Batch state updates using startTransition
              startTransition(() => {
                setDashboardData(data.dashboard)
                setSummaryData(data.summary)
                setSalesChartData(data.salesChart || [])
                setPaymentMethodsData(data.paymentMethods || [])
                setTopMenuItems(data.topMenuItems || [])
                setRecentInvoices(data.recentInvoices || [])
                setRecentCheques(data.recentCheques || [])
                setNotifications(data.notifications || [])
                setActiveCustomersCount(data.activeCustomersCount || 0)
                setNewCustomersThisMonth(data.newCustomersThisMonth || 0)
              })
              setRefreshing(false)
              return
            }
          }
        } catch {
          // Ignore cache errors
        }
      }
      
      // Build sales API URL based on selected period
      let salesApiUrl = '/api/sales-reports?reportType=daily'
      switch (selectedPeriod) {
        case 'today':
          salesApiUrl += '&dateRange=day&period=hourly'
          break
        case 'month':
          salesApiUrl += '&dateRange=month&period=daily'
          break
        case '6months':
          salesApiUrl += '&dateRange=6months&period=monthly'
          break
        case 'year':
          salesApiUrl += '&dateRange=year&period=monthly'
          break
      }

      // Reduced API calls - only essential ones
      const [
        dashboardRes,
        ordersSalesRes,
        paymentRes,
        topItemsRes,
        invoicesRes,
        chequesRes,
        alertsRes,
        customersRes
      ] = await Promise.allSettled([
        fetch('/api/dashboard', { cache: 'default' }), // Use default cache
        fetch(`/api/orders/sales?period=${selectedPeriod}`, { cache: 'default' }),
        fetch('/api/sales-reports?reportType=payment&dateRange=month', { cache: 'default' }),
        fetch('/api/reports/top-menu-items?limit=5', { cache: 'default' }),
        fetch('/api/invoices?limit=5&type=sales&sortBy=createdAt&sortOrder=desc', { cache: 'default' }),
        fetch('/api/cheques?limit=5&sortBy=createdAt&sortOrder=desc', { cache: 'default' }),
        fetch('/api/stock-alerts?status=active&limit=5', { cache: 'default' }),
        fetch('/api/customers?status=active&limit=50', { cache: 'default' })
      ])

      // Process all responses in parallel and batch state updates
      const processResponse = (res: any) => {
        if (res.status === 'fulfilled') {
          try {
            return res.value.json()
          } catch {
            return Promise.resolve({ success: false })
          }
        }
        return Promise.resolve({ success: false })
      }

      // Process all responses in parallel
      const [
        dashboardResult,
        ordersResult,
        paymentResult,
        topItemsResult,
        invoicesResult,
        chequesResult,
        alertsResult,
        customersResult
      ] = await Promise.all([
        processResponse(dashboardRes),
        processResponse(ordersSalesRes),
        processResponse(paymentRes),
        processResponse(topItemsRes),
        processResponse(invoicesRes),
        processResponse(chequesRes),
        processResponse(alertsRes),
        processResponse(customersRes)
      ])

      // Prepare all data before state updates
      const dashboardDataResult = dashboardResult.success ? dashboardResult.data : null
      const summaryDataResult = dashboardDataResult
      
      const monthNames = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند']
      const salesChartDataResult = ordersResult.success && ordersResult.data && Array.isArray(ordersResult.data) && ordersResult.data.length > 0
        ? ordersResult.data.map((item: any) => ({
            label: item.label || item.period || item.month || '',
            month: item.label || item.period || item.month || '',
            sales: item.totalSales || item.sales || item.amount || 0,
            profit: item.totalProfit || item.profit || ((item.totalSales || item.sales || item.amount || 0) * 0.3)
          }))
        : []

      const paymentMethodsDataResult = paymentResult.success && Array.isArray(paymentResult.data) ? paymentResult.data : []
      const topMenuItemsResult = topItemsResult.success && topItemsResult.data ? topItemsResult.data : []
      const recentInvoicesResult = invoicesResult.success && invoicesResult.data ? invoicesResult.data : []
      const recentChequesResult = chequesResult.success && chequesResult.data ? chequesResult.data : []
      
      const notificationsResult = alertsResult.success && Array.isArray(alertsResult.data)
        ? alertsResult.data.map((alert: any) => ({
            id: alert._id || alert.id,
            title: 'موجودی کم',
            message: `موجودی ${alert.itemName || 'آیتم'} کمتر از حد مجاز است`,
            time: alert.createdAt ? new Date(alert.createdAt).toLocaleString('fa-IR') : 'نامشخص',
            type: 'warning',
            icon: AlertTriangle
          }))
        : []

      let activeCustomersCountResult = 0
      let newCustomersThisMonthResult = 0
      if (customersResult.success && Array.isArray(customersResult.data)) {
        activeCustomersCountResult = customersResult.data.length || 0
        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        newCustomersThisMonthResult = customersResult.data.filter((customer: any) => {
          if (!customer.registrationDate) return false
          const regDate = new Date(customer.registrationDate)
          return regDate >= startOfMonth
        }).length
      }

      // Batch all state updates using startTransition for better performance
      startTransition(() => {
        if (dashboardDataResult) {
          setDashboardData(dashboardDataResult)
          setSummaryData(summaryDataResult)
        }
        setSalesChartData(salesChartDataResult)
        setPaymentMethodsData(paymentMethodsDataResult)
        setTopMenuItems(topMenuItemsResult)
        setRecentInvoices(recentInvoicesResult)
        setRecentCheques(recentChequesResult)
        setNotifications(notificationsResult)
        setActiveCustomersCount(activeCustomersCountResult)
        setNewCustomersThisMonth(newCustomersThisMonthResult)
      })

      // Save to cache after processing
      if (typeof window !== 'undefined' && dashboardDataResult) {
        try {
          const cacheData = {
            dashboard: dashboardDataResult,
            summary: summaryDataResult,
            salesChart: salesChartDataResult,
            paymentMethods: paymentMethodsDataResult,
            topMenuItems: topMenuItemsResult,
            recentInvoices: recentInvoicesResult,
            recentCheques: recentChequesResult,
            notifications: notificationsResult,
            activeCustomersCount: activeCustomersCountResult,
            newCustomersThisMonth: newCustomersThisMonthResult
          }
          sessionStorage.setItem(getCacheKey('main', selectedPeriod), JSON.stringify({
            data: cacheData,
            timestamp: Date.now()
          }))
        } catch {
          // Ignore cache errors
        }
      }
    } catch (error) {
      // Silent error handling
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [chartPeriod])

  // همه hookها (useState, useEffect, useMemo) باید قبل از هر early return باشند
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      fetchDashboardData(chartPeriod, false) // Use cache if available
    }
  }, [user, chartPeriod]) // Removed fetchDashboardData from deps to prevent unnecessary re-renders

  useEffect(() => {
    // Update time every 30 seconds (reduced from 1 second)
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date())
    }, 30000)

    return () => {
      clearInterval(timeInterval)
    }
  }, [])

  // Auto-refresh every 10 minutes (increased from 5 minutes)
  useEffect(() => {
    if (!user) return
    
    const refreshInterval = setInterval(() => {
      if (!refreshing && document.visibilityState === 'visible') {
        fetchDashboardData(undefined, true) // Force refresh
      }
    }, 600000) // 10 minutes

    return () => {
      clearInterval(refreshInterval)
    }
  }, [user, fetchDashboardData, refreshing])

  // Prepare stats data from API - باید قبل از early return باشد
  const statsData = useMemo(() => {
    // اگر dashboardData وجود ندارد، از summaryData استفاده کن
    const data = dashboardData || summaryData
    
    if (!data) {
      return []
    }
    
    // محاسبه فروش امروز
    const todaySales = data.todaySales || data.totalSales || { amount: 0, change: 0 }
    const todaySalesAmount = typeof todaySales === 'object' ? (todaySales.amount || 0) : (todaySales || 0)
    const todaySalesChange = typeof todaySales === 'object' ? (todaySales.change || 0) : 0
    
    // محاسبه سود ناخالص
    const grossProfit = data.grossProfit || {}
    const grossProfitAmount = grossProfit.grossProfit || grossProfit.profit || 0
    // اطمینان از اینکه grossMargin یک number است
    let grossMargin = grossProfit.grossMargin || grossProfit.margin || 0
    if (typeof grossMargin === 'string') {
      grossMargin = parseFloat(grossMargin) || 0
    }
    grossMargin = Number(grossMargin) || 0
    
    // محاسبه سود خالص امروز
    const todayNetProfit = data.todayNetProfit?.amount || 0
    
    // محاسبه موجودی کم
    const inventoryAlerts = data.inventoryAlerts || {}
    const activeAlerts = inventoryAlerts.activeAlerts || inventoryAlerts.totalAlerts || 0
    const criticalAlerts = inventoryAlerts.critical || []
    
    return [
      {
        title: 'فروش امروز',
        value: (Number(todaySalesAmount) || 0).toLocaleString('fa-IR'),
        currency: 'تومان',
        change: typeof todaySalesChange === 'number' && !isNaN(todaySalesChange) ? `${todaySalesChange >= 0 ? '+' : ''}${todaySalesChange.toFixed(1)}%` : '0%',
        changeType: (Number(todaySalesChange) || 0) >= 0 ? 'positive' : 'negative',
        icon: TrendingUp,
        color: 'from-emerald-500 to-green-600',
        glowColor: 'shadow-glow-green'
      },
      {
        title: 'سود ناخالص',
        value: (Number(grossProfitAmount) || 0).toLocaleString('fa-IR'),
        currency: 'تومان',
        change: typeof grossMargin === 'number' && !isNaN(grossMargin) ? `${grossMargin.toFixed(1)}%` : '0%',
        changeType: 'positive',
        icon: TrendingUp,
        color: 'from-blue-500 to-indigo-600',
        glowColor: 'shadow-glow-blue'
      },
      {
        title: 'سود خالص امروز',
        value: (Number(todayNetProfit) || 0).toLocaleString('fa-IR'),
        currency: 'تومان',
        change: todayNetProfit > 0 ? 'مثبت' : todayNetProfit < 0 ? 'منفی' : 'صفر',
        changeType: todayNetProfit > 0 ? 'positive' : todayNetProfit < 0 ? 'negative' : 'neutral',
        icon: DollarSign,
        color: 'from-green-500 to-emerald-600',
        glowColor: 'shadow-glow-green'
      },
      {
        title: 'مشتریان فعال',
        value: activeCustomersCount.toLocaleString('fa-IR'),
        currency: 'نفر',
        change: newCustomersThisMonth > 0 ? `+${newCustomersThisMonth} این ماه` : '0',
        changeType: 'positive',
        icon: Users,
        color: 'from-purple-500 to-violet-600',
        glowColor: 'shadow-glow-purple'
      },
      {
        title: 'موجودی کم',
        value: activeAlerts.toLocaleString('fa-IR'),
        currency: 'آیتم',
        change: criticalAlerts.length > 0 ? `${criticalAlerts.length} بحرانی` : 'خوب',
        changeType: activeAlerts > 0 ? 'negative' : 'positive',
        icon: AlertTriangle,
        color: 'from-orange-500 to-red-600',
        glowColor: 'shadow-glow'
      }
    ]
  }, [dashboardData, summaryData, activeCustomersCount, newCustomersThisMonth])

  // Early returns باید بعد از همه hookها باشند
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/80 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">در حال بارگذاری...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30 dark:from-gray-950 dark:via-slate-900 dark:to-gray-900">
      {/* Modern Header with Glassmorphism */}
      <div className="relative mb-8">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10 dark:from-blue-500/5 dark:via-purple-500/5 dark:to-pink-500/5 rounded-3xl blur-3xl"></div>
        
        <div className="relative backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border border-white/20 dark:border-gray-800/50 rounded-3xl p-6 shadow-2xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                    داشبورد مدیریت
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {new Date().toLocaleDateString('fa-IR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Time Widget - Modern Design */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity"></div>
                <div className="relative backdrop-blur-xl bg-white/80 dark:bg-gray-800/80 border border-white/20 dark:border-gray-700/50 rounded-2xl p-4 flex items-center gap-3 shadow-xl">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white tabular-nums">
                      {currentTime.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {currentTime.toLocaleDateString('fa-IR')}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Refresh Button - Modern Design */}
              <button
                onClick={fetchDashboardData}
                disabled={refreshing}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity"></div>
                <div className={`relative backdrop-blur-xl bg-white/80 dark:bg-gray-800/80 border border-white/20 dark:border-gray-700/50 rounded-2xl px-6 py-3 flex items-center gap-2 shadow-xl transition-all duration-300 ${
                  refreshing ? 'cursor-not-allowed' : 'hover:scale-105 active:scale-95'
                }`}>
                  <RefreshCw className={`w-5 h-5 text-blue-600 dark:text-blue-400 ${refreshing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                  <span className="font-semibold text-gray-900 dark:text-white">به‌روزرسانی</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Stats Cards with Glassmorphism */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        {statsData.length > 0 ? (
          statsData.map((stat, index) => {
            const Icon = stat.icon || Activity
            // آیکون‌های lucide-react به صورت forwardRef هستند (object با $$typeof)
            if (!Icon || (typeof Icon !== 'function' && !Icon.$$typeof)) {
              console.error('Invalid icon for stat:', stat.title, stat.icon)
              return null
            }
            const gradients = [
              'from-emerald-500 via-teal-500 to-cyan-500',
              'from-blue-500 via-indigo-500 to-purple-500',
              'from-green-500 via-emerald-500 to-teal-500',
              'from-purple-500 via-pink-500 to-rose-500',
              'from-orange-500 via-red-500 to-pink-500'
            ]
            const gradient = gradients[index % gradients.length]
            
            return (
              <div 
                key={index} 
                className="group relative overflow-hidden"
              >
                {/* Glow Effect */}
                <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-20 blur-2xl transition-opacity duration-500`}></div>
                
                {/* Card */}
                <div className="relative backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border border-white/20 dark:border-gray-800/50 rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1">
                  {/* Icon with Gradient Background */}
                  <div className="flex items-center justify-between mb-6">
                    <div className={`relative p-4 rounded-2xl bg-gradient-to-br ${gradient} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-7 h-7 text-white relative z-10" />
                      <div className="absolute inset-0 bg-white/20 rounded-2xl"></div>
                    </div>
                    
                    {/* Change Badge */}
                    <div className={`relative overflow-hidden rounded-full px-3 py-1.5 ${
                      stat.changeType === 'positive' 
                        ? 'bg-gradient-to-r from-emerald-100 to-green-100 dark:from-emerald-900/30 dark:to-green-900/30 text-emerald-700 dark:text-emerald-300'
                        : stat.changeType === 'negative'
                        ? 'bg-gradient-to-r from-red-100 to-rose-100 dark:from-red-900/30 dark:to-rose-900/30 text-red-700 dark:text-red-300'
                        : 'bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800/30 dark:to-gray-700/30 text-gray-700 dark:text-gray-300'
                    }`}>
                      <span className="text-xs font-bold relative z-10">{stat.change}</span>
                    </div>
                  </div>
                  
                  {/* Value */}
                  <div className="mb-2">
                    <h3 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-1 tracking-tight">
                      {stat.value}
                      <span className="text-lg font-semibold text-gray-500 dark:text-gray-400 mr-1">
                        {stat.currency}
                      </span>
                    </h3>
                  </div>
                  
                  {/* Title */}
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{stat.title}</p>
                  
                  {/* Decorative Line */}
                  <div className={`absolute bottom-0 right-0 left-0 h-1 bg-gradient-to-r ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                </div>
              </div>
            )
          })
        ) : (
          // Modern Loading Placeholders
          [1, 2, 3, 4].map((index) => (
            <div key={index} className="relative overflow-hidden backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border border-white/20 dark:border-gray-800/50 rounded-3xl p-6 shadow-xl animate-pulse">
              <div className="flex items-center justify-between mb-6">
                <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
                <div className="w-20 h-6 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              </div>
              <div className="w-40 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg mb-2"></div>
              <div className="w-32 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          ))
        )}
      </div>

      {/* Modern Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        {/* Sales Chart - Modern Design */}
        <div className="lg:col-span-3 group relative overflow-hidden">
          {/* Glow Effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 blur-3xl transition-opacity duration-500"></div>
          
          {/* Card */}
          <div className="relative backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border border-white/20 dark:border-gray-800/50 rounded-3xl p-6 shadow-2xl hover:shadow-3xl transition-all duration-500">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl blur opacity-30"></div>
                  <div className="relative w-14 h-14 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-xl">
                    <BarChart3 className="w-7 h-7 text-white" />
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-1">نمودار فروش</h2>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {chartPeriod === 'today' && '📊 فروش امروز (ساعتی)'}
                    {chartPeriod === 'month' && '📈 فروش یک ماه گذشته (روزانه)'}
                    {chartPeriod === '6months' && '📉 فروش ۶ ماه گذشته (ماهانه)'}
                    {chartPeriod === 'year' && '📊 فروش یک سال گذشته (ماهانه)'}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Modern Period Selector */}
            <div className="flex items-center justify-end mb-6">
              <div className="inline-flex items-center gap-2 backdrop-blur-xl bg-white/60 dark:bg-gray-800/60 border border-white/20 dark:border-gray-700/50 rounded-2xl p-1.5 shadow-lg">
                <button
                  onClick={() => {
                    setChartPeriod('today')
                    fetchDashboardData('today')
                  }}
                  className={`relative px-5 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 ${
                    chartPeriod === 'today'
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/50 scale-105'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  امروز
                </button>
                <button
                  onClick={() => {
                    setChartPeriod('month')
                    fetchDashboardData('month')
                  }}
                  className={`relative px-5 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 ${
                    chartPeriod === 'month'
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/50 scale-105'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  یک ماه
                </button>
                <button
                  onClick={() => {
                    setChartPeriod('6months')
                    fetchDashboardData('6months')
                  }}
                  className={`relative px-5 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 ${
                    chartPeriod === '6months'
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/50 scale-105'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  ۶ ماه
                </button>
                <button
                  onClick={() => {
                    setChartPeriod('year')
                    fetchDashboardData('year')
                  }}
                  className={`relative px-5 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 ${
                    chartPeriod === 'year'
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/50 scale-105'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  یک سال
                </button>
              </div>
            </div>
            
            {/* Modern Chart Container */}
            <div className="relative backdrop-blur-xl bg-white/50 dark:bg-gray-800/50 rounded-2xl p-6 border border-white/20 dark:border-gray-700/50 shadow-inner">
            {refreshing && salesChartData.length === 0 ? (
              <div className="h-[450px] flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <p className="text-gray-400">در حال بارگذاری نمودار...</p>
                </div>
              </div>
            ) : (
              <div className="h-[450px] w-full">
                <LineChart 
                  data={salesChartData.length > 0 ? salesChartData.map(item => ({
                    month: item.label || item.month || '',
                    sales: item.sales || 0,
                    profit: item.profit || 0
                  })) : [
                  { month: 'فروردین', sales: 0, profit: 0 },
                  { month: 'اردیبهشت', sales: 0, profit: 0 },
                  { month: 'خرداد', sales: 0, profit: 0 },
                  { month: 'تیر', sales: 0, profit: 0 },
                  { month: 'مرداد', sales: 0, profit: 0 },
                  { month: 'شهریور', sales: 0, profit: 0 },
                  { month: 'مهر', sales: 0, profit: 0 },
                  { month: 'آبان', sales: 0, profit: 0 },
                  { month: 'آذر', sales: 0, profit: 0 },
                  { month: 'دی', sales: 0, profit: 0 },
                  { month: 'بهمن', sales: 0, profit: 0 },
                  { month: 'اسفند', sales: 0, profit: 0 }
                ]}
                  showAllLabels={chartPeriod !== 'today'}
                />
              </div>
            )}
            </div>

            {/* Modern Summary Stats */}
            {salesChartData.length > 0 && (
              <div className="mt-6 grid grid-cols-3 gap-4">
                {[
                  { label: 'کل فروش', value: salesChartData.reduce((sum, item) => sum + (item.sales || 0), 0), gradient: 'from-emerald-500 to-teal-500' },
                  { label: 'کل سود', value: salesChartData.reduce((sum, item) => sum + (item.profit || 0), 0), gradient: 'from-blue-500 to-indigo-500' },
                  { label: 'میانگین روزانه', value: salesChartData.reduce((sum, item) => sum + (item.sales || 0), 0) / Math.max(salesChartData.length, 1), gradient: 'from-purple-500 to-pink-500' }
                ].map((stat, idx) => (
                  <div key={idx} className="relative group overflow-hidden">
                    <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-10 blur-xl transition-opacity duration-300`}></div>
                    <div className="relative backdrop-blur-xl bg-white/60 dark:bg-gray-800/60 rounded-xl p-4 border border-white/20 dark:border-gray-700/50">
                      <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">{stat.label}</p>
                      <p className={`text-xl font-extrabold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`}>
                        {stat.value.toLocaleString('fa-IR')} تومان
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Payment Methods Pie Chart - Modern Design */}
        <div className="group relative overflow-hidden">
          {/* Glow Effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-rose-500/20 opacity-0 group-hover:opacity-100 blur-3xl transition-opacity duration-500"></div>
          
          {/* Card */}
          <div className="relative backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border border-white/20 dark:border-gray-800/50 rounded-3xl p-6 shadow-2xl hover:shadow-3xl transition-all duration-500">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl blur opacity-30"></div>
                  <div className="relative w-12 h-12 bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 rounded-xl flex items-center justify-center shadow-lg">
                    <CreditCard className="w-6 h-6 text-white" />
                  </div>
                </div>
                <h2 className="text-xl font-extrabold text-gray-900 dark:text-white">روش‌های پرداخت</h2>
              </div>
            </div>
          <div className="h-80">
            <PieChart 
              data={paymentMethodsData.length > 0 ? paymentMethodsData.map((item: any) => ({
                name: item.method || item.name || 'نامشخص',
                value: item.percentage || item.value || 0,
                color: item.method === 'نقدی' ? '#22C55E' : 
                       item.method === 'کارتی' ? '#6366F1' : 
                       item.method === 'چک' ? '#A855F7' : 
                       item.method === 'حواله' ? '#8B5CF6' : '#F97316'
              })) : [
                { name: 'نقدی', value: 0, color: '#22C55E' },
                { name: 'کارتی', value: 0, color: '#6366F1' },
                { name: 'چک', value: 0, color: '#A855F7' }
              ]}
              title="روش‌های پرداخت"
              centerLabel="کل پرداخت‌ها"
            />
          </div>
        </div>
      </div>
      </div>

      {/* Top Menu Items */}
      {topMenuItems.length > 0 && (
        <div className="premium-card p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">محبوب‌ترین غذاها</h2>
            <div className="flex items-center space-x-2 space-x-reverse">
              <ChefHat className="w-5 h-5 text-primary-600" />
              <button 
                onClick={() => router.push('/reports/sales')}
                className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
              >
                مشاهده همه
              </button>
            </div>
          </div>
          <div className="space-y-4 card-scrollbar smooth-scroll max-h-80 overflow-y-auto">
            {topMenuItems.map((item: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600/50 transition-colors">
                <div className="flex items-center space-x-4 space-x-reverse">
                  <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-red-500 rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-lg">{item.rank || index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{item.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{item.quantity} فروش</p>
                  </div>
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {item.revenue?.toLocaleString('fa-IR')} تومان
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Invoices and Cheques - Modern Design */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Recent Invoices */}
        {recentInvoices.length > 0 && (
          <div className="group relative overflow-hidden">
            {/* Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-indigo-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 blur-3xl transition-opacity duration-500"></div>
            
            {/* Card */}
            <div className="relative backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border border-white/20 dark:border-gray-800/50 rounded-3xl p-6 shadow-2xl hover:shadow-3xl transition-all duration-500">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl blur opacity-30"></div>
                    <div className="relative w-12 h-12 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                      <Receipt className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <h2 className="text-xl font-extrabold text-gray-900 dark:text-white">آخرین فاکتورها</h2>
                </div>
                <button 
                  onClick={() => router.push('/accounting/invoices')}
                  className="group/btn relative overflow-hidden px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold text-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  <span className="relative z-10">مشاهده همه</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 opacity-0 group-hover/btn:opacity-100 transition-opacity"></div>
                </button>
              </div>
              <div className="space-y-3 card-scrollbar smooth-scroll max-h-80 overflow-y-auto">
                {recentInvoices.map((invoice: any) => (
                  <div 
                    key={invoice._id || invoice.id} 
                    className="group/item relative overflow-hidden backdrop-blur-xl bg-white/60 dark:bg-gray-800/60 rounded-2xl p-4 border border-white/20 dark:border-gray-700/50 hover:bg-white/80 dark:hover:bg-gray-700/80 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl blur opacity-30"></div>
                          <div className="relative w-12 h-12 bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg group-hover/item:scale-110 transition-transform">
                            <FileText className="w-6 h-6 text-white" />
                          </div>
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white text-base mb-1">{invoice.invoiceNumber || invoice.id}</p>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            {invoice.customerName || invoice.customer || 'مشتری عمومی'}
                          </p>
                        </div>
                      </div>
                      <div className="text-left">
                        <p className="text-lg font-extrabold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-1">
                          {(invoice.totalAmount || 0).toLocaleString('fa-IR')} تومان
                        </p>
                        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${getStatusColor(invoice.status)}`}>
                          {getStatusText(invoice.status)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Recent Cheques */}
        {recentCheques.length > 0 && (
          <div className="group relative overflow-hidden">
            {/* Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-rose-500/20 opacity-0 group-hover:opacity-100 blur-3xl transition-opacity duration-500"></div>
            
            {/* Card */}
            <div className="relative backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border border-white/20 dark:border-gray-800/50 rounded-3xl p-6 shadow-2xl hover:shadow-3xl transition-all duration-500">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl blur opacity-30"></div>
                    <div className="relative w-12 h-12 bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 rounded-xl flex items-center justify-center shadow-lg">
                      <CreditCard className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <h2 className="text-xl font-extrabold text-gray-900 dark:text-white">آخرین چک‌ها</h2>
                </div>
                <button 
                  onClick={() => router.push('/accounting/cheques')}
                  className="group/btn relative overflow-hidden px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold text-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  <span className="relative z-10">مشاهده همه</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-rose-500 opacity-0 group-hover/btn:opacity-100 transition-opacity"></div>
                </button>
              </div>
              <div className="space-y-3 card-scrollbar smooth-scroll max-h-80 overflow-y-auto">
                {recentCheques.map((cheque: any) => (
                  <div 
                    key={cheque._id || cheque.id} 
                    className="group/item relative overflow-hidden backdrop-blur-xl bg-white/60 dark:bg-gray-800/60 rounded-2xl p-4 border border-white/20 dark:border-gray-700/50 hover:bg-white/80 dark:hover:bg-gray-700/80 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl blur opacity-30"></div>
                          <div className="relative w-12 h-12 bg-gradient-to-br from-purple-400 via-pink-500 to-rose-500 rounded-xl flex items-center justify-center shadow-lg group-hover/item:scale-110 transition-transform">
                            <CreditCard className="w-6 h-6 text-white" />
                          </div>
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white text-base mb-1">{cheque.chequeNumber || cheque.id}</p>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{cheque.bankName || 'نامشخص'}</p>
                        </div>
                      </div>
                      <div className="text-left">
                        <p className="text-lg font-extrabold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-1">
                          {(cheque.amount || 0).toLocaleString('fa-IR')} تومان
                        </p>
                        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${getStatusColor(cheque.status)}`}>
                          {getStatusText(cheque.status)}
                        </span>
                        {cheque.dueDate && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            سررسید: {new Date(cheque.dueDate).toLocaleDateString('fa-IR')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Notifications - Modern Design */}
      {notifications.length > 0 && (
        <div className="group relative overflow-hidden mb-8">
          {/* Glow Effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 via-red-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 blur-3xl transition-opacity duration-500"></div>
          
          {/* Card */}
          <div className="relative backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border border-white/20 dark:border-gray-800/50 rounded-3xl p-6 shadow-2xl hover:shadow-3xl transition-all duration-500">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl blur opacity-30"></div>
                  <div className="relative w-12 h-12 bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Bell className="w-6 h-6 text-white" />
                  </div>
                </div>
                <h2 className="text-xl font-extrabold text-gray-900 dark:text-white">اعلان‌های سیستم</h2>
              </div>
              <button 
                onClick={() => router.push('/inventory/stock-alerts')}
                className="group/btn relative overflow-hidden px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold text-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                <span className="relative z-10">مشاهده همه</span>
                <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-pink-500 opacity-0 group-hover/btn:opacity-100 transition-opacity"></div>
              </button>
            </div>
            <div className="space-y-3 card-scrollbar smooth-scroll max-h-96 overflow-y-auto">
              {notifications.map((notification: any) => {
                const Icon = notification.icon || Bell
                // آیکون‌های lucide-react به صورت forwardRef هستند (object با $$typeof)
                if (!Icon || (typeof Icon !== 'function' && !Icon.$$typeof)) {
                  return null
                }
                return (
                  <div 
                    key={notification.id} 
                    className="group/item relative overflow-hidden backdrop-blur-xl bg-white/60 dark:bg-gray-800/60 rounded-2xl p-4 border border-white/20 dark:border-gray-700/50 hover:bg-white/80 dark:hover:bg-gray-700/80 transition-all duration-300 hover:scale-[1.01] hover:shadow-lg"
                  >
                    <div className="flex items-start gap-4">
                      <div className="relative flex-shrink-0">
                        <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl blur opacity-30"></div>
                        <div className="relative w-12 h-12 bg-gradient-to-br from-orange-400 via-red-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg group-hover/item:scale-110 transition-transform">
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-bold text-gray-900 dark:text-white text-base">{notification.title}</h3>
                          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${getNotificationColor(notification.type)}`}>
                            {notification.type === 'warning' ? '⚠️ هشدار' : notification.type === 'info' ? 'ℹ️ اطلاعات' : notification.type}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{notification.message}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{notification.time}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions - Modern Design */}
      <div className="group relative overflow-hidden">
        {/* Glow Effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 blur-3xl transition-opacity duration-500"></div>
        
        {/* Card */}
        <div className="relative backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border border-white/20 dark:border-gray-800/50 rounded-3xl p-6 shadow-2xl hover:shadow-3xl transition-all duration-500">
          <div className="flex items-center gap-3 mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl blur opacity-30"></div>
              <div className="relative w-12 h-12 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                <Activity className="w-6 h-6 text-white" />
              </div>
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">عملیات سریع</h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { 
                icon: ShoppingCart, 
                label: 'فاکتور جدید', 
                path: '/operations/quick-sale',
                gradient: 'from-blue-500 via-cyan-500 to-teal-500'
              },
              { 
                icon: Package, 
                label: 'سفارش جدید', 
                path: '/operations/table-order',
                gradient: 'from-emerald-500 via-green-500 to-teal-500'
              },
              { 
                icon: Users, 
                label: 'مشتری جدید', 
                path: '/customers/add',
                gradient: 'from-purple-500 via-pink-500 to-rose-500'
              },
              { 
                icon: BarChart3, 
                label: 'گزارشات', 
                path: '/reports/general',
                gradient: 'from-orange-500 via-red-500 to-pink-500'
              }
            ].map((action, index) => {
              const Icon = action.icon || Activity
              // آیکون‌های lucide-react به صورت forwardRef هستند (object با $$typeof)
              if (!Icon || (typeof Icon !== 'function' && !Icon.$$typeof)) {
                return null
              }
              return (
                <button
                  key={index}
                  onClick={() => router.push(action.path)}
                  className="group/btn relative overflow-hidden"
                >
                  {/* Glow Effect */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover/btn:opacity-20 blur-xl transition-opacity duration-300`}></div>
                  
                  {/* Button */}
                  <div className={`relative backdrop-blur-xl bg-white/80 dark:bg-gray-800/80 border border-white/20 dark:border-gray-700/50 rounded-2xl p-6 flex flex-col items-center gap-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 hover:-translate-y-1`}>
                    <div className={`relative p-4 rounded-xl bg-gradient-to-br ${action.gradient} shadow-lg group-hover/btn:scale-110 transition-transform duration-300`}>
                      <Icon className="w-7 h-7 text-white relative z-10" />
                      <div className="absolute inset-0 bg-white/20 rounded-xl"></div>
                    </div>
                    <span className="font-bold text-gray-900 dark:text-white text-sm">{action.label}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
