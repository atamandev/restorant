'use client'

import React, { useState, useEffect } from 'react'
import {
  ArrowRightLeft,
  Truck,
  Package,
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  Filter,
  MapPin,
  User,
  AlertTriangle,
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
  Bell,
  Send,
  Receipt,
  Warehouse,
  Loader,
  Save,
  AlertCircle,
  CheckCircle2,
  X
} from 'lucide-react'

interface TransferData {
  _id: string
  transferNumber: string
  type: 'internal' | 'external' | 'return' | 'adjustment'
  fromWarehouse: string
  toWarehouse: string
  items: TransferItem[]
  totalItems: number
  totalValue: number
  requestedBy: string
  approvedBy?: string
  status: 'pending' | 'in_transit' | 'completed' | 'cancelled'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  scheduledDate?: string
  actualDate?: string
  notes: string
  reason: string
  createdAt: string
  updatedAt: string
}

interface TransferItem {
  itemId: string
  itemName: string
  itemCode: string
  category: string
  quantity: number
  unit: string
  unitPrice: number
  totalValue: number
}

interface TransferStats {
  totalTransfers: number
  pendingTransfers: number
  inTransitTransfers: number
  completedTransfers: number
  cancelledTransfers: number
  totalItems: number
  totalValue: number
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending': return 'text-yellow-600 dark:text-yellow-400'
    case 'in_transit': return 'text-blue-600 dark:text-blue-400'
    case 'completed': return 'text-green-600 dark:text-green-400'
    case 'cancelled': return 'text-red-600 dark:text-red-400'
    default: return 'text-gray-600 dark:text-gray-400'
  }
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'pending': return <span className="status-badge bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">در انتظار</span>
    case 'in_transit': return <span className="status-badge bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">در حال انتقال</span>
    case 'completed': return <span className="status-badge bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">تکمیل شده</span>
    case 'cancelled': return <span className="status-badge bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">لغو شده</span>
    default: return null
  }
}

