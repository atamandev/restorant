'use client'

import React, { useState } from 'react'
import {
  FileText,
  User,
  Clock,
  Search,
  Filter,
  Download,
  Eye,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Plus,
  RefreshCw,
  Calendar,
  MapPin,
  Monitor,
  Shield,
  Database,
  ShoppingCart,
  DollarSign,
  Users,
  Package,
  Settings,
  LogIn,
  LogOut,
  Key,
  Lock,
  Unlock,
  Printer,
  Upload,
  Download as DownloadIcon,
  Activity,
  TrendingUp,
  TrendingDown,
  Info,
  ExternalLink
} from 'lucide-react'

interface AuditLogEntry {
  id: string
  userId: string
  userName: string
  action: string
  entity: string
  entityId: string
  entityName: string
  timestamp: string
  ipAddress: string
  userAgent: string
  status: 'success' | 'failed' | 'warning'
  details: string
  beforeData?: any
  afterData?: any
  changes?: string[]
  sessionId: string
  location?: string
}

interface FilterOptions {
  userId: string
  action: string
  entity: string
  status: string
  dateFrom: string
  dateTo: string
  ipAddress: string
}

const mockAuditLogs: AuditLogEntry[] = [
  {
    id: 'A001',
    userId: 'U001',
    userName: 'علی احمدی',
    action: 'CREATE',
    entity: 'INVOICE',
    entityId: 'INV-123',
    entityName: 'فاکتور فروش #123',
    timestamp: '2023-11-22 14:30:25',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    status: 'success',
    details: 'ایجاد فاکتور فروش جدید',
    changes: ['مبلغ: 0 → 1,200,000 تومان', 'مشتری: - → علی کریمی'],
    sessionId: 'SESS-001',
    location: 'تهران، ایران'
  },
  {
    id: 'A002',
    userId: 'U002',
    userName: 'فاطمه کریمی',
    action: 'UPDATE',
    entity: 'CUSTOMER',
    entityId: 'CUST-456',
    entityName: 'مشتری: محمد رضایی',
    timestamp: '2023-11-22 14:25:10',
    ipAddress: '192.168.1.101',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    status: 'success',
    details: 'ویرایش اطلاعات مشتری',
    changes: ['تلفن: 09123456789 → 09123456788', 'آدرس: تهران → اصفهان'],
    sessionId: 'SESS-002',
    location: 'اصفهان، ایران'
  },
  {
    id: 'A003',
    userId: 'U001',
    userName: 'علی احمدی',
    action: 'DELETE',
    entity: 'PRODUCT',
    entityId: 'PROD-789',
    entityName: 'محصول: کباب کوبیده',
    timestamp: '2023-11-22 14:20:45',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    status: 'success',
    details: 'حذف محصول از منو',
    changes: ['وضعیت: فعال → حذف شده'],
    sessionId: 'SESS-001',
    location: 'تهران، ایران'
  },
  {
    id: 'A004',
    userId: 'U003',
    userName: 'رضا حسینی',
    action: 'LOGIN',
    entity: 'USER',
    entityId: 'U003',
    entityName: 'ورود به سیستم',
    timestamp: '2023-11-22 14:15:30',
    ipAddress: '192.168.1.102',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
    status: 'success',
    details: 'ورود موفق به سیستم',
    sessionId: 'SESS-003',
    location: 'شیراز، ایران'
  },
  {
    id: 'A005',
    userId: 'U004',
    userName: 'نامشخص',
    action: 'LOGIN',
    entity: 'USER',
    entityId: 'U004',
    entityName: 'تلاش ورود ناموفق',
    timestamp: '2023-11-22 14:10:15',
    ipAddress: '192.168.1.103',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    status: 'failed',
    details: 'ورود ناموفق - رمز عبور اشتباه',
    sessionId: 'SESS-004',
    location: 'کرج، ایران'
  },
  {
    id: 'A006',
    userId: 'U001',
    userName: 'علی احمدی',
    action: 'EXPORT',
    entity: 'REPORT',
    entityId: 'RPT-001',
    entityName: 'گزارش فروش روزانه',
    timestamp: '2023-11-22 14:05:20',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    status: 'success',
    details: 'خروجی گرفتن از گزارش فروش',
    changes: ['فرمت: Excel', 'تاریخ: 2023-11-22'],
    sessionId: 'SESS-001',
    location: 'تهران، ایران'
  },
  {
    id: 'A007',
    userId: 'U002',
    userName: 'فاطمه کریمی',
    action: 'PRINT',
    entity: 'INVOICE',
    entityId: 'INV-124',
    entityName: 'چاپ فاکتور #124',
    timestamp: '2023-11-22 14:00:10',
    ipAddress: '192.168.1.101',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    status: 'success',
    details: 'چاپ فاکتور فروش',
    sessionId: 'SESS-002',
    location: 'اصفهان، ایران'
  },
  {
    id: 'A008',
    userId: 'U001',
    userName: 'علی احمدی',
    action: 'UPDATE',
    entity: 'SETTINGS',
    entityId: 'SET-001',
    entityName: 'تنظیمات سیستم',
    timestamp: '2023-11-22 13:55:45',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    status: 'warning',
    details: 'تغییر تنظیمات امنیتی',
    changes: ['رمز عبور: تغییر یافت', 'دسترسی: محدود شد'],
    sessionId: 'SESS-001',
    location: 'تهران، ایران'
  }
]

