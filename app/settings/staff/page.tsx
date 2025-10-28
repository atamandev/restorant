'use client'

import { useState } from 'react'
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
  UserX
} from 'lucide-react'

interface StaffMember {
  id: string
  name: string
  email: string
  phone: string
  position: string
  department: string
  hireDate: string
  salary: number
  status: 'active' | 'inactive' | 'suspended'
  permissions: string[]
  lastLogin: string
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

const initialStaff: StaffMember[] = [
  {
    id: '1',
    name: 'احمد محمدی',
    email: 'ahmad@restaurant.com',
    phone: '09123456789',
    position: 'مدیر رستوران',
    department: 'مدیریت',
    hireDate: '1402/01/15',
    salary: 15000000,
    status: 'active',
    permissions: ['admin', 'orders', 'inventory', 'reports', 'staff'],
    lastLogin: '1403/01/20 14:30',
    address: 'تهران، خیابان ولیعصر، پلاک 123',
    emergencyContact: 'فاطمه محمدی',
    emergencyPhone: '09123456790',
    notes: 'مدیر با تجربه و مسئول',
    performance: {
      rating: 4.8,
      totalOrders: 1250,
      totalSales: 45000000,
      customerSatisfaction: 4.7
    }
  },
  {
    id: '2',
    name: 'سارا کریمی',
    email: 'sara@restaurant.com',
    phone: '09123456791',
    position: 'منشی',
    department: 'اداری',
    hireDate: '1402/06/20',
    salary: 8000000,
    status: 'active',
    permissions: ['orders', 'customers'],
    lastLogin: '1403/01/20 13:45',
    address: 'تهران، خیابان کریمخان، پلاک 456',
    emergencyContact: 'علی کریمی',
    emergencyPhone: '09123456792',
    notes: 'منشی با تجربه و دقیق',
    performance: {
      rating: 4.5,
      totalOrders: 850,
      totalSales: 28000000,
      customerSatisfaction: 4.6
    }
  },
  {
    id: '3',
    name: 'رضا حسینی',
    email: 'reza@restaurant.com',
    phone: '09123456793',
    position: 'آشپز',
    department: 'آشپزخانه',
    hireDate: '1402/03/10',
    salary: 12000000,
    status: 'active',
    permissions: ['orders', 'inventory'],
    lastLogin: '1403/01/20 12:15',
    address: 'تهران، خیابان آزادی، پلاک 789',
    emergencyContact: 'مریم حسینی',
    emergencyPhone: '09123456794',
    notes: 'آشپز ماهر و خلاق',
    performance: {
      rating: 4.7,
      totalOrders: 2100,
      totalSales: 75000000,
      customerSatisfaction: 4.8
    }
  },
  {
    id: '4',
    name: 'مریم نوری',
    email: 'maryam@restaurant.com',
    phone: '09123456795',
    position: 'گارسون',
    department: 'سرویس',
    hireDate: '1403/01/05',
    salary: 6000000,
    status: 'active',
    permissions: ['orders'],
    lastLogin: '1403/01/20 15:20',
    address: 'تهران، خیابان انقلاب، پلاک 321',
    emergencyContact: 'حسن نوری',
    emergencyPhone: '09123456796',
    notes: 'گارسون جدید و پرانرژی',
    performance: {
      rating: 4.2,
      totalOrders: 150,
      totalSales: 5500000,
      customerSatisfaction: 4.3
    }
  },
  {
    id: '5',
    name: 'علی احمدی',
    email: 'ali@restaurant.com',
    phone: '09123456797',
    position: 'حسابدار',
    department: 'مالی',
    hireDate: '1402/09/15',
    salary: 10000000,
    status: 'inactive',
    permissions: ['reports', 'financial'],
    lastLogin: '1403/01/18 16:00',
    address: 'تهران، خیابان طالقانی، پلاک 654',
    emergencyContact: 'زهرا احمدی',
    emergencyPhone: '09123456798',
    notes: 'حسابدار با تجربه',
    performance: {
      rating: 4.4,
      totalOrders: 0,
      totalSales: 0,
      customerSatisfaction: 0
    }
  }
]

export default function StaffManagementPage() {
  const [staff, setStaff] = useState<StaffMember[]>(initialStaff)
  const [showForm, setShowForm] = useState(false)
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterDepartment, setFilterDepartment] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [sortBy, setSortBy] = useState('name')

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

