'use client'

import { useState } from 'react'
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Calendar,
  Download,
  Filter,
  RefreshCw,
  Eye,
  PieChart,
  LineChart,
  Activity
} from 'lucide-react'

interface SalesData {
  date: string
  totalSales: number
  orderCount: number
  averageOrderValue: number
  customerCount: number
}

interface CategorySales {
  category: string
  sales: number
  percentage: number
  orderCount: number
}

interface PaymentMethodData {
  method: string
  amount: number
  percentage: number
  count: number
}

const sampleSalesData: SalesData[] = [
  { date: '1403/01/01', totalSales: 2500000, orderCount: 45, averageOrderValue: 55556, customerCount: 38 },
  { date: '1403/01/02', totalSales: 3200000, orderCount: 52, averageOrderValue: 61538, customerCount: 42 },
  { date: '1403/01/03', totalSales: 2800000, orderCount: 48, averageOrderValue: 58333, customerCount: 40 },
  { date: '1403/01/04', totalSales: 4100000, orderCount: 65, averageOrderValue: 63077, customerCount: 55 },
  { date: '1403/01/05', totalSales: 3800000, orderCount: 58, averageOrderValue: 65517, customerCount: 48 },
  { date: '1403/01/06', totalSales: 4500000, orderCount: 72, averageOrderValue: 62500, customerCount: 62 },
  { date: '1403/01/07', totalSales: 5200000, orderCount: 85, averageOrderValue: 61176, customerCount: 70 }
]

const categorySalesData: CategorySales[] = [
  { category: 'غذاهای اصلی', sales: 8500000, percentage: 45, orderCount: 120 },
  { category: 'نوشیدنی‌ها', sales: 3200000, percentage: 17, orderCount: 85 },
  { category: 'پیش‌غذاها', sales: 2800000, percentage: 15, orderCount: 65 },
  { category: 'دسرها', sales: 1800000, percentage: 10, orderCount: 45 },
  { category: 'ساندویچ‌ها', sales: 2500000, percentage: 13, orderCount: 55 }
]

const paymentMethodData: PaymentMethodData[] = [
  { method: 'نقدی', amount: 12000000, percentage: 60, count: 180 },
  { method: 'کارتی', amount: 6000000, percentage: 30, count: 90 },
  { method: 'اعتباری', amount: 2000000, percentage: 10, count: 30 }
]

