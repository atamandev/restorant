'use client'

import React, { useState } from 'react'
import {
  TrendingUp,
  TrendingDown,
  PieChart,
  BarChart3,
  LineChart,
  DollarSign,
  Percent,
  Activity,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Download,
  Printer,
  Filter,
  RefreshCw,
  Settings,
  Zap,
  Target,
  Star,
  Award,
  Calendar,
  Building,
  Users,
  Package,
  Receipt,
  FileText,
  Search,
  Plus,
  Minus,
  Calculator,
  Database,
  FileSpreadsheet,
  BookOpen,
  ClipboardList,
  Bell,
  MapPin,
  User,
  Truck,
  Warehouse,
  CreditCard,
  Banknote
} from 'lucide-react'

interface PnLData {
  period: string
  revenue: number
  costOfGoodsSold: number
  grossProfit: number
  operatingExpenses: number
  operatingProfit: number
  otherIncome: number
  otherExpenses: number
  netProfit: number
  grossMargin: number
  operatingMargin: number
  netMargin: number
}

interface AgingData {
  customerName: string
  totalBalance: number
  current: number
  days30: number
  days60: number
  days90: number
  over90: number
  lastPaymentDate: string
  creditLimit: number
}

interface TrendData {
  month: string
  revenue: number
  expenses: number
  profit: number
  margin: number
}

const mockPnLData: PnLData[] = [
  {
    period: '1403/09',
    revenue: 185000000,
    costOfGoodsSold: 120000000,
    grossProfit: 65000000,
    operatingExpenses: 35000000,
    operatingProfit: 30000000,
    otherIncome: 2000000,
    otherExpenses: 1000000,
    netProfit: 31000000,
    grossMargin: 35.14,
    operatingMargin: 16.22,
    netMargin: 16.76
  },
  {
    period: '1403/08',
    revenue: 165000000,
    costOfGoodsSold: 110000000,
    grossProfit: 55000000,
    operatingExpenses: 32000000,
    operatingProfit: 23000000,
    otherIncome: 1500000,
    otherExpenses: 800000,
    netProfit: 23700000,
    grossMargin: 33.33,
    operatingMargin: 13.94,
    netMargin: 14.36
  },
  {
    period: '1403/07',
    revenue: 175000000,
    costOfGoodsSold: 115000000,
    grossProfit: 60000000,
    operatingExpenses: 33000000,
    operatingProfit: 27000000,
    otherIncome: 1800000,
    otherExpenses: 900000,
    netProfit: 27900000,
    grossMargin: 34.29,
    operatingMargin: 15.43,
    netMargin: 15.94
  }
]

const mockAgingData: AgingData[] = [
  {
    customerName: 'علی احمدی',
    totalBalance: 2500000,
    current: 1000000,
    days30: 800000,
    days60: 500000,
    days90: 200000,
    over90: 0,
    lastPaymentDate: '1403/09/10',
    creditLimit: 5000000
  },
  {
    customerName: 'فاطمه کریمی',
    totalBalance: 1800000,
    current: 600000,
    days30: 500000,
    days60: 400000,
    days90: 300000,
    over90: 0,
    lastPaymentDate: '1403/09/08',
    creditLimit: 3000000
  },
  {
    customerName: 'رضا حسینی',
    totalBalance: 3200000,
    current: 0,
    days30: 0,
    days60: 1200000,
    days90: 1000000,
    over90: 1000000,
    lastPaymentDate: '1403/08/15',
    creditLimit: 4000000
  }
]

const mockTrendData: TrendData[] = [
  { month: 'فروردین', revenue: 150000000, expenses: 120000000, profit: 30000000, margin: 20.0 },
  { month: 'اردیبهشت', revenue: 160000000, expenses: 125000000, profit: 35000000, margin: 21.9 },
  { month: 'خرداد', revenue: 170000000, expenses: 130000000, profit: 40000000, margin: 23.5 },
  { month: 'تیر', revenue: 165000000, expenses: 128000000, profit: 37000000, margin: 22.4 },
  { month: 'مرداد', revenue: 175000000, expenses: 135000000, profit: 40000000, margin: 22.9 },
  { month: 'شهریور', revenue: 185000000, expenses: 140000000, profit: 45000000, margin: 24.3 }
]

