'use client'

import React, { useState } from 'react'
import {
  Printer,
  Plus,
  Edit,
  Trash2,
  Eye,
  Save,
  X,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Settings,
  Wifi,
  WifiOff,
  Cable,
  TestTube,
  FileText,
  ChefHat,
  Utensils,
  Coffee,
  Pizza,
  IceCream,
  Package,
  ShoppingCart,
  Receipt,
  CreditCard,
  Bell,
  Clock,
  MapPin,
  Building,
  Users,
  Search,
  Filter,
  RefreshCw,
  Download,
  Upload,
  Copy,
  RotateCcw,
  RotateCw,
  Power,
  PowerOff,
  Play,
  Pause,
  Square,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Phone,
  PhoneOff,
  Mail,
  Send,
  Inbox,
  Outbox,
  Archive,
  Trash,
  Folder,
  FolderOpen,
  File,
  FileText2,
  Image,
  Music,
  Video2,
  Film,
  Headphones,
  Speaker,
  Radio,
  Tv,
  Laptop,
  Smartphone,
  Tablet,
  Watch,
  Camera,
  Webcam,
  HardDrive,
  Server,
  Database,
  Cloud,
  CloudOff,
  Bluetooth,
  BluetoothOff,
  Usb,
  Plug,
  Battery,
  BatteryLow,
  BatteryMedium,
  BatteryHigh,
  BatteryFull,
  Charging,
  PowerPlug,
  Lightbulb,
  LightbulbOff,
  Sun,
  Moon,
  Star,
  Heart,
  HeartOff,
  ThumbsUp,
  ThumbsDown,
  Smile,
  Frown,
  Meh,
  Laugh,
  Angry,
  Sad,
  Surprised,
  Wink,
  Tongue,
  Kiss,
  Hug,
  Hand,
  Handshake,
  Clap,
  Wave,
  Point,
  Fingerprint,
  Scan,
  ScanLine,
  QrCode,
  Barcode,
  Tag,
  Tags,
  Label,
  Bookmark,
  BookmarkCheck,
  Flag,
  FlagOff,
  Pin,
  PinOff,
  Map,
  MapPin2,
  Navigation,
  Compass,
  Globe,
  Earth,
  Mountain,
  Tree,
  Flower,
  Leaf,
  Bug,
  Bird,
  Fish,
  Cat,
  Dog,
  Rabbit,
  Mouse,
  Squirrel,
  Bear,
  Lion,
  Tiger,
  Elephant,
  Whale,
  Dolphin,
  Shark,
  Octopus,
  Crab,
  Lobster,
  Shrimp,
  Fish2,
  Turtle,
  Snake,
  Lizard,
  Frog,
  Butterfly,
  Bee,
  Ant,
  Spider,
  Ladybug,
  Dragonfly,
  Firefly,
  Snail,
  Worm,
  Carrot,
  Apple,
  Banana,
  Orange,
  Lemon,
  Lime,
  Grape,
  Strawberry,
  Cherry,
  Peach,
  Pear,
  Pineapple,
  Watermelon,
  Melon,
  Kiwi,
  Mango,
  Avocado,
  Tomato,
  Potato,
  Onion,
  Garlic,
  Pepper,
  Chili,
  Corn,
  Broccoli,
  Cabbage,
  Lettuce,
  Spinach,
  Kale,
  Carrot2,
  Radish,
  Beet,
  Turnip,
  Parsnip,
  Celery,
  Cucumber,
  Zucchini,
  Eggplant,
  Squash,
  Pumpkin,
  Mushroom,
  Bread,
  Croissant,
  Bagel,
  Pretzel,
  Cookie,
  Cake,
  Pie,
  Donut,
  Muffin,
  Pancake,
  Waffle,
  Toast,
  Sandwich,
  Burger,
  Pizza2,
  Hotdog,
  Taco,
  Burrito,
  Salad,
  Soup,
  Pasta,
  Rice,
  Noodles,
  Spaghetti,
  Macaroni,
  Lasagna,
  Ravioli,
  Dumpling,
  Sushi,
  Ramen,
  Pho,
  Curry,
  StirFry,
  Grill,
  BBQ,
  Roast,
  Stew,
  Casserole,
  Quiche,
  Omelette,
  Scrambled,
  Fried,
  Boiled,
  Steamed,
  Baked,
  Grilled2,
  Sauteed,
  Braised,
  Poached,
  Smoked,
  Cured,
  Pickled,
  Fermented,
  Dried,
  Frozen,
  Fresh,
  Organic,
  Local,
  Seasonal,
  Imported,
  Exported,
  Domestic,
  International,
  Premium,
  Luxury,
  Budget,
  Economy,
  Standard,
  Deluxe,
  Super,
  Mega,
  Ultra,
  Max,
  Pro,
  Plus2,
  Extra,
  Special,
  Limited,
  Exclusive,
  Rare,
  Common,
  Popular,
  Trending,
  New,
  Old,
  Classic,
  Modern,
  Vintage,
  Retro,
  Futuristic,
  Traditional,
  Contemporary,
  Minimalist,
  Maximalist,
  Simple,
  Complex,
  Easy,
  Hard,
  Difficult,
  Challenging,
  Fun,
  Boring,
  Interesting,
  Exciting,
  Amazing,
  Awesome,
  Fantastic,
  Incredible,
  Unbelievable,
  Outstanding,
  Excellent,
  Great,
  Good,
  Okay,
  Fine,
  Bad,
  Terrible,
  Awful,
  Horrible,
  Disgusting,
  Beautiful,
  Ugly,
  Pretty,
  Handsome,
  Cute,
  Adorable,
  Lovely,
  Gorgeous,
  Stunning,
  Magnificent,
  Splendid,
  Glorious,
  Majestic,
  Elegant,
  Graceful,
  Charming,
  Attractive,
  Alluring,
  Seductive,
  Sexy,
  Hot,
  Cool,
  Cold,
  Warm,
  Hot2,
  Cold2,
  Freezing,
  Boiling,
  Melting,
  Solid,
  Liquid,
  Gas,
  Plasma,
  Crystal,
  Diamond,
  Gold,
  Silver,
  Bronze,
  Copper,
  Iron,
  Steel,
  Aluminum,
  Titanium,
  Platinum,
  Palladium,
  Rhodium,
  Osmium,
  Iridium,
  Ruthenium,
  Rhenium,
  Tungsten,
  Molybdenum,
  Tantalum,
  Hafnium,
  Zirconium,
  Niobium,
  Yttrium,
  Strontium,
  Rubidium,
  Krypton,
  Bromine,
  Selenium,
  Arsenic,
  Germanium,
  Gallium,
  Zinc,
  Cadmium,
  Mercury,
  Thallium,
  Lead,
  Bismuth,
  Polonium,
  Astatine,
  Radon,
  Francium,
  Radium,
  Actinium,
  Thorium,
  Protactinium,
  Uranium,
  Neptunium,
  Plutonium,
  Americium,
  Curium,
  Berkelium,
  Californium,
  Einsteinium,
  Fermium,
  Mendelevium,
  Nobelium,
  Lawrencium,
  Rutherfordium,
  Dubnium,
  Seaborgium,
  Bohrium,
  Hassium,
  Meitnerium,
  Darmstadtium,
  Roentgenium,
  Copernicium,
  Nihonium,
  Flerovium,
  Moscovium,
  Livermorium,
  Tennessine,
  Oganesson
} from 'lucide-react'

