# گزارش بخش‌های بدون API یا با Mock Data

## ✅ بخش‌هایی که API دارند و از API استفاده می‌کنند:

### Accounting:
- ✅ `/accounting/balance-sheet` - API: `/api/balance-sheet`
- ✅ `/accounting/cash-flow` - API: `/api/cash-flow`
- ✅ `/accounting/cheques` - API: `/api/cheques`
- ✅ `/accounting/receipts-payments` - API: `/api/receipts-payments`
- ✅ `/accounting/ledgers` - API: `/api/ledgers`
- ✅ `/accounting/bank-accounts` - API: `/api/bank-accounts`
- ✅ `/accounting/invoices` - API: `/api/invoices`
- ✅ `/accounting/purchases` - API: `/api/purchases`

### Reports:
- ✅ `/reports/general` - API: `/api/general-reports`
- ✅ `/reports/sales` - API: `/api/sales-reports`
- ✅ `/reports/financial` - API: `/api/financial-reports`
- ✅ `/reports/customer-supplier` - API: `/api/customer-supplier-reports`
- ✅ `/reports/inventory` - API: `/api/inventory-reports`

### Settings:
- ✅ `/settings/restaurant` - API: `/api/restaurant-settings`
- ✅ `/settings/invoice-templates` - API: `/api/invoice-templates`
- ✅ `/settings/help` - API: `/api/help`
- ✅ `/settings/user-roles` - API: `/api/user-roles`
- ✅ `/settings/staff` - API: `/api/staff`

### Operations:
- ✅ `/operations/daily-report` - API: `/api/daily-report`, `/api/orders`
- ✅ `/operations/quick-sale` - API: `/api/quick-sales`
- ✅ `/operations/close-cashier` - API: `/api/cashier-sessions`
- ✅ `/operations/table-order` - API: `/api/tables`, `/api/table-orders`

### Orders:
- ✅ `/orders/pending` - API: `/api/pending-orders`
- ✅ `/orders/management` - API: `/api/orders`

### Inventory:
- ✅ `/inventory/item-ledger` - API: `/api/item-ledger`
- ✅ `/inventory/audit-logs` - API: `/api/audit-logs`

---

## ❌ بخش‌هایی که API ندارند یا از Mock Data استفاده می‌کنند:

### 1. `/orders/ready` ❌
- **وضعیت**: از `mockReadyOrders` استفاده می‌کند
- **API موجود**: `/api/orders?status=ready` (احتمالاً)
- **نیاز به**: اتصال به API برای دریافت سفارش‌های آماده

### 2. `/orders/completed` ❌
- **وضعیت**: از `mockCompletedOrders` استفاده می‌کند
- **API موجود**: `/api/orders?status=completed` (احتمالاً)
- **نیاز به**: اتصال به API برای دریافت سفارش‌های تکمیل شده

### 3. `/accounting/cash-drawers` ❌
- **وضعیت**: پوشه خالی است، صفحه وجود ندارد
- **API موجود**: `/api/cash-drawers` (وجود دارد)
- **نیاز به**: ایجاد صفحه برای مدیریت صندوق‌ها

---

## 📋 خلاصه:

- **تعداد کل بخش‌ها**: 30+
- **بخش‌های متصل به API**: 28+
- **بخش‌های بدون API**: 3

### اولویت‌بندی برای اتصال:

1. **اولویت بالا**: `/orders/ready` و `/orders/completed` (استفاده زیاد)
2. **اولویت متوسط**: `/accounting/cash-drawers` (صفحه وجود ندارد)

