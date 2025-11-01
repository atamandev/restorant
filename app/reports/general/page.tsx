'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  Clock,
  Download,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  Plus,
  X,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  FileText,
  Activity,
  Settings,
  AlertTriangle
} from 'lucide-react'
import PieChart from '@/components/Charts/PieChart'
import BarChart from '@/components/Charts/BarChart'
import LineChart from '@/components/Charts/LineChart'

interface ReportData {
  id: string
  _id?: string
  title: string
  description: string
  type: 'sales' | 'inventory' | 'customers' | 'orders' | 'financial'
  category: string
  data: any
  lastUpdated: string
  isScheduled: boolean
  scheduleFrequency: string
  isPublic: boolean
  createdBy: string
}

interface DashboardWidget {
  id: string
  title: string
  value: string
  change: number
  changeType: 'increase' | 'decrease'
  color: string
}

export default function GeneralReportsPage() {
  const [reports, setReports] = useState<ReportData[]>([])
  const [dashboardWidgets, setDashboardWidgets] = useState<DashboardWidget[]>([])
  const [stats, setStats] = useState({
    totalReports: 0,
    scheduledReports: 0,
    publicReports: 0,
    recentReports: 0
  })
  const [loading, setLoading] = useState(true)
  const [selectedReport, setSelectedReport] = useState<ReportData | null>(null)
  const [showReportModal, setShowReportModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [filterType, setFilterType] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [sortBy, setSortBy] = useState('lastUpdated')
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'sales' as 'sales' | 'inventory' | 'customers' | 'orders' | 'financial',
    category: '',
    data: {},
    isScheduled: false,
    scheduleFrequency: '',
    isPublic: false,
    createdBy: 'کاربر'
  })

  // Fetch dashboard data
  const fetchDashboard = useCallback(async () => {
    try {
      const response = await fetch('/api/general-reports/dashboard')
      const result = await response.json()
      
      if (result.success) {
        setDashboardWidgets(result.data.widgets || [])
        setStats(result.data.stats || {
          totalReports: 0,
          scheduledReports: 0,
          publicReports: 0,
          recentReports: 0
        })
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error)
    }
  }, [])

  // Fetch reports
  const fetchReports = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filterType !== 'all') {
        params.append('type', filterType)
      }
      if (filterCategory !== 'all') {
        params.append('category', filterCategory)
      }
      if (sortBy) {
        params.append('sortBy', sortBy)
      }

      const response = await fetch(`/api/general-reports?${params}`)
      const result = await response.json()
      
      if (result.success) {
        setReports(result.data || [])
      } else {
        alert(result.message || 'خطا در دریافت گزارشات')
      }
    } catch (error) {
      console.error('Error fetching reports:', error)
      alert('خطا در دریافت گزارشات')
    } finally {
      setLoading(false)
    }
  }, [filterType, filterCategory, sortBy])

  useEffect(() => {
    fetchDashboard()
    fetchReports()
  }, [fetchDashboard, fetchReports])

  // Filtered and sorted reports
  const filteredReports = useMemo(() => {
    return [...reports].sort((a, b) => {
      switch (sortBy) {
        case 'title': return a.title.localeCompare(b.title)
        case 'lastUpdated': return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
        case 'category': return a.category.localeCompare(b.category)
        default: return 0
      }
    })
  }, [reports, sortBy])

  // Handlers
  const handleViewReport = useCallback((report: ReportData) => {
    setSelectedReport(report)
    setShowReportModal(true)
  }, [])

  const handleEditReport = useCallback((report: ReportData) => {
    setSelectedReport(report)
    setFormData({
      title: report.title,
      description: report.description,
      type: report.type,
      category: report.category,
      data: report.data,
      isScheduled: report.isScheduled,
      scheduleFrequency: report.scheduleFrequency,
      isPublic: report.isPublic,
      createdBy: report.createdBy
    })
    setShowEditModal(true)
  }, [])

  const handleDeleteReport = useCallback(async (report: ReportData) => {
    if (!confirm(`آیا از حذف "${report.title}" اطمینان دارید؟`)) {
      return
    }

    try {
      const reportId = report._id || report.id
      if (!reportId || reportId.startsWith('sales-') || reportId.startsWith('inventory-') || reportId.startsWith('customers-') || reportId.startsWith('financial-') || reportId.startsWith('orders-')) {
        alert('نمی‌توانید گزارشات سیستم را حذف کنید')
        return
      }

      const response = await fetch(`/api/general-reports?id=${reportId}`, {
        method: 'DELETE'
      })
      
      const result = await response.json()
      
      if (result.success) {
        alert('گزارش با موفقیت حذف شد')
        fetchReports()
        fetchDashboard()
      } else {
        alert(result.message || 'خطا در حذف گزارش')
      }
    } catch (error) {
      console.error('Error deleting report:', error)
      alert('خطا در حذف گزارش')
    }
  }, [fetchReports, fetchDashboard])

  const handleCreateReport = useCallback(() => {
    setFormData({
      title: '',
      description: '',
      type: 'sales',
      category: '',
      data: {},
      isScheduled: false,
      scheduleFrequency: '',
      isPublic: false,
      createdBy: 'کاربر'
    })
    setSelectedReport(null)
    setShowCreateModal(true)
  }, [])

  const handleSaveReport = useCallback(async () => {
    try {
      const url = '/api/general-reports'
      const method = selectedReport ? 'PUT' : 'POST'
      
      // Validate required fields
      if (!formData.title || !formData.type) {
        alert('عنوان و نوع گزارش اجباری است')
        return
      }
      
      const body = selectedReport
        ? {
            id: selectedReport._id || selectedReport.id,
            title: formData.title,
            description: formData.description || '',
            type: formData.type,
            category: formData.category || (formData.type === 'sales' ? 'فروش' : formData.type === 'inventory' ? 'موجودی' : formData.type === 'customers' ? 'مشتریان' : formData.type === 'orders' ? 'سفارشات' : 'مالی'),
            data: formData.data || {},
            isScheduled: formData.isScheduled || false,
            scheduleFrequency: formData.scheduleFrequency || '',
            isPublic: formData.isPublic || false,
            createdBy: formData.createdBy || 'کاربر'
          }
        : {
            title: formData.title,
            description: formData.description || '',
            type: formData.type,
            category: formData.category || (formData.type === 'sales' ? 'فروش' : formData.type === 'inventory' ? 'موجودی' : formData.type === 'customers' ? 'مشتریان' : formData.type === 'orders' ? 'سفارشات' : 'مالی'),
            data: formData.data || {},
            isScheduled: formData.isScheduled || false,
            scheduleFrequency: formData.scheduleFrequency || '',
            isPublic: formData.isPublic || false,
            createdBy: formData.createdBy || 'کاربر'
          }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        console.error('API Error:', result)
        alert(result.message || 'خطا در ذخیره گزارش')
        return
      }

      // Success
      alert(selectedReport ? 'گزارش با موفقیت به‌روزرسانی شد' : 'گزارش با موفقیت ایجاد شد')
      setShowEditModal(false)
      setShowCreateModal(false)
      setSelectedReport(null)
      setFormData({
        title: '',
        description: '',
        type: 'sales',
        category: '',
        data: {},
        isScheduled: false,
        scheduleFrequency: '',
        isPublic: false,
        createdBy: 'کاربر'
      })
      
      // Refresh reports list
      await fetchReports()
      await fetchDashboard()
    } catch (error) {
      console.error('Error saving report:', error)
      alert('خطا در ذخیره گزارش: ' + (error instanceof Error ? error.message : 'خطای نامشخص'))
    }
  }, [selectedReport, formData, fetchReports, fetchDashboard])

  const handleRefresh = useCallback(() => {
    fetchDashboard()
    fetchReports()
  }, [fetchDashboard, fetchReports])

  const handleExport = useCallback(() => {
    alert('قابلیت دانلود گزارش در حال توسعه است')
  }, [])

  // Chart data for report modal
  const getChartData = useCallback((report: ReportData | null) => {
    if (!report || !report.data) return null

    if (report.type === 'financial' && report.data) {
      return [
        {
          period: 'مالی',
          revenue: report.data.revenue || 0,
          expenses: report.data.expenses || 0,
          profit: report.data.profit || 0
        }
      ]
    }

    if (report.type === 'sales' && report.data) {
      return [
        {
          period: 'فروش',
          revenue: report.data.totalSales || 0,
          orderCount: report.data.orderCount || 0
        }
      ]
    }

    return null
  }, [])

  // Pie chart data for customers report
  const getCustomerPieChartData = useCallback((report: ReportData | null) => {
    if (!report || report.type !== 'customers' || !report.data) return []
    
    const { vipCustomers = 0, totalCustomers = 0 } = report.data
    const regularCustomers = totalCustomers - vipCustomers
    
    if (totalCustomers === 0) return []
    
    const vipPercentage = Math.round((vipCustomers / totalCustomers) * 100)
    const regularPercentage = 100 - vipPercentage
    
    return [
      {
        name: 'مشتریان VIP',
        value: vipPercentage,
        color: '#A855F7'
      },
      {
        name: 'مشتریان عادی',
        value: regularPercentage,
        color: '#6366F1'
      }
    ]
  }, [])

  // Bar chart data for customers report
  const getCustomerBarChartData = useCallback((report: ReportData | null) => {
    if (!report || report.type !== 'customers' || !report.data) return []
    
    const { vipCustomers = 0, totalSpent = 0, averageSpent = 0 } = report.data
    
    return [
      {
        period: 'مشتریان',
        vipCustomers,
        totalSpent: Math.round(totalSpent),
        averageSpent: Math.round(averageSpent)
      }
    ]
  }, [])

  const getReportTypeIcon = (type: string) => {
    switch (type) {
      case 'sales': return <DollarSign className="w-5 h-5" />
      case 'inventory': return <Package className="w-5 h-5" />
      case 'customers': return <Users className="w-5 h-5" />
      case 'orders': return <ShoppingCart className="w-5 h-5" />
      case 'financial': return <BarChart3 className="w-5 h-5" />
      default: return <BarChart3 className="w-5 h-5" />
    }
  }

  const getReportTypeColor = (type: string) => {
    switch (type) {
      case 'sales': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
      case 'inventory': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
      case 'customers': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
      case 'orders': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
      case 'financial': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
    }
  }

  const getWidgetColor = (color: string) => {
    switch (color) {
      case 'green': return 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
      case 'blue': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
      case 'purple': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
      case 'red': return 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('fa-IR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return dateString
    }
  }

  if (loading && reports.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/80 dark:to-gray-900 p-6 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-primary-600 animate-spin mx-auto mb-4" />
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
          <h1 className="text-3xl font-bold gradient-text mb-2">گزارشات عمومی</h1>
          <p className="text-gray-600 dark:text-gray-300">مدیریت و مشاهده گزارشات سیستم</p>
        </div>

        {/* Dashboard Widgets */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {dashboardWidgets.map((widget) => (
            <div key={widget.id} className="premium-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{widget.title}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{widget.value}</p>
                  <div className="flex items-center space-x-1 space-x-reverse mt-1">
                    {widget.changeType === 'increase' ? (
                      <TrendingUp className="w-4 h-4 text-green-500" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-500" />
                    )}
                    <span className={`text-sm font-medium ${
                      widget.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {Math.abs(widget.change)}%
                    </span>
                  </div>
                </div>
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getWidgetColor(widget.color)}`}>
                  {widget.color === 'green' && <DollarSign className="w-6 h-6" />}
                  {widget.color === 'blue' && <ShoppingCart className="w-6 h-6" />}
                  {widget.color === 'purple' && <Users className="w-6 h-6" />}
                  {widget.color === 'red' && <Package className="w-6 h-6" />}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="premium-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">کل گزارشات</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalReports}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
          <div className="premium-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">گزارشات زمان‌بندی شده</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.scheduledReports}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
          <div className="premium-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">گزارشات عمومی</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.publicReports}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <Eye className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
          <div className="premium-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">گزارشات امروز</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.recentReports}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="premium-card p-6 mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-4 space-x-reverse flex-wrap gap-4">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="all">همه انواع</option>
                <option value="sales">فروش</option>
                <option value="inventory">موجودی</option>
                <option value="customers">مشتریان</option>
                <option value="orders">سفارشات</option>
                <option value="financial">مالی</option>
              </select>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="all">همه دسته‌ها</option>
                <option value="فروش">فروش</option>
                <option value="موجودی">موجودی</option>
                <option value="مشتریان">مشتریان</option>
                <option value="سفارشات">سفارشات</option>
                <option value="مالی">مالی</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="lastUpdated">آخرین بروزرسانی</option>
                <option value="title">عنوان</option>
                <option value="category">دسته‌بندی</option>
              </select>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <button
                onClick={handleCreateReport}
                className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>ایجاد گزارش</span>
              </button>
              <button
                onClick={handleExport}
                className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>دانلود همه</span>
              </button>
              <button
                onClick={handleRefresh}
                className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>بروزرسانی</span>
              </button>
            </div>
          </div>
        </div>

        {/* Reports List - Modern Design */}
        {filteredReports.length === 0 ? (
          <div className="premium-card p-12 text-center">
            <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-300">
              {loading ? 'در حال بارگذاری...' : 'گزارشی یافت نشد'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredReports.map((report) => {
              const isSystemReport = report.id?.startsWith('sales-') || report.id?.startsWith('inventory-') || report.id?.startsWith('customers-') || report.id?.startsWith('financial-') || report.id?.startsWith('orders-')
              
              // Get labels for data keys
              const labels: any = {
                vipCustomers: 'مشتریان VIP',
                totalSpent: 'کل خرید',
                averageSpent: 'میانگین خرید',
                totalCustomers: 'کل مشتریان',
                totalSales: 'کل فروش',
                orderCount: 'تعداد سفارش',
                averageOrder: 'میانگین سفارش',
                totalItems: 'کل آیتم‌ها',
                lowStockItems: 'آیتم‌های کم‌موجود',
                totalValue: 'ارزش کل',
                revenue: 'درآمد',
                expenses: 'هزینه',
                profit: 'سود',
                pendingOrders: 'در انتظار',
                preparingOrders: 'در حال آماده‌سازی',
                readyOrders: 'آماده'
              }
              
              // Get main metrics for preview
              const mainMetrics = Object.entries(report.data || {}).slice(0, 3)
              
              return (
                <div 
                  key={report.id || report._id} 
                  className="premium-card overflow-hidden hover:shadow-xl transition-all duration-300 group cursor-pointer"
                  onClick={() => handleViewReport(report)}
                >
                  {/* Header with Gradient Background */}
                  <div className={`relative px-6 py-5 ${getReportTypeColor(report.type)} border-b border-gray-200 dark:border-gray-700`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 space-x-reverse flex-1">
                        <div className={`p-3 rounded-xl bg-white/20 dark:bg-gray-900/30 ${getReportTypeColor(report.type)} shadow-lg`}>
                          {getReportTypeIcon(report.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-lg text-gray-900 dark:text-white truncate">{report.title}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{report.category}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-1">
                        {report.isScheduled && (
                          <span className="px-2.5 py-1 bg-green-500/20 dark:bg-green-500/30 text-green-700 dark:text-green-300 rounded-full text-xs font-semibold whitespace-nowrap">
                            زمان‌بندی
                          </span>
                        )}
                        {report.isPublic && (
                          <span className="px-2.5 py-1 bg-blue-500/20 dark:bg-blue-500/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-semibold whitespace-nowrap">
                            عمومی
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6 space-y-4">
                    {/* Description */}
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed">
                        {report.description}
                      </p>
                    </div>

                    {/* Key Metrics Preview */}
                    <div className="grid grid-cols-1 gap-3">
                      {mainMetrics.map(([key, value]) => {
                        const metricIcons: any = {
                          vipCustomers: <Users className="w-4 h-4" />,
                          totalSpent: <DollarSign className="w-4 h-4" />,
                          averageSpent: <TrendingUp className="w-4 h-4" />,
                          totalCustomers: <Users className="w-4 h-4" />,
                          totalSales: <DollarSign className="w-4 h-4" />,
                          orderCount: <ShoppingCart className="w-4 h-4" />,
                          totalItems: <Package className="w-4 h-4" />,
                          lowStockItems: <AlertTriangle className="w-4 h-4" />,
                          totalValue: <DollarSign className="w-4 h-4" />,
                          revenue: <TrendingUp className="w-4 h-4" />,
                          expenses: <TrendingDown className="w-4 h-4" />,
                          profit: <BarChart3 className="w-4 h-4" />
                        }
                        
                        const metricColors: any = {
                          vipCustomers: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
                          totalSpent: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
                          averageSpent: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
                          totalCustomers: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
                          totalSales: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
                          orderCount: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
                          totalItems: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400',
                          lowStockItems: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
                          totalValue: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
                          revenue: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
                          expenses: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
                          profit: 'bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400'
                        }
                        
                        return (
                          <div key={key} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                            <div className="flex items-center space-x-3 space-x-reverse flex-1 min-w-0">
                              <div className={`p-1.5 rounded-lg ${metricColors[key] || 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'} flex-shrink-0`}>
                                {metricIcons[key] || <BarChart3 className="w-4 h-4" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5 truncate">
                                  {labels[key] || key}
                                </p>
                                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                                  {typeof value === 'number' 
                                    ? key.includes('Spent') || key.includes('Value') || key.includes('Sales') || key.includes('revenue') || key.includes('expenses') || key.includes('profit')
                                      ? `${value.toLocaleString('fa-IR')} تومان`
                                      : value.toLocaleString('fa-IR')
                                    : String(value)}
                                </p>
                              </div>
                            </div>
                            {report.type === 'customers' && key === 'vipCustomers' && (
                              <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-[10px] font-semibold flex-shrink-0 mr-2">
                                VIP
                              </span>
                            )}
                          </div>
                        )
                      })}
                    </div>

                    {/* Report Info Footer */}
                    <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <Clock className="w-3.5 h-3.5" />
                          <span className="truncate">{formatDate(report.lastUpdated).split(',')[0]}</span>
                        </div>
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <Users className="w-3.5 h-3.5" />
                          <span className="truncate">{report.createdBy}</span>
                        </div>
                      </div>
                      {report.isScheduled && (
                        <div className="mt-2 flex items-center space-x-1 space-x-reverse text-xs text-gray-500 dark:text-gray-400">
                          <Activity className="w-3.5 h-3.5" />
                          <span>فرکانس: {report.scheduleFrequency}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons Footer */}
                  <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleViewReport(report)
                        }}
                        className="flex-1 flex items-center justify-center space-x-2 space-x-reverse py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all duration-200 font-medium text-sm shadow-sm hover:shadow-md"
                      >
                        <Eye className="w-4 h-4" />
                        <span>مشاهده گزارش</span>
                      </button>
                      {!isSystemReport && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditReport(report)
                            }}
                            className="p-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200"
                            title="ویرایش"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteReport(report)
                            }}
                            className="p-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200"
                            title="حذف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Report Detail Modal - Modern Design */}
        {showReportModal && selectedReport && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-5xl mx-4 max-h-[95vh] overflow-hidden flex flex-col">
              {/* Header with Gradient */}
              <div className={`relative px-6 py-5 ${getReportTypeColor(selectedReport.type)} border-b border-gray-200 dark:border-gray-700`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className={`p-3 rounded-xl bg-white/20 dark:bg-gray-900/30 ${getReportTypeColor(selectedReport.type)}`}>
                      {getReportTypeIcon(selectedReport.type)}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">{selectedReport.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{selectedReport.category}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowReportModal(false)
                      setSelectedReport(null)
                    }}
                    className="p-2 hover:bg-white/20 dark:hover:bg-gray-900/30 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  </button>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Description Card */}
                <div className="premium-card p-5">
                  <div className="flex items-start space-x-3 space-x-reverse">
                    <FileText className="w-5 h-5 text-primary-600 dark:text-primary-400 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">توضیحات گزارش</h4>
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{selectedReport.description}</p>
                    </div>
                  </div>
                </div>

                {/* Key Metrics Grid */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2 space-x-reverse">
                    <Activity className="w-5 h-5 text-primary-600" />
                    <span>آمار کلیدی</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(selectedReport.data || {}).map(([key, value]) => {
                      const labels: any = {
                        vipCustomers: 'مشتریان VIP',
                        totalSpent: 'کل خرید',
                        averageSpent: 'میانگین خرید',
                        totalCustomers: 'کل مشتریان',
                        totalSales: 'کل فروش',
                        orderCount: 'تعداد سفارش',
                        averageOrder: 'میانگین سفارش',
                        totalItems: 'کل آیتم‌ها',
                        lowStockItems: 'آیتم‌های کم‌موجود',
                        totalValue: 'ارزش کل',
                        revenue: 'درآمد',
                        expenses: 'هزینه',
                        profit: 'سود',
                        pendingOrders: 'سفارشات در انتظار',
                        preparingOrders: 'سفارشات در حال آماده‌سازی',
                        readyOrders: 'سفارشات آماده'
                      }
                      const icons: any = {
                        vipCustomers: <Users className="w-5 h-5" />,
                        totalSpent: <DollarSign className="w-5 h-5" />,
                        averageSpent: <TrendingUp className="w-5 h-5" />,
                        totalCustomers: <Users className="w-5 h-5" />,
                        totalSales: <DollarSign className="w-5 h-5" />,
                        orderCount: <ShoppingCart className="w-5 h-5" />,
                        averageOrder: <BarChart3 className="w-5 h-5" />,
                        totalItems: <Package className="w-5 h-5" />,
                        lowStockItems: <AlertTriangle className="w-5 h-5" />,
                        totalValue: <DollarSign className="w-5 h-5" />,
                        revenue: <TrendingUp className="w-5 h-5" />,
                        expenses: <TrendingDown className="w-5 h-5" />,
                        profit: <BarChart3 className="w-5 h-5" />
                      }
                      const colors: any = {
                        vipCustomers: 'from-purple-500 to-purple-600',
                        totalSpent: 'from-green-500 to-green-600',
                        averageSpent: 'from-blue-500 to-blue-600',
                        totalCustomers: 'from-indigo-500 to-indigo-600',
                        totalSales: 'from-emerald-500 to-emerald-600',
                        orderCount: 'from-blue-500 to-blue-600',
                        revenue: 'from-green-500 to-green-600',
                        expenses: 'from-red-500 to-red-600',
                        profit: 'from-teal-500 to-teal-600',
                        lowStockItems: 'from-orange-500 to-orange-600'
                      }
                      
                      return (
                        <div key={key} className="premium-card p-5 hover:shadow-lg transition-all duration-300">
                          <div className="flex items-center justify-between mb-3">
                            <div className={`p-2 rounded-lg bg-gradient-to-br ${colors[key] || 'from-gray-500 to-gray-600'} text-white`}>
                              {icons[key] || <BarChart3 className="w-5 h-5" />}
                            </div>
                            {selectedReport.type === 'customers' && key === 'vipCustomers' && (
                              <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs font-medium">
                                VIP
                              </span>
                            )}
                          </div>
                          <h5 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                            {labels[key] || key}
                          </h5>
                          <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            {typeof value === 'number' 
                              ? key.includes('Spent') || key.includes('Value') || key.includes('Sales') || key.includes('revenue') || key.includes('expenses') || key.includes('profit')
                                ? `${value.toLocaleString('fa-IR')} تومان`
                                : value.toLocaleString('fa-IR')
                              : String(value)}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Charts Section */}
                <div className="space-y-6">
                  {selectedReport.type === 'customers' && getCustomerPieChartData(selectedReport).length > 0 && (
                    <div className="premium-card p-6">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2 space-x-reverse">
                        <PieChartIcon className="w-5 h-5 text-primary-600" />
                        <span>توزیع مشتریان</span>
                      </h4>
                      <div className="h-80 w-full">
                        <PieChart 
                          data={getCustomerPieChartData(selectedReport)}
                          title="توزیع مشتریان"
                          centerLabel="کل مشتریان"
                          centerValue={`${selectedReport.data?.totalCustomers || 0} نفر`}
                        />
                      </div>
                    </div>
                  )}
                  
                  {(getChartData(selectedReport) || getCustomerBarChartData(selectedReport).length > 0) && (
                    <div className="premium-card p-6">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2 space-x-reverse">
                        <BarChart3 className="w-5 h-5 text-primary-600" />
                        <span>تحلیل داده‌ها</span>
                      </h4>
                      <div className="h-80 w-full">
                        {selectedReport.type === 'customers' && getCustomerBarChartData(selectedReport).length > 0 ? (
                          <BarChart
                            data={getCustomerBarChartData(selectedReport)}
                            categories={['vipCustomers', 'totalSpent', 'averageSpent']}
                            colors={['#A855F7', '#10B981', '#3B82F6']}
                            height={320}
                          />
                        ) : getChartData(selectedReport) ? (
                          <BarChart
                            data={getChartData(selectedReport)!}
                            categories={selectedReport.type === 'financial' ? ['revenue', 'expenses', 'profit'] : ['revenue', 'orderCount']}
                            colors={selectedReport.type === 'financial' ? ['#10B981', '#EF4444', '#3B82F6'] : ['#10B981', '#3B82F6']}
                            height={320}
                          />
                        ) : null}
                      </div>
                    </div>
                  )}
                </div>

                {/* Report Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="premium-card p-5">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2 space-x-reverse">
                      <FileText className="w-4 h-4 text-primary-600" />
                      <span>اطلاعات گزارش</span>
                    </h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                        <span className="text-gray-600 dark:text-gray-400">نوع:</span>
                        <span className="font-medium text-gray-900 dark:text-white">{selectedReport.type}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                        <span className="text-gray-600 dark:text-gray-400">ایجاد شده توسط:</span>
                        <span className="font-medium text-gray-900 dark:text-white">{selectedReport.createdBy}</span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-gray-600 dark:text-gray-400">آخرین بروزرسانی:</span>
                        <span className="font-medium text-gray-900 dark:text-white">{formatDate(selectedReport.lastUpdated)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="premium-card p-5">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2 space-x-reverse">
                      <Settings className="w-4 h-4 text-primary-600" />
                      <span>تنظیمات</span>
                    </h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                        <span className="text-gray-600 dark:text-gray-400">زمان‌بندی شده:</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          selectedReport.isScheduled 
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}>
                          {selectedReport.isScheduled ? 'بله' : 'خیر'}
                        </span>
                      </div>
                      {selectedReport.isScheduled && (
                        <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                          <span className="text-gray-600 dark:text-gray-400">فرکانس:</span>
                          <span className="font-medium text-gray-900 dark:text-white">{selectedReport.scheduleFrequency}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center py-2">
                        <span className="text-gray-600 dark:text-gray-400">عمومی:</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          selectedReport.isPublic 
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}>
                          {selectedReport.isPublic ? 'بله' : 'خیر'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer with Actions */}
              <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 bg-gray-50 dark:bg-gray-900/50">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => {
                      setShowReportModal(false)
                      setSelectedReport(null)
                    }}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                  >
                    بستن
                  </button>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <button
                      onClick={handleRefresh}
                      className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>بروزرسانی</span>
                    </button>
                    <button
                      onClick={handleExport}
                      className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      <span>دانلود گزارش</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit/Create Report Modal */}
        {(showEditModal || showCreateModal) && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {showEditModal ? 'ویرایش گزارش' : 'ایجاد گزارش جدید'}
                </h3>
                <button
                  onClick={() => {
                    setShowEditModal(false)
                    setShowCreateModal(false)
                    setSelectedReport(null)
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    عنوان *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    توضیحات
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      نوع *
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as any, category: e.target.value === 'sales' ? 'فروش' : e.target.value === 'inventory' ? 'موجودی' : e.target.value === 'customers' ? 'مشتریان' : e.target.value === 'orders' ? 'سفارشات' : 'مالی' })}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      required
                    >
                      <option value="sales">فروش</option>
                      <option value="inventory">موجودی</option>
                      <option value="customers">مشتریان</option>
                      <option value="orders">سفارشات</option>
                      <option value="financial">مالی</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      دسته‌بندی
                    </label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 space-x-reverse">
                  <label className="flex items-center space-x-2 space-x-reverse">
                    <input
                      type="checkbox"
                      checked={formData.isScheduled}
                      onChange={(e) => setFormData({ ...formData, isScheduled: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">زمان‌بندی شده</span>
                  </label>
                  
                  {formData.isScheduled && (
                    <select
                      value={formData.scheduleFrequency}
                      onChange={(e) => setFormData({ ...formData, scheduleFrequency: e.target.value })}
                      className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      <option value="">انتخاب فرکانس</option>
                      <option value="روزانه">روزانه</option>
                      <option value="هفتگی">هفتگی</option>
                      <option value="ماهانه">ماهانه</option>
                    </select>
                  )}
                  
                  <label className="flex items-center space-x-2 space-x-reverse">
                    <input
                      type="checkbox"
                      checked={formData.isPublic}
                      onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">عمومی</span>
                  </label>
                </div>
                
                <div className="flex items-center justify-end space-x-2 space-x-reverse pt-4">
                  <button
                    onClick={() => {
                      setShowEditModal(false)
                      setShowCreateModal(false)
                      setSelectedReport(null)
                    }}
                    className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    انصراف
                  </button>
                  <button
                    onClick={handleSaveReport}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    ذخیره
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
