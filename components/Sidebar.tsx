'use client'

import { useState, memo } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Home,
  Menu as MenuIcon,
  ShoppingCart,
  Users,
  BarChart3,
  Settings,
  ChefHat,
  Utensils,
  Coffee,
  Pizza,
  IceCream,
  Plus,
  Edit,
  Trash2,
  Eye,
  Star,
  Clock,
  DollarSign,
  TrendingUp,
  Package,
  FileText,
  Bell,
  HelpCircle,
  PlayCircle,
  Zap,
  CreditCard,
  CheckCircle,
  Building,
  Calculator,
  ShoppingBag,
  UserCheck,
  Warehouse,
  Receipt,
  Banknote,
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
  BookOpen,
  FileSpreadsheet,
  Database,
  ArrowRightLeft,
  AlertTriangle,
  Truck,
  MapPin,
  ClipboardList,
  History,
  FileCheck,
  Search,
  Target,
  PieChart,
  LineChart,
  Calendar,
  Percent,
  Activity,
  XCircle,
  Download,
  Printer,
  Filter,
  RefreshCw,
  Award,
  Shield,
  Lock,
  Key,
  Layout,
  Palette,
  Monitor,
  Camera,
  QrCode,
  Barcode,
  PenTool,
  Stamp,
  HardDrive,
  Cloud,
  Server,
  Archive,
  RotateCcw,
  Upload,
  LogIn,
  LogOut
} from 'lucide-react'

interface MenuItem {
  id: string
  name: string
  icon: React.ComponentType<any>
  subItems?: MenuItem[]
  href?: string
}

