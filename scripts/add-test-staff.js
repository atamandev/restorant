const { MongoClient, ObjectId } = require('mongodb')

const MONGO_URI = process.env.MONGO_URI || 'mongodb://restorenUser:1234@localhost:27017/restoren'
const DB_NAME = 'restoren'
const COLLECTION_NAME = 'staff'

async function addTestStaff() {
  const client = new MongoClient(MONGO_URI)
  
  try {
    await client.connect()
    const db = client.db(DB_NAME)
    const staffCollection = db.collection(COLLECTION_NAME)
    
    // کارکنان تستی
    const testStaff = [
      {
        name: 'علی احمدی',
        email: 'ali.ahmadi@test.com',
        phone: '09123456789',
        position: 'گارسون',
        department: 'سرویس',
        hireDate: new Date().toISOString().split('T')[0],
        salary: 5000000,
        status: 'active',
        permissions: ['orders'],
        address: 'تهران، خیابان ولیعصر',
        notes: 'کارمند تستی - گارسون',
        performance: {
          rating: 4.5,
          totalOrders: 0,
          totalSales: 0,
          customerSatisfaction: 0
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'مریم رضایی',
        email: 'maryam.rezaei@test.com',
        phone: '09123456790',
        position: 'آشپز',
        department: 'آشپزخانه',
        hireDate: new Date().toISOString().split('T')[0],
        salary: 6000000,
        status: 'active',
        permissions: ['inventory'],
        address: 'تهران، خیابان انقلاب',
        notes: 'کارمند تستی - آشپز',
        performance: {
          rating: 4.8,
          totalOrders: 0,
          totalSales: 0,
          customerSatisfaction: 0
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'حسین محمدی',
        email: 'hossein.mohammadi@test.com',
        phone: '09123456791',
        position: 'صندوقدار',
        department: 'مالی',
        hireDate: new Date().toISOString().split('T')[0],
        salary: 5500000,
        status: 'active',
        permissions: ['orders', 'financial'],
        address: 'تهران، خیابان آزادی',
        notes: 'کارمند تستی - صندوقدار',
        performance: {
          rating: 4.2,
          totalOrders: 0,
          totalSales: 0,
          customerSatisfaction: 0
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'فاطمه کریمی',
        email: 'fateme.karimi@test.com',
        phone: '09123456792',
        position: 'مدیر رستوران',
        department: 'مدیریت',
        hireDate: new Date().toISOString().split('T')[0],
        salary: 8000000,
        status: 'active',
        permissions: ['admin', 'orders', 'inventory', 'reports', 'staff', 'customers', 'financial'],
        address: 'تهران، خیابان ولیعصر',
        notes: 'کارمند تستی - مدیر',
        performance: {
          rating: 5.0,
          totalOrders: 0,
          totalSales: 0,
          customerSatisfaction: 0
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'رضا نوری',
        email: 'reza.nouri@test.com',
        phone: '09123456793',
        position: 'کمک آشپز',
        department: 'آشپزخانه',
        hireDate: new Date().toISOString().split('T')[0],
        salary: 4500000,
        status: 'active',
        permissions: ['inventory'],
        address: 'تهران، خیابان جمهوری',
        notes: 'کارمند تستی - کمک آشپز',
        performance: {
          rating: 4.0,
          totalOrders: 0,
          totalSales: 0,
          customerSatisfaction: 0
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]
    
    // بررسی که آیا کارکنان تستی قبلاً اضافه شده‌اند
    const existingEmails = testStaff.map(s => s.email)
    const existing = await staffCollection.find({ email: { $in: existingEmails } }).toArray()
    
    if (existing.length > 0) {
      console.log(`⚠️  ${existing.length} کارمند تستی قبلاً وجود دارد.`)
      console.log('کارکنان موجود:')
      existing.forEach(s => {
        console.log(`  - ${s.name} (${s.email})`)
      })
      
      // حذف کارکنان تستی قبلی
      const deleteResult = await staffCollection.deleteMany({ email: { $in: existingEmails } })
      console.log(`\n🗑️  ${deleteResult.deletedCount} کارمند تستی قبلی حذف شد.`)
    }
    
    // اضافه کردن کارکنان تستی جدید
    const result = await staffCollection.insertMany(testStaff)
    console.log(`\n✅ ${result.insertedCount} کارمند تستی با موفقیت اضافه شد:`)
    testStaff.forEach((staff, index) => {
      console.log(`  ${index + 1}. ${staff.name} - ${staff.position} (${staff.department})`)
    })
    
    // نمایش تعداد کل کارکنان
    const totalCount = await staffCollection.countDocuments({})
    console.log(`\n📊 تعداد کل کارکنان در دیتابیس: ${totalCount}`)
    
  } catch (error) {
    console.error('❌ خطا در اضافه کردن کارکنان تستی:', error)
    throw error
  } finally {
    await client.close()
  }
}

// اجرای اسکریپت
addTestStaff()
  .then(() => {
    console.log('\n✅ اسکریپت با موفقیت اجرا شد!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ خطا در اجرای اسکریپت:', error)
    process.exit(1)
  })

