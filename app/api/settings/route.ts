import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://admin:StrongPassword123@185.204.169.107:27017/restaurant?authSource=admin'
const DB_NAME = 'restaurant'

let client: MongoClient
let db: any

async function connectToDatabase() {
  if (!client) {
    client = new MongoClient(MONGO_URI)
    await client.connect()
    db = client.db(DB_NAME)
  }
  return db
}

// GET - دریافت تمام تنظیمات سیستم (کنترل‌پنل مرکزی)
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()
    
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') // all, restaurant, printer, invoice, backup, security

    const settings = {
      restaurant: null,
      printer: null,
      invoice: null,
      backup: null,
      security: null,
      notifications: null
    }

    // 1. تنظیمات رستوران
    if (!category || category === 'all' || category === 'restaurant') {
      const restaurantSettingsCollection = db.collection('restaurant_settings')
      settings.restaurant = await restaurantSettingsCollection.findOne({ type: 'restaurant' })
    }

    // 2. تنظیمات چاپگر
    if (!category || category === 'all' || category === 'printer') {
      const printersCollection = db.collection('printers')
      const printRoutesCollection = db.collection('print_routes')
      settings.printer = {
        printers: await printersCollection.find({}).toArray(),
        routes: await printRoutesCollection.find({}).toArray()
      }
    }

    // 3. تنظیمات قالب فاکتور
    if (!category || category === 'all' || category === 'invoice') {
      const invoiceTemplatesCollection = db.collection('invoice_templates')
      settings.invoice = {
        templates: await invoiceTemplatesCollection.find({}).toArray()
      }
    }

    // 4. تنظیمات Backup/Restore
    if (!category || category === 'all' || category === 'backup') {
      const backupSchedulesCollection = db.collection('backup_schedules')
      const backupsCollection = db.collection('backups')
      settings.backup = {
        schedules: await backupSchedulesCollection.find({}).toArray(),
        recentBackups: await backupsCollection.find({}).sort({ createdAt: -1 }).limit(5).toArray()
      }
    }

    // 5. تنظیمات امنیت (User Roles & Permissions)
    if (!category || category === 'all' || category === 'security') {
      const userRolesCollection = db.collection('user_roles')
      const usersCollection = db.collection('users')
      settings.security = {
        roles: await userRolesCollection.find({}).toArray(),
        users: await usersCollection.find({}).toArray().then((users: any[]) => 
          users.map(user => {
            const { passwordHash, ...userWithoutPassword } = user
            return userWithoutPassword
          })
        )
      }
    }

    // 6. تنظیمات اعلان‌ها
    if (!category || category === 'all' || category === 'notifications') {
      const notificationSettingsCollection = db.collection('notification_settings')
      const notificationTemplatesCollection = db.collection('notification_templates')
      settings.notifications = {
        settings: await notificationSettingsCollection.findOne({}) || {
          email: { enabled: false, smtp: {} },
          sms: { enabled: false, provider: '' },
          push: { enabled: false }
        },
        templates: await notificationTemplatesCollection.find({}).toArray()
      }
    }

    return NextResponse.json({
      success: true,
      data: settings,
      message: 'تنظیمات سیستم با موفقیت دریافت شد'
    })
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در دریافت تنظیمات',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// PUT - به‌روزرسانی تنظیمات
export async function PUT(request: NextRequest) {
  try {
    await connectToDatabase()
    const body = await request.json()
    const { category, ...updateData } = body

    if (!category) {
      return NextResponse.json(
        { success: false, message: 'دسته‌بندی تنظیمات اجباری است' },
        { status: 400 }
      )
    }

    switch (category) {
      case 'restaurant':
        const restaurantSettingsCollection = db.collection('restaurant_settings')
        await restaurantSettingsCollection.updateOne(
          { type: 'restaurant' },
          { $set: { ...updateData, updatedAt: new Date().toISOString() } },
          { upsert: true }
        )
        break

      case 'printer':
        // Printer settings are managed via /api/printer-config
        return NextResponse.json(
          { success: false, message: 'برای تغییر تنظیمات چاپگر از API printer-config استفاده کنید' },
          { status: 400 }
        )

      case 'invoice':
        // Invoice template settings are managed via /api/invoice-templates
        return NextResponse.json(
          { success: false, message: 'برای تغییر قالب فاکتور از API invoice-templates استفاده کنید' },
          { status: 400 }
        )

      case 'backup':
        // Backup settings are managed via /api/backup-restore
        return NextResponse.json(
          { success: false, message: 'برای تغییر تنظیمات Backup از API backup-restore استفاده کنید' },
          { status: 400 }
        )

      case 'security':
        // Security settings are managed via /api/user-roles
        return NextResponse.json(
          { success: false, message: 'برای تغییر تنظیمات امنیتی از API user-roles استفاده کنید' },
          { status: 400 }
        )

      case 'notifications':
        const notificationSettingsCollection = db.collection('notification_settings')
        await notificationSettingsCollection.updateOne(
          {},
          { $set: { ...updateData, updatedAt: new Date().toISOString() } },
          { upsert: true }
        )
        break

      default:
        return NextResponse.json(
          { success: false, message: 'دسته‌بندی تنظیمات نامعتبر است' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      message: 'تنظیمات با موفقیت به‌روزرسانی شد'
    })
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در به‌روزرسانی تنظیمات',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

