import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://restorenUser:1234@localhost:27017/restoren'
const client = new MongoClient(MONGO_URI)

// GET /api/people - دریافت لیست اشخاص (شامل مشتریان از collection customers)
export async function GET(request: NextRequest) {
  try {
    await client.connect()
    const db = client.db('restoren')
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '1000') // افزایش limit برای نمایش همه
    const search = searchParams.get('search') || ''
    const type = searchParams.get('type')
    const isActive = searchParams.get('isActive')
    
    const skip = (page - 1) * limit
    
    // دریافت از collection people
    const peopleQuery: any = {}
    if (search) {
      peopleQuery.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } }
      ]
    }
    if (type && type !== 'all') {
      peopleQuery.type = type
    }
    if (isActive !== null && isActive !== undefined) {
      peopleQuery.isActive = isActive === 'true'
    }
    
    const peopleFromCollection = await db.collection('people')
      .find(peopleQuery)
      .sort({ createdAt: -1 })
      .toArray()
    
    // دریافت مشتریان از collection customers (فقط برای type='customer' یا 'all')
    let customersFromCollection: any[] = []
    if (!type || type === 'all' || type === 'customer') {
      const customersQuery: any = {}
      if (search) {
        customersQuery.$or = [
          { name: { $regex: search, $options: 'i' } },
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { address: { $regex: search, $options: 'i' } }
        ]
      }
      if (isActive !== null && isActive !== undefined) {
        customersQuery.status = isActive === 'true' ? 'active' : 'inactive'
      }
      
      const customers = await db.collection('customers')
        .find(customersQuery)
        .sort({ registrationDate: -1 })
        .toArray()
      
      // تبدیل مشتریان به فرمت Person
      customersFromCollection = customers.map(customer => {
        // تقسیم name به firstName و lastName
        const nameParts = (customer.name || '').split(' ')
        const firstName = customer.firstName || nameParts[0] || ''
        const lastName = customer.lastName || nameParts.slice(1).join(' ') || ''
        
        return {
          _id: customer._id,
          id: customer._id?.toString(),
          firstName: firstName,
          lastName: lastName,
          phoneNumber: customer.phone || '',
          email: customer.email || '',
          address: customer.address || '',
          type: customer.customerType === 'golden' || customer.customerType === 'طلایی' ? 'golden_customer' : 'customer',
          isActive: customer.status === 'active',
          notes: customer.notes || '',
          createdAt: customer.registrationDate || customer.createdAt || new Date(),
          updatedAt: customer.updatedAt || new Date(),
          // اطلاعات اضافی از customers
          customerNumber: customer.customerNumber || '',
          totalOrders: customer.totalOrders || 0,
          totalSpent: customer.totalSpent || 0,
          source: 'customers' // برای تشخیص اینکه از کدام collection آمده
        }
      })
    }
    
    // دریافت مشتریان طلایی از collection customers (اگر type='golden_customer' یا 'all')
    let goldenCustomersFromCollection: any[] = []
    if (!type || type === 'all' || type === 'golden_customer') {
      const goldenQuery: any = {
        customerType: { $in: ['golden', 'طلایی', 'vip'] }
      }
      if (search) {
        goldenQuery.$or = [
          { name: { $regex: search, $options: 'i' } },
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      }
      if (isActive !== null && isActive !== undefined) {
        goldenQuery.status = isActive === 'true' ? 'active' : 'inactive'
      }
      
      const goldenCustomers = await db.collection('customers')
        .find(goldenQuery)
        .sort({ registrationDate: -1 })
        .toArray()
      
      goldenCustomersFromCollection = goldenCustomers.map(customer => {
        const nameParts = (customer.name || '').split(' ')
        const firstName = customer.firstName || nameParts[0] || ''
        const lastName = customer.lastName || nameParts.slice(1).join(' ') || ''
        
        return {
          _id: customer._id,
          id: customer._id?.toString(),
          firstName: firstName,
          lastName: lastName,
          phoneNumber: customer.phone || '',
          email: customer.email || '',
          address: customer.address || '',
          type: 'golden_customer',
          isActive: customer.status === 'active',
          notes: customer.notes || '',
          createdAt: customer.registrationDate || customer.createdAt || new Date(),
          updatedAt: customer.updatedAt || new Date(),
          customerNumber: customer.customerNumber || '',
          totalOrders: customer.totalOrders || 0,
          totalSpent: customer.totalSpent || 0,
          source: 'customers'
        }
      })
    }
    
    // ترکیب همه داده‌ها و حذف تکراری‌ها (بر اساس phone یا _id)
    const allPeople = [...peopleFromCollection]
    const seenIds = new Set<string>()
    const seenPhones = new Set<string>()
    
    // اضافه کردن people از collection people
    peopleFromCollection.forEach(person => {
      if (person._id) {
        seenIds.add(person._id.toString())
      }
      if (person.phoneNumber) {
        seenPhones.add(person.phoneNumber)
      }
    })
    
    // اضافه کردن مشتریان (فقط اگر تکراری نباشند)
    customersFromCollection.forEach(customer => {
      const customerId = customer._id?.toString()
      const customerPhone = customer.phoneNumber
      
      // اگر در people نبود و تلفن تکراری نبود، اضافه کن
      if (customerId && !seenIds.has(customerId) && 
          (!customerPhone || !seenPhones.has(customerPhone))) {
        allPeople.push(customer)
        seenIds.add(customerId)
        if (customerPhone) {
          seenPhones.add(customerPhone)
        }
      }
    })
    
    // اضافه کردن مشتریان طلایی (فقط اگر تکراری نباشند)
    goldenCustomersFromCollection.forEach(customer => {
      const customerId = customer._id?.toString()
      const customerPhone = customer.phoneNumber
      
      if (customerId && !seenIds.has(customerId) && 
          (!customerPhone || !seenPhones.has(customerPhone))) {
        allPeople.push(customer)
        seenIds.add(customerId)
        if (customerPhone) {
          seenPhones.add(customerPhone)
        }
      }
    })
    
    // فیلتر بر اساس type (اگر مشخص شده)
    let filteredPeople = allPeople
    if (type && type !== 'all') {
      filteredPeople = allPeople.filter(person => person.type === type)
    }
    
    // مرتب‌سازی بر اساس createdAt
    filteredPeople.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime()
      const dateB = new Date(b.createdAt || 0).getTime()
      return dateB - dateA
    })
    
    // Pagination
    const total = filteredPeople.length
    const paginatedPeople = filteredPeople.slice(skip, skip + limit)
    
    return NextResponse.json({
      success: true,
      data: paginatedPeople,
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
      notes,
      salary,
      position,
      businessName,
      supplierType
    } = body

    // Validate required fields
    if (!firstName || !lastName || !type) {
      return NextResponse.json(
        { success: false, message: 'نام، نام خانوادگی و نوع شخص اجباری است' },
        { status: 400 }
      )
    }

    // Validate employee fields
    if (type === 'employee' && !position) {
      return NextResponse.json(
        { success: false, message: 'سمت کارمند اجباری است' },
        { status: 400 }
      )
    }

    // Validate supplier fields
    if (type === 'supplier') {
      if (!businessName || !businessName.trim()) {
        return NextResponse.json(
          { success: false, message: 'نام فروشگاه/شرکت/کارخانه الزامی است' },
          { status: 400 }
        )
      }
      if (!supplierType || !supplierType.trim()) {
        return NextResponse.json(
          { success: false, message: 'نوع تأمین‌کننده الزامی است' },
          { status: 400 }
        )
      }
    }

    await client.connect()
    const db = client.db('restoren')
    
    const personData: any = {
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

    // اضافه کردن فیلدهای مخصوص کارکنان
    if (type === 'employee') {
      personData.position = position ? String(position) : null
      personData.salary = salary !== undefined && salary !== null ? Number(salary) : 0
    }

    // اضافه کردن فیلدهای مخصوص تأمین‌کنندگان
    if (type === 'supplier') {
      personData.businessName = businessName ? String(businessName) : null
      personData.supplierType = supplierType ? String(supplierType) : null
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
    if (updateFields.position !== undefined) {
      updateFields.position = updateFields.position ? String(updateFields.position) : null
    }
    if (updateFields.salary !== undefined) {
      updateFields.salary = updateFields.salary !== null ? Number(updateFields.salary) : 0
    }
    if (updateFields.businessName !== undefined) {
      updateFields.businessName = updateFields.businessName ? String(updateFields.businessName) : null
    }
    if (updateFields.supplierType !== undefined) {
      updateFields.supplierType = updateFields.supplierType ? String(updateFields.supplierType) : null
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