const menuItems: MenuItem[] = [
  {
    id: 'dashboard',
    name: 'داشبورد',
    icon: Home,
    href: '/'
  },
  {
    id: 'onboarding',
    name: 'راه‌اندازی رستوران',
    icon: PlayCircle,
    href: '/onboarding',
    subItems: [
      { id: 'setup-branch', name: 'تعریف شعبه/صندوق', icon: Building, href: '/onboarding/setup-branch' },
      { id: 'tax-settings', name: 'مالیات/کارمزد', icon: Calculator, href: '/onboarding/tax-settings' },
      { id: 'menu-setup', name: 'کالا/منو', icon: MenuIcon, href: '/onboarding/menu-setup' },
      { id: 'people-setup', name: 'اشخاص', icon: UserCheck, href: '/onboarding/people-setup' },
      { id: 'initial-inventory', name: 'موجودی اولیه', icon: Warehouse, href: '/onboarding/initial-inventory' }
    ]
  },
  {
    id: 'operations',
    name: 'منو عملیات',
    icon: Zap,
    href: '/operations',
    subItems: [
      { id: 'quick-sale', name: 'فاکتور فروش سریع', icon: ShoppingCart, href: '/operations/quick-sale' },
      { id: 'table-order', name: 'ثبت سفارش میز', icon: Utensils, href: '/operations/table-order' },
      { id: 'close-cashier', name: 'بستن صندوق', icon: CreditCard, href: '/operations/close-cashier' },
      { id: 'daily-report', name: 'گزارش روزانه', icon: FileText, href: '/operations/daily-report' }
    ]
  },
  {
    id: 'pos',
    name: 'فروش غذا (POS)',
    icon: ShoppingBag,
    href: '/pos',
    subItems: [
      { id: 'dine-in', name: 'حضوری', icon: Utensils, href: '/pos/dine-in' },
      { id: 'takeaway', name: 'بیرون‌بر', icon: Package, href: '/pos/takeaway' },
      { id: 'delivery', name: 'ارسال', icon: ShoppingCart, href: '/pos/delivery' },
      { id: 'kitchen-orders', name: 'سفارشات آشپزخانه', icon: ChefHat, href: '/pos/kitchen-orders' }
    ]
  },
  {
    id: 'menu',
    name: 'منو',
    icon: MenuIcon,
    subItems: [
      { id: 'all-items', name: 'تمام آیتم‌ها', icon: Utensils, href: '/menu/all-items' },
      { id: 'appetizers', name: 'پیش‌غذاها', icon: Coffee, href: '/menu/appetizers' },
      { id: 'main-courses', name: 'غذاهای اصلی', icon: Pizza, href: '/menu/main-courses' },
      { id: 'desserts', name: 'دسرها', icon: IceCream, href: '/menu/desserts' },
      { id: 'beverages', name: 'نوشیدنی‌ها', icon: Coffee, href: '/menu/beverages' }
    ]
  },
  {
    id: 'orders',
    name: 'سفارشات',
    icon: ShoppingCart,
    subItems: [
      { id: 'management', name: 'مدیریت سفارشات', icon: BarChart3, href: '/orders/management' }
    ]
  },
  {
    id: 'customers',
    name: 'مشتریان',
    icon: Users,
    href: '/customers',
    subItems: [
      { id: 'customer-list', name: 'لیست مشتریان', icon: Users, href: '/customers/list' },
      { id: 'customer-feedback', name: 'بازخورد مشتریان', icon: Star, href: '/customers/feedback' },
      { id: 'loyalty-program', name: 'باشگاه مشتریان', icon: Award, href: '/customers/loyalty' }
    ]
  },
  {
    id: 'accounting',
    name: 'حسابداری / مالی',
    icon: Calculator,
    subItems: [
      { id: 'receipts-payments', name: 'دریافت و پرداخت (AR/AP)', icon: Receipt, href: '/accounting/receipts-payments' },
      { id: 'purchases', name: 'خریدها', icon: ShoppingCart, href: '/accounting/purchases' },
      { id: 'invoices', name: 'فاکتورها', icon: FileText, href: '/accounting/invoices' },
      { id: 'bank-accounts', name: 'مدیریت بانک‌ها و حساب‌های بانکی', icon: Banknote, href: '/accounting/bank-accounts' },
      { id: 'cheques', name: 'مدیریت چک‌ها', icon: CreditCard, href: '/accounting/cheques' },
      { id: 'cash-flow', name: 'گزارش جریان نقدی', icon: TrendingUp, href: '/accounting/cash-flow' },
      { id: 'balance-sheet', name: 'ترازنامه', icon: FileSpreadsheet, href: '/accounting/balance-sheet' },
      { id: 'ledgers', name: 'دفاتر مالی (روزنامه/کل/معین)', icon: BookOpen, href: '/accounting/ledgers' }
    ]
  },
  {
    id: 'inventory',
    name: 'انبارداری',
    icon: Warehouse,
    subItems: [
      { id: 'warehouses', name: 'مدیریت انبارها', icon: Warehouse, href: '/inventory/warehouses' },
      { id: 'transfers', name: 'انتقال بین انبارها', icon: ArrowRightLeft, href: '/inventory/transfers' },
      { id: 'stock-alerts', name: 'هشدارهای موجودی', icon: AlertTriangle, href: '/inventory/stock-alerts' },
      { id: 'item-ledger', name: 'کاردکس کالا', icon: History, href: '/inventory/item-ledger' },
      { id: 'inventory-audit', name: 'انبارگردانی', icon: FileCheck, href: '/inventory/audit' },
      { id: 'inventory-reports', name: 'گزارشات انبار', icon: ClipboardList, href: '/inventory/reports' }
    ]
  },
  {
    id: 'analytics',
    name: 'گزارشات',
    icon: BarChart3,
    subItems: [
      { id: 'financial-reports', name: 'گزارشات مالی', icon: TrendingUp, href: '/reports/financial' },
      { id: 'cheque-payment-reports', name: 'گزارشات چک و پرداخت', icon: CreditCard, href: '/reports/cheque-payments' },
      { id: 'customer-supplier-reports', name: 'گزارشات مشتریان و تامین‌کنندگان', icon: Users, href: '/reports/customer-supplier' },
      { id: 'sales', name: 'فروش', icon: DollarSign, href: '/reports/sales' },
      { id: 'inventory', name: 'موجودی', icon: Package, href: '/reports/inventory' },
      { id: 'general-reports', name: 'گزارشات عمومی', icon: FileText, href: '/reports/general' }
    ]
  },
  {
    id: 'advanced-settings',
    name: 'تنظیمات پیشرفته',
    icon: Settings,
    subItems: [
      { id: 'user-roles', name: 'سطح دسترسی کاربران', icon: Shield, href: '/settings/user-roles' },
      { id: 'printer-config', name: 'تنظیمات چاپگرها', icon: Printer, href: '/settings/printer-config' },
      { id: 'invoice-templates', name: 'طراحی قالب فاکتور', icon: Layout, href: '/settings/invoice-templates' }
    ]
  },
  {
    id: 'management-tools',
    name: 'ابزارهای مدیریتی',
    icon: Database,
    subItems: [
      { id: 'backup-restore', name: 'پشتیبان‌گیری و بازیابی', icon: Archive, href: '/settings/backup-restore' },
      { id: 'audit-log', name: 'گزارش فعالیت کاربران', icon: FileText, href: '/settings/audit-log' }
    ]
  },
]

