'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { 
  Settings, 
  Users, 
  Shield, 
  Printer, 
  Layout, 
  Archive, 
  FileText,
  Loader2
} from 'lucide-react'

export default function SettingsPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect به تنظیمات رستوران (صفحه اصلی تنظیمات)
    router.push('/settings/restaurant')
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/80 dark:to-gray-900 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-16 h-16 animate-spin text-primary-600 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-300">در حال انتقال به تنظیمات...</p>
      </div>
    </div>
  )
}

