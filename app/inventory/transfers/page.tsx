'use client'

import React, { useState } from 'react'
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
  Loader
} from 'lucide-react'

interface Transfer {
  id: string
  transferNumber: string
  fromWarehouse: string
  toWarehouse: string
  requestedBy: string
  approvedBy: string
  status: 'draft' | 'in_transit' | 'received' | 'cancelled'
  requestedDate: string
  approvedDate: string
  receivedDate: string
  totalItems: number
  totalValue: number
  notes: string
  items: TransferItem[]
}

interface TransferItem {
  id: string
  itemName: string
  itemCode: string
  quantity: number
  unit: string
  unitPrice: number
  totalPrice: number
  condition: 'good' | 'damaged' | 'expired'
}

const mockTransfers: Transfer[] = [
  {
    id: '1',
    transferNumber: 'TR-001',
    fromWarehouse: 'انبار اصلی',
    toWarehouse: 'انبار مواد اولیه',
    requestedBy: 'احمد محمدی',
    approvedBy: 'فاطمه کریمی',
    status: 'received',
    requestedDate: '1403/09/10',
    approvedDate: '1403/09/11',
    receivedDate: '1403/09/12',
    totalItems: 5,
    totalValue: 2500000,
    notes: 'انتقال مواد اولیه برای تولید',
    items: [
      {
        id: '1',
        itemName: 'برنج ایرانی',
        itemCode: 'RICE-001',
        quantity: 20,
        unit: 'کیلوگرم',
        unitPrice: 45000,
        totalPrice: 900000,
        condition: 'good'
      },
      {
        id: '2',
        itemName: 'گوشت گوساله',
        itemCode: 'MEAT-001',
        quantity: 10,
        unit: 'کیلوگرم',
        unitPrice: 180000,
        totalPrice: 1800000,
        condition: 'good'
      }
    ]
  },
  {
    id: '2',
    transferNumber: 'TR-002',
    fromWarehouse: 'انبار مواد اولیه',
    toWarehouse: 'انبار محصولات نهایی',
    requestedBy: 'رضا حسینی',
    approvedBy: 'احمد محمدی',
    status: 'in_transit',
    requestedDate: '1403/09/14',
    approvedDate: '1403/09/15',
    receivedDate: '',
    totalItems: 3,
    totalValue: 1200000,
    notes: 'انتقال محصولات آماده',
    items: [
      {
        id: '3',
        itemName: 'کباب آماده',
        itemCode: 'KABAB-001',
        quantity: 15,
        unit: 'عدد',
        unitPrice: 80000,
        totalPrice: 1200000,
        condition: 'good'
      }
    ]
  },
  {
    id: '3',
    transferNumber: 'TR-003',
    fromWarehouse: 'انبار اصلی',
    toWarehouse: 'انبار مواد اولیه',
    requestedBy: 'مریم نوری',
    approvedBy: '',
    status: 'draft',
    requestedDate: '1403/09/16',
    approvedDate: '',
    receivedDate: '',
    totalItems: 2,
    totalValue: 800000,
    notes: 'درخواست انتقال مواد اولیه',
    items: [
      {
        id: '4',
        itemName: 'روغن آفتابگردان',
        itemCode: 'OIL-001',
        quantity: 20,
        unit: 'لیتر',
        unitPrice: 25000,
        totalPrice: 500000,
        condition: 'good'
      },
      {
        id: '5',
        itemName: 'پیاز',
        itemCode: 'VEG-001',
        quantity: 30,
        unit: 'کیلوگرم',
        unitPrice: 10000,
        totalPrice: 300000,
        condition: 'good'
      }
    ]
  }
]

