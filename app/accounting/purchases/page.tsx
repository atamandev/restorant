'use client'

import { useState } from 'react'
import { 
  ShoppingCart, 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Save, 
  X, 
  CheckCircle, 
  AlertCircle,
  CreditCard,
  Banknote,
  Receipt,
  TrendingUp,
  TrendingDown,
  Calendar,
  User,
  Building,
  FileText,
  Download,
  Printer,
  Clock,
  Package,
  DollarSign,
  Truck,
  Store
} from 'lucide-react'

interface Purchase {
  id: string
  purchaseNumber: string
  vendorId: string
  vendorName: string
  vendorPhone: string
  vendorAddress: string
  items: Array<{
    id: string
    name: string
    quantity: number
    unitPrice: number
    totalPrice: number
    category: string
  }>
  subtotal: number
  tax: number
  discount: number
  total: number
  paymentMethod: 'cash' | 'card' | 'bank_transfer' | 'credit' | 'check'
  paymentStatus: 'pending' | 'partial' | 'paid'
  status: 'draft' | 'confirmed' | 'received' | 'cancelled'
  orderDate: string
  expectedDeliveryDate: string
  actualDeliveryDate?: string
  branchId: string
  branchName: string
  notes: string
  createdBy: string
  createdAt: string
  receivedBy?: string
  receivedAt?: string
}

