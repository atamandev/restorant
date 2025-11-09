'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Warehouse,
  Package,
  ArrowRight,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Clock,
  DollarSign,
  RefreshCw,
  ArrowRightLeft,
  FileText,
  Bell,
  Loader,
  X
} from 'lucide-react'

interface WarehouseData {
  _id: string
  code: string
  name: string
  type: string
  location: string
  address: string
  capacity: number
  usedCapacity: number
  availableCapacity: number
  manager: string
  phone: string
  email: string
  status: 'active' | 'inactive' | 'maintenance'
  allowNegativeStock?: boolean
}

interface InventoryItem {
  _id: string
  name: string
  code?: string
  category: string
  currentStock: number
  minStock: number
  maxStock: number
  unit: string
  unitPrice: number
  totalValue: number
  isLowStock: boolean
  warehouse?: string
}

interface StockMovement {
  _id: string
  itemId: string
  itemName?: string
  movementType: string
  quantity: number
  unitPrice: number
  totalValue: number
  documentNumber: string
  documentType: string
  description: string
  createdAt: string
}

interface StockAlert {
  _id: string
  itemId: string
  itemName: string
  type: 'low_stock' | 'out_of_stock' | 'expiry' | 'overstock'
  severity: 'low' | 'medium' | 'high' | 'critical'
  currentStock: number
  minStock: number
  message: string
  status: 'active' | 'resolved' | 'dismissed'
}

