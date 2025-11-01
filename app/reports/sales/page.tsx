'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import LineChart from '@/components/Charts/LineChart'
import PieChart from '@/components/Charts/PieChart'
import BarChart from '@/components/Charts/BarChart'
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Calendar,
  Download,
  Filter,
  RefreshCw,
  Eye,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  Activity,
  Printer,
  Plus,
  Edit,
  Trash2,
  CreditCard,
  Banknote,
  FileText,
  XCircle,
  CheckCircle,
  AlertTriangle,
  Search,
  X
} from 'lucide-react'

interface SalesData {
  date: string
  totalSales: number
  orderCount: number
  averageOrderValue: number
  customerCount: number
}

interface CategorySales {
  category: string
  sales: number
  percentage: number
  orderCount: number
}

interface PaymentMethodData {
  method: string
  amount: number
  percentage: number
  count: number
}

interface InvoiceData {
  id: string
  _id: string
  invoiceNumber: string
  date: string
  customerName: string
  customerId: string
  totalAmount: number
  paidAmount: number
  status: string
  paymentMethod: string
  items: any[]
}

interface ChequeData {
  id: string
  _id: string
  chequeNumber: string
  bankName: string
  amount: number
  dueDate: string
  status: 'in_hand' | 'deposited' | 'cleared' | 'returned' | 'endorsed'
  personName: string
  reference: string
}