interface Printer {
  id: string
  name: string
  type: 'kitchen' | 'receipt' | 'label' | 'general'
  connection: 'usb' | 'network' | 'bluetooth'
  ipAddress?: string
  port?: number
  status: 'online' | 'offline' | 'error'
  location: string
  paperSize: '58mm' | '80mm' | 'A4'
  autoCut: boolean
  autoOpen: boolean
  createdAt: string
  lastUsed: string
  printCount: number
  errorCount: number
}

interface PrintRoute {
  id: string
  name: string
  source: string
  target: string
  conditions: string[]
  isActive: boolean
  createdAt: string
}

interface MenuCategory {
  id: string
  name: string
  icon: React.ComponentType<any>
  items: string[]
}

const mockPrinters: Printer[] = [
  {
    id: 'P001',
    name: 'چاپگر آشپزخانه اصلی',
    type: 'kitchen',
    connection: 'network',
    ipAddress: '192.168.1.100',
    port: 9100,
    status: 'online',
    location: 'آشپزخانه اصلی',
    paperSize: '58mm',
    autoCut: true,
    autoOpen: false,
    createdAt: '1403/01/01',
    lastUsed: '1403/09/15 14:30',
    printCount: 1250,
    errorCount: 5
  },
  {
    id: 'P002',
    name: 'چاپگر صندوق',
    type: 'receipt',
    connection: 'usb',
    status: 'online',
    location: 'صندوق اصلی',
    paperSize: '80mm',
    autoCut: true,
    autoOpen: true,
    createdAt: '1403/01/01',
    lastUsed: '1403/09/15 14:25',
    printCount: 2100,
    errorCount: 2
  },
  {
    id: 'P003',
    name: 'چاپگر آشپزخانه فرعی',
    type: 'kitchen',
    connection: 'network',
    ipAddress: '192.168.1.101',
    port: 9100,
    status: 'offline',
    location: 'آشپزخانه فرعی',
    paperSize: '58mm',
    autoCut: true,
    autoOpen: false,
    createdAt: '1403/02/15',
    lastUsed: '1403/09/14 18:45',
    printCount: 850,
    errorCount: 12
  },
  {
    id: 'P004',
    name: 'چاپگر برچسب',
    type: 'label',
    connection: 'usb',
    status: 'online',
    location: 'انبار',
    paperSize: 'A4',
    autoCut: false,
    autoOpen: false,
    createdAt: '1403/03/10',
    lastUsed: '1403/09/15 10:15',
    printCount: 320,
    errorCount: 1
  }
]

