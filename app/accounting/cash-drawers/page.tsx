'use client'

import { useState } from 'react'
import { 
  CreditCard, 
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
  ArrowLeft,
  Play,
  Pause,
  PlayCircle,
  StopCircle,
  Users,
  Calculator,
  Coins,
  Wallet,
  HandCoins
} from 'lucide-react'

interface CashDrawer {
  id: string
  drawerNumber: string
  branchId: string
  branchName: string
  userId: string
  userName: string
  shiftDate: string
  shiftType: 'morning' | 'afternoon' | 'evening' | 'night'
  status: 'open' | 'closed' | 'suspended'
  openingTime: string
  closingTime?: string
  openingFloat: number
  expectedCash: number
  countedCash: number
  cashDifference: number
  cardTransactions: number
  totalSales: number
  totalRefunds: number
  netSales: number
  notes: string
  discrepancies: CashDiscrepancy[]
  transactions: CashTransaction[]
  createdAt: string
  createdBy: string
}

interface CashDiscrepancy {
  id: string
  type: 'shortage' | 'overage' | 'missing_bill' | 'extra_bill'
  amount: number
  description: string
  resolved: boolean
  resolvedBy?: string
  resolvedAt?: string
  resolution?: string
}

interface CashTransaction {
  id: string
  type: 'sale' | 'refund' | 'cash_in' | 'cash_out' | 'float_adjustment'
  amount: number
  description: string
  timestamp: string
  reference?: string
}

const mockCashDrawers: CashDrawer[] = [
  {
    id: '1',
    drawerNumber: 'DRAWER-001',
    branchId: 'BR-001',
    branchName: 'شعبه مرکزی',
    userId: 'USER-001',
    userName: 'احمد محمدی',
    shiftDate: '1402/10/20',
    shiftType: 'morning',
    status: 'closed',
    openingTime: '1402/10/20 08:00',
    closingTime: '1402/10/20 16:00',
    openingFloat: 500000,
    expectedCash: 2500000,
    countedCash: 2480000,
    cashDifference: -20000,
    cardTransactions: 1200000,
    totalSales: 3700000,
    totalRefunds: 50000,
    netSales: 3650000,
    notes: 'شیفت صبح - فروش خوب',
    discrepancies: [
      {
        id: '1',
        type: 'shortage',
        amount: 20000,
        description: 'کمبود 20 هزار تومان',
        resolved: false
      }
    ],
    transactions: [
      {
        id: '1',
        type: 'sale',
        amount: 150000,
        description: 'فروش غذا',
        timestamp: '1402/10/20 09:30',
        reference: 'SALE-001'
      },
      {
        id: '2',
        type: 'refund',
        amount: 50000,
        description: 'برگشت سفارش',
        timestamp: '1402/10/20 14:15',
        reference: 'REF-001'
      }
    ],
    createdAt: '1402/10/20 08:00',
    createdBy: 'کاربر سیستم'
  },
  {
    id: '2',
    drawerNumber: 'DRAWER-002',
    branchId: 'BR-001',
    branchName: 'شعبه مرکزی',
    userId: 'USER-002',
    userName: 'سارا کریمی',
    shiftDate: '1402/10/20',
    shiftType: 'evening',
    status: 'open',
    openingTime: '1402/10/20 16:00',
    openingFloat: 500000,
    expectedCash: 0,
    countedCash: 0,
    cashDifference: 0,
    cardTransactions: 0,
    totalSales: 0,
    totalRefunds: 0,
    netSales: 0,
    notes: 'شیفت عصر - در حال کار',
    discrepancies: [],
    transactions: [],
    createdAt: '1402/10/20 16:00',
    createdBy: 'کاربر سیستم'
  },
  {
    id: '3',
    drawerNumber: 'DRAWER-003',
    branchId: 'BR-002',
    branchName: 'شعبه شمال',
    userId: 'USER-003',
    userName: 'رضا حسینی',
    shiftDate: '1402/10/19',
    shiftType: 'morning',
    status: 'closed',
    openingTime: '1402/10/19 08:00',
    closingTime: '1402/10/19 16:00',
    openingFloat: 300000,
    expectedCash: 1800000,
    countedCash: 1800000,
    cashDifference: 0,
    cardTransactions: 800000,
    totalSales: 2600000,
    totalRefunds: 0,
    netSales: 2600000,
    notes: 'شیفت صبح - بدون مشکل',
    discrepancies: [],
    transactions: [
      {
        id: '3',
        type: 'sale',
        amount: 200000,
        description: 'فروش غذا',
        timestamp: '1402/10/19 10:45',
        reference: 'SALE-002'
      }
    ],
    createdAt: '1402/10/19 08:00',
    createdBy: 'کاربر سیستم'
  }
]

