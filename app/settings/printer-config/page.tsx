'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Printer,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  AlertTriangle,
  Settings,
  Wifi,
  Cable,
  TestTube,
  FileText,
  ChefHat,
  Utensils,
  Coffee,
  Pizza,
  IceCream,
  Receipt,
  Search,
  RefreshCw,
  Loader,
  Tag,
  Usb,
  Bluetooth,
  Activity
} from 'lucide-react'
import PieChart from '@/components/Charts/PieChart'
import BarChart from '@/components/Charts/BarChart'

interface Printer {
  id?: string
  _id?: string
  name: string
  type: 'kitchen' | 'receipt' | 'label' | 'general'
  connection: 'usb' | 'network' | 'bluetooth'
  ipAddress?: string
  port?: number
  status: 'online' | 'offline' | 'error'
  location: string
  paperSize: '58mm' | '80mm' | 'A4'
  autoCut: boolean
  autoOpen: boolean
  createdAt?: string
  lastUsed?: string | null
  printCount?: number
  errorCount?: number
}

interface PrintRoute {
  id?: string
  _id?: string
  name: string
  source: string
  target: string
  conditions: string[]
  isActive: boolean
  createdAt?: string
}

interface StatsData {
  totalPrinters: number
  onlinePrinters: number
  offlinePrinters: number
  errorPrinters: number
  totalRoutes: number
  activeRoutes: number
  inactiveRoutes: number
  printersByType: {
    kitchen: number
    receipt: number
    label: number
    general: number
  }
  totalPrintCount: number
  totalErrorCount: number
  successRate: string
}

const getPrinterTypeIcon = (type: string) => {
  switch (type) {
    case 'kitchen': return ChefHat
    case 'receipt': return Receipt
    case 'label': return Tag
    case 'general': return Printer
    default: return Printer
  }
}

const getPrinterTypeColor = (type: string) => {
  switch (type) {
    case 'kitchen': return 'text-orange-600 dark:text-orange-400'
    case 'receipt': return 'text-green-600 dark:text-green-400'
    case 'label': return 'text-blue-600 dark:text-blue-400'
    case 'general': return 'text-gray-600 dark:text-gray-400'
    default: return 'text-gray-600 dark:text-gray-400'
  }
}

const getConnectionIcon = (connection: string) => {
  switch (connection) {
    case 'usb': return Usb
    case 'network': return Wifi
    case 'bluetooth': return Bluetooth
    default: return Cable
  }
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'online': return <span className="status-badge bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">آنلاین</span>
    case 'offline': return <span className="status-badge bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">آفلاین</span>
    case 'error': return <span className="status-badge bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">خطا</span>
    default: return null
  }
}

