'use client'

import React, { useState, useEffect } from 'react'
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
  ClipboardList,
  Loader
} from 'lucide-react'

interface LedgerEntry {
  _id?: string
  id: string
  itemId: string
  itemName: string
  itemCode: string
  date: string
  documentNumber: string
  documentType: 'receipt' | 'issue' | 'transfer_in' | 'transfer_out' | 'adjustment' | 'count'
  description: string
  warehouse: string
  userId?: string
  user?: string
  quantityIn: number
  quantityOut: number
  unitPrice: number
  totalValue: number
  runningBalance: number
  runningValue: number
  averagePrice: number
  reference: string
  notes: string
  lotNumber?: string | null
  expirationDate?: string | null
}

interface LedgerSummary {
  initialBalance: number
  initialValue: number
  totalIn: number
  totalInValue: number
  totalOut: number
  totalOutValue: number
  endingBalance: number
  endingValue: number
  costOfGoodsSold: number
  averagePrice: number
}

interface Item {
  _id?: string
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

// Mock data removed - using real API now

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
  const [items, setItems] = useState<Item[]>([])
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([])
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterWarehouse, setFilterWarehouse] = useState('all')
  const [filterDocumentType, setFilterDocumentType] = useState('all')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')
  const [showItemModal, setShowItemModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalItems: 0,
    totalValue: 0,
    lowStockItems: 0,
    outOfStockItems: 0
  })
  const [ledgerSummary, setLedgerSummary] = useState<LedgerSummary | null>(null)
  const [warehouses, setWarehouses] = useState<Array<{ _id: string; name: string; code?: string }>>([])

  // بارگذاری آیتم‌ها
  const fetchItems = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/item-ledger/items')
      const data = await response.json()
      
      if (data.success) {
        setItems(data.data)
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error fetching items:', error)
    } finally {
      setLoading(false)
    }
  }

  // بارگذاری ورودی‌های دفتر کل
  const fetchLedgerEntries = async (itemId?: string) => {
    if (!itemId) return
    
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.append('itemId', itemId)
      if (filterWarehouse !== 'all') params.append('warehouseName', filterWarehouse)
      if (filterDateFrom) params.append('dateFrom', filterDateFrom)
      if (filterDateTo) params.append('dateTo', filterDateTo)

      const response = await fetch(`/api/inventory/ledger?${params.toString()}`)
      const data = await response.json()
      
      if (data.success) {
        // تبدیل movements به فرمت LedgerEntry
        const entries = (data.data.entries || []).map((movement: any) => ({
          _id: movement._id,
          id: movement._id?.toString() || movement.id,
          itemId: movement.itemId?.toString() || movement.itemId,
          itemName: movement.itemName || selectedItem?.name || '',
          itemCode: movement.itemCode || selectedItem?.code || '',
          date: movement.createdAt || movement.date,
          documentNumber: movement.documentNumber || '',
          documentType: mapMovementTypeToDocumentType(movement.movementType),
          description: movement.description || '',
          warehouse: movement.warehouseName || '',
          userId: movement.createdBy || '',
          user: movement.createdBy || '',
          quantityIn: movement.quantityIn || (movement.quantity > 0 ? movement.quantity : 0),
          quantityOut: movement.quantityOut || (movement.quantity < 0 ? Math.abs(movement.quantity) : 0),
          unitPrice: movement.unitPrice || 0,
          totalValue: movement.totalValue || 0,
          runningBalance: movement.runningBalance || 0,
          runningValue: movement.runningValue || 0,
          averagePrice: movement.averagePrice || 0,
          reference: movement.orderNumber || movement.documentNumber || movement.referenceId?.toString() || '',
          notes: movement.description || '',
          lotNumber: movement.lotNumber || null,
          expirationDate: movement.expirationDate || null
        }))
        setLedgerEntries(entries)
        setLedgerSummary(data.data.summary || {})
      }
    } catch (error) {
      console.error('Error fetching ledger entries:', error)
    } finally {
      setLoading(false)
    }
  }
  
  // تبدیل movementType به documentType
  const mapMovementTypeToDocumentType = (movementType: string): 'receipt' | 'issue' | 'transfer_in' | 'transfer_out' | 'adjustment' | 'count' => {
    switch (movementType) {
      case 'INITIAL':
      case 'PURCHASE_IN':
      case 'RETURN_IN':
      case 'ADJUSTMENT_INCREMENT':
        return 'receipt'
      case 'SALE_CONSUMPTION':
      case 'WASTAGE':
      case 'RETURN_OUT':
      case 'ADJUSTMENT_DECREMENT':
        return 'issue'
      case 'TRANSFER_IN':
        return 'transfer_in'
      case 'TRANSFER_OUT':
        return 'transfer_out'
      default:
        return 'adjustment'
    }
  }

  // اضافه کردن داده‌های نمونه
  const handleAddSampleData = async () => {
    try {
      const response = await fetch('/api/add-sample-item-ledger', {
        method: 'POST',
      })
      
      const data = await response.json()
      
      if (data.success) {
        alert('داده‌های نمونه با موفقیت اضافه شد')
        fetchItems()
      } else {
        alert('خطا در اضافه کردن داده‌های نمونه: ' + data.message)
      }
    } catch (error) {
      console.error('Error adding sample data:', error)
      alert('خطا در اضافه کردن داده‌های نمونه')
    }
  }

  const filteredItems = items.filter(item =>
    searchTerm === '' || 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredLedgerEntries = ledgerEntries.filter(entry => {
    const itemId = selectedItem ? String(selectedItem.id || selectedItem._id) : null
    return (
      (selectedItem === null || entry.itemId === itemId) &&
      (filterWarehouse === 'all' || entry.warehouse === filterWarehouse) &&
      (filterDocumentType === 'all' || entry.documentType === filterDocumentType) &&
      (!filterDateFrom || !entry.date || new Date(entry.date) >= new Date(filterDateFrom)) &&
      (!filterDateTo || !entry.date || new Date(entry.date) <= new Date(filterDateTo))
    )
  })

  const totalItems = stats.totalItems || items.length
  const totalValue = stats.totalValue || items.reduce((sum, item) => sum + item.currentValue, 0)
  const totalTransactions = ledgerEntries.length
  const averagePrice = items.length > 0 ? items.reduce((sum, item) => sum + item.averagePrice, 0) / items.length : 0

  const handleSelectItem = async (item: Item) => {
    setSelectedItem(item)
    const itemId = item.id || item._id
    if (itemId) {
      await fetchLedgerEntries(String(itemId))
      setShowItemModal(true)
    }
  }

  const handleExport = async (format: 'excel' | 'pdf' = 'excel') => {
    if (!selectedItem) {
      alert('لطفاً ابتدا یک کالا انتخاب کنید')
      return
    }
    
    try {
      const itemId = selectedItem.id || selectedItem._id
      const params = new URLSearchParams()
      params.append('itemId', String(itemId))
      if (filterWarehouse !== 'all') params.append('warehouseName', filterWarehouse)
      if (filterDateFrom) params.append('dateFrom', filterDateFrom)
      if (filterDateTo) params.append('dateTo', filterDateTo)
      params.append('format', format)
      
      const response = await fetch(`/api/inventory/ledger/export?${params.toString()}`)
      const data = await response.json()
      
      if (!data.success) {
        alert(data.message || 'خطا در خروجی گرفتن گزارش')
        return
      }
      
      if (format === 'excel') {
        // تبدیل JSON به CSV/Excel
        const csvContent = convertToCSV(data.data)
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `کاردکس_${selectedItem.name}_${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        alert('خروجی PDF در حال توسعه است')
      }
    } catch (error) {
      console.error('Error exporting ledger:', error)
      alert('خطا در خروجی گرفتن گزارش')
    }
  }
  
  const convertToCSV = (data: any): string => {
    const headers = ['تاریخ', 'نوع حرکت', 'شماره سند', 'مرجع', 'انبار', 'ورودی', 'خروجی', 'موجودی مانده', 'قیمت واحد', 'ارزش حرکت', 'ارزش مانده', 'Lot Number', 'تاریخ انقضا', 'توضیحات']
    const rows = data.entries.map((entry: any) => [
      entry.تاریخ,
      entry['نوع حرکت'],
      entry['شماره سند'],
      entry.مرجع,
      entry.انبار,
      entry.ورودی,
      entry.خروجی,
      entry['موجودی مانده'],
      entry['قیمت واحد'],
      entry['ارزش حرکت'],
      entry['ارزش مانده'],
      entry['Lot Number'],
      entry['تاریخ انقضا'],
      entry.توضیحات
    ])
    
    const csv = [
      `کاردکس کالا: ${data.item.name} (${data.item.code})`,
      `واحد: ${data.item.unit}`,
      '',
      'جمع‌بندی:',
      `موجودی ابتدا: ${data.summary.initialBalance} (${data.summary.initialValue.toLocaleString('fa-IR')} تومان)`,
      `کل ورودی‌ها: ${data.summary.totalIn} (${data.summary.totalInValue.toLocaleString('fa-IR')} تومان)`,
      `کل خروجی‌ها: ${data.summary.totalOut} (${data.summary.totalOutValue.toLocaleString('fa-IR')} تومان)`,
      `موجودی پایان: ${data.summary.endingBalance} (${data.summary.endingValue.toLocaleString('fa-IR')} تومان)`,
      `بهای مصرف دوره: ${data.summary.costOfGoodsSold.toLocaleString('fa-IR')} تومان`,
      '',
      headers.join(','),
      ...rows.map((row: any[]) => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n')
    
    return csv
  }

  const handlePrint = () => {
    window.print()
  }

  const handleRefresh = async () => {
    await fetchItems()
    if (selectedItem) {
      const itemId = selectedItem.id || selectedItem._id
      if (itemId) {
        await fetchLedgerEntries(String(itemId))
      }
    }
  }

  useEffect(() => {
    fetchItems()
    fetchWarehouses()
  }, [])

  useEffect(() => {
    if (selectedItem) {
      const itemId = selectedItem.id || selectedItem._id
      if (itemId) {
        fetchLedgerEntries(String(itemId))
      }
    }
  }, [filterWarehouse, filterDocumentType, filterDateFrom, filterDateTo, selectedItem])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
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
            onClick={handleAddSampleData}
            className="premium-button flex items-center space-x-2 space-x-reverse"
          >
            <Plus className="w-5 h-5" />
            <span>داده نمونه</span>
          </button>
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
            {warehouses.map(warehouse => (
              <option key={warehouse._id} value={warehouse.name}>
                {warehouse.name} {warehouse.code ? `(${warehouse.code})` : ''}
              </option>
            ))}
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
                <tr key={item.id || item._id} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <Package className="w-5 h-5 text-primary-600" />
                      <span className="font-medium text-gray-900 dark:text-white">{item.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-200 font-mono">{item.code}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{item.category}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{item.unit}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{item.currentStock || 0}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{(item.currentValue || 0).toLocaleString('fa-IR')} تومان</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{(item.averagePrice || 0).toLocaleString('fa-IR')} تومان</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-200">
                    <span className="text-xs">{getValuationMethodText(item.valuationMethod || 'weighted_average')}</span>
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

            {/* Summary */}
            {ledgerSummary && (
              <div className="premium-card p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">جمع‌بندی دوره</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">موجودی ابتدا</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {ledgerSummary.initialBalance.toLocaleString('fa-IR')}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      {ledgerSummary.initialValue.toLocaleString('fa-IR')} تومان
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">کل ورودی‌ها</p>
                    <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                      {ledgerSummary.totalIn.toLocaleString('fa-IR')}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      {ledgerSummary.totalInValue.toLocaleString('fa-IR')} تومان
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">کل خروجی‌ها</p>
                    <p className="text-lg font-semibold text-red-600 dark:text-red-400">
                      {ledgerSummary.totalOut.toLocaleString('fa-IR')}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      {ledgerSummary.totalOutValue.toLocaleString('fa-IR')} تومان
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">موجودی پایان</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {ledgerSummary.endingBalance.toLocaleString('fa-IR')}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      {ledgerSummary.endingValue.toLocaleString('fa-IR')} تومان
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">بهای مصرف دوره</p>
                    <p className="text-lg font-semibold text-orange-600 dark:text-orange-400">
                      {ledgerSummary.costOfGoodsSold.toLocaleString('fa-IR')}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">تومان</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">قیمت میانگین</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {Math.round(ledgerSummary.averagePrice).toLocaleString('fa-IR')}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">تومان</p>
                  </div>
                </div>
              </div>
            )}

            {/* Ledger Entries */}
            <div className="premium-card p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">تاریخچه گردش</h3>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <button
                    onClick={() => handleExport('excel')}
                    className="premium-button flex items-center space-x-2 space-x-reverse"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>خروجی Excel</span>
                  </button>
                  <button
                    onClick={() => handleExport('pdf')}
                    className="premium-button flex items-center space-x-2 space-x-reverse"
                  >
                    <FileText className="w-4 h-4" />
                    <span>خروجی PDF</span>
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-right whitespace-nowrap">
                  <thead>
                    <tr className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-800/50">
                      <th className="px-4 py-3 rounded-r-lg">تاریخ</th>
                      <th className="px-4 py-3">نوع حرکت</th>
                      <th className="px-4 py-3">شماره سند</th>
                      <th className="px-4 py-3">مرجع</th>
                      <th className="px-4 py-3">انبار</th>
                      <th className="px-4 py-3">ورودی</th>
                      <th className="px-4 py-3">خروجی</th>
                      <th className="px-4 py-3">موجودی مانده</th>
                      <th className="px-4 py-3">قیمت واحد</th>
                      <th className="px-4 py-3">ارزش حرکت</th>
                      <th className="px-4 py-3">ارزش مانده</th>
                      <th className="px-4 py-3">Lot/Expiry</th>
                      <th className="px-4 py-3 rounded-l-lg">توضیحات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredLedgerEntries.length === 0 ? (
                      <tr>
                        <td colSpan={13} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                          <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
                          <p>هیچ حرکتی برای این کالا یافت نشد</p>
                        </td>
                      </tr>
                    ) : (
                      filteredLedgerEntries.map(entry => (
                        <tr key={entry._id || entry.id} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                          <td className="px-4 py-3 text-gray-900 dark:text-white">
                            {entry.date ? new Date(entry.date).toLocaleString('fa-IR', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : entry.date}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center space-x-2 space-x-reverse">
                              {getDocumentTypeIcon(entry.documentType)}
                              {getDocumentTypeBadge(entry.documentType)}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-700 dark:text-gray-200 font-mono text-xs">
                            {entry.documentNumber || '-'}
                          </td>
                          <td className="px-4 py-3 text-gray-700 dark:text-gray-200 text-xs">
                            {entry.reference || '-'}
                          </td>
                          <td className="px-4 py-3 text-gray-700 dark:text-gray-200">
                            {entry.warehouse || '-'}
                          </td>
                          <td className="px-4 py-3 text-green-600 dark:text-green-400 font-medium">
                            {entry.quantityIn > 0 ? entry.quantityIn.toLocaleString('fa-IR') : '-'}
                          </td>
                          <td className="px-4 py-3 text-red-600 dark:text-red-400 font-medium">
                            {entry.quantityOut > 0 ? entry.quantityOut.toLocaleString('fa-IR') : '-'}
                          </td>
                          <td className="px-4 py-3 text-gray-700 dark:text-gray-200 font-semibold">
                            {entry.runningBalance.toLocaleString('fa-IR')}
                          </td>
                          <td className="px-4 py-3 text-gray-700 dark:text-gray-200">
                            {entry.unitPrice.toLocaleString('fa-IR')} تومان
                          </td>
                          <td className="px-4 py-3 text-gray-700 dark:text-gray-200">
                            {entry.totalValue.toLocaleString('fa-IR')} تومان
                          </td>
                          <td className="px-4 py-3 text-gray-700 dark:text-gray-200 font-semibold">
                            {entry.runningValue.toLocaleString('fa-IR')} تومان
                          </td>
                          <td className="px-4 py-3 text-gray-700 dark:text-gray-200 text-xs">
                            {entry.lotNumber ? (
                              <div>
                                <div>Lot: {entry.lotNumber}</div>
                                {entry.expirationDate && (
                                  <div className="text-red-600 dark:text-red-400">
                                    Exp: {new Date(entry.expirationDate).toLocaleDateString('fa-IR')}
                                  </div>
                                )}
                              </div>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td className="px-4 py-3 text-gray-700 dark:text-gray-200 max-w-xs truncate text-xs">
                            {entry.description || entry.notes || '-'}
                          </td>
                        </tr>
                      ))
                    )}
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
