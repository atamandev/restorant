'use client'

import { useState } from 'react'
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
  Filter,
  RefreshCw,
  Eye,
  PieChart,
  LineChart,
  Activity,
  Calendar,
  Star,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'

interface ReportData {
  id: string
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
  icon: any
  color: string
}

const sampleReports: ReportData[] = [
  {
    id: '1',
    title: 'گزارش فروش روزانه',
    description: 'گزارش کامل فروش روزانه با جزئیات سفارشات',
    type: 'sales',
    category: 'فروش',
    data: { totalSales: 2500000, orderCount: 45, averageOrder: 55556 },
    lastUpdated: '1403/01/20 14:30',
    isScheduled: true,
    scheduleFrequency: 'روزانه',
    isPublic: true,
    createdBy: 'مدیر سیستم'
  },
  {
    id: '2',
    title: 'گزارش موجودی انبار',
    description: 'گزارش وضعیت موجودی و آیتم‌های کم‌موجود',
    type: 'inventory',
    category: 'موجودی',
    data: { totalItems: 150, lowStockItems: 5, totalValue: 15000000 },
    lastUpdated: '1403/01/20 12:00',
    isScheduled: true,
    scheduleFrequency: 'هفتگی',
    isPublic: false,
    createdBy: 'مدیر انبار'
  },
  {
    id: '3',
    title: 'گزارش مشتریان VIP',
    description: 'گزارش مشتریان VIP و خریدهای آن‌ها',
    type: 'customers',
    category: 'مشتریان',
    data: { vipCustomers: 25, totalSpent: 8500000, averageSpent: 340000 },
    lastUpdated: '1403/01/19 18:00',
    isScheduled: false,
    scheduleFrequency: '',
    isPublic: false,
    createdBy: 'مدیر فروش'
  },
  {
    id: '4',
    title: 'گزارش مالی ماهانه',
    description: 'گزارش کامل مالی شامل درآمد، هزینه و سود',
    type: 'financial',
    category: 'مالی',
    data: { revenue: 25000000, expenses: 18000000, profit: 7000000 },
    lastUpdated: '1403/01/15 09:00',
    isScheduled: true,
    scheduleFrequency: 'ماهانه',
    isPublic: true,
    createdBy: 'حسابدار'
  },
  {
    id: '5',
    title: 'گزارش سفارشات آشپزخانه',
    description: 'گزارش سفارشات در حال آماده‌سازی و زمان‌های تحویل',
    type: 'orders',
    category: 'سفارشات',
    data: { pendingOrders: 12, preparingOrders: 8, readyOrders: 5 },
    lastUpdated: '1403/01/20 15:45',
    isScheduled: false,
    scheduleFrequency: '',
    isPublic: false,
    createdBy: 'مدیر آشپزخانه'
  }
]

const dashboardWidgets: DashboardWidget[] = [
  {
    id: '1',
    title: 'فروش امروز',
    value: '2,500,000 تومان',
    change: 12.5,
    changeType: 'increase',
    icon: DollarSign,
    color: 'green'
  },
  {
    id: '2',
    title: 'سفارشات جدید',
    value: '45 سفارش',
    change: 8.3,
    changeType: 'increase',
    icon: ShoppingCart,
    color: 'blue'
  },
  {
    id: '3',
    title: 'مشتریان فعال',
    value: '125 مشتری',
    change: -2.1,
    changeType: 'decrease',
    icon: Users,
    color: 'purple'
  },
  {
    id: '4',
    title: 'موجودی کم',
    value: '5 آیتم',
    change: 0,
    changeType: 'increase',
    icon: AlertTriangle,
    color: 'red'
  }
]