const getMovementTypeLabel = (type: string) => {
  const labels: { [key: string]: string } = {
    'INITIAL': 'موجودی اولیه',
    'PURCHASE_IN': 'ورود خرید',
    'SALE_CONSUMPTION': 'مصرف فروش',
    'TRANSFER_OUT': 'خروج انتقال',
    'TRANSFER_IN': 'ورود انتقال',
    'ADJUSTMENT_INCREMENT': 'اصلاح افزایشی',
    'ADJUSTMENT_DECREMENT': 'اصلاح کاهشی',
    'WASTAGE': 'ضایعات',
    'RETURN_IN': 'مرجوعی ورودی',
    'RETURN_OUT': 'مرجوعی خروجی'
  }
  return labels[type] || type
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

export default function WarehouseDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const warehouseId = params.id as string
  
  const [warehouse, setWarehouse] = useState<WarehouseData | null>(null)
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [alerts, setAlerts] = useState<StockAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'inventory' | 'movements' | 'alerts'>('inventory')

  // بارگذاری اطلاعات انبار
  const fetchWarehouse = async () => {
    try {
      const response = await fetch(`/api/warehouses/${warehouseId}`)
      const data = await response.json()
      
      if (data.success) {
        setWarehouse(data.data)
      }
    } catch (error) {
      console.error('Error fetching warehouse:', error)
    }
  }

  // بارگذاری موجودی انبار
  const fetchInventory = async () => {
    try {
      const response = await fetch(`/api/warehouses/${warehouseId}`)
      const data = await response.json()
      
      if (data.success) {
        setInventoryItems(data.data.inventoryItems || [])
      }
    } catch (error) {
      console.error('Error fetching inventory:', error)
    }
  }

  // بارگذاری حرکات کالا
  const fetchMovements = async () => {
    try {
      if (!warehouse) return
      
      const response = await fetch(`/api/inventory/stock-movements?warehouseName=${encodeURIComponent(warehouse.name)}&limit=100`)
      const data = await response.json()
      
      if (data.success) {
        setMovements(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching movements:', error)
    }
  }

  // بارگذاری هشدارها
  const fetchAlerts = async () => {
    try {
      if (!warehouse) return
      
      const response = await fetch(`/api/stock-alerts?warehouse=${encodeURIComponent(warehouse.name)}&status=active&limit=100`)
      const data = await response.json()
      
      if (data.success) {
        setAlerts(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching alerts:', error)
    }
  }

  useEffect(() => {
    if (warehouseId) {
      fetchWarehouse()
    }
  }, [warehouseId])

  useEffect(() => {
    if (warehouse) {
      fetchInventory()
      fetchMovements()
      fetchAlerts()
      setLoading(false)
    }
  }, [warehouse])

  // Auto-refresh
  useEffect(() => {
    if (warehouse) {
      const interval = setInterval(() => {
        fetchInventory()
        fetchMovements()
        fetchAlerts()
      }, 5000)
      
      return () => clearInterval(interval)
    }
  }, [warehouse])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (!warehouse) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">انبار یافت نشد</p>
        <button
          onClick={() => router.push('/inventory/warehouses')}
          className="mt-4 premium-button"
        >
          بازگشت به لیست انبارها
        </button>
      </div>
    )
  }

  const totalValue = inventoryItems.reduce((sum, item) => sum + (item.totalValue || 0), 0)
  const totalItems = inventoryItems.length
  const lowStockItems = inventoryItems.filter(item => item.isLowStock || item.currentStock <= item.minStock).length

  return (
    <div className="fade-in-animation space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 space-x-reverse">
          <button
            onClick={() => router.push('/inventory/warehouses')}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold gradient-text">{warehouse.name}</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              {warehouse.code && `کد: ${warehouse.code}`} | {warehouse.location || 'بدون مکان'}
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            fetchInventory()
            fetchMovements()
            fetchAlerts()
          }}
          className="premium-button p-3"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Warehouse Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="premium-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">کل آیتم‌ها</h3>
            <Package className="w-6 h-6 text-primary-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{totalItems}</p>
        </div>
        <div className="premium-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">ارزش کل</h3>
            <DollarSign className="w-6 h-6 text-success-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {totalValue.toLocaleString('fa-IR')} تومان
          </p>
        </div>
        <div className="premium-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">کم‌موجود</h3>
            <AlertTriangle className="w-6 h-6 text-warning-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{lowStockItems}</p>
        </div>
        <div className="premium-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">ظرفیت</h3>
            <TrendingUp className="w-6 h-6 text-info-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {warehouse.capacity > 0 
              ? `${warehouse.usedCapacity.toLocaleString('fa-IR')} / ${warehouse.capacity.toLocaleString('fa-IR')}`
              : 'نامحدود'
            }
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="premium-card p-6">
        <div className="flex items-center space-x-4 space-x-reverse border-b border-gray-200 dark:border-gray-700 mb-6">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'inventory'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            موجودی ({inventoryItems.length})
          </button>
          <button
            onClick={() => setActiveTab('movements')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'movements'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            تاریخچه حرکات ({movements.length})
          </button>
          <button
            onClick={() => setActiveTab('alerts')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'alerts'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            هشدارها ({alerts.length})
          </button>
        </div>

        {/* Inventory Tab */}
        {activeTab === 'inventory' && (
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead>
                <tr className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-800/50">
                  <th className="px-4 py-3">نام آیتم</th>
                  <th className="px-4 py-3">کد</th>
                  <th className="px-4 py-3">دسته‌بندی</th>
                  <th className="px-4 py-3">موجودی فعلی</th>
                  <th className="px-4 py-3">حداقل</th>
                  <th className="px-4 py-3">حداکثر</th>
                  <th className="px-4 py-3">واحد</th>
                  <th className="px-4 py-3">قیمت واحد</th>
                  <th className="px-4 py-3">ارزش کل</th>
                  <th className="px-4 py-3">وضعیت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {inventoryItems.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-12 text-gray-500 dark:text-gray-400">
                      محصولی در این انبار موجود نیست
                    </td>
                  </tr>
                ) : (
                  inventoryItems.map(item => (
                    <tr key={item._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{item.name}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400 font-mono">{item.code || '-'}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{item.category}</td>
                      <td className="px-4 py-3 text-gray-900 dark:text-white">{item.currentStock.toLocaleString('fa-IR')}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{item.minStock}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{item.maxStock}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{item.unit}</td>
                      <td className="px-4 py-3 text-gray-900 dark:text-white">{item.unitPrice.toLocaleString('fa-IR')}</td>
                      <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">{item.totalValue.toLocaleString('fa-IR')}</td>
                      <td className="px-4 py-3">
                        {item.isLowStock || item.currentStock <= item.minStock ? (
                          <span className="status-badge bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">کم</span>
                        ) : (
                          <span className="status-badge bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">کافی</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Movements Tab */}
        {activeTab === 'movements' && (
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead>
                <tr className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-800/50">
                  <th className="px-4 py-3">تاریخ</th>
                  <th className="px-4 py-3">نوع حرکت</th>
                  <th className="px-4 py-3">نام آیتم</th>
                  <th className="px-4 py-3">تعداد</th>
                  <th className="px-4 py-3">قیمت واحد</th>
                  <th className="px-4 py-3">ارزش کل</th>
                  <th className="px-4 py-3">شماره سند</th>
                  <th className="px-4 py-3">توضیحات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {movements.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-gray-500 dark:text-gray-400">
                      هیچ حرکتی ثبت نشده است
                    </td>
                  </tr>
                ) : (
                  movements.map(movement => (
                    <tr key={movement._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        {new Date(movement.createdAt).toLocaleDateString('fa-IR')}
                      </td>
                      <td className="px-4 py-3">
                        <span className="status-badge bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                          {getMovementTypeLabel(movement.movementType)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-900 dark:text-white">{movement.itemName || '-'}</td>
                      <td className={`px-4 py-3 font-medium ${
                        movement.quantity > 0 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {movement.quantity > 0 ? '+' : ''}{movement.quantity.toLocaleString('fa-IR')}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{movement.unitPrice.toLocaleString('fa-IR')}</td>
                      <td className={`px-4 py-3 font-semibold ${
                        movement.totalValue > 0 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {movement.totalValue > 0 ? '+' : ''}{movement.totalValue.toLocaleString('fa-IR')}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400 font-mono">{movement.documentNumber}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{movement.description || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Alerts Tab */}
        {activeTab === 'alerts' && (
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead>
                <tr className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-800/50">
                  <th className="px-4 py-3">نام آیتم</th>
                  <th className="px-4 py-3">نوع هشدار</th>
                  <th className="px-4 py-3">شدت</th>
                  <th className="px-4 py-3">موجودی فعلی</th>
                  <th className="px-4 py-3">حداقل</th>
                  <th className="px-4 py-3">پیام</th>
                  <th className="px-4 py-3">تاریخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {alerts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-gray-500 dark:text-gray-400">
                      هیچ هشداری وجود ندارد
                    </td>
                  </tr>
                ) : (
                  alerts.map(alert => (
                    <tr key={alert._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{alert.itemName}</td>
                      <td className="px-4 py-3">{getAlertTypeBadge(alert.type)}</td>
                      <td className="px-4 py-3">
                        <span className={`status-badge ${
                          alert.severity === 'critical' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                          alert.severity === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' :
                          alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                          'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                        }`}>
                          {alert.severity === 'critical' ? 'بحرانی' :
                           alert.severity === 'high' ? 'بالا' :
                           alert.severity === 'medium' ? 'متوسط' : 'کم'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-900 dark:text-white">{alert.currentStock}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{alert.minStock}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{alert.message}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        {new Date(alert._id).toLocaleDateString('fa-IR')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

