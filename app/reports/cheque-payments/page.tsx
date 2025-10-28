'use client'

import React, { useState } from 'react'
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
  PieChart,
  LineChart,
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
  chequeNumber: string
  bankName: string
  amount: number
  dueDate: string
  status: 'in_hand' | 'deposited' | 'cleared' | 'returned' | 'endorsed'
  owner: string
  purpose: string
  reference: string
  daysToDue: number
  isOverdue: boolean
  createdDate: string
  createdBy: string
}

interface PaymentData {
  id: string
  paymentNumber: string
  date: string
  amount: number
  method: 'cash' | 'card' | 'bank_transfer' | 'cheque' | 'credit'
  purpose: string
  person: string
  reference: string
  description: string
  createdBy: string
  branch: string
}

interface CashFlowData {
  date: string
  cashIn: number
  cashOut: number
  netFlow: number
  balance: number
}

const mockChequeData: ChequeData[] = [
  {
    id: '1',
    chequeNumber: 'CH-001',
    bankName: 'بانک ملی',
    amount: 5000000,
    dueDate: '1403/09/20',
    status: 'in_hand',
    owner: 'علی احمدی',
    purpose: 'فروش',
    reference: 'INV-001',
    daysToDue: 5,
    isOverdue: false,
    createdDate: '1403/09/10',
    createdBy: 'احمد محمدی'
  },
  {
    id: '2',
    chequeNumber: 'CH-002',
    bankName: 'بانک صادرات',
    amount: 3000000,
    dueDate: '1403/09/15',
    status: 'deposited',
    owner: 'فاطمه کریمی',
    purpose: 'فروش',
    reference: 'INV-002',
    daysToDue: 0,
    isOverdue: true,
    createdDate: '1403/09/08',
    createdBy: 'فاطمه کریمی'
  },
  {
    id: '3',
    chequeNumber: 'CH-003',
    bankName: 'بانک تجارت',
    amount: 8000000,
    dueDate: '1403/09/25',
    status: 'cleared',
    owner: 'رضا حسینی',
    purpose: 'فروش',
    reference: 'INV-003',
    daysToDue: 10,
    isOverdue: false,
    createdDate: '1403/09/05',
    createdBy: 'رضا حسینی'
  },
  {
    id: '4',
    chequeNumber: 'CH-004',
    bankName: 'بانک ملت',
    amount: 2000000,
    dueDate: '1403/09/12',
    status: 'returned',
    owner: 'مریم نوری',
    purpose: 'فروش',
    reference: 'INV-004',
    daysToDue: -3,
    isOverdue: true,
    createdDate: '1403/09/01',
    createdBy: 'مریم نوری'
  }
]

const mockPaymentData: PaymentData[] = [
  {
    id: '1',
    paymentNumber: 'PAY-001',
    date: '1403/09/15',
    amount: 1500000,
    method: 'cash',
    purpose: 'خرید مواد اولیه',
    person: 'تامین‌کننده مواد غذایی',
    reference: 'PO-001',
    description: 'پرداخت نقدی خرید مواد اولیه',
    createdBy: 'احمد محمدی',
    branch: 'شعبه مرکزی'
  },
  {
    id: '2',
    paymentNumber: 'PAY-002',
    date: '1403/09/15',
    amount: 800000,
    method: 'bank_transfer',
    purpose: 'حقوق کارکنان',
    person: 'کارکنان رستوران',
    reference: 'PAY-001',
    description: 'پرداخت حقوق کارکنان',
    createdBy: 'فاطمه کریمی',
    branch: 'شعبه مرکزی'
  },
  {
    id: '3',
    paymentNumber: 'PAY-003',
    date: '1403/09/14',
    amount: 500000,
    method: 'card',
    purpose: 'هزینه‌های عملیاتی',
    person: 'شرکت خدمات',
    reference: 'EXP-001',
    description: 'پرداخت هزینه‌های عملیاتی',
    createdBy: 'رضا حسینی',
    branch: 'شعبه مرکزی'
  }
]

const mockCashFlowData: CashFlowData[] = [
  { date: '1403/09/15', cashIn: 12000000, cashOut: 8000000, netFlow: 4000000, balance: 4000000 },
  { date: '1403/09/14', cashIn: 10000000, cashOut: 6000000, netFlow: 4000000, balance: 8000000 },
  { date: '1403/09/13', cashIn: 15000000, cashOut: 7000000, netFlow: 8000000, balance: 12000000 },
  { date: '1403/09/12', cashIn: 8000000, cashOut: 9000000, netFlow: -1000000, balance: 4000000 },
  { date: '1403/09/11', cashIn: 12000000, cashOut: 5000000, netFlow: 7000000, balance: 5000000 }
]

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

