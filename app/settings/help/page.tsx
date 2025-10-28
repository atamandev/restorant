'use client'

import { useState } from 'react'
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
  Play,
  FileText,
  Users,
  Settings,
  ShoppingCart,
  BarChart3,
  Package,
  Clock,
  Star,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react'

interface FAQItem {
  id: string
  question: string
  answer: string
  category: string
  tags: string[]
}

interface HelpSection {
  id: string
  title: string
  description: string
  icon: any
  articles: HelpArticle[]
}

interface HelpArticle {
  id: string
  title: string
  description: string
  content: string
  category: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  estimatedTime: string
  tags: string[]
}

const faqData: FAQItem[] = [
  {
    id: '1',
    question: 'چگونه سفارش جدید ثبت کنم؟',
    answer: 'برای ثبت سفارش جدید، به بخش POS مراجعه کرده و میز مورد نظر را انتخاب کنید. سپس آیتم‌های منو را به سبد خرید اضافه کرده و اطلاعات مشتری را وارد کنید.',
    category: 'سفارشات',
    tags: ['سفارش', 'POS', 'میز']
  },
  {
    id: '2',
    question: 'چگونه موجودی انبار را بروزرسانی کنم؟',
    answer: 'به بخش موجودی مراجعه کرده و آیتم مورد نظر را انتخاب کنید. سپس مقدار جدید موجودی را وارد کرده و تغییرات را ذخیره کنید.',
    category: 'موجودی',
    tags: ['موجودی', 'انبار', 'بروزرسانی']
  },
  {
    id: '3',
    question: 'چگونه گزارش فروش دریافت کنم؟',
    answer: 'به بخش گزارشات مراجعه کرده و نوع گزارش مورد نظر را انتخاب کنید. می‌توانید گزارش را به صورت PDF یا Excel دانلود کنید.',
    category: 'گزارشات',
    tags: ['گزارش', 'فروش', 'دانلود']
  },
  {
    id: '4',
    question: 'چگونه مشتری جدید اضافه کنم؟',
    answer: 'به بخش مشتریان مراجعه کرده و دکمه "مشتری جدید" را کلیک کنید. اطلاعات مشتری را وارد کرده و ذخیره کنید.',
    category: 'مشتریان',
    tags: ['مشتری', 'اضافه کردن', 'اطلاعات']
  },
  {
    id: '5',
    question: 'چگونه منو را ویرایش کنم؟',
    answer: 'به بخش منو مراجعه کرده و آیتم مورد نظر را انتخاب کنید. اطلاعات جدید را وارد کرده و تغییرات را ذخیره کنید.',
    category: 'منو',
    tags: ['منو', 'ویرایش', 'آیتم']
  }
]

const helpSections: HelpSection[] = [
  {
    id: 'getting-started',
    title: 'شروع کار',
    description: 'راهنمای شروع کار با سیستم',
    icon: BookOpen,
    articles: [
      {
        id: '1',
        title: 'نصب و راه‌اندازی اولیه',
        description: 'مراحل نصب و پیکربندی اولیه سیستم',
        content: 'در این بخش نحوه نصب و راه‌اندازی اولیه سیستم را یاد خواهید گرفت...',
        category: 'شروع کار',
        difficulty: 'beginner',
        estimatedTime: '15 دقیقه',
        tags: ['نصب', 'راه‌اندازی', 'پیکربندی']
      },
      {
        id: '2',
        title: 'تنظیمات اولیه رستوران',
        description: 'تنظیم اطلاعات پایه رستوران',
        content: 'برای شروع کار، ابتدا باید اطلاعات پایه رستوران را تنظیم کنید...',
        category: 'شروع کار',
        difficulty: 'beginner',
        estimatedTime: '10 دقیقه',
        tags: ['تنظیمات', 'اطلاعات', 'رستوران']
      }
    ]
  },
  {
    id: 'orders',
    title: 'مدیریت سفارشات',
    description: 'راهنمای مدیریت سفارشات و POS',
    icon: ShoppingCart,
    articles: [
      {
        id: '3',
        title: 'ثبت سفارش جدید',
        description: 'نحوه ثبت سفارش جدید در سیستم',
        content: 'برای ثبت سفارش جدید، مراحل زیر را دنبال کنید...',
        category: 'سفارشات',
        difficulty: 'beginner',
        estimatedTime: '5 دقیقه',
        tags: ['سفارش', 'ثبت', 'POS']
      },
      {
        id: '4',
        title: 'مدیریت میزها',
        description: 'نحوه مدیریت میزها و وضعیت آن‌ها',
        content: 'در این بخش نحوه مدیریت میزها و تغییر وضعیت آن‌ها را یاد خواهید گرفت...',
        category: 'سفارشات',
        difficulty: 'intermediate',
        estimatedTime: '8 دقیقه',
        tags: ['میز', 'مدیریت', 'وضعیت']
      }
    ]
  },
  {
    id: 'inventory',
    title: 'مدیریت موجودی',
    description: 'راهنمای مدیریت موجودی و انبار',
    icon: Package,
    articles: [
      {
        id: '5',
        title: 'بروزرسانی موجودی',
        description: 'نحوه بروزرسانی موجودی آیتم‌ها',
        content: 'برای بروزرسانی موجودی، مراحل زیر را دنبال کنید...',
        category: 'موجودی',
        difficulty: 'beginner',
        estimatedTime: '3 دقیقه',
        tags: ['موجودی', 'بروزرسانی', 'انبار']
      },
      {
        id: '6',
        title: 'تنظیم حداقل موجودی',
        description: 'نحوه تنظیم حداقل موجودی برای آیتم‌ها',
        content: 'برای تنظیم حداقل موجودی، مراحل زیر را دنبال کنید...',
        category: 'موجودی',
        difficulty: 'intermediate',
        estimatedTime: '5 دقیقه',
        tags: ['حداقل', 'موجودی', 'تنظیم']
      }
    ]
  },
  {
    id: 'reports',
    title: 'گزارشات و تحلیل',
    description: 'راهنمای تولید و تحلیل گزارشات',
    icon: BarChart3,
    articles: [
      {
        id: '7',
        title: 'گزارش فروش',
        description: 'نحوه تولید گزارش فروش',
        content: 'برای تولید گزارش فروش، مراحل زیر را دنبال کنید...',
        category: 'گزارشات',
        difficulty: 'beginner',
        estimatedTime: '5 دقیقه',
        tags: ['گزارش', 'فروش', 'تولید']
      },
      {
        id: '8',
        title: 'تحلیل عملکرد',
        description: 'نحوه تحلیل عملکرد رستوران',
        content: 'برای تحلیل عملکرد رستوران، مراحل زیر را دنبال کنید...',
        category: 'گزارشات',
        difficulty: 'advanced',
        estimatedTime: '15 دقیقه',
        tags: ['تحلیل', 'عملکرد', 'آمار']
      }
    ]
  }
]

