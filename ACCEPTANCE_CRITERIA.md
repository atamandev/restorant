# معیارهای پذیرش (Acceptance Criteria)

این سند معیارهای پذیرش برای سیستم مدیریت موجودی را مستند می‌کند.

## ✅ سناریو 1: افزودن کالا در انبار «تایماز»

**شرح**: افزودن کالا در انبار «تایماز» → حرکت INITIAL ایجاد می‌شود، موجودی انبار تایماز افزایش می‌یابد، در صفحه انبار همان کالا با موجودی صحیح دیده می‌شود.

**پیاده‌سازی**:
- ✅ در `app/onboarding/initial-inventory/page.tsx` (خط 404-414): بعد از ایجاد کالا، اگر `currentStock > 0` باشد، یک حرکت INITIAL ایجاد می‌شود
- ✅ در `app/api/inventory/stock-movements/route.ts`: حرکت INITIAL ثبت می‌شود و Balance به‌روزرسانی می‌شود
- ✅ در `app/api/inventory/stock-movements/route.ts` (خط 370-386): بعد از ثبت حرکت، هشدارها به‌صورت خودکار محاسبه می‌شوند
- ✅ در `app/onboarding/initial-inventory/page.tsx` (خط 409-410): بعد از ثبت حرکت، UI به‌روزرسانی می‌شود
- ✅ در `app/inventory/warehouses/page.tsx`: موجودی کالاها از `inventory_balance` خوانده می‌شود و به‌صورت real-time نمایش داده می‌شود

**نتیجه**: ✅ **پیاده‌سازی شده**

---

## ✅ سناریو 2: ثبت سفارش و نهایی‌سازی

**شرح**: برای مواد مرتبط با آیتم‌های سفارش حرکت SALE_CONSUMPTION در انبار عملیاتی ثبت می‌شود؛ موجودی منفی رخ نمی‌دهد؛ هشدار «کمبود» در صورت عبور از آستانه باز می‌شود.

**پیاده‌سازی**:
- ✅ در `app/api/inventory-reservations/helpers.ts` (خط 277-296): حرکت SALE_CONSUMPTION ایجاد می‌شود
- ✅ در `app/api/inventory-reservations/helpers.ts` (خط 304-321): بررسی موجودی منفی بر اساس `allowNegativeStock` از تنظیمات انبار
- ✅ در `app/api/inventory-reservations/helpers.ts` (خط 410-423): بعد از مصرف، هشدارها به‌صورت خودکار محاسبه می‌شوند
- ✅ در `app/api/orders/status/route.ts` (خط 169-191): مصرف موجودی در وضعیت `completed` یا `paid` انجام می‌شود
- ✅ در `app/api/inventory-reservations/helpers.ts` (خط 672-685): در `consumeInventoryDirectly` هم هشدارها محاسبه می‌شوند

**نتیجه**: ✅ **پیاده‌سازی شده**

---

## ✅ سناریو 3: انتقال از انبار 1 به 2

**شرح**: بعد از تایید، موجودی مبدا ۲ واحد کم و مقصد ۲ واحد زیاد می‌شود (یا در مدل دو‌مرحله‌ای ابتدا inTransit، سپس IN). کاردکس هر دو انبار سند را نشان می‌دهد.

**پیاده‌سازی**:
- ✅ در `app/api/transfers/[id]/route.ts` (خط 86-253): برای مدل `simple`، TRANSFER_OUT و TRANSFER_IN به‌صورت اتمیک ثبت می‌شوند
- ✅ در `app/api/transfers/[id]/route.ts` (خط 254-315): برای مدل `two_stage`، ابتدا TRANSFER_OUT ثبت و `inTransit` تنظیم می‌شود
- ✅ در `app/api/transfers/[id]/route.ts` (خط 314-365): در `receive`، TRANSFER_IN ثبت و `inTransit` صفر می‌شود
- ✅ در `app/api/transfers/[id]/route.ts` (خط 183-184, 200-201): هر دو حرکت با `transferRef` یکسان ثبت می‌شوند
- ✅ در `app/api/inventory/ledger/route.ts`: کاردکس از `stock_movements` خوانده می‌شود و می‌تواند بر اساس `warehouseName` فیلتر شود
- ✅ در `app/api/transfers/[id]/route.ts` (خط 415-430): بعد از approve/receive، هشدارها به‌صورت خودکار محاسبه می‌شوند

