'use client'

import React, { useState } from 'react'
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
  PieChart,
  LineChart,
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

const mockPersonData: PersonData[] = [
  {
    id: '1',
    name: 'علی احمدی',
    type: 'customer',
    category: 'مشتری VIP',
    phone: '09123456789',
    email: 'ali.ahmadi@email.com',
    address: 'تهران، خیابان ولیعصر',
    creditLimit: 5000000,
    currentBalance: 2500000,
    totalTransactions: 25,
    totalAmount: 15000000,
    lastTransactionDate: '1403/09/15',
    averageTransactionAmount: 600000,
    paymentTerms: '30 روز',
    status: 'active',
    notes: 'مشتری وفادار و منظم'
  },
  {
    id: '2',
    name: 'فاطمه کریمی',
    type: 'customer',
    category: 'مشتری عادی',
    phone: '09123456790',
    email: 'fateme.karimi@email.com',
    address: 'تهران، خیابان کریمخان',
    creditLimit: 2000000,
    currentBalance: 800000,
    totalTransactions: 15,
    totalAmount: 8000000,
    lastTransactionDate: '1403/09/14',
    averageTransactionAmount: 533333,
    paymentTerms: '15 روز',
    status: 'active',
    notes: 'پرداخت‌های منظم'
  },
  {
    id: '3',
    name: 'تامین‌کننده مواد غذایی',
    type: 'supplier',
    category: 'تامین‌کننده اصلی',
    phone: '02112345678',
    email: 'supplier@food.com',
    address: 'تهران، شهرک صنعتی',
    creditLimit: 10000000,
    currentBalance: -3000000,
    totalTransactions: 45,
    totalAmount: 25000000,
    lastTransactionDate: '1403/09/13',
    averageTransactionAmount: 555556,
    paymentTerms: '45 روز',
    status: 'active',
    notes: 'تامین‌کننده قابل اعتماد'
  },
  {
    id: '4',
    name: 'رضا حسینی',
    type: 'customer',
    category: 'مشتری جدید',
    phone: '09123456791',
    email: 'reza.hosseini@email.com',
    address: 'تهران، خیابان آزادی',
    creditLimit: 1000000,
    currentBalance: 500000,
    totalTransactions: 5,
    totalAmount: 2000000,
    lastTransactionDate: '1403/09/12',
    averageTransactionAmount: 400000,
    paymentTerms: 'نقدی',
    status: 'active',
    notes: 'مشتری جدید با پتانسیل بالا'
  }
]

const mockTransactionData: TransactionData[] = [
  {
    id: '1',
    date: '1403/09/15',
    type: 'sale',
    amount: 500000,
    balance: 2500000,
    reference: 'INV-001',
    description: 'فروش نقدی',
    user: 'احمد محمدی'
  },
  {
    id: '2',
    date: '1403/09/14',
    type: 'payment',
    amount: -200000,
    balance: 2000000,
    reference: 'PAY-001',
    description: 'پرداخت نقدی',
    user: 'علی احمدی'
  },
  {
    id: '3',
    date: '1403/09/13',
    type: 'sale',
    amount: 700000,
    balance: 2200000,
    reference: 'INV-002',
    description: 'فروش اعتباری',
    user: 'فاطمه کریمی'
  }
]

const mockTopCustomers: TopCustomerData[] = [
  {
    id: '1',
    name: 'علی احمدی',
    totalAmount: 15000000,
    transactionCount: 25,
    averageAmount: 600000,
    lastTransactionDate: '1403/09/15',
    growthRate: 15.5
  },
  {
    id: '2',
    name: 'فاطمه کریمی',
    totalAmount: 8000000,
    transactionCount: 15,
    averageAmount: 533333,
    lastTransactionDate: '1403/09/14',
    growthRate: 8.2
  },
  {
    id: '4',
    name: 'رضا حسینی',
    totalAmount: 2000000,
    transactionCount: 5,
    averageAmount: 400000,
    lastTransactionDate: '1403/09/12',
    growthRate: 25.0
  }
]

