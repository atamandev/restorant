'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  FileText,
  Search,
  Filter,
  Download,
  Eye,
  Calendar,
  User,
  Clock,
  RefreshCw,
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { formatDate, formatNumber } from '@/lib/date-utils'

interface AuditLog {
  _id?: string
  id?: string
  eventType: string
  referenceType: string
  referenceId?: string
  userId: string
  description: string
  before?: any
  after?: any
  diff?: any
  reason?: string
  ipAddress?: string
  userAgent?: string
  metadata?: any
  timestamp: string | Date
  createdAt?: string
}

interface AuditLogStats {
  totalLogs: number
  stockMovementLogs: number
  transferLogs: number
  stocktakingLogs: number
  orderLogs: number
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [stats, setStats] = useState<AuditLogStats>({
    totalLogs: 0,
    stockMovementLogs: 0,
    transferLogs: 0,
    stocktakingLogs: 0,
    orderLogs: 0
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterEventType, setFilterEventType] = useState<string>('all')
  const [filterReferenceType, setFilterReferenceType] = useState<string>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  // دریافت لاگ‌ها
  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (filterEventType !== 'all') params.append('eventType', filterEventType)
      if (filterReferenceType !== 'all') params.append('referenceType', filterReferenceType)
      if (dateFrom) params.append('dateFrom', dateFrom)
      if (dateTo) params.append('dateTo', dateTo)
      
      const response = await fetch(`/api/audit-logs?${params.toString()}`)
      const result = await response.json()
      
      if (result.success) {
        setLogs(result.data || [])
        setStats(result.stats || stats)
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error)
    } finally {
      setLoading(false)
    }
  }, [searchTerm, filterEventType, filterReferenceType, dateFrom, dateTo])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  // فیلتر لاگ‌ها
  const filteredLogs = useMemo(() => {
    return logs
  }, [logs])

  // دریافت نام نوع رویداد
  const getEventTypeName = (type: string) => {
    const names: { [key: string]: string } = {
      'STOCK_MOVEMENT': 'حرکت موجودی',
      'TRANSFER': 'انتقال',
      'STOCKTAKING': 'انبارگردانی',
      'ORDER': 'سفارش',
      'WAREHOUSE': 'انبار',
      'ITEM': 'کالا',
      'ALERT': 'هشدار',
      'SETTINGS': 'تنظیمات'
    }
    return names[type] || type
  }

  // دریافت نام نوع مرجع
  const getReferenceTypeName = (type: string) => {
    const names: { [key: string]: string } = {
      'stock_movement': 'حرکت موجودی',
      'transfer': 'انتقال',
      'inventory_count': 'انبارگردانی',
      'order': 'سفارش',
      'warehouse': 'انبار',
      'inventory_item': 'کالا',
      'stock_alert': 'هشدار',
      'settings': 'تنظیمات'
    }
    return names[type] || type
  }

  // نمایش جزئیات
  const handleViewDetails = (log: AuditLog) => {
    setSelectedLog(log)
    setShowDetailsModal(true)
  }

  // toggle row expansion
  const toggleRow = (logId: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId)
    } else {
      newExpanded.add(logId)
    }
    setExpandedRows(newExpanded)
  }

  // خروجی Excel
  const handleExport = async () => {
    try {
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (filterEventType !== 'all') params.append('eventType', filterEventType)
      if (filterReferenceType !== 'all') params.append('referenceType', filterReferenceType)
      if (dateFrom) params.append('dateFrom', dateFrom)
      if (dateTo) params.append('dateTo', dateTo)
      params.append('limit', '10000')
      
      const response = await fetch(`/api/audit-logs?${params.toString()}`)
      const result = await response.json()
      
      if (result.success) {
        // تبدیل به CSV
        const headers = ['تاریخ', 'نوع رویداد', 'نوع مرجع', 'مرجع', 'کاربر', 'توضیحات', 'IP', 'User Agent']
        const rows = result.data.map((log: AuditLog) => [
          formatDate(log.timestamp.toString()),
          getEventTypeName(log.eventType),
          getReferenceTypeName(log.referenceType),
          log.referenceId || '-',
          log.userId,
          log.description,
          log.ipAddress || '-',
          log.userAgent || '-'
        ])
        
        const csv = [
          headers.join(','),
          ...rows.map((row: any[]) => row.map(cell => `"${cell}"`).join(','))
        ].join('\n')
        
        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`
        link.click()
      }
    } catch (error) {
      console.error('Error exporting logs:', error)
      alert('خطا در خروجی لاگ‌ها')
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">لاگ و ممیزی</h1>
          <p className="text-gray-600 mt-1">تاریخچه تمام تغییرات و عملیات سیستم</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            خروجی Excel
          </button>
          <button
            onClick={fetchLogs}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            به‌روزرسانی
          </button>
        </div>
      </div>

      {/* آمار کلی */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">کل لاگ‌ها</div>
          <div className="text-2xl font-bold text-gray-900">{formatNumber(stats.totalLogs)}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">حرکات موجودی</div>
          <div className="text-2xl font-bold text-blue-600">{formatNumber(stats.stockMovementLogs)}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">انتقال‌ها</div>
          <div className="text-2xl font-bold text-green-600">{formatNumber(stats.transferLogs)}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">انبارگردانی</div>
          <div className="text-2xl font-bold text-purple-600">{formatNumber(stats.stocktakingLogs)}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">سفارش‌ها</div>
          <div className="text-2xl font-bold text-orange-600">{formatNumber(stats.orderLogs)}</div>
        </div>
      </div>

      {/* فیلترها */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">جستجو</label>
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="جستجو در توضیحات، کاربر، مرجع..."
                className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">نوع رویداد</label>
            <select
              value={filterEventType}
              onChange={(e) => setFilterEventType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">همه</option>
              <option value="STOCK_MOVEMENT">حرکت موجودی</option>
              <option value="TRANSFER">انتقال</option>
              <option value="STOCKTAKING">انبارگردانی</option>
              <option value="ORDER">سفارش</option>
              <option value="WAREHOUSE">انبار</option>
              <option value="ITEM">کالا</option>
              <option value="ALERT">هشدار</option>
              <option value="SETTINGS">تنظیمات</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">نوع مرجع</label>
            <select
              value={filterReferenceType}
              onChange={(e) => setFilterReferenceType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">همه</option>
              <option value="stock_movement">حرکت موجودی</option>
              <option value="transfer">انتقال</option>
              <option value="inventory_count">انبارگردانی</option>
              <option value="order">سفارش</option>
              <option value="warehouse">انبار</option>
              <option value="inventory_item">کالا</option>
              <option value="stock_alert">هشدار</option>
              <option value="settings">تنظیمات</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">از تاریخ</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">تا تاریخ</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* جدول لاگ‌ها */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">تاریخ</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">نوع رویداد</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">نوع مرجع</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">مرجع</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">کاربر</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">توضیحات</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">IP</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    در حال بارگذاری...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    لاگی یافت نشد
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const logId = log._id?.toString() || log.id || ''
                  const isExpanded = expandedRows.has(logId)
                  
                  return (
                    <React.Fragment key={logId}>
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {formatDate(log.timestamp.toString())}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                            {getEventTypeName(log.eventType)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {getReferenceTypeName(log.referenceType)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {log.referenceId ? (
                            <span className="font-mono text-xs">{log.referenceId.substring(0, 8)}...</span>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">{log.userId}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                          {log.description}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 font-mono text-xs">
                          {log.ipAddress || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleRow(logId)}
                              className="p-1 text-gray-400 hover:text-gray-600"
                              title="نمایش جزئیات"
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => handleViewDetails(log)}
                              className="p-1 text-blue-600 hover:text-blue-800"
                              title="مشاهده کامل"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={8} className="px-4 py-4 bg-gray-50">
                            <div className="space-y-3">
                              {log.reason && (
                                <div>
                                  <strong className="text-sm text-gray-700">علت:</strong>
                                  <p className="text-sm text-gray-600 mt-1">{log.reason}</p>
                                </div>
                              )}
                              {log.diff && (
                                <div>
                                  <strong className="text-sm text-gray-700">تغییرات:</strong>
                                  <pre className="text-xs bg-white p-3 rounded border mt-1 overflow-auto">
                                    {JSON.stringify(log.diff, null, 2)}
                                  </pre>
                                </div>
                              )}
                              {log.userAgent && (
                                <div>
                                  <strong className="text-sm text-gray-700">User Agent:</strong>
                                  <p className="text-xs text-gray-600 mt-1 font-mono">{log.userAgent}</p>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* مودال جزئیات */}
      {showDetailsModal && selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">جزئیات لاگ</h2>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <strong className="text-sm text-gray-700">تاریخ:</strong>
                  <p className="text-sm text-gray-900 mt-1">{formatDate(selectedLog.timestamp.toString())}</p>
                </div>
                <div>
                  <strong className="text-sm text-gray-700">کاربر:</strong>
                  <p className="text-sm text-gray-900 mt-1">{selectedLog.userId}</p>
                </div>
                <div>
                  <strong className="text-sm text-gray-700">نوع رویداد:</strong>
                  <p className="text-sm text-gray-900 mt-1">{getEventTypeName(selectedLog.eventType)}</p>
                </div>
                <div>
                  <strong className="text-sm text-gray-700">نوع مرجع:</strong>
                  <p className="text-sm text-gray-900 mt-1">{getReferenceTypeName(selectedLog.referenceType)}</p>
                </div>
                <div>
                  <strong className="text-sm text-gray-700">مرجع:</strong>
                  <p className="text-sm text-gray-900 mt-1 font-mono">{selectedLog.referenceId || '-'}</p>
                </div>
                <div>
                  <strong className="text-sm text-gray-700">IP:</strong>
                  <p className="text-sm text-gray-900 mt-1 font-mono">{selectedLog.ipAddress || '-'}</p>
                </div>
              </div>
              <div>
                <strong className="text-sm text-gray-700">توضیحات:</strong>
                <p className="text-sm text-gray-900 mt-1">{selectedLog.description}</p>
              </div>
              {selectedLog.reason && (
                <div>
                  <strong className="text-sm text-gray-700">علت:</strong>
                  <p className="text-sm text-gray-900 mt-1">{selectedLog.reason}</p>
                </div>
              )}
              {selectedLog.before && (
                <div>
                  <strong className="text-sm text-gray-700">قبل:</strong>
                  <pre className="text-xs bg-gray-50 p-3 rounded border mt-1 overflow-auto">
                    {JSON.stringify(selectedLog.before, null, 2)}
                  </pre>
                </div>
              )}
              {selectedLog.after && (
                <div>
                  <strong className="text-sm text-gray-700">بعد:</strong>
                  <pre className="text-xs bg-gray-50 p-3 rounded border mt-1 overflow-auto">
                    {JSON.stringify(selectedLog.after, null, 2)}
                  </pre>
                </div>
              )}
              {selectedLog.diff && (
                <div>
                  <strong className="text-sm text-gray-700">تغییرات:</strong>
                  <pre className="text-xs bg-blue-50 p-3 rounded border mt-1 overflow-auto">
                    {JSON.stringify(selectedLog.diff, null, 2)}
                  </pre>
                </div>
              )}
              {selectedLog.userAgent && (
                <div>
                  <strong className="text-sm text-gray-700">User Agent:</strong>
                  <p className="text-xs text-gray-600 mt-1 font-mono break-all">{selectedLog.userAgent}</p>
                </div>
              )}
              {selectedLog.metadata && (
                <div>
                  <strong className="text-sm text-gray-700">اطلاعات اضافی:</strong>
                  <pre className="text-xs bg-gray-50 p-3 rounded border mt-1 overflow-auto">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
            <div className="p-6 border-t">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