export default function SalesReportPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'invoices' | 'cheques'>('overview')
  const [dateRange, setDateRange] = useState('week')
  const [selectedPeriod, setSelectedPeriod] = useState('daily')
  const [loading, setLoading] = useState(false)
  
  // Data states
  const [summaryData, setSummaryData] = useState<any>(null)
  const [dailyData, setDailyData] = useState<SalesData[]>([])
  const [categoryData, setCategoryData] = useState<CategorySales[]>([])
  const [paymentMethodData, setPaymentMethodData] = useState<PaymentMethodData[]>([])
  const [invoices, setInvoices] = useState<InvoiceData[]>([])
  const [cheques, setCheques] = useState<ChequeData[]>([])
  
  // Filters and search
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceData | null>(null)
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [showChequeModal, setShowChequeModal] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState<InvoiceData | null>(null)
  const [editingCheque, setEditingCheque] = useState<ChequeData | null>(null)
  const [showEditInvoiceModal, setShowEditInvoiceModal] = useState(false)
  const [showEditChequeModal, setShowEditChequeModal] = useState(false)
  const [showCreateInvoiceModal, setShowCreateInvoiceModal] = useState(false)
  const [showCreateChequeModal, setShowCreateChequeModal] = useState(false)
  
  // Form states
  const [invoiceForm, setInvoiceForm] = useState({
    customerId: '',
    customerName: '',
    items: [] as any[],
    paymentMethod: 'cash',
    notes: ''
  })
  
  const [chequeForm, setChequeForm] = useState<{
    chequeNumber: string
    bankName: string
    amount: string
    issueDate: string
    dueDate: string
    status: 'in_hand' | 'deposited' | 'cleared' | 'returned' | 'endorsed'
    personName: string
    purpose: string
    reference: string
    notes: string
  }>({
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

  // Fetch sales reports
  const fetchSalesReports = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.append('reportType', 'summary')
      params.append('dateRange', dateRange)
      params.append('period', selectedPeriod)

      const response = await fetch(`/api/sales-reports?${params.toString()}`)
      const result = await response.json()
      
      if (result.success) {
        setSummaryData(result.data)
      }
    } catch (error) {
      console.error('Error fetching sales summary:', error)
    } finally {
      setLoading(false)
    }
  }, [dateRange, selectedPeriod])

  const fetchDailyReport = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.append('reportType', 'daily')
      params.append('dateRange', dateRange)
      params.append('period', selectedPeriod)

      const response = await fetch(`/api/sales-reports?${params.toString()}`)
      const result = await response.json()
      
      if (result.success) {
        setDailyData(result.data || [])
      }
    } catch (error) {
      console.error('Error fetching daily report:', error)
    } finally {
      setLoading(false)
    }
  }, [dateRange, selectedPeriod])

  const fetchCategoryReport = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.append('reportType', 'category')
      params.append('dateRange', dateRange)

      const response = await fetch(`/api/sales-reports?${params.toString()}`)
      const result = await response.json()
      
      if (result.success) {
        setCategoryData(result.data || [])
      }
    } catch (error) {
      console.error('Error fetching category report:', error)
    } finally {
      setLoading(false)
    }
  }, [dateRange])

  const fetchPaymentMethodReport = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.append('reportType', 'payment')
      params.append('dateRange', dateRange)

      const response = await fetch(`/api/sales-reports?${params.toString()}`)
      const result = await response.json()
      
      if (result.success) {
        setPaymentMethodData(result.data || [])
      }
    } catch (error) {
      console.error('Error fetching payment method report:', error)
    } finally {
      setLoading(false)
    }
  }, [dateRange])

  // Fetch invoices
  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.append('type', 'sales')
      if (filterStatus !== 'all') params.append('status', filterStatus)
      if (dateRange) {
        // Add date filter based on dateRange
      }

      const response = await fetch(`/api/invoices?${params.toString()}`)
      const result = await response.json()
      
      if (result.success) {
        // تبدیل داده‌ها به فرمت مورد نیاز
        const formattedInvoices = (result.data || []).map((inv: any) => ({
          id: inv._id?.toString() || inv.id,
          _id: inv._id?.toString() || inv.id,
          invoiceNumber: inv.invoiceNumber || inv.invoice_id || inv.id,
          date: inv.date || inv.createdAt,
          customerId: inv.customerId || inv.customer_id,
          customerName: inv.customerName || inv.customer?.name || 'بدون نام',
          totalAmount: inv.totalAmount || inv.total || 0,
          paidAmount: inv.paidAmount || inv.paid || 0,
          status: inv.status || 'draft',
          paymentMethod: inv.paymentMethod || inv.payment_method || 'cash',
          items: inv.items || []
        }))
        setInvoices(formattedInvoices)
      } else {
        setInvoices([])
      }
    } catch (error) {
      console.error('Error fetching invoices:', error)
      setInvoices([])
    } finally {
      setLoading(false)
    }
  }, [filterStatus, dateRange])

  // Fetch cheques
  const fetchCheques = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.append('chequeType', 'received') // فقط چک‌های دریافتی
      if (filterStatus !== 'all') params.append('status', filterStatus)

      const response = await fetch(`/api/cheques?${params.toString()}`)
      const result = await response.json()
      
      if (result.success) {
        // تبدیل داده‌ها به فرمت مورد نیاز
        const formattedCheques = (result.data || []).map((ch: any) => ({
          id: ch._id?.toString() || ch.id,
          _id: ch._id?.toString() || ch.id,
          chequeNumber: ch.chequeNumber || '',
          bankName: ch.bankName || '',
          amount: ch.amount || 0,
          dueDate: ch.dueDate || '',
          status: ch.status || 'in_hand',
          personName: ch.personName || '',
          reference: ch.reference || ''
        }))
        setCheques(formattedCheques)
      } else {
        setCheques([])
      }
    } catch (error) {
      console.error('Error fetching cheques:', error)
      setCheques([])
    } finally {
      setLoading(false)
    }
  }, [filterStatus])

  useEffect(() => {
    if (activeTab === 'overview') {
      fetchSalesReports()
      fetchDailyReport()
      fetchCategoryReport()
      fetchPaymentMethodReport()
    } else if (activeTab === 'invoices') {
      fetchInvoices()
    } else if (activeTab === 'cheques') {
      fetchCheques()
    }
  }, [activeTab, fetchSalesReports, fetchDailyReport, fetchCategoryReport, fetchPaymentMethodReport, fetchInvoices, fetchCheques])

  // Memoized calculations
  const totalSales = useMemo(() => summaryData?.totalSales || 0, [summaryData])
  const totalOrders = useMemo(() => summaryData?.totalOrders || 0, [summaryData])
  const totalCustomers = useMemo(() => summaryData?.totalCustomers || 0, [summaryData])
  const averageOrderValue = useMemo(() => summaryData?.averageOrderValue || 0, [summaryData])
  const salesGrowth = useMemo(() => summaryData?.salesGrowth || 0, [summaryData])
  const orderGrowth = useMemo(() => summaryData?.orderGrowth || 0, [summaryData])

  const topSellingCategory = useMemo(() => {
    return categoryData.length > 0 ? categoryData[0] : { category: 'ندارد', percentage: 0 }
  }, [categoryData])

  // Chart data memoization
  const lineChartData = useMemo(() => {
    return dailyData.map(d => ({
      month: d.date,
      sales: d.totalSales,
      profit: d.averageOrderValue * d.orderCount
    }))
  }, [dailyData])

  const pieChartData = useMemo(() => {
    return categoryData.map(cat => ({
      name: cat.category,
      value: cat.percentage,
      color: `#${Math.floor(Math.random()*16777215).toString(16)}`
    }))
  }, [categoryData])

  // Handlers
  const handleRefresh = useCallback(() => {
    if (activeTab === 'overview') {
      fetchSalesReports()
      fetchDailyReport()
      fetchCategoryReport()
      fetchPaymentMethodReport()
    } else if (activeTab === 'invoices') {
      fetchInvoices()
    } else if (activeTab === 'cheques') {
      fetchCheques()
    }
  }, [activeTab, fetchSalesReports, fetchDailyReport, fetchCategoryReport, fetchPaymentMethodReport, fetchInvoices, fetchCheques])

  const handleExport = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      params.append('reportType', activeTab === 'overview' ? 'summary' : activeTab === 'invoices' ? 'daily' : 'payment')
      params.append('dateRange', dateRange)
      
      const response = await fetch(`/api/sales-reports?${params.toString()}`)
      const result = await response.json()
      
      if (result.success) {
        const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: 'application/json' })
        const downloadUrl = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = downloadUrl
        a.download = `sales-report-${Date.now()}.json`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(downloadUrl)
        document.body.removeChild(a)
        alert('گزارش با موفقیت دانلود شد')
      }
    } catch (error) {
      alert('خطا در دانلود گزارش')
    }
  }, [activeTab, dateRange])

  const handlePrint = useCallback(() => {
    window.print()
  }, [])

  const handleViewInvoice = useCallback((invoice: InvoiceData) => {
    setSelectedInvoice(invoice)
    setShowInvoiceModal(true)
  }, [])

  const handleEditInvoice = useCallback((invoice: InvoiceData) => {
    setEditingInvoice(invoice)
    setInvoiceForm({
      customerId: invoice.customerId,
      customerName: invoice.customerName,
      items: invoice.items || [],
      paymentMethod: invoice.paymentMethod || 'cash',
      notes: ''
    })
    setShowEditInvoiceModal(true)
  }, [])

  const handleDeleteInvoice = useCallback(async (invoice: InvoiceData) => {
    if (!confirm(`آیا مطمئن هستید که می‌خواهید فاکتور ${invoice.invoiceNumber || invoice.id} را حذف کنید؟`)) return
    
    try {
      setLoading(true)
      const invoiceId = invoice._id || invoice.id
      if (!invoiceId) {
        alert('شناسه فاکتور یافت نشد')
        return
      }
      
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'DELETE'
      })
      
      const result = await response.json()
      if (result.success) {
        alert('فاکتور با موفقیت حذف شد')
        fetchInvoices()
      } else {
        alert('خطا در حذف: ' + (result.message || 'خطای نامشخص'))
      }
    } catch (error) {
      console.error('Error deleting invoice:', error)
      alert('خطا در حذف فاکتور: ' + (error instanceof Error ? error.message : 'خطای نامشخص'))
    } finally {
      setLoading(false)
    }
  }, [fetchInvoices])

  const handleSaveInvoice = useCallback(async () => {
    try {
      setLoading(true)
      
      if (editingInvoice) {
        // Update
        const invoiceId = editingInvoice._id || editingInvoice.id
        if (!invoiceId) {
          alert('شناسه فاکتور یافت نشد')
          setLoading(false)
          return
        }

        const response = await fetch(`/api/invoices/${invoiceId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerId: invoiceForm.customerId,
            customerName: invoiceForm.customerName,
            items: invoiceForm.items,
            paymentMethod: invoiceForm.paymentMethod,
            notes: invoiceForm.notes
          })
        })

        const result = await response.json()
        if (result.success) {
          alert('فاکتور با موفقیت به‌روزرسانی شد')
          setShowEditInvoiceModal(false)
          setEditingInvoice(null)
          setInvoiceForm({
            customerId: '',
            customerName: '',
            items: [],
            paymentMethod: 'cash',
            notes: ''
          })
          fetchInvoices()
        } else {
          alert('خطا: ' + (result.message || 'خطای نامشخص'))
        }
      } else {
        // Create
        const response = await fetch('/api/invoices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'sales',
            customerId: invoiceForm.customerId,
            customerName: invoiceForm.customerName,
            items: invoiceForm.items,
            paymentMethod: invoiceForm.paymentMethod,
            notes: invoiceForm.notes,
            status: 'draft'
          })
        })

        const result = await response.json()
        if (result.success) {
          alert('فاکتور با موفقیت ایجاد شد')
          setShowCreateInvoiceModal(false)
          setInvoiceForm({
            customerId: '',
            customerName: '',
            items: [],
            paymentMethod: 'cash',
            notes: ''
          })
          fetchInvoices()
        } else {
          alert('خطا: ' + (result.message || 'خطای نامشخص'))
        }
      }
    } catch (error) {
      console.error('Error saving invoice:', error)
      alert('خطا در ذخیره فاکتور: ' + (error instanceof Error ? error.message : 'خطای نامشخص'))
    } finally {
      setLoading(false)
    }
  }, [editingInvoice, invoiceForm, fetchInvoices])

  const handleCreateInvoice = useCallback(() => {
    setInvoiceForm({
      customerId: '',
      customerName: '',
      items: [],
      paymentMethod: 'cash',
      notes: ''
    })
    setEditingInvoice(null)
    setShowCreateInvoiceModal(true)
  }, [])

  // Cheque handlers
  const handleViewCheque = useCallback((cheque: ChequeData) => {
    setSelectedInvoice(null)
    // For cheque details, we can reuse invoice modal or create separate
  }, [])

  const handleEditCheque = useCallback((cheque: ChequeData) => {
    setEditingCheque(cheque)
    // تبدیل تاریخ سررسید به فرمت input date
    const dueDateStr = cheque.dueDate 
      ? new Date(cheque.dueDate).toISOString().split('T')[0]
      : ''
    
    setChequeForm({
      chequeNumber: cheque.chequeNumber || '',
      bankName: cheque.bankName || '',
      amount: cheque.amount?.toString() || '0',
      issueDate: '',
      dueDate: dueDateStr,
      status: cheque.status || 'in_hand',
      personName: cheque.personName || '',
      purpose: '',
      reference: cheque.reference || '',
      notes: ''
    })
    setShowEditChequeModal(true)
  }, [])

  const handleDeleteCheque = useCallback(async (cheque: ChequeData) => {
    if (!confirm(`آیا مطمئن هستید که می‌خواهید چک ${cheque.chequeNumber} را حذف کنید؟`)) return
    
    try {
      setLoading(true)
      const chequeId = cheque._id || cheque.id
      if (!chequeId) {
        alert('شناسه چک یافت نشد')
        return
      }
      
      const response = await fetch(`/api/cheques/${chequeId}`, {
        method: 'DELETE'
      })
      
      const result = await response.json()
      if (result.success) {
        alert('چک با موفقیت حذف شد')
        fetchCheques()
      } else {
        alert('خطا در حذف: ' + (result.message || 'خطای نامشخص'))
      }
    } catch (error) {
      console.error('Error deleting cheque:', error)
      alert('خطا در حذف چک: ' + (error instanceof Error ? error.message : 'خطای نامشخص'))
    } finally {
      setLoading(false)
    }
  }, [fetchCheques])

  const handleSaveCheque = useCallback(async () => {
    try {
      // اعتبارسنجی فرم
      if (!chequeForm.chequeNumber || !chequeForm.bankName || !chequeForm.amount || !chequeForm.dueDate) {
        alert('لطفاً فیلدهای الزامی (شماره چک، بانک، مبلغ، تاریخ سررسید) را پر کنید')
        return
      }

      setLoading(true)
      
      if (editingCheque) {
        // Update
        const chequeId = editingCheque._id || editingCheque.id
        if (!chequeId) {
          alert('شناسه چک یافت نشد')
          setLoading(false)
          return
        }

        const response = await fetch(`/api/cheques/${chequeId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chequeNumber: chequeForm.chequeNumber,
            chequeType: 'received', // چک دریافتی
            bankName: chequeForm.bankName,
            amount: parseFloat(chequeForm.amount),
            issueDate: chequeForm.issueDate || new Date().toISOString().split('T')[0],
            dueDate: chequeForm.dueDate,
            status: chequeForm.status,
            personName: chequeForm.personName,
            purpose: chequeForm.purpose,
            reference: chequeForm.reference,
            notes: chequeForm.notes
          })
        })

        const result = await response.json()
        if (result.success) {
          alert('چک با موفقیت به‌روزرسانی شد')
          setShowEditChequeModal(false)
          setEditingCheque(null)
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
          fetchCheques()
        } else {
          alert('خطا: ' + (result.message || 'خطای نامشخص'))
        }
      } else {
        // Create
        const response = await fetch('/api/cheques', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chequeNumber: chequeForm.chequeNumber,
            chequeType: 'received', // چک دریافتی
            bankName: chequeForm.bankName,
            amount: parseFloat(chequeForm.amount),
            issueDate: chequeForm.issueDate || new Date().toISOString().split('T')[0],
            dueDate: chequeForm.dueDate,
            status: chequeForm.status,
            personName: chequeForm.personName,
            purpose: chequeForm.purpose,
            reference: chequeForm.reference,
            notes: chequeForm.notes
          })
        })

        const result = await response.json()
        if (result.success) {
          alert('چک با موفقیت ایجاد شد')
          setShowCreateChequeModal(false)
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
          fetchCheques()
        } else {
          alert('خطا: ' + (result.message || 'خطای نامشخص'))
        }
      }
    } catch (error) {
      console.error('Error saving cheque:', error)
      alert('خطا در ذخیره چک: ' + (error instanceof Error ? error.message : 'خطای نامشخص'))
    } finally {
      setLoading(false)
    }
  }, [editingCheque, chequeForm, fetchCheques])

  const handleCreateCheque = useCallback(() => {
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
    setShowCreateChequeModal(true)
  }, [])

  // Filtered data
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv =>
      (searchTerm === '' || 
        inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inv.customerName && inv.customerName.toLowerCase().includes(searchTerm.toLowerCase()))) &&
      (filterStatus === 'all' || inv.status === filterStatus)
    )
  }, [invoices, searchTerm, filterStatus])

  const filteredCheques = useMemo(() => {
    return cheques.filter(ch =>
      (searchTerm === '' || 
        ch.chequeNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ch.personName && ch.personName.toLowerCase().includes(searchTerm.toLowerCase()))) &&
      (filterStatus === 'all' || ch.status === filterStatus)
    )
  }, [cheques, searchTerm, filterStatus])

  return (
    <div className="fade-in-animation space-y-6">
        {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">گزارشات فروش</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            تحلیل و بررسی عملکرد فروش، فاکتورها و چک‌های دریافتی
          </p>
        </div>
        <div className="flex items-center space-x-3 space-x-reverse">
          {activeTab === 'invoices' && (
            <button
              onClick={handleCreateInvoice}
              className="premium-button flex items-center space-x-2 space-x-reverse"
              disabled={loading}
            >
              <Plus className="w-5 h-5" />
              <span>فاکتور جدید</span>
            </button>
          )}
          {activeTab === 'cheques' && (
            <button
              onClick={handleCreateCheque}
              className="premium-button flex items-center space-x-2 space-x-reverse"
              disabled={loading}
            >
              <Plus className="w-5 h-5" />
              <span>چک جدید</span>
            </button>
          )}
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
            onClick={handleExport}
            className="premium-button p-3"
          >
            <Download className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 space-x-reverse bg-white dark:bg-gray-800 rounded-xl p-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 flex items-center justify-center space-x-2 space-x-reverse px-4 py-2 rounded-md transition-all duration-200 ${
            activeTab === 'overview'
              ? 'bg-white dark:bg-gray-700 text-primary-600 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <BarChart3 className="w-5 h-5" />
          <span>خلاصه</span>
        </button>
        <button
          onClick={() => setActiveTab('invoices')}
          className={`flex-1 flex items-center justify-center space-x-2 space-x-reverse px-4 py-2 rounded-md transition-all duration-200 ${
            activeTab === 'invoices'
              ? 'bg-white dark:bg-gray-700 text-primary-600 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <FileText className="w-5 h-5" />
          <span>فاکتورها</span>
        </button>
        <button
          onClick={() => setActiveTab('cheques')}
          className={`flex-1 flex items-center justify-center space-x-2 space-x-reverse px-4 py-2 rounded-md transition-all duration-200 ${
            activeTab === 'cheques'
              ? 'bg-white dark:bg-gray-700 text-primary-600 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <CreditCard className="w-5 h-5" />
          <span>چک‌ها</span>
        </button>
        </div>

      {/* Filters */}
      <div className="premium-card p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 space-x-reverse">
            {activeTab === 'overview' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    بازه زمانی
                  </label>
                  <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    className="premium-input"
                  >
                    <option value="week">هفته جاری</option>
                    <option value="month">ماه جاری</option>
                    <option value="quarter">فصل جاری</option>
                    <option value="year">سال جاری</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    نوع گزارش
                  </label>
                  <select
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                    className="premium-input"
                  >
                    <option value="daily">روزانه</option>
                    <option value="weekly">هفتگی</option>
                    <option value="monthly">ماهانه</option>
                  </select>
                </div>
              </>
            )}
            {activeTab === 'invoices' && (
              <>
                <div className="relative flex-1">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="جستجو فاکتور..."
                    className="premium-input pr-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <select
                  className="premium-input"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">همه وضعیت‌ها</option>
                  <option value="draft">پیش‌نویس</option>
                  <option value="sent">ارسال شده</option>
                  <option value="paid">پرداخت شده</option>
                  <option value="overdue">معوق</option>
                </select>
              </>
            )}
            {activeTab === 'cheques' && (
              <>
                <div className="relative flex-1">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="جستجو چک..."
                    className="premium-input pr-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <select
                  className="premium-input"
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
              </>
            )}
          </div>
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="premium-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">کل فروش</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {totalSales.toLocaleString('fa-IR')} تومان
                  </p>
                  <div className="flex items-center space-x-1 space-x-reverse mt-1">
                    {salesGrowth >= 0 ? (
                      <TrendingUp className="w-4 h-4 text-green-500" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-500" />
                    )}
                    <span className={`text-sm font-medium ${
                      salesGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {Math.abs(salesGrowth).toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>
            <div className="premium-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">کل سفارشات</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalOrders}</p>
                  <div className="flex items-center space-x-1 space-x-reverse mt-1">
                    {orderGrowth >= 0 ? (
                      <TrendingUp className="w-4 h-4 text-green-500" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-500" />
                    )}
                    <span className={`text-sm font-medium ${
                      orderGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {Math.abs(orderGrowth).toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>
            <div className="premium-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">میانگین سفارش</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {averageOrderValue.toLocaleString('fa-IR')} تومان
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {totalCustomers} مشتری
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </div>
            <div className="premium-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">بهترین دسته</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {topSellingCategory.category}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {topSellingCategory.percentage}% از فروش
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          {dailyData.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Sales Trend Chart */}
              <div className="premium-card p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2 space-x-reverse">
                  <LineChartIcon className="w-6 h-6 text-primary-600" />
                  <span>روند فروش {selectedPeriod === 'daily' ? 'روزانه' : selectedPeriod === 'weekly' ? 'هفتگی' : 'ماهانه'}</span>
                </h3>
                <div className="h-64 w-full">
                  <LineChart data={lineChartData} />
                </div>
              </div>

              {/* Category Sales Pie Chart */}
              {categoryData.length > 0 && (
                <div className="premium-card p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2 space-x-reverse">
                    <PieChartIcon className="w-6 h-6 text-success-600" />
                    <span>فروش بر اساس دسته‌بندی</span>
                  </h3>
                  <div className="h-64 w-full">
                    <PieChart data={pieChartData} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Detailed Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Sales Table */}
            <div className="premium-card p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                فروش {selectedPeriod === 'daily' ? 'روزانه' : selectedPeriod === 'weekly' ? 'هفتگی' : 'ماهانه'}
              </h3>
              <div className="overflow-x-auto custom-scrollbar">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <RefreshCw className="w-8 h-8 animate-spin text-primary-600" />
                  </div>
                ) : dailyData.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    داده‌ای یافت نشد
                  </div>
                ) : (
                  <table className="w-full text-right whitespace-nowrap">
                    <thead>
                      <tr className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-800/50">
                        <th className="px-4 py-3 rounded-r-lg">تاریخ</th>
                        <th className="px-4 py-3">فروش</th>
                        <th className="px-4 py-3">سفارشات</th>
                        <th className="px-4 py-3 rounded-l-lg">میانگین</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {dailyData.slice(0, 30).map((day, index) => (
                        <tr key={index} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{day.date}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                            {day.totalSales.toLocaleString('fa-IR')} تومان
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{day.orderCount}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                            {day.averageOrderValue.toLocaleString('fa-IR')} تومان
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Category Sales Table */}
            {categoryData.length > 0 && (
              <div className="premium-card p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  فروش بر اساس دسته‌بندی
                </h3>
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-right whitespace-nowrap">
                    <thead>
                      <tr className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-800/50">
                        <th className="px-4 py-3 rounded-r-lg">دسته‌بندی</th>
                        <th className="px-4 py-3">فروش</th>
                        <th className="px-4 py-3">درصد</th>
                        <th className="px-4 py-3 rounded-l-lg">سفارشات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {categoryData.map((category, index) => (
                        <tr key={index} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{category.category}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                            {category.sales.toLocaleString('fa-IR')} تومان
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{category.percentage}%</td>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{category.orderCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Payment Methods Analysis */}
          {paymentMethodData.length > 0 && (
            <div className="premium-card p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                تحلیل روش‌های پرداخت
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {paymentMethodData.map((method, index) => (
                  <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900 dark:text-white">{method.method}</h4>
                      <span className="text-sm text-gray-500 dark:text-gray-400">{method.count} سفارش</span>
                    </div>
                    <div className="mb-2">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-600 dark:text-gray-300">مبلغ</span>
                        <span className="text-gray-900 dark:text-white">
                          {method.amount.toLocaleString('fa-IR')} تومان
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-primary-600 h-2 rounded-full"
                          style={{ width: `${method.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {method.percentage}% از کل فروش
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Invoices Tab */}
      {activeTab === 'invoices' && (
        <div className="space-y-6">
          <div className="premium-card p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">فاکتورهای فروش</h2>
            <div className="overflow-x-auto custom-scrollbar">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="w-8 h-8 animate-spin text-primary-600" />
                </div>
              ) : filteredInvoices.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-16">
                  <FileText className="w-16 h-16 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">هیچ فاکتوری یافت نشد</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">فاکتور جدید ایجاد کنید</p>
                </div>
              ) : (
                <table className="w-full text-right whitespace-nowrap">
                  <thead>
                    <tr className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-800/50">
                      <th className="px-4 py-3 rounded-r-lg">شماره فاکتور</th>
                      <th className="px-4 py-3">تاریخ</th>
                      <th className="px-4 py-3">مشتری</th>
                      <th className="px-4 py-3">مبلغ کل</th>
                      <th className="px-4 py-3">پرداخت شده</th>
                      <th className="px-4 py-3">روش پرداخت</th>
                      <th className="px-4 py-3">وضعیت</th>
                      <th className="px-4 py-3 rounded-l-lg">عملیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredInvoices.map((invoice) => (
                      <tr key={invoice.id || invoice._id} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{invoice.invoiceNumber || invoice.id}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          {invoice.date ? new Date(invoice.date).toLocaleDateString('fa-IR') : ''}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{invoice.customerName || 'بدون نام'}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                          {invoice.totalAmount?.toLocaleString('fa-IR') || 0} تومان
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          {invoice.paidAmount?.toLocaleString('fa-IR') || 0} تومان
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{invoice.paymentMethod || 'نقدی'}</td>
                        <td className="px-4 py-3">
                          <span className={`status-badge ${
                            invoice.status === 'paid' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                            invoice.status === 'sent' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                            invoice.status === 'overdue' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                          }`}>
                            {invoice.status === 'paid' ? 'پرداخت شده' :
                             invoice.status === 'sent' ? 'ارسال شده' :
                             invoice.status === 'overdue' ? 'معوق' :
                             invoice.status === 'draft' ? 'پیش‌نویس' : invoice.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <button
                              onClick={() => handleViewInvoice(invoice)}
                              className="p-1 rounded-full text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                              title="مشاهده"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEditInvoice(invoice)}
                              className="p-1 rounded-full text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                              title="ویرایش"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteInvoice(invoice)}
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
        </div>
      )}

      {/* Cheques Tab */}
      {activeTab === 'cheques' && (
        <div className="space-y-6">
          <div className="premium-card p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">چک‌های دریافتی</h2>
            <div className="overflow-x-auto custom-scrollbar">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="w-8 h-8 animate-spin text-primary-600" />
                </div>
              ) : filteredCheques.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-16">
                  <CreditCard className="w-16 h-16 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">هیچ چکی یافت نشد</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">چک جدید ثبت کنید</p>
                </div>
              ) : (
                <table className="w-full text-right whitespace-nowrap">
                  <thead>
                    <tr className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-800/50">
                      <th className="px-4 py-3 rounded-r-lg">شماره چک</th>
                      <th className="px-4 py-3">بانک</th>
                      <th className="px-4 py-3">مبلغ</th>
                      <th className="px-4 py-3">تاریخ سررسید</th>
                      <th className="px-4 py-3">صادرکننده</th>
                      <th className="px-4 py-3">وضعیت</th>
                      <th className="px-4 py-3">مرجع</th>
                      <th className="px-4 py-3 rounded-l-lg">عملیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredCheques.map((cheque) => (
                      <tr key={cheque.id || cheque._id} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{cheque.chequeNumber}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{cheque.bankName}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                          {cheque.amount.toLocaleString('fa-IR')} تومان
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          {cheque.dueDate ? new Date(cheque.dueDate).toLocaleDateString('fa-IR') : ''}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{cheque.personName || 'نامشخص'}</td>
                        <td className="px-4 py-3">
                          <span className={`status-badge ${
                            cheque.status === 'cleared' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                            cheque.status === 'deposited' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                            cheque.status === 'returned' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                            cheque.status === 'endorsed' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' :
                            'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                          }`}>
                            {cheque.status === 'in_hand' ? 'در دست' :
                             cheque.status === 'deposited' ? 'واریز شده' :
                             cheque.status === 'cleared' ? 'پاس شده' :
                             cheque.status === 'returned' ? 'برگشت خورده' :
                             cheque.status === 'endorsed' ? 'پشت‌نویسی شده' : cheque.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{cheque.reference || '-'}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <button
                              onClick={() => handleViewCheque(cheque)}
                              className="p-1 rounded-full text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                              title="مشاهده"
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
                              onClick={() => handleDeleteCheque(cheque)}
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
        </div>
      )}

      {/* Invoice Details Modal */}
      {showInvoiceModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                جزئیات فاکتور {selectedInvoice.invoiceNumber}
              </h2>
              <button
                onClick={() => setShowInvoiceModal(false)}
                className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">مشتری:</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{selectedInvoice.customerName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">تاریخ:</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {selectedInvoice.date ? new Date(selectedInvoice.date).toLocaleDateString('fa-IR') : ''}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">مبلغ کل:</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {selectedInvoice.totalAmount?.toLocaleString('fa-IR') || 0} تومان
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">پرداخت شده:</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {selectedInvoice.paidAmount?.toLocaleString('fa-IR') || 0} تومان
                  </p>
                </div>
              </div>
              {selectedInvoice.items && selectedInvoice.items.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">آیتم‌ها</h3>
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-600">
                        <th className="text-right py-2 px-4">نام</th>
                        <th className="text-right py-2 px-4">تعداد</th>
                        <th className="text-right py-2 px-4">قیمت</th>
                        <th className="text-right py-2 px-4">جمع</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedInvoice.items.map((item: any, idx: number) => (
                        <tr key={idx} className="border-b border-gray-100 dark:border-gray-700">
                          <td className="py-2 px-4">{item.name || item.itemName || '-'}</td>
                          <td className="py-2 px-4">{item.quantity || 0}</td>
                          <td className="py-2 px-4">{item.price?.toLocaleString('fa-IR') || 0} تومان</td>
                          <td className="py-2 px-4">{((item.quantity || 0) * (item.price || 0)).toLocaleString('fa-IR')} تومان</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Invoice Modal */}
      {showEditInvoiceModal && editingInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">ویرایش فاکتور</h2>
              <button
                onClick={() => {
                  setShowEditInvoiceModal(false)
                  setEditingInvoice(null)
                }}
                className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">مشتری</label>
                <input
                  type="text"
                  className="premium-input"
                  value={invoiceForm.customerName}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, customerName: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">روش پرداخت</label>
                <select
                  className="premium-input"
                  value={invoiceForm.paymentMethod}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, paymentMethod: e.target.value })}
                >
                  <option value="cash">نقدی</option>
                  <option value="card">کارتی</option>
                  <option value="cheque">چک</option>
                  <option value="bank_transfer">حواله</option>
                  <option value="credit">اعتباری</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">یادداشت</label>
                <textarea
                  className="premium-input"
                  rows={3}
                  value={invoiceForm.notes}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, notes: e.target.value })}
                />
              </div>
            </div>
            <div className="flex items-center justify-end space-x-3 space-x-reverse mt-6">
              <button
                onClick={() => {
                  setShowEditInvoiceModal(false)
                  setEditingInvoice(null)
                }}
                className="premium-button bg-gray-500 hover:bg-gray-600"
              >
                انصراف
              </button>
              <button
                onClick={handleSaveInvoice}
                className="premium-button"
                disabled={loading}
              >
                {loading ? 'در حال ذخیره...' : 'ذخیره'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Invoice Modal */}
      {showCreateInvoiceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">فاکتور جدید</h2>
              <button
                onClick={() => setShowCreateInvoiceModal(false)}
                className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">مشتری</label>
                <input
                  type="text"
                  className="premium-input"
                  value={invoiceForm.customerName}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, customerName: e.target.value })}
                  placeholder="نام مشتری"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">روش پرداخت</label>
                <select
                  className="premium-input"
                  value={invoiceForm.paymentMethod}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, paymentMethod: e.target.value })}
                >
                  <option value="cash">نقدی</option>
                  <option value="card">کارتی</option>
                  <option value="cheque">چک</option>
                  <option value="bank_transfer">حواله</option>
                  <option value="credit">اعتباری</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">یادداشت</label>
                <textarea
                  className="premium-input"
                  rows={3}
                  value={invoiceForm.notes}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, notes: e.target.value })}
                />
              </div>
            </div>
            <div className="flex items-center justify-end space-x-3 space-x-reverse mt-6">
              <button
                onClick={() => setShowCreateInvoiceModal(false)}
                className="premium-button bg-gray-500 hover:bg-gray-600"
              >
                انصراف
              </button>
              <button
                onClick={handleSaveInvoice}
                className="premium-button"
                disabled={loading}
              >
                {loading ? 'در حال ایجاد...' : 'ایجاد'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Cheque Modal */}
      {showEditChequeModal && editingCheque && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">ویرایش چک</h2>
              <button
                onClick={() => {
                  setShowEditChequeModal(false)
                  setEditingCheque(null)
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
                    className="premium-input"
                    value={chequeForm.chequeNumber}
                    onChange={(e) => setChequeForm({ ...chequeForm, chequeNumber: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">نام بانک</label>
                  <input
                    type="text"
                    className="premium-input"
                    value={chequeForm.bankName}
                    onChange={(e) => setChequeForm({ ...chequeForm, bankName: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">مبلغ</label>
                  <input
                    type="number"
                    className="premium-input"
                    value={chequeForm.amount}
                    onChange={(e) => setChequeForm({ ...chequeForm, amount: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">وضعیت</label>
                  <select
                    className="premium-input"
                    value={chequeForm.status}
                    onChange={(e) => setChequeForm({ ...chequeForm, status: e.target.value as any })}
                  >
                    <option value="in_hand">در دست</option>
                    <option value="deposited">واریز شده</option>
                    <option value="cleared">پاس شده</option>
                    <option value="returned">برگشت خورده</option>
                    <option value="endorsed">پشت‌نویسی شده</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">تاریخ سررسید</label>
                <input
                  type="date"
                  className="premium-input"
                  value={chequeForm.dueDate}
                  onChange={(e) => setChequeForm({ ...chequeForm, dueDate: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">صادرکننده</label>
                <input
                  type="text"
                  className="premium-input"
                  value={chequeForm.personName}
                  onChange={(e) => setChequeForm({ ...chequeForm, personName: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">مرجع</label>
                <input
                  type="text"
                  className="premium-input"
                  value={chequeForm.reference}
                  onChange={(e) => setChequeForm({ ...chequeForm, reference: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">یادداشت</label>
                <textarea
                  className="premium-input"
                  rows={3}
                  value={chequeForm.notes}
                  onChange={(e) => setChequeForm({ ...chequeForm, notes: e.target.value })}
                />
              </div>
            </div>
            <div className="flex items-center justify-end space-x-3 space-x-reverse mt-6">
              <button
                onClick={() => {
                  setShowEditChequeModal(false)
                  setEditingCheque(null)
                }}
                className="premium-button bg-gray-500 hover:bg-gray-600"
              >
                انصراف
              </button>
              <button
                onClick={handleSaveCheque}
                className="premium-button"
                disabled={loading}
              >
                {loading ? 'در حال ذخیره...' : 'ذخیره'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Cheque Modal */}
      {showCreateChequeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">چک جدید</h2>
              <button
                onClick={() => setShowCreateChequeModal(false)}
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
                    className="premium-input"
                    value={chequeForm.chequeNumber}
                    onChange={(e) => setChequeForm({ ...chequeForm, chequeNumber: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">نام بانک</label>
                  <input
                    type="text"
                    className="premium-input"
                    value={chequeForm.bankName}
                    onChange={(e) => setChequeForm({ ...chequeForm, bankName: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">مبلغ</label>
                  <input
                    type="number"
                    className="premium-input"
                    value={chequeForm.amount}
                    onChange={(e) => setChequeForm({ ...chequeForm, amount: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">وضعیت</label>
                  <select
                    className="premium-input"
                    value={chequeForm.status}
                    onChange={(e) => setChequeForm({ ...chequeForm, status: e.target.value as any })}
                  >
                    <option value="in_hand">در دست</option>
                    <option value="deposited">واریز شده</option>
                    <option value="cleared">پاس شده</option>
                    <option value="returned">برگشت خورده</option>
                    <option value="endorsed">پشت‌نویسی شده</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">تاریخ سررسید</label>
                <input
                  type="date"
                  className="premium-input"
                  value={chequeForm.dueDate}
                  onChange={(e) => setChequeForm({ ...chequeForm, dueDate: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">صادرکننده</label>
                <input
                  type="text"
                  className="premium-input"
                  value={chequeForm.personName}
                  onChange={(e) => setChequeForm({ ...chequeForm, personName: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">مرجع</label>
                <input
                  type="text"
                  className="premium-input"
                  value={chequeForm.reference}
                  onChange={(e) => setChequeForm({ ...chequeForm, reference: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">یادداشت</label>
                <textarea
                  className="premium-input"
                  rows={3}
                  value={chequeForm.notes}
                  onChange={(e) => setChequeForm({ ...chequeForm, notes: e.target.value })}
                />
              </div>
            </div>
            <div className="flex items-center justify-end space-x-3 space-x-reverse mt-6">
              <button
                onClick={() => setShowCreateChequeModal(false)}
                className="premium-button bg-gray-500 hover:bg-gray-600"
              >
                انصراف
              </button>
              <button
                onClick={handleSaveCheque}
                className="premium-button"
                disabled={loading}
              >
                {loading ? 'در حال ایجاد...' : 'ایجاد'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
