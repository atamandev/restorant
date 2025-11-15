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

// GET - اطلاعات سیستم (System Information)
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()
    
    // Collections برای آمار
    const branchesCollection = db.collection('branches')
    const cashRegistersCollection = db.collection('cash_registers')
    const menuItemsCollection = db.collection('menu_items')
    const inventoryItemsCollection = db.collection('inventory_items')
    const usersCollection = db.collection('users')
    const userRolesCollection = db.collection('user_roles')
    const printersCollection = db.collection('printers')
    const invoiceTemplatesCollection = db.collection('invoice_templates')
    const backupsCollection = db.collection('backups')
    const auditLogsCollection = db.collection('audit_logs')
    const invoicesCollection = db.collection('invoices')
    const ordersCollection = db.collection('orders')
    const customersCollection = db.collection('customers')

    // آمار کلی سیستم
    const stats = {
      branches: await branchesCollection.countDocuments({ isActive: true }),
      cashRegisters: await cashRegistersCollection.countDocuments({ isActive: true }),
      menuItems: await menuItemsCollection.countDocuments({}),
      inventoryItems: await inventoryItemsCollection.countDocuments({}),
      users: await usersCollection.countDocuments({ isActive: true }),
      roles: await userRolesCollection.countDocuments({}),
      printers: await printersCollection.countDocuments({}),
      invoiceTemplates: await invoiceTemplatesCollection.countDocuments({}),
      backups: await backupsCollection.countDocuments({}),
      auditLogs: await auditLogsCollection.countDocuments({}),
      totalInvoices: await invoicesCollection.countDocuments({}),
      totalOrders: await ordersCollection.countDocuments({}),
      totalCustomers: await customersCollection.countDocuments({})
    }

    // اطلاعات پایگاه داده
    const dbStats = await db.stats()
    const collections = await db.listCollections().toArray()

    // آخرین بک‌آپ
    const lastBackup = await backupsCollection
      .findOne({}, { sort: { createdAt: -1 } })

    // آخرین لاگ‌های Audit
    const recentAuditLogs = await auditLogsCollection
      .find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray()

    // اطلاعات نسخه سیستم (می‌تواند از package.json یا یک فایل config خوانده شود)
    const systemVersion = '1.0.0' // می‌تواند از env variable یا config file خوانده شود
    const databaseVersion = dbStats.version || 'Unknown'

    return NextResponse.json({
      success: true,
      data: {
        system: {
          name: 'سیستم مدیریت رستوران',
          version: systemVersion,
          database: {
            name: DB_NAME,
            version: databaseVersion,
            size: dbStats.dataSize || 0,
            collections: collections.length
          }
        },
        statistics: stats,
        lastBackup: lastBackup ? {
          id: lastBackup._id.toString(),
          type: lastBackup.type,
          createdAt: lastBackup.createdAt,
          status: lastBackup.status,
          size: lastBackup.size || 0
        } : null,
        recentActivity: recentAuditLogs.map((log: any) => ({
          id: log._id.toString(),
          action: log.action,
          entity: log.entity,
          userId: log.userId,
          timestamp: log.createdAt || log.timestamp,
          ipAddress: log.ipAddress
        })),
        modules: {
          setup: {
            branches: stats.branches > 0,
            cashRegisters: stats.cashRegisters > 0,
            menuItems: stats.menuItems > 0,
            inventoryItems: stats.inventoryItems > 0
          },
          operations: {
            quickSales: true,
            tableOrders: true,
            cashierSessions: true
          },
          pos: {
            dineIn: true,
            takeaway: true,
            delivery: true,
            kitchen: true
          },
          crm: {
            customers: stats.totalCustomers > 0,
            loyalty: true,
            feedback: true
          },
          accounting: {
            invoices: stats.totalInvoices > 0,
            receiptsPayments: true,
            cheques: true,
            financialReports: true
          },
          reports: {
            sales: true,
            inventory: true,
            customerSupplier: true,
            general: true
          },
          settings: {
            userRoles: stats.roles > 0,
            printers: stats.printers > 0,
            invoiceTemplates: stats.invoiceTemplates > 0,
            backupRestore: stats.backups > 0,
            auditLog: stats.auditLogs > 0
          }
        }
      },
      message: 'اطلاعات سیستم با موفقیت دریافت شد'
    })
  } catch (error) {
    console.error('Error fetching system info:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در دریافت اطلاعات سیستم',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

