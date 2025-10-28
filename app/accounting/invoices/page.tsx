'use client'

import { useState } from 'react'
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
  Archive
} from 'lucide-react'

interface Invoice {
  id: string
  invoiceNumber: string
  customerId: string
  customerName: string
  customerPhone: string
  customerAddress: string
  items: Array<{
    id: string
    name: string
    quantity: number
    unitPrice: number
    totalPrice: number
    category: string
  }>
  subtotal: number
  tax: number
  discount: number
  total: number
  paymentMethod: 'cash' | 'card' | 'bank_transfer' | 'credit' | 'check'
  paymentStatus: 'pending' | 'partial' | 'paid'
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  issueDate: string
  dueDate: string
  paidDate?: string
  branchId: string
  branchName: string
  notes: string
  createdBy: string
  createdAt: string
  sentAt?: string
  paidAt?: string
}

const mockInvoices: Invoice[] = [
  {
    id: '1',
    invoiceNumber: 'INV-2024-001',
    customerId: 'CUST-001',
    customerName: 'احمد محمدی',
    customerPhone: '09123456789',
    customerAddress: 'تهران، خیابان ولیعصر، پلاک 123',
    items: [
      { id: '1', name: 'کباب کوبیده', quantity: 2, unitPrice: 120000, totalPrice: 240000, category: 'غذاهای اصلی' },
      { id: '2', name: 'نوشابه', quantity: 2, unitPrice: 15000, totalPrice: 30000, category: 'نوشیدنی‌ها' }
    ],
    subtotal: 270000,
    tax: 24300,
    discount: 0,
    total: 294300,
    paymentMethod: 'cash',
    paymentStatus: 'paid',
    status: 'paid',
    issueDate: '1402/10/18',
    dueDate: '1402/10/25',
    paidDate: '1402/10/18',
    branchId: 'BR-001',
    branchName: 'شعبه مرکزی',
    notes: 'سفارش حضوری',
    createdBy: 'کاربر سیستم',
    createdAt: '1402/10/18 14:30',
    sentAt: '1402/10/18 14:30',
    paidAt: '1402/10/18 14:30'
  },
  {
    id: '2',
    invoiceNumber: 'INV-2024-002',
    customerId: 'CUST-002',
    customerName: 'سارا کریمی',
    customerPhone: '09987654321',
    customerAddress: 'تهران، خیابان نیاوران، پلاک 456',
    items: [
      { id: '3', name: 'جوجه کباب', quantity: 1, unitPrice: 135000, totalPrice: 135000, category: 'غذاهای اصلی' },
      { id: '4', name: 'سالاد سزار', quantity: 1, unitPrice: 45000, totalPrice: 45000, category: 'پیش‌غذاها' }
    ],
    subtotal: 180000,
    tax: 16200,
    discount: 10000,
    total: 186200,
    paymentMethod: 'card',
    paymentStatus: 'paid',
    status: 'paid',
    issueDate: '1402/10/19',
    dueDate: '1402/10/26',
    paidDate: '1402/10/19',
    branchId: 'BR-001',
    branchName: 'شعبه مرکزی',
    notes: 'سفارش بیرون‌بر',
    createdBy: 'کاربر سیستم',
    createdAt: '1402/10/19 12:15',
    sentAt: '1402/10/19 12:15',
    paidAt: '1402/10/19 12:15'
  },
  {
    id: '3',
    invoiceNumber: 'INV-2024-003',
    customerId: 'CUST-003',
    customerName: 'رضا حسینی',
    customerPhone: '09111223344',
    customerAddress: 'تهران، خیابان کریمخان، پلاک 789',
    items: [
      { id: '5', name: 'چلو گوشت', quantity: 1, unitPrice: 180000, totalPrice: 180000, category: 'غذاهای اصلی' },
      { id: '6', name: 'دوغ محلی', quantity: 1, unitPrice: 18000, totalPrice: 18000, category: 'نوشیدنی‌ها' }
    ],
    subtotal: 198000,
    tax: 17820,
    discount: 0,
    total: 215820,
    paymentMethod: 'credit',
    paymentStatus: 'pending',
    status: 'overdue',
    issueDate: '1402/10/15',
    dueDate: '1402/10/22',
    branchId: 'BR-001',
    branchName: 'شعبه مرکزی',
    notes: 'سفارش اعتباری',
    createdBy: 'کاربر سیستم',
    createdAt: '1402/10/15 16:45',
    sentAt: '1402/10/15 16:45'
  },
  {
    id: '4',
    invoiceNumber: 'INV-2024-004',
    customerId: 'CUST-004',
    customerName: 'مریم نوری',
    customerPhone: '09333445566',
    customerAddress: 'تهران، خیابان آزادی، پلاک 321',
    items: [
      { id: '7', name: 'میرزا قاسمی', quantity: 2, unitPrice: 70000, totalPrice: 140000, category: 'پیش‌غذاها' },
      { id: '8', name: 'بستنی سنتی', quantity: 1, unitPrice: 35000, totalPrice: 35000, category: 'دسرها' }
    ],
    subtotal: 175000,
    tax: 15750,
    discount: 5000,
    total: 185750,
    paymentMethod: 'check',
    paymentStatus: 'partial',
    status: 'sent',
    issueDate: '1402/10/20',
    dueDate: '1402/10/27',
    branchId: 'BR-001',
    branchName: 'شعبه مرکزی',
    notes: 'پرداخت با چک',
    createdBy: 'کاربر سیستم',
    createdAt: '1402/10/20 10:20',
    sentAt: '1402/10/20 10:20'
  }
]

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>(mockInvoices)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPaymentStatus, setFilterPaymentStatus] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)

  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    items: [] as Array<{name: string, quantity: number, unitPrice: number, category: string}>,
    paymentMethod: 'cash' as 'cash' | 'card' | 'bank_transfer' | 'credit' | 'check',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: ''
  })

  const filteredInvoices = invoices.filter(invoice =>
    (filterStatus === 'all' || invoice.status === filterStatus) &&
    (filterPaymentStatus === 'all' || invoice.paymentStatus === filterPaymentStatus) &&
    (invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const handleSave = () => {
    if (editingInvoice) {
      // Update existing invoice
      const updatedInvoice = {
        ...editingInvoice,
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        customerAddress: formData.customerAddress,
        paymentMethod: formData.paymentMethod,
        issueDate: formData.issueDate,
        dueDate: formData.dueDate,
        notes: formData.notes
      }
      setInvoices(invoices.map(invoice => 
        invoice.id === editingInvoice.id ? updatedInvoice : invoice
      ))
    } else {
      // Create new invoice
      const newInvoice: Invoice = {
        id: Date.now().toString(),
        invoiceNumber: `INV-2024-${String(invoices.length + 1).padStart(3, '0')}`,
        customerId: `CUST-${Date.now()}`,
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        customerAddress: formData.customerAddress,
        items: formData.items.map((item, index) => ({
          id: String(index + 1),
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.quantity * item.unitPrice,
          category: item.category
        })),
        subtotal: formData.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0),
        tax: 0,
        discount: 0,
        total: formData.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0),
        paymentMethod: formData.paymentMethod,
        paymentStatus: 'pending',
        status: 'draft',
        issueDate: formData.issueDate,
        dueDate: formData.dueDate,
        branchId: 'BR-001',
        branchName: 'شعبه مرکزی',
        notes: formData.notes,
        createdBy: 'کاربر سیستم',
        createdAt: new Date().toLocaleString('fa-IR')
      }
      setInvoices([newInvoice, ...invoices])
    }
    setShowForm(false)
    setEditingInvoice(null)
    resetForm()
  }

  const openAddForm = () => {
    setEditingInvoice(null)
    resetForm()
    setShowForm(true)
  }

  const openEditForm = (invoice: Invoice) => {
    setEditingInvoice(invoice)
    setFormData({
      customerName: invoice.customerName,
      customerPhone: invoice.customerPhone,
      customerAddress: invoice.customerAddress,
      items: invoice.items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        category: item.category
      })),
      paymentMethod: invoice.paymentMethod,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      notes: invoice.notes
    })
    setShowForm(true)
  }

  const deleteInvoice = (id: string) => {
    if (confirm('آیا از حذف این فاکتور مطمئن هستید؟')) {
      setInvoices(invoices.filter(invoice => invoice.id !== id))
    }
  }

  const resetForm = () => {
    setFormData({
      customerName: '',
      customerPhone: '',
      customerAddress: '',
      items: [],
      paymentMethod: 'cash',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: ''
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

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
      case 'partial': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
      case 'pending': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
    }
  }

  const getPaymentStatusText = (status: string) => {
    switch (status) {
      case 'paid': return 'پرداخت شده'
      case 'partial': return 'پرداخت جزئی'
      case 'pending': return 'در انتظار پرداخت'
      default: return 'نامشخص'
    }
  }

  const getTotalInvoices = () => invoices.length
  const getTotalValue = () => invoices.reduce((sum, invoice) => sum + invoice.total, 0)
  const getPaidInvoices = () => invoices.filter(inv => inv.paymentStatus === 'paid').length
  const getPendingAmount = () => invoices.filter(inv => inv.paymentStatus === 'pending').reduce((sum, inv) => sum + inv.total, 0)
  const getOverdueInvoices = () => invoices.filter(inv => inv.status === 'overdue').length

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/80 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold gradient-text mb-2">فاکتورها</h1>
          <p className="text-gray-600 dark:text-gray-300">مدیریت فاکتورهای فروش رستوران</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
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
                <p className="text-sm text-gray-600 dark:text-gray-300">کل ارزش</p>
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
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{getPaidInvoices()}</p>
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
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{getPendingAmount().toLocaleString('fa-IR')}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </div>
          <div className="premium-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">سررسید گذشته</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{getOverdueInvoices()}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
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
              <select
                value={filterPaymentStatus}
                onChange={(e) => setFilterPaymentStatus(e.target.value)}
                className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">همه پرداخت‌ها</option>
                <option value="pending">در انتظار پرداخت</option>
                <option value="partial">پرداخت جزئی</option>
                <option value="paid">پرداخت شده</option>
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
              <button className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                <Download className="w-4 h-4" />
                <span>صادر کردن</span>
              </button>
            </div>
          </div>
        </div>

        {/* Invoices List */}
        <div className="premium-card p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">لیست فاکتورها</h2>
          
          {filteredInvoices.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">هیچ فاکتوری یافت نشد</h3>
              <p className="text-gray-600 dark:text-gray-400">فاکتورهای فروش رستوران در اینجا نمایش داده می‌شوند</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead>
                  <tr className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-800/50">
                    <th className="px-4 py-3 rounded-r-lg">شماره فاکتور</th>
                    <th className="px-4 py-3">مشتری</th>
                    <th className="px-4 py-3">مبلغ کل</th>
                    <th className="px-4 py-3">روش پرداخت</th>
                    <th className="px-4 py-3">وضعیت</th>
                    <th className="px-4 py-3">پرداخت</th>
                    <th className="px-4 py-3">تاریخ صدور</th>
                    <th className="px-4 py-3">سررسید</th>
                    <th className="px-4 py-3 rounded-l-lg">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredInvoices.map(invoice => (
                    <tr key={invoice.id} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">{invoice.invoiceNumber}</td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-gray-900 dark:text-white font-medium">{invoice.customerName}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{invoice.customerPhone}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">
                        {invoice.total.toLocaleString('fa-IR')} تومان
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
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(invoice.paymentStatus)}`}>
                          {getPaymentStatusText(invoice.paymentStatus)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{invoice.issueDate}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{invoice.dueDate}</td>
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
                            onClick={() => deleteInvoice(invoice.id)}
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
                {/* Customer Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">مشتری</label>
                    <p className="text-gray-900 dark:text-white">{selectedInvoice.customerName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">تلفن</label>
                    <p className="text-gray-900 dark:text-white">{selectedInvoice.customerPhone}</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">آدرس</label>
                    <p className="text-gray-900 dark:text-white">{selectedInvoice.customerAddress}</p>
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
                          <th className="px-3 py-2">دسته‌بندی</th>
                          <th className="px-3 py-2">تعداد</th>
                          <th className="px-3 py-2">قیمت واحد</th>
                          <th className="px-3 py-2 rounded-l-lg">قیمت کل</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {selectedInvoice.items.map(item => (
                          <tr key={item.id} className="bg-white dark:bg-gray-800">
                            <td className="px-3 py-2 text-gray-900 dark:text-white">{item.name}</td>
                            <td className="px-3 py-2 text-gray-700 dark:text-gray-200">{item.category}</td>
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
                      <span>{selectedInvoice.tax.toLocaleString('fa-IR')} تومان</span>
                    </div>
                    {selectedInvoice.discount > 0 && (
                      <div className="flex justify-between text-gray-700 dark:text-gray-300">
                        <span>تخفیف:</span>
                        <span>-{selectedInvoice.discount.toLocaleString('fa-IR')} تومان</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-white border-t border-gray-200 dark:border-gray-600 pt-2">
                      <span>مبلغ نهایی:</span>
                      <span>{selectedInvoice.total.toLocaleString('fa-IR')} تومان</span>
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">وضعیت پرداخت</label>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(selectedInvoice.paymentStatus)}`}>
                      {getPaymentStatusText(selectedInvoice.paymentStatus)}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">تاریخ صدور</label>
                    <p className="text-gray-900 dark:text-white">{selectedInvoice.issueDate}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">سررسید</label>
                    <p className="text-gray-900 dark:text-white">{selectedInvoice.dueDate}</p>
                  </div>
                  {selectedInvoice.paidDate && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">تاریخ پرداخت</label>
                      <p className="text-gray-900 dark:text-white">{selectedInvoice.paidDate}</p>
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

                {/* Action Buttons */}
                <div className="flex space-x-3 space-x-reverse pt-4 border-t border-gray-200 dark:border-gray-600">
                  <button className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                    <Printer className="w-4 h-4" />
                    <span>چاپ فاکتور</span>
                  </button>
                  <button className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                    <Send className="w-4 h-4" />
                    <span>ارسال به مشتری</span>
                  </button>
                  <button className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                    <Copy className="w-4 h-4" />
                    <span>کپی فاکتور</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