const mockTopSuppliers: TopSupplierData[] = [
  {
    id: '3',
    name: 'تامین‌کننده مواد غذایی',
    totalAmount: 25000000,
    transactionCount: 45,
    averageAmount: 555556,
    lastTransactionDate: '1403/09/13',
    paymentTerms: '45 روز'
  }
]

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
  const [selectedPerson, setSelectedPerson] = useState<PersonData | null>(null)
  const [showPersonModal, setShowPersonModal] = useState(false)

  const filteredPersonData = mockPersonData.filter(person =>
    (searchTerm === '' || 
      person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.phone.includes(searchTerm) ||
      person.email.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (filterType === 'all' || person.type === filterType) &&
    (filterStatus === 'all' || person.status === filterStatus) &&
    (filterCategory === 'all' || person.category === filterCategory)
  )

  const totalPersons = mockPersonData.length
  const totalCustomers = mockPersonData.filter(p => p.type === 'customer').length
  const totalSuppliers = mockPersonData.filter(p => p.type === 'supplier').length
  const activePersons = mockPersonData.filter(p => p.status === 'active').length

  const totalReceivables = mockPersonData
    .filter(p => p.type === 'customer' && p.currentBalance > 0)
    .reduce((sum, p) => sum + p.currentBalance, 0)
  
  const totalPayables = mockPersonData
    .filter(p => p.type === 'supplier' && p.currentBalance < 0)
    .reduce((sum, p) => sum + Math.abs(p.currentBalance), 0)

  const handleViewPerson = (person: PersonData) => {
    setSelectedPerson(person)
    setShowPersonModal(true)
  }

  const handleExport = (type: string) => {
    alert(`گزارش ${type} به صورت Excel صادر شد.`)
  }

  const handlePrint = () => {
    window.print()
  }

  const handleRefresh = () => {
    alert('گزارشات مشتریان و تامین‌کنندگان بروزرسانی شد.')
  }

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
            onClick={handleRefresh}
            className="premium-button flex items-center space-x-2 space-x-reverse"
          >
            <RefreshCw className="w-5 h-5" />
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
          <div className="overflow-x-auto custom-scrollbar">
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
                        <button className="p-1 rounded-full text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Transactions Tab */}
        {activeTab === 'transactions' && (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-right whitespace-nowrap">
              <thead>
                <tr className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-800/50">
                  <th className="px-4 py-3 rounded-r-lg">تاریخ</th>
                  <th className="px-4 py-3">نوع تراکنش</th>
                  <th className="px-4 py-3">مبلغ</th>
                  <th className="px-4 py-3">مانده</th>
                  <th className="px-4 py-3">مرجع</th>
                  <th className="px-4 py-3">توضیحات</th>
                  <th className="px-4 py-3">کاربر</th>
                  <th className="px-4 py-3 rounded-l-lg">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {mockTransactionData.map(transaction => (
                  <tr key={transaction.id} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-4 py-3 text-gray-900 dark:text-white">{transaction.date}</td>
                    <td className="px-4 py-3">
                      {getTransactionTypeBadge(transaction.type)}
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{transaction.amount.toLocaleString('fa-IR')}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{transaction.balance.toLocaleString('fa-IR')}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{transaction.reference}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{transaction.description}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{transaction.user}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <button className="p-1 rounded-full text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-1 rounded-full text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors">
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Top Tab */}
        {activeTab === 'top' && (
          <div className="space-y-6">
            {/* Top Customers */}
            <div className="premium-card p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2 space-x-reverse">
                <Star className="w-6 h-6 text-primary-600" />
                <span>برترین مشتریان</span>
              </h2>
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-right whitespace-nowrap">
                  <thead>
                    <tr className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-800/50">
                      <th className="px-4 py-3 rounded-r-lg">نام مشتری</th>
                      <th className="px-4 py-3">مبلغ کل</th>
                      <th className="px-4 py-3">تعداد تراکنش</th>
                      <th className="px-4 py-3">میانگین مبلغ</th>
                      <th className="px-4 py-3">آخرین تراکنش</th>
                      <th className="px-4 py-3">نرخ رشد</th>
                      <th className="px-4 py-3 rounded-l-lg">رتبه</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {mockTopCustomers.map((customer, index) => (
                      <tr key={customer.id} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">{customer.name}</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{customer.totalAmount.toLocaleString('fa-IR')}</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{customer.transactionCount}</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{customer.averageAmount.toLocaleString('fa-IR')}</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{customer.lastTransactionDate}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            customer.growthRate > 20 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                              : customer.growthRate > 10
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                          }`}>
                            {customer.growthRate}%
                          </span>
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
            </div>

            {/* Top Suppliers */}
            <div className="premium-card p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2 space-x-reverse">
                <Building className="w-6 h-6 text-success-600" />
                <span>برترین تامین‌کنندگان</span>
              </h2>
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
                    {mockTopSuppliers.map((supplier, index) => (
                      <tr key={supplier.id} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">{supplier.name}</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{supplier.totalAmount.toLocaleString('fa-IR')}</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{supplier.transactionCount}</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{supplier.averageAmount.toLocaleString('fa-IR')}</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{supplier.lastTransactionDate}</td>
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
