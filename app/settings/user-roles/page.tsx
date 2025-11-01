'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Shield,
  Users,
  Lock,
  Key,
  Eye,
  Edit,
  Trash2,
  Plus,
  Save,
  X,
  CheckCircle,
  XCircle,
  AlertTriangle,
  User,
  UserCheck,
  UserX,
  Crown,
  Star,
  Award,
  Settings,
  Database,
  FileText,
  BarChart3,
  Calculator,
  ShoppingCart,
  Warehouse,
  Receipt,
  CreditCard,
  Banknote,
  TrendingUp,
  Package,
  Utensils,
  ChefHat,
  Coffee,
  Pizza,
  IceCream,
  Bell,
  HelpCircle,
  PlayCircle,
  Zap,
  Building,
  MapPin,
  ClipboardList,
  History,
  FileCheck,
  Search,
  Target,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  Calendar,
  Percent,
  Activity,
  Download,
  Printer,
  Filter,
  RefreshCw,
  Loader
} from 'lucide-react'
import PieChart from '@/components/Charts/PieChart'
import BarChart from '@/components/Charts/BarChart'

interface Permission {
  id: string
  name: string
  description: string
  category: string
  actions: string[]
}

interface Role {
  id: string
  _id?: string
  name: string
  description: string
  permissions: string[]
  userCount: number
  isSystem: boolean
  createdAt: string
  updatedAt: string
}

interface User {
  id: string
  _id?: string
  name: string
  email: string
  username?: string
  role: string
  roleId?: string
  status: 'active' | 'inactive' | 'suspended'
  lastLogin: string
  branch: string
}

interface StatsData {
  totalRoles: number
  totalUsers: number
  activeUsers: number
  inactiveUsers: number
  rolesData: { name: string; count: number }[]
}

const getRoleIcon = (roleId: string) => {
  switch (roleId?.toLowerCase()) {
    case 'admin':
    case 'مدیر سیستم': return Crown
    case 'manager':
    case 'مدیر رستوران': return Star
    case 'cashier':
    case 'صندوقدار': return CreditCard
    case 'waiter':
    case 'گارسون': return Utensils
    case 'chef':
    case 'آشپز': return ChefHat
    default: return User
  }
}

const getRoleColor = (roleId: string) => {
  switch (roleId?.toLowerCase()) {
    case 'admin':
    case 'مدیر سیستم': return 'text-red-600 dark:text-red-400'
    case 'manager':
    case 'مدیر رستوران': return 'text-blue-600 dark:text-blue-400'
    case 'cashier':
    case 'صندوقدار': return 'text-green-600 dark:text-green-400'
    case 'waiter':
    case 'گارسون': return 'text-yellow-600 dark:text-yellow-400'
    case 'chef':
    case 'آشپز': return 'text-orange-600 dark:text-orange-400'
    default: return 'text-gray-600 dark:text-gray-400'
  }
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'active': return <span className="status-badge bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">فعال</span>
    case 'inactive': return <span className="status-badge bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300">غیرفعال</span>
    case 'suspended': return <span className="status-badge bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">تعلیق</span>
    default: return null
  }
}

