'use client'

import React, { useState } from 'react'
import {
  History,
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
  ClipboardList
} from 'lucide-react'

interface LedgerEntry {
  id: string
  date: string
  documentNumber: string
  documentType: 'receipt' | 'issue' | 'transfer_in' | 'transfer_out' | 'adjustment' | 'count'
  description: string
  warehouse: string
  user: string
  quantityIn: number
  quantityOut: number
  unitPrice: number
  totalValue: number
  runningBalance: number
  runningValue: number
  reference: string
  notes: string
}

interface Item {
  id: string
  name: string
  code: string
  category: string
  unit: string
  currentStock: number
  currentValue: number
  averagePrice: number
  valuationMethod: 'fifo' | 'weighted_average' | 'lifo'
}

const mockItems: Item[] = [
  {
    id: '1',
    name: 'برنج ایرانی',
    code: 'RICE-001',
    category: 'مواد اولیه',
    unit: 'کیلوگرم',
    currentStock: 50,
    currentValue: 2250000,
    averagePrice: 45000,
    valuationMethod: 'weighted_average'
  },
  {
    id: '2',
    name: 'گوشت گوساله',
    code: 'MEAT-001',
    category: 'مواد اولیه',
    unit: 'کیلوگرم',
    currentStock: 8,
    currentValue: 1440000,
    averagePrice: 180000,
    valuationMethod: 'fifo'
  },
  {
    id: '3',
    name: 'روغن آفتابگردان',
    code: 'OIL-001',
    category: 'مواد اولیه',
    unit: 'لیتر',
    currentStock: 2,
    currentValue: 50000,
    averagePrice: 25000,
    valuationMethod: 'weighted_average'
  }
]

const mockLedgerEntries: LedgerEntry[] = [
  {
    id: '1',
    date: '1403/09/15',
    documentNumber: 'REC-001',
    documentType: 'receipt',
    description: 'خرید برنج ایرانی',
    warehouse: 'انبار اصلی',
    user: 'احمد محمدی',
    quantityIn: 20,
    quantityOut: 0,
    unitPrice: 45000,
    totalValue: 900000,
    runningBalance: 20,
    runningValue: 900000,
    reference: 'PO-001',
    notes: 'خرید از تامین‌کننده اصلی'
  },
  {
    id: '2',
    date: '1403/09/15',
    documentNumber: 'ISS-001',
    documentType: 'issue',
    description: 'مصرف در آشپزخانه',
    warehouse: 'انبار اصلی',
    user: 'فاطمه کریمی',
    quantityIn: 0,
    quantityOut: 5,
    unitPrice: 45000,
    totalValue: 225000,
    runningBalance: 15,
    runningValue: 675000,
    reference: 'KIT-001',
    notes: 'مصرف برای تهیه غذا'
  },
  {
    id: '3',
    date: '1403/09/14',
    documentNumber: 'REC-002',
    documentType: 'receipt',
    description: 'خرید گوشت گوساله',
    warehouse: 'انبار اصلی',
    user: 'رضا حسینی',
    quantityIn: 10,
    quantityOut: 0,
    unitPrice: 180000,
    totalValue: 1800000,
    runningBalance: 10,
    runningValue: 1800000,
    reference: 'PO-002',
    notes: 'خرید گوشت تازه'
  },
  {
    id: '4',
    date: '1403/09/14',
    documentNumber: 'ISS-002',
    documentType: 'issue',
    description: 'مصرف در آشپزخانه',
    warehouse: 'انبار اصلی',
    user: 'فاطمه کریمی',
    quantityIn: 0,
    quantityOut: 2,
    unitPrice: 180000,
    totalValue: 360000,
    runningBalance: 8,
    runningValue: 1440000,
    reference: 'KIT-002',
    notes: 'مصرف برای کباب'
  },
  {
    id: '5',
    date: '1403/09/13',
    documentNumber: 'ADJ-001',
    documentType: 'adjustment',
    description: 'تعدیل موجودی',
    warehouse: 'انبار اصلی',
    user: 'مدیر انبار',
    quantityIn: 0,
    quantityOut: 1,
    unitPrice: 25000,
    totalValue: 25000,
    runningBalance: 2,
    runningValue: 50000,
    reference: 'AUD-001',
    notes: 'تعدیل پس از انبارگردانی'
  }
]

const getDocumentTypeColor = (type: string) => {
  switch (type) {
    case 'receipt': return 'text-green-600 dark:text-green-400'
    case 'issue': return 'text-red-600 dark:text-red-400'
    case 'transfer_in': return 'text-blue-600 dark:text-blue-400'
    case 'transfer_out': return 'text-orange-600 dark:text-orange-400'
    case 'adjustment': return 'text-purple-600 dark:text-purple-400'
    case 'count': return 'text-yellow-600 dark:text-yellow-400'
    default: return 'text-gray-600 dark:text-gray-400'
  }
}

