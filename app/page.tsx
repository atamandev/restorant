'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'

// Lazy load heavy chart components
const LineChart = dynamic(() => import('@/components/Charts/LineChart'), {
  loading: () => <div className="w-full h-80 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>,
  ssr: false
})

const PieChart = dynamic(() => import('@/components/Charts/PieChart'), {
  loading: () => <div className="w-full h-80 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>,
  ssr: false
})
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

  // Fetch dashboard data - optimized with parallel requests
  const fetchDashboardData = useCallback(async (period?: 'today' | 'month' | '6months' | 'year') => {
    const selectedPeriod = period || chartPeriod
    try {
      setRefreshing(true)
      
      // Execute all API calls in parallel for better performance
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

      const [
        dashboardRes,
        summaryRes,
        salesRes,
        ordersSalesRes,
        paymentRes,
        topItemsRes,
        invoicesRes,
        chequesRes,
        alertsRes
      ] = await Promise.allSettled([
        fetch('/api/dashboard'),
        fetch('/api/dashboard/summary'),
        fetch(salesApiUrl),
        fetch(`/api/orders/sales?period=${selectedPeriod}`), // دریافت داده از orders واقعی
        fetch('/api/sales-reports?reportType=payment&dateRange=month'),
        fetch('/api/reports/top-menu-items?limit=5'),
        fetch('/api/invoices?limit=5&type=sales&sortBy=createdAt&sortOrder=desc'),
        fetch('/api/cheques?limit=5&sortBy=createdAt&sortOrder=desc'),
        fetch('/api/stock-alerts?status=active&limit=5')
      ])

      // Process dashboard data
      if (dashboardRes.status === 'fulfilled') {
        try {
          const result = await dashboardRes.value.json()
          if (result.success) {
            setDashboardData(result.data)
          }
        } catch (error) {
          console.error('Error parsing dashboard:', error)
        }
      }

      // Process summary data
      if (summaryRes.status === 'fulfilled') {
        try {
          const result = await summaryRes.value.json()
          if (result.success) {
            setSummaryData(result.data)
          }
        } catch (error) {
          console.error('Error parsing summary:', error)
        }
      }

      // Process sales chart data from orders (real data)
      const monthNames = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند']
      
      // اول از orders واقعی تلاش کن
      if (ordersSalesRes.status === 'fulfilled') {
        try {
          const ordersResult = await ordersSalesRes.value.json()
          if (ordersResult.success && ordersResult.data && Array.isArray(ordersResult.data) && ordersResult.data.length > 0) {
            const chartData = ordersResult.data.map((item: any) => {
              return {
                label: item.label || item.period || item.month || '',
                month: item.label || item.period || item.month || '',
                sales: item.totalSales || item.sales || item.amount || 0,
                profit: item.totalProfit || item.profit || ((item.totalSales || item.sales || item.amount || 0) * 0.3)
              }
            })
            setSalesChartData(chartData)
          } else {
            // Fallback to sales-reports
            await processSalesReportsData(salesRes, monthNames)
          }
        } catch (error) {
          console.error('Error parsing orders sales chart:', error)
          await processSalesReportsData(salesRes, monthNames)
        }
      } else {
        await processSalesReportsData(salesRes, monthNames)
      }

      async function processSalesReportsData(salesRes: any, monthNames: string[]) {
        if (salesRes.status === 'fulfilled') {
          try {
            const salesResult = await salesRes.value.json()
            if (salesResult.success && salesResult.data && Array.isArray(salesResult.data) && salesResult.data.length > 0) {
              const chartData = salesResult.data.map((item: any, index: number) => {
                try {
                  const date = item.date ? new Date(item.date) : new Date()
                  const monthIndex = date.getMonth() || 0
                  return {
                    label: monthNames[monthIndex] || monthNames[index] || `ماه ${index + 1}`,
                    month: monthNames[monthIndex] || monthNames[index] || `ماه ${index + 1}`,
                    sales: item.totalSales || item.sales || 0,
                    profit: (item.totalSales || item.sales || 0) * 0.3
                  }
                } catch {
                  return {
                    label: monthNames[index] || `ماه ${index + 1}`,
                    month: monthNames[index] || `ماه ${index + 1}`,
                    sales: item.totalSales || item.sales || 0,
                    profit: (item.totalSales || item.sales || 0) * 0.3
                  }
                }
              })
              setSalesChartData(chartData)
            } else {
              setSalesChartData([])
            }
          } catch (error) {
            console.error('Error parsing sales chart:', error)
            setSalesChartData([])
          }
        } else {
          setSalesChartData([])
        }
      }

      // Process payment methods
      if (paymentRes.status === 'fulfilled') {
        try {
          const result = await paymentRes.value.json()
          if (result.success && result.data && Array.isArray(result.data)) {
            setPaymentMethodsData(result.data)
          } else {
            setPaymentMethodsData([])
          }
        } catch (error) {
          console.error('Error parsing payment methods:', error)
          setPaymentMethodsData([])
        }
      }

      // Process top menu items
      if (topItemsRes.status === 'fulfilled') {
        try {
          const result = await topItemsRes.value.json()
          if (result.success && result.data) {
            setTopMenuItems(result.data)
          } else {
            setTopMenuItems([])
          }
        } catch (error) {
          console.error('Error parsing top menu items:', error)
          setTopMenuItems([])
        }
      }

      // Process recent invoices
      if (invoicesRes.status === 'fulfilled') {
        try {
          const result = await invoicesRes.value.json()
          if (result.success && result.data) {
            setRecentInvoices(result.data)
          } else {
            setRecentInvoices([])
          }
        } catch (error) {
          console.error('Error parsing invoices:', error)
          setRecentInvoices([])
        }
      }

      // Process recent cheques
      if (chequesRes.status === 'fulfilled') {
        try {
          const result = await chequesRes.value.json()
          if (result.success && result.data) {
            setRecentCheques(result.data)
          } else {
            setRecentCheques([])
          }
        } catch (error) {
          console.error('Error parsing cheques:', error)
          setRecentCheques([])
        }
      }

      // Process stock alerts
      if (alertsRes.status === 'fulfilled') {
        try {
          const result = await alertsRes.value.json()
          if (result.success && result.data) {
            const alerts = result.data.map((alert: any) => ({
              id: alert._id || alert.id,
              title: 'موجودی کم',
              message: `موجودی ${alert.itemName || 'آیتم'} کمتر از حد مجاز است`,
              time: alert.createdAt ? new Date(alert.createdAt).toLocaleString('fa-IR') : 'نامشخص',
              type: 'warning',
              icon: AlertTriangle
            }))
            setNotifications(alerts)
          } else {
            setNotifications([])
          }
        } catch (error) {
          console.error('Error parsing stock alerts:', error)
          setNotifications([])
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
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
      fetchDashboardData()
    }
  }, [user, fetchDashboardData, chartPeriod])

  useEffect(() => {
    // Update time every second
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => {
      clearInterval(timeInterval)
    }
  }, [])

  // Auto-refresh every 10 seconds for real-time updates
  useEffect(() => {
    if (!user) return
    
    const refreshInterval = setInterval(() => {
      if (!refreshing) {
        fetchDashboardData()
      }
    }, 10000) // 10 seconds for real-time dashboard

    return () => {
      clearInterval(refreshInterval)
    }
  }, [user, fetchDashboardData, refreshing])

  // Prepare stats data from API - باید قبل از early return باشد
  const statsData = useMemo(() => {
    if (!dashboardData?.todaySales) return []
    
    return [
      {
        title: 'فروش امروز',
        value: dashboardData.todaySales.amount.toLocaleString('fa-IR'),
        currency: 'تومان',
        change: `${dashboardData.todaySales.change >= 0 ? '+' : ''}${dashboardData.todaySales.change.toFixed(1)}%`,
        changeType: dashboardData.todaySales.change >= 0 ? 'positive' : 'negative',
        icon: TrendingUp,
        color: 'from-emerald-500 to-green-600',
        glowColor: 'shadow-glow-green'
      },
      {
        title: 'سود ناخالص',
        value: dashboardData.grossProfit?.grossProfit.toLocaleString('fa-IR') || '0',
        currency: 'تومان',
        change: dashboardData.grossProfit?.grossMargin ? `${dashboardData.grossProfit.grossMargin}%` : '0%',
        changeType: 'positive',
        icon: DollarSign,
        color: 'from-blue-500 to-indigo-600',
        glowColor: 'shadow-glow'
      },
      {
        title: 'مشتریان فعال',
        value: dashboardData.todaySales?.customers.toLocaleString('fa-IR') || '0',
        currency: 'نفر',
        change: dashboardData.loyalCustomersStats ? `+${dashboardData.loyalCustomersStats.newThisMonth}` : '+0',
        changeType: 'positive',
        icon: Users,
        color: 'from-purple-500 to-violet-600',
        glowColor: 'shadow-glow-purple'
      },
      {
        title: 'موجودی کم',
        value: dashboardData.inventoryAlerts?.activeAlerts.toLocaleString('fa-IR') || '0',
        currency: 'آیتم',
        change: dashboardData.inventoryAlerts?.critical.length > 0 ? `${dashboardData.inventoryAlerts.critical.length} بحرانی` : 'خوب',
        changeType: dashboardData.inventoryAlerts?.activeAlerts > 0 ? 'negative' : 'positive',
        icon: AlertTriangle,
        color: 'from-orange-500 to-red-600',
        glowColor: 'shadow-glow'
      }
    ]
  }, [dashboardData])

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
    <div>
      {/* Welcome Section with Time and Refresh */}
      <div className="mb-8">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2">داشبورد مدیریت رستوران</h1>
            <p className="text-gray-600 dark:text-gray-300">
              خلاصه عملکرد سیستم از بخش‌های مختلف - {new Date().toLocaleDateString('fa-IR')}
            </p>
          </div>
          <div className="flex items-center space-x-4 space-x-reverse">
            {/* Refresh Button */}
            <button
              onClick={fetchDashboardData}
              disabled={refreshing}
              className="premium-button flex items-center space-x-2 space-x-reverse"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>به‌روزرسانی</span>
            </button>
            
            {/* Time Widget */}
            <div className="premium-card p-4 flex items-center space-x-3 space-x-reverse">
              <Clock className="w-6 h-6 text-blue-500" />
              <div>
                <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                  {currentTime.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {currentTime.toLocaleDateString('fa-IR')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards - همیشه نمایش داده می‌شود */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsData.length > 0 ? (
          statsData.map((stat, index) => {
            const Icon = stat.icon
            return (
              <div key={index} className={`premium-card p-6 card-hover ${stat.glowColor} floating-card`}>
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.color} pulse-glow`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                    stat.changeType === 'positive' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                  }`}>
                    {stat.change}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {stat.value}
                  <span className="text-sm font-normal text-gray-500 dark:text-gray-400 mr-1">
                    {stat.currency}
                  </span>
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">{stat.title}</p>
              </div>
            )
          })
        ) : (
          // نمایش placeholder در حال بارگذاری
          [1, 2, 3, 4].map((index) => (
            <div key={index} className="premium-card p-6 animate-pulse">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                <div className="w-16 h-6 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              </div>
              <div className="w-32 h-8 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              <div className="w-24 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          ))
        )}
      </div>

      {/* Charts Section - همیشه نمایش داده می‌شود */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Sales Chart */}
        <div className="lg:col-span-2 premium-card p-6 border-2 border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-300 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">نمودار فروش</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {chartPeriod === 'today' && 'فروش امروز (ساعتی)'}
                  {chartPeriod === 'month' && 'فروش یک ماه گذشته (روزانه)'}
                  {chartPeriod === '6months' && 'فروش ۶ ماه گذشته (ماهانه)'}
                  {chartPeriod === 'year' && 'فروش یک سال گذشته (ماهانه)'}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-end mb-4">
            <div className="inline-flex items-center space-x-1 space-x-reverse bg-gray-100 dark:bg-gray-800 rounded-xl p-1 shadow-sm">
              <button
                onClick={() => {
                  setChartPeriod('today')
                  fetchDashboardData('today')
                }}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  chartPeriod === 'today'
                    ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-md scale-105'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                امروز
              </button>
              <button
                onClick={() => {
                  setChartPeriod('month')
                  fetchDashboardData('month')
                }}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  chartPeriod === 'month'
                    ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-md scale-105'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                یک ماه
              </button>
              <button
                onClick={() => {
                  setChartPeriod('6months')
                  fetchDashboardData('6months')
                }}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  chartPeriod === '6months'
                    ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-md scale-105'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                ۶ ماه
              </button>
              <button
                onClick={() => {
                  setChartPeriod('year')
                  fetchDashboardData('year')
                }}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  chartPeriod === 'year'
                    ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-md scale-105'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                یک سال
              </button>
            </div>
          </div>
          {/* Chart Container */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl p-4 pb-10 border border-gray-200 dark:border-gray-700">
            {refreshing && salesChartData.length === 0 ? (
              <div className="h-80 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                  <p className="text-gray-600 dark:text-gray-400">در حال بارگذاری نمودار...</p>
                </div>
              </div>
            ) : (
              <div className="h-80 pb-8">
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

          {/* Summary Stats */}
          {salesChartData.length > 0 && (
            <div className="mt-4 grid grid-cols-3 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">کل فروش</p>
                <p className="text-lg font-bold text-blue-700 dark:text-blue-300">
                  {salesChartData.reduce((sum, item) => sum + (item.sales || 0), 0).toLocaleString('fa-IR')} تومان
                </p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800">
                <p className="text-xs text-green-600 dark:text-green-400 mb-1">کل سود</p>
                <p className="text-lg font-bold text-green-700 dark:text-green-300">
                  {salesChartData.reduce((sum, item) => sum + (item.profit || 0), 0).toLocaleString('fa-IR')} تومان
                </p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
                <p className="text-xs text-purple-600 dark:text-purple-400 mb-1">میانگین روزانه</p>
                <p className="text-lg font-bold text-purple-700 dark:text-purple-300">
                  {(salesChartData.reduce((sum, item) => sum + (item.sales || 0), 0) / Math.max(salesChartData.length, 1)).toLocaleString('fa-IR')} تومان
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Payment Methods Pie Chart */}
        <div className="premium-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">روش‌های پرداخت</h2>
            <CreditCard className="w-5 h-5 text-primary-600" />
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

      {/* Recent Invoices and Cheques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Recent Invoices */}
        {recentInvoices.length > 0 && (
          <div className="premium-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">آخرین فاکتورها</h2>
              <div className="flex items-center space-x-2 space-x-reverse">
                <Receipt className="w-5 h-5 text-primary-600" />
                <button 
                  onClick={() => router.push('/accounting/invoices')}
                  className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                >
                  مشاهده همه
                </button>
              </div>
            </div>
            <div className="space-y-4 card-scrollbar smooth-scroll max-h-80 overflow-y-auto">
              {recentInvoices.map((invoice: any) => (
                <div key={invoice._id || invoice.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600/50 transition-colors">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{invoice.invoiceNumber || invoice.id}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {invoice.customerName || invoice.customer || 'مشتری عمومی'}
                      </p>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {(invoice.totalAmount || 0).toLocaleString('fa-IR')} تومان
                    </p>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(invoice.status)}`}>
                      {getStatusText(invoice.status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Cheques */}
        {recentCheques.length > 0 && (
          <div className="premium-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">آخرین چک‌ها</h2>
              <div className="flex items-center space-x-2 space-x-reverse">
                <CreditCard className="w-5 h-5 text-primary-600" />
                <button 
                  onClick={() => router.push('/accounting/cheques')}
                  className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                >
                  مشاهده همه
                </button>
              </div>
            </div>
            <div className="space-y-4 card-scrollbar smooth-scroll max-h-80 overflow-y-auto">
              {recentCheques.map((cheque: any) => (
                <div key={cheque._id || cheque.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600/50 transition-colors">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{cheque.chequeNumber || cheque.id}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{cheque.bankName || 'نامشخص'}</p>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {(cheque.amount || 0).toLocaleString('fa-IR')} تومان
                    </p>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(cheque.status)}`}>
                      {getStatusText(cheque.status)}
                    </span>
                  </div>
                  {cheque.dueDate && (
                    <div className="text-right">
                      <p className="text-xs text-gray-500 dark:text-gray-400">سررسید:</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {new Date(cheque.dueDate).toLocaleDateString('fa-IR')}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="premium-card p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">اعلان‌های سیستم</h2>
            <div className="flex items-center space-x-2 space-x-reverse">
              <Bell className="w-5 h-5 text-primary-600" />
              <button 
                onClick={() => router.push('/inventory/stock-alerts')}
                className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
              >
                مشاهده همه
              </button>
            </div>
          </div>
          <div className="space-y-4 card-scrollbar smooth-scroll max-h-96 overflow-y-auto">
            {notifications.map((notification: any) => {
              const Icon = notification.icon || Bell
              return (
                <div key={notification.id} className="flex items-start space-x-4 space-x-reverse p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600/50 transition-colors">
                  <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-primary-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium text-gray-900 dark:text-white">{notification.title}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${getNotificationColor(notification.type)}`}>
                        {notification.type === 'warning' ? 'هشدار' : notification.type === 'info' ? 'اطلاع' : notification.type}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{notification.message}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{notification.time}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="premium-card p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">عملیات سریع</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button 
            onClick={() => router.push('/operations/quick-sale')}
            className="premium-button flex flex-col items-center p-4 space-y-2"
          >
            <ShoppingCart className="w-8 h-8" />
            <span>فاکتور جدید</span>
          </button>
          <button 
            onClick={() => router.push('/operations/table-order')}
            className="premium-button bg-green-500 hover:bg-green-600 flex flex-col items-center p-4 space-y-2"
          >
            <Package className="w-8 h-8" />
            <span>سفارش جدید</span>
          </button>
          <button 
            onClick={() => router.push('/customers/add')}
            className="premium-button bg-purple-500 hover:bg-purple-600 flex flex-col items-center p-4 space-y-2"
          >
            <Users className="w-8 h-8" />
            <span>مشتری جدید</span>
          </button>
          <button 
            onClick={() => router.push('/reports/general')}
            className="premium-button bg-orange-500 hover:bg-orange-600 flex flex-col items-center p-4 space-y-2"
          >
            <BarChart3 className="w-8 h-8" />
            <span>گزارشات</span>
          </button>
        </div>
      </div>
    </div>
  )
}
