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

// GET - دریافت چاپگرها یا مسیرهای چاپ یا آمار
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'printers' // printers, routes, stats
    
    if (type === 'printers') {
      const printersCollection = db.collection('printers')
      const printers = await printersCollection.find({}).toArray()
      
      const formattedPrinters = printers.map((printer: any) => ({
        ...printer,
        id: printer._id.toString(),
        _id: printer._id.toString()
      }))
      
      return NextResponse.json({
        success: true,
        data: formattedPrinters
      })
    } else if (type === 'routes') {
      const routesCollection = db.collection('print_routes')
      const routes = await routesCollection.find({}).toArray()
      
      const formattedRoutes = routes.map((route: any) => ({
        ...route,
        id: route._id.toString(),
        _id: route._id.toString()
      }))
      
      return NextResponse.json({
        success: true,
        data: formattedRoutes
      })
    } else if (type === 'stats') {
      const printersCollection = db.collection('printers')
      const routesCollection = db.collection('print_routes')
      
      const totalPrinters = await printersCollection.countDocuments({})
      const onlinePrinters = await printersCollection.countDocuments({ status: 'online' })
      const offlinePrinters = await printersCollection.countDocuments({ status: 'offline' })
      const errorPrinters = await printersCollection.countDocuments({ status: 'error' })
      const totalRoutes = await routesCollection.countDocuments({})
      const activeRoutes = await routesCollection.countDocuments({ isActive: true })
      
      // Get printers by type
      const kitchenPrinters = await printersCollection.countDocuments({ type: 'kitchen' })
      const receiptPrinters = await printersCollection.countDocuments({ type: 'receipt' })
      const labelPrinters = await printersCollection.countDocuments({ type: 'label' })
      const generalPrinters = await printersCollection.countDocuments({ type: 'general' })
      
      // Get total print count
      const printers = await printersCollection.find({}).toArray()
      const totalPrintCount = printers.reduce((sum: number, printer: any) => sum + (printer.printCount || 0), 0)
      const totalErrorCount = printers.reduce((sum: number, printer: any) => sum + (printer.errorCount || 0), 0)
      
      return NextResponse.json({
        success: true,
        data: {
          totalPrinters,
          onlinePrinters,
          offlinePrinters,
          errorPrinters,
          totalRoutes,
          activeRoutes,
          inactiveRoutes: totalRoutes - activeRoutes,
          printersByType: {
            kitchen: kitchenPrinters,
            receipt: receiptPrinters,
            label: labelPrinters,
            general: generalPrinters
          },
          totalPrintCount,
          totalErrorCount,
          successRate: totalPrintCount > 0 ? ((totalPrintCount - totalErrorCount) / totalPrintCount * 100).toFixed(2) : '100'
        }
      })
    }
    
    return NextResponse.json({
      success: false,
      message: 'Invalid type parameter'
    }, { status: 400 })
  } catch (error) {
    console.error('Error in printer-config API:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت داده‌ها', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// POST - ایجاد چاپگر یا مسیر چاپ
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()
    const body = await request.json()
    const { entity } = body // 'printer' or 'route'
    
    if (entity === 'printer') {
      const printersCollection = db.collection('printers')
      const { 
        name, 
        type, 
        connection, 
        ipAddress, 
        port, 
        location, 
        paperSize, 
        autoCut, 
        autoOpen 
      } = body
      
      if (!name || !type || !connection) {
        return NextResponse.json(
          { success: false, message: 'نام، نوع و اتصال چاپگر اجباری است' },
          { status: 400 }
        )
      }
      
      const printer = {
        name,
        type,
        connection,
        ipAddress: connection === 'network' ? (ipAddress || '') : undefined,
        port: connection === 'network' ? (port || 9100) : undefined,
        status: 'offline', // Initially offline
        location: location || '',
        paperSize: paperSize || '80mm',
        autoCut: autoCut || false,
        autoOpen: autoOpen || false,
        createdAt: new Date().toISOString(),
        lastUsed: null,
        printCount: 0,
        errorCount: 0
      }
      
      const result = await printersCollection.insertOne(printer)
      const createdPrinter = await printersCollection.findOne({ _id: result.insertedId })
      
      return NextResponse.json({
        success: true,
        data: { ...createdPrinter, id: createdPrinter._id.toString(), _id: createdPrinter._id.toString() },
        message: 'چاپگر با موفقیت ایجاد شد'
      })
    } else if (entity === 'route') {
      const routesCollection = db.collection('print_routes')
      const { name, source, target, conditions, isActive } = body
      
      if (!name || !source || !target) {
        return NextResponse.json(
          { success: false, message: 'نام، منبع و مقصد مسیر چاپ اجباری است' },
          { status: 400 }
        )
      }
      
      const route = {
        name,
        source,
        target,
        conditions: conditions || [],
        isActive: isActive !== undefined ? isActive : true,
        createdAt: new Date().toISOString()
      }
      
      const result = await routesCollection.insertOne(route)
      const createdRoute = await routesCollection.findOne({ _id: result.insertedId })
      
      return NextResponse.json({
        success: true,
        data: { ...createdRoute, id: createdRoute._id.toString(), _id: createdRoute._id.toString() },
        message: 'مسیر چاپ با موفقیت ایجاد شد'
      })
    }
    
    return NextResponse.json(
      { success: false, message: 'Invalid entity type' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error creating entity:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در ایجاد', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// PUT - به‌روزرسانی چاپگر یا مسیر چاپ
export async function PUT(request: NextRequest) {
  try {
    await connectToDatabase()
    const body = await request.json()
    const { entity, id } = body
    
    if (entity === 'printer') {
      const printersCollection = db.collection('printers')
      const updateData: any = {}
      
      const allowedFields = ['name', 'type', 'connection', 'ipAddress', 'port', 'status', 'location', 'paperSize', 'autoCut', 'autoOpen']
      allowedFields.forEach(field => {
        if (body[field] !== undefined) {
          updateData[field] = body[field]
        }
      })
      
      const result = await printersCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData }
      )
      
      if (result.matchedCount === 0) {
        return NextResponse.json(
          { success: false, message: 'چاپگر مورد نظر یافت نشد' },
          { status: 404 }
        )
      }
      
      const updatedPrinter = await printersCollection.findOne({ _id: new ObjectId(id) })
      return NextResponse.json({
        success: true,
        data: { ...updatedPrinter, id: updatedPrinter._id.toString(), _id: updatedPrinter._id.toString() },
        message: 'چاپگر با موفقیت به‌روزرسانی شد'
      })
    } else if (entity === 'route') {
      const routesCollection = db.collection('print_routes')
      const updateData: any = {}
      
      const allowedFields = ['name', 'source', 'target', 'conditions', 'isActive']
      allowedFields.forEach(field => {
        if (body[field] !== undefined) {
          updateData[field] = body[field]
        }
      })
      
      const result = await routesCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData }
      )
      
      if (result.matchedCount === 0) {
        return NextResponse.json(
          { success: false, message: 'مسیر چاپ مورد نظر یافت نشد' },
          { status: 404 }
        )
      }
      
      const updatedRoute = await routesCollection.findOne({ _id: new ObjectId(id) })
      return NextResponse.json({
        success: true,
        data: { ...updatedRoute, id: updatedRoute._id.toString(), _id: updatedRoute._id.toString() },
        message: 'مسیر چاپ با موفقیت به‌روزرسانی شد'
      })
    }
    
    return NextResponse.json(
      { success: false, message: 'Invalid entity type' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error updating entity:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در به‌روزرسانی', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// DELETE - حذف چاپگر یا مسیر چاپ
export async function DELETE(request: NextRequest) {
  try {
    await connectToDatabase()
    const { searchParams } = new URL(request.url)
    const entity = searchParams.get('entity') // 'printer' or 'route'
    const id = searchParams.get('id')
    
    if (!entity || !id) {
      return NextResponse.json(
        { success: false, message: 'entity و id اجباری است' },
        { status: 400 }
      )
    }
    
    if (entity === 'printer') {
      const printersCollection = db.collection('printers')
      const result = await printersCollection.deleteOne({ _id: new ObjectId(id) })
      
      if (result.deletedCount === 0) {
        return NextResponse.json(
          { success: false, message: 'چاپگر مورد نظر یافت نشد' },
          { status: 404 }
        )
      }
      
      return NextResponse.json({
        success: true,
        message: 'چاپگر با موفقیت حذف شد'
      })
    } else if (entity === 'route') {
      const routesCollection = db.collection('print_routes')
      const result = await routesCollection.deleteOne({ _id: new ObjectId(id) })
      
      if (result.deletedCount === 0) {
        return NextResponse.json(
          { success: false, message: 'مسیر چاپ مورد نظر یافت نشد' },
          { status: 404 }
        )
      }
      
      return NextResponse.json({
        success: true,
        message: 'مسیر چاپ با موفقیت حذف شد'
      })
    }
    
    return NextResponse.json(
      { success: false, message: 'Invalid entity type' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error deleting entity:', error)
    return NextResponse.json(
      { success: false, message: 'خطا در حذف', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

