'use client'

import { useState } from 'react'
import { 
  Utensils, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter, 
  Eye, 
  EyeOff, 
  Star, 
  Clock, 
  DollarSign, 
  Package, 
  ChefHat, 
  Coffee, 
  Pizza, 
  IceCream, 
  Image, 
  Upload, 
  Save, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Info,
  Tag,
  BarChart3,
  TrendingUp,
  TrendingDown
} from 'lucide-react'

interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  category: string
  image: string
  isAvailable: boolean
  isPopular: boolean
  preparationTime: number
  ingredients: string[]
  allergens: string[]
  nutritionalInfo: {
    calories: number
    protein: number
    carbs: number
    fat: number
  }
  tags: string[]
  salesCount: number
  rating: number
  createdAt: string
  updatedAt: string
}

const initialMenuItems: MenuItem[] = [
  {
    id: '1',
    name: 'کباب کوبیده',
    description: 'کباب کوبیده سنتی با گوشت گوساله تازه و ادویه‌های مخصوص',
    price: 120000,
    category: 'غذاهای اصلی',
    image: '/api/placeholder/200/200',
    isAvailable: true,
    isPopular: true,
    preparationTime: 25,
    ingredients: ['گوشت گوساله', 'پیاز', 'زعفران', 'نمک', 'فلفل'],
    allergens: ['گلوتن'],
    nutritionalInfo: {
      calories: 450,
      protein: 35,
      carbs: 15,
      fat: 25
    },
    tags: ['سنتی', 'پرفروش', 'گوشت'],
    salesCount: 1250,
    rating: 4.8,
    createdAt: '1402/01/15',
    updatedAt: '1403/01/20'
  },
  {
    id: '2',
    name: 'جوجه کباب',
    description: 'جوجه کباب با سینه مرغ تازه و سس مخصوص',
    price: 135000,
    category: 'غذاهای اصلی',
    image: '/api/placeholder/200/200',
    isAvailable: true,
    isPopular: true,
    preparationTime: 20,
    ingredients: ['سینه مرغ', 'ماست', 'زعفران', 'نمک', 'فلفل'],
    allergens: ['لبنیات'],
    nutritionalInfo: {
      calories: 380,
      protein: 40,
      carbs: 10,
      fat: 18
    },
    tags: ['سنتی', 'پرفروش', 'مرغ'],
    salesCount: 980,
    rating: 4.7,
    createdAt: '1402/01/15',
    updatedAt: '1403/01/20'
  },
  {
    id: '3',
    name: 'سالاد سزار',
    description: 'سالاد سزار با کاهو تازه، پنیر پارمزان و سس مخصوص',
    price: 45000,
    category: 'پیش‌غذاها',
    image: '/api/placeholder/200/200',
    isAvailable: true,
    isPopular: false,
    preparationTime: 10,
    ingredients: ['کاهو', 'پنیر پارمزان', 'سس سزار', 'نان تست'],
    allergens: ['لبنیات', 'گلوتن'],
    nutritionalInfo: {
      calories: 280,
      protein: 12,
      carbs: 20,
      fat: 18
    },
    tags: ['سالاد', 'سالم', 'پیش‌غذا'],
    salesCount: 320,
    rating: 4.3,
    createdAt: '1402/03/10',
    updatedAt: '1403/01/18'
  },
  {
    id: '4',
    name: 'نوشابه',
    description: 'نوشابه گازدار سرد',
    price: 15000,
    category: 'نوشیدنی‌ها',
    image: '/api/placeholder/200/200',
    isAvailable: true,
    isPopular: false,
    preparationTime: 2,
    ingredients: ['نوشابه'],
    allergens: [],
    nutritionalInfo: {
      calories: 140,
      protein: 0,
      carbs: 35,
      fat: 0
    },
    tags: ['نوشیدنی', 'سرد', 'گازدار'],
    salesCount: 2100,
    rating: 4.0,
    createdAt: '1402/01/15',
    updatedAt: '1403/01/20'
  },
  {
    id: '5',
    name: 'دوغ محلی',
    description: 'دوغ محلی تازه و خنک',
    price: 18000,
    category: 'نوشیدنی‌ها',
    image: '/api/placeholder/200/200',
    isAvailable: true,
    isPopular: true,
    preparationTime: 3,
    ingredients: ['دوغ', 'نمک', 'نعنا'],
    allergens: ['لبنیات'],
    nutritionalInfo: {
      calories: 80,
      protein: 6,
      carbs: 8,
      fat: 3
    },
    tags: ['نوشیدنی', 'سرد', 'محلی'],
    salesCount: 850,
    rating: 4.5,
    createdAt: '1402/01/15',
    updatedAt: '1403/01/20'
  },
  {
    id: '6',
    name: 'میرزا قاسمی',
    description: 'میرزا قاسمی با بادمجان کبابی و سیر',
    price: 70000,
    category: 'پیش‌غذاها',
    image: '/api/placeholder/200/200',
    isAvailable: true,
    isPopular: false,
    preparationTime: 15,
    ingredients: ['بادمجان', 'سیر', 'گوجه', 'تخم مرغ'],
    allergens: ['تخم مرغ'],
    nutritionalInfo: {
      calories: 220,
      protein: 8,
      carbs: 25,
      fat: 12
    },
    tags: ['سنتی', 'گیاهی', 'پیش‌غذا'],
    salesCount: 180,
    rating: 4.2,
    createdAt: '1402/05/20',
    updatedAt: '1403/01/15'
  },
  {
    id: '7',
    name: 'چلو گوشت',
    description: 'چلو گوشت با گوشت گوساله و برنج ایرانی',
    price: 180000,
    category: 'غذاهای اصلی',
    image: '/api/placeholder/200/200',
    isAvailable: false,
    isPopular: false,
    preparationTime: 35,
    ingredients: ['گوشت گوساله', 'برنج', 'پیاز', 'زعفران'],
    allergens: ['گلوتن'],
    nutritionalInfo: {
      calories: 650,
      protein: 45,
      carbs: 55,
      fat: 28
    },
    tags: ['سنتی', 'گوشت', 'گران'],
    salesCount: 95,
    rating: 4.6,
    createdAt: '1402/02/10',
    updatedAt: '1403/01/10'
  },
  {
    id: '8',
    name: 'بستنی سنتی',
    description: 'بستنی سنتی با طعم زعفران و گلاب',
    price: 35000,
    category: 'دسرها',
    image: '/api/placeholder/200/200',
    isAvailable: true,
    isPopular: true,
    preparationTime: 5,
    ingredients: ['شیر', 'خامه', 'زعفران', 'گلاب'],
    allergens: ['لبنیات'],
    nutritionalInfo: {
      calories: 320,
      protein: 8,
      carbs: 35,
      fat: 18
    },
    tags: ['دسر', 'سنتی', 'سرد'],
    salesCount: 650,
    rating: 4.9,
    createdAt: '1402/04/15',
    updatedAt: '1403/01/20'
  }
]

