const db = require('../config/database');

class Order {
  // Create a new order
  static async create(orderData) {
    const {
      customer_id, restaurant_id, delivery_partner_id, status, total_amount,
      delivery_address, payment_mode, payment_status
    } = orderData;

    const result = await db.query(
      `INSERT INTO orders (customer_id, restaurant_id, delivery_partner_id, status, total_amount, delivery_address, payment_mode, payment_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [customer_id, restaurant_id, delivery_partner_id, status, total_amount, delivery_address, payment_mode, payment_status]
    );

    return result.rows[0];
  }

  // Insert order items (snapshot of name and unit price)
  static async createOrderItems(orderId, items) {
    for (const item of items) {
      await db.query(
        `INSERT INTO order_items (order_id, menu_item_id, name, quantity, unit_price)
         VALUES ($1, $2, $3, $4, $5)`,
        [orderId, item.menu_item_id, item.name, item.quantity, item.unit_price]
      );
    }
  }

  // Get items for an order
  static async getOrderItems(orderId) {
    const result = await db.query(
      `SELECT oi.*, mi.image_url
       FROM order_items oi
       LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
       WHERE oi.order_id = $1`,
      [orderId]
    );
    return result.rows;
  }

  // Find order by ID
  static async findById(id) {
    const result = await db.query('SELECT * FROM orders WHERE id = $1', [id]);
    return result.rows[0];
  }

  // Full order detail (items, restaurant, customer, delivery partner, delivery, tracking)
  static async findDetail(id) {
    const order = await db.query(
      `SELECT o.*,
              r.name AS restaurant_name, r.address AS restaurant_address, r.phone AS restaurant_phone,
              cu.name AS customer_name, cu.phone AS customer_phone, cu.address AS customer_address,
              dp.name AS partner_name, dp.phone AS partner_phone, dp.vehicle_type AS partner_vehicle,
              dp.latitude AS partner_latitude, dp.longitude AS partner_longitude,
              d.id AS delivery_id, d.status AS delivery_status, d.otp AS d_otp,
              d.pickup_location, d.earnings, d.actual_time
       FROM orders o
       JOIN restaurants r ON o.restaurant_id = r.id
       JOIN users cu ON o.customer_id = cu.id
       LEFT JOIN users dp ON o.delivery_partner_id = dp.id
       LEFT JOIN deliveries d ON d.order_id = o.id
       WHERE o.id = $1`,
      [id]
    );

    if (!order.rows[0]) return null;

    const detail = order.rows[0];
    detail.items = await Order.getOrderItems(id);
    return detail;
  }

  // Get orders for a customer
  static async findByCustomerId(customerId) {
    const result = await db.query(
      `SELECT o.*, r.name as restaurant_name, r.image_url as restaurant_image,
              d.status AS delivery_status, dp.name AS partner_name
       FROM orders o
       JOIN restaurants r ON o.restaurant_id = r.id
       LEFT JOIN deliveries d ON d.order_id = o.id
       LEFT JOIN users dp ON o.delivery_partner_id = dp.id
       WHERE o.customer_id = $1
       ORDER BY o.created_at DESC`,
      [customerId]
    );
    return result.rows;
  }

  // Get orders for a restaurant
  static async findByRestaurantId(restaurantId) {
    const result = await db.query(
      `SELECT o.*, u.name as customer_name, u.phone as customer_phone,
              d.status AS delivery_status, dp.name AS partner_name
       FROM orders o
       JOIN users u ON o.customer_id = u.id
       LEFT JOIN deliveries d ON d.order_id = o.id
       LEFT JOIN users dp ON o.delivery_partner_id = dp.id
       WHERE o.restaurant_id = $1
       ORDER BY o.created_at DESC`,
      [restaurantId]
    );
    return result.rows;
  }

  // Get orders for a delivery partner
  static async findByDeliveryPartnerId(deliveryPartnerId) {
    const result = await db.query(
      `SELECT o.*, r.name as restaurant_name, r.address as restaurant_address,
              u.name as customer_name, u.phone as customer_phone,
              d.id AS delivery_id, d.status AS delivery_status, d.otp, d.earnings
       FROM orders o
       JOIN restaurants r ON o.restaurant_id = r.id
       JOIN users u ON o.customer_id = u.id
       JOIN deliveries d ON d.order_id = o.id
       WHERE d.delivery_partner_id = $1
       ORDER BY o.created_at DESC`,
      [deliveryPartnerId]
    );
    return result.rows;
  }

  // Update order
  static async update(id, updateData) {
    const fields = Object.keys(updateData)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');

    const values = Object.values(updateData);
    values.unshift(id);

    const result = await db.query(
      `UPDATE orders SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
      values
    );

    return result.rows[0];
  }

  // Delete order
  static async delete(id) {
    await db.query('DELETE FROM orders WHERE id = $1', [id]);
  }
}

module.exports = Order;