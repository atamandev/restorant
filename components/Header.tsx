'use client'

import { useState } from 'react'
import { useAuth } from './AuthProvider'
import { 
  Bell, 
  Search, 
  User, 
  Settings, 
  LogOut,
  Menu,
  ChefHat,
  TrendingUp,
  Users,
  DollarSign
} from 'lucide-react'
import MobileMenu from './MobileMenu'
import DarkModeToggle from './DarkModeToggle'

export default function Header() {
  const { user, logout } = useAuth()
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <header className="premium-header sticky top-0 z-50">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Logo and Title */}
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center floating-card pulse-glow">
                <ChefHat className="w-6 h-6 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-decorative gradient-text dark:text-white">مدیریت رستوران</h1>
                <p className="text-sm font-persian-medium text-gray-500 dark:text-gray-300">سیستم مدیریت حرفه‌ای</p>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="جستجو در منو، سفارشات، مشتریان..."
                className="premium-input pr-10 pl-4 py-2.5"
              />
            </div>
          </div>

          {/* Stats Cards */}
          <div className="hidden lg:flex items-center space-x-4 space-x-reverse">
            <div className="flex items-center space-x-2 space-x-reverse bg-success-50 px-3 py-2 rounded-lg floating-card">
              <TrendingUp className="w-4 h-4 text-success-600" />
              <span className="text-sm font-medium text-success-700">+12%</span>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse bg-primary-50 px-3 py-2 rounded-lg floating-card">
              <Users className="w-4 h-4 text-primary-600" />
              <span className="text-sm font-medium text-primary-700">245</span>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse bg-accent-50 px-3 py-2 rounded-lg floating-card">
              <DollarSign className="w-4 h-4 text-accent-600" />
              <span className="text-sm font-medium text-accent-700">12.5M</span>
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-3 space-x-reverse">
            {/* Dark Mode Toggle */}
            <DarkModeToggle />
            
            {/* Notifications */}
            <button className="relative p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <Bell className="w-6 h-6" />
              <span className="absolute -top-1 -left-1 w-3 h-3 bg-red-500 rounded-full"></span>
            </button>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-2 space-x-reverse p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="hidden md:block text-right">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-300">
                    {user?.firstName} {user?.lastName} ({user?.role})
                  </p>
                </div>
              </button>

              {/* Dropdown Menu */}
              {isProfileOpen && (
                <div className="absolute left-0 mt-2 w-48 bg-white dark:bg-gray-800/95 rounded-xl shadow-medium border border-gray-100 dark:border-gray-600/30 py-2 z-50 backdrop-blur-sm">
                  <button className="w-full text-right px-4 py-2 text-sm text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center space-x-2 space-x-reverse">
                    <User className="w-4 h-4" />
                    <span>پروفایل</span>
                  </button>
                  <button className="w-full text-right px-4 py-2 text-sm text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center space-x-2 space-x-reverse">
                    <Settings className="w-4 h-4" />
                    <span>تنظیمات</span>
                  </button>
                  <hr className="my-2 border-gray-200 dark:border-gray-600/30" />
                  <button 
                    onClick={logout}
                    className="w-full text-right px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center space-x-2 space-x-reverse"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>خروج</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile Menu */}
      <MobileMenu 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
      />
    </header>
  )
}
