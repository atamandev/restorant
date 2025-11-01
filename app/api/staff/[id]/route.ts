import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://restorenUser:1234@localhost:27017/restoren'
const DB_NAME = 'restoren'
const COLLECTION_NAME = 'staff'

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

// GET - دریافت کارمند خاص
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase()
    const staffCollection = db.collection(COLLECTION_NAME)
    
    const member = await staffCollection.findOne({ _id: new ObjectId(params.id) })
    
    if (!member) {
      return NextResponse.json(
        { success: false, message: 'کارمند یافت نشد' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: { ...member, id: member._id.toString(), _id: member._id.toString() }
    })
  } catch (error) {
    console.error('Error fetching staff member:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت اطلاعات کارمند' },
      { status: 500 }
    )
  }
}

