'use client'

import React, { useState, useEffect } from 'react'
import {
  AlertTriangle,
  Package,
  Bell,
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  Filter,
  MapPin,
  User,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Download,
  Printer,
  RefreshCw,
  ArrowUpRight,
  ArrowDownLeft,
  ClipboardList,
  Settings,
  Calendar,
  DollarSign,
  Activity,
  FileText,
  Warehouse,
  Loader,
  ShoppingCart,
  AlertCircle,
  Zap,
  Target,
  Save,
  X,
  CheckCircle2,
  Info
} from 'lucide-react'

interface StockAlertData {
  _id: string
  itemId: string
  itemName: string
  itemCode: string
  category: string
  warehouse: string
  type: 'low_stock' | 'out_of_stock' | 'expiry' | 'overstock'
  alertTypeCode?: 'LOW_STOCK' | 'NEAR_REORDER' | 'OVERSTOCK' | 'EXPIRY_SOON' | 'OUT_OF_STOCK'
  severity: 'low' | 'medium' | 'high' | 'critical'
  currentStock: number
  minStock: number
  reorderPoint?: number
  maxStock: number
  expiryDate?: string
  daysToExpiry?: number
  message: string
  status: 'active' | 'resolved' | 'dismissed'
  alertStatus?: 'critical' | 'needs_action' | 'resolved' // وضعیت تجمیعی
  priority: 'low' | 'normal' | 'high' | 'urgent'
  assignedTo?: string
  resolvedBy?: string
  resolvedAt?: string
  resolution?: string
  notes: string
  actions?: AlertAction[]
  createdAt: string
  updatedAt: string
}

interface AlertAction {
  actionType: 'purchase_order' | 'transfer' | 'adjustment' | 'other'
  description: string
  performedBy: string
  metadata?: any
  performedAt: string
}

interface StockAlertStats {
  totalAlerts: number
  activeAlerts: number
  resolvedAlerts: number
  dismissedAlerts: number
  criticalAlerts: number
  needsActionAlerts: number
  highAlerts: number
  mediumAlerts: number
  lowAlerts: number
  lowStockAlerts: number
  nearReorderAlerts: number
  outOfStockAlerts: number
  expiryAlerts: number
  overstockAlerts: number
}

const getAlertTypeColor = (type: string) => {
  switch (type) {
    case 'low_stock': return 'text-yellow-600 dark:text-yellow-400'
    case 'out_of_stock': return 'text-red-600 dark:text-red-400'
    case 'expiry': return 'text-orange-600 dark:text-orange-400'
    case 'overstock': return 'text-blue-600 dark:text-blue-400'
    default: return 'text-gray-600 dark:text-gray-400'
  }
}

const getAlertTypeBadge = (type: string) => {
  switch (type) {
    case 'low_stock': return <span className="status-badge bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">موجودی کم</span>
    case 'out_of_stock': return <span className="status-badge bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">تمام شده</span>
    case 'expiry': return <span className="status-badge bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">انقضا</span>
    case 'overstock': return <span className="status-badge bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">موجودی اضافی</span>
    default: return null
  }
}

const getSeverityBadge = (severity: string) => {
  switch (severity) {
    case 'low': return <span className="status-badge bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300">کم</span>
    case 'medium': return <span className="status-badge bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">متوسط</span>
    case 'high': return <span className="status-badge bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">بالا</span>
    case 'critical': return <span className="status-badge bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">بحرانی</span>
    default: return null
  }
}

const getStatusBadge = (status: string, alertStatus?: string) => {
  // استفاده از alertStatus اگر موجود باشد
  if (alertStatus) {
    switch (alertStatus) {
      case 'critical': return <span className="status-badge bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">بحرانی</span>
      case 'needs_action': return <span className="status-badge bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">نیاز به اقدام</span>
      case 'resolved': return <span className="status-badge bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">حل شده</span>
      default: return null
    }
  }
  
  // fallback به status قدیمی
  switch (status) {
    case 'active': return <span className="status-badge bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">فعال</span>
    case 'resolved': return <span className="status-badge bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">حل شده</span>
    case 'dismissed': return <span className="status-badge bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300">نادیده گرفته</span>
    default: return null
  }
}

const getAlertTypeCodeBadge = (alertTypeCode?: string) => {
  switch (alertTypeCode) {
    case 'LOW_STOCK': return <span className="status-badge bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">موجودی کم</span>
    case 'NEAR_REORDER': return <span className="status-badge bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">نزدیک به سفارش</span>
    case 'OVERSTOCK': return <span className="status-badge bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">موجودی اضافی</span>
    case 'EXPIRY_SOON': return <span className="status-badge bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">انقضا نزدیک</span>
    case 'OUT_OF_STOCK': return <span className="status-badge bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">تمام شده</span>
    default: return null
  }
}

const getPriorityBadge = (priority: string) => {
  switch (priority) {
    case 'low': return <span className="status-badge bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300">کم</span>
    case 'normal': return <span className="status-badge bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">عادی</span>
    case 'high': return <span className="status-badge bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">بالا</span>
    case 'urgent': return <span className="status-badge bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">فوری</span>
    default: return null
  }
}