const getDocumentTypeBadge = (type: string) => {
  switch (type) {
    case 'receipt': return <span className="status-badge bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">ورودی</span>
    case 'issue': return <span className="status-badge bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">خروجی</span>
    case 'transfer_in': return <span className="status-badge bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">انتقال ورودی</span>
    case 'transfer_out': return <span className="status-badge bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">انتقال خروجی</span>
    case 'adjustment': return <span className="status-badge bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">تعدیل</span>
    case 'count': return <span className="status-badge bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">شمارش</span>
    default: return null
  }
}

const getDocumentTypeIcon = (type: string) => {
  switch (type) {
    case 'receipt': return <ArrowUpRight className="w-4 h-4" />
    case 'issue': return <ArrowDownLeft className="w-4 h-4" />
    case 'transfer_in': return <ArrowUpRight className="w-4 h-4" />
    case 'transfer_out': return <ArrowDownLeft className="w-4 h-4" />
    case 'adjustment': return <Calculator className="w-4 h-4" />
    case 'count': return <Target className="w-4 h-4" />
    default: return <FileText className="w-4 h-4" />
  }
}

const getValuationMethodText = (method: string) => {
  switch (method) {
    case 'fifo': return 'FIFO (اولین ورودی، اولین خروجی)'
    case 'weighted_average': return 'میانگین موزون متحرک'
    case 'lifo': return 'LIFO (آخرین ورودی، اولین خروجی)'
    default: return method
  }
}