const getStatusColor = (status: string) => {
  switch (status) {
    case 'draft': return 'text-gray-600 dark:text-gray-400'
    case 'in_transit': return 'text-blue-600 dark:text-blue-400'
    case 'received': return 'text-green-600 dark:text-green-400'
    case 'cancelled': return 'text-red-600 dark:text-red-400'
    default: return 'text-gray-600 dark:text-gray-400'
  }
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'draft': return <span className="status-badge bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300">پیش‌نویس</span>
    case 'in_transit': return <span className="status-badge bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">در حال انتقال</span>
    case 'received': return <span className="status-badge bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">دریافت شده</span>
    case 'cancelled': return <span className="status-badge bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">لغو شده</span>
    default: return null
  }
}

const getConditionColor = (condition: string) => {
  switch (condition) {
    case 'good': return 'text-green-600 dark:text-green-400'
    case 'damaged': return 'text-yellow-600 dark:text-yellow-400'
    case 'expired': return 'text-red-600 dark:text-red-400'
    default: return 'text-gray-600 dark:text-gray-400'
  }
}

const getConditionBadge = (condition: string) => {
  switch (condition) {
    case 'good': return <span className="status-badge bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">خوب</span>
    case 'damaged': return <span className="status-badge bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">آسیب دیده</span>
    case 'expired': return <span className="status-badge bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">منقضی شده</span>
    default: return null
  }
}