const getActionIcon = (action: string) => {
  switch (action) {
    case 'CREATE': return <Plus className="w-4 h-4 text-green-600" />
    case 'UPDATE': return <Edit className="w-4 h-4 text-blue-600" />
    case 'DELETE': return <Trash2 className="w-4 h-4 text-red-600" />
    case 'LOGIN': return <LogIn className="w-4 h-4 text-purple-600" />
    case 'LOGOUT': return <LogOut className="w-4 h-4 text-gray-600" />
    case 'PRINT': return <Printer className="w-4 h-4 text-orange-600" />
    case 'EXPORT': return <DownloadIcon className="w-4 h-4 text-indigo-600" />
    case 'IMPORT': return <Upload className="w-4 h-4 text-cyan-600" />
    case 'VIEW': return <Eye className="w-4 h-4 text-gray-600" />
    default: return <Activity className="w-4 h-4 text-gray-600" />
  }
}

const getEntityIcon = (entity: string) => {
  switch (entity) {
    case 'INVOICE': return <FileText className="w-4 h-4 text-blue-600" />
    case 'CUSTOMER': return <Users className="w-4 h-4 text-green-600" />
    case 'PRODUCT': return <Package className="w-4 h-4 text-purple-600" />
    case 'USER': return <User className="w-4 h-4 text-orange-600" />
    case 'REPORT': return <TrendingUp className="w-4 h-4 text-indigo-600" />
    case 'SETTINGS': return <Settings className="w-4 h-4 text-gray-600" />
    case 'PAYMENT': return <DollarSign className="w-4 h-4 text-green-600" />
    case 'ORDER': return <ShoppingCart className="w-4 h-4 text-blue-600" />
    default: return <Database className="w-4 h-4 text-gray-600" />
  }
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'success': return <span className="status-badge bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">موفق</span>
    case 'failed': return <span className="status-badge bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">ناموفق</span>
    case 'warning': return <span className="status-badge bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">هشدار</span>
    default: return null
  }
}

const getActionBadge = (action: string) => {
  switch (action) {
    case 'CREATE': return <span className="status-badge bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">ایجاد</span>
    case 'UPDATE': return <span className="status-badge bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">ویرایش</span>
    case 'DELETE': return <span className="status-badge bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">حذف</span>
    case 'LOGIN': return <span className="status-badge bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">ورود</span>
    case 'LOGOUT': return <span className="status-badge bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">خروج</span>
    case 'PRINT': return <span className="status-badge bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">چاپ</span>
    case 'EXPORT': return <span className="status-badge bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300">خروجی</span>
    case 'IMPORT': return <span className="status-badge bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300">ورودی</span>
    case 'VIEW': return <span className="status-badge bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">مشاهده</span>
    default: return <span className="status-badge bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">{action}</span>
  }
}

