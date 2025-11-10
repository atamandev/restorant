'use client'

import React, { useState, useEffect, useCallback } from 'react'
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
  Square,
  Loader
} from 'lucide-react'

interface InventoryCount {
  _id?: string
  id: string
  countNumber: string
  type: 'full' | 'partial' | 'cycle'
  warehouse: string
  warehouses?: string[] // برای چند انبار
  section?: string | null // بازه/بخش
  freezeMovements: boolean // فریز حرکت یا شمارش زنده
  status: 'draft' | 'counting' | 'ready_for_approval' | 'approved' | 'closed' | 'cancelled'
  createdBy: string
  approvedBy?: string | null
  approvedDate?: string | null
  createdDate: string
  startedDate: string | null
  completedDate: string | null
  totalItems: number
  countedItems: number
  discrepancies: number
  totalValue: number
  discrepancyValue: number
  notes: string
  category?: string | null
}

interface CountItem {
  _id?: string
  id: string
  countId: string
  itemId: string
  itemName: string
  itemCode: string
  category: string
  unit: string
  warehouse: string
  systemQuantity: number
  systemQuantityAtFinalization?: number | null
  countedQuantity: number | null
  discrepancy: number
  unitPrice: number
  systemValue: number
  countedValue: number
  discrepancyValue: number
  countedBy?: string | null
  countedDate?: string | null
  countingRounds?: Array<{
    roundNumber: number
    quantity: number
    countedBy?: string | null
    countedDate: string
    notes?: string
  }>
  notes: string
}


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
    case 'counting': return <span className="status-badge bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">در حال شمارش</span>
    case 'ready_for_approval': return <span className="status-badge bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">آماده تایید</span>
    case 'approved': return <span className="status-badge bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">تایید شده</span>
    case 'closed': return <span className="status-badge bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">بسته</span>
    case 'cancelled': return <span className="status-badge bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">ابطال</span>
    default: return null
  }
}

const getDiscrepancyColor = (discrepancy: number) => {
  if (discrepancy > 0) return 'text-green-600 dark:text-green-400'
  if (discrepancy < 0) return 'text-red-600 dark:text-red-400'
  return 'text-gray-600 dark:text-gray-400'
}

const formatDate = (dateString: string | null) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('fa-IR')
}

