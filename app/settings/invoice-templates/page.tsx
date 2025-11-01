'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Layout,
  Plus,
  Edit,
  Trash2,
  Eye,
  Save,
  X,
  Settings,
  QrCode,
  Barcode,
  PenTool,
  Stamp,
  FileText,
  Package,
  Utensils,
  ShoppingCart,
  Image,
  Search,
  Download,
  Printer,
  Loader
} from 'lucide-react'
import PieChart from '@/components/Charts/PieChart'
import BarChart from '@/components/Charts/BarChart'

interface InvoiceTemplate {
  id?: string
  _id?: string
  name: string
  type: 'dine-in' | 'takeaway' | 'delivery' | 'general'
  description: string
  isDefault: boolean
  isActive: boolean
  createdAt?: string
  updatedAt?: string
  preview?: string
  fields?: TemplateField[]
  settings?: any
}

interface TemplateField {
  id?: string
  _id?: string
  name: string
  type: 'text' | 'image' | 'qr' | 'barcode' | 'signature' | 'stamp'
  position: { x: number; y: number }
  size: { width: number; height: number }
  content: string
  isVisible: boolean
}

interface StatsData {
  totalTemplates: number
  activeTemplates: number
  defaultTemplates: number
  inactiveTemplates: number
  typeDistribution: {
    'dine-in': number
    'takeaway': number
    'delivery': number
    'general': number
  }
  statusDistribution: {
    active: number
    inactive: number
  }
}

const getTemplateTypeIcon = (type: string) => {
  switch (type) {
    case 'dine-in': return Utensils
    case 'takeaway': return Package
    case 'delivery': return ShoppingCart
    case 'general': return FileText
    default: return FileText
  }
}

const getTemplateTypeColor = (type: string) => {
  switch (type) {
    case 'dine-in': return 'text-blue-600 dark:text-blue-400'
    case 'takeaway': return 'text-green-600 dark:text-green-400'
    case 'delivery': return 'text-orange-600 dark:text-orange-400'
    case 'general': return 'text-gray-600 dark:text-gray-400'
    default: return 'text-gray-600 dark:text-gray-400'
  }
}

const getFieldTypeIcon = (type: string) => {
  switch (type) {
    case 'text': return FileText
    case 'image': return Image
    case 'qr': return QrCode
    case 'barcode': return Barcode
    case 'signature': return PenTool
    case 'stamp': return Stamp
    default: return FileText
  }
}

