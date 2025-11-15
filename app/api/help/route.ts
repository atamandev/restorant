import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://admin:StrongPassword123@185.204.169.107:27017/restaurant?authSource=admin'
const DB_NAME = 'restaurant'
const FAQ_COLLECTION = 'help_faqs'
const ARTICLES_COLLECTION = 'help_articles'
const SECTIONS_COLLECTION = 'help_sections'

let client: MongoClient
let db: any

async function connectToDatabase() {
  try {
    if (!client) {
      client = new MongoClient(MONGO_URI)
      await client.connect()
      db = client.db(DB_NAME)
    }
    return db
  } catch (error) {
    console.error('Database connection error:', error)
    // Reset connection on error
    client = null as any
    db = null as any
    throw error
  }
}

// GET - دریافت FAQs یا Articles یا Sections
export async function GET(request: NextRequest) {
  try {
    const db = await connectToDatabase()
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'faqs', 'articles', 'sections', or null (all)
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category')
    
    if (type === 'faqs') {
      try {
        const faqsCollection = db.collection(FAQ_COLLECTION)
        const filter: any = {}
        
        if (search) {
          filter.$or = [
            { question: { $regex: search, $options: 'i' } },
            { answer: { $regex: search, $options: 'i' } },
            { tags: { $in: [new RegExp(search, 'i')] } }
          ]
        }
        
        if (category && category !== 'all') {
          filter.category = category
        }
        
        const faqs = await faqsCollection.find(filter).sort({ createdAt: -1 }).toArray()
        
        const formattedFAQs = (faqs || []).map((faq: any) => ({
          ...faq,
          id: faq._id ? faq._id.toString() : '',
          _id: faq._id ? faq._id.toString() : ''
        }))
        
        return NextResponse.json({
          success: true,
          data: formattedFAQs
        })
      } catch (faqsError) {
        console.error('Error fetching FAQs:', faqsError)
        return NextResponse.json({
          success: true,
          data: []
        })
      }
    } else if (type === 'articles') {
      try {
        const articlesCollection = db.collection(ARTICLES_COLLECTION)
        const filter: any = {}
        
        if (search) {
          filter.$or = [
            { title: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
            { content: { $regex: search, $options: 'i' } },
            { tags: { $in: [new RegExp(search, 'i')] } }
          ]
        }
        
        if (category && category !== 'all') {
          filter.category = category
        }
        
        const articles = await articlesCollection.find(filter).sort({ createdAt: -1 }).toArray()
        
        const formattedArticles = (articles || []).map((article: any) => ({
          ...article,
          id: article._id ? article._id.toString() : '',
          _id: article._id ? article._id.toString() : ''
        }))
        
        return NextResponse.json({
          success: true,
          data: formattedArticles
        })
      } catch (articlesError) {
        console.error('Error fetching articles:', articlesError)
        return NextResponse.json({
          success: true,
          data: []
        })
      }
    } else if (type === 'sections') {
      try {
        const sectionsCollection = db.collection(SECTIONS_COLLECTION)
        const articlesCollection = db.collection(ARTICLES_COLLECTION)
        
        const sections = await sectionsCollection.find({}).sort({ order: 1, _id: 1 }).toArray()
        
        // اگر sections خالی باشد، return empty array
        if (!sections || sections.length === 0) {
          return NextResponse.json({
            success: true,
            data: []
          })
        }
        
        // برای هر section، مقالات مرتبط را دریافت می‌کنیم
        const sectionsWithArticles = await Promise.all(
          sections.map(async (section: any) => {
            if (!section || !section._id) return null
            
            try {
              const sectionId = section._id.toString()
              // جستجو با هر دو حالت: string و ObjectId
              let articles = []
              try {
                articles = await articlesCollection.find({
                  $or: [
                    { sectionId: sectionId },
                    { sectionId: section._id },
                    { sectionId: new ObjectId(sectionId) }
                  ]
                }).toArray()
              } catch (articleError) {
                console.error('Error fetching articles for section:', articleError)
                articles = []
              }
              
              return {
                ...section,
                id: sectionId,
                _id: sectionId,
                articles: (articles || []).map((article: any) => ({
                  ...article,
                  id: article._id ? article._id.toString() : '',
                  _id: article._id ? article._id.toString() : ''
                }))
              }
            } catch (error) {
              console.error('Error processing section:', error)
              return null
            }
          })
        )
        
        // حذف null values
        const validSections = sectionsWithArticles.filter((s: any) => s !== null)
        
        return NextResponse.json({
          success: true,
          data: validSections
        })
      } catch (sectionsError) {
        console.error('Error fetching sections:', sectionsError)
        return NextResponse.json({
          success: true,
          data: []
        })
      }
    } else {
      // دریافت همه
      const faqsCollection = db.collection(FAQ_COLLECTION)
      const articlesCollection = db.collection(ARTICLES_COLLECTION)
      const sectionsCollection = db.collection(SECTIONS_COLLECTION)
      
      const [faqs, articles, sections] = await Promise.all([
        faqsCollection.find({}).toArray(),
        articlesCollection.find({}).toArray(),
        sectionsCollection.find({}).sort({ order: 1, _id: 1 }).toArray()
      ])
      
      return NextResponse.json({
        success: true,
        data: {
          faqs: faqs.map((f: any) => ({ ...f, id: f._id.toString(), _id: f._id.toString() })),
          articles: articles.map((a: any) => ({ ...a, id: a._id.toString(), _id: a._id.toString() })),
          sections: sections.map((s: any) => ({ ...s, id: s._id.toString(), _id: s._id.toString() }))
        }
      })
    }
  } catch (error: any) {
    console.error('Error fetching help data:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: error?.message || 'خطا در دریافت اطلاعات',
        error: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      },
      { status: 500 }
    )
  }
}

