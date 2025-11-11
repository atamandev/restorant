'use client'

import { useState, useEffect, useCallback } from 'react'
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
  Upload,
  BarChart3,
  PieChart,
  Activity,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  CheckSquare,
  Square,
  Bell,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ArrowLeft
} from 'lucide-react'

interface Cheque {
  id: string
  chequeNumber: string
  bankName: string
  branchName: string
  amount: number
  currency: 'IRR' | 'USD' | 'EUR'
  issueDate: string
  dueDate: string
  status: 'in_hand' | 'deposited' | 'cleared' | 'returned' | 'endorsed' | 'cancelled'
  type: 'received' | 'paid'
  drawerName: string // صادرکننده چک
  drawerPhone: string
  drawerAddress: string
  payeeName: string // ذینفع چک
  payeePhone: string
  payeeAddress: string
  reference: string // بابت/مرجع
  referenceType: 'invoice' | 'purchase' | 'loan' | 'other'
  referenceId: string
  notes: string
  createdAt: string
  createdBy: string
  lastStatusChange: string
  lastStatusChangeBy: string
  depositDate?: string
  clearDate?: string
  returnDate?: string
  returnReason?: string
  endorsementDate?: string
  endorsementTo?: string
}

const mockCheques: Cheque[] = [
  {
    id: '1',
    chequeNumber: '1234567890',
    bankName: 'بانک ملی ایران',
    branchName: 'شعبه مرکزی',
    amount: 5000000,
    currency: 'IRR',
    issueDate: '1402/10/15',
    dueDate: '1402/11/15',
    status: 'in_hand',
    type: 'received',
    drawerName: 'احمد محمدی',
    drawerPhone: '09123456789',
    drawerAddress: 'تهران، خیابان ولیعصر، پلاک 123',
    payeeName: 'رستوران مرکزی',
    payeePhone: '021-12345678',
    payeeAddress: 'تهران، خیابان آزادی، پلاک 456',
    reference: 'فاکتور فروش INV-2024-001',
    referenceType: 'invoice',
    referenceId: 'INV-2024-001',
    notes: 'چک دریافتی از مشتری',
    createdAt: '1402/10/15 14:30',
    createdBy: 'کاربر سیستم',
    lastStatusChange: '1402/10/15 14:30',
    lastStatusChangeBy: 'کاربر سیستم'
  },
  {
    id: '2',
    chequeNumber: '0987654321',
    bankName: 'بانک صادرات ایران',
    branchName: 'شعبه ولیعصر',
    amount: 2500000,
    currency: 'IRR',
    issueDate: '1402/10/10',
    dueDate: '1402/11/10',
    status: 'deposited',
    type: 'received',
    drawerName: 'سارا کریمی',
    drawerPhone: '09987654321',
    drawerAddress: 'تهران، خیابان نیاوران، پلاک 789',
    payeeName: 'رستوران مرکزی',
    payeePhone: '021-12345678',
    payeeAddress: 'تهران، خیابان آزادی، پلاک 456',
    reference: 'فاکتور فروش INV-2024-002',
    referenceType: 'invoice',
    referenceId: 'INV-2024-002',
    notes: 'چک دریافتی از مشتری',
    createdAt: '1402/10/10 10:15',
    createdBy: 'کاربر سیستم',
    lastStatusChange: '1402/10/18 09:00',
    lastStatusChangeBy: 'کاربر سیستم',
    depositDate: '1402/10/18 09:00'
  },
  {
    id: '3',
    chequeNumber: '1122334455',
    bankName: 'بانک تجارت',
    branchName: 'شعبه کریمخان',
    amount: 3000000,
    currency: 'IRR',
    issueDate: '1402/10/05',
    dueDate: '1402/11/05',
    status: 'cleared',
    type: 'received',
    drawerName: 'رضا حسینی',
    drawerPhone: '09111223344',
    drawerAddress: 'تهران، خیابان کریمخان، پلاک 321',
    payeeName: 'رستوران مرکزی',
    payeePhone: '021-12345678',
    payeeAddress: 'تهران، خیابان آزادی، پلاک 456',
    reference: 'فاکتور فروش INV-2024-003',
    referenceType: 'invoice',
    referenceId: 'INV-2024-003',
    notes: 'چک دریافتی از مشتری',
    createdAt: '1402/10/05 16:45',
    createdBy: 'کاربر سیستم',
    lastStatusChange: '1402/10/20 11:30',
    lastStatusChangeBy: 'کاربر سیستم',
    depositDate: '1402/10/15 10:00',
    clearDate: '1402/10/20 11:30'
  },
  {
    id: '4',
    chequeNumber: '5566778899',
    bankName: 'بانک پارسیان',
    branchName: 'شعبه آزادی',
    amount: 1500000,
    currency: 'IRR',
    issueDate: '1402/10/01',
    dueDate: '1402/11/01',
    status: 'returned',
    type: 'received',
    drawerName: 'مریم نوری',
    drawerPhone: '09333445566',
    drawerAddress: 'تهران، خیابان آزادی، پلاک 654',
    payeeName: 'رستوران مرکزی',
    payeePhone: '021-12345678',
    payeeAddress: 'تهران، خیابان آزادی، پلاک 456',
    reference: 'فاکتور فروش INV-2024-004',
    referenceType: 'invoice',
    referenceId: 'INV-2024-004',
    notes: 'چک دریافتی از مشتری',
    createdAt: '1402/10/01 12:20',
    createdBy: 'کاربر سیستم',
    lastStatusChange: '1402/10/19 14:15',
    lastStatusChangeBy: 'کاربر سیستم',
    depositDate: '1402/10/10 09:00',
    returnDate: '1402/10/19 14:15',
    returnReason: 'موجودی ناکافی'
  },
  {
    id: '5',
    chequeNumber: '9988776655',
    bankName: 'بانک ملت',
    branchName: 'شعبه انقلاب',
    amount: 8000000,
    currency: 'IRR',
    issueDate: '1402/10/20',
    dueDate: '1402/11/20',
    status: 'in_hand',
    type: 'paid',
    drawerName: 'رستوران مرکزی',
    drawerPhone: '021-12345678',
    drawerAddress: 'تهران، خیابان آزادی، پلاک 456',
    payeeName: 'تامین‌کننده مواد غذایی',
    payeePhone: '021-87654321',
    payeeAddress: 'تهران، خیابان ولیعصر، پلاک 987',
    reference: 'خرید مواد اولیه PUR-2024-001',
    referenceType: 'purchase',
    referenceId: 'PUR-2024-001',
    notes: 'چک پرداختی به تامین‌کننده',
    createdAt: '1402/10/20 15:30',
    createdBy: 'کاربر سیستم',
    lastStatusChange: '1402/10/20 15:30',
    lastStatusChangeBy: 'کاربر سیستم'
  }
]