export default function ItemLedgerPage() {
  const [items, setItems] = useState<Item[]>(mockItems)
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>(mockLedgerEntries)
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterWarehouse, setFilterWarehouse] = useState('all')
  const [filterDocumentType, setFilterDocumentType] = useState('all')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')
  const [showItemModal, setShowItemModal] = useState(false)

  const filteredItems = items.filter(item =>
    searchTerm === '' || 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredLedgerEntries = ledgerEntries.filter(entry =>
    (selectedItem === null || entry.id === selectedItem.id) &&
    (filterWarehouse === 'all' || entry.warehouse === filterWarehouse) &&
    (filterDocumentType === 'all' || entry.documentType === filterDocumentType) &&
    (filterDateFrom === '' || entry.date >= filterDateFrom) &&
    (filterDateTo === '' || entry.date <= filterDateTo)
  )

  const totalItems = items.length
  const totalValue = items.reduce((sum, item) => sum + item.currentValue, 0)
  const totalTransactions = ledgerEntries.length
  const averagePrice = items.length > 0 ? items.reduce((sum, item) => sum + item.averagePrice, 0) / items.length : 0

  const handleSelectItem = (item: Item) => {
    setSelectedItem(item)
    setShowItemModal(true)
  }

  const handleExport = () => {
    alert('گزارش کاردکس کالا به صورت Excel صادر شد.')
  }

  const handlePrint = () => {
    window.print()
  }

  const handleRefresh = () => {
    alert('کاردکس کالا بروزرسانی شد.')
  }

  return (
    <div className="fade-in-animation space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">کاردکس کالا</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            تاریخچه کامل ورود/خروج کالاها با قیمت و مانده برای ردیابی موجودی.
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
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">کل کالاها</h3>
            <Package className="w-6 h-6 text-primary-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{totalItems}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">کالای ثبت شده</p>
        </div>

        <div className="premium-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">ارزش کل</h3>
            <DollarSign className="w-6 h-6 text-success-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{totalValue.toLocaleString('fa-IR')}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">تومان</p>
        </div>

        <div className="premium-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">کل تراکنش‌ها</h3>
            <Activity className="w-6 h-6 text-warning-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{totalTransactions}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">تراکنش ثبت شده</p>
        </div>

        <div className="premium-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">میانگین قیمت</h3>
            <Calculator className="w-6 h-6 text-accent-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{Math.round(averagePrice).toLocaleString('fa-IR')}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">تومان</p>
        </div>
      </div>

      {/* Items List */}
      <div className="premium-card p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2 space-x-reverse">
          <Package className="w-6 h-6 text-primary-600" />
          <span>لیست کالاها</span>
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="جستجو کالا..."
              className="premium-input pr-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
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
          <select
            className="premium-input"
            value={filterDocumentType}
            onChange={(e) => setFilterDocumentType(e.target.value)}
          >
            <option value="all">همه انواع سند</option>
            <option value="receipt">ورودی</option>
            <option value="issue">خروجی</option>
            <option value="transfer_in">انتقال ورودی</option>
            <option value="transfer_out">انتقال خروجی</option>
            <option value="adjustment">تعدیل</option>
            <option value="count">شمارش</option>
          </select>
          <div className="flex space-x-2 space-x-reverse">
            <input
              type="date"
              className="premium-input flex-1"
              placeholder="از تاریخ"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
            />
            <input
              type="date"
              className="premium-input flex-1"
              placeholder="تا تاریخ"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-right whitespace-nowrap">
            <thead>
              <tr className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-800/50">
                <th className="px-4 py-3 rounded-r-lg">نام کالا</th>
                <th className="px-4 py-3">کد</th>
                <th className="px-4 py-3">دسته‌بندی</th>
                <th className="px-4 py-3">واحد</th>
                <th className="px-4 py-3">موجودی فعلی</th>
                <th className="px-4 py-3">ارزش فعلی</th>
                <th className="px-4 py-3">قیمت میانگین</th>
                <th className="px-4 py-3">روش ارزش‌گذاری</th>
                <th className="px-4 py-3 rounded-l-lg">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredItems.map(item => (
                <tr key={item.id} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <Package className="w-5 h-5 text-primary-600" />
                      <span className="font-medium text-gray-900 dark:text-white">{item.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-200 font-mono">{item.code}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{item.category}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{item.unit}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{item.currentStock}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{item.currentValue.toLocaleString('fa-IR')} تومان</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{item.averagePrice.toLocaleString('fa-IR')} تومان</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-200">
                    <span className="text-xs">{getValuationMethodText(item.valuationMethod)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <button
                        onClick={() => handleSelectItem(item)}
                        className="p-1 rounded-full text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                        title="مشاهده کاردکس"
                      >
                        <History className="w-4 h-4" />
                      </button>
                      <button className="p-1 rounded-full text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ledger Entries Modal */}
      {showItemModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-7xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                کاردکس کالا: {selectedItem.name}
              </h2>
              <button
                onClick={() => setShowItemModal(false)}
                className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {/* Item Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="premium-card p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">اطلاعات کالا</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">نام:</span>
                    <span className="text-gray-900 dark:text-white">{selectedItem.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">کد:</span>
                    <span className="text-gray-900 dark:text-white font-mono">{selectedItem.code}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">دسته‌بندی:</span>
                    <span className="text-gray-900 dark:text-white">{selectedItem.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">واحد:</span>
                    <span className="text-gray-900 dark:text-white">{selectedItem.unit}</span>
                  </div>
                </div>
              </div>

              <div className="premium-card p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">وضعیت فعلی</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">موجودی:</span>
                    <span className="text-gray-900 dark:text-white">{selectedItem.currentStock} {selectedItem.unit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">ارزش کل:</span>
                    <span className="text-gray-900 dark:text-white">{selectedItem.currentValue.toLocaleString('fa-IR')} تومان</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">قیمت میانگین:</span>
                    <span className="text-gray-900 dark:text-white">{selectedItem.averagePrice.toLocaleString('fa-IR')} تومان</span>
                  </div>
                </div>
              </div>

              <div className="premium-card p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">روش ارزش‌گذاری</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">روش:</span>
                    <span className="text-gray-900 dark:text-white text-sm">{getValuationMethodText(selectedItem.valuationMethod)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Ledger Entries */}
            <div className="premium-card p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">تاریخچه گردش</h3>
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-right whitespace-nowrap">
                  <thead>
                    <tr className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-800/50">
                      <th className="px-4 py-3 rounded-r-lg">تاریخ</th>
                      <th className="px-4 py-3">شماره سند</th>
                      <th className="px-4 py-3">نوع سند</th>
                      <th className="px-4 py-3">شرح</th>
                      <th className="px-4 py-3">انبار</th>
                      <th className="px-4 py-3">ورودی</th>
                      <th className="px-4 py-3">خروجی</th>
                      <th className="px-4 py-3">قیمت واحد</th>
                      <th className="px-4 py-3">ارزش</th>
                      <th className="px-4 py-3">مانده تعدادی</th>
                      <th className="px-4 py-3">مانده ریالی</th>
                      <th className="px-4 py-3">مرجع</th>
                      <th className="px-4 py-3 rounded-l-lg">یادداشت</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredLedgerEntries.map(entry => (
                      <tr key={entry.id} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <td className="px-4 py-3 text-gray-900 dark:text-white">{entry.date}</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-200 font-mono">{entry.documentNumber}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-2 space-x-reverse">
                            {getDocumentTypeIcon(entry.documentType)}
                            {getDocumentTypeBadge(entry.documentType)}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{entry.description}</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{entry.warehouse}</td>
                        <td className="px-4 py-3 text-green-600 dark:text-green-400">
                          {entry.quantityIn > 0 ? entry.quantityIn : '-'}
                        </td>
                        <td className="px-4 py-3 text-red-600 dark:text-red-400">
                          {entry.quantityOut > 0 ? entry.quantityOut : '-'}
                        </td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{entry.unitPrice.toLocaleString('fa-IR')}</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{entry.totalValue.toLocaleString('fa-IR')}</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-200 font-medium">{entry.runningBalance}</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-200 font-medium">{entry.runningValue.toLocaleString('fa-IR')}</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{entry.reference}</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-200 max-w-xs truncate">{entry.notes}</td>
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
