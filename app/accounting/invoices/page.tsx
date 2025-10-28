'use client'

import { useState, useEffect } from 'react'
import { 
  FileText, 
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
  Download,
  Printer,
  Clock,
  Package,
  DollarSign,
  Truck,
  Store,
  Send,
  Copy,
  Archive,
  Loader2
} from 'lucide-react'

interface Invoice {
  _id?: string
  invoiceNumber: string
  type: 'sales' | 'purchase'
  customerId?: string
  customerName: string
  customerPhone: string
  customerAddress: string
  supplierId?: string
  supplierName: string
  supplierPhone: string
  supplierAddress: string
  items: Array<{
    name: string
    quantity: number
    unit: string
    unitPrice: number
    totalPrice: number
  }>
  subtotal: number
  taxAmount: number
  discountAmount: number
  totalAmount: number
  paidAmount: number
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  paymentMethod: 'cash' | 'card' | 'bank_transfer' | 'credit' | 'check'
  date: string
  dueDate?: string
  notes: string
  terms: string
  sentDate?: string
  paidDate?: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    type: 'sales' as 'sales' | 'purchase',
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    supplierName: '',
    supplierPhone: '',
    supplierAddress: '',
    items: [] as Array<{name: string, quantity: number, unitPrice: number, unit: string}>,
    paymentMethod: 'cash' as 'cash' | 'card' | 'bank_transfer' | 'credit' | 'check',
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: '',
    terms: ''
  })

  // Load invoices from API
  const loadInvoices = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/invoices')
      const result = await response.json()
      if (result.success) {
        setInvoices(result.data)
      }
    } catch (error) {
      console.error('Error loading invoices:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInvoices()
  }, [])

  const filteredInvoices = invoices.filter(invoice =>
    (filterType === 'all' || invoice.type === filterType) &&
    (filterStatus === 'all' || invoice.status === filterStatus) &&
    (invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const handleSave = async () => {
    try {
      setLoading(true)
      
      const invoiceData = {
        type: formData.type,
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        customerAddress: formData.customerAddress,
        supplierName: formData.supplierName,
        supplierPhone: formData.supplierPhone,
        supplierAddress: formData.supplierAddress,
        items: formData.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: item.unitPrice,
          totalPrice: item.quantity * item.unitPrice
        })),
        subtotal: formData.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0),
        taxAmount: 0,
        discountAmount: 0,
        totalAmount: formData.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0),
        paidAmount: 0,
        paymentMethod: formData.paymentMethod,
        status: 'draft',
        date: formData.date,
        dueDate: formData.dueDate,
        notes: formData.notes,
        terms: formData.terms,
        createdBy: 'system'
      }

      if (editingInvoice) {
        // Update existing invoice
        const response = await fetch(`/api/invoices/${editingInvoice._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
          },
          body: JSON.stringify(invoiceData)
        })
        
        const result = await response.json()
        if (result.success) {
          await loadInvoices()
          alert('فاکتور با موفقیت به‌روزرسانی شد')
        } else {
          alert('خطا در به‌روزرسانی فاکتور: ' + result.message)
        }
      } else {
        // Create new invoice
        const response = await fetch('/api/invoices', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
          },
          body: JSON.stringify(invoiceData)
        })
        
        const result = await response.json()
        if (result.success) {
          await loadInvoices()
          alert('فاکتور با موفقیت ایجاد شد')
        } else {
          alert('خطا در ایجاد فاکتور: ' + result.message)
        }
      }
      
      setShowForm(false)
      setEditingInvoice(null)
      resetForm()
    } catch (error) {
      console.error('Error saving invoice:', error)
      alert('خطا در ذخیره فاکتور')
    } finally {
      setLoading(false)
    }
  }

  const openAddForm = () => {
    setEditingInvoice(null)
    resetForm()
    setShowForm(true)
  }

  const openEditForm = (invoice: Invoice) => {
    setEditingInvoice(invoice)
    setFormData({
      type: invoice.type,
      customerName: invoice.customerName,
      customerPhone: invoice.customerPhone,
      customerAddress: invoice.customerAddress,
      supplierName: invoice.supplierName,
      supplierPhone: invoice.supplierPhone,
      supplierAddress: invoice.supplierAddress,
      items: invoice.items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        unit: item.unit
      })),
      paymentMethod: invoice.paymentMethod,
      date: invoice.date.split('T')[0],
      dueDate: invoice.dueDate ? invoice.dueDate.split('T')[0] : '',
      notes: invoice.notes,
      terms: invoice.terms
    })
    setShowForm(true)
  }

  const deleteInvoice = async (id: string) => {
    if (confirm('آیا از حذف این فاکتور مطمئن هستید؟')) {
      try {
        setLoading(true)
        const response = await fetch(`/api/invoices?id=${id}`, {
          method: 'DELETE'
        })
        
        const result = await response.json()
        if (result.success) {
          await loadInvoices()
          alert('فاکتور با موفقیت حذف شد')
        } else {
          alert('خطا در حذف فاکتور: ' + result.message)
        }
      } catch (error) {
        console.error('Error deleting invoice:', error)
        alert('خطا در حذف فاکتور')
      } finally {
        setLoading(false)
      }
    }
  }

  const resetForm = () => {
    setFormData({
      type: 'sales',
      customerName: '',
      customerPhone: '',
      customerAddress: '',
      supplierName: '',
      supplierPhone: '',
      supplierAddress: '',
      items: [],
      paymentMethod: 'cash',
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: '',
      terms: ''
    })
  }

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'cash': return <Banknote className="w-4 h-4 text-green-600" />
      case 'card': return <CreditCard className="w-4 h-4 text-blue-600" />
      case 'bank_transfer': return <Building className="w-4 h-4 text-purple-600" />
      case 'credit': return <DollarSign className="w-4 h-4 text-orange-600" />
      case 'check': return <FileText className="w-4 h-4 text-yellow-600" />
      default: return null
    }
  }

  const getPaymentMethodText = (method: string) => {
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
      case 'paid': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
      case 'sent': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
      case 'draft': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
      case 'overdue': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
      case 'cancelled': return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid': return 'پرداخت شده'
      case 'sent': return 'ارسال شده'
      case 'draft': return 'پیش‌نویس'
      case 'overdue': return 'سررسید گذشته'
      case 'cancelled': return 'لغو شده'
      default: return 'نامشخص'
    }
  }

  const getTotalInvoices = () => invoices.length
  const getTotalValue = () => invoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0)
  const getPaidValue = () => invoices.reduce((sum, invoice) => sum + invoice.paidAmount, 0)
  const getPendingValue = () => invoices.reduce((sum, invoice) => sum + (invoice.totalAmount - invoice.paidAmount), 0)

  // Generate CSV content for export
  const generateCSV = (invoices: Invoice[]) => {
    const headers = [
      'شماره فاکتور',
      'نوع',
      'نام مشتری/تأمین‌کننده',
      'تلفن',
      'تاریخ فاکتور',
      'تاریخ سررسید',
      'مبلغ کل',
      'مبلغ پرداخت شده',
      'مانده',
      'وضعیت',
      'روش پرداخت',
      'یادداشت'
    ].join(',')

    const rows = invoices.map(invoice => [
      invoice.invoiceNumber,
      invoice.type === 'sales' ? 'فروش' : 'خرید',
      invoice.type === 'sales' ? invoice.customerName : invoice.supplierName,
      invoice.type === 'sales' ? invoice.customerPhone : invoice.supplierPhone,
      new Date(invoice.date).toLocaleDateString('fa-IR'),
      invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('fa-IR') : '',
      invoice.totalAmount,
      invoice.paidAmount,
      invoice.totalAmount - invoice.paidAmount,
      getStatusText(invoice.status),
      getPaymentMethodText(invoice.paymentMethod),
      invoice.notes
    ].join(','))

    return [headers, ...rows].join('\n')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/80 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold gradient-text mb-2">فاکتورها</h1>
          <p className="text-gray-600 dark:text-gray-300">مدیریت فاکتورهای فروش و خرید</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="premium-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">کل فاکتورها</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{getTotalInvoices()}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
          <div className="premium-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">کل مبلغ</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{getTotalValue().toLocaleString('fa-IR')}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
          <div className="premium-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">پرداخت شده</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{getPaidValue().toLocaleString('fa-IR')}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
          <div className="premium-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">در انتظار پرداخت</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{getPendingValue().toLocaleString('fa-IR')}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
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
                  placeholder="جستجو در فاکتورها..."
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
                <option value="sales">فروش</option>
                <option value="purchase">خرید</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">همه وضعیت‌ها</option>
                <option value="draft">پیش‌نویس</option>
                <option value="sent">ارسال شده</option>
                <option value="paid">پرداخت شده</option>
                <option value="overdue">سررسید گذشته</option>
                <option value="cancelled">لغو شده</option>
              </select>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <button
                onClick={openAddForm}
                className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>فاکتور جدید</span>
              </button>
              <button 
                onClick={() => {
                  // Export functionality
                  const csvContent = generateCSV(invoices)
                  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
                  const link = document.createElement('a')
                  link.href = URL.createObjectURL(blob)
                  link.download = `invoices-${new Date().toISOString().split('T')[0]}.csv`
                  link.click()
                }}
                className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>صادر کردن</span>
              </button>
            </div>
          </div>
        </div>

        {/* Invoices List */}
        <div className="premium-card p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">لیست فاکتورها</h2>
          
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">در حال بارگذاری فاکتورها...</p>
              </div>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">هیچ فاکتوری یافت نشد</h3>
              <p className="text-gray-600 dark:text-gray-400">فاکتورهای رستوران در اینجا نمایش داده می‌شوند</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead>
                  <tr className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-800/50">
                    <th className="px-4 py-3 rounded-r-lg">شماره فاکتور</th>
                    <th className="px-4 py-3">نوع</th>
                    <th className="px-4 py-3">مشتری/تأمین‌کننده</th>
                    <th className="px-4 py-3">مبلغ کل</th>
                    <th className="px-4 py-3">روش پرداخت</th>
                    <th className="px-4 py-3">وضعیت</th>
                    <th className="px-4 py-3">تاریخ</th>
                    <th className="px-4 py-3 rounded-l-lg">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredInvoices.map(invoice => (
                    <tr key={invoice._id} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">{invoice.invoiceNumber}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          invoice.type === 'sales' 
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                            : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        }`}>
                          {invoice.type === 'sales' ? 'فروش' : 'خرید'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-gray-900 dark:text-white font-medium">
                            {invoice.type === 'sales' ? invoice.customerName : invoice.supplierName}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {invoice.type === 'sales' ? invoice.customerPhone : invoice.supplierPhone}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">
                        {invoice.totalAmount.toLocaleString('fa-IR')} تومان
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          {getPaymentMethodIcon(invoice.paymentMethod)}
                          <span className="text-gray-700 dark:text-gray-200">
                            {getPaymentMethodText(invoice.paymentMethod)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                          {getStatusText(invoice.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200">
                        {new Date(invoice.date).toLocaleDateString('fa-IR')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex space-x-2 space-x-reverse">
                          <button
                            onClick={() => setSelectedInvoice(invoice)}
                            className="p-2 rounded-full text-primary-600 hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditForm(invoice)}
                            className="p-2 rounded-full text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteInvoice(invoice._id!)}
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

        {/* Add/Edit Invoice Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {editingInvoice ? 'ویرایش فاکتور' : 'فاکتور جدید'}
                </h3>
                <button
                  onClick={() => {
                    setShowForm(false)
                    setEditingInvoice(null)
                    resetForm()
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-6">
                {/* Invoice Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    نوع فاکتور *
                  </label>
                  <select
                    required
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value as 'sales' | 'purchase'})}
                  >
                    <option value="sales">فاکتور فروش</option>
                    <option value="purchase">فاکتور خرید</option>
                  </select>
                </div>

                {/* Customer/Supplier Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {formData.type === 'sales' ? 'نام مشتری' : 'نام تأمین‌کننده'} *
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      value={formData.type === 'sales' ? formData.customerName : formData.supplierName}
                      onChange={(e) => setFormData({
                        ...formData, 
                        [formData.type === 'sales' ? 'customerName' : 'supplierName']: e.target.value
                      })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {formData.type === 'sales' ? 'تلفن مشتری' : 'تلفن تأمین‌کننده'} *
                    </label>
                    <input
                      type="tel"
                      required
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      value={formData.type === 'sales' ? formData.customerPhone : formData.supplierPhone}
                      onChange={(e) => setFormData({
                        ...formData, 
                        [formData.type === 'sales' ? 'customerPhone' : 'supplierPhone']: e.target.value
                      })}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {formData.type === 'sales' ? 'آدرس مشتری' : 'آدرس تأمین‌کننده'}
                    </label>
                    <textarea
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      value={formData.type === 'sales' ? formData.customerAddress : formData.supplierAddress}
                      onChange={(e) => setFormData({
                        ...formData, 
                        [formData.type === 'sales' ? 'customerAddress' : 'supplierAddress']: e.target.value
                      })}
                    />
                  </div>
                </div>

                {/* Items */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      آیتم‌های فاکتور
                    </label>
                    <button
                      type="button"
                      onClick={() => setFormData({
                        ...formData,
                        items: [...formData.items, { name: '', quantity: 1, unitPrice: 0, unit: 'عدد' }]
                      })}
                      className="flex items-center space-x-2 space-x-reverse px-3 py-1 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      <span>اضافه کردن آیتم</span>
                    </button>
                  </div>
                  
                  {formData.items.map((item, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4 p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          نام آیتم
                        </label>
                        <input
                          type="text"
                          required
                          className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          value={item.name}
                          onChange={(e) => {
                            const newItems = [...formData.items]
                            newItems[index].name = e.target.value
                            setFormData({...formData, items: newItems})
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          واحد
                        </label>
                        <select
                          className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          value={item.unit}
                          onChange={(e) => {
                            const newItems = [...formData.items]
                            newItems[index].unit = e.target.value
                            setFormData({...formData, items: newItems})
                          }}
                        >
                          <option value="عدد">عدد</option>
                          <option value="کیلوگرم">کیلوگرم</option>
                          <option value="گرم">گرم</option>
                          <option value="لیتر">لیتر</option>
                          <option value="بسته">بسته</option>
                          <option value="کارتن">کارتن</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          تعداد
                        </label>
                        <input
                          type="number"
                          min="1"
                          required
                          className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          value={item.quantity}
                          onChange={(e) => {
                            const newItems = [...formData.items]
                            newItems[index].quantity = parseInt(e.target.value) || 1
                            setFormData({...formData, items: newItems})
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          قیمت واحد (تومان)
                        </label>
                        <input
                          type="number"
                          min="0"
                          required
                          className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          value={item.unitPrice}
                          onChange={(e) => {
                            const newItems = [...formData.items]
                            newItems[index].unitPrice = parseInt(e.target.value) || 0
                            setFormData({...formData, items: newItems})
                          }}
                        />
                      </div>
                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={() => {
                            const newItems = formData.items.filter((_, i) => i !== index)
                            setFormData({...formData, items: newItems})
                          }}
                          className="w-full px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                          <Trash2 className="w-4 h-4 mx-auto" />
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {formData.items.length > 0 && (
                    <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          مجموع: {formData.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0).toLocaleString('fa-IR')} تومان
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Payment and Dates */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      روش پرداخت
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      value={formData.paymentMethod}
                      onChange={(e) => setFormData({...formData, paymentMethod: e.target.value as any})}
                    >
                      <option value="cash">نقدی</option>
                      <option value="card">کارت</option>
                      <option value="bank_transfer">حواله بانکی</option>
                      <option value="credit">نسیه</option>
                      <option value="check">چک</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      تاریخ فاکتور
                    </label>
                    <input
                      type="date"
                      required
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      تاریخ سررسید
                    </label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                    />
                  </div>
                </div>

                {/* Notes and Terms */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      یادداشت
                    </label>
                    <textarea
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      placeholder="یادداشت‌های اضافی..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      شرایط پرداخت
                    </label>
                    <textarea
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      value={formData.terms}
                      onChange={(e) => setFormData({...formData, terms: e.target.value})}
                      placeholder="شرایط پرداخت..."
                    />
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex items-center justify-end space-x-3 space-x-reverse pt-6 border-t border-gray-200 dark:border-gray-600">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false)
                      setEditingInvoice(null)
                      resetForm()
                    }}
                    className="px-4 py-2 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    disabled={loading || formData.items.length === 0}
                    className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    <Save className="w-4 h-4" />
                    <span>{editingInvoice ? 'به‌روزرسانی' : 'ایجاد'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Invoice Details Modal */}
        {selectedInvoice && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  جزئیات فاکتور {selectedInvoice.invoiceNumber}
                </h3>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Customer/Supplier Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {selectedInvoice.type === 'sales' ? 'مشتری' : 'تأمین‌کننده'}
                    </label>
                    <p className="text-gray-900 dark:text-white">
                      {selectedInvoice.type === 'sales' ? selectedInvoice.customerName : selectedInvoice.supplierName}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">تلفن</label>
                    <p className="text-gray-900 dark:text-white">
                      {selectedInvoice.type === 'sales' ? selectedInvoice.customerPhone : selectedInvoice.supplierPhone}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">آدرس</label>
                    <p className="text-gray-900 dark:text-white">
                      {selectedInvoice.type === 'sales' ? selectedInvoice.customerAddress : selectedInvoice.supplierAddress}
                    </p>
                  </div>
                </div>

                {/* Items */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">آیتم‌های فاکتور</label>
                  <div className="overflow-x-auto">
                    <table className="w-full text-right">
                      <thead>
                        <tr className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-800/50">
                          <th className="px-3 py-2 rounded-r-lg">نام آیتم</th>
                          <th className="px-3 py-2">واحد</th>
                          <th className="px-3 py-2">تعداد</th>
                          <th className="px-3 py-2">قیمت واحد</th>
                          <th className="px-3 py-2 rounded-l-lg">قیمت کل</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {selectedInvoice.items.map((item, index) => (
                          <tr key={index} className="bg-white dark:bg-gray-800">
                            <td className="px-3 py-2 text-gray-900 dark:text-white">{item.name}</td>
                            <td className="px-3 py-2 text-gray-700 dark:text-gray-200">{item.unit}</td>
                            <td className="px-3 py-2 text-gray-700 dark:text-gray-200">{item.quantity}</td>
                            <td className="px-3 py-2 text-gray-700 dark:text-gray-200">{item.unitPrice.toLocaleString('fa-IR')} تومان</td>
                            <td className="px-3 py-2 text-gray-900 dark:text-white font-medium">{item.totalPrice.toLocaleString('fa-IR')} تومان</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-gray-700 dark:text-gray-300">
                      <span>جمع کل:</span>
                      <span>{selectedInvoice.subtotal.toLocaleString('fa-IR')} تومان</span>
                    </div>
                    <div className="flex justify-between text-gray-700 dark:text-gray-300">
                      <span>مالیات:</span>
                      <span>{selectedInvoice.taxAmount.toLocaleString('fa-IR')} تومان</span>
                    </div>
                    {selectedInvoice.discountAmount > 0 && (
                      <div className="flex justify-between text-gray-700 dark:text-gray-300">
                        <span>تخفیف:</span>
                        <span>-{selectedInvoice.discountAmount.toLocaleString('fa-IR')} تومان</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-white border-t border-gray-200 dark:border-gray-600 pt-2">
                      <span>مبلغ نهایی:</span>
                      <span>{selectedInvoice.totalAmount.toLocaleString('fa-IR')} تومان</span>
                    </div>
                    <div className="flex justify-between text-gray-700 dark:text-gray-300">
                      <span>مبلغ پرداخت شده:</span>
                      <span>{selectedInvoice.paidAmount.toLocaleString('fa-IR')} تومان</span>
                    </div>
                    <div className="flex justify-between text-gray-700 dark:text-gray-300">
                      <span>مانده:</span>
                      <span>{(selectedInvoice.totalAmount - selectedInvoice.paidAmount).toLocaleString('fa-IR')} تومان</span>
                    </div>
                  </div>
                </div>

                {/* Status and Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">وضعیت</label>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedInvoice.status)}`}>
                      {getStatusText(selectedInvoice.status)}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">روش پرداخت</label>
                    <span className="text-gray-900 dark:text-white">
                      {getPaymentMethodText(selectedInvoice.paymentMethod)}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">تاریخ فاکتور</label>
                    <p className="text-gray-900 dark:text-white">{new Date(selectedInvoice.date).toLocaleDateString('fa-IR')}</p>
                  </div>
                  {selectedInvoice.dueDate && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">تاریخ سررسید</label>
                      <p className="text-gray-900 dark:text-white">{new Date(selectedInvoice.dueDate).toLocaleDateString('fa-IR')}</p>
                    </div>
                  )}
                </div>

                {selectedInvoice.notes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">یادداشت</label>
                    <p className="text-gray-900 dark:text-white p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      {selectedInvoice.notes}
                    </p>
                  </div>
                )}

                {selectedInvoice.terms && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">شرایط پرداخت</label>
                    <p className="text-gray-900 dark:text-white p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      {selectedInvoice.terms}
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