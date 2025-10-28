'use client'

import React, { useState } from 'react'
import {
  AlertTriangle,
  Package,
  Bell,
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  Filter,
  MapPin,
  User,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Download,
  Printer,
  RefreshCw,
  ArrowUpRight,
  ArrowDownLeft,
  ClipboardList,
  Settings,
  Calendar,
  DollarSign,
  Activity,
  FileText,
  Warehouse,
  Loader,
  ShoppingCart,
  AlertCircle,
  Zap,
  Target
} from 'lucide-react'

interface StockAlert {
  id: string
  itemName: string
  itemCode: string
  category: string
  warehouse: string
  currentStock: number
  minStock: number
  maxStock: number
  unit: string
  unitPrice: number
  totalValue: number
  alertType: 'low_stock' | 'critical_stock' | 'out_of_stock' | 'overstock'
  alertLevel: 'warning' | 'critical' | 'urgent'
  lastMovement: string
  daysSinceLastMovement: number
  suggestedAction: string
  status: 'active' | 'resolved' | 'ignored'
  createdAt: string
}

const mockStockAlerts: StockAlert[] = [
  {
    id: '1',
    itemName: 'گوشت گوساله',
    itemCode: 'MEAT-001',
    category: 'مواد اولیه',
    warehouse: 'انبار اصلی',
    currentStock: 8,
    minStock: 15,
    maxStock: 50,
    unit: 'کیلوگرم',
    unitPrice: 180000,
    totalValue: 1440000,
    alertType: 'low_stock',
    alertLevel: 'warning',
    lastMovement: '1403/09/14',
    daysSinceLastMovement: 2,
    suggestedAction: 'سفارش فوری 20 کیلوگرم گوشت گوساله',
    status: 'active',
    createdAt: '1403/09/15'
  },
  {
    id: '2',
    itemName: 'روغن آفتابگردان',
    itemCode: 'OIL-001',
    category: 'مواد اولیه',
    warehouse: 'انبار مواد اولیه',
    currentStock: 2,
    minStock: 10,
    maxStock: 30,
    unit: 'لیتر',
    unitPrice: 25000,
    totalValue: 50000,
    alertType: 'critical_stock',
    alertLevel: 'critical',
    lastMovement: '1403/09/13',
    daysSinceLastMovement: 3,
    suggestedAction: 'خرید فوری 25 لیتر روغن آفتابگردان',
    status: 'active',
    createdAt: '1403/09/15'
  },
  {
    id: '3',
    itemName: 'پیاز',
    itemCode: 'VEG-001',
    category: 'سبزیجات',
    warehouse: 'انبار اصلی',
    currentStock: 0,
    minStock: 5,
    maxStock: 20,
    unit: 'کیلوگرم',
    unitPrice: 8000,
    totalValue: 0,
    alertType: 'out_of_stock',
    alertLevel: 'urgent',
    lastMovement: '1403/09/12',
    daysSinceLastMovement: 4,
    suggestedAction: 'خرید اضطراری 15 کیلوگرم پیاز',
    status: 'active',
    createdAt: '1403/09/15'
  },
  {
    id: '4',
    itemName: 'برنج ایرانی',
    itemCode: 'RICE-001',
    category: 'مواد اولیه',
    warehouse: 'انبار مواد اولیه',
    currentStock: 120,
    minStock: 20,
    maxStock: 100,
    unit: 'کیلوگرم',
    unitPrice: 45000,
    totalValue: 5400000,
    alertType: 'overstock',
    alertLevel: 'warning',
    lastMovement: '1403/09/15',
    daysSinceLastMovement: 1,
    suggestedAction: 'بررسی تاریخ انقضا و استفاده از موجودی اضافی',
    status: 'active',
    createdAt: '1403/09/15'
  },
  {
    id: '5',
    itemName: 'نمک',
    itemCode: 'SALT-001',
    category: 'مواد اولیه',
    warehouse: 'انبار اصلی',
    currentStock: 3,
    minStock: 8,
    maxStock: 25,
    unit: 'کیلوگرم',
    unitPrice: 5000,
    totalValue: 15000,
    alertType: 'low_stock',
    alertLevel: 'warning',
    lastMovement: '1403/09/10',
    daysSinceLastMovement: 6,
    suggestedAction: 'سفارش 10 کیلوگرم نمک',
    status: 'resolved',
    createdAt: '1403/09/15'
  }
]

const getAlertTypeColor = (type: string) => {
  switch (type) {
    case 'low_stock': return 'text-yellow-600 dark:text-yellow-400'
    case 'critical_stock': return 'text-orange-600 dark:text-orange-400'
    case 'out_of_stock': return 'text-red-600 dark:text-red-400'
    case 'overstock': return 'text-blue-600 dark:text-blue-400'
    default: return 'text-gray-600 dark:text-gray-400'
  }
}

