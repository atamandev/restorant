import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://restorenUser:1234@localhost:27017/restoren'
const client = new MongoClient(MONGO_URI)

// GET /api/people - دریافت لیست اشخاص
export async function GET(request: NextRequest) {
  try {
    await client.connect()
    const db = client.db('restoren')
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const type = searchParams.get('type')
    const isActive = searchParams.get('isActive')
    
    const skip = (page - 1) * limit
    
    // Build query
    const query: any = {}
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } }
      ]
    }
    if (type && type !== 'all') {
      query.type = type
    }
    if (isActive !== null && isActive !== undefined) {
      query.isActive = isActive === 'true'
    }
    
    const people = await db.collection('people')
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray()
    
    const total = await db.collection('people').countDocuments(query)
    
    return NextResponse.json({
      success: true,
      data: people,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      message: 'لیست اشخاص با موفقیت دریافت شد'
    })
  } catch (error) {
    console.error('Error fetching people:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در دریافت لیست اشخاص',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  } finally {
    await client.close()
  }
}

// POST /api/people - ایجاد شخص جدید
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Received body:', body)
    
    const { 
      firstName, 
      lastName, 
      phoneNumber, 
      email, 
      address, 
      type, 
      isActive, 
      notes 
    } = body

    // Validate required fields
    if (!firstName || !lastName || !type) {
      return NextResponse.json(
        { success: false, message: 'نام، نام خانوادگی و نوع شخص اجباری است' },
        { status: 400 }
      )
    }

    await client.connect()
    const db = client.db('restoren')
    
    const personData = {
      firstName: String(firstName),
      lastName: String(lastName),
      phoneNumber: phoneNumber ? String(phoneNumber) : null,
      email: email ? String(email) : null,
      address: address ? String(address) : null,
      type: String(type),
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      notes: notes ? String(notes) : null,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    console.log('Creating person with data:', personData)

    const result = await db.collection('people').insertOne(personData)
    
    const person = await db.collection('people').findOne({ _id: result.insertedId })

    console.log('Person created successfully:', person)

    return NextResponse.json({
      success: true,
      data: person,
      message: 'شخص با موفقیت ایجاد شد'
    })
  } catch (error) {
    console.error('Error creating person:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در ایجاد شخص',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  } finally {
    await client.close()
  }
}

// PUT /api/people - به‌روزرسانی شخص
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Received update body:', body)
    
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'شناسه شخص اجباری است' },
        { status: 400 }
      )
    }

    await client.connect()
    const db = client.db('restoren')
    
    const updateFields: any = {
      ...updateData,
      updatedAt: new Date()
    }

    // Convert string fields
    if (updateFields.firstName !== undefined) {
      updateFields.firstName = String(updateFields.firstName)
    }
    if (updateFields.lastName !== undefined) {
      updateFields.lastName = String(updateFields.lastName)
    }
    if (updateFields.phoneNumber !== undefined) {
      updateFields.phoneNumber = updateFields.phoneNumber ? String(updateFields.phoneNumber) : null
    }
    if (updateFields.email !== undefined) {
      updateFields.email = updateFields.email ? String(updateFields.email) : null
    }
    if (updateFields.address !== undefined) {
      updateFields.address = updateFields.address ? String(updateFields.address) : null
    }
    if (updateFields.type !== undefined) {
      updateFields.type = String(updateFields.type)
    }
    if (updateFields.notes !== undefined) {
      updateFields.notes = updateFields.notes ? String(updateFields.notes) : null
    }
    if (updateFields.isActive !== undefined) {
      updateFields.isActive = Boolean(updateFields.isActive)
    }

    console.log('Updating person with data:', updateFields)

    const result = await db.collection('people').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    )

    console.log('Update result:', result)

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'شخص مورد نظر یافت نشد' },
        { status: 404 }
      )
    }

    const updatedPerson = await db.collection('people').findOne({ _id: new ObjectId(id) })

    console.log('Updated person:', updatedPerson)

    return NextResponse.json({
      success: true,
      data: updatedPerson,
      message: 'شخص با موفقیت به‌روزرسانی شد'
    })
  } catch (error) {
    console.error('Error updating person:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در به‌روزرسانی شخص',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  } finally {
    await client.close()
  }
}

// DELETE /api/people - حذف شخص
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'شناسه شخص اجباری است' },
        { status: 400 }
      )
    }

    await client.connect()
    const db = client.db('restoren')
    
    const result = await db.collection('people').deleteOne({ _id: new ObjectId(id) })

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'شخص مورد نظر یافت نشد' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'شخص با موفقیت حذف شد'
    })
  } catch (error) {
    console.error('Error deleting person:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در حذف شخص',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  } finally {
    await client.close()
  }
}

