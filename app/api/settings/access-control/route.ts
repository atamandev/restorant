import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://restorenUser:1234@localhost:27017/restoren'
const DB_NAME = 'restoren'

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

// GET - بررسی دسترسی کاربر به یک بخش خاص
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()
    
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const module = searchParams.get('module') // pos, menu, inventory, accounting, reports, settings
    const action = searchParams.get('action') || 'view' // view, create, update, delete, approve

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'شناسه کاربر اجباری است' },
        { status: 400 }
      )
    }

    const usersCollection = db.collection('users')
    const rolesCollection = db.collection('user_roles')

    const user = await usersCollection.findOne({ _id: new ObjectId(userId) })
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'کاربر یافت نشد' },
        { status: 404 }
      )
    }

    if (!user.isActive) {
      return NextResponse.json({
        success: true,
        data: {
          hasAccess: false,
          reason: 'کاربر غیرفعال است'
        }
      })
    }

    const roleName = user.role
    const role = await rolesCollection.findOne({ name: roleName })
    
    if (!role) {
      return NextResponse.json({
        success: true,
        data: {
          hasAccess: false,
          reason: 'نقش کاربر یافت نشد'
        }
      })
    }

    // Check permissions
    const permissions = role.permissions || []
    const permissionKey = module ? `${module}_${action}` : '*'
    
    // Check for wildcard permission or specific permission
    const hasAccess = permissions.includes('*') || 
                     permissions.includes(`${module}_*`) ||
                     permissions.includes(permissionKey)

    return NextResponse.json({
      success: true,
      data: {
        hasAccess,
        userId,
        role: roleName,
        module,
        action,
        permissions: hasAccess ? permissions : [],
        reason: hasAccess ? 'دسترسی مجاز است' : 'دسترسی مجاز نیست'
      }
    })
  } catch (error) {
    console.error('Error checking access:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در بررسی دسترسی',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// POST - بررسی دسترسی برای چندین ماژول (batch check)
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()
    
    const body = await request.json()
    const { userId, modules } = body

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'شناسه کاربر اجباری است' },
        { status: 400 }
      )
    }

    if (!modules || !Array.isArray(modules)) {
      return NextResponse.json(
        { success: false, message: 'لیست ماژول‌ها اجباری است' },
        { status: 400 }
      )
    }

    const usersCollection = db.collection('users')
    const rolesCollection = db.collection('user_roles')

    const user = await usersCollection.findOne({ _id: new ObjectId(userId) })
    if (!user || !user.isActive) {
      return NextResponse.json({
        success: true,
        data: modules.map((module: string) => ({
          module,
          hasAccess: false,
          reason: 'کاربر غیرفعال است'
        }))
      })
    }

    const roleName = user.role
    const role = await rolesCollection.findOne({ name: roleName })
    
    if (!role) {
      return NextResponse.json({
        success: true,
        data: modules.map((module: string) => ({
          module,
          hasAccess: false,
          reason: 'نقش کاربر یافت نشد'
        }))
      })
    }

    const permissions = role.permissions || []
    const hasWildcardAccess = permissions.includes('*')

    const accessResults = modules.map((module: any) => {
      const moduleName = typeof module === 'string' ? module : module.name
      const action = typeof module === 'string' ? 'view' : (module.action || 'view')
      const permissionKey = `${moduleName}_${action}`
      
      const hasAccess = hasWildcardAccess || 
                       permissions.includes(`${moduleName}_*`) ||
                       permissions.includes(permissionKey)

      return {
        module: moduleName,
        action,
        hasAccess,
        reason: hasAccess ? 'دسترسی مجاز است' : 'دسترسی مجاز نیست'
      }
    })

    return NextResponse.json({
      success: true,
      data: accessResults,
      user: {
        id: user._id.toString(),
        username: user.username,
        role: roleName
      }
    })
  } catch (error) {
    console.error('Error batch checking access:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در بررسی دسترسی',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

