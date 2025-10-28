'use client'

import React, { useState } from 'react'
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
  PieChart,
  LineChart,
  Calendar,
  Percent,
  Activity,
  Download,
  Printer,
  Filter,
  RefreshCw,
  Layout,
  Palette,
  Monitor,
  Camera,
  QrCode,
  Barcode,
  Signature,
  Stamp
} from 'lucide-react'

interface Permission {
  id: string
  name: string
  description: string
  category: string
  actions: string[]
}

interface Role {
  id: string
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
  name: string
  email: string
  role: string
  status: 'active' | 'inactive' | 'suspended'
  lastLogin: string
  branch: string
}

const mockPermissions: Permission[] = [
  // Dashboard
  { id: 'dashboard_view', name: 'مشاهده داشبورد', description: 'دسترسی به صفحه اصلی و آمار کلی', category: 'داشبورد', actions: ['view'] },
  
  // POS
  { id: 'pos_create', name: 'ایجاد سفارش', description: 'ثبت سفارشات جدید در سیستم POS', category: 'فروش', actions: ['create'] },
  { id: 'pos_update', name: 'ویرایش سفارش', description: 'تغییر سفارشات موجود', category: 'فروش', actions: ['update'] },
  { id: 'pos_delete', name: 'حذف سفارش', description: 'حذف سفارشات', category: 'فروش', actions: ['delete'] },
  { id: 'pos_view', name: 'مشاهده سفارشات', description: 'دیدن لیست سفارشات', category: 'فروش', actions: ['view'] },
  
  // Menu Management
  { id: 'menu_create', name: 'افزودن آیتم منو', description: 'اضافه کردن آیتم‌های جدید به منو', category: 'منو', actions: ['create'] },
  { id: 'menu_update', name: 'ویرایش منو', description: 'تغییر آیتم‌های منو', category: 'منو', actions: ['update'] },
  { id: 'menu_delete', name: 'حذف آیتم منو', description: 'حذف آیتم‌ها از منو', category: 'منو', actions: ['delete'] },
  { id: 'menu_view', name: 'مشاهده منو', description: 'دیدن منوی رستوران', category: 'منو', actions: ['view'] },
  
  // Inventory
  { id: 'inventory_create', name: 'ورود موجودی', description: 'ثبت ورود کالا به انبار', category: 'انبارداری', actions: ['create'] },
  { id: 'inventory_update', name: 'ویرایش موجودی', description: 'تغییر موجودی کالاها', category: 'انبارداری', actions: ['update'] },
  { id: 'inventory_delete', name: 'حذف موجودی', description: 'حذف رکوردهای موجودی', category: 'انبارداری', actions: ['delete'] },
  { id: 'inventory_view', name: 'مشاهده موجودی', description: 'دیدن موجودی انبار', category: 'انبارداری', actions: ['view'] },
  
  // Accounting
  { id: 'accounting_create', name: 'ثبت تراکنش مالی', description: 'ثبت دریافت و پرداخت', category: 'حسابداری', actions: ['create'] },
  { id: 'accounting_update', name: 'ویرایش تراکنش', description: 'تغییر تراکنش‌های مالی', category: 'حسابداری', actions: ['update'] },
  { id: 'accounting_delete', name: 'حذف تراکنش', description: 'حذف تراکنش‌های مالی', category: 'حسابداری', actions: ['delete'] },
  { id: 'accounting_view', name: 'مشاهده تراکنش‌ها', description: 'دیدن تراکنش‌های مالی', category: 'حسابداری', actions: ['view'] },
  { id: 'accounting_approve', name: 'تایید تراکنش', description: 'تایید تراکنش‌های مالی', category: 'حسابداری', actions: ['approve'] },
  
  // Reports
  { id: 'reports_view', name: 'مشاهده گزارشات', description: 'دسترسی به گزارشات سیستم', category: 'گزارشات', actions: ['view'] },
  { id: 'reports_export', name: 'صادرات گزارش', description: 'خروجی گرفتن از گزارشات', category: 'گزارشات', actions: ['export'] },
  
  // User Management
  { id: 'users_create', name: 'ایجاد کاربر', description: 'اضافه کردن کاربر جدید', category: 'مدیریت کاربران', actions: ['create'] },
  { id: 'users_update', name: 'ویرایش کاربر', description: 'تغییر اطلاعات کاربران', category: 'مدیریت کاربران', actions: ['update'] },
  { id: 'users_delete', name: 'حذف کاربر', description: 'حذف کاربران از سیستم', category: 'مدیریت کاربران', actions: ['delete'] },
  { id: 'users_view', name: 'مشاهده کاربران', description: 'دیدن لیست کاربران', category: 'مدیریت کاربران', actions: ['view'] },
  
  // Settings
  { id: 'settings_view', name: 'مشاهده تنظیمات', description: 'دسترسی به تنظیمات سیستم', category: 'تنظیمات', actions: ['view'] },
  { id: 'settings_update', name: 'ویرایش تنظیمات', description: 'تغییر تنظیمات سیستم', category: 'تنظیمات', actions: ['update'] }
]

