'use client'

import React, { useState, useEffect, useCallback } from 'react'
import BarChart from '@/components/Charts/BarChart'
import LineChart from '@/components/Charts/LineChart'
import PieChart from '@/components/Charts/PieChart'
import {
  TrendingUp,
  TrendingDown,
  PieChart as PieChartIcon,
  BarChart3,
  LineChart as LineChartIcon,
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


export default function FinancialReportsPage() {
  const [activeTab, setActiveTab] = useState<'pnl' | 'aging' | 'trends'>('pnl')
  const [selectedPeriod, setSelectedPeriod] = useState('current_month')
  const [selectedBranch, setSelectedBranch] = useState('all')
  const [selectedChannel, setSelectedChannel] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [pnlData, setPnLData] = useState<PnLData[]>([])
  const [agingData, setAgingData] = useState<AgingData[]>([])
  const [trendData, setTrendData] = useState<TrendData[]>([])

  // بارگذاری گزارشات P&L
  const fetchPnLData = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.append('period', selectedPeriod)
      if (selectedBranch !== 'all') params.append('branch', selectedBranch)
      if (selectedChannel !== 'all') params.append('channel', selectedChannel)

      const response = await fetch(`/api/financial-reports/pnl?${params.toString()}`)
      const data = await response.json()
      if (data.success) {
        setPnLData(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching P&L data:', error)
    } finally {
      setLoading(false)
    }
  }, [selectedPeriod, selectedBranch, selectedChannel])

  // بارگذاری گزارشات Aging
  const fetchAgingData = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)

      const response = await fetch(`/api/financial-reports/aging?${params.toString()}`)
      const data = await response.json()
      if (data.success) {
        setAgingData(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching aging data:', error)
    } finally {
      setLoading(false)
    }
  }, [searchTerm])

  // بارگذاری گزارشات Trends
  const fetchTrendData = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/financial-reports/trends')
      const data = await response.json()
      if (data.success) {
        setTrendData(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching trends data:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // تولید گزارش جدید
  const handleGenerateReport = async (type: string) => {
    try {
      setLoading(true)
      let url = ''
      const params = new URLSearchParams()
      params.append('generate', 'true')

      if (type === 'pnl') {
        params.append('period', selectedPeriod)
        if (selectedBranch !== 'all') params.append('branch', selectedBranch)
        if (selectedChannel !== 'all') params.append('channel', selectedChannel)
        url = `/api/financial-reports/pnl?${params.toString()}`
      } else if (type === 'aging') {
        url = `/api/financial-reports/aging?${params.toString()}`
      } else if (type === 'trends') {
        url = `/api/financial-reports/trends?${params.toString()}`
      }

      const response = await fetch(url, { method: 'GET' })
      const data = await response.json()
      if (data.success) {
        // به‌روزرسانی داده‌ها
        if (type === 'pnl') {
          if (data.data && Array.isArray(data.data)) {
            setPnLData(data.data)
          } else {
            await fetchPnLData()
          }
        } else if (type === 'aging') {
          if (data.data && Array.isArray(data.data)) {
            setAgingData(data.data)
          } else {
            await fetchAgingData()
          }
        } else if (type === 'trends') {
          if (data.data && Array.isArray(data.data)) {
            setTrendData(data.data)
          } else {
            await fetchTrendData()
          }
        }
        alert('گزارش با موفقیت تولید شد')
      } else {
        alert('خطا: ' + data.message)
      }
    } catch (error) {
      console.error('Error generating report:', error)
      alert('خطا در تولید گزارش')
    } finally {
      setLoading(false)
    }
  }

  // اضافه کردن داده نمونه
  const handleAddSampleData = async () => {
    if (!confirm('آیا می‌خواهید داده‌های نمونه اضافه شوند؟')) {
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/add-sample-financial-reports', {
        method: 'POST'
      })
      const data = await response.json()
      if (data.success) {
        await fetchPnLData()
        await fetchAgingData()
        await fetchTrendData()
        alert('داده‌های نمونه با موفقیت اضافه شدند')
      } else {
        alert('خطا: ' + data.message)
      }
    } catch (error) {
      console.error('Error adding sample data:', error)
      alert('خطا در اضافه کردن داده‌های نمونه')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'pnl') {
      fetchPnLData()
    } else if (activeTab === 'aging') {
      fetchAgingData()
    } else if (activeTab === 'trends') {
      fetchTrendData()
    }
  }, [activeTab, fetchPnLData, fetchAgingData, fetchTrendData])

  const filteredAgingData = agingData.filter(customer =>
    searchTerm === '' || 
    customer.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalRevenue = pnlData.length > 0 ? pnlData[0].revenue : 0
  const totalExpenses = pnlData.length > 0 ? pnlData[0].costOfGoodsSold + pnlData[0].operatingExpenses : 0
  const totalProfit = pnlData.length > 0 ? pnlData[0].netProfit : 0
  const profitMargin = pnlData.length > 0 ? pnlData[0].netMargin : 0

  const totalReceivables = agingData.reduce((sum, customer) => sum + customer.totalBalance, 0)
  const overdueReceivables = agingData.reduce((sum, customer) => sum + customer.days90 + customer.over90, 0)
  const currentReceivables = agingData.reduce((sum, customer) => sum + customer.current, 0)

  const handleExport = (type: string) => {
    alert(`گزارش ${type} به صورت Excel صادر شد.`)
  }

  const handlePrint = () => {
    window.print()
  }

  const handleRefresh = () => {
    if (activeTab === 'pnl') {
      fetchPnLData()
    } else if (activeTab === 'aging') {
      fetchAgingData()
    } else if (activeTab === 'trends') {
      fetchTrendData()
    }
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
            onClick={handleAddSampleData}
            className="premium-button flex items-center space-x-2 space-x-reverse"
          >
            <Database className="w-5 h-5" />
            <span>داده نمونه</span>
          </button>
          <button
            onClick={handleRefresh}
            className="premium-button flex items-center space-x-2 space-x-reverse"
            disabled={loading}
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
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
        <div className="premium-card p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-l-4 border-green-500 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">کل درآمد</h3>
            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{totalRevenue.toLocaleString('fa-IR')}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">تومان</p>
        </div>

        <div className="premium-card p-6 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-l-4 border-red-500 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">کل هزینه‌ها</h3>
            <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{totalExpenses.toLocaleString('fa-IR')}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">تومان</p>
        </div>

        <div className="premium-card p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-l-4 border-blue-500 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">سود خالص</h3>
            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{totalProfit.toLocaleString('fa-IR')}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">تومان</p>
        </div>

        <div className="premium-card p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-l-4 border-purple-500 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">حاشیه سود</h3>
            <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
              <Percent className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{profitMargin.toFixed(1)}%</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">درصد</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="premium-card p-6">
        <div className="flex space-x-2 space-x-reverse bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl p-1.5 mb-6 shadow-inner">
          <button
            onClick={() => setActiveTab('pnl')}
            className={`flex-1 flex items-center justify-center space-x-2 space-x-reverse px-5 py-3 rounded-lg transition-all duration-300 font-semibold ${
              activeTab === 'pnl'
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/50 transform scale-105'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-700/50'
            }`}
          >
            <BarChart3 className={`w-5 h-5 ${activeTab === 'pnl' ? 'animate-pulse' : ''}`} />
            <span>سود و زیان</span>
          </button>
          <button
            onClick={() => setActiveTab('aging')}
            className={`flex-1 flex items-center justify-center space-x-2 space-x-reverse px-5 py-3 rounded-lg transition-all duration-300 font-semibold ${
              activeTab === 'aging'
                ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg shadow-green-500/50 transform scale-105'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-700/50'
            }`}
          >
            <Clock className={`w-5 h-5 ${activeTab === 'aging' ? 'animate-pulse' : ''}`} />
            <span>مانده اشخاص</span>
          </button>
          <button
            onClick={() => setActiveTab('trends')}
            className={`flex-1 flex items-center justify-center space-x-2 space-x-reverse px-5 py-3 rounded-lg transition-all duration-300 font-semibold ${
              activeTab === 'trends'
                ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/50 transform scale-105'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-700/50'
            }`}
          >
            <LineChart className={`w-5 h-5 ${activeTab === 'trends' ? 'animate-pulse' : ''}`} />
            <span>روندها</span>
          </button>
        </div>

        {/* Filters */}
        <div className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-700 rounded-xl p-4 mb-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2 space-x-reverse mb-4">
            <Filter className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">فیلترها</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">دوره زمانی</label>
              <select
                className="premium-input w-full"
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
              >
                <option value="current_month">ماه جاری</option>
                <option value="last_month">ماه گذشته</option>
                <option value="last_3_months">3 ماه گذشته</option>
                <option value="last_6_months">6 ماه گذشته</option>
                <option value="last_year">سال گذشته</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">شعبه</label>
              <select
                className="premium-input w-full"
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
              >
                <option value="all">همه شعبه‌ها</option>
                <option value="main">شعبه مرکزی</option>
                <option value="branch1">شعبه 1</option>
                <option value="branch2">شعبه 2</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">کانال</label>
              <select
                className="premium-input w-full"
                value={selectedChannel}
                onChange={(e) => setSelectedChannel(e.target.value)}
              >
                <option value="all">همه کانال‌ها</option>
                <option value="dine_in">حضوری</option>
                <option value="takeaway">بیرون‌بر</option>
                <option value="delivery">ارسال</option>
              </select>
            </div>
            {activeTab === 'aging' && (
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">جستجو</label>
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="جستجو مشتری..."
                    className="premium-input w-full pr-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
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
                  {loading ? (
                    <tr>
                      <td colSpan={12} className="px-4 py-8 text-center">
                        <RefreshCw className="w-6 h-6 animate-spin text-primary-600 mx-auto" />
                      </td>
                    </tr>
                  ) : pnlData.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="px-4 py-16">
                        <div className="flex flex-col items-center justify-center text-center">
                          <div className="w-20 h-20 mb-4 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 flex items-center justify-center">
                            <BarChart3 className="w-10 h-10 text-blue-500 dark:text-blue-400" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">هیچ داده‌ای یافت نشد</h3>
                          <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-md">
                            برای شروع، داده‌های نمونه اضافه کنید یا گزارش جدید تولید کنید.
                          </p>
                          <div className="flex items-center space-x-3 space-x-reverse">
                            <button
                              onClick={handleAddSampleData}
                              className="premium-button flex items-center space-x-2 space-x-reverse"
                            >
                              <Database className="w-4 h-4" />
                              <span>اضافه کردن داده نمونه</span>
                            </button>
                            <button
                              onClick={() => handleGenerateReport('pnl')}
                              className="premium-button flex items-center space-x-2 space-x-reverse"
                            >
                              <Zap className="w-4 h-4" />
                              <span>تولید گزارش</span>
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                  pnlData.map((data, index) => (
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
                  ))
                  )}
                </tbody>
              </table>
            </div>

            {/* P&L Chart */}
            {pnlData.length > 0 && (
              <div className="premium-card p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2 space-x-reverse">
                  <BarChart3 className="w-6 h-6 text-primary-600" />
                  <span>نمودار سود و زیان</span>
                </h2>
                <div className="h-80 w-full">
                  <BarChart 
                    data={pnlData.slice(0, 6)} 
                    categories={['revenue', 'costOfGoodsSold', 'grossProfit', 'netProfit']}
                    colors={['#10B981', '#EF4444', '#3B82F6', '#8B5CF6']}
                    height={320}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Aging Tab */}
        {activeTab === 'aging' && (
          <div className="space-y-6">
            {/* Aging Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="premium-card p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-l-4 border-blue-500 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">کل مطالبات</h3>
                  <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <Receipt className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{totalReceivables.toLocaleString('fa-IR')}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">تومان</p>
              </div>

              <div className="premium-card p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-l-4 border-green-500 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">مطالبات جاری</h3>
                  <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{currentReceivables.toLocaleString('fa-IR')}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">تومان</p>
              </div>

              <div className="premium-card p-6 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-l-4 border-red-500 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">مطالبات معوق</h3>
                  <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{overdueReceivables.toLocaleString('fa-IR')}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">تومان</p>
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
                  {loading ? (
                    <tr>
                      <td colSpan={10} className="px-4 py-8 text-center">
                        <RefreshCw className="w-6 h-6 animate-spin text-primary-600 mx-auto" />
                      </td>
                    </tr>
                  ) : filteredAgingData.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-4 py-16">
                        <div className="flex flex-col items-center justify-center text-center">
                          <div className="w-20 h-20 mb-4 rounded-full bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30 flex items-center justify-center">
                            <Clock className="w-10 h-10 text-green-500 dark:text-green-400" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">هیچ داده‌ای یافت نشد</h3>
                          <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-md">
                            {searchTerm ? 'نتیجه‌ای برای جستجوی شما یافت نشد.' : 'برای شروع، داده‌های نمونه اضافه کنید یا گزارش جدید تولید کنید.'}
                          </p>
                          {!searchTerm && (
                            <div className="flex items-center space-x-3 space-x-reverse">
                              <button
                                onClick={handleAddSampleData}
                                className="premium-button flex items-center space-x-2 space-x-reverse"
                              >
                                <Database className="w-4 h-4" />
                                <span>اضافه کردن داده نمونه</span>
                              </button>
                              <button
                                onClick={() => handleGenerateReport('aging')}
                                className="premium-button flex items-center space-x-2 space-x-reverse"
                              >
                                <Zap className="w-4 h-4" />
                                <span>تولید گزارش</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                  filteredAgingData.map((customer, index) => (
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
                  ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Trends Tab */}
        {activeTab === 'trends' && (
          <div className="space-y-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-8 h-8 animate-spin text-primary-600" />
              </div>
            ) : trendData.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-16">
                <div className="w-24 h-24 mb-6 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30 flex items-center justify-center">
                  <LineChart className="w-12 h-12 text-purple-500 dark:text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">هیچ داده‌ای یافت نشد</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
                  برای شروع، داده‌های نمونه اضافه کنید یا گزارش جدید تولید کنید.
                </p>
                <div className="flex items-center space-x-3 space-x-reverse">
                  <button
                    onClick={handleAddSampleData}
                    className="premium-button flex items-center space-x-2 space-x-reverse"
                  >
                    <Database className="w-4 h-4" />
                    <span>اضافه کردن داده نمونه</span>
                  </button>
                  <button
                    onClick={() => handleGenerateReport('trends')}
                    className="premium-button flex items-center space-x-2 space-x-reverse"
                  >
                    <Zap className="w-4 h-4" />
                    <span>تولید گزارش</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                {trendData.length > 0 ? (
                  <>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="premium-card p-6">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2 space-x-reverse">
                          <LineChartIcon className="w-6 h-6 text-primary-600" />
                          <span>روند درآمد و هزینه</span>
                        </h2>
                        <div className="h-64 w-full">
                          <LineChart 
                            data={trendData && trendData.length > 0 ? trendData.map(t => ({
                              month: t.month,
                              sales: t.revenue || 0,
                              profit: t.profit || 0
                            })) : []}
                          />
                        </div>
                      </div>

                      <div className="premium-card p-6">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2 space-x-reverse">
                          <PieChartIcon className="w-6 h-6 text-success-600" />
                          <span>توزیع هزینه‌ها</span>
                        </h2>
                        <div className="h-64 w-full">
                          <PieChart 
                            data={trendData && trendData.length > 0 ? [
                              { name: 'بهای تمام شده', value: trendData.reduce((sum, t) => sum + ((t.expenses || 0) * 0.65), 0), color: '#EF4444' },
                              { name: 'هزینه عملیاتی', value: trendData.reduce((sum, t) => sum + ((t.expenses || 0) * 0.35), 0), color: '#F59E0B' }
                            ] : []}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="premium-card p-6">
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2 space-x-reverse">
                        <TrendingUp className="w-6 h-6 text-accent-600" />
                        <span>روند حاشیه سود</span>
                      </h2>
                      <div className="h-64 w-full">
                        <LineChart 
                          data={trendData && trendData.length > 0 ? trendData.map(t => ({
                            month: t.month,
                            sales: (t.margin || 0) * 10000000, // تبدیل درصد به عدد برای نمایش
                            profit: 20 * 10000000 // خط مبنا
                          })) : []}
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    برای مشاهده نمودارها، ابتدا داده‌های نمونه اضافه کنید یا گزارش جدید تولید کنید.
                  </div>
                )}
              </>
            )}
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
            onClick={() => handleGenerateReport('pnl')}
            className="premium-card p-4 flex items-center space-x-3 space-x-reverse hover:shadow-glow transition-all duration-300"
            disabled={loading}
          >
            <BarChart3 className="w-8 h-8 text-blue-600" />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">گزارش سود و زیان</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">تولید گزارش P&L</p>
            </div>
          </button>
          <button 
            onClick={() => handleGenerateReport('aging')}
            className="premium-card p-4 flex items-center space-x-3 space-x-reverse hover:shadow-glow transition-all duration-300"
            disabled={loading}
          >
            <Clock className="w-8 h-8 text-green-600" />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">گزارش مانده اشخاص</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">تحلیل مطالبات و بدهی‌ها</p>
            </div>
          </button>
          <button 
            onClick={() => handleGenerateReport('trends')}
            className="premium-card p-4 flex items-center space-x-3 space-x-reverse hover:shadow-glow transition-all duration-300"
            disabled={loading}
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
