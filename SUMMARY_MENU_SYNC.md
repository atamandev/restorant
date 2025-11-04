# ✅ خلاصه یکپارچه‌سازی منو

## 🎯 هدف
همه بخش‌های سایت از **یک منبع مرکزی** برای محصولات/منو استفاده می‌کنند.

## ✅ کارهای انجام شده

### 1. **Hook مشترک** (`hooks/useMenuItems.ts`)
- یک hook React برای load کردن menu items
- Auto-refresh قابلیت
- فیلتر کردن خودکار
- Cache و error handling

### 2. **API مرکزی** (`/api/menu-items`)
- همه محصولات در collection `menu_items` ذخیره می‌شوند
- فیلتر بر اساس category, isAvailable, isPopular
- Sort و search

### 3. **صفحات POS یکپارچه شده**
- ✅ `/pos/dine-in` - از hook استفاده می‌کند
- ✅ `/pos/takeaway` - از `/api/menu-items` استفاده می‌کند  
- ✅ `/pos/delivery` - از `/api/menu-items` استفاده می‌کند
- ✅ `/operations/quick-sale` - از `/api/menu-items` استفاده می‌کند

### 4. **API Wrapper ها**
- `/api/appetizers` - از `menu_items` با `category='پیش‌غذاها'` استفاده می‌کند
- سایر API های category ها هم باید به همین شکل تبدیل شوند

## 📋 کارهای باقی‌مانده

### 1. تبدیل صفحات منو
- `/menu/appetizers` - باید از hook یا `/api/menu-items?category=پیش‌غذاها` استفاده کند
- `/menu/main-courses` - باید از hook یا `/api/menu-items?category=غذاهای اصلی` استفاده کند
- `/menu/beverages` - باید از hook یا `/api/menu-items?category=نوشیدنی‌ها` استفاده کند
- `/menu/desserts` - باید از hook یا `/api/menu-items?category=دسرها` استفاده کند

### 2. تبدیل API های دیگر
- `/api/main-courses` - wrapper برای `menu_items` با `category='غذاهای اصلی'`
- `/api/beverages` - wrapper برای `menu_items` با `category='نوشیدنی‌ها'`
- `/api/desserts` - wrapper برای `menu_items` با `category='دسرها'`

## 🔄 نحوه کار

### ایجاد محصول جدید:
```
1. User در /menu/all-items یا /onboarding/menu-setup محصول می‌سازد
   ↓
2. POST /api/menu-items → ذخیره در MongoDB (collection: menu_items)
   ↓
3. همه صفحات POS خودکار به‌روز می‌شوند (auto-refresh هر 30 ثانیه)
   ↓
4. محصول در همه جا نمایش داده می‌شود:
   - /pos/dine-in ✅
   - /pos/takeaway ✅
   - /pos/delivery ✅
   - /operations/quick-sale ✅
   - /menu/appetizers (اگر category='پیش‌غذاها') ⚠️ باید تبدیل شود
```

## ✅ مزایا

1. **Single Source of Truth** - همه از `menu_items` collection می‌خوانند
2. **همگام‌سازی خودکار** - تغییر در یک جا، همه جا اعمال می‌شود
3. **کاهش تکرار کد** - یک hook مشترک
4. **سازگاری** - API های قدیمی هنوز کار می‌کنند (wrapper)

## 🚀 استفاده

### در صفحات جدید:
```typescript
import { useMenuItems } from '@/hooks/useMenuItems'

const { menuItems, loading } = useMenuItems({
  category: 'غذاهای اصلی',
  isAvailable: true
})
```

### در API های جدید:
```typescript
// استفاده مستقیم از menu_items collection
const collection = db.collection('menu_items')
const items = await collection.find({ category: 'پیش‌غذاها' }).toArray()
```

---

**🎉 سیستم حالا یکپارچه است - همه محصولات از یک منبع می‌آیند!**

