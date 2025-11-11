import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'
import { readFile } from 'fs/promises'
import { join } from 'path'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://restorenUser:1234@localhost:27017/restoren'
const DB_NAME = 'restoren'
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

// POST - بازیابی بکاپ
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()
    const body = await request.json()
    const { backupId } = body
    
    if (!backupId) {
      return NextResponse.json(
        { success: false, message: 'شناسه بکاپ لازم است' },
        { status: 400 }
      )
    }
    
    // Get backup record
    const backupsCollection = db.collection('backups')
    const backup = await backupsCollection.findOne({ _id: new ObjectId(backupId) })
    
    if (!backup) {
      return NextResponse.json(
        { success: false, message: 'بکاپ یافت نشد' },
        { status: 404 }
      )
    }
    
    if (backup.status !== 'completed') {
      return NextResponse.json(
        { success: false, message: 'بکاپ تکمیل نشده است' },
        { status: 400 }
      )
    }
    
    // Update backup status
    await backupsCollection.updateOne(
      { _id: new ObjectId(backupId) },
      {
        $set: {
          restoreStatus: 'running',
          restoreStartedAt: new Date().toISOString()
        }
      }
    )
    
    try {
      // Read backup file
      const backupFilePath = backup.filePath || join(BACKUP_DIR, backup.fileName || '')
      const backupData = JSON.parse(await readFile(backupFilePath, 'utf-8'))
      
      // Restore each collection
      const restoredCollections: string[] = []
      
      for (const [collectionName, documents] of Object.entries(backupData.collections || {})) {
        const collection = db.collection(collectionName)
        
        // Clear existing data (optional - can be made configurable)
        if (body.clearBeforeRestore) {
          await collection.deleteMany({})
        }
        
        // Insert documents
        if (Array.isArray(documents) && documents.length > 0) {
          await collection.insertMany(documents)
          restoredCollections.push(collectionName)
        }
      }
      
      // Update backup record
      await backupsCollection.updateOne(
        { _id: new ObjectId(backupId) },
        {
          $set: {
            restoreStatus: 'completed',
            restoreCompletedAt: new Date().toISOString(),
            restoredCollections: restoredCollections
          }
        }
      )
      
      return NextResponse.json({
        success: true,
        message: `بکاپ با موفقیت بازیابی شد. ${restoredCollections.length} مجموعه بازیابی شد.`,
        data: {
          restoredCollections,
          restoredCount: restoredCollections.length
        }
      })
    } catch (restoreError) {
      console.error('Restore error:', restoreError)
      
      await backupsCollection.updateOne(
        { _id: new ObjectId(backupId) },
        {
          $set: {
            restoreStatus: 'failed',
            restoreError: restoreError instanceof Error ? restoreError.message : 'خطا در بازیابی',
            restoreCompletedAt: new Date().toISOString()
          }
        }
      )
      
      return NextResponse.json(
        {
          success: false,
          message: restoreError instanceof Error ? restoreError.message : 'خطا در بازیابی بکاپ'
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error restoring backup:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در بازیابی بکاپ' },
      { status: 500 }
    )
  }
}

