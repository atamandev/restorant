const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://admin:StrongPassword123@185.204.169.107:27017/restaurant?authSource=admin';
const DB_NAME = 'restaurant';

async function seedDatabase() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    console.log('🔌 در حال اتصال به دیتابیس...');
    await client.connect();
    console.log('✅ اتصال برقرار شد!');
    
    const db = client.db(DB_NAME);
    
    // لیست همه collection های مورد نیاز
    const collections = [
      // Core Collections
      'menu_items',
      'orders',
      'table_orders',
      'kitchen_orders',
      'pending_orders',
      'delivery_orders',
      'takeaway_orders',
      'dine_in_orders',
      'customers',
      'customer_loyalties',
      'customer_feedback',
      'loyalty_programs',
      'invoices',
      'staff',
      'users',
      'user_roles',
      
      // Inventory Collections
      'inventory_items',
      'inventory_balance',
      'stock_movements',
      'stock_alerts',
      'transfers',
      'warehouses',
      'inventory_counts',
      'adjustments',
      'item_ledger',
      'inventory_reservations',
      
      // Financial Collections
      'receipts_payments',
      'cashier_sessions',
      'cash_registers',
      'cheques',
      'bank_accounts',
      'bank_transactions',
      'suppliers',
      'purchases',
      'cash_flow',
      'ledgers',
      'balance_sheet',
      
      // Settings & Configuration
      'settings',
      'restaurant_settings',
      'printer_config',
      'tax_rates',
      'fee_rates',
      'invoice_templates',
      'branches',
      'tables',
      
      // Reports & Analytics
      'daily_reports',
      'daily_orders',
      'daily_transactions',
      'sales_reports',
      'general_reports',
      'financial_reports',
      'inventory_reports',
      
      // System Collections
      'audit_logs',
      'notifications',
      'events',
      'backups',
      'help_faqs',
      'help_articles',
      'help_sections'
    ];
    
    console.log(`\n📁 ایجاد ${collections.length} collection...`);
    
    // ایجاد collection ها (MongoDB خودکار ایجاد می‌کند، اما ما یک سند خالی اضافه می‌کنیم)
    for (const collectionName of collections) {
      try {
        const collection = db.collection(collectionName);
        // بررسی وجود collection
        const exists = await collection.countDocuments();
        if (exists === 0) {
          // اضافه کردن یک سند placeholder برای ایجاد collection
          await collection.insertOne({
            _placeholder: true,
            createdAt: new Date(),
            note: 'Initial collection creation'
          });
          // حذف placeholder
          await collection.deleteOne({ _placeholder: true });
          console.log(`  ✅ ${collectionName}`);
        } else {
          console.log(`  ⚠️  ${collectionName} (قبلاً وجود دارد - ${exists} سند)`);
        }
      } catch (error) {
        console.error(`  ❌ خطا در ایجاد ${collectionName}:`, error.message);
      }
    }
    
    console.log('\n📊 اضافه کردن داده‌های اولیه...\n');
    
    // 1. Restaurant Settings
    console.log('1️⃣  تنظیمات رستوران...');
    const restaurantSettings = db.collection('restaurant_settings');
    const existingSettings = await restaurantSettings.findOne({});
    if (!existingSettings) {
      await restaurantSettings.insertOne({
        basicInfo: {
          name: 'رستوران سنتی ایرانی',
          description: 'رستوران سنتی با غذاهای اصیل ایرانی',
          address: 'تهران، خیابان ولیعصر',
          phone: '021-12345678',
          email: 'info@restaurant.com',
          website: 'www.restaurant.com',
          logo: ''
        },
        businessHours: {
          saturday: { open: '12:00', close: '23:00', isOpen: true },
          sunday: { open: '12:00', close: '23:00', isOpen: true },
          monday: { open: '12:00', close: '23:00', isOpen: true },
          tuesday: { open: '12:00', close: '23:00', isOpen: true },
          wednesday: { open: '12:00', close: '23:00', isOpen: true },
          thursday: { open: '12:00', close: '23:00', isOpen: true },
          friday: { open: '12:00', close: '23:00', isOpen: true }
        },
        financial: {
          currency: 'تومان',
          taxRate: 9,
          serviceCharge: 10,
          discountLimit: 20,
          minimumOrder: 50000,
          goldenCustomerDiscount: 15
        },
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('  ✅ تنظیمات رستوران اضافه شد');
    } else {
      console.log('  ⚠️  تنظیمات رستوران قبلاً وجود دارد');
    }
    
    // 2. User Roles
    console.log('\n2️⃣  نقش‌های کاربری...');
    const userRoles = db.collection('user_roles');
    const roles = [
      { name: 'admin', label: 'مدیر', permissions: ['*'], isActive: true },
      { name: 'manager', label: 'مدیر فروش', permissions: ['orders', 'customers', 'reports'], isActive: true },
      { name: 'cashier', label: 'صندوقدار', permissions: ['orders', 'invoices'], isActive: true },
      { name: 'waiter', label: 'گارسون', permissions: ['orders'], isActive: true },
      { name: 'chef', label: 'آشپز', permissions: ['kitchen_orders'], isActive: true }
    ];
    for (const role of roles) {
      const exists = await userRoles.findOne({ name: role.name });
      if (!exists) {
        await userRoles.insertOne({ ...role, createdAt: new Date() });
        console.log(`  ✅ نقش ${role.label} اضافه شد`);
      }
    }
    
    // 3. Users
    console.log('\n3️⃣  کاربران...');
    const users = db.collection('users');
    const adminUser = await users.findOne({ username: 'admin' });
    if (!adminUser) {
      await users.insertOne({
        username: 'admin',
        password: 'admin123', // در production باید hash شود
        role: 'admin',
        fullName: 'مدیر سیستم',
        email: 'admin@restaurant.com',
        phone: '09123456789',
        isActive: true,
        createdAt: new Date()
      });
      console.log('  ✅ کاربر admin اضافه شد (username: admin, password: admin123)');
    } else {
      console.log('  ⚠️  کاربر admin قبلاً وجود دارد');
    }
    
    // 4. Branches
    console.log('\n4️⃣  شعبه‌ها...');
    const branches = db.collection('branches');
    const defaultBranch = await branches.findOne({});
    if (!defaultBranch) {
      await branches.insertOne({
        name: 'شعبه مرکزی',
        address: 'تهران، خیابان ولیعصر',
        phone: '021-12345678',
        manager: 'مدیر شعبه',
        isActive: true,
        createdAt: new Date()
      });
      console.log('  ✅ شعبه مرکزی اضافه شد');
    } else {
      console.log('  ⚠️  شعبه قبلاً وجود دارد');
    }
    
    // 5. Tables
    console.log('\n5️⃣  میزها...');
    const tables = db.collection('tables');
    const tableCount = await tables.countDocuments();
    if (tableCount === 0) {
      const tableData = [];
      for (let i = 1; i <= 20; i++) {
        tableData.push({
          number: i.toString(),
          capacity: i <= 10 ? 4 : 6,
          status: 'available',
          branchId: null,
          isActive: true,
          createdAt: new Date()
        });
      }
      await tables.insertMany(tableData);
      console.log(`  ✅ ${tableData.length} میز اضافه شد`);
    } else {
      console.log(`  ⚠️  ${tableCount} میز قبلاً وجود دارد`);
    }
    
    // 6. Menu Items
    console.log('\n6️⃣  آیتم‌های منو...');
    const menuItems = db.collection('menu_items');
    const menuCount = await menuItems.countDocuments();
    if (menuCount === 0) {
      const sampleMenuItems = [
        {
          name: 'کباب کوبیده',
          description: 'کباب کوبیده با برنج و کره',
          price: 150000,
          category: 'غذاهای اصلی',
          isAvailable: true,
          isPopular: true,
          preparationTime: 25,
          rating: 4.8,
          image: '',
          createdAt: new Date()
        },
        {
          name: 'جوجه کباب',
          description: 'جوجه کباب با برنج و کره',
          price: 140000,
          category: 'غذاهای اصلی',
          isAvailable: true,
          isPopular: true,
          preparationTime: 20,
          rating: 4.7,
          image: '',
          createdAt: new Date()
        },
        {
          name: 'قورمه سبزی',
          description: 'قورمه سبزی با برنج',
          price: 120000,
          category: 'غذاهای اصلی',
          isAvailable: true,
          isPopular: false,
          preparationTime: 30,
          rating: 4.5,
          image: '',
          createdAt: new Date()
        },
        {
          name: 'نوشابه',
          description: 'نوشابه گازدار',
          price: 15000,
          category: 'نوشیدنی‌ها',
          isAvailable: true,
          isPopular: true,
          preparationTime: 0,
          rating: 4.0,
          image: '',
          createdAt: new Date()
        },
        {
          name: 'دوغ',
          description: 'دوغ محلی',
          price: 20000,
          category: 'نوشیدنی‌ها',
          isAvailable: true,
          isPopular: false,
          preparationTime: 0,
          rating: 4.2,
          image: '',
          createdAt: new Date()
        },
        {
          name: 'بستنی',
          description: 'بستنی وانیلی',
          price: 30000,
          category: 'دسرها',
          isAvailable: true,
          isPopular: true,
          preparationTime: 5,
          rating: 4.6,
          image: '',
          createdAt: new Date()
        },
        {
          name: 'سالاد فصل',
          description: 'سالاد فصل با سس',
          price: 40000,
          category: 'پیش‌غذا',
          isAvailable: true,
          isPopular: false,
          preparationTime: 10,
          rating: 4.3,
          image: '',
          createdAt: new Date()
        }
      ];
      await menuItems.insertMany(sampleMenuItems);
      console.log(`  ✅ ${sampleMenuItems.length} آیتم منو اضافه شد`);
    } else {
      console.log(`  ⚠️  ${menuCount} آیتم منو قبلاً وجود دارد`);
    }
    
    // 7. Staff
    console.log('\n7️⃣  پرسنل...');
    const staff = db.collection('staff');
    const staffCount = await staff.countDocuments();
    if (staffCount === 0) {
      const sampleStaff = [
        {
          name: 'علی احمدی',
          role: 'waiter',
          phone: '09123456789',
          email: 'ali@restaurant.com',
          salary: 5000000,
          isActive: true,
          createdAt: new Date()
        },
        {
          name: 'مریم رضایی',
          role: 'cashier',
          phone: '09123456790',
          email: 'maryam@restaurant.com',
          salary: 6000000,
          isActive: true,
          createdAt: new Date()
        },
        {
          name: 'حسین کریمی',
          role: 'chef',
          phone: '09123456791',
          email: 'hossein@restaurant.com',
          salary: 8000000,
          isActive: true,
          createdAt: new Date()
        }
      ];
      await staff.insertMany(sampleStaff);
      console.log(`  ✅ ${sampleStaff.length} پرسنل اضافه شد`);
    } else {
      console.log(`  ⚠️  ${staffCount} پرسنل قبلاً وجود دارد`);
    }
    
    // 8. Tax Rates
    console.log('\n8️⃣  نرخ مالیات...');
    const taxRates = db.collection('tax_rates');
    const taxCount = await taxRates.countDocuments();
    if (taxCount === 0) {
      await taxRates.insertOne({
        name: 'مالیات بر ارزش افزوده',
        rate: 9,
        isActive: true,
        createdAt: new Date()
      });
      console.log('  ✅ نرخ مالیات اضافه شد');
    } else {
      console.log('  ⚠️  نرخ مالیات قبلاً وجود دارد');
    }
    
    // 9. Printer Config
    console.log('\n9️⃣  تنظیمات چاپگر...');
    const printerConfig = db.collection('printer_config');
    const printerCount = await printerConfig.countDocuments();
    if (printerCount === 0) {
      await printerConfig.insertOne({
        receiptPrinter: 'none',
        kitchenPrinter: 'none',
        printType: 'laser',
        isActive: true,
        createdAt: new Date()
      });
      console.log('  ✅ تنظیمات چاپگر اضافه شد');
    } else {
      console.log('  ⚠️  تنظیمات چاپگر قبلاً وجود دارد');
    }
    
    // 10. Inventory Items (نمونه)
    console.log('\n🔟 آیتم‌های موجودی...');
    const inventoryItems = db.collection('inventory_items');
    const inventoryCount = await inventoryItems.countDocuments();
    if (inventoryCount === 0) {
      const sampleInventory = [
        {
          name: 'گوشت گوسفند',
          category: 'مواد اولیه',
          unit: 'کیلوگرم',
          currentStock: 50,
          minStock: 20,
          maxStock: 100,
          cost: 500000,
          isActive: true,
          createdAt: new Date()
        },
        {
          name: 'برنج',
          category: 'مواد اولیه',
          unit: 'کیلوگرم',
          currentStock: 200,
          minStock: 50,
          maxStock: 500,
          cost: 150000,
          isActive: true,
          createdAt: new Date()
        },
        {
          name: 'نوشابه',
          category: 'نوشیدنی',
          unit: 'عدد',
          currentStock: 100,
          minStock: 30,
          maxStock: 200,
          cost: 10000,
          isActive: true,
          createdAt: new Date()
        }
      ];
      await inventoryItems.insertMany(sampleInventory);
      console.log(`  ✅ ${sampleInventory.length} آیتم موجودی اضافه شد`);
    } else {
      console.log(`  ⚠️  ${inventoryCount} آیتم موجودی قبلاً وجود دارد`);
    }
    
    // 11. Suppliers
    console.log('\n1️⃣1️⃣  تامین‌کنندگان...');
    const suppliers = db.collection('suppliers');
    const supplierCount = await suppliers.countDocuments();
    if (supplierCount === 0) {
      const sampleSuppliers = [
        {
          name: 'تامین‌کننده مواد غذایی',
          contactPerson: 'احمد محمدی',
          phone: '021-12345678',
          email: 'supplier1@example.com',
          address: 'تهران',
          isActive: true,
          createdAt: new Date()
        }
      ];
      await suppliers.insertMany(sampleSuppliers);
      console.log(`  ✅ ${sampleSuppliers.length} تامین‌کننده اضافه شد`);
    } else {
      console.log(`  ⚠️  ${supplierCount} تامین‌کننده قبلاً وجود دارد`);
    }
    
    // 12. Cash Registers
    console.log('\n1️⃣2️⃣  صندوق‌ها...');
    const cashRegisters = db.collection('cash_registers');
    const cashRegisterCount = await cashRegisters.countDocuments();
    if (cashRegisterCount === 0) {
      await cashRegisters.insertOne({
        name: 'صندوق اصلی',
        branchId: null,
        initialBalance: 1000000,
        currentBalance: 1000000,
        isActive: true,
        createdAt: new Date()
      });
      console.log('  ✅ صندوق اصلی اضافه شد');
    } else {
      console.log(`  ⚠️  ${cashRegisterCount} صندوق قبلاً وجود دارد`);
    }
    
    // 13. Warehouses
    console.log('\n1️⃣3️⃣  انبارها...');
    const warehouses = db.collection('warehouses');
    const warehouseCount = await warehouses.countDocuments();
    if (warehouseCount === 0) {
      await warehouses.insertOne({
        name: 'انبار اصلی',
        address: 'تهران',
        manager: 'مدیر انبار',
        isActive: true,
        createdAt: new Date()
      });
      console.log('  ✅ انبار اصلی اضافه شد');
    } else {
      console.log(`  ⚠️  ${warehouseCount} انبار قبلاً وجود دارد`);
    }
    
    console.log('\n✅ همه داده‌های اولیه با موفقیت اضافه شدند!');
    console.log('\n📊 خلاصه:');
    console.log(`  - ${collections.length} collection ایجاد شد`);
    console.log(`  - داده‌های اولیه اضافه شد`);
    console.log('\n🔑 اطلاعات ورود:');
    console.log('  Username: admin');
    console.log('  Password: admin123');
    
  } catch (error) {
    console.error('\n❌ خطا در seed کردن دیتابیس:', error);
    throw error;
  } finally {
    await client.close();
    console.log('\n🔌 اتصال بسته شد.');
  }
}

// اجرای seed
seedDatabase()
  .then(() => {
    console.log('\n✅ Seed با موفقیت انجام شد!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ خطا در seed:', error);
    process.exit(1);
  });

