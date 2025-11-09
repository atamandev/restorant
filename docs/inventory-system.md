# سیستم مدیریت موجودی (Inventory Management System)

## اصول کلیدی

### 1. منبع حقیقت موجودی
- **جدول Balance**: موجودی واقعی در سطح `item × warehouse` در جدول `inventory_balance` نگهداری می‌شود
- **عدم نگهداری موجودی در جای دیگر**: هیچ جای دیگری عدد موجودی نگه نداریم. `inventory_items.currentStock` فقط برای نمایش است و از Balance محاسبه می‌شود

### 2. حرکت کالا (Stock Movement)
هر تغییر موجودی فقط از طریق **سند حرکت کالا (Stock Movement)** ثبت می‌شود.

#### انواع حرکت:
- **INITIAL**: موجودی اولیه
- **PURCHASE_IN**: ورود خرید/تأمین
- **SALE_CONSUMPTION**: مصرف فروش (کاهش بعد از نهایی‌سازی سفارش)
- **TRANSFER_OUT**: خروج انتقال
- **TRANSFER_IN**: ورود انتقال
- **ADJUSTMENT_INCREMENT**: اصلاح افزایشی
- **ADJUSTMENT_DECREMENT**: اصلاح کاهشی
- **WASTAGE**: ضایعات
- **RETURN_IN**: مرجوعی ورودی
- **RETURN_OUT**: مرجوعی خروجی

### 3. عدم موجودی منفی
- هیچ حرکتی که منجر به موجودی منفی شود پذیرفته نمی‌شود
- مگر با فلگ تنظیمی `allowNegativeStock` در سطح انبار (پیش‌فرض: ممنوع)

### 4. FIFO و قیمت تمام‌شده
- لایه‌های FIFO به‌ازای هر ورود ثبت می‌شوند
- برای محاسبه دقیق:
  - کاردکس (ledger)
  - ارزش موجودی
  - بهای مصرف
- مصرف‌ها از قدیمی‌ترین لایه‌ها تخلیه می‌شوند
- اگر FIFO کافی نبود، از «میانگین متحرک موزون» استفاده می‌شود

### 5. انقضا و بچ/لات
- پشتیبانی از `lotNumber` و `expirationDate` در حرکات ورودی
- هشدار انقضا بر اساس تاریخ

### 6. چند انباری
- کالا می‌تواند در چند انبار تعریف شود
- هر حرکت همیشه دقیقاً به یک انبار اشاره دارد
- مجموع موجودی کل = جمع موجودی همه انبارها

## ساختار دیتابیس

### 1. inventory_balance
```typescript
{
  _id: ObjectId,
  itemId: ObjectId,
  warehouseId: string | null,
  warehouseName: string,
  quantity: number,
  totalValue: number,
  lastUpdated: string,
  createdAt: Date,
  updatedAt: Date
}
```

### 2. stock_movements
```typescript
{
  _id: ObjectId,
  itemId: ObjectId,
  warehouseId: string | null,
  warehouseName: string,
  movementType: MovementType,
  quantity: number,
  unitPrice: number,
  totalValue: number,
  lotNumber: string | null,
  expirationDate: string | null,
  documentNumber: string,
  documentType: string,
  description: string,
  referenceId: string | null,
  createdBy: string,
  createdAt: string,
  updatedAt: string
}
```

### 3. fifo_layers
```typescript
{
  _id: ObjectId,
  itemId: ObjectId,
  warehouseId: string | null,
  warehouseName: string,
  movementId: ObjectId | null,
  quantity: number,
  remainingQuantity: number,
  unitPrice: number,
  lotNumber: string | null,
  expirationDate: string | null,
  createdAt: string,
  updatedAt: string
}
```

## API Endpoints

### 1. ایجاد حرکت کالا
**POST** `/api/inventory/stock-movements`

```json
{
  "itemId": "item_id",
  "warehouseName": "تایماز",
  "movementType": "PURCHASE_IN",
  "quantity": 100,
  "unitPrice": 50000,
  "lotNumber": "LOT-001",
  "expirationDate": "2024-12-31",
  "documentNumber": "PO-000001",
  "documentType": "PURCHASE_ORDER",
  "description": "خرید از تامین‌کننده",
  "allowNegative": false
}
```

### 2. دریافت موجودی
**GET** `/api/inventory/balance?itemId=xxx&warehouseName=تایماز`

### 3. دریافت کاردکس
**GET** `/api/inventory/ledger?itemId=xxx&warehouseName=تایماز`

### 4. همگام‌سازی موجودی
**POST** `/api/inventory/sync-balance`

```json
{
  "itemId": "item_id",
  "warehouseName": "تایماز"
}
```

## مثال استفاده

### 1. ثبت موجودی اولیه
```javascript
await fetch('/api/inventory/stock-movements', {
  method: 'POST',
  body: JSON.stringify({
    itemId: 'item_id',
    warehouseName: 'تایماز',
    movementType: 'INITIAL',
    quantity: 100,
    unitPrice: 50000
  })
})
```

### 2. ثبت خرید
```javascript
await fetch('/api/inventory/stock-movements', {
  method: 'POST',
  body: JSON.stringify({
    itemId: 'item_id',
    warehouseName: 'تایماز',
    movementType: 'PURCHASE_IN',
    quantity: 50,
    unitPrice: 52000,
    documentNumber: 'PO-000001',
    documentType: 'PURCHASE_ORDER'
  })
})
```

### 3. ثبت مصرف فروش (بعد از تکمیل سفارش)
```javascript
await fetch('/api/inventory/stock-movements', {
  method: 'POST',
  body: JSON.stringify({
    itemId: 'item_id',
    warehouseName: 'تایماز',
    movementType: 'SALE_CONSUMPTION',
    quantity: 10,
    documentNumber: 'ORD-000001',
    documentType: 'ORDER',
    referenceId: 'order_id'
  })
})
```

### 4. همگام‌سازی موجودی
```javascript
await fetch('/api/inventory/sync-balance', {
  method: 'POST',
  body: JSON.stringify({
    itemId: 'item_id'
  })
})
```

## نکات مهم

1. **همیشه از Stock Movement استفاده کنید**: هیچ‌وقت مستقیماً `inventory_balance` را تغییر ندهید
2. **همگام‌سازی**: بعد از هر تغییر، `sync-balance` را فراخوانی کنید تا `inventory_items` به‌روز شود
3. **موجودی منفی**: پیش‌فرض ممنوع است، مگر با فلگ `allowNegativeStock`
4. **FIFO**: به صورت خودکار برای ورودها ایجاد می‌شود و برای خروج‌ها استفاده می‌شود