  const filteredStaff = staff.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.position.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDepartment = filterDepartment === 'all' || member.department === filterDepartment
    const matchesStatus = filterStatus === 'all' || member.status === filterStatus
    return matchesSearch && matchesDepartment && matchesStatus
  }).sort((a, b) => {
    switch (sortBy) {
      case 'name': return a.name.localeCompare(b.name)
      case 'position': return a.position.localeCompare(b.position)
      case 'department': return a.department.localeCompare(b.department)
      case 'hireDate': return new Date(b.hireDate).getTime() - new Date(a.hireDate).getTime()
      case 'salary': return b.salary - a.salary
      case 'performance': return b.performance.rating - a.performance.rating
      default: return 0
    }
  })

  const handleSave = () => {
    if (editingStaff) {
      const updatedStaff = {
        ...formData,
        id: editingStaff.id,
        lastLogin: editingStaff.lastLogin,
        performance: editingStaff.performance
      }
      setStaff(staff.map(member => member.id === editingStaff.id ? updatedStaff : member))
    } else {
      const newStaff: StaffMember = {
        ...formData,
        id: Date.now().toString(),
        lastLogin: new Date().toLocaleString('fa-IR'),
        performance: {
          rating: 0,
          totalOrders: 0,
          totalSales: 0,
          customerSatisfaction: 0
        }
      }
      setStaff([...staff, newStaff])
    }
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
  }

  const deleteStaff = (id: string) => {
    setStaff(staff.filter(member => member.id !== id))
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

  const getTotalStaff = () => staff.length
  const getActiveStaff = () => staff.filter(member => member.status === 'active').length
  const getTotalSalary = () => staff.reduce((sum, member) => sum + member.salary, 0)
  const getAveragePerformance = () => staff.length > 0 ? staff.reduce((sum, member) => sum + member.performance.rating, 0) / staff.length : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/80 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold gradient-text mb-2">مدیریت کارکنان</h1>
          <p className="text-gray-600 dark:text-gray-300">مدیریت اطلاعات و دسترسی‌های کارکنان</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="premium-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">کل کارکنان</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{getTotalStaff()}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
          <div className="premium-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">کارکنان فعال</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{getActiveStaff()}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
          <div className="premium-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">کل حقوق</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {getTotalSalary().toLocaleString('fa-IR')} تومان
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
          <div className="premium-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">میانگین عملکرد</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {getAveragePerformance().toFixed(1)}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                <Star className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>
        </div>

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
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              <span>کارمند جدید</span>
            </button>
          </div>
        </div>

        {/* Staff Table */}
        <div className="premium-card p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">لیست کارکنان</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-600/30">
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">نام کارمند</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">سمت</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">بخش</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">حقوق</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">عملکرد</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">وضعیت</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {filteredStaff.map((member) => (
                  <tr key={member.id} className="border-b border-gray-100 dark:border-gray-700/30">
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-3 space-x-reverse">
                        <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{member.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{member.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-gray-900 dark:text-white">{member.position}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-sm">
                        {member.department}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-gray-900 dark:text-white">
                        {member.salary.toLocaleString('fa-IR')} تومان
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-1 space-x-reverse">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span className="text-gray-900 dark:text-white">{member.performance.rating.toFixed(1)}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(member.status)}`}>
                        {getStatusText(member.status)}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <button
                          onClick={() => {
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
                          className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteStaff(member.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
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

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {editingStaff ? 'ویرایش کارمند' : 'کارمند جدید'}
              </h3>
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
              <div className="flex items-center justify-end space-x-3 space-x-reverse mt-6">
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
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                >
                  انصراف
                </button>
                <button
                  onClick={handleSave}
                  className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>ذخیره</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