const getTypeBadge = (type: string) => {
  switch (type) {
    case 'internal': return <span className="status-badge bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">داخلی</span>
    case 'external': return <span className="status-badge bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">خارجی</span>
    case 'return': return <span className="status-badge bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">بازگشت</span>
    case 'adjustment': return <span className="status-badge bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300">تعدیل</span>
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

export default function TransfersPage() {
  const [transfers, setTransfers] = useState<TransferData[]>([])
  const [stats, setStats] = useState<TransferStats>({
    totalTransfers: 0,
    pendingTransfers: 0,
    inTransitTransfers: 0,
    completedTransfers: 0,
    cancelledTransfers: 0,
    totalItems: 0,
    totalValue: 0
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [filterWarehouse, setFilterWarehouse] = useState('all')
  const [selectedTransfer, setSelectedTransfer] = useState<TransferData | null>(null)
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingTransfer, setEditingTransfer] = useState<TransferData | null>(null)

  // فرم ایجاد/ویرایش انتقال
  const [formData, setFormData] = useState({
    type: 'internal',
    fromWarehouse: '',
    toWarehouse: '',
    requestedBy: '',
    approvedBy: '',
    status: 'pending',
    priority: 'normal',
    scheduledDate: '',
    notes: '',
    reason: '',
    items: [] as TransferItem[]
  })

  // بارگذاری داده‌ها
  const fetchTransfers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/transfers')
      const data = await response.json()
      
      if (data.success) {
        setTransfers(data.data)
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error fetching transfers:', error)
    } finally {
      setLoading(false)
    }
  }

  // ایجاد انتقال جدید
  const handleCreateTransfer = async () => {
    try {
      const response = await fetch('/api/transfers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })
      
      const data = await response.json()
      
      if (data.success) {
        alert('انتقال با موفقیت ایجاد شد')
        setShowCreateModal(false)
        resetForm()
        fetchTransfers()
      } else {
        alert('خطا در ایجاد انتقال: ' + data.message)
      }
    } catch (error) {
      console.error('Error creating transfer:', error)
      alert('خطا در ایجاد انتقال')
    }
  }

  // به‌روزرسانی انتقال
  const handleUpdateTransfer = async () => {
    if (!editingTransfer) return

    try {
      const response = await fetch(`/api/transfers/${editingTransfer._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })
      
      const data = await response.json()
      
      if (data.success) {
        alert('انتقال با موفقیت به‌روزرسانی شد')
        setShowTransferModal(false)
        setEditingTransfer(null)
        resetForm()
        fetchTransfers()
      } else {
        alert('خطا در به‌روزرسانی انتقال: ' + data.message)
      }
    } catch (error) {
      console.error('Error updating transfer:', error)
      alert('خطا در به‌روزرسانی انتقال')
    }
  }

  // حذف انتقال
  const handleDeleteTransfer = async (transferId: string) => {
    if (!confirm('آیا از حذف این انتقال اطمینان دارید؟')) return

    try {
      const response = await fetch(`/api/transfers/${transferId}`, {
        method: 'DELETE',
      })
      
      const data = await response.json()
      
      if (data.success) {
        alert('انتقال با موفقیت حذف شد')
        fetchTransfers()
      } else {
        alert('خطا در حذف انتقال: ' + data.message)
      }
    } catch (error) {
      console.error('Error deleting transfer:', error)
      alert('خطا در حذف انتقال')
    }
  }

  // تغییر وضعیت انتقال
  const handleStatusChange = async (transferId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/transfers/${transferId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status: newStatus,
          notes: `وضعیت به ${newStatus} تغییر یافت`
        }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        alert(`وضعیت انتقال به ${newStatus} تغییر یافت`)
        fetchTransfers()
      } else {
        alert('خطا در تغییر وضعیت: ' + data.message)
      }
    } catch (error) {
      console.error('Error changing status:', error)
      alert('خطا در تغییر وضعیت')
    }
  }

  // اضافه کردن داده‌های نمونه
  const handleAddSampleData = async () => {
    try {
      const response = await fetch('/api/add-sample-transfers', {
        method: 'POST',
      })
      
      const data = await response.json()
      
      if (data.success) {
        alert('داده‌های نمونه با موفقیت اضافه شد')
        fetchTransfers()
      } else {
        alert('خطا در اضافه کردن داده‌های نمونه: ' + data.message)
      }
    } catch (error) {
      console.error('Error adding sample data:', error)
      alert('خطا در اضافه کردن داده‌های نمونه')
    }
  }

  // بازنشانی فرم
  const resetForm = () => {
    setFormData({
      type: 'internal',
      fromWarehouse: '',
      toWarehouse: '',
      requestedBy: '',
      approvedBy: '',
      status: 'pending',
      priority: 'normal',
      scheduledDate: '',
      notes: '',
      reason: '',
      items: []
    })
  }

  // شروع ویرایش
  const handleEditTransfer = (transfer: TransferData) => {
    setEditingTransfer(transfer)
    setFormData({
      type: transfer.type,
      fromWarehouse: transfer.fromWarehouse,
      toWarehouse: transfer.toWarehouse,
      requestedBy: transfer.requestedBy,
      approvedBy: transfer.approvedBy || '',
      status: transfer.status,
      priority: transfer.priority,
      scheduledDate: transfer.scheduledDate || '',
      notes: transfer.notes,
      reason: transfer.reason,
      items: transfer.items
    })
    setShowTransferModal(true)
  }

  // مشاهده جزئیات انتقال
  const handleViewTransfer = (transfer: TransferData) => {
    setSelectedTransfer(transfer)
    setShowTransferModal(true)
  }

  // فیلتر انتقالات
  const filteredTransfers = transfers.filter(transfer =>
    (searchTerm === '' || 
      transfer.transferNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.fromWarehouse.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.toWarehouse.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.requestedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.notes.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (filterStatus === 'all' || transfer.status === filterStatus) &&
    (filterType === 'all' || transfer.type === filterType) &&
    (filterWarehouse === 'all' || 
      transfer.fromWarehouse === filterWarehouse || 
      transfer.toWarehouse === filterWarehouse)
  )

  useEffect(() => {
    fetchTransfers()
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
          <h1 className="text-3xl font-bold gradient-text">انتقال بین انبارها</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            مدیریت انتقالات بین انبارها و ردگیری جابه‌جایی کالا.
          </p>
        </div>
        <div className="flex items-center space-x-3 space-x-reverse">
          <button
            onClick={() => setShowCreateModal(true)}
            className="premium-button flex items-center space-x-2 space-x-reverse"
          >
            <Plus className="w-5 h-5" />
            <span>انتقال جدید</span>
          </button>
          <button
            onClick={handleAddSampleData}
            className="premium-button flex items-center space-x-2 space-x-reverse"
          >
            <Package className="w-5 h-5" />
            <span>داده نمونه</span>
          </button>
          <button
            onClick={fetchTransfers}
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
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">کل انتقالات</h3>
            <ArrowRightLeft className="w-6 h-6 text-primary-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalTransfers}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">انتقال ثبت شده</p>
        </div>

        <div className="premium-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">در انتظار</h3>
            <Clock className="w-6 h-6 text-warning-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.pendingTransfers}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">انتقال نیاز به تایید</p>
        </div>

        <div className="premium-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">در حال انتقال</h3>
            <Truck className="w-6 h-6 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.inTransitTransfers}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">انتقال در راه</p>
        </div>

        <div className="premium-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">تکمیل شده</h3>
            <CheckCircle className="w-6 h-6 text-success-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.completedTransfers}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">انتقال تکمیل شده</p>
        </div>
      </div>

      {/* Filters */}
      <div className="premium-card p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="جستجو انتقال..."
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
            <option value="pending">در انتظار</option>
            <option value="in_transit">در حال انتقال</option>
            <option value="completed">تکمیل شده</option>
            <option value="cancelled">لغو شده</option>
          </select>
          <select
            className="premium-input"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">همه انواع</option>
            <option value="internal">داخلی</option>
            <option value="external">خارجی</option>
            <option value="return">بازگشت</option>
            <option value="adjustment">تعدیل</option>
          </select>
          <select
            className="premium-input"
            value={filterWarehouse}
            onChange={(e) => setFilterWarehouse(e.target.value)}
          >
            <option value="all">همه انبارها</option>
            <option value="انبار اصلی">انبار اصلی</option>
            <option value="انبار سرد">انبار سرد</option>
            <option value="انبار خشک">انبار خشک</option>
            <option value="انبار مواد اولیه">انبار مواد اولیه</option>
            <option value="انبار محصولات نهایی">انبار محصولات نهایی</option>
            <option value="انبار اضطراری">انبار اضطراری</option>
          </select>
          <button 
            onClick={fetchTransfers}
            className="premium-button flex items-center justify-center space-x-2 space-x-reverse"
          >
            <RefreshCw className="w-5 h-5" />
            <span>بروزرسانی</span>
          </button>
        </div>

        {/* Transfers Table */}
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-right whitespace-nowrap">
            <thead>
              <tr className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-800/50">
                <th className="px-4 py-3 rounded-r-lg">شماره انتقال</th>
                <th className="px-4 py-3">نوع</th>
                <th className="px-4 py-3">انبار مبدا</th>
                <th className="px-4 py-3">انبار مقصد</th>
                <th className="px-4 py-3">درخواست‌کننده</th>
                <th className="px-4 py-3">تاریخ درخواست</th>
                <th className="px-4 py-3">تعداد آیتم‌ها</th>
                <th className="px-4 py-3">ارزش کل</th>
                <th className="px-4 py-3">اولویت</th>
                <th className="px-4 py-3">وضعیت</th>
                <th className="px-4 py-3 rounded-l-lg">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredTransfers.map(transfer => (
                <tr key={transfer._id} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <ArrowRightLeft className="w-5 h-5 text-primary-600" />
                      <span className="font-medium text-gray-900 dark:text-white">{transfer.transferNumber}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {getTypeBadge(transfer.type)}
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{transfer.fromWarehouse}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{transfer.toWarehouse}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{transfer.requestedBy}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-200">
                    {new Date(transfer.createdAt).toLocaleDateString('fa-IR')}
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{transfer.totalItems}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{transfer.totalValue.toLocaleString('fa-IR')} تومان</td>
                  <td className="px-4 py-3">
                    {getPriorityBadge(transfer.priority)}
                  </td>
                  <td className="px-4 py-3">
                    {getStatusBadge(transfer.status)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <button
                        onClick={() => handleViewTransfer(transfer)}
                        className="p-1 rounded-full text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                        title="مشاهده جزئیات"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {transfer.status === 'pending' && (
                        <button
                          onClick={() => handleStatusChange(transfer._id, 'in_transit')}
                          className="p-1 rounded-full text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                          title="شروع انتقال"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      {transfer.status === 'in_transit' && (
                        <button
                          onClick={() => handleStatusChange(transfer._id, 'completed')}
                          className="p-1 rounded-full text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                          title="تکمیل انتقال"
                        >
                          <Receipt className="w-4 h-4" />
                        </button>
                      )}
                      {(transfer.status === 'pending' || transfer.status === 'in_transit') && (
                        <button
                          onClick={() => handleStatusChange(transfer._id, 'cancelled')}
                          className="p-1 rounded-full text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                          title="لغو انتقال"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleEditTransfer(transfer)}
                        className="p-1 rounded-full text-purple-600 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                        title="ویرایش"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTransfer(transfer._id)}
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

      {/* Transfer Details Modal */}
      {showTransferModal && selectedTransfer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                جزئیات انتقال {selectedTransfer.transferNumber}
              </h2>
              <button
                onClick={() => setShowTransferModal(false)}
                className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {/* Transfer Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="premium-card p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">اطلاعات انتقال</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">شماره انتقال:</span>
                    <span className="text-gray-900 dark:text-white">{selectedTransfer.transferNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">نوع:</span>
                    {getTypeBadge(selectedTransfer.type)}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">انبار مبدا:</span>
                    <span className="text-gray-900 dark:text-white">{selectedTransfer.fromWarehouse}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">انبار مقصد:</span>
                    <span className="text-gray-900 dark:text-white">{selectedTransfer.toWarehouse}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">وضعیت:</span>
                    {getStatusBadge(selectedTransfer.status)}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">اولویت:</span>
                    {getPriorityBadge(selectedTransfer.priority)}
                  </div>
                </div>
              </div>

              <div className="premium-card p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">اطلاعات کاربران</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">درخواست‌کننده:</span>
                    <span className="text-gray-900 dark:text-white">{selectedTransfer.requestedBy}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">تاریخ درخواست:</span>
                    <span className="text-gray-900 dark:text-white">
                      {new Date(selectedTransfer.createdAt).toLocaleDateString('fa-IR')}
                    </span>
                  </div>
                  {selectedTransfer.approvedBy && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">تاییدکننده:</span>
                      <span className="text-gray-900 dark:text-white">{selectedTransfer.approvedBy}</span>
                    </div>
                  )}
                  {selectedTransfer.actualDate && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">تاریخ تکمیل:</span>
                      <span className="text-gray-900 dark:text-white">
                        {new Date(selectedTransfer.actualDate).toLocaleDateString('fa-IR')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Transfer Items */}
            <div className="premium-card p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">آیتم‌های انتقال</h3>
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-right whitespace-nowrap">
                  <thead>
                    <tr className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-800/50">
                      <th className="px-4 py-3 rounded-r-lg">نام آیتم</th>
                      <th className="px-4 py-3">کد</th>
                      <th className="px-4 py-3">دسته‌بندی</th>
                      <th className="px-4 py-3">تعداد</th>
                      <th className="px-4 py-3">واحد</th>
                      <th className="px-4 py-3">قیمت واحد</th>
                      <th className="px-4 py-3 rounded-l-lg">قیمت کل</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {selectedTransfer.items.map((item, index) => (
                      <tr key={index} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <td className="px-4 py-3 text-gray-900 dark:text-white">{item.itemName}</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-200 font-mono">{item.itemCode}</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{item.category}</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{item.quantity}</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{item.unit}</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{item.unitPrice.toLocaleString('fa-IR')}</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{item.totalValue.toLocaleString('fa-IR')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Notes */}
            {selectedTransfer.notes && (
              <div className="premium-card p-4 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">یادداشت‌ها</h3>
                <p className="text-gray-700 dark:text-gray-300">{selectedTransfer.notes}</p>
              </div>
            )}

            {/* Reason */}
            {selectedTransfer.reason && (
              <div className="premium-card p-4 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">دلیل انتقال</h3>
                <p className="text-gray-700 dark:text-gray-300">{selectedTransfer.reason}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}