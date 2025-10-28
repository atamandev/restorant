'use client'

import React, { useState } from 'react'
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
  Bell
} from 'lucide-react'

interface Warehouse {
  id: string
  name: string
  code: string
  location: string
  manager: string
  managerPhone: string
  capacity: number
  currentStock: number
  status: 'active' | 'inactive' | 'maintenance'
  createdAt: string
  lastUpdated: string
  totalItems: number
  lowStockItems: number
  criticalStockItems: number
}

interface InventoryItem {
  id: string
  name: string
  code: string
  category: string
  currentStock: number
  minStock: number
  maxStock: number
  unit: string
  unitPrice: number
  totalValue: number
  lastMovement: string
  status: 'normal' | 'low' | 'critical' | 'out_of_stock'
}

const mockWarehouses: Warehouse[] = [
  {
    id: '1',
    name: 'انبار اصلی',
    code: 'WH-001',
    location: 'تهران، خیابان ولیعصر',
    manager: 'احمد محمدی',
    managerPhone: '09123456789',
    capacity: 1000,
    currentStock: 750,
    status: 'active',
    createdAt: '1403/01/01',
    lastUpdated: '1403/09/15',
    totalItems: 150,
    lowStockItems: 12,
    criticalStockItems: 3
  },
  {
    id: '2',
    name: 'انبار مواد اولیه',
    code: 'WH-002',
    location: 'تهران، شهرک صنعتی',
    manager: 'فاطمه کریمی',
    managerPhone: '09123456790',
    capacity: 500,
    currentStock: 320,
    status: 'active',
    createdAt: '1403/02/15',
    lastUpdated: '1403/09/14',
    totalItems: 85,
    lowStockItems: 8,
    criticalStockItems: 2
  },
  {
    id: '3',
    name: 'انبار محصولات نهایی',
    code: 'WH-003',
    location: 'تهران، منطقه 12',
    manager: 'رضا حسینی',
    managerPhone: '09123456791',
    capacity: 800,
    currentStock: 450,
    status: 'maintenance',
    createdAt: '1403/03/01',
    lastUpdated: '1403/09/10',
    totalItems: 95,
    lowStockItems: 5,
    criticalStockItems: 1
  }
]

const mockInventoryItems: InventoryItem[] = [
  {
    id: '1',
    name: 'برنج ایرانی',
    code: 'RICE-001',
    category: 'مواد اولیه',
    currentStock: 50,
    minStock: 20,
    maxStock: 100,
    unit: 'کیلوگرم',
    unitPrice: 45000,
    totalValue: 2250000,
    lastMovement: '1403/09/15',
    status: 'normal'
  },
  {
    id: '2',
    name: 'گوشت گوساله',
    code: 'MEAT-001',
    category: 'مواد اولیه',
    currentStock: 8,
    minStock: 15,
    maxStock: 50,
    unit: 'کیلوگرم',
    unitPrice: 180000,
    totalValue: 1440000,
    lastMovement: '1403/09/14',
    status: 'low'
  },
  {
    id: '3',
    name: 'روغن آفتابگردان',
    code: 'OIL-001',
    category: 'مواد اولیه',
    currentStock: 2,
    minStock: 10,
    maxStock: 30,
    unit: 'لیتر',
    unitPrice: 25000,
    totalValue: 50000,
    lastMovement: '1403/09/13',
    status: 'critical'
  },
  {
    id: '4',
    name: 'پیاز',
    code: 'VEG-001',
    category: 'سبزیجات',
    currentStock: 0,
    minStock: 5,
    maxStock: 20,
    unit: 'کیلوگرم',
    unitPrice: 8000,
    totalValue: 0,
    lastMovement: '1403/09/12',
    status: 'out_of_stock'
  }
]

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

const getStockStatusColor = (status: string) => {
  switch (status) {
    case 'normal': return 'text-green-600 dark:text-green-400'
    case 'low': return 'text-yellow-600 dark:text-yellow-400'
    case 'critical': return 'text-orange-600 dark:text-orange-400'
    case 'out_of_stock': return 'text-red-600 dark:text-red-400'
    default: return 'text-gray-600 dark:text-gray-400'
  }
}