export default function InvoiceTemplatesPage() {
  const [activeTab, setActiveTab] = useState<'templates' | 'designer' | 'preview'>('templates')
  const [templates, setTemplates] = useState<InvoiceTemplate[]>([])
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedTemplate, setSelectedTemplate] = useState<InvoiceTemplate | null>(null)
  const [templateFields, setTemplateFields] = useState<TemplateField[]>([])
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [showFieldModal, setShowFieldModal] = useState(false)
  const [selectedField, setSelectedField] = useState<TemplateField | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  
  // Form states
  const [templateForm, setTemplateForm] = useState({
    name: '',
    type: 'dine-in' as 'dine-in' | 'takeaway' | 'delivery' | 'general',
    description: '',
    isDefault: false,
    isActive: true
  })
  
  const [fieldForm, setFieldForm] = useState({
    name: '',
    type: 'text' as 'text' | 'image' | 'qr' | 'barcode' | 'signature' | 'stamp',
    position: { x: 0, y: 0 },
    size: { width: 100, height: 30 },
    content: '',
    isVisible: true
  })

  // Fetch templates
  const fetchTemplates = useCallback(async () => {
    try {
      const response = await fetch('/api/invoice-templates')
      const result = await response.json()
      if (result.success) {
        setTemplates(result.data || [])
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
      alert('خطا در دریافت قالب‌ها')
    }
  }, [])

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/invoice-templates?type=stats')
      const result = await response.json()
      if (result.success) {
        setStats(result.data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }, [])

  // Fetch template fields
  const fetchTemplateFields = useCallback(async (templateId: string) => {
    try {
      const response = await fetch(`/api/invoice-templates?type=fields&templateId=${templateId}`)
      const result = await response.json()
      if (result.success) {
        setTemplateFields(result.data || [])
      }
    } catch (error) {
      console.error('Error fetching template fields:', error)
    }
  }, [])

  // Load data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([fetchTemplates(), fetchStats()])
      setLoading(false)
    }
    loadData()
  }, [fetchTemplates, fetchStats])

  // Filtered templates
  const filteredTemplates = useMemo(() => {
    return templates.filter(template =>
      (searchTerm === '' || 
        (template.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (template.description || '').toLowerCase().includes(searchTerm.toLowerCase())) &&
      (filterType === 'all' || template.type === filterType) &&
      (filterStatus === 'all' || (filterStatus === 'active' ? template.isActive : !template.isActive))
    )
  }, [templates, searchTerm, filterType, filterStatus])

  // Chart data
  const templatesByTypeChartData = useMemo(() => {
    if (!stats?.typeDistribution) return []
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#6B7280']
    return [
      { name: 'سالن', value: stats.typeDistribution['dine-in'] || 0, color: colors[0] },
      { name: 'بیرون‌بر', value: stats.typeDistribution['takeaway'] || 0, color: colors[1] },
      { name: 'ارسال', value: stats.typeDistribution['delivery'] || 0, color: colors[2] },
      { name: 'عمومی', value: stats.typeDistribution['general'] || 0, color: colors[3] }
    ].filter(item => item.value > 0)
  }, [stats])

  const templatesStatusChartData = useMemo(() => {
    if (!stats) return []
    return [
      { period: 'فعال', revenue: stats.activeTemplates },
      { period: 'غیرفعال', revenue: stats.inactiveTemplates }
    ].filter(item => (item.revenue || 0) > 0)
  }, [stats])

  const handleCreateTemplate = () => {
    setSelectedTemplate(null)
    setTemplateForm({
      name: '',
      type: 'dine-in',
      description: '',
      isDefault: false,
      isActive: true
    })
    setShowTemplateModal(true)
  }

  const handleEditTemplate = (template: InvoiceTemplate) => {
    setSelectedTemplate(template)
    setTemplateForm({
      name: template.name,
      type: template.type,
      description: template.description || '',
      isDefault: template.isDefault,
      isActive: template.isActive
    })
    setShowTemplateModal(true)
  }

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('آیا از حذف این قالب اطمینان دارید؟')) {
      return
    }
    try {
      const response = await fetch(`/api/invoice-templates?id=${templateId}`, {
        method: 'DELETE'
      })
      const result = await response.json()
      if (result.success) {
        alert('قالب با موفقیت حذف شد')
        await Promise.all([fetchTemplates(), fetchStats()])
      } else {
        alert(result.message || 'خطا در حذف قالب')
      }
    } catch (error) {
      console.error('Error deleting template:', error)
      alert('خطا در حذف قالب')
    }
  }

  const handleSaveTemplate = async () => {
    try {
      if (!templateForm.name) {
        alert('نام قالب اجباری است')
        return
      }
      const method = selectedTemplate ? 'PUT' : 'POST'
      const body = {
        ...(selectedTemplate && { id: selectedTemplate._id || selectedTemplate.id }),
        ...templateForm
      }
      const response = await fetch('/api/invoice-templates', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const result = await response.json()
      if (result.success) {
        alert(selectedTemplate ? 'قالب با موفقیت به‌روزرسانی شد' : 'قالب با موفقیت ایجاد شد')
        setShowTemplateModal(false)
        setSelectedTemplate(null)
        setTemplateForm({
          name: '',
          type: 'dine-in',
          description: '',
          isDefault: false,
          isActive: true
        })
        await Promise.all([fetchTemplates(), fetchStats()])
      } else {
        alert(result.message || 'خطا در ذخیره قالب')
      }
    } catch (error) {
      console.error('Error saving template:', error)
      alert('خطا در ذخیره قالب')
    }
  }

  const handlePreviewTemplate = (template: InvoiceTemplate) => {
    setSelectedTemplate(template)
    setActiveTab('preview')
  }

  const handleDesignTemplate = async (template: InvoiceTemplate) => {
    setSelectedTemplate(template)
    await fetchTemplateFields(template._id || template.id || '')
    setActiveTab('designer')
  }

  const handleCreateField = () => {
    setSelectedField(null)
    setFieldForm({
      name: '',
      type: 'text',
      position: { x: 0, y: 0 },
      size: { width: 100, height: 30 },
      content: '',
      isVisible: true
    })
    setShowFieldModal(true)
  }

  const handleEditField = (field: TemplateField) => {
    setSelectedField(field)
    setFieldForm({
      name: field.name,
      type: field.type,
      position: field.position,
      size: field.size,
      content: field.content,
      isVisible: field.isVisible
    })
    setShowFieldModal(true)
  }

  const handleDeleteField = async (fieldId: string) => {
    if (!confirm('آیا از حذف این فیلد اطمینان دارید؟')) {
      return
    }
    if (!selectedTemplate) return
    try {
      const currentFields = templateFields.filter(f => (f.id || f._id) !== fieldId)
      const response = await fetch('/api/invoice-templates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedTemplate._id || selectedTemplate.id,
          fields: currentFields
        })
      })
      const result = await response.json()
      if (result.success) {
        alert('فیلد با موفقیت حذف شد')
        await fetchTemplateFields(selectedTemplate._id || selectedTemplate.id || '')
      } else {
        alert(result.message || 'خطا در حذف فیلد')
      }
    } catch (error) {
      console.error('Error deleting field:', error)
      alert('خطا در حذف فیلد')
    }
  }

  const handleSaveField = async () => {
    if (!selectedTemplate) {
      alert('ابتدا یک قالب را انتخاب کنید')
      return
    }
    try {
      if (!fieldForm.name) {
        alert('نام فیلد اجباری است')
        return
      }
      let updatedFields = [...templateFields]
      if (selectedField) {
        // Update existing field
        updatedFields = updatedFields.map(f => 
          (f.id || f._id) === (selectedField.id || selectedField._id) ? fieldForm : f
        )
      } else {
        // Add new field
        updatedFields.push({ ...fieldForm, id: `field-${Date.now()}` })
      }
      const response = await fetch('/api/invoice-templates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedTemplate._id || selectedTemplate.id,
          fields: updatedFields
        })
      })
      const result = await response.json()
      if (result.success) {
        alert(selectedField ? 'فیلد با موفقیت به‌روزرسانی شد' : 'فیلد با موفقیت ایجاد شد')
        setShowFieldModal(false)
        setSelectedField(null)
        await fetchTemplateFields(selectedTemplate._id || selectedTemplate.id || '')
      } else {
        alert(result.message || 'خطا در ذخیره فیلد')
      }
    } catch (error) {
      console.error('Error saving field:', error)
      alert('خطا در ذخیره فیلد')
    }
  }

  if (loading) {
    return (
      <div className="fade-in-animation space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      </div>
    )
  }

  return (
    <div className="fade-in-animation space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">طراحی قالب فاکتور</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            طراحی و مدیریت قالب‌های فاکتور برای انواع مختلف فروش و تطابق با قوانین مالیاتی.
          </p>
        </div>
        <div className="flex items-center space-x-3 space-x-reverse">
          <button
            onClick={async () => {
              try {
                const response = await fetch('/api/add-sample-invoice-templates', {
                  method: 'POST'
                })
                const result = await response.json()
                if (result.success) {
                  alert(`✅ ${result.message}`)
                  await Promise.all([fetchTemplates(), fetchStats()])
                } else {
                  alert(`❌ ${result.message || 'خطا در اضافه کردن قالب‌های نمونه'}`)
                }
              } catch (error) {
                console.error('Error adding sample templates:', error)
                alert('خطا در اضافه کردن قالب‌های نمونه')
              }
            }}
            className="premium-button bg-green-600 hover:bg-green-700 flex items-center space-x-2 space-x-reverse"
            title="اضافه کردن قالب‌های نمونه"
          >
            <Download className="w-5 h-5" />
            <span>افزودن قالب‌های نمونه</span>
          </button>
          <button
            onClick={handleCreateTemplate}
            className="premium-button flex items-center space-x-2 space-x-reverse"
          >
            <Plus className="w-5 h-5" />
            <span>قالب جدید</span>
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="premium-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">کل قالب‌ها</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {stats.totalTemplates}
                </p>
              </div>
              <FileText className="w-10 h-10 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="premium-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">فعال</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {stats.activeTemplates}
                </p>
              </div>
              <Save className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div className="premium-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">پیش‌فرض</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {stats.defaultTemplates}
                </p>
              </div>
              <Settings className="w-10 h-10 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <div className="premium-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">غیرفعال</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {stats.inactiveTemplates}
                </p>
              </div>
              <X className="w-10 h-10 text-gray-600 dark:text-gray-400" />
            </div>
          </div>
        </div>
      )}

      {/* Charts */}
      {stats && (templatesByTypeChartData.length > 0 || templatesStatusChartData.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {templatesByTypeChartData.length > 0 && (
            <div className="premium-card p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                توزیع بر اساس نوع
              </h3>
              <div className="h-64">
                <PieChart
                  data={templatesByTypeChartData}
                  title="توزیع قالب‌ها"
                  centerLabel="کل قالب‌ها"
                  centerValue={stats.totalTemplates}
                />
              </div>
            </div>
          )}
          {templatesStatusChartData.length > 0 && (
            <div className="premium-card p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                توزیع بر اساس وضعیت
              </h3>
              <div className="h-64">
                <BarChart data={templatesStatusChartData} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="premium-card p-6">
        <div className="flex space-x-1 space-x-reverse bg-gray-100 dark:bg-gray-800 rounded-lg p-1 mb-6">
          <button
            onClick={() => setActiveTab('templates')}
            className={`flex-1 flex items-center justify-center space-x-2 space-x-reverse px-4 py-2 rounded-md transition-all duration-200 ${
              activeTab === 'templates'
                ? 'bg-white dark:bg-gray-700 text-primary-600 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Layout className="w-5 h-5" />
            <span>قالب‌ها</span>
          </button>
          <button
            onClick={() => setActiveTab('designer')}
            className={`flex-1 flex items-center justify-center space-x-2 space-x-reverse px-4 py-2 rounded-md transition-all duration-200 ${
              activeTab === 'designer'
                ? 'bg-white dark:bg-gray-700 text-primary-600 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Settings className="w-5 h-5" />
            <span>طراح</span>
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`flex-1 flex items-center justify-center space-x-2 space-x-reverse px-4 py-2 rounded-md transition-all duration-200 ${
              activeTab === 'preview'
                ? 'bg-white dark:bg-gray-700 text-primary-600 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Eye className="w-5 h-5" />
            <span>پیش‌نمایش</span>
          </button>
        </div>

        {/* Templates Tab */}
        {activeTab === 'templates' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="جستجو قالب..."
                  className="premium-input pr-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                className="premium-input"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="all">همه انواع</option>
                <option value="dine-in">سالن</option>
                <option value="takeaway">بیرون‌بر</option>
                <option value="delivery">ارسال</option>
                <option value="general">عمومی</option>
              </select>
              <select
                className="premium-input"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">همه وضعیت‌ها</option>
                <option value="active">فعال</option>
                <option value="inactive">غیرفعال</option>
              </select>
            </div>

            {/* Templates Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-300">قالبی یافت نشد</p>
                </div>
              ) : (
                filteredTemplates.map(template => {
                const TypeIcon = getTemplateTypeIcon(template.type)
                return (
                  <div key={template._id || template.id} className="premium-card p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3 space-x-reverse">
                        <div className={`w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center`}>
                          <TypeIcon className={`w-6 h-6 ${getTemplateTypeColor(template.type)}`} />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{template.name}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {template.type === 'dine-in' ? 'سالن' :
                             template.type === 'takeaway' ? 'بیرون‌بر' :
                             template.type === 'delivery' ? 'ارسال' : 'عمومی'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 space-x-reverse">
                        {template.isDefault && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 text-xs rounded-full">
                            پیش‌فرض
                          </span>
                        )}
                        {template.isActive ? (
                          <span className="status-badge bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">فعال</span>
                        ) : (
                          <span className="status-badge bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300">غیرفعال</span>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">{template.description}</p>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">تاریخ ایجاد:</span>
                        <span className="text-gray-900 dark:text-white">{template.createdAt}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">آخرین ویرایش:</span>
                        <span className="text-gray-900 dark:text-white">{template.updatedAt}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <button
                          onClick={() => handlePreviewTemplate(template)}
                          className="p-1 rounded-full text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                          title="پیش‌نمایش"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDesignTemplate(template)}
                          className="p-1 rounded-full text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                          title="طراحی"
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditTemplate(template)}
                          className="p-1 rounded-full text-yellow-600 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors"
                          title="ویرایش"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {!template.isDefault && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteTemplate(template._id || template.id || '')
                          }}
                          className="p-1 rounded-full text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                          title="حذف"
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
          </div>
        )}

        {/* Designer Tab */}
        {activeTab === 'designer' && (
          <div className="space-y-6">
            {selectedTemplate ? (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Canvas */}
                <div className="lg:col-span-3">
                  <div className="premium-card p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        طراحی قالب: {selectedTemplate.name}
                      </h3>
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <button className="premium-button p-2">
                          <Save className="w-5 h-5" />
                        </button>
                        <button className="premium-button bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 p-2">
                          <Download className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Canvas Area */}
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 min-h-[600px] bg-white dark:bg-gray-900 relative">
                      <div className="text-center text-gray-500 dark:text-gray-400 mb-4">
                        ناحیه طراحی قالب فاکتور
                      </div>
                      
                      {/* Template Fields */}
                      {templateFields.length === 0 ? (
                        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                          هیچ فیلدی تعریف نشده است
                        </div>
                      ) : (
                        templateFields.map((field, index) => {
                        const FieldIcon = getFieldTypeIcon(field.type)
                        return (
                          <div
                            key={field.id || field._id || `field-${index}`}
                            className="absolute border-2 border-dashed border-blue-300 bg-blue-50 dark:bg-blue-900/20 p-2 cursor-move"
                            style={{
                              left: field.position.x,
                              top: field.position.y,
                              width: field.size.width,
                              height: field.size.height
                            }}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <FieldIcon className="w-4 h-4 text-blue-600" />
                              <div className="flex items-center space-x-1 space-x-reverse">
                                <button
                                  onClick={() => handleEditField(field)}
                                  className="p-1 rounded-full text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                                >
                                  <Edit className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => handleDeleteField(field.id)}
                                  className="p-1 rounded-full text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
                              {field.content}
                            </div>
                          </div>
                        )
                      })
                      )}
                    </div>
                  </div>
                </div>

                {/* Tools Panel */}
                <div className="lg:col-span-1">
                  <div className="premium-card p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">ابزارها</h3>
                    
                    <div className="space-y-3">
                      <button
                        onClick={handleCreateField}
                        className="w-full premium-button flex items-center justify-center space-x-2 space-x-reverse"
                      >
                        <Plus className="w-5 h-5" />
                        <span>افزودن فیلد</span>
                      </button>
                      
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">فیلدهای موجود</h4>
                        {templateFields.length === 0 ? (
                          <p className="text-sm text-gray-500 dark:text-gray-400">هیچ فیلدی وجود ندارد</p>
                        ) : (
                          templateFields.map((field, index) => {
                          const FieldIcon = getFieldTypeIcon(field.type)
                          return (
                            <div key={field.id || field._id || `field-${index}`} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                              <div className="flex items-center space-x-2 space-x-reverse">
                                <FieldIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                <span className="text-sm text-gray-700 dark:text-gray-300">{field.name}</span>
                              </div>
                              <div className="flex items-center space-x-1 space-x-reverse">
                                <button
                                  onClick={() => handleEditField(field)}
                                  className="p-1 rounded-full text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                                >
                                  <Edit className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => handleDeleteField(field.id)}
                                  className="p-1 rounded-full text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          )
                        })
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Layout className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">قالبی انتخاب نشده</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  برای شروع طراحی، ابتدا یک قالب را انتخاب کنید.
                </p>
                <button
                  onClick={() => setActiveTab('templates')}
                  className="premium-button"
                >
                  انتخاب قالب
                </button>
              </div>
            )}
          </div>
        )}

        {/* Preview Tab */}
        {activeTab === 'preview' && (
          <div className="space-y-6">
            {selectedTemplate ? (
              <div className="premium-card p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    پیش‌نمایش قالب: {selectedTemplate.name}
                  </h3>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <button className="premium-button p-2">
                      <Download className="w-5 h-5" />
                    </button>
                    <button className="premium-button bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 p-2">
                      <Printer className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                {/* Preview Area */}
                <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-8 bg-white dark:bg-gray-900">
                  <div className="text-center text-gray-500 dark:text-gray-400 mb-4">
                    پیش‌نمایش قالب فاکتور
                  </div>
                  
                  {/* Mock Invoice Preview */}
                  <div className="max-w-md mx-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-lg">
                    <div className="text-center mb-4">
                      <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg mx-auto mb-2 flex items-center justify-center">
                        <Image className="w-8 h-8 text-gray-400" />
                      </div>
                      <h2 className="text-lg font-bold text-gray-900 dark:text-white">رستوران سنتی ایرانی</h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400">تهران، خیابان ولیعصر، پلاک ۱۰</p>
                    </div>
                    
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600 dark:text-gray-400">شماره فاکتور:</span>
                        <span className="text-gray-900 dark:text-white">INV-001</span>
                      </div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600 dark:text-gray-400">تاریخ:</span>
                        <span className="text-gray-900 dark:text-white">1403/09/15</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">میز:</span>
                        <span className="text-gray-900 dark:text-white">5</span>
                      </div>
                    </div>
                    
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-900 dark:text-white">کباب کوبیده</span>
                          <span className="text-gray-900 dark:text-white">150,000 تومان</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-900 dark:text-white">دوغ</span>
                          <span className="text-gray-900 dark:text-white">25,000 تومان</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-4">
                      <div className="flex justify-between text-sm font-bold">
                        <span className="text-gray-900 dark:text-white">مجموع:</span>
                        <span className="text-gray-900 dark:text-white">175,000 تومان</span>
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg mx-auto mb-2 flex items-center justify-center">
                        <QrCode className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">با تشکر از انتخاب شما</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Eye className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">قالبی انتخاب نشده</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  برای مشاهده پیش‌نمایش، ابتدا یک قالب را انتخاب کنید.
                </p>
                <button
                  onClick={() => setActiveTab('templates')}
                  className="premium-button"
                >
                  انتخاب قالب
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {selectedTemplate ? 'ویرایش قالب' : 'قالب جدید'}
              </h2>
              <button
                onClick={() => setShowTemplateModal(false)}
                className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">نام قالب</label>
                <input
                  type="text"
                  className="premium-input"
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                  placeholder="نام قالب را وارد کنید"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">نوع قالب</label>
                <select
                  className="premium-input"
                  value={templateForm.type}
                  onChange={(e) => setTemplateForm({ ...templateForm, type: e.target.value as any })}
                >
                  <option value="dine-in">سالن</option>
                  <option value="takeaway">بیرون‌بر</option>
                  <option value="delivery">ارسال</option>
                  <option value="general">عمومی</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">توضیحات</label>
                <textarea
                  className="premium-input"
                  rows={3}
                  value={templateForm.description}
                  onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
                  placeholder="توضیحات قالب را وارد کنید"
                />
              </div>
              <div className="flex items-center space-x-4 space-x-reverse">
                <label className="flex items-center space-x-2 space-x-reverse">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    checked={templateForm.isDefault}
                    onChange={(e) => setTemplateForm({ ...templateForm, isDefault: e.target.checked })}
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">قالب پیش‌فرض</span>
                </label>
                <label className="flex items-center space-x-2 space-x-reverse">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    checked={templateForm.isActive}
                    onChange={(e) => setTemplateForm({ ...templateForm, isActive: e.target.checked })}
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">فعال</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 space-x-reverse mt-6">
              <button
                onClick={() => setShowTemplateModal(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                انصراف
              </button>
              <button
                onClick={handleSaveTemplate}
                className="premium-button flex items-center space-x-2 space-x-reverse"
              >
                <Save className="w-5 h-5" />
                <span>ذخیره</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Field Modal */}
      {showFieldModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {selectedField ? 'ویرایش فیلد' : 'فیلد جدید'}
              </h2>
              <button
                onClick={() => setShowFieldModal(false)}
                className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">نام فیلد</label>
                <input
                  type="text"
                  className="premium-input"
                  value={fieldForm.name}
                  onChange={(e) => setFieldForm({ ...fieldForm, name: e.target.value })}
                  placeholder="نام فیلد را وارد کنید"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">نوع فیلد</label>
                <select
                  className="premium-input"
                  value={fieldForm.type}
                  onChange={(e) => setFieldForm({ ...fieldForm, type: e.target.value as any })}
                >
                  <option value="text">متن</option>
                  <option value="image">تصویر</option>
                  <option value="qr">QR کد</option>
                  <option value="barcode">بارکد</option>
                  <option value="signature">امضا</option>
                  <option value="stamp">مهر</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">محتوای فیلد</label>
                <input
                  type="text"
                  className="premium-input"
                  value={fieldForm.content}
                  onChange={(e) => setFieldForm({ ...fieldForm, content: e.target.value })}
                  placeholder="محتوای فیلد را وارد کنید"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">موقعیت X</label>
                  <input
                    type="number"
                    className="premium-input"
                    value={fieldForm.position.x}
                    onChange={(e) => setFieldForm({
                      ...fieldForm,
                      position: { ...fieldForm.position, x: parseInt(e.target.value) || 0 }
                    })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">موقعیت Y</label>
                  <input
                    type="number"
                    className="premium-input"
                    value={fieldForm.position.y}
                    onChange={(e) => setFieldForm({
                      ...fieldForm,
                      position: { ...fieldForm.position, y: parseInt(e.target.value) || 0 }
                    })}
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">عرض</label>
                  <input
                    type="number"
                    className="premium-input"
                    value={fieldForm.size.width}
                    onChange={(e) => setFieldForm({
                      ...fieldForm,
                      size: { ...fieldForm.size, width: parseInt(e.target.value) || 100 }
                    })}
                    placeholder="100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">ارتفاع</label>
                  <input
                    type="number"
                    className="premium-input"
                    value={fieldForm.size.height}
                    onChange={(e) => setFieldForm({
                      ...fieldForm,
                      size: { ...fieldForm.size, height: parseInt(e.target.value) || 30 }
                    })}
                    placeholder="30"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  checked={fieldForm.isVisible}
                  onChange={(e) => setFieldForm({ ...fieldForm, isVisible: e.target.checked })}
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">نمایش فیلد</span>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 space-x-reverse mt-6">
              <button
                onClick={() => setShowFieldModal(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                انصراف
              </button>
              <button
                onClick={handleSaveField}
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