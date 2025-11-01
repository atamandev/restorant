'use client'

import React, { useState, useEffect, useCallback } from 'react'
import LineChart from '@/components/Charts/LineChart'
import PieChart from '@/components/Charts/PieChart'
import {
  CreditCard,
  Banknote,
  Receipt,
  FileText,
  Search,
  Filter,
  Calendar,
  TrendingUp,
  TrendingDown,
  Download,
  Printer,
  RefreshCw,
  Eye,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ArrowUpRight,
  ArrowDownLeft,
  Activity,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  DollarSign,
  Percent,
  Users,
  Building,
  MapPin,
  User,
  Package,
  Truck,
  Warehouse,
  Calculator,
  Database,
  FileSpreadsheet,
  BookOpen,
  ClipboardList,
  Bell,
  Settings,
  Zap,
  Target,
  Star,
  Award,
  Plus,
  Minus,
  Edit,
  Trash2,
  Save,
  Send,
  Play,
  Pause,
  Square
} from 'lucide-react'

interface ChequeData {
  id: string
  _id: string
  chequeNumber: string
  bankName: string
  amount: number
  dueDate: string
  status: 'in_hand' | 'deposited' | 'cleared' | 'returned' | 'endorsed'
  owner: string
  personName: string
  purpose: string
  reference: string
  daysToDue: number
  isOverdue: boolean
  createdDate: string
  issueDate: string
  createdBy: string
}

interface PaymentData {
  id: string
  _id: string
  paymentNumber: string
  transactionNumber: string
  date: string
  amount: number
  method: 'cash' | 'card' | 'bank_transfer' | 'cheque' | 'credit'
  purpose: string
  description: string
  person: string
  personName: string
  reference: string
  createdBy: string
  branch: string
  type: 'receipt' | 'payment'
}

interface CashFlowData {
  date: string
  cashIn: number
  cashOut: number
  netFlow: number
  balance: number
  isFuture?: boolean
}

const getChequeStatusColor = (status: string) => {
  switch (status) {
    case 'in_hand': return 'text-blue-600 dark:text-blue-400'
    case 'deposited': return 'text-yellow-600 dark:text-yellow-400'
    case 'cleared': return 'text-green-600 dark:text-green-400'
    case 'returned': return 'text-red-600 dark:text-red-400'
    case 'endorsed': return 'text-purple-600 dark:text-purple-400'
    default: return 'text-gray-600 dark:text-gray-400'
  }
}

const getChequeStatusBadge = (status: string) => {
  switch (status) {
    case 'in_hand': return <span className="status-badge bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">در دست</span>
    case 'deposited': return <span className="status-badge bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">واریز شده</span>
    case 'cleared': return <span className="status-badge bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">پاس شده</span>
    case 'returned': return <span className="status-badge bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">برگشت خورده</span>
    case 'endorsed': return <span className="status-badge bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">پشت‌نویسی شده</span>
    default: return null
  }
}

const getPaymentMethodBadge = (method: string) => {
  switch (method) {
    case 'cash': return <span className="status-badge bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">نقدی</span>
    case 'card': return <span className="status-badge bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">کارتخوان</span>
    case 'bank_transfer': return <span className="status-badge bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">حواله</span>
    case 'cheque': return <span className="status-badge bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">چک</span>
    case 'credit': return <span className="status-badge bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">اعتباری</span>
    default: return null
  }
}

