import { NextRequest, NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://restorenUser:1234@localhost:27017/restoren'

export async function POST(request: NextRequest) {
  let client: MongoClient | null = null
  
  try {
    console.log('Adding sample inventory items...')
    client = new MongoClient(MONGO_URI)
    await client.connect()
    
    const db = client.db('restoren')
    const collection = db.collection('inventory_items')
    
    // آیتم‌های نمونه موجودی اولیه
    const sampleItems = [
      {
        name: "برنج",
        category: "مواد اولیه",
        unit: "کیلوگرم",
        currentStock: 50,
        minStock: 10,
        maxStock: 100,
        unitPrice: 25000,
        totalValue: 1250000,
        expiryDate: "2024-06-15",
        supplier: "تامین‌کننده مواد اولیه",
        isLowStock: false,
        lastUpdated: new Date().toISOString(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: "گوشت گوساله",
        category: "مواد اولیه",
        unit: "کیلوگرم",
        currentStock: 5,
        minStock: 8,
        maxStock: 20,
        unitPrice: 180000,
        totalValue: 900000,
        expiryDate: "2024-01-25",
        supplier: "تامین‌کننده مواد اولیه",
        isLowStock: true,
        lastUpdated: new Date().toISOString(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: "نوشابه",
        category: "نوشیدنی",
        unit: "قوطی",
        currentStock: 200,
        minStock: 50,
        maxStock: 500,
        unitPrice: 8000,
        totalValue: 1600000,
        expiryDate: "2024-12-31",
        supplier: "تامین‌کننده نوشیدنی",
        isLowStock: false,
        lastUpdated: new Date().toISOString(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: "روغن",
        category: "مواد اولیه",
        unit: "لیتر",
        currentStock: 15,
        minStock: 5,
        maxStock: 30,
        unitPrice: 45000,
        totalValue: 675000,
        expiryDate: "2024-08-20",
        supplier: "تامین‌کننده مواد اولیه",
        isLowStock: false,
        lastUpdated: new Date().toISOString(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: "پیاز",
        category: "سبزیجات",
        unit: "کیلوگرم",
        currentStock: 25,
        minStock: 10,
        maxStock: 50,
        unitPrice: 12000,
        totalValue: 300000,
        expiryDate: "2024-02-10",
        supplier: "تامین‌کننده سبزیجات",
        isLowStock: false,
        lastUpdated: new Date().toISOString(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: "نمک",
        category: "ادویه",
        unit: "کیلوگرم",
        currentStock: 8,
        minStock: 5,
        maxStock: 15,
        unitPrice: 8000,
        totalValue: 64000,
        expiryDate: "2025-12-31",
        supplier: "تامین‌کننده ادویه",
        isLowStock: false,
        lastUpdated: new Date().toISOString(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: "شیر",
        category: "لبنیات",
        unit: "لیتر",
        currentStock: 12,
        minStock: 8,
        maxStock: 25,
        unitPrice: 35000,
        totalValue: 420000,
        expiryDate: "2024-01-28",
        supplier: "تامین‌کننده لبنیات",
        isLowStock: false,
        lastUpdated: new Date().toISOString(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: "نان",
        category: "مواد اولیه",
        unit: "عدد",
        currentStock: 100,
        minStock: 50,
        maxStock: 200,
        unitPrice: 5000,
        totalValue: 500000,
        expiryDate: "2024-01-22",
        supplier: "نانوایی",
        isLowStock: false,
        lastUpdated: new Date().toISOString(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]
    
    // حذف آیتم‌های قبلی
    await collection.deleteMany({})
    console.log('Cleared existing inventory items')
    
    // اضافه کردن آیتم‌های جدید
    const result = await collection.insertMany(sampleItems)
    console.log(`Added ${result.insertedCount} inventory items`)
    
    return NextResponse.json({
      success: true,
      message: `${result.insertedCount} آیتم موجودی با موفقیت اضافه شد`,
      count: result.insertedCount
    })
  } catch (error) {
    console.error('Error adding inventory items:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در اضافه کردن آیتم‌های موجودی',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  } finally {
    if (client) {
      await client.close()
    }
  }
}

