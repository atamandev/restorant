'use client'

import React, { useState, useEffect } from 'react'
import {
  Warehouse,
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
  ArrowRightLeft,
  Truck,
  ClipboardList,
  Settings,
  Calendar,
  DollarSign,
  Activity,
  FileText,
  Bell,
  Thermometer,
  Droplets,
  Phone,
  Mail,
  Save,
  Loader
} from 'lucide-react'

interface WarehouseData {
  _id: string
  code: string
  name: string
  type: 'main' | 'storage' | 'cold' | 'dry'
  location: string
  address: string
  capacity: number
  usedCapacity: number
  availableCapacity: number
  temperature?: number
  humidity?: number
  manager: string
  phone: string
  email: string
  description: string
  status: 'active' | 'inactive' | 'maintenance'
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface InventoryItem {
  _id: string
  name: string
  category: string
  currentStock: number
  minStock: number
  maxStock: number
  unit: string
  unitPrice: number
  totalValue: number
  isLowStock: boolean
  lastUpdated: string
}

interface WarehouseStats {
  totalWarehouses: number
  activeWarehouses: number
  inactiveWarehouses: number
  maintenanceWarehouses: number
  totalCapacity: number
  totalUsedCapacity: number
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'text-green-600 dark:text-green-400'
    case 'inactive': return 'text-gray-600 dark:text-gray-400'
    case 'maintenance': return 'text-yellow-600 dark:text-yellow-400'
    default: return 'text-gray-600 dark:text-gray-400'
  }
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'active': return <span className="status-badge bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">فعال</span>
    case 'inactive': return <span className="status-badge bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300">غیرفعال</span>
    case 'maintenance': return <span className="status-badge bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">تعمیرات</span>
    default: return null
  }
}

