'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  BookOpen,
  FileSpreadsheet,
  Database,
  Download,
  Search,
  Filter,
  Calendar,
  Building,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Eye,
  Printer,
  RefreshCw,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Users,
  Calculator,
  BarChart3,
  PieChart,
  Activity,
  ArrowUpDown,
  FileText,
  CreditCard,
  Banknote,
  Receipt
} from 'lucide-react'

interface LedgerEntry {
  id: string
  date: string
  documentNumber: string
  description: string
  account: string
  debit: number
  credit: number
  balance: number
  reference: string
  branch: string
  user: string
}

interface GeneralLedgerAccount {
  id: string
  code: string
  name: string
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'
  balance: number
  debitTotal: number
  creditTotal: number
  entries: number
}

interface SubsidiaryLedgerEntry {
  id: string
  date: string
  documentNumber: string
  description: string
  entityName: string
  entityType: 'customer' | 'supplier' | 'employee' | 'other'
  debit: number
  credit: number
  balance: number
  reference: string
}

const mockJournalEntries: LedgerEntry[] = [
  {
    id: '1',
    date: '1403/09/15',
    documentNumber: 'JV-001',
    description: 'ثبت فروش نقدی',
    account: 'صندوق',
    debit: 250000,
    credit: 0,
    balance: 250000,
    reference: 'INV-001',
    branch: 'شعبه مرکزی',
    user: 'احمد محمدی'
  },
  {
    id: '2',
    date: '1403/09/15',
    documentNumber: 'JV-001',
    description: 'ثبت فروش نقدی',
    account: 'فروش',
    debit: 0,
    credit: 250000,
    balance: -250000,
    reference: 'INV-001',
    branch: 'شعبه مرکزی',
    user: 'احمد محمدی'
  },
  {
    id: '3',
    date: '1403/09/15',
    documentNumber: 'JV-002',
    description: 'خرید مواد اولیه',
    account: 'موجودی مواد اولیه',
    debit: 500000,
    credit: 0,
    balance: 500000,
    reference: 'PO-001',
    branch: 'شعبه مرکزی',
    user: 'فاطمه کریمی'
  },
  {
    id: '4',
    date: '1403/09/15',
    documentNumber: 'JV-002',
    description: 'خرید مواد اولیه',
    account: 'حساب‌های پرداختنی',
    debit: 0,
    credit: 500000,
    balance: -500000,
    reference: 'PO-001',
    branch: 'شعبه مرکزی',
    user: 'فاطمه کریمی'
  },
  {
    id: '5',
    date: '1403/09/16',
    documentNumber: 'JV-003',
    description: 'پرداخت حقوق کارکنان',
    account: 'حقوق و دستمزد',
    debit: 800000,
    credit: 0,
    balance: 800000,
    reference: 'PAY-001',
    branch: 'شعبه مرکزی',
    user: 'رضا حسینی'
  },
  {
    id: '6',
    date: '1403/09/16',
    documentNumber: 'JV-003',
    description: 'پرداخت حقوق کارکنان',
    account: 'بانک',
    debit: 0,
    credit: 800000,
    balance: -800000,
    reference: 'PAY-001',
    branch: 'شعبه مرکزی',
    user: 'رضا حسینی'
  }
]

const mockGeneralLedgerAccounts: GeneralLedgerAccount[] = [
  {
    id: '1',
    code: '1000',
    name: 'صندوق',
    type: 'asset',
    balance: 250000,
    debitTotal: 250000,
    creditTotal: 0,
    entries: 1
  },
  {
    id: '2',
    code: '1100',
    name: 'بانک',
    type: 'asset',
    balance: 2000000,
    debitTotal: 2000000,
    creditTotal: 800000,
    entries: 2
  },
  {
    id: '3',
    code: '1200',
    name: 'موجودی مواد اولیه',
    type: 'asset',
    balance: 500000,
    debitTotal: 500000,
    creditTotal: 0,
    entries: 1
  },
  {
    id: '4',
    code: '2000',
    name: 'حساب‌های پرداختنی',
    type: 'liability',
    balance: 500000,
    debitTotal: 0,
    creditTotal: 500000,
    entries: 1
  },
  {
    id: '5',
    code: '4000',
    name: 'فروش',
    type: 'revenue',
    balance: 250000,
    debitTotal: 0,
    creditTotal: 250000,
    entries: 1
  },
  {
    id: '6',
    code: '5000',
    name: 'حقوق و دستمزد',
    type: 'expense',
    balance: 800000,
    debitTotal: 800000,
    creditTotal: 0,
    entries: 1
  }
]

