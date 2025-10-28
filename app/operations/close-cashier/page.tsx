'use client'

import { useState, useEffect } from 'react'
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
  Calendar, 
  Filter, 
  Search, 
  RefreshCw, 
  FileText, 
  Archive,
  Loader2
} from 'lucide-react'

interface CashierSession {
  _id?: string
  id?: string
  userId: string
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
  createdAt?: Date | string
}

interface DailyTransaction {
  _id?: string
  id?: string
  sessionId: string
  time: string
  type: 'sale' | 'refund' | 'discount' | 'cash_in' | 'cash_out'
  amount: number
  paymentMethod: 'cash' | 'card' | 'credit'
  description?: string
  orderNumber?: string
  customerName?: string
  notes?: string
  createdAt?: Date | string
}

export default function CloseCashierPage() {
  const [session, setSession] = useState<CashierSession | null>(null)
  const [transactions, setTransactions] = useState<DailyTransaction[]>([])
  const [showCloseForm, setShowCloseForm] = useState(false)
  const [endAmount, setEndAmount] = useState(0)
  const [notes, setNotes] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterPayment, setFilterPayment] = useState('all')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // دریافت جلسه فعال صندوق
  const fetchActiveSession = async () => {
    try {
      const response = await fetch('/api/cashier-sessions?status=open')
      const data = await response.json()
      
      if (data.success && data.data.length > 0) {
        setSession(data.data[0])
        await fetchTransactions(data.data[0]._id || data.data[0].id)
      } else {
        setError('هیچ جلسه فعالی یافت نشد')
      }
    } catch (error) {
      console.error('Error fetching active session:', error)
      setError('خطا در اتصال به سرور')
    }
  }

  // دریافت تراکنش‌های جلسه
  const fetchTransactions = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/daily-transactions?sessionId=${sessionId}`)
      const data = await response.json()
      
      if (data.success) {
        setTransactions(data.data)
      } else {
        setError(data.message || 'خطا در دریافت تراکنش‌ها')
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
      setError('خطا در اتصال به سرور')
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await fetchActiveSession()
      setLoading(false)
    }
    loadData()
  }, [])

  const filteredTransactions = transactions.filter(transaction => {
    const matchesType = filterType === 'all' || transaction.type === filterType
    const matchesPayment = filterPayment === 'all' || transaction.paymentMethod === filterPayment
    return matchesType && matchesPayment
  })

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'sale': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
      case 'refund': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
      case 'discount': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
      case 'cash_in': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
      case 'cash_out': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
    }
  }

  const getTransactionTypeText = (type: string) => {
    switch (type) {
      case 'sale': return 'فروش'
      case 'refund': return 'مرجوعی'
      case 'discount': return 'تخفیف'
      case 'cash_in': return 'ورود نقدی'
      case 'cash_out': return 'خروج نقدی'
      default: return 'نامشخص'
    }
  }

  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case 'cash': return 'نقدی'
      case 'card': return 'کارتخوان'
      case 'credit': return 'اعتباری'
      default: return 'نامشخص'
    }
  }

  const calculateExpectedCash = () => {
    if (!session) return 0
    return session.startAmount + session.cashSales + transactions
      .filter(t => t.type === 'cash_in' && t.paymentMethod === 'cash')
      .reduce((sum, t) => sum + t.amount, 0) - 
      transactions.filter(t => t.type === 'cash_out' && t.paymentMethod === 'cash')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)
  }

  const calculateDifference = () => {
    return endAmount - calculateExpectedCash()
  }

  const handleCloseSession = async () => {
    if (!session) return

    try {
      setSaving(true)
      setError('')

      const difference = calculateDifference()
      if (Math.abs(difference) > 10000) {
        if (!confirm(`تفاوت موجودی: ${difference.toLocaleString('fa-IR')} تومان\nآیا مطمئن هستید؟`)) {
          setSaving(false)
          return
        }
      }

      const updateData = {
        endTime: new Date().toLocaleTimeString('fa-IR'),
        endAmount,
        status: 'closed',
        notes
      }

      console.log('Closing session:', updateData)

      const response = await fetch('/api/cashier-sessions', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: session._id || session.id,
          ...updateData
        }),
      })

      const data = await response.json()

      console.log('Close session response:', data)

      if (data.success) {
        setSession(prev => prev ? { ...prev, ...updateData } : null)
        setShowCloseForm(false)
        alert('صندوق با موفقیت بسته شد!')
      } else {
        setError(data.message || 'خطا در بستن صندوق')
      }
    } catch (error) {
      console.error('Error closing session:', error)
      setError('خطا در اتصال به سرور')
    } finally {
      setSaving(false)
    }
  }

  const getTotalSales = () => session?.totalSales || 0
  const getTotalTransactions = () => session?.totalTransactions || 0
  const getNetProfit = () => (session?.totalSales || 0) - (session?.refunds || 0) - (session?.discounts || 0)
  const getAverageTransaction = () => {
    const total = getTotalTransactions()
    return total > 0 ? getTotalSales() / total : 0
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/80 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">در حال بارگذاری...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/80 dark:to-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <AlertCircle className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-2">
              هیچ جلسه فعالی یافت نشد
            </h3>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              ابتدا یک جلسه صندوق باز کنید
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/80 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold gradient-text mb-2">بستن صندوق</h1>
          <p className="text-gray-600 dark:text-gray-300">عملیات پایان شیفت و بستن صندوق فروش</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
            <div className="flex items-center space-x-2 space-x-reverse">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <span className="text-red-700 dark:text-red-300">{error}</span>
            </div>
          </div>
        )}

        {/* Session Status */}
        <div className="premium-card p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">وضعیت جلسه صندوق</h2>
              <div className="flex items-center space-x-4 space-x-reverse">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  session.status === 'open' 
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}>
                  {session.status === 'open' ? 'باز' : 'بسته'}
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  شروع: {session.startTime}
                </span>
                {session.endTime && (
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    پایان: {session.endTime}
                  </span>
                )}
              </div>
            </div>
            {session.status === 'open' && (
              <button
                onClick={() => setShowCloseForm(true)}
                className="premium-button bg-red-500 hover:bg-red-600 flex items-center space-x-2 space-x-reverse"
              >
                <XCircle className="w-4 h-4" />
                <span>بستن صندوق</span>
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="premium-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">کل فروش</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {getTotalSales().toLocaleString('fa-IR')} تومان
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
          <div className="premium-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">تعداد تراکنش‌ها</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{getTotalTransactions()}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <Receipt className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
          <div className="premium-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">سود خالص</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {getNetProfit().toLocaleString('fa-IR')} تومان
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
          <div className="premium-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">میانگین تراکنش</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {Math.round(getAverageTransaction()).toLocaleString('fa-IR')} تومان
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                <Calculator className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Payment Methods Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="premium-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">فروش نقدی</h3>
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {(session.cashSales || 0).toLocaleString('fa-IR')} تومان
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {session.totalSales > 0 ? (((session.cashSales || 0) / session.totalSales) * 100).toFixed(1) : 0}% از کل فروش
            </p>
          </div>
          <div className="premium-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">فروش کارتخوان</h3>
              <CreditCard className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {(session.cardSales || 0).toLocaleString('fa-IR')} تومان
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {session.totalSales > 0 ? (((session.cardSales || 0) / session.totalSales) * 100).toFixed(1) : 0}% از کل فروش
            </p>
          </div>
          <div className="premium-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">فروش اعتباری</h3>
              <Receipt className="w-6 h-6 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {(session.creditSales || 0).toLocaleString('fa-IR')} تومان
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {session.totalSales > 0 ? (((session.creditSales || 0) / session.totalSales) * 100).toFixed(1) : 0}% از کل فروش
            </p>
          </div>
        </div>

        {/* Cash Count */}
        <div className="premium-card p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">شمارش نقدی</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                موجودی اولیه
              </label>
              <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {(session.startAmount || 0).toLocaleString('fa-IR')} تومان
                </p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                موجودی مورد انتظار
              </label>
              <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                <p className="text-lg font-bold text-blue-900 dark:text-blue-300">
                  {calculateExpectedCash().toLocaleString('fa-IR')} تومان
                </p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                تفاوت موجودی
              </label>
              <div className={`p-3 rounded-lg ${
                Math.abs(calculateDifference()) > 10000 
                  ? 'bg-red-50 dark:bg-red-900/30' 
                  : 'bg-green-50 dark:bg-green-900/30'
              }`}>
                <p className={`text-lg font-bold ${
                  Math.abs(calculateDifference()) > 10000 
                    ? 'text-red-900 dark:text-red-300' 
                    : 'text-green-900 dark:text-green-300'
                }`}>
                  {calculateDifference().toLocaleString('fa-IR')} تومان
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Transactions */}
        <div className="premium-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">تراکنش‌های روز</h3>
            <div className="flex items-center space-x-4 space-x-reverse">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="premium-input"
              >
                <option value="all">همه انواع</option>
                <option value="sale">فروش</option>
                <option value="refund">مرجوعی</option>
                <option value="discount">تخفیف</option>
                <option value="cash_in">ورود نقدی</option>
                <option value="cash_out">خروج نقدی</option>
              </select>
              <select
                value={filterPayment}
                onChange={(e) => setFilterPayment(e.target.value)}
                className="premium-input"
              >
                <option value="all">همه روش‌ها</option>
                <option value="cash">نقدی</option>
                <option value="card">کارتخوان</option>
                <option value="credit">اعتباری</option>
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-8">
                <Receipt className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">هیچ تراکنشی یافت نشد</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-600/30">
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">زمان</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">نوع</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">مبلغ</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">روش پرداخت</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">توضیحات</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">مشتری</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map(transaction => (
                    <tr key={transaction._id || transaction.id} className="border-b border-gray-100 dark:border-gray-700/30">
                      <td className="py-4 px-4">
                        <span className="text-gray-900 dark:text-white">{transaction.time}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTransactionTypeColor(transaction.type)}`}>
                          {getTransactionTypeText(transaction.type)}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`font-medium ${
                          transaction.amount >= 0 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {transaction.amount >= 0 ? '+' : ''}{transaction.amount.toLocaleString('fa-IR')} تومان
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-gray-900 dark:text-white">
                          {getPaymentMethodText(transaction.paymentMethod)}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-gray-900 dark:text-white">{transaction.description || '-'}</span>
                        {transaction.orderNumber && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">{transaction.orderNumber}</p>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-gray-900 dark:text-white">{transaction.customerName || '-'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Close Session Modal */}
        {showCloseForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">بستن صندوق</h3>
                <button
                  onClick={() => setShowCloseForm(false)}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    موجودی نهایی (تومان)
                  </label>
                  <input
                    type="number"
                    value={endAmount}
                    onChange={(e) => setEndAmount(Number(e.target.value))}
                    className="premium-input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    یادداشت
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="premium-input w-full"
                    rows={3}
                    placeholder="یادداشت‌های اضافی..."
                  />
                </div>
                {Math.abs(calculateDifference()) > 10000 && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/30 rounded-lg">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <AlertCircle className="w-4 h-4 text-red-600" />
                      <span className="text-sm text-red-800 dark:text-red-300">
                        تفاوت موجودی: {calculateDifference().toLocaleString('fa-IR')} تومان
                      </span>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-end space-x-3 space-x-reverse mt-6">
                <button
                  onClick={() => setShowCloseForm(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                >
                  انصراف
                </button>
                <button
                  onClick={handleCloseSession}
                  disabled={saving}
                  className="premium-button bg-red-500 hover:bg-red-600 flex items-center space-x-2 space-x-reverse disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                  <span>{saving ? 'در حال بستن...' : 'بستن صندوق'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}