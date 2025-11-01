'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  HelpCircle, 
  Search, 
  BookOpen, 
  Video, 
  MessageCircle, 
  Phone, 
  Mail, 
  Download,
  ChevronRight,
  ChevronDown,
  FileText,
  Users,
  Settings,
  ShoppingCart,
  BarChart3,
  Package,
  Clock,
  X,
  Plus,
  Edit,
  Trash2,
  Save,
  AlertCircle
} from 'lucide-react'

interface FAQItem {
  id?: string
  _id?: string
  question: string
  answer: string
  category: string
  tags: string[]
}

interface HelpSection {
  id?: string
  _id?: string
  title: string
  description: string
  icon?: string
  articles: HelpArticle[]
}

interface HelpArticle {
  id?: string
  _id?: string
  title: string
  description: string
  content: string
  category: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  estimatedTime: string
  tags: string[]
  sectionId?: string | null
}

// Helper component for rendering section icons
function SectionIcon({ iconName }: { iconName?: string }) {
  const iconMap: Record<string, any> = {
    'BookOpen': BookOpen,
    'ShoppingCart': ShoppingCart,
    'Package': Package,
    'BarChart3': BarChart3,
    'Settings': Settings,
    'Users': Users,
    'HelpCircle': HelpCircle
  }
  
  const IconComponent = iconMap[iconName || 'BookOpen'] || BookOpen
  return <IconComponent className="w-6 h-6 text-primary-600" />
}