const getStockStatusBadge = (status: string) => {
  switch (status) {
    case 'normal': return <span className="status-badge bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">عادی</span>
    case 'low': return <span className="status-badge bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">کم</span>
    case 'critical': return <span className="status-badge bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">بحرانی</span>
    case 'out_of_stock': return <span className="status-badge bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">تمام شده</span>
    default: return null
  }
}

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>(mockWarehouses)
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>(mockInventoryItems)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterWarehouse, setFilterWarehouse] = useState('all')
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null)
  const [showWarehouseModal, setShowWarehouseModal] = useState(false)
  const [showInventoryModal, setShowInventoryModal] = useState(false)

  const filteredWarehouses = warehouses.filter(warehouse =>
    (searchTerm === '' || 
      warehouse.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      warehouse.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      warehouse.location.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (filterStatus === 'all' || warehouse.status === filterStatus)
  )

  const filteredInventoryItems = inventoryItems.filter(item =>
    (searchTerm === '' || 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (filterWarehouse === 'all' || selectedWarehouse?.id === filterWarehouse)
  )

  const totalWarehouses = warehouses.length
  const activeWarehouses = warehouses.filter(w => w.status === 'active').length
  const totalItems = warehouses.reduce((sum, w) => sum + w.totalItems, 0)
  const lowStockItems = warehouses.reduce((sum, w) => sum + w.lowStockItems, 0)
  const criticalStockItems = warehouses.reduce((sum, w) => sum + w.criticalStockItems, 0)

  const handleCreateWarehouse = () => {
    setShowWarehouseModal(true)
  }

  const handleViewInventory = (warehouse: Warehouse) => {
    setSelectedWarehouse(warehouse)
    setShowInventoryModal(true)
  }

  const handleTransfer = (warehouse: Warehouse) => {
    alert(`انتقال از انبار ${warehouse.name} شروع شد.`)
  }

  const handleExport = () => {
    alert('گزارش انبارها به صورت Excel صادر شد.')
  }

  const handlePrint = () => {
    window.print()
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
            onClick={handleCreateWarehouse}
            className="premium-button flex items-center space-x-2 space-x-reverse"
          >
            <Plus className="w-5 h-5" />
            <span>انبار جدید</span>
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
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">کل انبارها</h3>
            <Warehouse className="w-6 h-6 text-primary-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{totalWarehouses}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">انبار فعال: {activeWarehouses}</p>
        </div>

        <div className="premium-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">کل آیتم‌ها</h3>
            <Package className="w-6 h-6 text-success-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{totalItems}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">آیتم در انبارها</p>
        </div>

        <div className="premium-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">موجودی کم</h3>
            <AlertTriangle className="w-6 h-6 text-warning-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{lowStockItems}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">آیتم نیاز به تامین</p>
        </div>

        <div className="premium-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">موجودی بحرانی</h3>
            <XCircle className="w-6 h-6 text-danger-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{criticalStockItems}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">آیتم بحرانی</p>
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
            value={filterWarehouse}
            onChange={(e) => setFilterWarehouse(e.target.value)}
          >
            <option value="all">همه انبارها</option>
            {warehouses.map(warehouse => (
              <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>
            ))}
          </select>
          <button className="premium-button flex items-center justify-center space-x-2 space-x-reverse">
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
                <th className="px-4 py-3">مکان</th>
                <th className="px-4 py-3">مدیر</th>
                <th className="px-4 py-3">ظرفیت</th>
                <th className="px-4 py-3">موجودی فعلی</th>
                <th className="px-4 py-3">وضعیت</th>
                <th className="px-4 py-3">آیتم‌ها</th>
                <th className="px-4 py-3">هشدارها</th>
                <th className="px-4 py-3 rounded-l-lg">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredWarehouses.map(warehouse => (
                <tr key={warehouse.id} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <Warehouse className="w-5 h-5 text-primary-600" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{warehouse.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{warehouse.managerPhone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-200 font-mono">{warehouse.code}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{warehouse.location}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{warehouse.manager}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{warehouse.capacity}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-200">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <span>{warehouse.currentStock}</span>
                      <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-primary-600 h-2 rounded-full" 
                          style={{ width: `${(warehouse.currentStock / warehouse.capacity) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {getStatusBadge(warehouse.status)}
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{warehouse.totalItems}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-1 space-x-reverse">
                      {warehouse.lowStockItems > 0 && (
                        <span className="text-yellow-600 text-sm">{warehouse.lowStockItems}</span>
                      )}
                      {warehouse.criticalStockItems > 0 && (
                        <span className="text-red-600 text-sm">{warehouse.criticalStockItems}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <button
                        onClick={() => handleViewInventory(warehouse)}
                        className="p-1 rounded-full text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleTransfer(warehouse)}
                        className="p-1 rounded-full text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                      >
                        <ArrowRightLeft className="w-4 h-4" />
                      </button>
                      <button className="p-1 rounded-full text-purple-600 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

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
                    <th className="px-4 py-3">کد</th>
                    <th className="px-4 py-3">دسته‌بندی</th>
                    <th className="px-4 py-3">موجودی فعلی</th>
                    <th className="px-4 py-3">حداقل</th>
                    <th className="px-4 py-3">حداکثر</th>
                    <th className="px-4 py-3">واحد</th>
                    <th className="px-4 py-3">قیمت واحد</th>
                    <th className="px-4 py-3">ارزش کل</th>
                    <th className="px-4 py-3">وضعیت</th>
                    <th className="px-4 py-3">آخرین حرکت</th>
                    <th className="px-4 py-3 rounded-l-lg">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredInventoryItems.map(item => (
                    <tr key={item.id} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-3 space-x-reverse">
                          <Package className="w-5 h-5 text-primary-600" />
                          <span className="font-medium text-gray-900 dark:text-white">{item.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200 font-mono">{item.code}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{item.category}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{item.currentStock}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{item.minStock}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{item.maxStock}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{item.unit}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{item.unitPrice.toLocaleString('fa-IR')}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{item.totalValue.toLocaleString('fa-IR')}</td>
                      <td className="px-4 py-3">
                        {getStockStatusBadge(item.status)}
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{item.lastMovement}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <button className="p-1 rounded-full text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="p-1 rounded-full text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors">
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
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