export default function PrinterConfigPage() {
  const [activeTab, setActiveTab] = useState<'printers' | 'routes' | 'test'>('printers')
  const [printers, setPrinters] = useState<Printer[]>([])
  const [routes, setRoutes] = useState<PrintRoute[]>([])
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPrinter, setSelectedPrinter] = useState<Printer | null>(null)
  const [selectedRoute, setSelectedRoute] = useState<PrintRoute | null>(null)
  const [showPrinterModal, setShowPrinterModal] = useState(false)
  const [showRouteModal, setShowRouteModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  
  // Form states
  const [printerForm, setPrinterForm] = useState({
    name: '',
    type: 'kitchen' as 'kitchen' | 'receipt' | 'label' | 'general',
    connection: 'usb' as 'usb' | 'network' | 'bluetooth',
    ipAddress: '',
    port: 9100,
    location: '',
    paperSize: '80mm' as '58mm' | '80mm' | 'A4',
    autoCut: false,
    autoOpen: false
  })
  
  const [routeForm, setRouteForm] = useState({
    name: '',
    source: 'POS',
    target: '',
    conditions: [] as string[],
    isActive: true
  })

  // Fetch printers
  const fetchPrinters = useCallback(async () => {
    try {
      const response = await fetch('/api/printer-config?type=printers')
      const result = await response.json()
      if (result.success) {
        setPrinters(result.data || [])
      }
    } catch (error) {
      console.error('Error fetching printers:', error)
      alert('خطا در دریافت چاپگرها')
    }
  }, [])

  // Fetch routes
  const fetchRoutes = useCallback(async () => {
    try {
      const response = await fetch('/api/printer-config?type=routes')
      const result = await response.json()
      if (result.success) {
        setRoutes(result.data || [])
      }
    } catch (error) {
      console.error('Error fetching routes:', error)
      alert('خطا در دریافت مسیرهای چاپ')
    }
  }, [])

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/printer-config?type=stats')
      const result = await response.json()
      if (result.success) {
        setStats(result.data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }, [])

  // Load data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([
        fetchPrinters(),
        fetchRoutes(),
        fetchStats()
      ])
      setLoading(false)
    }
    loadData()
  }, [fetchPrinters, fetchRoutes, fetchStats])

  const filteredPrinters = useMemo(() => {
    return printers.filter(printer =>
      (searchTerm === '' || 
        printer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        printer.location.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (filterType === 'all' || printer.type === filterType) &&
      (filterStatus === 'all' || printer.status === filterStatus)
    )
  }, [printers, searchTerm, filterType, filterStatus])

  // CRUD Handlers
  const handleCreatePrinter = () => {
    setSelectedPrinter(null)
    setPrinterForm({
      name: '',
      type: 'kitchen',
      connection: 'usb',
      ipAddress: '',
      port: 9100,
      location: '',
      paperSize: '80mm',
      autoCut: false,
      autoOpen: false
    })
    setShowPrinterModal(true)
  }

  const handleEditPrinter = (printer: Printer) => {
    setSelectedPrinter(printer)
    setPrinterForm({
      name: printer.name,
      type: printer.type,
      connection: printer.connection,
      ipAddress: printer.ipAddress || '',
      port: printer.port || 9100,
      location: printer.location,
      paperSize: printer.paperSize,
      autoCut: printer.autoCut,
      autoOpen: printer.autoOpen
    })
    setShowPrinterModal(true)
  }

  const handleDeletePrinter = async (printerId: string) => {
    if (!confirm('آیا از حذف این چاپگر اطمینان دارید؟')) {
      return
    }

    try {
      const response = await fetch(`/api/printer-config?entity=printer&id=${printerId}`, {
        method: 'DELETE'
      })
      const result = await response.json()
      
      if (result.success) {
        alert('چاپگر با موفقیت حذف شد')
        // Refresh data
        await Promise.all([fetchPrinters(), fetchStats()])
      } else {
        alert(result.message || 'خطا در حذف چاپگر')
      }
    } catch (error) {
      console.error('Error deleting printer:', error)
      alert('خطا در حذف چاپگر')
    }
  }

  const handleSavePrinter = async () => {
    try {
      if (!printerForm.name || !printerForm.type || !printerForm.connection) {
        alert('نام، نوع و اتصال چاپگر اجباری است')
        return
      }

      const method = selectedPrinter ? 'PUT' : 'POST'
      const body = {
        entity: 'printer',
        ...(selectedPrinter && { id: selectedPrinter._id || selectedPrinter.id }),
        ...printerForm
      }

      const response = await fetch('/api/printer-config', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const result = await response.json()

      if (result.success) {
        alert(selectedPrinter ? 'چاپگر با موفقیت به‌روزرسانی شد' : 'چاپگر با موفقیت ایجاد شد')
        setShowPrinterModal(false)
        setSelectedPrinter(null)
        setPrinterForm({
          name: '',
          type: 'kitchen',
          connection: 'usb',
          ipAddress: '',
          port: 9100,
          location: '',
          paperSize: '80mm',
          autoCut: false,
          autoOpen: false
        })
        // Refresh data
        await Promise.all([fetchPrinters(), fetchStats()])
      } else {
        alert(result.message || 'خطا در ذخیره چاپگر')
      }
    } catch (error) {
      console.error('Error saving printer:', error)
      alert('خطا در ذخیره چاپگر')
    }
  }

  const handleTestPrinter = async (printerId: string) => {
    try {
      // Test printer functionality - you can add actual test API call here
      alert('تست چاپگر انجام شد. (این قابلیت در حال توسعه است)')
    } catch (error) {
      console.error('Error testing printer:', error)
      alert('خطا در تست چاپگر')
    }
  }

  const handleCreateRoute = () => {
    setSelectedRoute(null)
    setRouteForm({
      name: '',
      source: 'POS',
      target: '',
      conditions: [],
      isActive: true
    })
    setShowRouteModal(true)
  }

  const handleEditRoute = (route: PrintRoute) => {
    setSelectedRoute(route)
    setRouteForm({
      name: route.name,
      source: route.source,
      target: route.target,
      conditions: route.conditions || [],
      isActive: route.isActive
    })
    setShowRouteModal(true)
  }

  const handleDeleteRoute = async (routeId: string) => {
    if (!confirm('آیا از حذف این مسیر چاپ اطمینان دارید؟')) {
      return
    }

    try {
      const response = await fetch(`/api/printer-config?entity=route&id=${routeId}`, {
        method: 'DELETE'
      })
      const result = await response.json()
      
      if (result.success) {
        alert('مسیر چاپ با موفقیت حذف شد')
        // Refresh data
        await Promise.all([fetchRoutes(), fetchStats()])
      } else {
        alert(result.message || 'خطا در حذف مسیر چاپ')
      }
    } catch (error) {
      console.error('Error deleting route:', error)
      alert('خطا در حذف مسیر چاپ')
    }
  }

  const handleSaveRoute = async () => {
    try {
      if (!routeForm.name || !routeForm.source || !routeForm.target) {
        alert('نام، منبع و مقصد مسیر چاپ اجباری است')
        return
      }

      const method = selectedRoute ? 'PUT' : 'POST'
      const body = {
        entity: 'route',
        ...(selectedRoute && { id: selectedRoute._id || selectedRoute.id }),
        ...routeForm
      }

      const response = await fetch('/api/printer-config', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const result = await response.json()

      if (result.success) {
        alert(selectedRoute ? 'مسیر چاپ با موفقیت به‌روزرسانی شد' : 'مسیر چاپ با موفقیت ایجاد شد')
        setShowRouteModal(false)
        setSelectedRoute(null)
        setRouteForm({
          name: '',
          source: 'POS',
          target: '',
          conditions: [],
          isActive: true
        })
        // Refresh data
        await Promise.all([fetchRoutes(), fetchStats()])
      } else {
        alert(result.message || 'خطا در ذخیره مسیر چاپ')
      }
    } catch (error) {
      console.error('Error saving route:', error)
      alert('خطا در ذخیره مسیر چاپ')
    }
  }

  // Chart data
  const printersByTypeChartData = useMemo(() => {
    if (!stats?.printersByType) return []
    const colors = ['#F97316', '#10B981', '#3B82F6', '#6B7280']
    return [
      { name: 'آشپزخانه', value: stats.printersByType.kitchen, color: colors[0] },
      { name: 'فاکتور', value: stats.printersByType.receipt, color: colors[1] },
      { name: 'برچسب', value: stats.printersByType.label, color: colors[2] },
      { name: 'عمومی', value: stats.printersByType.general, color: colors[3] }
    ].filter(item => item.value > 0)
  }, [stats])

  const printersStatusChartData = useMemo(() => {
    if (!stats) return []
    return [
      { period: 'آنلاین', revenue: stats.onlinePrinters },
      { period: 'آفلاین', revenue: stats.offlinePrinters },
      { period: 'خطا', revenue: stats.errorPrinters }
    ].filter(item => (item.revenue || 0) > 0)
  }, [stats])

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
          <h1 className="text-3xl font-bold gradient-text">تنظیمات چاپگرها</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            مدیریت چاپگرها، مسیرهای چاپ و تنظیمات مربوط به چاپ اسناد و سفارشات.
          </p>
        </div>
        <div className="flex items-center space-x-3 space-x-reverse">
          <button
            onClick={handleCreatePrinter}
            className="premium-button flex items-center space-x-2 space-x-reverse"
          >
            <Plus className="w-5 h-5" />
            <span>چاپگر جدید</span>
          </button>
          <button
            onClick={handleCreateRoute}
            className="premium-button flex items-center space-x-2 space-x-reverse"
          >
            <Settings className="w-5 h-5" />
            <span>مسیر چاپ جدید</span>
          </button>
        </div>
      </div>

      {/* Stats Dashboard */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="premium-card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">کل چاپگرها</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalPrinters}</p>
              </div>
              <Printer className="w-8 h-8 text-primary-600" />
            </div>
          </div>
          <div className="premium-card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">آنلاین</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.onlinePrinters}</p>
              </div>
              <Activity className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="premium-card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">کل مسیرها</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalRoutes}</p>
              </div>
              <Settings className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="premium-card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">نرخ موفقیت</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.successRate}%</p>
              </div>
              <Activity className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>
      )}

      {/* Charts */}
      {(printersByTypeChartData.length > 0 || printersStatusChartData.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {printersByTypeChartData.length > 0 && (
            <div className="premium-card p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">توزیع چاپگرها بر اساس نوع</h3>
              <div className="h-64">
                <PieChart data={printersByTypeChartData} title="انواع چاپگرها" />
              </div>
            </div>
          )}
          {printersStatusChartData.length > 0 && (
            <div className="premium-card p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">وضعیت چاپگرها</h3>
              <div className="h-64">
                <BarChart data={printersStatusChartData} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="premium-card p-6">
        <div className="flex space-x-1 space-x-reverse bg-gray-100 dark:bg-gray-800 rounded-lg p-1 mb-6">
          <button
            onClick={() => setActiveTab('printers')}
            className={`flex-1 flex items-center justify-center space-x-2 space-x-reverse px-4 py-2 rounded-md transition-all duration-200 ${
              activeTab === 'printers'
                ? 'bg-white dark:bg-gray-700 text-primary-600 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Printer className="w-5 h-5" />
            <span>چاپگرها</span>
          </button>
          <button
            onClick={() => setActiveTab('routes')}
            className={`flex-1 flex items-center justify-center space-x-2 space-x-reverse px-4 py-2 rounded-md transition-all duration-200 ${
              activeTab === 'routes'
                ? 'bg-white dark:bg-gray-700 text-primary-600 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Settings className="w-5 h-5" />
            <span>مسیرهای چاپ</span>
          </button>
          <button
            onClick={() => setActiveTab('test')}
            className={`flex-1 flex items-center justify-center space-x-2 space-x-reverse px-4 py-2 rounded-md transition-all duration-200 ${
              activeTab === 'test'
                ? 'bg-white dark:bg-gray-700 text-primary-600 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <TestTube className="w-5 h-5" />
            <span>تست چاپ</span>
          </button>
        </div>

        {/* Printers Tab */}
        {activeTab === 'printers' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="جستجو چاپگر..."
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
                <option value="kitchen">آشپزخانه</option>
                <option value="receipt">فاکتور</option>
                <option value="label">برچسب</option>
                <option value="general">عمومی</option>
              </select>
              <select
                className="premium-input"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">همه وضعیت‌ها</option>
                <option value="online">آنلاین</option>
                <option value="offline">آفلاین</option>
                <option value="error">خطا</option>
              </select>
            </div>

            {/* Printers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPrinters.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <Printer className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-300">چاپگری یافت نشد</p>
                </div>
              ) : (
                filteredPrinters.map(printer => {
                  const TypeIcon = getPrinterTypeIcon(printer.type)
                  const ConnectionIcon = getConnectionIcon(printer.connection)
                  return (
                    <div key={printer.id || printer._id} className="premium-card p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3 space-x-reverse">
                        <div className={`w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center`}>
                          <TypeIcon className={`w-6 h-6 ${getPrinterTypeColor(printer.type)}`} />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{printer.name}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{printer.location}</p>
                        </div>
                      </div>
                      {getStatusBadge(printer.status)}
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">نوع:</span>
                        <span className="text-gray-900 dark:text-white">
                          {printer.type === 'kitchen' ? 'آشپزخانه' :
                           printer.type === 'receipt' ? 'فاکتور' :
                           printer.type === 'label' ? 'برچسب' : 'عمومی'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">اتصال:</span>
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <ConnectionIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                          <span className="text-gray-900 dark:text-white">
                            {printer.connection === 'usb' ? 'USB' :
                             printer.connection === 'network' ? 'شبکه' : 'بلوتوث'}
                          </span>
                        </div>
                      </div>
                      {printer.ipAddress && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">IP:</span>
                          <span className="text-gray-900 dark:text-white">{printer.ipAddress}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">اندازه کاغذ:</span>
                        <span className="text-gray-900 dark:text-white">{printer.paperSize}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">تعداد چاپ:</span>
                        <span className="text-gray-900 dark:text-white">{(printer.printCount || 0).toLocaleString('fa-IR')}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        آخرین استفاده: {printer.lastUsed ? new Date(printer.lastUsed).toLocaleDateString('fa-IR') : '-'}
                      </div>
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <button
                          onClick={() => handleTestPrinter(printer._id || printer.id || '')}
                          className="p-1 rounded-full text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                          title="تست چاپ"
                        >
                          <TestTube className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEditPrinter(printer)
                          }}
                          className="p-1 rounded-full text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                          title="ویرایش"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeletePrinter(printer._id || printer.id || '')
                          }}
                          className="p-1 rounded-full text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
                })
              )}
            </div>
          </div>
        )}

        {/* Routes Tab */}
        {activeTab === 'routes' && (
          <div className="space-y-6">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-right whitespace-nowrap">
                <thead>
                  <tr className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-800/50">
                    <th className="px-4 py-3 rounded-r-lg">نام مسیر</th>
                    <th className="px-4 py-3">منبع</th>
                    <th className="px-4 py-3">مقصد</th>
                    <th className="px-4 py-3">شرایط</th>
                    <th className="px-4 py-3">وضعیت</th>
                    <th className="px-4 py-3">تاریخ ایجاد</th>
                    <th className="px-4 py-3 rounded-l-lg">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {routes.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                        مسیر چاپی یافت نشد
                      </td>
                    </tr>
                  ) : (
                    routes.map(route => (
                      <tr key={route.id || route._id} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{route.name}</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{route.source}</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{route.target}</td>
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            {(route.conditions || []).map((condition, index) => (
                              <span key={index} className="inline-block px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full">
                                {condition}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {route.isActive ? (
                            <span className="status-badge bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">فعال</span>
                          ) : (
                            <span className="status-badge bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300">غیرفعال</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-200">
                          {route.createdAt ? new Date(route.createdAt).toLocaleDateString('fa-IR') : '-'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleEditRoute(route)
                              }}
                              className="p-1 rounded-full text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteRoute(route._id || route.id || '')
                              }}
                              className="p-1 rounded-full text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Test Tab */}
        {activeTab === 'test' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {printers.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <Printer className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-300">چاپگری برای تست یافت نشد</p>
                </div>
              ) : (
                printers.map(printer => {
                  const TypeIcon = getPrinterTypeIcon(printer.type)
                  return (
                    <div key={printer.id || printer._id} className="premium-card p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3 space-x-reverse">
                          <TypeIcon className={`w-6 h-6 ${getPrinterTypeColor(printer.type)}`} />
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{printer.name}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{printer.location}</p>
                          </div>
                        </div>
                        {getStatusBadge(printer.status)}
                      </div>
                      
                      <div className="space-y-3">
                        <button
                          onClick={() => handleTestPrinter(printer._id || printer.id || '')}
                          className="w-full premium-button flex items-center justify-center space-x-2 space-x-reverse"
                        >
                          <TestTube className="w-5 h-5" />
                          <span>تست چاپ</span>
                        </button>
                        <button
                          className="w-full premium-button bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 flex items-center justify-center space-x-2 space-x-reverse"
                        >
                          <FileText className="w-5 h-5" />
                          <span>چاپ فاکتور نمونه</span>
                        </button>
                        {printer.type === 'kitchen' && (
                          <button
                            className="w-full premium-button bg-orange-200 text-orange-800 hover:bg-orange-300 dark:bg-orange-900/30 dark:text-orange-300 dark:hover:bg-orange-900/50 flex items-center justify-center space-x-2 space-x-reverse"
                          >
                            <ChefHat className="w-5 h-5" />
                            <span>چاپ سفارش آشپزخانه</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Printer Modal */}
      {showPrinterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {selectedPrinter ? 'ویرایش چاپگر' : 'چاپگر جدید'}
              </h2>
              <button
                onClick={() => setShowPrinterModal(false)}
                className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">نام چاپگر *</label>
                <input
                  type="text"
                  className="premium-input"
                  value={printerForm.name}
                  onChange={(e) => setPrinterForm({ ...printerForm, name: e.target.value })}
                  placeholder="نام چاپگر را وارد کنید"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">نوع چاپگر *</label>
                  <select
                    className="premium-input"
                    value={printerForm.type}
                    onChange={(e) => setPrinterForm({ ...printerForm, type: e.target.value as any })}
                  >
                    <option value="kitchen">آشپزخانه</option>
                    <option value="receipt">فاکتور</option>
                    <option value="label">برچسب</option>
                    <option value="general">عمومی</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">نوع اتصال *</label>
                  <select
                    className="premium-input"
                    value={printerForm.connection}
                    onChange={(e) => setPrinterForm({ ...printerForm, connection: e.target.value as any })}
                  >
                    <option value="usb">USB</option>
                    <option value="network">شبکه</option>
                    <option value="bluetooth">بلوتوث</option>
                  </select>
                </div>
              </div>
              {printerForm.connection === 'network' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">آدرس IP</label>
                    <input
                      type="text"
                      className="premium-input"
                      value={printerForm.ipAddress}
                      onChange={(e) => setPrinterForm({ ...printerForm, ipAddress: e.target.value })}
                      placeholder="192.168.1.100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">پورت</label>
                    <input
                      type="number"
                      className="premium-input"
                      value={printerForm.port}
                      onChange={(e) => setPrinterForm({ ...printerForm, port: parseInt(e.target.value) || 9100 })}
                      placeholder="9100"
                    />
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">مکان</label>
                <input
                  type="text"
                  className="premium-input"
                  value={printerForm.location}
                  onChange={(e) => setPrinterForm({ ...printerForm, location: e.target.value })}
                  placeholder="مکان چاپگر را وارد کنید"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">اندازه کاغذ</label>
                <select
                  className="premium-input"
                  value={printerForm.paperSize}
                  onChange={(e) => setPrinterForm({ ...printerForm, paperSize: e.target.value as any })}
                >
                  <option value="58mm">58mm</option>
                  <option value="80mm">80mm</option>
                  <option value="A4">A4</option>
                </select>
              </div>
              <div className="flex items-center space-x-4 space-x-reverse">
                <label className="flex items-center space-x-2 space-x-reverse">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    checked={printerForm.autoCut}
                    onChange={(e) => setPrinterForm({ ...printerForm, autoCut: e.target.checked })}
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">برش خودکار</span>
                </label>
                <label className="flex items-center space-x-2 space-x-reverse">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    checked={printerForm.autoOpen}
                    onChange={(e) => setPrinterForm({ ...printerForm, autoOpen: e.target.checked })}
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">باز کردن خودکار</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 space-x-reverse mt-6">
              <button
                onClick={() => {
                  setShowPrinterModal(false)
                  setSelectedPrinter(null)
                  setPrinterForm({
                    name: '',
                    type: 'kitchen',
                    connection: 'usb',
                    ipAddress: '',
                    port: 9100,
                    location: '',
                    paperSize: '80mm',
                    autoCut: false,
                    autoOpen: false
                  })
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                انصراف
              </button>
              <button
                onClick={handleSavePrinter}
                className="premium-button flex items-center space-x-2 space-x-reverse"
              >
                <Save className="w-5 h-5" />
                <span>ذخیره</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Route Modal */}
      {showRouteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {selectedRoute ? 'ویرایش مسیر چاپ' : 'مسیر چاپ جدید'}
              </h2>
              <button
                onClick={() => {
                  setShowRouteModal(false)
                  setSelectedRoute(null)
                  setRouteForm({
                    name: '',
                    source: 'POS',
                    target: '',
                    conditions: [],
                    isActive: true
                  })
                }}
                className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">نام مسیر *</label>
                <input
                  type="text"
                  className="premium-input"
                  value={routeForm.name}
                  onChange={(e) => setRouteForm({ ...routeForm, name: e.target.value })}
                  placeholder="نام مسیر چاپ را وارد کنید"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">منبع *</label>
                <select
                  className="premium-input"
                  value={routeForm.source}
                  onChange={(e) => setRouteForm({ ...routeForm, source: e.target.value })}
                >
                  <option value="POS">سیستم POS</option>
                  <option value="Kitchen">آشپزخانه</option>
                  <option value="Inventory">انبار</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">مقصد (چاپگر) *</label>
                <select
                  className="premium-input"
                  value={routeForm.target}
                  onChange={(e) => setRouteForm({ ...routeForm, target: e.target.value })}
                >
                  <option value="">انتخاب چاپگر</option>
                  {printers.map(printer => (
                    <option key={printer.id || printer._id} value={printer.name}>{printer.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">شرایط</label>
                <div className="space-y-2 p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <label className="flex items-center space-x-3 space-x-reverse">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      checked={routeForm.conditions.includes('دسته‌بندی: غذاهای اصلی')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setRouteForm({ ...routeForm, conditions: [...routeForm.conditions, 'دسته‌بندی: غذاهای اصلی'] })
                        } else {
                          setRouteForm({ ...routeForm, conditions: routeForm.conditions.filter(c => c !== 'دسته‌بندی: غذاهای اصلی') })
                        }
                      }}
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">غذاهای اصلی</span>
                  </label>
                  <label className="flex items-center space-x-3 space-x-reverse">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      checked={routeForm.conditions.includes('دسته‌بندی: نوشیدنی')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setRouteForm({ ...routeForm, conditions: [...routeForm.conditions, 'دسته‌بندی: نوشیدنی'] })
                        } else {
                          setRouteForm({ ...routeForm, conditions: routeForm.conditions.filter(c => c !== 'دسته‌بندی: نوشیدنی') })
                        }
                      }}
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">نوشیدنی</span>
                  </label>
                  <label className="flex items-center space-x-3 space-x-reverse">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      checked={routeForm.conditions.includes('وضعیت: جدید')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setRouteForm({ ...routeForm, conditions: [...routeForm.conditions, 'وضعیت: جدید'] })
                        } else {
                          setRouteForm({ ...routeForm, conditions: routeForm.conditions.filter(c => c !== 'وضعیت: جدید') })
                        }
                      }}
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">وضعیت: جدید</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="flex items-center space-x-2 space-x-reverse">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    checked={routeForm.isActive}
                    onChange={(e) => setRouteForm({ ...routeForm, isActive: e.target.checked })}
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">فعال</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 space-x-reverse mt-6">
              <button
                onClick={() => {
                  setShowRouteModal(false)
                  setSelectedRoute(null)
                  setRouteForm({
                    name: '',
                    source: 'POS',
                    target: '',
                    conditions: [],
                    isActive: true
                  })
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                انصراف
              </button>
              <button
                onClick={handleSaveRoute}
                className="premium-button flex items-center space-x-2 space-x-reverse"
              >
                <Save className="w-5 h-5" />
                <span>ذخیره</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}