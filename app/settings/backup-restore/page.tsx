'use client'

import React, { useState } from 'react'
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
  WifiOff
} from 'lucide-react'

interface BackupRecord {
  id: string
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
}

interface ScheduleConfig {
  id: string
  name: string
  type: 'full' | 'incremental'
  frequency: 'daily' | 'weekly' | 'monthly'
  time: string
  enabled: boolean
  retention: number // days
  location: 'local' | 's3' | 'minio'
  encryption: boolean
}

const mockBackups: BackupRecord[] = [
  {
    id: 'B001',
    name: 'Full Backup - 2023-11-22',
    type: 'full',
    status: 'completed',
    size: 2450,
    createdAt: '2023-11-22 02:00:00',
    duration: 45,
    location: 's3',
    encrypted: true,
    version: '1.0.0',
    description: 'بکاپ کامل روزانه'
  },
  {
    id: 'B002',
    name: 'Incremental Backup - 2023-11-22',
    type: 'incremental',
    status: 'completed',
    size: 120,
    createdAt: '2023-11-22 14:00:00',
    duration: 8,
    location: 's3',
    encrypted: true,
    version: '1.0.0',
    description: 'بکاپ افزایشی بعد از ظهر'
  },
  {
    id: 'B003',
    name: 'Full Backup - 2023-11-21',
    type: 'full',
    status: 'completed',
    size: 2380,
    createdAt: '2023-11-21 02:00:00',
    duration: 42,
    location: 'local',
    encrypted: false,
    version: '1.0.0',
    description: 'بکاپ کامل روز قبل'
  },
  {
    id: 'B004',
    name: 'Emergency Backup - 2023-11-20',
    type: 'full',
    status: 'running',
    size: 0,
    createdAt: '2023-11-20 16:30:00',
    location: 's3',
    encrypted: true,
    version: '1.0.0',
    description: 'بکاپ اضطراری'
  },
  {
    id: 'B005',
    name: 'Scheduled Backup - 2023-11-19',
    type: 'incremental',
    status: 'failed',
    size: 0,
    createdAt: '2023-11-19 14:00:00',
    location: 'minio',
    encrypted: true,
    version: '1.0.0',
    description: 'بکاپ زمان‌بندی شده',
    errorMessage: 'خطا در اتصال به MinIO'
  }
]

