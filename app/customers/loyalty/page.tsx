'use client'

import { useState, useEffect } from 'react'
import { 
  Gift, 
  Star, 
  Crown, 
  Trophy, 
  Award, 
  Target, 
  TrendingUp, 
  Users, 
  DollarSign,
  Calendar,
  Clock,
  CheckCircle,
  Plus,
  Edit,
  Trash2,
  Eye,
  GiftIcon,
  Zap,
  Heart,
  X
} from 'lucide-react'

interface LoyaltyProgram {
  _id?: string
  name: string
  description: string
  type: 'points' | 'tier' | 'cashback' | 'discount'
  status: 'active' | 'inactive' | 'draft'
  rules: {
    pointsPerRial: number
    minOrderAmount: number
    maxPointsPerOrder: number
    expiryDays: number
  }
  rewards: {
    points: number
    discount: number
    description: string
  }[]
  tiers: {
    name: string
    minPoints: number
    benefits: string[]
    color: string
  }[]
  createdAt: string
  updatedAt: string
}

interface CustomerLoyalty {
  _id?: string
  customerId: string
  customerName: string
  customerPhone: string
  totalPoints: number
  currentTier: string
  pointsEarned: number
  pointsRedeemed: number
  pointsExpired: number
  totalOrders: number
  totalSpent: number
  lastOrderDate: string
  nextTierPoints: number
  status: 'active' | 'inactive' | 'suspended'
}