const settingsItems: MenuItem[] = [
  {
    id: 'restaurant-settings',
    name: 'تنظیمات رستوران',
    icon: Settings,
    href: '/settings/restaurant'
  },
  {
    id: 'staff-management',
    name: 'مدیریت کارکنان',
    icon: Users,
    href: '/settings/staff'
  },
  {
    id: 'notifications',
    name: 'اعلان‌ها',
    icon: Bell,
    href: '/settings/notifications'
  },
  {
    id: 'help',
    name: 'راهنما',
    icon: HelpCircle,
    href: '/settings/help'
  }
]

function Sidebar() {
  const [isOpen, setIsOpen] = useState(true)
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const router = useRouter()

  const toggleSidebar = () => {
    setIsOpen(!isOpen)
  }

  const handleMenuClick = (item: MenuItem) => {
    if (item.subItems) {
      setActiveMenu(activeMenu === item.id ? null : item.id)
    } else if (item.href) {
      router.push(item.href)
      if (window.innerWidth < 1024) {
        setIsOpen(false) // Close sidebar on mobile after navigation
      }
    }
  }

  return (
      <aside
        className={`premium-sidebar h-screen sticky top-0 overflow-y-auto sidebar-scrollbar smooth-scroll transition-all duration-300 ${
          isOpen ? 'w-64 p-4' : 'w-20 p-2'
        } flex flex-col`}
      >
      <div className="flex items-center justify-between mb-6">
        {isOpen && (
          <h1 className="text-2xl font-decorative gradient-text">مدیریت رستوران</h1>
        )}
        <button onClick={toggleSidebar} className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          <MenuIcon className="w-6 h-6 text-gray-700 dark:text-gray-200" />
        </button>
      </div>

      <nav className="flex-1">
        <ul className="space-y-2">
          {menuItems.map(item => (
            <li key={item.id}>
              <button
                onClick={() => handleMenuClick(item)}
                className={`flex items-center w-full p-3 rounded-xl text-gray-700 dark:text-white hover:bg-primary-500/10 dark:hover:bg-primary-400/20 hover:text-primary-600 dark:hover:text-primary-300 transition-all duration-200 ${
                  activeMenu === item.id ? 'bg-primary-500/10 dark:bg-primary-400/20 text-primary-600 dark:text-primary-300' : ''
                }`}
              >
                <item.icon className={`w-5 h-5 ${isOpen ? 'ml-3' : ''}`} />
                {isOpen && <span className="font-medium">{item.name}</span>}
              </button>
              {isOpen && item.subItems && activeMenu === item.id && (
                <ul className="mt-2 space-y-1 pr-4 border-r border-gray-200 dark:border-gray-700">
                  {item.subItems.map(subItem => (
                    <li key={subItem.id}>
                      <button
                        onClick={() => handleMenuClick(subItem)}
                        className="flex items-center w-full p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-primary-500/5 dark:hover:bg-primary-400/10 hover:text-primary-500 dark:hover:text-primary-400 transition-colors text-sm"
                      >
                        <subItem.icon className="w-4 h-4 ml-2" />
                        <span>{subItem.name}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
        <h2 className={`text-lg font-semibold text-gray-900 dark:text-white mb-4 ${!isOpen ? 'text-center' : ''}`}>
          {isOpen ? 'تنظیمات' : <Settings className="w-6 h-6 mx-auto" />}
        </h2>
        {isOpen && (
          <ul className="space-y-2">
            {settingsItems.map(item => (
              <li key={item.id}>
                <button
                  onClick={() => handleMenuClick(item)}
                  className="flex items-center w-full p-3 rounded-xl text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <item.icon className="w-5 h-5 ml-3" />
                  <span className="font-medium">{item.name}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  )
}

export default memo(Sidebar)