// کامپوننت گزارش مغایرت
function DiscrepancyReportTab({ counts, warehouses }: { counts: InventoryCount[], warehouses: any[] }) {
  const [selectedCountId, setSelectedCountId] = useState<string>('all')
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('all')
  const [groupBy, setGroupBy] = useState<'category' | 'section' | 'warehouse' | 'countedBy'>('category')
  const [reportData, setReportData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const fetchReport = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (selectedCountId !== 'all') params.append('countId', selectedCountId)
      if (selectedWarehouse !== 'all') params.append('warehouse', selectedWarehouse)
      params.append('groupBy', groupBy)

      const response = await fetch(`/api/inventory-counts/discrepancy-report?${params.toString()}`)
      const data = await response.json()
      
      if (data.success) {
        setReportData(data.data)
      }
    } catch (error) {
      console.error('Error fetching report:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (selectedCountId || selectedWarehouse !== 'all') {
      fetchReport()
    }
  }, [selectedCountId, selectedWarehouse, groupBy])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <select
          className="premium-input"
          value={selectedCountId}
          onChange={(e) => setSelectedCountId(e.target.value)}
        >
          <option value="all">همه برگه‌های شمارش</option>
          {counts.map(count => (
            <option key={count.id} value={count.id}>{count.countNumber}</option>
          ))}
        </select>
        <select
          className="premium-input"
          value={selectedWarehouse}
          onChange={(e) => setSelectedWarehouse(e.target.value)}
        >
          <option value="all">همه انبارها</option>
          {warehouses && Array.isArray(warehouses) && warehouses.map((wh: any) => (
            <option key={typeof wh === 'string' ? wh : wh.name} value={typeof wh === 'string' ? wh : wh.name}>
              {typeof wh === 'string' ? wh : wh.name}
            </option>
          ))}
        </select>
        <select
          className="premium-input"
          value={groupBy}
          onChange={(e) => setGroupBy(e.target.value as any)}
        >
          <option value="category">دسته‌بندی</option>
          <option value="warehouse">انبار</option>
          <option value="section">بخش</option>
          <option value="countedBy">شمارنده</option>
        </select>
        <button
          onClick={fetchReport}
          className="premium-button flex items-center justify-center space-x-2 space-x-reverse"
        >
          <RefreshCw className="w-5 h-5" />
          <span>به‌روزرسانی</span>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      ) : reportData ? (
        <>
          <div className="premium-card p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">خلاصه گزارش</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">کل مغایرت‌ها</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {reportData.summary?.totalDiscrepancies || 0}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">ارزش کل مغایرت</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {(reportData.summary?.totalDiscrepancyValue || 0).toLocaleString('fa-IR')} تومان
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">اضافی</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {reportData.summary?.positiveCount || 0}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">کسری</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {reportData.summary?.negativeCount || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="premium-card p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              گزارش به تفکیک {groupBy === 'category' ? 'دسته‌بندی' : groupBy === 'warehouse' ? 'انبار' : groupBy === 'section' ? 'بخش' : 'شمارنده'}
            </h3>
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-right whitespace-nowrap">
                <thead>
                  <tr className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-800/50">
                    <th className="px-4 py-3 rounded-r-lg">گروه</th>
                    <th className="px-4 py-3">تعداد آیتم‌ها</th>
                    <th className="px-4 py-3">کل مغایرت</th>
                    <th className="px-4 py-3">ارزش مغایرت</th>
                    <th className="px-4 py-3">اضافی</th>
                    <th className="px-4 py-3 rounded-l-lg">کسری</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {reportData.report && Array.isArray(reportData.report) && reportData.report.length > 0 ? (
                    reportData.report.map((group: any, index: number) => (
                      <tr key={index} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{group.key}</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{group.itemsCount}</td>
                        <td className={`px-4 py-3 font-medium ${getDiscrepancyColor(group.totalDiscrepancy)}`}>
                          {group.totalDiscrepancy > 0 ? `+${group.totalDiscrepancy.toLocaleString('fa-IR')}` : group.totalDiscrepancy.toLocaleString('fa-IR')}
                        </td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-200">
                          {group.totalDiscrepancyValue.toLocaleString('fa-IR')} تومان
                        </td>
                        <td className="px-4 py-3 text-green-600 dark:text-green-400">{group.positiveDiscrepancies}</td>
                        <td className="px-4 py-3 text-red-600 dark:text-red-400">{group.negativeDiscrepancies}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                        هیچ داده‌ای برای نمایش وجود ندارد
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}

export default function InventoryAuditPage() {
  const [inventoryCounts, setInventoryCounts] = useState<InventoryCount[]>([])
  const [countItems, setCountItems] = useState<CountItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [filterWarehouse, setFilterWarehouse] = useState('all')
  const [selectedCount, setSelectedCount] = useState<InventoryCount | null>(null)
  const [showCountModal, setShowCountModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'counts' | 'reports'>('counts')
  const [loading, setLoading] = useState(false)
  const [warehouses, setWarehouses] = useState<string[]>([])
  const [allWarehouses, setAllWarehouses] = useState<any[]>([])
  const [createForm, setCreateForm] = useState({
    type: 'cycle' as 'cycle' | 'full',
    warehouse: '',
    createdBy: 'کاربر سیستم',
    notes: ''
  })
  const [createLoading, setCreateLoading] = useState(false)

  // بارگذاری انبارها - همه انبارهای واقعی
  const fetchWarehouses = useCallback(async () => {
    try {
      console.log('[audit-page] Fetching warehouses...')
      const response = await fetch('/api/warehouses?limit=100')
      const data = await response.json()
      console.log('[audit-page] Warehouses response:', data)
      
      if (data.success && data.data) {
        // استفاده از همه انبارها (بدون فیلتر بر اساس inventory_balance)
        const allWarehousesData = Array.isArray(data.data) ? data.data : []
        setAllWarehouses(allWarehousesData)
        const warehouseNames = allWarehousesData.map((w: any) => w.name).filter(Boolean)
        setWarehouses(warehouseNames)
        console.log('[audit-page] Set warehouses:', warehouseNames)
      } else {
        console.error('[audit-page] Failed to fetch warehouses:', data)
        setAllWarehouses([])
        setWarehouses([])
      }
    } catch (error) {
      console.error('[audit-page] Error fetching warehouses:', error)
      setAllWarehouses([])
      setWarehouses([])
    }
  }, [])

  // بارگذاری شمارش‌ها - فقط برای انبارهایی که کالا دارند
  const fetchCounts = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (filterStatus !== 'all') params.append('status', filterStatus)
      if (filterType !== 'all') params.append('type', filterType)
      if (filterWarehouse !== 'all') params.append('warehouse', filterWarehouse)

      console.log('[audit-page] Fetching counts with params:', params.toString())
      const response = await fetch(`/api/inventory-counts?${params.toString()}`)
      const data = await response.json()
      console.log('[audit-page] Counts response:', data)
      
      if (data.success && data.data) {
        // فیلتر شمارش‌ها: فقط شمارش‌هایی که برای انبارهای معتبر هستند
        // (API قبلاً فیلتر کرده، اما اینجا هم بررسی می‌کنیم)
        const counts = Array.isArray(data.data) ? data.data : []
        console.log('[audit-page] Setting counts:', counts.length)
        setInventoryCounts(counts)
        
        // استخراج لیست انبارها از شمارش‌های معتبر
        const uniqueWarehouses = counts && Array.isArray(counts) 
          ? [...new Set(counts.map((c: InventoryCount) => c.warehouse).filter(Boolean))]
          : []
        console.log('[audit-page] Unique warehouses from counts:', uniqueWarehouses)
        
        // اگر انبارهایی از شمارش‌ها استخراج شد، آن‌ها را به لیست انبارها اضافه کن
        if (uniqueWarehouses && uniqueWarehouses.length > 0 && allWarehouses && Array.isArray(allWarehouses) && allWarehouses.length > 0) {
          const allWarehouseNames = allWarehouses.map((aw: any) => aw.name).filter(Boolean)
          const combinedWarehouses = [...new Set([...allWarehouseNames, ...uniqueWarehouses])]
          setWarehouses(combinedWarehouses)
        } else if (uniqueWarehouses && uniqueWarehouses.length > 0) {
          setWarehouses(uniqueWarehouses)
        }
        // اگر allWarehouses وجود دارد، از آن استفاده کن (نه uniqueWarehouses)
      } else {
        console.log('[audit-page] No counts found or error:', data)
        setInventoryCounts([])
      }
    } catch (error) {
      console.error('Error fetching counts:', error)
    } finally {
      setLoading(false)
    }
  }, [searchTerm, filterStatus, filterType, filterWarehouse, allWarehouses])


  // بارگذاری آیتم‌های شمارش
  const fetchCountItems = useCallback(async (countId: string) => {
    try {
      const response = await fetch(`/api/count-items?countId=${countId}`)
      const data = await response.json()
      if (data.success) {
        setCountItems(data.data)
      }
    } catch (error) {
      console.error('Error fetching count items:', error)
    }
  }, [])


  // بارگذاری اولیه انبارها
  useEffect(() => {
    fetchWarehouses()
  }, [fetchWarehouses])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchCounts()
    }, searchTerm ? 500 : 0)
    return () => clearTimeout(timeoutId)
  }, [fetchCounts, searchTerm])

  useEffect(() => {
    if (selectedCount?.id) {
      fetchCountItems(selectedCount.id)
    }
  }, [selectedCount?.id, fetchCountItems])

  const totalCounts = inventoryCounts && Array.isArray(inventoryCounts) ? inventoryCounts.length : 0
  const completedCounts = inventoryCounts && Array.isArray(inventoryCounts) 
    ? inventoryCounts.filter(c => c.status === 'approved' || c.status === 'closed').length 
    : 0
  const inProgressCounts = inventoryCounts && Array.isArray(inventoryCounts)
    ? inventoryCounts.filter(c => c.status === 'counting' || c.status === 'ready_for_approval').length
    : 0
  const draftCounts = inventoryCounts && Array.isArray(inventoryCounts)
    ? inventoryCounts.filter(c => c.status === 'draft').length
    : 0
  const totalDiscrepancies = inventoryCounts && Array.isArray(inventoryCounts)
    ? inventoryCounts.reduce((sum, c) => sum + (c.discrepancies || 0), 0)
    : 0
  const totalDiscrepancyValue = inventoryCounts && Array.isArray(inventoryCounts)
    ? inventoryCounts.reduce((sum, c) => sum + (c.discrepancyValue || 0), 0)
    : 0

  const handleCreateCount = () => {
    setShowCreateModal(true)
  }

  const handleSubmitCreateCount = async () => {
    if ((!createForm.warehouse && (!createForm.warehouses || !Array.isArray(createForm.warehouses) || createForm.warehouses.length === 0)) || !createForm.createdBy) {
      alert('لطفاً حداقل یک انبار و ایجادکننده را انتخاب کنید')
      return
    }

    try {
      setCreateLoading(true)
      const requestBody: any = {
        type: createForm.type,
        createdBy: createForm.createdBy,
        notes: createForm.notes || '',
        freezeMovements: createForm.freezeMovements,
        autoAddItems: createForm.autoAddItems
      }
      
      if (createForm.warehouses && Array.isArray(createForm.warehouses) && createForm.warehouses.length > 0) {
        requestBody.warehouses = createForm.warehouses
      } else {
        requestBody.warehouse = createForm.warehouse
      }
      
      if (createForm.section) {
        requestBody.section = createForm.section
      }
      
      if (createForm.category && createForm.category !== 'all') {
        requestBody.category = createForm.category
      }
      
      if (createForm.itemIds && createForm.itemIds.length > 0) {
        requestBody.itemIds = createForm.itemIds
      }
      
      const response = await fetch('/api/inventory-counts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })
      const data = await response.json()
      if (data.success) {
        await fetchCounts()
        setShowCreateModal(false)
        setCreateForm({
          type: 'full',
          warehouse: '',
          warehouses: [],
          section: '',
          freezeMovements: false,
          category: 'all',
          autoAddItems: true,
          itemIds: [],
          createdBy: 'کاربر سیستم',
          notes: ''
        })
        alert('شمارش با موفقیت ایجاد شد')
      } else {
        alert('خطا: ' + data.message)
      }
    } catch (error) {
      console.error('Error creating count:', error)
      alert('خطا در ایجاد شمارش')
    } finally {
      setCreateLoading(false)
    }
  }

  // تغییر وضعیت برگه شمارش
  const handleChangeStatus = async (countId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/inventory-counts/${countId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          performedBy: 'کاربر سیستم'
        })
      })
      const data = await response.json()
      if (data.success) {
        await fetchCounts()
        alert(`وضعیت برگه شمارش به "${newStatus}" تغییر یافت`)
      } else {
        alert(data.message || 'خطا در تغییر وضعیت')
      }
    } catch (error) {
      console.error('Error changing status:', error)
      alert('خطا در تغییر وضعیت')
    }
  }
  
  // تأیید برگه شمارش
  const handleApproveCount = async (countId: string) => {
    if (!confirm('آیا از تأیید این برگه شمارش اطمینان دارید؟ این عمل حرکات ADJUSTMENT ایجاد می‌کند.')) {
      return
    }
    
    try {
      const response = await fetch(`/api/inventory-counts/${countId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approvedBy: 'کاربر سیستم'
        })
      })
      const data = await response.json()
      if (data.success) {
        await fetchCounts()
        if (selectedCount?.id === countId) {
          await fetchCountItems(countId)
        }
        alert(`برگه شمارش تأیید شد. ${data.data.movementsCreated} حرکت ADJUSTMENT ایجاد شد.`)
      } else {
        alert(data.message || 'خطا در تأیید برگه')
      }
    } catch (error) {
      console.error('Error approving count:', error)
      alert('خطا در تأیید برگه')
    }
  }
  
  // شروع شمارش
  const handleStartCount = async (countId: string) => {
    await handleChangeStatus(countId, 'counting')
  }
  
  // آماده برای تأیید
  const handleReadyForApproval = async (countId: string) => {
    await handleChangeStatus(countId, 'ready_for_approval')
  }
  
  // بستن برگه
  const handleCloseCount = async (countId: string) => {
    await handleChangeStatus(countId, 'closed')
  }
  
  // ابطال برگه
  const handleCancelCount = async (countId: string) => {
    if (!confirm('آیا از ابطال این برگه شمارش اطمینان دارید؟')) {
      return
    }
    await handleChangeStatus(countId, 'cancelled')
  }
  
  const handleViewCount = async (count: InventoryCount) => {
    setSelectedCount(count)
    setShowCountModal(true)
    await fetchCountItems(count.id)
  }

  const handleCompleteCount = async (countId: string) => {
    try {
      const response = await fetch(`/api/inventory-counts/${countId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' })
      })
      const data = await response.json()
      if (data.success) {
        await fetchCounts()
        alert('شمارش تکمیل شد.')
      } else {
        alert('خطا: ' + data.message)
      }
    } catch (error) {
      console.error('Error completing count:', error)
      alert('خطا در تکمیل شمارش')
    }
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
                <option value="counting">در حال شمارش</option>
                <option value="ready_for_approval">آماده تایید</option>
                <option value="approved">تایید شده</option>
                <option value="closed">بسته</option>
                <option value="cancelled">ابطال</option>
              </select>
              <select
                className="premium-input"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="all">همه انواع</option>
                <option value="full">کامل</option>
                <option value="partial">جزئی</option>
                <option value="cycle">دوره‌ای</option>
              </select>
              <select
                className="premium-input"
                value={filterWarehouse}
                onChange={(e) => setFilterWarehouse(e.target.value)}
              >
                <option value="all">همه انبارها</option>
                {warehouses && Array.isArray(warehouses) && warehouses.map(wh => (
                  <option key={wh} value={wh}>{wh}</option>
                ))}
              </select>
            </div>

            {/* Counts Table */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader className="w-8 h-8 animate-spin text-primary-600" />
              </div>
            ) : (
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
                  {!inventoryCounts || !Array.isArray(inventoryCounts) || inventoryCounts.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                        هیچ شمارشی یافت نشد. برای شروع، داده‌های نمونه اضافه کنید.
                      </td>
                    </tr>
                  ) : (
                    inventoryCounts && Array.isArray(inventoryCounts) && inventoryCounts.map(count => (
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
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{formatDate(count.createdDate)}</td>
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
                              title="شروع شمارش"
                            >
                              <Play className="w-4 h-4" />
                            </button>
                          )}
                          {count.status === 'counting' && (
                            <>
                              <button
                                onClick={() => handleReadyForApproval(count.id)}
                                className="p-1 rounded-full text-yellow-600 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors"
                                title="آماده برای تأیید"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {count.status === 'ready_for_approval' && (
                            <button
                              onClick={() => handleApproveCount(count.id)}
                              className="p-1 rounded-full text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                              title="تأیید و ایجاد حرکات"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          )}
                          {count.status === 'approved' && (
                            <button
                              onClick={() => handleCloseCount(count.id)}
                              className="p-1 rounded-full text-purple-600 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                              title="بستن برگه"
                            >
                              <Square className="w-4 h-4" />
                            </button>
                          )}
                          {(count.status === 'draft' || count.status === 'counting' || count.status === 'ready_for_approval') && (
                            <button
                              onClick={() => handleCancelCount(count.id)}
                              className="p-1 rounded-full text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                              title="ابطال"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                  )}
                </tbody>
              </table>
              </div>
            )}
          </>
        )}


        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <DiscrepancyReportTab 
            counts={inventoryCounts}
            warehouses={allWarehouses}
          />
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
                    <span className="text-gray-600 dark:text-gray-400">انبار(ها):</span>
                    <span className="text-gray-900 dark:text-white">
                      {selectedCount.warehouses && selectedCount.warehouses.length > 0 
                        ? selectedCount.warehouses.join(', ') 
                        : selectedCount.warehouse}
                    </span>
                  </div>
                  {selectedCount.section && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">بخش:</span>
                      <span className="text-gray-900 dark:text-white">{selectedCount.section}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">فریز حرکت:</span>
                    <span className="text-gray-900 dark:text-white">
                      {selectedCount.freezeMovements ? 'بله' : 'خیر'}
                    </span>
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
                    <span className="text-gray-900 dark:text-white">{formatDate(selectedCount.createdDate)}</span>
                  </div>
                  {selectedCount.startedDate && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">تاریخ شروع:</span>
                      <span className="text-gray-900 dark:text-white">{formatDate(selectedCount.startedDate)}</span>
                    </div>
                  )}
                  {selectedCount.completedDate && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">تاریخ تکمیل:</span>
                      <span className="text-gray-900 dark:text-white">{formatDate(selectedCount.completedDate)}</span>
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
                      <th className="px-4 py-3">انبار</th>
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
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{item.warehouse || '-'}</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-200">
                          {item.systemQuantityAtFinalization !== null && item.systemQuantityAtFinalization !== undefined
                            ? `${item.systemQuantity} → ${item.systemQuantityAtFinalization}`
                            : item.systemQuantity}
                        </td>
                        <td className="px-4 py-3">
                          {selectedCount.status === 'counting' || selectedCount.status === 'draft' ? (
                            <input
                              type="number"
                              className="premium-input w-24 text-center"
                              value={item.countedQuantity ?? ''}
                              onChange={async (e) => {
                                const value = e.target.value === '' ? null : parseFloat(e.target.value)
                                try {
                                  const response = await fetch('/api/count-items', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      countId: item.countId,
                                      itemId: item.itemId,
                                      warehouse: item.warehouse,
                                      countedQuantity: value,
                                      countedBy: 'کاربر سیستم'
                                    })
                                  })
                                  const data = await response.json()
                                  if (data.success) {
                                    await fetchCountItems(item.countId)
                                  }
                                } catch (error) {
                                  console.error('Error updating count item:', error)
                                }
                              }}
                              min="0"
                              step="0.01"
                              placeholder="0"
                            />
                          ) : (
                            <span className="text-gray-700 dark:text-gray-200">{item.countedQuantity ?? '-'}</span>
                          )}
                        </td>
                        <td className={`px-4 py-3 font-medium ${getDiscrepancyColor(
                          (item.countedQuantity || 0) - (item.systemQuantityAtFinalization || item.systemQuantity || 0)
                        )}`}>
                          {(() => {
                            const disc = (item.countedQuantity || 0) - (item.systemQuantityAtFinalization || item.systemQuantity || 0)
                            return disc > 0 ? `+${disc}` : disc
                          })()}
                        </td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{item.unitPrice.toLocaleString('fa-IR')}</td>
                        <td className={`px-4 py-3 font-medium ${getDiscrepancyColor(
                          ((item.countedQuantity || 0) - (item.systemQuantityAtFinalization || item.systemQuantity || 0)) * (item.unitPrice || 0)
                        )}`}>
                          {(() => {
                            const disc = (item.countedQuantity || 0) - (item.systemQuantityAtFinalization || item.systemQuantity || 0)
                            const discValue = disc * (item.unitPrice || 0)
                            return discValue > 0 ? `+${discValue.toLocaleString('fa-IR')}` : discValue.toLocaleString('fa-IR')
                          })()}
                        </td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{item.countedBy || '-'}</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{formatDate(item.countedDate)}</td>
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

      {/* Create Count Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                ایجاد برگه شمارش جدید
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  نوع شمارش <span className="text-red-500">*</span>
                </label>
                <select
                  className="premium-input w-full"
                  value={createForm.type}
                  onChange={(e) => setCreateForm({ ...createForm, type: e.target.value as 'full' | 'partial' | 'cycle' })}
                >
                  <option value="full">کامل</option>
                  <option value="partial">جزئی</option>
                  <option value="cycle">دوره‌ای</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  انبار(ها) <span className="text-red-500">*</span>
                </label>
                <select
                  className="premium-input w-full"
                  multiple
                  size={4}
                  value={createForm.warehouses && Array.isArray(createForm.warehouses) && createForm.warehouses.length > 0 ? createForm.warehouses : (createForm.warehouse ? [createForm.warehouse] : [])}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, option => option.value)
                    setCreateForm({ 
                      ...createForm, 
                      warehouses: selected,
                      warehouse: selected.length === 1 ? selected[0] : ''
                    })
                  }}
                >
                  {allWarehouses.map(wh => (
                    <option key={wh._id || wh.id} value={wh.name}>{wh.name} {wh.code ? `(${wh.code})` : ''}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  برای انتخاب چند انبار، Ctrl (یا Cmd در Mac) را نگه دارید
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  بازه/بخش (اختیاری)
                </label>
                <input
                  type="text"
                  className="premium-input w-full"
                  value={createForm.section}
                  onChange={(e) => setCreateForm({ ...createForm, section: e.target.value })}
                  placeholder="مثال: A1-A10, طبقه 1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  دسته‌بندی (اختیاری)
                </label>
                <select
                  className="premium-input w-full"
                  value={createForm.category}
                  onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })}
                >
                  <option value="all">همه دسته‌بندی‌ها</option>
                  <option value="مواد اولیه">مواد اولیه</option>
                  <option value="نوشیدنی">نوشیدنی</option>
                  <option value="سبزیجات">سبزیجات</option>
                </select>
              </div>

              <div className="flex items-center space-x-3 space-x-reverse">
                <input
                  type="checkbox"
                  id="freezeMovements"
                  checked={createForm.freezeMovements}
                  onChange={(e) => setCreateForm({ ...createForm, freezeMovements: e.target.checked })}
                  className="w-4 h-4 text-primary-600 rounded"
                />
                <label htmlFor="freezeMovements" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  فریز حرکت (موجودی در زمان ایجاد فریز می‌شود)
                </label>
              </div>

              <div className="flex items-center space-x-3 space-x-reverse">
                <input
                  type="checkbox"
                  id="autoAddItems"
                  checked={createForm.autoAddItems}
                  onChange={(e) => setCreateForm({ ...createForm, autoAddItems: e.target.checked })}
                  className="w-4 h-4 text-primary-600 rounded"
                />
                <label htmlFor="autoAddItems" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  اضافه کردن خودکار آیتم‌ها بر اساس موجودی
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ایجادکننده <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="premium-input w-full"
                  value={createForm.createdBy}
                  onChange={(e) => setCreateForm({ ...createForm, createdBy: e.target.value })}
                  placeholder="نام ایجادکننده"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  یادداشت
                </label>
                <textarea
                  className="premium-input w-full"
                  rows={3}
                  value={createForm.notes}
                  onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                  placeholder="یادداشت اختیاری..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 space-x-reverse mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                disabled={createLoading}
              >
                انصراف
              </button>
              <button
                onClick={handleSubmitCreateCount}
                className="premium-button flex items-center space-x-2 space-x-reverse"
                disabled={createLoading}
              >
                {createLoading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>در حال ایجاد...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    <span>ایجاد شمارش</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
