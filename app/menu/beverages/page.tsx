'use client'

import { useState } from 'react'
import { 
  Coffee, 
  Search, 
  Plus, 
  Minus, 
  Edit, 
  Trash2, 
  Star, 
  Clock, 
  DollarSign, 
  Package, 
  Eye, 
  Save, 
  X, 
  CheckCircle,
  Droplets,
  Thermometer
} from 'lucide-react'

interface Beverage {
  id: string
  name: string
  description: string
  price: number
  image: string
  preparationTime: number
  ingredients: string[]
  category: string
  isAvailable: boolean
  rating: number
  popularity: number
  calories: number
  allergens: string[]
  temperature: 'سرد' | 'گرم' | 'داغ'
  size: 'کوچک' | 'متوسط' | 'بزرگ'
}

const initialBeverages: Beverage[] = [
  {
    id: '1',
    name: 'نوشابه',
    description: 'نوشابه گازدار سرد',
    price: 15000,
    image: '/api/placeholder/200/150',
    preparationTime: 2,
    ingredients: ['آب', 'شکر', 'گاز', 'طعم‌دهنده'],
    category: 'نوشیدنی گازدار',
    isAvailable: true,
    rating: 4.2,
    popularity: 85,
    calories: 140,
    allergens: [],
    temperature: 'سرد',
    size: 'متوسط'
  },
  {
    id: '2',
    name: 'دوغ محلی',
    description: 'دوغ محلی تازه و خنک',
    price: 18000,
    image: '/api/placeholder/200/150',
    preparationTime: 3,
    ingredients: ['شیر', 'ماست', 'نمک', 'نعنا'],
    category: 'نوشیدنی سنتی',
    isAvailable: true,
    rating: 4.6,
    popularity: 78,
    calories: 80,
    allergens: ['لبنیات'],
    temperature: 'سرد',
    size: 'متوسط'
  },
  {
    id: '3',
    name: 'چای ایرانی',
    description: 'چای ایرانی با طعم و عطر مخصوص',
    price: 12000,
    image: '/api/placeholder/200/150',
    preparationTime: 5,
    ingredients: ['چای', 'آب', 'شکر'],
    category: 'نوشیدنی گرم',
    isAvailable: true,
    rating: 4.8,
    popularity: 95,
    calories: 5,
    allergens: [],
    temperature: 'داغ',
    size: 'کوچک'
  },
  {
    id: '4',
    name: 'قهوه ترک',
    description: 'قهوه ترک با طعم قوی و غلیظ',
    price: 25000,
    image: '/api/placeholder/200/150',
    preparationTime: 8,
    ingredients: ['قهوه', 'آب', 'شکر'],
    category: 'نوشیدنی گرم',
    isAvailable: true,
    rating: 4.7,
    popularity: 82,
    calories: 15,
    allergens: [],
    temperature: 'داغ',
    size: 'کوچک'
  },
  {
    id: '5',
    name: 'آب میوه طبیعی',
    description: 'آب میوه طبیعی با میوه‌های تازه',
    price: 22000,
    image: '/api/placeholder/200/150',
    preparationTime: 6,
    ingredients: ['میوه تازه', 'آب', 'شکر'],
    category: 'نوشیدنی طبیعی',
    isAvailable: true,
    rating: 4.5,
    popularity: 88,
    calories: 120,
    allergens: [],
    temperature: 'سرد',
    size: 'متوسط'
  },
  {
    id: '6',
    name: 'شیر موز',
    description: 'شیر موز با موز تازه و شیر',
    price: 28000,
    image: '/api/placeholder/200/150',
    preparationTime: 7,
    ingredients: ['شیر', 'موز', 'عسل', 'یخ'],
    category: 'نوشیدنی طبیعی',
    isAvailable: false,
    rating: 4.4,
    popularity: 75,
    calories: 180,
    allergens: ['لبنیات'],
    temperature: 'سرد',
    size: 'بزرگ'
  },
  {
    id: '7',
    name: 'کاپوچینو',
    description: 'کاپوچینو با فوم شیر و قهوه',
    price: 35000,
    image: '/api/placeholder/200/150',
    preparationTime: 10,
    ingredients: ['قهوه', 'شیر', 'فوم شیر', 'شکر'],
    category: 'نوشیدنی گرم',
    isAvailable: true,
    rating: 4.6,
    popularity: 80,
    calories: 120,
    allergens: ['لبنیات'],
    temperature: 'گرم',
    size: 'متوسط'
  },
  {
    id: '8',
    name: 'لیموناد',
    description: 'لیموناد تازه با لیمو و نعنا',
    price: 20000,
    image: '/api/placeholder/200/150',
    preparationTime: 4,
    ingredients: ['لیمو', 'آب', 'شکر', 'نعنا'],
    category: 'نوشیدنی طبیعی',
    isAvailable: true,
    rating: 4.3,
    popularity: 72,
    calories: 90,
    allergens: [],
    temperature: 'سرد',
    size: 'متوسط'
  }
]