export default function SalesReportPage() {
  const [dateRange, setDateRange] = useState('week')
  const [selectedPeriod, setSelectedPeriod] = useState('daily')
  const [showChart, setShowChart] = useState('sales')

  const getTotalSales = () => {
    return sampleSalesData.reduce((sum, day) => sum + day.totalSales, 0)
  }

  const getTotalOrders = () => {
    return sampleSalesData.reduce((sum, day) => sum + day.orderCount, 0)
  }

  const getAverageOrderValue = () => {
    const totalSales = getTotalSales()
    const totalOrders = getTotalOrders()
    return totalOrders > 0 ? totalSales / totalOrders : 0
  }

  const getTotalCustomers = () => {
    return sampleSalesData.reduce((sum, day) => sum + day.customerCount, 0)
  }

  const getSalesGrowth = () => {
    if (sampleSalesData.length < 2) return 0
    const firstDay = sampleSalesData[0].totalSales
    const lastDay = sampleSalesData[sampleSalesData.length - 1].totalSales
    return ((lastDay - firstDay) / firstDay) * 100
  }

  const getOrderGrowth = () => {
    if (sampleSalesData.length < 2) return 0
    const firstDay = sampleSalesData[0].orderCount
    const lastDay = sampleSalesData[sampleSalesData.length - 1].orderCount
    return ((lastDay - firstDay) / firstDay) * 100
  }

  const getTopSellingCategory = () => {
    return categorySalesData.reduce((top, category) => 
      category.sales > top.sales ? category : top
    )
  }

  const getMostUsedPaymentMethod = () => {
    return paymentMethodData.reduce((top, method) => 
      method.amount > top.amount ? method : top
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/80 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold gradient-text mb-2">گزارش فروش</h1>
          <p className="text-gray-600 dark:text-gray-300">تحلیل و بررسی عملکرد فروش رستوران</p>
        </div>

        {/* Filters */}
        <div className="premium-card p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 space-x-reverse">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  بازه زمانی
                </label>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="week">هفته جاری</option>
                  <option value="month">ماه جاری</option>
                  <option value="quarter">فصل جاری</option>
                  <option value="year">سال جاری</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  نوع گزارش
                </label>
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="daily">روزانه</option>
                  <option value="weekly">هفتگی</option>
                  <option value="monthly">ماهانه</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  نوع نمودار
                </label>
                <select
                  value={showChart}
                  onChange={(e) => setShowChart(e.target.value)}
                  className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="sales">فروش</option>
                  <option value="orders">سفارشات</option>
                  <option value="customers">مشتریان</option>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="premium-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">کل فروش</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {getTotalSales().toLocaleString('fa-IR')} تومان
                </p>
                <div className="flex items-center space-x-1 space-x-reverse mt-1">
                  {getSalesGrowth() >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500" />
                  )}
                  <span className={`text-sm font-medium ${
                    getSalesGrowth() >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {Math.abs(getSalesGrowth()).toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
          <div className="premium-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">کل سفارشات</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{getTotalOrders()}</p>
                <div className="flex items-center space-x-1 space-x-reverse mt-1">
                  {getOrderGrowth() >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500" />
                  )}
                  <span className={`text-sm font-medium ${
                    getOrderGrowth() >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {Math.abs(getOrderGrowth()).toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
          <div className="premium-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">میانگین سفارش</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {getAverageOrderValue().toLocaleString('fa-IR')} تومان
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {getTotalCustomers()} مشتری
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
          <div className="premium-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">بهترین دسته</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {getTopSellingCategory().category}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {getTopSellingCategory().percentage}% از فروش
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Sales Trend Chart */}
          <div className="premium-card p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              روند فروش {selectedPeriod === 'daily' ? 'روزانه' : selectedPeriod === 'weekly' ? 'هفتگی' : 'ماهانه'}
            </h3>
            <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <div className="text-center">
                <LineChart className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 dark:text-gray-400">نمودار روند فروش</p>
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  {sampleSalesData.length} روز داده
                </p>
              </div>
            </div>
          </div>

          {/* Category Sales Pie Chart */}
          <div className="premium-card p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              فروش بر اساس دسته‌بندی
            </h3>
            <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <div className="text-center">
                <PieChart className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 dark:text-gray-400">نمودار دایره‌ای فروش</p>
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  {categorySalesData.length} دسته‌بندی
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Daily Sales Table */}
          <div className="premium-card p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              فروش روزانه
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-600/30">
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">تاریخ</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">فروش</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">سفارشات</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">میانگین</th>
                  </tr>
                </thead>
                <tbody>
                  {sampleSalesData.map((day, index) => (
                    <tr key={index} className="border-b border-gray-100 dark:border-gray-700/30">
                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">{day.date}</td>
                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                        {day.totalSales.toLocaleString('fa-IR')} تومان
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">{day.orderCount}</td>
                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                        {day.averageOrderValue.toLocaleString('fa-IR')} تومان
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Category Sales Table */}
          <div className="premium-card p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              فروش بر اساس دسته‌بندی
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-600/30">
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">دسته‌بندی</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">فروش</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">درصد</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">سفارشات</th>
                  </tr>
                </thead>
                <tbody>
                  {categorySalesData.map((category, index) => (
                    <tr key={index} className="border-b border-gray-100 dark:border-gray-700/30">
                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">{category.category}</td>
                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                        {category.sales.toLocaleString('fa-IR')} تومان
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">{category.percentage}%</td>
                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">{category.orderCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Payment Methods Analysis */}
        <div className="premium-card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            تحلیل روش‌های پرداخت
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {paymentMethodData.map((method, index) => (
              <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900 dark:text-white">{method.method}</h4>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{method.count} سفارش</span>
                </div>
                <div className="mb-2">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600 dark:text-gray-300">مبلغ</span>
                    <span className="text-gray-900 dark:text-white">
                      {method.amount.toLocaleString('fa-IR')} تومان
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full"
                      style={{ width: `${method.percentage}%` }}
                    ></div>
                  </div>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {method.percentage}% از کل فروش
                </p>
              </div>
            ))}
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
                <TrendingUp className="w-5 h-5 text-green-600" />
                <h4 className="font-medium text-green-800 dark:text-green-300">نقاط قوت</h4>
              </div>
              <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                <li>• رشد {getSalesGrowth().toFixed(1)}% در فروش نسبت به دوره قبل</li>
                <li>• میانگین سفارش {getAverageOrderValue().toLocaleString('fa-IR')} تومان</li>
                <li>• {getTopSellingCategory().category} با {getTopSellingCategory().percentage}% فروش</li>
              </ul>
            </div>
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center space-x-2 space-x-reverse mb-2">
                <Activity className="w-5 h-5 text-blue-600" />
                <h4 className="font-medium text-blue-800 dark:text-blue-300">توصیه‌ها</h4>
              </div>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <li>• افزایش تبلیغات برای دسته‌های کم‌فروش</li>
                <li>• بهبود تجربه مشتری برای افزایش میانگین سفارش</li>
                <li>• توسعه منو بر اساس ترجیحات مشتریان</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
