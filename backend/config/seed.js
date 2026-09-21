const db = require('./database');
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const MenuItem = require('../models/MenuItem');

// Demo login credentials (all passwords shown below)
const demoUsers = [
  {
    email: 'customer@demo.com',
    password: 'Demo@123',
    role: 'customer',
    name: 'Demo Customer',
    phone: '999-000-1111',
    address: '12 MG Road, Pune, Maharashtra'
  },
  {
    email: 'restaurant@demo.com',
    password: 'Demo@123',
    role: 'restaurant_admin',
    name: 'Demo Restaurant Owner',
    phone: '999-000-2222',
    address: '24 FC Road, Pune, Maharashtra'
  },
  {
    email: 'partner@demo.com',
    password: 'Demo@123',
    role: 'delivery_partner',
    name: 'Demo Delivery Partner',
    phone: '999-000-3333',
    address: '55 Kothrud, Pune, Maharashtra',
    vehicle_type: 'motorcycle'
  }
];

const demoMenu = [
  { name: 'Margherita Pizza', description: 'Classic tomato and mozzarella', price: 12.99, category: 'main' },
  { name: 'Pepperoni Pizza', description: 'Pizza with pepperoni and cheese', price: 14.99, category: 'main' },
  { name: 'Garlic Bread', description: 'Buttery garlic bread sticks', price: 4.99, category: 'appetizer' },
  { name: 'Cheeseburger', description: 'Classic cheeseburger with fries', price: 9.99, category: 'main' },
  { name: 'Veggie Burger', description: 'Plant-based burger with salad', price: 8.99, category: 'main' },
  { name: 'Chocolate Shake', description: 'Thick chocolate milkshake', price: 5.99, category: 'beverage' }
];

const run = async () => {
  try {
    console.log('Seeding demo data...\n');

    for (const u of demoUsers) {
      const existing = await User.findByEmail(u.email);
      if (existing) {
        console.log(`Skipping (already exists): ${u.email}`);
        continue;
      }
      await User.create(u);
      console.log(`Created user: ${u.email}`);
    }

    const owner = await User.findByEmail('restaurant@demo.com');
    const restaurantOwner = await User.findByEmail('partner@demo.com');
    const customer = await User.findByEmail('customer@demo.com');

    let restaurant = await Restaurant.findByOwnerId(owner.id);
    if (!restaurant) {
      restaurant = await Restaurant.create({
        owner_id: owner.id,
        name: 'Pizza Palace',
        description: 'Best wood-fired pizzas and burgers in town',
        address: '24 FC Road, Pune, Maharashtra',
        phone: '999-000-2222',
        image_url: null,
        cuisine: 'Italian, Fast Food',
        delivery_time: 30
      });
      console.log(`Created restaurant: ${restaurant.name}`);
    } else {
      console.log(`Restaurant already exists: ${restaurant.name}`);
    }

    // Menu items (skip if already present)
    const existingMenu = await MenuItem.findByRestaurantId(restaurant.id);
    if (!existingMenu.length) {
      for (const m of demoMenu) {
        await MenuItem.create({ restaurant_id: restaurant.id, ...m, image_url: null, is_available: true });
      }
      console.log(`Created ${demoMenu.length} menu items`);
    } else {
      console.log('Menu items already exist');
    }

    // createRestaurant also throws if user already has one; ensure partner/customer have none
    const partnerRest = await Restaurant.findByOwnerId(restaurantOwner.id);
    const customerRest = await Restaurant.findByOwnerId(customer.id);
    if (partnerRest || customerRest) {
      // no-op; only relevant if a destination card exists
    }

    console.log('\n===== DEMO LOGIN CREDENTIALS =====');
    console.log('  Customer Portal:  customer@demo.com / Demo@123');
    console.log('  Restaurant Admin: restaurant@demo.com / Demo@123');
    console.log('  Delivery Partner: partner@demo.com / Demo@123');
    console.log('====================================');
    console.log('Open frontend/index.html, pick a role, then login with the matching email.');
    console.log('\nNote: delivery partner must toggle "Online" to appear in the restaurant\'s assign list.');
  } catch (err) {
    console.error('Seed failed:', err.message);
  } finally {
    db.query('SELECT 1').then(() => process.exit(0)).catch(() => process.exit(1));
  }
};

run();