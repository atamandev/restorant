import { ObjectId } from 'mongodb'

/**
 * محاسبه قیمت خالص مواد اولیه از recipe یک محصول
 * @param db - دیتابیس MongoDB
 * @param menuItemId - شناسه محصول منو
 * @param quantity - تعداد محصول (برای محاسبه کل)
 * @returns قیمت خالص مواد اولیه
 */
export async function calculateIngredientCost(
  db: any,
  menuItemId: string | ObjectId,
  quantity: number = 1
): Promise<number> {
  try {
    const menuItemsCollection = db.collection('menu_items')
    const inventoryItemsCollection = db.collection('inventory_items')
    
    // دریافت اطلاعات محصول منو
    const menuItem = await menuItemsCollection.findOne({
      _id: typeof menuItemId === 'string' ? new ObjectId(menuItemId) : menuItemId
    })
    
    if (!menuItem || !menuItem.recipe || !Array.isArray(menuItem.recipe)) {
      return 0
    }
    
    let totalCost = 0
    
    // محاسبه قیمت هر ماده اولیه
    for (const ingredient of menuItem.recipe) {
      if (!ingredient.ingredientId || !ingredient.quantity) {
        continue
      }
      
      // دریافت اطلاعات ماده اولیه
      const inventoryItem = await inventoryItemsCollection.findOne({
        _id: new ObjectId(ingredient.ingredientId)
      })
      
      if (inventoryItem && inventoryItem.unitPrice) {
        // قیمت واحد × مقدار مصرفی
        const ingredientCost = inventoryItem.unitPrice * ingredient.quantity
        totalCost += ingredientCost
      }
    }
    
    // ضرب در تعداد محصول
    return totalCost * quantity
  } catch (error) {
    console.error('Error calculating ingredient cost:', error)
    return 0
  }
}

/**
 * محاسبه سود یک محصول
 * @param productPrice - قیمت محصول
 * @param discount - تخفیف
 * @param ingredientCost - قیمت خالص مواد اولیه
 * @returns سود
 */
export function calculateProfit(
  productPrice: number,
  discount: number,
  ingredientCost: number
): number {
  // سود = (قیمت محصول - تخفیف) - قیمت خالص مواد اولیه
  return (productPrice - discount) - ingredientCost
}

/**
 * محاسبه سود برای یک سفارش کامل
 * @param db - دیتابیس MongoDB
 * @param items - لیست آیتم‌های سفارش
 * @param totalDiscount - تخفیف کل سفارش
 * @returns { totalProfit: number, itemProfits: Array<{ itemId, name, profit, ingredientCost }> }
 */
export async function calculateOrderProfit(
  db: any,
  items: Array<{
    menuItemId?: string
    id?: string
    name: string
    price: number
    quantity: number
    total: number
    discount?: number
  }>,
  totalDiscount: number = 0
): Promise<{
  totalProfit: number
  itemProfits: Array<{
    itemId: string
    name: string
    profit: number
    ingredientCost: number
    price: number
    quantity: number
    discount: number
  }>
}> {
  const itemProfits: Array<{
    itemId: string
    name: string
    profit: number
    ingredientCost: number
    price: number
    quantity: number
    discount: number
  }> = []
  
  let totalProfit = 0
  
  // محاسبه تخفیف هر آیتم (نسبتی)
  const totalPrice = items.reduce((sum, item) => sum + item.total, 0)
  const discountRatio = totalPrice > 0 ? totalDiscount / totalPrice : 0
  
  for (const item of items) {
    const menuItemId = item.menuItemId || item.id
    if (!menuItemId) {
      continue
    }
    
    // محاسبه قیمت خالص مواد اولیه
    const ingredientCost = await calculateIngredientCost(db, menuItemId, item.quantity)
    
    // محاسبه تخفیف این آیتم
    const itemDiscount = item.total * discountRatio
    
    // محاسبه سود این آیتم
    const itemProfit = calculateProfit(item.total, itemDiscount, ingredientCost)
    
    itemProfits.push({
      itemId: menuItemId,
      name: item.name,
      profit: itemProfit,
      ingredientCost,
      price: item.price,
      quantity: item.quantity,
      discount: itemDiscount
    })
    
    totalProfit += itemProfit
  }
  
  return {
    totalProfit,
    itemProfits
  }
}

