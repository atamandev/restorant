'use client'

import React, { useState } from 'react'
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
  BookOpen
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

const mockReports: InventoryReport[] = [
  {
    id: '1',
    name: 'گزارش سطح موجودی',
    type: 'stock_level',
    description: 'گزارش کامل سطح موجودی تمام انبارها',
    generatedDate: '1403/09/15',
    period: 'ماه جاری',
    totalItems: 150,
    totalValue: 25000000,
    status: 'ready',
    fileSize: '2.5 MB',
    downloadCount: 12
  },
  {
    id: '2',
    name: 'گزارش گردش موجودی',
    type: 'movement',
    description: 'تحلیل گردش موجودی‌ها در 30 روز گذشته',
    generatedDate: '1403/09/14',
    period: '30 روز گذشته',
    totalItems: 85,
    totalValue: 18000000,
    status: 'ready',
    fileSize: '1.8 MB',
    downloadCount: 8
  },
  {
    id: '3',
    name: 'گزارش ارزش موجودی',
    type: 'valuation',
    description: 'ارزش‌گذاری موجودی‌ها بر اساس روش FIFO',
    generatedDate: '1403/09/13',
    period: 'ماه جاری',
    totalItems: 150,
    totalValue: 25000000,
    status: 'ready',
    fileSize: '3.2 MB',
    downloadCount: 15
  },
  {
    id: '4',
    name: 'گزارش گردش کالا',
    type: 'turnover',
    description: 'نرخ گردش کالا و تحلیل ABC',
    generatedDate: '1403/09/12',
    period: '3 ماه گذشته',
    totalItems: 120,
    totalValue: 22000000,
    status: 'generating',
    fileSize: '0 MB',
    downloadCount: 0
  },
  {
    id: '5',
    name: 'گزارش کهنگی موجودی',
    type: 'aging',
    description: 'تحلیل کهنگی و انقضای موجودی‌ها',
    generatedDate: '1403/09/11',
    period: '6 ماه گذشته',
    totalItems: 95,
    totalValue: 15000000,
    status: 'ready',
    fileSize: '2.1 MB',
    downloadCount: 6
  }
]

const mockStockLevelData: StockLevelData[] = [
  {
    warehouse: 'انبار اصلی',
    totalItems: 75,
    totalValue: 12000000,
    lowStockItems: 8,
    criticalStockItems: 2,
    overstockItems: 3,
    turnoverRate: 4.2
  },
  {
    warehouse: 'انبار مواد اولیه',
    totalItems: 45,
    totalValue: 8000000,
    lowStockItems: 5,
    criticalStockItems: 1,
    overstockItems: 2,
    turnoverRate: 6.8
  },
  {
    warehouse: 'انبار محصولات نهایی',
    totalItems: 30,
    totalValue: 5000000,
    lowStockItems: 2,
    criticalStockItems: 0,
    overstockItems: 1,
    turnoverRate: 3.5
  }
]

const mockMovementData: MovementData[] = [
  { date: '1403/09/15', receipts: 1500000, issues: 1200000, transfers: 300000, adjustments: 50000, netMovement: 350000 },
  { date: '1403/09/14', receipts: 2000000, issues: 1800000, transfers: 200000, adjustments: 0, netMovement: 0 },
  { date: '1403/09/13', receipts: 800000, issues: 1500000, transfers: 100000, adjustments: -100000, netMovement: -700000 },
  { date: '1403/09/12', receipts: 1200000, issues: 1000000, transfers: 150000, adjustments: 25000, netMovement: 375000 },
  { date: '1403/09/11', receipts: 1800000, issues: 1600000, transfers: 250000, adjustments: 0, netMovement: 450000 }
]

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
  const [reports, setReports] = useState<InventoryReport[]>(mockReports)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedPeriod, setSelectedPeriod] = useState('current_month')
  const [activeTab, setActiveTab] = useState<'reports' | 'analytics' | 'charts'>('reports')

  const filteredReports = reports.filter(report =>
    (searchTerm === '' || 
      report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.description.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (filterType === 'all' || report.type === filterType) &&
    (filterStatus === 'all' || report.status === filterStatus)
  )

  const totalReports = reports.length
  const readyReports = reports.filter(r => r.status === 'ready').length
  const generatingReports = reports.filter(r => r.status === 'generating').length
  const totalDownloads = reports.reduce((sum, r) => sum + r.downloadCount, 0)

  const handleGenerateReport = (type: string) => {
    alert(`گزارش ${type} در حال تولید است...`)
  }

  const handleDownloadReport = (reportId: string) => {
    const report = reports.find(r => r.id === reportId)
    if (report) {
      alert(`گزارش ${report.name} دانلود شد.`)
      setReports(prev => prev.map(r => 
        r.id === reportId 
          ? { ...r, downloadCount: r.downloadCount + 1 }
          : r
      ))
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
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{totalReports}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">گزارش تولید شده</p>
        </div>

        <div className="premium-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">آماده دانلود</h3>
            <CheckCircle className="w-6 h-6 text-success-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{readyReports}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">گزارش آماده</p>
        </div>

        <div className="premium-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">در حال تولید</h3>
            <RefreshCw className="w-6 h-6 text-warning-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{generatingReports}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">گزارش در حال تولید</p>
        </div>

        <div className="premium-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">کل دانلودها</h3>
            <Download className="w-6 h-6 text-accent-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{totalDownloads}</p>
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
                  {filteredReports.map(report => (
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
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{report.period}</td>
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
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
                    {mockStockLevelData.map((data, index) => (
                      <tr key={index} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <td className="px-4 py-3 text-gray-900 dark:text-white">{data.warehouse}</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{data.totalItems}</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{data.totalValue.toLocaleString('fa-IR')} تومان</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{data.lowStockItems}</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{data.criticalStockItems}</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{data.overstockItems}</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{data.turnoverRate}</td>
                      </tr>
                    ))}
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
                    {mockMovementData.map((data, index) => (
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
                    ))}
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