export default function HelpPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null)
  const [expandedSection, setExpandedSection] = useState<string | null>(null)
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null)

  const categories = ['all', 'سفارشات', 'موجودی', 'گزارشات', 'مشتریان', 'منو', 'تنظیمات']

  const filteredFAQ = faqData.filter(item => {
    const matchesSearch = item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const toggleFAQ = (id: string) => {
    setExpandedFAQ(expandedFAQ === id ? null : id)
  }

  const toggleSection = (id: string) => {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/80 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold gradient-text mb-2">راهنما و پشتیبانی</h1>
          <p className="text-gray-600 dark:text-gray-300">راهنمای کامل استفاده از سیستم مدیریت رستوران</p>
        </div>

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
                <button className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                  <Search className="w-4 h-4" />
                  <span>جستجو</span>
                </button>
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
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">راهنمای کامل</h2>
          <div className="space-y-4">
            {helpSections.map((section) => (
              <div key={section.id} className="border border-gray-200 dark:border-gray-600/30 rounded-lg">
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <section.icon className="w-6 h-6 text-primary-600" />
                    <div className="text-right">
                      <h3 className="font-medium text-gray-900 dark:text-white">{section.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{section.description}</p>
                    </div>
                  </div>
                  {expandedSection === section.id ? (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  )}
                </button>
                {expandedSection === section.id && (
                  <div className="border-t border-gray-200 dark:border-gray-600/30 p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {section.articles.map((article) => (
                        <div
                          key={article.id}
                          className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          onClick={() => setSelectedArticle(article)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium text-gray-900 dark:text-white">{article.title}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(article.difficulty)}`}>
                              {getDifficultyText(article.difficulty)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">{article.description}</p>
                          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                            <span className="flex items-center space-x-1 space-x-reverse">
                              <Clock className="w-3 h-3" />
                              <span>{article.estimatedTime}</span>
                            </span>
                            <span className="flex items-center space-x-1 space-x-reverse">
                              <FileText className="w-3 h-3" />
                              <span>{article.category}</span>
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="premium-card p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">سوالات متداول</h2>
          <div className="space-y-4">
            {filteredFAQ.map((item) => (
              <div key={item.id} className="border border-gray-200 dark:border-gray-600/30 rounded-lg">
                <button
                  onClick={() => toggleFAQ(item.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <div className="text-right">
                    <h3 className="font-medium text-gray-900 dark:text-white">{item.question}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{item.category}</p>
                  </div>
                  {expandedFAQ === item.id ? (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  )}
                </button>
                {expandedFAQ === item.id && (
                  <div className="border-t border-gray-200 dark:border-gray-600/30 p-4">
                    <p className="text-gray-700 dark:text-gray-300 mb-3">{item.answer}</p>
                    <div className="flex flex-wrap gap-2">
                      {item.tags.map((tag, index) => (
                        <span key={index} className="px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Article Modal */}
        {selectedArticle && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{selectedArticle.title}</h3>
                <button
                  onClick={() => setSelectedArticle(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                  ×
                </button>
              </div>
              <div className="mb-4">
                <p className="text-gray-600 dark:text-gray-300 mb-3">{selectedArticle.description}</p>
                <div className="flex items-center space-x-4 space-x-reverse text-sm text-gray-500 dark:text-gray-400">
                  <span className="flex items-center space-x-1 space-x-reverse">
                    <Clock className="w-4 h-4" />
                    <span>{selectedArticle.estimatedTime}</span>
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(selectedArticle.difficulty)}`}>
                    {getDifficultyText(selectedArticle.difficulty)}
                  </span>
                  <span>{selectedArticle.category}</span>
                </div>
              </div>
              <div className="prose dark:prose-invert max-w-none">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {selectedArticle.content}
                </p>
              </div>
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
      </div>
    </div>
  )
}