const getAlertTypeBadge = (type: string) => {
  switch (type) {
    case 'low_stock': return <span className="status-badge bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">موجودی کم</span>
    case 'critical_stock': return <span className="status-badge bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">موجودی بحرانی</span>
    case 'out_of_stock': return <span className="status-badge bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">تمام شده</span>
    case 'overstock': return <span className="status-badge bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">موجودی اضافی</span>
    default: return null
  }
}

const getAlertLevelColor = (level: string) => {
  switch (level) {
    case 'warning': return 'text-yellow-600 dark:text-yellow-400'
    case 'critical': return 'text-orange-600 dark:text-orange-400'
    case 'urgent': return 'text-red-600 dark:text-red-400'
    default: return 'text-gray-600 dark:text-gray-400'
  }
}

const getAlertLevelBadge = (level: string) => {
  switch (level) {
    case 'warning': return <span className="status-badge bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">هشدار</span>
    case 'critical': return <span className="status-badge bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">بحرانی</span>
    case 'urgent': return <span className="status-badge bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">فوری</span>
    default: return null
  }
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'active': return <span className="status-badge bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">فعال</span>
    case 'resolved': return <span className="status-badge bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">حل شده</span>
    case 'ignored': return <span className="status-badge bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300">نادیده گرفته</span>
    default: return null
  }
}

