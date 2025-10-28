'use client'

import { useState } from 'react'
import { 
  Package, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  BarChart3,
  PieChart,
  LineChart,
  Download,
  Filter,
  RefreshCw,
  Eye,
  Edit,
  Plus,
  Minus
} from 'lucide-react'

interface InventoryItem {
  id: string
  name: string
  category: string
  currentStock: number
  minStock: number
  maxStock: number
  unitPrice: number
  totalValue: number
  lastUpdated: string
  supplier: string
  expiryDate?: string
  isLowStock: boolean
  isExpiring: boolean
  monthlyUsage: number
  turnoverRate: number
}

const sampleInventoryData: InventoryItem[] = [
  {
    id: '1',
    name: 'برنج',
    category: 'مواد اولیه',
    currentStock: 50,
    minStock: 10,
    maxStock: 100,
    unitPrice: 25000,
    totalValue: 1250000,
    lastUpdated: '1403/01/20',
    supplier: 'تامین‌کننده مواد اولیه',
    expiryDate: '1404/06/15',
    isLowStock: false,
    isExpiring: false,
    monthlyUsage: 120,
    turnoverRate: 2.4
  },
  {
    id: '2',
    name: 'گوشت گوساله',
    category: 'مواد اولیه',
    currentStock: 5,
    minStock: 8,
    maxStock: 20,
    unitPrice: 180000,
    totalValue: 900000,
    lastUpdated: '1403/01/20',
    supplier: 'تامین‌کننده مواد اولیه',
    expiryDate: '1403/01/25',
    isLowStock: true,
    isExpiring: true,
    monthlyUsage: 80,
    turnoverRate: 16.0
  },
  {
    id: '3',
    name: 'نوشابه',
    category: 'نوشیدنی',
    currentStock: 200,
    minStock: 50,
    maxStock: 500,
    unitPrice: 8000,
    totalValue: 1600000,
    lastUpdated: '1403/01/18',
    supplier: 'تامین‌کننده نوشیدنی',
    expiryDate: '1404/12/31',
    isLowStock: false,
    isExpiring: false,
    monthlyUsage: 300,
    turnoverRate: 1.5
  },
  {
    id: '4',
    name: 'روغن',
    category: 'مواد اولیه',
    currentStock: 15,
    minStock: 5,
    maxStock: 30,
    unitPrice: 45000,
    totalValue: 675000,
    lastUpdated: '1403/01/19',
    supplier: 'تامین‌کننده مواد اولیه',
    expiryDate: '1403/03/15',
    isLowStock: false,
    isExpiring: false,
    monthlyUsage: 25,
    turnoverRate: 1.67
  },
  {
    id: '5',
    name: 'پیاز',
    category: 'سبزیجات',
    currentStock: 30,
    minStock: 15,
    maxStock: 50,
    unitPrice: 12000,
    totalValue: 360000,
    lastUpdated: '1403/01/21',
    supplier: 'تامین‌کننده سبزیجات',
    expiryDate: '1403/02/10',
    isLowStock: false,
    isExpiring: false,
    monthlyUsage: 60,
    turnoverRate: 2.0
  }
]

