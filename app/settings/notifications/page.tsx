'use client'

import { useState } from 'react'
import { 
  Bell, 
  Mail, 
  MessageSquare, 
  Smartphone, 
  Settings, 
  Save, 
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Info,
  Clock,
  User,
  ShoppingCart,
  Package,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Eye,
  EyeOff,
  Volume2,
  VolumeX
} from 'lucide-react'

interface NotificationSettings {
  email: {
    enabled: boolean
    orderNotifications: boolean
    paymentNotifications: boolean
    inventoryAlerts: boolean
    dailyReports: boolean
    weeklyReports: boolean
    monthlyReports: boolean
    systemUpdates: boolean
    marketingEmails: boolean
  }
  sms: {
    enabled: boolean
    orderNotifications: boolean
    paymentNotifications: boolean
    inventoryAlerts: boolean
    dailyReports: boolean
    systemUpdates: boolean
  }
  push: {
    enabled: boolean
    orderNotifications: boolean
    paymentNotifications: boolean
    inventoryAlerts: boolean
    systemUpdates: boolean
    marketingNotifications: boolean
  }
  inApp: {
    enabled: boolean
    orderNotifications: boolean
    paymentNotifications: boolean
    inventoryAlerts: boolean
    systemUpdates: boolean
    showBadges: boolean
    playSound: boolean
  }
}

interface NotificationTemplate {
  id: string
  name: string
  type: 'email' | 'sms' | 'push' | 'in-app'
  subject: string
  content: string
  isActive: boolean
  lastUsed: string
  usageCount: number
}

const initialSettings: NotificationSettings = {
  email: {
    enabled: true,
    orderNotifications: true,
    paymentNotifications: true,
    inventoryAlerts: true,
    dailyReports: true,
    weeklyReports: false,
    monthlyReports: false,
    systemUpdates: true,
    marketingEmails: false
  },
  sms: {
    enabled: true,
    orderNotifications: true,
    paymentNotifications: false,
    inventoryAlerts: true,
    dailyReports: false,
    systemUpdates: false
  },
  push: {
    enabled: true,
    orderNotifications: true,
    paymentNotifications: true,
    inventoryAlerts: true,
    systemUpdates: true,
    marketingNotifications: false
  },
  inApp: {
    enabled: true,
    orderNotifications: true,
    paymentNotifications: true,
    inventoryAlerts: true,
    systemUpdates: true,
    showBadges: true,
    playSound: true
  }
}

const notificationTemplates: NotificationTemplate[] = [
  {
    id: '1',
    name: 'سفارش جدید',
    type: 'email',
    subject: 'سفارش جدید دریافت شد',
    content: 'سفارش جدید با شماره {orderNumber} از مشتری {customerName} دریافت شد.',
    isActive: true,
    lastUsed: '1403/01/20 14:30',
    usageCount: 45
  },
  {
    id: '2',
    name: 'پرداخت موفق',
    type: 'sms',
    subject: 'پرداخت موفق',
    content: 'پرداخت مبلغ {amount} تومان با موفقیت انجام شد.',
    isActive: true,
    lastUsed: '1403/01/20 15:45',
    usageCount: 32
  },
  {
    id: '3',
    name: 'موجودی کم',
    type: 'push',
    subject: 'هشدار موجودی',
    content: 'موجودی آیتم {itemName} به حداقل رسیده است.',
    isActive: true,
    lastUsed: '1403/01/19 09:15',
    usageCount: 8
  },
  {
    id: '4',
    name: 'گزارش روزانه',
    type: 'email',
    subject: 'گزارش فروش روزانه',
    content: 'گزارش فروش روز {date} آماده است. فروش کل: {totalSales} تومان',
    isActive: true,
    lastUsed: '1403/01/20 23:00',
    usageCount: 7
  }
]

