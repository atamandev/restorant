'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  Building, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  CreditCard, 
  Settings, 
  Save, 
  Upload, 
  Image, 
  Globe, 
  Wifi, 
  Shield, 
  Bell, 
  Users, 
  DollarSign,
  Calculator,
  FileText,
  Printer,
  Monitor,
  Smartphone,
  Database,
  Cloud,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react'

interface RestaurantSettings {
  basicInfo: {
    name: string
    description: string
    address: string
    phone: string
    email: string
    website: string
    logo: string
  }
  businessHours: {
    [key: string]: {
      open: string
      close: string
      isOpen: boolean
    }
  }
  financial: {
    currency: string
    taxRate: number
    serviceCharge: number
    discountLimit: number
    minimumOrder: number
    goldenCustomerDiscount: number
  }
  pos: {
    receiptPrinter: string
    kitchenPrinter: string
    cashDrawer: string
    barcodeScanner: string
    customerDisplay: string
  }
  notifications: {
    email: boolean
    sms: boolean
    push: boolean
    lowStock: boolean
    newOrder: boolean
    paymentReceived: boolean
  }
  security: {
    requirePassword: boolean
    sessionTimeout: number
    backupFrequency: string
    dataRetention: number
  }
  integrations: {
    paymentGateway: string
    deliveryService: string
    accountingSoftware: string
    inventorySystem: string
  }
}

const initialSettings: RestaurantSettings = {
  basicInfo: {
    name: 'رستوران سنتی ایرانی',
    description: 'رستوران سنتی با غذاهای اصیل ایرانی و محیطی گرم و دوستانه',
    address: 'تهران، خیابان ولیعصر، پلاک 123',
    phone: '021-12345678',
    email: 'info@restaurant.com',
    website: 'www.restaurant.com',
    logo: '/api/placeholder/200/200'
  },
  businessHours: {
    saturday: { open: '09:00', close: '23:00', isOpen: true },
    sunday: { open: '09:00', close: '23:00', isOpen: true },
    monday: { open: '09:00', close: '23:00', isOpen: true },
    tuesday: { open: '09:00', close: '23:00', isOpen: true },
    wednesday: { open: '09:00', close: '23:00', isOpen: true },
    thursday: { open: '09:00', close: '23:00', isOpen: true },
    friday: { open: '14:00', close: '23:00', isOpen: true }
  },
  financial: {
    currency: 'IRR',
    taxRate: 9,
    serviceCharge: 10,
    discountLimit: 20,
    minimumOrder: 50000,
    goldenCustomerDiscount: 2
  },
  pos: {
    receiptPrinter: 'EPSON TM-T20III',
    kitchenPrinter: 'EPSON TM-T20III',
    cashDrawer: 'EPSON TM-T20III',
    barcodeScanner: 'Honeywell 1450g',
    customerDisplay: 'Samsung 15"'
  },
  notifications: {
    email: true,
    sms: true,
    push: true,
    lowStock: true,
    newOrder: true,
    paymentReceived: true
  },
  security: {
    requirePassword: true,
    sessionTimeout: 30,
    backupFrequency: 'daily',
    dataRetention: 365
  },
  integrations: {
    paymentGateway: 'ZarinPal',
    deliveryService: 'SnappFood',
    accountingSoftware: 'پارسیان',
    inventorySystem: 'انبار آنلاین'
  }
}

const weekDays = [
  { key: 'saturday', label: 'شنبه' },
  { key: 'sunday', label: 'یکشنبه' },
  { key: 'monday', label: 'دوشنبه' },
  { key: 'tuesday', label: 'سه‌شنبه' },
  { key: 'wednesday', label: 'چهارشنبه' },
  { key: 'thursday', label: 'پنج‌شنبه' },
  { key: 'friday', label: 'جمعه' }
]