**نتیجه**: ✅ **پیاده‌سازی شده**

---

## ✅ سناریو 4: انبارگردانی

**شرح**: شمارش ۹۰ در حالی که سیستم ۱۰۰ است → پس از تایید، حرکت ADJUSTMENT_DECREMENT ده‌تایی ثبت، موجودی ۹۰ می‌شود، هشدارهای مرتبط باز/بسته می‌شوند.

**پیاده‌سازی**:
- ✅ در `app/api/inventory-counts/[id]/approve/route.ts` (خط 67-93): محاسبه کسری/اضافی بر اساس `systemQuantityAtFinalization` (اگر `freezeMovements` فعال باشد) یا `currentStock` از Balance
- ✅ در `app/api/inventory-counts/[id]/approve/route.ts` (خط 96-120): ایجاد حرکت ADJUSTMENT_INCREMENT یا ADJUSTMENT_DECREMENT بر اساس مغایرت
- ✅ در `app/api/inventory-counts/[id]/approve/route.ts` (خط 125-155): به‌روزرسانی Balance و FIFO Layers
- ✅ در `app/api/inventory-counts/[id]/approve/route.ts` (خط 208-215): بعد از تأیید، هشدارها به‌صورت خودکار محاسبه می‌شوند

**نتیجه**: ✅ **پیاده‌سازی شده**

---

## ✅ سناریو 5: هشدار انقضا

**شرح**: کالایی با انقضا در ۲۰ روز آینده → در پنل هشدارها به‌صورت «EXPIRY_SOON» ظاهر می‌شود؛ با انتقال/مصرف/اصلاح، وضعیت هشدار به‌روز می‌گردد.

**پیاده‌سازی**:
- ✅ در `app/api/stock-alerts/calculate/route.ts` (خط 242-260): محاسبه EXPIRY_SOON برای کالاهایی که `expirationDate` در بازه هشدار (≤ 30 روز) دارند
- ✅ در `app/api/stock-alerts/calculate/route.ts` (خط 243-247): بررسی `expiryDate <= expiryWarningDate && expiryDate >= today`
- ✅ در `app/api/inventory/stock-movements/route.ts` (خط 370-386): بعد از هر حرکت، هشدارها به‌صورت خودکار محاسبه می‌شوند
- ✅ در `app/api/inventory-reservations/helpers.ts` (خط 410-423): بعد از مصرف، هشدارها به‌صورت خودکار محاسبه می‌شوند
- ✅ در `app/api/transfers/[id]/route.ts` (خط 415-430): بعد از انتقال، هشدارها به‌صورت خودکار محاسبه می‌شوند
- ✅ در `app/api/inventory-counts/[id]/approve/route.ts` (خط 208-215): بعد از انبارگردانی، هشدارها به‌صورت خودکار محاسبه می‌شوند

**نتیجه**: ✅ **پیاده‌سازی شده**

---

## خلاصه

همه 5 سناریوی معیارهای پذیرش به‌صورت کامل پیاده‌سازی شده‌اند:

1. ✅ **افزودن کالا → INITIAL**: حرکت ایجاد می‌شود، Balance به‌روزرسانی می‌شود، UI به‌روزرسانی می‌شود
2. ✅ **سفارش → SALE_CONSUMPTION**: حرکت ایجاد می‌شود، موجودی منفی جلوگیری می‌شود، هشدارها به‌روزرسانی می‌شوند
3. ✅ **انتقال**: TRANSFER_OUT و TRANSFER_IN با transferRef ثبت می‌شوند، کاردکس هر دو انبار به‌روزرسانی می‌شود
4. ✅ **انبارگردانی**: ADJUSTMENT ایجاد می‌شود، موجودی به‌روزرسانی می‌شود، هشدارها به‌روزرسانی می‌شوند
5. ✅ **هشدار انقضا**: EXPIRY_SOON محاسبه می‌شود، با هر تغییر موجودی به‌روزرسانی می‌شود

**همه معیارهای پذیرش برآورده شده‌اند!** ✅