export default function ChequesPage() {
  const [cheques, setCheques] = useState<Cheque[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [filterDueDate, setFilterDueDate] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editingCheque, setEditingCheque] = useState<Cheque | null>(null)
  const [selectedCheque, setSelectedCheque] = useState<Cheque | null>(null)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    chequeNumber: '',
    bankName: '',
    branchName: '',
    amount: 0,
    currency: 'IRR' as 'IRR' | 'USD' | 'EUR',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    type: 'received' as 'received' | 'paid',
    drawerName: '',
    drawerPhone: '',
    drawerAddress: '',
    payeeName: '',
    payeePhone: '',
    payeeAddress: '',
    reference: '',
    referenceType: 'invoice' as 'invoice' | 'purchase' | 'loan' | 'other',
    referenceId: '',
    notes: ''
  })

  // تبدیل داده‌های API به فرمت مورد نیاز
  const convertApiDataToCheque = useCallback((item: any): Cheque => {
    return {
      id: item._id?.toString() || item.id || '',
      chequeNumber: item.chequeNumber || '',
      bankName: item.bankName || '',
      branchName: item.branchName || '',
      amount: item.amount || 0,
      currency: item.currency || 'IRR',
      issueDate: item.issueDate ? new Date(item.issueDate).toLocaleDateString('fa-IR') : new Date().toLocaleDateString('fa-IR'),
      dueDate: item.dueDate ? new Date(item.dueDate).toLocaleDateString('fa-IR') : new Date().toLocaleDateString('fa-IR'),
      status: item.status || 'in_hand',
      type: item.chequeType || item.type || 'received',
      drawerName: item.personName || item.drawerName || '',
      drawerPhone: item.personPhone || item.drawerPhone || '',
      drawerAddress: item.personAddress || item.drawerAddress || '',
      payeeName: item.payeeName || 'رستوران مرکزی',
      payeePhone: item.payeePhone || '',
      payeeAddress: item.payeeAddress || '',
      reference: item.reference || '',
      referenceType: item.referenceType || 'other',
      referenceId: item.referenceId || '',
      notes: item.notes || '',
      createdAt: item.createdAt ? new Date(item.createdAt).toLocaleDateString('fa-IR') : new Date().toLocaleDateString('fa-IR'),
      createdBy: item.createdBy || 'system',
      lastStatusChange: item.lastStatusChange || '',
      lastStatusChangeBy: item.lastStatusChangeBy || '',
      depositDate: item.depositDate ? new Date(item.depositDate).toLocaleDateString('fa-IR') : undefined,
      clearDate: item.clearDate ? new Date(item.clearDate).toLocaleDateString('fa-IR') : undefined,
      returnDate: item.returnDate ? new Date(item.returnDate).toLocaleDateString('fa-IR') : undefined,
      returnReason: item.returnReason || undefined,
      endorsementDate: item.endorsementDate ? new Date(item.endorsementDate).toLocaleDateString('fa-IR') : undefined,
      endorsementTo: item.endorsementTo || undefined
    }
  }, [])

  // دریافت داده از API
  const fetchCheques = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filterStatus !== 'all') params.append('status', filterStatus)
      if (filterType !== 'all') params.append('chequeType', filterType)
      params.append('sortBy', 'dueDate')
      params.append('sortOrder', 'asc')
      params.append('limit', '1000')

      const response = await fetch(`/api/cheques?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        const chequesList = (data.data || []).map(convertApiDataToCheque)
        setCheques(chequesList)
      } else {
        console.error('Error fetching cheques:', data.message)
        setCheques([])
      }
    } catch (error) {
      console.error('Error fetching cheques:', error)
      setCheques([])
    } finally {
      setLoading(false)
    }
  }, [filterStatus, filterType, convertApiDataToCheque])

  useEffect(() => {
    fetchCheques()
  }, [fetchCheques])

  const filteredCheques = cheques.filter(cheque =>
    (filterStatus === 'all' || cheque.status === filterStatus) &&
    (filterType === 'all' || cheque.type === filterType) &&
    (filterDueDate === 'all' || 
      (filterDueDate === 'overdue' && new Date(cheque.dueDate) < new Date()) ||
      (filterDueDate === 'due_soon' && new Date(cheque.dueDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)) ||
      (filterDueDate === 'due_later' && new Date(cheque.dueDate) > new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))
    ) &&
    (cheque.chequeNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cheque.drawerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cheque.payeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cheque.bankName.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const handleSave = async () => {
    try {
      setSaving(true)
      const chequeData = {
        chequeNumber: formData.chequeNumber,
        chequeType: formData.type,
        amount: formData.amount,
        currency: formData.currency,
        bankName: formData.bankName,
        branchName: formData.branchName,
        issueDate: formData.issueDate,
        dueDate: formData.dueDate,
        personName: formData.type === 'received' ? formData.drawerName : formData.payeeName,
        personPhone: formData.type === 'received' ? formData.drawerPhone : formData.payeePhone,
        personAddress: formData.type === 'received' ? formData.drawerAddress : formData.payeeAddress,
        reference: formData.reference,
        referenceType: formData.referenceType,
        referenceId: formData.referenceId,
        notes: formData.notes,
        status: 'in_hand'
      }

      let response
      if (editingCheque) {
        response = await fetch(`/api/cheques/${editingCheque.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(chequeData)
        })
      } else {
        response = await fetch('/api/cheques', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(chequeData)
        })
      }

      const data = await response.json()
      if (data.success) {
        await fetchCheques()
        setShowForm(false)
        setEditingCheque(null)
        resetForm()
        alert(editingCheque ? 'چک با موفقیت به‌روزرسانی شد' : 'چک با موفقیت ثبت شد')
      } else {
        alert('خطا: ' + data.message)
      }
    } catch (error) {
      console.error('Error saving cheque:', error)
      alert('خطا در ذخیره چک')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (chequeId: string) => {
    if (!confirm('آیا از حذف این چک اطمینان دارید؟')) return

    try {
      const response = await fetch(`/api/cheques/${chequeId}`, {
        method: 'DELETE'
      })
      const data = await response.json()
      if (data.success) {
        await fetchCheques()
        alert('چک با موفقیت حذف شد')
      } else {
        alert('خطا: ' + data.message)
      }
    } catch (error) {
      console.error('Error deleting cheque:', error)
      alert('خطا در حذف چک')
    }
  }


  const openAddForm = () => {
    setEditingCheque(null)
    resetForm()
    setShowForm(true)
  }

  const openEditForm = (cheque: Cheque) => {
    setEditingCheque(cheque)
    setFormData({
      chequeNumber: cheque.chequeNumber,
      bankName: cheque.bankName,
      branchName: cheque.branchName,
      amount: cheque.amount,
      currency: cheque.currency,
      issueDate: cheque.issueDate,
      dueDate: cheque.dueDate,
      type: cheque.type,
      drawerName: cheque.drawerName,
      drawerPhone: cheque.drawerPhone,
      drawerAddress: cheque.drawerAddress,
      payeeName: cheque.payeeName,
      payeePhone: cheque.payeePhone,
      payeeAddress: cheque.payeeAddress,
      reference: cheque.reference,
      referenceType: cheque.referenceType,
      referenceId: cheque.referenceId,
      notes: cheque.notes
    })
    setShowForm(true)
  }

  const deleteCheque = (id: string) => {
    if (confirm('آیا از حذف این چک مطمئن هستید؟')) {
      setCheques(cheques.filter(cheque => cheque.id !== id))
    }
  }

  const resetForm = () => {
    setFormData({
      chequeNumber: '',
      bankName: '',
      branchName: '',
      amount: 0,
      currency: 'IRR',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      type: 'received',
      drawerName: '',
      drawerPhone: '',
      drawerAddress: '',
      payeeName: '',
      payeePhone: '',
      payeeAddress: '',
      reference: '',
      referenceType: 'invoice',
      referenceId: '',
      notes: ''
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_hand': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
      case 'deposited': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
      case 'cleared': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
      case 'returned': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
      case 'endorsed': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
      case 'cancelled': return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'in_hand': return 'در دست'
      case 'deposited': return 'واریز شده'
      case 'cleared': return 'وصول شده'
      case 'returned': return 'برگشتی'
      case 'endorsed': return 'پشت‌نویسی شده'
      case 'cancelled': return 'لغو شده'
      default: return 'نامشخص'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'in_hand': return <FileText className="w-4 h-4" />
      case 'deposited': return <ArrowRight className="w-4 h-4" />
      case 'cleared': return <CheckCircle2 className="w-4 h-4" />
      case 'returned': return <XCircle className="w-4 h-4" />
      case 'endorsed': return <ArrowLeft className="w-4 h-4" />
      case 'cancelled': return <X className="w-4 h-4" />
      default: return null
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'received': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
      case 'paid': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
    }
  }

  const getTypeText = (type: string) => {
    switch (type) {
      case 'received': return 'دریافتی'
      case 'paid': return 'پرداختی'
      default: return 'نامشخص'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'received': return <ArrowUpRight className="w-4 h-4 text-green-600" />
      case 'paid': return <ArrowDownLeft className="w-4 h-4 text-red-600" />
      default: return null
    }
  }

  const getTotalCheques = () => cheques.length
  const getTotalAmount = () => cheques.reduce((sum, cheque) => sum + cheque.amount, 0)
  const getReceivedCheques = () => cheques.filter(cheque => cheque.type === 'received').length
  const getPaidCheques = () => cheques.filter(cheque => cheque.type === 'paid').length
  const getOverdueCheques = () => cheques.filter(cheque => new Date(cheque.dueDate) < new Date() && cheque.status !== 'cleared' && cheque.status !== 'cancelled').length
  const getDueSoonCheques = () => cheques.filter(cheque => {
    const dueDate = new Date(cheque.dueDate)
    const now = new Date()
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    return dueDate > now && dueDate <= sevenDaysFromNow && cheque.status !== 'cleared' && cheque.status !== 'cancelled'
  }).length

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date()
  }

  const isDueSoon = (dueDate: string) => {
    const due = new Date(dueDate)
    const now = new Date()
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    return due > now && due <= sevenDaysFromNow
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/80 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold gradient-text mb-2">مدیریت چک‌ها</h1>
          <p className="text-gray-600 dark:text-gray-300">مدیریت چک‌های دریافتی و پرداختی رستوران</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-8">
          <div className="premium-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">کل چک‌ها</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{getTotalCheques()}</p>
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
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{getTotalAmount().toLocaleString('fa-IR')}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
          <div className="premium-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">چک‌های دریافتی</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{getReceivedCheques()}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <ArrowUpRight className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
          <div className="premium-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">چک‌های پرداختی</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{getPaidCheques()}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                <ArrowDownLeft className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </div>
          <div className="premium-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">سررسید گذشته</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{getOverdueCheques()}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </div>
          <div className="premium-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">سررسید نزدیک</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{getDueSoonCheques()}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                <Bell className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
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
                  placeholder="جستجو در چک‌ها..."
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
                <option value="in_hand">در دست</option>
                <option value="deposited">واریز شده</option>
                <option value="cleared">وصول شده</option>
                <option value="returned">برگشتی</option>
                <option value="endorsed">پشت‌نویسی شده</option>
                <option value="cancelled">لغو شده</option>
              </select>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">همه انواع</option>
                <option value="received">دریافتی</option>
                <option value="paid">پرداختی</option>
              </select>
              <select
                value={filterDueDate}
                onChange={(e) => setFilterDueDate(e.target.value)}
                className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">همه سررسیدها</option>
                <option value="overdue">سررسید گذشته</option>
                <option value="due_soon">سررسید نزدیک</option>
                <option value="due_later">سررسید بعدی</option>
              </select>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <button
                onClick={openAddForm}
                className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>چک جدید</span>
              </button>
              <button className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                <Download className="w-4 h-4" />
                <span>صادر کردن</span>
              </button>
            </div>
          </div>
        </div>

        {/* Cheques List */}
        <div className="premium-card p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">لیست چک‌ها</h2>
          
          {filteredCheques.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">هیچ چکی یافت نشد</h3>
              <p className="text-gray-600 dark:text-gray-400">چک‌های رستوران در اینجا نمایش داده می‌شوند</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead>
                  <tr className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-800/50">
                    <th className="px-4 py-3 rounded-r-lg">شماره چک</th>
                    <th className="px-4 py-3">بانک</th>
                    <th className="px-4 py-3">نوع</th>
                    <th className="px-4 py-3">مبلغ</th>
                    <th className="px-4 py-3">صادرکننده</th>
                    <th className="px-4 py-3">ذینفع</th>
                    <th className="px-4 py-3">تاریخ سررسید</th>
                    <th className="px-4 py-3">وضعیت</th>
                    <th className="px-4 py-3">مرجع</th>
                    <th className="px-4 py-3 rounded-l-lg">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredCheques.map(cheque => (
                    <tr key={cheque.id} className={`bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                      isOverdue(cheque.dueDate) ? 'border-r-4 border-red-500' : 
                      isDueSoon(cheque.dueDate) ? 'border-r-4 border-yellow-500' : ''
                    }`}>
                      <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">{cheque.chequeNumber}</td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-gray-900 dark:text-white font-medium">{cheque.bankName}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{cheque.branchName}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          {getTypeIcon(cheque.type)}
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(cheque.type)}`}>
                            {getTypeText(cheque.type)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">
                        {cheque.amount.toLocaleString('fa-IR')} تومان
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-gray-900 dark:text-white font-medium">{cheque.drawerName}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{cheque.drawerPhone}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-gray-900 dark:text-white font-medium">{cheque.payeeName}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{cheque.payeePhone}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className={`${isOverdue(cheque.dueDate) ? 'text-red-600 dark:text-red-400' : 
                          isDueSoon(cheque.dueDate) ? 'text-yellow-600 dark:text-yellow-400' : 
                          'text-gray-700 dark:text-gray-200'}`}>
                          {cheque.dueDate}
                          {isOverdue(cheque.dueDate) && <span className="block text-xs text-red-500">سررسید گذشته</span>}
                          {isDueSoon(cheque.dueDate) && <span className="block text-xs text-yellow-500">سررسید نزدیک</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          {getStatusIcon(cheque.status)}
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(cheque.status)}`}>
                            {getStatusText(cheque.status)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{cheque.reference}</td>
                      <td className="px-4 py-3">
                        <div className="flex space-x-2 space-x-reverse">
                          <button
                            onClick={() => setSelectedCheque(cheque)}
                            className="p-2 rounded-full text-primary-600 hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditForm(cheque)}
                            className="p-2 rounded-full text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(cheque.id)}
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

        {/* Cheque Details Modal */}
        {selectedCheque && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  جزئیات چک {selectedCheque.chequeNumber}
                </h3>
                <button
                  onClick={() => setSelectedCheque(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Cheque Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">شماره چک</label>
                    <p className="text-gray-900 dark:text-white">{selectedCheque.chequeNumber}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">بانک</label>
                    <p className="text-gray-900 dark:text-white">{selectedCheque.bankName} - {selectedCheque.branchName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">مبلغ</label>
                    <p className="text-gray-900 dark:text-white font-bold">{selectedCheque.amount.toLocaleString('fa-IR')} تومان</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">نوع چک</label>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      {getTypeIcon(selectedCheque.type)}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(selectedCheque.type)}`}>
                        {getTypeText(selectedCheque.type)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">تاریخ صدور</label>
                    <p className="text-gray-900 dark:text-white">{selectedCheque.issueDate}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">تاریخ سررسید</label>
                    <p className={`${isOverdue(selectedCheque.dueDate) ? 'text-red-600 dark:text-red-400' : 
                      isDueSoon(selectedCheque.dueDate) ? 'text-yellow-600 dark:text-yellow-400' : 
                      'text-gray-900 dark:text-white'}`}>
                      {selectedCheque.dueDate}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">وضعیت</label>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      {getStatusIcon(selectedCheque.status)}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedCheque.status)}`}>
                        {getStatusText(selectedCheque.status)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Parties Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">صادرکننده چک</label>
                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <p className="text-gray-900 dark:text-white font-medium">{selectedCheque.drawerName}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{selectedCheque.drawerPhone}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{selectedCheque.drawerAddress}</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ذینفع چک</label>
                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <p className="text-gray-900 dark:text-white font-medium">{selectedCheque.payeeName}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{selectedCheque.payeePhone}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{selectedCheque.payeeAddress}</p>
                    </div>
                  </div>
                </div>

                {/* Reference and Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">مرجع/بابت</label>
                  <p className="text-gray-900 dark:text-white p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    {selectedCheque.reference}
                  </p>
                </div>

                {selectedCheque.notes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">یادداشت</label>
                    <p className="text-gray-900 dark:text-white p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      {selectedCheque.notes}
                    </p>
                  </div>
                )}

                {/* Status History */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">تاریخچه وضعیت</label>
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      آخرین تغییر: {selectedCheque.lastStatusChange} توسط {selectedCheque.lastStatusChangeBy}
                    </p>
                    {selectedCheque.depositDate && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        تاریخ واریز: {selectedCheque.depositDate}
                      </p>
                    )}
                    {selectedCheque.clearDate && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        تاریخ وصول: {selectedCheque.clearDate}
                      </p>
                    )}
                    {selectedCheque.returnDate && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        تاریخ برگشت: {selectedCheque.returnDate} - دلیل: {selectedCheque.returnReason}
                      </p>
                    )}
                    {selectedCheque.endorsementDate && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        تاریخ پشت‌نویسی: {selectedCheque.endorsementDate} به {selectedCheque.endorsementTo}
                      </p>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3 space-x-reverse pt-4 border-t border-gray-200 dark:border-gray-600">
                  <button className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                    <Printer className="w-4 h-4" />
                    <span>چاپ چک</span>
                  </button>
                  <button className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                    <RefreshCw className="w-4 h-4" />
                    <span>تغییر وضعیت</span>
                  </button>
                  <button className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                    <Copy className="w-4 h-4" />
                    <span>کپی چک</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cheque Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {editingCheque ? 'ویرایش چک' : 'چک جدید'}
                </h3>
                <button
                  onClick={() => setShowForm(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">شماره چک</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      value={formData.chequeNumber}
                      onChange={(e) => setFormData({...formData, chequeNumber: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">نام بانک</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      value={formData.bankName}
                      onChange={(e) => setFormData({...formData, bankName: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">نام شعبه</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      value={formData.branchName}
                      onChange={(e) => setFormData({...formData, branchName: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">مبلغ</label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      value={formData.amount}
                      onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value)})}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ارز</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      value={formData.currency}
                      onChange={(e) => setFormData({...formData, currency: e.target.value as any})}
                    >
                      <option value="IRR">ریال ایران</option>
                      <option value="USD">دلار آمریکا</option>
                      <option value="EUR">یورو</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">تاریخ صدور</label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      value={formData.issueDate}
                      onChange={(e) => setFormData({...formData, issueDate: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">تاریخ سررسید</label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">نوع چک</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                  >
                    <option value="received">دریافتی</option>
                    <option value="paid">پرداختی</option>
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">نام صادرکننده</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      value={formData.drawerName}
                      onChange={(e) => setFormData({...formData, drawerName: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">تلفن صادرکننده</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      value={formData.drawerPhone}
                      onChange={(e) => setFormData({...formData, drawerPhone: e.target.value})}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">آدرس صادرکننده</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    value={formData.drawerAddress}
                    onChange={(e) => setFormData({...formData, drawerAddress: e.target.value})}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">نام ذینفع</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      value={formData.payeeName}
                      onChange={(e) => setFormData({...formData, payeeName: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">تلفن ذینفع</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      value={formData.payeePhone}
                      onChange={(e) => setFormData({...formData, payeePhone: e.target.value})}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">آدرس ذینفع</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    value={formData.payeeAddress}
                    onChange={(e) => setFormData({...formData, payeeAddress: e.target.value})}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">نوع مرجع</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      value={formData.referenceType}
                      onChange={(e) => setFormData({...formData, referenceType: e.target.value as any})}
                    >
                      <option value="invoice">فاکتور</option>
                      <option value="purchase">خرید</option>
                      <option value="loan">وام</option>
                      <option value="other">سایر</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">شناسه مرجع</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      value={formData.referenceId}
                      onChange={(e) => setFormData({...formData, referenceId: e.target.value})}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">مرجع/بابت</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    value={formData.reference}
                    onChange={(e) => setFormData({...formData, reference: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">یادداشت</label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  />
                </div>
                
                <div className="flex space-x-3 space-x-reverse pt-4">
                  <button
                    onClick={handleSave}
                    className="flex-1 flex items-center justify-center space-x-2 space-x-reverse px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    <span>ذخیره چک</span>
                  </button>
                  <button
                    onClick={() => setShowForm(false)}
                    className="flex-1 flex items-center justify-center space-x-2 space-x-reverse px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    <span>انصراف</span>
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
