'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  CreditCard,
  DollarSign,
  Receipt,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  Clock,
  TrendingUp,
  TrendingDown,
  Users,
  ShoppingBag,
  Calculator,
  Save,
  Printer,
  Download,
  Eye,
  EyeOff,
  BarChart3,
  PieChart,
  Activity,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  Calendar,
  Search,
  Filter,
  X,
  Loader2
} from 'lucide-react'

interface CashDrawerSession {
  _id?: string
  id?: string
  userId: string
  userName?: string
  branchId?: string
  branchName?: string
  startTime: string
  endTime?: string
  startAmount: number
  endAmount?: number
  totalSales: number
  totalTransactions: number
  cashSales: number
  cardSales: number
  creditSales: number
  refunds: number
  discounts: number
  taxes: number
  serviceCharges: number
  status: 'open' | 'closed'
  notes?: string
  createdAt?: string
  updatedAt?: string
  actualCashSales?: number
  actualCardSales?: number
  actualCreditSales?: number
  actualTotalSales?: number
  invoiceCount?: number
}

interface CashDrawerStats {
  totalSessions: number
  openSessions: number
  closedSessions: number
  totalSales: number
  totalCashSales: number
  totalCardSales: number
  totalCreditSales: number
  totalDiscounts: number
  totalTaxes: number
}

