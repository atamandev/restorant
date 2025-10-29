'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  ClipboardList,
  BarChart3,
  PieChart,
  TrendingUp,
  TrendingDown,
  Download,
  Printer,
  Search,
  Filter,
  Calendar,
  Warehouse,
  Package,
  DollarSign,
  Users,
  Activity,
  RefreshCw,
  Eye,
  FileText,
  ArrowUpRight,
  ArrowDownLeft,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  ShoppingCart,
  Truck,
  ArrowRightLeft,
  Bell,
  Settings,
  Zap,
  Database,
  FileSpreadsheet,
  BookOpen,
  Trash2,
  Loader
} from 'lucide-react'

interface InventoryReport {
  id: string
  name: string
  type: 'stock_level' | 'movement' | 'valuation' | 'turnover' | 'aging'
  description: string
  generatedDate: string
  period: string
  totalItems: number
  totalValue: number
  status: 'ready' | 'generating' | 'error'
  fileSize: string
  downloadCount: number
}

interface StockLevelData {
  warehouse: string
  totalItems: number
  totalValue: number
  lowStockItems: number
  criticalStockItems: number
  overstockItems: number
  turnoverRate: number
}

interface MovementData {
  date: string
  receipts: number
  issues: number
  transfers: number
  adjustments: number
  netMovement: number
}


const getReportTypeColor = (type: string) => {
  switch (type) {
    case 'stock_level': return 'text-blue-600 dark:text-blue-400'
    case 'movement': return 'text-green-600 dark:text-green-400'
    case 'valuation': return 'text-purple-600 dark:text-purple-400'
    case 'turnover': return 'text-orange-600 dark:text-orange-400'
    case 'aging': return 'text-red-600 dark:text-red-400'
    default: return 'text-gray-600 dark:text-gray-400'
  }
}

const getReportTypeIcon = (type: string) => {
  switch (type) {
    case 'stock_level': return <Package className="w-5 h-5" />
    case 'movement': return <Activity className="w-5 h-5" />
    case 'valuation': return <DollarSign className="w-5 h-5" />
    case 'turnover': return <TrendingUp className="w-5 h-5" />
    case 'aging': return <Clock className="w-5 h-5" />
    default: return <FileText className="w-5 h-5" />
  }
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'ready': return <span className="status-badge bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">آماده</span>
    case 'generating': return <span className="status-badge bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">در حال تولید</span>
    case 'error': return <span className="status-badge bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">خطا</span>
    default: return null
  }
}

