'use client'

import React, { useState } from 'react'
import {
  FileCheck,
  Package,
  Search,
  Filter,
  Calendar,
  Warehouse,
  TrendingUp,
  TrendingDown,
  Download,
  Printer,
  RefreshCw,
  Eye,
  FileText,
  Calculator,
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  User,
  MapPin,
  BarChart3,
  PieChart,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Plus,
  Minus,
  ArrowRightLeft,
  Target,
  Settings,
  Bell,
  Zap,
  Database,
  FileSpreadsheet,
  BookOpen,
  ClipboardList,
  Users,
  Edit,
  Trash2,
  Save,
  Send,
  Play,
  Pause,
  Square
} from 'lucide-react'

interface InventoryCount {
  id: string
  countNumber: string
  type: 'cycle' | 'full'
  warehouse: string
  status: 'draft' | 'in_progress' | 'completed' | 'cancelled'
  createdBy: string
  createdDate: string
  startedDate: string
  completedDate: string
  totalItems: number
  countedItems: number
  discrepancies: number
  totalValue: number
  discrepancyValue: number
  notes: string
}

interface CountItem {
  id: string
  itemName: string
  itemCode: string
  category: string
  unit: string
  systemQuantity: number
  countedQuantity: number
  discrepancy: number
  unitPrice: number
  systemValue: number
  countedValue: number
  discrepancyValue: number
  countedBy: string
  countedDate: string
  notes: string
}

interface Adjustment {
  id: string
  adjustmentNumber: string
  countId: string
  warehouse: string
  type: 'increase' | 'decrease'
  totalItems: number
  totalValue: number
  createdBy: string
  createdDate: string
  status: 'draft' | 'approved' | 'posted'
  items: AdjustmentItem[]
}

interface AdjustmentItem {
  id: string
  itemName: string
  itemCode: string
  quantity: number
  unitPrice: number
  totalValue: number
  reason: string
}

const mockInventoryCounts: InventoryCount[] = [
  {
    id: '1',
    countNumber: 'CNT-001',
    type: 'cycle',
    warehouse: 'انبار اصلی',
    status: 'completed',
    createdBy: 'احمد محمدی',
    createdDate: '1403/09/10',
    startedDate: '1403/09/11',
    completedDate: '1403/09/12',
    totalItems: 50,
    countedItems: 50,
    discrepancies: 3,
    totalValue: 15000000,
    discrepancyValue: 250000,
    notes: 'شمارش دوره‌ای انبار اصلی'
  },
  {
    id: '2',
    countNumber: 'CNT-002',
    type: 'full',
    warehouse: 'انبار مواد اولیه',
    status: 'in_progress',
    createdBy: 'فاطمه کریمی',
    createdDate: '1403/09/15',
    startedDate: '1403/09/15',
    completedDate: '',
    totalItems: 30,
    countedItems: 15,
    discrepancies: 0,
    totalValue: 8000000,
    discrepancyValue: 0,
    notes: 'شمارش کامل انبار مواد اولیه'
  },
  {
    id: '3',
    countNumber: 'CNT-003',
    type: 'cycle',
    warehouse: 'انبار محصولات نهایی',
    status: 'draft',
    createdBy: 'رضا حسینی',
    createdDate: '1403/09/16',
    startedDate: '',
    completedDate: '',
    totalItems: 25,
    countedItems: 0,
    discrepancies: 0,
    totalValue: 5000000,
    discrepancyValue: 0,
    notes: 'شمارش دوره‌ای انبار محصولات نهایی'
  }
]

const mockCountItems: CountItem[] = [
  {
    id: '1',
    itemName: 'برنج ایرانی',
    itemCode: 'RICE-001',
    category: 'مواد اولیه',
    unit: 'کیلوگرم',
    systemQuantity: 50,
    countedQuantity: 48,
    discrepancy: -2,
    unitPrice: 45000,
    systemValue: 2250000,
    countedValue: 2160000,
    discrepancyValue: -90000,
    countedBy: 'احمد محمدی',
    countedDate: '1403/09/12',
    notes: 'کمبود 2 کیلوگرم'
  },
  {
    id: '2',
    itemName: 'گوشت گوساله',
    itemCode: 'MEAT-001',
    category: 'مواد اولیه',
    unit: 'کیلوگرم',
    systemQuantity: 8,
    countedQuantity: 9,
    discrepancy: 1,
    unitPrice: 180000,
    systemValue: 1440000,
    countedValue: 1620000,
    discrepancyValue: 180000,
    countedBy: 'احمد محمدی',
    countedDate: '1403/09/12',
    notes: 'زیادی 1 کیلوگرم'
  },
  {
    id: '3',
    itemName: 'روغن آفتابگردان',
    itemCode: 'OIL-001',
    category: 'مواد اولیه',
    unit: 'لیتر',
    systemQuantity: 2,
    countedQuantity: 1,
    discrepancy: -1,
    unitPrice: 25000,
    systemValue: 50000,
    countedValue: 25000,
    discrepancyValue: -25000,
    countedBy: 'احمد محمدی',
    countedDate: '1403/09/12',
    notes: 'کمبود 1 لیتر'
  }
]

