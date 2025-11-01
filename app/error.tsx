'use client'

import { useEffect } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/80 dark:to-gray-900 p-6">
      <div className="max-w-md w-full premium-card p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">خطا در بارگذاری</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          متأسفانه خطایی رخ داد. لطفاً دوباره تلاش کنید.
        </p>
        {error.message && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-700 dark:text-red-300 font-mono break-all">
              {error.message}
            </p>
          </div>
        )}
        <button
          onClick={reset}
          className="premium-button bg-blue-600 hover:bg-blue-700 flex items-center justify-center space-x-2 space-x-reverse mx-auto"
        >
          <RefreshCw className="w-5 h-5" />
          <span>تلاش مجدد</span>
        </button>
      </div>
    </div>
  )
}

