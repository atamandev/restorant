'use client'

import { useState } from 'react'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Search, 
  Filter, 
  Calendar, 
  Download, 
  Printer, 
  Eye, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Banknote, 
  CreditCard, 
  Building, 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  BarChart3,
  PieChart,
  Activity,
  X
} from 'lucide-react'

interface CashFlowEntry {
  id: string
  date: string
  type: 'receipt' | 'payment'
  category: string
  description: string
  amount: number
  method: 'cash' | 'card' | 'bank_transfer' | 'credit' | 'check'
  balance: number
  reference: string
  personName: string
}

const mockCashFlowData: CashFlowEntry[] = [
  {
    id: '1',
    date: '1402/10/20',
    type: 'receipt',
    category: 'فروش',
    description: 'فروش غذا - میز 2',
    amount: 500000,
    method: 'cash',
    balance: 1500000,
    reference: 'INV-001',
    personName: 'احمد محمدی'
  },
  {
    id: '2',
    date: '1402/10/20',
    type: 'payment',
    category: 'خرید',
    description: 'خرید مواد اولیه',
    amount: 250000,
    method: 'bank_transfer',
    balance: 1250000,
    reference: 'PUR-001',
    personName: 'تامین‌کننده مواد غذایی'
  },
  {
    id: '3',
    date: '1402/10/20',
    type: 'receipt',
    category: 'پیش‌دریافت',
    description: 'پیش‌دریافت سفارش',
    amount: 100000,
    method: 'card',
    balance: 1350000,
    reference: 'ADV-001',
    personName: 'سارا کریمی'
  },
  {
    id: '4',
    date: '1402/10/19',
    type: 'payment',
    category: 'هزینه',
    description: 'پرداخت اجاره',
    amount: 2000000,
    method: 'bank_transfer',
    balance: 1150000,
    reference: 'EXP-001',
    personName: 'مالک ساختمان'
  },
  {
    id: '5',
    date: '1402/10/19',
    type: 'receipt',
    category: 'فروش',
    description: 'فروش غذا - بیرون‌بر',
    amount: 180000,
    method: 'cash',
    balance: 1350000,
    reference: 'INV-002',
    personName: 'مریم نوری'
  },
  {
    id: '6',
    date: '1402/10/18',
    type: 'payment',
    category: 'خرید',
    description: 'خرید نوشیدنی',
    amount: 150000,
    method: 'check',
    balance: 1170000,
    reference: 'PUR-002',
    personName: 'تامین‌کننده نوشیدنی'
  }
]

