'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  DollarSign, 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Save, 
  X, 
  CheckCircle, 
  AlertCircle,
  CreditCard,
  Banknote,
  Receipt,
  TrendingUp,
  TrendingDown,
  Calendar,
  User,
  Building,
  FileText,
  Download,
  Printer,
  Clock,
  ArrowUpRight,
  ArrowDownLeft
} from 'lucide-react'

interface ReceiptPayment {
  id: string
  type: 'receipt' | 'payment'
  amount: number
  method: 'cash' | 'card' | 'bank_transfer' | 'credit' | 'check'
  personId: string
  personName: string
  personType: 'customer' | 'vendor' | 'employee'
  reference: string
  referenceType: 'invoice' | 'purchase' | 'adjustment' | 'deposit' | 'advance'
  referenceId: string
  description: string
  date: string
  time: string
  branchId: string
  branchName: string
  cashRegisterId: string
  cashRegisterName: string
  status: 'pending' | 'completed' | 'cancelled'
  appliedAmount: number
  remainingAmount: number
  notes: string
  createdBy: string
  createdAt: string
}

const mockReceiptsPayments: ReceiptPayment[] = [
  {
    id: '1',
    type: 'receipt',
    amount: 500000,
    method: 'cash',
    personId: 'CUST-001',
    personName: 'احمد محمدی',
    personType: 'customer',
    reference: 'INV-2024-001',
    referenceType: 'invoice',
    referenceId: 'INV-001',
    description: 'تسویه فاکتور فروش',
    date: '1402/10/20',
    time: '14:30',
    branchId: 'BR-001',
    branchName: 'شعبه مرکزی',
    cashRegisterId: 'CR-001',
    cashRegisterName: 'صندوق اصلی',
    status: 'completed',
    appliedAmount: 500000,
    remainingAmount: 0,
    notes: 'پرداخت کامل فاکتور',
    createdBy: 'کاربر سیستم',
    createdAt: '1402/10/20 14:30'
  },
  {
    id: '2',
    type: 'payment',
    amount: 250000,
    method: 'bank_transfer',
    personId: 'VEND-001',
    personName: 'تامین‌کننده مواد غذایی',
    personType: 'vendor',
    reference: 'PUR-2024-001',
    referenceType: 'purchase',
    referenceId: 'PUR-001',
    description: 'پرداخت فاکتور خرید',
    date: '1402/10/20',
    time: '10:15',
    branchId: 'BR-001',
    branchName: 'شعبه مرکزی',
    cashRegisterId: 'CR-001',
    cashRegisterName: 'صندوق اصلی',
    status: 'completed',
    appliedAmount: 250000,
    remainingAmount: 0,
    notes: 'پرداخت از طریق حواله بانکی',
    createdBy: 'کاربر سیستم',
    createdAt: '1402/10/20 10:15'
  },
  {
    id: '3',
    type: 'receipt',
    amount: 100000,
    method: 'card',
    personId: 'CUST-002',
    personName: 'سارا کریمی',
    personType: 'customer',
    reference: 'INV-2024-002',
    referenceType: 'invoice',
    referenceId: 'INV-002',
    description: 'پیش‌دریافت سفارش',
    date: '1402/10/20',
    time: '16:45',
    branchId: 'BR-001',
    branchName: 'شعبه مرکزی',
    cashRegisterId: 'CR-001',
    cashRegisterName: 'صندوق اصلی',
    status: 'completed',
    appliedAmount: 0,
    remainingAmount: 100000,
    notes: 'پیش‌دریافت برای سفارش آینده',
    createdBy: 'کاربر سیستم',
    createdAt: '1402/10/20 16:45'
  },
  {
    id: '4',
    type: 'payment',
    amount: 75000,
    method: 'check',
    personId: 'VEND-002',
    personName: 'تامین‌کننده نوشیدنی',
    personType: 'vendor',
    reference: 'PUR-2024-002',
    referenceType: 'purchase',
    referenceId: 'PUR-002',
    description: 'پرداخت چک',
    date: '1402/10/19',
    time: '09:30',
    branchId: 'BR-001',
    branchName: 'شعبه مرکزی',
    cashRegisterId: 'CR-001',
    cashRegisterName: 'صندوق اصلی',
    status: 'pending',
    appliedAmount: 0,
    remainingAmount: 75000,
    notes: 'چک در انتظار وصول',
    createdBy: 'کاربر سیستم',
    createdAt: '1402/10/19 09:30'
  }
]

