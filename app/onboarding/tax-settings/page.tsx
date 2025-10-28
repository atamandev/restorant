'use client'

import { useState, useEffect } from 'react'
import { 
  Calculator, 
  Percent, 
  DollarSign, 
  CreditCard, 
  Receipt,
  Plus,
  Edit,
  Trash2,
  Save,
  CheckCircle,
  AlertCircle,
  Info,
  Loader2
} from 'lucide-react'

interface TaxRate {
  _id?: string
  id?: string
  name: string
  rate: number
  type: 'percentage' | 'fixed'
  description: string
  isActive: boolean
  appliesTo: string[]
  createdAt?: string
  updatedAt?: string
}

interface FeeRate {
  _id?: string
  id?: string
  name: string
  rate: number
  type: 'percentage' | 'fixed'
  description: string
  isActive: boolean
  appliesTo: string[]
  createdAt?: string
  updatedAt?: string
}

export default function TaxSettingsPage() {
  const [taxRates, setTaxRates] = useState<TaxRate[]>([])
  const [feeRates, setFeeRates] = useState<FeeRate[]>([])
  const [showTaxForm, setShowTaxForm] = useState(false)
  const [showFeeForm, setShowFeeForm] = useState(false)
  const [editingTax, setEditingTax] = useState<TaxRate | null>(null)
  const [editingFee, setEditingFee] = useState<FeeRate | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [taxForm, setTaxForm] = useState({
    name: '',
    rate: 0,
    type: 'percentage' as 'percentage' | 'fixed',
    description: '',
    isActive: true,
    appliesTo: [] as string[]
  })

  const [feeForm, setFeeForm] = useState({
    name: '',
    rate: 0,
    type: 'percentage' as 'percentage' | 'fixed',
    description: '',
    isActive: true,
    appliesTo: [] as string[]
  })

  // دریافت لیست نرخ‌های مالیات
  const fetchTaxRates = async () => {
    try {
      const response = await fetch('/api/tax-rates')
      const data = await response.json()
      
      if (data.success) {
        setTaxRates(data.data)
      } else {
        setError(data.message || 'خطا در دریافت لیست نرخ‌های مالیات')
      }
    } catch (error) {
      console.error('Error fetching tax rates:', error)
      setError('خطا در اتصال به سرور')
    }
  }

  // دریافت لیست نرخ‌های کارمزد
  const fetchFeeRates = async () => {
    try {
      const response = await fetch('/api/fee-rates')
      const data = await response.json()
      
      if (data.success) {
        setFeeRates(data.data)
      } else {
        setError(data.message || 'خطا در دریافت لیست نرخ‌های کارمزد')
      }
    } catch (error) {
      console.error('Error fetching fee rates:', error)
      setError('خطا در اتصال به سرور')
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([fetchTaxRates(), fetchFeeRates()])
      setLoading(false)
    }
    loadData()
  }, [])

  const handleSaveTax = async () => {
    try {
      setSaving(true)
      setError('')

      const url = '/api/tax-rates'
      const method = editingTax ? 'PUT' : 'POST'
      
      const requestBody = editingTax 
        ? { id: editingTax._id || editingTax.id, ...taxForm }
        : taxForm

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      const data = await response.json()

      if (data.success) {
        await fetchTaxRates() // دریافت مجدد لیست
        setShowTaxForm(false)
        setEditingTax(null)
        setTaxForm({
          name: '',
          rate: 0,
          type: 'percentage',
          description: '',
          isActive: true,
          appliesTo: []
        })
      } else {
        setError(data.message || 'خطا در ذخیره نرخ مالیات')
      }
    } catch (error) {
      console.error('Error saving tax rate:', error)
      setError('خطا در اتصال به سرور')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveFee = async () => {
    try {
      setSaving(true)
      setError('')

      const url = '/api/fee-rates'
      const method = editingFee ? 'PUT' : 'POST'
      
      const requestBody = editingFee 
        ? { id: editingFee._id || editingFee.id, ...feeForm }
        : feeForm

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      const data = await response.json()

      if (data.success) {
        await fetchFeeRates() // دریافت مجدد لیست
        setShowFeeForm(false)
        setEditingFee(null)
        setFeeForm({
          name: '',
          rate: 0,
          type: 'percentage',
          description: '',
          isActive: true,
          appliesTo: []
        })
      } else {
        setError(data.message || 'خطا در ذخیره نرخ کارمزد')
      }
    } catch (error) {
      console.error('Error saving fee rate:', error)
      setError('خطا در اتصال به سرور')
    } finally {
      setSaving(false)
    }
  }

  const deleteTax = async (id: string) => {
    if (!confirm('آیا از حذف این نرخ مالیات اطمینان دارید؟')) return

    try {
      setSaving(true)
      const response = await fetch(`/api/tax-rates?id=${id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        await fetchTaxRates() // دریافت مجدد لیست
      } else {
        setError(data.message || 'خطا در حذف نرخ مالیات')
      }
    } catch (error) {
      console.error('Error deleting tax rate:', error)
      setError('خطا در اتصال به سرور')
    } finally {
      setSaving(false)
    }
  }

  const deleteFee = async (id: string) => {
    if (!confirm('آیا از حذف این نرخ کارمزد اطمینان دارید؟')) return

    try {
      setSaving(true)
      const response = await fetch(`/api/fee-rates?id=${id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        await fetchFeeRates() // دریافت مجدد لیست
      } else {
        setError(data.message || 'خطا در حذف نرخ کارمزد')
      }
    } catch (error) {
      console.error('Error deleting fee rate:', error)
      setError('خطا در اتصال به سرور')
    } finally {
      setSaving(false)
    }
  }

  const toggleTaxActive = async (tax: TaxRate) => {
    try {
      setSaving(true)
      const response = await fetch('/api/tax-rates', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: tax._id || tax.id,
          isActive: !tax.isActive
        }),
      })

      const data = await response.json()

      if (data.success) {
        await fetchTaxRates() // دریافت مجدد لیست
      } else {
        setError(data.message || 'خطا در تغییر وضعیت نرخ مالیات')
      }
    } catch (error) {
      console.error('Error toggling tax active:', error)
      setError('خطا در اتصال به سرور')
    } finally {
      setSaving(false)
    }
  }

  const toggleFeeActive = async (fee: FeeRate) => {
    try {
      setSaving(true)
      const response = await fetch('/api/fee-rates', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: fee._id || fee.id,
          isActive: !fee.isActive
        }),
      })

      const data = await response.json()

      if (data.success) {
        await fetchFeeRates() // دریافت مجدد لیست
      } else {
        setError(data.message || 'خطا در تغییر وضعیت نرخ کارمزد')
      }
    } catch (error) {
      console.error('Error toggling fee active:', error)
      setError('خطا در اتصال به سرور')
    } finally {
      setSaving(false)
    }
  }

  const getAppliesToText = (appliesTo: string[]) => {
    const mapping: { [key: string]: string } = {
      'food': 'غذا',
      'beverages': 'نوشیدنی',
      'total': 'کل مبلغ',
      'online_payment': 'پرداخت آنلاین',
      'card_payment': 'پرداخت کارتی'
    }
    return appliesTo.map(item => mapping[item] || item).join(', ')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/80 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">در حال بارگذاری...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold gradient-text mb-2">مالیات/کارمزد</h1>
        <p className="text-gray-600 dark:text-gray-300">تنظیم نرخ‌های مالیات و کارمزد</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
          <div className="flex items-center space-x-2 space-x-reverse">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <span className="text-red-700 dark:text-red-300">{error}</span>
          </div>
        </div>
      )}

      {/* Info Card */}
      <div className="premium-card p-6 mb-8 border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20">
        <div className="flex items-start space-x-3 space-x-reverse">
          <Info className="w-6 h-6 text-blue-600 dark:text-blue-400 mt-1" />
          <div>
            <h3 className="text-lg font-medium text-blue-800 dark:text-blue-200 mb-2">
              راهنمای تنظیم مالیات و کارمزد
            </h3>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>• مالیات بر ارزش افزوده معمولاً 9% است</li>
              <li>• کارمزد درگاه پرداخت معمولاً 2-3% است</li>
              <li>• کارمزد کارتخوان معمولاً 1-2% است</li>
              <li>• این نرخ‌ها در فاکتورها و گزارشات اعمال می‌شوند</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Tax Rates Section */}
        <div>
          <div className="premium-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">نرخ‌های مالیات</h2>
              <button
                onClick={() => setShowTaxForm(true)}
                className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>مالیات جدید</span>
              </button>
            </div>

            <div className="space-y-4">
              {taxRates.map((tax, index) => (
                <div key={tax._id || tax.id || index} className="p-4 border border-gray-200 dark:border-gray-600/30 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">{tax.name}</h3>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <button
                        onClick={() => toggleTaxActive(tax)}
                        disabled={saving}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors disabled:opacity-50 ${
                          tax.isActive 
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {tax.isActive ? 'فعال' : 'غیرفعال'}
                      </button>
                      <button
                        onClick={() => {
                          setEditingTax(tax)
                          setTaxForm(tax)
                          setShowTaxForm(true)
                        }}
                        disabled={saving}
                        className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteTax(tax._id || tax.id || '')}
                        disabled={saving}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Percent className="w-4 h-4" />
                      <span>
                        نرخ: {tax.rate} {tax.type === 'percentage' ? '%' : 'تومان'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Receipt className="w-4 h-4" />
                      <span>اعمال به: {getAppliesToText(tax.appliesTo)}</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{tax.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Fee Rates Section */}
        <div>
          <div className="premium-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">نرخ‌های کارمزد</h2>
              <button
                onClick={() => setShowFeeForm(true)}
                className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>کارمزد جدید</span>
              </button>
            </div>

            <div className="space-y-4">
              {feeRates.map((fee, index) => (
                <div key={fee._id || fee.id || index} className="p-4 border border-gray-200 dark:border-gray-600/30 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">{fee.name}</h3>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <button
                        onClick={() => toggleFeeActive(fee)}
                        disabled={saving}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors disabled:opacity-50 ${
                          fee.isActive 
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {fee.isActive ? 'فعال' : 'غیرفعال'}
                      </button>
                      <button
                        onClick={() => {
                          setEditingFee(fee)
                          setFeeForm(fee)
                          setShowFeeForm(true)
                        }}
                        disabled={saving}
                        className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteFee(fee._id || fee.id || '')}
                        disabled={saving}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Percent className="w-4 h-4" />
                      <span>
                        نرخ: {fee.rate} {fee.type === 'percentage' ? '%' : 'تومان'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <CreditCard className="w-4 h-4" />
                      <span>اعمال به: {getAppliesToText(fee.appliesTo)}</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{fee.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tax Form Modal */}
      {showTaxForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {editingTax ? 'ویرایش مالیات' : 'مالیات جدید'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  نام مالیات
                </label>
                <input
                  type="text"
                  value={taxForm.name}
                  onChange={(e) => setTaxForm({...taxForm, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    نرخ
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={taxForm.rate}
                    onChange={(e) => setTaxForm({...taxForm, rate: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    نوع
                  </label>
                  <select
                    value={taxForm.type}
                    onChange={(e) => setTaxForm({...taxForm, type: e.target.value as 'percentage' | 'fixed'})}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="percentage">درصد</option>
                    <option value="fixed">مبلغ ثابت</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  توضیحات
                </label>
                <textarea
                  value={taxForm.description}
                  onChange={(e) => setTaxForm({...taxForm, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows={3}
                />
              </div>
              <div className="flex items-center space-x-3 space-x-reverse">
                <input
                  type="checkbox"
                  id="taxActive"
                  checked={taxForm.isActive}
                  onChange={(e) => setTaxForm({...taxForm, isActive: e.target.checked})}
                  className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <label htmlFor="taxActive" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  مالیات فعال
                </label>
              </div>
            </div>
            <div className="flex items-center justify-end space-x-3 space-x-reverse mt-6">
              <button
                onClick={() => {
                  setShowTaxForm(false)
                  setEditingTax(null)
                  setTaxForm({
                    name: '',
                    rate: 0,
                    type: 'percentage',
                    description: '',
                    isActive: true,
                    appliesTo: []
                  })
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              >
                انصراف
              </button>
              <button
                onClick={handleSaveTax}
                disabled={saving}
                className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>ذخیره</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fee Form Modal */}
      {showFeeForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {editingFee ? 'ویرایش کارمزد' : 'کارمزد جدید'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  نام کارمزد
                </label>
                <input
                  type="text"
                  value={feeForm.name}
                  onChange={(e) => setFeeForm({...feeForm, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    نرخ
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={feeForm.rate}
                    onChange={(e) => setFeeForm({...feeForm, rate: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    نوع
                  </label>
                  <select
                    value={feeForm.type}
                    onChange={(e) => setFeeForm({...feeForm, type: e.target.value as 'percentage' | 'fixed'})}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="percentage">درصد</option>
                    <option value="fixed">مبلغ ثابت</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  توضیحات
                </label>
                <textarea
                  value={feeForm.description}
                  onChange={(e) => setFeeForm({...feeForm, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows={3}
                />
              </div>
              <div className="flex items-center space-x-3 space-x-reverse">
                <input
                  type="checkbox"
                  id="feeActive"
                  checked={feeForm.isActive}
                  onChange={(e) => setFeeForm({...feeForm, isActive: e.target.checked})}
                  className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <label htmlFor="feeActive" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  کارمزد فعال
                </label>
              </div>
            </div>
            <div className="flex items-center justify-end space-x-3 space-x-reverse mt-6">
              <button
                onClick={() => {
                  setShowFeeForm(false)
                  setEditingFee(null)
                  setFeeForm({
                    name: '',
                    rate: 0,
                    type: 'percentage',
                    description: '',
                    isActive: true,
                    appliesTo: []
                  })
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              >
                انصراف
              </button>
              <button
                onClick={handleSaveFee}
                disabled={saving}
                className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>ذخیره</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}