export default function CashFlowPage() {
  const [cashFlowData, setCashFlowData] = useState<CashFlowEntry[]>(mockCashFlowData)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterMethod, setFilterMethod] = useState('all')
  const [filterDateRange, setFilterDateRange] = useState('week')
  const [selectedEntry, setSelectedEntry] = useState<CashFlowEntry | null>(null)

  const filteredData = cashFlowData.filter(entry =>
    (filterType === 'all' || entry.type === filterType) &&
    (filterMethod === 'all' || entry.method === filterMethod) &&
    (entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.personName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.reference.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const getTotalReceipts = () => filteredData.filter(entry => entry.type === 'receipt').reduce((sum, entry) => sum + entry.amount, 0)
  const getTotalPayments = () => filteredData.filter(entry => entry.type === 'payment').reduce((sum, entry) => sum + entry.amount, 0)
  const getNetCashFlow = () => getTotalReceipts() - getTotalPayments()
  const getCurrentBalance = () => filteredData.length > 0 ? filteredData[filteredData.length - 1].balance : 0

  // Export to CSV function
  const exportToCSV = () => {
    const headers = ['تاریخ', 'نوع', 'دسته‌بندی', 'توضیحات', 'مبلغ', 'روش پرداخت', 'مرجع', 'موجودی']
    const csvContent = [
      headers.join(','),
      ...filteredData.map(entry => [
        entry.date,
        getTypeText(entry.type),
        entry.category,
        entry.description,
        entry.amount,
        getMethodText(entry.method),
        entry.reference,
        entry.balance
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `cash-flow-report-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Print report function
  const printReport = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const printContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="fa">
      <head>
        <meta charset="UTF-8">
        <title>گزارش جریان نقدی</title>
        <style>
          body { font-family: 'Tahoma', sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .header h1 { color: #333; margin-bottom: 10px; }
          .header p { color: #666; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
          th { background-color: #f5f5f5; font-weight: bold; }
          .summary { background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
          .summary h3 { margin-top: 0; }
          .receipt { color: green; }
          .payment { color: red; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>گزارش جریان نقدی</h1>
          <p>تاریخ تولید: ${new Date().toLocaleDateString('fa-IR')}</p>
          <p>تعداد تراکنش‌ها: ${filteredData.length}</p>
        </div>
        
        <div class="summary">
          <h3>خلاصه گزارش</h3>
          <p>کل دریافت‌ها: <span class="receipt">${getTotalReceipts().toLocaleString('fa-IR')} تومان</span></p>
          <p>کل پرداخت‌ها: <span class="payment">${getTotalPayments().toLocaleString('fa-IR')} تومان</span></p>
          <p>جریان نقدی خالص: <strong>${getNetCashFlow().toLocaleString('fa-IR')} تومان</strong></p>
          <p>موجودی فعلی: <strong>${getCurrentBalance().toLocaleString('fa-IR')} تومان</strong></p>
        </div>

        <table>
          <thead>
            <tr>
              <th>تاریخ</th>
              <th>نوع</th>
              <th>دسته‌بندی</th>
              <th>توضیحات</th>
              <th>مبلغ</th>
              <th>روش پرداخت</th>
              <th>مرجع</th>
              <th>موجودی</th>
            </tr>
          </thead>
          <tbody>
            ${filteredData.map(entry => `
              <tr>
                <td>${entry.date}</td>
                <td class="${entry.type === 'receipt' ? 'receipt' : 'payment'}">${getTypeText(entry.type)}</td>
                <td>${entry.category}</td>
                <td>${entry.description}</td>
                <td>${entry.amount.toLocaleString('fa-IR')}</td>
                <td>${getMethodText(entry.method)}</td>
                <td>${entry.reference}</td>
                <td>${entry.balance.toLocaleString('fa-IR')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `

    printWindow.document.write(printContent)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
    printWindow.close()
  }

  const getTypeIcon = (type: string) => {
    return type === 'receipt' ? 
      <ArrowUpRight className="w-4 h-4 text-green-600" /> : 
      <ArrowDownLeft className="w-4 h-4 text-red-600" />
  }

  const getTypeText = (type: string) => {
    return type === 'receipt' ? 'دریافت' : 'پرداخت'
  }

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'cash': return <Banknote className="w-4 h-4 text-green-600" />
      case 'card': return <CreditCard className="w-4 h-4 text-blue-600" />
      case 'bank_transfer': return <Building className="w-4 h-4 text-purple-600" />
      case 'credit': return <DollarSign className="w-4 h-4 text-orange-600" />
      case 'check': return <FileText className="w-4 h-4 text-yellow-600" />
      default: return null
    }
  }

  const getMethodText = (method: string) => {
    switch (method) {
      case 'cash': return 'نقد'
      case 'card': return 'کارت'
      case 'bank_transfer': return 'حواله بانکی'
      case 'credit': return 'نسیه'
      case 'check': return 'چک'
      default: return 'نامشخص'
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'فروش': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
      case 'خرید': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
      case 'هزینه': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
      case 'پیش‌دریافت': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
    }
  }

  const getCashFlowByMethod = () => {
    const methods = ['cash', 'card', 'bank_transfer', 'credit', 'check']
    return methods.map(method => {
      const receipts = filteredData.filter(entry => entry.type === 'receipt' && entry.method === method).reduce((sum, entry) => sum + entry.amount, 0)
      const payments = filteredData.filter(entry => entry.type === 'payment' && entry.method === method).reduce((sum, entry) => sum + entry.amount, 0)
      return {
        method,
        methodText: getMethodText(method),
        receipts,
        payments,
        net: receipts - payments
      }
    })
  }

  const getCashFlowByCategory = () => {
    const categories = ['فروش', 'خرید', 'هزینه', 'پیش‌دریافت']
    return categories.map(category => {
      const receipts = filteredData.filter(entry => entry.type === 'receipt' && entry.category === category).reduce((sum, entry) => sum + entry.amount, 0)
      const payments = filteredData.filter(entry => entry.type === 'payment' && entry.category === category).reduce((sum, entry) => sum + entry.amount, 0)
      return {
        category,
        receipts,
        payments,
        net: receipts - payments
      }
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/80 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold gradient-text mb-2">گردش نقدی</h1>
          <p className="text-gray-600 dark:text-gray-300">تحلیل و گزارش گردش نقدی رستوران</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="premium-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">کل دریافت‌ها</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{getTotalReceipts().toLocaleString('fa-IR')}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
          <div className="premium-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">کل پرداخت‌ها</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{getTotalPayments().toLocaleString('fa-IR')}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </div>
          <div className="premium-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">گردش نقدی خالص</p>
                <p className={`text-2xl font-bold ${getNetCashFlow() >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {getNetCashFlow().toLocaleString('fa-IR')}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
          <div className="premium-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">موجودی فعلی</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{getCurrentBalance().toLocaleString('fa-IR')}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-purple-600 dark:text-purple-400" />
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
                  placeholder="جستجو در گردش نقدی..."
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
                <option value="receipt">دریافت</option>
                <option value="payment">پرداخت</option>
              </select>
              <select
                value={filterMethod}
                onChange={(e) => setFilterMethod(e.target.value)}
                className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">همه روش‌ها</option>
                <option value="cash">نقد</option>
                <option value="card">کارت</option>
                <option value="bank_transfer">حواله بانکی</option>
                <option value="credit">نسیه</option>
                <option value="check">چک</option>
              </select>
              <select
                value={filterDateRange}
                onChange={(e) => setFilterDateRange(e.target.value)}
                className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="today">امروز</option>
                <option value="week">این هفته</option>
                <option value="month">این ماه</option>
                <option value="quarter">این فصل</option>
                <option value="year">امسال</option>
                <option value="all">همه زمان‌ها</option>
              </select>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <button 
                onClick={exportToCSV}
                className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>صادر کردن</span>
              </button>
              <button 
                onClick={printReport}
                className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Printer className="w-4 h-4" />
                <span>چاپ گزارش</span>
              </button>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Cash Flow by Method */}
          <div className="premium-card p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2 space-x-reverse">
              <BarChart3 className="w-5 h-5 text-primary-600" />
              <span>گردش نقدی بر اساس روش پرداخت</span>
            </h3>
            <div className="space-y-3">
              {getCashFlowByMethod().map(method => (
                <div key={method.method} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    {getMethodIcon(method.method)}
                    <span className="text-gray-900 dark:text-white font-medium">{method.methodText}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      دریافت: {method.receipts.toLocaleString('fa-IR')} تومان
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      پرداخت: {method.payments.toLocaleString('fa-IR')} تومان
                    </p>
                    <p className={`text-sm font-medium ${method.net >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      خالص: {method.net.toLocaleString('fa-IR')} تومان
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cash Flow by Category */}
          <div className="premium-card p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2 space-x-reverse">
              <PieChart className="w-5 h-5 text-primary-600" />
              <span>گردش نقدی بر اساس دسته‌بندی</span>
            </h3>
            <div className="space-y-3">
              {getCashFlowByCategory().map(category => (
                <div key={category.category} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(category.category)}`}>
                      {category.category}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      دریافت: {category.receipts.toLocaleString('fa-IR')} تومان
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      پرداخت: {category.payments.toLocaleString('fa-IR')} تومان
                    </p>
                    <p className={`text-sm font-medium ${category.net >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      خالص: {category.net.toLocaleString('fa-IR')} تومان
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Cash Flow Entries */}
        <div className="premium-card p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">لیست گردش نقدی</h2>
          
          {filteredData.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">هیچ تراکنشی یافت نشد</h3>
              <p className="text-gray-600 dark:text-gray-400">گردش نقدی رستوران در اینجا نمایش داده می‌شود</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead>
                  <tr className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-800/50">
                    <th className="px-4 py-3 rounded-r-lg">تاریخ</th>
                    <th className="px-4 py-3">نوع</th>
                    <th className="px-4 py-3">دسته‌بندی</th>
                    <th className="px-4 py-3">توضیحات</th>
                    <th className="px-4 py-3">مبلغ</th>
                    <th className="px-4 py-3">روش پرداخت</th>
                    <th className="px-4 py-3">مرجع</th>
                    <th className="px-4 py-3">موجودی</th>
                    <th className="px-4 py-3 rounded-l-lg">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredData.map(entry => (
                    <tr key={entry.id} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{entry.date}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          {getTypeIcon(entry.type)}
                          <span className={`font-medium ${
                            entry.type === 'receipt' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                          }`}>
                            {getTypeText(entry.type)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(entry.category)}`}>
                          {entry.category}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-gray-900 dark:text-white font-medium">{entry.description}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{entry.personName}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">
                        {entry.amount.toLocaleString('fa-IR')} تومان
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          {getMethodIcon(entry.method)}
                          <span className="text-gray-700 dark:text-gray-200">
                            {getMethodText(entry.method)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{entry.reference}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200">
                        {entry.balance.toLocaleString('fa-IR')} تومان
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setSelectedEntry(entry)}
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

        {/* Entry Details Modal */}
        {selectedEntry && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  جزئیات تراکنش
                </h3>
                <button
                  onClick={() => setSelectedEntry(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">تاریخ</label>
                    <p className="text-gray-900 dark:text-white">{selectedEntry.date}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">نوع تراکنش</label>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      {getTypeIcon(selectedEntry.type)}
                      <span className={`font-medium ${
                        selectedEntry.type === 'receipt' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {getTypeText(selectedEntry.type)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">دسته‌بندی</label>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(selectedEntry.category)}`}>
                      {selectedEntry.category}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">روش پرداخت</label>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      {getMethodIcon(selectedEntry.method)}
                      <span className="text-gray-900 dark:text-white">{getMethodText(selectedEntry.method)}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">مبلغ</label>
                    <p className="text-gray-900 dark:text-white font-bold">{selectedEntry.amount.toLocaleString('fa-IR')} تومان</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">موجودی</label>
                    <p className="text-gray-900 dark:text-white">{selectedEntry.balance.toLocaleString('fa-IR')} تومان</p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">توضیحات</label>
                  <p className="text-gray-900 dark:text-white">{selectedEntry.description}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">شخص</label>
                  <p className="text-gray-900 dark:text-white">{selectedEntry.personName}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">مرجع</label>
                  <p className="text-gray-900 dark:text-white">{selectedEntry.reference}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