const mockSubsidiaryEntries: SubsidiaryLedgerEntry[] = [
  {
    id: '1',
    date: '1403/09/15',
    documentNumber: 'INV-001',
    description: 'فروش نقدی',
    entityName: 'علی احمدی',
    entityType: 'customer',
    debit: 0,
    credit: 250000,
    balance: -250000,
    reference: 'JV-001'
  },
  {
    id: '2',
    date: '1403/09/15',
    documentNumber: 'INV-002',
    description: 'فروش اعتباری',
    entityName: 'فاطمه کریمی',
    entityType: 'customer',
    debit: 0,
    credit: 180000,
    balance: -180000,
    reference: 'JV-004'
  },
  {
    id: '3',
    date: '1403/09/15',
    documentNumber: 'PO-001',
    description: 'خرید مواد اولیه',
    entityName: 'تامین‌کننده مواد غذایی',
    entityType: 'supplier',
    debit: 500000,
    credit: 0,
    balance: 500000,
    reference: 'JV-002'
  },
  {
    id: '4',
    date: '1403/09/16',
    documentNumber: 'PAY-001',
    description: 'پرداخت حقوق',
    entityName: 'کارکنان رستوران',
    entityType: 'employee',
    debit: 800000,
    credit: 0,
    balance: 800000,
    reference: 'JV-003'
  }
]

const getAccountTypeColor = (type: string) => {
  switch (type) {
    case 'asset': return 'text-green-600 dark:text-green-400'
    case 'liability': return 'text-red-600 dark:text-red-400'
    case 'equity': return 'text-blue-600 dark:text-blue-400'
    case 'revenue': return 'text-purple-600 dark:text-purple-400'
    case 'expense': return 'text-orange-600 dark:text-orange-400'
    default: return 'text-gray-600 dark:text-gray-400'
  }
}

const getEntityTypeColor = (type: string) => {
  switch (type) {
    case 'customer': return 'text-blue-600 dark:text-blue-400'
    case 'supplier': return 'text-green-600 dark:text-green-400'
    case 'employee': return 'text-purple-600 dark:text-purple-400'
    case 'other': return 'text-gray-600 dark:text-gray-400'
    default: return 'text-gray-600 dark:text-gray-400'
  }
}

