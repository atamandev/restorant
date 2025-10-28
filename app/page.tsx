'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'
import LineChart from '@/components/Charts/LineChart'
import PieChart from '@/components/Charts/PieChart'
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Star,
  ChefHat,
  ShoppingCart,
  Package,
  Clock,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  Activity,
  CreditCard,
  Receipt,
  FileText,
  Printer,
  Eye,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Target,
  Zap,
  Award,
  Bell,
  Settings,
  RefreshCw,
  Download,
  Filter,
  Search,
  Plus,
  TrendingDown,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  Database,
  Shield,
  Globe,
  Smartphone,
  Monitor,
  Wifi,
  Battery,
  Volume2,
  Sun,
  Moon,
  Cloud,
  CloudRain,
  Thermometer,
  Wind,
  MapPin,
  Navigation,
  Timer,
  Stopwatch,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  VolumeX,
  Mic,
  MicOff,
  Camera,
  Video,
  VideoOff,
  Phone,
  PhoneOff,
  Mail,
  MessageCircle,
  Send,
  Heart,
  ThumbsUp,
  ThumbsDown,
  Share2,
  Bookmark,
  Flag,
  AlertCircle,
  Info,
  HelpCircle,
  ExternalLink,
  Maximize,
  Minimize,
  RotateCcw,
  Save,
  Edit,
  Trash2,
  Copy,
  Cut,
  Scissors,
  Paperclip,
  Link,
  Unlink,
  Lock,
  Unlock,
  Key,
  Fingerprint,
  User,
  UserPlus,
  UserMinus,
  UserCheck,
  UserX,
  LogIn,
  LogOut,
  Power,
  PowerOff,
  WifiOff,
  Bluetooth,
  BluetoothOff,
  Signal,
  SignalOff,
  Radio,
  RadioOff,
  Tv,
  TvOff,
  Headphones,
  HeadphonesOff,
  Speaker,
  SpeakerOff,
  Volume1,
  Volume3,
  Mic2,
  MicOff2,
  Camera2,
  CameraOff,
  Video2,
  VideoOff2,
  Phone2,
  PhoneOff2,
  Mail2,
  MessageCircle2,
  Send2,
  Heart2,
  ThumbsUp2,
  ThumbsDown2,
  Share22,
  Bookmark2,
  Flag2,
  AlertCircle2,
  Info2,
  HelpCircle2,
  ExternalLink2,
  Maximize2,
  Minimize2,
  RotateCcw2,
  Save2,
  Edit2,
  Trash22,
  Copy2,
  Cut2,
  Scissors2,
  Paperclip2,
  Link2,
  Unlink2,
  Lock2,
  Unlock2,
  Key2,
  Fingerprint2,
  Server
} from 'lucide-react'

// Mock data for dashboard
const statsData = [
  {
    title: 'فروش سالانه',
    value: '1,850,000,000',
    currency: 'تومان',
    change: '+12.5%',
    changeType: 'positive',
    icon: TrendingUp,
    color: 'from-emerald-500 to-green-600',
    glowColor: 'shadow-glow-green'
  },
  {
    title: 'سود خالص',
    value: '520,000,000',
    currency: 'تومان',
    change: '+8.3%',
    changeType: 'positive',
    icon: DollarSign,
    color: 'from-blue-500 to-indigo-600',
    glowColor: 'shadow-glow'
  },
  {
    title: 'مشتریان فعال',
    value: '2,847',
    currency: 'نفر',
    change: '+15.2%',
    changeType: 'positive',
    icon: Users,
    color: 'from-purple-500 to-violet-600',
    glowColor: 'shadow-glow-purple'
  },
  {
    title: 'امتیاز رضایت',
    value: '4.8',
    currency: '/5',
    change: '+0.3',
    changeType: 'positive',
    icon: Star,
    color: 'from-yellow-500 to-orange-600',
    glowColor: 'shadow-glow'
  }
]

