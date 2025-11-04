import { ObjectId } from 'mongodb'

/**
 * ثبت یا به‌روزرسانی مشتری بر اساس اطلاعات سفارش
 * اگر customerId داده شده باشد، مشتری را پیدا می‌کند
 * اگر customerPhone داده شده باشد، مشتری را بر اساس شماره تماس پیدا یا ایجاد می‌کند
 */
export async function ensureCustomerExists(
  db: any,
  session: any,
  customerId: string | null | undefined,
  customerName: string | null | undefined,
  customerPhone: string | null | undefined,
  customerAddress?: string | null | undefined
): Promise<ObjectId | null> {
  try {
    const customersCollection = db.collection('customers')
    const loyaltiesCollection = db.collection('customer_loyalties')
    const sessionOptions = session ? { session } : {}

    // اگر customerId داده شده باشد، بررسی کن که مشتری وجود دارد
    if (customerId) {
      try {
        const existingCustomer = await customersCollection.findOne(
          { _id: new ObjectId(customerId) },
          sessionOptions
        )
        if (existingCustomer) {
          // مشتری وجود دارد، فقط به‌روزرسانی کن
          const updateData: any = {
            updatedAt: new Date()
          }
          
          if (customerName && customerName.trim()) {
            // تجزیه نام به firstName و lastName
            const nameParts = customerName.trim().split(' ')
            if (nameParts.length >= 2) {
              updateData.firstName = nameParts[0]
              updateData.lastName = nameParts.slice(1).join(' ')
            } else {
              updateData.firstName = nameParts[0] || ''
              updateData.lastName = ''
            }
            updateData.name = customerName.trim()
          }
          
          if (customerPhone && customerPhone.trim()) {
            updateData.phone = customerPhone.trim()
          }
          
          if (customerAddress && customerAddress.trim()) {
            updateData.address = customerAddress.trim()
          }

          await customersCollection.updateOne(
            { _id: new ObjectId(customerId) },
            { $set: updateData },
            sessionOptions
          )

          return new ObjectId(customerId)
        }
      } catch (e) {
        // customerId نامعتبر است، ادامه بده
        console.log('[ENSURE_CUSTOMER] Invalid customerId, continuing with phone lookup')
      }
    }

    // اگر customerPhone داده شده باشد، مشتری را پیدا یا ایجاد کن
    if (customerPhone && customerPhone.trim()) {
      const phone = customerPhone.trim()
      
      // جستجو بر اساس شماره تماس
      let existingCustomer = await customersCollection.findOne(
        { phone: phone },
        sessionOptions
      )

      if (existingCustomer) {
        // مشتری وجود دارد، به‌روزرسانی کن
        const updateData: any = {
          updatedAt: new Date()
        }
        
        if (customerName && customerName.trim()) {
          const nameParts = customerName.trim().split(' ')
          if (nameParts.length >= 2) {
            updateData.firstName = nameParts[0]
            updateData.lastName = nameParts.slice(1).join(' ')
          } else {
            updateData.firstName = nameParts[0] || ''
            updateData.lastName = ''
          }
          updateData.name = customerName.trim()
        }
        
        if (customerAddress && customerAddress.trim()) {
          updateData.address = customerAddress.trim()
        }

        await customersCollection.updateOne(
          { _id: existingCustomer._id },
          { $set: updateData },
          sessionOptions
        )

        return existingCustomer._id
      } else {
        // مشتری وجود ندارد، ایجاد کن
        const customerCount = await customersCollection.countDocuments({}, sessionOptions)
        const customerNumber = `CUST-${String(customerCount + 1).padStart(6, '0')}`

        // تجزیه نام
        let firstName = ''
        let lastName = ''
        let name = customerName?.trim() || 'مشتری'
        
        if (customerName && customerName.trim()) {
          const nameParts = customerName.trim().split(' ')
          if (nameParts.length >= 2) {
            firstName = nameParts[0]
            lastName = nameParts.slice(1).join(' ')
          } else {
            firstName = nameParts[0] || ''
            lastName = ''
          }
          name = customerName.trim()
        }

        const newCustomer = {
          customerNumber,
          firstName,
          lastName,
          name,
          phone: phone,
          email: '',
          address: customerAddress?.trim() || '',
          birthDate: null,
          registrationDate: new Date().toISOString(),
          totalOrders: 0,
          totalSpent: 0,
          lastOrderDate: null,
          status: 'active',
          notes: '',
          tags: [],
          loyaltyPoints: 0,
          customerType: 'regular',
          createdAt: new Date(),
          updatedAt: new Date()
        }

        const result = await customersCollection.insertOne(newCustomer, sessionOptions)
        const newCustomerId = result.insertedId

        // ایجاد رکورد باشگاه مشتریان
        const loyalty = {
          customerId: newCustomerId.toString(),
          customerName: name,
          customerPhone: phone,
          totalPoints: 0,
          currentTier: 'Bronze',
          pointsEarned: 0,
          pointsRedeemed: 0,
          pointsExpired: 0,
          totalOrders: 0,
          totalSpent: 0,
          lastOrderDate: null,
          nextTierPoints: 100,
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }

        await loyaltiesCollection.insertOne(loyalty, sessionOptions)

        console.log(`[ENSURE_CUSTOMER] ✅ Created new customer: ${name} (${phone})`)
        return newCustomerId
      }
    }

    // اگر هیچ اطلاعاتی داده نشده، null برگردان
    return null
  } catch (error) {
    console.error('[ENSURE_CUSTOMER] Error ensuring customer exists:', error)
    return null
  }
}

