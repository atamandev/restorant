import { NextRequest, NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://restorenUser:1234@localhost:27017/restoren'

let client: MongoClient
let clientPromise: Promise<MongoClient>

if (!client) {
  client = new MongoClient(MONGO_URI)
  clientPromise = client.connect()
}

export async function POST(request: NextRequest) {
  try {
    const client = await clientPromise
    const db = client.db('restoren')
    const collection = db.collection('menu_items')

    const additionalMenuItems = [
      // Appetizers
      { name: 'Hummus', category: 'Appetizers', price: 25000, preparationTime: 5, description: 'Creamy chickpea dip with tahini', image: '' },
      { name: 'Baba Ganoush', category: 'Appetizers', price: 30000, preparationTime: 8, description: 'Smoky eggplant dip with garlic', image: '' },
      { name: 'Falafel', category: 'Appetizers', price: 35000, preparationTime: 12, description: 'Crispy chickpea balls with herbs', image: '' },
      { name: 'Tabouleh', category: 'Appetizers', price: 28000, preparationTime: 10, description: 'Fresh parsley salad with bulgur', image: '' },
      { name: 'Fattoush', category: 'Appetizers', price: 32000, preparationTime: 8, description: 'Mixed greens with crispy bread', image: '' },
      { name: 'Muhammara', category: 'Appetizers', price: 27000, preparationTime: 6, description: 'Red pepper and walnut dip', image: '' },
      { name: 'Kibbeh', category: 'Appetizers', price: 45000, preparationTime: 15, description: 'Bulgar wheat with minced meat', image: '' },
      { name: 'Samosa', category: 'Appetizers', price: 20000, preparationTime: 8, description: 'Crispy pastry with spiced filling', image: '' },

      // Main Courses
      { name: 'Chicken Shawarma', category: 'Main Courses', price: 85000, preparationTime: 20, description: 'Marinated chicken with garlic sauce', image: '' },
      { name: 'Beef Shawarma', category: 'Main Courses', price: 95000, preparationTime: 25, description: 'Tender beef with tahini sauce', image: '' },
      { name: 'Lamb Kebab', category: 'Main Courses', price: 120000, preparationTime: 30, description: 'Grilled lamb with herbs and spices', image: '' },
      { name: 'Fish Kebab', category: 'Main Courses', price: 110000, preparationTime: 25, description: 'Grilled fish with lemon and herbs', image: '' },
      { name: 'Chicken Biryani', category: 'Main Courses', price: 90000, preparationTime: 35, description: 'Fragrant rice with spiced chicken', image: '' },
      { name: 'Lamb Biryani', category: 'Main Courses', price: 105000, preparationTime: 40, description: 'Aromatic rice with tender lamb', image: '' },
      { name: 'Vegetable Curry', category: 'Main Courses', price: 65000, preparationTime: 25, description: 'Mixed vegetables in coconut curry', image: '' },
      { name: 'Chicken Curry', category: 'Main Courses', price: 80000, preparationTime: 30, description: 'Spiced chicken in rich curry sauce', image: '' },
      { name: 'Beef Steak', category: 'Main Courses', price: 150000, preparationTime: 20, description: 'Grilled beef steak with herbs', image: '' },
      { name: 'Salmon Fillet', category: 'Main Courses', price: 130000, preparationTime: 18, description: 'Pan-seared salmon with lemon', image: '' },
      { name: 'Pasta Carbonara', category: 'Main Courses', price: 75000, preparationTime: 15, description: 'Creamy pasta with bacon and cheese', image: '' },
      { name: 'Pasta Bolognese', category: 'Main Courses', price: 80000, preparationTime: 20, description: 'Classic pasta with meat sauce', image: '' },
      { name: 'Pizza Margherita', category: 'Main Courses', price: 70000, preparationTime: 18, description: 'Classic pizza with tomato and mozzarella', image: '' },
      { name: 'Pizza Pepperoni', category: 'Main Courses', price: 85000, preparationTime: 20, description: 'Pizza with spicy pepperoni', image: '' },
      { name: 'Chicken Burger', category: 'Main Courses', price: 65000, preparationTime: 15, description: 'Grilled chicken burger with vegetables', image: '' },
      { name: 'Beef Burger', category: 'Main Courses', price: 75000, preparationTime: 18, description: 'Juicy beef burger with cheese', image: '' },
      { name: 'Vegetarian Burger', category: 'Main Courses', price: 55000, preparationTime: 12, description: 'Plant-based burger with fresh vegetables', image: '' },

      // Beverages
      { name: 'Fresh Orange Juice', category: 'Beverages', price: 20000, preparationTime: 3, description: 'Freshly squeezed orange juice', image: '' },
      { name: 'Apple Juice', category: 'Beverages', price: 18000, preparationTime: 2, description: 'Fresh apple juice', image: '' },
      { name: 'Pomegranate Juice', category: 'Beverages', price: 25000, preparationTime: 4, description: 'Fresh pomegranate juice', image: '' },
      { name: 'Green Tea', category: 'Beverages', price: 12000, preparationTime: 3, description: 'Hot green tea', image: '' },
      { name: 'Black Tea', category: 'Beverages', price: 10000, preparationTime: 3, description: 'Traditional black tea', image: '' },
      { name: 'Coffee', category: 'Beverages', price: 15000, preparationTime: 4, description: 'Freshly brewed coffee', image: '' },
      { name: 'Cappuccino', category: 'Beverages', price: 20000, preparationTime: 5, description: 'Espresso with steamed milk', image: '' },
      { name: 'Latte', category: 'Beverages', price: 22000, preparationTime: 5, description: 'Espresso with lots of milk', image: '' },
      { name: 'Hot Chocolate', category: 'Beverages', price: 18000, preparationTime: 4, description: 'Rich hot chocolate', image: '' },
      { name: 'Iced Tea', category: 'Beverages', price: 14000, preparationTime: 2, description: 'Refreshing iced tea', image: '' },
      { name: 'Lemonade', category: 'Beverages', price: 16000, preparationTime: 3, description: 'Fresh lemonade', image: '' },
      { name: 'Mint Lemonade', category: 'Beverages', price: 18000, preparationTime: 4, description: 'Refreshing mint lemonade', image: '' },
      { name: 'Ayran', category: 'Beverages', price: 12000, preparationTime: 2, description: 'Traditional yogurt drink', image: '' },
      { name: 'Mineral Water', category: 'Beverages', price: 8000, preparationTime: 1, description: 'Natural mineral water', image: '' },
      { name: 'Sparkling Water', category: 'Beverages', price: 10000, preparationTime: 1, description: 'Sparkling mineral water', image: '' },

      // Desserts
      { name: 'Baklava', category: 'Desserts', price: 40000, preparationTime: 5, description: 'Layered pastry with nuts and honey', image: '' },
      { name: 'Kunafa', category: 'Desserts', price: 45000, preparationTime: 8, description: 'Cheese pastry with syrup', image: '' },
      { name: 'Rice Pudding', category: 'Desserts', price: 25000, preparationTime: 10, description: 'Creamy rice pudding with cinnamon', image: '' },
      { name: 'Chocolate Cake', category: 'Desserts', price: 35000, preparationTime: 5, description: 'Rich chocolate cake', image: '' },
      { name: 'Cheesecake', category: 'Desserts', price: 30000, preparationTime: 5, description: 'Creamy cheesecake', image: '' },
      { name: 'Tiramisu', category: 'Desserts', price: 40000, preparationTime: 5, description: 'Italian coffee dessert', image: '' },
      { name: 'Fruit Salad', category: 'Desserts', price: 20000, preparationTime: 5, description: 'Fresh mixed fruit salad', image: '' },
      { name: 'Ice Cream Sundae', category: 'Desserts', price: 30000, preparationTime: 3, description: 'Ice cream with toppings', image: '' },
      { name: 'Panna Cotta', category: 'Desserts', price: 28000, preparationTime: 5, description: 'Italian custard dessert', image: '' },
      { name: 'Creme Brulee', category: 'Desserts', price: 35000, preparationTime: 5, description: 'Vanilla custard with caramelized sugar', image: '' },
      { name: 'Apple Pie', category: 'Desserts', price: 32000, preparationTime: 5, description: 'Classic apple pie', image: '' },
      { name: 'Chocolate Mousse', category: 'Desserts', price: 30000, preparationTime: 5, description: 'Light chocolate mousse', image: '' },
      { name: 'Fruit Tart', category: 'Desserts', price: 35000, preparationTime: 5, description: 'Fresh fruit tart', image: '' },
      { name: 'Profiteroles', category: 'Desserts', price: 40000, preparationTime: 5, description: 'Cream puffs with chocolate sauce', image: '' },
      { name: 'Sorbet', category: 'Desserts', price: 20000, preparationTime: 3, description: 'Refreshing fruit sorbet', image: '' }
    ]

    // Insert additional menu items
    const result = await collection.insertMany(additionalMenuItems)

    return NextResponse.json({
      success: true,
      message: 'محصولات اضافی منو با موفقیت اضافه شدند',
      data: {
        insertedCount: result.insertedCount,
        insertedIds: result.insertedIds
      }
    })
  } catch (error) {
    console.error('Error adding additional menu items:', error)
    return NextResponse.json({
      success: false,
      message: 'خطا در اضافه کردن محصولات اضافی'
    }, { status: 500 })
  }
}
