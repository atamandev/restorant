'use client'

import { useState, useEffect } from 'react'
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  Star,
  ShoppingBag,
  DollarSign,
  TrendingUp,
  UserPlus,
  UserCheck,
  UserX,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

interface Customer {
  _id?: string
  customerNumber: string
  name: string
  phone: string
  email?: string
  address?: string
  birthDate?: string
  registrationDate: string
  totalOrders: number
  totalSpent: number
  lastOrderDate?: string
  status: 'active' | 'inactive' | 'blocked'
  notes?: string
  tags?: string[]
  loyaltyPoints: number
  customerType: 'regular' | 'vip' | 'golden'
  createdAt?: Date
  updatedAt?: Date
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [sortBy, setSortBy] = useState('registrationDate')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)

  const loadCustomers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/customers')
      const result = await response.json()
      if (result.success) {
        setCustomers(result.data)
      }
    } catch (error) {
      console.error('Error loading customers:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCustomers()
  }, [])

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.phone.includes(searchTerm) ||
                         customer.customerNumber.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || customer.status === filterStatus
    const matchesType = filterType === 'all' || customer.customerType === filterType
    return matchesSearch && matchesStatus && matchesType
  }).sort((a, b) => {
    let comparison = 0
    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name)
        break
      case 'registrationDate':
        comparison = new Date(a.registrationDate).getTime() - new Date(b.registrationDate).getTime()
        break
      case 'totalSpent':
        comparison = a.totalSpent - b.totalSpent
        break
      case 'totalOrders':
        comparison = a.totalOrders - b.totalOrders
        break
      default:
        comparison = 0
    }
    return sortOrder === 'asc' ? comparison : -comparison
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
      case 'inactive': return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
      case 'blocked': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'فعال'
      case 'inactive': return 'غیرفعال'
      case 'blocked': return 'مسدود'
      default: return 'نامشخص'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'golden': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
      case 'vip': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
      case 'regular': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
    }
  }

  const getTypeText = (type: string) => {
    switch (type) {
      case 'golden': return 'طلایی'
      case 'vip': return 'ویژه'
      case 'regular': return 'عادی'
      default: return 'نامشخص'
    }
  }

  const getTotalCustomers = () => customers.length
  const getActiveCustomers = () => customers.filter(customer => customer.status === 'active').length
  const getInactiveCustomers = () => customers.filter(customer => customer.status === 'inactive').length
  const getBlockedCustomers = () => customers.filter(customer => customer.status === 'blocked').length
  const getGoldenCustomers = () => customers.filter(customer => customer.customerType === 'golden').length
  const getVipCustomers = () => customers.filter(customer => customer.customerType === 'vip').length
  const getTotalRevenue = () => customers.reduce((sum, customer) => sum + customer.totalSpent, 0)

  const addSampleData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/add-sample-customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        }
      })
      
      const result = await response.json()
      if (result.success) {
        await loadCustomers()
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/80 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold gradient-text mb-2">مدیریت مشتریان</h1>
              <p className="text-gray-600 dark:text-gray-300">مدیریت جامع اطلاعات مشتریان رستوران</p>
            </div>
            <div className="flex items-center space-x-3 space-x-reverse">
              <button
                onClick={addSampleData}
                disabled={loading}
                className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                <UserPlus className="w-4 h-4" />
                <span>داده‌های نمونه</span>
              </button>
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Plus className="w-4 h-4" />
                <span>مشتری جدید</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
          <div className="premium-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-300">کل مشتریان</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{getTotalCustomers()}</p>
              </div>
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
          <div className="premium-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-300">مشتریان فعال</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{getActiveCustomers()}</p>
              </div>
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <UserCheck className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
          <div className="premium-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-300">مشتریان غیرفعال</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{getInactiveCustomers()}</p>
              </div>
              <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                <UserX className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </div>
            </div>
          </div>
          <div className="premium-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-300">مشتریان طلایی</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{getGoldenCustomers()}</p>
              </div>
              <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                <Star className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>
          <div className="premium-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-300">مشتریان ویژه</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{getVipCustomers()}</p>
              </div>
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
          <div className="premium-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-300">درآمد کل</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {getTotalRevenue().toLocaleString('fa-IR')} تومان
                </p>
              </div>
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="premium-card p-6 mb-8">
          <div className="flex flex-col lg:flex-row items-center justify-between space-y-4 lg:space-y-0">
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="جستجو در مشتریان..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64 pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="all">همه وضعیت‌ها</option>
                <option value="active">فعال</option>
                <option value="inactive">غیرفعال</option>
                <option value="blocked">مسدود</option>
              </select>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="all">همه انواع</option>
                <option value="regular">عادی</option>
                <option value="vip">ویژه</option>
                <option value="golden">طلایی</option>
              </select>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="name">نام</option>
                <option value="registrationDate">تاریخ ثبت‌نام</option>
                <option value="totalSpent">مجموع خرید</option>
                <option value="totalOrders">تعداد سفارشات</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>
        </div>

        {/* Customers List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">در حال بارگذاری مشتریان...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCustomers.map(customer => (
              <div key={customer._id} className="premium-card p-6 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {customer.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{customer.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{customer.customerNumber}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <button
                      onClick={() => setSelectedCustomer(customer)}
                      className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setEditingCustomer(customer)
                        setShowEditForm(true)
                      }}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">وضعیت:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(customer.status)}`}>
                      {getStatusText(customer.status)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">نوع:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(customer.customerType)}`}>
                      {getTypeText(customer.customerType)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">تلفن:</span>
                    <span className="text-sm text-gray-900 dark:text-white">{customer.phone}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">تعداد سفارشات:</span>
                    <span className="text-sm text-gray-900 dark:text-white">{customer.totalOrders}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">مجموع خرید:</span>
                    <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">
                      {customer.totalSpent.toLocaleString('fa-IR')} تومان
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">امتیاز وفاداری:</span>
                    <span className="text-sm text-gray-900 dark:text-white">{customer.loyaltyPoints}</span>
                  </div>
                </div>

                {customer.lastOrderDate && (
                  <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600/30">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 dark:text-gray-400">آخرین سفارش:</span>
                      <span className="text-xs text-gray-600 dark:text-gray-300">
                        {new Date(customer.lastOrderDate).toLocaleDateString('fa-IR')}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Customer Detail Modal */}
        {selectedCustomer && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  جزئیات مشتری {selectedCustomer.name}
                </h3>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-600 dark:text-gray-400">نام:</label>
                    <p className="text-gray-900 dark:text-white">{selectedCustomer.name}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 dark:text-gray-400">شماره مشتری:</label>
                    <p className="text-gray-900 dark:text-white">{selectedCustomer.customerNumber}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 dark:text-gray-400">تلفن:</label>
                    <p className="text-gray-900 dark:text-white">{selectedCustomer.phone}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 dark:text-gray-400">ایمیل:</label>
                    <p className="text-gray-900 dark:text-white">{selectedCustomer.email || 'ثبت نشده'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 dark:text-gray-400">وضعیت:</label>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedCustomer.status)}`}>
                      {getStatusText(selectedCustomer.status)}
                    </span>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 dark:text-gray-400">نوع:</label>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(selectedCustomer.customerType)}`}>
                      {getTypeText(selectedCustomer.customerType)}
                    </span>
                  </div>
                </div>
                
                {selectedCustomer.address && (
                  <div>
                    <label className="text-sm text-gray-600 dark:text-gray-400">آدرس:</label>
                    <p className="text-gray-900 dark:text-white">{selectedCustomer.address}</p>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-600 dark:text-gray-400">تعداد سفارشات:</label>
                    <p className="text-gray-900 dark:text-white">{selectedCustomer.totalOrders}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 dark:text-gray-400">مجموع خرید:</label>
                    <p className="text-gray-900 dark:text-white">{selectedCustomer.totalSpent.toLocaleString('fa-IR')} تومان</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 dark:text-gray-400">امتیاز وفاداری:</label>
                    <p className="text-gray-900 dark:text-white">{selectedCustomer.loyaltyPoints}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 dark:text-gray-400">تاریخ ثبت‌نام:</label>
                    <p className="text-gray-900 dark:text-white">
                      {new Date(selectedCustomer.registrationDate).toLocaleDateString('fa-IR')}
                    </p>
                  </div>
                </div>
                
                {selectedCustomer.notes && (
                  <div>
                    <label className="text-sm text-gray-600 dark:text-gray-400">یادداشت‌ها:</label>
                    <p className="text-gray-900 dark:text-white">{selectedCustomer.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

