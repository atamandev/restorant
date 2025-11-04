// Helper functions for authentication and authorization
import { NextRequest } from 'next/server'
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

// Get user from token (from Authorization header)
export async function getUserFromRequest(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }

    const token = authHeader.substring(7)
    // In production, verify JWT token here
    // For now, we'll use a simple approach
    
    const db = await connectToDatabase()
    const usersCollection = db.collection('users')
    
    // Extract userId from token (simplified - should use JWT verification)
    // For now, check if user exists in database
    // In production, decode JWT and get userId
    
    return null // Placeholder
  } catch (error) {
    console.error('Error getting user from request:', error)
    return null
  }
}

// Check if user has permission
export async function checkPermission(
  userId: string | null,
  permission: string,
  action: 'view' | 'create' | 'update' | 'delete' | 'approve' = 'view'
): Promise<boolean> {
  try {
    if (!userId) {
      return false
    }

    const db = await connectToDatabase()
    const usersCollection = db.collection('users')
    const rolesCollection = db.collection('user_roles')

    const user = await usersCollection.findOne({ _id: new ObjectId(userId) })
    if (!user || !user.isActive) {
      return false
    }

    const roleName = user.role
    const role = await rolesCollection.findOne({ name: roleName })
    
    if (!role) {
      return false
    }

    // Check if role has the permission
    const permissionKey = `${permission}_${action}`
    return role.permissions?.includes(permissionKey) || role.permissions?.includes('*') || false
  } catch (error) {
    console.error('Error checking permission:', error)
    return false
  }
}

// Get user permissions
export async function getUserPermissions(userId: string | null): Promise<string[]> {
  try {
    if (!userId) {
      return []
    }

    const db = await connectToDatabase()
    const usersCollection = db.collection('users')
    const rolesCollection = db.collection('user_roles')

    const user = await usersCollection.findOne({ _id: new ObjectId(userId) })
    if (!user || !user.isActive) {
      return []
    }

    const roleName = user.role
    const role = await rolesCollection.findOne({ name: roleName })
    
    if (!role) {
      return []
    }

    return role.permissions || []
  } catch (error) {
    console.error('Error getting user permissions:', error)
    return []
  }
}

// Check if user is admin
export async function isAdmin(userId: string | null): Promise<boolean> {
  try {
    if (!userId) {
      return false
    }

    const db = await connectToDatabase()
    const usersCollection = db.collection('users')

    const user = await usersCollection.findOne({ _id: new ObjectId(userId) })
    if (!user) {
      return false
    }

    const roleName = user.role?.toLowerCase() || ''
    return roleName === 'admin' || roleName === 'مدیر' || roleName.includes('admin')
  } catch (error) {
    console.error('Error checking admin:', error)
    return false
  }
}