export default function RestaurantSettingsPage() {
  const [settings, setSettings] = useState<RestaurantSettings>(initialSettings)
  const [activeTab, setActiveTab] = useState('basic')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Fetch settings from API
  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/restaurant-settings')
      const result = await response.json()
      if (result.success && result.data) {
        // اطمینان از وجود goldenCustomerDiscount
        const fetchedSettings = result.data
        if (!fetchedSettings.financial) {
          fetchedSettings.financial = initialSettings.financial
        } else if (fetchedSettings.financial.goldenCustomerDiscount === undefined || fetchedSettings.financial.goldenCustomerDiscount === null) {
          fetchedSettings.financial.goldenCustomerDiscount = 2
        }
        setSettings(fetchedSettings)
      } else {
        console.error('Failed to fetch settings:', result.message)
        // Use initial settings as fallback
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
      // Use initial settings as fallback
    } finally {
      setLoading(false)
    }
  }, [])

  // Load settings on mount
  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  // Handle save settings
  const handleSave = async () => {
    try {
      setSaving(true)
      
      // Get the section to update based on active tab
      let updateData: any = {}
      
      switch (activeTab) {
        case 'basic':
          updateData.basicInfo = settings.basicInfo
          break
        case 'hours':
          updateData.businessHours = settings.businessHours
          break
        case 'financial':
          updateData.financial = settings.financial
          break
        case 'pos':
          updateData.pos = settings.pos
          break
        case 'notifications':
          updateData.notifications = settings.notifications
          break
        case 'security':
          updateData.security = settings.security
          break
        case 'integrations':
          updateData.integrations = settings.integrations
          break
        default:
          // Save all settings
          updateData = settings
      }
      
      const response = await fetch('/api/restaurant-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })
      
      const result = await response.json()
      if (result.success) {
        alert('✅ تنظیمات با موفقیت ذخیره شد!')
        // Refresh settings from server
        await fetchSettings()
      } else {
        alert(`❌ ${result.message || 'خطا در ذخیره تنظیمات'}`)
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('❌ خطا در ذخیره تنظیمات')
    } finally {
      setSaving(false)
    }
  }

  // Handle logo upload
  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // بررسی نوع فایل
    if (!file.type.startsWith('image/')) {
      alert('فقط فایل‌های تصویری مجاز هستند')
      return
    }

    // بررسی اندازه فایل (حداکثر 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      alert('حجم فایل نباید بیشتر از 5 مگابایت باشد')
      return
    }

    try {
      // نمایش preview فوری با data URL
      const reader = new FileReader()
      reader.onload = (e) => {
        const logoDataUrl = e.target?.result as string
        setSettings(prev => ({
          ...prev,
          basicInfo: {
            ...prev.basicInfo,
            logo: logoDataUrl // Preview موقت
          }
        }))
      }
      reader.readAsDataURL(file)

      // آپلود فایل به سرور
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (result.success && result.url) {
        // به‌روزرسانی با URL واقعی
        setSettings(prev => ({
          ...prev,
          basicInfo: {
            ...prev.basicInfo,
            logo: result.url
          }
        }))
      } else {
        alert(result.message || 'خطا در آپلود فایل')
        // اگر آپلود ناموفق بود، preview را پاک کن
        setSettings(prev => ({
          ...prev,
          basicInfo: {
            ...prev.basicInfo,
            logo: prev.basicInfo.logo || '/api/placeholder/200/200'
          }
        }))
      }
    } catch (error) {
      console.error('Error uploading logo:', error)
      alert('خطا در آپلود فایل')
      // اگر خطا رخ داد، preview را پاک کن
      setSettings(prev => ({
        ...prev,
        basicInfo: {
          ...prev.basicInfo,
          logo: prev.basicInfo.logo || '/api/placeholder/200/200'
        }
      }))
    }
  }

  const updateBusinessHours = (day: string, field: string, value: string | boolean) => {
    setSettings(prev => ({
      ...prev,
      businessHours: {
        ...prev.businessHours,
        [day]: {
          ...prev.businessHours[day],
          [field]: value
        }
      }
    }))
  }

  const updateNotification = (key: string, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: value
      }
    }))
  }

  const tabs = [
    { id: 'basic', label: 'اطلاعات پایه', icon: Building },
    { id: 'hours', label: 'ساعات کاری', icon: Clock },
    { id: 'financial', label: 'مالی', icon: DollarSign },
    { id: 'pos', label: 'سیستم فروش', icon: Monitor },
    { id: 'notifications', label: 'اعلان‌ها', icon: Bell },
    { id: 'security', label: 'امنیت', icon: Shield },
    { id: 'integrations', label: 'یکپارچه‌سازی', icon: Cloud }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/80 dark:to-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold gradient-text mb-2">تنظیمات رستوران</h1>
          <p className="text-gray-600 dark:text-gray-300">مدیریت تنظیمات و پیکربندی سیستم</p>
        </div>

        {/* Tabs */}
        <div className="premium-card p-6 mb-8">
          <div className="flex flex-wrap gap-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 space-x-reverse px-4 py-2 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="premium-card p-6">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-600 dark:text-gray-400">در حال بارگذاری تنظیمات...</p>
              </div>
            </div>
          ) : (
            <>
          {/* Basic Info Tab */}
          {activeTab === 'basic' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">اطلاعات پایه رستوران</h2>
              
              {/* Logo Upload */}
              <div className="flex items-center space-x-6 space-x-reverse">
                <div className="w-32 h-32 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
                  {settings.basicInfo.logo ? (
                    <img src={settings.basicInfo.logo} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <Image className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    لوگوی رستوران
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    id="logo-upload"
                  />
                  <label
                    htmlFor="logo-upload"
                    className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    <span>آپلود لوگو</span>
                  </label>
                </div>
              </div>

              {/* Basic Info Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    نام رستوران
                  </label>
                  <input
                    type="text"
                    value={settings.basicInfo.name}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      basicInfo: { ...prev.basicInfo, name: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    تلفن
                  </label>
                  <input
                    type="tel"
                    value={settings.basicInfo.phone}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      basicInfo: { ...prev.basicInfo, phone: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    ایمیل
                  </label>
                  <input
                    type="email"
                    value={settings.basicInfo.email}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      basicInfo: { ...prev.basicInfo, email: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    وب‌سایت
                  </label>
                  <input
                    type="url"
                    value={settings.basicInfo.website}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      basicInfo: { ...prev.basicInfo, website: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    آدرس
                  </label>
                  <textarea
                    value={settings.basicInfo.address}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      basicInfo: { ...prev.basicInfo, address: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    rows={3}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    توضیحات
                  </label>
                  <textarea
                    value={settings.basicInfo.description}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      basicInfo: { ...prev.basicInfo, description: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    rows={4}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Business Hours Tab */}
          {activeTab === 'hours' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">ساعات کاری</h2>
              <div className="space-y-4">
                {weekDays.map(day => (
                  <div key={day.key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <div className="flex items-center space-x-4 space-x-reverse">
                      <label className="flex items-center space-x-2 space-x-reverse">
                        <input
                          type="checkbox"
                          checked={settings.businessHours[day.key as keyof typeof settings.businessHours].isOpen}
                          onChange={(e) => updateBusinessHours(day.key, 'isOpen', e.target.checked)}
                          className="w-4 h-4 text-primary-600"
                        />
                        <span className="text-gray-900 dark:text-white font-medium">{day.label}</span>
                      </label>
                    </div>
                    <div className="flex items-center space-x-4 space-x-reverse">
                      <div>
                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">باز</label>
                        <input
                          type="time"
                          value={settings.businessHours[day.key as keyof typeof settings.businessHours].open}
                          onChange={(e) => updateBusinessHours(day.key, 'open', e.target.value)}
                          disabled={!settings.businessHours[day.key as keyof typeof settings.businessHours].isOpen}
                          className="px-3 py-1 border border-gray-200 dark:border-gray-600 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">بسته</label>
                        <input
                          type="time"
                          value={settings.businessHours[day.key as keyof typeof settings.businessHours].close}
                          onChange={(e) => updateBusinessHours(day.key, 'close', e.target.value)}
                          disabled={!settings.businessHours[day.key as keyof typeof settings.businessHours].isOpen}
                          className="px-3 py-1 border border-gray-200 dark:border-gray-600 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Financial Tab */}
          {activeTab === 'financial' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">تنظیمات مالی</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    ارز
                  </label>
                  <select
                    value={settings.financial.currency}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      financial: { ...prev.financial, currency: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="IRR">ریال ایران</option>
                    <option value="USD">دلار آمریکا</option>
                    <option value="EUR">یورو</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    نرخ مالیات (%)
                  </label>
                  <input
                    type="number"
                    value={settings.financial.taxRate}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      financial: { ...prev.financial, taxRate: Number(e.target.value) }
                    }))}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    حق سرویس (%)
                  </label>
                  <input
                    type="number"
                    value={settings.financial.serviceCharge}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      financial: { ...prev.financial, serviceCharge: Number(e.target.value) }
                    }))}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    حد مجاز تخفیف (%)
                  </label>
                  <input
                    type="number"
                    value={settings.financial.discountLimit}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      financial: { ...prev.financial, discountLimit: Number(e.target.value) }
                    }))}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    حداقل سفارش (تومان)
                  </label>
                  <input
                    type="number"
                    value={settings.financial.minimumOrder}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      financial: { ...prev.financial, minimumOrder: Number(e.target.value) }
                    }))}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <span className="flex items-center space-x-2 space-x-reverse">
                      <span>درصد تخفیف مشتریان طلایی</span>
                      <div title="تخفیف خودکار برای مشتریانی که به عنوان طلایی ثبت شده‌اند">
                        <Info className="w-4 h-4 text-gray-400" />
                      </div>
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={settings.financial.goldenCustomerDiscount || 2}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        financial: { ...prev.financial, goldenCustomerDiscount: Number(e.target.value) }
                      }))}
                      className="w-full px-3 py-2 pr-8 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">%</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    این تخفیف به صورت خودکار برای مشتریان طلایی در هنگام ثبت سفارش اعمال می‌شود
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* POS Tab */}
          {activeTab === 'pos' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">تنظیمات سیستم فروش</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    چاپگر فاکتور
                  </label>
                  <input
                    type="text"
                    value={settings.pos.receiptPrinter}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      pos: { ...prev.pos, receiptPrinter: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    چاپگر آشپزخانه
                  </label>
                  <input
                    type="text"
                    value={settings.pos.kitchenPrinter}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      pos: { ...prev.pos, kitchenPrinter: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    کش صندوق
                  </label>
                  <input
                    type="text"
                    value={settings.pos.cashDrawer}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      pos: { ...prev.pos, cashDrawer: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    اسکنر بارکد
                  </label>
                  <input
                    type="text"
                    value={settings.pos.barcodeScanner}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      pos: { ...prev.pos, barcodeScanner: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    نمایشگر مشتری
                  </label>
                  <input
                    type="text"
                    value={settings.pos.customerDisplay}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      pos: { ...prev.pos, customerDisplay: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">تنظیمات اعلان‌ها</h2>
              <div className="space-y-4">
                {Object.entries(settings.notifications).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {key === 'email' ? 'اعلان ایمیل' :
                         key === 'sms' ? 'اعلان پیامک' :
                         key === 'push' ? 'اعلان پوش' :
                         key === 'lowStock' ? 'موجودی کم' :
                         key === 'newOrder' ? 'سفارش جدید' :
                         'دریافت پرداخت'}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {key === 'email' ? 'ارسال اعلان‌ها از طریق ایمیل' :
                         key === 'sms' ? 'ارسال اعلان‌ها از طریق پیامک' :
                         key === 'push' ? 'ارسال اعلان‌های پوش' :
                         key === 'lowStock' ? 'اعلان هنگام کمبود موجودی' :
                         key === 'newOrder' ? 'اعلان هنگام دریافت سفارش جدید' :
                         'اعلان هنگام دریافت پرداخت'}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => updateNotification(key, e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">تنظیمات امنیت</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    نیاز به رمز عبور
                  </label>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.security.requirePassword}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        security: { ...prev.security, requirePassword: e.target.checked }
                      }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    زمان انقضای جلسه (دقیقه)
                  </label>
                  <input
                    type="number"
                    value={settings.security.sessionTimeout}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      security: { ...prev.security, sessionTimeout: Number(e.target.value) }
                    }))}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    فرکانس پشتیبان‌گیری
                  </label>
                  <select
                    value={settings.security.backupFrequency}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      security: { ...prev.security, backupFrequency: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="daily">روزانه</option>
                    <option value="weekly">هفتگی</option>
                    <option value="monthly">ماهانه</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    نگهداری داده‌ها (روز)
                  </label>
                  <input
                    type="number"
                    value={settings.security.dataRetention}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      security: { ...prev.security, dataRetention: Number(e.target.value) }
                    }))}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Integrations Tab */}
          {activeTab === 'integrations' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">یکپارچه‌سازی</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    درگاه پرداخت
                  </label>
                  <select
                    value={settings.integrations.paymentGateway}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      integrations: { ...prev.integrations, paymentGateway: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="ZarinPal">زرین‌پال</option>
                    <option value="Payir">پی‌ایر</option>
                    <option value="IDPay">آیدی‌پی</option>
                    <option value="Parsian">پارسیان</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    سرویس ارسال
                  </label>
                  <select
                    value={settings.integrations.deliveryService}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      integrations: { ...prev.integrations, deliveryService: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="SnappFood">اسنپ‌فود</option>
                    <option value="ZoodFood">زودفود</option>
                    <option value="Divar">دیوار</option>
                    <option value="Custom">سفارشی</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    نرم‌افزار حسابداری
                  </label>
                  <select
                    value={settings.integrations.accountingSoftware}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      integrations: { ...prev.integrations, accountingSoftware: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="پارسیان">پارسیان</option>
                    <option value="همکاران">همکاران</option>
                    <option value="رایان‌پرداز">رایان‌پرداز</option>
                    <option value="سپیدار">سپیدار</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    سیستم انبار
                  </label>
                  <select
                    value={settings.integrations.inventorySystem}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      integrations: { ...prev.integrations, inventorySystem: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="انبار آنلاین">انبار آنلاین</option>
                    <option value="انبار هوشمند">انبار هوشمند</option>
                    <option value="انبار پیشرفته">انبار پیشرفته</option>
                    <option value="انبار ساده">انبار ساده</option>
                  </select>
                </div>
              </div>
            </div>
          )}
            </>
          )}
          
          {/* Save Button */}
          <div className="flex items-center justify-end space-x-3 space-x-reverse mt-8 pt-6 border-t border-gray-200 dark:border-gray-600/30">
            {loading ? (
              <div className="flex items-center space-x-2 space-x-reverse text-gray-600 dark:text-gray-400">
                <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                <span>در حال بارگذاری...</span>
              </div>
            ) : (
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center space-x-2 space-x-reverse px-6 py-3 bg-gradient-to-r from-primary-600 to-purple-600 text-white rounded-lg hover:from-primary-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>در حال ذخیره...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>ذخیره تنظیمات</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}