export default function TransfersPage() {
  const [transfers, setTransfers] = useState<Transfer[]>(mockTransfers)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterWarehouse, setFilterWarehouse] = useState('all')
  const [selectedTransfer, setSelectedTransfer] = useState<Transfer | null>(null)
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const filteredTransfers = transfers.filter(transfer =>
    (searchTerm === '' || 
      transfer.transferNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.fromWarehouse.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.toWarehouse.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.requestedBy.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (filterStatus === 'all' || transfer.status === filterStatus) &&
    (filterWarehouse === 'all' || 
      transfer.fromWarehouse === filterWarehouse || 
      transfer.toWarehouse === filterWarehouse)
  )

  const totalTransfers = transfers.length
  const pendingTransfers = transfers.filter(t => t.status === 'draft').length
  const inTransitTransfers = transfers.filter(t => t.status === 'in_transit').length
  const completedTransfers = transfers.filter(t => t.status === 'received').length

  const handleCreateTransfer = () => {
    setShowCreateModal(true)
  }

  const handleViewTransfer = (transfer: Transfer) => {
    setSelectedTransfer(transfer)
    setShowTransferModal(true)
  }

  const handleApproveTransfer = (transferId: string) => {
    setTransfers(prev => prev.map(transfer => 
      transfer.id === transferId 
        ? { ...transfer, status: 'in_transit' as const, approvedDate: '1403/09/16', approvedBy: 'مدیر انبار' }
        : transfer
    ))
    alert('انتقال تایید شد.')
  }

  const handleReceiveTransfer = (transferId: string) => {
    setTransfers(prev => prev.map(transfer => 
      transfer.id === transferId 
        ? { ...transfer, status: 'received' as const, receivedDate: '1403/09/16' }
        : transfer
    ))
    alert('انتقال دریافت شد.')
  }

  const handleCancelTransfer = (transferId: string) => {
    setTransfers(prev => prev.map(transfer => 
      transfer.id === transferId 
        ? { ...transfer, status: 'cancelled' as const }
        : transfer
    ))
    alert('انتقال لغو شد.')
  }

  const handleExport = () => {
    alert('گزارش انتقالات به صورت Excel صادر شد.')
  }

  const handlePrint = () => {
    window.print()
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
            onClick={handleCreateTransfer}
            className="premium-button flex items-center space-x-2 space-x-reverse"
          >
            <Plus className="w-5 h-5" />
            <span>انتقال جدید</span>
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
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">کل انتقالات</h3>
            <ArrowRightLeft className="w-6 h-6 text-primary-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{totalTransfers}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">انتقال ثبت شده</p>
        </div>

        <div className="premium-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">در انتظار تایید</h3>
            <Clock className="w-6 h-6 text-warning-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{pendingTransfers}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">انتقال نیاز به تایید</p>
        </div>

        <div className="premium-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">در حال انتقال</h3>
            <Truck className="w-6 h-6 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{inTransitTransfers}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">انتقال در راه</p>
        </div>

        <div className="premium-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">تکمیل شده</h3>
            <CheckCircle className="w-6 h-6 text-success-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{completedTransfers}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">انتقال دریافت شده</p>
        </div>
      </div>

      {/* Filters */}
      <div className="premium-card p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
            <option value="draft">پیش‌نویس</option>
            <option value="in_transit">در حال انتقال</option>
            <option value="received">دریافت شده</option>
            <option value="cancelled">لغو شده</option>
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
          <button className="premium-button flex items-center justify-center space-x-2 space-x-reverse">
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
                <th className="px-4 py-3">انبار مبدا</th>
                <th className="px-4 py-3">انبار مقصد</th>
                <th className="px-4 py-3">درخواست‌کننده</th>
                <th className="px-4 py-3">تاریخ درخواست</th>
                <th className="px-4 py-3">تعداد آیتم‌ها</th>
                <th className="px-4 py-3">ارزش کل</th>
                <th className="px-4 py-3">وضعیت</th>
                <th className="px-4 py-3 rounded-l-lg">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredTransfers.map(transfer => (
                <tr key={transfer.id} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <ArrowRightLeft className="w-5 h-5 text-primary-600" />
                      <span className="font-medium text-gray-900 dark:text-white">{transfer.transferNumber}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{transfer.fromWarehouse}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{transfer.toWarehouse}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{transfer.requestedBy}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{transfer.requestedDate}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{transfer.totalItems}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{transfer.totalValue.toLocaleString('fa-IR')} تومان</td>
                  <td className="px-4 py-3">
                    {getStatusBadge(transfer.status)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <button
                        onClick={() => handleViewTransfer(transfer)}
                        className="p-1 rounded-full text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {transfer.status === 'draft' && (
                        <button
                          onClick={() => handleApproveTransfer(transfer.id)}
                          className="p-1 rounded-full text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      {transfer.status === 'in_transit' && (
                        <button
                          onClick={() => handleReceiveTransfer(transfer.id)}
                          className="p-1 rounded-full text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                        >
                          <Receipt className="w-4 h-4" />
                        </button>
                      )}
                      {(transfer.status === 'draft' || transfer.status === 'in_transit') && (
                        <button
                          onClick={() => handleCancelTransfer(transfer.id)}
                          className="p-1 rounded-full text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
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
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
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
                    <span className="text-gray-900 dark:text-white">{selectedTransfer.requestedDate}</span>
                  </div>
                  {selectedTransfer.approvedBy && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">تاییدکننده:</span>
                      <span className="text-gray-900 dark:text-white">{selectedTransfer.approvedBy}</span>
                    </div>
                  )}
                  {selectedTransfer.approvedDate && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">تاریخ تایید:</span>
                      <span className="text-gray-900 dark:text-white">{selectedTransfer.approvedDate}</span>
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
                      <th className="px-4 py-3">تعداد</th>
                      <th className="px-4 py-3">واحد</th>
                      <th className="px-4 py-3">قیمت واحد</th>
                      <th className="px-4 py-3">قیمت کل</th>
                      <th className="px-4 py-3 rounded-l-lg">وضعیت</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {selectedTransfer.items.map(item => (
                      <tr key={item.id} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <td className="px-4 py-3 text-gray-900 dark:text-white">{item.itemName}</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-200 font-mono">{item.itemCode}</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{item.quantity}</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{item.unit}</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{item.unitPrice.toLocaleString('fa-IR')}</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{item.totalPrice.toLocaleString('fa-IR')}</td>
                        <td className="px-4 py-3">
                          {getConditionBadge(item.condition)}
                        </td>
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
          </div>
        </div>
      )}
    </div>
  )
}
