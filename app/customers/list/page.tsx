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
  AlertCircle,
  Download,
  Upload
} from 'lucide-react'

interface Customer {
  _id?: string
  customerNumber: string
  name?: string
  firstName?: string
  lastName?: string
  phone: string
  email?: string
  address?: string
  birthDate?: string
  registrationDate: string
  totalOrders: number
  totalSpent: number
  monthlySpent?: number // خرید ماهانه
  monthlyOrders?: number // تعداد سفارشات ماهانه
  lastOrderDate?: string
  status: 'active' | 'inactive' | 'blocked'
  notes?: string
  tags?: string[]
  loyaltyPoints: number
  customerType: 'regular' | 'vip' | 'golden'
  createdAt?: Date
  updatedAt?: Date
}

export default function CustomersListPage() {
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
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    address: '',
    birthDate: '',
    status: 'active' as 'active' | 'inactive' | 'blocked',
    customerType: 'regular' as 'regular' | 'vip' | 'golden',
    notes: '',
    tags: [] as string[]
  })

  const loadCustomers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/customers')
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      if (result.success) {
        setCustomers(result.data || [])
      } else {
        console.error('API Error:', result.message)
        setCustomers([])
      }
    } catch (error) {
      console.error('Error loading customers:', error)
      setCustomers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCustomers()
    
    // Auto-refresh هر 10 ثانیه برای به‌روزرسانی خودکار آمار مشتریان
    const interval = setInterval(() => {
      loadCustomers()
    }, 10000)
    
    return () => clearInterval(interval)
  }, [])

  const filteredCustomers = customers.filter(customer => {
    const customerName = customer.name || customer.firstName + ' ' + customer.lastName || ''
    const matchesSearch = customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (customer.phone && customer.phone.includes(searchTerm)) ||
                         (customer.customerNumber && customer.customerNumber.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus = filterStatus === 'all' || customer.status === filterStatus
    const matchesType = filterType === 'all' || customer.customerType === filterType
    return matchesSearch && matchesStatus && matchesType
  }).sort((a, b) => {
    let comparison = 0
    switch (sortBy) {
      case 'name':
        const nameA = a.name || a.firstName + ' ' + a.lastName || ''
        const nameB = b.name || b.firstName + ' ' + b.lastName || ''
        comparison = nameA.localeCompare(nameB)
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

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      address: '',
      birthDate: '',
      status: 'active',
      customerType: 'regular',
      notes: '',
      tags: []
    })
  }

  const handleCreateCustomer = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify(formData)
      })
      
      const result = await response.json()
      if (result.success) {
        await loadCustomers()
        setShowAddForm(false)
        resetForm()
        alert('مشتری با موفقیت اضافه شد')
      } else {
        alert('خطا در اضافه کردن مشتری: ' + result.message)
      }
    } catch (error) {
      console.error('Error creating customer:', error)
      alert('خطا در اضافه کردن مشتری')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateCustomer = async () => {
    if (!editingCustomer?._id) return
    
    try {
      setLoading(true)
      const response = await fetch(`/api/customers/${editingCustomer._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify(formData)
      })
      
      const result = await response.json()
      if (result.success) {
        await loadCustomers()
        setShowEditForm(false)
        setEditingCustomer(null)
        resetForm()
        alert('مشتری با موفقیت بروزرسانی شد')
      } else {
        alert('خطا در بروزرسانی مشتری: ' + result.message)
      }
    } catch (error) {
      console.error('Error updating customer:', error)
      alert('خطا در بروزرسانی مشتری')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCustomer = async (customerId: string) => {
    if (!confirm('آیا مطمئن هستید که می‌خواهید این مشتری را حذف کنید؟')) return
    
    try {
      setLoading(true)
      
      // Optimistic update: remove from state immediately
      setCustomers(prev => prev.filter(customer => (customer._id || customer.id) !== customerId))
      
      const response = await fetch(`/api/customers/${customerId}`, {
        method: 'DELETE'
      })
      
      const result = await response.json()
      
      if (!result.success) {
        // If delete failed, reload to restore state
        await loadCustomers()
        alert('خطا در حذف مشتری: ' + result.message)
      } else {
        // Success - optionally reload to sync
        await loadCustomers()
      }
    } catch (error) {
      console.error('Error deleting customer:', error)
      // On error, reload to restore state
      await loadCustomers()
      alert('خطا در حذف مشتری')
    } finally {
      setLoading(false)
    }
  }

  const openEditForm = (customer: Customer) => {
    setEditingCustomer(customer)
    setFormData({
      firstName: customer.firstName || '',
      lastName: customer.lastName || '',
      phone: customer.phone || '',
      email: customer.email || '',
      address: customer.address || '',
      birthDate: customer.birthDate || '',
      status: customer.status || 'active',
      customerType: customer.customerType || 'regular',
      notes: customer.notes || '',
      tags: customer.tags || []
    })
    setShowEditForm(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/80 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold gradient-text mb-2">لیست مشتریان</h1>
              <p className="text-gray-600 dark:text-gray-300">مدیریت و مشاهده تمام مشتریان رستوران</p>
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
              <button className="p-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Customers Table */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">در حال بارگذاری مشتریان...</p>
            </div>
          </div>
        ) : (
          <div className="premium-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">مشتری</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">تماس</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">وضعیت</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">نوع</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">تعداد سفارشات</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">خرید کل</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">خرید ماهانه</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">امتیاز</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">عملیات</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredCustomers.map(customer => (
                    <tr key={customer._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {(customer.name || customer.firstName + ' ' + customer.lastName || 'م').charAt(0)}
                          </div>
                          <div className="mr-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {customer.name || customer.firstName + ' ' + customer.lastName || 'نامشخص'}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{customer.customerNumber}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">{customer.phone}</div>
                        {customer.email && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">{customer.email}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(customer.status)}`}>
                          {getStatusText(customer.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(customer.customerType)}`}>
                          {getTypeText(customer.customerType)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        <div className="font-medium">{customer.totalOrders || 0}</div>
                        {customer.monthlyOrders && customer.monthlyOrders > 0 && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            این ماه: {customer.monthlyOrders}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        <div className="font-medium">{(customer.totalSpent || 0).toLocaleString('fa-IR')} تومان</div>
                        {customer.lastOrderDate && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            آخرین سفارش: {new Date(customer.lastOrderDate).toLocaleDateString('fa-IR')}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        <div className="font-medium text-primary-600 dark:text-primary-400">
                          {(customer.monthlySpent || 0).toLocaleString('fa-IR')} تومان
                        </div>
                        {customer.monthlyOrders !== undefined && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {customer.monthlyOrders} سفارش
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {customer.loyaltyPoints || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <button
                            onClick={() => setSelectedCustomer(customer)}
                            className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditForm(customer)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteCustomer(customer._id!)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Add Customer Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  اضافه کردن مشتری جدید
                </h3>
                <button
                  onClick={() => {
                    setShowAddForm(false)
                    resetForm()
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      نام *
                    </label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="نام"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      نام خانوادگی *
                    </label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="نام خانوادگی"
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      شماره تلفن *
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="09123456789"
                      required
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
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="example@email.com"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    آدرس
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    rows={3}
                    placeholder="آدرس کامل"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      تاریخ تولد
                    </label>
                    <input
                      type="date"
                      value={formData.birthDate}
                      onChange={(e) => setFormData({...formData, birthDate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      نوع مشتری
                    </label>
                    <select
                      value={formData.customerType}
                      onChange={(e) => setFormData({...formData, customerType: e.target.value as 'regular' | 'vip' | 'golden'})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    >
                      <option value="regular">عادی</option>
                      <option value="vip">ویژه</option>
                      <option value="golden">طلایی</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    وضعیت
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value as 'active' | 'inactive' | 'blocked'})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="active">فعال</option>
                    <option value="inactive">غیرفعال</option>
                    <option value="blocked">مسدود</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    یادداشت‌ها
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    rows={3}
                    placeholder="یادداشت‌های اضافی"
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-end space-x-3 space-x-reverse mt-6">
                <button
                  onClick={() => {
                    setShowAddForm(false)
                    resetForm()
                  }}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                >
                  انصراف
                </button>
                <button
                  onClick={handleCreateCustomer}
                  disabled={loading || !formData.firstName || !formData.lastName || !formData.phone}
                  className="px-6 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'در حال اضافه کردن...' : 'اضافه کردن مشتری'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Customer Modal */}
        {showEditForm && editingCustomer && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  ویرایش مشتری
                </h3>
                <button
                  onClick={() => {
                    setShowEditForm(false)
                    setEditingCustomer(null)
                    resetForm()
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      نام *
                    </label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="نام"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      نام خانوادگی *
                    </label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="نام خانوادگی"
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      شماره تلفن *
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="09123456789"
                      required
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
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="example@email.com"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    آدرس
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    rows={3}
                    placeholder="آدرس کامل"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      تاریخ تولد
                    </label>
                    <input
                      type="date"
                      value={formData.birthDate}
                      onChange={(e) => setFormData({...formData, birthDate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      نوع مشتری
                    </label>
                    <select
                      value={formData.customerType}
                      onChange={(e) => setFormData({...formData, customerType: e.target.value as 'regular' | 'vip' | 'golden'})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    >
                      <option value="regular">عادی</option>
                      <option value="vip">ویژه</option>
                      <option value="golden">طلایی</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    وضعیت
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value as 'active' | 'inactive' | 'blocked'})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="active">فعال</option>
                    <option value="inactive">غیرفعال</option>
                    <option value="blocked">مسدود</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    یادداشت‌ها
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    rows={3}
                    placeholder="یادداشت‌های اضافی"
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-end space-x-3 space-x-reverse mt-6">
                <button
                  onClick={() => {
                    setShowEditForm(false)
                    setEditingCustomer(null)
                    resetForm()
                  }}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                >
                  انصراف
                </button>
                <button
                  onClick={handleUpdateCustomer}
                  disabled={loading || !formData.firstName || !formData.lastName || !formData.phone}
                  className="px-6 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'در حال بروزرسانی...' : 'بروزرسانی مشتری'}
                </button>
              </div>
            </div>
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