export default function GeneralReportsPage() {
  const [reports, setReports] = useState<ReportData[]>(sampleReports)
  const [selectedReport, setSelectedReport] = useState<ReportData | null>(null)
  const [showReportModal, setShowReportModal] = useState(false)
  const [filterType, setFilterType] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [sortBy, setSortBy] = useState('lastUpdated')

  const filteredReports = reports.filter(report => {
    const matchesType = filterType === 'all' || report.type === filterType
    const matchesCategory = filterCategory === 'all' || report.category === filterCategory
    return matchesType && matchesCategory
  }).sort((a, b) => {
    switch (sortBy) {
      case 'title': return a.title.localeCompare(b.title)
      case 'lastUpdated': return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
      case 'category': return a.category.localeCompare(b.category)
      default: return 0
    }
  })

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

  const getTotalReports = () => reports.length
  const getScheduledReports = () => reports.filter(report => report.isScheduled).length
  const getPublicReports = () => reports.filter(report => report.isPublic).length
  const getRecentReports = () => {
    const today = new Date()
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
    return reports.filter(report => new Date(report.lastUpdated) > yesterday).length
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
                      {widget.change}%
                    </span>
                  </div>
                </div>
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getWidgetColor(widget.color)}`}>
                  <widget.icon className="w-6 h-6" />
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
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{getTotalReports()}</p>
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
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{getScheduledReports()}</p>
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
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{getPublicReports()}</p>
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
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{getRecentReports()}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="premium-card p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 space-x-reverse">
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
              <button className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                <Download className="w-4 h-4" />
                <span>دانلود همه</span>
              </button>
              <button className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                <RefreshCw className="w-4 h-4" />
                <span>بروزرسانی</span>
              </button>
            </div>
          </div>
        </div>

        {/* Reports List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReports.map((report) => (
            <div key={report.id} className="premium-card p-6 hover:shadow-glow transition-all duration-300">
              {/* Report Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <span className={`p-2 rounded-lg ${getReportTypeColor(report.type)}`}>
                    {getReportTypeIcon(report.type)}
                  </span>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{report.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{report.category}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-1 space-x-reverse">
                  {report.isScheduled && (
                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-medium">
                      زمان‌بندی شده
                    </span>
                  )}
                  {report.isPublic && (
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium">
                      عمومی
                    </span>
                  )}
                </div>
              </div>

              {/* Report Description */}
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                {report.description}
              </p>

              {/* Report Data Preview */}
              <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">پیش‌نمایش داده‌ها:</h4>
                <div className="space-y-1">
                  {Object.entries(report.data).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-300">{key}:</span>
                      <span className="text-gray-900 dark:text-white font-medium">
                        {typeof value === 'number' ? value.toLocaleString('fa-IR') : value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Report Info */}
              <div className="mb-4 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center justify-between">
                  <span>آخرین بروزرسانی: {report.lastUpdated}</span>
                  <span>ایجاد شده توسط: {report.createdBy}</span>
                </div>
                {report.isScheduled && (
                  <div className="mt-1">
                    <span>فرکانس: {report.scheduleFrequency}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2 space-x-reverse">
                <button
                  onClick={() => {
                    setSelectedReport(report)
                    setShowReportModal(true)
                  }}
                  className="flex-1 flex items-center justify-center space-x-2 space-x-reverse py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  <span>مشاهده</span>
                </button>
                <button className="flex items-center justify-center space-x-2 space-x-reverse py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                  <Download className="w-4 h-4" />
                  <span>دانلود</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Report Detail Modal */}
        {showReportModal && selectedReport && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {selectedReport.title}
              </h3>
              
              {/* Report Info */}
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">اطلاعات گزارش</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">دسته‌بندی:</span>
                        <span className="text-gray-900 dark:text-white">{selectedReport.category}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">نوع:</span>
                        <span className="text-gray-900 dark:text-white">{selectedReport.type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">ایجاد شده توسط:</span>
                        <span className="text-gray-900 dark:text-white">{selectedReport.createdBy}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">آخرین بروزرسانی:</span>
                        <span className="text-gray-900 dark:text-white">{selectedReport.lastUpdated}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">تنظیمات</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">زمان‌بندی شده:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          selectedReport.isScheduled 
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}>
                          {selectedReport.isScheduled ? 'بله' : 'خیر'}
                        </span>
                      </div>
                      {selectedReport.isScheduled && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-300">فرکانس:</span>
                          <span className="text-gray-900 dark:text-white">{selectedReport.scheduleFrequency}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">عمومی:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
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

              {/* Report Description */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">توضیحات</h4>
                <p className="text-gray-700 dark:text-gray-300">{selectedReport.description}</p>
              </div>

              {/* Report Data */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 dark:text-white mb-4">داده‌های گزارش</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(selectedReport.data).map(([key, value]) => (
                    <div key={key} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <h5 className="font-medium text-gray-900 dark:text-white mb-1">{key}</h5>
                      <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                        {typeof value === 'number' ? value.toLocaleString('fa-IR') : value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chart Placeholder */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 dark:text-white mb-4">نمودار</h4>
                <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <div className="text-center">
                    <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 dark:text-gray-400">نمودار گزارش</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500">
                      نمودار مربوط به {selectedReport.title}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-3 space-x-reverse">
                <button
                  onClick={() => setShowReportModal(false)}
                  className="flex-1 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                >
                  بستن
                </button>
                <button className="flex-1 flex items-center justify-center space-x-2 space-x-reverse py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                  <Download className="w-4 h-4" />
                  <span>دانلود گزارش</span>
                </button>
                <button className="flex items-center justify-center space-x-2 space-x-reverse py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                  <RefreshCw className="w-4 h-4" />
                  <span>بروزرسانی</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
