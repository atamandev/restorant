import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://admin:StrongPassword123@185.204.169.107:27017/restaurant?authSource=admin'
const DB_NAME = 'restaurant'
const SETTINGS_COLLECTION = 'notification_settings'
const TEMPLATES_COLLECTION = 'notification_templates'

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

// GET - دریافت تنظیمات یا قالب‌ها
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'settings' or 'templates' or null (both)
    
    if (type === 'templates') {
      // دریافت قالب‌ها
      const templatesCollection = db.collection(TEMPLATES_COLLECTION)
      const templates = await templatesCollection.find({}).sort({ createdAt: -1 }).toArray()
      
      const formattedTemplates = templates.map((template: any) => ({
        ...template,
        id: template._id.toString(),
        _id: template._id.toString()
      }))
      
      return NextResponse.json({
        success: true,
        data: formattedTemplates
      })
    } else if (type === 'settings' || !type) {
      // دریافت تنظیمات
      const settingsCollection = db.collection(SETTINGS_COLLECTION)
      let settings = await settingsCollection.findOne({ type: 'notification' })
      
      if (!settings) {
        // تنظیمات پیش‌فرض
        const defaultSettings = {
          type: 'notification',
          email: {
            enabled: true,
            orderNotifications: true,
            paymentNotifications: true,
            inventoryAlerts: true,
            dailyReports: true,
            weeklyReports: false,
            monthlyReports: false,
            systemUpdates: true,
            marketingEmails: false
          },
          sms: {
            enabled: true,
            orderNotifications: true,
            paymentNotifications: false,
            inventoryAlerts: true,
            dailyReports: false,
            systemUpdates: false
          },
          push: {
            enabled: true,
            orderNotifications: true,
            paymentNotifications: true,
            inventoryAlerts: true,
            systemUpdates: true,
            marketingNotifications: false
          },
          inApp: {
            enabled: true,
            orderNotifications: true,
            paymentNotifications: true,
            inventoryAlerts: true,
            systemUpdates: true,
            showBadges: true,
            playSound: true
          },
          createdAt: new Date(),
          updatedAt: new Date()
        }
        
        const result = await settingsCollection.insertOne(defaultSettings)
        settings = { ...defaultSettings, _id: result.insertedId }
      }
      
      const { _id, ...settingsData } = settings
      
      return NextResponse.json({
        success: true,
        data: settingsData
      })
    } else {
      return NextResponse.json(
        { success: false, message: 'نوع نامعتبر' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error fetching notifications data:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت اطلاعات' },
      { status: 500 }
    )
  }
}

// PUT - به‌روزرسانی تنظیمات
export async function PUT(request: NextRequest) {
  try {
    await connectToDatabase()
    const body = await request.json()
    const { type, ...data } = body
    
    if (type === 'settings') {
      const settingsCollection = db.collection(SETTINGS_COLLECTION)
      
      // دریافت تنظیمات فعلی
      let currentSettings = await settingsCollection.findOne({ type: 'notification' })
      
      if (!currentSettings) {
        // ایجاد تنظیمات جدید
        const newSettings = {
          type: 'notification',
          ...data.settings,
          createdAt: new Date(),
          updatedAt: new Date()
        }
        const result = await settingsCollection.insertOne(newSettings)
        const { _id, ...settingsData } = { ...newSettings, _id: result.insertedId }
        
        return NextResponse.json({
          success: true,
          data: settingsData,
          message: 'تنظیمات با موفقیت ایجاد شد'
        })
      } else {
        // به‌روزرسانی تنظیمات
        const updateData = {
          ...data.settings,
          updatedAt: new Date()
        }
        
        await settingsCollection.updateOne(
          { type: 'notification' },
          { $set: updateData }
        )
        
        const updated = await settingsCollection.findOne({ type: 'notification' })
        const { _id, ...settingsData } = updated
        
        return NextResponse.json({
          success: true,
          data: settingsData,
          message: 'تنظیمات با موفقیت به‌روزرسانی شد'
        })
      }
    } else if (type === 'template') {
      // به‌روزرسانی یا ایجاد قالب
      const templatesCollection = db.collection(TEMPLATES_COLLECTION)
      
      if (data.id) {
        // به‌روزرسانی قالب موجود
        const templateId = data.id || data._id
        const updateData: any = {
          updatedAt: new Date()
        }
        
        const allowedFields = ['name', 'type', 'subject', 'content', 'isActive']
        allowedFields.forEach(field => {
          if (data[field] !== undefined) {
            updateData[field] = data[field]
          }
        })
        
        const result = await templatesCollection.updateOne(
          { _id: new ObjectId(templateId) },
          { $set: updateData }
        )
        
        if (result.matchedCount === 0) {
          return NextResponse.json(
            { success: false, message: 'قالب یافت نشد' },
            { status: 404 }
          )
        }
        
        const updated = await templatesCollection.findOne({ _id: new ObjectId(templateId) })
        
        return NextResponse.json({
          success: true,
          data: { ...updated, id: updated._id.toString(), _id: updated._id.toString() },
          message: 'قالب با موفقیت به‌روزرسانی شد'
        })
      } else {
        // ایجاد قالب جدید
        const template = {
          name: data.name,
          type: data.type || 'email',
          subject: data.subject || '',
          content: data.content || '',
          isActive: data.isActive !== undefined ? data.isActive : true,
          lastUsed: null,
          usageCount: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        }
        
        if (!template.name || !template.type) {
          return NextResponse.json(
            { success: false, message: 'نام و نوع قالب اجباری است' },
            { status: 400 }
          )
        }
        
        const result = await templatesCollection.insertOne(template)
        
        return NextResponse.json({
          success: true,
          data: { ...template, _id: result.insertedId.toString(), id: result.insertedId.toString() },
          message: 'قالب با موفقیت ایجاد شد'
        })
      }
    } else {
      return NextResponse.json(
        { success: false, message: 'نوع نامعتبر' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error updating notifications:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در به‌روزرسانی' },
      { status: 500 }
    )
  }
}

// POST - ایجاد قالب جدید
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()
    const body = await request.json()
    const templatesCollection = db.collection(TEMPLATES_COLLECTION)
    
    const template = {
      name: body.name,
      type: body.type || 'email',
      subject: body.subject || '',
      content: body.content || '',
      isActive: body.isActive !== undefined ? body.isActive : true,
      lastUsed: null,
      usageCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    if (!template.name || !template.type) {
      return NextResponse.json(
        { success: false, message: 'نام و نوع قالب اجباری است' },
        { status: 400 }
      )
    }
    
    const result = await templatesCollection.insertOne(template)
    
    return NextResponse.json({
      success: true,
      data: { ...template, _id: result.insertedId.toString(), id: result.insertedId.toString() },
      message: 'قالب با موفقیت ایجاد شد'
    })
  } catch (error) {
    console.error('Error creating template:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در ایجاد قالب' },
      { status: 500 }
    )
  }
}

// DELETE - حذف قالب
export async function DELETE(request: NextRequest) {
  try {
    await connectToDatabase()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'شناسه قالب لازم است' },
        { status: 400 }
      )
    }
    
    const templatesCollection = db.collection(TEMPLATES_COLLECTION)
    const result = await templatesCollection.deleteOne({ _id: new ObjectId(id) })
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'قالب یافت نشد' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'قالب با موفقیت حذف شد'
    })
  } catch (error) {
    console.error('Error deleting template:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در حذف قالب' },
      { status: 500 }
    )
  }
}