const mockRoles: Role[] = [
  {
    id: 'admin',
    name: 'مدیر سیستم',
    description: 'دسترسی کامل به تمام بخش‌های سیستم',
    permissions: mockPermissions.map(p => p.id),
    userCount: 2,
    isSystem: true,
    createdAt: '1403/01/01',
    updatedAt: '1403/09/15'
  },
  {
    id: 'manager',
    name: 'مدیر رستوران',
    description: 'مدیریت عملیات روزانه رستوران',
    permissions: ['dashboard_view', 'pos_create', 'pos_update', 'pos_view', 'menu_view', 'inventory_view', 'accounting_view', 'reports_view', 'reports_export'],
    userCount: 3,
    isSystem: false,
    createdAt: '1403/01/01',
    updatedAt: '1403/09/10'
  },
  {
    id: 'cashier',
    name: 'صندوقدار',
    description: 'ثبت فروش و مدیریت صندوق',
    permissions: ['dashboard_view', 'pos_create', 'pos_update', 'pos_view', 'menu_view', 'accounting_create', 'accounting_view'],
    userCount: 5,
    isSystem: false,
    createdAt: '1403/01/01',
    updatedAt: '1403/09/12'
  },
  {
    id: 'waiter',
    name: 'گارسون',
    description: 'ثبت سفارشات و سرویس به مشتریان',
    permissions: ['dashboard_view', 'pos_create', 'pos_view', 'menu_view'],
    userCount: 8,
    isSystem: false,
    createdAt: '1403/01/01',
    updatedAt: '1403/09/08'
  },
  {
    id: 'chef',
    name: 'آشپز',
    description: 'مشاهده سفارشات و مدیریت آشپزخانه',
    permissions: ['dashboard_view', 'pos_view', 'menu_view'],
    userCount: 4,
    isSystem: false,
    createdAt: '1403/01/01',
    updatedAt: '1403/09/05'
  }
]

const mockUsers: User[] = [
  { id: '1', name: 'احمد محمدی', email: 'ahmad@restaurant.com', role: 'admin', status: 'active', lastLogin: '1403/09/15 14:30', branch: 'شعبه مرکزی' },
  { id: '2', name: 'فاطمه کریمی', email: 'fateme@restaurant.com', role: 'manager', status: 'active', lastLogin: '1403/09/15 13:45', branch: 'شعبه مرکزی' },
  { id: '3', name: 'رضا حسینی', email: 'reza@restaurant.com', role: 'cashier', status: 'active', lastLogin: '1403/09/15 12:20', branch: 'شعبه مرکزی' },
  { id: '4', name: 'مریم نوری', email: 'maryam@restaurant.com', role: 'waiter', status: 'active', lastLogin: '1403/09/15 11:15', branch: 'شعبه مرکزی' },
  { id: '5', name: 'حسن رضایی', email: 'hasan@restaurant.com', role: 'chef', status: 'active', lastLogin: '1403/09/15 10:30', branch: 'شعبه مرکزی' }
]

const getRoleIcon = (roleId: string) => {
  switch (roleId) {
    case 'admin': return Crown
    case 'manager': return Star
    case 'cashier': return CreditCard
    case 'waiter': return Utensils
    case 'chef': return ChefHat
    default: return User
  }
}

