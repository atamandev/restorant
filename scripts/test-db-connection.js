const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://admin:StrongPassword123@185.204.169.107:27017/restaurant?authSource=admin';
const DB_NAME = 'restaurant';

async function testConnection() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    console.log('🔌 در حال اتصال به دیتابیس آنلاین...');
    console.log(`📍 آدرس: ${MONGO_URI.replace(/:[^:@]+@/, ':****@')}`);
    
    await client.connect();
    console.log('✅ اتصال برقرار شد!');
    
    const db = client.db(DB_NAME);
    console.log(`📊 دیتابیس: ${DB_NAME}`);
    
    // تست ping
    await db.admin().ping();
    console.log('✅ Ping موفق بود!');
    
    // لیست collection ها
    const collections = await db.listCollections().toArray();
    console.log(`\n📁 تعداد Collection ها: ${collections.length}`);
    
    if (collections.length > 0) {
      console.log('\n📋 لیست Collection ها:');
      collections.slice(0, 10).forEach(col => {
        console.log(`   - ${col.name}`);
      });
      if (collections.length > 10) {
        console.log(`   ... و ${collections.length - 10} مورد دیگر`);
      }
    }
    
    // تست نوشتن یک سند تستی
    const testCollection = db.collection('_connection_test');
    const testDoc = {
      timestamp: new Date(),
      message: 'Test connection from localhost',
      status: 'success'
    };
    
    const insertResult = await testCollection.insertOne(testDoc);
    console.log(`\n✅ تست نوشتن موفق بود! (ID: ${insertResult.insertedId})`);
    
    // حذف سند تستی
    await testCollection.deleteOne({ _id: insertResult.insertedId });
    console.log('✅ سند تستی حذف شد');
    
    // تعداد سندها در چند collection مهم
    const importantCollections = ['menu_items', 'orders', 'customers', 'invoices', 'staff'];
    console.log('\n📊 تعداد سندها در Collection های مهم:');
    
    for (const colName of importantCollections) {
      try {
        const count = await db.collection(colName).countDocuments();
        console.log(`   - ${colName}: ${count} سند`);
      } catch (err) {
        console.log(`   - ${colName}: (خطا در خواندن)`);
      }
    }
    
    console.log('\n✅ همه تست‌ها موفق بودند! دیتابیس آنلاین در دسترس است.');
    
  } catch (error) {
    console.error('\n❌ خطا در اتصال به دیتابیس:');
    console.error(error.message);
    if (error.message.includes('authentication')) {
      console.error('\n⚠️  مشکل در احراز هویت! لطفاً username و password را بررسی کنید.');
    } else if (error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND')) {
      console.error('\n⚠️  مشکل در اتصال به سرور! لطفاً آدرس IP و پورت را بررسی کنید.');
    }
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n🔌 اتصال بسته شد.');
  }
}

testConnection();