const formatDate = (dateString: string) => {
  if (!dateString) return ''
  try {
    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}/${month}/${day}`
  } catch {
    return dateString
  }
}

export default function ChequePaymentReportsPage() {
  const [activeTab, setActiveTab] = useState<'cheques' | 'payments' | 'cashflow'>('cheques')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterMethod, setFilterMethod] = useState('all')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')
  const [filterBank, setFilterBank] = useState('all')
  const [loading, setLoading] = useState(false)
  const [chequeData, setChequeData] = useState<ChequeData[]>([])
  const [paymentData, setPaymentData] = useState<PaymentData[]>([])
  const [cashFlowData, setCashFlowData] = useState<CashFlowData[]>([])
  const [chequeStats, setChequeStats] = useState<any>(null)
  const [paymentAnalysis, setPaymentAnalysis] = useState<any>(null)
  const [cashFlowSummary, setCashFlowSummary] = useState<any>(null)
  
  // Modal states
  const [showChequeModal, setShowChequeModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showChequeDetailsModal, setShowChequeDetailsModal] = useState(false)
  const [showPaymentDetailsModal, setShowPaymentDetailsModal] = useState(false)
  const [selectedCheque, setSelectedCheque] = useState<ChequeData | null>(null)
  const [selectedPayment, setSelectedPayment] = useState<PaymentData | null>(null)
  const [editingCheque, setEditingCheque] = useState<ChequeData | null>(null)
  const [editingPayment, setEditingPayment] = useState<PaymentData | null>(null)
  
  // Form states
  const [chequeForm, setChequeForm] = useState({
    chequeNumber: '',
    bankName: '',
    amount: '',
    issueDate: '',
    dueDate: '',
    status: 'in_hand' as const,
    personName: '',
    purpose: '',
    reference: '',
    notes: ''
  })
  
  const [paymentForm, setPaymentForm] = useState({
    type: 'receipt' as 'receipt' | 'payment',
    amount: '',
    method: 'cash' as const,
    date: '',
    personName: '',
    description: '',
    reference: '',
    notes: ''
  })

  // Fetch چک‌ها
  const fetchCheques = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filterStatus !== 'all') params.append('status', filterStatus)
      if (filterBank !== 'all') params.append('bankName', filterBank)
      if (filterDateFrom) params.append('dueFromDate', filterDateFrom)
      if (filterDateTo) params.append('dueToDate', filterDateTo)

      const response = await fetch(`/api/cheque-payment-reports/cheques?${params.toString()}`)
      const result = await response.json()
      
      if (result.success) {
        setChequeData(result.data || [])
        setChequeStats(result.stats || null)
      }
    } catch (error) {
      console.error('Error fetching cheques:', error)
    } finally {
      setLoading(false)
    }
  }, [filterStatus, filterBank, filterDateFrom, filterDateTo])

  // Fetch پرداخت‌ها
  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filterMethod !== 'all') params.append('method', filterMethod)
      if (filterDateFrom) params.append('fromDate', filterDateFrom)
      if (filterDateTo) params.append('toDate', filterDateTo)

      const response = await fetch(`/api/cheque-payment-reports/payments?${params.toString()}`)
      const result = await response.json()
      
      if (result.success) {
        setPaymentData(result.data || [])
        setPaymentAnalysis(result.analysis || null)
      }
    } catch (error) {
      console.error('Error fetching payments:', error)
    } finally {
      setLoading(false)
    }
  }, [filterMethod, filterDateFrom, filterDateTo])

  // Fetch جریان نقدی
  const fetchCashFlow = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filterDateFrom) params.append('fromDate', filterDateFrom)
      if (filterDateTo) params.append('toDate', filterDateTo)
      params.append('days', '30')

      const response = await fetch(`/api/cheque-payment-reports/cash-flow?${params.toString()}`)
      const result = await response.json()
      
      if (result.success) {
        setCashFlowData(result.data || [])
        setCashFlowSummary(result.summary || null)
      }
    } catch (error) {
      console.error('Error fetching cash flow:', error)
    } finally {
      setLoading(false)
    }
  }, [filterDateFrom, filterDateTo])

  // اضافه کردن داده نمونه
  const handleAddSampleData = async () => {
    if (!confirm('آیا می‌خواهید داده‌های نمونه اضافه شوند؟')) {
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/add-sample-cheque-payment-data', {
        method: 'POST'
      })
      const data = await response.json()
      if (data.success) {
        await fetchCheques()
        await fetchPayments()
        await fetchCashFlow()
        alert('داده‌های نمونه با موفقیت اضافه شدند')
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

  useEffect(() => {
    if (activeTab === 'cheques') {
      fetchCheques()
    } else if (activeTab === 'payments') {
      fetchPayments()
    } else if (activeTab === 'cashflow') {
      fetchCashFlow()
    }
  }, [activeTab, fetchCheques, fetchPayments, fetchCashFlow])

  const filteredChequeData = chequeData.filter(cheque =>
    (searchTerm === '' || 
      (cheque.chequeNumber && cheque.chequeNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (cheque.personName && cheque.personName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (cheque.bankName && cheque.bankName.toLowerCase().includes(searchTerm.toLowerCase())))
  )

  const filteredPaymentData = paymentData.filter(payment =>
    (searchTerm === '' || 
      (payment.paymentNumber && payment.paymentNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (payment.personName && payment.personName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (payment.description && payment.description.toLowerCase().includes(searchTerm.toLowerCase())))
  )

  // محاسبه آمار از داده‌های واقعی
  const totalCheques = chequeStats?.totalCheques || chequeData.length
  const totalChequeAmount = chequeStats?.totalAmount || chequeData.reduce((sum, cheque) => sum + (cheque.amount || 0), 0)
  const overdueCheques = chequeStats?.overdueCheques || chequeData.filter(cheque => cheque.isOverdue).length
  const clearedCheques = chequeData.filter(cheque => cheque.status === 'cleared').length

  const totalCashIn = cashFlowSummary?.totalCashIn || cashFlowData.reduce((sum, data) => sum + data.cashIn, 0)
  const totalCashOut = cashFlowSummary?.totalCashOut || cashFlowData.reduce((sum, data) => sum + data.cashOut, 0)
  const netCashFlow = cashFlowSummary?.netCashFlow || (totalCashIn - totalCashOut)
  const currentBalance = cashFlowSummary?.currentBalance || (cashFlowData.length > 0 ? cashFlowData[cashFlowData.length - 1].balance : 0)

  const handleExport = async (type: string) => {
    try {
      let url = ''
      if (type === 'چک‌ها') {
        url = '/api/cheque-payment-reports/cheques'
      } else if (type === 'پرداخت‌ها') {
        url = '/api/cheque-payment-reports/payments'
      } else if (type === 'جریان نقدی') {
        url = '/api/cheque-payment-reports/cash-flow'
      }
      
      const response = await fetch(url)
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = downloadUrl
      a.download = `report-${type}-${Date.now()}.json`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(downloadUrl)
      document.body.removeChild(a)
      alert(`گزارش ${type} دانلود شد.`)
    } catch (error) {
      alert(`خطا در صادرات گزارش ${type}`)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleRefresh = () => {
    if (activeTab === 'cheques') {
      fetchCheques()
    } else if (activeTab === 'payments') {
      fetchPayments()
    } else if (activeTab === 'cashflow') {
      fetchCashFlow()
    }
  }

  const handleGenerateReport = async (type: 'cheques' | 'payments' | 'cashflow') => {
    try {
      setLoading(true)
      if (type === 'cheques') {
        await fetchCheques()
      } else if (type === 'payments') {
        await fetchPayments()
      } else if (type === 'cashflow') {
        await fetchCashFlow()
      }
      alert('گزارش با موفقیت تولید شد')
    } catch (error) {
      console.error('Error generating report:', error)
      alert('خطا در تولید گزارش')
    } finally {
      setLoading(false)
    }
  }

  // CRUD Functions for Cheques
  const handleCreateCheque = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/cheques', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chequeNumber: chequeForm.chequeNumber,
          bankName: chequeForm.bankName,
          amount: parseFloat(chequeForm.amount),
          issueDate: chequeForm.issueDate,
          dueDate: chequeForm.dueDate,
          status: chequeForm.status,
          personName: chequeForm.personName,
          purpose: chequeForm.purpose,
          reference: chequeForm.reference,
          notes: chequeForm.notes,
          chequeType: 'received'
        })
      })
      const data = await response.json()
      if (data.success) {
        alert('چک با موفقیت ثبت شد')
        setShowChequeModal(false)
        resetChequeForm()
        fetchCheques()
      } else {
        alert('خطا: ' + data.message)
      }
    } catch (error) {
      console.error('Error creating cheque:', error)
      alert('خطا در ثبت چک')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateCheque = async () => {
    if (!editingCheque) return
    try {
      setLoading(true)
      const response = await fetch(`/api/cheques/${editingCheque._id || editingCheque.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chequeNumber: chequeForm.chequeNumber,
          bankName: chequeForm.bankName,
          amount: parseFloat(chequeForm.amount),
          issueDate: chequeForm.issueDate,
          dueDate: chequeForm.dueDate,
          status: chequeForm.status,
          personName: chequeForm.personName,
          purpose: chequeForm.purpose,
          reference: chequeForm.reference,
          notes: chequeForm.notes
        })
      })
      const data = await response.json()
      if (data.success) {
        alert('چک با موفقیت به‌روزرسانی شد')
        setShowChequeModal(false)
        setEditingCheque(null)
        resetChequeForm()
        fetchCheques()
      } else {
        alert('خطا: ' + data.message)
      }
    } catch (error) {
      console.error('Error updating cheque:', error)
      alert('خطا در به‌روزرسانی چک')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCheque = async (chequeId: string) => {
    if (!confirm('آیا از حذف این چک اطمینان دارید؟')) return
    try {
      setLoading(true)
      const response = await fetch(`/api/cheques/${chequeId}`, {
        method: 'DELETE'
      })
      const data = await response.json()
      if (data.success) {
        alert('چک با موفقیت حذف شد')
        fetchCheques()
      } else {
        alert('خطا: ' + data.message)
      }
    } catch (error) {
      console.error('Error deleting cheque:', error)
      alert('خطا در حذف چک')
    } finally {
      setLoading(false)
    }
  }

  const handleViewCheque = (cheque: ChequeData) => {
    setSelectedCheque(cheque)
    setShowChequeDetailsModal(true)
  }

  const handleEditCheque = (cheque: ChequeData) => {
    setEditingCheque(cheque)
    setChequeForm({
      chequeNumber: cheque.chequeNumber || '',
      bankName: cheque.bankName || '',
      amount: cheque.amount?.toString() || '',
      issueDate: cheque.issueDate ? new Date(cheque.issueDate).toISOString().split('T')[0] : '',
      dueDate: cheque.dueDate ? new Date(cheque.dueDate).toISOString().split('T')[0] : '',
      status: cheque.status || 'in_hand',
      personName: cheque.personName || cheque.owner || '',
      purpose: cheque.purpose || '',
      reference: cheque.reference || '',
      notes: ''
    })
    setShowChequeModal(true)
  }

  const resetChequeForm = () => {
    setChequeForm({
      chequeNumber: '',
      bankName: '',
      amount: '',
      issueDate: '',
      dueDate: '',
      status: 'in_hand',
      personName: '',
      purpose: '',
      reference: '',
      notes: ''
    })
    setEditingCheque(null)
  }

  // CRUD Functions for Payments
  const handleCreatePayment = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/receipts-payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: paymentForm.type,
          amount: parseFloat(paymentForm.amount),
          method: paymentForm.method,
          date: paymentForm.date || new Date().toISOString().split('T')[0],
          personName: paymentForm.personName,
          description: paymentForm.description,
          reference: paymentForm.reference,
          notes: paymentForm.notes
        })
      })
      const data = await response.json()
      if (data.success) {
        alert('تراکنش با موفقیت ثبت شد')
        setShowPaymentModal(false)
        resetPaymentForm()
        fetchPayments()
      } else {
        alert('خطا: ' + data.message)
      }
    } catch (error) {
      console.error('Error creating payment:', error)
      alert('خطا در ثبت تراکنش')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePayment = async () => {
    if (!editingPayment) return
    try {
      setLoading(true)
      const response = await fetch(`/api/receipts-payments/${editingPayment._id || editingPayment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: paymentForm.type,
          amount: parseFloat(paymentForm.amount),
          method: paymentForm.method,
          date: paymentForm.date,
          personName: paymentForm.personName,
          description: paymentForm.description,
          reference: paymentForm.reference,
          notes: paymentForm.notes,
          personType: 'customer'
        })
      })
      const data = await response.json()
      if (data.success) {
        alert('تراکنش با موفقیت به‌روزرسانی شد')
        setShowPaymentModal(false)
        setEditingPayment(null)
        resetPaymentForm()
        fetchPayments()
      } else {
        alert('خطا: ' + data.message)
      }
    } catch (error) {
      console.error('Error updating payment:', error)
      alert('خطا در به‌روزرسانی تراکنش')
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePayment = async (paymentId: string) => {
    if (!confirm('آیا از حذف این تراکنش اطمینان دارید؟')) return
    try {
      setLoading(true)
      const response = await fetch(`/api/receipts-payments/${paymentId}`, {
        method: 'DELETE'
      })
      const data = await response.json()
      if (data.success) {
        alert('تراکنش با موفقیت حذف شد')
        fetchPayments()
      } else {
        alert('خطا: ' + data.message)
      }
    } catch (error) {
      console.error('Error deleting payment:', error)
      alert('خطا در حذف تراکنش')
    } finally {
      setLoading(false)
    }
  }

  const handleViewPayment = (payment: PaymentData) => {
    setSelectedPayment(payment)
    setShowPaymentDetailsModal(true)
  }

  const handleEditPayment = (payment: PaymentData) => {
    setEditingPayment(payment)
    setPaymentForm({
      type: payment.type || 'receipt',
      amount: payment.amount?.toString() || '',
      method: payment.method || 'cash',
      date: payment.date ? new Date(payment.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      personName: payment.personName || payment.person || '',
      description: payment.description || payment.purpose || '',
      reference: payment.reference || '',
      notes: ''
    })
    setShowPaymentModal(true)
  }

  const resetPaymentForm = () => {
    setPaymentForm({
      type: 'receipt',
      amount: '',
      method: 'cash',
      date: new Date().toISOString().split('T')[0],
      personName: '',
      description: '',
      reference: '',
      notes: ''
    })
    setEditingPayment(null)
  }

  return (
    <div className="fade-in-animation space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">گزارشات چک‌ها و پرداخت‌ها</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            گزارشات وضعیت چک‌ها، پرداخت‌ها و جریان نقدی برای برنامه‌ریزی نقدینگی.
          </p>
        </div>
        <div className="flex items-center space-x-3 space-x-reverse">
          {activeTab === 'cheques' && (
            <button
              onClick={() => {
                resetChequeForm()
                setShowChequeModal(true)
              }}
              className="premium-button flex items-center space-x-2 space-x-reverse"
            >
              <Plus className="w-5 h-5" />
              <span>چک جدید</span>
            </button>
          )}
          {activeTab === 'payments' && (
            <button
              onClick={() => {
                resetPaymentForm()
                setShowPaymentModal(true)
              }}
              className="premium-button flex items-center space-x-2 space-x-reverse"
            >
              <Plus className="w-5 h-5" />
              <span>تراکنش جدید</span>
            </button>
          )}
          <button
            onClick={handleAddSampleData}
            className="premium-button flex items-center space-x-2 space-x-reverse"
            disabled={loading}
          >
            <Database className="w-5 h-5" />
            <span>داده نمونه</span>
          </button>
          <button
            onClick={handleRefresh}
            className="premium-button flex items-center space-x-2 space-x-reverse"
            disabled={loading}
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            <span>بروزرسانی</span>
          </button>
          <button
            onClick={handlePrint}
            className="premium-button p-3"
          >
            <Printer className="w-5 h-5" />
          </button>
          <button
            onClick={() => handleExport(activeTab === 'cheques' ? 'چک‌ها' : activeTab === 'payments' ? 'پرداخت‌ها' : 'جریان نقدی')}
            className="premium-button p-3"
          >
            <Download className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="premium-card p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-l-4 border-blue-500 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">کل چک‌ها</h3>
            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{totalCheques}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">چک ثبت شده</p>
        </div>

        <div className="premium-card p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-l-4 border-green-500 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">مبلغ کل چک‌ها</h3>
            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{totalChequeAmount.toLocaleString('fa-IR')}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">تومان</p>
        </div>

        <div className="premium-card p-6 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-l-4 border-red-500 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">چک‌های معوق</h3>
            <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{overdueCheques}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">چک نیاز به پیگیری</p>
        </div>

        <div className="premium-card p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-l-4 border-purple-500 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">چک‌های پاس شده</h3>
            <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{clearedCheques}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">چک پاس شده</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="premium-card p-6">
        <div className="flex space-x-2 space-x-reverse bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl p-1.5 mb-6 shadow-inner">
          <button
            onClick={() => setActiveTab('cheques')}
            className={`flex-1 flex items-center justify-center space-x-2 space-x-reverse px-5 py-3 rounded-lg transition-all duration-300 font-semibold ${
              activeTab === 'cheques'
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/50 transform scale-105'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-700/50'
            }`}
          >
            <CreditCard className={`w-5 h-5 ${activeTab === 'cheques' ? 'animate-pulse' : ''}`} />
            <span>چک‌ها</span>
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`flex-1 flex items-center justify-center space-x-2 space-x-reverse px-5 py-3 rounded-lg transition-all duration-300 font-semibold ${
              activeTab === 'payments'
                ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg shadow-green-500/50 transform scale-105'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-700/50'
            }`}
          >
            <Receipt className={`w-5 h-5 ${activeTab === 'payments' ? 'animate-pulse' : ''}`} />
            <span>پرداخت‌ها</span>
          </button>
          <button
            onClick={() => setActiveTab('cashflow')}
            className={`flex-1 flex items-center justify-center space-x-2 space-x-reverse px-5 py-3 rounded-lg transition-all duration-300 font-semibold ${
              activeTab === 'cashflow'
                ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/50 transform scale-105'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-700/50'
            }`}
          >
            <Activity className={`w-5 h-5 ${activeTab === 'cashflow' ? 'animate-pulse' : ''}`} />
            <span>جریان نقدی</span>
          </button>
        </div>

        {/* Filters */}
        <div className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-700 rounded-xl p-4 mb-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2 space-x-reverse mb-4">
            <Filter className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">فیلترها</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">جستجو</label>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="جستجو..."
                  className="premium-input w-full pr-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            {activeTab === 'cheques' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">وضعیت</label>
                  <select
                    className="premium-input w-full"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="all">همه وضعیت‌ها</option>
                    <option value="in_hand">در دست</option>
                    <option value="deposited">واریز شده</option>
                    <option value="cleared">پاس شده</option>
                    <option value="returned">برگشت خورده</option>
                    <option value="endorsed">پشت‌نویسی شده</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">بانک</label>
                  <select
                    className="premium-input w-full"
                    value={filterBank}
                    onChange={(e) => setFilterBank(e.target.value)}
                  >
                    <option value="all">همه بانک‌ها</option>
                    <option value="بانک ملی">بانک ملی</option>
                    <option value="بانک صادرات">بانک صادرات</option>
                    <option value="بانک تجارت">بانک تجارت</option>
                    <option value="بانک ملت">بانک ملت</option>
                  </select>
                </div>
              </>
            )}
            {activeTab === 'payments' && (
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">روش پرداخت</label>
                <select
                  className="premium-input w-full"
                  value={filterMethod}
                  onChange={(e) => setFilterMethod(e.target.value)}
                >
                  <option value="all">همه روش‌ها</option>
                  <option value="cash">نقدی</option>
                  <option value="card">کارتخوان</option>
                  <option value="bank_transfer">حواله</option>
                  <option value="cheque">چک</option>
                  <option value="credit">اعتباری</option>
                </select>
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">از تاریخ</label>
              <input
                type="date"
                className="premium-input w-full"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">تا تاریخ</label>
              <input
                type="date"
                className="premium-input w-full"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Cheques Tab */}
        {activeTab === 'cheques' && (
          <div className="overflow-x-auto custom-scrollbar">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-8 h-8 animate-spin text-primary-600" />
              </div>
            ) : filteredChequeData.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-16">
                <div className="w-20 h-20 mb-4 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 flex items-center justify-center">
                  <CreditCard className="w-10 h-10 text-blue-500 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">هیچ داده‌ای یافت نشد</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-md">
                  برای شروع، داده‌های نمونه اضافه کنید یا گزارش جدید تولید کنید.
                </p>
                <div className="flex items-center space-x-3 space-x-reverse">
                  <button
                    onClick={handleAddSampleData}
                    className="premium-button flex items-center space-x-2 space-x-reverse"
                  >
                    <Database className="w-4 h-4" />
                    <span>اضافه کردن داده نمونه</span>
                  </button>
                  <button
                    onClick={() => handleGenerateReport('cheques')}
                    className="premium-button flex items-center space-x-2 space-x-reverse"
                  >
                    <Zap className="w-4 h-4" />
                    <span>تولید گزارش</span>
                  </button>
                </div>
              </div>
            ) : (
              <table className="w-full text-right whitespace-nowrap">
                <thead>
                  <tr className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-800/50">
                    <th className="px-4 py-3 rounded-r-lg">شماره چک</th>
                    <th className="px-4 py-3">بانک</th>
                    <th className="px-4 py-3">مبلغ</th>
                    <th className="px-4 py-3">تاریخ سررسید</th>
                    <th className="px-4 py-3">وضعیت</th>
                    <th className="px-4 py-3">صاحب چک</th>
                    <th className="px-4 py-3">بابت</th>
                    <th className="px-4 py-3">مرجع</th>
                    <th className="px-4 py-3">روز تا سررسید</th>
                    <th className="px-4 py-3 rounded-l-lg">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredChequeData.map(cheque => (
                    <tr key={cheque.id || cheque._id} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-3 space-x-reverse">
                          <CreditCard className="w-5 h-5 text-primary-600" />
                          <span className="font-medium text-gray-900 dark:text-white">{cheque.chequeNumber}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{cheque.bankName}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{cheque.amount.toLocaleString('fa-IR')} تومان</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{formatDate(cheque.dueDate)}</td>
                      <td className="px-4 py-3">
                        {getChequeStatusBadge(cheque.status)}
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{cheque.personName || cheque.owner}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{cheque.purpose}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{cheque.reference}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          cheque.isOverdue 
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                            : cheque.daysToDue <= 3
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                            : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                        }`}>
                          {cheque.daysToDue > 0 ? `${cheque.daysToDue} روز` : 
                           cheque.daysToDue === 0 ? 'امروز' : 
                           `${Math.abs(cheque.daysToDue)} روز گذشته`}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <button 
                            onClick={() => handleViewCheque(cheque)}
                            className="p-1 rounded-full text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                            title="مشاهده جزئیات"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleEditCheque(cheque)}
                            className="p-1 rounded-full text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                            title="ویرایش"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteCheque(cheque._id || cheque.id)}
                            className="p-1 rounded-full text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                            title="حذف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Payments Tab */}
        {activeTab === 'payments' && (
          <div className="space-y-6">
            {paymentAnalysis && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="premium-card p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2 space-x-reverse">
                    <PieChartIcon className="w-6 h-6 text-primary-600" />
                    <span>توزیع روش‌های پرداخت</span>
                  </h2>
                  <div className="h-64 w-full">
                    <PieChart 
                      data={(() => {
                        if (!paymentAnalysis.methodBreakdown || paymentAnalysis.methodBreakdown.length === 0) return []
                        const total = paymentAnalysis.methodBreakdown.reduce((sum: number, m: any) => sum + (m.totalAmount || 0), 0)
                        return paymentAnalysis.methodBreakdown.map((m: any) => {
                          const percentage = total > 0 ? ((m.totalAmount || 0) / total * 100) : 0
                          return {
                            name: m.method === 'cash' ? 'نقدی' : 
                                  m.method === 'card' ? 'کارتخوان' :
                                  m.method === 'bank_transfer' ? 'حواله' :
                                  m.method === 'cheque' ? 'چک' :
                                  m.method === 'credit' ? 'اعتباری' : m.method,
                            value: Math.round(percentage),
                            color: m.method === 'cash' ? '#10B981' : 
                                   m.method === 'card' ? '#3B82F6' :
                                   m.method === 'bank_transfer' ? '#8B5CF6' :
                                   m.method === 'cheque' ? '#F59E0B' :
                                   '#EF4444'
                          }
                        })
                      })()}
                    />
                  </div>
                </div>
                <div className="premium-card p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2 space-x-reverse">
                    <BarChart3 className="w-6 h-6 text-success-600" />
                    <span>خلاصه پرداخت‌ها</span>
                  </h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <span className="text-gray-700 dark:text-gray-300">کل تراکنش‌ها</span>
                      <span className="font-bold text-gray-900 dark:text-white">{paymentAnalysis.summary?.totalTransactions || 0}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <span className="text-gray-700 dark:text-gray-300">کل دریافت‌ها</span>
                      <span className="font-bold text-green-600 dark:text-green-400">{(paymentAnalysis.summary?.receiptAmount || 0).toLocaleString('fa-IR')} تومان</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <span className="text-gray-700 dark:text-gray-300">کل پرداخت‌ها</span>
                      <span className="font-bold text-red-600 dark:text-red-400">{(paymentAnalysis.summary?.paymentAmount || 0).toLocaleString('fa-IR')} تومان</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className="overflow-x-auto custom-scrollbar">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="w-8 h-8 animate-spin text-primary-600" />
                </div>
              ) : filteredPaymentData.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-16">
                  <div className="w-20 h-20 mb-4 rounded-full bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30 flex items-center justify-center">
                    <Receipt className="w-10 h-10 text-green-500 dark:text-green-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">هیچ داده‌ای یافت نشد</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-md">
                    برای شروع، داده‌های نمونه اضافه کنید یا گزارش جدید تولید کنید.
                  </p>
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <button
                      onClick={handleAddSampleData}
                      className="premium-button flex items-center space-x-2 space-x-reverse"
                    >
                      <Database className="w-4 h-4" />
                      <span>اضافه کردن داده نمونه</span>
                    </button>
                    <button
                      onClick={() => handleGenerateReport('payments')}
                      className="premium-button flex items-center space-x-2 space-x-reverse"
                    >
                      <Zap className="w-4 h-4" />
                      <span>تولید گزارش</span>
                    </button>
                  </div>
                </div>
              ) : (
                <table className="w-full text-right whitespace-nowrap">
                  <thead>
                    <tr className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-800/50">
                      <th className="px-4 py-3 rounded-r-lg">شماره پرداخت</th>
                      <th className="px-4 py-3">تاریخ</th>
                      <th className="px-4 py-3">مبلغ</th>
                      <th className="px-4 py-3">روش پرداخت</th>
                      <th className="px-4 py-3">نوع</th>
                      <th className="px-4 py-3">بابت</th>
                      <th className="px-4 py-3">شخص</th>
                      <th className="px-4 py-3">مرجع</th>
                      <th className="px-4 py-3">توضیحات</th>
                      <th className="px-4 py-3 rounded-l-lg">عملیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredPaymentData.map(payment => (
                      <tr key={payment.id || payment._id} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-3 space-x-reverse">
                            <Receipt className="w-5 h-5 text-primary-600" />
                            <span className="font-medium text-gray-900 dark:text-white">{payment.paymentNumber || payment.transactionNumber}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{formatDate(payment.date)}</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{payment.amount.toLocaleString('fa-IR')} تومان</td>
                        <td className="px-4 py-3">
                          {getPaymentMethodBadge(payment.method)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`status-badge ${
                            payment.type === 'receipt' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                          }`}>
                            {payment.type === 'receipt' ? 'دریافت' : 'پرداخت'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{payment.description || payment.purpose}</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{payment.personName || payment.person}</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{payment.reference}</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-200 max-w-xs truncate">{payment.description}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <button 
                              onClick={() => handleViewPayment(payment)}
                              className="p-1 rounded-full text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                              title="مشاهده جزئیات"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleEditPayment(payment)}
                              className="p-1 rounded-full text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                              title="ویرایش"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDeletePayment(payment._id || payment.id)}
                              className="p-1 rounded-full text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                              title="حذف"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* Cash Flow Tab */}
        {activeTab === 'cashflow' && (
          <div className="space-y-6">
            {/* Cash Flow Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="premium-card p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-l-4 border-green-500 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">کل ورودی</h3>
                  <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                    <ArrowUpRight className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{totalCashIn.toLocaleString('fa-IR')}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">تومان</p>
              </div>

              <div className="premium-card p-6 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-l-4 border-red-500 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">کل خروجی</h3>
                  <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                    <ArrowDownLeft className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{totalCashOut.toLocaleString('fa-IR')}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">تومان</p>
              </div>

              <div className="premium-card p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-l-4 border-blue-500 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">جریان خالص</h3>
                  <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <p className={`text-3xl font-bold mb-1 ${netCashFlow >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {netCashFlow.toLocaleString('fa-IR')}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">تومان</p>
              </div>

              <div className="premium-card p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-l-4 border-purple-500 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">موجودی فعلی</h3>
                  <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <Banknote className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{currentBalance.toLocaleString('fa-IR')}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">تومان</p>
              </div>
            </div>

            {/* Cash Flow Chart */}
            {cashFlowData.length > 0 && (
              <div className="premium-card p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2 space-x-reverse">
                  <LineChartIcon className="w-6 h-6 text-primary-600" />
                  <span>نمودار جریان نقدی</span>
                </h2>
                <div className="h-80 w-full">
                  <LineChart 
                    data={cashFlowData.slice(-30).map(d => ({
                      month: formatDate(d.date).slice(5),
                      sales: d.cashIn,
                      profit: d.cashOut
                    }))}
                  />
                </div>
              </div>
            )}

            {/* Cash Flow Table */}
            <div className="overflow-x-auto custom-scrollbar">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="w-8 h-8 animate-spin text-primary-600" />
                </div>
              ) : cashFlowData.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-16">
                  <div className="w-20 h-20 mb-4 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30 flex items-center justify-center">
                    <Activity className="w-10 h-10 text-purple-500 dark:text-purple-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">هیچ داده‌ای یافت نشد</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-md">
                    برای شروع، داده‌های نمونه اضافه کنید یا گزارش جدید تولید کنید.
                  </p>
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <button
                      onClick={handleAddSampleData}
                      className="premium-button flex items-center space-x-2 space-x-reverse"
                    >
                      <Database className="w-4 h-4" />
                      <span>اضافه کردن داده نمونه</span>
                    </button>
                    <button
                      onClick={() => handleGenerateReport('cashflow')}
                      className="premium-button flex items-center space-x-2 space-x-reverse"
                    >
                      <Zap className="w-4 h-4" />
                      <span>تولید گزارش</span>
                    </button>
                  </div>
                </div>
              ) : (
                <table className="w-full text-right whitespace-nowrap">
                  <thead>
                    <tr className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-800/50">
                      <th className="px-4 py-3 rounded-r-lg">تاریخ</th>
                      <th className="px-4 py-3">ورودی</th>
                      <th className="px-4 py-3">خروجی</th>
                      <th className="px-4 py-3">جریان خالص</th>
                      <th className="px-4 py-3 rounded-l-lg">موجودی</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {cashFlowData.slice(-30).map((data, index) => (
                      <tr key={index} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <td className="px-4 py-3 text-gray-900 dark:text-white">{formatDate(data.date)}</td>
                        <td className="px-4 py-3 text-green-600 dark:text-green-400">{data.cashIn.toLocaleString('fa-IR')}</td>
                        <td className="px-4 py-3 text-red-600 dark:text-red-400">{data.cashOut.toLocaleString('fa-IR')}</td>
                        <td className={`px-4 py-3 font-medium ${data.netFlow >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {data.netFlow.toLocaleString('fa-IR')}
                        </td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-200 font-medium">{data.balance.toLocaleString('fa-IR')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="premium-card p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2 space-x-reverse">
          <Zap className="w-6 h-6 text-primary-600" />
          <span>اقدامات سریع</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <button 
            onClick={() => {
              setActiveTab('cheques')
              handleGenerateReport('cheques')
            }}
            className="premium-card p-4 flex items-center space-x-3 space-x-reverse hover:shadow-glow transition-all duration-300"
            disabled={loading}
          >
            <CreditCard className="w-8 h-8 text-blue-600" />
            <div className="text-right">
              <h3 className="font-semibold text-gray-900 dark:text-white">گزارش چک‌ها</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">وضعیت و سررسید چک‌ها</p>
            </div>
          </button>
          <button 
            onClick={() => {
              setActiveTab('cheques')
            }}
            className="premium-card p-4 flex items-center space-x-3 space-x-reverse hover:shadow-glow transition-all duration-300"
            disabled={loading}
          >
            <Clock className="w-8 h-8 text-yellow-600" />
            <div className="text-right">
              <h3 className="font-semibold text-gray-900 dark:text-white">وضعیت و سررسید چک‌ها</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">پیگیری چک‌های سررسید شده</p>
            </div>
          </button>
          <button 
            onClick={() => {
              setActiveTab('payments')
              handleGenerateReport('payments')
            }}
            className="premium-card p-4 flex items-center space-x-3 space-x-reverse hover:shadow-glow transition-all duration-300"
            disabled={loading}
          >
            <Receipt className="w-8 h-8 text-green-600" />
            <div className="text-right">
              <h3 className="font-semibold text-gray-900 dark:text-white">گزارش پرداخت‌ها</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">تحلیل روش‌های پرداخت</p>
            </div>
          </button>
          <button 
            onClick={() => {
              setActiveTab('payments')
            }}
            className="premium-card p-4 flex items-center space-x-3 space-x-reverse hover:shadow-glow transition-all duration-300"
            disabled={loading}
          >
            <BarChart3 className="w-8 h-8 text-indigo-600" />
            <div className="text-right">
              <h3 className="font-semibold text-gray-900 dark:text-white">تحلیل روش‌های پرداخت</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">مقایسه روش‌های پرداخت</p>
            </div>
          </button>
          <button 
            onClick={() => {
              setActiveTab('cashflow')
              handleGenerateReport('cashflow')
            }}
            className="premium-card p-4 flex items-center space-x-3 space-x-reverse hover:shadow-glow transition-all duration-300"
            disabled={loading}
          >
            <Activity className="w-8 h-8 text-purple-600" />
            <div className="text-right">
              <h3 className="font-semibold text-gray-900 dark:text-white">گزارش جریان نقدی</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">پیش‌بینی نقدینگی</p>
            </div>
          </button>
          <button 
            onClick={() => {
              setActiveTab('cashflow')
            }}
            className="premium-card p-4 flex items-center space-x-3 space-x-reverse hover:shadow-glow transition-all duration-300"
            disabled={loading}
          >
            <TrendingUp className="w-8 h-8 text-emerald-600" />
            <div className="text-right">
              <h3 className="font-semibold text-gray-900 dark:text-white">پیش‌بینی نقدینگی</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">بررسی وضعیت نقدینگی آینده</p>
            </div>
          </button>
        </div>
      </div>

      {/* Cheque Create/Edit Modal */}
      {showChequeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {editingCheque ? 'ویرایش چک' : 'چک جدید'}
              </h2>
              <button
                onClick={() => {
                  setShowChequeModal(false)
                  resetChequeForm()
                }}
                className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">شماره چک</label>
                  <input
                    type="text"
                    className="premium-input w-full"
                    value={chequeForm.chequeNumber}
                    onChange={(e) => setChequeForm({...chequeForm, chequeNumber: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">بانک</label>
                  <input
                    type="text"
                    className="premium-input w-full"
                    value={chequeForm.bankName}
                    onChange={(e) => setChequeForm({...chequeForm, bankName: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">مبلغ</label>
                  <input
                    type="number"
                    className="premium-input w-full"
                    value={chequeForm.amount}
                    onChange={(e) => setChequeForm({...chequeForm, amount: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">وضعیت</label>
                  <select
                    className="premium-input w-full"
                    value={chequeForm.status}
                    onChange={(e) => setChequeForm({...chequeForm, status: e.target.value as any})}
                  >
                    <option value="in_hand">در دست</option>
                    <option value="deposited">واریز شده</option>
                    <option value="cleared">پاس شده</option>
                    <option value="returned">برگشت خورده</option>
                    <option value="endorsed">پشت‌نویسی شده</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">تاریخ صدور</label>
                  <input
                    type="date"
                    className="premium-input w-full"
                    value={chequeForm.issueDate}
                    onChange={(e) => setChequeForm({...chequeForm, issueDate: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">تاریخ سررسید</label>
                  <input
                    type="date"
                    className="premium-input w-full"
                    value={chequeForm.dueDate}
                    onChange={(e) => setChequeForm({...chequeForm, dueDate: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">صاحب چک</label>
                <input
                  type="text"
                  className="premium-input w-full"
                  value={chequeForm.personName}
                  onChange={(e) => setChequeForm({...chequeForm, personName: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">بابت</label>
                <input
                  type="text"
                  className="premium-input w-full"
                  value={chequeForm.purpose}
                  onChange={(e) => setChequeForm({...chequeForm, purpose: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">مرجع</label>
                <input
                  type="text"
                  className="premium-input w-full"
                  value={chequeForm.reference}
                  onChange={(e) => setChequeForm({...chequeForm, reference: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">یادداشت</label>
                <textarea
                  className="premium-input w-full"
                  rows={3}
                  value={chequeForm.notes}
                  onChange={(e) => setChequeForm({...chequeForm, notes: e.target.value})}
                />
              </div>
              <div className="flex items-center justify-end space-x-3 space-x-reverse pt-4">
                <button
                  onClick={() => {
                    setShowChequeModal(false)
                    resetChequeForm()
                  }}
                  className="premium-button bg-gray-500 hover:bg-gray-600"
                >
                  لغو
                </button>
                <button
                  onClick={editingCheque ? handleUpdateCheque : handleCreateCheque}
                  disabled={loading}
                  className="premium-button flex items-center space-x-2 space-x-reverse"
                >
                  <Save className="w-5 h-5" />
                  <span>{editingCheque ? 'ذخیره تغییرات' : 'ثبت چک'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Create/Edit Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {editingPayment ? 'ویرایش تراکنش' : 'تراکنش جدید'}
              </h2>
              <button
                onClick={() => {
                  setShowPaymentModal(false)
                  resetPaymentForm()
                }}
                className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">نوع</label>
                  <select
                    className="premium-input w-full"
                    value={paymentForm.type}
                    onChange={(e) => setPaymentForm({...paymentForm, type: e.target.value as 'receipt' | 'payment'})}
                  >
                    <option value="receipt">دریافت</option>
                    <option value="payment">پرداخت</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">روش پرداخت</label>
                  <select
                    className="premium-input w-full"
                    value={paymentForm.method}
                    onChange={(e) => setPaymentForm({...paymentForm, method: e.target.value as any})}
                  >
                    <option value="cash">نقدی</option>
                    <option value="card">کارتخوان</option>
                    <option value="bank_transfer">حواله</option>
                    <option value="cheque">چک</option>
                    <option value="credit">اعتباری</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">مبلغ</label>
                  <input
                    type="number"
                    className="premium-input w-full"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">تاریخ</label>
                  <input
                    type="date"
                    className="premium-input w-full"
                    value={paymentForm.date}
                    onChange={(e) => setPaymentForm({...paymentForm, date: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">شخص</label>
                <input
                  type="text"
                  className="premium-input w-full"
                  value={paymentForm.personName}
                  onChange={(e) => setPaymentForm({...paymentForm, personName: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">توضیحات</label>
                <input
                  type="text"
                  className="premium-input w-full"
                  value={paymentForm.description}
                  onChange={(e) => setPaymentForm({...paymentForm, description: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">مرجع</label>
                <input
                  type="text"
                  className="premium-input w-full"
                  value={paymentForm.reference}
                  onChange={(e) => setPaymentForm({...paymentForm, reference: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">یادداشت</label>
                <textarea
                  className="premium-input w-full"
                  rows={3}
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({...paymentForm, notes: e.target.value})}
                />
              </div>
              <div className="flex items-center justify-end space-x-3 space-x-reverse pt-4">
                <button
                  onClick={() => {
                    setShowPaymentModal(false)
                    resetPaymentForm()
                  }}
                  className="premium-button bg-gray-500 hover:bg-gray-600"
                >
                  لغو
                </button>
                <button
                  onClick={editingPayment ? handleUpdatePayment : handleCreatePayment}
                  disabled={loading}
                  className="premium-button flex items-center space-x-2 space-x-reverse"
                >
                  <Save className="w-5 h-5" />
                  <span>{editingPayment ? 'ذخیره تغییرات' : 'ثبت تراکنش'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cheque Details Modal */}
      {showChequeDetailsModal && selectedCheque && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">جزئیات چک</h2>
              <button
                onClick={() => setShowChequeDetailsModal(false)}
                className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">شماره چک</label>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{selectedCheque.chequeNumber}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">بانک</label>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{selectedCheque.bankName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">مبلغ</label>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{selectedCheque.amount?.toLocaleString('fa-IR')} تومان</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">وضعیت</label>
                  <div className="mt-1">{getChequeStatusBadge(selectedCheque.status)}</div>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">تاریخ سررسید</label>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{formatDate(selectedCheque.dueDate)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">صاحب چک</label>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{selectedCheque.personName || selectedCheque.owner}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">بابت</label>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{selectedCheque.purpose}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">مرجع</label>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{selectedCheque.reference}</p>
                </div>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-end space-x-3 space-x-reverse">
              <button
                onClick={() => {
                  setShowChequeDetailsModal(false)
                  handleEditCheque(selectedCheque)
                }}
                className="premium-button flex items-center space-x-2 space-x-reverse"
              >
                <Edit className="w-5 h-5" />
                <span>ویرایش</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Details Modal */}
      {showPaymentDetailsModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">جزئیات تراکنش</h2>
              <button
                onClick={() => setShowPaymentDetailsModal(false)}
                className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">شماره تراکنش</label>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{selectedPayment.paymentNumber || selectedPayment.transactionNumber}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">نوع</label>
                  <div className="mt-1">
                    <span className={`status-badge ${
                      selectedPayment.type === 'receipt' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                    }`}>
                      {selectedPayment.type === 'receipt' ? 'دریافت' : 'پرداخت'}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">مبلغ</label>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{selectedPayment.amount?.toLocaleString('fa-IR')} تومان</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">روش پرداخت</label>
                  <div className="mt-1">{getPaymentMethodBadge(selectedPayment.method)}</div>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">تاریخ</label>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{formatDate(selectedPayment.date)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">شخص</label>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{selectedPayment.personName || selectedPayment.person}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">توضیحات</label>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{selectedPayment.description || selectedPayment.purpose}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">مرجع</label>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{selectedPayment.reference}</p>
                </div>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-end space-x-3 space-x-reverse">
              <button
                onClick={() => {
                  setShowPaymentDetailsModal(false)
                  handleEditPayment(selectedPayment)
                }}
                className="premium-button flex items-center space-x-2 space-x-reverse"
              >
                <Edit className="w-5 h-5" />
                <span>ویرایش</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