export default function NotificationsPage() {
  const [settings, setSettings] = useState<NotificationSettings>(initialSettings)
  const [templates, setTemplates] = useState<NotificationTemplate[]>(notificationTemplates)
  const [activeTab, setActiveTab] = useState('settings')
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const tabs = [
    { id: 'settings', name: 'تنظیمات اعلان‌ها', icon: Settings },
    { id: 'templates', name: 'قالب‌های اعلان', icon: Mail },
    { id: 'history', name: 'تاریخچه اعلان‌ها', icon: Clock }
  ]

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      setSaveStatus('success')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (error) {
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  const updateEmailSettings = (field: string, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      email: { ...prev.email, [field]: value }
    }))
  }

  const updateSMSSettings = (field: string, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      sms: { ...prev.sms, [field]: value }
    }))
  }

  const updatePushSettings = (field: string, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      push: { ...prev.push, [field]: value }
    }))
  }

  const updateInAppSettings = (field: string, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      inApp: { ...prev.inApp, [field]: value }
    }))
  }

  const toggleTemplate = (id: string) => {
    setTemplates(templates.map(template => 
      template.id === id ? { ...template, isActive: !template.isActive } : template
    ))
  }

  const getSaveButtonContent = () => {
    if (isSaving) {
      return (
        <div className="flex items-center space-x-2 space-x-reverse">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          <span>در حال ذخیره...</span>
        </div>
      )
    }
    if (saveStatus === 'success') {
      return (
        <div className="flex items-center space-x-2 space-x-reverse">
          <CheckCircle className="w-4 h-4" />
          <span>ذخیره شد</span>
        </div>
      )
    }
    if (saveStatus === 'error') {
      return (
        <div className="flex items-center space-x-2 space-x-reverse">
          <AlertCircle className="w-4 h-4" />
          <span>خطا در ذخیره</span>
        </div>
      )
    }
    return (
      <div className="flex items-center space-x-2 space-x-reverse">
        <Save className="w-4 h-4" />
        <span>ذخیره تنظیمات</span>
      </div>
    )
  }

  const getNotificationTypeIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="w-5 h-5" />
      case 'sms': return <MessageSquare className="w-5 h-5" />
      case 'push': return <Smartphone className="w-5 h-5" />
      case 'in-app': return <Bell className="w-5 h-5" />
      default: return <Bell className="w-5 h-5" />
    }
  }

  const getNotificationTypeColor = (type: string) => {
    switch (type) {
      case 'email': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
      case 'sms': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
      case 'push': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
      case 'in-app': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/80 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold gradient-text mb-2">تنظیمات اعلان‌ها</h1>
          <p className="text-gray-600 dark:text-gray-300">مدیریت اعلان‌ها و اطلاع‌رسانی‌ها</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="premium-card p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">منوی تنظیمات</h2>
              <nav className="space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 space-x-reverse px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <tab.icon className="w-5 h-5" />
                    <span>{tab.name}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="premium-card p-6">
              {/* Settings Tab */}
              {activeTab === 'settings' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">تنظیمات اعلان‌ها</h2>
                  
                  {/* Email Notifications */}
                  <div className="mb-8">
                    <div className="flex items-center space-x-3 space-x-reverse mb-4">
                      <Mail className="w-6 h-6 text-blue-600" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">اعلان‌های ایمیل</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">فعال‌سازی اعلان‌های ایمیل</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300">دریافت اعلان‌ها از طریق ایمیل</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.email.enabled}
                            onChange={(e) => updateEmailSettings('enabled', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                        </label>
                      </div>
                      {settings.email.enabled && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {Object.entries(settings.email).filter(([key]) => key !== 'enabled').map(([key, value]) => (
                            <div key={key} className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-lg">
                              <span className="text-sm text-gray-700 dark:text-gray-300">
                                {key === 'orderNotifications' ? 'اعلان سفارشات' :
                                 key === 'paymentNotifications' ? 'اعلان پرداخت‌ها' :
                                 key === 'inventoryAlerts' ? 'هشدار موجودی' :
                                 key === 'dailyReports' ? 'گزارش روزانه' :
                                 key === 'weeklyReports' ? 'گزارش هفتگی' :
                                 key === 'monthlyReports' ? 'گزارش ماهانه' :
                                 key === 'systemUpdates' ? 'بروزرسانی سیستم' :
                                 'ایمیل‌های بازاریابی'}
                              </span>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={value}
                                  onChange={(e) => updateEmailSettings(key, e.target.checked)}
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                              </label>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* SMS Notifications */}
                  <div className="mb-8">
                    <div className="flex items-center space-x-3 space-x-reverse mb-4">
                      <MessageSquare className="w-6 h-6 text-green-600" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">اعلان‌های پیامک</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">فعال‌سازی اعلان‌های پیامک</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300">دریافت اعلان‌ها از طریق پیامک</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.sms.enabled}
                            onChange={(e) => updateSMSSettings('enabled', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                        </label>
                      </div>
                      {settings.sms.enabled && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {Object.entries(settings.sms).filter(([key]) => key !== 'enabled').map(([key, value]) => (
                            <div key={key} className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-lg">
                              <span className="text-sm text-gray-700 dark:text-gray-300">
                                {key === 'orderNotifications' ? 'اعلان سفارشات' :
                                 key === 'paymentNotifications' ? 'اعلان پرداخت‌ها' :
                                 key === 'inventoryAlerts' ? 'هشدار موجودی' :
                                 key === 'dailyReports' ? 'گزارش روزانه' :
                                 'بروزرسانی سیستم'}
                              </span>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={value}
                                  onChange={(e) => updateSMSSettings(key, e.target.checked)}
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                              </label>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Push Notifications */}
                  <div className="mb-8">
                    <div className="flex items-center space-x-3 space-x-reverse mb-4">
                      <Smartphone className="w-6 h-6 text-purple-600" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">اعلان‌های پوش</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">فعال‌سازی اعلان‌های پوش</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300">دریافت اعلان‌ها در مرورگر</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.push.enabled}
                            onChange={(e) => updatePushSettings('enabled', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                        </label>
                      </div>
                      {settings.push.enabled && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {Object.entries(settings.push).filter(([key]) => key !== 'enabled').map(([key, value]) => (
                            <div key={key} className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-lg">
                              <span className="text-sm text-gray-700 dark:text-gray-300">
                                {key === 'orderNotifications' ? 'اعلان سفارشات' :
                                 key === 'paymentNotifications' ? 'اعلان پرداخت‌ها' :
                                 key === 'inventoryAlerts' ? 'هشدار موجودی' :
                                 key === 'systemUpdates' ? 'بروزرسانی سیستم' :
                                 'اعلان‌های بازاریابی'}
                              </span>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={value}
                                  onChange={(e) => updatePushSettings(key, e.target.checked)}
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                              </label>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* In-App Notifications */}
                  <div className="mb-8">
                    <div className="flex items-center space-x-3 space-x-reverse mb-4">
                      <Bell className="w-6 h-6 text-orange-600" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">اعلان‌های درون‌برنامه</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">فعال‌سازی اعلان‌های درون‌برنامه</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300">نمایش اعلان‌ها در داخل برنامه</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.inApp.enabled}
                            onChange={(e) => updateInAppSettings('enabled', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                        </label>
                      </div>
                      {settings.inApp.enabled && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {Object.entries(settings.inApp).filter(([key]) => key !== 'enabled').map(([key, value]) => (
                            <div key={key} className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-lg">
                              <span className="text-sm text-gray-700 dark:text-gray-300">
                                {key === 'orderNotifications' ? 'اعلان سفارشات' :
                                 key === 'paymentNotifications' ? 'اعلان پرداخت‌ها' :
                                 key === 'inventoryAlerts' ? 'هشدار موجودی' :
                                 key === 'systemUpdates' ? 'بروزرسانی سیستم' :
                                 key === 'showBadges' ? 'نمایش نشان‌ها' :
                                 'پخش صدا'}
                              </span>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={value}
                                  onChange={(e) => updateInAppSettings(key, e.target.checked)}
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                              </label>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="pt-6 border-t border-gray-200 dark:border-gray-600/30">
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
                        isSaving
                          ? 'bg-gray-400 text-white cursor-not-allowed'
                          : saveStatus === 'success'
                          ? 'bg-green-600 text-white hover:bg-green-700'
                          : saveStatus === 'error'
                          ? 'bg-red-600 text-white hover:bg-red-700'
                          : 'bg-primary-600 text-white hover:bg-primary-700'
                      }`}
                    >
                      {getSaveButtonContent()}
                    </button>
                  </div>
                </div>
              )}

              {/* Templates Tab */}
              {activeTab === 'templates' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">قالب‌های اعلان</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {templates.map((template) => (
                      <div key={template.id} className="p-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3 space-x-reverse">
                            <span className={`p-2 rounded-lg ${getNotificationTypeColor(template.type)}`}>
                              {getNotificationTypeIcon(template.type)}
                            </span>
                            <div>
                              <h3 className="font-medium text-gray-900 dark:text-white">{template.name}</h3>
                              <p className="text-sm text-gray-600 dark:text-gray-300">{template.type}</p>
                            </div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={template.isActive}
                              onChange={() => toggleTemplate(template.id)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                          </label>
                        </div>
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">موضوع:</h4>
                          <p className="text-sm text-gray-900 dark:text-white">{template.subject}</p>
                        </div>
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">محتوای:</h4>
                          <p className="text-sm text-gray-900 dark:text-white">{template.content}</p>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                          <span>آخرین استفاده: {template.lastUsed}</span>
                          <span>تعداد استفاده: {template.usageCount}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* History Tab */}
              {activeTab === 'history' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">تاریخچه اعلان‌ها</h2>
                  <div className="text-center py-12">
                    <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">تاریخچه اعلان‌ها</h3>
                    <p className="text-gray-600 dark:text-gray-300">تاریخچه اعلان‌های ارسال شده در اینجا نمایش داده می‌شود.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
