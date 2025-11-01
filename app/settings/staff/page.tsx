'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  Users, 
  UserPlus, 
  Edit, 
  Trash2, 
  Search,
  Filter,
  Save,
  Eye,
  EyeOff,
  Shield,
  Clock,
  DollarSign,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Star,
  CheckCircle,
  AlertCircle,
  User,
  UserCheck,
  UserX,
  X,
  XCircle
} from 'lucide-react'

interface StaffMember {
  id?: string
  _id?: string
  name: string
  email: string
  phone: string
  position: string
  department: string
  hireDate: string
  salary: number
  status: 'active' | 'inactive' | 'suspended'
  permissions: string[]
  lastLogin?: string | null
  avatar?: string
  address?: string
  emergencyContact?: string
  emergencyPhone?: string
  notes?: string
  performance: {
    rating: number
    totalOrders: number
    totalSales: number
    customerSatisfaction: number
  }
}

interface StaffStats {
  totalStaff: number
  activeStaff: number
  inactiveStaff: number
  suspendedStaff: number
  totalSalary: number
  averageRating: number
  departmentStats: Array<{ _id: string; count: number }>
  positionStats: Array<{ _id: string; count: number }>
}


export default function StaffManagementPage() {
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [stats, setStats] = useState<StaffStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchDebounced, setSearchDebounced] = useState('')
  const [filterDepartment, setFilterDepartment] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [sortBy, setSortBy] = useState('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    position: '',
    department: '',
    hireDate: '',
    salary: 0,
    status: 'active' as 'active' | 'inactive' | 'suspended',
    permissions: [] as string[],
    address: '',
    emergencyContact: '',
    emergencyPhone: '',
    notes: ''
  })

  const departments = ['all', 'مدیریت', 'اداری', 'آشپزخانه', 'سرویس', 'مالی', 'فروش']
  const positions = ['مدیر رستوران', 'منشی', 'آشپز', 'گارسون', 'حسابدار', 'فروشنده', 'انباردار']
  const availablePermissions = ['admin', 'orders', 'inventory', 'reports', 'staff', 'customers', 'financial']

  // Fetch staff list
  const fetchStaff = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchDebounced) params.append('search', searchDebounced)
      if (filterDepartment !== 'all') params.append('department', filterDepartment)
      if (filterStatus !== 'all') params.append('status', filterStatus)
      params.append('sortBy', sortBy)
      params.append('sortOrder', sortOrder)
      params.append('limit', '100')

      const response = await fetch(`/api/staff?${params.toString()}`)
      const result = await response.json()
      if (result.success) {
        setStaff(result.data || [])
      }
    } catch (error) {
      console.error('Error fetching staff:', error)
      alert('خطا در دریافت لیست کارکنان')
    } finally {
      setLoading(false)
    }
  }, [searchDebounced, filterDepartment, filterStatus, sortBy, sortOrder])

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/staff?type=stats')
      const result = await response.json()
      if (result.success) {
        setStats(result.data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }, [])

  // Load data on mount
  useEffect(() => {
    fetchStaff()
    fetchStats()
  }, [fetchStaff, fetchStats])

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounced(searchTerm)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  // Handle save staff member
  const handleSave = async () => {
    try {
      if (!formData.name || !formData.email || !formData.position || !formData.department) {
        alert('نام، ایمیل، سمت و بخش اجباری هستند')
        return
      }

      setSaving(true)
      
      const method = editingStaff ? 'PUT' : 'POST'
      const body = editingStaff
        ? { ...formData, id: editingStaff._id || editingStaff.id }
        : formData
      
      const response = await fetch('/api/staff', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      
      const result = await response.json()
      if (result.success) {
        alert(editingStaff ? '✅ کارمند با موفقیت به‌روزرسانی شد' : '✅ کارمند با موفقیت ایجاد شد')
        setShowForm(false)
        setEditingStaff(null)
        setFormData({
          name: '',
          email: '',
          phone: '',
          position: '',
          department: '',
          hireDate: '',
          salary: 0,
          status: 'active',
          permissions: [],
          address: '',
          emergencyContact: '',
          emergencyPhone: '',
          notes: ''
        })
        await Promise.all([fetchStaff(), fetchStats()])
      } else {
        alert(`❌ ${result.message || 'خطا در ذخیره کارمند'}`)
      }
    } catch (error) {
      console.error('Error saving staff:', error)
      alert('❌ خطا در ذخیره کارمند')
    } finally {
      setSaving(false)
    }
  }

  // Handle delete staff member
  const handleDeleteStaff = async (id: string) => {
    if (!confirm('آیا از حذف این کارمند اطمینان دارید؟')) {
      return
    }
    
    try {
      const response = await fetch(`/api/staff?id=${id}`, {
        method: 'DELETE'
      })
      
      const result = await response.json()
      if (result.success) {
        alert('✅ کارمند با موفقیت حذف شد')
        await Promise.all([fetchStaff(), fetchStats()])
      } else {
        alert(`❌ ${result.message || 'خطا در حذف کارمند'}`)
      }
    } catch (error) {
      console.error('Error deleting staff:', error)
      alert('❌ خطا در حذف کارمند')
    }
  }

  const togglePermission = (permission: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
      case 'inactive': return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
      case 'suspended': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'فعال'
      case 'inactive': return 'غیرفعال'
      case 'suspended': return 'تعلیق'
      default: return 'نامشخص'
    }
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/80 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold gradient-text mb-2">مدیریت کارکنان</h1>
          <p className="text-gray-600 dark:text-gray-300">مدیریت اطلاعات و دسترسی‌های کارکنان</p>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="premium-card p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-l-4 border-blue-500 hover:shadow-xl transition-all duration-300 group">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Users className="w-7 h-7 text-white" />
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">کل کارکنان</h3>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {stats.totalStaff.toLocaleString('fa-IR')}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">کل کارکنان ثبت شده</p>
            </div>
            <div className="premium-card p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-l-4 border-green-500 hover:shadow-xl transition-all duration-300 group">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <UserCheck className="w-7 h-7 text-white" />
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">کارکنان فعال</h3>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {stats.activeStaff.toLocaleString('fa-IR')}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">کارکنان فعال</p>
            </div>
            <div className="premium-card p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-l-4 border-purple-500 hover:shadow-xl transition-all duration-300 group">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <DollarSign className="w-7 h-7 text-white" />
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">کل حقوق</h3>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {stats.totalSalary.toLocaleString('fa-IR')}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">تومان</p>
            </div>
            <div className="premium-card p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-l-4 border-yellow-500 hover:shadow-xl transition-all duration-300 group">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Star className="w-7 h-7 text-white" />
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">میانگین عملکرد</h3>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {stats.averageRating.toFixed(1)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">از 5</p>
            </div>
          </div>
        )}

        {/* Filters and Actions */}
        <div className="premium-card p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="flex-1 relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="جستجو در کارکنان..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                {departments.map(department => (
                  <option key={department} value={department}>
                    {department === 'all' ? 'همه بخش‌ها' : department}
                  </option>
                ))}
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="all">همه وضعیت‌ها</option>
                <option value="active">فعال</option>
                <option value="inactive">غیرفعال</option>
                <option value="suspended">تعلیق</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="name">نام</option>
                <option value="position">سمت</option>
                <option value="department">بخش</option>
                <option value="hireDate">تاریخ استخدام</option>
                <option value="salary">حقوق</option>
                <option value="performance">عملکرد</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700"
                title={sortOrder === 'asc' ? 'صعودی' : 'نزولی'}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
              <button
                onClick={() => fetchStaff()}
                className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700"
                disabled={loading}
                title="بروزرسانی"
              >
                <Filter className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center space-x-2 space-x-reverse px-6 py-3 bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <UserPlus className="w-5 h-5" />
              <span className="font-semibold">کارمند جدید</span>
            </button>
          </div>
        </div>

        {/* Staff Table */}
        <div className="premium-card p-6">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">لیست کارکنان</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">مدیریت اطلاعات و دسترسی‌های کارکنان</p>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-gray-600 dark:text-gray-400">در حال بارگذاری...</p>
                </div>
              </div>
            ) : staff.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-20 h-20 mb-4 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center">
                  <Users className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">هیچ کارمندی یافت نشد</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">کارکنان در اینجا نمایش داده می‌شوند</p>
                <button
                  onClick={() => setShowForm(true)}
                  className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>افزودن کارمند جدید</span>
                </button>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200 dark:border-gray-600/30 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700">
                    <th className="text-right py-4 px-6 text-sm font-semibold text-gray-700 dark:text-gray-300">نام کارمند</th>
                    <th className="text-right py-4 px-6 text-sm font-semibold text-gray-700 dark:text-gray-300">سمت</th>
                    <th className="text-right py-4 px-6 text-sm font-semibold text-gray-700 dark:text-gray-300">بخش</th>
                    <th className="text-right py-4 px-6 text-sm font-semibold text-gray-700 dark:text-gray-300">حقوق</th>
                    <th className="text-right py-4 px-6 text-sm font-semibold text-gray-700 dark:text-gray-300">عملکرد</th>
                    <th className="text-right py-4 px-6 text-sm font-semibold text-gray-700 dark:text-gray-300">وضعیت</th>
                    <th className="text-right py-4 px-6 text-sm font-semibold text-gray-700 dark:text-gray-300">عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {staff.map((member) => (
                    <tr key={member._id || member.id} className="border-b border-gray-100 dark:border-gray-700/30 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/50 dark:hover:from-gray-700 dark:hover:to-gray-700 transition-all duration-200 group">
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-3 space-x-reverse">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                            <User className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">{member.name}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{member.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-gray-900 dark:text-white font-medium">{member.position}</span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="px-3 py-1 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium">
                          {member.department}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-gray-900 dark:text-white font-medium">
                          {member.salary.toLocaleString('fa-IR')} <span className="text-xs text-gray-500">تومان</span>
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <Star className="w-5 h-5 text-yellow-500 fill-current" />
                          <span className="text-gray-900 dark:text-white font-semibold">{member.performance.rating.toFixed(1)}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(member.status)}`}>
                          {getStatusText(member.status)}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setEditingStaff(member)
                              setFormData({
                                name: member.name,
                                email: member.email,
                                phone: member.phone,
                                position: member.position,
                                department: member.department,
                                hireDate: member.hireDate,
                                salary: member.salary,
                                status: member.status,
                                permissions: member.permissions,
                                address: member.address || '',
                                emergencyContact: member.emergencyContact || '',
                                emergencyPhone: member.emergencyPhone || '',
                                notes: member.notes || ''
                              })
                              setShowForm(true)
                            }}
                            className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-all hover:scale-110"
                            title="ویرایش"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteStaff(member._id || member.id || '')
                            }}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all hover:scale-110"
                            title="حذف"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="relative px-6 py-5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                      {editingStaff ? <Edit className="w-6 h-6 text-white" /> : <UserPlus className="w-6 h-6 text-white" />}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">
                        {editingStaff ? 'ویرایش کارمند' : 'کارمند جدید'}
                      </h3>
                      <p className="text-sm text-white/90 mt-0.5">
                        {editingStaff ? 'ویرایش اطلاعات کارمند' : 'افزودن کارمند جدید به سیستم'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowForm(false)
                      setEditingStaff(null)
                      setFormData({
                        name: '',
                        email: '',
                        phone: '',
                        position: '',
                        department: '',
                        hireDate: '',
                        salary: 0,
                        status: 'active',
                        permissions: [],
                        address: '',
                        emergencyContact: '',
                        emergencyPhone: '',
                        notes: ''
                      })
                    }}
                    className="p-2 rounded-xl hover:bg-white/20 transition-colors"
                  >
                    <XCircle className="w-6 h-6 text-white" />
                  </button>
                </div>
              </div>
              
              <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    نام کامل
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
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
                    تلفن
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    سمت
                  </label>
                  <select
                    value={formData.position}
                    onChange={(e) => setFormData({...formData, position: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">انتخاب کنید</option>
                    {positions.map(position => (
                      <option key={position} value={position}>{position}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    بخش
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">انتخاب کنید</option>
                    {departments.filter(d => d !== 'all').map(department => (
                      <option key={department} value={department}>{department}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    تاریخ استخدام
                  </label>
                  <input
                    type="date"
                    value={formData.hireDate}
                    onChange={(e) => setFormData({...formData, hireDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    حقوق (تومان)
                  </label>
                  <input
                    type="number"
                    value={formData.salary}
                    onChange={(e) => setFormData({...formData, salary: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    وضعیت
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value as 'active' | 'inactive' | 'suspended'})}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="active">فعال</option>
                    <option value="inactive">غیرفعال</option>
                    <option value="suspended">تعلیق</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    دسترسی‌ها
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {availablePermissions.map(permission => (
                      <label key={permission} className="flex items-center space-x-2 space-x-reverse">
                        <input
                          type="checkbox"
                          checked={formData.permissions.includes(permission)}
                          onChange={() => togglePermission(permission)}
                          className="w-4 h-4 text-primary-600"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {permission === 'admin' ? 'مدیریت' :
                           permission === 'orders' ? 'سفارشات' :
                           permission === 'inventory' ? 'موجودی' :
                           permission === 'reports' ? 'گزارشات' :
                           permission === 'staff' ? 'کارکنان' :
                           permission === 'customers' ? 'مشتریان' :
                           'مالی'}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    آدرس
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    تماس اضطراری
                  </label>
                  <input
                    type="text"
                    value={formData.emergencyContact}
                    onChange={(e) => setFormData({...formData, emergencyContact: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    تلفن اضطراری
                  </label>
                  <input
                    type="tel"
                    value={formData.emergencyPhone}
                    onChange={(e) => setFormData({...formData, emergencyPhone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    یادداشت
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    rows={3}
                  />
                </div>
              </div>
                <div className="flex items-center justify-end space-x-3 space-x-reverse mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => {
                      setShowForm(false)
                      setEditingStaff(null)
                      setFormData({
                        name: '',
                        email: '',
                        phone: '',
                        position: '',
                        department: '',
                        hireDate: '',
                        salary: 0,
                        status: 'active',
                        permissions: [],
                        address: '',
                        emergencyContact: '',
                        emergencyPhone: '',
                        notes: ''
                      })
                    }}
                    className="px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold rounded-xl transition-all duration-200"
                  >
                    انصراف
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center space-x-2 space-x-reverse px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>در حال ذخیره...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>ذخیره</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