const mockSchedules: ScheduleConfig[] = [
  {
    id: 'S001',
    name: 'بکاپ روزانه کامل',
    type: 'full',
    frequency: 'daily',
    time: '02:00',
    enabled: true,
    retention: 30,
    location: 's3',
    encryption: true
  },
  {
    id: 'S002',
    name: 'بکاپ افزایشی بعد از ظهر',
    type: 'incremental',
    frequency: 'daily',
    time: '14:00',
    enabled: true,
    retention: 7,
    location: 's3',
    encryption: true
  },
  {
    id: 'S003',
    name: 'بکاپ هفتگی محلی',
    type: 'full',
    frequency: 'weekly',
    time: '01:00',
    enabled: false,
    retention: 90,
    location: 'local',
    encryption: false
  }
]

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
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterLocation, setFilterLocation] = useState('all')
  const [selectedBackup, setSelectedBackup] = useState<BackupRecord | null>(null)
  const [showBackupModal, setShowBackupModal] = useState(false)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [isCreatingBackup, setIsCreatingBackup] = useState(false)

  const filteredBackups = mockBackups.filter(backup =>
    (filterType === 'all' || backup.type === filterType) &&
    (filterStatus === 'all' || backup.status === filterStatus) &&
    (filterLocation === 'all' || backup.location === filterLocation) &&
    backup.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleCreateBackup = async (type: 'full' | 'incremental') => {
    setIsCreatingBackup(true)
    // Simulate backup creation
    setTimeout(() => {
      setIsCreatingBackup(false)
      // Add new backup to list
    }, 2000)
  }

  const handleRestoreBackup = async (backupId: string) => {
    // Simulate restore process
    console.log('Restoring backup:', backupId)
  }

  const BackupDetailsModal = () => {
    if (!selectedBackup) return null

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="premium-card w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold gradient-text">{selectedBackup.name}</h2>
            <button onClick={() => setShowBackupModal(false)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
              <XCircle className="w-6 h-6 text-gray-600 dark:text-gray-300" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-3">
              <p className="text-gray-700 dark:text-gray-300 flex items-center space-x-2 space-x-reverse">
                <Info className="w-5 h-5 text-primary-600" />
                <span>نوع: {getTypeBadge(selectedBackup.type)}</span>
              </p>
              <p className="text-gray-700 dark:text-gray-300 flex items-center space-x-2 space-x-reverse">
                <CheckCircle className="w-5 h-5 text-primary-600" />
                <span>وضعیت: {getStatusBadge(selectedBackup.status)}</span>
              </p>
              <p className="text-gray-700 dark:text-gray-300 flex items-center space-x-2 space-x-reverse">
                <HardDrive className="w-5 h-5 text-primary-600" />
                <span>حجم: <span className="font-medium">{selectedBackup.size} MB</span></span>
              </p>
              <p className="text-gray-700 dark:text-gray-300 flex items-center space-x-2 space-x-reverse">
                <Clock className="w-5 h-5 text-primary-600" />
                <span>مدت زمان: <span className="font-medium">{selectedBackup.duration || 'N/A'} دقیقه</span></span>
              </p>
            </div>
            <div className="space-y-3">
              <p className="text-gray-700 dark:text-gray-300 flex items-center space-x-2 space-x-reverse">
                {getLocationIcon(selectedBackup.location)}
                <span>مکان: <span className="font-medium">{selectedBackup.location.toUpperCase()}</span></span>
              </p>
              <p className="text-gray-700 dark:text-gray-300 flex items-center space-x-2 space-x-reverse">
                <Lock className="w-5 h-5 text-primary-600" />
                <span>رمزنگاری: <span className="font-medium">{selectedBackup.encrypted ? 'بله' : 'خیر'}</span></span>
              </p>
              <p className="text-gray-700 dark:text-gray-300 flex items-center space-x-2 space-x-reverse">
                <Key className="w-5 h-5 text-primary-600" />
                <span>نسخه: <span className="font-medium">{selectedBackup.version}</span></span>
              </p>
              <p className="text-gray-700 dark:text-gray-300 flex items-center space-x-2 space-x-reverse">
                <Calendar className="w-5 h-5 text-primary-600" />
                <span>تاریخ ایجاد: <span className="font-medium">{selectedBackup.createdAt}</span></span>
              </p>
            </div>
          </div>

          {selectedBackup.description && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">توضیحات</h3>
              <p className="text-gray-700 dark:text-gray-300">{selectedBackup.description}</p>
            </div>
          )}

          {selectedBackup.errorMessage && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <h3 className="text-lg font-semibold text-red-800 dark:text-red-300 mb-2">خطا</h3>
              <p className="text-red-700 dark:text-red-300">{selectedBackup.errorMessage}</p>
            </div>
          )}

          <div className="flex justify-end space-x-3 space-x-reverse">
            <button 
              onClick={() => handleRestoreBackup(selectedBackup.id)}
              className="premium-button bg-green-600 hover:bg-green-700"
              disabled={selectedBackup.status !== 'completed'}
            >
              <RotateCcw className="w-5 h-5 ml-2" />
              بازیابی
            </button>
            <button onClick={() => setShowBackupModal(false)} className="premium-button bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">
              بستن
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fade-in-animation space-y-6">
      <h1 className="text-3xl font-bold gradient-text">پشتیبان‌گیری و بازیابی</h1>
      <p className="text-gray-600 dark:text-gray-300 mt-1">
        مدیریت بکاپ‌های کامل و افزایشی، زمان‌بندی خودکار و بازیابی داده‌ها.
      </p>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="premium-card p-4 text-center">
          <Database className="w-8 h-8 text-primary-600 mx-auto mb-2" />
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">بکاپ کامل</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">بکاپ کامل از تمام داده‌ها</p>
          <button 
            onClick={() => handleCreateBackup('full')}
            disabled={isCreatingBackup}
            className="premium-button w-full"
          >
            {isCreatingBackup ? <RefreshCw className="w-4 h-4 animate-spin ml-2" /> : <Play className="w-4 h-4 ml-2" />}
            {isCreatingBackup ? 'در حال ایجاد...' : 'ایجاد بکاپ کامل'}
          </button>
        </div>

        <div className="premium-card p-4 text-center">
          <Archive className="w-8 h-8 text-blue-600 mx-auto mb-2" />
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">بکاپ افزایشی</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">بکاپ تغییرات جدید</p>
          <button 
            onClick={() => handleCreateBackup('incremental')}
            disabled={isCreatingBackup}
            className="premium-button w-full bg-blue-600 hover:bg-blue-700"
          >
            {isCreatingBackup ? <RefreshCw className="w-4 h-4 animate-spin ml-2" /> : <Play className="w-4 h-4 ml-2" />}
            {isCreatingBackup ? 'در حال ایجاد...' : 'ایجاد بکاپ افزایشی'}
          </button>
        </div>

        <div className="premium-card p-4 text-center">
          <Settings className="w-8 h-8 text-green-600 mx-auto mb-2" />
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">تنظیمات</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">مدیریت زمان‌بندی و تنظیمات</p>
          <button 
            onClick={() => setActiveTab('settings')}
            className="premium-button w-full bg-green-600 hover:bg-green-700"
          >
            <Settings className="w-4 h-4 ml-2" />
            تنظیمات
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="premium-card p-2 flex space-x-2 space-x-reverse mb-6">
        <button
          onClick={() => setActiveTab('backups')}
          className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'backups' ? 'bg-primary-600 text-white shadow-md' : 'bg-transparent text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          بکاپ‌ها
        </button>
        <button
          onClick={() => setActiveTab('schedules')}
          className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'schedules' ? 'bg-primary-600 text-white shadow-md' : 'bg-transparent text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          زمان‌بندی
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'settings' ? 'bg-primary-600 text-white shadow-md' : 'bg-transparent text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          تنظیمات
        </button>
      </div>

      {/* Content based on activeTab */}
      {activeTab === 'backups' && (
        <div className="premium-card p-6">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 space-y-4 md:space-y-0">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2 space-x-reverse">
              <Database className="w-6 h-6 text-primary-600" />
              <span>لیست بکاپ‌ها</span>
            </h2>
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
            <table className="w-full text-right whitespace-nowrap">
              <thead>
                <tr className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-800/50">
                  <th className="px-4 py-3 rounded-r-lg">نام</th>
                  <th className="px-4 py-3">نوع</th>
                  <th className="px-4 py-3">وضعیت</th>
                  <th className="px-4 py-3">حجم</th>
                  <th className="px-4 py-3">مکان</th>
                  <th className="px-4 py-3">رمزنگاری</th>
                  <th className="px-4 py-3">تاریخ ایجاد</th>
                  <th className="px-4 py-3 rounded-l-lg">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredBackups.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-3 text-center text-gray-500 dark:text-gray-400">
                      هیچ بکاپی یافت نشد.
                    </td>
                  </tr>
                ) : (
                  filteredBackups.map(backup => (
                    <tr key={backup.id} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-4 py-3 text-gray-900 dark:text-white">{backup.name}</td>
                      <td className="px-4 py-3">{getTypeBadge(backup.type)}</td>
                      <td className="px-4 py-3">{getStatusBadge(backup.status)}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{backup.size} MB</td>
                      <td className="px-4 py-3 flex items-center space-x-2 space-x-reverse">
                        {getLocationIcon(backup.location)}
                        <span className="text-gray-700 dark:text-gray-200">{backup.location.toUpperCase()}</span>
                      </td>
                      <td className="px-4 py-3">
                        {backup.encrypted ? (
                          <Lock className="w-4 h-4 text-green-600 mx-auto" />
                        ) : (
                          <XCircle className="w-4 h-4 text-gray-400 mx-auto" />
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{backup.createdAt}</td>
                      <td className="px-4 py-3 flex items-center space-x-2 space-x-reverse">
                        <button 
                          onClick={() => {
                            setSelectedBackup(backup)
                            setShowBackupModal(true)
                          }}
                          className="p-2 rounded-full text-primary-600 hover:bg-primary-100 dark:hover:bg-primary-900/30"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleRestoreBackup(backup.id)}
                          disabled={backup.status !== 'completed'}
                          className="p-2 rounded-full text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <RotateCcw className="w-5 h-5" />
                        </button>
                        <button className="p-2 rounded-full text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30">
                          <Trash2 className="w-5 h-5" />
                        </button>
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
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 space-y-4 md:space-y-0">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2 space-x-reverse">
              <Clock className="w-6 h-6 text-primary-600" />
              <span>زمان‌بندی بکاپ‌ها</span>
            </h2>
            <button className="premium-button">
              <Plus className="w-5 h-5 ml-2" />
              افزودن زمان‌بندی جدید
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockSchedules.map(schedule => (
              <div key={schedule.id} className="premium-card p-4">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{schedule.name}</h3>
                  <div className={`w-3 h-3 rounded-full ${schedule.enabled ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                </div>
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <p>نوع: {getTypeBadge(schedule.type)}</p>
                  <p>فرکانس: {schedule.frequency === 'daily' ? 'روزانه' : schedule.frequency === 'weekly' ? 'هفتگی' : 'ماهانه'}</p>
                  <p>زمان: {schedule.time}</p>
                  <p>مکان: {schedule.location.toUpperCase()}</p>
                  <p>نگهداری: {schedule.retention} روز</p>
                  <p>رمزنگاری: {schedule.encryption ? 'بله' : 'خیر'}</p>
                </div>
                <div className="flex justify-end space-x-2 space-x-reverse mt-4">
                  <button className="p-2 rounded-full text-primary-600 hover:bg-primary-100 dark:hover:bg-primary-900/30">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button className="p-2 rounded-full text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
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
    </div>
  )
}