const getTypeBadge = (type: string) => {
  switch (type) {
    case 'main': return <span className="status-badge bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">اصلی</span>
    case 'storage': return <span className="status-badge bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">ذخیره</span>
    case 'cold': return <span className="status-badge bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300">سرد</span>
    case 'dry': return <span className="status-badge bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">خشک</span>
    default: return null
  }
}

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<WarehouseData[]>([])
  const [stats, setStats] = useState<WarehouseStats>({
    totalWarehouses: 0,
    activeWarehouses: 0,
    inactiveWarehouses: 0,
    maintenanceWarehouses: 0,
    totalCapacity: 0,
    totalUsedCapacity: 0
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [selectedWarehouse, setSelectedWarehouse] = useState<WarehouseData | null>(null)
  const [showWarehouseModal, setShowWarehouseModal] = useState(false)
  const [showInventoryModal, setShowInventoryModal] = useState(false)
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingWarehouse, setEditingWarehouse] = useState<WarehouseData | null>(null)

  // فرم ایجاد/ویرایش انبار
  const [formData, setFormData] = useState({
    name: '',
    type: 'main',
    location: '',
    address: '',
    capacity: 0,
    usedCapacity: 0,
    temperature: '',
    humidity: '',
    manager: '',
    phone: '',
    email: '',
    description: '',
    status: 'active'
  })

  // بارگذاری داده‌ها
  const fetchWarehouses = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/warehouses')
      const data = await response.json()
      
      if (data.success) {
        setWarehouses(data.data)
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error fetching warehouses:', error)
    } finally {
      setLoading(false)
    }
  }

  // بارگذاری آیتم‌های موجودی انبار
  const fetchWarehouseInventory = async (warehouseId: string) => {
    try {
      const response = await fetch(`/api/warehouses/${warehouseId}`)
      const data = await response.json()
      
      if (data.success) {
        setInventoryItems(data.data.inventoryItems || [])
      }
    } catch (error) {
      console.error('Error fetching warehouse inventory:', error)
    }
  }

  // ایجاد انبار جدید
  const handleCreateWarehouse = async () => {
    try {
      const response = await fetch('/api/warehouses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })
      
      const data = await response.json()
      
      if (data.success) {
        alert('انبار با موفقیت ایجاد شد')
        setShowCreateModal(false)
        resetForm()
        fetchWarehouses()
      } else {
        alert('خطا در ایجاد انبار: ' + data.message)
      }
    } catch (error) {
      console.error('Error creating warehouse:', error)
      alert('خطا در ایجاد انبار')
    }
  }

  // به‌روزرسانی انبار
  const handleUpdateWarehouse = async () => {
    if (!editingWarehouse) return

    try {
      const response = await fetch(`/api/warehouses/${editingWarehouse._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })
      
      const data = await response.json()
      
      if (data.success) {
        alert('انبار با موفقیت به‌روزرسانی شد')
        setShowWarehouseModal(false)
        setEditingWarehouse(null)
        resetForm()
        fetchWarehouses()
      } else {
        alert('خطا در به‌روزرسانی انبار: ' + data.message)
      }
    } catch (error) {
      console.error('Error updating warehouse:', error)
      alert('خطا در به‌روزرسانی انبار')
    }
  }

  // حذف انبار
  const handleDeleteWarehouse = async (warehouseId: string) => {
    if (!confirm('آیا از حذف این انبار اطمینان دارید؟')) return

    try {
      const response = await fetch(`/api/warehouses/${warehouseId}`, {
        method: 'DELETE',
      })
      
      const data = await response.json()
      
      if (data.success) {
        alert('انبار با موفقیت حذف شد')
        fetchWarehouses()
      } else {
        alert('خطا در حذف انبار: ' + data.message)
      }
    } catch (error) {
      console.error('Error deleting warehouse:', error)
      alert('خطا در حذف انبار')
    }
  }

  // اضافه کردن داده‌های نمونه
  const handleAddSampleData = async () => {
    try {
      const response = await fetch('/api/add-sample-warehouses', {
        method: 'POST',
      })
      
      const data = await response.json()
      
      if (data.success) {
        alert('داده‌های نمونه با موفقیت اضافه شد')
        fetchWarehouses()
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
      name: '',
      type: 'main',
      location: '',
      address: '',
      capacity: 0,
      usedCapacity: 0,
      temperature: '',
      humidity: '',
      manager: '',
      phone: '',
      email: '',
      description: '',
      status: 'active'
    })
  }

  // شروع ویرایش
  const handleEditWarehouse = (warehouse: WarehouseData) => {
    setEditingWarehouse(warehouse)
    setFormData({
      name: warehouse.name,
      type: warehouse.type,
      location: warehouse.location,
      address: warehouse.address,
      capacity: warehouse.capacity,
      usedCapacity: warehouse.usedCapacity,
      temperature: warehouse.temperature?.toString() || '',
      humidity: warehouse.humidity?.toString() || '',
      manager: warehouse.manager,
      phone: warehouse.phone,
      email: warehouse.email,
      description: warehouse.description,
      status: warehouse.status
    })
    setShowWarehouseModal(true)
  }

  // مشاهده موجودی انبار
  const handleViewInventory = async (warehouse: WarehouseData) => {
    setSelectedWarehouse(warehouse)
    await fetchWarehouseInventory(warehouse._id)
    setShowInventoryModal(true)
  }

  // فیلتر انبارها
  const filteredWarehouses = warehouses.filter(warehouse =>
    (searchTerm === '' || 
      warehouse.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      warehouse.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      warehouse.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      warehouse.manager.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (filterStatus === 'all' || warehouse.status === filterStatus) &&
    (filterType === 'all' || warehouse.type === filterType)
  )

  useEffect(() => {
    fetchWarehouses()
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
          <h1 className="text-3xl font-bold gradient-text">مدیریت انبارها</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            مدیریت انبارها، موجودی‌ها و کنترل دقیق گردش کالا.
          </p>
        </div>
        <div className="flex items-center space-x-3 space-x-reverse">
          <button
            onClick={() => setShowCreateModal(true)}
            className="premium-button flex items-center space-x-2 space-x-reverse"
          >
            <Plus className="w-5 h-5" />
            <span>انبار جدید</span>
          </button>
          <button
            onClick={handleAddSampleData}
            className="premium-button flex items-center space-x-2 space-x-reverse"
          >
            <Package className="w-5 h-5" />
            <span>داده نمونه</span>
          </button>
          <button
            onClick={fetchWarehouses}
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
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">کل انبارها</h3>
            <Warehouse className="w-6 h-6 text-primary-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalWarehouses}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">انبار فعال: {stats.activeWarehouses}</p>
        </div>

        <div className="premium-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">ظرفیت کل</h3>
            <Package className="w-6 h-6 text-success-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalCapacity.toLocaleString('fa-IR')}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">واحد ظرفیت</p>
        </div>

        <div className="premium-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">ظرفیت استفاده شده</h3>
            <TrendingUp className="w-6 h-6 text-warning-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalUsedCapacity.toLocaleString('fa-IR')}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">واحد استفاده شده</p>
        </div>

        <div className="premium-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">در تعمیرات</h3>
            <AlertTriangle className="w-6 h-6 text-danger-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.maintenanceWarehouses}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">انبار در تعمیرات</p>
        </div>
      </div>

      {/* Filters */}
      <div className="premium-card p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="جستجو انبار..."
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
            <option value="active">فعال</option>
            <option value="inactive">غیرفعال</option>
            <option value="maintenance">تعمیرات</option>
          </select>
          <select
            className="premium-input"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">همه انواع</option>
            <option value="main">اصلی</option>
            <option value="storage">ذخیره</option>
            <option value="cold">سرد</option>
            <option value="dry">خشک</option>
          </select>
          <button 
            onClick={fetchWarehouses}
            className="premium-button flex items-center justify-center space-x-2 space-x-reverse"
          >
            <RefreshCw className="w-5 h-5" />
            <span>بروزرسانی</span>
          </button>
        </div>

        {/* Warehouses Table */}
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-right whitespace-nowrap">
            <thead>
              <tr className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-800/50">
                <th className="px-4 py-3 rounded-r-lg">نام انبار</th>
                <th className="px-4 py-3">کد</th>
                <th className="px-4 py-3">نوع</th>
                <th className="px-4 py-3">مکان</th>
                <th className="px-4 py-3">مدیر</th>
                <th className="px-4 py-3">ظرفیت</th>
                <th className="px-4 py-3">استفاده شده</th>
                <th className="px-4 py-3">وضعیت</th>
                <th className="px-4 py-3 rounded-l-lg">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredWarehouses.map(warehouse => (
                <tr key={warehouse._id} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <Warehouse className="w-5 h-5 text-primary-600" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{warehouse.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{warehouse.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-200 font-mono">{warehouse.code}</td>
                  <td className="px-4 py-3">
                    {getTypeBadge(warehouse.type)}
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{warehouse.location}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{warehouse.manager}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{warehouse.capacity.toLocaleString('fa-IR')}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-200">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <span>{warehouse.usedCapacity.toLocaleString('fa-IR')}</span>
                      <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-primary-600 h-2 rounded-full" 
                          style={{ width: `${warehouse.capacity > 0 ? (warehouse.usedCapacity / warehouse.capacity) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {getStatusBadge(warehouse.status)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <button
                        onClick={() => handleViewInventory(warehouse)}
                        className="p-1 rounded-full text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                        title="مشاهده موجودی"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEditWarehouse(warehouse)}
                        className="p-1 rounded-full text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                        title="ویرایش"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteWarehouse(warehouse._id)}
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

      {/* Create/Edit Warehouse Modal */}
      {(showCreateModal || editingWarehouse) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {editingWarehouse ? 'ویرایش انبار' : 'انبار جدید'}
              </h2>
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setEditingWarehouse(null)
                  resetForm()
                }}
                className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault()
              if (editingWarehouse) {
                handleUpdateWarehouse()
              } else {
                handleCreateWarehouse()
              }
            }} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    نام انبار *
                  </label>
                  <input
                    type="text"
                    required
                    className="premium-input w-full"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    نوع انبار
                  </label>
                  <select
                    className="premium-input w-full"
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                  >
                    <option value="main">اصلی</option>
                    <option value="storage">ذخیره</option>
                    <option value="cold">سرد</option>
                    <option value="dry">خشک</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    مکان
                  </label>
                  <input
                    type="text"
                    className="premium-input w-full"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    آدرس
                  </label>
                  <input
                    type="text"
                    className="premium-input w-full"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    ظرفیت
                  </label>
                  <input
                    type="number"
                    className="premium-input w-full"
                    value={formData.capacity}
                    onChange={(e) => setFormData({...formData, capacity: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    ظرفیت استفاده شده
                  </label>
                  <input
                    type="number"
                    className="premium-input w-full"
                    value={formData.usedCapacity}
                    onChange={(e) => setFormData({...formData, usedCapacity: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    دما (سانتی‌گراد)
                  </label>
                  <input
                    type="number"
                    className="premium-input w-full"
                    value={formData.temperature}
                    onChange={(e) => setFormData({...formData, temperature: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    رطوبت (%)
                  </label>
                  <input
                    type="number"
                    className="premium-input w-full"
                    value={formData.humidity}
                    onChange={(e) => setFormData({...formData, humidity: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    مدیر
                  </label>
                  <input
                    type="text"
                    className="premium-input w-full"
                    value={formData.manager}
                    onChange={(e) => setFormData({...formData, manager: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    تلفن
                  </label>
                  <input
                    type="text"
                    className="premium-input w-full"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    ایمیل
                  </label>
                  <input
                    type="email"
                    className="premium-input w-full"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    وضعیت
                  </label>
                  <select
                    className="premium-input w-full"
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                  >
                    <option value="active">فعال</option>
                    <option value="inactive">غیرفعال</option>
                    <option value="maintenance">تعمیرات</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  توضیحات
                </label>
                <textarea
                  className="premium-input w-full"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>
              <div className="flex items-center justify-end space-x-3 space-x-reverse">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false)
                    setEditingWarehouse(null)
                    resetForm()
                  }}
                  className="premium-button bg-gray-500 hover:bg-gray-600"
                >
                  لغو
                </button>
                <button
                  type="submit"
                  className="premium-button flex items-center space-x-2 space-x-reverse"
                >
                  <Save className="w-5 h-5" />
                  <span>{editingWarehouse ? 'به‌روزرسانی' : 'ایجاد'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inventory Items Modal */}
      {showInventoryModal && selectedWarehouse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                موجودی انبار {selectedWarehouse.name}
              </h2>
              <button
                onClick={() => setShowInventoryModal(false)}
                className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-right whitespace-nowrap">
                <thead>
                  <tr className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-800/50">
                    <th className="px-4 py-3 rounded-r-lg">نام آیتم</th>
                    <th className="px-4 py-3">دسته‌بندی</th>
                    <th className="px-4 py-3">موجودی فعلی</th>
                    <th className="px-4 py-3">حداقل</th>
                    <th className="px-4 py-3">حداکثر</th>
                    <th className="px-4 py-3">واحد</th>
                    <th className="px-4 py-3">قیمت واحد</th>
                    <th className="px-4 py-3">ارزش کل</th>
                    <th className="px-4 py-3">وضعیت</th>
                    <th className="px-4 py-3 rounded-l-lg">آخرین به‌روزرسانی</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {inventoryItems.map(item => (
                    <tr key={item._id} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-3 space-x-reverse">
                          <Package className="w-5 h-5 text-primary-600" />
                          <span className="font-medium text-gray-900 dark:text-white">{item.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{item.category}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{item.currentStock}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{item.minStock}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{item.maxStock}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{item.unit}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{item.unitPrice.toLocaleString('fa-IR')}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{item.totalValue.toLocaleString('fa-IR')}</td>
                      <td className="px-4 py-3">
                        {item.isLowStock ? (
                          <span className="status-badge bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">کم‌موجود</span>
                        ) : (
                          <span className="status-badge bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">عادی</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200">
                        {new Date(item.lastUpdated).toLocaleDateString('fa-IR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}