export default function HelpPage() {
  const [faqData, setFaqData] = useState<FAQItem[]>([])
  const [helpSections, setHelpSections] = useState<HelpSection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null)
  const [expandedSection, setExpandedSection] = useState<string | null>(null)
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null)

  // CRUD Modal States
  const [showFAQModal, setShowFAQModal] = useState(false)
  const [showSectionModal, setShowSectionModal] = useState(false)
  const [showArticleModal, setShowArticleModal] = useState(false)
  const [editingFAQ, setEditingFAQ] = useState<FAQItem | null>(null)
  const [editingSection, setEditingSection] = useState<HelpSection | null>(null)
  const [editingArticle, setEditingArticle] = useState<HelpArticle | null>(null)
  const [saving, setSaving] = useState(false)

  // Form States
  const [faqForm, setFaqForm] = useState({
    question: '',
    answer: '',
    category: 'عمومی',
    tags: [] as string[]
  })

  const [sectionForm, setSectionForm] = useState({
    title: '',
    description: '',
    icon: 'BookOpen',
    order: 0
  })

  const [articleForm, setArticleForm] = useState({
    title: '',
    description: '',
    content: '',
    category: 'عمومی',
    difficulty: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    estimatedTime: '5 دقیقه',
    tags: [] as string[],
    sectionId: ''
  })

  const [tagInput, setTagInput] = useState('')

  const categories = ['all', 'سفارشات', 'موجودی', 'گزارشات', 'مشتریان', 'منو', 'تنظیمات']
  const iconOptions = ['BookOpen', 'ShoppingCart', 'Package', 'BarChart3', 'Settings', 'Users', 'HelpCircle']

  // Fetch FAQs
  const fetchFAQs = useCallback(async () => {
    try {
      setError(null)
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (selectedCategory !== 'all') params.append('category', selectedCategory)
      
      const response = await fetch(`/api/help?type=faqs&${params.toString()}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const result = await response.json()
      if (result.success) {
        setFaqData(result.data || [])
      } else {
        setError(result.message || 'خطا در دریافت سوالات متداول')
        setFaqData([])
      }
    } catch (error) {
      console.error('Error fetching FAQs:', error)
      setError('خطا در دریافت سوالات متداول')
      setFaqData([])
    }
  }, [searchTerm, selectedCategory])

  // Fetch Sections with Articles
  const fetchSections = useCallback(async () => {
    try {
      setError(null)
      const response = await fetch('/api/help?type=sections')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const result = await response.json()
      if (result.success) {
        setHelpSections(result.data || [])
      } else {
        setError(result.message || 'خطا در دریافت بخش‌های راهنما')
        setHelpSections([])
      }
    } catch (error) {
      console.error('Error fetching sections:', error)
      setError('خطا در دریافت بخش‌های راهنما')
      setHelpSections([])
    }
  }, [])

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setError(null)
      try {
        await Promise.all([fetchFAQs(), fetchSections()])
      } catch (error) {
        console.error('Error loading data:', error)
        setError('خطا در بارگذاری اطلاعات')
      } finally {
        setLoading(false)
      }
    }
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Re-fetch FAQs when search or category changes (debounced)
  useEffect(() => {
    if (loading) return
    
    const timer = setTimeout(() => {
      fetchFAQs()
    }, 300)
    
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, selectedCategory, loading])

  const filteredFAQ = faqData.filter(item => {
    if (!item) return false
    const matchesSearch = !searchTerm || 
      item.question?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.answer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.tags || []).some(tag => tag?.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const toggleFAQ = (id: string | undefined) => {
    if (!id) return
    setExpandedFAQ(expandedFAQ === id ? null : id)
  }

  const toggleSection = (id: string | undefined) => {
    if (!id) return
    setExpandedSection(expandedSection === id ? null : id)
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
      case 'intermediate': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
      case 'advanced': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
    }
  }

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'مبتدی'
      case 'intermediate': return 'متوسط'
      case 'advanced': return 'پیشرفته'
      default: return 'نامشخص'
    }
  }

  // CRUD Handlers for FAQ
  const handleCreateFAQ = () => {
    setEditingFAQ(null)
    setFaqForm({ question: '', answer: '', category: 'عمومی', tags: [] })
    setShowFAQModal(true)
  }

  const handleEditFAQ = (faq: FAQItem) => {
    setEditingFAQ(faq)
    setFaqForm({
      question: faq.question || '',
      answer: faq.answer || '',
      category: faq.category || 'عمومی',
      tags: faq.tags || []
    })
    setTagInput('')
    setShowFAQModal(true)
  }

  const handleDeleteFAQ = async (faqId: string) => {
    if (!confirm('آیا از حذف این سوال متداول اطمینان دارید؟')) return
    try {
      const response = await fetch(`/api/help?id=${faqId}&type=faq`, { method: 'DELETE' })
      const result = await response.json()
      if (result.success) {
        alert('سوال متداول با موفقیت حذف شد')
        fetchFAQs()
      } else {
        alert(result.message || 'خطا در حذف سوال متداول')
      }
    } catch (error) {
      console.error('Error deleting FAQ:', error)
      alert('خطا در حذف سوال متداول')
    }
  }

  const handleSaveFAQ = async () => {
    if (!faqForm.question || !faqForm.answer) {
      alert('سوال و پاسخ اجباری است')
      return
    }
    setSaving(true)
    try {
      const method = editingFAQ ? 'PUT' : 'POST'
      const body = {
        type: 'faq',
        ...(editingFAQ && { id: editingFAQ._id || editingFAQ.id }),
        ...faqForm
      }
      const response = await fetch('/api/help', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const result = await response.json()
      if (result.success) {
        alert(editingFAQ ? 'سوال متداول با موفقیت به‌روزرسانی شد' : 'سوال متداول با موفقیت ایجاد شد')
        setShowFAQModal(false)
        setEditingFAQ(null)
        setFaqForm({ question: '', answer: '', category: 'عمومی', tags: [] })
        fetchFAQs()
      } else {
        alert(result.message || 'خطا در ذخیره سوال متداول')
      }
    } catch (error) {
      console.error('Error saving FAQ:', error)
      alert('خطا در ذخیره سوال متداول')
    } finally {
      setSaving(false)
    }
  }

  // CRUD Handlers for Section
  const handleCreateSection = () => {
    setEditingSection(null)
    setSectionForm({ title: '', description: '', icon: 'BookOpen', order: helpSections.length + 1 })
    setShowSectionModal(true)
  }

  const handleEditSection = (section: HelpSection) => {
    setEditingSection(section)
    setSectionForm({
      title: section.title || '',
      description: section.description || '',
      icon: section.icon || 'BookOpen',
      order: section.order || 0
    })
    setShowSectionModal(true)
  }

  const handleDeleteSection = async (sectionId: string) => {
    if (!confirm('آیا از حذف این بخش و مقالات مرتبط اطمینان دارید؟')) return
    try {
      const response = await fetch(`/api/help?id=${sectionId}&type=section`, { method: 'DELETE' })
      const result = await response.json()
      if (result.success) {
        alert('بخش با موفقیت حذف شد')
        fetchSections()
      } else {
        alert(result.message || 'خطا در حذف بخش')
      }
    } catch (error) {
      console.error('Error deleting section:', error)
      alert('خطا در حذف بخش')
    }
  }

  const handleSaveSection = async () => {
    if (!sectionForm.title) {
      alert('عنوان بخش اجباری است')
      return
    }
    setSaving(true)
    try {
      const method = editingSection ? 'PUT' : 'POST'
      const body = {
        type: 'section',
        ...(editingSection && { id: editingSection._id || editingSection.id }),
        ...sectionForm
      }
      const response = await fetch('/api/help', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const result = await response.json()
      if (result.success) {
        alert(editingSection ? 'بخش با موفقیت به‌روزرسانی شد' : 'بخش با موفقیت ایجاد شد')
        setShowSectionModal(false)
        setEditingSection(null)
        setSectionForm({ title: '', description: '', icon: 'BookOpen', order: 0 })
        fetchSections()
      } else {
        alert(result.message || 'خطا در ذخیره بخش')
      }
    } catch (error) {
      console.error('Error saving section:', error)
      alert('خطا در ذخیره بخش')
    } finally {
      setSaving(false)
    }
  }

  // CRUD Handlers for Article
  const handleCreateArticle = (sectionId?: string) => {
    setEditingArticle(null)
    setArticleForm({
      title: '',
      description: '',
      content: '',
      category: 'عمومی',
      difficulty: 'beginner',
      estimatedTime: '5 دقیقه',
      tags: [],
      sectionId: sectionId || ''
    })
    setTagInput('')
    setShowArticleModal(true)
  }

  const handleEditArticle = (article: HelpArticle) => {
    setEditingArticle(article)
    setArticleForm({
      title: article.title || '',
      description: article.description || '',
      content: article.content || '',
      category: article.category || 'عمومی',
      difficulty: article.difficulty || 'beginner',
      estimatedTime: article.estimatedTime || '5 دقیقه',
      tags: article.tags || [],
      sectionId: article.sectionId || ''
    })
    setTagInput('')
    setShowArticleModal(true)
  }

  const handleDeleteArticle = async (articleId: string) => {
    if (!confirm('آیا از حذف این مقاله اطمینان دارید؟')) return
    try {
      const response = await fetch(`/api/help?id=${articleId}&type=article`, { method: 'DELETE' })
      const result = await response.json()
      if (result.success) {
        alert('مقاله با موفقیت حذف شد')
        fetchSections()
      } else {
        alert(result.message || 'خطا در حذف مقاله')
      }
    } catch (error) {
      console.error('Error deleting article:', error)
      alert('خطا در حذف مقاله')
    }
  }

  const handleSaveArticle = async () => {
    if (!articleForm.title || !articleForm.content) {
      alert('عنوان و محتوا اجباری است')
      return
    }
    setSaving(true)
    try {
      const method = editingArticle ? 'PUT' : 'POST'
      const body = {
        type: 'article',
        ...(editingArticle && { id: editingArticle._id || editingArticle.id }),
        ...articleForm,
        sectionId: articleForm.sectionId || null
      }
      const response = await fetch('/api/help', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const result = await response.json()
      if (result.success) {
        alert(editingArticle ? 'مقاله با موفقیت به‌روزرسانی شد' : 'مقاله با موفقیت ایجاد شد')
        setShowArticleModal(false)
        setEditingArticle(null)
        setArticleForm({
          title: '',
          description: '',
          content: '',
          category: 'عمومی',
          difficulty: 'beginner',
          estimatedTime: '5 دقیقه',
          tags: [],
          sectionId: ''
        })
        fetchSections()
      } else {
        alert(result.message || 'خطا در ذخیره مقاله')
      }
    } catch (error) {
      console.error('Error saving article:', error)
      alert('خطا در ذخیره مقاله')
    } finally {
      setSaving(false)
    }
  }

  // Tag management
  const addTag = (tagList: string[], setTagList: (tags: string[]) => void, inputValue: string, setInput: (value: string) => void) => {
    if (inputValue.trim() && !tagList.includes(inputValue.trim())) {
      setTagList([...tagList, inputValue.trim()])
      setInput('')
    }
  }

  const removeTag = (tagList: string[], setTagList: (tags: string[]) => void, tagToRemove: string) => {
    setTagList(tagList.filter(tag => tag !== tagToRemove))
  }

  // Add sample data
  const handleAddSampleData = async () => {
    if (!confirm('آیا می‌خواهید داده‌های نمونه اضافه شوند؟')) return
    try {
      const response = await fetch('/api/add-sample-help-data', { method: 'POST' })
      const result = await response.json()
      if (result.success) {
        alert(result.message)
        await Promise.all([fetchFAQs(), fetchSections()])
      } else {
        alert(result.message || 'خطا در افزودن داده‌های نمونه')
      }
    } catch (error) {
      console.error('Error adding sample data:', error)
      alert('خطا در افزودن داده‌های نمونه')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/80 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2">راهنما و پشتیبانی</h1>
            <p className="text-gray-600 dark:text-gray-300">راهنمای کامل استفاده از سیستم مدیریت رستوران</p>
          </div>
          <button
            onClick={handleAddSampleData}
            className="premium-button bg-green-600 hover:bg-green-700 flex items-center space-x-2 space-x-reverse"
          >
            <Plus className="w-5 h-5" />
            <span>افزودن داده‌های نمونه</span>
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center space-x-2 space-x-reverse">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <p className="text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
        )}

        {/* Search and Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Search */}
          <div className="lg:col-span-2">
            <div className="premium-card p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">جستجو در راهنما</h2>
              <div className="relative mb-4">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="جستجو در راهنما، سوالات متداول و مقالات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
              <div className="flex items-center space-x-4 space-x-reverse">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category === 'all' ? 'همه دسته‌ها' : category}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <div className="premium-card p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">پشتیبانی سریع</h2>
              <div className="space-y-3">
                <button className="w-full flex items-center space-x-3 space-x-reverse p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors">
                  <MessageCircle className="w-5 h-5" />
                  <span>چت آنلاین</span>
                </button>
                <button className="w-full flex items-center space-x-3 space-x-reverse p-3 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors">
                  <Phone className="w-5 h-5" />
                  <span>تماس تلفنی</span>
                </button>
                <button className="w-full flex items-center space-x-3 space-x-reverse p-3 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors">
                  <Mail className="w-5 h-5" />
                  <span>ایمیل پشتیبانی</span>
                </button>
                <button className="w-full flex items-center space-x-3 space-x-reverse p-3 bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/50 transition-colors">
                  <Video className="w-5 h-5" />
                  <span>ویدیوهای آموزشی</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Help Sections */}
        <div className="premium-card p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">راهنمای کامل</h2>
            <button
              onClick={handleCreateSection}
              className="premium-button bg-blue-600 hover:bg-blue-700 flex items-center space-x-2 space-x-reverse"
            >
              <Plus className="w-5 h-5" />
              <span>افزودن بخش</span>
            </button>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-600 dark:text-gray-400">در حال بارگذاری...</p>
              </div>
            </div>
          ) : helpSections.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 mb-4 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">هیچ بخشی یافت نشد</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">بخش‌های راهنما در اینجا نمایش داده می‌شوند</p>
            </div>
          ) : (
            <div className="space-y-4">
              {helpSections.map((section) => {
                if (!section || (!section._id && !section.id)) return null
                const sectionId = section._id || section.id
                return (
                  <div key={sectionId} className="border border-gray-200 dark:border-gray-600/30 rounded-lg hover:shadow-lg transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => toggleSection(sectionId)}
                        className="flex-1 flex items-center justify-between p-4 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-gray-800 dark:hover:to-gray-700 transition-all duration-200"
                      >
                        <div className="flex items-center space-x-3 space-x-reverse">
                          <SectionIcon iconName={section.icon} />
                          <div className="text-right">
                            <h3 className="font-medium text-gray-900 dark:text-white">{section.title || 'بدون عنوان'}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300">{section.description || ''}</p>
                          </div>
                        </div>
                        {expandedSection === sectionId ? (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                      <div className="flex items-center space-x-2 space-x-reverse p-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleEditSection(section)}
                          className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all"
                          title="ویرایش"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteSection(sectionId)}
                          className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all"
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    {expandedSection === sectionId && (
                      <div className="border-t border-gray-200 dark:border-gray-600/30 p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/50">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-semibold text-gray-900 dark:text-white">مقالات این بخش</h4>
                          <button
                            onClick={() => handleCreateArticle(sectionId)}
                            className="premium-button bg-green-600 hover:bg-green-700 flex items-center space-x-2 space-x-reverse text-sm"
                          >
                            <Plus className="w-4 h-4" />
                            <span>افزودن مقاله</span>
                          </button>
                        </div>
                        {(!section.articles || section.articles.length === 0) ? (
                          <div className="text-center py-8">
                            <p className="text-gray-500 dark:text-gray-400 mb-4">هیچ مقاله‌ای در این بخش وجود ندارد</p>
                            <button
                              onClick={() => handleCreateArticle(sectionId)}
                              className="premium-button bg-primary-600 hover:bg-primary-700"
                            >
                              افزودن اولین مقاله
                            </button>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {section.articles.map((article) => {
                              if (!article || (!article._id && !article.id)) return null
                              const articleId = article._id || article.id
                              return (
                                <div
                                  key={articleId}
                                  className="p-4 bg-white dark:bg-gray-700 rounded-xl hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50 dark:hover:from-gray-600 dark:hover:to-gray-600 transition-all duration-300 shadow-md hover:shadow-xl relative"
                                >
                                  <div className="flex items-start justify-between mb-2">
                                    <h4 
                                      className="font-semibold text-gray-900 dark:text-white cursor-pointer flex-1"
                                      onClick={() => setSelectedArticle(article)}
                                    >
                                      {article.title || 'بدون عنوان'}
                                    </h4>
                                    <div className="flex items-center space-x-2 space-x-reverse mr-2">
                                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getDifficultyColor(article.difficulty || 'beginner')}`}>
                                        {getDifficultyText(article.difficulty || 'beginner')}
                                      </span>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleEditArticle(article)
                                        }}
                                        className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-all"
                                        title="ویرایش"
                                      >
                                        <Edit className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleDeleteArticle(articleId)
                                        }}
                                        className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-all"
                                        title="حذف"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                  <div 
                                    className="cursor-pointer"
                                    onClick={() => setSelectedArticle(article)}
                                  >
                                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">{article.description || ''}</p>
                                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                                      <span className="flex items-center space-x-1 space-x-reverse">
                                        <Clock className="w-3 h-3" />
                                        <span>{article.estimatedTime || 'نامشخص'}</span>
                                      </span>
                                      <span className="flex items-center space-x-1 space-x-reverse">
                                        <FileText className="w-3 h-3" />
                                        <span>{article.category || 'عمومی'}</span>
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* FAQ Section */}
        <div className="premium-card p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">سوالات متداول</h2>
            <button
              onClick={handleCreateFAQ}
              className="premium-button bg-blue-600 hover:bg-blue-700 flex items-center space-x-2 space-x-reverse"
            >
              <Plus className="w-5 h-5" />
              <span>افزودن سوال</span>
            </button>
          </div>
          <div className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-gray-600 dark:text-gray-400">در حال بارگذاری...</p>
                </div>
              </div>
            ) : filteredFAQ.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-16 h-16 mb-4 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center">
                  <HelpCircle className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">هیچ سوالی یافت نشد</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">سوالات متداول در اینجا نمایش داده می‌شوند</p>
              </div>
            ) : (
              filteredFAQ.map((item) => {
                if (!item || (!item._id && !item.id)) return null
                const itemId = item._id || item.id || ''
                return (
                  <div key={itemId} className="border border-gray-200 dark:border-gray-600/30 rounded-lg hover:shadow-lg transition-all duration-300">
                    <div className="flex items-center">
                      <button
                        onClick={() => toggleFAQ(itemId)}
                        className="flex-1 flex items-center justify-between p-4 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-gray-800 dark:hover:to-gray-700 transition-all duration-200"
                      >
                        <div className="text-right">
                          <h3 className="font-semibold text-gray-900 dark:text-white">{item.question || 'بدون سوال'}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{item.category || 'عمومی'}</p>
                        </div>
                        {expandedFAQ === itemId ? (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                      <div className="flex items-center space-x-2 space-x-reverse p-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleEditFAQ(item)}
                          className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all"
                          title="ویرایش"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteFAQ(itemId)}
                          className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all"
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    {expandedFAQ === itemId && (
                      <div className="border-t border-gray-200 dark:border-gray-600/30 p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/50">
                        <p className="text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">{item.answer || ''}</p>
                        {(item.tags || []).length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {item.tags.map((tag, index) => (
                              <span key={index} className="px-3 py-1 bg-gradient-to-r from-primary-100 to-purple-100 dark:from-primary-900/30 dark:to-purple-900/30 text-primary-700 dark:text-primary-300 rounded-lg text-xs font-medium">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Article Modal */}
        {selectedArticle && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedArticle(null)}>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{selectedArticle.title || 'بدون عنوان'}</h3>
                <button
                  onClick={() => setSelectedArticle(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="mb-4">
                <p className="text-gray-600 dark:text-gray-300 mb-3">{selectedArticle.description || ''}</p>
                <div className="flex items-center space-x-4 space-x-reverse text-sm text-gray-500 dark:text-gray-400">
                  <span className="flex items-center space-x-1 space-x-reverse">
                    <Clock className="w-4 h-4" />
                    <span>{selectedArticle.estimatedTime || 'نامشخص'}</span>
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(selectedArticle.difficulty || 'beginner')}`}>
                    {getDifficultyText(selectedArticle.difficulty || 'beginner')}
                  </span>
                  <span>{selectedArticle.category || 'عمومی'}</span>
                </div>
              </div>
              <div className="prose dark:prose-invert max-w-none">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {selectedArticle.content || ''}
                </p>
              </div>
              {(selectedArticle.tags || []).length > 0 && (
                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600/30">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-2">
                      {selectedArticle.tags.map((tag, index) => (
                        <span key={index} className="px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <button className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                      <Download className="w-4 h-4" />
                      <span>دانلود PDF</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Contact Information */}
        <div className="premium-card p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">اطلاعات تماس</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <Phone className="w-8 h-8 text-primary-600 mx-auto mb-2" />
              <h3 className="font-medium text-gray-900 dark:text-white mb-1">تماس تلفنی</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">021-12345678</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">شنبه تا پنج‌شنبه 9-18</p>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <Mail className="w-8 h-8 text-primary-600 mx-auto mb-2" />
              <h3 className="font-medium text-gray-900 dark:text-white mb-1">ایمیل پشتیبانی</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">support@restaurant.com</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">پاسخ در کمتر از 24 ساعت</p>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <MessageCircle className="w-8 h-8 text-primary-600 mx-auto mb-2" />
              <h3 className="font-medium text-gray-900 dark:text-white mb-1">چت آنلاین</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">24/7 در دسترس</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">پاسخ فوری</p>
            </div>
          </div>
        </div>

        {/* FAQ Modal */}
        {showFAQModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowFAQModal(false)}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="relative px-6 py-5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-2xl">
                <h3 className="text-xl font-bold">{editingFAQ ? 'ویرایش سوال متداول' : 'افزودن سوال متداول'}</h3>
                <button
                  onClick={() => setShowFAQModal(false)}
                  className="absolute left-6 top-5 text-white hover:text-gray-200 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">سوال *</label>
                  <input
                    type="text"
                    value={faqForm.question}
                    onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="مثال: چگونه یک سفارش ثبت کنم؟"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">پاسخ *</label>
                  <textarea
                    value={faqForm.answer}
                    onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })}
                    rows={5}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="پاسخ کامل به سوال..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">دسته‌بندی</label>
                  <select
                    value={faqForm.category}
                    onChange={(e) => setFaqForm({ ...faqForm, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {categories.filter(c => c !== 'all').map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">برچسب‌ها</label>
                  <div className="flex items-center space-x-2 space-x-reverse mb-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addTag(faqForm.tags, (tags) => setFaqForm({ ...faqForm, tags }), tagInput, setTagInput)
                        }
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="برچسب را وارد کنید و Enter بزنید"
                    />
                    <button
                      onClick={() => addTag(faqForm.tags, (tags) => setFaqForm({ ...faqForm, tags }), tagInput, setTagInput)}
                      className="premium-button bg-primary-600 hover:bg-primary-700"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {faqForm.tags.map((tag, index) => (
                      <span key={index} className="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-lg text-sm flex items-center space-x-2 space-x-reverse">
                        <span>{tag}</span>
                        <button
                          onClick={() => removeTag(faqForm.tags, (tags) => setFaqForm({ ...faqForm, tags }), tag)}
                          className="text-primary-600 hover:text-primary-800"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-end space-x-4 space-x-reverse pt-4 border-t border-gray-200 dark:border-gray-600">
                  <button
                    onClick={() => setShowFAQModal(false)}
                    className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    انصراف
                  </button>
                  <button
                    onClick={handleSaveFAQ}
                    disabled={saving}
                    className="premium-button bg-blue-600 hover:bg-blue-700 flex items-center space-x-2 space-x-reverse"
                  >
                    <Save className="w-5 h-5" />
                    <span>{saving ? 'در حال ذخیره...' : 'ذخیره'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Section Modal */}
        {showSectionModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowSectionModal(false)}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="relative px-6 py-5 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-t-2xl">
                <h3 className="text-xl font-bold">{editingSection ? 'ویرایش بخش' : 'افزودن بخش'}</h3>
                <button
                  onClick={() => setShowSectionModal(false)}
                  className="absolute left-6 top-5 text-white hover:text-gray-200 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">عنوان *</label>
                  <input
                    type="text"
                    value={sectionForm.title}
                    onChange={(e) => setSectionForm({ ...sectionForm, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="مثال: شروع کار"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">توضیحات</label>
                  <textarea
                    value={sectionForm.description}
                    onChange={(e) => setSectionForm({ ...sectionForm, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="توضیحات بخش..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">آیکون</label>
                  <select
                    value={sectionForm.icon}
                    onChange={(e) => setSectionForm({ ...sectionForm, icon: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {iconOptions.map(icon => (
                      <option key={icon} value={icon}>{icon}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">ترتیب نمایش</label>
                  <input
                    type="number"
                    value={sectionForm.order}
                    onChange={(e) => setSectionForm({ ...sectionForm, order: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    min="0"
                  />
                </div>
                <div className="flex items-center justify-end space-x-4 space-x-reverse pt-4 border-t border-gray-200 dark:border-gray-600">
                  <button
                    onClick={() => setShowSectionModal(false)}
                    className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    انصراف
                  </button>
                  <button
                    onClick={handleSaveSection}
                    disabled={saving}
                    className="premium-button bg-purple-600 hover:bg-purple-700 flex items-center space-x-2 space-x-reverse"
                  >
                    <Save className="w-5 h-5" />
                    <span>{saving ? 'در حال ذخیره...' : 'ذخیره'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Article Modal */}
        {showArticleModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowArticleModal(false)}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="relative px-6 py-5 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-t-2xl">
                <h3 className="text-xl font-bold">{editingArticle ? 'ویرایش مقاله' : 'افزودن مقاله'}</h3>
                <button
                  onClick={() => setShowArticleModal(false)}
                  className="absolute left-6 top-5 text-white hover:text-gray-200 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">عنوان *</label>
                  <input
                    type="text"
                    value={articleForm.title}
                    onChange={(e) => setArticleForm({ ...articleForm, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="عنوان مقاله"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">توضیحات</label>
                  <textarea
                    value={articleForm.description}
                    onChange={(e) => setArticleForm({ ...articleForm, description: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="توضیحات کوتاه مقاله..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">محتوا *</label>
                  <textarea
                    value={articleForm.content}
                    onChange={(e) => setArticleForm({ ...articleForm, content: e.target.value })}
                    rows={8}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="محتوی کامل مقاله..."
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">دسته‌بندی</label>
                    <select
                      value={articleForm.category}
                      onChange={(e) => setArticleForm({ ...articleForm, category: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      {categories.filter(c => c !== 'all').map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">سطح دشواری</label>
                    <select
                      value={articleForm.difficulty}
                      onChange={(e) => setArticleForm({ ...articleForm, difficulty: e.target.value as 'beginner' | 'intermediate' | 'advanced' })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="beginner">مبتدی</option>
                      <option value="intermediate">متوسط</option>
                      <option value="advanced">پیشرفته</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">زمان تخمینی</label>
                    <input
                      type="text"
                      value={articleForm.estimatedTime}
                      onChange={(e) => setArticleForm({ ...articleForm, estimatedTime: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="مثال: 5 دقیقه"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">بخش</label>
                  <select
                    value={articleForm.sectionId}
                    onChange={(e) => setArticleForm({ ...articleForm, sectionId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">بدون بخش</option>
                    {helpSections.map(section => (
                      <option key={section._id || section.id} value={section._id || section.id || ''}>
                        {section.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">برچسب‌ها</label>
                  <div className="flex items-center space-x-2 space-x-reverse mb-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addTag(articleForm.tags, (tags) => setArticleForm({ ...articleForm, tags }), tagInput, setTagInput)
                        }
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="برچسب را وارد کنید و Enter بزنید"
                    />
                    <button
                      onClick={() => addTag(articleForm.tags, (tags) => setArticleForm({ ...articleForm, tags }), tagInput, setTagInput)}
                      className="premium-button bg-primary-600 hover:bg-primary-700"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {articleForm.tags.map((tag, index) => (
                      <span key={index} className="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-lg text-sm flex items-center space-x-2 space-x-reverse">
                        <span>{tag}</span>
                        <button
                          onClick={() => removeTag(articleForm.tags, (tags) => setArticleForm({ ...articleForm, tags }), tag)}
                          className="text-primary-600 hover:text-primary-800"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-end space-x-4 space-x-reverse pt-4 border-t border-gray-200 dark:border-gray-600">
                  <button
                    onClick={() => setShowArticleModal(false)}
                    className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    انصراف
                  </button>
                  <button
                    onClick={handleSaveArticle}
                    disabled={saving}
                    className="premium-button bg-green-600 hover:bg-green-700 flex items-center space-x-2 space-x-reverse"
                  >
                    <Save className="w-5 h-5" />
                    <span>{saving ? 'در حال ذخیره...' : 'ذخیره'}</span>
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