export default function CashDrawersPage() {
  const [sessions, setSessions] = useState<CashDrawerSession[]>([])
  const [stats, setStats] = useState<CashDrawerStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'closed'>('all')
  const [filterDate, setFilterDate] = useState('today')
  const [selectedSession, setSelectedSession] = useState<CashDrawerSession | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  // تبدیل داده‌های API به فرمت مورد نیاز
  const convertApiDataToSession = useCallback((item: any): CashDrawerSession => {
    return {
      _id: item._id?.toString() || item.id || '',
      id: item._id?.toString() || item.id || '',
      userId: item.userId || '',
      userName: item.userName || item.user?.name || 'نامشخص',
      branchId: item.branchId?.toString() || item.branchId || '',
      branchName: item.branchName || item.branch?.name || 'نامشخص',
      startTime: item.startTime ? (typeof item.startTime === 'string' ? item.startTime : new Date(item.startTime).toLocaleString('fa-IR')) : '',
      endTime: item.endTime ? (typeof item.endTime === 'string' ? item.endTime : new Date(item.endTime).toLocaleString('fa-IR')) : undefined,
      startAmount: item.startAmount || 0,
      endAmount: item.endAmount || undefined,
      totalSales: item.totalSales || item.actualTotalSales || 0,
      totalTransactions: item.totalTransactions || item.invoiceCount || 0,
      cashSales: item.cashSales || item.actualCashSales || 0,
      cardSales: item.cardSales || item.actualCardSales || 0,
      creditSales: item.creditSales || item.actualCreditSales || 0,
      refunds: item.refunds || 0,
      discounts: item.discounts || 0,
      taxes: item.taxes || 0,
      serviceCharges: item.serviceCharges || 0,
      status: item.status || 'closed',
      notes: item.notes || undefined,
      createdAt: item.createdAt ? (typeof item.createdAt === 'string' ? item.createdAt : new Date(item.createdAt).toLocaleString('fa-IR')) : '',
      updatedAt: item.updatedAt ? (typeof item.updatedAt === 'string' ? item.updatedAt : new Date(item.updatedAt).toLocaleString('fa-IR')) : undefined,
      actualCashSales: item.actualCashSales,
      actualCardSales: item.actualCardSales,
      actualCreditSales: item.actualCreditSales,
      actualTotalSales: item.actualTotalSales,
      invoiceCount: item.invoiceCount
    }
  }, [])

  // دریافت جلسات صندوق از API
  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filterStatus !== 'all') params.append('status', filterStatus)
      
      // فیلتر تاریخ
      if (filterDate !== 'all') {
        const now = new Date()
        let dateFrom: Date
        switch (filterDate) {
          case 'today':
            dateFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate())
            break
          case 'yesterday':
            dateFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
            break
          case 'week':
            dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            break
          case 'month':
            dateFrom = new Date(now.getFullYear(), now.getMonth(), 1)
            break
          default:
            dateFrom = new Date(0)
        }
        params.append('dateFrom', dateFrom.toISOString())
        if (filterDate === 'today' || filterDate === 'yesterday') {
          const dateTo = new Date(dateFrom)
          dateTo.setHours(23, 59, 59, 999)
          params.append('dateTo', dateTo.toISOString())
        }
      }
      
      params.append('includeStats', 'true')
      params.append('limit', '1000')

      const response = await fetch(`/api/cashier-sessions?${params.toString()}`)
      const result = await response.json()

      if (result.success) {
        const sessionsList = (result.data || []).map(convertApiDataToSession)
        setSessions(sessionsList)
        if (result.stats) {
          setStats(result.stats)
        }
      } else {
        setSessions([])
        setStats(null)
      }
    } catch (error) {
      console.error('Error fetching cash drawer sessions:', error)
      setSessions([])
      setStats(null)
    } finally {
      setLoading(false)
    }
  }, [filterStatus, filterDate, convertApiDataToSession])

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  // Auto-refresh هر 30 ثانیه برای جلسات باز
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible' && filterStatus === 'open') {
        fetchSessions()
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [fetchSessions, filterStatus])

  const filteredSessions = sessions.filter(session =>
    (filterStatus === 'all' || session.status === filterStatus) &&
    (session.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.branchName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.id?.includes(searchTerm))
  )

  const getStatusBadge = (status: string) => {
    if (status === 'open') {
      return (
        <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-medium">
          باز
        </span>
      )
    }
    return (
      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-xs font-medium">
        بسته
      </span>
    )
  }

  const getExpectedCash = (session: CashDrawerSession) => {
    return (session.startAmount || 0) + (session.cashSales || 0)
  }

  const getDifference = (session: CashDrawerSession) => {
    if (session.status === 'open' || !session.endAmount) return null
    return (session.endAmount || 0) - getExpectedCash(session)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/80 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold gradient-text mb-2">مدیریت صندوق‌ها</h1>
          <p className="text-gray-600 dark:text-gray-300">مدیریت و نظارت بر جلسات صندوق‌ها</p>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="premium-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">کل جلسات</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalSessions}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <Receipt className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>
            <div className="premium-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">جلسات باز</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.openSessions}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>
            <div className="premium-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">کل فروش</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalSales.toLocaleString('fa-IR')}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
            </div>
            <div className="premium-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">فروش نقدی</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalCashSales.toLocaleString('fa-IR')}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="premium-card p-6 mb-8">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="جستجو در جلسات..."
                  className="w-64 pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as 'all' | 'open' | 'closed')}
                className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">همه وضعیت‌ها</option>
                <option value="open">باز</option>
                <option value="closed">بسته</option>
              </select>
              <select
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="today">امروز</option>
                <option value="yesterday">دیروز</option>
                <option value="week">این هفته</option>
                <option value="month">این ماه</option>
                <option value="all">همه زمان‌ها</option>
              </select>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <button
                onClick={fetchSessions}
                disabled={loading}
                className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>به‌روزرسانی</span>
              </button>
              <button className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                <Download className="w-4 h-4" />
                <span>خروجی Excel</span>
              </button>
            </div>
          </div>
        </div>

        {/* Sessions List */}
        <div className="premium-card p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">لیست جلسات صندوق</h2>
          
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">هیچ جلسه‌ای یافت نشد</h3>
              <p className="text-gray-600 dark:text-gray-400">جلسات صندوق در اینجا نمایش داده می‌شوند</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead>
                  <tr className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-800/50">
                    <th className="px-4 py-3 rounded-r-lg">وضعیت</th>
                    <th className="px-4 py-3">کاربر</th>
                    <th className="px-4 py-3">شعبه</th>
                    <th className="px-4 py-3">مبلغ اولیه</th>
                    <th className="px-4 py-3">کل فروش</th>
                    <th className="px-4 py-3">فروش نقدی</th>
                    <th className="px-4 py-3">فروش کارتی</th>
                    <th className="px-4 py-3">زمان شروع</th>
                    <th className="px-4 py-3">زمان پایان</th>
                    <th className="px-4 py-3 rounded-l-lg">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredSessions.map(session => {
                    const difference = getDifference(session)
                    return (
                      <tr key={session.id} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <td className="px-4 py-3">
                          {getStatusBadge(session.status)}
                        </td>
                        <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">{session.userName}</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{session.branchName}</td>
                        <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">
                          {session.startAmount.toLocaleString('fa-IR')} تومان
                        </td>
                        <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">
                          {session.totalSales.toLocaleString('fa-IR')} تومان
                        </td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-200">
                          {session.cashSales.toLocaleString('fa-IR')} تومان
                        </td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-200">
                          {session.cardSales.toLocaleString('fa-IR')} تومان
                        </td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{session.startTime}</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-200">
                          {session.endTime || '-'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex space-x-2 space-x-reverse">
                            <button
                              onClick={() => {
                                setSelectedSession(session)
                                setShowDetailsModal(true)
                              }}
                              className="p-2 rounded-full text-primary-600 hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {session.status === 'open' && (
                              <button
                                onClick={() => window.location.href = '/operations/close-cashier'}
                                className="p-2 rounded-full text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                                title="بستن صندوق"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Session Details Modal */}
        {selectedSession && showDetailsModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  جزئیات جلسه صندوق
                </h3>
                <button
                  onClick={() => {
                    setShowDetailsModal(false)
                    setSelectedSession(null)
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">وضعیت</label>
                    <div>{getStatusBadge(selectedSession.status)}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">کاربر</label>
                    <p className="text-gray-900 dark:text-white">{selectedSession.userName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">شعبه</label>
                    <p className="text-gray-900 dark:text-white">{selectedSession.branchName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">مبلغ اولیه</label>
                    <p className="text-gray-900 dark:text-white">{selectedSession.startAmount.toLocaleString('fa-IR')} تومان</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">زمان شروع</label>
                    <p className="text-gray-900 dark:text-white">{selectedSession.startTime}</p>
                  </div>
                  {selectedSession.endTime && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">زمان پایان</label>
                      <p className="text-gray-900 dark:text-white">{selectedSession.endTime}</p>
                    </div>
                  )}
                </div>
                
                <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">آمار فروش</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-gray-700 dark:text-gray-300">
                      <span>کل فروش:</span>
                      <span className="font-medium">{selectedSession.totalSales.toLocaleString('fa-IR')} تومان</span>
                    </div>
                    <div className="flex justify-between text-gray-700 dark:text-gray-300">
                      <span>فروش نقدی:</span>
                      <span className="font-medium">{selectedSession.cashSales.toLocaleString('fa-IR')} تومان</span>
                    </div>
                    <div className="flex justify-between text-gray-700 dark:text-gray-300">
                      <span>فروش کارتی:</span>
                      <span className="font-medium">{selectedSession.cardSales.toLocaleString('fa-IR')} تومان</span>
                    </div>
                    <div className="flex justify-between text-gray-700 dark:text-gray-300">
                      <span>فروش اعتباری:</span>
                      <span className="font-medium">{selectedSession.creditSales.toLocaleString('fa-IR')} تومان</span>
                    </div>
                    <div className="flex justify-between text-gray-700 dark:text-gray-300">
                      <span>تعداد تراکنش‌ها:</span>
                      <span className="font-medium">{selectedSession.totalTransactions}</span>
                    </div>
                    {selectedSession.discounts > 0 && (
                      <div className="flex justify-between text-gray-700 dark:text-gray-300">
                        <span>تخفیفات:</span>
                        <span className="font-medium">{selectedSession.discounts.toLocaleString('fa-IR')} تومان</span>
                      </div>
                    )}
                    {selectedSession.taxes > 0 && (
                      <div className="flex justify-between text-gray-700 dark:text-gray-300">
                        <span>مالیات:</span>
                        <span className="font-medium">{selectedSession.taxes.toLocaleString('fa-IR')} تومان</span>
                      </div>
                    )}
                  </div>
                </div>

                {selectedSession.status === 'closed' && selectedSession.endAmount !== undefined && (
                  <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">تسویه نهایی</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-gray-700 dark:text-gray-300">
                        <span>مبلغ مورد انتظار:</span>
                        <span className="font-medium">{getExpectedCash(selectedSession).toLocaleString('fa-IR')} تومان</span>
                      </div>
                      <div className="flex justify-between text-gray-700 dark:text-gray-300">
                        <span>مبلغ واقعی:</span>
                        <span className="font-medium">{selectedSession.endAmount.toLocaleString('fa-IR')} تومان</span>
                      </div>
                      {(() => {
                        const difference = getDifference(selectedSession)
                        return difference !== null && (
                          <div className={`flex justify-between ${difference === 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            <span className="font-medium">تفاوت:</span>
                            <span className="font-bold">{difference > 0 ? '+' : ''}{difference.toLocaleString('fa-IR')} تومان</span>
                          </div>
                        )
                      })()}
                    </div>
                  </div>
                )}

                {selectedSession.notes && (
                  <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">یادداشت</label>
                    <p className="text-gray-900 dark:text-white p-3 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg">
                      {selectedSession.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

