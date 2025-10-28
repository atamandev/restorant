'use client'

import { useState } from 'react'
import { 
  ShoppingCart, 
  Utensils, 
  CreditCard, 
  FileText,
  Clock,
  DollarSign,
  Users,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Zap,
  BarChart3
} from 'lucide-react'

interface OperationItem {
  id: string
  title: string
  description: string
  icon: React.ComponentType<any>
  shortcut: string
  color: string
  status: 'active' | 'inactive'
  stats?: {
    today: number
    yesterday: number
    change: number
  }
}

const operationItems: OperationItem[] = [
  {
    id: 'quick-sale',
    title: 'فاکتور فروش سریع',
    description: 'ثبت سریع فروش بدون انتخاب میز',
    icon: ShoppingCart,
    shortcut: 'Ctrl + S',
    color: 'green',
    status: 'active',
    stats: {
      today: 45,
      yesterday: 38,
      change: 18.4
    }
  },
  {
    id: 'table-order',
    title: 'ثبت سفارش میز',
    description: 'ثبت سفارش برای میزهای مشخص',
    icon: Utensils,
    shortcut: 'Ctrl + T',
    color: 'blue',
    status: 'active',
    stats: {
      today: 23,
      yesterday: 19,
      change: 21.1
    }
  },
  {
    id: 'close-cashier',
    title: 'بستن صندوق',
    description: 'بستن صندوق و تهیه گزارش روزانه',
    icon: CreditCard,
    shortcut: 'Ctrl + C',
    color: 'purple',
    status: 'inactive',
    stats: {
      today: 1,
      yesterday: 1,
      change: 0
    }
  },
  {
    id: 'daily-report',
    title: 'گزارش روزانه',
    description: 'مشاهده گزارش فروش و عملکرد روزانه',
    icon: FileText,
    shortcut: 'Ctrl + R',
    color: 'orange',
    status: 'active',
    stats: {
      today: 3,
      yesterday: 2,
      change: 50
    }
  }
]

export default function OperationsPage() {
  const [selectedOperation, setSelectedOperation] = useState<string | null>(null)

  const getColorClasses = (color: string) => {
    const colors = {
      green: 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700',
      blue: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700',
      purple: 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700',
      orange: 'bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-700'
    }
    return colors[color as keyof typeof colors] || colors.green
  }

  const getIconColorClasses = (color: string) => {
    const colors = {
      green: 'text-green-600 dark:text-green-400',
      blue: 'text-blue-600 dark:text-blue-400',
      purple: 'text-purple-600 dark:text-purple-400',
      orange: 'text-orange-600 dark:text-orange-400'
    }
    return colors[color as keyof typeof colors] || colors.green
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/80 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold gradient-text mb-2">منو عملیات</h1>
          <p className="text-gray-600 dark:text-gray-300">شورتکات‌های عملیاتی پرتکرار برای سرعت در شیفت‌های شلوغ</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="premium-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">فروش امروز</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">68</p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="flex items-center space-x-1 space-x-reverse mt-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-sm text-green-600 dark:text-green-400">+12.5%</span>
            </div>
          </div>

          <div className="premium-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">میزهای فعال</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">12</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <Utensils className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="flex items-center space-x-1 space-x-reverse mt-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-sm text-green-600 dark:text-green-400">+8.3%</span>
            </div>
          </div>

          <div className="premium-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">درآمد امروز</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">2.4M</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <div className="flex items-center space-x-1 space-x-reverse mt-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-sm text-green-600 dark:text-green-400">+15.2%</span>
            </div>
          </div>

          <div className="premium-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">کاربران آنلاین</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">4</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
            <div className="flex items-center space-x-1 space-x-reverse mt-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-green-600 dark:text-green-400">فعال</span>
            </div>
          </div>
        </div>

        {/* Operations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {operationItems.map((operation) => (
            <div
              key={operation.id}
              className={`premium-card p-6 cursor-pointer transition-all duration-300 hover:shadow-glow hover:scale-105 ${
                selectedOperation === operation.id ? 'ring-2 ring-primary-500' : ''
              }`}
              onClick={() => setSelectedOperation(operation.id)}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getColorClasses(operation.color)}`}>
                  <operation.icon className={`w-6 h-6 ${getIconColorClasses(operation.color)}`} />
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  {operation.status === 'active' ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-yellow-500" />
                  )}
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                    {operation.shortcut}
                  </span>
                </div>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {operation.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                {operation.description}
              </p>

              {operation.stats && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-300">امروز:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {operation.stats.today}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-300">دیروز:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {operation.stats.yesterday}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-300">تغییر:</span>
                    <div className="flex items-center space-x-1 space-x-reverse">
                      <TrendingUp className="w-3 h-3 text-green-500" />
                      <span className="font-medium text-green-600 dark:text-green-400">
                        +{operation.stats.change}%
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <button className={`w-full mt-4 py-2 px-4 rounded-lg font-medium transition-all duration-300 ${
                operation.status === 'active'
                  ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 hover:bg-primary-200 dark:hover:bg-primary-900/50'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              }`}>
                {operation.status === 'active' ? 'شروع عملیات' : 'غیرفعال'}
              </button>
            </div>
          ))}
        </div>

        {/* Quick Actions Bar */}
        <div className="mt-8 premium-card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">عملیات سریع</h3>
          <div className="flex flex-wrap gap-3">
            <button className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors">
              <Zap className="w-4 h-4" />
              <span>فاکتور سریع</span>
            </button>
            <button className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors">
              <Utensils className="w-4 h-4" />
              <span>سفارش میز</span>
            </button>
            <button className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors">
              <CreditCard className="w-4 h-4" />
              <span>بستن صندوق</span>
            </button>
            <button className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-lg hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors">
              <BarChart3 className="w-4 h-4" />
              <span>گزارش روزانه</span>
            </button>
          </div>
        </div>

        {/* System Status */}
        <div className="mt-6 premium-card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">وضعیت سیستم</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3 space-x-reverse p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              <div>
                <p className="text-sm font-medium text-green-800 dark:text-green-200">صندوق فعال</p>
                <p className="text-xs text-green-600 dark:text-green-400">آماده برای فروش</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 space-x-reverse p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200">اتصال اینترنت</p>
                <p className="text-xs text-blue-600 dark:text-blue-400">پایدار</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 space-x-reverse p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              <div>
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">ساعت کاری</p>
                <p className="text-xs text-yellow-600 dark:text-yellow-400">تا 23:00</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
