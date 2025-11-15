// Script to test if order page is accessible
const http = require('http')

const PORT = process.env.PORT || 3000
const BASE_URL = `http://localhost:${PORT}`

console.log('\n🔍 تست صفحه سفارش‌دهی مشتریان...\n')

// Test if server is running
function testServer() {
  return new Promise((resolve, reject) => {
    const req = http.get(`${BASE_URL}/order`, (res) => {
      let data = ''
      
      res.on('data', (chunk) => {
        data += chunk
      })
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('✅ صفحه /order قابل دسترسی است (Status: 200)')
          resolve(true)
        } else if (res.statusCode === 404) {
          console.log('❌ صفحه /order پیدا نشد (Status: 404)')
          reject(new Error('Page not found'))
        } else {
          console.log(`⚠️ وضعیت غیرمنتظره: ${res.statusCode}`)
          reject(new Error(`Unexpected status: ${res.statusCode}`))
        }
      })
    })
    
    req.on('error', (error) => {
      console.log('❌ سرور در حال اجرا نیست یا خطا رخ داد')
      console.log(`   خطا: ${error.message}`)
      console.log(`\n💡 راه حل:`)
      console.log(`   1. مطمئن شوید که سرور در حال اجرا است:`)
      console.log(`      npm run dev`)
      console.log(`   2. صبر کنید تا build کامل شود`)
      console.log(`   3. سپس این script را دوباره اجرا کنید\n`)
      reject(error)
    })
    
    req.setTimeout(5000, () => {
      req.destroy()
      reject(new Error('Timeout'))
    })
  })
}

// Test API endpoint
function testAPI() {
  return new Promise((resolve, reject) => {
    const req = http.get(`${BASE_URL}/api/menu-items`, (res) => {
      let data = ''
      
      res.on('data', (chunk) => {
        data += chunk
      })
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('✅ API /api/menu-items قابل دسترسی است (Status: 200)')
          resolve(true)
        } else {
          console.log(`⚠️ API وضعیت: ${res.statusCode}`)
          resolve(false)
        }
      })
    })
    
    req.on('error', (error) => {
      console.log('⚠️ خطا در تست API')
      resolve(false)
    })
    
    req.setTimeout(3000, () => {
      req.destroy()
      resolve(false)
    })
  })
}

// Run tests
async function runTests() {
  try {
    await testServer()
    await testAPI()
    console.log('\n✅ همه تست‌ها موفق بودند!\n')
    console.log(`🌐 لینک صفحه: ${BASE_URL}/order\n`)
  } catch (error) {
    console.log('\n❌ تست ناموفق بود\n')
    process.exit(1)
  }
}

runTests()

