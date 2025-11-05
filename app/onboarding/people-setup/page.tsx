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
  Loader2,
  Info,
  DollarSign
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
  source?: 'customers' | 'people' // برای تشخیص اینکه از کدام collection آمده
  customerNumber?: string
  totalOrders?: number
  totalSpent?: number
  // فیلدهای مخصوص کارکنان
  salary?: number
  position?: string // سمت/نوع کار (گارسون، آشپز، صندوقدار، مدیر و ...)
  // فیلدهای مخصوص تأمین‌کنندگان
  businessName?: string // نام فروشگاه/شرکت/کارخانه
  supplierType?: string // نوع تأمین‌کننده (چه چیزی تأمین می‌کند)
}

interface Customer {
  _id: string
  customerNumber: string
  name?: string
  firstName?: string
  lastName?: string
  phone: string
  email?: string
  customerType: 'regular' | 'vip' | 'golden'
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
    notes: '',
    salary: 0,
    position: '',
    businessName: '',
    supplierType: ''
  })
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('')
  const [goldenDiscountPercent, setGoldenDiscountPercent] = useState<number>(2)
  const [loadingCustomers, setLoadingCustomers] = useState(false)

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

  // دریافت لیست مشتریان برای انتخاب مشتریان طلایی
  const fetchCustomers = async () => {
    try {
      setLoadingCustomers(true)
      const response = await fetch('/api/customers')
      const data = await response.json()
      
      if (data.success) {
        setCustomers(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching customers:', error)
    } finally {
      setLoadingCustomers(false)
    }
  }

  // دریافت درصد تخفیف از تنظیمات
  const fetchGoldenDiscount = async () => {
    try {
      const response = await fetch('/api/restaurant-settings')
      const data = await response.json()
      
      if (data.success && data.data?.financial?.goldenCustomerDiscount) {
        setGoldenDiscountPercent(data.data.financial.goldenCustomerDiscount)
      }
    } catch (error) {
      console.error('Error fetching golden discount:', error)
    }
  }

  // وقتی نوع شخص به مشتریان طلایی تغییر کرد
  useEffect(() => {
    if (formData.type === 'golden_customer') {
      fetchCustomers()
      fetchGoldenDiscount()
    }
  }, [formData.type])

  // وقتی مشتری انتخاب شد، اطلاعات آن را در formData قرار بده
  useEffect(() => {
    if (selectedCustomerId && formData.type === 'golden_customer') {
      const selectedCustomer = customers.find(c => c._id === selectedCustomerId)
      if (selectedCustomer) {
        setFormData(prev => ({
          ...prev,
          firstName: selectedCustomer.firstName || '',
          lastName: selectedCustomer.lastName || '',
          phoneNumber: selectedCustomer.phone || '',
          email: selectedCustomer.email || '',
        }))
      }
    }
  }, [selectedCustomerId, customers, formData.type])

  const handleInputChange = (field: keyof Person, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSave = async () => {
    // اگر مشتریان طلایی انتخاب شده، باید مشتری انتخاب شده باشد
    if (formData.type === 'golden_customer') {
      if (!selectedCustomerId) {
        setError('لطفاً یک مشتری را برای تبدیل به طلایی انتخاب کنید')
        return
      }
      try {
        setSaving(true)
        setError('')

        // تبدیل مشتری به طلایی
        const updateCustomerResponse = await fetch(`/api/customers/${selectedCustomerId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            customerType: 'golden'
          }),
        })

        const customerUpdateData = await updateCustomerResponse.json()

        if (!customerUpdateData.success) {
          setError(customerUpdateData.message || 'خطا در تبدیل مشتری به طلایی')
          return
        }

        // به‌روزرسانی درصد تخفیف در تنظیمات (اگر تغییر کرده)
        const currentSettingsResponse = await fetch('/api/restaurant-settings')
        const currentSettingsData = await currentSettingsResponse.json()
        
        if (currentSettingsData.success && 
            currentSettingsData.data?.financial?.goldenCustomerDiscount !== goldenDiscountPercent) {
          await fetch('/api/restaurant-settings', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              category: 'restaurant',
              financial: {
                ...currentSettingsData.data.financial,
                goldenCustomerDiscount: goldenDiscountPercent
              }
            }),
          })
        }

        alert(`مشتری با موفقیت به مشتریان طلایی تبدیل شد و تخفیف ${goldenDiscountPercent}% برای آن تنظیم شد.`)
        await fetchPeople() // دریافت مجدد لیست
        resetForm()
      } catch (error) {
        console.error('Error saving golden customer:', error)
        setError('خطا در اتصال به سرور')
      } finally {
        setSaving(false)
      }
      return
    }

    // برای سایر انواع اشخاص، همان منطق قبلی
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setError('نام و نام خانوادگی الزامی است')
      return
    }

    // اعتبارسنجی برای کارکنان
    if (formData.type === 'employee' && !formData.position?.trim()) {
      setError('سمت کارمند الزامی است')
      return
    }

    // اعتبارسنجی برای تأمین‌کنندگان
    if (formData.type === 'supplier') {
      if (!formData.businessName?.trim()) {
        setError('نام فروشگاه/شرکت/کارخانه الزامی است')
        return
      }
      if (!formData.supplierType?.trim()) {
        setError('نوع تأمین‌کننده الزامی است')
        return
      }
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
    // اگر از collection customers است، هشدار بده
    if (person.source === 'customers') {
      alert('این مشتری از بخش مشتریان آمده است. برای ویرایش، لطفاً از بخش "مشتریان" استفاده کنید.')
      return
    }
    
    // فقط فیلدهای مورد نیاز را در formData قرار می‌دهیم
    setFormData({
      firstName: person.firstName,
      lastName: person.lastName,
      phoneNumber: person.phoneNumber || '',
      email: person.email || '',
      address: person.address || '',
      type: person.type,
      isActive: person.isActive,
      notes: person.notes || '',
      salary: person.salary || 0,
      position: person.position || '',
      businessName: person.businessName || '',
      supplierType: person.supplierType || ''
    })
    setEditingPerson(person)
    setIsAddingNew(true)
  }

  const handleDelete = async (id: string) => {
    const person = people.find(p => (p._id || p.id) === id)
    
    // اگر از collection customers است، اجازه حذف نده
    if (person?.source === 'customers') {
      alert('این مشتری از بخش مشتریان آمده است و نمی‌توان آن را از اینجا حذف کرد. برای حذف، لطفاً از بخش "مشتریان" استفاده کنید.')
      return
    }
    
    if (!confirm('آیا مطمئن هستید که می‌خواهید این شخص را حذف کنید؟')) return

    try {
      setSaving(true)
      
      // Optimistic update: remove from state immediately
      setPeople(prev => prev.filter(person => (person._id || person.id) !== id))
      
      const response = await fetch(`/api/people?id=${id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!data.success) {
        // If delete failed, reload to restore state
        await fetchPeople()
        setError(data.message || 'خطا در حذف شخص')
      }
      // If successful, state already updated (optimistic)
      // Also reload to sync with server
      await fetchPeople()
    } catch (error) {
      console.error('Error deleting person:', error)
      // On error, reload to restore state
      await fetchPeople()
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
      notes: '',
      salary: 0,
      position: '',
      businessName: '',
      supplierType: ''
    })
    setSelectedCustomerId('')
    setGoldenDiscountPercent(2)
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

              {/* انتخاب مشتری برای مشتریان طلایی */}
              {formData.type === 'golden_customer' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <span className="flex items-center space-x-2 space-x-reverse">
                        <Crown className="w-4 h-4 text-yellow-600" />
                        <span>انتخاب مشتری برای تبدیل به طلایی *</span>
                      </span>
                    </label>
                    {loadingCustomers ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                        <span className="mr-2 text-sm text-gray-500">در حال بارگذاری...</span>
                      </div>
                    ) : (
                      <select
                        value={selectedCustomerId}
                        onChange={(e) => setSelectedCustomerId(e.target.value)}
                        className="premium-input w-full"
                        required
                      >
                        <option value="">-- انتخاب مشتری --</option>
                        {customers
                          .filter(c => c.customerType !== 'golden') // فقط مشتریان غیرطلایی نمایش داده شوند
                          .map(customer => (
                            <option key={customer._id} value={customer._id}>
                              {customer.customerNumber} - {customer.firstName} {customer.lastName} ({customer.phone})
                            </option>
                          ))}
                      </select>
                    )}
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      مشتری انتخاب شده به عنوان مشتری طلایی ثبت خواهد شد
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <span className="flex items-center space-x-2 space-x-reverse">
                        <span>درصد تخفیف مشتریان طلایی</span>
                        <Info className="w-4 h-4 text-gray-400" />
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={goldenDiscountPercent}
                        onChange={(e) => setGoldenDiscountPercent(Number(e.target.value))}
                        className="premium-input pr-8 w-full"
                      />
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">%</span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      این درصد تخفیف برای همه مشتریان طلایی اعمال می‌شود
                    </p>
                  </div>
                </>
              )}
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

              {/* فیلدهای مخصوص کارکنان */}
              {formData.type === 'employee' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <span className="flex items-center space-x-2 space-x-reverse">
                        <UserCheck className="w-4 h-4" />
                        <span>سمت/نوع کار *</span>
                      </span>
                    </label>
                    <select
                      value={formData.position || ''}
                      onChange={(e) => handleInputChange('position', e.target.value)}
                      className="premium-input w-full"
                      required={formData.type === 'employee'}
                    >
                      <option value="">-- انتخاب سمت --</option>
                      <option value="گارسون">گارسون</option>
                      <option value="آشپز">آشپز</option>
                      <option value="کمک آشپز">کمک آشپز</option>
                      <option value="صندوقدار">صندوقدار</option>
                      <option value="مدیر">مدیر</option>
                      <option value="مدیر خدمات">مدیر خدمات</option>
                      <option value="پیشخدمت">پیشخدمت</option>
                      <option value="آشپز قنادی">آشپز قنادی</option>
                      <option value="نگهبان">نگهبان</option>
                      <option value="نظافتچی">نظافتچی</option>
                      <option value="تحویلدار">تحویلدار</option>
                      <option value="انباردار">انباردار</option>
                      <option value="سایر">سایر</option>
                    </select>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      سمت یا نوع کاری که کارمند در رستوران انجام می‌دهد
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <span className="flex items-center space-x-2 space-x-reverse">
                        <DollarSign className="w-4 h-4" />
                        <span>میزان حقوق (تومان)</span>
                      </span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={formData.salary || 0}
                      onChange={(e) => handleInputChange('salary', Number(e.target.value))}
                      placeholder="مثال: 5000000"
                      className="premium-input w-full"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      حقوق ماهانه کارمند را وارد کنید
                    </p>
                  </div>
                </>
              )}

              {/* فیلدهای مخصوص تأمین‌کنندگان */}
              {formData.type === 'supplier' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <span className="flex items-center space-x-2 space-x-reverse">
                        <Building2 className="w-4 h-4" />
                        <span>نام فروشگاه/شرکت/کارخانه *</span>
                      </span>
                    </label>
                    <input
                      type="text"
                      value={formData.businessName || ''}
                      onChange={(e) => handleInputChange('businessName', e.target.value)}
                      placeholder="مثال: شرکت مواد غذایی پارس، فروشگاه سبزیجات مرکزی، کارخانه لبنیات صالح"
                      className="premium-input w-full"
                      required={formData.type === 'supplier'}
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      نام رسمی یا تجاری فروشگاه، شرکت یا کارخانه تأمین‌کننده
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <span className="flex items-center space-x-2 space-x-reverse">
                        <Building2 className="w-4 h-4" />
                        <span>نوع تأمین‌کننده *</span>
                      </span>
                    </label>
                    <select
                      value={formData.supplierType || ''}
                      onChange={(e) => handleInputChange('supplierType', e.target.value)}
                      className="premium-input w-full"
                      required={formData.type === 'supplier'}
                    >
                      <option value="">-- انتخاب نوع تأمین‌کننده --</option>
                      <option value="مواد اولیه">مواد اولیه</option>
                      <option value="سبزیجات">سبزیجات</option>
                      <option value="گوشت و مرغ">گوشت و مرغ</option>
                      <option value="لبنیات">لبنیات</option>
                      <option value="نان و خمیر">نان و خمیر</option>
                      <option value="نوشیدنی">نوشیدنی</option>
                      <option value="ادویه و چاشنی">ادویه و چاشنی</option>
                      <option value="روغن و چربی">روغن و چربی</option>
                      <option value="میوه و خشکبار">میوه و خشکبار</option>
                      <option value="غلات و حبوبات">غلات و حبوبات</option>
                      <option value="تجهیزات آشپزخانه">تجهیزات آشپزخانه</option>
                      <option value="ظروف و سرویس">ظروف و سرویس</option>
                      <option value="مواد شوینده">مواد شوینده</option>
                      <option value="بسته‌بندی">بسته‌بندی</option>
                      <option value="سایر">سایر</option>
                    </select>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      نوع محصول یا خدماتی که این تأمین‌کننده ارائه می‌دهد
                    </p>
                  </div>
                </>
              )}

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
                    {person.customerNumber && (
                      <div className="flex items-center space-x-2 space-x-reverse text-xs text-gray-500 dark:text-gray-400 mb-1">
                        <span>شماره مشتری: {person.customerNumber}</span>
                      </div>
                    )}
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
                    {person.source === 'customers' && (person.totalOrders !== undefined || person.totalSpent !== undefined) && (
                      <div className="flex items-center space-x-2 space-x-reverse text-xs text-gray-500 dark:text-gray-400 mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                        {person.totalOrders !== undefined && (
                          <span>سفارشات: {person.totalOrders}</span>
                        )}
                        {person.totalSpent !== undefined && (
                          <span>• خرید کل: {person.totalSpent.toLocaleString('fa-IR')} تومان</span>
                        )}
                      </div>
                    )}
                    {person.type === 'employee' && (person.position || person.salary) && (
                      <div className="flex items-center space-x-2 space-x-reverse text-xs text-gray-500 dark:text-gray-400 mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                        {person.position && (
                          <span>سمت: {person.position}</span>
                        )}
                        {person.salary !== undefined && person.salary > 0 && (
                          <span>• حقوق: {person.salary.toLocaleString('fa-IR')} تومان</span>
                        )}
                      </div>
                    )}
                    {person.type === 'supplier' && (person.businessName || person.supplierType) && (
                      <div className="flex items-center space-x-2 space-x-reverse text-xs text-gray-500 dark:text-gray-400 mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                        {person.businessName && (
                          <span>شرکت: {person.businessName}</span>
                        )}
                        {person.supplierType && (
                          <span>• نوع: {person.supplierType}</span>
                        )}
                      </div>
                    )}
                  </div>

                  {person.notes && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                      {person.notes}
                    </p>
                  )}

                  <div className="flex space-x-2 space-x-reverse">
                    {person.source === 'customers' ? (
                      <div className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg text-sm text-center">
                        از بخش مشتریان
                      </div>
                    ) : (
                      <>
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
                      </>
                    )}
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