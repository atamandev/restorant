'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import LineChart from '@/components/Charts/LineChart'
import PieChart from '@/components/Charts/PieChart'
import BarChart from '@/components/Charts/BarChart'
import {
  Users,
  User,
  Building,
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
  DollarSign,
  Percent,
  Receipt,
  FileText,
  CreditCard,
  Banknote,
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
  Square,
  MapPin,
  Phone,
  Mail,
  Globe
} from 'lucide-react'

interface PersonData {
  id: string
  name: string
  type: 'customer' | 'supplier'
  category: string
  phone: string
  email: string
  address: string
  creditLimit: number
  currentBalance: number
  totalTransactions: number
  totalAmount: number
  lastTransactionDate: string
  averageTransactionAmount: number
  paymentTerms: string
  status: 'active' | 'inactive' | 'suspended'
  notes: string
}

interface TransactionData {
  id: string
  date: string
  type: 'sale' | 'purchase' | 'payment' | 'receipt'
  amount: number
  balance: number
  reference: string
  description: string
  user: string
}

interface TopCustomerData {
  id: string
  name: string
  totalAmount: number
  transactionCount: number
  averageAmount: number
  lastTransactionDate: string
  growthRate: number
}

interface TopSupplierData {
  id: string
  name: string
  totalAmount: number
  transactionCount: number
  averageAmount: number
  lastTransactionDate: string
  paymentTerms: string
}


const getPersonTypeColor = (type: string) => {
  switch (type) {
    case 'customer': return 'text-blue-600 dark:text-blue-400'
    case 'supplier': return 'text-green-600 dark:text-green-400'
    default: return 'text-gray-600 dark:text-gray-400'
  }
}

const getPersonTypeBadge = (type: string) => {
  switch (type) {
    case 'customer': return <span className="status-badge bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">مشتری</span>
    case 'supplier': return <span className="status-badge bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">تامین‌کننده</span>
    default: return null
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'text-green-600 dark:text-green-400'
    case 'inactive': return 'text-gray-600 dark:text-gray-400'
    case 'suspended': return 'text-red-600 dark:text-red-400'
    default: return 'text-gray-600 dark:text-gray-400'
  }
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'active': return <span className="status-badge bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">فعال</span>
    case 'inactive': return <span className="status-badge bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300">غیرفعال</span>
    case 'suspended': return <span className="status-badge bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">تعلیق</span>
    default: return null
  }
}

const getTransactionTypeColor = (type: string) => {
  switch (type) {
    case 'sale': return 'text-green-600 dark:text-green-400'
    case 'purchase': return 'text-blue-600 dark:text-blue-400'
    case 'payment': return 'text-red-600 dark:text-red-400'
    case 'receipt': return 'text-purple-600 dark:text-purple-400'
    default: return 'text-gray-600 dark:text-gray-400'
  }
}

const getTransactionTypeBadge = (type: string) => {
  switch (type) {
    case 'sale': return <span className="status-badge bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">فروش</span>
    case 'purchase': return <span className="status-badge bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">خرید</span>
    case 'payment': return <span className="status-badge bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">پرداخت</span>
    case 'receipt': return <span className="status-badge bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">دریافت</span>
    default: return null
  }
}

