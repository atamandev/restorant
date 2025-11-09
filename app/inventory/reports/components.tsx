'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import {
  Package,
  Activity,
  TrendingDown,
  Bell,
  Clock,
  Eye,
  FileSpreadsheet,
  FileText,
  Loader
} from 'lucide-react'

// کامپوننت گزارش موجودی لحظه‌ای
export function OnHandReportTab({ data, loading, onExport }: { data: any[], loading: boolean, onExport: (format: string) => void }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">گزارش موجودی لحظه‌ای</h3>
        <div className="flex items-center space-x-2 space-x-reverse">
          <button
            onClick={() => onExport('excel')}
            className="premium-button flex items-center space-x-2 space-x-reverse"
          >
            <FileSpreadsheet className="w-5 h-5" />
            <span>خروجی Excel</span>
          </button>
          <button
            onClick={() => onExport('pdf')}
            className="premium-button flex items-center space-x-2 space-x-reverse"
          >
            <FileText className="w-5 h-5" />
            <span>خروجی PDF</span>
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-right whitespace-nowrap">
          <thead>
            <tr className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-800/50">
              <th className="px-4 py-3 rounded-r-lg">نام کالا</th>
              <th className="px-4 py-3">کد</th>
              <th className="px-4 py-3">دسته‌بندی</th>
              <th className="px-4 py-3">واحد</th>
              <th className="px-4 py-3">موجودی کل</th>
              <th className="px-4 py-3">ارزش کل</th>
              <th className="px-4 py-3">قیمت میانگین</th>
              <th className="px-4 py-3 rounded-l-lg">انبارها</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {data.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                  داده‌ای برای نمایش وجود ندارد
                </td>
              </tr>
            ) : (
              data.map((item: any, index: number) => (
                <tr key={index} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <td className="px-4 py-3 text-gray-900 dark:text-white">{item.itemName}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-200 font-mono">{item.itemCode}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{item.category}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{item.unit}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{item.totalQuantity.toLocaleString('fa-IR')}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{item.totalValue.toLocaleString('fa-IR')} تومان</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{item.averagePrice.toLocaleString('fa-IR')} تومان</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-200">
                    {item.warehouses.map((wh: any) => `${wh.warehouseName}: ${wh.quantity.toLocaleString('fa-IR')}`).join(', ')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// کامپوننت گزارش گردش کالا
export function MovementReportTab({ data, loading, onExport }: { data: any[], loading: boolean, onExport: (format: string) => void }) {
  const router = useRouter()
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">گزارش گردش کالا</h3>
        <div className="flex items-center space-x-2 space-x-reverse">
          <button
            onClick={() => onExport('excel')}
            className="premium-button flex items-center space-x-2 space-x-reverse"
          >
            <FileSpreadsheet className="w-5 h-5" />
            <span>خروجی Excel</span>
          </button>
          <button
            onClick={() => onExport('pdf')}
            className="premium-button flex items-center space-x-2 space-x-reverse"
          >
            <FileText className="w-5 h-5" />
            <span>خروجی PDF</span>
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-right whitespace-nowrap">
          <thead>
            <tr className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-800/50">
              <th className="px-4 py-3 rounded-r-lg">نام کالا</th>
              <th className="px-4 py-3">کد</th>
              <th className="px-4 py-3">دسته‌بندی</th>
              <th className="px-4 py-3">موجودی ابتدا</th>
              <th className="px-4 py-3">ورودی</th>
              <th className="px-4 py-3">خروجی</th>
              <th className="px-4 py-3">موجودی فعلی</th>
              <th className="px-4 py-3">گردش خالص</th>
              <th className="px-4 py-3 rounded-l-lg">عملیات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {data.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                  داده‌ای برای نمایش وجود ندارد
                </td>
              </tr>
            ) : (
              data.map((item: any, index: number) => (
                <tr key={index} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <td className="px-4 py-3 text-gray-900 dark:text-white">{item.itemName}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-200 font-mono">{item.itemCode}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{item.category}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{item.initialBalance.toLocaleString('fa-IR')}</td>
                  <td className="px-4 py-3 text-green-600 dark:text-green-400">{item.totalIn.toLocaleString('fa-IR')}</td>
                  <td className="px-4 py-3 text-red-600 dark:text-red-400">{item.totalOut.toLocaleString('fa-IR')}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{item.currentBalance.toLocaleString('fa-IR')}</td>
                  <td className={`px-4 py-3 font-medium ${item.netMovement >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {item.netMovement > 0 ? '+' : ''}{item.netMovement.toLocaleString('fa-IR')}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => router.push(`/inventory/item-ledger?itemId=${item.itemId}`)}
                      className="p-1 rounded-full text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                      title="مشاهده کاردکس"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// کامپوننت گزارش کم‌گردش
export function TurnoverReportTab({ data, loading, onExport }: { data: any[], loading: boolean, onExport: (format: string) => void }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">گزارش اقلام کم‌گردش/راکد</h3>
        <div className="flex items-center space-x-2 space-x-reverse">
          <button
            onClick={() => onExport('excel')}
            className="premium-button flex items-center space-x-2 space-x-reverse"
          >
            <FileSpreadsheet className="w-5 h-5" />
            <span>خروجی Excel</span>
          </button>
          <button
            onClick={() => onExport('pdf')}
            className="premium-button flex items-center space-x-2 space-x-reverse"
          >
            <FileText className="w-5 h-5" />
            <span>خروجی PDF</span>
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-right whitespace-nowrap">
          <thead>
            <tr className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-800/50">
              <th className="px-4 py-3 rounded-r-lg">نام کالا</th>
              <th className="px-4 py-3">کد</th>
              <th className="px-4 py-3">دسته‌بندی</th>
              <th className="px-4 py-3">موجودی فعلی</th>
              <th className="px-4 py-3">خروجی</th>
              <th className="px-4 py-3">نرخ گردش</th>
              <th className="px-4 py-3">روز از آخرین حرکت</th>
              <th className="px-4 py-3 rounded-l-lg">وضعیت</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {data.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                  داده‌ای برای نمایش وجود ندارد
                </td>
              </tr>
            ) : (
              data.map((item: any, index: number) => (
                <tr key={index} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <td className="px-4 py-3 text-gray-900 dark:text-white">{item.itemName}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-200 font-mono">{item.itemCode}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{item.category}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{item.currentBalance.toLocaleString('fa-IR')}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{item.totalOut.toLocaleString('fa-IR')}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{item.turnoverRate}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{item.daysSinceLastMovement}</td>
                  <td className="px-4 py-3">
                    {item.status === 'idle' ? (
                      <span className="status-badge bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">راکد</span>
                    ) : item.status === 'low_turnover' ? (
                      <span className="status-badge bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">کم‌گردش</span>
                    ) : (
                      <span className="status-badge bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">عادی</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// کامپوننت گزارش هشدارها
export function AlertsReportTab({ data, loading, onExport }: { data: any[], loading: boolean, onExport: (format: string) => void }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">گزارش هشدارها و اقدامات</h3>
        <div className="flex items-center space-x-2 space-x-reverse">
          <button
            onClick={() => onExport('excel')}
            className="premium-button flex items-center space-x-2 space-x-reverse"
          >
            <FileSpreadsheet className="w-5 h-5" />
            <span>خروجی Excel</span>
          </button>
          <button
            onClick={() => onExport('pdf')}
            className="premium-button flex items-center space-x-2 space-x-reverse"
          >
            <FileText className="w-5 h-5" />
            <span>خروجی PDF</span>
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-right whitespace-nowrap">
          <thead>
            <tr className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-800/50">
              <th className="px-4 py-3 rounded-r-lg">نام کالا</th>
              <th className="px-4 py-3">کد</th>
              <th className="px-4 py-3">انبار</th>
              <th className="px-4 py-3">نوع هشدار</th>
              <th className="px-4 py-3">وضعیت</th>
              <th className="px-4 py-3">موجودی فعلی</th>
              <th className="px-4 py-3">حداقل</th>
              <th className="px-4 py-3">حداکثر</th>
              <th className="px-4 py-3 rounded-l-lg">تعداد اقدامات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {data.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                  داده‌ای برای نمایش وجود ندارد
                </td>
              </tr>
            ) : (
              data.map((alert: any, index: number) => (
                <tr key={index} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <td className="px-4 py-3 text-gray-900 dark:text-white">{alert.itemName}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-200 font-mono">{alert.itemCode}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{alert.warehouseName}</td>
                  <td className="px-4 py-3">
                    {alert.alertType === 'LOW_STOCK' ? (
                      <span className="status-badge bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">کمبود</span>
                    ) : alert.alertType === 'NEAR_REORDER' ? (
                      <span className="status-badge bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">نزدیک سفارش</span>
                    ) : alert.alertType === 'OVERSTOCK' ? (
                      <span className="status-badge bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">مازاد</span>
                    ) : alert.alertType === 'EXPIRY_SOON' ? (
                      <span className="status-badge bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">نزدیک انقضا</span>
                    ) : (
                      <span className="status-badge bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300">{alert.alertType}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {alert.alertStatus === 'critical' ? (
                      <span className="status-badge bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">بحرانی</span>
                    ) : alert.alertStatus === 'needs_action' ? (
                      <span className="status-badge bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">نیاز به اقدام</span>
                    ) : (
                      <span className="status-badge bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">حل شده</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{alert.currentStock.toLocaleString('fa-IR')}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{alert.minStock.toLocaleString('fa-IR')}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{alert.maxStock.toLocaleString('fa-IR')}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{alert.actionsCount}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// کامپوننت گزارش انقضا
export function ExpiryReportTab({ data, loading, onExport }: { data: any[], loading: boolean, onExport: (format: string) => void }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">گزارش انقضا</h3>
        <div className="flex items-center space-x-2 space-x-reverse">
          <button
            onClick={() => onExport('excel')}
            className="premium-button flex items-center space-x-2 space-x-reverse"
          >
            <FileSpreadsheet className="w-5 h-5" />
            <span>خروجی Excel</span>
          </button>
          <button
            onClick={() => onExport('pdf')}
            className="premium-button flex items-center space-x-2 space-x-reverse"
          >
            <FileText className="w-5 h-5" />
            <span>خروجی PDF</span>
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-right whitespace-nowrap">
          <thead>
            <tr className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-800/50">
              <th className="px-4 py-3 rounded-r-lg">نام کالا</th>
              <th className="px-4 py-3">کد</th>
              <th className="px-4 py-3">انبار</th>
              <th className="px-4 py-3">Lot Number</th>
              <th className="px-4 py-3">تاریخ انقضا</th>
              <th className="px-4 py-3">روز تا انقضا</th>
              <th className="px-4 py-3">مقدار</th>
              <th className="px-4 py-3">ارزش</th>
              <th className="px-4 py-3 rounded-l-lg">وضعیت</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {data.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                  داده‌ای برای نمایش وجود ندارد
                </td>
              </tr>
            ) : (
              data.map((item: any, index: number) => (
                <tr key={index} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <td className="px-4 py-3 text-gray-900 dark:text-white">{item.itemName}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-200 font-mono">{item.itemCode}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{item.warehouseName}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{item.lotNumber || '-'}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-200">
                    {new Date(item.expirationDate).toLocaleDateString('fa-IR')}
                  </td>
                  <td className={`px-4 py-3 font-medium ${
                    item.daysUntilExpiry < 0 ? 'text-red-600 dark:text-red-400' :
                    item.daysUntilExpiry <= 30 ? 'text-orange-600 dark:text-orange-400' :
                    'text-gray-700 dark:text-gray-200'
                  }`}>
                    {item.daysUntilExpiry < 0 ? `منقضی شده (${Math.abs(item.daysUntilExpiry)} روز)` : `${item.daysUntilExpiry} روز`}
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{item.quantity.toLocaleString('fa-IR')}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{item.value.toLocaleString('fa-IR')} تومان</td>
                  <td className="px-4 py-3">
                    {item.isExpired ? (
                      <span className="status-badge bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">منقضی شده</span>
                    ) : item.isExpiringSoon ? (
                      <span className="status-badge bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">نزدیک انقضا</span>
                    ) : (
                      <span className="status-badge bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">عادی</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

