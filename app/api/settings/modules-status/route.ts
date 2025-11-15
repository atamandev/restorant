import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://admin:StrongPassword123@185.204.169.107:27017/restaurant?authSource=admin'
const DB_NAME = 'restaurant'

let client: MongoClient
let db: any

async function connectToDatabase() {
  if (!client) {
    client = new MongoClient(MONGO_URI)
    await client.connect()
    db = client.db(DB_NAME)
  }
  return db
}

// GET - وضعیت ماژول‌های سیستم
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()
    
    const branchesCollection = db.collection('branches')
    const cashRegistersCollection = db.collection('cash_registers')
    const menuItemsCollection = db.collection('menu_items')
    const inventoryItemsCollection = db.collection('inventory_items')
    const usersCollection = db.collection('users')
    const printersCollection = db.collection('printers')
    const invoiceTemplatesCollection = db.collection('invoice_templates')
    const restaurantSettingsCollection = db.collection('restaurant_settings')

    // بررسی وضعیت هر ماژول
    const modules = {
      // 1️⃣ راه‌اندازی
      setup: {
        name: 'راه‌اندازی',
        status: 'unknown',
        enabled: false,
        items: {
          branches: {
            name: 'شعبه‌ها',
            status: 'unknown',
            count: await branchesCollection.countDocuments({ isActive: true }),
            required: true,
            description: 'تعریف شعبه‌های رستوران'
          },
          cashRegisters: {
            name: 'صندوق‌ها',
            status: 'unknown',
            count: await cashRegistersCollection.countDocuments({ isActive: true }),
            required: true,
            description: 'تعریف صندوق‌های نقدی'
          },
          menuItems: {
            name: 'آیتم‌های منو',
            status: 'unknown',
            count: await menuItemsCollection.countDocuments({}),
            required: true,
            description: 'تعریف غذاها و نوشیدنی‌ها'
          },
          inventoryItems: {
            name: 'مواد اولیه',
            status: 'unknown',
            count: await inventoryItemsCollection.countDocuments({}),
            required: true,
            description: 'تعریف مواد اولیه موجودی'
          },
          taxRates: {
            name: 'نرخ مالیات',
            status: 'unknown',
            count: 0, // از restaurant_settings خوانده می‌شود
            required: true,
            description: 'تعریف نرخ مالیات'
          }
        }
      },

      // 2️⃣ عملیات روزانه
      dailyOperations: {
        name: 'عملیات روزانه',
        status: 'unknown',
        enabled: false,
        items: {
          quickSales: {
            name: 'فروش سریع',
            status: 'active',
            count: 0,
            required: false,
            description: 'ثبت فروش سریع'
          },
          tableOrders: {
            name: 'سفارش میز',
            status: 'active',
            count: 0,
            required: false,
            description: 'ثبت سفارش برای میزها'
          },
          cashierSessions: {
            name: 'جلسات صندوق',
            status: 'active',
            count: 0,
            required: false,
            description: 'مدیریت جلسات صندوق‌دار'
          },
          dailyReports: {
            name: 'گزارش روزانه',
            status: 'active',
            count: 0,
            required: false,
            description: 'گزارشات عملکرد روزانه'
          }
        }
      },

      // 3️⃣ POS
      pos: {
        name: 'سیستم فروش',
        status: 'unknown',
        enabled: false,
        items: {
          dineIn: {
            name: 'سفارش حضوری',
            status: 'active',
            count: 0,
            required: false,
            description: 'ثبت سفارشات حضوری'
          },
          takeaway: {
            name: 'سفارش بیرون‌بر',
            status: 'active',
            count: 0,
            required: false,
            description: 'ثبت سفارشات بیرون‌بر'
          },
          delivery: {
            name: 'سفارش ارسال',
            status: 'active',
            count: 0,
            required: false,
            description: 'ثبت سفارشات ارسالی'
          },
          kitchen: {
            name: 'آشپزخانه',
            status: 'active',
            count: 0,
            required: false,
            description: 'مدیریت سفارشات آشپزخانه'
          }
        }
      },

      // 4️⃣ CRM
      crm: {
        name: 'مدیریت مشتریان',
        status: 'unknown',
        enabled: false,
        items: {
          customers: {
            name: 'مشتریان',
            status: 'active',
            count: 0,
            required: false,
            description: 'مدیریت اطلاعات مشتریان'
          },
          loyalty: {
            name: 'باشگاه مشتریان',
            status: 'active',
            count: 0,
            required: false,
            description: 'مدیریت امتیاز وفاداری'
          },
          feedback: {
            name: 'بازخورد مشتریان',
            status: 'active',
            count: 0,
            required: false,
            description: 'نظرات و بازخورد مشتریان'
          }
        }
      },

      // 5️⃣ حسابداری
      accounting: {
        name: 'حسابداری و مالی',
        status: 'unknown',
        enabled: false,
        items: {
          invoices: {
            name: 'فاکتورها',
            status: 'active',
            count: 0,
            required: false,
            description: 'مدیریت فاکتورهای فروش و خرید'
          },
          receiptsPayments: {
            name: 'دریافت و پرداخت',
            status: 'active',
            count: 0,
            required: false,
            description: 'مدیریت تراکنش‌های مالی'
          },
          cheques: {
            name: 'چک‌ها',
            status: 'active',
            count: 0,
            required: false,
            description: 'مدیریت چک‌های دریافتی و پرداختی'
          },
          financialReports: {
            name: 'گزارشات مالی',
            status: 'active',
            count: 0,
            required: false,
            description: 'گزارشات سود و زیان و ترازنامه'
          }
        }
      },

      // 6️⃣ انبارداری
      inventory: {
        name: 'انبارداری',
        status: 'unknown',
        enabled: false,
        items: {
          items: {
            name: 'موجودی',
            status: 'active',
            count: 0,
            required: false,
            description: 'مدیریت موجودی مواد اولیه'
          },
          transfers: {
            name: 'انتقالات',
            status: 'active',
            count: 0,
            required: false,
            description: 'انتقال موجودی بین انبارها'
          },
          alerts: {
            name: 'هشدارهای موجودی',
            status: 'active',
            count: 0,
            required: false,
            description: 'هشدار کمبود موجودی'
          },
          ledger: {
            name: 'دفتر کل موجودی',
            status: 'active',
            count: 0,
            required: false,
            description: 'دفتر کل ورود و خروج موجودی'
          }
        }
      },

      // 7️⃣ گزارشات
      reports: {
        name: 'گزارشات',
        status: 'unknown',
        enabled: false,
        items: {
          sales: {
            name: 'گزارشات فروش',
            status: 'active',
            count: 0,
            required: false,
            description: 'گزارشات عملکرد فروش'
          },
          inventory: {
            name: 'گزارشات موجودی',
            status: 'active',
            count: 0,
            required: false,
            description: 'گزارشات وضعیت موجودی'
          },
          customerSupplier: {
            name: 'گزارشات مشتری-تامین‌کننده',
            status: 'active',
            count: 0,
            required: false,
            description: 'گزارشات مشتریان و تامین‌کنندگان'
          },
          general: {
            name: 'گزارشات عمومی',
            status: 'active',
            count: 0,
            required: false,
            description: 'گزارشات کلی سیستم'
          },
          dashboard: {
            name: 'داشبورد مدیریتی',
            status: 'active',
            count: 0,
            required: false,
            description: 'داشبورد جامع مدیر'
          }
        }
      },

      // 8️⃣ تنظیمات
      settings: {
        name: 'تنظیمات و ابزارها',
        status: 'unknown',
        enabled: false,
        items: {
          userRoles: {
            name: 'نقش‌ها و مجوزها',
            status: 'active',
            count: 0,
            required: true,
            description: 'مدیریت دسترسی کاربران'
          },
          printers: {
            name: 'چاپگرها',
            status: 'active',
            count: await printersCollection.countDocuments({}),
            required: false,
            description: 'تنظیمات چاپگرها'
          },
          invoiceTemplates: {
            name: 'قالب فاکتور',
            status: 'active',
            count: await invoiceTemplatesCollection.countDocuments({}),
            required: false,
            description: 'طراحی قالب فاکتور'
          },
          backupRestore: {
            name: 'پشتیبان‌گیری',
            status: 'active',
            count: 0,
            required: false,
            description: 'بک‌آپ و بازیابی داده‌ها'
          },
          auditLog: {
            name: 'گزارشات Audit',
            status: 'active',
            count: 0,
            required: false,
            description: 'لاگ‌های فعالیت کاربران'
          },
          restaurant: {
            name: 'تنظیمات رستوران',
            status: 'active',
            count: 0,
            required: true,
            description: 'اطلاعات پایه رستوران'
          },
          notifications: {
            name: 'اعلان‌ها',
            status: 'active',
            count: 0,
            required: false,
            description: 'تنظیمات اعلان‌ها'
          }
        }
      }
    }

    // بررسی وضعیت هر ماژول
    for (const [moduleKey, module] of Object.entries(modules)) {
      let allReady = true
      let allEnabled = true

      for (const [itemKey, item] of Object.entries((module as any).items)) {
        // تعیین وضعیت بر اساس وجود داده
        if (item.required && item.count === 0) {
          item.status = 'not_configured'
          allReady = false
        } else if (item.count > 0 || !item.required) {
          item.status = 'ready'
        } else {
          item.status = 'unknown'
        }
      }

      // وضعیت کلی ماژول
      if (allReady && allEnabled) {
        (module as any).status = 'ready'
        (module as any).enabled = true
      } else if (allEnabled) {
        (module as any).status = 'partial'
        (module as any).enabled = true
      } else {
        (module as any).status = 'disabled'
        (module as any).enabled = false
      }
    }

    return NextResponse.json({
      success: true,
      data: modules,
      message: 'وضعیت ماژول‌های سیستم با موفقیت دریافت شد'
    })
  } catch (error) {
    console.error('Error fetching modules status:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در دریافت وضعیت ماژول‌ها',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