const salesData = [
  { month: 'فروردین', sales: 35000000, profit: 10500000 },
  { month: 'اردیبهشت', sales: 97500000, profit: 29250000 },
  { month: 'خرداد', sales: 160000000, profit: 48000000 },
  { month: 'تیر', sales: 222500000, profit: 66750000 },
  { month: 'مرداد', sales: 285000000, profit: 85500000 },
  { month: 'شهریور', sales: 270000000, profit: 81000000 },
  { month: 'مهر', sales: 255000000, profit: 76500000 },
  { month: 'آبان', sales: 240000000, profit: 72000000 },
  { month: 'آذر', sales: 225000000, profit: 67500000 },
  { month: 'دی', sales: 210000000, profit: 63000000 },
  { month: 'بهمن', sales: 195000000, profit: 58500000 },
  { month: 'اسفند', sales: 180000000, profit: 54000000 }
]

const paymentMethodsData = [
  { name: 'نقدی', value: 45, color: '#22C55E' },
  { name: 'کارت', value: 35, color: '#6366F1' },
  { name: 'بانک', value: 15, color: '#A855F7' },
  { name: 'اعتباری', value: 5, color: '#F97316' }
]

const recentInvoices = [
  { id: 'INV-001', customer: 'احمد محمدی', amount: 125000, status: 'paid', date: '1403/01/15' },
  { id: 'INV-002', customer: 'فاطمه احمدی', amount: 89000, status: 'pending', date: '1403/01/15' },
  { id: 'INV-003', customer: 'علی رضایی', amount: 156000, status: 'paid', date: '1403/01/14' },
  { id: 'INV-004', customer: 'مریم حسینی', amount: 45000, status: 'overdue', date: '1403/01/13' }
]

const recentCheques = [
  { id: 'CHQ-001', bank: 'ملی', amount: 500000, dueDate: '1403/02/01', status: 'in_hand' },
  { id: 'CHQ-002', bank: 'صادرات', amount: 750000, dueDate: '1403/02/05', status: 'deposited' },
  { id: 'CHQ-003', bank: 'تجارت', amount: 300000, dueDate: '1403/01/28', status: 'cleared' },
  { id: 'CHQ-004', bank: 'ملت', amount: 200000, dueDate: '1403/01/25', status: 'returned' }
]

const systemStatus = [
  { name: 'سرور', status: 'online', value: '99.9%', icon: Server, color: 'text-green-500' },
  { name: 'دیتابیس', status: 'online', value: '99.8%', icon: Database, color: 'text-green-500' },
  { name: 'شبکه', status: 'online', value: '99.7%', icon: Wifi, color: 'text-green-500' },
  { name: 'پشتیبان‌گیری', status: 'online', value: '100%', icon: Shield, color: 'text-green-500' }
]

const notifications = [
  { id: 1, title: 'سفارش جدید', message: 'سفارش شماره #1234 دریافت شد', time: '2 دقیقه پیش', type: 'info', icon: Bell },
  { id: 2, title: 'موجودی کم', message: 'موجودی قهوه کمتر از حد مجاز است', time: '15 دقیقه پیش', type: 'warning', icon: AlertTriangle },
  { id: 3, title: 'پرداخت موفق', message: 'پرداخت 150,000 تومان با موفقیت انجام شد', time: '1 ساعت پیش', type: 'success', icon: CheckCircle },
  { id: 4, title: 'گزارش روزانه', message: 'گزارش فروش روزانه آماده است', time: '2 ساعت پیش', type: 'info', icon: FileText }
]

const topMenuItems = [
  { name: 'کباب کوبیده', sales: 45, revenue: 2250000, trend: 'up' },
  { name: 'قیمه نثار', sales: 38, revenue: 1900000, trend: 'up' },
  { name: 'جوجه کباب', sales: 42, revenue: 2100000, trend: 'down' },
  { name: 'قورمه سبزی', sales: 35, revenue: 1750000, trend: 'up' },
  { name: 'فسنجان', sales: 28, revenue: 1400000, trend: 'stable' }
]

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
    case 'paid': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
    case 'overdue': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
    case 'in_hand': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
    case 'deposited': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
    case 'cleared': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
    case 'returned': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'pending': return 'در انتظار'
    case 'paid': return 'پرداخت شده'
    case 'overdue': return 'سررسید گذشته'
    case 'in_hand': return 'در دست'
    case 'deposited': return 'واریز شده'
    case 'cleared': return 'پاس شده'
    case 'returned': return 'برگشت خورده'
    default: return status
  }
}

