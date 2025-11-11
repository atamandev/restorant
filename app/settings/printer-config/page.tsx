'use client'

import { useState, useEffect } from 'react'
import {
  Printer,
  Save,
  RefreshCw,
  Settings,
  FileText,
  Image as ImageIcon,
  Calendar,
  Clock,
  DollarSign,
  ShoppingCart,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2
} from 'lucide-react'

interface PrinterConfig {
  printer: {
    enabled: boolean
    paperSize: string
    fontSize: number
    fontFamily: string
    margin: number
    header: {
      show: boolean
      title: string
      showLogo: boolean
      logoUrl: string
      showDate: boolean
      showTime: boolean
    }
    footer: {
      show: boolean
      text: string
      showDate: boolean
    }
    items: {
      showNotes: boolean
      showImage: boolean
      columns: string[]
    }
    summary: {
      showSubtotal: boolean
      showTax: boolean
      showServiceCharge: boolean
      showDiscount: boolean
      showTotal: boolean
    }
  }
  laser: {
    enabled: boolean
    paperSize: string
    fontSize: number
    fontFamily: string
    margin: number
    header: {
      show: boolean
      title: string
      showLogo: boolean
      logoUrl: string
      showDate: boolean
      showTime: boolean
    }
    footer: {
      show: boolean
      text: string
      showDate: boolean
    }
    items: {
      showNotes: boolean
      showImage: boolean
      columns: string[]
    }
    summary: {
      showSubtotal: boolean
      showTax: boolean
      showServiceCharge: boolean
      showDiscount: boolean
      showTotal: boolean
    }
  }
  general: {
    autoPrint: boolean
    showPrintDialog: boolean
    copies: number
    orientation: 'portrait' | 'landscape'
  }
}