const mockAdjustments: Adjustment[] = [
  {
    id: '1',
    adjustmentNumber: 'ADJ-001',
    countId: '1',
    warehouse: 'انبار اصلی',
    type: 'decrease',
    totalItems: 2,
    totalValue: 115000,
    createdBy: 'احمد محمدی',
    createdDate: '1403/09/13',
    status: 'posted',
    items: [
      {
        id: '1',
        itemName: 'برنج ایرانی',
        itemCode: 'RICE-001',
        quantity: -2,
        unitPrice: 45000,
        totalValue: -90000,
        reason: 'کمبود در شمارش'
      },
      {
        id: '2',
        itemName: 'روغن آفتابگردان',
        itemCode: 'OIL-001',
        quantity: -1,
        unitPrice: 25000,
        totalValue: -25000,
        reason: 'کمبود در شمارش'
      }
    ]
  }
]

const getCountTypeColor = (type: string) => {
  switch (type) {
    case 'cycle': return 'text-blue-600 dark:text-blue-400'
    case 'full': return 'text-green-600 dark:text-green-400'
    default: return 'text-gray-600 dark:text-gray-400'
  }
}

const getCountTypeBadge = (type: string) => {
  switch (type) {
    case 'cycle': return <span className="status-badge bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">دوره‌ای</span>
    case 'full': return <span className="status-badge bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">کامل</span>
    default: return null
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'draft': return 'text-gray-600 dark:text-gray-400'
    case 'in_progress': return 'text-blue-600 dark:text-blue-400'
    case 'completed': return 'text-green-600 dark:text-green-400'
    case 'cancelled': return 'text-red-600 dark:text-red-400'
    case 'approved': return 'text-green-600 dark:text-green-400'
    case 'posted': return 'text-purple-600 dark:text-purple-400'
    default: return 'text-gray-600 dark:text-gray-400'
  }
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'draft': return <span className="status-badge bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300">پیش‌نویس</span>
    case 'in_progress': return <span className="status-badge bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">در حال انجام</span>
    case 'completed': return <span className="status-badge bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">تکمیل شده</span>
    case 'cancelled': return <span className="status-badge bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">لغو شده</span>
    case 'approved': return <span className="status-badge bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">تایید شده</span>
    case 'posted': return <span className="status-badge bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">ثبت شده</span>
    default: return null
  }
}

const getDiscrepancyColor = (discrepancy: number) => {
  if (discrepancy > 0) return 'text-green-600 dark:text-green-400'
  if (discrepancy < 0) return 'text-red-600 dark:text-red-400'
  return 'text-gray-600 dark:text-gray-400'
}

