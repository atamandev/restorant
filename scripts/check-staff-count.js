const { MongoClient } = require('mongodb')

const MONGO_URI = process.env.MONGO_URI || 'mongodb://admin:StrongPassword123@185.204.169.107:27017/restaurant?authSource=admin'
const DB_NAME = 'restaurant'
const COLLECTION_NAME = 'staff'

async function checkStaffCount() {
  const client = new MongoClient(MONGO_URI)
  
  try {
    await client.connect()
    const db = client.db(DB_NAME)
    const staffCollection = db.collection(COLLECTION_NAME)
    
    const totalCount = await staffCollection.countDocuments({})
    const activeCount = await staffCollection.countDocuments({ status: 'active' })
    const staffList = await staffCollection.find({}).toArray()
    
    console.log('\n=== بررسی کارکنان در دیتابیس ===\n')
    console.log(`📊 تعداد کل کارکنان: ${totalCount}`)
    console.log(`✅ کارکنان فعال: ${activeCount}`)
    console.log(`\n📋 لیست کارکنان:\n`)
    
    staffList.forEach((staff, index) => {
      console.log(`${index + 1}. ${staff.name}`)
      console.log(`   - سمت: ${staff.position}`)
      console.log(`   - بخش: ${staff.department}`)
      console.log(`   - ایمیل: ${staff.email}`)
      console.log(`   - وضعیت: ${staff.status}`)
      console.log('')
    })
    
    console.log('=== بررسی همگام‌سازی ===\n')
    console.log('✅ اگر در هر دو صفحه زیر همین تعداد کارکنان نمایش داده می‌شود، همگام‌سازی درست است:')
    console.log('   1. http://localhost:3000/onboarding/people-setup (فیلتر "کارکنان")')
    console.log('   2. http://localhost:3000/settings/staff')
    
  } catch (error) {
    console.error('❌ خطا در بررسی کارکنان:', error)
    throw error
  } finally {
    await client.close()
  }
}

checkStaffCount()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ خطا:', error)
    process.exit(1)
  })

