'use client'

import { useState, useEffect } from 'react'

interface FiltersSelectProps {
  selectedStatus: string
  selectedPriority: string
  onStatusChange: (value: string) => void
  onPriorityChange: (value: string) => void
}

export default function FiltersSelect({
  selectedStatus,
  selectedPriority,
  onStatusChange,
  onPriorityChange
}: FiltersSelectProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Return placeholder during SSR and initial client render
  if (!mounted) {
    return (
      <>
        <div className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 h-[42px] w-[150px]"></div>
        <div className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 h-[42px] w-[150px]"></div>
      </>
    )
  }

  return (
    <>
      <select
        value={selectedStatus}
        onChange={(e) => onStatusChange(e.target.value)}
        className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
      >
        <option value="all">همه وضعیت‌ها</option>
        <option value="pending">در انتظار</option>
        <option value="preparing">در حال آماده‌سازی</option>
        <option value="ready">آماده</option>
        <option value="completed">تکمیل شده</option>
        <option value="cancelled">لغو شده</option>
      </select>
      <select
        value={selectedPriority}
        onChange={(e) => onPriorityChange(e.target.value)}
        className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
      >
        <option value="all">همه اولویت‌ها</option>
        <option value="normal">عادی</option>
        <option value="urgent">فوری</option>
      </select>
    </>
  )
}

