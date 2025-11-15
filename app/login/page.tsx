'use client'

import { useState, useRef } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  ChefHat, 
  LogIn,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react'

export default function LoginPage() {
  const { login } = useAuth()
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isRedirecting, setIsRedirecting] = useState(false)
  const hasSubmitted = useRef(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Prevent double submission
    if (isLoading || isRedirecting || hasSubmitted.current) {
      return
    }
    
    hasSubmitted.current = true
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
        credentials: 'include'
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'نام کاربری یا رمز عبور اشتباه است')
      }

      if (data.data && data.data.token && data.data.user) {
        // Save token and user in AuthProvider
        login(data.data.token, data.data.user)
        
        // Get redirect URL
        const params = new URLSearchParams(window.location.search)
        let redirect = params.get('redirect') || '/'
        
        // Decode redirect URL
        try {
          redirect = decodeURIComponent(redirect)
        } catch (e) {
          redirect = '/'
        }
        
        // Ensure redirect is valid
        if (!redirect.startsWith('/')) {
          redirect = '/' + redirect
        }
        
        // Prevent redirect to login page
        if (redirect === '/login') {
          redirect = '/'
        }
        
        // Mark as redirecting
        setIsRedirecting(true)
        
        // Use window.location.href for full page reload
        // This ensures cookie is available to middleware
        window.location.href = redirect
        return
      } else {
        throw new Error('پاسخ نامعتبر از سرور')
      }
    } catch (error) {
      console.error('Login error:', error)
      setError(error instanceof Error ? error.message : 'خطا در اتصال به سرور')
      setIsLoading(false)
      setIsRedirecting(false)
      hasSubmitted.current = false
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    if (error) {
      setError('')
    }
  }

  // Show loading state while redirecting
  if (isRedirecting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/80 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300 text-lg">در حال انتقال به داشبورد...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/80 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center mx-auto mb-4 floating-card pulse-glow shadow-lg">
            <ChefHat className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold gradient-text mb-2">مدیریت رستوران</h1>
          <p className="text-gray-600 dark:text-gray-300">ورود به پنل مدیریت</p>
        </div>

        {/* Login Form */}
        <div className="premium-card p-8 shadow-xl animate-fade-in">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                نام کاربری یا ایمیل
              </label>
              <div className="relative">
                <User className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="نام کاربری یا ایمیل خود را وارد کنید"
                  className="premium-input pr-10 pl-4 py-3 w-full"
                  required
                  disabled={isLoading || isRedirecting}
                  autoComplete="username"
                  autoFocus
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                رمز عبور
              </label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="رمز عبور خود را وارد کنید"
                  className="premium-input pr-20 pl-4 py-3 w-full"
                  required
                  disabled={isLoading || isRedirecting}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors z-10"
                  tabIndex={-1}
                  disabled={isLoading || isRedirecting}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center space-x-2 space-x-reverse p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl animate-fade-in">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading || isRedirecting}
              className="w-full premium-button bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 space-x-reverse transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>در حال ورود...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>ورود</span>
                </>
              )}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
            <div className="flex items-center space-x-2 space-x-reverse mb-2">
              <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                اطلاعات ورود پیش‌فرض:
              </span>
            </div>
            <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1 font-mono">
              <div>نام کاربری: <span className="font-bold text-blue-900 dark:text-blue-100">admin</span></div>
              <div>رمز عبور: <span className="font-bold text-blue-900 dark:text-blue-100">123456</span></div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            © 2024 سیستم مدیریت رستوران. تمامی حقوق محفوظ است.
          </p>
        </div>
      </div>
    </div>
  )
}