// POST - ایجاد FAQ یا Article یا Section جدید
export async function POST(request: NextRequest) {
  try {
    const db = await connectToDatabase()
    const body = await request.json()
    const { type, ...data } = body
    
    if (type === 'faq') {
      const faqsCollection = db.collection(FAQ_COLLECTION)
      
      if (!data.question || !data.answer) {
        return NextResponse.json(
          { success: false, message: 'سوال و پاسخ اجباری است' },
          { status: 400 }
        )
      }
      
      const faq = {
        question: data.question,
        answer: data.answer,
        category: data.category || 'عمومی',
        tags: data.tags || [],
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      const result = await faqsCollection.insertOne(faq)
      
      return NextResponse.json({
        success: true,
        data: { ...faq, _id: result.insertedId.toString(), id: result.insertedId.toString() },
        message: 'سوال متداول با موفقیت ایجاد شد'
      })
    } else if (type === 'article') {
      const articlesCollection = db.collection(ARTICLES_COLLECTION)
      
      if (!data.title || !data.content) {
        return NextResponse.json(
          { success: false, message: 'عنوان و محتوا اجباری است' },
          { status: 400 }
        )
      }
      
      const article = {
        title: data.title,
        description: data.description || '',
        content: data.content,
        category: data.category || 'عمومی',
        difficulty: data.difficulty || 'beginner',
        estimatedTime: data.estimatedTime || '5 دقیقه',
        tags: data.tags || [],
        sectionId: data.sectionId || null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      const result = await articlesCollection.insertOne(article)
      
      return NextResponse.json({
        success: true,
        data: { ...article, _id: result.insertedId.toString(), id: result.insertedId.toString() },
        message: 'مقاله با موفقیت ایجاد شد'
      })
    } else if (type === 'section') {
      const sectionsCollection = db.collection(SECTIONS_COLLECTION)
      
      if (!data.title) {
        return NextResponse.json(
          { success: false, message: 'عنوان بخش اجباری است' },
          { status: 400 }
        )
      }
      
      // شماره بخش بعدی را محاسبه می‌کنیم
      const count = await sectionsCollection.countDocuments({})
      
      const section = {
        title: data.title,
        description: data.description || '',
        icon: data.icon || 'BookOpen',
        order: data.order || count + 1,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      const result = await sectionsCollection.insertOne(section)
      
      return NextResponse.json({
        success: true,
        data: { ...section, _id: result.insertedId.toString(), id: result.insertedId.toString() },
        message: 'بخش با موفقیت ایجاد شد'
      })
    } else {
      return NextResponse.json(
        { success: false, message: 'نوع نامعتبر' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error creating help item:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در ایجاد آیتم' },
      { status: 500 }
    )
  }
}

// PUT - به‌روزرسانی FAQ یا Article یا Section
export async function PUT(request: NextRequest) {
  try {
    const db = await connectToDatabase()
    const body = await request.json()
    const { type, id, ...data } = body
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'شناسه آیتم لازم است' },
        { status: 400 }
      )
    }
    
    const updateData: any = {
      updatedAt: new Date()
    }
    
    if (type === 'faq') {
      const faqsCollection = db.collection(FAQ_COLLECTION)
      
      const allowedFields = ['question', 'answer', 'category', 'tags']
      allowedFields.forEach(field => {
        if (data[field] !== undefined) {
          updateData[field] = data[field]
        }
      })
      
      const result = await faqsCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData }
      )
      
      if (result.matchedCount === 0) {
        return NextResponse.json(
          { success: false, message: 'سوال متداول یافت نشد' },
          { status: 404 }
        )
      }
      
      const updated = await faqsCollection.findOne({ _id: new ObjectId(id) })
      
      return NextResponse.json({
        success: true,
        data: { ...updated, id: updated._id.toString(), _id: updated._id.toString() },
        message: 'سوال متداول با موفقیت به‌روزرسانی شد'
      })
    } else if (type === 'article') {
      const articlesCollection = db.collection(ARTICLES_COLLECTION)
      
      const allowedFields = ['title', 'description', 'content', 'category', 'difficulty', 'estimatedTime', 'tags', 'sectionId']
      allowedFields.forEach(field => {
        if (data[field] !== undefined) {
          updateData[field] = data[field]
        }
      })
      
      const result = await articlesCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData }
      )
      
      if (result.matchedCount === 0) {
        return NextResponse.json(
          { success: false, message: 'مقاله یافت نشد' },
          { status: 404 }
        )
      }
      
      const updated = await articlesCollection.findOne({ _id: new ObjectId(id) })
      
      return NextResponse.json({
        success: true,
        data: { ...updated, id: updated._id.toString(), _id: updated._id.toString() },
        message: 'مقاله با موفقیت به‌روزرسانی شد'
      })
    } else if (type === 'section') {
      const sectionsCollection = db.collection(SECTIONS_COLLECTION)
      
      const allowedFields = ['title', 'description', 'icon', 'order']
      allowedFields.forEach(field => {
        if (data[field] !== undefined) {
          updateData[field] = data[field]
        }
      })
      
      const result = await sectionsCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData }
      )
      
      if (result.matchedCount === 0) {
        return NextResponse.json(
          { success: false, message: 'بخش یافت نشد' },
          { status: 404 }
        )
      }
      
      const updated = await sectionsCollection.findOne({ _id: new ObjectId(id) })
      
      return NextResponse.json({
        success: true,
        data: { ...updated, id: updated._id.toString(), _id: updated._id.toString() },
        message: 'بخش با موفقیت به‌روزرسانی شد'
      })
    } else {
      return NextResponse.json(
        { success: false, message: 'نوع نامعتبر' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error updating help item:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در به‌روزرسانی آیتم' },
      { status: 500 }
    )
  }
}

