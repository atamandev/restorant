'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Database,
  Download,
  Upload,
  Clock,
  Shield,
  HardDrive,
  Cloud,
  CheckCircle,
  AlertTriangle,
  Play,
  Pause,
  RotateCcw,
  Settings,
  Calendar,
  FileText,
  Lock,
  Key,
  Archive,
  RefreshCw,
  Eye,
  Trash2,
  Plus,
  Search,
  Filter,
  XCircle,
  Info,
  Zap,
  Server,
  Wifi,
  WifiOff,
  Edit,
  X,
  Save
} from 'lucide-react'

interface BackupRecord {
  id?: string
  _id?: string
  name: string
  type: 'full' | 'incremental'
  status: 'completed' | 'running' | 'failed' | 'scheduled'
  size: number // in MB
  createdAt: string
  scheduledAt?: string
  duration?: number // in minutes
  location: 'local' | 's3' | 'minio'
  encrypted: boolean
  version: string
  description?: string
  errorMessage?: string
  filePath?: string
  fileName?: string
  collections?: string[]
  restoreStatus?: 'running' | 'completed' | 'failed'
}

interface ScheduleConfig {
  id?: string
  _id?: string
  name: string
  type: 'full' | 'incremental'
  frequency: 'daily' | 'weekly' | 'monthly'
  time: string
  enabled: boolean
  retention: number // days
  location: 'local' | 's3' | 'minio'
  encryption: boolean
  createdAt?: string
  updatedAt?: string
}

interface StatsData {
  totalBackups: number
  completedBackups: number
  failedBackups: number
  runningBackups: number
  totalSize: number
  activeSchedules: number
}


const getStatusBadge = (status: string) => {
  switch (status) {
    case 'completed': return <span className="status-badge bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">تکمیل شده</span>
    case 'running': return <span className="status-badge bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">در حال اجرا</span>
    case 'failed': return <span className="status-badge bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">ناموفق</span>
    case 'scheduled': return <span className="status-badge bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">زمان‌بندی شده</span>
    default: return null
  }
}

const getTypeBadge = (type: string) => {
  switch (type) {
    case 'full': return <span className="status-badge bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">کامل</span>
    case 'incremental': return <span className="status-badge bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">افزایشی</span>
    default: return null
  }
}

const getLocationIcon = (location: string) => {
  switch (location) {
    case 's3': return <Cloud className="w-4 h-4 text-blue-600" />
    case 'minio': return <Server className="w-4 h-4 text-green-600" />
    case 'local': return <HardDrive className="w-4 h-4 text-gray-600" />
    default: return <HardDrive className="w-4 h-4 text-gray-600" />
  }
}