const getPaymentMethodColor = (method: string) => {
  switch (method) {
    case 'cash': return 'text-green-600 dark:text-green-400'
    case 'card': return 'text-blue-600 dark:text-blue-400'
    case 'bank_transfer': return 'text-purple-600 dark:text-purple-400'
    case 'cheque': return 'text-yellow-600 dark:text-yellow-400'
    case 'credit': return 'text-orange-600 dark:text-orange-400'
    default: return 'text-gray-600 dark:text-gray-400'
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

export default function ChequePaymentReportsPage() {
  const [activeTab, setActiveTab] = useState<'cheques' | 'payments' | 'cashflow'>('cheques')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterMethod, setFilterMethod] = useState('all')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')
  const [filterBank, setFilterBank] = useState('all')

  const filteredChequeData = mockChequeData.filter(cheque =>
    (searchTerm === '' || 
      cheque.chequeNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cheque.owner.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cheque.bankName.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (filterStatus === 'all' || cheque.status === filterStatus) &&
    (filterBank === 'all' || cheque.bankName === filterBank) &&
    (filterDateFrom === '' || cheque.dueDate >= filterDateFrom) &&
    (filterDateTo === '' || cheque.dueDate <= filterDateTo)
  )

  const filteredPaymentData = mockPaymentData.filter(payment =>
    (searchTerm === '' || 
      payment.paymentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.person.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.purpose.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (filterMethod === 'all' || payment.method === filterMethod) &&
    (filterDateFrom === '' || payment.date >= filterDateFrom) &&
    (filterDateTo === '' || payment.date <= filterDateTo)
  )

  const totalCheques = mockChequeData.length
  const totalChequeAmount = mockChequeData.reduce((sum, cheque) => sum + cheque.amount, 0)
  const overdueCheques = mockChequeData.filter(cheque => cheque.isOverdue).length
  const clearedCheques = mockChequeData.filter(cheque => cheque.status === 'cleared').length

  const totalPayments = mockPaymentData.length
  const totalPaymentAmount = mockPaymentData.reduce((sum, payment) => sum + payment.amount, 0)
  const cashPayments = mockPaymentData.filter(payment => payment.method === 'cash').length
  const cardPayments = mockPaymentData.filter(payment => payment.method === 'card').length

  const totalCashIn = mockCashFlowData.reduce((sum, data) => sum + data.cashIn, 0)
  const totalCashOut = mockCashFlowData.reduce((sum, data) => sum + data.cashOut, 0)
  const netCashFlow = totalCashIn - totalCashOut
  const currentBalance = mockCashFlowData[mockCashFlowData.length - 1].balance

  const handleExport = (type: string) => {
    alert(`گزارش ${type} به صورت Excel صادر شد.`)
  }

  const handlePrint = () => {
    window.print()
  }

  const handleRefresh = () => {
    alert('گزارشات چک و پرداخت بروزرسانی شد.')
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
            onClick={() => handleExport('چک و پرداخت')}
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
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">کل چک‌ها</h3>
            <CreditCard className="w-6 h-6 text-primary-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{totalCheques}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">چک ثبت شده</p>
        </div>

        <div className="premium-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">مبلغ کل چک‌ها</h3>
            <DollarSign className="w-6 h-6 text-success-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{totalChequeAmount.toLocaleString('fa-IR')}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">تومان</p>
        </div>

        <div className="premium-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">چک‌های معوق</h3>
            <AlertTriangle className="w-6 h-6 text-danger-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{overdueCheques}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">چک نیاز به پیگیری</p>
        </div>

        <div className="premium-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">چک‌های پاس شده</h3>
            <CheckCircle className="w-6 h-6 text-success-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{clearedCheques}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">چک پاس شده</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="premium-card p-6">
        <div className="flex space-x-1 space-x-reverse bg-gray-100 dark:bg-gray-800 rounded-lg p-1 mb-6">
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
          <button
            onClick={() => setActiveTab('payments')}
            className={`flex-1 flex items-center justify-center space-x-2 space-x-reverse px-4 py-2 rounded-md transition-all duration-200 ${
              activeTab === 'payments'
                ? 'bg-white dark:bg-gray-700 text-primary-600 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Receipt className="w-5 h-5" />
            <span>پرداخت‌ها</span>
          </button>
          <button
            onClick={() => setActiveTab('cashflow')}
            className={`flex-1 flex items-center justify-center space-x-2 space-x-reverse px-4 py-2 rounded-md transition-all duration-200 ${
              activeTab === 'cashflow'
                ? 'bg-white dark:bg-gray-700 text-primary-600 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Activity className="w-5 h-5" />
            <span>جریان نقدی</span>
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="جستجو..."
              className="premium-input pr-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {activeTab === 'cheques' && (
            <>
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
              <select
                className="premium-input"
                value={filterBank}
                onChange={(e) => setFilterBank(e.target.value)}
              >
                <option value="all">همه بانک‌ها</option>
                <option value="بانک ملی">بانک ملی</option>
                <option value="بانک صادرات">بانک صادرات</option>
                <option value="بانک تجارت">بانک تجارت</option>
                <option value="بانک ملت">بانک ملت</option>
              </select>
            </>
          )}
          {activeTab === 'payments' && (
            <select
              className="premium-input"
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
          )}
          <input
            type="date"
            className="premium-input"
            placeholder="از تاریخ"
            value={filterDateFrom}
            onChange={(e) => setFilterDateFrom(e.target.value)}
          />
          <input
            type="date"
            className="premium-input"
            placeholder="تا تاریخ"
            value={filterDateTo}
            onChange={(e) => setFilterDateTo(e.target.value)}
          />
        </div>

        {/* Cheques Tab */}
        {activeTab === 'cheques' && (
          <div className="overflow-x-auto custom-scrollbar">
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
                  <tr key={cheque.id} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-3 space-x-reverse">
                        <CreditCard className="w-5 h-5 text-primary-600" />
                        <span className="font-medium text-gray-900 dark:text-white">{cheque.chequeNumber}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{cheque.bankName}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{cheque.amount.toLocaleString('fa-IR')} تومان</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{cheque.dueDate}</td>
                    <td className="px-4 py-3">
                      {getChequeStatusBadge(cheque.status)}
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{cheque.owner}</td>
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
                        <button className="p-1 rounded-full text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
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

        {/* Payments Tab */}
        {activeTab === 'payments' && (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-right whitespace-nowrap">
              <thead>
                <tr className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-800/50">
                  <th className="px-4 py-3 rounded-r-lg">شماره پرداخت</th>
                  <th className="px-4 py-3">تاریخ</th>
                  <th className="px-4 py-3">مبلغ</th>
                  <th className="px-4 py-3">روش پرداخت</th>
                  <th className="px-4 py-3">بابت</th>
                  <th className="px-4 py-3">شخص</th>
                  <th className="px-4 py-3">مرجع</th>
                  <th className="px-4 py-3">توضیحات</th>
                  <th className="px-4 py-3">ایجادکننده</th>
                  <th className="px-4 py-3">شعبه</th>
                  <th className="px-4 py-3 rounded-l-lg">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredPaymentData.map(payment => (
                  <tr key={payment.id} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-3 space-x-reverse">
                        <Receipt className="w-5 h-5 text-primary-600" />
                        <span className="font-medium text-gray-900 dark:text-white">{payment.paymentNumber}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{payment.date}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{payment.amount.toLocaleString('fa-IR')} تومان</td>
                    <td className="px-4 py-3">
                      {getPaymentMethodBadge(payment.method)}
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{payment.purpose}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{payment.person}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{payment.reference}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200 max-w-xs truncate">{payment.description}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{payment.createdBy}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{payment.branch}</td>
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

        {/* Cash Flow Tab */}
        {activeTab === 'cashflow' && (
          <div className="space-y-6">
            {/* Cash Flow Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="premium-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">کل ورودی</h3>
                  <ArrowUpRight className="w-6 h-6 text-success-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{totalCashIn.toLocaleString('fa-IR')}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">تومان</p>
              </div>

              <div className="premium-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">کل خروجی</h3>
                  <ArrowDownLeft className="w-6 h-6 text-danger-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{totalCashOut.toLocaleString('fa-IR')}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">تومان</p>
              </div>

              <div className="premium-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">جریان خالص</h3>
                  <Activity className="w-6 h-6 text-primary-600" />
                </div>
                <p className={`text-3xl font-bold ${netCashFlow >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                  {netCashFlow.toLocaleString('fa-IR')}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">تومان</p>
              </div>

              <div className="premium-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">موجودی فعلی</h3>
                  <Banknote className="w-6 h-6 text-accent-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{currentBalance.toLocaleString('fa-IR')}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">تومان</p>
              </div>
            </div>

            {/* Cash Flow Chart */}
            <div className="premium-card p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2 space-x-reverse">
                <LineChart className="w-6 h-6 text-primary-600" />
                <span>نمودار جریان نقدی</span>
              </h2>
              <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center text-gray-500 dark:text-gray-400">
                <p>نمودار خطی جریان نقدی در اینجا قرار می‌گیرد.</p>
              </div>
            </div>

            {/* Cash Flow Table */}
            <div className="overflow-x-auto custom-scrollbar">
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
                  {mockCashFlowData.map((data, index) => (
                    <tr key={index} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-4 py-3 text-gray-900 dark:text-white">{data.date}</td>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={() => handleExport('چک‌ها')}
            className="premium-card p-4 flex items-center space-x-3 space-x-reverse hover:shadow-glow transition-all duration-300"
          >
            <CreditCard className="w-8 h-8 text-blue-600" />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">گزارش چک‌ها</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">وضعیت و سررسید چک‌ها</p>
            </div>
          </button>
          <button 
            onClick={() => handleExport('پرداخت‌ها')}
            className="premium-card p-4 flex items-center space-x-3 space-x-reverse hover:shadow-glow transition-all duration-300"
          >
            <Receipt className="w-8 h-8 text-green-600" />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">گزارش پرداخت‌ها</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">تحلیل روش‌های پرداخت</p>
            </div>
          </button>
          <button 
            onClick={() => handleExport('جریان نقدی')}
            className="premium-card p-4 flex items-center space-x-3 space-x-reverse hover:shadow-glow transition-all duration-300"
          >
            <Activity className="w-8 h-8 text-purple-600" />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">گزارش جریان نقدی</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">پیش‌بینی نقدینگی</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
