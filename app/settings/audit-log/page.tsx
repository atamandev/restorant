'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
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
  id?: string
  _id?: string
  userId: string
  userName: string
  action: string
  entity: string
  entityId: string
  entityName: string
  timestamp: string | Date
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

interface StatsData {
  totalLogs: number
  successLogs: number
  failedLogs: number
  warningLogs: number
  actionStats: Array<{ _id: string; count: number }>
  topUsers: Array<{ _id: string; userName: string; count: number }>
}

interface AnalyticsData {
  actionStats: Array<{ _id: string; count: number }>
  entityStats: Array<{ _id: string; count: number }>
  statusStats: Array<{ _id: string; count: number }>
  topUsers: Array<{ _id: string; userName: string; count: number }>
  dailyActivity: Array<{ _id: string; count: number }>
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
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([])
  const [stats, setStats] = useState<StatsData | null>(null)
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchDebounced, setSearchDebounced] = useState('')
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
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [logToDelete, setLogToDelete] = useState<string | null>(null)
  
  // Form state for creating new log
  const [logForm, setLogForm] = useState({
    userId: '',
    userName: '',
    action: 'CREATE',
    entity: 'INVOICE',
    entityId: '',
    entityName: '',
    ipAddress: '',
    userAgent: '',
    status: 'success' as 'success' | 'failed' | 'warning',
    details: '',
    location: ''
  })

  // Fetch audit logs
  const fetchAuditLogs = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filters.userId) params.append('userId', filters.userId)
      if (filters.action) params.append('action', filters.action)
      if (filters.entity) params.append('entity', filters.entity)
      if (filters.status) params.append('status', filters.status)
      if (filters.ipAddress) params.append('ipAddress', filters.ipAddress)
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom)
      if (filters.dateTo) params.append('dateTo', filters.dateTo)
      if (searchDebounced) params.append('search', searchDebounced)
      params.append('sortBy', 'timestamp')
      params.append('sortOrder', 'desc')
      params.append('limit', '100')

      const response = await fetch(`/api/audit-log?${params.toString()}`)
      const result = await response.json()
      if (result.success) {
        setAuditLogs(result.data || [])
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error)
      alert('خطا در دریافت لاگ‌ها')
    } finally {
      setLoading(false)
    }
  }, [filters, searchDebounced])

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/audit-log?type=stats')
      const result = await response.json()
      if (result.success) {
        setStats(result.data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }, [])

  // Fetch analytics
  const fetchAnalytics = useCallback(async () => {
    try {
      const response = await fetch('/api/audit-log?type=analytics')
      const result = await response.json()
      if (result.success) {
        setAnalytics(result.data)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    }
  }, [])

  // Load data
  useEffect(() => {
    if (activeTab === 'logs') {
      fetchAuditLogs()
      fetchStats()
    } else if (activeTab === 'analytics') {
      fetchAnalytics()
      fetchStats()
    }
  }, [activeTab, fetchAuditLogs, fetchStats, fetchAnalytics])

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounced(searchTerm)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  // Handle create log
  const handleCreateLog = async () => {
    try {
      if (!logForm.userId || !logForm.action || !logForm.entity) {
        alert('userId، action و entity اجباری هستند')
        return
      }
      
      const response = await fetch('/api/audit-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logForm)
      })
      
      const result = await response.json()
      if (result.success) {
        alert('✅ لاگ با موفقیت ایجاد شد')
        setShowCreateModal(false)
        setLogForm({
          userId: '',
          userName: '',
          action: 'CREATE',
          entity: 'INVOICE',
          entityId: '',
          entityName: '',
          ipAddress: '',
          userAgent: '',
          status: 'success',
          details: '',
          location: ''
        })
        await Promise.all([fetchAuditLogs(), fetchStats()])
      } else {
        alert(`❌ ${result.message || 'خطا در ایجاد لاگ'}`)
      }
    } catch (error) {
      console.error('Error creating log:', error)
      alert('خطا در ایجاد لاگ')
    }
  }

  // Handle delete log
  const handleDeleteLog = async (logId: string) => {
    try {
      const response = await fetch(`/api/audit-log?id=${logId}`, {
        method: 'DELETE'
      })
      
      const result = await response.json()
      if (result.success) {
        alert('✅ لاگ با موفقیت حذف شد')
        setShowDeleteConfirm(false)
        setLogToDelete(null)
        await Promise.all([fetchAuditLogs(), fetchStats()])
      } else {
        alert(`❌ ${result.message || 'خطا در حذف لاگ'}`)
      }
    } catch (error) {
      console.error('Error deleting log:', error)
      alert('خطا در حذف لاگ')
    }
  }

  // Handle clear old logs
  const handleClearOldLogs = async (days: number) => {
    if (!confirm(`آیا از حذف لاگ‌های قدیمی‌تر از ${days} روز اطمینان دارید؟`)) {
      return
    }
    
    try {
      const deleteBefore = new Date()
      deleteBefore.setDate(deleteBefore.getDate() - days)
      
      const response = await fetch(`/api/audit-log?action=clear-old&deleteBefore=${deleteBefore.toISOString()}`, {
        method: 'DELETE'
      })
      
      const result = await response.json()
      if (result.success) {
        alert(`✅ ${result.deletedCount || 0} لاگ قدیمی حذف شد`)
        await Promise.all([fetchAuditLogs(), fetchStats()])
      } else {
        alert(`❌ ${result.message || 'خطا در حذف لاگ‌های قدیمی'}`)
      }
    } catch (error) {
      console.error('Error clearing old logs:', error)
      alert('خطا در حذف لاگ‌های قدیمی')
    }
  }

  const handleViewLogDetails = useCallback(async (log: AuditLogEntry) => {
    const logId = log._id || log.id
    if (!logId) {
      setSelectedLog(log)
      setShowLogModal(true)
      return
    }
    
    try {
      const response = await fetch(`/api/audit-log/${logId}`)
      const result = await response.json()
      if (result.success) {
        setSelectedLog(result.data)
        setShowLogModal(true)
      } else {
        setSelectedLog(log)
        setShowLogModal(true)
      }
    } catch (error) {
      console.error('Error fetching log details:', error)
      setSelectedLog(log)
      setShowLogModal(true)
    }
  }, [])

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
                <span>زمان: <span className="font-medium">
                  {selectedLog.timestamp instanceof Date 
                    ? selectedLog.timestamp.toLocaleString('fa-IR')
                    : new Date(selectedLog.timestamp).toLocaleString('fa-IR')}
                </span></span>
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
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="premium-card p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-l-4 border-blue-500 hover:shadow-xl transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Activity className="w-7 h-7 text-white" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">کل فعالیت‌ها</h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
              {stats.totalLogs.toLocaleString('fa-IR')}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">کل لاگ‌های ثبت شده</p>
          </div>
          <div className="premium-card p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-l-4 border-green-500 hover:shadow-xl transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <CheckCircle className="w-7 h-7 text-white" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">موفق</h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
              {stats.successLogs.toLocaleString('fa-IR')}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">عملیات موفق</p>
          </div>
          <div className="premium-card p-6 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-l-4 border-red-500 hover:shadow-xl transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <XCircle className="w-7 h-7 text-white" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">ناموفق</h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
              {stats.failedLogs.toLocaleString('fa-IR')}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">عملیات ناموفق</p>
          </div>
          <div className="premium-card p-6 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-l-4 border-orange-500 hover:shadow-xl transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <AlertTriangle className="w-7 h-7 text-white" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">هشدار</h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
              {stats.warningLogs.toLocaleString('fa-IR')}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">عملیات هشدار</p>
          </div>
        </div>
      )}

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
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 space-y-4 md:space-y-0 pb-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">لاگ فعالیت‌های کاربران</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">ردیابی و مشاهده تمام فعالیت‌های سیستم</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 space-x-reverse w-full md:w-auto">
                <div className="relative flex-1 md:flex-none">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="جستجو در لاگ‌ها..."
                    className="premium-input pr-10 pl-4 py-2.5 w-full md:w-64"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="premium-button p-2.5"
                  title="فیلترها"
                >
                  <Filter className="w-5 h-5" />
                </button>
                <button
                  onClick={() => fetchAuditLogs()}
                  className="premium-button p-2.5"
                  disabled={loading}
                  title="بروزرسانی"
                >
                  <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="premium-button p-2.5 bg-green-600 hover:bg-green-700"
                  title="ایجاد لاگ جدید"
                >
                  <Plus className="w-5 h-5" />
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
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <RefreshCw className="w-8 h-8 animate-spin text-primary-600 mb-4" />
                        <p className="text-gray-600 dark:text-gray-400">در حال بارگذاری...</p>
                      </div>
                    </td>
                  </tr>
                ) : auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-20 h-20 mb-4 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center">
                          <FileText className="w-10 h-10 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">هیچ لاگی یافت نشد</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">لاگ‌های فعالیت در اینجا نمایش داده می‌شوند</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  auditLogs.map(log => (
                    <tr key={log._id || log.id} className="bg-white dark:bg-gray-800 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/50 dark:hover:from-gray-700 dark:hover:to-gray-700 transition-all duration-200 group">
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-700 dark:text-gray-300">
                          {log.timestamp instanceof Date 
                            ? log.timestamp.toLocaleString('fa-IR')
                            : new Date(log.timestamp).toLocaleString('fa-IR')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-gray-900 dark:text-white">{log.userName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          {getActionIcon(log.action)}
                          {getActionBadge(log.action)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          {getEntityIcon(log.entity)}
                          <span className="text-sm text-gray-700 dark:text-gray-200">{log.entityName || log.entity}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-700 dark:text-gray-200 max-w-xs truncate">{log.details}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-1 space-x-reverse">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-mono text-gray-600 dark:text-gray-300">{log.ipAddress}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(log.status)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <button 
                            onClick={() => handleViewLogDetails(log)}
                            className="p-2 rounded-lg text-primary-600 hover:bg-primary-100 dark:hover:bg-primary-900/30 hover:scale-110 transition-all"
                            title="جزئیات"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setLogToDelete(log._id || log.id || '')
                              setShowDeleteConfirm(true)
                            }}
                            className="p-2 rounded-lg text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 hover:scale-110 transition-all"
                            title="حذف"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
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
            <div className="flex items-center space-x-3 space-x-reverse mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">آمار فعالیت‌ها</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">توزیع عملیات بر اساس نوع</p>
              </div>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-8 h-8 animate-spin text-primary-600" />
              </div>
            ) : analytics && analytics.actionStats.length > 0 ? (
              <div className="space-y-4">
                {analytics.actionStats.map((stat, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <span className="text-gray-700 dark:text-gray-300 font-medium">{stat._id}</span>
                    <span className="font-bold text-lg text-gray-900 dark:text-white">{stat.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                داده‌ای برای نمایش وجود ندارد
              </div>
            )}
          </div>

          <div className="premium-card p-6">
            <div className="flex items-center space-x-3 space-x-reverse mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">فعال‌ترین کاربران</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">کاربران با بیشترین فعالیت</p>
              </div>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-8 h-8 animate-spin text-primary-600" />
              </div>
            ) : analytics && analytics.topUsers.length > 0 ? (
              <div className="space-y-4">
                {analytics.topUsers.map((user, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                        index === 0 ? 'bg-yellow-500' : 
                        index === 1 ? 'bg-gray-400' : 
                        index === 2 ? 'bg-orange-500' : 'bg-blue-500'
                      }`}>
                        {index + 1}
                      </div>
                      <span className="text-gray-700 dark:text-gray-300 font-medium">{user.userName || user._id}</span>
                    </div>
                    <span className="font-bold text-lg text-gray-900 dark:text-white">{user.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                داده‌ای برای نمایش وجود ندارد
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="premium-card p-6">
            <div className="flex items-center space-x-3 space-x-reverse mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Settings className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">تنظیمات نگهداری</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">مدیریت حجم و مدت نگهداری لاگ‌ها</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">نگهداری لاگ‌ها (روز)</label>
                <input type="number" className="premium-input w-full" defaultValue="90" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">حداکثر حجم لاگ (MB)</label>
                <input type="number" className="premium-input w-full" defaultValue="1000" />
              </div>
              <div className="flex items-center space-x-2 space-x-reverse pt-4">
                <input type="checkbox" className="rounded" defaultChecked />
                <span className="text-sm text-gray-600 dark:text-gray-300">فعال کردن فشرده‌سازی</span>
              </div>
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => handleClearOldLogs(90)}
                  className="premium-button w-full bg-red-600 hover:bg-red-700"
                >
                  <Trash2 className="w-5 h-5 ml-2" />
                  حذف لاگ‌های قدیمی‌تر از 90 روز
                </button>
              </div>
            </div>
          </div>
          <div className="premium-card p-6">
            <div className="flex items-center space-x-3 space-x-reverse mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">تنظیمات امنیتی</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">مدیریت ردیابی و اعلان‌ها</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <span className="text-sm text-gray-700 dark:text-gray-300">اعلان‌های امنیتی</span>
                <input type="checkbox" className="rounded" defaultChecked />
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <span className="text-sm text-gray-700 dark:text-gray-300">لاگ IP های مشکوک</span>
                <input type="checkbox" className="rounded" defaultChecked />
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <span className="text-sm text-gray-700 dark:text-gray-300">لاگ تغییرات حساس</span>
                <input type="checkbox" className="rounded" defaultChecked />
              </div>
            </div>
          </div>
        </div>
      )}

      {showLogModal && <LogDetailsModal />}

      {/* Create Log Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="relative px-6 py-5 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                    <Plus className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">ایجاد لاگ جدید</h2>
                    <p className="text-sm text-white/90 mt-0.5">ثبت فعالیت دستی در سیستم</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowCreateModal(false)
                    setLogForm({
                      userId: '',
                      userName: '',
                      action: 'CREATE',
                      entity: 'INVOICE',
                      entityId: '',
                      entityName: '',
                      ipAddress: '',
                      userAgent: '',
                      status: 'success',
                      details: '',
                      location: ''
                    })
                  }}
                  className="p-2 rounded-xl hover:bg-white/20 transition-colors"
                >
                  <XCircle className="w-6 h-6 text-white" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      User ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      className="premium-input w-full"
                      value={logForm.userId}
                      onChange={(e) => setLogForm({ ...logForm, userId: e.target.value })}
                      placeholder="شناسه کاربر"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      نام کاربر
                    </label>
                    <input
                      type="text"
                      className="premium-input w-full"
                      value={logForm.userName}
                      onChange={(e) => setLogForm({ ...logForm, userName: e.target.value })}
                      placeholder="نام کاربر"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      عمل <span className="text-red-500">*</span>
                    </label>
                    <select
                      className="premium-input w-full"
                      value={logForm.action}
                      onChange={(e) => setLogForm({ ...logForm, action: e.target.value })}
                    >
                      <option value="CREATE">ایجاد</option>
                      <option value="UPDATE">ویرایش</option>
                      <option value="DELETE">حذف</option>
                      <option value="LOGIN">ورود</option>
                      <option value="LOGOUT">خروج</option>
                      <option value="VIEW">مشاهده</option>
                      <option value="PRINT">چاپ</option>
                      <option value="EXPORT">خروجی</option>
                      <option value="IMPORT">ورودی</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      موجودیت <span className="text-red-500">*</span>
                    </label>
                    <select
                      className="premium-input w-full"
                      value={logForm.entity}
                      onChange={(e) => setLogForm({ ...logForm, entity: e.target.value })}
                    >
                      <option value="INVOICE">فاکتور</option>
                      <option value="CUSTOMER">مشتری</option>
                      <option value="SUPPLIER">تامین‌کننده</option>
                      <option value="PRODUCT">محصول</option>
                      <option value="USER">کاربر</option>
                      <option value="REPORT">گزارش</option>
                      <option value="SETTINGS">تنظیمات</option>
                      <option value="PAYMENT">پرداخت</option>
                      <option value="ORDER">سفارش</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      شناسه موجودیت
                    </label>
                    <input
                      type="text"
                      className="premium-input w-full"
                      value={logForm.entityId}
                      onChange={(e) => setLogForm({ ...logForm, entityId: e.target.value })}
                      placeholder="شناسه موجودیت"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      نام موجودیت
                    </label>
                    <input
                      type="text"
                      className="premium-input w-full"
                      value={logForm.entityName}
                      onChange={(e) => setLogForm({ ...logForm, entityName: e.target.value })}
                      placeholder="نام موجودیت"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      آدرس IP
                    </label>
                    <input
                      type="text"
                      className="premium-input w-full"
                      value={logForm.ipAddress}
                      onChange={(e) => setLogForm({ ...logForm, ipAddress: e.target.value })}
                      placeholder="192.168.1.100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      وضعیت
                    </label>
                    <select
                      className="premium-input w-full"
                      value={logForm.status}
                      onChange={(e) => setLogForm({ ...logForm, status: e.target.value as 'success' | 'failed' | 'warning' })}
                    >
                      <option value="success">موفق</option>
                      <option value="failed">ناموفق</option>
                      <option value="warning">هشدار</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    User Agent
                  </label>
                  <input
                    type="text"
                    className="premium-input w-full"
                    value={logForm.userAgent}
                    onChange={(e) => setLogForm({ ...logForm, userAgent: e.target.value })}
                    placeholder="Mozilla/5.0..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    توضیحات
                  </label>
                  <textarea
                    className="premium-input w-full"
                    rows={3}
                    value={logForm.details}
                    onChange={(e) => setLogForm({ ...logForm, details: e.target.value })}
                    placeholder="توضیحات فعالیت..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    مکان
                  </label>
                  <input
                    type="text"
                    className="premium-input w-full"
                    value={logForm.location}
                    onChange={(e) => setLogForm({ ...logForm, location: e.target.value })}
                    placeholder="تهران، ایران"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 space-x-reverse mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => {
                    setShowCreateModal(false)
                    setLogForm({
                      userId: '',
                      userName: '',
                      action: 'CREATE',
                      entity: 'INVOICE',
                      entityId: '',
                      entityName: '',
                      ipAddress: '',
                      userAgent: '',
                      status: 'success',
                      details: '',
                      location: ''
                    })
                  }}
                  className="px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold rounded-xl transition-all duration-200"
                >
                  انصراف
                </button>
                <button
                  onClick={handleCreateLog}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center space-x-2 space-x-reverse"
                >
                  <Plus className="w-5 h-5" />
                  <span>ایجاد لاگ</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && logToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="relative px-6 py-5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-t-2xl">
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">تأیید حذف</h2>
                  <p className="text-sm text-white/90 mt-0.5">آیا از حذف این لاگ اطمینان دارید؟</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                این عملیات غیرقابل بازگشت است. آیا مطمئن هستید که می‌خواهید این لاگ را حذف کنید؟
              </p>

              <div className="flex items-center justify-end space-x-3 space-x-reverse">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false)
                    setLogToDelete(null)
                  }}
                  className="px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold rounded-xl transition-all duration-200"
                >
                  انصراف
                </button>
                <button
                  onClick={() => {
                    if (logToDelete) {
                      handleDeleteLog(logToDelete)
                    }
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center space-x-2 space-x-reverse"
                >
                  <Trash2 className="w-5 h-5" />
                  <span>حذف</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

