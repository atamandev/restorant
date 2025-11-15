'use client'

import { useState } from 'react'
import { Plus, Trash2, ChefHat, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

export default function TestMenuPage() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const addTestItems = async () => {
    try {
      setLoading(true)
      setMessage(null)
      
      const response = await fetch('/api/menu-items/add-test-items', {
        method: 'POST'
      })
      
      const result = await response.json()
      
      if (result.success) {
        setMessage({
          type: 'success',
          text: result.message || `${result.data?.insertedCount || 0} محصول تستی اضافه شد`
        })
      } else {
        setMessage({
          type: 'error',
          text: result.message || 'خطا در اضافه کردن محصولات'
        })
      }
    } catch (error) {
      console.error('Error adding test items:', error)
      setMessage({
        type: 'error',
        text: 'خطا در اتصال به سرور'
      })
    } finally {
      setLoading(false)
    }
  }

  const deleteTestItems = async () => {
    if (!confirm('آیا مطمئن هستید که می‌خواهید تمام محصولات تستی را حذف کنید؟')) {
      return
    }

    try {
      setLoading(true)
      setMessage(null)
      
      const response = await fetch('/api/menu-items/add-test-items', {
        method: 'DELETE'
      })
      
      const result = await response.json()
      
      if (result.success) {
        setMessage({
          type: 'success',
          text: result.message || `${result.data?.deletedCount || 0} محصول تستی حذف شد`
        })
      } else {
        setMessage({
          type: 'error',
          text: result.message || 'خطا در حذف محصولات'
        })
      }
    } catch (error) {
      console.error('Error deleting test items:', error)
      setMessage({
        type: 'error',
        text: 'خطا در اتصال به سرور'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/80 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl premium-card p-8 shadow-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl floating-card pulse-glow">
            <ChefHat className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold gradient-text dark:text-white mb-2">
            مدیریت محصولات تستی
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            اضافه یا حذف محصولات تستی برای صفحه سفارش
          </p>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-xl flex items-center space-x-3 space-x-reverse ${
            message.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
            )}
            <p className={`text-sm ${
              message.type === 'success'
                ? 'text-green-700 dark:text-green-300'
                : 'text-red-700 dark:text-red-300'
            }`}>
              {message.text}
            </p>
          </div>
        )}

        {/* Info Box */}
        <div className="mb-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
          <h3 className="font-bold text-blue-900 dark:text-blue-200 mb-2">محصولات تستی شامل:</h3>
          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
            <li>کباب کوبیده ویژه</li>
            <li>جوجه کباب ترش</li>
            <li>قیمه سنتی</li>
            <li>چای ماسالا</li>
            <li>قهوه اسپرسو</li>
            <li>کشک بادمجان</li>
            <li>سالاد فصل</li>
            <li>بستنی سنتی</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="space-y-4">
          <button
            onClick={addTestItems}
            disabled={loading}
            className="w-full premium-button bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 space-x-reverse py-4 text-lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>در حال پردازش...</span>
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                <span>اضافه کردن محصولات تستی</span>
              </>
            )}
          </button>

          <button
            onClick={deleteTestItems}
            disabled={loading}
            className="w-full premium-button bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 space-x-reverse py-4 text-lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>در حال پردازش...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-5 h-5" />
                <span>حذف محصولات تستی</span>
              </>
            )}
          </button>
        </div>

        {/* Link to Order Page */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
          <a
            href="/order"
            className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium transition-colors"
          >
            ← بازگشت به صفحه سفارش
          </a>
        </div>
      </div>
    </div>
  )
}