export default function FinancialReportsPage() {
  const [activeTab, setActiveTab] = useState<'pnl' | 'aging' | 'trends'>('pnl')
  const [selectedPeriod, setSelectedPeriod] = useState('current_month')
  const [selectedBranch, setSelectedBranch] = useState('all')
  const [selectedChannel, setSelectedChannel] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  const filteredAgingData = mockAgingData.filter(customer =>
    searchTerm === '' || 
    customer.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalRevenue = mockPnLData[0].revenue
  const totalExpenses = mockPnLData[0].costOfGoodsSold + mockPnLData[0].operatingExpenses
  const totalProfit = mockPnLData[0].netProfit
  const profitMargin = mockPnLData[0].netMargin

  const totalReceivables = mockAgingData.reduce((sum, customer) => sum + customer.totalBalance, 0)
  const overdueReceivables = mockAgingData.reduce((sum, customer) => sum + customer.days90 + customer.over90, 0)
  const currentReceivables = mockAgingData.reduce((sum, customer) => sum + customer.current, 0)

  const handleExport = (type: string) => {
    alert(`گزارش ${type} به صورت Excel صادر شد.`)
  }

  const handlePrint = () => {
    window.print()
  }

  const handleRefresh = () => {
    alert('گزارشات مالی بروزرسانی شد.')
  }

  return (
    <div className="fade-in-animation space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">گزارشات مالی و حسابداری</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            گزارشات سود و زیان، مانده اشخاص و تحلیل‌های مالی برای تصمیم‌گیری استراتژیک.
          </p>
        </div>
        <div className="flex items-center space-x-3 space-x-reverse">
          <button
            onClick={handleRefresh}
            className="premium-button flex items-center space-x-2 space-x-reverse"
          >
            <RefreshCw className="w-5 h-5" />
            <span>بروزرسانی</span>
          </button>
          <button
            onClick={handlePrint}
            className="premium-button p-3"
          >
            <Printer className="w-5 h-5" />
          </button>
          <button
            onClick={() => handleExport('مالی')}
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
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">کل درآمد</h3>
            <TrendingUp className="w-6 h-6 text-success-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{totalRevenue.toLocaleString('fa-IR')}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">تومان</p>
        </div>

        <div className="premium-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">کل هزینه‌ها</h3>
            <TrendingDown className="w-6 h-6 text-danger-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{totalExpenses.toLocaleString('fa-IR')}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">تومان</p>
        </div>

        <div className="premium-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">سود خالص</h3>
            <DollarSign className="w-6 h-6 text-primary-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{totalProfit.toLocaleString('fa-IR')}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">تومان</p>
        </div>

        <div className="premium-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">حاشیه سود</h3>
            <Percent className="w-6 h-6 text-accent-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{profitMargin.toFixed(1)}%</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">درصد</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="premium-card p-6">
        <div className="flex space-x-1 space-x-reverse bg-gray-100 dark:bg-gray-800 rounded-lg p-1 mb-6">
          <button
            onClick={() => setActiveTab('pnl')}
            className={`flex-1 flex items-center justify-center space-x-2 space-x-reverse px-4 py-2 rounded-md transition-all duration-200 ${
              activeTab === 'pnl'
                ? 'bg-white dark:bg-gray-700 text-primary-600 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span>سود و زیان</span>
          </button>
          <button
            onClick={() => setActiveTab('aging')}
            className={`flex-1 flex items-center justify-center space-x-2 space-x-reverse px-4 py-2 rounded-md transition-all duration-200 ${
              activeTab === 'aging'
                ? 'bg-white dark:bg-gray-700 text-primary-600 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Clock className="w-5 h-5" />
            <span>مانده اشخاص</span>
          </button>
          <button
            onClick={() => setActiveTab('trends')}
            className={`flex-1 flex items-center justify-center space-x-2 space-x-reverse px-4 py-2 rounded-md transition-all duration-200 ${
              activeTab === 'trends'
                ? 'bg-white dark:bg-gray-700 text-primary-600 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <LineChart className="w-5 h-5" />
            <span>روندها</span>
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <select
            className="premium-input"
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
          >
            <option value="current_month">ماه جاری</option>
            <option value="last_month">ماه گذشته</option>
            <option value="last_3_months">3 ماه گذشته</option>
            <option value="last_6_months">6 ماه گذشته</option>
            <option value="last_year">سال گذشته</option>
          </select>
          <select
            className="premium-input"
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
          >
            <option value="all">همه شعبه‌ها</option>
            <option value="main">شعبه مرکزی</option>
            <option value="branch1">شعبه 1</option>
            <option value="branch2">شعبه 2</option>
          </select>
          <select
            className="premium-input"
            value={selectedChannel}
            onChange={(e) => setSelectedChannel(e.target.value)}
          >
            <option value="all">همه کانال‌ها</option>
            <option value="dine_in">حضوری</option>
            <option value="takeaway">بیرون‌بر</option>
            <option value="delivery">ارسال</option>
          </select>
          {activeTab === 'aging' && (
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="جستجو مشتری..."
                className="premium-input pr-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* P&L Tab */}
        {activeTab === 'pnl' && (
          <div className="space-y-6">
            {/* P&L Table */}
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-right whitespace-nowrap">
                <thead>
                  <tr className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-800/50">
                    <th className="px-4 py-3 rounded-r-lg">دوره</th>
                    <th className="px-4 py-3">درآمد</th>
                    <th className="px-4 py-3">بهای تمام شده</th>
                    <th className="px-4 py-3">سود ناخالص</th>
                    <th className="px-4 py-3">هزینه‌های عملیاتی</th>
                    <th className="px-4 py-3">سود عملیاتی</th>
                    <th className="px-4 py-3">درآمدهای دیگر</th>
                    <th className="px-4 py-3">هزینه‌های دیگر</th>
                    <th className="px-4 py-3">سود خالص</th>
                    <th className="px-4 py-3">حاشیه ناخالص</th>
                    <th className="px-4 py-3">حاشیه عملیاتی</th>
                    <th className="px-4 py-3 rounded-l-lg">حاشیه خالص</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {mockPnLData.map((data, index) => (
                    <tr key={index} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">{data.period}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{data.revenue.toLocaleString('fa-IR')}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{data.costOfGoodsSold.toLocaleString('fa-IR')}</td>
                      <td className="px-4 py-3 text-green-600 dark:text-green-400 font-medium">{data.grossProfit.toLocaleString('fa-IR')}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{data.operatingExpenses.toLocaleString('fa-IR')}</td>
                      <td className="px-4 py-3 text-blue-600 dark:text-blue-400 font-medium">{data.operatingProfit.toLocaleString('fa-IR')}</td>
                      <td className="px-4 py-3 text-green-600 dark:text-green-400">{data.otherIncome.toLocaleString('fa-IR')}</td>
                      <td className="px-4 py-3 text-red-600 dark:text-red-400">{data.otherExpenses.toLocaleString('fa-IR')}</td>
                      <td className="px-4 py-3 text-primary-600 dark:text-primary-400 font-bold">{data.netProfit.toLocaleString('fa-IR')}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{data.grossMargin.toFixed(1)}%</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{data.operatingMargin.toFixed(1)}%</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200 font-medium">{data.netMargin.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* P&L Chart */}
            <div className="premium-card p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2 space-x-reverse">
                <BarChart3 className="w-6 h-6 text-primary-600" />
                <span>نمودار سود و زیان</span>
              </h2>
              <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center text-gray-500 dark:text-gray-400">
                <p>نمودار ستونی سود و زیان در اینجا قرار می‌گیرد.</p>
              </div>
            </div>
          </div>
        )}

        {/* Aging Tab */}
        {activeTab === 'aging' && (
          <div className="space-y-6">
            {/* Aging Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="premium-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">کل مطالبات</h3>
                  <Receipt className="w-6 h-6 text-primary-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{totalReceivables.toLocaleString('fa-IR')}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">تومان</p>
              </div>

              <div className="premium-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">مطالبات جاری</h3>
                  <CheckCircle className="w-6 h-6 text-success-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{currentReceivables.toLocaleString('fa-IR')}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">تومان</p>
              </div>

              <div className="premium-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">مطالبات معوق</h3>
                  <AlertTriangle className="w-6 h-6 text-danger-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{overdueReceivables.toLocaleString('fa-IR')}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">تومان</p>
              </div>
            </div>

            {/* Aging Table */}
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-right whitespace-nowrap">
                <thead>
                  <tr className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-800/50">
                    <th className="px-4 py-3 rounded-r-lg">نام مشتری</th>
                    <th className="px-4 py-3">کل مانده</th>
                    <th className="px-4 py-3">جاری</th>
                    <th className="px-4 py-3">1-30 روز</th>
                    <th className="px-4 py-3">31-60 روز</th>
                    <th className="px-4 py-3">61-90 روز</th>
                    <th className="px-4 py-3">بالای 90 روز</th>
                    <th className="px-4 py-3">آخرین پرداخت</th>
                    <th className="px-4 py-3">حد اعتبار</th>
                    <th className="px-4 py-3 rounded-l-lg">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredAgingData.map((customer, index) => (
                    <tr key={index} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">{customer.customerName}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200 font-medium">{customer.totalBalance.toLocaleString('fa-IR')}</td>
                      <td className="px-4 py-3 text-green-600 dark:text-green-400">{customer.current.toLocaleString('fa-IR')}</td>
                      <td className="px-4 py-3 text-blue-600 dark:text-blue-400">{customer.days30.toLocaleString('fa-IR')}</td>
                      <td className="px-4 py-3 text-yellow-600 dark:text-yellow-400">{customer.days60.toLocaleString('fa-IR')}</td>
                      <td className="px-4 py-3 text-orange-600 dark:text-orange-400">{customer.days90.toLocaleString('fa-IR')}</td>
                      <td className="px-4 py-3 text-red-600 dark:text-red-400">{customer.over90.toLocaleString('fa-IR')}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{customer.lastPaymentDate}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{customer.creditLimit.toLocaleString('fa-IR')}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <button className="p-1 rounded-full text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="p-1 rounded-full text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors">
                            <Receipt className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Trends Tab */}
        {activeTab === 'trends' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="premium-card p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2 space-x-reverse">
                  <LineChart className="w-6 h-6 text-primary-600" />
                  <span>روند درآمد و هزینه</span>
                </h2>
                <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center text-gray-500 dark:text-gray-400">
                  <p>نمودار خطی روند درآمد و هزینه در اینجا قرار می‌گیرد.</p>
                </div>
              </div>

              <div className="premium-card p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2 space-x-reverse">
                  <PieChart className="w-6 h-6 text-success-600" />
                  <span>توزیع هزینه‌ها</span>
                </h2>
                <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center text-gray-500 dark:text-gray-400">
                  <p>نمودار دایره‌ای توزیع هزینه‌ها در اینجا قرار می‌گیرد.</p>
                </div>
              </div>
            </div>

            <div className="premium-card p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2 space-x-reverse">
                <TrendingUp className="w-6 h-6 text-accent-600" />
                <span>روند حاشیه سود</span>
              </h2>
              <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center text-gray-500 dark:text-gray-400">
                <p>نمودار خطی روند حاشیه سود در اینجا قرار می‌گیرد.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="premium-card p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2 space-x-reverse">
          <Zap className="w-6 h-6 text-primary-600" />
          <span>اقدامات سریع</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={() => handleExport('سود و زیان')}
            className="premium-card p-4 flex items-center space-x-3 space-x-reverse hover:shadow-glow transition-all duration-300"
          >
            <BarChart3 className="w-8 h-8 text-blue-600" />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">گزارش سود و زیان</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">تولید گزارش P&L</p>
            </div>
          </button>
          <button 
            onClick={() => handleExport('مانده اشخاص')}
            className="premium-card p-4 flex items-center space-x-3 space-x-reverse hover:shadow-glow transition-all duration-300"
          >
            <Clock className="w-8 h-8 text-green-600" />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">گزارش مانده اشخاص</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">تحلیل مطالبات و بدهی‌ها</p>
            </div>
          </button>
          <button 
            onClick={() => handleExport('روندها')}
            className="premium-card p-4 flex items-center space-x-3 space-x-reverse hover:shadow-glow transition-all duration-300"
          >
            <LineChart className="w-8 h-8 text-purple-600" />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">گزارش روندها</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">تحلیل روندهای مالی</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