export default function ReceiptsPaymentsPage() {
  const [transactions, setTransactions] = useState<ReceiptPayment[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterMethod, setFilterMethod] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<ReceiptPayment | null>(null)
  const [selectedTransaction, setSelectedTransaction] = useState<ReceiptPayment | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [fromDate, setFromDate] = useState<string>('')
  const [toDate, setToDate] = useState<string>('')

  const [formData, setFormData] = useState({
    type: 'receipt' as 'receipt' | 'payment',
    amount: 0,
    method: 'cash' as 'cash' | 'card' | 'bank_transfer' | 'credit' | 'check',
    personId: '',
    personName: '',
    personType: 'customer' as 'customer' | 'vendor' | 'employee',
    reference: '',
    referenceType: 'invoice' as 'invoice' | 'purchase' | 'adjustment' | 'deposit' | 'advance',
    referenceId: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    branchId: 'BR-001',
    branchName: 'شعبه مرکزی',
    cashRegisterId: 'CR-001',
    cashRegisterName: 'صندوق اصلی',
    status: 'completed' as 'pending' | 'completed' | 'cancelled',
    notes: ''
  })

  // تبدیل داده‌های API به فرمت مورد نیاز
  const convertApiDataToTransaction = useCallback((item: any): ReceiptPayment => {
    return {
      id: item._id?.toString() || item.id || '',
      type: item.type || 'receipt',
      amount: item.amount || 0,
      method: item.method || 'cash',
      personId: item.personId?.toString() || item.personId || '',
      personName: item.person?.name || item.personName || 'نامشخص',
      personType: item.personType || 'customer',
      reference: item.reference || '',
      referenceType: item.referenceType || 'invoice',
      referenceId: item.referenceId || '',
      description: item.description || '',
      date: item.date ? new Date(item.date).toLocaleDateString('fa-IR') : new Date().toLocaleDateString('fa-IR'),
      time: item.time || new Date().toTimeString().slice(0, 5),
      branchId: item.branchId?.toString() || item.branchId || '',
      branchName: item.branchName || 'نامشخص',
      cashRegisterId: item.cashRegisterId?.toString() || item.cashRegisterId || '',
      cashRegisterName: item.cashRegisterName || 'نامشخص',
      status: item.status || 'completed',
      appliedAmount: item.appliedAmount || item.amount || 0,
      remainingAmount: item.remainingAmount || 0,
      notes: item.notes || '',
      createdBy: item.createdBy || 'system',
      createdAt: item.createdAt ? new Date(item.createdAt).toLocaleString('fa-IR') : new Date().toLocaleString('fa-IR')
    }
  }, [])

  // دریافت داده از API
  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filterType !== 'all') params.append('type', filterType)
      if (filterMethod !== 'all') params.append('method', filterMethod)
      if (filterStatus !== 'all') params.append('status', filterStatus)
      if (fromDate) params.append('fromDate', fromDate)
      if (toDate) params.append('toDate', toDate)
      params.append('includeRelated', 'true')
      params.append('sortBy', 'date')
      params.append('sortOrder', 'desc')
      params.append('limit', '1000')

      const response = await fetch(`/api/receipts-payments?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        const transactionsList = (data.data || []).map(convertApiDataToTransaction)
        setTransactions(transactionsList)
      } else {
        console.error('Error fetching transactions:', data.message)
        setTransactions([])
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
      setTransactions([])
    } finally {
      setLoading(false)
    }
  }, [filterType, filterMethod, filterStatus, fromDate, toDate, convertApiDataToTransaction])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  const filteredTransactions = transactions.filter(transaction =>
    (filterType === 'all' || transaction.type === filterType) &&
    (filterMethod === 'all' || transaction.method === filterMethod) &&
    (filterStatus === 'all' || transaction.status === filterStatus) &&
    (transaction.personName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const handleSave = async () => {
    try {
      setSaving(true)
      const transactionData = {
        type: formData.type,
        amount: formData.amount,
        method: formData.method,
        personId: formData.personId,
        personType: formData.personType,
        reference: formData.reference,
        referenceType: formData.referenceType,
        referenceId: formData.referenceId,
        description: formData.description,
        date: formData.date,
        time: formData.time,
        branchId: formData.branchId,
        branchName: formData.branchName,
        cashRegisterId: formData.cashRegisterId,
        cashRegisterName: formData.cashRegisterName,
        status: formData.status,
        notes: formData.notes
      }

      let response
      if (editingTransaction) {
        response = await fetch(`/api/receipts-payments/${editingTransaction.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(transactionData)
        })
      } else {
        response = await fetch('/api/receipts-payments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(transactionData)
        })
      }

      const data = await response.json()
      if (data.success) {
        await fetchTransactions()
        setShowForm(false)
        setEditingTransaction(null)
        resetForm()
        alert(editingTransaction ? 'تراکنش با موفقیت به‌روزرسانی شد' : 'تراکنش با موفقیت ثبت شد')
      } else {
        alert('خطا: ' + data.message)
      }
    } catch (error) {
      console.error('Error saving transaction:', error)
      alert('خطا در ذخیره تراکنش')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (transactionId: string) => {
    if (!confirm('آیا از حذف این تراکنش اطمینان دارید؟')) return

    try {
      const response = await fetch(`/api/receipts-payments/${transactionId}`, {
        method: 'DELETE'
      })
      const data = await response.json()
      if (data.success) {
        await fetchTransactions()
        alert('تراکنش با موفقیت حذف شد')
      } else {
        alert('خطا: ' + data.message)
      }
    } catch (error) {
      console.error('Error deleting transaction:', error)
      alert('خطا در حذف تراکنش')
    }
  }


  const openAddForm = () => {
    setEditingTransaction(null)
    resetForm()
    setShowForm(true)
  }

  const openEditForm = (transaction: ReceiptPayment) => {
    setEditingTransaction(transaction)
    setFormData({
      type: transaction.type,
      amount: transaction.amount,
      method: transaction.method,
      personId: transaction.personId,
      personName: transaction.personName,
      personType: transaction.personType,
      reference: transaction.reference,
      referenceType: transaction.referenceType,
      referenceId: transaction.referenceId,
      description: transaction.description,
      date: transaction.date,
      time: transaction.time,
      branchId: transaction.branchId,
      branchName: transaction.branchName,
      cashRegisterId: transaction.cashRegisterId,
      cashRegisterName: transaction.cashRegisterName,
      status: transaction.status,
      notes: transaction.notes
    })
    setShowForm(true)
  }


  const resetForm = () => {
    setFormData({
      type: 'receipt',
      amount: 0,
      method: 'cash',
      personId: '',
      personName: '',
      personType: 'customer',
      reference: '',
      referenceType: 'invoice',
      referenceId: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
      branchId: 'BR-001',
      branchName: 'شعبه مرکزی',
      cashRegisterId: 'CR-001',
      cashRegisterName: 'صندوق اصلی',
      status: 'completed',
      notes: ''
    })
  }

  const getTransactionTypeIcon = (type: string) => {
    return type === 'receipt' ? 
      <ArrowUpRight className="w-4 h-4 text-green-600" /> : 
      <ArrowDownLeft className="w-4 h-4 text-red-600" />
  }

  const getTransactionTypeText = (type: string) => {
    return type === 'receipt' ? 'دریافت' : 'پرداخت'
  }

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'cash': return <Banknote className="w-4 h-4 text-green-600" />
      case 'card': return <CreditCard className="w-4 h-4 text-blue-600" />
      case 'bank_transfer': return <Building className="w-4 h-4 text-purple-600" />
      case 'credit': return <DollarSign className="w-4 h-4 text-orange-600" />
      case 'check': return <FileText className="w-4 h-4 text-yellow-600" />
      default: return null
    }
  }

  const getMethodText = (method: string) => {
    switch (method) {
      case 'cash': return 'نقد'
      case 'card': return 'کارت'
      case 'bank_transfer': return 'حواله بانکی'
      case 'credit': return 'نسیه'
      case 'check': return 'چک'
      default: return 'نامشخص'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
      case 'pending': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
      case 'cancelled': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'تکمیل شده'
      case 'pending': return 'در انتظار'
      case 'cancelled': return 'لغو شده'
      default: return 'نامشخص'
    }
  }

  const getTotalReceipts = () => transactions.filter(t => t.type === 'receipt').reduce((sum, t) => sum + t.amount, 0)
  const getTotalPayments = () => transactions.filter(t => t.type === 'payment').reduce((sum, t) => sum + t.amount, 0)
  const getNetCashFlow = () => getTotalReceipts() - getTotalPayments()
  const getPendingAmount = () => transactions.filter(t => t.status === 'pending').reduce((sum, t) => sum + t.amount, 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/80 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold gradient-text mb-2">دریافت و پرداخت</h1>
          <p className="text-gray-600 dark:text-gray-300">مدیریت تراکنش‌های مالی ورودی و خروجی</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="premium-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">کل دریافت‌ها</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{getTotalReceipts().toLocaleString('fa-IR')}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
          <div className="premium-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">کل پرداخت‌ها</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{getTotalPayments().toLocaleString('fa-IR')}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </div>
          <div className="premium-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">گردش نقدی خالص</p>
                <p className={`text-2xl font-bold ${getNetCashFlow() >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {getNetCashFlow().toLocaleString('fa-IR')}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
          <div className="premium-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">مبلغ در انتظار</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{getPendingAmount().toLocaleString('fa-IR')}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="premium-card p-6 mb-8">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="جستجو در تراکنش‌ها..."
                  className="w-64 pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">همه انواع</option>
                <option value="receipt">دریافت</option>
                <option value="payment">پرداخت</option>
              </select>
              <select
                value={filterMethod}
                onChange={(e) => setFilterMethod(e.target.value)}
                className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">همه روش‌ها</option>
                <option value="cash">نقد</option>
                <option value="card">کارت</option>
                <option value="bank_transfer">حواله بانکی</option>
                <option value="credit">نسیه</option>
                <option value="check">چک</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">همه وضعیت‌ها</option>
                <option value="completed">تکمیل شده</option>
                <option value="pending">در انتظار</option>
                <option value="cancelled">لغو شده</option>
              </select>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <button
                onClick={openAddForm}
                className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>تراکنش جدید</span>
              </button>
              <button className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                <Download className="w-4 h-4" />
                <span>صادر کردن</span>
              </button>
            </div>
          </div>
        </div>

        {/* Transactions List */}
        <div className="premium-card p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">لیست تراکنش‌ها</h2>
          
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">هیچ تراکنشی یافت نشد</h3>
              <p className="text-gray-600 dark:text-gray-400">تراکنش‌های مالی در اینجا نمایش داده می‌شوند</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead>
                  <tr className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-800/50">
                    <th className="px-4 py-3 rounded-r-lg">نوع</th>
                    <th className="px-4 py-3">مبلغ</th>
                    <th className="px-4 py-3">روش پرداخت</th>
                    <th className="px-4 py-3">شخص</th>
                    <th className="px-4 py-3">مرجع</th>
                    <th className="px-4 py-3">تاریخ</th>
                    <th className="px-4 py-3">وضعیت</th>
                    <th className="px-4 py-3">مانده</th>
                    <th className="px-4 py-3 rounded-l-lg">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredTransactions.map(transaction => (
                    <tr key={transaction.id} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          {getTransactionTypeIcon(transaction.type)}
                          <span className={`font-medium ${
                            transaction.type === 'receipt' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                          }`}>
                            {getTransactionTypeText(transaction.type)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">
                        {transaction.amount.toLocaleString('fa-IR')} تومان
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          {getMethodIcon(transaction.method)}
                          <span className="text-gray-700 dark:text-gray-200">
                            {getMethodText(transaction.method)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-gray-900 dark:text-white font-medium">{transaction.personName}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{transaction.personType}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-gray-900 dark:text-white font-medium">{transaction.reference}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{transaction.description}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200">
                        {transaction.date} {transaction.time}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                          {getStatusText(transaction.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200">
                        {transaction.remainingAmount.toLocaleString('fa-IR')} تومان
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex space-x-2 space-x-reverse">
                          <button
                            onClick={() => setSelectedTransaction(transaction)}
                            className="p-2 rounded-full text-primary-600 hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditForm(transaction)}
                            className="p-2 rounded-full text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(transaction.id)}
                            className="p-2 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add/Edit Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {editingTransaction ? 'ویرایش تراکنش' : 'تراکنش جدید'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    نوع تراکنش
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value as 'receipt' | 'payment'})}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="receipt">دریافت</option>
                    <option value="payment">پرداخت</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    مبلغ (تومان)
                  </label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    روش پرداخت
                  </label>
                  <select
                    value={formData.method}
                    onChange={(e) => setFormData({...formData, method: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="cash">نقد</option>
                    <option value="card">کارت</option>
                    <option value="bank_transfer">حواله بانکی</option>
                    <option value="credit">نسیه</option>
                    <option value="check">چک</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    نوع شخص
                  </label>
                  <select
                    value={formData.personType}
                    onChange={(e) => setFormData({...formData, personType: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="customer">مشتری</option>
                    <option value="vendor">تامین‌کننده</option>
                    <option value="employee">کارمند</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    نام شخص
                  </label>
                  <input
                    type="text"
                    value={formData.personName}
                    onChange={(e) => setFormData({...formData, personName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    نوع مرجع
                  </label>
                  <select
                    value={formData.referenceType}
                    onChange={(e) => setFormData({...formData, referenceType: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="invoice">فاکتور</option>
                    <option value="purchase">خرید</option>
                    <option value="adjustment">تعدیل</option>
                    <option value="deposit">ودیعه</option>
                    <option value="advance">پیش‌دریافت</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    شماره مرجع
                  </label>
                  <input
                    type="text"
                    value={formData.reference}
                    onChange={(e) => setFormData({...formData, reference: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    وضعیت
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="completed">تکمیل شده</option>
                    <option value="pending">در انتظار</option>
                    <option value="cancelled">لغو شده</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    توضیحات
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    یادداشت
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex items-center justify-end space-x-3 space-x-reverse mt-6">
                <button
                  onClick={() => {
                    setShowForm(false)
                    setEditingTransaction(null)
                    resetForm()
                  }}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                >
                  انصراف
                </button>
                <button
                  onClick={handleSave}
                  className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>ذخیره</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Transaction Details Modal */}
        {selectedTransaction && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  جزئیات تراکنش
                </h3>
                <button
                  onClick={() => setSelectedTransaction(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">نوع تراکنش</label>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      {getTransactionTypeIcon(selectedTransaction.type)}
                      <span className={`font-medium ${
                        selectedTransaction.type === 'receipt' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {getTransactionTypeText(selectedTransaction.type)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">مبلغ</label>
                    <p className="text-gray-900 dark:text-white font-bold">{selectedTransaction.amount.toLocaleString('fa-IR')} تومان</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">روش پرداخت</label>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      {getMethodIcon(selectedTransaction.method)}
                      <span className="text-gray-900 dark:text-white">{getMethodText(selectedTransaction.method)}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">وضعیت</label>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedTransaction.status)}`}>
                      {getStatusText(selectedTransaction.status)}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">شخص</label>
                    <p className="text-gray-900 dark:text-white">{selectedTransaction.personName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">نوع شخص</label>
                    <p className="text-gray-900 dark:text-white">{selectedTransaction.personType}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">مرجع</label>
                    <p className="text-gray-900 dark:text-white">{selectedTransaction.reference}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">تاریخ</label>
                    <p className="text-gray-900 dark:text-white">{selectedTransaction.date} {selectedTransaction.time}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">مبلغ اعمال شده</label>
                    <p className="text-gray-900 dark:text-white">{selectedTransaction.appliedAmount.toLocaleString('fa-IR')} تومان</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">مانده</label>
                    <p className="text-gray-900 dark:text-white">{selectedTransaction.remainingAmount.toLocaleString('fa-IR')} تومان</p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">توضیحات</label>
                  <p className="text-gray-900 dark:text-white">{selectedTransaction.description}</p>
                </div>
                
                {selectedTransaction.notes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">یادداشت</label>
                    <p className="text-gray-900 dark:text-white p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      {selectedTransaction.notes}
                    </p>
                  </div>
                )}
                
                <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div>
                      <span>شعبه: {selectedTransaction.branchName}</span>
                    </div>
                    <div>
                      <span>صندوق: {selectedTransaction.cashRegisterName}</span>
                    </div>
                    <div>
                      <span>ایجاد شده توسط: {selectedTransaction.createdBy}</span>
                    </div>
                    <div>
                      <span>تاریخ ایجاد: {selectedTransaction.createdAt}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
