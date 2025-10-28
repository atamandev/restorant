'use client'

import React, { useState } from 'react'
import {
  Layout,
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
  Monitor,
  Camera,
  QrCode,
  Barcode,
  PenTool,
  Stamp,
  FileText,
  Receipt,
  CreditCard,
  Banknote,
  TrendingUp,
  Package,
  Utensils,
  ChefHat,
  Coffee,
  Pizza,
  IceCream,
  ShoppingCart,
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
  Camera2,
  Webcam,
  HardDrive,
  Server,
  Database,
  Cloud,
  CloudOff,
  Wifi,
  WifiOff,
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
  QrCode2,
  Barcode2,
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

interface InvoiceTemplate {
  id: string
  name: string
  type: 'dine-in' | 'takeaway' | 'delivery' | 'general'
  description: string
  isDefault: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
  preview: string
}

interface TemplateField {
  id: string
  name: string
  type: 'text' | 'image' | 'qr' | 'barcode' | 'signature' | 'stamp'
  position: { x: number; y: number }
  size: { width: number; height: number }
  content: string
  isVisible: boolean
}

const mockTemplates: InvoiceTemplate[] = [
  {
    id: 'T001',
    name: 'قالب فاکتور سالن',
    type: 'dine-in',
    description: 'قالب مخصوص فاکتورهای فروش در سالن',
    isDefault: true,
    isActive: true,
    createdAt: '1403/01/01',
    updatedAt: '1403/09/15',
    preview: 'preview-dine-in.jpg'
  },
  {
    id: 'T002',
    name: 'قالب فاکتور بیرون‌بر',
    type: 'takeaway',
    description: 'قالب مخصوص فاکتورهای بیرون‌بر',
    isDefault: false,
    isActive: true,
    createdAt: '1403/01/01',
    updatedAt: '1403/09/10',
    preview: 'preview-takeaway.jpg'
  },
  {
    id: 'T003',
    name: 'قالب فاکتور ارسال',
    type: 'delivery',
    description: 'قالب مخصوص فاکتورهای ارسال',
    isDefault: false,
    isActive: true,
    createdAt: '1403/01/01',
    updatedAt: '1403/09/08',
    preview: 'preview-delivery.jpg'
  },
  {
    id: 'T004',
    name: 'قالب فاکتور عمومی',
    type: 'general',
    description: 'قالب عمومی برای انواع فاکتورها',
    isDefault: false,
    isActive: false,
    createdAt: '1403/02/15',
    updatedAt: '1403/09/05',
    preview: 'preview-general.jpg'
  }
]

const mockTemplateFields: TemplateField[] = [
  {
    id: 'F001',
    name: 'لوگو رستوران',
    type: 'image',
    position: { x: 10, y: 10 },
    size: { width: 100, height: 50 },
    content: 'logo.png',
    isVisible: true
  },
  {
    id: 'F002',
    name: 'نام رستوران',
    type: 'text',
    position: { x: 120, y: 20 },
    size: { width: 200, height: 30 },
    content: 'رستوران سنتی ایرانی',
    isVisible: true
  },
  {
    id: 'F003',
    name: 'آدرس رستوران',
    type: 'text',
    position: { x: 120, y: 50 },
    size: { width: 200, height: 20 },
    content: 'تهران، خیابان ولیعصر، پلاک ۱۰',
    isVisible: true
  },
  {
    id: 'F004',
    name: 'شماره فاکتور',
    type: 'text',
    position: { x: 10, y: 80 },
    size: { width: 150, height: 20 },
    content: 'شماره: {invoice_number}',
    isVisible: true
  },
  {
    id: 'F005',
    name: 'تاریخ فاکتور',
    type: 'text',
    position: { x: 170, y: 80 },
    size: { width: 150, height: 20 },
    content: 'تاریخ: {invoice_date}',
    isVisible: true
  },
  {
    id: 'F006',
    name: 'QR کد',
    type: 'qr',
    position: { x: 250, y: 80 },
    size: { width: 50, height: 50 },
    content: '{invoice_qr}',
    isVisible: true
  }
]

const getTemplateTypeIcon = (type: string) => {
  switch (type) {
    case 'dine-in': return Utensils
    case 'takeaway': return Package
    case 'delivery': return ShoppingCart
    case 'general': return FileText
    default: return FileText
  }
}

const getTemplateTypeColor = (type: string) => {
  switch (type) {
    case 'dine-in': return 'text-blue-600 dark:text-blue-400'
    case 'takeaway': return 'text-green-600 dark:text-green-400'
    case 'delivery': return 'text-orange-600 dark:text-orange-400'
    case 'general': return 'text-gray-600 dark:text-gray-400'
    default: return 'text-gray-600 dark:text-gray-400'
  }
}

const getFieldTypeIcon = (type: string) => {
  switch (type) {
    case 'text': return FileText
    case 'image': return Image
    case 'qr': return QrCode
    case 'barcode': return Barcode
    case 'signature': return PenTool
    case 'stamp': return Stamp
    default: return FileText
  }
}

export default function InvoiceTemplatesPage() {
  const [activeTab, setActiveTab] = useState<'templates' | 'designer' | 'preview'>('templates')
  const [selectedTemplate, setSelectedTemplate] = useState<InvoiceTemplate | null>(null)
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [showFieldModal, setShowFieldModal] = useState(false)
  const [selectedField, setSelectedField] = useState<TemplateField | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  const filteredTemplates = mockTemplates.filter(template =>
    (searchTerm === '' || 
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (filterType === 'all' || template.type === filterType) &&
    (filterStatus === 'all' || (filterStatus === 'active' ? template.isActive : !template.isActive))
  )

  const handleCreateTemplate = () => {
    setSelectedTemplate(null)
    setShowTemplateModal(true)
  }

  const handleEditTemplate = (template: InvoiceTemplate) => {
    setSelectedTemplate(template)
    setShowTemplateModal(true)
  }

  const handleDeleteTemplate = (templateId: string) => {
    if (confirm('آیا از حذف این قالب اطمینان دارید؟')) {
      alert('قالب با موفقیت حذف شد.')
    }
  }

  const handlePreviewTemplate = (template: InvoiceTemplate) => {
    setSelectedTemplate(template)
    setActiveTab('preview')
  }

  const handleDesignTemplate = (template: InvoiceTemplate) => {
    setSelectedTemplate(template)
    setActiveTab('designer')
  }

  const handleCreateField = () => {
    setSelectedField(null)
    setShowFieldModal(true)
  }

  const handleEditField = (field: TemplateField) => {
    setSelectedField(field)
    setShowFieldModal(true)
  }

  const handleDeleteField = (fieldId: string) => {
    if (confirm('آیا از حذف این فیلد اطمینان دارید؟')) {
      alert('فیلد با موفقیت حذف شد.')
    }
  }

  const handleSaveTemplate = () => {
    alert('قالب با موفقیت ذخیره شد.')
    setShowTemplateModal(false)
  }

  const handleSaveField = () => {
    alert('فیلد با موفقیت ذخیره شد.')
    setShowFieldModal(false)
  }

  return (
    <div className="fade-in-animation space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">طراحی قالب فاکتور</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            طراحی و مدیریت قالب‌های فاکتور برای انواع مختلف فروش و تطابق با قوانین مالیاتی.
          </p>
        </div>
        <div className="flex items-center space-x-3 space-x-reverse">
          <button
            onClick={handleCreateTemplate}
            className="premium-button flex items-center space-x-2 space-x-reverse"
          >
            <Plus className="w-5 h-5" />
            <span>قالب جدید</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="premium-card p-6">
        <div className="flex space-x-1 space-x-reverse bg-gray-100 dark:bg-gray-800 rounded-lg p-1 mb-6">
          <button
            onClick={() => setActiveTab('templates')}
            className={`flex-1 flex items-center justify-center space-x-2 space-x-reverse px-4 py-2 rounded-md transition-all duration-200 ${
              activeTab === 'templates'
                ? 'bg-white dark:bg-gray-700 text-primary-600 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Layout className="w-5 h-5" />
            <span>قالب‌ها</span>
          </button>
          <button
            onClick={() => setActiveTab('designer')}
            className={`flex-1 flex items-center justify-center space-x-2 space-x-reverse px-4 py-2 rounded-md transition-all duration-200 ${
              activeTab === 'designer'
                ? 'bg-white dark:bg-gray-700 text-primary-600 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Settings className="w-5 h-5" />
            <span>طراح</span>
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`flex-1 flex items-center justify-center space-x-2 space-x-reverse px-4 py-2 rounded-md transition-all duration-200 ${
              activeTab === 'preview'
                ? 'bg-white dark:bg-gray-700 text-primary-600 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Eye className="w-5 h-5" />
            <span>پیش‌نمایش</span>
          </button>
        </div>

        {/* Templates Tab */}
        {activeTab === 'templates' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="جستجو قالب..."
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
                <option value="dine-in">سالن</option>
                <option value="takeaway">بیرون‌بر</option>
                <option value="delivery">ارسال</option>
                <option value="general">عمومی</option>
              </select>
              <select
                className="premium-input"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">همه وضعیت‌ها</option>
                <option value="active">فعال</option>
                <option value="inactive">غیرفعال</option>
              </select>
            </div>

            {/* Templates Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map(template => {
                const TypeIcon = getTemplateTypeIcon(template.type)
                return (
                  <div key={template.id} className="premium-card p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3 space-x-reverse">
                        <div className={`w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center`}>
                          <TypeIcon className={`w-6 h-6 ${getTemplateTypeColor(template.type)}`} />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{template.name}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {template.type === 'dine-in' ? 'سالن' :
                             template.type === 'takeaway' ? 'بیرون‌بر' :
                             template.type === 'delivery' ? 'ارسال' : 'عمومی'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 space-x-reverse">
                        {template.isDefault && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 text-xs rounded-full">
                            پیش‌فرض
                          </span>
                        )}
                        {template.isActive ? (
                          <span className="status-badge bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">فعال</span>
                        ) : (
                          <span className="status-badge bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300">غیرفعال</span>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">{template.description}</p>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">تاریخ ایجاد:</span>
                        <span className="text-gray-900 dark:text-white">{template.createdAt}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">آخرین ویرایش:</span>
                        <span className="text-gray-900 dark:text-white">{template.updatedAt}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <button
                          onClick={() => handlePreviewTemplate(template)}
                          className="p-1 rounded-full text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                          title="پیش‌نمایش"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDesignTemplate(template)}
                          className="p-1 rounded-full text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                          title="طراحی"
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditTemplate(template)}
                          className="p-1 rounded-full text-yellow-600 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors"
                          title="ویرایش"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {!template.isDefault && (
                          <button
                            onClick={() => handleDeleteTemplate(template.id)}
                            className="p-1 rounded-full text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                            title="حذف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Designer Tab */}
        {activeTab === 'designer' && (
          <div className="space-y-6">
            {selectedTemplate ? (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Canvas */}
                <div className="lg:col-span-3">
                  <div className="premium-card p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        طراحی قالب: {selectedTemplate.name}
                      </h3>
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <button className="premium-button p-2">
                          <Save className="w-5 h-5" />
                        </button>
                        <button className="premium-button bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 p-2">
                          <Download className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Canvas Area */}
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 min-h-[600px] bg-white dark:bg-gray-900 relative">
                      <div className="text-center text-gray-500 dark:text-gray-400 mb-4">
                        ناحیه طراحی قالب فاکتور
                      </div>
                      
                      {/* Template Fields */}
                      {mockTemplateFields.map(field => {
                        const FieldIcon = getFieldTypeIcon(field.type)
                        return (
                          <div
                            key={field.id}
                            className="absolute border-2 border-dashed border-blue-300 bg-blue-50 dark:bg-blue-900/20 p-2 cursor-move"
                            style={{
                              left: field.position.x,
                              top: field.position.y,
                              width: field.size.width,
                              height: field.size.height
                            }}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <FieldIcon className="w-4 h-4 text-blue-600" />
                              <div className="flex items-center space-x-1 space-x-reverse">
                                <button
                                  onClick={() => handleEditField(field)}
                                  className="p-1 rounded-full text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                                >
                                  <Edit className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => handleDeleteField(field.id)}
                                  className="p-1 rounded-full text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
                              {field.content}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* Tools Panel */}
                <div className="lg:col-span-1">
                  <div className="premium-card p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">ابزارها</h3>
                    
                    <div className="space-y-3">
                      <button
                        onClick={handleCreateField}
                        className="w-full premium-button flex items-center justify-center space-x-2 space-x-reverse"
                      >
                        <Plus className="w-5 h-5" />
                        <span>افزودن فیلد</span>
                      </button>
                      
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">فیلدهای موجود</h4>
                        {mockTemplateFields.map(field => {
                          const FieldIcon = getFieldTypeIcon(field.type)
                          return (
                            <div key={field.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                              <div className="flex items-center space-x-2 space-x-reverse">
                                <FieldIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                <span className="text-sm text-gray-700 dark:text-gray-300">{field.name}</span>
                              </div>
                              <div className="flex items-center space-x-1 space-x-reverse">
                                <button
                                  onClick={() => handleEditField(field)}
                                  className="p-1 rounded-full text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                                >
                                  <Edit className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => handleDeleteField(field.id)}
                                  className="p-1 rounded-full text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Layout className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">قالبی انتخاب نشده</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  برای شروع طراحی، ابتدا یک قالب را انتخاب کنید.
                </p>
                <button
                  onClick={() => setActiveTab('templates')}
                  className="premium-button"
                >
                  انتخاب قالب
                </button>
              </div>
            )}
          </div>
        )}

        {/* Preview Tab */}
        {activeTab === 'preview' && (
          <div className="space-y-6">
            {selectedTemplate ? (
              <div className="premium-card p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    پیش‌نمایش قالب: {selectedTemplate.name}
                  </h3>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <button className="premium-button p-2">
                      <Download className="w-5 h-5" />
                    </button>
                    <button className="premium-button bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 p-2">
                      <Printer className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                {/* Preview Area */}
                <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-8 bg-white dark:bg-gray-900">
                  <div className="text-center text-gray-500 dark:text-gray-400 mb-4">
                    پیش‌نمایش قالب فاکتور
                  </div>
                  
                  {/* Mock Invoice Preview */}
                  <div className="max-w-md mx-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-lg">
                    <div className="text-center mb-4">
                      <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg mx-auto mb-2 flex items-center justify-center">
                        <Image className="w-8 h-8 text-gray-400" />
                      </div>
                      <h2 className="text-lg font-bold text-gray-900 dark:text-white">رستوران سنتی ایرانی</h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400">تهران، خیابان ولیعصر، پلاک ۱۰</p>
                    </div>
                    
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600 dark:text-gray-400">شماره فاکتور:</span>
                        <span className="text-gray-900 dark:text-white">INV-001</span>
                      </div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600 dark:text-gray-400">تاریخ:</span>
                        <span className="text-gray-900 dark:text-white">1403/09/15</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">میز:</span>
                        <span className="text-gray-900 dark:text-white">5</span>
                      </div>
                    </div>
                    
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-900 dark:text-white">کباب کوبیده</span>
                          <span className="text-gray-900 dark:text-white">150,000 تومان</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-900 dark:text-white">دوغ</span>
                          <span className="text-gray-900 dark:text-white">25,000 تومان</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-4">
                      <div className="flex justify-between text-sm font-bold">
                        <span className="text-gray-900 dark:text-white">مجموع:</span>
                        <span className="text-gray-900 dark:text-white">175,000 تومان</span>
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg mx-auto mb-2 flex items-center justify-center">
                        <QrCode className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">با تشکر از انتخاب شما</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Eye className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">قالبی انتخاب نشده</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  برای مشاهده پیش‌نمایش، ابتدا یک قالب را انتخاب کنید.
                </p>
                <button
                  onClick={() => setActiveTab('templates')}
                  className="premium-button"
                >
                  انتخاب قالب
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {selectedTemplate ? 'ویرایش قالب' : 'قالب جدید'}
              </h2>
              <button
                onClick={() => setShowTemplateModal(false)}
                className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">نام قالب</label>
                <input
                  type="text"
                  className="premium-input"
                  defaultValue={selectedTemplate?.name || ''}
                  placeholder="نام قالب را وارد کنید"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">نوع قالب</label>
                <select className="premium-input">
                  <option value="dine-in">سالن</option>
                  <option value="takeaway">بیرون‌بر</option>
                  <option value="delivery">ارسال</option>
                  <option value="general">عمومی</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">توضیحات</label>
                <textarea
                  className="premium-input"
                  rows={3}
                  defaultValue={selectedTemplate?.description || ''}
                  placeholder="توضیحات قالب را وارد کنید"
                />
              </div>
              <div className="flex items-center space-x-4 space-x-reverse">
                <label className="flex items-center space-x-2 space-x-reverse">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    defaultChecked={selectedTemplate?.isDefault}
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">قالب پیش‌فرض</span>
                </label>
                <label className="flex items-center space-x-2 space-x-reverse">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    defaultChecked={selectedTemplate?.isActive}
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">فعال</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 space-x-reverse mt-6">
              <button
                onClick={() => setShowTemplateModal(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                انصراف
              </button>
              <button
                onClick={handleSaveTemplate}
                className="premium-button flex items-center space-x-2 space-x-reverse"
              >
                <Save className="w-5 h-5" />
                <span>ذخیره</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Field Modal */}
      {showFieldModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {selectedField ? 'ویرایش فیلد' : 'فیلد جدید'}
              </h2>
              <button
                onClick={() => setShowFieldModal(false)}
                className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">نام فیلد</label>
                <input
                  type="text"
                  className="premium-input"
                  defaultValue={selectedField?.name || ''}
                  placeholder="نام فیلد را وارد کنید"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">نوع فیلد</label>
                <select className="premium-input">
                  <option value="text">متن</option>
                  <option value="image">تصویر</option>
                  <option value="qr">QR کد</option>
                  <option value="barcode">بارکد</option>
                  <option value="signature">امضا</option>
                  <option value="stamp">مهر</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">محتوای فیلد</label>
                <input
                  type="text"
                  className="premium-input"
                  defaultValue={selectedField?.content || ''}
                  placeholder="محتوای فیلد را وارد کنید"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">موقعیت X</label>
                  <input
                    type="number"
                    className="premium-input"
                    defaultValue={selectedField?.position.x || 0}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">موقعیت Y</label>
                  <input
                    type="number"
                    className="premium-input"
                    defaultValue={selectedField?.position.y || 0}
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">عرض</label>
                  <input
                    type="number"
                    className="premium-input"
                    defaultValue={selectedField?.size.width || 100}
                    placeholder="100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">ارتفاع</label>
                  <input
                    type="number"
                    className="premium-input"
                    defaultValue={selectedField?.size.height || 30}
                    placeholder="30"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  defaultChecked={selectedField?.isVisible}
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">نمایش فیلد</span>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 space-x-reverse mt-6">
              <button
                onClick={() => setShowFieldModal(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                انصراف
              </button>
              <button
                onClick={handleSaveField}
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