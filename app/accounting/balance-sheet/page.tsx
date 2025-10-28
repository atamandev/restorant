'use client'

import { useState } from 'react'
import { 
  BarChart3, 
  Search, 
  Filter, 
  Calendar, 
  Download, 
  Printer, 
  Eye, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Building, 
  CreditCard, 
  Banknote, 
  FileText, 
  Package, 
  Users, 
  Calculator,
  PieChart,
  Activity,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

interface BalanceSheetItem {
  id: string
  category: string
  subcategory: string
  name: string
  amount: number
  type: 'asset' | 'liability' | 'equity'
  description: string
  lastUpdated: string
}

const mockBalanceSheetData: BalanceSheetItem[] = [
  // Assets
  {
    id: '1',
    category: 'دارایی‌های جاری',
    subcategory: 'نقد و بانک',
    name: 'صندوق نقدی',
    amount: 1500000,
    type: 'asset',
    description: 'موجودی نقدی در صندوق‌ها',
    lastUpdated: '1402/10/20'
  },
  {
    id: '2',
    category: 'دارایی‌های جاری',
    subcategory: 'نقد و بانک',
    name: 'حساب بانکی',
    amount: 5000000,
    type: 'asset',
    description: 'موجودی حساب بانکی',
    lastUpdated: '1402/10/20'
  },
  {
    id: '3',
    category: 'دارایی‌های جاری',
    subcategory: 'حساب‌های دریافتنی',
    name: 'بدهی مشتریان',
    amount: 800000,
    type: 'asset',
    description: 'مبالغ قابل دریافت از مشتریان',
    lastUpdated: '1402/10/20'
  },
  {
    id: '4',
    category: 'دارایی‌های جاری',
    subcategory: 'موجودی',
    name: 'موجودی مواد اولیه',
    amount: 2000000,
    type: 'asset',
    description: 'ارزش موجودی مواد اولیه',
    lastUpdated: '1402/10/20'
  },
  {
    id: '5',
    category: 'دارایی‌های ثابت',
    subcategory: 'تجهیزات',
    name: 'تجهیزات آشپزخانه',
    amount: 15000000,
    type: 'asset',
    description: 'ارزش تجهیزات آشپزخانه',
    lastUpdated: '1402/10/20'
  },
  {
    id: '6',
    category: 'دارایی‌های ثابت',
    subcategory: 'تجهیزات',
    name: 'مبلمان و دکوراسیون',
    amount: 8000000,
    type: 'asset',
    description: 'ارزش مبلمان و دکوراسیون',
    lastUpdated: '1402/10/20'
  },
  // Liabilities
  {
    id: '7',
    category: 'بدهی‌های جاری',
    subcategory: 'حساب‌های پرداختنی',
    name: 'بدهی به تامین‌کنندگان',
    amount: 1200000,
    type: 'liability',
    description: 'مبالغ قابل پرداخت به تامین‌کنندگان',
    lastUpdated: '1402/10/20'
  },
  {
    id: '8',
    category: 'بدهی‌های جاری',
    subcategory: 'تعهدات',
    name: 'اجاره پرداختنی',
    amount: 2000000,
    type: 'liability',
    description: 'اجاره ماهانه پرداختنی',
    lastUpdated: '1402/10/20'
  },
  {
    id: '9',
    category: 'بدهی‌های جاری',
    subcategory: 'مالیات',
    name: 'مالیات پرداختنی',
    amount: 500000,
    type: 'liability',
    description: 'مالیات قابل پرداخت',
    lastUpdated: '1402/10/20'
  },
  // Equity
  {
    id: '10',
    category: 'سرمایه',
    subcategory: 'سرمایه اولیه',
    name: 'سرمایه اولیه',
    amount: 20000000,
    type: 'equity',
    description: 'سرمایه اولیه رستوران',
    lastUpdated: '1402/10/20'
  },
  {
    id: '11',
    category: 'سرمایه',
    subcategory: 'سود انباشته',
    name: 'سود انباشته',
    amount: 5000000,
    type: 'equity',
    description: 'سود انباشته از فعالیت‌ها',
    lastUpdated: '1402/10/20'
  }
]

export default function BalanceSheetPage() {
  const [balanceSheetData, setBalanceSheetData] = useState<BalanceSheetItem[]>(mockBalanceSheetData)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [selectedItem, setSelectedItem] = useState<BalanceSheetItem | null>(null)

  const filteredData = balanceSheetData.filter(item =>
    (filterType === 'all' || item.type === filterType) &&
    (filterCategory === 'all' || item.category === filterCategory) &&
    (item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const getTotalAssets = () => balanceSheetData.filter(item => item.type === 'asset').reduce((sum, item) => sum + item.amount, 0)
  const getTotalLiabilities = () => balanceSheetData.filter(item => item.type === 'liability').reduce((sum, item) => sum + item.amount, 0)
  const getTotalEquity = () => balanceSheetData.filter(item => item.type === 'equity').reduce((sum, item) => sum + item.amount, 0)
  const getNetWorth = () => getTotalAssets() - getTotalLiabilities()

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'asset': return <TrendingUp className="w-4 h-4 text-green-600" />
      case 'liability': return <TrendingDown className="w-4 h-4 text-red-600" />
      case 'equity': return <DollarSign className="w-4 h-4 text-blue-600" />
      default: return null
    }
  }

  const getTypeText = (type: string) => {
    switch (type) {
      case 'asset': return 'دارایی'
      case 'liability': return 'بدهی'
      case 'equity': return 'سرمایه'
      default: return 'نامشخص'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'asset': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
      case 'liability': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
      case 'equity': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
    }
  }

  const getCategoryIcon = (category: string) => {
    if (category.includes('نقد')) return <Banknote className="w-4 h-4 text-green-600" />
    if (category.includes('بانک')) return <Building className="w-4 h-4 text-blue-600" />
    if (category.includes('موجودی')) return <Package className="w-4 h-4 text-purple-600" />
    if (category.includes('تجهیزات')) return <Calculator className="w-4 h-4 text-orange-600" />
    if (category.includes('مشتریان')) return <Users className="w-4 h-4 text-indigo-600" />
    if (category.includes('تامین‌کنندگان')) return <FileText className="w-4 h-4 text-red-600" />
    if (category.includes('مالیات')) return <AlertCircle className="w-4 h-4 text-yellow-600" />
    if (category.includes('سرمایه')) return <DollarSign className="w-4 h-4 text-green-600" />
    return <BarChart3 className="w-4 h-4 text-gray-600" />
  }

  const getAssetsByCategory = () => {
    const categories = [...new Set(balanceSheetData.filter(item => item.type === 'asset').map(item => item.category))]
    return categories.map(category => {
      const items = balanceSheetData.filter(item => item.type === 'asset' && item.category === category)
      const total = items.reduce((sum, item) => sum + item.amount, 0)
      return { category, items, total }
    })
  }

  const getLiabilitiesByCategory = () => {
    const categories = [...new Set(balanceSheetData.filter(item => item.type === 'liability').map(item => item.category))]
    return categories.map(category => {
      const items = balanceSheetData.filter(item => item.type === 'liability' && item.category === category)
      const total = items.reduce((sum, item) => sum + item.amount, 0)
      return { category, items, total }
    })
  }

  const getEquityByCategory = () => {
    const categories = [...new Set(balanceSheetData.filter(item => item.type === 'equity').map(item => item.category))]
    return categories.map(category => {
      const items = balanceSheetData.filter(item => item.type === 'equity' && item.category === category)
      const total = items.reduce((sum, item) => sum + item.amount, 0)
      return { category, items, total }
    })
  }

  const isBalanced = () => {
    return Math.abs(getTotalAssets() - (getTotalLiabilities() + getTotalEquity())) < 1000
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/80 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold gradient-text mb-2">ترازنامه</h1>
          <p className="text-gray-600 dark:text-gray-300">گزارش وضعیت مالی رستوران</p>
        </div>

        {/* Balance Check */}
        <div className="mb-8">
          <div className={`premium-card p-6 ${isBalanced() ? 'border-green-200 dark:border-green-800' : 'border-red-200 dark:border-red-800'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 space-x-reverse">
                {isBalanced() ? (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-red-600" />
                )}
                <div>
                  <h3 className={`text-lg font-semibold ${isBalanced() ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                    {isBalanced() ? 'ترازنامه متعادل است' : 'ترازنامه نامتعادل است'}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    دارایی‌ها: {getTotalAssets().toLocaleString('fa-IR')} تومان | 
                    بدهی‌ها + سرمایه: {(getTotalLiabilities() + getTotalEquity()).toLocaleString('fa-IR')} تومان
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-2xl font-bold ${isBalanced() ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {Math.abs(getTotalAssets() - (getTotalLiabilities() + getTotalEquity())).toLocaleString('fa-IR')} تومان
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">تفاوت</p>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="premium-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">کل دارایی‌ها</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{getTotalAssets().toLocaleString('fa-IR')}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
          <div className="premium-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">کل بدهی‌ها</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{getTotalLiabilities().toLocaleString('fa-IR')}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </div>
          <div className="premium-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">خالص دارایی‌ها</p>
                <p className={`text-2xl font-bold ${getNetWorth() >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {getNetWorth().toLocaleString('fa-IR')}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="premium-card p-6 mb-8">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="جستجو در ترازنامه..."
                  className="w-64 pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">همه انواع</option>
                <option value="asset">دارایی</option>
                <option value="liability">بدهی</option>
                <option value="equity">سرمایه</option>
              </select>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">همه دسته‌ها</option>
                {[...new Set(balanceSheetData.map(item => item.category))].map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <button className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                <Download className="w-4 h-4" />
                <span>صادر کردن</span>
              </button>
              <button className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                <Printer className="w-4 h-4" />
                <span>چاپ ترازنامه</span>
              </button>
            </div>
          </div>
        </div>

        {/* Balance Sheet Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Assets */}
          <div className="premium-card p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2 space-x-reverse">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <span>دارایی‌ها</span>
            </h3>
            <div className="space-y-4">
              {getAssetsByCategory().map(category => (
                <div key={category.category} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">{category.category}</h4>
                  <div className="space-y-2">
                    {category.items.map(item => (
                      <div key={item.id} className="flex justify-between items-center text-sm">
                        <span className="text-gray-700 dark:text-gray-300">{item.name}</span>
                        <span className="font-medium text-gray-900 dark:text-white">{item.amount.toLocaleString('fa-IR')}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-gray-200 dark:border-gray-600 pt-2 mt-2">
                    <div className="flex justify-between items-center font-medium">
                      <span className="text-gray-900 dark:text-white">جمع {category.category}</span>
                      <span className="text-gray-900 dark:text-white">{category.total.toLocaleString('fa-IR')}</span>
                    </div>
                  </div>
                </div>
              ))}
              <div className="border-t-2 border-green-200 dark:border-green-800 pt-4">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span className="text-green-700 dark:text-green-300">کل دارایی‌ها</span>
                  <span className="text-green-700 dark:text-green-300">{getTotalAssets().toLocaleString('fa-IR')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Liabilities */}
          <div className="premium-card p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2 space-x-reverse">
              <TrendingDown className="w-5 h-5 text-red-600" />
              <span>بدهی‌ها</span>
            </h3>
            <div className="space-y-4">
              {getLiabilitiesByCategory().map(category => (
                <div key={category.category} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">{category.category}</h4>
                  <div className="space-y-2">
                    {category.items.map(item => (
                      <div key={item.id} className="flex justify-between items-center text-sm">
                        <span className="text-gray-700 dark:text-gray-300">{item.name}</span>
                        <span className="font-medium text-gray-900 dark:text-white">{item.amount.toLocaleString('fa-IR')}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-gray-200 dark:border-gray-600 pt-2 mt-2">
                    <div className="flex justify-between items-center font-medium">
                      <span className="text-gray-900 dark:text-white">جمع {category.category}</span>
                      <span className="text-gray-900 dark:text-white">{category.total.toLocaleString('fa-IR')}</span>
                    </div>
                  </div>
                </div>
              ))}
              <div className="border-t-2 border-red-200 dark:border-red-800 pt-4">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span className="text-red-700 dark:text-red-300">کل بدهی‌ها</span>
                  <span className="text-red-700 dark:text-red-300">{getTotalLiabilities().toLocaleString('fa-IR')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Equity */}
          <div className="premium-card p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2 space-x-reverse">
              <DollarSign className="w-5 h-5 text-blue-600" />
              <span>سرمایه</span>
            </h3>
            <div className="space-y-4">
              {getEquityByCategory().map(category => (
                <div key={category.category} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">{category.category}</h4>
                  <div className="space-y-2">
                    {category.items.map(item => (
                      <div key={item.id} className="flex justify-between items-center text-sm">
                        <span className="text-gray-700 dark:text-gray-300">{item.name}</span>
                        <span className="font-medium text-gray-900 dark:text-white">{item.amount.toLocaleString('fa-IR')}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-gray-200 dark:border-gray-600 pt-2 mt-2">
                    <div className="flex justify-between items-center font-medium">
                      <span className="text-gray-900 dark:text-white">جمع {category.category}</span>
                      <span className="text-gray-900 dark:text-white">{category.total.toLocaleString('fa-IR')}</span>
                    </div>
                  </div>
                </div>
              ))}
              <div className="border-t-2 border-blue-200 dark:border-blue-800 pt-4">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span className="text-blue-700 dark:text-blue-300">کل سرمایه</span>
                  <span className="text-blue-700 dark:text-blue-300">{getTotalEquity().toLocaleString('fa-IR')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed List */}
        <div className="premium-card p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">لیست تفصیلی ترازنامه</h2>
          
          {filteredData.length === 0 ? (
            <div className="text-center py-12">
              <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">هیچ آیتمی یافت نشد</h3>
              <p className="text-gray-600 dark:text-gray-400">آیتم‌های ترازنامه در اینجا نمایش داده می‌شوند</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead>
                  <tr className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-800/50">
                    <th className="px-4 py-3 rounded-r-lg">نوع</th>
                    <th className="px-4 py-3">دسته‌بندی</th>
                    <th className="px-4 py-3">زیردسته</th>
                    <th className="px-4 py-3">نام آیتم</th>
                    <th className="px-4 py-3">مبلغ</th>
                    <th className="px-4 py-3">آخرین بروزرسانی</th>
                    <th className="px-4 py-3 rounded-l-lg">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredData.map(item => (
                    <tr key={item.id} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          {getTypeIcon(item.type)}
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(item.type)}`}>
                            {getTypeText(item.type)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{item.category}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{item.subcategory}</td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-gray-900 dark:text-white font-medium">{item.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{item.description}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">
                        {item.amount.toLocaleString('fa-IR')} تومان
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{item.lastUpdated}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setSelectedItem(item)}
                          className="p-2 rounded-full text-primary-600 hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Item Details Modal */}
        {selectedItem && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  جزئیات آیتم ترازنامه
                </h3>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">نوع</label>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      {getTypeIcon(selectedItem.type)}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(selectedItem.type)}`}>
                        {getTypeText(selectedItem.type)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">مبلغ</label>
                    <p className="text-gray-900 dark:text-white font-bold">{selectedItem.amount.toLocaleString('fa-IR')} تومان</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">دسته‌بندی</label>
                    <p className="text-gray-900 dark:text-white">{selectedItem.category}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">زیردسته</label>
                    <p className="text-gray-900 dark:text-white">{selectedItem.subcategory}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">نام آیتم</label>
                    <p className="text-gray-900 dark:text-white">{selectedItem.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">آخرین بروزرسانی</label>
                    <p className="text-gray-900 dark:text-white">{selectedItem.lastUpdated}</p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">توضیحات</label>
                  <p className="text-gray-900 dark:text-white p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    {selectedItem.description}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
