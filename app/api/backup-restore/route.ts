import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'
import { writeFile, readFile, mkdir, access } from 'fs/promises'
import { join } from 'path'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://admin:StrongPassword123@185.204.169.107:27017/restaurant?authSource=admin'
const DB_NAME = 'restaurant'
const COLLECTION_NAME = 'backups'
const SCHEDULES_COLLECTION = 'backup_schedules'
const BACKUP_DIR = join(process.cwd(), 'backups')

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

// Ensure backup directory exists
async function ensureBackupDir() {
  try {
    await access(BACKUP_DIR)
  } catch {
    await mkdir(BACKUP_DIR, { recursive: true })
  }
}

// GET - دریافت بکاپ‌ها یا تنظیمات
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'backups', 'schedules', 'settings', 'stats'
    const id = searchParams.get('id')
    
    if (type === 'schedules') {
      const collection = db.collection(SCHEDULES_COLLECTION)
      if (id) {
        const schedule = await collection.findOne({ _id: new ObjectId(id) })
        if (!schedule) {
          return NextResponse.json(
            { success: false, message: 'زمان‌بندی یافت نشد' },
            { status: 404 }
          )
        }
        return NextResponse.json({
          success: true,
          data: { ...schedule, id: schedule._id.toString(), _id: schedule._id.toString() }
        })
      } else {
        const schedules = await collection.find({}).sort({ createdAt: -1 }).toArray()
        const formattedSchedules = schedules.map((s: any) => ({
          ...s,
          id: s._id.toString(),
          _id: s._id.toString()
        }))
        return NextResponse.json({
          success: true,
          data: formattedSchedules
        })
      }
    } else if (type === 'backups' || type === null) {
      // Get all backups (default if type not specified)
      const collection = db.collection(COLLECTION_NAME)
      if (id) {
        const backup = await collection.findOne({ _id: new ObjectId(id) })
        if (!backup) {
          return NextResponse.json(
            { success: false, message: 'بکاپ یافت نشد' },
            { status: 404 }
          )
        }
        return NextResponse.json({
          success: true,
          data: { ...backup, id: backup._id.toString(), _id: backup._id.toString() }
        })
      } else {
        const backups = await collection.find({}).sort({ createdAt: -1 }).toArray()
        const formattedBackups = backups.map((b: any) => ({
          ...b,
          id: b._id.toString(),
          _id: b._id.toString()
        }))
        return NextResponse.json({
          success: true,
          data: formattedBackups
        })
      }
    } else if (type === 'stats') {
      const backupsCollection = db.collection(COLLECTION_NAME)
      const schedulesCollection = db.collection(SCHEDULES_COLLECTION)
      
      const totalBackups = await backupsCollection.countDocuments({})
      const completedBackups = await backupsCollection.countDocuments({ status: 'completed' })
      const failedBackups = await backupsCollection.countDocuments({ status: 'failed' })
      const runningBackups = await backupsCollection.countDocuments({ status: 'running' })
      
      const totalSize = await backupsCollection.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, totalSize: { $sum: '$size' } } }
      ]).toArray()
      
      const activeSchedules = await schedulesCollection.countDocuments({ enabled: true })
      
      return NextResponse.json({
        success: true,
        data: {
          totalBackups,
          completedBackups,
          failedBackups,
          runningBackups,
          totalSize: totalSize[0]?.totalSize || 0,
          activeSchedules
        }
      })
    }
  } catch (error) {
    console.error('Error fetching backup data:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت اطلاعات' },
      { status: 500 }
    )
  }
}