const getNotificationColor = (type: string) => {
  switch (type) {
    case 'success': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
    case 'warning': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
    case 'error': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
    case 'info': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
  }
}

export default function Dashboard() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [weather, setWeather] = useState({ temp: 22, condition: 'آفتابی', icon: Sun })

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    // Update time every second
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => {
      clearInterval(timeInterval)
    }
  }, [])

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/80 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">در حال بارگذاری...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div>
      {/* Welcome Section with Time and Weather */}
      <div className="mb-8">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2">داشبورد مدیریت رستوران</h1>
            <p className="text-gray-600 dark:text-gray-300">خوش آمدید! اینجا می‌توانید تمام جنبه‌های رستوران خود را مدیریت کنید.</p>
          </div>
          <div className="flex items-center space-x-4 space-x-reverse">
            {/* Weather Widget */}
            <div className="premium-card p-4 flex items-center space-x-3 space-x-reverse">
              <weather.icon className="w-6 h-6 text-yellow-500" />
              <div>
                <div className="text-sm font-medium text-gray-800 dark:text-gray-200">{weather.temp}°C</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{weather.condition}</div>
              </div>
            </div>
            
            {/* Time Widget */}
            <div className="premium-card p-4 flex items-center space-x-3 space-x-reverse">
              <Clock className="w-6 h-6 text-blue-500" />
              <div>
                <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                  {currentTime.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {currentTime.toLocaleDateString('fa-IR')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards with Neon Effects */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsData.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className={`premium-card p-6 card-hover ${stat.glowColor} floating-card`}>
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.color} pulse-glow`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                  stat.changeType === 'positive' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                }`}>
                  {stat.change}
                </span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {stat.value}
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400 mr-1">
                  {stat.currency}
                </span>
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">{stat.title}</p>
            </div>
          )
        })}
      </div>

      {/* System Status */}
      <div className="premium-card p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">وضعیت سیستم</h2>
          <div className="flex items-center space-x-2 space-x-reverse">
            <Activity className="w-5 h-5 text-green-500" />
            <span className="text-sm text-green-600 dark:text-green-400 font-medium">همه سرویس‌ها فعال</span>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {systemStatus.map((item, index) => {
            const Icon = item.icon
            return (
              <div key={index} className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <Icon className={`w-8 h-8 mx-auto mb-2 ${item.color}`} />
                <div className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">{item.name}</div>
                <div className="text-lg font-bold text-gray-900 dark:text-white">{item.value}</div>
                <div className="text-xs text-green-600 dark:text-green-400">{item.status}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Annual Sales Chart */}
        <div className="lg:col-span-2 premium-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">نمودار فروش و سود سالانه</h2>
            <div className="flex items-center space-x-2 space-x-reverse">
              <BarChart3 className="w-5 h-5 text-primary-600" />
              <span className="text-sm text-gray-500 dark:text-gray-400">آخرین 12 ماه</span>
            </div>
          </div>
          <div className="h-80">
            <LineChart data={salesData} />
          </div>
        </div>

        {/* Payment Methods Pie Chart */}
        <div className="premium-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">روش‌های پرداخت</h2>
            <CreditCard className="w-5 h-5 text-primary-600" />
          </div>
          <div className="h-80">
            <PieChart data={paymentMethodsData} />
          </div>
        </div>
      </div>

      {/* Top Menu Items */}
      <div className="premium-card p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">محبوب‌ترین غذاها</h2>
          <div className="flex items-center space-x-2 space-x-reverse">
            <ChefHat className="w-5 h-5 text-primary-600" />
            <button className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">
              مشاهده همه
            </button>
          </div>
        </div>
        <div className="space-y-4 card-scrollbar smooth-scroll max-h-80 overflow-y-auto">
          {topMenuItems.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600/50 transition-colors">
              <div className="flex items-center space-x-4 space-x-reverse">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-red-500 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">{index + 1}</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{item.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{item.sales} فروش</p>
                </div>
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900 dark:text-white">
                  {item.revenue.toLocaleString()} تومان
                </p>
                <div className="flex items-center space-x-1 space-x-reverse">
                  {item.trend === 'up' && <TrendingUp className="w-4 h-4 text-green-500" />}
                  {item.trend === 'down' && <TrendingDown className="w-4 h-4 text-red-500" />}
                  {item.trend === 'stable' && <Activity className="w-4 h-4 text-gray-500" />}
                  <span className={`text-xs ${
                    item.trend === 'up' ? 'text-green-600' : 
                    item.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {item.trend === 'up' ? 'صعودی' : item.trend === 'down' ? 'نزولی' : 'ثابت'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Invoices and Cheques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Recent Invoices */}
        <div className="premium-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">آخرین فاکتورها</h2>
            <div className="flex items-center space-x-2 space-x-reverse">
              <Receipt className="w-5 h-5 text-primary-600" />
              <button className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">
                مشاهده همه
              </button>
            </div>
          </div>
          <div className="space-y-4 card-scrollbar smooth-scroll max-h-80 overflow-y-auto">
            {recentInvoices.map((invoice) => (
              <div key={invoice.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600/50 transition-colors">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{invoice.id}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{invoice.customer}</p>
                  </div>
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {invoice.amount.toLocaleString()} تومان
                  </p>
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(invoice.status)}`}>
                    {getStatusText(invoice.status)}
                  </span>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <button className="p-1 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button className="p-1 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400">
                    <Printer className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Cheques */}
        <div className="premium-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">آخرین چک‌ها</h2>
            <div className="flex items-center space-x-2 space-x-reverse">
              <CreditCard className="w-5 h-5 text-primary-600" />
              <button className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">
                مشاهده همه
              </button>
            </div>
          </div>
          <div className="space-y-4 card-scrollbar smooth-scroll max-h-80 overflow-y-auto">
            {recentCheques.map((cheque) => (
              <div key={cheque.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600/50 transition-colors">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{cheque.id}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{cheque.bank}</p>
                  </div>
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {cheque.amount.toLocaleString()} تومان
                  </p>
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(cheque.status)}`}>
                    {getStatusText(cheque.status)}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 dark:text-gray-400">سررسید:</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{cheque.dueDate}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="premium-card p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">اعلان‌های اخیر</h2>
          <div className="flex items-center space-x-2 space-x-reverse">
            <Bell className="w-5 h-5 text-primary-600" />
            <button className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">
              مشاهده همه
            </button>
          </div>
        </div>
        <div className="space-y-4 card-scrollbar smooth-scroll max-h-96 overflow-y-auto">
          {notifications.map((notification) => {
            const Icon = notification.icon
            return (
              <div key={notification.id} className="flex items-start space-x-4 space-x-reverse p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600/50 transition-colors">
                <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-primary-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium text-gray-900 dark:text-white">{notification.title}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${getNotificationColor(notification.type)}`}>
                      {notification.type}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{notification.message}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{notification.time}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Advanced Analytics Dashboard */}
      <div className="premium-card p-8 mb-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold gradient-text mb-2">گزارش کلی رستوران</h2>
            <p className="text-gray-600 dark:text-gray-300">تحلیل جامع عملکرد و آمار پیشرفته</p>
          </div>
          <div className="flex items-center space-x-4 space-x-reverse">
            <button className="premium-button bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 flex items-center space-x-2 space-x-reverse">
              <Download className="w-5 h-5" />
              <span>دانلود گزارش</span>
            </button>
            <button className="premium-button bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 flex items-center space-x-2 space-x-reverse">
              <Printer className="w-5 h-5" />
              <span>چاپ گزارش</span>
            </button>
          </div>
        </div>

        {/* Key Performance Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-emerald-500/10 to-green-600/10 dark:from-emerald-500/20 dark:to-green-600/20 p-6 rounded-2xl border border-emerald-200/30 dark:border-emerald-700/30">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-emerald-500/20 rounded-xl">
                <TrendingUp className="w-6 h-6 text-emerald-600" />
              </div>
              <span className="text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 px-2 py-1 rounded-full">
                +23.5%
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">2,847</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">مشتریان فعال ماهانه</p>
            <div className="mt-3 flex items-center space-x-2 space-x-reverse">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-gradient-to-r from-emerald-500 to-green-500 h-2 rounded-full" style={{width: '85%'}}></div>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">85%</span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500/10 to-indigo-600/10 dark:from-blue-500/20 dark:to-indigo-600/20 p-6 rounded-2xl border border-blue-200/30 dark:border-blue-700/30">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-500/20 rounded-xl">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-1 rounded-full">
                +18.2%
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">1.85B</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">درآمد سالانه (تومان)</p>
            <div className="mt-3 flex items-center space-x-2 space-x-reverse">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full" style={{width: '92%'}}></div>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">92%</span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500/10 to-violet-600/10 dark:from-purple-500/20 dark:to-violet-600/20 p-6 rounded-2xl border border-purple-200/30 dark:border-purple-700/30">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-500/20 rounded-xl">
                <Star className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-xs bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 px-2 py-1 rounded-full">
                +5.1%
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">4.8</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">امتیاز رضایت مشتریان</p>
            <div className="mt-3 flex items-center space-x-2 space-x-reverse">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-gradient-to-r from-purple-500 to-violet-500 h-2 rounded-full" style={{width: '96%'}}></div>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">96%</span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-500/10 to-red-600/10 dark:from-orange-500/20 dark:to-red-600/20 p-6 rounded-2xl border border-orange-200/30 dark:border-orange-700/30">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-500/20 rounded-xl">
                <ChefHat className="w-6 h-6 text-orange-600" />
              </div>
              <span className="text-xs bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 px-2 py-1 rounded-full">
                +12.8%
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">1,247</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">سفارشات روزانه</p>
            <div className="mt-3 flex items-center space-x-2 space-x-reverse">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full" style={{width: '78%'}}></div>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">78%</span>
            </div>
          </div>
        </div>

        {/* Advanced Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Revenue Trend Chart */}
          <div className="bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-800/50 dark:to-blue-900/20 p-6 rounded-2xl border border-slate-200/30 dark:border-slate-700/30">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">روند درآمد ماهانه</h3>
              <div className="flex items-center space-x-2 space-x-reverse">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-600 dark:text-gray-300">درآمد</span>
              </div>
            </div>
            <div className="h-64 flex items-end justify-between space-x-2 space-x-reverse">
              {[65, 78, 85, 92, 88, 95, 98, 89, 94, 97, 91, 96].map((height, index) => (
                <div key={index} className="flex flex-col items-center space-y-2">
                  <div 
                    className="w-8 bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg transition-all duration-500 hover:from-blue-600 hover:to-blue-500"
                    style={{height: `${height}%`}}
                  ></div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {['فر', 'ارد', 'خر', 'تیر', 'مر', 'شه', 'مه', 'آب', 'آذ', 'دی', 'به', 'اس'][index]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Customer Satisfaction Chart */}
          <div className="bg-gradient-to-br from-slate-50 to-purple-50/30 dark:from-slate-800/50 dark:to-purple-900/20 p-6 rounded-2xl border border-slate-200/30 dark:border-slate-700/30">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">رضایت مشتریان</h3>
              <div className="flex items-center space-x-2 space-x-reverse">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span className="text-sm text-gray-600 dark:text-gray-300">امتیاز</span>
              </div>
            </div>
            <div className="h-64 flex items-end justify-between space-x-2 space-x-reverse">
              {[4.2, 4.5, 4.7, 4.8, 4.6, 4.9, 4.8, 4.7, 4.9, 4.8, 4.7, 4.8].map((height, index) => (
                <div key={index} className="flex flex-col items-center space-y-2">
                  <div 
                    className="w-8 bg-gradient-to-t from-purple-500 to-purple-400 rounded-t-lg transition-all duration-500 hover:from-purple-600 hover:to-purple-500"
                    style={{height: `${height * 20}%`}}
                  ></div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {['فر', 'ارد', 'خر', 'تیر', 'مر', 'شه', 'مه', 'آب', 'آذ', 'دی', 'به', 'اس'][index]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-green-500/10 to-emerald-600/10 dark:from-green-500/20 dark:to-emerald-600/20 p-6 rounded-2xl border border-green-200/30 dark:border-green-700/30">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-gray-900 dark:text-white">کارایی آشپزخانه</h4>
              <Clock className="w-5 h-5 text-green-600" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-300">میانگین زمان آماده‌سازی</span>
                <span className="font-semibold text-gray-900 dark:text-white">18 دقیقه</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-300">سفارشات در انتظار</span>
                <span className="font-semibold text-gray-900 dark:text-white">12</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-300">نرخ تکمیل</span>
                <span className="font-semibold text-green-600">98.5%</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500/10 to-cyan-600/10 dark:from-blue-500/20 dark:to-cyan-600/20 p-6 rounded-2xl border border-blue-200/30 dark:border-blue-700/30">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-gray-900 dark:text-white">مدیریت موجودی</h4>
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-300">موجودی کل</span>
                <span className="font-semibold text-gray-900 dark:text-white">2,847 آیتم</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-300">موجودی کم</span>
                <span className="font-semibold text-orange-600">23</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-300">نرخ چرخش</span>
                <span className="font-semibold text-blue-600">4.2x</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500/10 to-violet-600/10 dark:from-purple-500/20 dark:to-violet-600/20 p-6 rounded-2xl border border-purple-200/30 dark:border-purple-700/30">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-gray-900 dark:text-white">عملکرد مالی</h4>
              <BarChart3 className="w-5 h-5 text-purple-600" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-300">حاشیه سود</span>
                <span className="font-semibold text-green-600">28.1%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-300">ROI</span>
                <span className="font-semibold text-purple-600">15.7%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-300">نقدینگی</span>
                <span className="font-semibold text-blue-600">عالی</span>
              </div>
            </div>
          </div>
        </div>

        {/* Real-time Activity Feed */}
        <div className="bg-gradient-to-br from-slate-50 to-gray-50/30 dark:from-slate-800/50 dark:to-gray-900/20 p-6 rounded-2xl border border-slate-200/30 dark:border-slate-700/30">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">فعالیت‌های زنده</h3>
            <div className="flex items-center space-x-2 space-x-reverse">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-600 dark:text-green-400">آنلاین</span>
            </div>
          </div>
          <div className="space-y-4 card-scrollbar smooth-scroll max-h-80 overflow-y-auto">
            {[
              { time: '14:32', action: 'سفارش جدید #1234', user: 'احمد محمدی', amount: '125,000 تومان', status: 'success' },
              { time: '14:28', action: 'پرداخت موفق', user: 'فاطمه احمدی', amount: '89,000 تومان', status: 'success' },
              { time: '14:25', action: 'موجودی کم', user: 'سیستم', amount: 'قهوه عربیکا', status: 'warning' },
              { time: '14:22', action: 'سفارش تکمیل شد', user: 'علی رضایی', amount: '156,000 تومان', status: 'info' },
              { time: '14:18', action: 'مشتری جدید', user: 'مریم حسینی', amount: 'ثبت شد', status: 'info' }
            ].map((activity, index) => (
              <div key={index} className="flex items-center space-x-4 space-x-reverse p-3 bg-white/50 dark:bg-gray-800/30 rounded-xl hover:bg-white/70 dark:hover:bg-gray-700/50 transition-colors">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{activity.action}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{activity.time}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-600 dark:text-gray-300">{activity.user}</span>
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-200">{activity.amount}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="premium-card p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">عملیات سریع</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="premium-button flex flex-col items-center p-4 space-y-2">
            <ShoppingCart className="w-8 h-8" />
            <span>فاکتور جدید</span>
          </button>
          <button className="premium-button bg-green-500 hover:bg-green-600 flex flex-col items-center p-4 space-y-2">
            <Package className="w-8 h-8" />
            <span>سفارش جدید</span>
          </button>
          <button className="premium-button bg-purple-500 hover:bg-purple-600 flex flex-col items-center p-4 space-y-2">
            <Users className="w-8 h-8" />
            <span>مشتری جدید</span>
          </button>
          <button className="premium-button bg-orange-500 hover:bg-orange-600 flex flex-col items-center p-4 space-y-2">
            <BarChart3 className="w-8 h-8" />
            <span>گزارشات</span>
          </button>
        </div>
      </div>
    </div>
  )
}