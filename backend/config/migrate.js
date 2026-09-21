const db = require('./database');

const run = async () => {
  console.log('Starting FoodExpress database migration...');

  const baseTables = [
    `CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL CHECK (role IN ('customer', 'restaurant_admin', 'delivery_partner')),
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        address TEXT,
        vehicle_type VARCHAR(50),
        is_online BOOLEAN DEFAULT FALSE,
        latitude DECIMAL(10,8),
        longitude DECIMAL(10,8),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS restaurants (
        id SERIAL PRIMARY KEY,
        owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        address TEXT,
        phone VARCHAR(20),
        image_url TEXT,
        cuisine VARCHAR(100),
        rating DECIMAL(2,1) DEFAULT 0,
        delivery_time INTEGER DEFAULT 30,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS menu_items (
        id SERIAL PRIMARY KEY,
        restaurant_id INTEGER REFERENCES restaurants(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
        category VARCHAR(100),
        image_url TEXT,
        is_available BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        restaurant_id INTEGER REFERENCES restaurants(id) ON DELETE SET NULL,
        delivery_partner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        status VARCHAR(50) DEFAULT 'pending',
        total_amount DECIMAL(10, 2) NOT NULL CHECK (total_amount >= 0),
        delivery_address TEXT,
        payment_mode VARCHAR(20) DEFAULT 'cod',
        payment_status VARCHAR(20) DEFAULT 'pending',
        delivery_otp CHAR(6),
        rejection_reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
        menu_item_id INTEGER REFERENCES menu_items(id) ON DELETE SET NULL,
        name VARCHAR(255),
        quantity INTEGER NOT NULL CHECK (quantity > 0),
        unit_price DECIMAL(10, 2) NOT NULL CHECK (unit_price >= 0)
    )`,
    `CREATE TABLE IF NOT EXISTS deliveries (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
        delivery_partner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        status VARCHAR(50) DEFAULT 'assigned',
        pickup_location TEXT,
        delivery_location TEXT,
        otp CHAR(6),
        earnings DECIMAL(10,2) DEFAULT 0,
        estimated_time TIMESTAMP,
        actual_time TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS delivery_locations (
        id SERIAL PRIMARY KEY,
        delivery_id INTEGER REFERENCES deliveries(id) ON DELETE CASCADE,
        latitude DECIMAL(10,8) NOT NULL,
        longitude DECIMAL(10,8) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS favourites (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        restaurant_id INTEGER REFERENCES restaurants(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
        customer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        restaurant_id INTEGER REFERENCES restaurants(id) ON DELETE CASCADE,
        rating INTEGER CHECK (rating BETWEEN 1 AND 5),
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`
  ];

  const alters = [
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS vehicle_type VARCHAR(50)`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT FALSE`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS latitude DECIMAL(10,8)`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS longitude DECIMAL(10,8)`,
    `ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS cuisine VARCHAR(100)`,
    `ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS rating DECIMAL(2,1) DEFAULT 0`,
    `ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS delivery_time INTEGER DEFAULT 30`,
    `ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE`,
    `ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_mode VARCHAR(20) DEFAULT 'cod'`,
    `ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'pending'`,
    `ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_otp CHAR(6)`,
    `ALTER TABLE orders ADD COLUMN IF NOT EXISTS rejection_reason TEXT`,
    `ALTER TABLE order_items ADD COLUMN IF NOT EXISTS name VARCHAR(255)`,
    `ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS otp CHAR(6)`,
    `ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS earnings DECIMAL(10,2) DEFAULT 0`
  ];

  const indexes = [
    `CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`,
    `CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)`,
    `CREATE INDEX IF NOT EXISTS idx_restaurants_owner ON restaurants(owner_id)`,
    `CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant ON menu_items(restaurant_id)`,
    `CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id)`,
    `CREATE INDEX IF NOT EXISTS idx_orders_restaurant ON orders(restaurant_id)`,
    `CREATE INDEX IF NOT EXISTS idx_orders_delivery_partner ON orders(delivery_partner_id)`,
    `CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)`,
    `CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id)`,
    `CREATE INDEX IF NOT EXISTS idx_deliveries_order ON deliveries(order_id)`,
    `CREATE INDEX IF NOT EXISTS idx_deliveries_partner ON deliveries(delivery_partner_id)`,
    `CREATE INDEX IF NOT EXISTS idx_deliveries_status ON deliveries(status)`,
    `CREATE INDEX IF NOT EXISTS idx_delivery_locations_delivery ON delivery_locations(delivery_id)`
  ];

  const constraints = async () => {
    await db.query('ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check');
    await db.query(
      `ALTER TABLE orders ADD CONSTRAINT orders_status_check CHECK (status IN
        ('pending','accepted','rejected','cancelled','preparing','ready_for_pickup','picked_up','out_for_delivery','delivered'))`
    );
    await db.query('ALTER TABLE deliveries DROP CONSTRAINT IF EXISTS deliveries_status_check');
    await db.query(
      `ALTER TABLE deliveries ADD CONSTRAINT deliveries_status_check CHECK (status IN
        ('assigned','accepted','rejected','picked_up','out_for_delivery','delivered'))`
    );
  };

  try {
    for (const sql of baseTables) {
      await db.query(sql);
    }
    console.log('Base tables ready.');

    for (const sql of alters) {
      try {
        await db.query(sql);
      } catch (e) {
        console.log(`Skipping alter (already applied?): ${e.message}`);
      }
    }
    console.log('Column migrations applied.');

    await constraints();
    console.log('Status constraints updated.');

    for (const sql of indexes) {
      try { await db.query(sql); } catch (e) { /* ignore */ }
    }
    console.log('Indexes ready.');

    console.log('Migration completed successfully.');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exitCode = 1;
  }
};

run();