export default function InventoryAuditPage() {
  const [inventoryCounts, setInventoryCounts] = useState<InventoryCount[]>(mockInventoryCounts)
  const [countItems, setCountItems] = useState<CountItem[]>(mockCountItems)
  const [adjustments, setAdjustments] = useState<Adjustment[]>(mockAdjustments)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [filterWarehouse, setFilterWarehouse] = useState('all')
  const [selectedCount, setSelectedCount] = useState<InventoryCount | null>(null)
  const [showCountModal, setShowCountModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'counts' | 'adjustments' | 'reports'>('counts')

  const filteredCounts = inventoryCounts.filter(count =>
    (searchTerm === '' || 
      count.countNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      count.warehouse.toLowerCase().includes(searchTerm.toLowerCase()) ||
      count.createdBy.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (filterStatus === 'all' || count.status === filterStatus) &&
    (filterType === 'all' || count.type === filterType) &&
    (filterWarehouse === 'all' || count.warehouse === filterWarehouse)
  )

  const totalCounts = inventoryCounts.length
  const completedCounts = inventoryCounts.filter(c => c.status === 'completed').length
  const inProgressCounts = inventoryCounts.filter(c => c.status === 'in_progress').length
  const totalDiscrepancies = inventoryCounts.reduce((sum, c) => sum + c.discrepancies, 0)
  const totalDiscrepancyValue = inventoryCounts.reduce((sum, c) => sum + c.discrepancyValue, 0)

  const handleCreateCount = () => {
    setShowCreateModal(true)
  }

  const handleViewCount = (count: InventoryCount) => {
    setSelectedCount(count)
    setShowCountModal(true)
  }

  const handleStartCount = (countId: string) => {
    setInventoryCounts(prev => prev.map(count => 
      count.id === countId 
        ? { ...count, status: 'in_progress' as const, startedDate: '1403/09/16' }
        : count
    ))
    alert('شمارش شروع شد.')
  }

  const handleCompleteCount = (countId: string) => {
    setInventoryCounts(prev => prev.map(count => 
      count.id === countId 
        ? { ...count, status: 'completed' as const, completedDate: '1403/09/16' }
        : count
    ))
    alert('شمارش تکمیل شد.')
  }

  const handleCancelCount = (countId: string) => {
    setInventoryCounts(prev => prev.map(count => 
      count.id === countId 
        ? { ...count, status: 'cancelled' as const }
        : count
    ))
    alert('شمارش لغو شد.')
  }

  const handleCreateAdjustment = (countId: string) => {
    alert('سند تعدیل ایجاد شد.')
  }

  const handleExport = () => {
    alert('گزارش انبارگردانی به صورت Excel صادر شد.')
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="fade-in-animation space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">انبارگردانی</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            شمارش فیزیکی و تطبیق با سیستم برای اصلاح اختلافات موجودی.
          </p>
        </div>
        <div className="flex items-center space-x-3 space-x-reverse">
          <button
            onClick={handleCreateCount}
            className="premium-button flex items-center space-x-2 space-x-reverse"
          >
            <Plus className="w-5 h-5" />
            <span>شمارش جدید</span>
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="premium-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">کل شمارش‌ها</h3>
            <FileCheck className="w-6 h-6 text-primary-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{totalCounts}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">شمارش ثبت شده</p>
        </div>

        <div className="premium-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">تکمیل شده</h3>
            <CheckCircle className="w-6 h-6 text-success-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{completedCounts}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">شمارش تکمیل شده</p>
        </div>

        <div className="premium-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">در حال انجام</h3>
            <Clock className="w-6 h-6 text-warning-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{inProgressCounts}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">شمارش فعال</p>
        </div>

        <div className="premium-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">کل اختلافات</h3>
            <AlertTriangle className="w-6 h-6 text-danger-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{totalDiscrepancies}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">آیتم با اختلاف</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="premium-card p-6">
        <div className="flex space-x-1 space-x-reverse bg-gray-100 dark:bg-gray-800 rounded-lg p-1 mb-6">
          <button
            onClick={() => setActiveTab('counts')}
            className={`flex-1 flex items-center justify-center space-x-2 space-x-reverse px-4 py-2 rounded-md transition-all duration-200 ${
              activeTab === 'counts'
                ? 'bg-white dark:bg-gray-700 text-primary-600 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <FileCheck className="w-5 h-5" />
            <span>شمارش‌ها</span>
          </button>
          <button
            onClick={() => setActiveTab('adjustments')}
            className={`flex-1 flex items-center justify-center space-x-2 space-x-reverse px-4 py-2 rounded-md transition-all duration-200 ${
              activeTab === 'adjustments'
                ? 'bg-white dark:bg-gray-700 text-primary-600 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Calculator className="w-5 h-5" />
            <span>تعدیلات</span>
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`flex-1 flex items-center justify-center space-x-2 space-x-reverse px-4 py-2 rounded-md transition-all duration-200 ${
              activeTab === 'reports'
                ? 'bg-white dark:bg-gray-700 text-primary-600 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span>گزارشات</span>
          </button>
        </div>

        {/* Counts Tab */}
        {activeTab === 'counts' && (
          <>
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="جستجو شمارش..."
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
                <option value="in_progress">در حال انجام</option>
                <option value="completed">تکمیل شده</option>
                <option value="cancelled">لغو شده</option>
              </select>
              <select
                className="premium-input"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="all">همه انواع</option>
                <option value="cycle">دوره‌ای</option>
                <option value="full">کامل</option>
              </select>
              <select
                className="premium-input"
                value={filterWarehouse}
                onChange={(e) => setFilterWarehouse(e.target.value)}
              >
                <option value="all">همه انبارها</option>
                <option value="انبار اصلی">انبار اصلی</option>
                <option value="انبار مواد اولیه">انبار مواد اولیه</option>
                <option value="انبار محصولات نهایی">انبار محصولات نهایی</option>
              </select>
            </div>

            {/* Counts Table */}
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-right whitespace-nowrap">
                <thead>
                  <tr className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-800/50">
                    <th className="px-4 py-3 rounded-r-lg">شماره شمارش</th>
                    <th className="px-4 py-3">نوع</th>
                    <th className="px-4 py-3">انبار</th>
                    <th className="px-4 py-3">ایجادکننده</th>
                    <th className="px-4 py-3">تاریخ ایجاد</th>
                    <th className="px-4 py-3">کل آیتم‌ها</th>
                    <th className="px-4 py-3">شمارش شده</th>
                    <th className="px-4 py-3">اختلافات</th>
                    <th className="px-4 py-3">ارزش اختلاف</th>
                    <th className="px-4 py-3">وضعیت</th>
                    <th className="px-4 py-3 rounded-l-lg">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredCounts.map(count => (
                    <tr key={count.id} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-3 space-x-reverse">
                          <FileCheck className="w-5 h-5 text-primary-600" />
                          <span className="font-medium text-gray-900 dark:text-white">{count.countNumber}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {getCountTypeBadge(count.type)}
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{count.warehouse}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{count.createdBy}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{count.createdDate}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{count.totalItems}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{count.countedItems}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{count.discrepancies}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{count.discrepancyValue.toLocaleString('fa-IR')} تومان</td>
                      <td className="px-4 py-3">
                        {getStatusBadge(count.status)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <button
                            onClick={() => handleViewCount(count)}
                            className="p-1 rounded-full text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {count.status === 'draft' && (
                            <button
                              onClick={() => handleStartCount(count.id)}
                              className="p-1 rounded-full text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                            >
                              <Play className="w-4 h-4" />
                            </button>
                          )}
                          {count.status === 'in_progress' && (
                            <button
                              onClick={() => handleCompleteCount(count.id)}
                              className="p-1 rounded-full text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          {count.status === 'completed' && count.discrepancies > 0 && (
                            <button
                              onClick={() => handleCreateAdjustment(count.id)}
                              className="p-1 rounded-full text-purple-600 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                            >
                              <Calculator className="w-4 h-4" />
                            </button>
                          )}
                          {(count.status === 'draft' || count.status === 'in_progress') && (
                            <button
                              onClick={() => handleCancelCount(count.id)}
                              className="p-1 rounded-full text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
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
          </>
        )}

        {/* Adjustments Tab */}
        {activeTab === 'adjustments' && (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-right whitespace-nowrap">
              <thead>
                <tr className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-800/50">
                  <th className="px-4 py-3 rounded-r-lg">شماره تعدیل</th>
                  <th className="px-4 py-3">شماره شمارش</th>
                  <th className="px-4 py-3">انبار</th>
                  <th className="px-4 py-3">نوع</th>
                  <th className="px-4 py-3">تعداد آیتم‌ها</th>
                  <th className="px-4 py-3">ارزش کل</th>
                  <th className="px-4 py-3">ایجادکننده</th>
                  <th className="px-4 py-3">تاریخ ایجاد</th>
                  <th className="px-4 py-3">وضعیت</th>
                  <th className="px-4 py-3 rounded-l-lg">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {adjustments.map(adjustment => (
                  <tr key={adjustment.id} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-3 space-x-reverse">
                        <Calculator className="w-5 h-5 text-primary-600" />
                        <span className="font-medium text-gray-900 dark:text-white">{adjustment.adjustmentNumber}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{adjustment.countId}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{adjustment.warehouse}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        adjustment.type === 'increase' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                      }`}>
                        {adjustment.type === 'increase' ? 'افزایش' : 'کاهش'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{adjustment.totalItems}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{adjustment.totalValue.toLocaleString('fa-IR')} تومان</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{adjustment.createdBy}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{adjustment.createdDate}</td>
                    <td className="px-4 py-3">
                      {getStatusBadge(adjustment.status)}
                    </td>
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

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="premium-card p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2 space-x-reverse">
                  <PieChart className="w-6 h-6 text-primary-600" />
                  <span>توزیع اختلافات</span>
                </h2>
                <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center text-gray-500 dark:text-gray-400">
                  <p>نمودار دایره‌ای اختلافات در اینجا قرار می‌گیرد.</p>
                </div>
              </div>

              <div className="premium-card p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2 space-x-reverse">
                  <BarChart3 className="w-6 h-6 text-success-600" />
                  <span>روند انبارگردانی</span>
                </h2>
                <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center text-gray-500 dark:text-gray-400">
                  <p>نمودار ستونی روند در اینجا قرار می‌گیرد.</p>
                </div>
              </div>
            </div>

            <div className="premium-card p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2 space-x-reverse">
                <TrendingUp className="w-6 h-6 text-accent-600" />
                <span>تحلیل دقت شمارش</span>
              </h2>
              <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center text-gray-500 dark:text-gray-400">
                <p>نمودار خطی دقت در اینجا قرار می‌گیرد.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Count Details Modal */}
      {showCountModal && selectedCount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                جزئیات شمارش {selectedCount.countNumber}
              </h2>
              <button
                onClick={() => setShowCountModal(false)}
                className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {/* Count Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="premium-card p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">اطلاعات شمارش</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">شماره:</span>
                    <span className="text-gray-900 dark:text-white">{selectedCount.countNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">نوع:</span>
                    {getCountTypeBadge(selectedCount.type)}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">انبار:</span>
                    <span className="text-gray-900 dark:text-white">{selectedCount.warehouse}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">وضعیت:</span>
                    {getStatusBadge(selectedCount.status)}
                  </div>
                </div>
              </div>

              <div className="premium-card p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">آمار شمارش</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">کل آیتم‌ها:</span>
                    <span className="text-gray-900 dark:text-white">{selectedCount.totalItems}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">شمارش شده:</span>
                    <span className="text-gray-900 dark:text-white">{selectedCount.countedItems}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">اختلافات:</span>
                    <span className="text-gray-900 dark:text-white">{selectedCount.discrepancies}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">ارزش اختلاف:</span>
                    <span className="text-gray-900 dark:text-white">{selectedCount.discrepancyValue.toLocaleString('fa-IR')} تومان</span>
                  </div>
                </div>
              </div>

              <div className="premium-card p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">اطلاعات کاربر</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">ایجادکننده:</span>
                    <span className="text-gray-900 dark:text-white">{selectedCount.createdBy}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">تاریخ ایجاد:</span>
                    <span className="text-gray-900 dark:text-white">{selectedCount.createdDate}</span>
                  </div>
                  {selectedCount.startedDate && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">تاریخ شروع:</span>
                      <span className="text-gray-900 dark:text-white">{selectedCount.startedDate}</span>
                    </div>
                  )}
                  {selectedCount.completedDate && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">تاریخ تکمیل:</span>
                      <span className="text-gray-900 dark:text-white">{selectedCount.completedDate}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Count Items */}
            <div className="premium-card p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">آیتم‌های شمارش</h3>
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-right whitespace-nowrap">
                  <thead>
                    <tr className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-800/50">
                      <th className="px-4 py-3 rounded-r-lg">نام آیتم</th>
                      <th className="px-4 py-3">کد</th>
                      <th className="px-4 py-3">دسته‌بندی</th>
                      <th className="px-4 py-3">واحد</th>
                      <th className="px-4 py-3">موجودی سیستم</th>
                      <th className="px-4 py-3">موجودی شمارش</th>
                      <th className="px-4 py-3">اختلاف</th>
                      <th className="px-4 py-3">قیمت واحد</th>
                      <th className="px-4 py-3">ارزش اختلاف</th>
                      <th className="px-4 py-3">شمارش‌کننده</th>
                      <th className="px-4 py-3">تاریخ شمارش</th>
                      <th className="px-4 py-3 rounded-l-lg">یادداشت</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {countItems.map(item => (
                      <tr key={item.id} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <td className="px-4 py-3 text-gray-900 dark:text-white">{item.itemName}</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-200 font-mono">{item.itemCode}</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{item.category}</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{item.unit}</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{item.systemQuantity}</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{item.countedQuantity}</td>
                        <td className={`px-4 py-3 font-medium ${getDiscrepancyColor(item.discrepancy)}`}>
                          {item.discrepancy > 0 ? `+${item.discrepancy}` : item.discrepancy}
                        </td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{item.unitPrice.toLocaleString('fa-IR')}</td>
                        <td className={`px-4 py-3 font-medium ${getDiscrepancyColor(item.discrepancyValue)}`}>
                          {item.discrepancyValue > 0 ? `+${item.discrepancyValue.toLocaleString('fa-IR')}` : item.discrepancyValue.toLocaleString('fa-IR')}
                        </td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{item.countedBy}</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{item.countedDate}</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-200 max-w-xs truncate">{item.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
