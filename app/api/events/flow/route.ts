import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://restorenUser:1234@localhost:27017/restoren'
const DB_NAME = 'restoren'

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

// GET - نمایش جریان کار یک مثال ساده (پیتزای مخصوص)
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()
    
    const { searchParams } = new URL(request.url)
    const example = searchParams.get('example') || 'pizza' // pizza, coffee, delivery

    // مثال: فروش یک پیتزای مخصوص
    const flow = {
      scenario: example === 'pizza' ? 'فروش پیتزای مخصوص' : 
                example === 'coffee' ? 'فروش قهوه' : 
                'سفارش ارسال غذا',
      steps: []
    }

    if (example === 'pizza') {
      flow.steps = [
        {
          step: 1,
          module: 'Setup',
          name: 'اطلاعات پایه',
          description: 'POS اطلاعات پایه را از Setup می‌گیرد',
          apis: ['/api/branches', '/api/cash-registers', '/api/menu-items', '/api/tax-rates'],
          data: {
            branchId: 'از Setup → branches',
            cashRegisterId: 'از Setup → cash_registers',
            menuItem: {
              id: 'pizza_makhsoos',
              name: 'پیتزای مخصوص',
              price: 150000,
              recipe: [
                { ingredientId: 'dough', quantity: 250, unit: 'گرم' },
                { ingredientId: 'cheese', quantity: 100, unit: 'گرم' },
                { ingredientId: 'tomato', quantity: 50, unit: 'گرم' }
              ]
            },
            taxRate: '9% از Setup → tax_rates'
          },
          dependencies: []
        },
        {
          step: 2,
          module: 'POS',
          name: 'ثبت سفارش',
          description: 'گارسون یا صندوق‌دار سفارش را در POS ثبت می‌کند',
          apis: ['/api/dine-in-orders (POST)'],
          data: {
            tableNumber: 5,
            items: [{ menuItemId: 'pizza_makhsoos', quantity: 1, price: 150000 }],
            branchId: 'branch_001',
            cashRegisterId: 'register_001',
            customerId: 'customer_123'
          },
          dependencies: ['Setup'],
          triggers: ['Kitchen', 'Accounting (pending)', 'Inventory (pending)', 'Customers (pending)']
        },
        {
          step: 3,
          module: 'Kitchen',
          name: 'ارسال به آشپزخانه',
          description: 'POS به Kitchen می‌گوید: "یک پیتزای مخصوص سفارش داده شد"',
          apis: ['/api/kitchen-orders (POST)'],
          data: {
            orderId: 'order_456',
            items: [{ name: 'پیتزای مخصوص', quantity: 1 }],
            status: 'preparing',
            estimatedTime: '20 دقیقه'
          },
          dependencies: ['POS'],
          triggers: ['Inventory (when ready)']
        },
        {
          step: 4,
          module: 'Kitchen',
          name: 'آماده‌سازی',
          description: 'آشپز غذا را آماده می‌کند و وضعیت را تغییر می‌دهد',
          apis: ['/api/kitchen-orders/[id] (PUT)'],
          data: {
            status: 'preparing → ready',
            preparedAt: new Date().toISOString()
          },
          dependencies: ['Kitchen (step 3)'],
          triggers: ['POS (notify customer)']
        },
        {
          step: 5,
          module: 'POS',
          name: 'پرداخت',
          description: 'مشتری پرداخت می‌کند (نقدی یا کارتی)',
          apis: ['/api/dine-in-orders/[id] (PUT) - status: paid'],
          data: {
            paymentMethod: 'cash',
            paidAmount: 150000,
            status: 'paid'
          },
          dependencies: ['POS (step 2)', 'Kitchen (step 4)'],
          triggers: ['Accounting (create invoice)', 'Inventory (deduct stock)', 'Customers (update loyalty)']
        },
        {
          step: 6,
          module: 'Accounting',
          name: 'ثبت فاکتور فروش',
          description: 'Accounting فاکتور فروش را ثبت می‌کند',
          apis: ['/api/invoices (POST)'],
          data: {
            type: 'sales',
            invoiceNumber: 'SINV-20241215-0001',
            orderId: 'order_456',
            items: [{ name: 'پیتزای مخصوص', quantity: 1, price: 150000 }],
            subtotal: 150000,
            taxAmount: 13500,
            totalAmount: 163500,
            paymentMethod: 'cash',
            status: 'paid'
          },
          dependencies: ['POS (step 5)'],
          triggers: ['Inventory (deduct stock)', 'Receipts/Payments (record transaction)']
        },
        {
          step: 7,
          module: 'Inventory',
          name: 'کاهش موجودی',
          description: 'Inventory بر اساس recipe، مواد اولیه را از انبار کم می‌کند',
          apis: ['/api/item-ledger (POST)', '/api/inventory-items/[id] (PUT)'],
          data: {
            deductions: [
              { itemId: 'dough', quantity: 250, unit: 'گرم' },
              { itemId: 'cheese', quantity: 100, unit: 'گرم' },
              { itemId: 'tomato', quantity: 50, unit: 'گرم' }
            ],
            documentType: 'sale',
            documentId: 'invoice_789'
          },
          dependencies: ['Accounting (step 6)'],
          triggers: ['Stock Alerts (if low stock)', 'Reports (inventory reports)']
        },
        {
          step: 8,
          module: 'Customers (CRM)',
          name: 'به‌روزرسانی امتیاز وفاداری',
          description: 'Customers امتیاز وفاداری مشتری را افزایش می‌دهد',
          apis: ['/api/customer-loyalties (PUT)'],
          data: {
            customerId: 'customer_123',
            pointsEarned: 163, // 163,500 تومان / 1000 = 163 امتیاز
            totalPoints: 1163,
            currentTier: 'Silver'
          },
          dependencies: ['Accounting (step 6)'],
          triggers: ['Reports (loyal customers report)']
        },
        {
          step: 9,
          module: 'Reports',
          name: 'ثبت در گزارشات',
          description: 'Reports اطلاعات را برای داشبورد جمع می‌کند',
          apis: ['/api/dashboard', '/api/sales-reports', '/api/reports/top-menu-items'],
          data: {
            todaySales: '+163,500 تومان',
            topItems: ['پیتزای مخصوص: +1'],
            loyalCustomers: ['customer_123: +163 امتیاز']
          },
          dependencies: ['Accounting', 'Inventory', 'Customers'],
          triggers: []
        },
        {
          step: 10,
          module: 'Operations',
          name: 'بستن صندوق (در پایان روز)',
          description: 'صندوق‌دار صندوق را می‌بندد و موجودی نقد را با حسابداری تطبیق می‌دهد',
          apis: ['/api/cashier-sessions/[id]/close (POST)'],
          data: {
            sessionId: 'session_001',
            expectedCash: 500000,
            actualCash: 500000,
            cashDifference: 0,
            totalSales: 1500000,
            status: 'closed'
          },
          dependencies: ['Accounting (all invoices of the day)'],
          triggers: ['Reports (daily report)']
        }
      ]
    }

    // محاسبه وابستگی‌ها
    const dependencies = {
      'Setup': 'پایه - همه ماژول‌ها به آن وابسته‌اند',
      'POS': 'مرکز رویدادها - همه چیز از فروش شروع می‌شود',
      'Kitchen': 'از POS دستور می‌گیرد',
      'Accounting': 'هر رویداد فروش یا خرید را مصرف می‌کند',
      'Inventory': 'هر رویداد فروش یا خرید موجودی را به‌روز می‌کند',
      'Customers': 'اطلاعات مشتری را به فروش و گزارشات می‌دهد',
      'Reports': 'همه داده‌ها را از بقیه جمع می‌کند',
      'Settings': 'همه اینها را تنظیم و محافظت می‌کند'
    }

    return NextResponse.json({
      success: true,
      data: {
        ...flow,
        dependencies,
        diagram: {
          setup: ['→ POS', '→ Operations', '→ Reports'],
          pos: ['→ Kitchen', '→ Accounting', '→ Inventory', '→ Customers', '→ Reports'],
          kitchen: ['← POS', '→ POS (when ready)'],
          accounting: ['← POS', '→ Inventory', '→ Reports', '→ Operations'],
          inventory: ['← Accounting', '← POS', '→ Reports'],
          customers: ['← POS', '→ Reports'],
          reports: ['← POS', '← Accounting', '← Inventory', '← Customers'],
          settings: ['→ همه ماژول‌ها (دسترسی و تنظیمات)']
        },
        summary: {
          totalSteps: flow.steps.length,
          modules: [...new Set(flow.steps.map((s: any) => s.module))],
          apis: flow.steps.flatMap((s: any) => s.apis || []),
          userAction: 'یک کلیک: ثبت سفارش → پرداخت',
          backendActions: 'ده‌ها API از ماژول‌های مختلف هماهنگ کار می‌کنند'
        }
      },
      message: 'جریان کار با موفقیت دریافت شد'
    })
  } catch (error) {
    console.error('Error fetching flow:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در دریافت جریان کار',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

