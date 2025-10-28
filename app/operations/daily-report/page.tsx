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
  const [stats, setStats] = useState<DailyStats>(sampleDailyStats)
  const [orders, setOrders] = useState<OrderSummary[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPayment, setFilterPayment] = useState('all')
  const [viewMode, setViewMode] = useState<'summary' | 'detailed'>('summary')
  const [loading, setLoading] = useState(false)

  // Load orders from API
  const loadOrders = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/daily-orders?date=${selectedDate}&limit=100`)
      const result = await response.json()
      if (result.success) {
        setOrders(result.data)
      } else {
        console.error('Error loading orders:', result.message)
      }
    } catch (error) {
      console.error('Error loading orders:', error)
    } finally {
      setLoading(false)
    }
  }

  // Load daily report from API
  const loadDailyReport = async () => {
    try {
      const response = await fetch(`/api/daily-reports?dateFrom=${selectedDate}&dateTo=${selectedDate}&limit=1`)
      const result = await response.json()
      if (result.success && result.data.length > 0) {
        const report = result.data[0]
        setStats({
          date: selectedDate,
          totalSales: report.totalSales,
          totalOrders: report.totalOrders,
          totalCustomers: report.totalCustomers,
          averageOrderValue: report.averageOrderValue,
          cashSales: report.cashSales,
          cardSales: report.cardSales,
          creditSales: report.creditSales,
          refunds: report.refunds,
          discounts: report.discounts,
          taxes: report.taxes,
          serviceCharges: report.serviceCharges,
          netProfit: report.netProfit,
          topSellingItems: report.topSellingItems,
          hourlySales: report.hourlySales,
          paymentMethods: report.paymentMethods
        })
      }
    } catch (error) {
      console.error('Error loading daily report:', error)
    }
  }

  // Load data on component mount and when date changes
  useEffect(() => {
    loadOrders()
    loadDailyReport()
  }, [selectedDate])

  const filteredOrders = orders.filter(order => {
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus
    const matchesPayment = filterPayment === 'all' || order.paymentMethod === filterPayment
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
    loadOrders()
    loadDailyReport()
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

        {/* Main Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="premium-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">کل فروش</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.totalSales.toLocaleString('fa-IR')} تومان
                </p>
                <div className="flex items-center space-x-1 space-x-reverse mt-1">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-green-600 dark:text-green-400">+12.5%</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
          <div className="premium-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">تعداد سفارشات</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalOrders}</p>
                <div className="flex items-center space-x-1 space-x-reverse mt-1">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-green-600 dark:text-green-400">+8.3%</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
          <div className="premium-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">تعداد مشتریان</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalCustomers}</p>
                <div className="flex items-center space-x-1 space-x-reverse mt-1">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-green-600 dark:text-green-400">+15.2%</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
          <div className="premium-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">میانگین سفارش</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.averageOrderValue.toLocaleString('fa-IR')} تومان
                </p>
                <div className="flex items-center space-x-1 space-x-reverse mt-1">
                  <TrendingDown className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-red-600 dark:text-red-400">-2.1%</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                <Calculator className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Financial Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="premium-card p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">تجزیه فروش</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">فروش نقدی</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {stats.cashSales.toLocaleString('fa-IR')} تومان
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">فروش کارتخوان</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {stats.cardSales.toLocaleString('fa-IR')} تومان
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">فروش اعتباری</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {stats.creditSales.toLocaleString('fa-IR')} تومان
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-600/30 pt-2">
                <span className="font-medium text-gray-900 dark:text-white">کل فروش</span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {stats.totalSales.toLocaleString('fa-IR')} تومان
                </span>
              </div>
            </div>
          </div>
          <div className="premium-card p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">کسرها</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">مرجوعی‌ها</span>
                <span className="font-semibold text-red-600 dark:text-red-400">
                  -{stats.refunds.toLocaleString('fa-IR')} تومان
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">تخفیف‌ها</span>
                <span className="font-semibold text-red-600 dark:text-red-400">
                  -{stats.discounts.toLocaleString('fa-IR')} تومان
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">مالیات</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {stats.taxes.toLocaleString('fa-IR')} تومان
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">حق سرویس</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {stats.serviceCharges.toLocaleString('fa-IR')} تومان
                </span>
              </div>
            </div>
          </div>
          <div className="premium-card p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">خلاصه مالی</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">فروش خالص</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {(stats.totalSales - stats.refunds - stats.discounts).toLocaleString('fa-IR')} تومان
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">سود خالص</span>
                <span className="font-bold text-green-600 dark:text-green-400">
                  {stats.netProfit.toLocaleString('fa-IR')} تومان
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">نرخ سود</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {((stats.netProfit / stats.totalSales) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Top Selling Items */}
        <div className="premium-card p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">پرفروش‌ترین آیتم‌ها</h3>
          <div className="space-y-4">
            {stats.topSellingItems.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
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
                    {((item.revenue / stats.totalSales) * 100).toFixed(1)}% از کل فروش
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hourly Sales Chart */}
        <div className="premium-card p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">فروش ساعتی</h3>
          <div className="grid grid-cols-7 gap-2">
            {stats.hourlySales.map((hour, index) => (
              <div key={index} className="text-center">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">{hour.hour}</div>
                <div 
                  className="bg-primary-100 dark:bg-primary-900/30 rounded-t-lg mx-auto"
                  style={{ 
                    height: `${(hour.sales / Math.max(...stats.hourlySales.map(h => h.sales))) * 100}px`,
                    minHeight: '20px',
                    width: '20px'
                  }}
                ></div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {(hour.sales / 1000000).toFixed(1)}M
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Orders List */}
        <div className="premium-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">لیست سفارشات</h3>
            <div className="flex items-center space-x-4 space-x-reverse">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">همه وضعیت‌ها</option>
                <option value="completed">تکمیل شده</option>
                <option value="pending">در انتظار</option>
                <option value="cancelled">لغو شده</option>
              </select>
              <select
                value={filterPayment}
                onChange={(e) => setFilterPayment(e.target.value)}
                className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">همه روش‌ها</option>
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
                {loading ? (
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
                    <tr key={order._id} className="border-b border-gray-100 dark:border-gray-700/30">
                      <td className="py-4 px-4">
                        <span className="font-medium text-gray-900 dark:text-white">{order.orderNumber}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-gray-900 dark:text-white">
                          {new Date(order.createdAt).toLocaleTimeString('fa-IR', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
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
                          {order.paymentMethod}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {order.status}
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
