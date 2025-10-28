'use client'

import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/components/ThemeProvider'
import { AuthProvider } from '@/components/AuthProvider'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import { usePathname } from 'next/navigation'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isLoginPage = pathname === '/login'

  return (
    <html lang="fa" dir="rtl">
      <body className="font-persian">
        <ThemeProvider>
          <AuthProvider>
            {isLoginPage ? (
              <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/80 dark:to-gray-900">
                {children}
              </div>
            ) : (
              <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/80 dark:to-gray-900">
                <Header />
                <div className="flex">
                  <Sidebar />
                  <main className="flex-1 p-6 main-scrollbar smooth-scroll overflow-y-auto h-screen">
                    {children}
                  </main>
                </div>
              </div>
            )}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