export default function CustomerSupplierReportsPage() {
  const [activeTab, setActiveTab] = useState<'persons' | 'transactions' | 'top'>('persons')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [searchDebounced, setSearchDebounced] = useState('')
  const [selectedPerson, setSelectedPerson] = useState<PersonData | null>(null)
  const [showPersonModal, setShowPersonModal] = useState(false)
  const [editingPerson, setEditingPerson] = useState<PersonData | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<any>({
    name: '',
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    address: '',
    creditLimit: 0,
    status: 'active',
    customerType: 'regular',
    category: 'other',
    paymentTerms: 30,
    notes: ''
  })
  const [createType, setCreateType] = useState<'customer' | 'supplier'>('customer')
  
  const [personData, setPersonData] = useState<PersonData[]>([])
  const [transactionData, setTransactionData] = useState<TransactionData[]>([])
  const [topCustomers, setTopCustomers] = useState<TopCustomerData[]>([])
  const [topSuppliers, setTopSuppliers] = useState<TopSupplierData[]>([])
  const [stats, setStats] = useState<any>(null)

  // Fetch persons (customers and suppliers)
  const fetchPersons = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.append('reportType', 'summary')
      if (filterType !== 'all') params.append('type', filterType)

      const response = await fetch(`/api/customer-supplier-reports?${params.toString()}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const result = await response.json()
      
      if (result.success) {
        setPersonData(result.data || [])
        setStats(result.stats || null)
      } else {
        console.error('API returned error:', result.message)
      }
    } catch (error) {
      console.error('Error fetching persons:', error)
      setPersonData([])
      setStats(null)
    } finally {
      setLoading(false)
    }
  }, [filterType])

  // Fetch transactions
  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.append('reportType', 'transactions')
      if (filterType !== 'all') params.append('type', filterType)

      const response = await fetch(`/api/customer-supplier-reports?${params.toString()}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const result = await response.json()
      
      if (result.success) {
        setTransactionData(result.data || [])
      } else {
        console.error('API returned error:', result.message)
        setTransactionData([])
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
      setTransactionData([])
    } finally {
      setLoading(false)
    }
  }, [filterType])

  // Fetch top customers and suppliers
  const fetchTop = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.append('reportType', 'top')
      if (filterType !== 'all') params.append('type', filterType)

      const response = await fetch(`/api/customer-supplier-reports?${params.toString()}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const result = await response.json()
      
      if (result.success) {
        setTopCustomers(result.data?.topCustomers || [])
        setTopSuppliers(result.data?.topSuppliers || [])
      } else {
        console.error('API returned error:', result.message)
        setTopCustomers([])
        setTopSuppliers([])
      }
    } catch (error) {
      console.error('Error fetching top:', error)
      setTopCustomers([])
      setTopSuppliers([])
    } finally {
      setLoading(false)
    }
  }, [filterType])

  useEffect(() => {
    if (activeTab === 'persons') {
      fetchPersons()
    } else if (activeTab === 'transactions') {
      fetchTransactions()
    } else if (activeTab === 'top') {
      fetchTop()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  // Debounce search term to reduce filtering operations
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounced(searchTerm)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  // Memoize filtered data to prevent unnecessary recalculations
  const filteredPersonData = useMemo(() => {
    return personData.filter((person) =>
      (searchDebounced === '' || 
        person.name.toLowerCase().includes(searchDebounced.toLowerCase()) ||
        (person.phone && person.phone.includes(searchDebounced)) ||
        (person.email && person.email.toLowerCase().includes(searchDebounced.toLowerCase()))) &&
    (filterType === 'all' || person.type === filterType) &&
    (filterStatus === 'all' || person.status === filterStatus) &&
    (filterCategory === 'all' || person.category === filterCategory)
  )
  }, [personData, searchDebounced, filterType, filterStatus, filterCategory])

  // Memoize stats calculations
  const totalPersons = useMemo(() => 
    stats?.totalPersons || personData.length, 
    [stats?.totalPersons, personData.length]
  )

  const totalCustomers = useMemo(() => 
    stats?.totalCustomers || personData.filter(p => p.type === 'customer').length,
    [stats?.totalCustomers, personData]
  )

  const totalSuppliers = useMemo(() => 
    stats?.totalSuppliers || personData.filter(p => p.type === 'supplier').length,
    [stats?.totalSuppliers, personData]
  )

  const activePersons = useMemo(() => 
    stats?.activePersons || personData.filter(p => p.status === 'active').length,
    [stats?.activePersons, personData]
  )

  const totalReceivables = useMemo(() => 
    stats?.totalReceivables || personData
    .filter(p => p.type === 'customer' && p.currentBalance > 0)
      .reduce((sum, p) => sum + p.currentBalance, 0),
    [stats?.totalReceivables, personData]
  )
  
  const totalPayables = useMemo(() => 
    stats?.totalPayables || personData
    .filter(p => p.type === 'supplier' && p.currentBalance < 0)
      .reduce((sum, p) => sum + Math.abs(p.currentBalance), 0),
    [stats?.totalPayables, personData]
  )

  // Chart data for PieChart - distribution of customers and suppliers
  const pieChartData = useMemo(() => {
    const customers = personData.filter(p => p.type === 'customer').length
    const suppliers = personData.filter(p => p.type === 'supplier').length
    const total = customers + suppliers
    if (total === 0) return []
    return [
      {
        name: 'مشتریان',
        value: Math.round((customers / total) * 100),
        color: '#3B82F6'
      },
      {
        name: 'تامین‌کنندگان',
        value: Math.round((suppliers / total) * 100),
        color: '#10B981'
      }
    ]
  }, [personData])

  // Chart data for BarChart - receivables vs payables
  const barChartData = useMemo(() => [{
    period: 'خلاصه',
    revenue: totalReceivables,
    costOfGoodsSold: totalPayables,
    grossProfit: totalReceivables - totalPayables
  }], [totalReceivables, totalPayables])

  // Chart data for LineChart - transaction trends
  const lineChartData = useMemo(() => {
    if (activeTab !== 'transactions' || transactionData.length === 0) return []
    // گروه‌بندی روزانه
    const dailyData: any = {}
    transactionData.slice(0, 30).forEach(t => {
      const date = new Date(t.date).toISOString().split('T')[0]
      if (!dailyData[date]) {
        dailyData[date] = { sales: 0, profit: 0 }
      }
      if (t.type === 'sale' || t.type === 'receipt') {
        dailyData[date].sales += Math.abs(t.amount || 0)
      } else {
        dailyData[date].profit += Math.abs(t.amount || 0)
      }
    })
    return Object.entries(dailyData).map(([date, data]: [string, any]) => ({
      month: date.slice(5),
      sales: data.sales,
      profit: data.profit
    }))
  }, [transactionData, activeTab])

  const handleViewPerson = useCallback((person: PersonData) => {
    setSelectedPerson(person)
    setShowPersonModal(true)
  }, [])

  const handleEditPerson = useCallback((person: PersonData) => {
    setEditingPerson(person)
    if (person.type === 'customer') {
      const nameParts = person.name.split(' ')
      setFormData({
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        phone: person.phone || '',
        email: person.email || '',
        address: person.address || '',
        creditLimit: person.creditLimit || 0,
        status: person.status || 'active',
        customerType: person.category.includes('VIP') ? 'vip' : person.category.includes('طلایی') ? 'golden' : 'regular',
        notes: person.notes || ''
      })
    } else {
      setFormData({
        name: person.name || '',
        phone: person.phone || '',
        email: person.email || '',
        address: person.address || '',
        creditLimit: person.creditLimit || 0,
        status: person.status || 'active',
        category: person.category === 'مواد غذایی' ? 'food' : person.category === 'تجهیزات' ? 'equipment' : 'other',
        paymentTerms: parseInt(person.paymentTerms) || 30,
        notes: person.notes || ''
      })
    }
    setShowEditModal(true)
  }, [])

  const handleDeletePerson = useCallback(async (person: PersonData) => {
    if (!confirm(`آیا مطمئن هستید که می‌خواهید ${person.name} را حذف کنید؟`)) return
    
    try {
      setLoading(true)
      const apiPath = person.type === 'customer' ? `/api/customers/${person.id}` : `/api/suppliers/${person.id}`
      const response = await fetch(apiPath, {
        method: 'DELETE'
      })
      
      const result = await response.json()
      if (result.success) {
        alert(`${person.type === 'customer' ? 'مشتری' : 'تامین‌کننده'} با موفقیت حذف شد`)
        handleRefresh()
      } else {
        alert('خطا در حذف: ' + result.message)
      }
    } catch (error) {
      console.error('Error deleting person:', error)
      alert('خطا در حذف')
    } finally {
      setLoading(false)
    }
  }, [])

  const handleCreatePerson = useCallback(() => {
    setFormData({
      name: '',
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      address: '',
      creditLimit: 0,
      status: 'active',
      customerType: 'regular',
      category: 'other',
      paymentTerms: 30,
      notes: ''
    })
    setEditingPerson(null)
    setShowCreateModal(true)
  }, [])

  const handleSavePerson = useCallback(async () => {
    try {
      setLoading(true)
      
      if (editingPerson) {
        // Update
        const apiPath = editingPerson.type === 'customer' ? `/api/customers/${editingPerson.id}` : `/api/suppliers/${editingPerson.id}`
        const body = editingPerson.type === 'customer' ? {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          email: formData.email,
          address: formData.address,
          creditLimit: formData.creditLimit,
          status: formData.status,
          customerType: formData.customerType,
          notes: formData.notes
        } : {
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          address: formData.address,
          creditLimit: formData.creditLimit,
          status: formData.status,
          category: formData.category,
          paymentTerms: formData.paymentTerms,
          notes: formData.notes
        }

        const response = await fetch(apiPath, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        })

        const result = await response.json()
        if (result.success) {
          alert('با موفقیت به‌روزرسانی شد')
          setShowEditModal(false)
          setEditingPerson(null)
          handleRefresh()
        } else {
          alert('خطا: ' + result.message)
        }
      } else {
        // Create
        const personType = filterType === 'all' ? createType : filterType
        const body = personType === 'customer' ? {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          email: formData.email,
          address: formData.address,
          creditLimit: formData.creditLimit,
          status: formData.status,
          customerType: formData.customerType,
          notes: formData.notes
        } : {
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          address: formData.address,
          creditLimit: formData.creditLimit,
          status: formData.status,
          category: formData.category,
          paymentTerms: formData.paymentTerms,
          notes: formData.notes
        }

        const apiPath = personType === 'customer' ? '/api/customers' : '/api/suppliers'
        const response = await fetch(apiPath, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        })

        const result = await response.json()
        if (result.success) {
          alert('با موفقیت ایجاد شد')
          setShowCreateModal(false)
          handleRefresh()
        } else {
          alert('خطا: ' + result.message)
        }
      }
    } catch (error) {
      console.error('Error saving person:', error)
      alert('خطا در ذخیره')
    } finally {
      setLoading(false)
    }
  }, [filterType, createType, formData, editingPerson])

  const handleExport = useCallback(async (type: string) => {
    try {
      const params = new URLSearchParams()
      params.append('reportType', activeTab === 'persons' ? 'summary' : activeTab === 'transactions' ? 'transactions' : 'top')
      
      const response = await fetch(`/api/customer-supplier-reports?${params.toString()}`)
      const result = await response.json()
      
      if (result.success) {
        const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: 'application/json' })
        const downloadUrl = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = downloadUrl
        a.download = `report-${type}-${Date.now()}.json`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(downloadUrl)
        document.body.removeChild(a)
        alert(`گزارش ${type} دانلود شد.`)
      }
    } catch (error) {
      alert(`خطا در صادرات گزارش ${type}`)
    }
  }, [activeTab])

  const handlePrint = useCallback(() => {
    window.print()
  }, [])

  const handleRefresh = useCallback(() => {
    if (activeTab === 'persons') {
      fetchPersons()
    } else if (activeTab === 'transactions') {
      fetchTransactions()
    } else if (activeTab === 'top') {
      fetchTop()
    }
  }, [activeTab, fetchPersons, fetchTransactions, fetchTop])

  return (
    <div className="fade-in-animation space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">گزارشات مشتریان و تامین‌کنندگان</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            تحلیل عملکرد، گردش و مانده مشتریان و تامین‌کنندگان برای مدیریت اعتبار و مذاکره.
          </p>
        </div>
        <div className="flex items-center space-x-3 space-x-reverse">
          <button
            onClick={handleCreatePerson}
            className="premium-button flex items-center space-x-2 space-x-reverse"
            disabled={loading}
          >
            <Plus className="w-5 h-5" />
            <span>افزودن {filterType === 'customer' ? 'مشتری' : filterType === 'supplier' ? 'تامین‌کننده' : 'شخص'}</span>
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
            onClick={() => handleExport('مشتریان و تامین‌کنندگان')}
            className="premium-button p-3"
          >
            <Download className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="premium-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">کل اشخاص</h3>
            <Users className="w-6 h-6 text-primary-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{totalPersons}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">شخص ثبت شده</p>
        </div>

        <div className="premium-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">مشتریان</h3>
            <User className="w-6 h-6 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{totalCustomers}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">مشتری فعال</p>
        </div>

        <div className="premium-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">تامین‌کنندگان</h3>
            <Building className="w-6 h-6 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{totalSuppliers}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">تامین‌کننده فعال</p>
        </div>

        <div className="premium-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">مطالبات</h3>
            <DollarSign className="w-6 h-6 text-success-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{totalReceivables.toLocaleString('fa-IR')}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">تومان</p>
        </div>
      </div>
      
      {/* Additional Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="premium-card p-6 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-l-4 border-red-500">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">بدهی‌ها</h3>
            <DollarSign className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{totalPayables.toLocaleString('fa-IR')}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">تومان</p>
        </div>
        <div className="premium-card p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-l-4 border-green-500">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">خالص</h3>
            <Calculator className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <p className={`text-3xl font-bold mb-1 ${(totalReceivables - totalPayables) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {(totalReceivables - totalPayables).toLocaleString('fa-IR')}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">تومان</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="premium-card p-6">
        <div className="flex space-x-1 space-x-reverse bg-gray-100 dark:bg-gray-800 rounded-lg p-1 mb-6">
          <button
            onClick={() => setActiveTab('persons')}
            className={`flex-1 flex items-center justify-center space-x-2 space-x-reverse px-4 py-2 rounded-md transition-all duration-200 ${
              activeTab === 'persons'
                ? 'bg-white dark:bg-gray-700 text-primary-600 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Users className="w-5 h-5" />
            <span>اشخاص</span>
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`flex-1 flex items-center justify-center space-x-2 space-x-reverse px-4 py-2 rounded-md transition-all duration-200 ${
              activeTab === 'transactions'
                ? 'bg-white dark:bg-gray-700 text-primary-600 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Activity className="w-5 h-5" />
            <span>تراکنش‌ها</span>
          </button>
          <button
            onClick={() => setActiveTab('top')}
            className={`flex-1 flex items-center justify-center space-x-2 space-x-reverse px-4 py-2 rounded-md transition-all duration-200 ${
              activeTab === 'top'
                ? 'bg-white dark:bg-gray-700 text-primary-600 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Star className="w-5 h-5" />
            <span>برترین‌ها</span>
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="جستجو شخص..."
              className="premium-input pr-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="premium-input"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">همه انواع</option>
            <option value="customer">مشتری</option>
            <option value="supplier">تامین‌کننده</option>
          </select>
          <select
            className="premium-input"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">همه وضعیت‌ها</option>
            <option value="active">فعال</option>
            <option value="inactive">غیرفعال</option>
            <option value="suspended">تعلیق</option>
          </select>
          <select
            className="premium-input"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="all">همه دسته‌ها</option>
            <option value="مشتری VIP">مشتری VIP</option>
            <option value="مشتری عادی">مشتری عادی</option>
            <option value="مشتری جدید">مشتری جدید</option>
            <option value="تامین‌کننده اصلی">تامین‌کننده اصلی</option>
          </select>
        </div>

        {/* Persons Tab */}
        {activeTab === 'persons' && (
          <div className="space-y-6">
            {/* Charts */}
            {personData.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="premium-card p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2 space-x-reverse">
                    <BarChart3 className="w-6 h-6 text-primary-600" />
                    <span>توزیع مشتریان و تامین‌کنندگان</span>
                  </h2>
                  <div className="h-64 w-full">
                    <PieChart data={pieChartData} />
                  </div>
                </div>
                <div className="premium-card p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2 space-x-reverse">
                    <BarChart3 className="w-6 h-6 text-success-600" />
                    <span>مقایسه مطالبات و بدهی‌ها</span>
                  </h2>
                  <div className="h-64 w-full">
                    <BarChart 
                      data={barChartData}
                      categories={['revenue', 'costOfGoodsSold']}
                      colors={['#10B981', '#EF4444']}
                    />
                  </div>
                </div>
              </div>
            )}
          <div className="overflow-x-auto custom-scrollbar">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="w-8 h-8 animate-spin text-primary-600" />
                </div>
              ) : filteredPersonData.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-16">
                  <div className="w-20 h-20 mb-4 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 flex items-center justify-center">
                    <Users className="w-10 h-10 text-blue-500 dark:text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">هیچ داده‌ای یافت نشد</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-md">
                    برای شروع، داده‌های نمونه اضافه کنید یا گزارش جدید تولید کنید.
                  </p>
                </div>
              ) : (
            <table className="w-full text-right whitespace-nowrap">
              <thead>
                <tr className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-800/50">
                  <th className="px-4 py-3 rounded-r-lg">نام</th>
                  <th className="px-4 py-3">نوع</th>
                  <th className="px-4 py-3">دسته‌بندی</th>
                  <th className="px-4 py-3">تماس</th>
                  <th className="px-4 py-3">حد اعتبار</th>
                  <th className="px-4 py-3">مانده فعلی</th>
                  <th className="px-4 py-3">کل تراکنش‌ها</th>
                  <th className="px-4 py-3">مبلغ کل</th>
                  <th className="px-4 py-3">آخرین تراکنش</th>
                  <th className="px-4 py-3">وضعیت</th>
                  <th className="px-4 py-3 rounded-l-lg">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredPersonData.map(person => (
                  <tr key={person.id} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-3 space-x-reverse">
                        {person.type === 'customer' ? (
                          <User className="w-5 h-5 text-blue-600" />
                        ) : (
                          <Building className="w-5 h-5 text-green-600" />
                        )}
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{person.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{person.address}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {getPersonTypeBadge(person.type)}
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{person.category}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200">
                      <div>
                        <p className="text-sm">{person.phone}</p>
                        <p className="text-xs text-gray-500">{person.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{person.creditLimit.toLocaleString('fa-IR')}</td>
                    <td className="px-4 py-3">
                      <span className={`font-medium ${person.currentBalance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {person.currentBalance.toLocaleString('fa-IR')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{person.totalTransactions}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{person.totalAmount.toLocaleString('fa-IR')}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{person.lastTransactionDate}</td>
                    <td className="px-4 py-3">
                      {getStatusBadge(person.status)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <button
                          onClick={() => handleViewPerson(person)}
                          className="p-1 rounded-full text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                          title="مشاهده جزئیات"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditPerson(person)}
                          className="p-1 rounded-full text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                          title="ویرایش"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeletePerson(person)}
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

        {/* Transactions Tab */}
        {activeTab === 'transactions' && (
          <div className="space-y-6">
            {/* Transaction Chart */}
            {transactionData.length > 0 && (
              <div className="premium-card p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2 space-x-reverse">
                  <TrendingUp className="w-6 h-6 text-primary-600" />
                  <span>روند تراکنش‌ها</span>
                </h2>
                <div className="h-80 w-full">
                  <LineChart data={lineChartData} />
                </div>
              </div>
            )}
          <div className="overflow-x-auto custom-scrollbar">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="w-8 h-8 animate-spin text-primary-600" />
                </div>
              ) : transactionData.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-16">
                  <div className="w-20 h-20 mb-4 rounded-full bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30 flex items-center justify-center">
                    <Activity className="w-10 h-10 text-green-500 dark:text-green-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">هیچ تراکنشی یافت نشد</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-md">
                    هیچ تراکنشی برای نمایش وجود ندارد.
                  </p>
                </div>
              ) : (
            <table className="w-full text-right whitespace-nowrap">
              <thead>
                <tr className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-800/50">
                  <th className="px-4 py-3 rounded-r-lg">تاریخ</th>
                  <th className="px-4 py-3">نوع تراکنش</th>
                  <th className="px-4 py-3">مبلغ</th>
                  <th className="px-4 py-3">مرجع</th>
                  <th className="px-4 py-3">توضیحات</th>
                  <th className="px-4 py-3">شخص</th>
                  <th className="px-4 py-3 rounded-l-lg">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {transactionData.slice(0, 100).map(transaction => (
                  <tr key={transaction.id || (transaction as any)._id} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-4 py-3 text-gray-900 dark:text-white">
                      {transaction.date ? new Date(transaction.date).toLocaleDateString('fa-IR') : ''}
                    </td>
                    <td className="px-4 py-3">
                      {getTransactionTypeBadge(transaction.type)}
                    </td>
                    <td className={`px-4 py-3 font-medium ${
                      transaction.type === 'sale' || transaction.type === 'receipt' 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {Math.abs(transaction.amount || 0).toLocaleString('fa-IR')}
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{transaction.reference}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{transaction.description}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{transaction.user || (transaction as any).personName || ''}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <button className="p-1 rounded-full text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                          <Eye className="w-4 h-4" />
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

        {/* Top Tab */}
        {activeTab === 'top' && (
          <div className="space-y-6">
            {/* Top Customers Chart */}
            {topCustomers.length > 0 && (
              <div className="premium-card p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2 space-x-reverse">
                  <BarChart3 className="w-6 h-6 text-primary-600" />
                  <span>نمودار برترین مشتریان</span>
                </h2>
                <div className="h-64 w-full">
                  <BarChart 
                    data={topCustomers.slice(0, 5).map(c => ({
                      period: c.name.slice(0, 10),
                      revenue: c.totalAmount,
                      grossProfit: c.averageAmount * 10
                    }))}
                    categories={['revenue']}
                    colors={['#3B82F6']}
                  />
                </div>
              </div>
            )}

            {/* Top Customers */}
            <div className="premium-card p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2 space-x-reverse">
                <Star className="w-6 h-6 text-primary-600" />
                <span>برترین مشتریان</span>
              </h2>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="w-8 h-8 animate-spin text-primary-600" />
                </div>
              ) : topCustomers.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-16">
                  <div className="w-20 h-20 mb-4 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 flex items-center justify-center">
                    <Star className="w-10 h-10 text-blue-500 dark:text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">هیچ داده‌ای یافت نشد</h3>
                </div>
              ) : (
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-right whitespace-nowrap">
                  <thead>
                    <tr className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-800/50">
                      <th className="px-4 py-3 rounded-r-lg">نام مشتری</th>
                      <th className="px-4 py-3">مبلغ کل</th>
                      <th className="px-4 py-3">تعداد تراکنش</th>
                      <th className="px-4 py-3">میانگین مبلغ</th>
                      <th className="px-4 py-3">آخرین تراکنش</th>
                      <th className="px-4 py-3 rounded-l-lg">رتبه</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {topCustomers.map((customer, index) => (
                      <tr key={customer.id} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">{customer.name}</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{customer.totalAmount.toLocaleString('fa-IR')}</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{customer.transactionCount}</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{customer.averageAmount.toLocaleString('fa-IR')}</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-200">
                          {customer.lastTransactionDate ? new Date(customer.lastTransactionDate).toLocaleDateString('fa-IR') : ''}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <Award className={`w-5 h-5 ${
                              index === 0 ? 'text-yellow-500' : 
                              index === 1 ? 'text-gray-400' : 
                              index === 2 ? 'text-orange-500' : 'text-gray-300'
                            }`} />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{index + 1}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              )}
            </div>

            {/* Top Suppliers */}
            <div className="premium-card p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2 space-x-reverse">
                <Building className="w-6 h-6 text-success-600" />
                <span>برترین تامین‌کنندگان</span>
              </h2>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="w-8 h-8 animate-spin text-primary-600" />
                </div>
              ) : topSuppliers.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-16">
                  <div className="w-20 h-20 mb-4 rounded-full bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30 flex items-center justify-center">
                    <Building className="w-10 h-10 text-green-500 dark:text-green-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">هیچ داده‌ای یافت نشد</h3>
                </div>
              ) : (
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-right whitespace-nowrap">
                  <thead>
                    <tr className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-800/50">
                      <th className="px-4 py-3 rounded-r-lg">نام تامین‌کننده</th>
                      <th className="px-4 py-3">مبلغ کل</th>
                      <th className="px-4 py-3">تعداد تراکنش</th>
                      <th className="px-4 py-3">میانگین مبلغ</th>
                      <th className="px-4 py-3">آخرین تراکنش</th>
                      <th className="px-4 py-3">شرایط پرداخت</th>
                      <th className="px-4 py-3 rounded-l-lg">رتبه</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {topSuppliers.map((supplier, index) => (
                      <tr key={supplier.id} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">{supplier.name}</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{supplier.totalAmount.toLocaleString('fa-IR')}</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{supplier.transactionCount}</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{supplier.averageAmount.toLocaleString('fa-IR')}</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-200">
                          {supplier.lastTransactionDate ? new Date(supplier.lastTransactionDate).toLocaleDateString('fa-IR') : ''}
                        </td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{supplier.paymentTerms}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <Award className={`w-5 h-5 ${
                              index === 0 ? 'text-yellow-500' : 
                              index === 1 ? 'text-gray-400' : 
                              index === 2 ? 'text-orange-500' : 'text-gray-300'
                            }`} />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{index + 1}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Person Details Modal */}
      {showPersonModal && selectedPerson && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                جزئیات {selectedPerson.name}
              </h2>
              <button
                onClick={() => setShowPersonModal(false)}
                className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {/* Person Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="premium-card p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">اطلاعات شخصی</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">نام:</span>
                    <span className="text-gray-900 dark:text-white">{selectedPerson.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">نوع:</span>
                    {getPersonTypeBadge(selectedPerson.type)}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">دسته‌بندی:</span>
                    <span className="text-gray-900 dark:text-white">{selectedPerson.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">وضعیت:</span>
                    {getStatusBadge(selectedPerson.status)}
                  </div>
                </div>
              </div>

              <div className="premium-card p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">اطلاعات تماس</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">تلفن:</span>
                    <span className="text-gray-900 dark:text-white">{selectedPerson.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">ایمیل:</span>
                    <span className="text-gray-900 dark:text-white">{selectedPerson.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">آدرس:</span>
                    <span className="text-gray-900 dark:text-white">{selectedPerson.address}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Info */}
            <div className="premium-card p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">اطلاعات مالی</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">حد اعتبار</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{selectedPerson.creditLimit.toLocaleString('fa-IR')}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">مانده فعلی</p>
                  <p className={`text-lg font-bold ${selectedPerson.currentBalance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {selectedPerson.currentBalance.toLocaleString('fa-IR')}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">مبلغ کل</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{selectedPerson.totalAmount.toLocaleString('fa-IR')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingPerson && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                ویرایش {editingPerson.type === 'customer' ? 'مشتری' : 'تامین‌کننده'}
              </h2>
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setEditingPerson(null)
                }}
                className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              {editingPerson.type === 'customer' ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">نام</label>
                      <input
                        type="text"
                        className="premium-input"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">نام خانوادگی</label>
                      <input
                        type="text"
                        className="premium-input"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">نوع مشتری</label>
                    <select
                      className="premium-input"
                      value={formData.customerType}
                      onChange={(e) => setFormData({ ...formData, customerType: e.target.value })}
                    >
                      <option value="regular">عادی</option>
                      <option value="vip">VIP</option>
                      <option value="golden">طلایی</option>
                    </select>
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">نام</label>
                  <input
                    type="text"
                    className="premium-input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">تلفن</label>
                <input
                  type="text"
                  className="premium-input"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">ایمیل</label>
                <input
                  type="email"
                  className="premium-input"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">آدرس</label>
                <textarea
                  className="premium-input"
                  rows={3}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">حد اعتبار</label>
                <input
                  type="number"
                  className="premium-input"
                  value={formData.creditLimit}
                  onChange={(e) => setFormData({ ...formData, creditLimit: parseFloat(e.target.value) || 0 })}
                />
              </div>
              {editingPerson.type === 'supplier' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">دسته‌بندی</label>
                    <select
                      className="premium-input"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                      <option value="food">مواد غذایی</option>
                      <option value="equipment">تجهیزات</option>
                      <option value="service">خدمات</option>
                      <option value="other">سایر</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">شرایط پرداخت (روز)</label>
                    <input
                      type="number"
                      className="premium-input"
                      value={formData.paymentTerms}
                      onChange={(e) => setFormData({ ...formData, paymentTerms: parseInt(e.target.value) || 30 })}
                    />
                  </div>
                </>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">وضعیت</label>
                <select
                  className="premium-input"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="active">فعال</option>
                  <option value="inactive">غیرفعال</option>
                  <option value="suspended">تعلیق</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">یادداشت</label>
                <textarea
                  className="premium-input"
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 space-x-reverse mt-6">
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setEditingPerson(null)
                }}
                className="premium-button bg-gray-500 hover:bg-gray-600"
              >
                انصراف
              </button>
              <button
                onClick={handleSavePerson}
                className="premium-button"
                disabled={loading}
              >
                {loading ? 'در حال ذخیره...' : 'ذخیره'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                افزودن {filterType === 'customer' ? 'مشتری' : filterType === 'supplier' ? 'تامین‌کننده' : 'شخص'}
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              {filterType === 'all' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">نوع</label>
                  <select
                    className="premium-input"
                    value={createType}
                    onChange={(e) => setCreateType(e.target.value as 'customer' | 'supplier')}
                  >
                    <option value="customer">مشتری</option>
                    <option value="supplier">تامین‌کننده</option>
                  </select>
                </div>
              )}
              {(filterType === 'customer' || (filterType === 'all' && createType === 'customer')) ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">نام</label>
                      <input
                        type="text"
                        className="premium-input"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">نام خانوادگی</label>
                      <input
                        type="text"
                        className="premium-input"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">نوع مشتری</label>
                    <select
                      className="premium-input"
                      value={formData.customerType}
                      onChange={(e) => setFormData({ ...formData, customerType: e.target.value })}
                    >
                      <option value="regular">عادی</option>
                      <option value="vip">VIP</option>
                      <option value="golden">طلایی</option>
                    </select>
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">نام</label>
                  <input
                    type="text"
                    className="premium-input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">تلفن</label>
                <input
                  type="text"
                  className="premium-input"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">ایمیل</label>
                <input
                  type="email"
                  className="premium-input"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">آدرس</label>
                <textarea
                  className="premium-input"
                  rows={3}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">حد اعتبار</label>
                <input
                  type="number"
                  className="premium-input"
                  value={formData.creditLimit}
                  onChange={(e) => setFormData({ ...formData, creditLimit: parseFloat(e.target.value) || 0 })}
                />
              </div>
              {filterType === 'supplier' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">دسته‌بندی</label>
                    <select
                      className="premium-input"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                      <option value="food">مواد غذایی</option>
                      <option value="equipment">تجهیزات</option>
                      <option value="service">خدمات</option>
                      <option value="other">سایر</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">شرایط پرداخت (روز)</label>
                    <input
                      type="number"
                      className="premium-input"
                      value={formData.paymentTerms}
                      onChange={(e) => setFormData({ ...formData, paymentTerms: parseInt(e.target.value) || 30 })}
                    />
                  </div>
                </>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">وضعیت</label>
                <select
                  className="premium-input"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="active">فعال</option>
                  <option value="inactive">غیرفعال</option>
                  <option value="suspended">تعلیق</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">یادداشت</label>
                <textarea
                  className="premium-input"
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 space-x-reverse mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="premium-button bg-gray-500 hover:bg-gray-600"
              >
                انصراف
              </button>
              <button
                onClick={handleSavePerson}
                className="premium-button"
                disabled={loading}
              >
                {loading ? 'در حال ایجاد...' : 'ایجاد'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="premium-card p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2 space-x-reverse">
          <Zap className="w-6 h-6 text-primary-600" />
          <span>اقدامات سریع</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={() => handleExport('مشتریان')}
            className="premium-card p-4 flex items-center space-x-3 space-x-reverse hover:shadow-glow transition-all duration-300"
          >
            <User className="w-8 h-8 text-blue-600" />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">گزارش مشتریان</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">تحلیل عملکرد مشتریان</p>
            </div>
          </button>
          <button 
            onClick={() => handleExport('تامین‌کنندگان')}
            className="premium-card p-4 flex items-center space-x-3 space-x-reverse hover:shadow-glow transition-all duration-300"
          >
            <Building className="w-8 h-8 text-green-600" />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">گزارش تامین‌کنندگان</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">تحلیل عملکرد تامین‌کنندگان</p>
            </div>
          </button>
          <button 
            onClick={() => handleExport('تراکنش‌ها')}
            className="premium-card p-4 flex items-center space-x-3 space-x-reverse hover:shadow-glow transition-all duration-300"
          >
            <Activity className="w-8 h-8 text-purple-600" />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">گزارش تراکنش‌ها</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">تحلیل گردش مالی</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
