import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://restorenUser:1234@localhost:27017/restoren'
const DB_NAME = 'restoren'
const COLLECTION_NAME = 'invoice_templates'

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

// GET - دریافت تمام قالب‌های فاکتور
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'templates', 'stats', 'fields'
    const templateId = searchParams.get('templateId')
    
    if (type === 'stats') {
      // آمار کلی
      const totalTemplates = await collection.countDocuments({})
      const activeTemplates = await collection.countDocuments({ isActive: true })
      const defaultTemplates = await collection.countDocuments({ isDefault: true })
      
      // توزیع بر اساس نوع
      const templatesByType = await collection.aggregate([
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 }
          }
        }
      ]).toArray()
      
      const typeDistribution = {
        'dine-in': 0,
        'takeaway': 0,
        'delivery': 0,
        'general': 0
      }
      
      templatesByType.forEach((item: any) => {
        if (typeDistribution.hasOwnProperty(item._id)) {
          typeDistribution[item._id as keyof typeof typeDistribution] = item.count
        }
      })
      
      // توزیع بر اساس وضعیت
      const statusDistribution = {
        active: activeTemplates,
        inactive: totalTemplates - activeTemplates
      }
      
      return NextResponse.json({
        success: true,
        data: {
          totalTemplates,
          activeTemplates,
          defaultTemplates,
          inactiveTemplates: totalTemplates - activeTemplates,
          typeDistribution,
          statusDistribution
        }
      })
    } else if (type === 'fields' && templateId) {
      // دریافت فیلدهای یک قالب خاص
      const template = await collection.findOne({ _id: new ObjectId(templateId) })
      if (!template) {
        return NextResponse.json(
          { success: false, message: 'قالب یافت نشد' },
          { status: 404 }
        )
      }
      return NextResponse.json({
        success: true,
        data: template.fields || []
      })
    } else if (templateId) {
      // دریافت یک قالب خاص
      const template = await collection.findOne({ _id: new ObjectId(templateId) })
      if (!template) {
        return NextResponse.json(
          { success: false, message: 'قالب یافت نشد' },
          { status: 404 }
        )
      }
      return NextResponse.json({
        success: true,
        data: template
      })
    } else {
      // دریافت همه قالب‌ها
      const templates = await collection.find({}).sort({ createdAt: -1 }).toArray()
      
      // تبدیل _id به id برای consistency
      const formattedTemplates = templates.map((template: any) => ({
        ...template,
        id: template._id.toString(),
        _id: template._id.toString()
      }))
      
      return NextResponse.json({
        success: true,
        data: formattedTemplates
      })
    }
  } catch (error) {
    console.error('Error fetching invoice templates:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت قالب‌های فاکتور' },
      { status: 500 }
    )
  }
}

// POST - ایجاد قالب جدید
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const body = await request.json()
    
    // اگر قالب پیش‌فرض است، بقیه را غیرفعال کن
    if (body.isDefault) {
      await collection.updateMany(
        { isDefault: true },
        { $set: { isDefault: false } }
      )
    }
    
    const template = {
      name: body.name,
      type: body.type, // 'dine-in', 'takeaway', 'delivery', 'general'
      description: body.description || '',
      isDefault: body.isDefault || false,
      isActive: body.isActive !== undefined ? body.isActive : true,
      fields: body.fields || [],
      preview: body.preview || '',
      settings: body.settings || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    const result = await collection.insertOne(template)
    
    return NextResponse.json({
      success: true,
      data: { ...template, _id: result.insertedId.toString(), id: result.insertedId.toString() },
      message: 'قالب با موفقیت ایجاد شد'
    })
  } catch (error) {
    console.error('Error creating invoice template:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در ایجاد قالب' },
      { status: 500 }
    )
  }
}

// PUT - به‌روزرسانی قالب
export async function PUT(request: NextRequest) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const body = await request.json()
    const { id } = body
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'شناسه قالب لازم است' },
        { status: 400 }
      )
    }
    
    // اگر قالب پیش‌فرض است، بقیه را غیرفعال کن
    if (body.isDefault) {
      await collection.updateMany(
        { isDefault: true, _id: { $ne: new ObjectId(id) } },
        { $set: { isDefault: false } }
      )
    }
    
    const updateData: any = {
      updatedAt: new Date().toISOString()
    }
    
    const allowedFields = ['name', 'type', 'description', 'isDefault', 'isActive', 'fields', 'preview', 'settings']
    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    })
    
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    )
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'قالب یافت نشد' },
        { status: 404 }
      )
    }
    
    const updatedTemplate = await collection.findOne({ _id: new ObjectId(id) })
    
    return NextResponse.json({
      success: true,
      data: { ...updatedTemplate, id: updatedTemplate._id.toString(), _id: updatedTemplate._id.toString() },
      message: 'قالب با موفقیت به‌روزرسانی شد'
    })
  } catch (error) {
    console.error('Error updating invoice template:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در به‌روزرسانی قالب' },
      { status: 500 }
    )
  }
}

// DELETE - حذف قالب
export async function DELETE(request: NextRequest) {
  try {
    await connectToDatabase()
    const collection = db.collection(COLLECTION_NAME)
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'شناسه قالب لازم است' },
        { status: 400 }
      )
    }
    
    // بررسی اینکه قالب پیش‌فرض نباشد
    const template = await collection.findOne({ _id: new ObjectId(id) })
    if (template?.isDefault) {
      return NextResponse.json(
        { success: false, message: 'نمی‌توان قالب پیش‌فرض را حذف کرد' },
        { status: 400 }
      )
    }
    
    const result = await collection.deleteOne({ _id: new ObjectId(id) })
    
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
    console.error('Error deleting invoice template:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در حذف قالب' },
      { status: 500 }
    )
  }
}

