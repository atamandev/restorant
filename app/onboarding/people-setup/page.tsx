'use client'

import { useState, useEffect } from 'react'
import { 
  Plus, 
  Save, 
  X, 
  Edit,
  Trash2,
  Search,
  Filter,
  Users,
  UserCheck,
  UserPlus,
  Building2,
  Crown,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Star,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react'

interface Person {
  _id?: string
  id?: string
  firstName: string
  lastName: string
  phoneNumber?: string
  email?: string
  address?: string
  type: 'customer' | 'golden_customer' | 'supplier' | 'employee'
  isActive: boolean
  notes?: string
  createdAt?: Date | string
  updatedAt?: Date | string
}

const personTypes = [
  { 
    id: 'customer', 
    name: 'مشتریان', 
    icon: Users, 
    color: 'bg-blue-500',
    description: 'مشتریان عادی'
  },
  { 
    id: 'golden_customer', 
    name: 'مشتریان طلایی', 
    icon: Crown, 
    color: 'bg-yellow-500',
    description: 'مشتریان ثابت و VIP'
  },
  { 
    id: 'supplier', 
    name: 'تأمین‌کنندگان', 
    icon: Building2, 
    color: 'bg-green-500',
    description: 'تأمین‌کنندگان مواد اولیه'
  },
  { 
    id: 'employee', 
    name: 'کارکنان', 
    icon: UserCheck, 
    color: 'bg-purple-500',
    description: 'کارکنان رستوران'
  }
]

export default function PeopleSetupPage() {
  const [people, setPeople] = useState<Person[]>([])
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [editingPerson, setEditingPerson] = useState<Person | null>(null)
  const [selectedType, setSelectedType] = useState<string>('customer')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState<Person>({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    email: '',
    address: '',
    type: 'customer',
    isActive: true,
    notes: ''
  })

  // دریافت لیست اشخاص
  const fetchPeople = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/people')
      const data = await response.json()
      
      if (data.success) {
        setPeople(data.data)
      } else {
        setError(data.message || 'خطا در دریافت لیست اشخاص')
      }
    } catch (error) {
      console.error('Error fetching people:', error)
      setError('خطا در اتصال به سرور')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPeople()
  }, [])

  const handleInputChange = (field: keyof Person, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSave = async () => {
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setError('نام و نام خانوادگی الزامی است')
      return
    }

    try {
      setSaving(true)
      setError('')

      const url = '/api/people'
      const method = editingPerson ? 'PUT' : 'POST'
      
      const requestBody = editingPerson 
        ? { 
            id: editingPerson._id || editingPerson.id, 
            ...formData
          }
        : formData

      console.log('Sending request:', { method, url, requestBody })

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      const data = await response.json()

      console.log('Response data:', data)

      if (data.success) {
        await fetchPeople() // دریافت مجدد لیست
        resetForm()
      } else {
        setError(data.message || 'خطا در ذخیره شخص')
      }
    } catch (error) {
      console.error('Error saving person:', error)
      setError('خطا در اتصال به سرور')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (person: Person) => {
    // فقط فیلدهای مورد نیاز را در formData قرار می‌دهیم
    setFormData({
      firstName: person.firstName,
      lastName: person.lastName,
      phoneNumber: person.phoneNumber || '',
      email: person.email || '',
      address: person.address || '',
      type: person.type,
      isActive: person.isActive,
      notes: person.notes || ''
    })
    setEditingPerson(person)
    setIsAddingNew(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('آیا مطمئن هستید که می‌خواهید این شخص را حذف کنید؟')) return

    try {
      setSaving(true)
      const response = await fetch(`/api/people?id=${id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        await fetchPeople() // دریافت مجدد لیست
      } else {
        setError(data.message || 'خطا در حذف شخص')
      }
    } catch (error) {
      console.error('Error deleting person:', error)
      setError('خطا در اتصال به سرور')
    } finally {
      setSaving(false)
    }
  }

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      phoneNumber: '',
      email: '',
      address: '',
      type: 'customer',
      isActive: true,
      notes: ''
    })
    setIsAddingNew(false)
    setEditingPerson(null)
    setError('')
  }

  const getPersonTypeIcon = (type: string) => {
    const personType = personTypes.find(pt => pt.id === type)
    return personType?.icon || Users
  }

  const getPersonTypeColor = (type: string) => {
    const personType = personTypes.find(pt => pt.id === type)
    return personType?.color || 'bg-gray-500'
  }

  const getPersonTypeName = (type: string) => {
    const personType = personTypes.find(pt => pt.id === type)
    return personType?.name || 'نامشخص'
  }

  const filteredPeople = people.filter(person => {
    const matchesSearch = 
      person.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.phoneNumber?.includes(searchTerm) ||
      person.email?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = filterType === 'all' || person.type === filterType
    
    return matchesSearch && matchesFilter
  })

  const getTypeStats = () => {
    const stats = personTypes.map(type => ({
      ...type,
      count: people.filter(person => person.type === type.id).length
    }))
    return stats
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
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2">مدیریت اشخاص</h1>
            <p className="text-gray-600 dark:text-gray-300">مدیریت مشتریان، تأمین‌کنندگان و کارکنان</p>
          </div>
          <button
            onClick={() => setIsAddingNew(true)}
            className="premium-button flex items-center space-x-2 space-x-reverse"
          >
            <Plus className="w-5 h-5" />
            <span>شخص جدید</span>
          </button>
        </div>
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {getTypeStats().map(stat => {
          const Icon = stat.icon
          return (
            <div key={stat.id} className="premium-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.count}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{stat.description}</p>
                </div>
                <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Add/Edit Form */}
      {isAddingNew && (
        <div className="premium-card p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {editingPerson ? 'ویرایش شخص' : 'شخص جدید'}
            </h2>
            <button
              onClick={resetForm}
              className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Person Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  نوع شخص *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {personTypes.map(type => {
                    const Icon = type.icon
                    const isSelected = formData.type === type.id
                    return (
                      <button
                        key={type.id}
                        onClick={() => handleInputChange('type', type.id)}
                        className={`flex items-center space-x-2 space-x-reverse p-3 rounded-xl border transition-all duration-300 ${
                          isSelected
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600'
                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                        }`}
                      >
                        <div className={`w-8 h-8 ${type.color} rounded-lg flex items-center justify-center`}>
                          <Icon className="w-4 h-4 text-white" />
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-medium">{type.name}</span>
                          <p className="text-xs text-gray-500">{type.description}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* First Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  نام *
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  placeholder="نام را وارد کنید"
                  className="premium-input w-full"
                />
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  نام خانوادگی *
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  placeholder="نام خانوادگی را وارد کنید"
                  className="premium-input w-full"
                />
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  شماره تلفن
                </label>
                <div className="relative">
                  <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                    placeholder="09123456789"
                    className="premium-input pr-10 w-full"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ایمیل
                </label>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="example@email.com"
                    className="premium-input pr-10 w-full"
                  />
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  آدرس
                </label>
                <div className="relative">
                  <MapPin className="absolute right-3 top-3 text-gray-400 w-5 h-5" />
                  <textarea
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="آدرس کامل را وارد کنید"
                    rows={3}
                    className="premium-input pr-10 w-full resize-none"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  یادداشت‌ها
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="یادداشت‌های اضافی"
                  rows={3}
                  className="premium-input w-full resize-none"
                />
              </div>

              {/* Status */}
              <div className="flex items-center space-x-4 space-x-reverse">
                <label className="flex items-center space-x-2 space-x-reverse cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => handleInputChange('isActive', e.target.checked)}
                    className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">فعال</span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4 space-x-reverse pt-4">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 premium-button bg-green-500 hover:bg-green-600 flex items-center justify-center space-x-2 space-x-reverse disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  <span>ذخیره</span>
                </button>
                <button
                  onClick={resetForm}
                  className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  انصراف
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filter */}
      <div className="premium-card p-6 mb-6">
        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0 md:space-x-4 md:space-x-reverse">
          <div className="relative w-full md:w-1/2">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="جستجو در نام، تلفن، ایمیل..."
              className="premium-input pr-10 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex space-x-2 space-x-reverse">
            <button
              onClick={() => setFilterType('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterType === 'all'
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              همه
            </button>
            {personTypes.map(type => {
              const Icon = type.icon
              return (
                <button
                  key={type.id}
                  onClick={() => setFilterType(type.id)}
                  className={`flex items-center space-x-2 space-x-reverse px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filterType === type.id
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{type.name}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* People List */}
      <div className="premium-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">لیست اشخاص</h2>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {filteredPeople.length} نفر
          </div>
        </div>

        {filteredPeople.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-2">
              هیچ شخصی یافت نشد
            </h3>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              برای شروع، شخص جدید اضافه کنید
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPeople.map((person, index) => {
              const PersonIcon = getPersonTypeIcon(person.type)
              const personColor = getPersonTypeColor(person.type)
              const personTypeName = getPersonTypeName(person.type)
              
              return (
                <div key={person._id || person.id || index} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 hover:shadow-medium transition-all duration-300">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <div className={`w-10 h-10 ${personColor} rounded-lg flex items-center justify-center`}>
                        <PersonIcon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {person.firstName} {person.lastName}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{personTypeName}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      {person.type === 'golden_customer' && (
                        <Crown className="w-4 h-4 text-yellow-500" />
                      )}
                      {person.isActive ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    {person.phoneNumber && (
                      <div className="flex items-center space-x-2 space-x-reverse text-sm text-gray-600 dark:text-gray-300">
                        <Phone className="w-4 h-4" />
                        <span>{person.phoneNumber}</span>
                      </div>
                    )}
                    {person.email && (
                      <div className="flex items-center space-x-2 space-x-reverse text-sm text-gray-600 dark:text-gray-300">
                        <Mail className="w-4 h-4" />
                        <span>{person.email}</span>
                      </div>
                    )}
                    {person.address && (
                      <div className="flex items-center space-x-2 space-x-reverse text-sm text-gray-600 dark:text-gray-300">
                        <MapPin className="w-4 h-4" />
                        <span className="line-clamp-1">{person.address}</span>
                      </div>
                    )}
                  </div>

                  {person.notes && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                      {person.notes}
                    </p>
                  )}

                  <div className="flex space-x-2 space-x-reverse">
                    <button
                      onClick={() => handleEdit(person)}
                      disabled={saving}
                      className="flex-1 px-3 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-sm disabled:opacity-50"
                    >
                      ویرایش
                    </button>
                    <button
                      onClick={() => handleDelete(person._id || person.id || '')}
                      disabled={saving}
                      className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm disabled:opacity-50"
                    >
                      حذف
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}