export default function BeveragesPage() {
  const [beverages, setBeverages] = useState<Beverage[]>(initialBeverages)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editingBeverage, setEditingBeverage] = useState<Beverage | null>(null)
  const [showDetails, setShowDetails] = useState<Beverage | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    image: '',
    preparationTime: 0,
    ingredients: '',
    category: '',
    isAvailable: true,
    calories: 0,
    allergens: '',
    temperature: 'سرد' as 'سرد' | 'گرم' | 'داغ',
    size: 'متوسط' as 'کوچک' | 'متوسط' | 'بزرگ'
  })

  const categories = ['all', 'نوشیدنی گازدار', 'نوشیدنی سنتی', 'نوشیدنی گرم', 'نوشیدنی طبیعی']

  const filteredBeverages = beverages.filter(beverage =>
    (selectedCategory === 'all' || beverage.category === selectedCategory) &&
    beverage.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSave = () => {
    if (editingBeverage) {
      const updatedBeverage = {
        ...formData,
        id: editingBeverage.id,
        rating: editingBeverage.rating,
        popularity: editingBeverage.popularity,
        ingredients: formData.ingredients.split(',').map(ing => ing.trim()),
        allergens: formData.allergens.split(',').map(all => all.trim())
      }
      setBeverages(beverages.map(beverage => beverage.id === editingBeverage.id ? updatedBeverage : beverage))
    } else {
      const newBeverage: Beverage = {
        ...formData,
        id: Date.now().toString(),
        rating: 4.5,
        popularity: 70,
        ingredients: formData.ingredients.split(',').map(ing => ing.trim()),
        allergens: formData.allergens.split(',').map(all => all.trim())
      }
      setBeverages([...beverages, newBeverage])
    }
    setShowForm(false)
    setEditingBeverage(null)
    resetForm()
  }

  const openAddForm = () => {
    setEditingBeverage(null)
    resetForm()
    setShowForm(true)
  }

  const openEditForm = (beverage: Beverage) => {
    setEditingBeverage(beverage)
    setFormData({
      name: beverage.name,
      description: beverage.description,
      price: beverage.price,
      image: beverage.image,
      preparationTime: beverage.preparationTime,
      ingredients: beverage.ingredients.join(', '),
      category: beverage.category,
      isAvailable: beverage.isAvailable,
      calories: beverage.calories,
      allergens: beverage.allergens.join(', '),
      temperature: beverage.temperature,
      size: beverage.size
    })
    setShowForm(true)
  }

  const deleteBeverage = (id: string) => {
    if (confirm('آیا از حذف این نوشیدنی مطمئن هستید؟')) {
      setBeverages(beverages.filter(beverage => beverage.id !== id))
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: 0,
      image: '',
      preparationTime: 0,
      ingredients: '',
      category: '',
      isAvailable: true,
      calories: 0,
      allergens: '',
      temperature: 'سرد',
      size: 'متوسط'
    })
  }

  const getTotalBeverages = () => beverages.length
  const getAvailableBeverages = () => beverages.filter(beverage => beverage.isAvailable).length
  const getAveragePrice = () => {
    const total = beverages.reduce((sum, beverage) => sum + beverage.price, 0)
    return Math.round(total / beverages.length)
  }
  const getAverageRating = () => {
    const total = beverages.reduce((sum, beverage) => sum + beverage.rating, 0)
    return (total / beverages.length).toFixed(1)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/80 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold gradient-text mb-2">نوشیدنی‌ها</h1>
          <p className="text-gray-600 dark:text-gray-300">مدیریت نوشیدنی‌های رستوران</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="premium-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">کل نوشیدنی‌ها</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{getTotalBeverages()}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <Coffee className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
          <div className="premium-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">موجود</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{getAvailableBeverages()}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
          <div className="premium-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">میانگین قیمت</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{getAveragePrice().toLocaleString('fa-IR')}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>
          <div className="premium-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">میانگین امتیاز</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{getAverageRating()}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <Star className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="premium-card p-6 mb-8">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="جستجو در نوشیدنی‌ها..."
                  className="w-64 pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'همه دسته‌ها' : category}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={openAddForm}
              className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>افزودن نوشیدنی</span>
            </button>
          </div>
        </div>

        {/* Beverages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBeverages.map(beverage => (
            <div key={beverage.id} className="premium-card p-6">
              <div className="relative mb-4">
                <img src={beverage.image} alt={beverage.name} className="w-full h-48 object-cover rounded-lg" />
                <div className="absolute top-2 right-2 flex space-x-1 space-x-reverse">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    beverage.isAvailable 
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                      : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                  }`}>
                    {beverage.isAvailable ? 'موجود' : 'ناموجود'}
                  </span>
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                    {beverage.category}
                  </span>
                </div>
              </div>

              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{beverage.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">{beverage.description}</p>
                
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">{beverage.rating}</span>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">{beverage.preparationTime} دقیقه</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Package className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">{beverage.calories} کالری</span>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Thermometer className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">{beverage.temperature}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Droplets className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">سایز: {beverage.size}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold text-primary-600 dark:text-primary-400">
                    {beverage.price.toLocaleString('fa-IR')} تومان
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <button
                  onClick={() => setShowDetails(beverage)}
                  className="flex items-center space-x-1 space-x-reverse px-3 py-2 text-primary-600 hover:text-primary-700 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  <span>جزئیات</span>
                </button>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <button
                    onClick={() => openEditForm(beverage)}
                    className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteBeverage(beverage.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add/Edit Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {editingBeverage ? 'ویرایش نوشیدنی' : 'افزودن نوشیدنی جدید'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    نام نوشیدنی
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
                    <option value="">انتخاب دسته‌بندی</option>
                    <option value="نوشیدنی گازدار">نوشیدنی گازدار</option>
                    <option value="نوشیدنی سنتی">نوشیدنی سنتی</option>
                    <option value="نوشیدنی گرم">نوشیدنی گرم</option>
                    <option value="نوشیدنی طبیعی">نوشیدنی طبیعی</option>
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    کالری
                  </label>
                  <input
                    type="number"
                    value={formData.calories}
                    onChange={(e) => setFormData({...formData, calories: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    دما
                  </label>
                  <select
                    value={formData.temperature}
                    onChange={(e) => setFormData({...formData, temperature: e.target.value as 'سرد' | 'گرم' | 'داغ'})}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="سرد">سرد</option>
                    <option value="گرم">گرم</option>
                    <option value="داغ">داغ</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    سایز
                  </label>
                  <select
                    value={formData.size}
                    onChange={(e) => setFormData({...formData, size: e.target.value as 'کوچک' | 'متوسط' | 'بزرگ'})}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="کوچک">کوچک</option>
                    <option value="متوسط">متوسط</option>
                    <option value="بزرگ">بزرگ</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    وضعیت
                  </label>
                  <select
                    value={formData.isAvailable ? 'available' : 'unavailable'}
                    onChange={(e) => setFormData({...formData, isAvailable: e.target.value === 'available'})}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="available">موجود</option>
                    <option value="unavailable">ناموجود</option>
                  </select>
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
                    مواد اولیه (جدا شده با کاما)
                  </label>
                  <textarea
                    value={formData.ingredients}
                    onChange={(e) => setFormData({...formData, ingredients: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    آلرژن‌ها (جدا شده با کاما)
                  </label>
                  <textarea
                    value={formData.allergens}
                    onChange={(e) => setFormData({...formData, allergens: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex items-center justify-end space-x-3 space-x-reverse mt-6">
                <button
                  onClick={() => {
                    setShowForm(false)
                    setEditingBeverage(null)
                    resetForm()
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

        {/* Details Modal */}
        {showDetails && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  جزئیات {showDetails.name}
                </h3>
                <button
                  onClick={() => setShowDetails(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <img src={showDetails.image} alt={showDetails.name} className="w-full h-48 object-cover rounded-lg" />
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">قیمت</label>
                    <p className="text-gray-900 dark:text-white">{showDetails.price.toLocaleString('fa-IR')} تومان</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">زمان آماده‌سازی</label>
                    <p className="text-gray-900 dark:text-white">{showDetails.preparationTime} دقیقه</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">امتیاز</label>
                    <p className="text-gray-900 dark:text-white">{showDetails.rating}/5</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">محبوبیت</label>
                    <p className="text-gray-900 dark:text-white">{showDetails.popularity}%</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">کالری</label>
                    <p className="text-gray-900 dark:text-white">{showDetails.calories} کالری</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">دما</label>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      showDetails.temperature === 'سرد' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' :
                      showDetails.temperature === 'گرم' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300' :
                      'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                    }`}>
                      {showDetails.temperature}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">سایز</label>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                      {showDetails.size}
                    </span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">توضیحات</label>
                  <p className="text-gray-900 dark:text-white">{showDetails.description}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">مواد اولیه</label>
                  <div className="flex flex-wrap gap-2">
                    {showDetails.ingredients.map((ingredient, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm">
                        {ingredient}
                      </span>
                    ))}
                  </div>
                </div>
                
                {showDetails.allergens.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">آلرژن‌ها</label>
                    <div className="flex flex-wrap gap-2">
                      {showDetails.allergens.map((allergen, index) => (
                        <span key={index} className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-sm">
                          {allergen}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