export default function UserRolesPage() {
  const [activeTab, setActiveTab] = useState<'roles' | 'users' | 'permissions'>('roles')
  const [roles, setRoles] = useState<Role[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [showUserModal, setShowUserModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  
  // Form states
  const [roleForm, setRoleForm] = useState({
    name: '',
    description: '',
    permissions: [] as string[]
  })
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    username: '',
    role: '',
    branch: 'main',
    status: 'active' as 'active' | 'inactive' | 'suspended'
  })

  // Fetch roles
  const fetchRoles = useCallback(async () => {
    try {
      const response = await fetch('/api/user-roles?type=roles')
      const result = await response.json()
      if (result.success) {
        setRoles(result.data || [])
      }
    } catch (error) {
      console.error('Error fetching roles:', error)
      alert('خطا در دریافت نقش‌ها')
    }
  }, [])

  // Fetch users
  const fetchUsers = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (filterRole !== 'all') params.append('role', filterRole)
      if (filterStatus !== 'all') params.append('status', filterStatus)
      
      const response = await fetch(`/api/user-roles?type=users&${params}`)
      const result = await response.json()
      if (result.success) {
        setUsers(result.data || [])
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      alert('خطا در دریافت کاربران')
    }
  }, [searchTerm, filterRole, filterStatus])

  // Fetch permissions
  const fetchPermissions = useCallback(async () => {
    try {
      const response = await fetch('/api/user-roles?type=permissions')
      const result = await response.json()
      if (result.success) {
        setPermissions(result.data || [])
      }
    } catch (error) {
      console.error('Error fetching permissions:', error)
    }
  }, [])

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/user-roles?type=stats')
      const result = await response.json()
      if (result.success) {
        setStats(result.data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }, [])

  // Load data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([
        fetchRoles(),
        fetchUsers(),
        fetchPermissions(),
        fetchStats()
      ])
      setLoading(false)
    }
    loadData()
  }, [fetchRoles, fetchPermissions, fetchStats])

  // Reload users when filters change
  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers()
    }
  }, [searchTerm, filterRole, filterStatus, activeTab, fetchUsers])

  const filteredUsers = useMemo(() => {
    return users.filter(user =>
      (searchTerm === '' || 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (filterRole === 'all' || user.role === filterRole || user.roleId === filterRole) &&
      (filterStatus === 'all' || user.status === filterStatus)
    )
  }, [users, searchTerm, filterRole, filterStatus])

  // CRUD Handlers
  const handleCreateRole = () => {
    setSelectedRole(null)
    setRoleForm({ name: '', description: '', permissions: [] })
    setShowRoleModal(true)
  }

  const handleEditRole = (role: Role) => {
    setSelectedRole(role)
    setRoleForm({
      name: role.name,
      description: role.description || '',
      permissions: role.permissions || []
    })
    setShowRoleModal(true)
  }

  const handleDeleteRole = async (roleId: string) => {
    if (!confirm('آیا از حذف این نقش اطمینان دارید؟')) {
      return
    }

    try {
      const response = await fetch(`/api/user-roles?entity=role&id=${roleId}`, {
        method: 'DELETE'
      })
      const result = await response.json()
      
      if (result.success) {
        alert('نقش با موفقیت حذف شد')
        // Refresh data
        await Promise.all([fetchRoles(), fetchStats()])
      } else {
        alert(result.message || 'خطا در حذف نقش')
      }
    } catch (error) {
      console.error('Error deleting role:', error)
      alert('خطا در حذف نقش')
    }
  }

  const handleSaveRole = async () => {
    try {
      if (!roleForm.name) {
        alert('نام نقش اجباری است')
        return
      }

      const method = selectedRole ? 'PUT' : 'POST'
      const body = {
        entity: 'role',
        ...(selectedRole && { id: selectedRole._id || selectedRole.id }),
        name: roleForm.name,
        description: roleForm.description,
        permissions: roleForm.permissions,
        isSystem: false
      }

      const response = await fetch('/api/user-roles', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const result = await response.json()

      if (result.success) {
        alert(selectedRole ? 'نقش با موفقیت به‌روزرسانی شد' : 'نقش با موفقیت ایجاد شد')
        setShowRoleModal(false)
        setSelectedRole(null)
        setRoleForm({ name: '', description: '', permissions: [] })
        // Refresh data
        await Promise.all([fetchRoles(), fetchStats()])
      } else {
        alert(result.message || 'خطا در ذخیره نقش')
      }
    } catch (error) {
      console.error('Error saving role:', error)
      alert('خطا در ذخیره نقش')
    }
  }

  const handleCreateUser = () => {
    setSelectedUser(null)
    setUserForm({ name: '', email: '', username: '', role: '', branch: 'main', status: 'active' })
    setShowUserModal(true)
  }

  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setUserForm({
      name: user.name,
      email: user.email,
      username: user.username || '',
      role: user.roleId || user.role,
      branch: 'main',
      status: user.status
    })
    setShowUserModal(true)
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('آیا از حذف این کاربر اطمینان دارید؟')) {
      return
    }

    try {
      const response = await fetch(`/api/user-roles?entity=user&id=${userId}`, {
        method: 'DELETE'
      })
      const result = await response.json()
      
      if (result.success) {
        alert('کاربر با موفقیت حذف شد')
        // Refresh data
        await Promise.all([fetchUsers(), fetchStats()])
      } else {
        alert(result.message || 'خطا در حذف کاربر')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('خطا در حذف کاربر')
    }
  }

  const handleSaveUser = async () => {
    try {
      if (!userForm.name || !userForm.email || !userForm.role) {
        alert('نام، ایمیل و نقش کاربر اجباری است')
        return
      }

      const method = selectedUser ? 'PUT' : 'POST'
      const body = {
        entity: 'user',
        ...(selectedUser && { id: selectedUser._id || selectedUser.id }),
        name: userForm.name,
        email: userForm.email,
        username: userForm.username || userForm.email.split('@')[0],
        role: userForm.role,
        branch: userForm.branch,
        status: userForm.status
      }

      const response = await fetch('/api/user-roles', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const result = await response.json()

      if (result.success) {
        alert(selectedUser ? 'کاربر با موفقیت به‌روزرسانی شد' : 'کاربر با موفقیت ایجاد شد')
        setShowUserModal(false)
        setSelectedUser(null)
        setUserForm({ name: '', email: '', username: '', role: '', branch: 'main', status: 'active' })
        // Refresh data
        await Promise.all([fetchUsers(), fetchStats()])
      } else {
        alert(result.message || 'خطا در ذخیره کاربر')
      }
    } catch (error) {
      console.error('Error saving user:', error)
      alert('خطا در ذخیره کاربر')
    }
  }

  // Chart data
  const rolesChartData = useMemo(() => {
    if (!stats?.rolesData || stats.rolesData.length === 0) return []
    const colors = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6']
    return stats.rolesData.map((item, index) => ({
      name: item.name || `نقش ${index + 1}`,
      value: item.count || 0,
      color: colors[index % colors.length]
    })).filter(item => item.value > 0)
  }, [stats])

  const usersStatusChartData = useMemo(() => {
    if (!stats) return []
    return [
      { period: 'فعال', revenue: stats.activeUsers },
      { period: 'غیرفعال', revenue: stats.inactiveUsers }
    ].filter(item => (item.revenue || 0) > 0)
  }, [stats])

  const permissionsByCategory = useMemo(() => {
    if (!permissions.length) return []
    const grouped = permissions.reduce((acc, perm) => {
      if (!acc[perm.category]) acc[perm.category] = 0
      acc[perm.category]++
      return acc
    }, {} as Record<string, number>)
    
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4']
    return Object.entries(grouped).map(([category, count], index) => ({
      name: category || `دسته ${index + 1}`,
      value: count || 0,
      color: colors[index % colors.length]
    })).filter(item => item.value > 0)
  }, [permissions])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="fade-in-animation space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">سطح دسترسی کاربران (RBAC)</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            مدیریت نقش‌ها، مجوزها و کنترل دسترسی کاربران به بخش‌های مختلف سیستم.
          </p>
        </div>
        <div className="flex items-center space-x-3 space-x-reverse">
          <button
            onClick={handleCreateRole}
            className="premium-button flex items-center space-x-2 space-x-reverse"
          >
            <Plus className="w-5 h-5" />
            <span>نقش جدید</span>
          </button>
          <button
            onClick={handleCreateUser}
            className="premium-button flex items-center space-x-2 space-x-reverse"
          >
            <User className="w-5 h-5" />
            <span>کاربر جدید</span>
          </button>
        </div>
      </div>

      {/* Stats Dashboard */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="premium-card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">کل نقش‌ها</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalRoles}</p>
              </div>
              <Shield className="w-8 h-8 text-primary-600" />
            </div>
          </div>
          <div className="premium-card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">کل کاربران</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalUsers}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="premium-card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">کاربران فعال</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.activeUsers}</p>
              </div>
              <UserCheck className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="premium-card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">کاربران غیرفعال</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.inactiveUsers}</p>
              </div>
              <UserX className="w-8 h-8 text-red-600" />
            </div>
          </div>
        </div>
      )}

      {/* Charts */}
      {(rolesChartData.length > 0 || usersStatusChartData.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {rolesChartData.length > 0 && (
            <div className="premium-card p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">توزیع کاربران بر اساس نقش</h3>
              <div className="h-64">
                <PieChart data={rolesChartData} title="نقش‌ها" />
              </div>
            </div>
          )}
          {usersStatusChartData.length > 0 && (
            <div className="premium-card p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">وضعیت کاربران</h3>
              <div className="h-64">
                <BarChart data={usersStatusChartData} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="premium-card p-6">
        <div className="flex space-x-1 space-x-reverse bg-gray-100 dark:bg-gray-800 rounded-lg p-1 mb-6">
          <button
            onClick={() => setActiveTab('roles')}
            className={`flex-1 flex items-center justify-center space-x-2 space-x-reverse px-4 py-2 rounded-md transition-all duration-200 ${
              activeTab === 'roles'
                ? 'bg-white dark:bg-gray-700 text-primary-600 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Shield className="w-5 h-5" />
            <span>نقش‌ها</span>
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 flex items-center justify-center space-x-2 space-x-reverse px-4 py-2 rounded-md transition-all duration-200 ${
              activeTab === 'users'
                ? 'bg-white dark:bg-gray-700 text-primary-600 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Users className="w-5 h-5" />
            <span>کاربران</span>
          </button>
          <button
            onClick={() => setActiveTab('permissions')}
            className={`flex-1 flex items-center justify-center space-x-2 space-x-reverse px-4 py-2 rounded-md transition-all duration-200 ${
              activeTab === 'permissions'
                ? 'bg-white dark:bg-gray-700 text-primary-600 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Key className="w-5 h-5" />
            <span>مجوزها</span>
          </button>
        </div>

        {/* Roles Tab */}
        {activeTab === 'roles' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roles.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-300">نقشی یافت نشد</p>
              </div>
            ) : (
              roles.map(role => {
                const RoleIcon = getRoleIcon(role.name)
                return (
                  <div key={role.id || role._id} className="premium-card p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3 space-x-reverse">
                        <div className={`w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center`}>
                          <RoleIcon className={`w-6 h-6 ${getRoleColor(role.name)}`} />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{role.name}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{role.userCount || 0} کاربر</p>
                        </div>
                      </div>
                      {role.isSystem && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 text-xs rounded-full">
                          سیستم
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">{role.description || '-'}</p>
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {(role.permissions || []).length} مجوز
                      </div>
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <button
                          onClick={() => handleEditRole(role)}
                          className="p-1 rounded-full text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {!role.isSystem && (
                          <button
                            onClick={() => handleDeleteRole(role._id || role.id)}
                            className="p-1 rounded-full text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="جستجو کاربر..."
                  className="premium-input pr-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                className="premium-input"
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
              >
                <option value="all">همه نقش‌ها</option>
                {roles.map(role => (
                  <option key={role.id || role._id} value={role.id || role._id}>{role.name}</option>
                ))}
              </select>
              <select
                className="premium-input"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">همه وضعیت‌ها</option>
                <option value="active">فعال</option>
                <option value="inactive">غیرفعال</option>
                <option value="suspended">تعلیق</option>
              </select>
              <button
                onClick={() => {
                  setSearchTerm('')
                  setFilterRole('all')
                  setFilterStatus('all')
                }}
                className="premium-button bg-gray-500 hover:bg-gray-600"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-right whitespace-nowrap">
                <thead>
                  <tr className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-800/50">
                    <th className="px-4 py-3 rounded-r-lg">نام کاربر</th>
                    <th className="px-4 py-3">ایمیل</th>
                    <th className="px-4 py-3">نقش</th>
                    <th className="px-4 py-3">وضعیت</th>
                    <th className="px-4 py-3">آخرین ورود</th>
                    <th className="px-4 py-3">شعبه</th>
                    <th className="px-4 py-3 rounded-l-lg">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                        کاربری یافت نشد
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map(user => {
                      const RoleIcon = getRoleIcon(user.role)
                      const userRole = roles.find(r => (r.id || r._id) === (user.roleId || user.role))
                      return (
                        <tr key={user.id || user._id} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center space-x-3 space-x-reverse">
                              <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                                <User className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                              </div>
                              <span className="font-medium text-gray-900 dark:text-white">{user.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{user.email}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center space-x-2 space-x-reverse">
                              <RoleIcon className={`w-4 h-4 ${getRoleColor(user.role)}`} />
                              <span className="text-gray-700 dark:text-gray-200">
                                {userRole?.name || user.role}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {getStatusBadge(user.status)}
                          </td>
                          <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{user.lastLogin || '-'}</td>
                          <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{user.branch || '-'}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center space-x-2 space-x-reverse">
                              <button
                                onClick={() => handleEditUser(user)}
                                className="p-1 rounded-full text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteUser(user._id || user.id)}
                                className="p-1 rounded-full text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Permissions Tab */}
        {activeTab === 'permissions' && (
          <div className="space-y-6">
            {permissionsByCategory.length > 0 && (
              <div className="premium-card p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">توزیع مجوزها بر اساس دسته</h3>
                <div className="h-64">
                  <PieChart data={permissionsByCategory} title="دسته‌بندی‌ها" />
                </div>
              </div>
            )}
            {Object.entries(
              permissions.reduce((acc, permission) => {
                if (!acc[permission.category]) {
                  acc[permission.category] = []
                }
                acc[permission.category].push(permission)
                return acc
              }, {} as Record<string, Permission[]>)
            ).map(([category, perms]) => (
              <div key={category} className="premium-card p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{category}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {perms.map(permission => (
                    <div key={permission.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">{permission.name}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{permission.description}</p>
                      </div>
                      <div className="flex items-center space-x-2 space-x-reverse">
                        {permission.actions.map(action => (
                          <span key={action} className="px-2 py-1 bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300 text-xs rounded-full">
                            {action}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Role Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {selectedRole ? 'ویرایش نقش' : 'نقش جدید'}
              </h2>
              <button
                onClick={() => {
                  setShowRoleModal(false)
                  setSelectedRole(null)
                  setRoleForm({ name: '', description: '', permissions: [] })
                }}
                className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">نام نقش *</label>
                <input
                  type="text"
                  className="premium-input"
                  value={roleForm.name}
                  onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                  placeholder="نام نقش را وارد کنید"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">توضیحات</label>
                <textarea
                  className="premium-input"
                  rows={3}
                  value={roleForm.description}
                  onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                  placeholder="توضیحات نقش را وارد کنید"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">مجوزها</label>
                <div className="max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  {Object.entries(
                    permissions.reduce((acc, permission) => {
                      if (!acc[permission.category]) {
                        acc[permission.category] = []
                      }
                      acc[permission.category].push(permission)
                      return acc
                    }, {} as Record<string, Permission[]>)
                  ).map(([category, perms]) => (
                    <div key={category} className="mb-4">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">{category}</h4>
                      <div className="space-y-2">
                        {perms.map(permission => (
                          <label key={permission.id} className="flex items-center space-x-3 space-x-reverse">
                            <input
                              type="checkbox"
                              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                              checked={roleForm.permissions.includes(permission.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setRoleForm({ ...roleForm, permissions: [...roleForm.permissions, permission.id] })
                                } else {
                                  setRoleForm({ ...roleForm, permissions: roleForm.permissions.filter(p => p !== permission.id) })
                                }
                              }}
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">{permission.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 space-x-reverse mt-6">
              <button
                onClick={() => {
                  setShowRoleModal(false)
                  setSelectedRole(null)
                  setRoleForm({ name: '', description: '', permissions: [] })
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                انصراف
              </button>
              <button
                onClick={handleSaveRole}
                className="premium-button flex items-center space-x-2 space-x-reverse"
              >
                <Save className="w-5 h-5" />
                <span>ذخیره</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {selectedUser ? 'ویرایش کاربر' : 'کاربر جدید'}
              </h2>
              <button
                onClick={() => {
                  setShowUserModal(false)
                  setSelectedUser(null)
                  setUserForm({ name: '', email: '', username: '', role: '', branch: 'main', status: 'active' })
                }}
                className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">نام کاربر *</label>
                <input
                  type="text"
                  className="premium-input"
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  placeholder="نام کاربر را وارد کنید"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">ایمیل *</label>
                <input
                  type="email"
                  className="premium-input"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  placeholder="ایمیل کاربر را وارد کنید"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">نام کاربری</label>
                <input
                  type="text"
                  className="premium-input"
                  value={userForm.username}
                  onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                  placeholder="نام کاربری (اختیاری)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">نقش *</label>
                <select
                  className="premium-input"
                  value={userForm.role}
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                >
                  <option value="">انتخاب نقش</option>
                  {roles.map(role => (
                    <option key={role.id || role._id} value={role.id || role._id}>{role.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">وضعیت</label>
                <select
                  className="premium-input"
                  value={userForm.status}
                  onChange={(e) => setUserForm({ ...userForm, status: e.target.value as any })}
                >
                  <option value="active">فعال</option>
                  <option value="inactive">غیرفعال</option>
                  <option value="suspended">تعلیق</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">شعبه</label>
                <select
                  className="premium-input"
                  value={userForm.branch}
                  onChange={(e) => setUserForm({ ...userForm, branch: e.target.value })}
                >
                  <option value="main">شعبه مرکزی</option>
                  <option value="branch1">شعبه 1</option>
                  <option value="branch2">شعبه 2</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 space-x-reverse mt-6">
              <button
                onClick={() => {
                  setShowUserModal(false)
                  setSelectedUser(null)
                  setUserForm({ name: '', email: '', username: '', role: '', branch: 'main', status: 'active' })
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                انصراف
              </button>
              <button
                onClick={handleSaveUser}
                className="premium-button flex items-center space-x-2 space-x-reverse"
              >
                <Save className="w-5 h-5" />
                <span>ذخیره</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