export default function CustomerLoyaltyPage() {
  const [loyaltyPrograms, setLoyaltyPrograms] = useState<LoyaltyProgram[]>([])
  const [customerLoyalties, setCustomerLoyalties] = useState<CustomerLoyalty[]>([])
  const [activeTab, setActiveTab] = useState('programs')
  const [loading, setLoading] = useState(false)
  const [showAddProgram, setShowAddProgram] = useState(false)
  const [selectedProgram, setSelectedProgram] = useState<LoyaltyProgram | null>(null)
  const [showEditProgram, setShowEditProgram] = useState(false)
  const [editingProgram, setEditingProgram] = useState<LoyaltyProgram | null>(null)
  const [showAddCustomer, setShowAddCustomer] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<CustomerLoyalty | null>(null)
  const [formData, setFormData] = useState<any>({})

  const loadLoyaltyPrograms = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/loyalty-programs')
      const result = await response.json()
      if (result.success) {
        setLoyaltyPrograms(result.data)
      }
    } catch (error) {
      console.error('Error loading loyalty programs:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadCustomerLoyalties = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/customer-loyalties')
      const result = await response.json()
      if (result.success) {
        setCustomerLoyalties(result.data)
      }
    } catch (error) {
      console.error('Error loading customer loyalties:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'programs') {
      loadLoyaltyPrograms()
    } else {
      loadCustomerLoyalties()
    }
  }, [activeTab])

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'points': return <Star className="w-5 h-5" />
      case 'tier': return <Crown className="w-5 h-5" />
      case 'cashback': return <DollarSign className="w-5 h-5" />
      case 'discount': return <Gift className="w-5 h-5" />
      default: return <Award className="w-5 h-5" />
    }
  }

  const getTypeText = (type: string) => {
    switch (type) {
      case 'points': return 'امتیازی'
      case 'tier': return 'سطوح'
      case 'cashback': return 'نقدی'
      case 'discount': return 'تخفیفی'
      default: return 'نامشخص'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'points': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
      case 'tier': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
      case 'cashback': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
      case 'discount': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
      case 'inactive': return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
      case 'draft': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'فعال'
      case 'inactive': return 'غیرفعال'
      case 'draft': return 'پیش‌نویس'
      default: return 'نامشخص'
    }
  }

  const getTierColor = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'bronze': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
      case 'silver': return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
      case 'gold': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
      case 'platinum': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
      case 'diamond': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
    }
  }

  const getTotalPrograms = () => loyaltyPrograms.length
  const getActivePrograms = () => loyaltyPrograms.filter(program => program.status === 'active').length
  const getTotalCustomers = () => customerLoyalties.length
  const getActiveCustomers = () => customerLoyalties.filter(customer => customer.status === 'active').length
  const getTotalPoints = () => customerLoyalties.reduce((sum, customer) => sum + customer.totalPoints, 0)
  const getTotalRedeemed = () => customerLoyalties.reduce((sum, customer) => sum + customer.pointsRedeemed, 0)

  const resetForm = () => {
    setFormData({})
    setEditingProgram(null)
    setEditingCustomer(null)
  }

  const handleCreateProgram = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/loyalty-programs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify(formData)
      })
      
      const result = await response.json()
      if (result.success) {
        await loadLoyaltyPrograms()
        setShowAddProgram(false)
        resetForm()
        alert('برنامه وفاداری با موفقیت ایجاد شد')
      } else {
        alert('خطا در ایجاد برنامه: ' + result.message)
      }
    } catch (error) {
      console.error('Error creating program:', error)
      alert('خطا در ایجاد برنامه')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateProgram = async () => {
    if (!editingProgram?._id) return
    
    try {
      setLoading(true)
      const response = await fetch(`/api/loyalty-programs/${editingProgram._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify(formData)
      })
      
      const result = await response.json()
      if (result.success) {
        await loadLoyaltyPrograms()
        setShowEditProgram(false)
        resetForm()
        alert('برنامه با موفقیت به‌روزرسانی شد')
      } else {
        alert('خطا در به‌روزرسانی برنامه: ' + result.message)
      }
    } catch (error) {
      console.error('Error updating program:', error)
      alert('خطا در به‌روزرسانی برنامه')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteProgram = async (programId: string) => {
    if (!confirm('آیا مطمئن هستید که می‌خواهید این برنامه را حذف کنید؟')) return
    
    try {
      setLoading(true)
      const response = await fetch(`/api/loyalty-programs/${programId}`, {
        method: 'DELETE'
      })
      
      const result = await response.json()
      if (result.success) {
        await loadLoyaltyPrograms()
        alert('برنامه با موفقیت حذف شد')
      } else {
        alert('خطا در حذف برنامه: ' + result.message)
      }
    } catch (error) {
      console.error('Error deleting program:', error)
      alert('خطا در حذف برنامه')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCustomer = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/customer-loyalties', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify(formData)
      })
      
      const result = await response.json()
      if (result.success) {
        await loadCustomerLoyalties()
        setShowAddCustomer(false)
        resetForm()
        alert('مشتری وفادار با موفقیت ایجاد شد')
      } else {
        alert('خطا در ایجاد مشتری: ' + result.message)
      }
    } catch (error) {
      console.error('Error creating customer:', error)
      alert('خطا در ایجاد مشتری')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateCustomer = async () => {
    if (!editingCustomer?._id) return
    
    try {
      setLoading(true)
      const response = await fetch(`/api/customer-loyalties/${editingCustomer._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify(formData)
      })
      
      const result = await response.json()
      if (result.success) {
        await loadCustomerLoyalties()
        setEditingCustomer(null)
        resetForm()
        alert('مشتری با موفقیت به‌روزرسانی شد')
      } else {
        alert('خطا در به‌روزرسانی مشتری: ' + result.message)
      }
    } catch (error) {
      console.error('Error updating customer:', error)
      alert('خطا در به‌روزرسانی مشتری')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCustomer = async (customerId: string) => {
    if (!confirm('آیا مطمئن هستید که می‌خواهید این مشتری را حذف کنید؟')) return
    
    try {
      setLoading(true)
      const response = await fetch(`/api/customer-loyalties/${customerId}`, {
        method: 'DELETE'
      })
      
      const result = await response.json()
      if (result.success) {
        await loadCustomerLoyalties()
        alert('مشتری با موفقیت حذف شد')
      } else {
        alert('خطا در حذف مشتری: ' + result.message)
      }
    } catch (error) {
      console.error('Error deleting customer:', error)
      alert('خطا در حذف مشتری')
    } finally {
      setLoading(false)
    }
  }

  const openEditProgram = (program: LoyaltyProgram) => {
    setEditingProgram(program)
    setFormData({
      name: program.name,
      description: program.description,
      type: program.type,
      status: program.status,
      rules: program.rules,
      rewards: program.rewards,
      tiers: program.tiers
    })
    setShowEditProgram(true)
  }

  const openEditCustomer = (customer: CustomerLoyalty) => {
    setEditingCustomer(customer)
    setFormData({
      customerId: customer.customerId,
      customerName: customer.customerName,
      customerPhone: customer.customerPhone,
      totalPoints: customer.totalPoints,
      currentTier: customer.currentTier,
      pointsEarned: customer.pointsEarned,
      pointsRedeemed: customer.pointsRedeemed,
      pointsExpired: customer.pointsExpired,
      totalOrders: customer.totalOrders,
      totalSpent: customer.totalSpent,
      lastOrderDate: customer.lastOrderDate,
      nextTierPoints: customer.nextTierPoints,
      status: customer.status
    })
  }

  const addSampleData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/add-sample-loyalty', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        }
      })
      
      const result = await response.json()
      if (result.success) {
        if (activeTab === 'programs') {
          await loadLoyaltyPrograms()
        } else {
          await loadCustomerLoyalties()
        }
        alert('داده‌های نمونه با موفقیت اضافه شد')
      } else {
        alert('خطا در اضافه کردن داده‌های نمونه: ' + result.message)
      }
    } catch (error) {
      console.error('Error adding sample data:', error)
      alert('خطا در اضافه کردن داده‌های نمونه')
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'programs', label: 'برنامه‌های وفاداری', count: getTotalPrograms(), icon: Gift },
    { id: 'customers', label: 'مشتریان وفادار', count: getTotalCustomers(), icon: Users }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/80 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold gradient-text mb-2">برنامه وفاداری</h1>
              <p className="text-gray-600 dark:text-gray-300">مدیریت برنامه‌های وفاداری و امتیازات مشتریان</p>
            </div>
            <div className="flex items-center space-x-3 space-x-reverse">
              <button
                onClick={addSampleData}
                disabled={loading}
                className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                <GiftIcon className="w-4 h-4" />
                <span>داده‌های نمونه</span>
              </button>
              {activeTab === 'programs' ? (
                <button
                  onClick={() => setShowAddProgram(true)}
                  className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <Plus className="w-4 h-4" />
                  <span>برنامه جدید</span>
                </button>
              ) : (
                <button
                  onClick={() => setShowAddCustomer(true)}
                  className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <Plus className="w-4 h-4" />
                  <span>مشتری جدید</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="premium-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-300">کل برنامه‌ها</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{getTotalPrograms()}</p>
              </div>
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <Gift className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
          <div className="premium-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-300">برنامه‌های فعال</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{getActivePrograms()}</p>
              </div>
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
          <div className="premium-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-300">مشتریان وفادار</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{getTotalCustomers()}</p>
              </div>
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
          <div className="premium-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-300">کل امتیازات</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{getTotalPoints().toLocaleString('fa-IR')}</p>
              </div>
              <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                <Star className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>
          <div className="premium-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-300">امتیازات استفاده شده</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{getTotalRedeemed().toLocaleString('fa-IR')}</p>
              </div>
              <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                <Trophy className="w-4 h-4 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="premium-card p-2 mb-8">
          <div className="flex flex-wrap gap-2">
            {tabs.map(tab => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 space-x-reverse px-4 py-3 rounded-lg transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-primary-600 text-white shadow-lg'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium">{tab.label}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                    activeTab === tab.id
                      ? 'bg-white/20 text-white'
                      : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">در حال بارگذاری...</p>
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'programs' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loyaltyPrograms.map(program => (
                  <div key={program._id} className="premium-card p-6 hover:shadow-xl transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3 space-x-reverse">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center text-white">
                          {getTypeIcon(program.type)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">{program.name}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{program.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <button
                          onClick={() => setSelectedProgram(program)}
                          className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => openEditProgram(program)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteProgram(program._id!)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">نوع:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(program.type)}`}>
                          {getTypeText(program.type)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">وضعیت:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(program.status)}`}>
                          {getStatusText(program.status)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">امتیاز به ازای هر ریال:</span>
                        <span className="text-sm text-gray-900 dark:text-white">{program.rules.pointsPerRial}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">حداقل سفارش:</span>
                        <span className="text-sm text-gray-900 dark:text-white">{program.rules.minOrderAmount.toLocaleString('fa-IR')} تومان</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600/30">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 dark:text-gray-400">تاریخ ایجاد:</span>
                        <span className="text-xs text-gray-600 dark:text-gray-300">
                          {new Date(program.createdAt).toLocaleDateString('fa-IR')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'customers' && (
              <div className="space-y-4">
                {customerLoyalties.map(customer => (
                  <div key={customer._id} className="premium-card p-6 hover:shadow-xl transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4 space-x-reverse">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                          {customer.customerName.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">{customer.customerName}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{customer.customerPhone}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTierColor(customer.currentTier)}`}>
                          {customer.currentTier}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(customer.status)}`}>
                          {getStatusText(customer.status)}
                        </span>
                        <button 
                          onClick={() => openEditCustomer(customer)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteCustomer(customer._id!)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">{customer.totalPoints.toLocaleString('fa-IR')}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">امتیاز کل</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">{customer.pointsEarned.toLocaleString('fa-IR')}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">کسب شده</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-red-600 dark:text-red-400">{customer.pointsRedeemed.toLocaleString('fa-IR')}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">استفاده شده</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">{customer.totalOrders}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">تعداد سفارشات</p>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600/30">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 dark:text-gray-400">آخرین سفارش:</span>
                        <span className="text-xs text-gray-600 dark:text-gray-300">
                          {new Date(customer.lastOrderDate).toLocaleDateString('fa-IR')}
                        </span>
                      </div>
                      {customer.nextTierPoints > 0 && (
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                            <span>امتیاز تا سطح بعدی:</span>
                            <span>{customer.nextTierPoints.toLocaleString('fa-IR')}</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(100, (customer.totalPoints / (customer.totalPoints + customer.nextTierPoints)) * 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Add Program Modal */}
        {showAddProgram && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">برنامه وفاداری جدید</h2>
                <button
                  onClick={() => {
                    setShowAddProgram(false)
                    resetForm()
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">نام برنامه</label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="نام برنامه وفاداری"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">توضیحات</label>
                  <textarea
                    value={formData.description || ''}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    rows={3}
                    placeholder="توضیحات برنامه"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">نوع برنامه</label>
                    <select
                      value={formData.type || 'points'}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    >
                      <option value="points">امتیازی</option>
                      <option value="tier">سطوح</option>
                      <option value="cashback">نقدی</option>
                      <option value="discount">تخفیفی</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">وضعیت</label>
                    <select
                      value={formData.status || 'draft'}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    >
                      <option value="draft">پیش‌نویس</option>
                      <option value="active">فعال</option>
                      <option value="inactive">غیرفعال</option>
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">امتیاز به ازای هر ریال</label>
                    <input
                      type="number"
                      value={formData.rules?.pointsPerRial || 1}
                      onChange={(e) => setFormData({
                        ...formData, 
                        rules: {...formData.rules, pointsPerRial: parseInt(e.target.value)}
                      })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">حداقل مبلغ سفارش (تومان)</label>
                    <input
                      type="number"
                      value={formData.rules?.minOrderAmount || 100000}
                      onChange={(e) => setFormData({
                        ...formData, 
                        rules: {...formData.rules, minOrderAmount: parseInt(e.target.value)}
                      })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-end space-x-3 space-x-reverse mt-6">
                <button
                  onClick={() => {
                    setShowAddProgram(false)
                    resetForm()
                  }}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                >
                  انصراف
                </button>
                <button
                  onClick={handleCreateProgram}
                  disabled={loading}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'در حال ایجاد...' : 'ایجاد برنامه'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Program Modal */}
        {showEditProgram && editingProgram && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">ویرایش برنامه وفاداری</h2>
                <button
                  onClick={() => {
                    setShowEditProgram(false)
                    resetForm()
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">نام برنامه</label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">توضیحات</label>
                  <textarea
                    value={formData.description || ''}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">نوع برنامه</label>
                    <select
                      value={formData.type || 'points'}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    >
                      <option value="points">امتیازی</option>
                      <option value="tier">سطوح</option>
                      <option value="cashback">نقدی</option>
                      <option value="discount">تخفیفی</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">وضعیت</label>
                    <select
                      value={formData.status || 'draft'}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    >
                      <option value="draft">پیش‌نویس</option>
                      <option value="active">فعال</option>
                      <option value="inactive">غیرفعال</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-end space-x-3 space-x-reverse mt-6">
                <button
                  onClick={() => {
                    setShowEditProgram(false)
                    resetForm()
                  }}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                >
                  انصراف
                </button>
                <button
                  onClick={handleUpdateProgram}
                  disabled={loading}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'در حال به‌روزرسانی...' : 'به‌روزرسانی'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Customer Modal */}
        {showAddCustomer && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">مشتری وفادار جدید</h2>
                <button
                  onClick={() => {
                    setShowAddCustomer(false)
                    resetForm()
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">شناسه مشتری</label>
                    <input
                      type="text"
                      value={formData.customerId || ''}
                      onChange={(e) => setFormData({...formData, customerId: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="شناسه مشتری"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">نام مشتری</label>
                    <input
                      type="text"
                      value={formData.customerName || ''}
                      onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="نام مشتری"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">شماره تلفن</label>
                  <input
                    type="text"
                    value={formData.customerPhone || ''}
                    onChange={(e) => setFormData({...formData, customerPhone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="شماره تلفن"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">امتیاز کل</label>
                    <input
                      type="number"
                      value={formData.totalPoints || 0}
                      onChange={(e) => setFormData({...formData, totalPoints: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">سطح فعلی</label>
                    <select
                      value={formData.currentTier || 'Bronze'}
                      onChange={(e) => setFormData({...formData, currentTier: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    >
                      <option value="Bronze">برنز</option>
                      <option value="Silver">نقره</option>
                      <option value="Gold">طلایی</option>
                      <option value="Platinum">پلاتین</option>
                      <option value="Diamond">الماس</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">وضعیت</label>
                  <select
                    value={formData.status || 'active'}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="active">فعال</option>
                    <option value="inactive">غیرفعال</option>
                    <option value="suspended">معلق</option>
                  </select>
                </div>
              </div>
              
              <div className="flex items-center justify-end space-x-3 space-x-reverse mt-6">
                <button
                  onClick={() => {
                    setShowAddCustomer(false)
                    resetForm()
                  }}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                >
                  انصراف
                </button>
                <button
                  onClick={handleCreateCustomer}
                  disabled={loading}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'در حال ایجاد...' : 'ایجاد مشتری'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Customer Modal */}
        {editingCustomer && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">ویرایش مشتری وفادار</h2>
                <button
                  onClick={() => {
                    setEditingCustomer(null)
                    resetForm()
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">شناسه مشتری</label>
                    <input
                      type="text"
                      value={formData.customerId || ''}
                      onChange={(e) => setFormData({...formData, customerId: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">نام مشتری</label>
                    <input
                      type="text"
                      value={formData.customerName || ''}
                      onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">شماره تلفن</label>
                  <input
                    type="text"
                    value={formData.customerPhone || ''}
                    onChange={(e) => setFormData({...formData, customerPhone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">امتیاز کل</label>
                    <input
                      type="number"
                      value={formData.totalPoints || 0}
                      onChange={(e) => setFormData({...formData, totalPoints: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">سطح فعلی</label>
                    <select
                      value={formData.currentTier || 'Bronze'}
                      onChange={(e) => setFormData({...formData, currentTier: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    >
                      <option value="Bronze">برنز</option>
                      <option value="Silver">نقره</option>
                      <option value="Gold">طلایی</option>
                      <option value="Platinum">پلاتین</option>
                      <option value="Diamond">الماس</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">وضعیت</label>
                  <select
                    value={formData.status || 'active'}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="active">فعال</option>
                    <option value="inactive">غیرفعال</option>
                    <option value="suspended">معلق</option>
                  </select>
                </div>
              </div>
              
              <div className="flex items-center justify-end space-x-3 space-x-reverse mt-6">
                <button
                  onClick={() => {
                    setEditingCustomer(null)
                    resetForm()
                  }}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                >
                  انصراف
                </button>
                <button
                  onClick={handleUpdateCustomer}
                  disabled={loading}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'در حال به‌روزرسانی...' : 'به‌روزرسانی'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