export default function BackupRestorePage() {
  const [activeTab, setActiveTab] = useState<'backups' | 'schedules' | 'settings'>('backups')
  const [backups, setBackups] = useState<BackupRecord[]>([])
  const [schedules, setSchedules] = useState<ScheduleConfig[]>([])
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterLocation, setFilterLocation] = useState('all')
  const [selectedBackup, setSelectedBackup] = useState<BackupRecord | null>(null)
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleConfig | null>(null)
  const [showBackupModal, setShowBackupModal] = useState(false)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [isCreatingBackup, setIsCreatingBackup] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)
  
  // Schedule form state
  const [scheduleForm, setScheduleForm] = useState({
    name: '',
    type: 'full' as 'full' | 'incremental',
    frequency: 'daily' as 'daily' | 'weekly' | 'monthly',
    time: '02:00',
    enabled: true,
    retention: 30,
    location: 'local' as 'local' | 's3' | 'minio',
    encryption: true
  })

  // Fetch backups
  const fetchBackups = useCallback(async () => {
    try {
      const response = await fetch('/api/backup-restore?type=backups')
      const result = await response.json()
      if (result.success) {
        setBackups(result.data || [])
      }
    } catch (error) {
      console.error('Error fetching backups:', error)
      alert('خطا در دریافت بکاپ‌ها')
    }
  }, [])

  // Fetch schedules
  const fetchSchedules = useCallback(async () => {
    try {
      const response = await fetch('/api/backup-restore?type=schedules')
      const result = await response.json()
      if (result.success) {
        setSchedules(result.data || [])
      }
    } catch (error) {
      console.error('Error fetching schedules:', error)
      alert('خطا در دریافت زمان‌بندی‌ها')
    }
  }, [])

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/backup-restore?type=stats')
      const result = await response.json()
      if (result.success) {
        setStats(result.data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }, [])

  // Load data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([fetchBackups(), fetchSchedules(), fetchStats()])
      setLoading(false)
    }
    loadData()
  }, [fetchBackups, fetchSchedules, fetchStats])

  // Filtered backups
  const filteredBackups = useMemo(() => {
    return backups.filter(backup =>
    (filterType === 'all' || backup.type === filterType) &&
    (filterStatus === 'all' || backup.status === filterStatus) &&
    (filterLocation === 'all' || backup.location === filterLocation) &&
      (searchTerm === '' || backup.name.toLowerCase().includes(searchTerm.toLowerCase()))
  )
  }, [backups, filterType, filterStatus, filterLocation, searchTerm])

  const handleCreateBackup = async (type: 'full' | 'incremental', location: 'local' | 's3' | 'minio' = 'local', encrypted: boolean = true) => {
    setIsCreatingBackup(true)
    try {
      const response = await fetch('/api/backup-restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create-backup',
          type,
          location,
          encrypted
        })
      })
      const result = await response.json()
      if (result.success) {
        alert('✅ بکاپ با موفقیت ایجاد شد')
        await Promise.all([fetchBackups(), fetchStats()])
      } else {
        alert(`❌ ${result.message || 'خطا در ایجاد بکاپ'}`)
      }
    } catch (error) {
      console.error('Error creating backup:', error)
      alert('خطا در ایجاد بکاپ')
    } finally {
      setIsCreatingBackup(false)
    }
  }

  const handleRestoreBackup = async (backupId: string) => {
    if (!confirm('آیا از بازیابی این بکاپ اطمینان دارید؟ این عملیات ممکن است داده‌های فعلی را جایگزین کند.')) {
      return
    }
    setIsRestoring(true)
    try {
      const response = await fetch('/api/backup-restore/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          backupId,
          clearBeforeRestore: false // Can be made configurable
        })
      })
      const result = await response.json()
      if (result.success) {
        alert(`✅ ${result.message}`)
        await fetchBackups()
      } else {
        alert(`❌ ${result.message || 'خطا در بازیابی بکاپ'}`)
      }
    } catch (error) {
      console.error('Error restoring backup:', error)
      alert('خطا در بازیابی بکاپ')
    } finally {
      setIsRestoring(false)
    }
  }

  const handleDeleteBackup = async (backupId: string) => {
    if (!confirm('آیا از حذف این بکاپ اطمینان دارید؟')) {
      return
    }
    try {
      const response = await fetch(`/api/backup-restore?entity=backup&id=${backupId}`, {
        method: 'DELETE'
      })
      const result = await response.json()
      if (result.success) {
        alert('✅ بکاپ با موفقیت حذف شد')
        await Promise.all([fetchBackups(), fetchStats()])
      } else {
        alert(`❌ ${result.message || 'خطا در حذف بکاپ'}`)
      }
    } catch (error) {
      console.error('Error deleting backup:', error)
      alert('خطا در حذف بکاپ')
    }
  }

  const handleCreateSchedule = async (scheduleData: Omit<ScheduleConfig, 'id' | '_id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const response = await fetch('/api/backup-restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create-schedule',
          ...scheduleData
        })
      })
      const result = await response.json()
      if (result.success) {
        alert('✅ زمان‌بندی با موفقیت ایجاد شد')
        setShowScheduleModal(false)
        await Promise.all([fetchSchedules(), fetchStats()])
      } else {
        alert(`❌ ${result.message || 'خطا در ایجاد زمان‌بندی'}`)
      }
    } catch (error) {
      console.error('Error creating schedule:', error)
      alert('خطا در ایجاد زمان‌بندی')
    }
  }

  const handleUpdateSchedule = async (scheduleId: string, updateData: Partial<ScheduleConfig>) => {
    try {
      const response = await fetch('/api/backup-restore', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: scheduleId,
          entity: 'schedule',
          ...updateData
        })
      })
      const result = await response.json()
      if (result.success) {
        alert('✅ زمان‌بندی با موفقیت به‌روزرسانی شد')
        setShowScheduleModal(false)
        await fetchSchedules()
      } else {
        alert(`❌ ${result.message || 'خطا در به‌روزرسانی زمان‌بندی'}`)
      }
    } catch (error) {
      console.error('Error updating schedule:', error)
      alert('خطا در به‌روزرسانی زمان‌بندی')
    }
  }

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!confirm('آیا از حذف این زمان‌بندی اطمینان دارید؟')) {
      return
    }
    try {
      const response = await fetch(`/api/backup-restore?entity=schedule&id=${scheduleId}`, {
        method: 'DELETE'
      })
      const result = await response.json()
      if (result.success) {
        alert('✅ زمان‌بندی با موفقیت حذف شد')
        await Promise.all([fetchSchedules(), fetchStats()])
      } else {
        alert(`❌ ${result.message || 'خطا در حذف زمان‌بندی'}`)
      }
    } catch (error) {
      console.error('Error deleting schedule:', error)
      alert('خطا در حذف زمان‌بندی')
    }
  }

  const BackupDetailsModal = () => {
    if (!selectedBackup) return null

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          {/* Header with Gradient */}
          <div className={`relative px-6 py-5 bg-gradient-to-r ${
            selectedBackup.type === 'full' 
              ? 'from-purple-500 to-purple-600' 
              : 'from-blue-500 to-blue-600'
          } text-white rounded-t-2xl`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                  <Database className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{selectedBackup.name}</h2>
                  <p className="text-sm text-white/90 mt-0.5">{selectedBackup.type === 'full' ? 'بکاپ کامل' : 'بکاپ افزایشی'}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowBackupModal(false)} 
                className="p-2 rounded-xl hover:bg-white/20 transition-colors"
              >
                <X className="w-6 h-6 text-white" />
            </button>
            </div>
          </div>

          <div className="p-6">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="premium-card p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
              <div className="flex items-center space-x-2 space-x-reverse mb-3">
                <Info className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">نوع بکاپ</span>
            </div>
              <div className="mt-2">{getTypeBadge(selectedBackup.type)}</div>
            </div>
            
            <div className="premium-card p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
              <div className="flex items-center space-x-2 space-x-reverse mb-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">وضعیت</span>
              </div>
              <div className="mt-2">{getStatusBadge(selectedBackup.status)}</div>
            </div>
            
            <div className="premium-card p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
              <div className="flex items-center space-x-2 space-x-reverse mb-3">
                <HardDrive className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">حجم فایل</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{selectedBackup.size} MB</p>
            </div>
            
            <div className="premium-card p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20">
              <div className="flex items-center space-x-2 space-x-reverse mb-3">
                <Clock className="w-5 h-5 text-orange-600" />
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">مدت زمان</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{selectedBackup.duration || 'N/A'} دقیقه</p>
            </div>
            
            <div className="premium-card p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600">
              <div className="flex items-center space-x-2 space-x-reverse mb-3">
                {getLocationIcon(selectedBackup.location)}
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">مکان ذخیره</span>
            </div>
              <p className="text-lg font-bold text-gray-900 dark:text-white mt-2">{selectedBackup.location.toUpperCase()}</p>
          </div>
            
            <div className="premium-card p-4 bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20">
              <div className="flex items-center space-x-2 space-x-reverse mb-3">
                <Lock className={`w-5 h-5 ${selectedBackup.encrypted ? 'text-green-600' : 'text-gray-400'}`} />
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">رمزنگاری</span>
              </div>
              <p className="text-lg font-bold text-gray-900 dark:text-white mt-2">{selectedBackup.encrypted ? 'فعال' : 'غیرفعال'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="premium-card p-4">
              <div className="flex items-center space-x-2 space-x-reverse mb-2">
                <Calendar className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">تاریخ ایجاد</span>
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{new Date(selectedBackup.createdAt).toLocaleDateString('fa-IR')}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{new Date(selectedBackup.createdAt).toLocaleTimeString('fa-IR')}</p>
            </div>
            
            <div className="premium-card p-4">
              <div className="flex items-center space-x-2 space-x-reverse mb-2">
                <Key className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">نسخه</span>
              </div>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{selectedBackup.version}</p>
            </div>
          </div>
          
          {selectedBackup.collections && selectedBackup.collections.length > 0 && (
            <div className="premium-card p-4 mb-6">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">مجموعه‌های بکاپ شده</h3>
              <div className="flex flex-wrap gap-2">
                {selectedBackup.collections.map((collection, index) => (
                  <span 
                    key={index}
                    className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-xs font-medium"
                  >
                    {collection}
                  </span>
                ))}
              </div>
            </div>
          )}

          {selectedBackup.description && (
            <div className="premium-card p-4 mb-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center space-x-2 space-x-reverse">
                <FileText className="w-4 h-4" />
                <span>توضیحات</span>
              </h3>
              <p className="text-gray-700 dark:text-gray-300">{selectedBackup.description}</p>
            </div>
          )}

          {selectedBackup.errorMessage && (
            <div className="premium-card p-4 mb-6 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-l-4 border-red-500">
              <h3 className="text-lg font-semibold text-red-800 dark:text-red-300 mb-2 flex items-center space-x-2 space-x-reverse">
                <AlertTriangle className="w-5 h-5" />
                <span>خطا</span>
              </h3>
              <p className="text-red-700 dark:text-red-300">{selectedBackup.errorMessage}</p>
            </div>
          )}

          <div className="flex justify-end space-x-3 space-x-reverse pt-4 border-t border-gray-200 dark:border-gray-700">
            <button 
              onClick={() => handleRestoreBackup(selectedBackup._id || selectedBackup.id || '')}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 space-x-reverse"
              disabled={selectedBackup.status !== 'completed' || isRestoring}
            >
              <RotateCcw className={`w-5 h-5 ${isRestoring ? 'animate-spin' : ''}`} />
              <span>{isRestoring ? 'در حال بازیابی...' : 'بازیابی بکاپ'}</span>
            </button>
            <button 
              onClick={() => setShowBackupModal(false)} 
              className="px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold rounded-xl transition-all duration-200 flex items-center space-x-2 space-x-reverse"
            >
              <X className="w-5 h-5" />
              <span>بستن</span>
            </button>
          </div>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
  return (
    <div className="fade-in-animation space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <RefreshCw className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      </div>
    )
  }

  return (
    <div className="fade-in-animation space-y-6">
      <div className="flex items-center justify-between">
        <div>
      <h1 className="text-3xl font-bold gradient-text">پشتیبان‌گیری و بازیابی</h1>
      <p className="text-gray-600 dark:text-gray-300 mt-1">
        مدیریت بکاپ‌های کامل و افزایشی، زمان‌بندی خودکار و بازیابی داده‌ها.
      </p>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="premium-card p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-l-4 border-blue-500 hover:shadow-xl transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Database className="w-7 h-7 text-white" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">کل بکاپ‌ها</h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
              {stats.totalBackups.toLocaleString('fa-IR')}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">کل بکاپ‌های ایجاد شده</p>
          </div>
          
          <div className="premium-card p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-l-4 border-green-500 hover:shadow-xl transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <CheckCircle className="w-7 h-7 text-white" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">تکمیل شده</h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
              {stats.completedBackups.toLocaleString('fa-IR')}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">بکاپ‌های موفق</p>
          </div>
          
          <div className="premium-card p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-l-4 border-purple-500 hover:shadow-xl transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <HardDrive className="w-7 h-7 text-white" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">حجم کل</h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
              {stats.totalSize.toFixed(2)} MB
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">فضای ذخیره شده</p>
          </div>
          
          <div className="premium-card p-6 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-l-4 border-orange-500 hover:shadow-xl transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Clock className="w-7 h-7 text-white" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">زمان‌بندی فعال</h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
              {stats.activeSchedules.toLocaleString('fa-IR')}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">زمان‌بندی‌های فعال</p>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="premium-card p-6 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white overflow-hidden relative group hover:shadow-2xl transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                <Database className="w-7 h-7 text-white" />
              </div>
            </div>
            <h3 className="font-bold text-lg mb-1">بکاپ کامل</h3>
            <p className="text-sm text-white/90 mb-4">بکاپ کامل از تمام داده‌ها و مجموعه‌ها</p>
          <button 
              onClick={() => handleCreateBackup('full', 'local', true)}
            disabled={isCreatingBackup}
              className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 space-x-reverse"
            >
              {isCreatingBackup ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>در حال ایجاد...</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  <span>ایجاد بکاپ کامل</span>
                </>
              )}
          </button>
          </div>
        </div>

        <div className="premium-card p-6 bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-500 text-white overflow-hidden relative group hover:shadow-2xl transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                <Archive className="w-7 h-7 text-white" />
              </div>
            </div>
            <h3 className="font-bold text-lg mb-1">بکاپ افزایشی</h3>
            <p className="text-sm text-white/90 mb-4">بکاپ فقط تغییرات جدید و به‌روزرسانی‌ها</p>
          <button 
              onClick={() => handleCreateBackup('incremental', 'local', true)}
            disabled={isCreatingBackup}
              className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 space-x-reverse"
            >
              {isCreatingBackup ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>در حال ایجاد...</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  <span>ایجاد بکاپ افزایشی</span>
                </>
              )}
          </button>
          </div>
        </div>

        <div className="premium-card p-6 bg-gradient-to-br from-emerald-500 via-green-500 to-teal-500 text-white overflow-hidden relative group hover:shadow-2xl transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                <Settings className="w-7 h-7 text-white" />
              </div>
            </div>
            <h3 className="font-bold text-lg mb-1">تنظیمات</h3>
            <p className="text-sm text-white/90 mb-4">مدیریت زمان‌بندی و تنظیمات بکاپ</p>
          <button 
            onClick={() => setActiveTab('settings')}
              className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 space-x-reverse"
          >
              <Settings className="w-5 h-5" />
              <span>تنظیمات</span>
          </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="premium-card p-2 flex space-x-2 space-x-reverse mb-6 bg-gray-50 dark:bg-gray-800/50">
        <button
          onClick={() => setActiveTab('backups')}
          className={`flex-1 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center justify-center space-x-2 space-x-reverse ${
            activeTab === 'backups' 
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/50 scale-105' 
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Database className="w-5 h-5" />
          <span>بکاپ‌ها</span>
        </button>
        <button
          onClick={() => setActiveTab('schedules')}
          className={`flex-1 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center justify-center space-x-2 space-x-reverse ${
            activeTab === 'schedules' 
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/50 scale-105' 
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Clock className="w-5 h-5" />
          <span>زمان‌بندی</span>
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex-1 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center justify-center space-x-2 space-x-reverse ${
            activeTab === 'settings' 
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/50 scale-105' 
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Settings className="w-5 h-5" />
          <span>تنظیمات</span>
        </button>
      </div>

      {/* Content based on activeTab */}
      {activeTab === 'backups' && (
        <div className="premium-card p-6">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 space-y-4 md:space-y-0 pb-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                <Database className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">لیست بکاپ‌ها</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">مدیریت و مشاهده تمام بکاپ‌های ایجاد شده</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="جستجو بکاپ..."
                  className="premium-input pr-10 pl-4 py-2.5 w-48"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                className="premium-input w-32"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="all">همه انواع</option>
                <option value="full">کامل</option>
                <option value="incremental">افزایشی</option>
              </select>
              <select
                className="premium-input w-32"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">همه وضعیت‌ها</option>
                <option value="completed">تکمیل شده</option>
                <option value="running">در حال اجرا</option>
                <option value="failed">ناموفق</option>
                <option value="scheduled">زمان‌بندی شده</option>
              </select>
              <select
                className="premium-input w-32"
                value={filterLocation}
                onChange={(e) => setFilterLocation(e.target.value)}
              >
                <option value="all">همه مکان‌ها</option>
                <option value="local">محلی</option>
                <option value="s3">S3</option>
                <option value="minio">MinIO</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-right">
              <thead>
                <tr className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 border-b-2 border-gray-200 dark:border-gray-600">
                  <th className="px-6 py-4 rounded-r-xl">نام بکاپ</th>
                  <th className="px-6 py-4">نوع</th>
                  <th className="px-6 py-4">وضعیت</th>
                  <th className="px-6 py-4">حجم</th>
                  <th className="px-6 py-4">مکان</th>
                  <th className="px-6 py-4">رمزنگاری</th>
                  <th className="px-6 py-4">تاریخ ایجاد</th>
                  <th className="px-6 py-4 rounded-l-xl">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredBackups.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-20 h-20 mb-4 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center">
                          <Database className="w-10 h-10 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">هیچ بکاپی یافت نشد</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">برای ایجاد بکاپ از دکمه‌های بالا استفاده کنید</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredBackups.map(backup => (
                    <tr key={backup._id || backup.id} className="bg-white dark:bg-gray-800 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/50 dark:hover:from-gray-700 dark:hover:to-gray-700 transition-all duration-200 group">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3 space-x-reverse">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            backup.type === 'full' 
                              ? 'bg-gradient-to-br from-purple-500 to-purple-600' 
                              : 'bg-gradient-to-br from-blue-500 to-blue-600'
                          }`}>
                            <Database className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">{backup.name}</p>
                            {backup.description && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{backup.description}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">{getTypeBadge(backup.type)}</td>
                      <td className="px-6 py-4">{getStatusBadge(backup.status)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <HardDrive className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                          <span className="font-medium text-gray-900 dark:text-white">{backup.size} MB</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2 space-x-reverse">
                        {getLocationIcon(backup.location)}
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{backup.location.toUpperCase()}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {backup.encrypted ? (
                          <div className="flex items-center justify-center space-x-1 space-x-reverse">
                            <Lock className="w-4 h-4 text-green-600" />
                            <span className="text-xs text-green-600 font-medium">رمزنگاری</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">بدون رمز</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-700 dark:text-gray-300">
                          {new Date(backup.createdAt).toLocaleDateString('fa-IR')}
                        </div>
                        {backup.duration && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {backup.duration} دقیقه
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2 space-x-reverse">
                        <button 
                          onClick={() => {
                            setSelectedBackup(backup)
                            setShowBackupModal(true)
                          }}
                            className="p-2 rounded-lg text-primary-600 hover:bg-primary-100 dark:hover:bg-primary-900/30 hover:scale-110 transition-all"
                            title="جزئیات"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button 
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRestoreBackup(backup._id || backup.id || '')
                            }}
                            disabled={backup.status !== 'completed' || isRestoring}
                            className="p-2 rounded-lg text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-110 transition-all"
                            title="بازیابی"
                          >
                            <RotateCcw className={`w-5 h-5 ${isRestoring ? 'animate-spin' : ''}`} />
                        </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteBackup(backup._id || backup.id || '')
                            }}
                            className="p-2 rounded-lg text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 hover:scale-110 transition-all"
                            title="حذف"
                          >
                          <Trash2 className="w-5 h-5" />
                        </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'schedules' && (
        <div className="premium-card p-6">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 space-y-4 md:space-y-0 pb-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">زمان‌بندی بکاپ‌ها</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">تنظیم زمان‌بندی خودکار برای بکاپ‌ها</p>
              </div>
            </div>
            <button
              onClick={() => {
                setSelectedSchedule(null)
                setScheduleForm({
                  name: '',
                  type: 'full',
                  frequency: 'daily',
                  time: '02:00',
                  enabled: true,
                  retention: 30,
                  location: 'local',
                  encryption: true
                })
                setShowScheduleModal(true)
              }}
              className="premium-button"
            >
              <Plus className="w-5 h-5 ml-2" />
              افزودن زمان‌بندی جدید
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {schedules.length === 0 ? (
              <div className="col-span-full text-center py-16">
                <div className="w-24 h-24 mb-6 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center mx-auto">
                  <Clock className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">زمان‌بندی‌ای وجود ندارد</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">برای ایجاد زمان‌بندی خودکار از دکمه بالا استفاده کنید</p>
                </div>
            ) : (
              schedules.map(schedule => (
              <div 
                key={schedule._id || schedule.id} 
                className="premium-card p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 border-l-4 hover:shadow-xl transition-all duration-300 group overflow-hidden relative"
                style={{
                  borderLeftColor: schedule.enabled 
                    ? schedule.type === 'full' ? '#8B5CF6' : '#3B82F6'
                    : '#9CA3AF'
                }}
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${
                      schedule.type === 'full'
                        ? 'bg-gradient-to-br from-purple-500 to-purple-600'
                        : 'bg-gradient-to-br from-blue-500 to-blue-600'
                    }`}>
                      <Clock className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white">{schedule.name}</h3>
                      <div className="flex items-center space-x-2 space-x-reverse mt-1">
                        <div className={`w-2 h-2 rounded-full ${schedule.enabled ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {schedule.enabled ? 'فعال' : 'غیرفعال'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between p-2 bg-white/50 dark:bg-gray-700/50 rounded-lg">
                    <span className="text-sm text-gray-600 dark:text-gray-400">نوع:</span>
                    {getTypeBadge(schedule.type)}
                  </div>
                  <div className="flex items-center justify-between p-2 bg-white/50 dark:bg-gray-700/50 rounded-lg">
                    <span className="text-sm text-gray-600 dark:text-gray-400">فرکانس:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {schedule.frequency === 'daily' ? 'روزانه' : schedule.frequency === 'weekly' ? 'هفتگی' : 'ماهانه'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-white/50 dark:bg-gray-700/50 rounded-lg">
                    <span className="text-sm text-gray-600 dark:text-gray-400">زمان:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{schedule.time}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-white/50 dark:bg-gray-700/50 rounded-lg">
                    <span className="text-sm text-gray-600 dark:text-gray-400">مکان:</span>
                    <div className="flex items-center space-x-1 space-x-reverse">
                      {getLocationIcon(schedule.location)}
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{schedule.location.toUpperCase()}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-white/50 dark:bg-gray-700/50 rounded-lg">
                    <span className="text-sm text-gray-600 dark:text-gray-400">نگهداری:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{schedule.retention} روز</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-white/50 dark:bg-gray-700/50 rounded-lg">
                    <span className="text-sm text-gray-600 dark:text-gray-400">رمزنگاری:</span>
                    {schedule.encryption ? (
                      <div className="flex items-center space-x-1 space-x-reverse">
                        <Lock className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-600">فعال</span>
                      </div>
                    ) : (
                      <span className="text-sm font-medium text-gray-500">غیرفعال</span>
                    )}
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2 space-x-reverse mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                  <button
                    onClick={() => {
                      setSelectedSchedule(schedule)
                      setScheduleForm({
                        name: schedule.name,
                        type: schedule.type,
                        frequency: schedule.frequency,
                        time: schedule.time,
                        enabled: schedule.enabled,
                        retention: schedule.retention,
                        location: schedule.location,
                        encryption: schedule.encryption
                      })
                      setShowScheduleModal(true)
                    }}
                    className="px-4 py-2 rounded-lg bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-800/30 text-blue-700 dark:text-blue-300 font-medium transition-all hover:scale-105 flex items-center space-x-2 space-x-reverse"
                    title="ویرایش"
                  >
                    <Edit className="w-4 h-4" />
                    <span>ویرایش</span>
                  </button>
                  <button
                    onClick={() => handleDeleteSchedule(schedule._id || schedule.id || '')}
                    className="px-4 py-2 rounded-lg bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-800/30 text-red-700 dark:text-red-300 font-medium transition-all hover:scale-105 flex items-center space-x-2 space-x-reverse"
                    title="حذف"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>حذف</span>
                  </button>
                </div>
              </div>
            ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="premium-card p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2 space-x-reverse">
              <Cloud className="w-6 h-6 text-blue-600" />
              <span>تنظیمات ذخیره‌سازی</span>
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">مکان پیش‌فرض</label>
                <select className="premium-input w-full">
                  <option value="local">محلی</option>
                  <option value="s3">Amazon S3</option>
                  <option value="minio">MinIO</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">رمزنگاری پیش‌فرض</label>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <input type="checkbox" className="rounded" defaultChecked />
                  <span className="text-sm text-gray-600 dark:text-gray-300">فعال کردن رمزنگاری</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">نگهداری بکاپ‌ها (روز)</label>
                <input type="number" className="premium-input w-full" defaultValue="30" />
              </div>
            </div>
          </div>

          <div className="premium-card p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2 space-x-reverse">
              <Shield className="w-6 h-6 text-green-600" />
              <span>تنظیمات امنیتی</span>
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">کلید رمزنگاری</label>
                <input type="password" className="premium-input w-full" placeholder="کلید رمزنگاری" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">تست بازیابی</label>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <input type="checkbox" className="rounded" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">تست خودکار بازیابی</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">اعلان‌ها</label>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <input type="checkbox" className="rounded" defaultChecked />
                  <span className="text-sm text-gray-600 dark:text-gray-300">ارسال اعلان در صورت خطا</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showBackupModal && <BackupDetailsModal />}

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg">
            {/* Header with Gradient */}
            <div className="relative px-6 py-5 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">
                      {selectedSchedule ? 'ویرایش زمان‌بندی' : 'زمان‌بندی جدید'}
                    </h2>
                    <p className="text-sm text-white/90 mt-0.5">تنظیم بکاپ خودکار</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowScheduleModal(false)
                    setSelectedSchedule(null)
                    setScheduleForm({
                      name: '',
                      type: 'full',
                      frequency: 'daily',
                      time: '02:00',
                      enabled: true,
                      retention: 30,
                      location: 'local',
                      encryption: true
                    })
                  }}
                  className="p-2 rounded-xl hover:bg-white/20 transition-colors"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>
            </div>

            <div className="p-6">

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">نام زمان‌بندی</label>
                <input
                  type="text"
                  className="premium-input w-full"
                  value={scheduleForm.name}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, name: e.target.value })}
                  placeholder="نام زمان‌بندی را وارد کنید"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">نوع</label>
                  <select
                    className="premium-input w-full"
                    value={scheduleForm.type}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, type: e.target.value as 'full' | 'incremental' })}
                  >
                    <option value="full">کامل</option>
                    <option value="incremental">افزایشی</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">فرکانس</label>
                  <select
                    className="premium-input w-full"
                    value={scheduleForm.frequency}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, frequency: e.target.value as 'daily' | 'weekly' | 'monthly' })}
                  >
                    <option value="daily">روزانه</option>
                    <option value="weekly">هفتگی</option>
                    <option value="monthly">ماهانه</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">زمان</label>
                  <input
                    type="time"
                    className="premium-input w-full"
                    value={scheduleForm.time}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, time: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">نگهداری (روز)</label>
                  <input
                    type="number"
                    className="premium-input w-full"
                    value={scheduleForm.retention}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, retention: parseInt(e.target.value) || 30 })}
                    min="1"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">مکان</label>
                <select
                  className="premium-input w-full"
                  value={scheduleForm.location}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, location: e.target.value as 'local' | 's3' | 'minio' })}
                >
                  <option value="local">محلی</option>
                  <option value="s3">Amazon S3</option>
                  <option value="minio">MinIO</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2 space-x-reverse">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    checked={scheduleForm.enabled}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, enabled: e.target.checked })}
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">فعال</span>
                </label>
                <label className="flex items-center space-x-2 space-x-reverse">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    checked={scheduleForm.encryption}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, encryption: e.target.checked })}
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">رمزنگاری</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 space-x-reverse mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  setShowScheduleModal(false)
                  setSelectedSchedule(null)
                  setScheduleForm({
                    name: '',
                    type: 'full',
                    frequency: 'daily',
                    time: '02:00',
                    enabled: true,
                    retention: 30,
                    location: 'local',
                    encryption: true
                  })
                }}
                className="px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold rounded-xl transition-all duration-200"
              >
                انصراف
              </button>
              <button
                onClick={() => {
                  if (!scheduleForm.name) {
                    alert('نام زمان‌بندی اجباری است')
                    return
                  }
                  if (selectedSchedule) {
                    handleUpdateSchedule(selectedSchedule._id || selectedSchedule.id || '', scheduleForm)
                  } else {
                    handleCreateSchedule(scheduleForm)
                  }
                }}
                className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center space-x-2 space-x-reverse"
              >
                <Save className="w-5 h-5" />
                <span>ذخیره</span>
              </button>
            </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