const mockPrintRoutes: PrintRoute[] = [
  {
    id: 'R001',
    name: 'سفارشات غذاهای اصلی',
    source: 'POS',
    target: 'چاپگر آشپزخانه اصلی',
    conditions: ['دسته‌بندی: غذاهای اصلی', 'وضعیت: جدید'],
    isActive: true,
    createdAt: '1403/01/01'
  },
  {
    id: 'R002',
    name: 'سفارشات نوشیدنی',
    source: 'POS',
    target: 'چاپگر آشپزخانه فرعی',
    conditions: ['دسته‌بندی: نوشیدنی', 'وضعیت: جدید'],
    isActive: true,
    createdAt: '1403/01/01'
  },
  {
    id: 'R003',
    name: 'فاکتورهای فروش',
    source: 'POS',
    target: 'چاپگر صندوق',
    conditions: ['نوع: فاکتور فروش', 'وضعیت: تکمیل شده'],
    isActive: true,
    createdAt: '1403/01/01'
  }
]

const mockMenuCategories: MenuCategory[] = [
  {
    id: 'main-courses',
    name: 'غذاهای اصلی',
    icon: Pizza,
    items: ['کباب کوبیده', 'جوجه کباب', 'قیمه', 'قورمه سبزی', 'فسنجان']
  },
  {
    id: 'appetizers',
    name: 'پیش‌غذاها',
    icon: Utensils,
    items: ['سالاد فصل', 'ماست و خیار', 'ترشی', 'زیتون', 'پنیر']
  },
  {
    id: 'beverages',
    name: 'نوشیدنی‌ها',
    icon: Coffee,
    items: ['چای', 'قهوه', 'دوغ', 'نوشابه', 'آب']
  },
  {
    id: 'desserts',
    name: 'دسرها',
    icon: IceCream,
    items: ['بستنی', 'کیک', 'شیرینی', 'حلوا', 'فرنی']
  }
]

const getPrinterTypeIcon = (type: string) => {
  switch (type) {
    case 'kitchen': return ChefHat
    case 'receipt': return Receipt
    case 'label': return Tag
    case 'general': return Printer
    default: return Printer
  }
}

const getPrinterTypeColor = (type: string) => {
  switch (type) {
    case 'kitchen': return 'text-orange-600 dark:text-orange-400'
    case 'receipt': return 'text-green-600 dark:text-green-400'
    case 'label': return 'text-blue-600 dark:text-blue-400'
    case 'general': return 'text-gray-600 dark:text-gray-400'
    default: return 'text-gray-600 dark:text-gray-400'
  }
}