export default function PrinterConfigPage() {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [config, setConfig] = useState<PrinterConfig | null>(null)
  const [activeTab, setActiveTab] = useState<'printer' | 'laser' | 'general'>('printer')
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/printer-config')
      const result = await response.json()
      
      if (result.success) {
        setConfig(result.data)
      } else {
        setMessage({ type: 'error', text: result.message || 'خطا در بارگذاری تنظیمات' })
      }
    } catch (error) {
      console.error('Error loading config:', error)
      setMessage({ type: 'error', text: 'خطا در بارگذاری تنظیمات' })
    } finally {
      setLoading(false)
    }
  }

  const saveConfig = async () => {
    if (!config) return
    
    try {
      setSaving(true)
      const response = await fetch('/api/printer-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(config)
      })
      
      const result = await response.json()
      
      if (result.success) {
        setMessage({ type: 'success', text: 'تنظیمات با موفقیت ذخیره شد' })
        setTimeout(() => setMessage(null), 3000)
      } else {
        setMessage({ type: 'error', text: result.message || 'خطا در ذخیره تنظیمات' })
      }
    } catch (error) {
      console.error('Error saving config:', error)
      setMessage({ type: 'error', text: 'خطا در ذخیره تنظیمات' })
    } finally {
      setSaving(false)
    }
  }

  const updateConfig = (path: string, value: any) => {
    if (!config) return
    
    const keys = path.split('.')
    const newConfig = { ...config }
    let current: any = newConfig
    
    for (let i = 0; i < keys.length - 1; i++) {
      current[keys[i]] = { ...current[keys[i]] }
      current = current[keys[i]]
    }
    
    current[keys[keys.length - 1]] = value
    setConfig(newConfig)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (!config) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">خطا در بارگذاری تنظیمات</p>
          <button
            onClick={loadConfig}
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            تلاش مجدد
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3 space-x-reverse">
              <Printer className="w-8 h-8 text-primary-600" />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                تنظیمات چاپگر
              </h1>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <button
                onClick={loadConfig}
                disabled={loading}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center space-x-2 space-x-reverse"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>بارگذاری مجدد</span>
              </button>
              <button
                onClick={saveConfig}
                disabled={saving}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2 space-x-reverse disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>ذخیره تنظیمات</span>
              </button>
            </div>
          </div>
          
          {message && (
            <div className={`p-4 rounded-lg flex items-center space-x-2 space-x-reverse ${
              message.type === 'success' 
                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
                : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <XCircle className="w-5 h-5" />
              )}
              <span>{message.text}</span>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('printer')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'printer'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              چاپگر حرارتی (80mm)
            </button>
            <button
              onClick={() => setActiveTab('laser')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'laser'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              چاپگر لیزری (A4)
            </button>
            <button
              onClick={() => setActiveTab('general')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'general'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              تنظیمات عمومی
            </button>
          </div>
        </div>

        {/* Printer Config */}
        {activeTab === 'printer' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-6">
            {/* Enable/Disable */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">فعال‌سازی چاپگر حرارتی</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">فعال یا غیرفعال کردن چاپگر حرارتی</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer group">
                <input
                  type="checkbox"
                  checked={config.printer.enabled}
                  onChange={(e) => updateConfig('printer.enabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="relative w-14 h-8 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded-full peer peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-offset-2 peer-focus:ring-primary-500 dark:peer-focus:ring-primary-400 transition-all duration-300 ease-in-out peer-checked:bg-gradient-to-br peer-checked:from-primary-500 peer-checked:to-primary-600 dark:peer-checked:from-primary-600 dark:peer-checked:to-primary-700 shadow-lg peer-checked:shadow-primary-500/50">
                  <span className="absolute top-1 right-1 bg-white dark:bg-gray-100 rounded-full h-6 w-6 shadow-lg transform transition-all duration-300 ease-in-out peer-checked:translate-x-[-24px] flex items-center justify-center">
                    <span className={`w-2 h-2 rounded-full transition-all duration-300 ${config.printer.enabled ? 'bg-primary-600 dark:bg-primary-500' : 'bg-gray-400 dark:bg-gray-500'}`}></span>
                  </span>
                </div>
              </label>
            </div>

            {/* Basic Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  اندازه کاغذ
                </label>
                <select
                  value={config.printer.paperSize}
                  onChange={(e) => updateConfig('printer.paperSize', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="80mm">80mm (حرارتی)</option>
                  <option value="58mm">58mm (کوچک)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  اندازه فونت
                </label>
                <input
                  type="number"
                  value={config.printer.fontSize}
                  onChange={(e) => updateConfig('printer.fontSize', parseInt(e.target.value))}
                  min="8"
                  max="14"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  فونت
                </label>
                <select
                  value={config.printer.fontFamily}
                  onChange={(e) => updateConfig('printer.fontFamily', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="Tahoma, Arial, sans-serif">Tahoma</option>
                  <option value="Arial, sans-serif">Arial</option>
                  <option value="'Times New Roman', serif">Times New Roman</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  حاشیه (mm)
                </label>
                <input
                  type="number"
                  value={config.printer.margin}
                  onChange={(e) => updateConfig('printer.margin', parseInt(e.target.value))}
                  min="0"
                  max="20"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            {/* Header Settings */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2 space-x-reverse">
                <FileText className="w-5 h-5" />
                <span>تنظیمات هدر</span>
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">نمایش هدر</span>
                  <label className="relative inline-flex items-center cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={config.printer.header.show}
                      onChange={(e) => updateConfig('printer.header.show', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="relative w-14 h-8 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded-full peer peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-offset-2 peer-focus:ring-primary-500 dark:peer-focus:ring-primary-400 transition-all duration-300 ease-in-out peer-checked:bg-gradient-to-br peer-checked:from-primary-500 peer-checked:to-primary-600 dark:peer-checked:from-primary-600 dark:peer-checked:to-primary-700 shadow-lg peer-checked:shadow-primary-500/50">
                      <span className="absolute top-1 right-1 bg-white dark:bg-gray-100 rounded-full h-6 w-6 shadow-lg transform transition-all duration-300 ease-in-out peer-checked:translate-x-[-24px] flex items-center justify-center">
                        <span className={`w-2 h-2 rounded-full transition-all duration-300 ${config.printer.header.show ? 'bg-primary-600 dark:bg-primary-500' : 'bg-gray-400 dark:bg-gray-500'}`}></span>
                      </span>
                    </div>
                  </label>
                </div>

                {config.printer.header.show && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        عنوان هدر
                      </label>
                      <input
                        type="text"
                        value={config.printer.header.title}
                        onChange={(e) => updateConfig('printer.header.title', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700 dark:text-gray-300">نمایش تاریخ</span>
                      <label className="relative inline-flex items-center cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={config.printer.header.showDate}
                          onChange={(e) => updateConfig('printer.header.showDate', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="relative w-14 h-8 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded-full peer peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-offset-2 peer-focus:ring-primary-500 dark:peer-focus:ring-primary-400 transition-all duration-300 ease-in-out peer-checked:bg-gradient-to-br peer-checked:from-primary-500 peer-checked:to-primary-600 dark:peer-checked:from-primary-600 dark:peer-checked:to-primary-700 shadow-lg peer-checked:shadow-primary-500/50">
                          <span className="absolute top-1 right-1 bg-white dark:bg-gray-100 rounded-full h-6 w-6 shadow-lg transform transition-all duration-300 ease-in-out peer-checked:translate-x-[-24px] flex items-center justify-center">
                            <span className={`w-2 h-2 rounded-full transition-all duration-300 ${config.printer.header.showDate ? 'bg-primary-600 dark:bg-primary-500' : 'bg-gray-400 dark:bg-gray-500'}`}></span>
                          </span>
                        </div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700 dark:text-gray-300">نمایش زمان</span>
                      <label className="relative inline-flex items-center cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={config.printer.header.showTime}
                          onChange={(e) => updateConfig('printer.header.showTime', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="relative w-14 h-8 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded-full peer peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-offset-2 peer-focus:ring-primary-500 dark:peer-focus:ring-primary-400 transition-all duration-300 ease-in-out peer-checked:bg-gradient-to-br peer-checked:from-primary-500 peer-checked:to-primary-600 dark:peer-checked:from-primary-600 dark:peer-checked:to-primary-700 shadow-lg peer-checked:shadow-primary-500/50">
                          <span className="absolute top-1 right-1 bg-white dark:bg-gray-100 rounded-full h-6 w-6 shadow-lg transform transition-all duration-300 ease-in-out peer-checked:translate-x-[-24px] flex items-center justify-center">
                            <span className={`w-2 h-2 rounded-full transition-all duration-300 ${config.printer.header.showTime ? 'bg-primary-600 dark:bg-primary-500' : 'bg-gray-400 dark:bg-gray-500'}`}></span>
                          </span>
                        </div>
                      </label>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Footer Settings */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2 space-x-reverse">
                <FileText className="w-5 h-5" />
                <span>تنظیمات فوتر</span>
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">نمایش فوتر</span>
                  <label className="relative inline-flex items-center cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={config.printer.footer.show}
                      onChange={(e) => updateConfig('printer.footer.show', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="relative w-14 h-8 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded-full peer peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-offset-2 peer-focus:ring-primary-500 dark:peer-focus:ring-primary-400 transition-all duration-300 ease-in-out peer-checked:bg-gradient-to-br peer-checked:from-primary-500 peer-checked:to-primary-600 dark:peer-checked:from-primary-600 dark:peer-checked:to-primary-700 shadow-lg peer-checked:shadow-primary-500/50">
                      <span className="absolute top-1 right-1 bg-white dark:bg-gray-100 rounded-full h-6 w-6 shadow-lg transform transition-all duration-300 ease-in-out peer-checked:translate-x-[-24px] flex items-center justify-center">
                        <span className={`w-2 h-2 rounded-full transition-all duration-300 ${config.printer.footer.show ? 'bg-primary-600 dark:bg-primary-500' : 'bg-gray-400 dark:bg-gray-500'}`}></span>
                      </span>
                    </div>
                  </label>
                </div>

                {config.printer.footer.show && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        متن فوتر
                      </label>
                      <input
                        type="text"
                        value={config.printer.footer.text}
                        onChange={(e) => updateConfig('printer.footer.text', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700 dark:text-gray-300">نمایش تاریخ در فوتر</span>
                      <label className="relative inline-flex items-center cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={config.printer.footer.showDate}
                          onChange={(e) => updateConfig('printer.footer.showDate', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="relative w-14 h-8 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded-full peer peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-offset-2 peer-focus:ring-primary-500 dark:peer-focus:ring-primary-400 transition-all duration-300 ease-in-out peer-checked:bg-gradient-to-br peer-checked:from-primary-500 peer-checked:to-primary-600 dark:peer-checked:from-primary-600 dark:peer-checked:to-primary-700 shadow-lg peer-checked:shadow-primary-500/50">
                          <span className="absolute top-1 right-1 bg-white dark:bg-gray-100 rounded-full h-6 w-6 shadow-lg transform transition-all duration-300 ease-in-out peer-checked:translate-x-[-24px] flex items-center justify-center">
                            <span className={`w-2 h-2 rounded-full transition-all duration-300 ${config.printer.footer.showDate ? 'bg-primary-600 dark:bg-primary-500' : 'bg-gray-400 dark:bg-gray-500'}`}></span>
                          </span>
                        </div>
                      </label>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Summary Settings */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2 space-x-reverse">
                <DollarSign className="w-5 h-5" />
                <span>تنظیمات خلاصه</span>
              </h3>
              
              <div className="space-y-3">
                {Object.entries(config.printer.summary).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {key === 'showSubtotal' && 'نمایش زیرمجموع'}
                      {key === 'showTax' && 'نمایش مالیات'}
                      {key === 'showServiceCharge' && 'نمایش کارمزد سرویس'}
                      {key === 'showDiscount' && 'نمایش تخفیف'}
                      {key === 'showTotal' && 'نمایش مبلغ کل'}
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={value as boolean}
                        onChange={(e) => updateConfig(`printer.summary.${key}`, e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="relative w-14 h-8 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded-full peer peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-offset-2 peer-focus:ring-primary-500 dark:peer-focus:ring-primary-400 transition-all duration-300 ease-in-out peer-checked:bg-gradient-to-br peer-checked:from-primary-500 peer-checked:to-primary-600 dark:peer-checked:from-primary-600 dark:peer-checked:to-primary-700 shadow-lg peer-checked:shadow-primary-500/50">
                        <span className="absolute top-1 right-1 bg-white dark:bg-gray-100 rounded-full h-6 w-6 shadow-lg transform transition-all duration-300 ease-in-out peer-checked:translate-x-[-24px] flex items-center justify-center">
                          <span className={`w-2 h-2 rounded-full transition-all duration-300 ${value ? 'bg-primary-600 dark:bg-primary-500' : 'bg-gray-400 dark:bg-gray-500'}`}></span>
                        </span>
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Laser Config - Similar structure but for A4 */}
        {activeTab === 'laser' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-6">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">فعال‌سازی چاپگر لیزری</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">فعال یا غیرفعال کردن چاپگر لیزری</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer group">
                <input
                  type="checkbox"
                  checked={config.laser.enabled}
                  onChange={(e) => updateConfig('laser.enabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="relative w-14 h-8 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded-full peer peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-offset-2 peer-focus:ring-primary-500 dark:peer-focus:ring-primary-400 transition-all duration-300 ease-in-out peer-checked:bg-gradient-to-br peer-checked:from-primary-500 peer-checked:to-primary-600 dark:peer-checked:from-primary-600 dark:peer-checked:to-primary-700 shadow-lg peer-checked:shadow-primary-500/50">
                  <span className="absolute top-1 right-1 bg-white dark:bg-gray-100 rounded-full h-6 w-6 shadow-lg transform transition-all duration-300 ease-in-out peer-checked:-translate-x-6 peer-checked:right-auto peer-checked:left-1 flex items-center justify-center">
                    <span className={`w-2 h-2 rounded-full transition-all duration-300 ${config.laser.enabled ? 'bg-primary-600 dark:bg-primary-500' : 'bg-gray-400 dark:bg-gray-500'}`}></span>
                  </span>
                </div>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  اندازه کاغذ
                </label>
                <select
                  value={config.laser.paperSize}
                  onChange={(e) => updateConfig('laser.paperSize', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="A4">A4</option>
                  <option value="A5">A5</option>
                  <option value="Letter">Letter</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  اندازه فونت
                </label>
                <input
                  type="number"
                  value={config.laser.fontSize}
                  onChange={(e) => updateConfig('laser.fontSize', parseInt(e.target.value))}
                  min="10"
                  max="16"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  فونت
                </label>
                <select
                  value={config.laser.fontFamily}
                  onChange={(e) => updateConfig('laser.fontFamily', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="Tahoma, Arial, sans-serif">Tahoma</option>
                  <option value="Arial, sans-serif">Arial</option>
                  <option value="'Times New Roman', serif">Times New Roman</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  حاشیه (mm)
                </label>
                <input
                  type="number"
                  value={config.laser.margin}
                  onChange={(e) => updateConfig('laser.margin', parseInt(e.target.value))}
                  min="5"
                  max="30"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            {/* Header Settings */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2 space-x-reverse">
                <FileText className="w-5 h-5" />
                <span>تنظیمات هدر</span>
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">نمایش هدر</span>
                  <label className="relative inline-flex items-center cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={config.laser.header.show}
                      onChange={(e) => updateConfig('laser.header.show', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="relative w-14 h-8 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded-full peer peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-offset-2 peer-focus:ring-primary-500 dark:peer-focus:ring-primary-400 transition-all duration-300 ease-in-out peer-checked:bg-gradient-to-br peer-checked:from-primary-500 peer-checked:to-primary-600 dark:peer-checked:from-primary-600 dark:peer-checked:to-primary-700 shadow-lg peer-checked:shadow-primary-500/50">
                      <span className="absolute top-1 right-1 bg-white dark:bg-gray-100 rounded-full h-6 w-6 shadow-lg transform transition-all duration-300 ease-in-out peer-checked:translate-x-[-24px] flex items-center justify-center">
                        <span className={`w-2 h-2 rounded-full transition-all duration-300 ${config.laser.header.show ? 'bg-primary-600 dark:bg-primary-500' : 'bg-gray-400 dark:bg-gray-500'}`}></span>
                      </span>
                    </div>
                  </label>
                </div>

                {config.laser.header.show && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        عنوان هدر
                      </label>
                      <input
                        type="text"
                        value={config.laser.header.title}
                        onChange={(e) => updateConfig('laser.header.title', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700 dark:text-gray-300">نمایش تاریخ</span>
                      <label className="relative inline-flex items-center cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={config.laser.header.showDate}
                          onChange={(e) => updateConfig('laser.header.showDate', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="relative w-14 h-8 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded-full peer peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-offset-2 peer-focus:ring-primary-500 dark:peer-focus:ring-primary-400 transition-all duration-300 ease-in-out peer-checked:bg-gradient-to-br peer-checked:from-primary-500 peer-checked:to-primary-600 dark:peer-checked:from-primary-600 dark:peer-checked:to-primary-700 shadow-lg peer-checked:shadow-primary-500/50">
                          <span className="absolute top-1 right-1 bg-white dark:bg-gray-100 rounded-full h-6 w-6 shadow-lg transform transition-all duration-300 ease-in-out peer-checked:translate-x-[-24px] flex items-center justify-center">
                            <span className={`w-2 h-2 rounded-full transition-all duration-300 ${config.laser.header.showDate ? 'bg-primary-600 dark:bg-primary-500' : 'bg-gray-400 dark:bg-gray-500'}`}></span>
                          </span>
                        </div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700 dark:text-gray-300">نمایش زمان</span>
                      <label className="relative inline-flex items-center cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={config.laser.header.showTime}
                          onChange={(e) => updateConfig('laser.header.showTime', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="relative w-14 h-8 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded-full peer peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-offset-2 peer-focus:ring-primary-500 dark:peer-focus:ring-primary-400 transition-all duration-300 ease-in-out peer-checked:bg-gradient-to-br peer-checked:from-primary-500 peer-checked:to-primary-600 dark:peer-checked:from-primary-600 dark:peer-checked:to-primary-700 shadow-lg peer-checked:shadow-primary-500/50">
                          <span className="absolute top-1 right-1 bg-white dark:bg-gray-100 rounded-full h-6 w-6 shadow-lg transform transition-all duration-300 ease-in-out peer-checked:translate-x-[-24px] flex items-center justify-center">
                            <span className={`w-2 h-2 rounded-full transition-all duration-300 ${config.laser.header.showTime ? 'bg-primary-600 dark:bg-primary-500' : 'bg-gray-400 dark:bg-gray-500'}`}></span>
                          </span>
                        </div>
                      </label>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Footer Settings */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2 space-x-reverse">
                <FileText className="w-5 h-5" />
                <span>تنظیمات فوتر</span>
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">نمایش فوتر</span>
                  <label className="relative inline-flex items-center cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={config.laser.footer.show}
                      onChange={(e) => updateConfig('laser.footer.show', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="relative w-14 h-8 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded-full peer peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-offset-2 peer-focus:ring-primary-500 dark:peer-focus:ring-primary-400 transition-all duration-300 ease-in-out peer-checked:bg-gradient-to-br peer-checked:from-primary-500 peer-checked:to-primary-600 dark:peer-checked:from-primary-600 dark:peer-checked:to-primary-700 shadow-lg peer-checked:shadow-primary-500/50">
                      <span className="absolute top-1 right-1 bg-white dark:bg-gray-100 rounded-full h-6 w-6 shadow-lg transform transition-all duration-300 ease-in-out peer-checked:translate-x-[-24px] flex items-center justify-center">
                        <span className={`w-2 h-2 rounded-full transition-all duration-300 ${config.laser.footer.show ? 'bg-primary-600 dark:bg-primary-500' : 'bg-gray-400 dark:bg-gray-500'}`}></span>
                      </span>
                    </div>
                  </label>
                </div>

                {config.laser.footer.show && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        متن فوتر
                      </label>
                      <input
                        type="text"
                        value={config.laser.footer.text}
                        onChange={(e) => updateConfig('laser.footer.text', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700 dark:text-gray-300">نمایش تاریخ در فوتر</span>
                      <label className="relative inline-flex items-center cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={config.laser.footer.showDate}
                          onChange={(e) => updateConfig('laser.footer.showDate', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="relative w-14 h-8 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded-full peer peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-offset-2 peer-focus:ring-primary-500 dark:peer-focus:ring-primary-400 transition-all duration-300 ease-in-out peer-checked:bg-gradient-to-br peer-checked:from-primary-500 peer-checked:to-primary-600 dark:peer-checked:from-primary-600 dark:peer-checked:to-primary-700 shadow-lg peer-checked:shadow-primary-500/50">
                          <span className="absolute top-1 right-1 bg-white dark:bg-gray-100 rounded-full h-6 w-6 shadow-lg transform transition-all duration-300 ease-in-out peer-checked:translate-x-[-24px] flex items-center justify-center">
                            <span className={`w-2 h-2 rounded-full transition-all duration-300 ${config.laser.footer.showDate ? 'bg-primary-600 dark:bg-primary-500' : 'bg-gray-400 dark:bg-gray-500'}`}></span>
                          </span>
                        </div>
                      </label>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Summary Settings */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2 space-x-reverse">
                <DollarSign className="w-5 h-5" />
                <span>تنظیمات خلاصه</span>
              </h3>
              
              <div className="space-y-3">
                {Object.entries(config.laser.summary).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {key === 'showSubtotal' && 'نمایش زیرمجموع'}
                      {key === 'showTax' && 'نمایش مالیات'}
                      {key === 'showServiceCharge' && 'نمایش کارمزد سرویس'}
                      {key === 'showDiscount' && 'نمایش تخفیف'}
                      {key === 'showTotal' && 'نمایش مبلغ کل'}
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={value as boolean}
                        onChange={(e) => updateConfig(`laser.summary.${key}`, e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="relative w-14 h-8 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded-full peer peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-offset-2 peer-focus:ring-primary-500 dark:peer-focus:ring-primary-400 transition-all duration-300 ease-in-out peer-checked:bg-gradient-to-br peer-checked:from-primary-500 peer-checked:to-primary-600 dark:peer-checked:from-primary-600 dark:peer-checked:to-primary-700 shadow-lg peer-checked:shadow-primary-500/50">
                        <span className="absolute top-1 right-1 bg-white dark:bg-gray-100 rounded-full h-6 w-6 shadow-lg transform transition-all duration-300 ease-in-out peer-checked:translate-x-[-24px] flex items-center justify-center">
                          <span className={`w-2 h-2 rounded-full transition-all duration-300 ${value ? 'bg-primary-600 dark:bg-primary-500' : 'bg-gray-400 dark:bg-gray-500'}`}></span>
                        </span>
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* General Settings */}
        {activeTab === 'general' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">چاپ خودکار</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">چاپ خودکار پس از ثبت سفارش</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={config.general.autoPrint}
                    onChange={(e) => updateConfig('general.autoPrint', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="relative w-14 h-8 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded-full peer peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-offset-2 peer-focus:ring-primary-500 dark:peer-focus:ring-primary-400 transition-all duration-300 ease-in-out peer-checked:bg-gradient-to-br peer-checked:from-primary-500 peer-checked:to-primary-600 dark:peer-checked:from-primary-600 dark:peer-checked:to-primary-700 shadow-lg peer-checked:shadow-primary-500/50">
                    <span className="absolute top-1 right-1 bg-white dark:bg-gray-100 rounded-full h-6 w-6 shadow-lg transform transition-all duration-300 ease-in-out peer-checked:-translate-x-6 peer-checked:right-auto peer-checked:left-1 flex items-center justify-center">
                      <span className={`w-2 h-2 rounded-full transition-all duration-300 ${config.general.autoPrint ? 'bg-primary-600 dark:bg-primary-500' : 'bg-gray-400 dark:bg-gray-500'}`}></span>
                    </span>
                  </div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">نمایش دیالوگ چاپ</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">نمایش دیالوگ انتخاب چاپگر</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={config.general.showPrintDialog}
                    onChange={(e) => updateConfig('general.showPrintDialog', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="relative w-14 h-8 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded-full peer peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-offset-2 peer-focus:ring-primary-500 dark:peer-focus:ring-primary-400 transition-all duration-300 ease-in-out peer-checked:bg-gradient-to-br peer-checked:from-primary-500 peer-checked:to-primary-600 dark:peer-checked:from-primary-600 dark:peer-checked:to-primary-700 shadow-lg peer-checked:shadow-primary-500/50">
                    <span className="absolute top-1 right-1 bg-white dark:bg-gray-100 rounded-full h-6 w-6 shadow-lg transform transition-all duration-300 ease-in-out peer-checked:-translate-x-6 peer-checked:right-auto peer-checked:left-1 flex items-center justify-center">
                      <span className={`w-2 h-2 rounded-full transition-all duration-300 ${config.general.showPrintDialog ? 'bg-primary-600 dark:bg-primary-500' : 'bg-gray-400 dark:bg-gray-500'}`}></span>
                    </span>
                  </div>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  تعداد کپی
                </label>
                <input
                  type="number"
                  value={config.general.copies}
                  onChange={(e) => updateConfig('general.copies', parseInt(e.target.value))}
                  min="1"
                  max="10"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  جهت کاغذ
                </label>
                <select
                  value={config.general.orientation}
                  onChange={(e) => updateConfig('general.orientation', e.target.value as 'portrait' | 'landscape')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="portrait">عمودی</option>
                  <option value="landscape">افقی</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