// POST - ایجاد بکاپ یا زمان‌بندی جدید
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()
    const body = await request.json()
    const { action, type, ...data } = body
    
    if (action === 'create-backup') {
      // Create new backup
      const backupsCollection = db.collection(COLLECTION_NAME)
      
      const backupName = `Backup ${type === 'full' ? 'کامل' : 'افزایشی'} - ${new Date().toLocaleDateString('fa-IR')}`
      
      // Start backup process
      const backup = {
        name: data.name || backupName,
        type: type || 'full',
        status: 'running',
        size: 0,
        createdAt: new Date().toISOString(),
        location: data.location || 'local',
        encrypted: data.encrypted !== undefined ? data.encrypted : true,
        version: '1.0.0',
        description: data.description || '',
        collections: [],
        startedAt: new Date().toISOString()
      }
      
      const result = await backupsCollection.insertOne(backup)
      const backupId = result.insertedId.toString()
      
      // Perform actual backup (simplified - in production use mongodump)
      try {
        await ensureBackupDir()
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
        const backupFileName = `${DB_NAME}_${timestamp}_${type}.json`
        const backupFilePath = join(BACKUP_DIR, backupFileName)
        
        // Get all collections
        const collections = await db.listCollections().toArray()
        const backupData: any = {
          database: DB_NAME,
          timestamp: new Date().toISOString(),
          type: type,
          collections: {}
        }
        
        // Backup each collection (limited data for demo)
        for (const collectionInfo of collections) {
          const collectionName = collectionInfo.name
          const collection = db.collection(collectionName)
          const documents = await collection.find({}).limit(1000).toArray()
          backupData.collections[collectionName] = documents
        }
        
        // Write backup file
        await writeFile(backupFilePath, JSON.stringify(backupData, null, 2), 'utf-8')
        
        // Get file size
        const fs = require('fs')
        const stats = fs.statSync(backupFilePath)
        const fileSizeInMB = Math.round((stats.size / (1024 * 1024)) * 100) / 100
        
        // Update backup record
        await backupsCollection.updateOne(
          { _id: new ObjectId(backupId) },
          {
            $set: {
              status: 'completed',
              size: fileSizeInMB,
              filePath: backupFilePath,
              fileName: backupFileName,
              duration: Math.round((Date.now() - new Date(backup.startedAt).getTime()) / 1000 / 60),
              completedAt: new Date().toISOString(),
              collections: collections.map((c: any) => c.name)
            }
          }
        )
        
        return NextResponse.json({
          success: true,
          data: { ...backup, _id: backupId, id: backupId, status: 'completed', size: fileSizeInMB },
          message: 'بکاپ با موفقیت ایجاد شد'
        })
      } catch (backupError) {
        console.error('Backup error:', backupError)
        await backupsCollection.updateOne(
          { _id: new ObjectId(backupId) },
          {
            $set: {
              status: 'failed',
              errorMessage: backupError instanceof Error ? backupError.message : 'خطا در ایجاد بکاپ',
              completedAt: new Date().toISOString()
            }
          }
        )
        return NextResponse.json(
          { success: false, message: 'خطا در ایجاد بکاپ' },
          { status: 500 }
        )
      }
    } else if (action === 'create-schedule') {
      // Create new schedule
      const schedulesCollection = db.collection(SCHEDULES_COLLECTION)
      
      const schedule = {
        name: data.name,
        type: data.type || 'full',
        frequency: data.frequency || 'daily',
        time: data.time || '02:00',
        enabled: data.enabled !== undefined ? data.enabled : true,
        retention: data.retention || 30,
        location: data.location || 'local',
        encryption: data.encryption !== undefined ? data.encryption : true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      const result = await schedulesCollection.insertOne(schedule)
      
      return NextResponse.json({
        success: true,
        data: { ...schedule, _id: result.insertedId.toString(), id: result.insertedId.toString() },
        message: 'زمان‌بندی با موفقیت ایجاد شد'
      })
    }
    
    return NextResponse.json(
      { success: false, message: 'عملیات نامعتبر' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error creating backup/schedule:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در ایجاد بکاپ یا زمان‌بندی' },
      { status: 500 }
    )
  }
}

// PUT - به‌روزرسانی بکاپ یا زمان‌بندی
export async function PUT(request: NextRequest) {
  try {
    await connectToDatabase()
    const body = await request.json()
    const { id, entity, ...updateData } = body
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'شناسه لازم است' },
        { status: 400 }
      )
    }
    
    if (entity === 'schedule') {
      const schedulesCollection = db.collection(SCHEDULES_COLLECTION)
      
      const allowedFields = ['name', 'type', 'frequency', 'time', 'enabled', 'retention', 'location', 'encryption']
      const update: any = { updatedAt: new Date().toISOString() }
      
      allowedFields.forEach(field => {
        if (updateData[field] !== undefined) {
          update[field] = updateData[field]
        }
      })
      
      const result = await schedulesCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: update }
      )
      
      if (result.matchedCount === 0) {
        return NextResponse.json(
          { success: false, message: 'زمان‌بندی یافت نشد' },
          { status: 404 }
        )
      }
      
      const updated = await schedulesCollection.findOne({ _id: new ObjectId(id) })
      return NextResponse.json({
        success: true,
        data: { ...updated, id: updated._id.toString(), _id: updated._id.toString() },
        message: 'زمان‌بندی با موفقیت به‌روزرسانی شد'
      })
    }
    
    return NextResponse.json(
      { success: false, message: 'نوع entity نامعتبر' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error updating backup/schedule:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در به‌روزرسانی' },
      { status: 500 }
    )
  }
}

// DELETE - حذف بکاپ یا زمان‌بندی
export async function DELETE(request: NextRequest) {
  try {
    await connectToDatabase()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const entity = searchParams.get('entity') // 'backup' or 'schedule'
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'شناسه لازم است' },
        { status: 400 }
      )
    }
    
    if (entity === 'backup') {
      const backupsCollection = db.collection(COLLECTION_NAME)
      const backup = await backupsCollection.findOne({ _id: new ObjectId(id) })
      
      // Delete backup file if exists
      if (backup?.filePath) {
        try {
          const fs = require('fs')
          if (fs.existsSync(backup.filePath)) {
            fs.unlinkSync(backup.filePath)
          }
        } catch (fileError) {
          console.error('Error deleting backup file:', fileError)
        }
      }
      
      const result = await backupsCollection.deleteOne({ _id: new ObjectId(id) })
      
      if (result.deletedCount === 0) {
        return NextResponse.json(
          { success: false, message: 'بکاپ یافت نشد' },
          { status: 404 }
        )
      }
      
      return NextResponse.json({
        success: true,
        message: 'بکاپ با موفقیت حذف شد'
      })
    } else if (entity === 'schedule') {
      const schedulesCollection = db.collection(SCHEDULES_COLLECTION)
      const result = await schedulesCollection.deleteOne({ _id: new ObjectId(id) })
      
      if (result.deletedCount === 0) {
        return NextResponse.json(
          { success: false, message: 'زمان‌بندی یافت نشد' },
          { status: 404 }
        )
      }
      
      return NextResponse.json({
        success: true,
        message: 'زمان‌بندی با موفقیت حذف شد'
      })
    }
    
    return NextResponse.json(
      { success: false, message: 'نوع entity نامعتبر' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error deleting backup/schedule:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در حذف' },
      { status: 500 }
    )
  }
}

