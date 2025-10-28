'use client'

import { useState, useEffect } from 'react'
import { 
  MessageSquare, 
  Star, 
  ThumbsUp, 
  ThumbsDown, 
  Filter, 
  Search, 
  Calendar, 
  User, 
  Clock,
  CheckCircle,
  AlertCircle,
  Heart,
  Smile,
  Frown,
  Meh
} from 'lucide-react'

interface Feedback {
  _id?: string
  customerId: string
  customerName: string
  customerPhone: string
  orderId: string
  rating: number
  comment: string
  category: 'food' | 'service' | 'ambiance' | 'delivery' | 'other'
  sentiment: 'positive' | 'negative' | 'neutral'
  status: 'pending' | 'reviewed' | 'resolved'
  createdAt: string
  response?: string
  respondedAt?: string
}

export default function CustomerFeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterSentiment, setFilterSentiment] = useState('all')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null)
  const [loading, setLoading] = useState(false)
  const [showResponseForm, setShowResponseForm] = useState(false)
  const [responseText, setResponseText] = useState('')
  const [editingFeedback, setEditingFeedback] = useState<Feedback | null>(null)

  const loadFeedbacks = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/customer-feedback')
      const result = await response.json()
      if (result.success) {
        setFeedbacks(result.data)
      }
    } catch (error) {
      console.error('Error loading feedbacks:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFeedbacks()
  }, [])

  const filteredFeedbacks = feedbacks.filter(feedback => {
    const matchesSearch = feedback.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         feedback.comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         feedback.orderId.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || feedback.status === filterStatus
    const matchesCategory = filterCategory === 'all' || feedback.category === filterCategory
    const matchesSentiment = filterSentiment === 'all' || feedback.sentiment === filterSentiment
    return matchesSearch && matchesStatus && matchesCategory && matchesSentiment
  }).sort((a, b) => {
    let comparison = 0
    switch (sortBy) {
      case 'createdAt':
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        break
      case 'rating':
        comparison = a.rating - b.rating
        break
      case 'customerName':
        comparison = a.customerName.localeCompare(b.customerName)
        break
      default:
        comparison = 0
    }
    return sortOrder === 'asc' ? comparison : -comparison
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
      case 'reviewed': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
      case 'resolved': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'در انتظار بررسی'
      case 'reviewed': return 'بررسی شده'
      case 'resolved': return 'حل شده'
      default: return 'نامشخص'
    }
  }

  const getCategoryText = (category: string) => {
    switch (category) {
      case 'food': return 'غذا'
      case 'service': return 'خدمات'
      case 'ambiance': return 'فضا'
      case 'delivery': return 'ارسال'
      case 'other': return 'سایر'
      default: return 'نامشخص'
    }
  }

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return <Smile className="w-4 h-4 text-green-600" />
      case 'negative': return <Frown className="w-4 h-4 text-red-600" />
      case 'neutral': return <Meh className="w-4 h-4 text-gray-600" />
      default: return <Meh className="w-4 h-4 text-gray-600" />
    }
  }

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
      case 'negative': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
      case 'neutral': return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
    }
  }

  const getTotalFeedbacks = () => feedbacks.length
  const getPendingFeedbacks = () => feedbacks.filter(feedback => feedback.status === 'pending').length
  const getReviewedFeedbacks = () => feedbacks.filter(feedback => feedback.status === 'reviewed').length
  const getResolvedFeedbacks = () => feedbacks.filter(feedback => feedback.status === 'resolved').length
  const getPositiveFeedbacks = () => feedbacks.filter(feedback => feedback.sentiment === 'positive').length
  const getNegativeFeedbacks = () => feedbacks.filter(feedback => feedback.sentiment === 'negative').length
  const getAverageRating = () => feedbacks.length > 0 ? feedbacks.reduce((sum, feedback) => sum + feedback.rating, 0) / feedbacks.length : 0

  const addSampleData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/add-sample-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        }
      })
      
      const result = await response.json()
      if (result.success) {
        await loadFeedbacks()
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

  const handleUpdateFeedback = async (feedbackId: string, status: string, responseText?: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/customer-feedback/${feedbackId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify({
          status,
          response: responseText || ''
        })
      })
      
      const result = await response.json()
      if (result.success) {
        await loadFeedbacks()
        setShowResponseForm(false)
        setResponseText('')
        setEditingFeedback(null)
        alert('نظر با موفقیت بروزرسانی شد')
      } else {
        alert('خطا در بروزرسانی نظر: ' + result.message)
      }
    } catch (error) {
      console.error('Error updating feedback:', error)
      alert('خطا در بروزرسانی نظر')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteFeedback = async (feedbackId: string) => {
    if (!confirm('آیا مطمئن هستید که می‌خواهید این نظر را حذف کنید؟')) return
    
    try {
      setLoading(true)
      const response = await fetch(`/api/customer-feedback/${feedbackId}`, {
        method: 'DELETE'
      })
      
      const result = await response.json()
      if (result.success) {
        await loadFeedbacks()
        alert('نظر با موفقیت حذف شد')
      } else {
        alert('خطا در حذف نظر: ' + result.message)
      }
    } catch (error) {
      console.error('Error deleting feedback:', error)
      alert('خطا در حذف نظر')
    } finally {
      setLoading(false)
    }
  }

  const openResponseForm = (feedback: Feedback) => {
    setEditingFeedback(feedback)
    setResponseText(feedback.response || '')
    setShowResponseForm(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/80 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold gradient-text mb-2">نظرات مشتریان</h1>
              <p className="text-gray-600 dark:text-gray-300">مدیریت و بررسی نظرات و بازخورد مشتریان</p>
            </div>
            <button
              onClick={addSampleData}
              disabled={loading}
              className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              <MessageSquare className="w-4 h-4" />
              <span>داده‌های نمونه</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
          <div className="premium-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-300">کل نظرات</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{getTotalFeedbacks()}</p>
              </div>
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
          <div className="premium-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-300">در انتظار بررسی</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{getPendingFeedbacks()}</p>
              </div>
              <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                <Clock className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>
          <div className="premium-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-300">بررسی شده</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{getReviewedFeedbacks()}</p>
              </div>
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
          <div className="premium-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-300">حل شده</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{getResolvedFeedbacks()}</p>
              </div>
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
          <div className="premium-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-300">نظرات مثبت</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{getPositiveFeedbacks()}</p>
              </div>
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <ThumbsUp className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
          <div className="premium-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-300">میانگین امتیاز</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{getAverageRating().toFixed(1)}</p>
              </div>
              <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                <Star className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
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
                  placeholder="جستجو در نظرات..."
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
                <option value="pending">در انتظار بررسی</option>
                <option value="reviewed">بررسی شده</option>
                <option value="resolved">حل شده</option>
              </select>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="all">همه دسته‌ها</option>
                <option value="food">غذا</option>
                <option value="service">خدمات</option>
                <option value="ambiance">فضا</option>
                <option value="delivery">ارسال</option>
                <option value="other">سایر</option>
              </select>
              <select
                value={filterSentiment}
                onChange={(e) => setFilterSentiment(e.target.value)}
                className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="all">همه احساسات</option>
                <option value="positive">مثبت</option>
                <option value="negative">منفی</option>
                <option value="neutral">خنثی</option>
              </select>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="createdAt">تاریخ</option>
                <option value="rating">امتیاز</option>
                <option value="customerName">نام مشتری</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>
        </div>

        {/* Feedbacks List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">در حال بارگذاری نظرات...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredFeedbacks.map(feedback => (
              <div key={feedback._id} className="premium-card p-6 hover:shadow-xl transition-all duration-300">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-4 space-x-reverse">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {feedback.customerName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{feedback.customerName}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{feedback.customerPhone}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">سفارش: {feedback.orderId}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <div className="flex items-center space-x-1 space-x-reverse">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < feedback.rating
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300 dark:text-gray-600'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">{feedback.rating}/5</span>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-gray-700 dark:text-gray-300">{feedback.comment}</p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(feedback.status)}`}>
                      {getStatusText(feedback.status)}
                    </span>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                      {getCategoryText(feedback.category)}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSentimentColor(feedback.sentiment)}`}>
                      <div className="flex items-center space-x-1 space-x-reverse">
                        {getSentimentIcon(feedback.sentiment)}
                        <span>
                          {feedback.sentiment === 'positive' ? 'مثبت' : 
                           feedback.sentiment === 'negative' ? 'منفی' : 'خنثی'}
                        </span>
                      </div>
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 space-x-reverse">
                    <div className="flex items-center space-x-2 space-x-reverse text-sm text-gray-500 dark:text-gray-400">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(feedback.createdAt).toLocaleDateString('fa-IR')}</span>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <button
                        onClick={() => openResponseForm(feedback)}
                        className="px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        پاسخ
                      </button>
                      <button
                        onClick={() => handleUpdateFeedback(feedback._id!, 'reviewed')}
                        className="px-3 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition-colors"
                      >
                        بررسی شد
                      </button>
                      <button
                        onClick={() => handleDeleteFeedback(feedback._id!)}
                        className="px-3 py-1 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 transition-colors"
                      >
                        حذف
                      </button>
                    </div>
                  </div>
                </div>

                {feedback.response && (
                  <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">پاسخ مدیریت:</h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{feedback.response}</p>
                    {feedback.respondedAt && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        پاسخ داده شده در: {new Date(feedback.respondedAt).toLocaleDateString('fa-IR')}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Response Form Modal */}
        {showResponseForm && editingFeedback && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-2xl mx-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  پاسخ به نظر {editingFeedback.customerName}
                </h3>
                <button
                  onClick={() => {
                    setShowResponseForm(false)
                    setEditingFeedback(null)
                    setResponseText('')
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    نظر مشتری:
                  </label>
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-gray-700 dark:text-gray-300">{editingFeedback.comment}</p>
                    <div className="flex items-center mt-2 space-x-2 space-x-reverse">
                      <div className="flex items-center space-x-1 space-x-reverse">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < editingFeedback.rating
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300 dark:text-gray-600'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">{editingFeedback.rating}/5</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    پاسخ شما:
                  </label>
                  <textarea
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    rows={4}
                    placeholder="پاسخ خود را بنویسید..."
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-end space-x-3 space-x-reverse mt-6">
                <button
                  onClick={() => {
                    setShowResponseForm(false)
                    setEditingFeedback(null)
                    setResponseText('')
                  }}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                >
                  انصراف
                </button>
                <button
                  onClick={() => handleUpdateFeedback(editingFeedback._id!, 'resolved', responseText)}
                  disabled={loading || !responseText.trim()}
                  className="px-6 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'در حال ارسال...' : 'ارسال پاسخ'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
