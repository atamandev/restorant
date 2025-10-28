'use client'

import { useState } from 'react'
import { 
  Building, 
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
  FileText,
  BarChart3,
  PieChart,
  Activity,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  CheckSquare,
  Square
} from 'lucide-react'

interface BankAccount {
  id: string
  accountNumber: string
  bankName: string
  branchName: string
  accountType: 'current' | 'savings' | 'business'
  currency: 'IRR' | 'USD' | 'EUR'
  initialBalance: number
  currentBalance: number
  status: 'active' | 'inactive' | 'frozen'
  ownerName: string
  iban?: string
  swiftCode?: string
  description: string
  createdAt: string
  lastReconciled: string
  transactions: BankTransaction[]
}

interface BankTransaction {
  id: string
  accountId: string
  date: string
  type: 'deposit' | 'withdrawal' | 'transfer_in' | 'transfer_out' | 'fee' | 'interest'
  amount: number
  balance: number
  description: string
  reference: string
  category: string
  isReconciled: boolean
  importedFrom: 'manual' | 'csv' | 'api'
  createdAt: string
}

const mockBankAccounts: BankAccount[] = [
  {
    id: '1',
    accountNumber: '1234567890',
    bankName: 'بانک ملی ایران',
    branchName: 'شعبه مرکزی',
    accountType: 'current',
    currency: 'IRR',
    initialBalance: 5000000,
    currentBalance: 7500000,
    status: 'active',
    ownerName: 'رستوران مرکزی',
    iban: 'IR123456789012345678901234',
    swiftCode: 'BMIRIRTH',
    description: 'حساب جاری اصلی رستوران',
    createdAt: '1402/01/01',
    lastReconciled: '1402/10/20',
    transactions: [
      {
        id: '1',
        accountId: '1',
        date: '1402/10/20',
        type: 'deposit',
        amount: 2000000,
        balance: 7500000,
        description: 'واریز فروش روزانه',
        reference: 'SALE-001',
        category: 'فروش',
        isReconciled: true,
        importedFrom: 'manual',
        createdAt: '1402/10/20 14:30'
      },
      {
        id: '2',
        accountId: '1',
        date: '1402/10/19',
        type: 'withdrawal',
        amount: 500000,
        balance: 5500000,
        description: 'پرداخت حقوق کارکنان',
        reference: 'PAY-001',
        category: 'هزینه',
        isReconciled: true,
        importedFrom: 'manual',
        createdAt: '1402/10/19 10:00'
      }
    ]
  },
  {
    id: '2',
    accountNumber: '0987654321',
    bankName: 'بانک صادرات ایران',
    branchName: 'شعبه ولیعصر',
    accountType: 'savings',
    currency: 'IRR',
    initialBalance: 2000000,
    currentBalance: 3200000,
    status: 'active',
    ownerName: 'رستوران مرکزی',
    iban: 'IR098765432109876543210987',
    swiftCode: 'EXIRIRTH',
    description: 'حساب پس‌انداز رستوران',
    createdAt: '1402/01/01',
    lastReconciled: '1402/10/18',
    transactions: [
      {
        id: '3',
        accountId: '2',
        date: '1402/10/18',
        type: 'deposit',
        amount: 1200000,
        balance: 3200000,
        description: 'انتقال از حساب جاری',
        reference: 'TRF-001',
        category: 'انتقال',
        isReconciled: true,
        importedFrom: 'manual',
        createdAt: '1402/10/18 16:00'
      }
    ]
  }
]

