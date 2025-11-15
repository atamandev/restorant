'use client'

import { usePathname } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import { Loader2 } from 'lucide-react'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user, isLoading } = useAuth()
  const isLoginPage = pathname === '/login'

  // Don't show layout for login page - let it render independently
  if (isLoginPage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/80 dark:to-gray-900">
        {children}
      </div>
    )
  }

  // Show loading while checking auth (only for protected pages)
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/80 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">در حال بررسی احراز هویت...</p>
        </div>
      </div>
    )
  }

  // For protected pages, middleware will handle redirect if not authenticated
  // We don't need to check user here - middleware already did that
  // Just render the layout
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/80 dark:to-gray-900">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6 main-scrollbar smooth-scroll overflow-y-auto h-screen">
          {children}
        </main>
      </div>
    </div>
  )
}