export default function StockAlertsPage() {
  const [alerts, setAlerts] = useState<StockAlert[]>(mockStockAlerts)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterLevel, setFilterLevel] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterWarehouse, setFilterWarehouse] = useState('all')

  const filteredAlerts = alerts.filter(alert =>
    (searchTerm === '' || 
      alert.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.itemCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.category.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (filterType === 'all' || alert.alertType === filterType) &&
    (filterLevel === 'all' || alert.alertLevel === filterLevel) &&
    (filterStatus === 'all' || alert.status === filterStatus) &&
    (filterWarehouse === 'all' || alert.warehouse === filterWarehouse)
  )

  const totalAlerts = alerts.length
  const activeAlerts = alerts.filter(a => a.status === 'active').length
  const urgentAlerts = alerts.filter(a => a.alertLevel === 'urgent' && a.status === 'active').length
  const criticalAlerts = alerts.filter(a => a.alertLevel === 'critical' && a.status === 'active').length
  const resolvedAlerts = alerts.filter(a => a.status === 'resolved').length

  const handleResolveAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { ...alert, status: 'resolved' as const }
        : alert
    ))
    alert('هشدار حل شد.')
  }

  const handleIgnoreAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { ...alert, status: 'ignored' as const }
        : alert
    ))
    alert('هشدار نادیده گرفته شد.')
  }

  const handleCreatePurchaseOrder = (alert: StockAlert) => {
    alert(`سفارش خرید برای ${alert.itemName} ایجاد شد.`)
  }

  const handleExport = () => {
    alert('گزارش هشدارهای موجودی به صورت Excel صادر شد.')
  }

  const handlePrint = () => {
    window.print()
  }

  const handleRefresh = () => {
    alert('هشدارهای موجودی بروزرسانی شد.')
  }

  return (
    <div className="fade-in-animation space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">هشدارهای موجودی</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            نظارت بر موجودی‌ها و دریافت هشدارهای هوشمند برای مدیریت بهتر انبار.
          </p>
        </div>
        <div className="flex items-center space-x-3 space-x-reverse">
          <button
            onClick={handleRefresh}
            className="premium-button flex items-center space-x-2 space-x-reverse"
          >
            <RefreshCw className="w-5 h-5" />
            <span>بروزرسانی</span>
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
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">کل هشدارها</h3>
            <Bell className="w-6 h-6 text-primary-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{totalAlerts}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">هشدار ثبت شده</p>
        </div>

        <div className="premium-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">هشدارهای فعال</h3>
            <AlertTriangle className="w-6 h-6 text-warning-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{activeAlerts}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">نیاز به اقدام</p>
        </div>

        <div className="premium-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">هشدارهای فوری</h3>
            <AlertCircle className="w-6 h-6 text-danger-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{urgentAlerts}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">اولویت بالا</p>
        </div>

        <div className="premium-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">حل شده</h3>
            <CheckCircle className="w-6 h-6 text-success-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{resolvedAlerts}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">هشدار حل شده</p>
        </div>
      </div>

      {/* Urgent Alerts Banner */}
      {urgentAlerts > 0 && (
        <div className="premium-card p-4 border-red-200 bg-red-50 dark:bg-red-900/20">
          <div className="flex items-center space-x-3 space-x-reverse">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <div>
              <p className="font-semibold text-red-800 dark:text-red-300">
                {urgentAlerts} هشدار فوری نیاز به اقدام فوری دارد!
              </p>
              <p className="text-sm text-red-600 dark:text-red-400">
                لطفاً فوراً این هشدارها را بررسی و اقدامات لازم را انجام دهید.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="premium-card p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="جستجو هشدار..."
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
            <option value="low_stock">موجودی کم</option>
            <option value="critical_stock">موجودی بحرانی</option>
            <option value="out_of_stock">تمام شده</option>
            <option value="overstock">موجودی اضافی</option>
          </select>
          <select
            className="premium-input"
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
          >
            <option value="all">همه سطوح</option>
            <option value="warning">هشدار</option>
            <option value="critical">بحرانی</option>
            <option value="urgent">فوری</option>
          </select>
          <select
            className="premium-input"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">همه وضعیت‌ها</option>
            <option value="active">فعال</option>
            <option value="resolved">حل شده</option>
            <option value="ignored">نادیده گرفته</option>
          </select>
          <select
            className="premium-input"
            value={filterWarehouse}
            onChange={(e) => setFilterWarehouse(e.target.value)}
          >
            <option value="all">همه انبارها</option>
            <option value="انبار اصلی">انبار اصلی</option>
            <option value="انبار مواد اولیه">انبار مواد اولیه</option>
            <option value="انبار محصولات نهایی">انبار محصولات نهایی</option>
          </select>
        </div>

        {/* Alerts Table */}
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-right whitespace-nowrap">
            <thead>
              <tr className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-800/50">
                <th className="px-4 py-3 rounded-r-lg">نام آیتم</th>
                <th className="px-4 py-3">کد</th>
                <th className="px-4 py-3">انبار</th>
                <th className="px-4 py-3">موجودی فعلی</th>
                <th className="px-4 py-3">حداقل</th>
                <th className="px-4 py-3">نوع هشدار</th>
                <th className="px-4 py-3">سطح</th>
                <th className="px-4 py-3">وضعیت</th>
                <th className="px-4 py-3">آخرین حرکت</th>
                <th className="px-4 py-3">اقدام پیشنهادی</th>
                <th className="px-4 py-3 rounded-l-lg">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredAlerts.map(alert => (
                <tr key={alert.id} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <Package className="w-5 h-5 text-primary-600" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{alert.itemName}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{alert.category}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-200 font-mono">{alert.itemCode}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{alert.warehouse}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{alert.currentStock} {alert.unit}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{alert.minStock} {alert.unit}</td>
                  <td className="px-4 py-3">
                    {getAlertTypeBadge(alert.alertType)}
                  </td>
                  <td className="px-4 py-3">
                    {getAlertLevelBadge(alert.alertLevel)}
                  </td>
                  <td className="px-4 py-3">
                    {getStatusBadge(alert.status)}
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-200">
                    <div>
                      <p className="text-sm">{alert.lastMovement}</p>
                      <p className="text-xs text-gray-500">{alert.daysSinceLastMovement} روز پیش</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-200">
                    <p className="text-sm max-w-xs truncate">{alert.suggestedAction}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      {alert.status === 'active' && (
                        <>
                          <button
                            onClick={() => handleCreatePurchaseOrder(alert)}
                            className="p-1 rounded-full text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                            title="ایجاد سفارش خرید"
                          >
                            <ShoppingCart className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleResolveAlert(alert.id)}
                            className="p-1 rounded-full text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                            title="حل کردن"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleIgnoreAlert(alert.id)}
                            className="p-1 rounded-full text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-900/30 transition-colors"
                            title="نادیده گرفتن"
                          >
                            <XCircle className="w-4 h-4" />
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
      </div>

      {/* Quick Actions */}
      <div className="premium-card p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2 space-x-reverse">
          <Zap className="w-6 h-6 text-primary-600" />
          <span>اقدامات سریع</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="premium-card p-4 flex items-center space-x-3 space-x-reverse hover:shadow-glow transition-all duration-300">
            <ShoppingCart className="w-8 h-8 text-green-600" />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">سفارش خرید فوری</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">ایجاد سفارش برای آیتم‌های کم‌موجود</p>
            </div>
          </button>
          <button className="premium-card p-4 flex items-center space-x-3 space-x-reverse hover:shadow-glow transition-all duration-300">
            <Target className="w-8 h-8 text-blue-600" />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">تنظیم حداقل موجودی</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">بهینه‌سازی سطوح هشدار</p>
            </div>
          </button>
          <button className="premium-card p-4 flex items-center space-x-3 space-x-reverse hover:shadow-glow transition-all duration-300">
            <TrendingUp className="w-8 h-8 text-purple-600" />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">گزارش تحلیلی</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">تحلیل روند موجودی‌ها</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
