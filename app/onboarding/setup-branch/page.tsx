'use client'

import { useState, useEffect } from 'react'
import { 
  Building, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Users, 
  CreditCard, 
  Settings, 
  Save, 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Info, 
  Calendar, 
  DollarSign, 
  Monitor, 
  Printer, 
  Wifi, 
  Shield, 
  Star, 
  Target, 
  Zap,
  Loader2
} from 'lucide-react'

interface Branch {
  id: string
  name: string
  address: string
  phoneNumber?: string
  email?: string
  manager?: string
  capacity?: number
  openingHours?: {
    start: string
    end: string
  }
  isActive: boolean
  cashRegisters: CashRegister[]
  createdAt: string
  updatedAt: string
}

interface CashRegister {
  id: string
  name: string
  location?: string
  isActive: boolean
  currentAmount: number
  lastUsed?: string
  branchId: string
  createdAt: string
  updatedAt: string
}

export default function SetupBranchPage() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null)
  const [showCashierForm, setShowCashierForm] = useState(false)
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phoneNumber: '',
    email: '',
    manager: '',
    capacity: 0,
    openingHours: {
      start: '09:00',
      end: '23:00'
    },
    isActive: true
  })

  const [cashierForm, setCashierForm] = useState({
    name: '',
    location: '',
    isActive: true,
    currentAmount: 0
  })

  // دریافت لیست شعبه‌ها
  const fetchBranches = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/branches')
      const data = await response.json()
      
      if (data.success) {
        setBranches(data.data)
      } else {
        setError(data.message || 'خطا در دریافت لیست شعبه‌ها')
      }
    } catch (error) {
      console.error('Error fetching branches:', error)
      setError('خطا در اتصال به سرور')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBranches()
  }, [])

  const handleSave = async () => {
    try {
      setSaving(true)
      setError('')

      const url = editingBranch ? '/api/branches' : '/api/branches'
      const method = editingBranch ? 'PUT' : 'POST'
      
      const requestBody = editingBranch 
        ? { id: editingBranch.id || editingBranch._id, ...formData }
        : formData

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      const data = await response.json()

      if (data.success) {
        await fetchBranches() // دریافت مجدد لیست
        setShowForm(false)
        setEditingBranch(null)
        resetForm()
      } else {
        setError(data.message || 'خطا در ذخیره شعبه')
      }
    } catch (error) {
      console.error('Error saving branch:', error)
      setError('خطا در اتصال به سرور')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveCashier = async () => {
    if (!selectedBranch) return
    
    try {
      setSaving(true)
      setError('')

      const response = await fetch('/api/cash-registers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...cashierForm,
          branchId: selectedBranch.id || selectedBranch._id
        }),
      })

      const data = await response.json()

      if (data.success) {
        await fetchBranches() // دریافت مجدد لیست
        setShowCashierForm(false)
        setSelectedBranch(null)
        resetCashierForm()
      } else {
        setError(data.message || 'خطا در ذخیره صندوق')
      }
    } catch (error) {
      console.error('Error saving cashier:', error)
      setError('خطا در اتصال به سرور')
    } finally {
      setSaving(false)
    }
  }

  const deleteBranch = async (id: string) => {
    if (!confirm('آیا از حذف این شعبه اطمینان دارید؟')) return

    try {
      setSaving(true)
      const response = await fetch(`/api/branches?id=${id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        await fetchBranches() // دریافت مجدد لیست
      } else {
        setError(data.message || 'خطا در حذف شعبه')
      }
    } catch (error) {
      console.error('Error deleting branch:', error)
      setError('خطا در اتصال به سرور')
    } finally {
      setSaving(false)
    }
  }

  const deleteCashier = async (cashierId: string) => {
    if (!confirm('آیا از حذف این صندوق اطمینان دارید؟')) return

    try {
      setSaving(true)
      const response = await fetch(`/api/cash-registers?id=${cashierId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        await fetchBranches() // دریافت مجدد لیست
      } else {
        setError(data.message || 'خطا در حذف صندوق')
      }
    } catch (error) {
      console.error('Error deleting cashier:', error)
      setError('خطا در اتصال به سرور')
    } finally {
      setSaving(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      phoneNumber: '',
      email: '',
      manager: '',
      capacity: 0,
      openingHours: {
        start: '09:00',
        end: '23:00'
      },
      isActive: true
    })
  }

  const resetCashierForm = () => {
    setCashierForm({
      name: '',
      location: '',
      isActive: true,
      currentAmount: 0
    })
  }

  const getTotalBranches = () => branches?.length || 0
  const getActiveBranches = () => branches?.filter(branch => branch.isActive).length || 0
  const getTotalCashiers = () => branches?.reduce((sum, branch) => sum + (branch.cashRegisters?.length || 0), 0) || 0
  const getActiveCashiers = () => branches?.reduce((sum, branch) => sum + (branch.cashRegisters?.filter(cashier => cashier.isActive).length || 0), 0) || 0

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
        <h1 className="text-3xl font-bold gradient-text mb-2">تعریف شعبه و صندوق</h1>
        <p className="text-gray-600 dark:text-gray-300">مدیریت شعبه‌ها و صندوق‌های فروش</p>
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

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="premium-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">کل شعبه‌ها</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{getTotalBranches()}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Building className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>
        <div className="premium-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">شعبه‌های فعال</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{getActiveBranches()}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>
        <div className="premium-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">کل صندوق‌ها</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{getTotalCashiers()}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
        <div className="premium-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">صندوق‌های فعال</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{getActiveCashiers()}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Branches List */}
      <div className="premium-card p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">لیست شعبه‌ها</h2>
          <button
            onClick={() => {
              resetForm()
              setShowForm(true)
            }}
            className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>شعبه جدید</span>
          </button>
        </div>
        <div className="space-y-6">
          {branches.map((branch, index) => (
            <div key={branch.id || branch._id || index} className="border border-gray-200 dark:border-gray-600/30 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4 space-x-reverse">
                  <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                    <Building className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{branch.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{branch.manager || 'مدیر تعیین نشده'} - مدیر شعبه</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    branch.isActive 
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                      : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                  }`}>
                    {branch.isActive ? 'فعال' : 'غیرفعال'}
                  </span>
                  <button
                    onClick={() => {
                      setEditingBranch(branch)
                      setFormData({
                        name: branch.name,
                        address: branch.address,
                        phoneNumber: branch.phoneNumber || '',
                        email: branch.email || '',
                        manager: branch.manager || '',
                        capacity: branch.capacity || 0,
                        openingHours: branch.openingHours || {
                          start: '09:00',
                          end: '23:00'
                        },
                        isActive: branch.isActive
                      })
                      setShowForm(true)
                    }}
                    className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteBranch(branch.id || branch._id)}
                    disabled={saving}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 space-x-reverse text-sm text-gray-600 dark:text-gray-400">
                    <MapPin className="w-4 h-4" />
                    <span>{branch.address}</span>
                  </div>
                  {branch.phoneNumber && (
                    <div className="flex items-center space-x-2 space-x-reverse text-sm text-gray-600 dark:text-gray-400">
                      <Phone className="w-4 h-4" />
                      <span>{branch.phoneNumber}</span>
                    </div>
                  )}
                  {branch.email && (
                    <div className="flex items-center space-x-2 space-x-reverse text-sm text-gray-600 dark:text-gray-400">
                      <Mail className="w-4 h-4" />
                      <span>{branch.email}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  {branch.capacity && (
                    <div className="flex items-center space-x-2 space-x-reverse text-sm text-gray-600 dark:text-gray-400">
                      <Users className="w-4 h-4" />
                      <span>ظرفیت: {branch.capacity} نفر</span>
                    </div>
                  )}
                  {branch.openingHours && (
                    <div className="flex items-center space-x-2 space-x-reverse text-sm text-gray-600 dark:text-gray-400">
                      <Clock className="w-4 h-4" />
                      <span>ساعات کاری: {branch.openingHours.start} - {branch.openingHours.end}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Cash Registers */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900 dark:text-white">صندوق‌های فروش</h4>
                  <button
                    onClick={() => {
                      setSelectedBranch(branch)
                      resetCashierForm()
                      setShowCashierForm(true)
                    }}
                    className="flex items-center space-x-1 space-x-reverse px-3 py-1 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
                  >
                    <Plus className="w-3 h-3" />
                    <span>صندوق جدید</span>
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {branch.cashRegisters.map((cashier, index) => (
                    <div key={cashier.id || cashier._id || index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{cashier.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{cashier.location || 'مکان تعیین نشده'}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          موجودی: {cashier.currentAmount.toLocaleString('fa-IR')} تومان
                        </p>
                      </div>
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          cashier.isActive 
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}>
                          {cashier.isActive ? 'فعال' : 'غیرفعال'}
                        </span>
                        <button
                          onClick={() => deleteCashier(cashier.id || cashier._id)}
                          disabled={saving}
                          className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Branch Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {editingBranch ? 'ویرایش شعبه' : 'شعبه جدید'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  نام شعبه *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  مدیر شعبه
                </label>
                <input
                  type="text"
                  value={formData.manager}
                  onChange={(e) => setFormData({...formData, manager: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  تلفن
                </label>
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ایمیل
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ظرفیت (نفر)
                </label>
                <input
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({...formData, capacity: Number(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  وضعیت
                </label>
                <select
                  value={formData.isActive ? 'active' : 'inactive'}
                  onChange={(e) => setFormData({...formData, isActive: e.target.value === 'active'})}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="active">فعال</option>
                  <option value="inactive">غیرفعال</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ساعت شروع
                </label>
                <input
                  type="time"
                  value={formData.openingHours.start}
                  onChange={(e) => setFormData({...formData, openingHours: {...formData.openingHours, start: e.target.value}})}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ساعت پایان
                </label>
                <input
                  type="time"
                  value={formData.openingHours.end}
                  onChange={(e) => setFormData({...formData, openingHours: {...formData.openingHours, end: e.target.value}})}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  آدرس *
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows={3}
                  required
                />
              </div>
            </div>
            <div className="flex items-center justify-end space-x-3 space-x-reverse mt-6">
              <button
                onClick={() => {
                  setShowForm(false)
                  setEditingBranch(null)
                  resetForm()
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              >
                انصراف
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !formData.name || !formData.address}
                className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>ذخیره</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cashier Form Modal */}
      {showCashierForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              صندوق جدید - {selectedBranch?.name}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  نام صندوق *
                </label>
                <input
                  type="text"
                  value={cashierForm.name}
                  onChange={(e) => setCashierForm({...cashierForm, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  مکان
                </label>
                <input
                  type="text"
                  value={cashierForm.location}
                  onChange={(e) => setCashierForm({...cashierForm, location: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  موجودی اولیه (تومان)
                </label>
                <input
                  type="number"
                  value={cashierForm.currentAmount}
                  onChange={(e) => setCashierForm({...cashierForm, currentAmount: Number(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="flex items-center space-x-2 space-x-reverse">
                  <input
                    type="checkbox"
                    checked={cashierForm.isActive}
                    onChange={(e) => setCashierForm({...cashierForm, isActive: e.target.checked})}
                    className="w-4 h-4 text-primary-600"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">فعال</span>
                </label>
              </div>
            </div>
            <div className="flex items-center justify-end space-x-3 space-x-reverse mt-6">
              <button
                onClick={() => {
                  setShowCashierForm(false)
                  setSelectedBranch(null)
                  resetCashierForm()
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              >
                انصراف
              </button>
              <button
                onClick={handleSaveCashier}
                disabled={saving || !cashierForm.name}
                className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>ذخیره</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}