export default function CashDrawersPage() {
  const [cashDrawers, setCashDrawers] = useState<CashDrawer[]>(mockCashDrawers)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterShift, setFilterShift] = useState('all')
  const [filterBranch, setFilterBranch] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editingDrawer, setEditingDrawer] = useState<CashDrawer | null>(null)
  const [selectedDrawer, setSelectedDrawer] = useState<CashDrawer | null>(null)
  const [showCloseModal, setShowCloseModal] = useState(false)
  const [showOpenModal, setShowOpenModal] = useState(false)

  const [openFormData, setOpenFormData] = useState({
    drawerNumber: '',
    branchId: 'BR-001',
    branchName: 'شعبه مرکزی',
    userId: 'USER-001',
    userName: 'احمد محمدی',
    shiftDate: new Date().toISOString().split('T')[0],
    shiftType: 'morning' as 'morning' | 'afternoon' | 'evening' | 'night',
    openingFloat: 500000,
    notes: ''
  })

  const [closeFormData, setCloseFormData] = useState({
    countedCash: 0,
    notes: '',
    discrepancies: [] as CashDiscrepancy[]
  })

  const filteredDrawers = cashDrawers.filter(drawer =>
    (filterStatus === 'all' || drawer.status === filterStatus) &&
    (filterShift === 'all' || drawer.shiftType === filterShift) &&
    (filterBranch === 'all' || drawer.branchId === filterBranch) &&
    (drawer.drawerNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      drawer.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      drawer.branchName.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const handleOpenDrawer = () => {
    const newDrawer: CashDrawer = {
      id: Date.now().toString(),
      drawerNumber: openFormData.drawerNumber,
      branchId: openFormData.branchId,
      branchName: openFormData.branchName,
      userId: openFormData.userId,
      userName: openFormData.userName,
      shiftDate: openFormData.shiftDate,
      shiftType: openFormData.shiftType,
      status: 'open',
      openingTime: new Date().toLocaleString('fa-IR'),
      openingFloat: openFormData.openingFloat,
      expectedCash: 0,
      countedCash: 0,
      cashDifference: 0,
      cardTransactions: 0,
      totalSales: 0,
      totalRefunds: 0,
      netSales: 0,
      notes: openFormData.notes,
      discrepancies: [],
      transactions: [],
      createdAt: new Date().toLocaleString('fa-IR'),
      createdBy: 'کاربر سیستم'
    }
    setCashDrawers([newDrawer, ...cashDrawers])
    setShowOpenModal(false)
    resetOpenForm()
  }

  const handleCloseDrawer = () => {
    if (selectedDrawer) {
      const updatedDrawer = {
        ...selectedDrawer,
        status: 'closed' as const,
        closingTime: new Date().toLocaleString('fa-IR'),
        countedCash: closeFormData.countedCash,
        cashDifference: closeFormData.countedCash - selectedDrawer.expectedCash,
        notes: closeFormData.notes,
        discrepancies: closeFormData.discrepancies
      }
      setCashDrawers(cashDrawers.map(drawer => 
        drawer.id === selectedDrawer.id ? updatedDrawer : drawer
      ))
    }
    setShowCloseModal(false)
    resetCloseForm()
  }

  const resetOpenForm = () => {
    setOpenFormData({
      drawerNumber: '',
      branchId: 'BR-001',
      branchName: 'شعبه مرکزی',
      userId: 'USER-001',
      userName: 'احمد محمدی',
      shiftDate: new Date().toISOString().split('T')[0],
      shiftType: 'morning',
      openingFloat: 500000,
      notes: ''
    })
  }

  const resetCloseForm = () => {
    setCloseFormData({
      countedCash: 0,
      notes: '',
      discrepancies: []
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
      case 'closed': return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
      case 'suspended': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'open': return 'باز'
      case 'closed': return 'بسته'
      case 'suspended': return 'تعلیق'
      default: return 'نامشخص'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <PlayCircle className="w-4 h-4 text-green-600" />
      case 'closed': return <StopCircle className="w-4 h-4 text-gray-600" />
      case 'suspended': return <Pause className="w-4 h-4 text-yellow-600" />
      default: return null
    }
  }

  const getShiftTypeText = (type: string) => {
    switch (type) {
      case 'morning': return 'صبح'
      case 'afternoon': return 'ظهر'
      case 'evening': return 'عصر'
      case 'night': return 'شب'
      default: return 'نامشخص'
    }
  }

  const getShiftTypeColor = (type: string) => {
    switch (type) {
      case 'morning': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
      case 'afternoon': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
      case 'evening': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
      case 'night': return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
    }
  }

  const getTotalDrawers = () => cashDrawers.length
  const getOpenDrawers = () => cashDrawers.filter(drawer => drawer.status === 'open').length
  const getClosedDrawers = () => cashDrawers.filter(drawer => drawer.status === 'closed').length
  const getTotalSales = () => cashDrawers.reduce((sum, drawer) => sum + drawer.netSales, 0)
  const getTotalDiscrepancies = () => cashDrawers.reduce((sum, drawer) => sum + Math.abs(drawer.cashDifference), 0)
  const getDrawersWithDiscrepancies = () => cashDrawers.filter(drawer => drawer.cashDifference !== 0).length

  const isDrawerOverdue = (drawer: CashDrawer) => {
    if (drawer.status !== 'open') return false
    const openingTime = new Date(drawer.openingTime)
    const now = new Date()
    const hoursDiff = (now.getTime() - openingTime.getTime()) / (1000 * 60 * 60)
    return hoursDiff > 8 // بیش از 8 ساعت باز
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/80 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold gradient-text mb-2">مدیریت کشو پول</h1>
          <p className="text-gray-600 dark:text-gray-300">مدیریت کشوهای پول و شیفت‌های کاری</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-8">
          <div className="premium-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">کل کشوها</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{getTotalDrawers()}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
          <div className="premium-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">کشوهای باز</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{getOpenDrawers()}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <PlayCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
          <div className="premium-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">کشوهای بسته</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{getClosedDrawers()}</p>
              </div>
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                <StopCircle className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              </div>
            </div>
          </div>
          <div className="premium-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">کل فروش</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{getTotalSales().toLocaleString('fa-IR')}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
          <div className="premium-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">کل مغایرت</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{getTotalDiscrepancies().toLocaleString('fa-IR')}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </div>
          <div className="premium-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">کشوهای مغایر</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{getDrawersWithDiscrepancies()}</p>
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
                  placeholder="جستجو در کشوها..."
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
                <option value="open">باز</option>
                <option value="closed">بسته</option>
                <option value="suspended">تعلیق</option>
              </select>
              <select
                value={filterShift}
                onChange={(e) => setFilterShift(e.target.value)}
                className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">همه شیفت‌ها</option>
                <option value="morning">صبح</option>
                <option value="afternoon">ظهر</option>
                <option value="evening">عصر</option>
                <option value="night">شب</option>
              </select>
              <select
                value={filterBranch}
                onChange={(e) => setFilterBranch(e.target.value)}
                className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">همه شعبه‌ها</option>
                <option value="BR-001">شعبه مرکزی</option>
                <option value="BR-002">شعبه شمال</option>
              </select>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <button
                onClick={() => setShowOpenModal(true)}
                className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Play className="w-4 h-4" />
                <span>باز کردن کشو</span>
              </button>
              <button className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                <Download className="w-4 h-4" />
                <span>صادر کردن</span>
              </button>
            </div>
          </div>
        </div>

        {/* Cash Drawers List */}
        <div className="premium-card p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">لیست کشوهای پول</h2>
          
          {filteredDrawers.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">هیچ کشویی یافت نشد</h3>
              <p className="text-gray-600 dark:text-gray-400">کشوهای پول رستوران در اینجا نمایش داده می‌شوند</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead>
                  <tr className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-800/50">
                    <th className="px-4 py-3 rounded-r-lg">شماره کشو</th>
                    <th className="px-4 py-3">شعبه</th>
                    <th className="px-4 py-3">اپراتور</th>
                    <th className="px-4 py-3">شیفت</th>
                    <th className="px-4 py-3">تاریخ</th>
                    <th className="px-4 py-3">وضعیت</th>
                    <th className="px-4 py-3">موجودی اولیه</th>
                    <th className="px-4 py-3">فروش خالص</th>
                    <th className="px-4 py-3">مغایرت</th>
                    <th className="px-4 py-3 rounded-l-lg">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredDrawers.map(drawer => (
                    <tr key={drawer.id} className={`bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                      isDrawerOverdue(drawer) ? 'border-r-4 border-red-500' : ''
                    }`}>
                      <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">{drawer.drawerNumber}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{drawer.branchName}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{drawer.userName}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getShiftTypeColor(drawer.shiftType)}`}>
                          {getShiftTypeText(drawer.shiftType)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{drawer.shiftDate}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          {getStatusIcon(drawer.status)}
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(drawer.status)}`}>
                            {getStatusText(drawer.status)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200">
                        {drawer.openingFloat.toLocaleString('fa-IR')} تومان
                      </td>
                      <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">
                        {drawer.netSales.toLocaleString('fa-IR')} تومان
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-medium ${
                          drawer.cashDifference > 0 ? 'text-green-600 dark:text-green-400' :
                          drawer.cashDifference < 0 ? 'text-red-600 dark:text-red-400' :
                          'text-gray-600 dark:text-gray-400'
                        }`}>
                          {drawer.cashDifference > 0 ? '+' : ''}{drawer.cashDifference.toLocaleString('fa-IR')} تومان
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex space-x-2 space-x-reverse">
                          <button
                            onClick={() => setSelectedDrawer(drawer)}
                            className="p-2 rounded-full text-primary-600 hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {drawer.status === 'open' && (
                            <button
                              onClick={() => {
                                setSelectedDrawer(drawer)
                                setCloseFormData({
                                  countedCash: drawer.expectedCash,
                                  notes: drawer.notes,
                                  discrepancies: drawer.discrepancies
                                })
                                setShowCloseModal(true)
                              }}
                              className="p-2 rounded-full text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                            >
                              <Square className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Drawer Details Modal */}
        {selectedDrawer && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  جزئیات کشو {selectedDrawer.drawerNumber}
                </h3>
                <button
                  onClick={() => setSelectedDrawer(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Drawer Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">شماره کشو</label>
                    <p className="text-gray-900 dark:text-white">{selectedDrawer.drawerNumber}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">شعبه</label>
                    <p className="text-gray-900 dark:text-white">{selectedDrawer.branchName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">اپراتور</label>
                    <p className="text-gray-900 dark:text-white">{selectedDrawer.userName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">شیفت</label>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getShiftTypeColor(selectedDrawer.shiftType)}`}>
                      {getShiftTypeText(selectedDrawer.shiftType)}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">تاریخ شیفت</label>
                    <p className="text-gray-900 dark:text-white">{selectedDrawer.shiftDate}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">وضعیت</label>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      {getStatusIcon(selectedDrawer.status)}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedDrawer.status)}`}>
                        {getStatusText(selectedDrawer.status)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">زمان باز شدن</label>
                    <p className="text-gray-900 dark:text-white">{selectedDrawer.openingTime}</p>
                  </div>
                  {selectedDrawer.closingTime && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">زمان بسته شدن</label>
                      <p className="text-gray-900 dark:text-white">{selectedDrawer.closingTime}</p>
                    </div>
                  )}
                </div>

                {/* Financial Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">موجودی اولیه</label>
                    <p className="text-gray-900 dark:text-white font-bold">{selectedDrawer.openingFloat.toLocaleString('fa-IR')} تومان</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">فروش خالص</label>
                    <p className="text-gray-900 dark:text-white font-bold">{selectedDrawer.netSales.toLocaleString('fa-IR')} تومان</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">موجودی مورد انتظار</label>
                    <p className="text-gray-900 dark:text-white">{selectedDrawer.expectedCash.toLocaleString('fa-IR')} تومان</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">موجودی شمارش شده</label>
                    <p className="text-gray-900 dark:text-white">{selectedDrawer.countedCash.toLocaleString('fa-IR')} تومان</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">مغایرت</label>
                    <p className={`font-bold ${
                      selectedDrawer.cashDifference > 0 ? 'text-green-600 dark:text-green-400' :
                      selectedDrawer.cashDifference < 0 ? 'text-red-600 dark:text-red-400' :
                      'text-gray-600 dark:text-gray-400'
                    }`}>
                      {selectedDrawer.cashDifference > 0 ? '+' : ''}{selectedDrawer.cashDifference.toLocaleString('fa-IR')} تومان
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">تراکنشات کارتی</label>
                    <p className="text-gray-900 dark:text-white">{selectedDrawer.cardTransactions.toLocaleString('fa-IR')} تومان</p>
                  </div>
                </div>

                {/* Discrepancies */}
                {selectedDrawer.discrepancies.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">مغایرت‌ها</label>
                    <div className="space-y-2">
                      {selectedDrawer.discrepancies.map(discrepancy => (
                        <div key={discrepancy.id} className="p-3 bg-red-50 dark:bg-red-900/30 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="text-red-800 dark:text-red-300 font-medium">
                              {discrepancy.type === 'shortage' ? 'کمبود' : 
                               discrepancy.type === 'overage' ? 'اضافی' :
                               discrepancy.type === 'missing_bill' ? 'اسکناس گمشده' : 'اسکناس اضافی'}
                            </span>
                            <span className="text-red-600 dark:text-red-400 font-bold">
                              {discrepancy.amount.toLocaleString('fa-IR')} تومان
                            </span>
                          </div>
                          <p className="text-red-700 dark:text-red-400 text-sm mt-1">{discrepancy.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {selectedDrawer.notes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">یادداشت</label>
                    <p className="text-gray-900 dark:text-white p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      {selectedDrawer.notes}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-3 space-x-reverse pt-4 border-t border-gray-200 dark:border-gray-600">
                  <button className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                    <Printer className="w-4 h-4" />
                    <span>چاپ گزارش</span>
                  </button>
                  {selectedDrawer.status === 'open' && (
                    <button
                      onClick={() => {
                        setCloseFormData({
                          countedCash: selectedDrawer.expectedCash,
                          notes: selectedDrawer.notes,
                          discrepancies: selectedDrawer.discrepancies
                        })
                        setShowCloseModal(true)
                      }}
                      className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <Square className="w-4 h-4" />
                      <span>بستن کشو</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Open Drawer Modal */}
        {showOpenModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-2xl mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  باز کردن کشو جدید
                </h3>
                <button
                  onClick={() => setShowOpenModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">شماره کشو</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      value={openFormData.drawerNumber}
                      onChange={(e) => setOpenFormData({...openFormData, drawerNumber: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">شعبه</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      value={openFormData.branchId}
                      onChange={(e) => setOpenFormData({...openFormData, branchId: e.target.value, branchName: e.target.selectedOptions[0].text})}
                    >
                      <option value="BR-001">شعبه مرکزی</option>
                      <option value="BR-002">شعبه شمال</option>
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">اپراتور</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      value={openFormData.userId}
                      onChange={(e) => setOpenFormData({...openFormData, userId: e.target.value, userName: e.target.selectedOptions[0].text})}
                    >
                      <option value="USER-001">احمد محمدی</option>
                      <option value="USER-002">سارا کریمی</option>
                      <option value="USER-003">رضا حسینی</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">نوع شیفت</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      value={openFormData.shiftType}
                      onChange={(e) => setOpenFormData({...openFormData, shiftType: e.target.value as any})}
                    >
                      <option value="morning">صبح</option>
                      <option value="afternoon">ظهر</option>
                      <option value="evening">عصر</option>
                      <option value="night">شب</option>
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">تاریخ شیفت</label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      value={openFormData.shiftDate}
                      onChange={(e) => setOpenFormData({...openFormData, shiftDate: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">موجودی اولیه</label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      value={openFormData.openingFloat}
                      onChange={(e) => setOpenFormData({...openFormData, openingFloat: parseFloat(e.target.value)})}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">یادداشت</label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    rows={3}
                    value={openFormData.notes}
                    onChange={(e) => setOpenFormData({...openFormData, notes: e.target.value})}
                  />
                </div>
                
                <div className="flex space-x-3 space-x-reverse pt-4">
                  <button
                    onClick={handleOpenDrawer}
                    className="flex-1 flex items-center justify-center space-x-2 space-x-reverse px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Play className="w-4 h-4" />
                    <span>باز کردن کشو</span>
                  </button>
                  <button
                    onClick={() => setShowOpenModal(false)}
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

        {/* Close Drawer Modal */}
        {showCloseModal && selectedDrawer && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-2xl mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  بستن کشو {selectedDrawer.drawerNumber}
                </h3>
                <button
                  onClick={() => setShowCloseModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">خلاصه کشو</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">موجودی اولیه:</span>
                      <span className="text-gray-900 dark:text-white font-medium mr-2">{selectedDrawer.openingFloat.toLocaleString('fa-IR')} تومان</span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">فروش خالص:</span>
                      <span className="text-gray-900 dark:text-white font-medium mr-2">{selectedDrawer.netSales.toLocaleString('fa-IR')} تومان</span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">موجودی مورد انتظار:</span>
                      <span className="text-gray-900 dark:text-white font-medium mr-2">{selectedDrawer.expectedCash.toLocaleString('fa-IR')} تومان</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">موجودی شمارش شده</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    value={closeFormData.countedCash}
                    onChange={(e) => setCloseFormData({...closeFormData, countedCash: parseFloat(e.target.value)})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">یادداشت</label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    rows={3}
                    value={closeFormData.notes}
                    onChange={(e) => setCloseFormData({...closeFormData, notes: e.target.value})}
                  />
                </div>
                
                <div className="flex space-x-3 space-x-reverse pt-4">
                  <button
                    onClick={handleCloseDrawer}
                    className="flex-1 flex items-center justify-center space-x-2 space-x-reverse px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <Square className="w-4 h-4" />
                    <span>بستن کشو</span>
                  </button>
                  <button
                    onClick={() => setShowCloseModal(false)}
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