const mockPurchases: Purchase[] = [
  {
    id: '1',
    purchaseNumber: 'PUR-2024-001',
    vendorId: 'VEND-001',
    vendorName: 'تامین‌کننده مواد غذایی',
    vendorPhone: '021-12345678',
    vendorAddress: 'تهران، خیابان آزادی، پلاک 123',
    items: [
      { id: '1', name: 'گوشت گوساله', quantity: 50, unitPrice: 120000, totalPrice: 6000000, category: 'مواد اولیه' },
      { id: '2', name: 'مرغ', quantity: 30, unitPrice: 80000, totalPrice: 2400000, category: 'مواد اولیه' },
      { id: '3', name: 'سبزیجات', quantity: 20, unitPrice: 15000, totalPrice: 300000, category: 'سبزیجات' }
    ],
    subtotal: 8700000,
    tax: 783000,
    discount: 200000,
    total: 9283000,
    paymentMethod: 'bank_transfer',
    paymentStatus: 'paid',
    status: 'received',
    orderDate: '1402/10/18',
    expectedDeliveryDate: '1402/10/20',
    actualDeliveryDate: '1402/10/19',
    branchId: 'BR-001',
    branchName: 'شعبه مرکزی',
    notes: 'مواد اولیه هفتگی',
    createdBy: 'کاربر سیستم',
    createdAt: '1402/10/18 10:00',
    receivedBy: 'کاربر سیستم',
    receivedAt: '1402/10/19 14:30'
  },
  {
    id: '2',
    purchaseNumber: 'PUR-2024-002',
    vendorId: 'VEND-002',
    vendorName: 'تامین‌کننده نوشیدنی',
    vendorPhone: '021-87654321',
    vendorAddress: 'تهران، خیابان ولیعصر، پلاک 456',
    items: [
      { id: '4', name: 'نوشابه', quantity: 100, unitPrice: 8000, totalPrice: 800000, category: 'نوشیدنی' },
      { id: '5', name: 'دوغ', quantity: 50, unitPrice: 12000, totalPrice: 600000, category: 'نوشیدنی' }
    ],
    subtotal: 1400000,
    tax: 126000,
    discount: 50000,
    total: 1476000,
    paymentMethod: 'check',
    paymentStatus: 'pending',
    status: 'confirmed',
    orderDate: '1402/10/19',
    expectedDeliveryDate: '1402/10/21',
    branchId: 'BR-001',
    branchName: 'شعبه مرکزی',
    notes: 'نوشیدنی ماهانه',
    createdBy: 'کاربر سیستم',
    createdAt: '1402/10/19 09:30'
  },
  {
    id: '3',
    purchaseNumber: 'PUR-2024-003',
    vendorId: 'VEND-003',
    vendorName: 'تامین‌کننده ظروف',
    vendorPhone: '021-11223344',
    vendorAddress: 'تهران، خیابان کریمخان، پلاک 789',
    items: [
      { id: '6', name: 'بشقاب', quantity: 200, unitPrice: 5000, totalPrice: 1000000, category: 'ظروف' },
      { id: '7', name: 'لیوان', quantity: 150, unitPrice: 3000, totalPrice: 450000, category: 'ظروف' }
    ],
    subtotal: 1450000,
    tax: 130500,
    discount: 0,
    total: 1580500,
    paymentMethod: 'cash',
    paymentStatus: 'partial',
    status: 'draft',
    orderDate: '1402/10/20',
    expectedDeliveryDate: '1402/10/22',
    branchId: 'BR-001',
    branchName: 'شعبه مرکزی',
    notes: 'ظروف جدید',
    createdBy: 'کاربر سیستم',
    createdAt: '1402/10/20 11:15'
  }
]

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>(mockPurchases)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPaymentStatus, setFilterPaymentStatus] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null)
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null)

  const [formData, setFormData] = useState({
    vendorName: '',
    vendorPhone: '',
    vendorAddress: '',
    items: [] as Array<{name: string, quantity: number, unitPrice: number, category: string}>,
    paymentMethod: 'cash' as 'cash' | 'card' | 'bank_transfer' | 'credit' | 'check',
    orderDate: new Date().toISOString().split('T')[0],
    expectedDeliveryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: ''
  })

  const filteredPurchases = purchases.filter(purchase =>
    (filterStatus === 'all' || purchase.status === filterStatus) &&
    (filterPaymentStatus === 'all' || purchase.paymentStatus === filterPaymentStatus) &&
    (purchase.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      purchase.purchaseNumber.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const handleSave = () => {
    if (editingPurchase) {
      // Update existing purchase
      const updatedPurchase = {
        ...editingPurchase,
        vendorName: formData.vendorName,
        vendorPhone: formData.vendorPhone,
        vendorAddress: formData.vendorAddress,
        paymentMethod: formData.paymentMethod,
        orderDate: formData.orderDate,
        expectedDeliveryDate: formData.expectedDeliveryDate,
        notes: formData.notes
      }
      setPurchases(purchases.map(purchase => 
        purchase.id === editingPurchase.id ? updatedPurchase : purchase
      ))
    } else {
      // Create new purchase
      const newPurchase: Purchase = {
        id: Date.now().toString(),
        purchaseNumber: `PUR-2024-${String(purchases.length + 1).padStart(3, '0')}`,
        vendorId: `VEND-${Date.now()}`,
        vendorName: formData.vendorName,
        vendorPhone: formData.vendorPhone,
        vendorAddress: formData.vendorAddress,
        items: formData.items.map((item, index) => ({
          id: String(index + 1),
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.quantity * item.unitPrice,
          category: item.category
        })),
        subtotal: formData.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0),
        tax: 0,
        discount: 0,
        total: formData.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0),
        paymentMethod: formData.paymentMethod,
        paymentStatus: 'pending',
        status: 'draft',
        orderDate: formData.orderDate,
        expectedDeliveryDate: formData.expectedDeliveryDate,
        branchId: 'BR-001',
        branchName: 'شعبه مرکزی',
        notes: formData.notes,
        createdBy: 'کاربر سیستم',
        createdAt: new Date().toLocaleString('fa-IR')
      }
      setPurchases([newPurchase, ...purchases])
    }
    setShowForm(false)
    setEditingPurchase(null)
    resetForm()
  }

  const openAddForm = () => {
    setEditingPurchase(null)
    resetForm()
    setShowForm(true)
  }

  const openEditForm = (purchase: Purchase) => {
    setEditingPurchase(purchase)
    setFormData({
      vendorName: purchase.vendorName,
      vendorPhone: purchase.vendorPhone,
      vendorAddress: purchase.vendorAddress,
      items: purchase.items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        category: item.category
      })),
      paymentMethod: purchase.paymentMethod,
      orderDate: purchase.orderDate,
      expectedDeliveryDate: purchase.expectedDeliveryDate,
      notes: purchase.notes
    })
    setShowForm(true)
  }

  const deletePurchase = (id: string) => {
    if (confirm('آیا از حذف این خرید مطمئن هستید؟')) {
      setPurchases(purchases.filter(purchase => purchase.id !== id))
    }
  }

  const resetForm = () => {
    setFormData({
      vendorName: '',
      vendorPhone: '',
      vendorAddress: '',
      items: [],
      paymentMethod: 'cash',
      orderDate: new Date().toISOString().split('T')[0],
      expectedDeliveryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: ''
    })
  }

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'cash': return <Banknote className="w-4 h-4 text-green-600" />
      case 'card': return <CreditCard className="w-4 h-4 text-blue-600" />
      case 'bank_transfer': return <Building className="w-4 h-4 text-purple-600" />
      case 'credit': return <DollarSign className="w-4 h-4 text-orange-600" />
      case 'check': return <FileText className="w-4 h-4 text-yellow-600" />
      default: return null
    }
  }

  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case 'cash': return 'نقد'
      case 'card': return 'کارت'
      case 'bank_transfer': return 'حواله بانکی'
      case 'credit': return 'نسیه'
      case 'check': return 'چک'
      default: return 'نامشخص'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'received': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
      case 'confirmed': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
      case 'draft': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
      case 'cancelled': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'received': return 'دریافت شده'
      case 'confirmed': return 'تایید شده'
      case 'draft': return 'پیش‌نویس'
      case 'cancelled': return 'لغو شده'
      default: return 'نامشخص'
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
      case 'partial': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
      case 'pending': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
    }
  }

  const getPaymentStatusText = (status: string) => {
    switch (status) {
      case 'paid': return 'پرداخت شده'
      case 'partial': return 'پرداخت جزئی'
      case 'pending': return 'در انتظار پرداخت'
      default: return 'نامشخص'
    }
  }

  const getTotalPurchases = () => purchases.length
  const getTotalValue = () => purchases.reduce((sum, purchase) => sum + purchase.total, 0)
  const getPendingPayments = () => purchases.filter(p => p.paymentStatus === 'pending').reduce((sum, p) => sum + p.total, 0)
  const getAverageOrderValue = () => {
    const total = purchases.reduce((sum, purchase) => sum + purchase.total, 0)
    return Math.round(total / purchases.length)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/80 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold gradient-text mb-2">خریدها</h1>
          <p className="text-gray-600 dark:text-gray-300">مدیریت خریدهای رستوران از تامین‌کنندگان</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="premium-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">کل خریدها</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{getTotalPurchases()}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
          <div className="premium-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">کل ارزش خریدها</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{getTotalValue().toLocaleString('fa-IR')}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
          <div className="premium-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">پرداخت‌های در انتظار</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{getPendingPayments().toLocaleString('fa-IR')}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </div>
          <div className="premium-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">میانگین ارزش سفارش</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{getAverageOrderValue().toLocaleString('fa-IR')}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
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
                  placeholder="جستجو در خریدها..."
                  className="w-64 pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">همه وضعیت‌ها</option>
                <option value="draft">پیش‌نویس</option>
                <option value="confirmed">تایید شده</option>
                <option value="received">دریافت شده</option>
                <option value="cancelled">لغو شده</option>
              </select>
              <select
                value={filterPaymentStatus}
                onChange={(e) => setFilterPaymentStatus(e.target.value)}
                className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">همه پرداخت‌ها</option>
                <option value="pending">در انتظار پرداخت</option>
                <option value="partial">پرداخت جزئی</option>
                <option value="paid">پرداخت شده</option>
              </select>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <button
                onClick={openAddForm}
                className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>خرید جدید</span>
              </button>
              <button className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                <Download className="w-4 h-4" />
                <span>صادر کردن</span>
              </button>
            </div>
          </div>
        </div>

        {/* Purchases List */}
        <div className="premium-card p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">لیست خریدها</h2>
          
          {filteredPurchases.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">هیچ خریدی یافت نشد</h3>
              <p className="text-gray-600 dark:text-gray-400">خریدهای رستوران در اینجا نمایش داده می‌شوند</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead>
                  <tr className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-800/50">
                    <th className="px-4 py-3 rounded-r-lg">شماره خرید</th>
                    <th className="px-4 py-3">تامین‌کننده</th>
                    <th className="px-4 py-3">مبلغ کل</th>
                    <th className="px-4 py-3">روش پرداخت</th>
                    <th className="px-4 py-3">وضعیت</th>
                    <th className="px-4 py-3">پرداخت</th>
                    <th className="px-4 py-3">تاریخ سفارش</th>
                    <th className="px-4 py-3 rounded-l-lg">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredPurchases.map(purchase => (
                    <tr key={purchase.id} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">{purchase.purchaseNumber}</td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-gray-900 dark:text-white font-medium">{purchase.vendorName}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{purchase.vendorPhone}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">
                        {purchase.total.toLocaleString('fa-IR')} تومان
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          {getPaymentMethodIcon(purchase.paymentMethod)}
                          <span className="text-gray-700 dark:text-gray-200">
                            {getPaymentMethodText(purchase.paymentMethod)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(purchase.status)}`}>
                          {getStatusText(purchase.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(purchase.paymentStatus)}`}>
                          {getPaymentStatusText(purchase.paymentStatus)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{purchase.orderDate}</td>
                      <td className="px-4 py-3">
                        <div className="flex space-x-2 space-x-reverse">
                          <button
                            onClick={() => setSelectedPurchase(purchase)}
                            className="p-2 rounded-full text-primary-600 hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditForm(purchase)}
                            className="p-2 rounded-full text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deletePurchase(purchase.id)}
                            className="p-2 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Purchase Details Modal */}
        {selectedPurchase && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  جزئیات خرید {selectedPurchase.purchaseNumber}
                </h3>
                <button
                  onClick={() => setSelectedPurchase(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Vendor Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">تامین‌کننده</label>
                    <p className="text-gray-900 dark:text-white">{selectedPurchase.vendorName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">تلفن</label>
                    <p className="text-gray-900 dark:text-white">{selectedPurchase.vendorPhone}</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">آدرس</label>
                    <p className="text-gray-900 dark:text-white">{selectedPurchase.vendorAddress}</p>
                  </div>
                </div>

                {/* Items */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">آیتم‌های خرید</label>
                  <div className="overflow-x-auto">
                    <table className="w-full text-right">
                      <thead>
                        <tr className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-800/50">
                          <th className="px-3 py-2 rounded-r-lg">نام آیتم</th>
                          <th className="px-3 py-2">دسته‌بندی</th>
                          <th className="px-3 py-2">تعداد</th>
                          <th className="px-3 py-2">قیمت واحد</th>
                          <th className="px-3 py-2 rounded-l-lg">قیمت کل</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {selectedPurchase.items.map(item => (
                          <tr key={item.id} className="bg-white dark:bg-gray-800">
                            <td className="px-3 py-2 text-gray-900 dark:text-white">{item.name}</td>
                            <td className="px-3 py-2 text-gray-700 dark:text-gray-200">{item.category}</td>
                            <td className="px-3 py-2 text-gray-700 dark:text-gray-200">{item.quantity}</td>
                            <td className="px-3 py-2 text-gray-700 dark:text-gray-200">{item.unitPrice.toLocaleString('fa-IR')} تومان</td>
                            <td className="px-3 py-2 text-gray-900 dark:text-white font-medium">{item.totalPrice.toLocaleString('fa-IR')} تومان</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-gray-700 dark:text-gray-300">
                      <span>جمع کل:</span>
                      <span>{selectedPurchase.subtotal.toLocaleString('fa-IR')} تومان</span>
                    </div>
                    <div className="flex justify-between text-gray-700 dark:text-gray-300">
                      <span>مالیات:</span>
                      <span>{selectedPurchase.tax.toLocaleString('fa-IR')} تومان</span>
                    </div>
                    {selectedPurchase.discount > 0 && (
                      <div className="flex justify-between text-gray-700 dark:text-gray-300">
                        <span>تخفیف:</span>
                        <span>-{selectedPurchase.discount.toLocaleString('fa-IR')} تومان</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-white border-t border-gray-200 dark:border-gray-600 pt-2">
                      <span>مبلغ نهایی:</span>
                      <span>{selectedPurchase.total.toLocaleString('fa-IR')} تومان</span>
                    </div>
                  </div>
                </div>

                {/* Status and Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">وضعیت</label>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedPurchase.status)}`}>
                      {getStatusText(selectedPurchase.status)}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">وضعیت پرداخت</label>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(selectedPurchase.paymentStatus)}`}>
                      {getPaymentStatusText(selectedPurchase.paymentStatus)}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">تاریخ سفارش</label>
                    <p className="text-gray-900 dark:text-white">{selectedPurchase.orderDate}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">تاریخ تحویل مورد انتظار</label>
                    <p className="text-gray-900 dark:text-white">{selectedPurchase.expectedDeliveryDate}</p>
                  </div>
                  {selectedPurchase.actualDeliveryDate && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">تاریخ تحویل واقعی</label>
                      <p className="text-gray-900 dark:text-white">{selectedPurchase.actualDeliveryDate}</p>
                    </div>
                  )}
                </div>

                {selectedPurchase.notes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">یادداشت</label>
                    <p className="text-gray-900 dark:text-white p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      {selectedPurchase.notes}
                    </p>
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