const getRoleColor = (roleId: string) => {
  switch (roleId) {
    case 'admin': return 'text-red-600 dark:text-red-400'
    case 'manager': return 'text-blue-600 dark:text-blue-400'
    case 'cashier': return 'text-green-600 dark:text-green-400'
    case 'waiter': return 'text-yellow-600 dark:text-yellow-400'
    case 'chef': return 'text-orange-600 dark:text-orange-400'
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
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [showUserModal, setShowUserModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  const filteredUsers = mockUsers.filter(user =>
    (searchTerm === '' || 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (filterRole === 'all' || user.role === filterRole) &&
    (filterStatus === 'all' || user.status === filterStatus)
  )

  const handleCreateRole = () => {
    setSelectedRole(null)
    setShowRoleModal(true)
  }

  const handleEditRole = (role: Role) => {
    setSelectedRole(role)
    setShowRoleModal(true)
  }

  const handleDeleteRole = (roleId: string) => {
    if (confirm('آیا از حذف این نقش اطمینان دارید؟')) {
      alert('نقش با موفقیت حذف شد.')
    }
  }

  const handleCreateUser = () => {
    setShowUserModal(true)
  }

  const handleEditUser = (user: User) => {
    setShowUserModal(true)
  }

  const handleDeleteUser = (userId: string) => {
    if (confirm('آیا از حذف این کاربر اطمینان دارید؟')) {
      alert('کاربر با موفقیت حذف شد.')
    }
  }

  const handleSaveRole = () => {
    alert('نقش با موفقیت ذخیره شد.')
    setShowRoleModal(false)
  }

  const handleSaveUser = () => {
    alert('کاربر با موفقیت ذخیره شد.')
    setShowUserModal(false)
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
            {mockRoles.map(role => {
              const RoleIcon = getRoleIcon(role.id)
              return (
                <div key={role.id} className="premium-card p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <div className={`w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center`}>
                        <RoleIcon className={`w-6 h-6 ${getRoleColor(role.id)}`} />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{role.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{role.userCount} کاربر</p>
                      </div>
                    </div>
                    {role.isSystem && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 text-xs rounded-full">
                        سیستم
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">{role.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {role.permissions.length} مجوز
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
                          onClick={() => handleDeleteRole(role.id)}
                          className="p-1 rounded-full text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
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
                {mockRoles.map(role => (
                  <option key={role.id} value={role.id}>{role.name}</option>
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
                  {filteredUsers.map(user => {
                    const RoleIcon = getRoleIcon(user.role)
                    return (
                      <tr key={user.id} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
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
                              {mockRoles.find(r => r.id === user.role)?.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {getStatusBadge(user.status)}
                        </td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{user.lastLogin}</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{user.branch}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <button
                              onClick={() => handleEditUser(user)}
                              className="p-1 rounded-full text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="p-1 rounded-full text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Permissions Tab */}
        {activeTab === 'permissions' && (
          <div className="space-y-6">
            {Object.entries(
              mockPermissions.reduce((acc, permission) => {
                if (!acc[permission.category]) {
                  acc[permission.category] = []
                }
                acc[permission.category].push(permission)
                return acc
              }, {} as Record<string, Permission[]>)
            ).map(([category, permissions]) => (
              <div key={category} className="premium-card p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{category}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {permissions.map(permission => (
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {selectedRole ? 'ویرایش نقش' : 'نقش جدید'}
              </h2>
              <button
                onClick={() => setShowRoleModal(false)}
                className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">نام نقش</label>
                <input
                  type="text"
                  className="premium-input"
                  defaultValue={selectedRole?.name || ''}
                  placeholder="نام نقش را وارد کنید"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">توضیحات</label>
                <textarea
                  className="premium-input"
                  rows={3}
                  defaultValue={selectedRole?.description || ''}
                  placeholder="توضیحات نقش را وارد کنید"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">مجوزها</label>
                <div className="max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  {Object.entries(
                    mockPermissions.reduce((acc, permission) => {
                      if (!acc[permission.category]) {
                        acc[permission.category] = []
                      }
                      acc[permission.category].push(permission)
                      return acc
                    }, {} as Record<string, Permission[]>)
                  ).map(([category, permissions]) => (
                    <div key={category} className="mb-4">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">{category}</h4>
                      <div className="space-y-2">
                        {permissions.map(permission => (
                          <label key={permission.id} className="flex items-center space-x-3 space-x-reverse">
                            <input
                              type="checkbox"
                              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                              defaultChecked={selectedRole?.permissions.includes(permission.id)}
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
                onClick={() => setShowRoleModal(false)}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">کاربر جدید</h2>
              <button
                onClick={() => setShowUserModal(false)}
                className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">نام کاربر</label>
                <input
                  type="text"
                  className="premium-input"
                  placeholder="نام کاربر را وارد کنید"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">ایمیل</label>
                <input
                  type="email"
                  className="premium-input"
                  placeholder="ایمیل کاربر را وارد کنید"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">نقش</label>
                <select className="premium-input">
                  {mockRoles.map(role => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">شعبه</label>
                <select className="premium-input">
                  <option value="main">شعبه مرکزی</option>
                  <option value="branch1">شعبه 1</option>
                  <option value="branch2">شعبه 2</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 space-x-reverse mt-6">
              <button
                onClick={() => setShowUserModal(false)}
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