export default function AllMenuItemsPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>(initialMenuItems)
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterAvailability, setFilterAvailability] = useState('all')
  const [filterPopular, setFilterPopular] = useState('all')
  const [sortBy, setSortBy] = useState('name')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    category: '',
    image: '',
    isAvailable: true,
    isPopular: false,
    preparationTime: 0,
    ingredients: [] as string[],
    allergens: [] as string[],
    nutritionalInfo: {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0
    },
    tags: [] as string[]
  })

  const categories = ['all', 'غذاهای اصلی', 'پیش‌غذاها', 'نوشیدنی‌ها', 'دسرها']
  const availableIngredients = [
    'گوشت گوساله', 'سینه مرغ', 'کاهو', 'پنیر پارمزان', 'نوشابه', 'دوغ', 
    'بادمجان', 'سیر', 'گوجه', 'تخم مرغ', 'برنج', 'پیاز', 'زعفران', 
    'نمک', 'فلفل', 'ماست', 'سس سزار', 'نان تست', 'نعنا', 'شیر', 'خامه', 'گلاب'
  ]
  const availableAllergens = ['گلوتن', 'لبنیات', 'تخم مرغ', 'آجیل', 'سویا', 'ماهی']
  const availableTags = [
    'سنتی', 'پرفروش', 'گوشت', 'مرغ', 'سالاد', 'سالم', 'پیش‌غذا', 
    'نوشیدنی', 'سرد', 'گازدار', 'محلی', 'گیاهی', 'گران', 'دسر'
  ]

  const filteredMenuItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory
    const matchesAvailability = filterAvailability === 'all' || 
                               (filterAvailability === 'available' && item.isAvailable) ||
                               (filterAvailability === 'unavailable' && !item.isAvailable)
    const matchesPopular = filterPopular === 'all' || 
                          (filterPopular === 'popular' && item.isPopular) ||
                          (filterPopular === 'not-popular' && !item.isPopular)
    return matchesSearch && matchesCategory && matchesAvailability && matchesPopular
  }).sort((a, b) => {
    switch (sortBy) {
      case 'name': return a.name.localeCompare(b.name)
      case 'price': return a.price - b.price
      case 'preparationTime': return a.preparationTime - b.preparationTime
      case 'salesCount': return b.salesCount - a.salesCount
      case 'rating': return b.rating - a.rating
      case 'createdAt': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      default: return 0
    }
  })

  const handleSave = () => {
    if (editingItem) {
      const updatedItem = {
        ...formData,
        id: editingItem.id,
        salesCount: editingItem.salesCount,
        rating: editingItem.rating,
        createdAt: editingItem.createdAt,
        updatedAt: new Date().toLocaleDateString('fa-IR')
      }
      setMenuItems(menuItems.map(item => item.id === editingItem.id ? updatedItem : item))
    } else {
      const newItem: MenuItem = {
        ...formData,
        id: Date.now().toString(),
        salesCount: 0,
        rating: 0,
        createdAt: new Date().toLocaleDateString('fa-IR'),
        updatedAt: new Date().toLocaleDateString('fa-IR')
      }
      setMenuItems([...menuItems, newItem])
    }
    setShowForm(false)
    setEditingItem(null)
    setFormData({
      name: '',
      description: '',
      price: 0,
      category: '',
      image: '',
      isAvailable: true,
      isPopular: false,
      preparationTime: 0,
      ingredients: [],
      allergens: [],
      nutritionalInfo: {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0
      },
      tags: []
    })
  }

  const deleteItem = (id: string) => {
    setMenuItems(menuItems.filter(item => item.id !== id))
  }

  const toggleIngredient = (ingredient: string) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.includes(ingredient)
        ? prev.ingredients.filter(i => i !== ingredient)
        : [...prev.ingredients, ingredient]
    }))
  }

  const toggleAllergen = (allergen: string) => {
    setFormData(prev => ({
      ...prev,
      allergens: prev.allergens.includes(allergen)
        ? prev.allergens.filter(a => a !== allergen)
        : [...prev.allergens, allergen]
    }))
  }

  const toggleTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }))
  }

  const getTotalItems = () => menuItems.length
  const getAvailableItems = () => menuItems.filter(item => item.isAvailable).length
  const getPopularItems = () => menuItems.filter(item => item.isPopular).length
  const getAveragePrice = () => menuItems.length > 0 ? menuItems.reduce((sum, item) => sum + item.price, 0) / menuItems.length : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/80 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold gradient-text mb-2">تمام آیتم‌های منو</h1>
          <p className="text-gray-600 dark:text-gray-300">مدیریت کامل منوی رستوران</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="premium-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">کل آیتم‌ها</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{getTotalItems()}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <Utensils className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
          <div className="premium-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">موجود</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{getAvailableItems()}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
          <div className="premium-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">پرفروش</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{getPopularItems()}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <Star className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
          <div className="premium-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">میانگین قیمت</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {Math.round(getAveragePrice()).toLocaleString('fa-IR')} تومان
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
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
                  placeholder="جستجو در منو..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'همه دسته‌ها' : category}
                  </option>
                ))}
              </select>
              <select
                value={filterAvailability}
                onChange={(e) => setFilterAvailability(e.target.value)}
                className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="all">همه وضعیت‌ها</option>
                <option value="available">موجود</option>
                <option value="unavailable">ناموجود</option>
              </select>
              <select
                value={filterPopular}
                onChange={(e) => setFilterPopular(e.target.value)}
                className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="all">همه آیتم‌ها</option>
                <option value="popular">پرفروش</option>
                <option value="not-popular">عادی</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="name">نام</option>
                <option value="price">قیمت</option>
                <option value="preparationTime">زمان آماده‌سازی</option>
                <option value="salesCount">تعداد فروش</option>
                <option value="rating">امتیاز</option>
                <option value="createdAt">تاریخ ایجاد</option>
              </select>
              <div className="flex items-center space-x-2 space-x-reverse">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'grid' 
                      ? 'bg-primary-600 text-white' 
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <div className="w-4 h-4 grid grid-cols-2 gap-0.5">
                    <div className="bg-current rounded-sm"></div>
                    <div className="bg-current rounded-sm"></div>
                    <div className="bg-current rounded-sm"></div>
                    <div className="bg-current rounded-sm"></div>
                  </div>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'list' 
                      ? 'bg-primary-600 text-white' 
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <div className="w-4 h-4 flex flex-col space-y-0.5">
                    <div className="h-0.5 bg-current rounded"></div>
                    <div className="h-0.5 bg-current rounded"></div>
                    <div className="h-0.5 bg-current rounded"></div>
                  </div>
                </button>
              </div>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>آیتم جدید</span>
            </button>
          </div>
        </div>

        {/* Menu Items Display */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMenuItems.map(item => (
              <div key={item.id} className="premium-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <Image className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{item.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{item.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    {item.isPopular && (
                      <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs font-medium">
                        پرفروش
                      </span>
                    )}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      item.isAvailable 
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                    }`}>
                      {item.isAvailable ? 'موجود' : 'ناموجود'}
                    </span>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">{item.description}</p>
                
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">قیمت:</span>
                    <span className="font-bold text-gray-900 dark:text-white">
                      {item.price.toLocaleString('fa-IR')} تومان
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">زمان آماده‌سازی:</span>
                    <span className="text-gray-900 dark:text-white">{item.preparationTime} دقیقه</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">تعداد فروش:</span>
                    <span className="text-gray-900 dark:text-white">{item.salesCount}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">امتیاز:</span>
                    <div className="flex items-center space-x-1 space-x-reverse">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span className="text-gray-900 dark:text-white">{item.rating.toFixed(1)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {item.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs">
                      {tag}
                    </span>
                  ))}
                  {item.tags.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs">
                      +{item.tags.length - 3}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <button
                      onClick={() => {
                        setEditingItem(item)
                        setFormData({
                          name: item.name,
                          description: item.description,
                          price: item.price,
                          category: item.category,
                          image: item.image,
                          isAvailable: item.isAvailable,
                          isPopular: item.isPopular,
                          preparationTime: item.preparationTime,
                          ingredients: item.ingredients,
                          allergens: item.allergens,
                          nutritionalInfo: item.nutritionalInfo,
                          tags: item.tags
                        })
                        setShowForm(true)
                      }}
                      className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    onClick={() => setMenuItems(menuItems.map(i => 
                      i.id === item.id ? { ...i, isAvailable: !i.isAvailable } : i
                    ))}
                    className={`p-2 rounded-lg transition-colors ${
                      item.isAvailable
                        ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30'
                        : 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30'
                    }`}
                  >
                    {item.isAvailable ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="premium-card p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-600/30">
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">آیتم</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">دسته</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">قیمت</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">زمان</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">فروش</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">امتیاز</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">وضعیت</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMenuItems.map(item => (
                    <tr key={item.id} className="border-b border-gray-100 dark:border-gray-700/30">
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-3 space-x-reverse">
                          <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
                            {item.image ? (
                              <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                              <Image className="w-6 h-6 text-gray-400" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{item.name}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">{item.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-sm">
                          {item.category}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-gray-900 dark:text-white">
                          {item.price.toLocaleString('fa-IR')} تومان
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-gray-900 dark:text-white">{item.preparationTime} دقیقه</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-gray-900 dark:text-white">{item.salesCount}</span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-1 space-x-reverse">
                          <Star className="w-4 h-4 text-yellow-500" />
                          <span className="text-gray-900 dark:text-white">{item.rating.toFixed(1)}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            item.isAvailable 
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                              : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                          }`}>
                            {item.isAvailable ? 'موجود' : 'ناموجود'}
                          </span>
                          {item.isPopular && (
                            <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs font-medium">
                              پرفروش
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <button
                            onClick={() => {
                              setEditingItem(item)
                              setFormData({
                                name: item.name,
                                description: item.description,
                                price: item.price,
                                category: item.category,
                                image: item.image,
                                isAvailable: item.isAvailable,
                                isPopular: item.isPopular,
                                preparationTime: item.preparationTime,
                                ingredients: item.ingredients,
                                allergens: item.allergens,
                                nutritionalInfo: item.nutritionalInfo,
                                tags: item.tags
                              })
                              setShowForm(true)
                            }}
                            className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteItem(item.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setMenuItems(menuItems.map(i => 
                              i.id === item.id ? { ...i, isAvailable: !i.isAvailable } : i
                            ))}
                            className={`p-2 rounded-lg transition-colors ${
                              item.isAvailable
                                ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30'
                                : 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30'
                            }`}
                          >
                            {item.isAvailable ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {editingItem ? 'ویرایش آیتم منو' : 'آیتم جدید منو'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    نام آیتم
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
                    دسته‌بندی
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">انتخاب کنید</option>
                    {categories.filter(c => c !== 'all').map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    قیمت (تومان)
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    زمان آماده‌سازی (دقیقه)
                  </label>
                  <input
                    type="number"
                    value={formData.preparationTime}
                    onChange={(e) => setFormData({...formData, preparationTime: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    توضیحات
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    URL تصویر
                  </label>
                  <input
                    type="url"
                    value={formData.image}
                    onChange={(e) => setFormData({...formData, image: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div className="flex items-center space-x-4 space-x-reverse">
                  <label className="flex items-center space-x-2 space-x-reverse">
                    <input
                      type="checkbox"
                      checked={formData.isAvailable}
                      onChange={(e) => setFormData({...formData, isAvailable: e.target.checked})}
                      className="w-4 h-4 text-primary-600"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">موجود</span>
                  </label>
                  <label className="flex items-center space-x-2 space-x-reverse">
                    <input
                      type="checkbox"
                      checked={formData.isPopular}
                      onChange={(e) => setFormData({...formData, isPopular: e.target.checked})}
                      className="w-4 h-4 text-primary-600"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">پرفروش</span>
                  </label>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    مواد اولیه
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {availableIngredients.map(ingredient => (
                      <label key={ingredient} className="flex items-center space-x-2 space-x-reverse">
                        <input
                          type="checkbox"
                          checked={formData.ingredients.includes(ingredient)}
                          onChange={() => toggleIngredient(ingredient)}
                          className="w-4 h-4 text-primary-600"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{ingredient}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    آلرژن‌ها
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {availableAllergens.map(allergen => (
                      <label key={allergen} className="flex items-center space-x-2 space-x-reverse">
                        <input
                          type="checkbox"
                          checked={formData.allergens.includes(allergen)}
                          onChange={() => toggleAllergen(allergen)}
                          className="w-4 h-4 text-primary-600"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{allergen}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    برچسب‌ها
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {availableTags.map(tag => (
                      <label key={tag} className="flex items-center space-x-2 space-x-reverse">
                        <input
                          type="checkbox"
                          checked={formData.tags.includes(tag)}
                          onChange={() => toggleTag(tag)}
                          className="w-4 h-4 text-primary-600"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{tag}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    اطلاعات تغذیه‌ای
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">کالری</label>
                      <input
                        type="number"
                        value={formData.nutritionalInfo.calories}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          nutritionalInfo: { ...prev.nutritionalInfo, calories: Number(e.target.value) }
                        }))}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">پروتئین (گرم)</label>
                      <input
                        type="number"
                        value={formData.nutritionalInfo.protein}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          nutritionalInfo: { ...prev.nutritionalInfo, protein: Number(e.target.value) }
                        }))}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">کربوهیدرات (گرم)</label>
                      <input
                        type="number"
                        value={formData.nutritionalInfo.carbs}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          nutritionalInfo: { ...prev.nutritionalInfo, carbs: Number(e.target.value) }
                        }))}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">چربی (گرم)</label>
                      <input
                        type="number"
                        value={formData.nutritionalInfo.fat}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          nutritionalInfo: { ...prev.nutritionalInfo, fat: Number(e.target.value) }
                        }))}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end space-x-3 space-x-reverse mt-6">
                <button
                  onClick={() => {
                    setShowForm(false)
                    setEditingItem(null)
                    setFormData({
                      name: '',
                      description: '',
                      price: 0,
                      category: '',
                      image: '',
                      isAvailable: true,
                      isPopular: false,
                      preparationTime: 0,
                      ingredients: [],
                      allergens: [],
                      nutritionalInfo: {
                        calories: 0,
                        protein: 0,
                        carbs: 0,
                        fat: 0
                      },
                      tags: []
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