export default function InventoryReportsPage() {
  const [reports, setReports] = useState<InventoryReport[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedPeriod, setSelectedPeriod] = useState('current_month')
  const [activeTab, setActiveTab] = useState<'reports' | 'analytics' | 'charts'>('reports')
  const [loading, setLoading] = useState(false)
  const [stockLevelData, setStockLevelData] = useState<StockLevelData[]>([])
  const [movementData, setMovementData] = useState<MovementData[]>([])
  const [stats, setStats] = useState({
    totalReports: 0,
    readyReports: 0,
    generatingReports: 0,
    totalDownloads: 0
  })

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('fa-IR')
  }

  // بارگذاری گزارشات
  const fetchReports = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (filterType !== 'all') params.append('type', filterType)
      if (filterStatus !== 'all') params.append('status', filterStatus)
      if (selectedPeriod !== 'current_month') params.append('period', selectedPeriod)

      const response = await fetch(`/api/inventory-reports?${params.toString()}`)
      const data = await response.json()
      if (data.success) {
        setReports(data.data.map((r: any) => ({
          ...r,
          id: r._id || r.id,
          generatedDate: formatDate(r.generatedDate)
        })))
        if (data.stats) {
          setStats(data.stats)
        }
      }
    } catch (error) {
      console.error('Error fetching reports:', error)
    } finally {
      setLoading(false)
    }
  }, [searchTerm, filterType, filterStatus, selectedPeriod])

  // بارگذاری تحلیل سطح موجودی
  const fetchStockLevelAnalytics = useCallback(async () => {
    try {
      const response = await fetch('/api/inventory-reports/analytics/stock-level')
      const data = await response.json()
      if (data.success) {
        setStockLevelData(data.data)
      }
    } catch (error) {
      console.error('Error fetching stock level analytics:', error)
    }
  }, [])

  // بارگذاری تحلیل گردش موجودی
  const fetchMovementAnalytics = useCallback(async () => {
    try {
      const response = await fetch('/api/inventory-reports/analytics/movement?days=30')
      const data = await response.json()
      if (data.success) {
        setMovementData(data.data.map((d: any) => ({
          ...d,
          date: formatDate(d.date)
        })))
      }
    } catch (error) {
      console.error('Error fetching movement analytics:', error)
    }
  }, [])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  useEffect(() => {
    if (activeTab === 'analytics') {
      fetchStockLevelAnalytics()
      fetchMovementAnalytics()
    }
  }, [activeTab, fetchStockLevelAnalytics, fetchMovementAnalytics])

  const filteredReports = reports.filter(report =>
    (searchTerm === '' || 
      report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.description.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (filterType === 'all' || report.type === filterType) &&
    (filterStatus === 'all' || report.status === filterStatus)
  )

  const handleGenerateReport = async (type: string) => {
    try {
      setLoading(true)
      const response = await fetch('/api/inventory-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          period: selectedPeriod,
          generate: true
        })
      })
      const data = await response.json()
      if (data.success) {
        await fetchReports()
        alert('گزارش با موفقیت تولید شد')
      } else {
        alert('خطا: ' + data.message)
      }
    } catch (error) {
      console.error('Error generating report:', error)
      alert('خطا در تولید گزارش')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadReport = async (reportId: string) => {
    try {
      const response = await fetch(`/api/inventory-reports/${reportId}/download`, {
        method: 'POST'
      })
      const data = await response.json()
      if (data.success) {
        // به‌روزرسانی گزارش با تعداد جدید دانلود
        setReports(prev => prev.map(r => 
          r.id === reportId 
            ? { ...r, downloadCount: data.data.downloadCount || r.downloadCount + 1 }
            : r
        ))
        
        // در اینجا می‌توانید فایل را دانلود کنید
        // برای نمونه، ما فقط پیام می‌دهیم
        alert(`گزارش ${data.data.name} آماده دانلود است.`)
      } else {
        alert('خطا: ' + data.message)
      }
    } catch (error) {
      console.error('Error downloading report:', error)
      alert('خطا در دانلود گزارش')
    }
  }

  const handleAddSampleData = async () => {
    if (!confirm('آیا می‌خواهید داده‌های نمونه اضافه شوند؟')) {
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/add-sample-inventory-reports', {
        method: 'POST'
      })
      const data = await response.json()
      if (data.success) {
        await fetchReports()
        alert(`داده‌های نمونه با موفقیت اضافه شد:\n- ${data.data.reports} گزارش`)
      } else {
        alert('خطا: ' + data.message)
      }
    } catch (error) {
      console.error('Error adding sample data:', error)
      alert('خطا در اضافه کردن داده‌های نمونه')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteReport = async (reportId: string) => {
    if (!confirm('آیا مطمئن هستید که می‌خواهید این گزارش را حذف کنید؟')) {
      return
    }

    try {
      const response = await fetch(`/api/inventory-reports/${reportId}`, {
        method: 'DELETE'
      })
      const data = await response.json()
      if (data.success) {
        await fetchReports()
        alert('گزارش با موفقیت حذف شد')
      } else {
        alert('خطا: ' + data.message)
      }
    } catch (error) {
      console.error('Error deleting report:', error)
      alert('خطا در حذف گزارش')
    }
  }

  const handlePrintReport = (reportId: string) => {
    const report = reports.find(r => r.id === reportId)
    if (report) {
      alert(`گزارش ${report.name} برای چاپ آماده شد.`)
    }
  }

  const handleExport = () => {
    alert('گزارشات انبار به صورت Excel صادر شد.')
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="fade-in-animation space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">گزارشات انبار</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            گزارشات جامع و تحلیل‌های پیشرفته از وضعیت انبار و موجودی‌ها.
          </p>
        </div>
        <div className="flex items-center space-x-3 space-x-reverse">
          <button
            onClick={handleAddSampleData}
            className="premium-button flex items-center space-x-2 space-x-reverse"
          >
            <Database className="w-5 h-5" />
            <span>داده نمونه</span>
          </button>
          <button
            onClick={handlePrint}
            className="premium-button p-3"
          >
            <Printer className="w-5 h-5" />
          </button>
          <button
            onClick={handleExport}
            className="premium-button p-3"
          >
            <Download className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="premium-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">کل گزارشات</h3>
            <ClipboardList className="w-6 h-6 text-primary-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalReports}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">گزارش تولید شده</p>
        </div>

        <div className="premium-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">آماده دانلود</h3>
            <CheckCircle className="w-6 h-6 text-success-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.readyReports}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">گزارش آماده</p>
        </div>

        <div className="premium-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">در حال تولید</h3>
            <RefreshCw className="w-6 h-6 text-warning-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.generatingReports}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">گزارش در حال تولید</p>
        </div>

        <div className="premium-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">کل دانلودها</h3>
            <Download className="w-6 h-6 text-accent-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalDownloads}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">بار دانلود شده</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="premium-card p-6">
        <div className="flex space-x-1 space-x-reverse bg-gray-100 dark:bg-gray-800 rounded-lg p-1 mb-6">
          <button
            onClick={() => setActiveTab('reports')}
            className={`flex-1 flex items-center justify-center space-x-2 space-x-reverse px-4 py-2 rounded-md transition-all duration-200 ${
              activeTab === 'reports'
                ? 'bg-white dark:bg-gray-700 text-primary-600 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <FileText className="w-5 h-5" />
            <span>گزارشات</span>
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex-1 flex items-center justify-center space-x-2 space-x-reverse px-4 py-2 rounded-md transition-all duration-200 ${
              activeTab === 'analytics'
                ? 'bg-white dark:bg-gray-700 text-primary-600 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span>تحلیل‌ها</span>
          </button>
          <button
            onClick={() => setActiveTab('charts')}
            className={`flex-1 flex items-center justify-center space-x-2 space-x-reverse px-4 py-2 rounded-md transition-all duration-200 ${
              activeTab === 'charts'
                ? 'bg-white dark:bg-gray-700 text-primary-600 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <PieChart className="w-5 h-5" />
            <span>نمودارها</span>
          </button>
        </div>

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <>
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="جستجو گزارش..."
                  className="premium-input pr-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                className="premium-input"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="all">همه انواع</option>
                <option value="stock_level">سطح موجودی</option>
                <option value="movement">گردش موجودی</option>
                <option value="valuation">ارزش‌گذاری</option>
                <option value="turnover">گردش کالا</option>
                <option value="aging">کهنگی موجودی</option>
              </select>
              <select
                className="premium-input"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">همه وضعیت‌ها</option>
                <option value="ready">آماده</option>
                <option value="generating">در حال تولید</option>
                <option value="error">خطا</option>
              </select>
              <select
                className="premium-input"
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
              >
                <option value="current_month">ماه جاری</option>
                <option value="last_month">ماه گذشته</option>
                <option value="last_3_months">3 ماه گذشته</option>
                <option value="last_6_months">6 ماه گذشته</option>
                <option value="last_year">سال گذشته</option>
              </select>
            </div>

            {/* Reports Table */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-8 h-8 animate-spin text-primary-600" />
              </div>
            ) : (
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-right whitespace-nowrap">
                <thead>
                  <tr className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-800/50">
                    <th className="px-4 py-3 rounded-r-lg">نام گزارش</th>
                    <th className="px-4 py-3">نوع</th>
                    <th className="px-4 py-3">توضیحات</th>
                    <th className="px-4 py-3">تاریخ تولید</th>
                    <th className="px-4 py-3">دوره</th>
                    <th className="px-4 py-3">تعداد آیتم‌ها</th>
                    <th className="px-4 py-3">ارزش کل</th>
                    <th className="px-4 py-3">وضعیت</th>
                    <th className="px-4 py-3">حجم فایل</th>
                    <th className="px-4 py-3">دانلودها</th>
                    <th className="px-4 py-3 rounded-l-lg">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredReports.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                        هیچ گزارشی یافت نشد. برای شروع، داده‌های نمونه اضافه کنید.
                      </td>
                    </tr>
                  ) : (
                  filteredReports.map(report => (
                    <tr key={report.id} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-3 space-x-reverse">
                          {getReportTypeIcon(report.type)}
                          <span className="font-medium text-gray-900 dark:text-white">{report.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getReportTypeColor(report.type)}`}>
                          {report.type === 'stock_level' ? 'سطح موجودی' :
                           report.type === 'movement' ? 'گردش موجودی' :
                           report.type === 'valuation' ? 'ارزش‌گذاری' :
                           report.type === 'turnover' ? 'گردش کالا' :
                           report.type === 'aging' ? 'کهنگی موجودی' : report.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200 max-w-xs truncate">{report.description}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{report.generatedDate}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200">
                        {report.period === 'current_month' ? 'ماه جاری' :
                         report.period === 'last_month' ? 'ماه گذشته' :
                         report.period === 'last_3_months' ? '3 ماه گذشته' :
                         report.period === 'last_6_months' ? '6 ماه گذشته' :
                         report.period === 'last_year' ? 'سال گذشته' :
                         report.period}
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{report.totalItems}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{report.totalValue.toLocaleString('fa-IR')} تومان</td>
                      <td className="px-4 py-3">
                        {getStatusBadge(report.status)}
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{report.fileSize}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{report.downloadCount}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          {report.status === 'ready' && (
                            <>
                              <button
                                onClick={() => handleDownloadReport(report.id)}
                                className="p-1 rounded-full text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                                title="دانلود"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handlePrintReport(report.id)}
                                className="p-1 rounded-full text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                                title="چاپ"
                              >
                                <Printer className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          <button className="p-1 rounded-full text-purple-600 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteReport(report.id)}
                            className="p-1 rounded-full text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                            title="حذف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                  )}
                </tbody>
              </table>
            </div>
            )}
          </>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Stock Level Analytics */}
            <div className="premium-card p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2 space-x-reverse">
                <Package className="w-6 h-6 text-primary-600" />
                <span>تحلیل سطح موجودی</span>
              </h2>
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-right whitespace-nowrap">
                  <thead>
                    <tr className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-800/50">
                      <th className="px-4 py-3 rounded-r-lg">انبار</th>
                      <th className="px-4 py-3">کل آیتم‌ها</th>
                      <th className="px-4 py-3">ارزش کل</th>
                      <th className="px-4 py-3">موجودی کم</th>
                      <th className="px-4 py-3">موجودی بحرانی</th>
                      <th className="px-4 py-3">موجودی اضافی</th>
                      <th className="px-4 py-3">نرخ گردش</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {stockLevelData.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                          داده‌ای برای نمایش وجود ندارد
                        </td>
                      </tr>
                    ) : (
                    stockLevelData.map((data, index) => (
                      <tr key={index} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <td className="px-4 py-3 text-gray-900 dark:text-white">{data.warehouse}</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{data.totalItems}</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{data.totalValue.toLocaleString('fa-IR')} تومان</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{data.lowStockItems}</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{data.criticalStockItems}</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{data.overstockItems}</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{data.turnoverRate.toFixed(2)}</td>
                      </tr>
                    ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Movement Analytics */}
            <div className="premium-card p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2 space-x-reverse">
                <Activity className="w-6 h-6 text-success-600" />
                <span>تحلیل گردش موجودی</span>
              </h2>
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-right whitespace-nowrap">
                  <thead>
                    <tr className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-800/50">
                      <th className="px-4 py-3 rounded-r-lg">تاریخ</th>
                      <th className="px-4 py-3">ورودی</th>
                      <th className="px-4 py-3">خروجی</th>
                      <th className="px-4 py-3">انتقال</th>
                      <th className="px-4 py-3">تعدیل</th>
                      <th className="px-4 py-3">گردش خالص</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {movementData.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                          داده‌ای برای نمایش وجود ندارد
                        </td>
                      </tr>
                    ) : (
                    movementData.map((data, index) => (
                      <tr key={index} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <td className="px-4 py-3 text-gray-900 dark:text-white">{data.date}</td>
                        <td className="px-4 py-3 text-green-600 dark:text-green-400">{data.receipts.toLocaleString('fa-IR')}</td>
                        <td className="px-4 py-3 text-red-600 dark:text-red-400">{data.issues.toLocaleString('fa-IR')}</td>
                        <td className="px-4 py-3 text-blue-600 dark:text-blue-400">{data.transfers.toLocaleString('fa-IR')}</td>
                        <td className="px-4 py-3 text-purple-600 dark:text-purple-400">{data.adjustments.toLocaleString('fa-IR')}</td>
                        <td className={`px-4 py-3 ${data.netMovement >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {data.netMovement.toLocaleString('fa-IR')}
                        </td>
                      </tr>
                    ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Charts Tab */}
        {activeTab === 'charts' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="premium-card p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2 space-x-reverse">
                  <PieChart className="w-6 h-6 text-primary-600" />
                  <span>توزیع موجودی بر اساس انبار</span>
                </h2>
                <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center text-gray-500 dark:text-gray-400">
                  <p>نمودار دایره‌ای توزیع موجودی در اینجا قرار می‌گیرد.</p>
                </div>
              </div>

              <div className="premium-card p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2 space-x-reverse">
                  <BarChart3 className="w-6 h-6 text-success-600" />
                  <span>روند گردش موجودی</span>
                </h2>
                <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center text-gray-500 dark:text-gray-400">
                  <p>نمودار ستونی روند گردش در اینجا قرار می‌گیرد.</p>
                </div>
              </div>
            </div>

            <div className="premium-card p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2 space-x-reverse">
                <TrendingUp className="w-6 h-6 text-accent-600" />
                <span>تحلیل روند ارزش موجودی</span>
              </h2>
              <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center text-gray-500 dark:text-gray-400">
                <p>نمودار خطی روند ارزش در اینجا قرار می‌گیرد.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="premium-card p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2 space-x-reverse">
          <Zap className="w-6 h-6 text-primary-600" />
          <span>تولید گزارش سریع</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={() => handleGenerateReport('stock_level')}
            className="premium-card p-4 flex items-center space-x-3 space-x-reverse hover:shadow-glow transition-all duration-300"
          >
            <Package className="w-8 h-8 text-blue-600" />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">گزارش سطح موجودی</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">تولید گزارش کامل سطح موجودی</p>
            </div>
          </button>
          <button 
            onClick={() => handleGenerateReport('movement')}
            className="premium-card p-4 flex items-center space-x-3 space-x-reverse hover:shadow-glow transition-all duration-300"
          >
            <Activity className="w-8 h-8 text-green-600" />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">گزارش گردش موجودی</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">تحلیل گردش موجودی‌ها</p>
            </div>
          </button>
          <button 
            onClick={() => handleGenerateReport('valuation')}
            className="premium-card p-4 flex items-center space-x-3 space-x-reverse hover:shadow-glow transition-all duration-300"
          >
            <DollarSign className="w-8 h-8 text-purple-600" />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">گزارش ارزش‌گذاری</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">ارزش‌گذاری موجودی‌ها</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