// DELETE - حذف FAQ یا Article یا Section
export async function DELETE(request: NextRequest) {
  try {
    const db = await connectToDatabase()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const type = searchParams.get('type')
    
    if (!id || !type) {
      return NextResponse.json(
        { success: false, message: 'شناسه و نوع آیتم لازم است' },
        { status: 400 }
      )
    }
    
    if (type === 'faq') {
      const faqsCollection = db.collection(FAQ_COLLECTION)
      const result = await faqsCollection.deleteOne({ _id: new ObjectId(id) })
      
      if (result.deletedCount === 0) {
        return NextResponse.json(
          { success: false, message: 'سوال متداول یافت نشد' },
          { status: 404 }
        )
      }
      
      return NextResponse.json({
        success: true,
        message: 'سوال متداول با موفقیت حذف شد'
      })
    } else if (type === 'article') {
      const articlesCollection = db.collection(ARTICLES_COLLECTION)
      const result = await articlesCollection.deleteOne({ _id: new ObjectId(id) })
      
      if (result.deletedCount === 0) {
        return NextResponse.json(
          { success: false, message: 'مقاله یافت نشد' },
          { status: 404 }
        )
      }
      
      return NextResponse.json({
        success: true,
        message: 'مقاله با موفقیت حذف شد'
      })
    } else if (type === 'section') {
      const sectionsCollection = db.collection(SECTIONS_COLLECTION)
      const articlesCollection = db.collection(ARTICLES_COLLECTION)
      
      // حذف مقالات مرتبط (با هر دو حالت: string و ObjectId)
      await articlesCollection.deleteMany({
        $or: [
          { sectionId: id },
          { sectionId: new ObjectId(id) }
        ]
      })
      
      const result = await sectionsCollection.deleteOne({ _id: new ObjectId(id) })
      
      if (result.deletedCount === 0) {
        return NextResponse.json(
          { success: false, message: 'بخش یافت نشد' },
          { status: 404 }
        )
      }
      
      return NextResponse.json({
        success: true,
        message: 'بخش و مقالات مرتبط با موفقیت حذف شدند'
      })
    } else {
      return NextResponse.json(
        { success: false, message: 'نوع نامعتبر' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error deleting help item:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در حذف آیتم' },
      { status: 500 }
    )
  }
}

