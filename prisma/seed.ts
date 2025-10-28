import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Create sample users
  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      email: 'admin@restaurant.com',
      passwordHash: 'hashed_admin_password',
      role: 'ADMIN',
      firstName: 'مدیر',
      lastName: 'سیستم'
    }
  })

  const manager = await prisma.user.create({
    data: {
      username: 'manager',
      email: 'manager@restaurant.com',
      passwordHash: 'hashed_manager_password',
      role: 'MANAGER',
      firstName: 'مدیر',
      lastName: 'رستوران'
    }
  })

  const cashier = await prisma.user.create({
    data: {
      username: 'cashier',
      email: 'cashier@restaurant.com',
      passwordHash: 'hashed_cashier_password',
      role: 'CASHIER',
      firstName: 'صندوق‌دار',
      lastName: 'رستوران'
    }
  })

  console.log('✅ Users created:', { admin: admin.id, manager: manager.id, cashier: cashier.id })

  // Create sample branch
  const branch = await prisma.branch.upsert({
    where: { name: 'شعبه اصلی' },
    update: {},
    create: {
      name: 'شعبه اصلی',
      address: 'تهران، خیابان ولیعصر، پلاک 123',
      phoneNumber: '021-12345678',
      email: 'main@restaurant.com'
    }
  })

  console.log('✅ Branch created:', branch.id)

  // Create sample menu items
  const menuItems = [
    {
      name: 'کباب کوبیده',
      description: 'کباب کوبیده با برنج و سبزیجات',
      category: 'MAIN_COURSE' as const,
      price: 45000,
      ingredients: ['گوشت گوساله', 'برنج', 'سبزیجات', 'ادویه'],
      allergens: ['گلوتن']
    },
    {
      name: 'جوجه کباب',
      description: 'جوجه کباب با برنج و سالاد',
      category: 'MAIN_COURSE' as const,
      price: 38000,
      ingredients: ['جوجه', 'برنج', 'سالاد', 'ادویه'],
      allergens: ['گلوتن']
    },
    {
      name: 'قیمه',
      description: 'قیمه با برنج و لپه',
      category: 'MAIN_COURSE' as const,
      price: 32000,
      ingredients: ['گوشت', 'لپه', 'برنج', 'ادویه'],
      allergens: ['گلوتن']
    },
    {
      name: 'چای',
      description: 'چای سیاه',
      category: 'BEVERAGE' as const,
      price: 5000,
      ingredients: ['چای', 'آب'],
      allergens: []
    },
    {
      name: 'قهوه',
      description: 'قهوه ترک',
      category: 'BEVERAGE' as const,
      price: 8000,
      ingredients: ['قهوه', 'آب'],
      allergens: []
    },
    {
      name: 'کشک بادمجان',
      description: 'کشک بادمجان با نان',
      category: 'APPETIZER' as const,
      price: 25000,
      ingredients: ['بادمجان', 'کشک', 'نان', 'ادویه'],
      allergens: ['گلوتن', 'لبنیات']
    }
  ]

  for (const item of menuItems) {
    await prisma.menuItem.upsert({
      where: { name: item.name },
      update: {},
      create: {
        ...item,
        branchId: branch.id
      }
    })
  }

  console.log('✅ Menu items created:', menuItems.length)

  // Create sample customers
  const customers = [
    {
      firstName: 'احمد',
      lastName: 'محمدی',
      phoneNumber: '09123456789',
      email: 'ahmad@example.com'
    },
    {
      firstName: 'فاطمه',
      lastName: 'احمدی',
      phoneNumber: '09123456790',
      email: 'fateme@example.com'
    },
    {
      firstName: 'علی',
      lastName: 'رضایی',
      phoneNumber: '09123456791'
    }
  ]

  for (const customer of customers) {
    await prisma.customer.upsert({
      where: { 
        firstName_lastName: {
          firstName: customer.firstName,
          lastName: customer.lastName
        }
      },
      update: {},
      create: customer
    })
  }

  console.log('✅ Customers created:', customers.length)

  // Create sample inventory items
  const inventoryItems = [
    {
      name: 'گوشت گوساله',
      category: 'پروتئین',
      currentStock: 50,
      minStock: 10,
      maxStock: 100,
      unit: 'کیلوگرم',
      cost: 120000,
      sellingPrice: 150000
    },
    {
      name: 'برنج',
      category: 'غلات',
      currentStock: 200,
      minStock: 50,
      maxStock: 500,
      unit: 'کیلوگرم',
      cost: 25000,
      sellingPrice: 30000
    },
    {
      name: 'چای',
      category: 'نوشیدنی',
      currentStock: 20,
      minStock: 5,
      maxStock: 50,
      unit: 'کیلوگرم',
      cost: 80000,
      sellingPrice: 100000
    }
  ]

  for (const item of inventoryItems) {
    await prisma.inventoryItem.upsert({
      where: { name: item.name },
      update: {},
      create: {
        ...item,
        branchId: branch.id
      }
    })
  }

  console.log('✅ Inventory items created:', inventoryItems.length)

  console.log('🎉 Database seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
