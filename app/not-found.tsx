'use client'

import Link from 'next/link'
import { Home, Search } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/80 dark:to-gray-900 p-6">
      <div className="max-w-md w-full premium-card p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <Search className="w-8 h-8 text-gray-400" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">404</h2>
        <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-4">صفحه یافت نشد</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          صفحه‌ای که به دنبال آن هستید وجود ندارد یا حذف شده است.
        </p>
        <div className="flex items-center justify-center space-x-4 space-x-reverse">
          <Link
            href="/"
            className="premium-button bg-blue-600 hover:bg-blue-700 flex items-center space-x-2 space-x-reverse"
          >
            <Home className="w-5 h-5" />
            <span>بازگشت به خانه</span>
          </Link>
        </div>
      </div>
    </div>
  )
}