const getConnectionIcon = (connection: string) => {
  switch (connection) {
    case 'usb': return Usb
    case 'network': return Wifi
    case 'bluetooth': return Bluetooth
    default: return Cable
  }
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'online': return <span className="status-badge bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">آنلاین</span>
    case 'offline': return <span className="status-badge bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">آفلاین</span>
    case 'error': return <span className="status-badge bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">خطا</span>
    default: return null
  }
}

export default function PrinterConfigPage() {
  const [activeTab, setActiveTab] = useState<'printers' | 'routes' | 'test'>('printers')
  const [selectedPrinter, setSelectedPrinter] = useState<Printer | null>(null)
  const [showPrinterModal, setShowPrinterModal] = useState(false)
  const [showRouteModal, setShowRouteModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  const filteredPrinters = mockPrinters.filter(printer =>
    (searchTerm === '' || 
      printer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      printer.location.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (filterType === 'all' || printer.type === filterType) &&
    (filterStatus === 'all' || printer.status === filterStatus)
  )

  const handleCreatePrinter = () => {
    setSelectedPrinter(null)
    setShowPrinterModal(true)
  }

  const handleEditPrinter = (printer: Printer) => {
    setSelectedPrinter(printer)
    setShowPrinterModal(true)
  }

  const handleDeletePrinter = (printerId: string) => {
    if (confirm('آیا از حذف این چاپگر اطمینان دارید؟')) {
      alert('چاپگر با موفقیت حذف شد.')
    }
  }

  const handleTestPrinter = (printerId: string) => {
    alert('تست چاپگر انجام شد.')
  }

  const handleCreateRoute = () => {
    setShowRouteModal(true)
  }

  const handleEditRoute = (route: PrintRoute) => {
    setShowRouteModal(true)
  }

  const handleDeleteRoute = (routeId: string) => {
    if (confirm('آیا از حذف این مسیر چاپ اطمینان دارید؟')) {
      alert('مسیر چاپ با موفقیت حذف شد.')
    }
  }

  const handleSavePrinter = () => {
    alert('چاپگر با موفقیت ذخیره شد.')
    setShowPrinterModal(false)
  }

  const handleSaveRoute = () => {
    alert('مسیر چاپ با موفقیت ذخیره شد.')
    setShowRouteModal(false)
  }

  return (
    <div className="fade-in-animation space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">تنظیمات چاپگرها</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            مدیریت چاپگرها، مسیرهای چاپ و تنظیمات مربوط به چاپ اسناد و سفارشات.
          </p>
        </div>
        <div className="flex items-center space-x-3 space-x-reverse">
          <button
            onClick={handleCreatePrinter}
            className="premium-button flex items-center space-x-2 space-x-reverse"
          >
            <Plus className="w-5 h-5" />
            <span>چاپگر جدید</span>
          </button>
          <button
            onClick={handleCreateRoute}
            className="premium-button flex items-center space-x-2 space-x-reverse"
          >
            <Settings className="w-5 h-5" />
            <span>مسیر چاپ جدید</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="premium-card p-6">
        <div className="flex space-x-1 space-x-reverse bg-gray-100 dark:bg-gray-800 rounded-lg p-1 mb-6">
          <button
            onClick={() => setActiveTab('printers')}
            className={`flex-1 flex items-center justify-center space-x-2 space-x-reverse px-4 py-2 rounded-md transition-all duration-200 ${
              activeTab === 'printers'
                ? 'bg-white dark:bg-gray-700 text-primary-600 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Printer className="w-5 h-5" />
            <span>چاپگرها</span>
          </button>
          <button
            onClick={() => setActiveTab('routes')}
            className={`flex-1 flex items-center justify-center space-x-2 space-x-reverse px-4 py-2 rounded-md transition-all duration-200 ${
              activeTab === 'routes'
                ? 'bg-white dark:bg-gray-700 text-primary-600 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Settings className="w-5 h-5" />
            <span>مسیرهای چاپ</span>
          </button>
          <button
            onClick={() => setActiveTab('test')}
            className={`flex-1 flex items-center justify-center space-x-2 space-x-reverse px-4 py-2 rounded-md transition-all duration-200 ${
              activeTab === 'test'
                ? 'bg-white dark:bg-gray-700 text-primary-600 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <TestTube className="w-5 h-5" />
            <span>تست چاپ</span>
          </button>
        </div>

        {/* Printers Tab */}
        {activeTab === 'printers' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="جستجو چاپگر..."
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
                <option value="kitchen">آشپزخانه</option>
                <option value="receipt">فاکتور</option>
                <option value="label">برچسب</option>
                <option value="general">عمومی</option>
              </select>
              <select
                className="premium-input"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">همه وضعیت‌ها</option>
                <option value="online">آنلاین</option>
                <option value="offline">آفلاین</option>
                <option value="error">خطا</option>
              </select>
            </div>

            {/* Printers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPrinters.map(printer => {
                const TypeIcon = getPrinterTypeIcon(printer.type)
                const ConnectionIcon = getConnectionIcon(printer.connection)
                return (
                  <div key={printer.id} className="premium-card p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3 space-x-reverse">
                        <div className={`w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center`}>
                          <TypeIcon className={`w-6 h-6 ${getPrinterTypeColor(printer.type)}`} />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{printer.name}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{printer.location}</p>
                        </div>
                      </div>
                      {getStatusBadge(printer.status)}
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">نوع:</span>
                        <span className="text-gray-900 dark:text-white">
                          {printer.type === 'kitchen' ? 'آشپزخانه' :
                           printer.type === 'receipt' ? 'فاکتور' :
                           printer.type === 'label' ? 'برچسب' : 'عمومی'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">اتصال:</span>
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <ConnectionIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                          <span className="text-gray-900 dark:text-white">
                            {printer.connection === 'usb' ? 'USB' :
                             printer.connection === 'network' ? 'شبکه' : 'بلوتوث'}
                          </span>
                        </div>
                      </div>
                      {printer.ipAddress && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">IP:</span>
                          <span className="text-gray-900 dark:text-white">{printer.ipAddress}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">اندازه کاغذ:</span>
                        <span className="text-gray-900 dark:text-white">{printer.paperSize}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">تعداد چاپ:</span>
                        <span className="text-gray-900 dark:text-white">{printer.printCount.toLocaleString('fa-IR')}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        آخرین استفاده: {printer.lastUsed}
                      </div>
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <button
                          onClick={() => handleTestPrinter(printer.id)}
                          className="p-1 rounded-full text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                          title="تست چاپ"
                        >
                          <TestTube className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditPrinter(printer)}
                          className="p-1 rounded-full text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                          title="ویرایش"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeletePrinter(printer.id)}
                          className="p-1 rounded-full text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Routes Tab */}
        {activeTab === 'routes' && (
          <div className="space-y-6">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-right whitespace-nowrap">
                <thead>
                  <tr className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-800/50">
                    <th className="px-4 py-3 rounded-r-lg">نام مسیر</th>
                    <th className="px-4 py-3">منبع</th>
                    <th className="px-4 py-3">مقصد</th>
                    <th className="px-4 py-3">شرایط</th>
                    <th className="px-4 py-3">وضعیت</th>
                    <th className="px-4 py-3">تاریخ ایجاد</th>
                    <th className="px-4 py-3 rounded-l-lg">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {mockPrintRoutes.map(route => (
                    <tr key={route.id} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{route.name}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{route.source}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{route.target}</td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          {route.conditions.map((condition, index) => (
                            <span key={index} className="inline-block px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full">
                              {condition}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {route.isActive ? (
                          <span className="status-badge bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">فعال</span>
                        ) : (
                          <span className="status-badge bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300">غیرفعال</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{route.createdAt}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <button
                            onClick={() => handleEditRoute(route)}
                            className="p-1 rounded-full text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteRoute(route.id)}
                            className="p-1 rounded-full text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
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
          </div>
        )}

        {/* Test Tab */}
        {activeTab === 'test' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {mockPrinters.map(printer => {
                const TypeIcon = getPrinterTypeIcon(printer.type)
                return (
                  <div key={printer.id} className="premium-card p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3 space-x-reverse">
                        <TypeIcon className={`w-6 h-6 ${getPrinterTypeColor(printer.type)}`} />
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{printer.name}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{printer.location}</p>
                        </div>
                      </div>
                      {getStatusBadge(printer.status)}
                    </div>
                    
                    <div className="space-y-3">
                      <button
                        onClick={() => handleTestPrinter(printer.id)}
                        className="w-full premium-button flex items-center justify-center space-x-2 space-x-reverse"
                      >
                        <TestTube className="w-5 h-5" />
                        <span>تست چاپ</span>
                      </button>
                      <button
                        className="w-full premium-button bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 flex items-center justify-center space-x-2 space-x-reverse"
                      >
                        <FileText className="w-5 h-5" />
                        <span>چاپ فاکتور نمونه</span>
                      </button>
                      {printer.type === 'kitchen' && (
                        <button
                          className="w-full premium-button bg-orange-200 text-orange-800 hover:bg-orange-300 dark:bg-orange-900/30 dark:text-orange-300 dark:hover:bg-orange-900/50 flex items-center justify-center space-x-2 space-x-reverse"
                        >
                          <ChefHat className="w-5 h-5" />
                          <span>چاپ سفارش آشپزخانه</span>
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Printer Modal */}
      {showPrinterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {selectedPrinter ? 'ویرایش چاپگر' : 'چاپگر جدید'}
              </h2>
              <button
                onClick={() => setShowPrinterModal(false)}
                className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">نام چاپگر</label>
                <input
                  type="text"
                  className="premium-input"
                  defaultValue={selectedPrinter?.name || ''}
                  placeholder="نام چاپگر را وارد کنید"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">نوع چاپگر</label>
                  <select className="premium-input">
                    <option value="kitchen">آشپزخانه</option>
                    <option value="receipt">فاکتور</option>
                    <option value="label">برچسب</option>
                    <option value="general">عمومی</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">نوع اتصال</label>
                  <select className="premium-input">
                    <option value="usb">USB</option>
                    <option value="network">شبکه</option>
                    <option value="bluetooth">بلوتوث</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">آدرس IP</label>
                  <input
                    type="text"
                    className="premium-input"
                    defaultValue={selectedPrinter?.ipAddress || ''}
                    placeholder="192.168.1.100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">پورت</label>
                  <input
                    type="number"
                    className="premium-input"
                    defaultValue={selectedPrinter?.port || ''}
                    placeholder="9100"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">مکان</label>
                <input
                  type="text"
                  className="premium-input"
                  defaultValue={selectedPrinter?.location || ''}
                  placeholder="مکان چاپگر را وارد کنید"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">اندازه کاغذ</label>
                <select className="premium-input">
                  <option value="58mm">58mm</option>
                  <option value="80mm">80mm</option>
                  <option value="A4">A4</option>
                </select>
              </div>
              <div className="flex items-center space-x-4 space-x-reverse">
                <label className="flex items-center space-x-2 space-x-reverse">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    defaultChecked={selectedPrinter?.autoCut}
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">برش خودکار</span>
                </label>
                <label className="flex items-center space-x-2 space-x-reverse">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    defaultChecked={selectedPrinter?.autoOpen}
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">باز کردن خودکار</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 space-x-reverse mt-6">
              <button
                onClick={() => setShowPrinterModal(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                انصراف
              </button>
              <button
                onClick={handleSavePrinter}
                className="premium-button flex items-center space-x-2 space-x-reverse"
              >
                <Save className="w-5 h-5" />
                <span>ذخیره</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Route Modal */}
      {showRouteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">مسیر چاپ جدید</h2>
              <button
                onClick={() => setShowRouteModal(false)}
                className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">نام مسیر</label>
                <input
                  type="text"
                  className="premium-input"
                  placeholder="نام مسیر چاپ را وارد کنید"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">منبع</label>
                <select className="premium-input">
                  <option value="POS">سیستم POS</option>
                  <option value="Kitchen">آشپزخانه</option>
                  <option value="Inventory">انبار</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">مقصد</label>
                <select className="premium-input">
                  {mockPrinters.map(printer => (
                    <option key={printer.id} value={printer.name}>{printer.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">شرایط</label>
                <div className="space-y-2">
                  {mockMenuCategories.map(category => (
                    <label key={category.id} className="flex items-center space-x-3 space-x-reverse">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{category.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 space-x-reverse mt-6">
              <button
                onClick={() => setShowRouteModal(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                انصراف
              </button>
              <button
                onClick={handleSaveRoute}
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