interface Warehouse {
  _id: string
  name: string
  code?: string
}

export default function StockAlertsPage() {
  const [alerts, setAlerts] = useState<StockAlertData[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [stats, setStats] = useState<StockAlertStats>({
    totalAlerts: 0,
    activeAlerts: 0,
    resolvedAlerts: 0,
    dismissedAlerts: 0,
    criticalAlerts: 0,
    needsActionAlerts: 0,
    highAlerts: 0,
    mediumAlerts: 0,
    lowAlerts: 0,
    lowStockAlerts: 0,
    nearReorderAlerts: 0,
    outOfStockAlerts: 0,
    expiryAlerts: 0,
    overstockAlerts: 0
  })
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterAlertStatus, setFilterAlertStatus] = useState('all')
  const [showActionModal, setShowActionModal] = useState(false)
  const [actionFormData, setActionFormData] = useState({
    actionType: 'purchase_order' as 'purchase_order' | 'transfer' | 'adjustment' | 'other',
    description: '',
    metadata: {}
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterSeverity, setFilterSeverity] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterWarehouse, setFilterWarehouse] = useState('all')
  const [selectedAlert, setSelectedAlert] = useState<StockAlertData | null>(null)
  const [showAlertModal, setShowAlertModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingAlert, setEditingAlert] = useState<StockAlertData | null>(null)
  const [showPurchaseOrderModal, setShowPurchaseOrderModal] = useState(false)
  const [showMinStockModal, setShowMinStockModal] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportData, setReportData] = useState<any>(null)
  const [actionLoading, setActionLoading] = useState(false)

  // فرم ایجاد/ویرایش هشدار
  const [formData, setFormData] = useState({
    itemId: '',
    itemName: '',
    itemCode: '',
    category: '',
    warehouse: '',
    type: 'low_stock',
    severity: 'medium',
    currentStock: 0,
    minStock: 0,
    maxStock: 0,
    expiryDate: '',
    daysToExpiry: 0,
    message: '',
    status: 'active',
    priority: 'normal',
    assignedTo: '',
    notes: ''
  })

  // بارگذاری انبارها
  const fetchWarehouses = async () => {
    try {
      const response = await fetch('/api/warehouses?status=active&limit=100')
      const data = await response.json()
      
      if (data.success && data.data) {
        const warehousesList = Array.isArray(data.data) ? data.data : []
        setWarehouses(warehousesList)
      }
    } catch (error) {
      console.error('Error fetching warehouses:', error)
    }
  }

  // بارگذاری داده‌ها
  const fetchAlerts = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/stock-alerts?limit=1000')
      const data = await response.json()
      
      console.log('Stock alerts API response:', data)
      console.log('Alerts count:', data.data?.length || 0)
      console.log('Sample alerts:', data.data?.slice(0, 5).map((a: any) => ({
        itemName: a.itemName,
        warehouse: a.warehouse,
        type: a.type,
        status: a.status
      })))
      
      if (data.success) {
        setAlerts(data.data || [])
        setStats(data.stats || {
          totalAlerts: 0,
          activeAlerts: 0,
          resolvedAlerts: 0,
          dismissedAlerts: 0,
          criticalAlerts: 0,
          highAlerts: 0,
          mediumAlerts: 0,
          lowAlerts: 0,
          lowStockAlerts: 0,
          outOfStockAlerts: 0,
          expiryAlerts: 0,
          overstockAlerts: 0
        })
      }
    } catch (error) {
      console.error('Error fetching stock alerts:', error)
    } finally {
      setLoading(false)
    }
  }

  // ایجاد هشدار جدید
  const handleCreateAlert = async () => {
    try {
      const response = await fetch('/api/stock-alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })
      
      const data = await response.json()
      
      if (data.success) {
        alert('هشدار با موفقیت ایجاد شد')
        setShowCreateModal(false)
        resetForm()
        fetchAlerts()
      } else {
        alert('خطا در ایجاد هشدار: ' + data.message)
      }
    } catch (error) {
      console.error('Error creating stock alert:', error)
      alert('خطا در ایجاد هشدار')
    }
  }

  // به‌روزرسانی هشدار
  const handleUpdateAlert = async () => {
    if (!editingAlert) return

    try {
      const response = await fetch(`/api/stock-alerts/${editingAlert._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })
      
      const data = await response.json()
      
      if (data.success) {
        alert('هشدار با موفقیت به‌روزرسانی شد')
        setShowAlertModal(false)
        setEditingAlert(null)
        resetForm()
        fetchAlerts()
      } else {
        alert('خطا در به‌روزرسانی هشدار: ' + data.message)
      }
    } catch (error) {
      console.error('Error updating stock alert:', error)
      alert('خطا در به‌روزرسانی هشدار')
    }
  }

  // حذف هشدار
  const handleDeleteAlert = async (alertId: string) => {
    if (!confirm('آیا از حذف این هشدار اطمینان دارید؟')) return

    try {
      const response = await fetch(`/api/stock-alerts/${alertId}`, {
        method: 'DELETE',
      })
      
      const data = await response.json()
      
      if (data.success) {
        alert('هشدار با موفقیت حذف شد')
        fetchAlerts()
      } else {
        alert('خطا در حذف هشدار: ' + data.message)
      }
    } catch (error) {
      console.error('Error deleting stock alert:', error)
      alert('خطا در حذف هشدار')
    }
  }

  // تغییر وضعیت هشدار
  const handleStatusChange = async (alertId: string, newStatus: string, resolution?: string) => {
    try {
      const response = await fetch(`/api/stock-alerts/${alertId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status: newStatus,
          resolution: resolution || '',
          resolvedBy: 'کاربر فعلی',
          notes: `وضعیت به ${newStatus} تغییر یافت`
        }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        alert(`وضعیت هشدار به ${newStatus} تغییر یافت`)
        fetchAlerts()
      } else {
        alert('خطا در تغییر وضعیت: ' + data.message)
      }
    } catch (error) {
      console.error('Error changing status:', error)
      alert('خطا در تغییر وضعیت')
    }
  }

  // محاسبه و به‌روزرسانی هشدارها
  const handleCalculateAlerts = async () => {
    try {
      setActionLoading(true)
      const response = await fetch('/api/stock-alerts/calculate', {
        method: 'POST',
      })
      
      const data = await response.json()
      
      if (data.success) {
        alert(`هشدارها به‌روزرسانی شدند: ${data.data.created} ایجاد، ${data.data.updated} به‌روزرسانی، ${data.data.resolved} حل شده`)
        fetchAlerts()
      } else {
        alert('خطا در محاسبه هشدارها: ' + data.message)
      }
    } catch (error) {
      console.error('Error calculating alerts:', error)
      alert('خطا در محاسبه هشدارها')
    } finally {
      setActionLoading(false)
    }
  }

  // ثبت اقدام برای هشدار
  const handleAddAction = async (alert: StockAlertData) => {
    setSelectedAlert(alert)
    setActionFormData({
      actionType: 'purchase_order',
      description: '',
      metadata: {}
    })
    setShowActionModal(true)
  }

  const handleSubmitAction = async () => {
    if (!selectedAlert || !actionFormData.description.trim()) {
      alert('توضیحات اقدام اجباری است')
      return
    }

    try {
      setActionLoading(true)
      const response = await fetch(`/api/stock-alerts/${selectedAlert._id}/actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...actionFormData,
          performedBy: 'کاربر سیستم' // در آینده از authentication بگیر
        }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        alert('اقدام با موفقیت ثبت شد')
        setShowActionModal(false)
        fetchAlerts()
      } else {
        alert('خطا در ثبت اقدام: ' + data.message)
      }
    } catch (error) {
      console.error('Error adding action:', error)
      alert('خطا در ثبت اقدام')
    } finally {
      setActionLoading(false)
    }
  }

  // محاسبه وضعیت تجمیعی هشدار
  const calculateAlertStatus = (alert: StockAlertData): 'critical' | 'needs_action' | 'resolved' => {
    if (alert.status === 'resolved' || alert.status === 'dismissed') {
      return 'resolved'
    }
    
    if (alert.severity === 'critical' || alert.currentStock === 0) {
      return 'critical'
    }
    
    return 'needs_action'
  }

  // بازنشانی فرم
  const resetForm = () => {
    setFormData({
      itemId: '',
      itemName: '',
      itemCode: '',
      category: '',
      warehouse: '',
      type: 'low_stock',
      severity: 'medium',
      currentStock: 0,
      minStock: 0,
      maxStock: 0,
      expiryDate: '',
      daysToExpiry: 0,
      message: '',
      status: 'active',
      priority: 'normal',
      assignedTo: '',
      notes: ''
    })
  }

  // شروع ویرایش
  const handleEditAlert = (alert: StockAlertData) => {
    setEditingAlert(alert)
    setFormData({
      itemId: alert.itemId,
      itemName: alert.itemName,
      itemCode: alert.itemCode,
      category: alert.category,
      warehouse: alert.warehouse,
      type: alert.type,
      severity: alert.severity,
      currentStock: alert.currentStock,
      minStock: alert.minStock,
      maxStock: alert.maxStock,
      expiryDate: alert.expiryDate || '',
      daysToExpiry: alert.daysToExpiry || 0,
      message: alert.message,
      status: alert.status,
      priority: alert.priority,
      assignedTo: alert.assignedTo || '',
      notes: alert.notes
    })
    setShowAlertModal(true)
  }

  // مشاهده جزئیات هشدار
  const handleViewAlert = (alert: StockAlertData) => {
    setSelectedAlert(alert)
    setShowAlertModal(true)
  }

  // فیلتر هشدارها - نمایش همه هشدارهایی که انبارشان در لیست انبارهای واقعی وجود دارد یا "تایماز" است
  const filteredAlerts = alerts.map(alert => ({
    ...alert,
    alertStatus: calculateAlertStatus(alert)
  })).filter(alert => {
    const alertWarehouse = alert.warehouse || ''
    const alertStatus = alert.alertStatus || calculateAlertStatus(alert)
    
    // بررسی اینکه آیا انبار "تایماز" است (با هر نامی)
    const isTaymaz = alertWarehouse && (
      alertWarehouse === 'تایماز' || 
      alertWarehouse.toLowerCase().includes('taymaz') ||
      alertWarehouse.includes('تایماز')
    )
    
    // بررسی اینکه انبار در لیست انبارهای واقعی وجود دارد
    const warehouseExists = warehouses.length > 0 && warehouses.some(w => {
      const warehouseName = w.name || ''
      return warehouseName === alertWarehouse || 
             warehouseName.toLowerCase() === alertWarehouse.toLowerCase() ||
             warehouseName.includes(alertWarehouse) ||
             alertWarehouse.includes(warehouseName)
    })
    
    // فیلتر انبار
    if (filterWarehouse !== 'all') {
      const warehouseMatch = alertWarehouse === filterWarehouse || 
                            alertWarehouse.toLowerCase() === filterWarehouse.toLowerCase() ||
                            (filterWarehouse === 'تایماز' && isTaymaz)
      if (!warehouseMatch) return false
    } else {
      // اگر انبارها لود شده‌اند، فقط انبارهای موجود را نمایش بده
      if (warehouses.length > 0 && !warehouseExists && !isTaymaz) {
        return false
      }
      // اگر انبارها لود نشده‌اند، فقط "تایماز" را نمایش بده
      if (warehouses.length === 0 && !isTaymaz) {
        return false
      }
    }
    
    // فیلتر دسته‌بندی
    if (filterCategory !== 'all' && alert.category !== filterCategory) {
      return false
    }
    
    // فیلتر وضعیت تجمیعی
    if (filterAlertStatus !== 'all' && alertStatus !== filterAlertStatus) {
      return false
    }
    
    // فیلترهای دیگر
    return (
      (searchTerm === '' || 
        alert.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.itemCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alertWarehouse.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.message.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (filterType === 'all' || alert.type === filterType) &&
      (filterSeverity === 'all' || alert.severity === filterSeverity) &&
      (filterStatus === 'all' || alert.status === filterStatus)
    )
  })

  // ایجاد سفارش خرید فوری
  const handleQuickPurchaseOrder = async () => {
    try {
      setActionLoading(true)
      // در حال حاضر API خودش آیتم‌های کم‌موجود را پیدا می‌کند
      // اما اگر هشدارهای فعال وجود دارد، آن‌ها را ارسال می‌کنیم
      const activeLowStockAlerts = alerts.filter(
        alert => alert.status === 'active' && 
        (alert.type === 'low_stock' || alert.type === 'out_of_stock')
      )

      const alertIds = activeLowStockAlerts.length > 0 
        ? activeLowStockAlerts.map(alert => alert._id)
        : []
      
      const response = await fetch('/api/stock-alerts/quick-purchase-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          alertIds: alertIds.length > 0 ? alertIds : undefined,
          supplierName: 'تامین‌کننده عمومی',
          notes: 'سفارش فوری برای آیتم‌های کم‌موجود'
        }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        alert(`سفارش خرید ${data.data.orderNumber} برای ${data.data.totalItems} آیتم با موفقیت ایجاد شد`)
        setShowPurchaseOrderModal(false)
        fetchAlerts()
        // اگر از آیتم‌های موجودی استفاده شده، لیست موجودی را هم به‌روزرسانی کن
        if (alertIds.length === 0) {
          // می‌توانید در اینجا لیست موجودی را هم refresh کنید
        }
      } else {
        alert('خطا در ایجاد سفارش خرید: ' + data.message)
      }
    } catch (error) {
      console.error('Error creating purchase order:', error)
      alert('خطا در ایجاد سفارش خرید')
    } finally {
      setActionLoading(false)
    }
  }

  // تنظیم حداقل موجودی
  const handleUpdateMinStock = async (strategy: string, factor?: number) => {
    try {
      setActionLoading(true)
      
      const response = await fetch('/api/stock-alerts/update-min-stock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          strategy,
          adjustmentFactor: factor
        }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        alert(`${data.data.updatedCount} آیتم با موفقیت به‌روزرسانی شد`)
        setShowMinStockModal(false)
        fetchAlerts()
      } else {
        alert('خطا در تنظیم حداقل موجودی: ' + data.message)
      }
    } catch (error) {
      console.error('Error updating min stock:', error)
      alert('خطا در تنظیم حداقل موجودی')
    } finally {
      setActionLoading(false)
    }
  }

  // دریافت گزارش تحلیلی
  const handleGetAnalyticalReport = async () => {
    try {
      setActionLoading(true)
      
      const response = await fetch('/api/stock-alerts/analytical-report?period=30')
      const data = await response.json()
      
      if (data.success) {
        setReportData(data.data)
        setShowReportModal(true)
      } else {
        alert('خطا در دریافت گزارش: ' + data.message)
      }
    } catch (error) {
      console.error('Error fetching report:', error)
      alert('خطا در دریافت گزارش')
    } finally {
      setActionLoading(false)
    }
  }

  useEffect(() => {
    fetchWarehouses()
    fetchAlerts()
  }, [])

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
          <h1 className="text-3xl font-bold gradient-text">هشدارهای موجودی</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            نظارت بر موجودی‌ها و دریافت هشدارهای هوشمند برای مدیریت بهتر انبار.
          </p>
        </div>
        <div className="flex items-center space-x-3 space-x-reverse">
          <button
            onClick={() => setShowCreateModal(true)}
            className="premium-button flex items-center space-x-2 space-x-reverse"
          >
            <Plus className="w-5 h-5" />
            <span>هشدار جدید</span>
          </button>
          <button
            onClick={handleCalculateAlerts}
            disabled={actionLoading}
            className="premium-button flex items-center space-x-2 space-x-reverse disabled:opacity-50"
          >
            <Zap className="w-5 h-5" />
            <span>محاسبه هشدارها</span>
          </button>
          <button
            onClick={fetchAlerts}
            className="premium-button p-3"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="premium-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">بحرانی</h3>
            <AlertCircle className="w-6 h-6 text-danger-600" />
          </div>
          <p className="text-3xl font-bold text-red-600 dark:text-red-400">{stats.criticalAlerts}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">هشدار بحرانی</p>
        </div>

        <div className="premium-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">نیاز به اقدام</h3>
            <AlertTriangle className="w-6 h-6 text-warning-600" />
          </div>
          <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{stats.needsActionAlerts}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">هشدار فعال</p>
        </div>

        <div className="premium-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">حل شده</h3>
            <CheckCircle className="w-6 h-6 text-success-600" />
          </div>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.resolvedAlerts}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">هشدار حل شده</p>
        </div>

        <div className="premium-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">کل هشدارها</h3>
            <Bell className="w-6 h-6 text-primary-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalAlerts}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">هشدار ثبت شده</p>
        </div>
      </div>

      {/* Critical Alerts Banner */}
      {stats.criticalAlerts > 0 && (
        <div className="premium-card p-4 border-red-200 bg-red-50 dark:bg-red-900/20">
          <div className="flex items-center space-x-3 space-x-reverse">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <div>
              <p className="font-semibold text-red-800 dark:text-red-300">
                {stats.criticalAlerts} هشدار بحرانی نیاز به اقدام فوری دارد!
              </p>
              <p className="text-sm text-red-600 dark:text-red-400">
                لطفاً فوراً این هشدارها را بررسی و اقدامات لازم را انجام دهید.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="premium-card p-6">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="جستجو هشدار..."
              className="premium-input pr-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="premium-input"
            value={filterAlertStatus}
            onChange={(e) => setFilterAlertStatus(e.target.value)}
          >
            <option value="all">همه وضعیت‌ها</option>
            <option value="critical">بحرانی</option>
            <option value="needs_action">نیاز به اقدام</option>
            <option value="resolved">حل شده</option>
          </select>
          <select
            className="premium-input"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">همه انواع</option>
            <option value="low_stock">موجودی کم</option>
            <option value="out_of_stock">تمام شده</option>
            <option value="expiry">انقضا</option>
            <option value="overstock">موجودی اضافی</option>
          </select>
          <select
            className="premium-input"
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
          >
            <option value="all">همه سطوح</option>
            <option value="low">کم</option>
            <option value="medium">متوسط</option>
            <option value="high">بالا</option>
            <option value="critical">بحرانی</option>
          </select>
          <select
            className="premium-input"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="all">همه دسته‌ها</option>
            {Array.from(new Set(alerts.map(a => a.category))).map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
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
        </div>

        {/* یادآور توضیحی */}
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-start space-x-3 space-x-reverse">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800 dark:text-blue-300">
              <p className="font-semibold mb-1">راهنمای هشدارهای موجودی:</p>
              <ul className="list-disc list-inside space-y-1 text-blue-700 dark:text-blue-400">
                <li><strong>بحرانی:</strong> موجودی صفر یا منفی، یا موجودی زیر حداقل که نیاز به اقدام فوری دارد.</li>
                <li><strong>نیاز به اقدام:</strong> موجودی بین حداقل و نقطه سفارش که باید برای تأمین موجودی اقدام شود.</li>
                <li><strong>حل شده:</strong> هشدارهایی که با اقدامات انجام شده (خرید، انتقال، تعدیل) برطرف شده‌اند.</li>
              </ul>
              <p className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                هشدارها به صورت خودکار با هر تغییر موجودی به‌روزرسانی می‌شوند. می‌توانید برای هر هشدار اقدامات انجام شده را ثبت کنید.
              </p>
            </div>
          </div>
        </div>

        {/* Alerts Table */}
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-right whitespace-nowrap">
            <thead>
              <tr className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-800/50">
                <th className="px-4 py-3 rounded-r-lg">نام آیتم</th>
                <th className="px-4 py-3">کد</th>
                <th className="px-4 py-3">انبار</th>
                <th className="px-4 py-3">موجودی فعلی</th>
                <th className="px-4 py-3">حداقل</th>
                <th className="px-4 py-3">نوع هشدار</th>
                <th className="px-4 py-3">شدت</th>
                <th className="px-4 py-3">اولویت</th>
                <th className="px-4 py-3">وضعیت تجمیعی</th>
                <th className="px-4 py-3">تاریخ ایجاد</th>
                <th className="px-4 py-3 rounded-l-lg">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredAlerts.map(alert => (
                <tr key={alert._id} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <Package className="w-5 h-5 text-primary-600" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{alert.itemName}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{alert.category}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-200 font-mono">{alert.itemCode}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{alert.warehouse}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{alert.currentStock}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{alert.minStock}</td>
                  <td className="px-4 py-3">
                    {alert.alertTypeCode ? getAlertTypeCodeBadge(alert.alertTypeCode) : getAlertTypeBadge(alert.type)}
                  </td>
                  <td className="px-4 py-3">
                    {getSeverityBadge(alert.severity)}
                  </td>
                  <td className="px-4 py-3">
                    {getPriorityBadge(alert.priority)}
                  </td>
                  <td className="px-4 py-3">
                    {getStatusBadge(alert.status, alert.alertStatus)}
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-200">
                    {new Date(alert.createdAt).toLocaleDateString('fa-IR')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <button
                        onClick={() => handleViewAlert(alert)}
                        className="p-1 rounded-full text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                        title="مشاهده جزئیات"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {alert.status === 'active' && (
                        <button
                          onClick={() => handleAddAction(alert)}
                          className="p-1 rounded-full text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                          title="ثبت اقدام"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteAlert(alert._id)}
                        className="p-1 rounded-full text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                        title="حذف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Alert Details Modal */}
      {showAlertModal && selectedAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                جزئیات هشدار {selectedAlert.itemName}
              </h2>
              <button
                onClick={() => setShowAlertModal(false)}
                className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {/* Alert Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="premium-card p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">اطلاعات آیتم</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">نام آیتم:</span>
                    <span className="text-gray-900 dark:text-white">{selectedAlert.itemName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">کد:</span>
                    <span className="text-gray-900 dark:text-white">{selectedAlert.itemCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">دسته‌بندی:</span>
                    <span className="text-gray-900 dark:text-white">{selectedAlert.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">انبار:</span>
                    <span className="text-gray-900 dark:text-white">{selectedAlert.warehouse}</span>
                  </div>
                </div>
              </div>

              <div className="premium-card p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">اطلاعات هشدار</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">نوع:</span>
                    {getAlertTypeBadge(selectedAlert.type)}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">شدت:</span>
                    {getSeverityBadge(selectedAlert.severity)}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">اولویت:</span>
                    {getPriorityBadge(selectedAlert.priority)}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">وضعیت:</span>
                    {getStatusBadge(selectedAlert.status)}
                  </div>
                </div>
              </div>
            </div>

            {/* Stock Info */}
            <div className="premium-card p-4 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">اطلاعات موجودی</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{selectedAlert.currentStock}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">موجودی فعلی</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{selectedAlert.minStock}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">حداقل</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{selectedAlert.maxStock}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">حداکثر</p>
                </div>
              </div>
            </div>

            {/* Message */}
            <div className="premium-card p-4 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">پیام هشدار</h3>
              <p className="text-gray-700 dark:text-gray-300">{selectedAlert.message}</p>
            </div>

            {/* Notes */}
            {selectedAlert.notes && (
              <div className="premium-card p-4 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">یادداشت‌ها</h3>
                <p className="text-gray-700 dark:text-gray-300">{selectedAlert.notes}</p>
              </div>
            )}

            {/* Resolution */}
            {selectedAlert.resolution && (
              <div className="premium-card p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">راه‌حل</h3>
                <p className="text-gray-700 dark:text-gray-300">{selectedAlert.resolution}</p>
                {selectedAlert.resolvedBy && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    حل شده توسط: {selectedAlert.resolvedBy} - {selectedAlert.resolvedAt && new Date(selectedAlert.resolvedAt).toLocaleDateString('fa-IR')}
                  </p>
                )}
              </div>
            )}
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
            onClick={() => setShowPurchaseOrderModal(true)}
            disabled={actionLoading}
            className="premium-card p-4 flex items-center space-x-3 space-x-reverse hover:shadow-glow transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ShoppingCart className="w-8 h-8 text-green-600" />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">سفارش خرید فوری</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">ایجاد سفارش برای آیتم‌های کم‌موجود</p>
            </div>
          </button>
          <button
            onClick={() => setShowMinStockModal(true)}
            disabled={actionLoading}
            className="premium-card p-4 flex items-center space-x-3 space-x-reverse hover:shadow-glow transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Target className="w-8 h-8 text-blue-600" />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">تنظیم حداقل موجودی</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">بهینه‌سازی سطوح هشدار</p>
            </div>
          </button>
          <button
            onClick={handleGetAnalyticalReport}
            disabled={actionLoading}
            className="premium-card p-4 flex items-center space-x-3 space-x-reverse hover:shadow-glow transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <TrendingUp className="w-8 h-8 text-purple-600" />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">گزارش تحلیلی</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">تحلیل روند موجودی‌ها</p>
            </div>
          </button>
        </div>
      </div>

      {/* Purchase Order Modal */}
      {showPurchaseOrderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">سفارش خرید فوری</h2>
              <button
                onClick={() => setShowPurchaseOrderModal(false)}
                className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <p className="text-gray-700 dark:text-gray-300">
                سیستم به صورت خودکار آیتم‌های کم‌موجود را پیدا کرده و سفارش خرید ایجاد می‌کند.
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                این شامل هشدارهای فعال و آیتم‌های موجودی که زیر حداقل هستند می‌شود.
              </p>
              <div className="flex items-center justify-end space-x-3 space-x-reverse">
                <button
                  onClick={() => setShowPurchaseOrderModal(false)}
                  className="premium-button bg-gray-500 hover:bg-gray-600"
                >
                  لغو
                </button>
                <button
                  onClick={handleQuickPurchaseOrder}
                  disabled={actionLoading}
                  className="premium-button flex items-center space-x-2 space-x-reverse"
                >
                  {actionLoading ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      <span>در حال ایجاد...</span>
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-5 h-5" />
                      <span>ایجاد سفارش</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Min Stock Modal */}
      {showMinStockModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">تنظیم حداقل موجودی</h2>
              <button
                onClick={() => setShowMinStockModal(false)}
                className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <p className="text-gray-700 dark:text-gray-300 mb-4">روش تنظیم را انتخاب کنید:</p>
              <button
                onClick={() => handleUpdateMinStock('auto')}
                disabled={actionLoading}
                className="w-full premium-button text-right"
              >
                تنظیم خودکار (بر اساس موجودی فعلی)
              </button>
              <button
                onClick={() => handleUpdateMinStock('percentage', 1.2)}
                disabled={actionLoading}
                className="w-full premium-button text-right"
              >
                افزایش 20% همه حداقل‌ها
              </button>
              <button
                onClick={() => setShowMinStockModal(false)}
                className="w-full premium-button bg-gray-500 hover:bg-gray-600"
              >
                لغو
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && reportData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">گزارش تحلیلی</h2>
              <button
                onClick={() => setShowReportModal(false)}
                className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Header Info */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">گزارش تحلیلی موجودی</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    دوره زمانی: {reportData.period} روز گذشته
                  </p>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {reportData.generatedAt && new Date(reportData.generatedAt).toLocaleDateString('fa-IR')}
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="premium-card p-4">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {reportData.summary?.totalAlerts || 0}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">کل هشدارها</p>
                </div>
                <div className="premium-card p-4">
                  <p className="text-2xl font-bold text-warning-600">
                    {reportData.summary?.activeAlerts || 0}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">فعال</p>
                </div>
                <div className="premium-card p-4">
                  <p className="text-2xl font-bold text-success-600">
                    {reportData.summary?.resolvedAlerts || 0}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">حل شده</p>
                </div>
                <div className="premium-card p-4">
                  <p className="text-2xl font-bold text-primary-600">
                    {reportData.inventoryStats?.totalItems || 0}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">کل آیتم‌ها</p>
                </div>
              </div>

              {/* Inventory Stats */}
              {reportData.inventoryStats && (
                <div className="premium-card p-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">آمار موجودی</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">
                        {reportData.inventoryStats.totalItems || 0}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">کل آیتم‌ها</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold text-warning-600">
                        {reportData.inventoryStats.lowStockItems || 0}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">کم‌موجود</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold text-danger-600">
                        {reportData.inventoryStats.outOfStockItems || 0}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">تمام شده</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold text-success-600">
                        {(reportData.inventoryStats.totalValue || 0).toLocaleString('fa-IR')}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">ارزش کل (تومان)</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Alerts by Type */}
              {reportData.alertsByType && reportData.alertsByType.length > 0 && (
                <div className="premium-card p-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">هشدارها بر اساس نوع</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-right">
                      <thead>
                        <tr className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-800/50">
                          <th className="px-4 py-2 rounded-r-lg">نوع</th>
                          <th className="px-4 py-2">تعداد کل</th>
                          <th className="px-4 py-2">فعال</th>
                          <th className="px-4 py-2 rounded-l-lg">حل شده</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.alertsByType.map((item: any, index: number) => (
                          <tr key={index} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                            <td className="px-4 py-2">
                              {getAlertTypeBadge(item._id)}
                            </td>
                            <td className="px-4 py-2 font-medium">{item.count}</td>
                            <td className="px-4 py-2 text-warning-600">{item.active}</td>
                            <td className="px-4 py-2 text-success-600">{item.resolved}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Alerts by Severity */}
              {reportData.alertsBySeverity && reportData.alertsBySeverity.length > 0 && (
                <div className="premium-card p-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">هشدارها بر اساس شدت</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {reportData.alertsBySeverity.map((item: any, index: number) => (
                      <div key={index} className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        {getSeverityBadge(item._id)}
                        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{item.count}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Alerts by Warehouse */}
              {reportData.alertsByWarehouse && reportData.alertsByWarehouse.length > 0 && (
                <div className="premium-card p-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">هشدارها بر اساس انبار</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-right">
                      <thead>
                        <tr className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-800/50">
                          <th className="px-4 py-2 rounded-r-lg">انبار</th>
                          <th className="px-4 py-2">تعداد کل</th>
                          <th className="px-4 py-2 rounded-l-lg">فعال</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.alertsByWarehouse.map((item: any, index: number) => (
                          <tr key={index} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                            <td className="px-4 py-2">{item._id || 'نامشخص'}</td>
                            <td className="px-4 py-2 font-medium">{item.count}</td>
                            <td className="px-4 py-2 text-warning-600">{item.active}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Top Alerted Items */}
              {reportData.topAlertedItems && reportData.topAlertedItems.length > 0 && (
                <div className="premium-card p-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">آیتم‌های با بیشترین هشدار</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-right">
                      <thead>
                        <tr className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-800/50">
                          <th className="px-4 py-2 rounded-r-lg">نام آیتم</th>
                          <th className="px-4 py-2">کد</th>
                          <th className="px-4 py-2">تعداد هشدار</th>
                          <th className="px-4 py-2 rounded-l-lg">فعال</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.topAlertedItems.map((item: any, index: number) => (
                          <tr key={index} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                            <td className="px-4 py-2 font-medium">{item.itemName}</td>
                            <td className="px-4 py-2 font-mono text-sm">{item.itemCode}</td>
                            <td className="px-4 py-2">{item.alertCount}</td>
                            <td className="px-4 py-2">
                              {item.activeAlerts > 0 ? (
                                <span className="text-warning-600 font-semibold">{item.activeAlerts}</span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Alerts Trend */}
              {reportData.alertsTrend && reportData.alertsTrend.length > 0 && (
                <div className="premium-card p-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">روند هشدارها در طول زمان</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-right">
                      <thead>
                        <tr className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-800/50">
                          <th className="px-4 py-2 rounded-r-lg">تاریخ</th>
                          <th className="px-4 py-2">کل</th>
                          <th className="px-4 py-2">فعال</th>
                          <th className="px-4 py-2 rounded-l-lg">حل شده</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.alertsTrend.slice(-10).map((item: any, index: number) => (
                          <tr key={index} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                            <td className="px-4 py-2">{item._id}</td>
                            <td className="px-4 py-2">{item.count}</td>
                            <td className="px-4 py-2 text-warning-600">{item.active}</td>
                            <td className="px-4 py-2 text-success-600">{item.resolved}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Empty State */}
              {(!reportData.summary || reportData.summary.totalAlerts === 0) && 
               (!reportData.inventoryStats || reportData.inventoryStats.totalItems === 0) && (
                <div className="premium-card p-8 text-center">
                  <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">هیچ داده‌ای برای نمایش وجود ندارد</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Action Modal */}
      {showActionModal && selectedAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">ثبت اقدام برای هشدار</h2>
              <button
                onClick={() => {
                  setShowActionModal(false)
                  setSelectedAlert(null)
                }}
                className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* اطلاعات هشدار */}
              <div className="premium-card p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">اطلاعات هشدار</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">نام آیتم:</span>
                    <span className="mr-2 font-medium text-gray-900 dark:text-white">{selectedAlert.itemName}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">انبار:</span>
                    <span className="mr-2 font-medium text-gray-900 dark:text-white">{selectedAlert.warehouse}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">موجودی فعلی:</span>
                    <span className="mr-2 font-medium text-gray-900 dark:text-white">{selectedAlert.currentStock}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">حداقل:</span>
                    <span className="mr-2 font-medium text-gray-900 dark:text-white">{selectedAlert.minStock}</span>
                  </div>
                </div>
              </div>

              {/* نوع اقدام */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  نوع اقدام *
                </label>
                <select
                  value={actionFormData.actionType}
                  onChange={(e) => setActionFormData({ ...actionFormData, actionType: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                >
                  <option value="purchase_order">ثبت سفارش خرید</option>
                  <option value="transfer">انتقال از انبار دیگر</option>
                  <option value="adjustment">اصلاح موجودی</option>
                  <option value="other">سایر</option>
                </select>
              </div>

              {/* توضیحات */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  توضیحات اقدام *
                </label>
                <textarea
                  value={actionFormData.description}
                  onChange={(e) => setActionFormData({ ...actionFormData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows={4}
                  placeholder="توضیحات اقدام انجام شده را وارد کنید..."
                  required
                />
              </div>

              {/* دکمه‌ها */}
              <div className="flex items-center justify-end space-x-3 space-x-reverse">
                <button
                  type="button"
                  onClick={() => {
                    setShowActionModal(false)
                    setSelectedAlert(null)
                  }}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  onClick={handleSubmitAction}
                  disabled={actionLoading || !actionFormData.description.trim()}
                  className="premium-button flex items-center space-x-2 space-x-reverse disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      <span>در حال ثبت...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>ثبت اقدام</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}