export default function LedgersPage() {
  const [activeTab, setActiveTab] = useState<'journal' | 'general' | 'subsidiary'>('journal')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterAccount, setFilterAccount] = useState('all')
  const [filterDate, setFilterDate] = useState('')
  const [filterBranch, setFilterBranch] = useState('all')
  const [loading, setLoading] = useState(true)
  const [journalEntries, setJournalEntries] = useState<LedgerEntry[]>([])
  const [generalAccounts, setGeneralAccounts] = useState<GeneralLedgerAccount[]>([])
  const [subsidiaryEntries, setSubsidiaryEntries] = useState<SubsidiaryLedgerEntry[]>([])
  const [fromDate, setFromDate] = useState<string>('')
  const [toDate, setToDate] = useState<string>('')
  const [selectedEntityId, setSelectedEntityId] = useState<string>('')
  const [selectedEntityType, setSelectedEntityType] = useState<'customer' | 'supplier' | 'employee' | 'other'>('customer')

  // تبدیل داده‌های API به فرمت مورد نیاز
  const convertApiDataToJournalEntry = useCallback((item: any): LedgerEntry => {
    return {
      id: item.id || item._id?.toString() || '',
      date: item.date ? new Date(item.date).toLocaleDateString('fa-IR') : new Date().toLocaleDateString('fa-IR'),
      documentNumber: item.documentNumber || '',
      description: item.description || '',
      account: item.account || '',
      debit: item.debit || 0,
      credit: item.credit || 0,
      balance: item.balance || 0,
      reference: item.reference || '',
      branch: item.branch || 'نامشخص',
      user: item.user || 'system'
    }
  }, [])

  const convertApiDataToGeneralAccount = useCallback((item: any): GeneralLedgerAccount => {
    return {
      id: item.id || item._id?.toString() || item.code || '',
      code: item.code || '',
      name: item.name || '',
      type: item.type || 'asset',
      balance: item.balance || 0,
      debitTotal: item.debitTotal || 0,
      creditTotal: item.creditTotal || 0,
      entries: item.entries || 0
    }
  }, [])

  const convertApiDataToSubsidiaryEntry = useCallback((item: any): SubsidiaryLedgerEntry => {
    return {
      id: item.id || item._id?.toString() || '',
      date: item.date ? new Date(item.date).toLocaleDateString('fa-IR') : new Date().toLocaleDateString('fa-IR'),
      documentNumber: item.documentNumber || '',
      description: item.description || '',
      entityName: item.entityName || 'نامشخص',
      entityType: item.entityType || 'customer',
      debit: item.debit || 0,
      credit: item.credit || 0,
      balance: item.balance || 0,
      reference: item.reference || ''
    }
  }, [])

  // دریافت داده از API
  const fetchJournalEntries = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.append('reportType', 'journal')
      if (fromDate) params.append('fromDate', fromDate)
      if (toDate) params.append('toDate', toDate)
      params.append('limit', '1000')

      const response = await fetch(`/api/ledgers?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        const entries = (data.data || []).map(convertApiDataToJournalEntry)
        setJournalEntries(entries)
      } else {
        console.error('Error fetching journal entries:', data.message)
        setJournalEntries([])
      }
    } catch (error) {
      console.error('Error fetching journal entries:', error)
      setJournalEntries([])
    } finally {
      setLoading(false)
    }
  }, [fromDate, toDate, convertApiDataToJournalEntry])

  const fetchGeneralAccounts = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.append('reportType', 'general')
      if (fromDate) params.append('fromDate', fromDate)
      if (toDate) params.append('toDate', toDate)

      const response = await fetch(`/api/ledgers?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        const accounts = (data.data || []).map(convertApiDataToGeneralAccount)
        setGeneralAccounts(accounts)
      } else {
        console.error('Error fetching general accounts:', data.message)
        setGeneralAccounts([])
      }
    } catch (error) {
      console.error('Error fetching general accounts:', error)
      setGeneralAccounts([])
    } finally {
      setLoading(false)
    }
  }, [fromDate, toDate, convertApiDataToGeneralAccount])

  const fetchSubsidiaryEntries = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.append('reportType', 'subsidiary')
      if (selectedEntityId) params.append('entityId', selectedEntityId)
      if (selectedEntityType) params.append('entityType', selectedEntityType)
      if (fromDate) params.append('fromDate', fromDate)
      if (toDate) params.append('toDate', toDate)
      params.append('limit', '1000')

      const response = await fetch(`/api/ledgers?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        const entries = (data.data || []).map(convertApiDataToSubsidiaryEntry)
        setSubsidiaryEntries(entries)
      } else {
        console.error('Error fetching subsidiary entries:', data.message)
        setSubsidiaryEntries([])
      }
    } catch (error) {
      console.error('Error fetching subsidiary entries:', error)
      setSubsidiaryEntries([])
    } finally {
      setLoading(false)
    }
  }, [selectedEntityId, selectedEntityType, fromDate, toDate, convertApiDataToSubsidiaryEntry])

  // بارگذاری داده بر اساس تب فعال
  useEffect(() => {
    if (activeTab === 'journal') {
      fetchJournalEntries()
    } else if (activeTab === 'general') {
      fetchGeneralAccounts()
    } else if (activeTab === 'subsidiary') {
      fetchSubsidiaryEntries()
    }
  }, [activeTab, fetchJournalEntries, fetchGeneralAccounts, fetchSubsidiaryEntries])

  const filteredJournalEntries = journalEntries.filter(entry =>
    (searchTerm === '' || 
      entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.account.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.documentNumber.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (filterAccount === 'all' || entry.account === filterAccount) &&
    (filterDate === '' || entry.date === filterDate) &&
    (filterBranch === 'all' || entry.branch === filterBranch)
  )

  const filteredGeneralAccounts = generalAccounts.filter(account =>
    searchTerm === '' || 
    account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.code.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredSubsidiaryEntries = subsidiaryEntries.filter(entry =>
    (searchTerm === '' || 
      entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.entityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.documentNumber.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (filterDate === '' || entry.date === filterDate)
  )

  const totalDebit = journalEntries.reduce((sum, entry) => sum + entry.debit, 0)
  const totalCredit = journalEntries.reduce((sum, entry) => sum + entry.credit, 0)
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01

  const handleExport = (type: 'journal' | 'general' | 'subsidiary') => {
    alert(`گزارش ${type === 'journal' ? 'دفتر روزنامه' : type === 'general' ? 'دفتر کل' : 'دفتر معین'} به صورت Excel صادر شد.`)
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="fade-in-animation space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">دفاتر مالی</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            مدیریت و مشاهده دفاتر روزنامه، کل و معین برای حسابداری دوبل.
          </p>
        </div>
        <div className="flex items-center space-x-3 space-x-reverse">
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            placeholder="از تاریخ"
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            placeholder="تا تاریخ"
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'در حال بارگذاری...' : 'به‌روزرسانی'}
          </button>
          <button
            onClick={handlePrint}
            className="premium-button p-3"
          >
            <Printer className="w-5 h-5" />
          </button>
          <button
            onClick={() => handleExport(activeTab)}
            className="premium-button p-3"
          >
            <Download className="w-5 h-5" />
          </button>
        </div>
      </div>

      {loading && (
        <div className="text-center py-8">
          <p className="text-gray-600 dark:text-gray-400">در حال بارگذاری داده‌ها...</p>
        </div>
      )}

      {/* Balance Check */}
      <div className={`premium-card p-4 ${isBalanced ? 'border-green-200 bg-green-50 dark:bg-green-900/20' : 'border-red-200 bg-red-50 dark:bg-red-900/20'}`}>
        <div className="flex items-center space-x-3 space-x-reverse">
          {isBalanced ? (
            <CheckCircle className="w-6 h-6 text-green-600" />
          ) : (
            <XCircle className="w-6 h-6 text-red-600" />
          )}
          <div>
            <p className={`font-semibold ${isBalanced ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'}`}>
              {isBalanced ? 'دفاتر متعادل هستند' : 'دفاتر نامتعادل هستند'}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              جمع بدهکار: {totalDebit.toLocaleString('fa-IR')} تومان | جمع بستانکار: {totalCredit.toLocaleString('fa-IR')} تومان
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="premium-card p-6">
        <div className="flex space-x-1 space-x-reverse bg-gray-100 dark:bg-gray-800 rounded-lg p-1 mb-6">
          <button
            onClick={() => setActiveTab('journal')}
            className={`flex-1 flex items-center justify-center space-x-2 space-x-reverse px-4 py-2 rounded-md transition-all duration-200 ${
              activeTab === 'journal'
                ? 'bg-white dark:bg-gray-700 text-primary-600 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <BookOpen className="w-5 h-5" />
            <span>دفتر روزنامه</span>
          </button>
          <button
            onClick={() => setActiveTab('general')}
            className={`flex-1 flex items-center justify-center space-x-2 space-x-reverse px-4 py-2 rounded-md transition-all duration-200 ${
              activeTab === 'general'
                ? 'bg-white dark:bg-gray-700 text-primary-600 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <FileSpreadsheet className="w-5 h-5" />
            <span>دفتر کل</span>
          </button>
          <button
            onClick={() => setActiveTab('subsidiary')}
            className={`flex-1 flex items-center justify-center space-x-2 space-x-reverse px-4 py-2 rounded-md transition-all duration-200 ${
              activeTab === 'subsidiary'
                ? 'bg-white dark:bg-gray-700 text-primary-600 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Database className="w-5 h-5" />
            <span>دفتر معین</span>
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
          {activeTab === 'journal' && (
            <>
              <select
                className="premium-input"
                value={filterAccount}
                onChange={(e) => setFilterAccount(e.target.value)}
              >
                <option value="all">همه حساب‌ها</option>
                <option value="صندوق">صندوق</option>
                <option value="بانک">بانک</option>
                <option value="فروش">فروش</option>
                <option value="موجودی مواد اولیه">موجودی مواد اولیه</option>
                <option value="حساب‌های پرداختنی">حساب‌های پرداختنی</option>
                <option value="حقوق و دستمزد">حقوق و دستمزد</option>
              </select>
              <input
                type="date"
                className="premium-input"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
              />
              <select
                className="premium-input"
                value={filterBranch}
                onChange={(e) => setFilterBranch(e.target.value)}
              >
                <option value="all">همه شعبه‌ها</option>
                <option value="شعبه مرکزی">شعبه مرکزی</option>
              </select>
            </>
          )}
          {activeTab === 'subsidiary' && (
            <input
              type="date"
              className="premium-input"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
          )}
        </div>

        {/* Journal Ledger */}
        {activeTab === 'journal' && (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-right whitespace-nowrap">
              <thead>
                <tr className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-800/50">
                  <th className="px-4 py-3 rounded-r-lg">تاریخ</th>
                  <th className="px-4 py-3">شماره سند</th>
                  <th className="px-4 py-3">شرح</th>
                  <th className="px-4 py-3">حساب</th>
                  <th className="px-4 py-3">بدهکار</th>
                  <th className="px-4 py-3">بستانکار</th>
                  <th className="px-4 py-3">مرجع</th>
                  <th className="px-4 py-3">شعبه</th>
                  <th className="px-4 py-3">کاربر</th>
                  <th className="px-4 py-3 rounded-l-lg">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredJournalEntries.map(entry => (
                  <tr key={entry.id} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-4 py-3 text-gray-900 dark:text-white">{entry.date}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{entry.documentNumber}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{entry.description}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{entry.account}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200">
                      {entry.debit > 0 ? entry.debit.toLocaleString('fa-IR') : '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200">
                      {entry.credit > 0 ? entry.credit.toLocaleString('fa-IR') : '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{entry.reference}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{entry.branch}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{entry.user}</td>
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

        {/* General Ledger */}
        {activeTab === 'general' && (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-right whitespace-nowrap">
              <thead>
                <tr className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-800/50">
                  <th className="px-4 py-3 rounded-r-lg">کد حساب</th>
                  <th className="px-4 py-3">نام حساب</th>
                  <th className="px-4 py-3">نوع حساب</th>
                  <th className="px-4 py-3">جمع بدهکار</th>
                  <th className="px-4 py-3">جمع بستانکار</th>
                  <th className="px-4 py-3">مانده</th>
                  <th className="px-4 py-3">تعداد اسناد</th>
                  <th className="px-4 py-3 rounded-l-lg">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredGeneralAccounts.map(account => (
                  <tr key={account.id} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-4 py-3 text-gray-900 dark:text-white font-mono">{account.code}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{account.name}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getAccountTypeColor(account.type)}`}>
                        {account.type === 'asset' ? 'دارایی' :
                         account.type === 'liability' ? 'بدهی' :
                         account.type === 'equity' ? 'حقوق صاحبان سهام' :
                         account.type === 'revenue' ? 'درآمد' :
                         account.type === 'expense' ? 'هزینه' : account.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200">
                      {account.debitTotal > 0 ? account.debitTotal.toLocaleString('fa-IR') : '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200">
                      {account.creditTotal > 0 ? account.creditTotal.toLocaleString('fa-IR') : '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200">
                      {account.balance.toLocaleString('fa-IR')}
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{account.entries}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <button className="p-1 rounded-full text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-1 rounded-full text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors">
                          <FileText className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Subsidiary Ledger */}
        {activeTab === 'subsidiary' && (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-right whitespace-nowrap">
              <thead>
                <tr className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-800/50">
                  <th className="px-4 py-3 rounded-r-lg">تاریخ</th>
                  <th className="px-4 py-3">شماره سند</th>
                  <th className="px-4 py-3">شرح</th>
                  <th className="px-4 py-3">نام شخص</th>
                  <th className="px-4 py-3">نوع شخص</th>
                  <th className="px-4 py-3">بدهکار</th>
                  <th className="px-4 py-3">بستانکار</th>
                  <th className="px-4 py-3">مانده</th>
                  <th className="px-4 py-3">مرجع</th>
                  <th className="px-4 py-3 rounded-l-lg">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredSubsidiaryEntries.map(entry => (
                  <tr key={entry.id} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-4 py-3 text-gray-900 dark:text-white">{entry.date}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{entry.documentNumber}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{entry.description}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{entry.entityName}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEntityTypeColor(entry.entityType)}`}>
                        {entry.entityType === 'customer' ? 'مشتری' :
                         entry.entityType === 'supplier' ? 'تامین‌کننده' :
                         entry.entityType === 'employee' ? 'کارمند' :
                         entry.entityType === 'other' ? 'سایر' : entry.entityType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200">
                      {entry.debit > 0 ? entry.debit.toLocaleString('fa-IR') : '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200">
                      {entry.credit > 0 ? entry.credit.toLocaleString('fa-IR') : '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200">
                      {entry.balance.toLocaleString('fa-IR')}
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{entry.reference}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <button className="p-1 rounded-full text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-1 rounded-full text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors">
                          <FileText className="w-4 h-4" />
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="premium-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">کل اسناد</h3>
            <FileText className="w-6 h-6 text-primary-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {mockJournalEntries.length}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">سند ثبت شده</p>
        </div>

        <div className="premium-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">کل حساب‌ها</h3>
            <Database className="w-6 h-6 text-success-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {mockGeneralLedgerAccounts.length}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">حساب فعال</p>
        </div>

        <div className="premium-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">اشخاص</h3>
            <Users className="w-6 h-6 text-warning-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {mockSubsidiaryEntries.length}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">شخص ثبت شده</p>
        </div>
      </div>
    </div>
  )
}
