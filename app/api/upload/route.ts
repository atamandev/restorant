import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

// ایجاد پوشه uploads اگر وجود نداشت
const uploadsDir = join(process.cwd(), 'public', 'uploads')

async function ensureUploadsDir() {
  if (!existsSync(uploadsDir)) {
    await mkdir(uploadsDir, { recursive: true })
  }
}

// POST - آپلود فایل
export async function POST(request: NextRequest) {
  try {
    await ensureUploadsDir()
    
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { success: false, message: 'فایلی ارسال نشده است' },
        { status: 400 }
      )
    }

    // بررسی نوع فایل (فقط تصاویر)
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, message: 'فقط فایل‌های تصویری مجاز هستند' },
        { status: 400 }
      )
    }

    // بررسی اندازه فایل (حداکثر 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, message: 'حجم فایل نباید بیشتر از 5 مگابایت باشد' },
        { status: 400 }
      )
    }

    // تولید نام فایل منحصر به فرد
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const fileExtension = file.name.split('.').pop() || 'jpg'
    const fileName = `logo_${timestamp}_${randomString}.${fileExtension}`
    const filePath = join(uploadsDir, fileName)

    // تبدیل فایل به buffer و ذخیره
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    await writeFile(filePath, buffer)

    // تولید URL برای دسترسی به فایل
    const fileUrl = `/uploads/${fileName}`

    return NextResponse.json({
      success: true,
      url: fileUrl,
      message: 'فایل با موفقیت آپلود شد'
    })
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در آپلود فایل' },
      { status: 500 }
    )
  }
}

