// Script to display localhost URLs
const PORT = process.env.PORT || 3000
const BASE_URL = `http://localhost:${PORT}`

// URLs to display
const urls = {
  main: {
    title: '🌐 سایت اصلی (Dashboard)',
    url: `${BASE_URL}/`,
    description: 'داشبورد مدیریت رستوران - نیاز به لاگین دارد'
  },
  login: {
    title: '🔐 صفحه ورود',
    url: `${BASE_URL}/login`,
    description: 'ورود به پنل مدیریت (admin / 123456)'
  },
  order: {
    title: '📱 صفحه سفارش‌دهی مشتریان (QR Code)',
    url: `${BASE_URL}/order`,
    description: 'صفحه سفارش آنلاین برای مشتریان - بدون نیاز به لاگین'
  }
}

// Function to display URLs
function displayUrls() {
  console.log('\n')
  console.log('═'.repeat(70))
  console.log('🚀 سرور در حال اجرا است!')
  console.log('═'.repeat(70))
  console.log('\n')
  
  console.log('📋 لینک‌های دسترسی:\n')
  
  Object.values(urls).forEach((item, index) => {
    console.log(`${index + 1}. ${item.title}`)
    console.log(`   🔗 ${item.url}`)
    console.log(`   📝 ${item.description}`)
    console.log('')
  })
  
  console.log('═'.repeat(70))
  console.log('\n')
  console.log('💡 نکته: برای توقف سرور، Ctrl+C را فشار دهید\n')
}

// Display URLs
displayUrls()