export default function BankAccountsPage() {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(mockBankAccounts)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null)
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null)
  const [showTransactionForm, setShowTransactionForm] = useState(false)
  const [showReconcileModal, setShowReconcileModal] = useState(false)

  const [formData, setFormData] = useState({
    accountNumber: '',
    bankName: '',
    branchName: '',
    accountType: 'current' as 'current' | 'savings' | 'business',
    currency: 'IRR' as 'IRR' | 'USD' | 'EUR',
    initialBalance: 0,
    ownerName: '',
    iban: '',
    swiftCode: '',
    description: ''
  })

  const [transactionFormData, setTransactionFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'deposit' as 'deposit' | 'withdrawal' | 'transfer_in' | 'transfer_out' | 'fee' | 'interest',
    amount: 0,
    description: '',
    reference: '',
    category: ''
  })

  const filteredAccounts = bankAccounts.filter(account =>
    (filterStatus === 'all' || account.status === filterStatus) &&
    (filterType === 'all' || account.accountType === filterType) &&
    (account.bankName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.accountNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.ownerName.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const handleSave = () => {
    if (editingAccount) {
      // Update existing account
      const updatedAccount = {
        ...editingAccount,
        accountNumber: formData.accountNumber,
        bankName: formData.bankName,
        branchName: formData.branchName,
        accountType: formData.accountType,
        currency: formData.currency,
        initialBalance: formData.initialBalance,
        ownerName: formData.ownerName,
        iban: formData.iban,
        swiftCode: formData.swiftCode,
        description: formData.description
      }
      setBankAccounts(bankAccounts.map(account => 
        account.id === editingAccount.id ? updatedAccount : account
      ))
    } else {
      // Create new account
      const newAccount: BankAccount = {
        id: Date.now().toString(),
        accountNumber: formData.accountNumber,
        bankName: formData.bankName,
        branchName: formData.branchName,
        accountType: formData.accountType,
        currency: formData.currency,
        initialBalance: formData.initialBalance,
        currentBalance: formData.initialBalance,
        status: 'active',
        ownerName: formData.ownerName,
        iban: formData.iban,
        swiftCode: formData.swiftCode,
        description: formData.description,
        createdAt: new Date().toLocaleString('fa-IR'),
        lastReconciled: '',
        transactions: []
      }
      setBankAccounts([newAccount, ...bankAccounts])
    }
    setShowForm(false)
    setEditingAccount(null)
    resetForm()
  }

  const handleTransactionSave = () => {
    if (selectedAccount) {
      const newTransaction: BankTransaction = {
        id: Date.now().toString(),
        accountId: selectedAccount.id,
        date: transactionFormData.date,
        type: transactionFormData.type,
        amount: transactionFormData.amount,
        balance: selectedAccount.currentBalance + (transactionFormData.type === 'deposit' || transactionFormData.type === 'transfer_in' || transactionFormData.type === 'interest' ? transactionFormData.amount : -transactionFormData.amount),
        description: transactionFormData.description,
        reference: transactionFormData.reference,
        category: transactionFormData.category,
        isReconciled: false,
        importedFrom: 'manual',
        createdAt: new Date().toLocaleString('fa-IR')
      }

      const updatedAccount = {
        ...selectedAccount,
        currentBalance: newTransaction.balance,
        transactions: [newTransaction, ...selectedAccount.transactions]
      }

      setBankAccounts(bankAccounts.map(account => 
        account.id === selectedAccount.id ? updatedAccount : account
      ))
    }
    setShowTransactionForm(false)
    resetTransactionForm()
  }

  const openAddForm = () => {
    setEditingAccount(null)
    resetForm()
    setShowForm(true)
  }

  const openEditForm = (account: BankAccount) => {
    setEditingAccount(account)
    setFormData({
      accountNumber: account.accountNumber,
      bankName: account.bankName,
      branchName: account.branchName,
      accountType: account.accountType,
      currency: account.currency,
      initialBalance: account.initialBalance,
      ownerName: account.ownerName,
      iban: account.iban || '',
      swiftCode: account.swiftCode || '',
      description: account.description
    })
    setShowForm(true)
  }

  const deleteAccount = (id: string) => {
    if (confirm('آیا از حذف این حساب بانکی مطمئن هستید؟')) {
      setBankAccounts(bankAccounts.filter(account => account.id !== id))
    }
  }

  const resetForm = () => {
    setFormData({
      accountNumber: '',
      bankName: '',
      branchName: '',
      accountType: 'current',
      currency: 'IRR',
      initialBalance: 0,
      ownerName: '',
      iban: '',
      swiftCode: '',
      description: ''
    })
  }

  const resetTransactionForm = () => {
    setTransactionFormData({
      date: new Date().toISOString().split('T')[0],
      type: 'deposit',
      amount: 0,
      description: '',
      reference: '',
      category: ''
    })
  }

  const getAccountTypeText = (type: string) => {
    switch (type) {
      case 'current': return 'جاری'
      case 'savings': return 'پس‌انداز'
      case 'business': return 'تجاری'
      default: return 'نامشخص'
    }
  }

  const getAccountTypeColor = (type: string) => {
    switch (type) {
      case 'current': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
      case 'savings': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
      case 'business': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
      case 'inactive': return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
      case 'frozen': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'فعال'
      case 'inactive': return 'غیرفعال'
      case 'frozen': return 'مسدود'
      default: return 'نامشخص'
    }
  }

  const getTransactionTypeIcon = (type: string) => {
    switch (type) {
      case 'deposit': return <ArrowUpRight className="w-4 h-4 text-green-600" />
      case 'withdrawal': return <ArrowDownLeft className="w-4 h-4 text-red-600" />
      case 'transfer_in': return <ArrowUpRight className="w-4 h-4 text-blue-600" />
      case 'transfer_out': return <ArrowDownLeft className="w-4 h-4 text-orange-600" />
      case 'fee': return <ArrowDownLeft className="w-4 h-4 text-red-600" />
      case 'interest': return <ArrowUpRight className="w-4 h-4 text-green-600" />
      default: return null
    }
  }

  const getTransactionTypeText = (type: string) => {
    switch (type) {
      case 'deposit': return 'واریز'
      case 'withdrawal': return 'برداشت'
      case 'transfer_in': return 'انتقال ورودی'
      case 'transfer_out': return 'انتقال خروجی'
      case 'fee': return 'کارمزد'
      case 'interest': return 'سود'
      default: return 'نامشخص'
    }
  }

  const getTotalAccounts = () => bankAccounts.length
  const getTotalBalance = () => bankAccounts.reduce((sum, account) => sum + account.currentBalance, 0)
  const getActiveAccounts = () => bankAccounts.filter(account => account.status === 'active').length
  const getTotalTransactions = () => bankAccounts.reduce((sum, account) => sum + account.transactions.length, 0)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Simulate CSV import
      alert(`فایل ${file.name} با موفقیت آپلود شد. تراکنش‌ها در حال پردازش هستند...`)
      // Here you would implement actual CSV parsing and transaction import
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/80 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold gradient-text mb-2">مدیریت بانک‌ها و حساب‌های بانکی</h1>
          <p className="text-gray-600 dark:text-gray-300">مدیریت حساب‌های بانکی و تراکنش‌های مالی</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="premium-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">کل حساب‌ها</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{getTotalAccounts()}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <Building className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
          <div className="premium-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">کل موجودی</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{getTotalBalance().toLocaleString('fa-IR')}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
          <div className="premium-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">حساب‌های فعال</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{getActiveAccounts()}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
          <div className="premium-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">کل تراکنش‌ها</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{getTotalTransactions()}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-purple-600 dark:text-purple-400" />
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
                  placeholder="جستجو در حساب‌ها..."
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
                <option value="active">فعال</option>
                <option value="inactive">غیرفعال</option>
                <option value="frozen">مسدود</option>
              </select>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">همه انواع</option>
                <option value="current">جاری</option>
                <option value="savings">پس‌انداز</option>
                <option value="business">تجاری</option>
              </select>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <button
                onClick={openAddForm}
                className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>حساب جدید</span>
              </button>
              <label className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer">
                <Upload className="w-4 h-4" />
                <span>آپلود CSV</span>
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              <button className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                <Download className="w-4 h-4" />
                <span>صادر کردن</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bank Accounts List */}
        <div className="premium-card p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">لیست حساب‌های بانکی</h2>
          
          {filteredAccounts.length === 0 ? (
            <div className="text-center py-12">
              <Building className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">هیچ حسابی یافت نشد</h3>
              <p className="text-gray-600 dark:text-gray-400">حساب‌های بانکی رستوران در اینجا نمایش داده می‌شوند</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAccounts.map(account => (
                <div key={account.id} className="premium-card p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                        <Building className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{account.bankName}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{account.branchName}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(account.status)}`}>
                      {getStatusText(account.status)}
                    </span>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">شماره حساب:</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{account.accountNumber}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">نوع حساب:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getAccountTypeColor(account.accountType)}`}>
                        {getAccountTypeText(account.accountType)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">صاحب حساب:</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{account.ownerName}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">موجودی فعلی:</span>
                      <span className="text-lg font-bold text-green-600 dark:text-green-400">
                        {account.currentBalance.toLocaleString('fa-IR')} تومان
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">تعداد تراکنش‌ها:</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{account.transactions.length}</span>
                    </div>
                  </div>

                  <div className="flex space-x-2 space-x-reverse">
                    <button
                      onClick={() => setSelectedAccount(account)}
                      className="flex-1 flex items-center justify-center space-x-2 space-x-reverse px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
                    >
                      <Eye className="w-4 h-4" />
                      <span>مشاهده</span>
                    </button>
                    <button
                      onClick={() => openEditForm(account)}
                      className="flex-1 flex items-center justify-center space-x-2 space-x-reverse px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                    >
                      <Edit className="w-4 h-4" />
                      <span>ویرایش</span>
                    </button>
                    <button
                      onClick={() => deleteAccount(account.id)}
                      className="flex-1 flex items-center justify-center space-x-2 space-x-reverse px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>حذف</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Account Details Modal */}
        {selectedAccount && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-6xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  جزئیات حساب {selectedAccount.accountNumber}
                </h3>
                <button
                  onClick={() => setSelectedAccount(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Account Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">نام بانک</label>
                    <p className="text-gray-900 dark:text-white">{selectedAccount.bankName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">نام شعبه</label>
                    <p className="text-gray-900 dark:text-white">{selectedAccount.branchName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">شماره حساب</label>
                    <p className="text-gray-900 dark:text-white">{selectedAccount.accountNumber}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">نوع حساب</label>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getAccountTypeColor(selectedAccount.accountType)}`}>
                      {getAccountTypeText(selectedAccount.accountType)}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">صاحب حساب</label>
                    <p className="text-gray-900 dark:text-white">{selectedAccount.ownerName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">وضعیت</label>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedAccount.status)}`}>
                      {getStatusText(selectedAccount.status)}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">موجودی اولیه</label>
                    <p className="text-gray-900 dark:text-white">{selectedAccount.initialBalance.toLocaleString('fa-IR')} تومان</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">موجودی فعلی</label>
                    <p className="text-gray-900 dark:text-white font-bold text-green-600 dark:text-green-400">
                      {selectedAccount.currentBalance.toLocaleString('fa-IR')} تومان
                    </p>
                  </div>
                  {selectedAccount.iban && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">شماره شبا</label>
                      <p className="text-gray-900 dark:text-white">{selectedAccount.iban}</p>
                    </div>
                  )}
                  {selectedAccount.swiftCode && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">کد SWIFT</label>
                      <p className="text-gray-900 dark:text-white">{selectedAccount.swiftCode}</p>
                    </div>
                  )}
                </div>

                {/* Transactions */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">تراکنش‌ها</h4>
                    <button
                      onClick={() => setShowTransactionForm(true)}
                      className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>تراکنش جدید</span>
                    </button>
                  </div>
                  
                  {selectedAccount.transactions.length === 0 ? (
                    <div className="text-center py-8">
                      <Activity className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600 dark:text-gray-400">هیچ تراکنشی ثبت نشده است</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-right">
                        <thead>
                          <tr className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-800/50">
                            <th className="px-3 py-2 rounded-r-lg">تاریخ</th>
                            <th className="px-3 py-2">نوع</th>
                            <th className="px-3 py-2">مبلغ</th>
                            <th className="px-3 py-2">موجودی</th>
                            <th className="px-3 py-2">توضیحات</th>
                            <th className="px-3 py-2">مرجع</th>
                            <th className="px-3 py-2">دسته‌بندی</th>
                            <th className="px-3 py-2 rounded-l-lg">وضعیت</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {selectedAccount.transactions.map(transaction => (
                            <tr key={transaction.id} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                              <td className="px-3 py-2 text-gray-700 dark:text-gray-200">{transaction.date}</td>
                              <td className="px-3 py-2">
                                <div className="flex items-center space-x-2 space-x-reverse">
                                  {getTransactionTypeIcon(transaction.type)}
                                  <span className="text-gray-700 dark:text-gray-200">
                                    {getTransactionTypeText(transaction.type)}
                                  </span>
                                </div>
                              </td>
                              <td className="px-3 py-2 text-gray-900 dark:text-white font-medium">
                                {transaction.amount.toLocaleString('fa-IR')} تومان
                              </td>
                              <td className="px-3 py-2 text-gray-700 dark:text-gray-200">
                                {transaction.balance.toLocaleString('fa-IR')} تومان
                              </td>
                              <td className="px-3 py-2 text-gray-700 dark:text-gray-200">{transaction.description}</td>
                              <td className="px-3 py-2 text-gray-700 dark:text-gray-200">{transaction.reference}</td>
                              <td className="px-3 py-2 text-gray-700 dark:text-gray-200">{transaction.category}</td>
                              <td className="px-3 py-2">
                                <div className="flex items-center space-x-2 space-x-reverse">
                                  {transaction.isReconciled ? (
                                    <CheckSquare className="w-4 h-4 text-green-600" />
                                  ) : (
                                    <Square className="w-4 h-4 text-gray-400" />
                                  )}
                                  <span className="text-xs text-gray-600 dark:text-gray-400">
                                    {transaction.isReconciled ? 'تطبیق شده' : 'تطبیق نشده'}
                                  </span>
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
            </div>
          </div>
        )}

        {/* Transaction Form Modal */}
        {showTransactionForm && selectedAccount && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-2xl mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  تراکنش جدید - {selectedAccount.accountNumber}
                </h3>
                <button
                  onClick={() => setShowTransactionForm(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">تاریخ</label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      value={transactionFormData.date}
                      onChange={(e) => setTransactionFormData({...transactionFormData, date: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">نوع تراکنش</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      value={transactionFormData.type}
                      onChange={(e) => setTransactionFormData({...transactionFormData, type: e.target.value as any})}
                    >
                      <option value="deposit">واریز</option>
                      <option value="withdrawal">برداشت</option>
                      <option value="transfer_in">انتقال ورودی</option>
                      <option value="transfer_out">انتقال خروجی</option>
                      <option value="fee">کارمزد</option>
                      <option value="interest">سود</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">مبلغ</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    value={transactionFormData.amount}
                    onChange={(e) => setTransactionFormData({...transactionFormData, amount: parseFloat(e.target.value)})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">توضیحات</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    value={transactionFormData.description}
                    onChange={(e) => setTransactionFormData({...transactionFormData, description: e.target.value})}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">مرجع</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      value={transactionFormData.reference}
                      onChange={(e) => setTransactionFormData({...transactionFormData, reference: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">دسته‌بندی</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      value={transactionFormData.category}
                      onChange={(e) => setTransactionFormData({...transactionFormData, category: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="flex space-x-3 space-x-reverse pt-4">
                  <button
                    onClick={handleTransactionSave}
                    className="flex-1 flex items-center justify-center space-x-2 space-x-reverse px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    <span>ذخیره تراکنش</span>
                  </button>
                  <button
                    onClick={() => setShowTransactionForm(false)}
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

        {/* Account Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {editingAccount ? 'ویرایش حساب بانکی' : 'حساب بانکی جدید'}
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">نام بانک</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      value={formData.bankName}
                      onChange={(e) => setFormData({...formData, bankName: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">نام شعبه</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      value={formData.branchName}
                      onChange={(e) => setFormData({...formData, branchName: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">شماره حساب</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      value={formData.accountNumber}
                      onChange={(e) => setFormData({...formData, accountNumber: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">نوع حساب</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      value={formData.accountType}
                      onChange={(e) => setFormData({...formData, accountType: e.target.value as any})}
                    >
                      <option value="current">جاری</option>
                      <option value="savings">پس‌انداز</option>
                      <option value="business">تجاری</option>
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">موجودی اولیه</label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      value={formData.initialBalance}
                      onChange={(e) => setFormData({...formData, initialBalance: parseFloat(e.target.value)})}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">صاحب حساب</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    value={formData.ownerName}
                    onChange={(e) => setFormData({...formData, ownerName: e.target.value})}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">شماره شبا (اختیاری)</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      value={formData.iban}
                      onChange={(e) => setFormData({...formData, iban: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">کد SWIFT (اختیاری)</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      value={formData.swiftCode}
                      onChange={(e) => setFormData({...formData, swiftCode: e.target.value})}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">توضیحات</label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                </div>
                
                <div className="flex space-x-3 space-x-reverse pt-4">
                  <button
                    onClick={handleSave}
                    className="flex-1 flex items-center justify-center space-x-2 space-x-reverse px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    <span>ذخیره حساب</span>
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
