# 🔄 راهنمای همگام‌سازی منو در کل سیستم

## ✅ وضعیت فعلی

تمام بخش‌های سیستم از **یک منبع مرکزی** (`/api/menu-items`) برای دریافت محصولات استفاده می‌کنند.

## 📦 ساختار یکپارچه

### 1. **API مرکزی**
```
/api/menu-items
├── GET - دریافت همه محصولات (با فیلتر)
├── POST - ایجاد محصول جدید
├── PUT - به‌روزرسانی محصول
└── DELETE - حذف محصول
```

### 2. **Hook مشترک**
```typescript
// hooks/useMenuItems.ts
import { useMenuItems } from '@/hooks/useMenuItems'

const { menuItems, loading, error, reload } = useMenuItems({
  category: 'غذاهای اصلی',
  isAvailable: true,
  autoRefresh: true
})
```

## 🔗 بخش‌های یکپارچه شده

### ✅ **POS Pages** (همه از hook استفاده می‌کنند)
- `/pos/dine-in` - ✅ یکپارچه شده
- `/pos/takeaway` - ✅ یکپارچه شده
- `/pos/delivery` - ✅ یکپارچه شده
- `/operations/quick-sale` - ✅ یکپارچه شده

### ✅ **Menu Pages** (باید یکپارچه شوند)
- `/menu/all-items` - ✅ از `/api/menu-items` استفاده می‌کند
- `/menu/appetizers` - ⚠️ باید تبدیل شود
- `/menu/main-courses` - ⚠️ باید تبدیل شود
- `/menu/beverages` - ⚠️ باید تبدیل شود
- `/menu/desserts` - ⚠️ باید تبدیل شود

### ✅ **Onboarding**
- `/onboarding/menu-setup` - ✅ از `/api/menu-items` استفاده می‌کند

## 🔄 نحوه کار

### ایجاد محصول جدید:
```typescript
// 1. در /menu/all-items یا /onboarding/menu-setup
POST /api/menu-items
{
  name: "کباب کوبیده",
  category: "غذاهای اصلی",
  price: 120000,
  isAvailable: true,
  ...
}
```

### استفاده در POS:
```typescript
// 2. در /pos/dine-in (یا هر صفحه POS دیگر)
const { menuItems } = useMenuItems({ isAvailable: true })

// محصول جدید خودکار نمایش داده می‌شود!
```

### به‌روزرسانی قیمت:
```typescript
// 3. ویرایش محصول
PUT /api/menu-items
{
  id: "product_id",
  price: 130000  // قیمت جدید
}

// همه POS ها خودکار به‌روز می‌شوند (autoRefresh: true)
```

## 📋 API Wrapper ها (برای سازگاری)

API های قدیمی (`/api/appetizers`, `/api/main-courses`, etc.) به wrapper تبدیل شده‌اند:

```typescript
// app/api/appetizers/route.ts
export async function GET(request: NextRequest) {
  // فقط wrapper است - از menu-items استفاده می‌کند
  const menuItemsResponse = await fetch('/api/menu-items?category=پیش‌غذاها')
  const menuItems = await menuItemsResponse.json()
  return NextResponse.json(menuItems)
}
```

## 🎯 مزایا

1. ✅ **Single Source of Truth** - همه از یک جا می‌خوانند
2. ✅ **همگام‌سازی خودکار** - تغییر در یک جا، همه جا اعمال می‌شود
3. ✅ **کاهش تکرار کد** - hook مشترک
4. ✅ **سازگاری** - API های قدیمی هنوز کار می‌کنند
5. ✅ **Performance** - Caching و auto-refresh

## 🚀 استفاده

### در صفحات جدید:
```typescript
'use client'
import { useMenuItems } from '@/hooks/useMenuItems'

export default function MyPage() {
  const { menuItems, loading, error } = useMenuItems({
    category: 'غذاهای اصلی',
    isAvailable: true
  })

  if (loading) return <div>در حال بارگذاری...</div>
  if (error) return <div>خطا: {error}</div>

  return (
    <div>
      {menuItems.map(item => (
        <div key={item._id}>{item.name} - {item.price}</div>
      ))}
    </div>
  )
}
```

## ⚠️ نکات مهم

1. **همیشه از `/api/menu-items` استفاده کنید** - نه از API های جداگانه
2. **از hook `useMenuItems` استفاده کنید** - نه fetch مستقیم
3. **category ها باید یکسان باشند:**
   - `'غذاهای اصلی'`
   - `'پیش‌غذاها'`
   - `'نوشیدنی‌ها'`
   - `'دسرها'`
4. **تغییرات فوری نیست** - auto-refresh هر 30 ثانیه است (قابل تنظیم)

## 🔧 تنظیمات

در hook می‌توانید تنظیم کنید:
```typescript
useMenuItems({
  category: 'غذاهای اصلی',      // فیلتر دسته
  isAvailable: true,             // فقط موجود
  isPopular: false,             // فقط محبوب
  searchTerm: 'کباب',           // جستجو
  autoRefresh: true,            // به‌روزرسانی خودکار
  refreshInterval: 30000        // هر 30 ثانیه
})
```

---

**🎉 حالا همه محصولات در همه جا همگام هستند!**