export default function InventoryReportPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>(sampleInventoryData)
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [sortBy, setSortBy] = useState('name')
  const [showChart, setShowChart] = useState('value')

  const categories = ['all', 'مواد اولیه', 'نوشیدنی', 'سبزیجات', 'ادویه', 'لبنیات']

  const filteredInventory = inventory.filter(item => {
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'low-stock' && item.isLowStock) ||
                         (filterStatus === 'expiring' && item.isExpiring) ||
                         (filterStatus === 'normal' && !item.isLowStock && !item.isExpiring)
    return matchesCategory && matchesStatus
  }).sort((a, b) => {
    switch (sortBy) {
      case 'name': return a.name.localeCompare(b.name)
      case 'stock': return a.currentStock - b.currentStock
      case 'value': return b.totalValue - a.totalValue
      case 'usage': return b.monthlyUsage - a.monthlyUsage
      case 'turnover': return b.turnoverRate - a.turnoverRate
      default: return 0
    }
  })

  const getTotalValue = () => {
    return inventory.reduce((sum, item) => sum + item.totalValue, 0)
  }

  const getLowStockItems = () => {
    return inventory.filter(item => item.isLowStock).length
  }

  const getExpiringItems = () => {
    return inventory.filter(item => item.isExpiring).length
  }

  const getTotalItems = () => inventory.length

  const getAverageTurnover = () => {
    return inventory.length > 0 ? inventory.reduce((sum, item) => sum + item.turnoverRate, 0) / inventory.length : 0
  }

  const getCategoryDistribution = () => {
    const distribution: { [key: string]: { count: number; value: number } } = {}
    inventory.forEach(item => {
      if (!distribution[item.category]) {
        distribution[item.category] = { count: 0, value: 0 }
      }
      distribution[item.category].count++
      distribution[item.category].value += item.totalValue
    })
    return distribution
  }

  const getTopSellingItems = () => {
    return inventory.sort((a, b) => b.monthlyUsage - a.monthlyUsage).slice(0, 5)
  }

  const getSlowMovingItems = () => {
    return inventory.filter(item => item.turnoverRate < 1.0)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/80 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold gradient-text mb-2">گزارش موجودی</h1>
          <p className="text-gray-600 dark:text-gray-300">تحلیل و بررسی وضعیت موجودی انبار</p>
        </div>

        {/* Filters */}
        <div className="premium-card p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 space-x-reverse">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  دسته‌بندی
                </label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category === 'all' ? 'همه دسته‌ها' : category}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  وضعیت
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="all">همه وضعیت‌ها</option>
                  <option value="normal">عادی</option>
                  <option value="low-stock">موجودی کم</option>
                  <option value="expiring">در حال انقضا</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  مرتب‌سازی
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="name">نام</option>
                  <option value="stock">موجودی</option>
                  <option value="value">ارزش</option>
                  <option value="usage">مصرف ماهانه</option>
                  <option value="turnover">نرخ گردش</option>
                </select>
              </div>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <button className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                <Download className="w-4 h-4" />
                <span>دانلود گزارش</span>
              </button>
              <button className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                <RefreshCw className="w-4 h-4" />
                <span>بروزرسانی</span>
              </button>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="premium-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">کل آیتم‌ها</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{getTotalItems()}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
          <div className="premium-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">ارزش کل</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {getTotalValue().toLocaleString('fa-IR')} تومان
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
          <div className="premium-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">موجودی کم</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{getLowStockItems()}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </div>
          <div className="premium-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">در حال انقضا</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{getExpiringItems()}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>
          <div className="premium-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">میانگین گردش</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {getAverageTurnover().toFixed(1)}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Category Distribution */}
          <div className="premium-card p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              توزیع بر اساس دسته‌بندی
            </h3>
            <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <div className="text-center">
                <PieChart className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 dark:text-gray-400">نمودار توزیع دسته‌بندی</p>
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  {Object.keys(getCategoryDistribution()).length} دسته‌بندی
                </p>
              </div>
            </div>
          </div>

          {/* Value Distribution */}
          <div className="premium-card p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              توزیع ارزش موجودی
            </h3>
            <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 dark:text-gray-400">نمودار ارزش موجودی</p>
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  {getTotalValue().toLocaleString('fa-IR')} تومان
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Top Selling Items */}
        <div className="premium-card p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            پرفروش‌ترین آیتم‌ها
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {getTopSellingItems().map((item, index) => (
              <div key={item.id} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    #{index + 1}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {item.monthlyUsage} واحد
                  </span>
                </div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-1">{item.name}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">{item.category}</p>
                <div className="mt-2">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full"
                      style={{ width: `${(item.monthlyUsage / Math.max(...getTopSellingItems().map(i => i.monthlyUsage))) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Inventory Table */}
        <div className="premium-card p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">لیست موجودی</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-600/30">
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">نام کالا</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">دسته‌بندی</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">موجودی</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">ارزش</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">مصرف ماهانه</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">نرخ گردش</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">وضعیت</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventory.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100 dark:border-gray-700/30">
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{item.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{item.supplier}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-sm">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <span className="text-gray-900 dark:text-white">{item.currentStock}</span>
                        {item.isLowStock && (
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        حداقل: {item.minStock} | حداکثر: {item.maxStock}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {item.totalValue.toLocaleString('fa-IR')} تومان
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-gray-900 dark:text-white">{item.monthlyUsage}</span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-1 space-x-reverse">
                        <span className="text-gray-900 dark:text-white">{item.turnoverRate.toFixed(1)}</span>
                        {item.turnoverRate > 2 ? (
                          <TrendingUp className="w-4 h-4 text-green-500" />
                        ) : item.turnoverRate < 1 ? (
                          <TrendingDown className="w-4 h-4 text-red-500" />
                        ) : null}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-col space-y-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.isLowStock 
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                            : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                        }`}>
                          {item.isLowStock ? 'موجودی کم' : 'کافی'}
                        </span>
                        {item.isExpiring && (
                          <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-full text-xs font-medium">
                            در حال انقضا
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <button className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors">
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

        {/* Insights and Recommendations */}
        <div className="premium-card p-6 mt-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            بینش‌ها و توصیه‌ها
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center space-x-2 space-x-reverse mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h4 className="font-medium text-green-800 dark:text-green-300">نقاط قوت</h4>
              </div>
              <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                <li>• {getTotalItems() - getLowStockItems()} آیتم با موجودی کافی</li>
                <li>• ارزش کل موجودی {getTotalValue().toLocaleString('fa-IR')} تومان</li>
                <li>• میانگین نرخ گردش {getAverageTurnover().toFixed(1)}</li>
              </ul>
            </div>
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <div className="flex items-center space-x-2 space-x-reverse mb-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <h4 className="font-medium text-red-800 dark:text-red-300">نیاز به توجه</h4>
              </div>
              <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                <li>• {getLowStockItems()} آیتم با موجودی کم</li>
                <li>• {getExpiringItems()} آیتم در حال انقضا</li>
                <li>• {getSlowMovingItems().length} آیتم با گردش کند</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