export default function AuditLogPage() {
  const [activeTab, setActiveTab] = useState<'logs' | 'analytics' | 'settings'>('logs')
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<FilterOptions>({
    userId: '',
    action: '',
    entity: '',
    status: '',
    dateFrom: '',
    dateTo: '',
    ipAddress: ''
  })
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null)
  const [showLogModal, setShowLogModal] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  const filteredLogs = mockAuditLogs.filter(log =>
    (filters.userId === '' || log.userId === filters.userId) &&
    (filters.action === '' || log.action === filters.action) &&
    (filters.entity === '' || log.entity === filters.entity) &&
    (filters.status === '' || log.status === filters.status) &&
    (filters.ipAddress === '' || log.ipAddress.includes(filters.ipAddress)) &&
    (filters.dateFrom === '' || log.timestamp >= filters.dateFrom) &&
    (filters.dateTo === '' || log.timestamp <= filters.dateTo) &&
    (log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
     log.entityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
     log.details.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const handleViewLogDetails = (log: AuditLogEntry) => {
    setSelectedLog(log)
    setShowLogModal(true)
  }

  const LogDetailsModal = () => {
    if (!selectedLog) return null

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="premium-card w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold gradient-text">جزئیات فعالیت</h2>
            <button onClick={() => setShowLogModal(false)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
              <XCircle className="w-6 h-6 text-gray-600 dark:text-gray-300" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-3">
              <p className="text-gray-700 dark:text-gray-300 flex items-center space-x-2 space-x-reverse">
                <User className="w-5 h-5 text-primary-600" />
                <span>کاربر: <span className="font-medium">{selectedLog.userName}</span></span>
              </p>
              <p className="text-gray-700 dark:text-gray-300 flex items-center space-x-2 space-x-reverse">
                {getActionIcon(selectedLog.action)}
                <span>عمل: {getActionBadge(selectedLog.action)}</span>
              </p>
              <p className="text-gray-700 dark:text-gray-300 flex items-center space-x-2 space-x-reverse">
                {getEntityIcon(selectedLog.entity)}
                <span>موجودیت: <span className="font-medium">{selectedLog.entityName}</span></span>
              </p>
              <p className="text-gray-700 dark:text-gray-300 flex items-center space-x-2 space-x-reverse">
                <Clock className="w-5 h-5 text-primary-600" />
                <span>زمان: <span className="font-medium">{selectedLog.timestamp}</span></span>
              </p>
            </div>
            <div className="space-y-3">
              <p className="text-gray-700 dark:text-gray-300 flex items-center space-x-2 space-x-reverse">
                <MapPin className="w-5 h-5 text-primary-600" />
                <span>IP: <span className="font-medium">{selectedLog.ipAddress}</span></span>
              </p>
              <p className="text-gray-700 dark:text-gray-300 flex items-center space-x-2 space-x-reverse">
                <Monitor className="w-5 h-5 text-primary-600" />
                <span>مرورگر: <span className="font-medium text-xs">{selectedLog.userAgent.split(' ')[0]}</span></span>
              </p>
              <p className="text-gray-700 dark:text-gray-300 flex items-center space-x-2 space-x-reverse">
                <Shield className="w-5 h-5 text-primary-600" />
                <span>وضعیت: {getStatusBadge(selectedLog.status)}</span>
              </p>
              <p className="text-gray-700 dark:text-gray-300 flex items-center space-x-2 space-x-reverse">
                <Key className="w-5 h-5 text-primary-600" />
                <span>جلسه: <span className="font-medium">{selectedLog.sessionId}</span></span>
              </p>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">توضیحات</h3>
            <p className="text-gray-700 dark:text-gray-300">{selectedLog.details}</p>
          </div>

          {selectedLog.changes && selectedLog.changes.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">تغییرات</h3>
              <div className="space-y-2">
                {selectedLog.changes.map((change, index) => (
                  <div key={index} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-gray-700 dark:text-gray-300">{change}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedLog.beforeData && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">داده‌های قبل</h3>
              <pre className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm text-gray-700 dark:text-gray-300 overflow-x-auto">
                {JSON.stringify(selectedLog.beforeData, null, 2)}
              </pre>
            </div>
          )}

          {selectedLog.afterData && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">داده‌های بعد</h3>
              <pre className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm text-gray-700 dark:text-gray-300 overflow-x-auto">
                {JSON.stringify(selectedLog.afterData, null, 2)}
              </pre>
            </div>
          )}

          <div className="flex justify-end">
            <button onClick={() => setShowLogModal(false)} className="premium-button bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">
              بستن
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fade-in-animation space-y-6">
      <h1 className="text-3xl font-bold gradient-text">گزارش فعالیت کاربران</h1>
      <p className="text-gray-600 dark:text-gray-300 mt-1">
        ردیابی و تحلیل تمام فعالیت‌های کاربران در سیستم برای امنیت و پاسخگویی.
      </p>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="premium-card p-4 text-center">
          <Activity className="w-8 h-8 text-primary-600 mx-auto mb-2" />
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{mockAuditLogs.length}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">کل فعالیت‌ها</p>
        </div>
        <div className="premium-card p-4 text-center">
          <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
            {mockAuditLogs.filter(log => log.status === 'success').length}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">موفق</p>
        </div>
        <div className="premium-card p-4 text-center">
          <XCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
            {mockAuditLogs.filter(log => log.status === 'failed').length}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">ناموفق</p>
        </div>
        <div className="premium-card p-4 text-center">
          <AlertTriangle className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
            {mockAuditLogs.filter(log => log.status === 'warning').length}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">هشدار</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="premium-card p-2 flex space-x-2 space-x-reverse mb-6">
        <button
          onClick={() => setActiveTab('logs')}
          className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'logs' ? 'bg-primary-600 text-white shadow-md' : 'bg-transparent text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          لاگ فعالیت‌ها
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'analytics' ? 'bg-primary-600 text-white shadow-md' : 'bg-transparent text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          تحلیل‌ها
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'settings' ? 'bg-primary-600 text-white shadow-md' : 'bg-transparent text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          تنظیمات
        </button>
      </div>

      {/* Content based on activeTab */}
      {activeTab === 'logs' && (
        <div className="premium-card p-6">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 space-y-4 md:space-y-0">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2 space-x-reverse">
              <FileText className="w-6 h-6 text-primary-600" />
              <span>لاگ فعالیت‌های کاربران</span>
            </h2>
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="جستجو در لاگ‌ها..."
                  className="premium-input pr-10 pl-4 py-2.5 w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="premium-button p-2.5"
              >
                <Filter className="w-5 h-5" />
              </button>
              <button className="premium-button p-2.5">
                <Download className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="premium-card p-4 mb-6 bg-gray-50 dark:bg-gray-800/50">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">فیلترهای پیشرفته</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">کاربر</label>
                  <select
                    className="premium-input w-full"
                    value={filters.userId}
                    onChange={(e) => setFilters({...filters, userId: e.target.value})}
                  >
                    <option value="">همه کاربران</option>
                    <option value="U001">علی احمدی</option>
                    <option value="U002">فاطمه کریمی</option>
                    <option value="U003">رضا حسینی</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">عمل</label>
                  <select
                    className="premium-input w-full"
                    value={filters.action}
                    onChange={(e) => setFilters({...filters, action: e.target.value})}
                  >
                    <option value="">همه اعمال</option>
                    <option value="CREATE">ایجاد</option>
                    <option value="UPDATE">ویرایش</option>
                    <option value="DELETE">حذف</option>
                    <option value="LOGIN">ورود</option>
                    <option value="PRINT">چاپ</option>
                    <option value="EXPORT">خروجی</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">موجودیت</label>
                  <select
                    className="premium-input w-full"
                    value={filters.entity}
                    onChange={(e) => setFilters({...filters, entity: e.target.value})}
                  >
                    <option value="">همه موجودیت‌ها</option>
                    <option value="INVOICE">فاکتور</option>
                    <option value="CUSTOMER">مشتری</option>
                    <option value="PRODUCT">محصول</option>
                    <option value="USER">کاربر</option>
                    <option value="REPORT">گزارش</option>
                    <option value="SETTINGS">تنظیمات</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">وضعیت</label>
                  <select
                    className="premium-input w-full"
                    value={filters.status}
                    onChange={(e) => setFilters({...filters, status: e.target.value})}
                  >
                    <option value="">همه وضعیت‌ها</option>
                    <option value="success">موفق</option>
                    <option value="failed">ناموفق</option>
                    <option value="warning">هشدار</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">از تاریخ</label>
                  <input
                    type="datetime-local"
                    className="premium-input w-full"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">تا تاریخ</label>
                  <input
                    type="datetime-local"
                    className="premium-input w-full"
                    value={filters.dateTo}
                    onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">آدرس IP</label>
                  <input
                    type="text"
                    placeholder="192.168.1.100"
                    className="premium-input w-full"
                    value={filters.ipAddress}
                    onChange={(e) => setFilters({...filters, ipAddress: e.target.value})}
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => setFilters({
                      userId: '',
                      action: '',
                      entity: '',
                      status: '',
                      dateFrom: '',
                      dateTo: '',
                      ipAddress: ''
                    })}
                    className="premium-button w-full bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                  >
                    پاک کردن فیلترها
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-right whitespace-nowrap">
              <thead>
                <tr className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-800/50">
                  <th className="px-4 py-3 rounded-r-lg">زمان</th>
                  <th className="px-4 py-3">کاربر</th>
                  <th className="px-4 py-3">عمل</th>
                  <th className="px-4 py-3">موجودیت</th>
                  <th className="px-4 py-3">توضیحات</th>
                  <th className="px-4 py-3">IP</th>
                  <th className="px-4 py-3">وضعیت</th>
                  <th className="px-4 py-3 rounded-l-lg">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-3 text-center text-gray-500 dark:text-gray-400">
                      هیچ لاگی یافت نشد.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map(log => (
                    <tr key={log.id} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{log.timestamp}</td>
                      <td className="px-4 py-3 text-gray-900 dark:text-white">{log.userName}</td>
                      <td className="px-4 py-3 flex items-center space-x-2 space-x-reverse">
                        {getActionIcon(log.action)}
                        {getActionBadge(log.action)}
                      </td>
                      <td className="px-4 py-3 flex items-center space-x-2 space-x-reverse">
                        {getEntityIcon(log.entity)}
                        <span className="text-gray-700 dark:text-gray-200">{log.entityName}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200 max-w-xs truncate">{log.details}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{log.ipAddress}</td>
                      <td className="px-4 py-3">{getStatusBadge(log.status)}</td>
                      <td className="px-4 py-3 flex items-center space-x-2 space-x-reverse">
                        <button 
                          onClick={() => handleViewLogDetails(log)}
                          className="p-2 rounded-full text-primary-600 hover:bg-primary-100 dark:hover:bg-primary-900/30"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="premium-card p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2 space-x-reverse">
              <TrendingUp className="w-6 h-6 text-primary-600" />
              <span>آمار فعالیت‌ها</span>
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-700 dark:text-gray-300">ایجاد</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {mockAuditLogs.filter(log => log.action === 'CREATE').length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700 dark:text-gray-300">ویرایش</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {mockAuditLogs.filter(log => log.action === 'UPDATE').length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700 dark:text-gray-300">حذف</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {mockAuditLogs.filter(log => log.action === 'DELETE').length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700 dark:text-gray-300">ورود</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {mockAuditLogs.filter(log => log.action === 'LOGIN').length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700 dark:text-gray-300">چاپ</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {mockAuditLogs.filter(log => log.action === 'PRINT').length}
                </span>
              </div>
            </div>
          </div>

          <div className="premium-card p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2 space-x-reverse">
              <Users className="w-6 h-6 text-green-600" />
              <span>فعال‌ترین کاربران</span>
            </h2>
            <div className="space-y-4">
              {['علی احمدی', 'فاطمه کریمی', 'رضا حسینی'].map((user, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-gray-700 dark:text-gray-300">{user}</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {mockAuditLogs.filter(log => log.userName === user).length}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="premium-card p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2 space-x-reverse">
            <Settings className="w-6 h-6 text-primary-600" />
            <span>تنظیمات لاگ</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">نگهداری لاگ‌ها (روز)</label>
                <input type="number" className="premium-input w-full" defaultValue="90" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">حداکثر حجم لاگ (MB)</label>
                <input type="number" className="premium-input w-full" defaultValue="1000" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">فشرده‌سازی</label>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <input type="checkbox" className="rounded" defaultChecked />
                  <span className="text-sm text-gray-600 dark:text-gray-300">فعال کردن فشرده‌سازی</span>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">اعلان‌های امنیتی</label>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <input type="checkbox" className="rounded" defaultChecked />
                  <span className="text-sm text-gray-600 dark:text-gray-300">فعال کردن اعلان‌ها</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">لاگ IP های مشکوک</label>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <input type="checkbox" className="rounded" defaultChecked />
                  <span className="text-sm text-gray-600 dark:text-gray-300">ردیابی IP های مشکوک</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">لاگ تغییرات حساس</label>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <input type="checkbox" className="rounded" defaultChecked />
                  <span className="text-sm text-gray-600 dark:text-gray-300">ردیابی تغییرات مهم</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showLogModal && <LogDetailsModal />}
    </div>
  )
}
