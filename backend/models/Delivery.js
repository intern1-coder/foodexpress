const db = require('../config/database');

class Delivery {
  // Create a new delivery
  static async create(deliveryData) {
    const {
      order_id, delivery_partner_id, status, pickup_location,
      delivery_location, otp, estimated_time
    } = deliveryData;

    const result = await db.query(
      `INSERT INTO deliveries (order_id, delivery_partner_id, status, pickup_location, delivery_location, otp, estimated_time)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [order_id, delivery_partner_id, status, pickup_location, delivery_location, otp, estimated_time]
    );

    return result.rows[0];
  }

  // Find delivery by ID
  static async findById(id) {
    const result = await db.query('SELECT * FROM deliveries WHERE id = $1', [id]);
    return result.rows[0];
  }

  // Find delivery by order ID
  static async findByOrderId(orderId) {
    const result = await db.query('SELECT * FROM deliveries WHERE order_id = $1 ORDER BY id DESC LIMIT 1', [orderId]);
    return result.rows[0];
  }

  // Get deliveries for a delivery partner
  static async findByDeliveryPartnerId(deliveryPartnerId) {
    const result = await db.query(
      `SELECT d.*, o.total_amount, o.payment_mode, o.payment_status,
              o.status AS order_status, o.delivery_otp AS order_otp,
              r.name as restaurant_name, r.address as restaurant_address,
              u.name as customer_name, u.phone as customer_phone,
              u.latitude as customer_latitude, u.longitude as customer_longitude
       FROM deliveries d
       JOIN orders o ON d.order_id = o.id
       JOIN restaurants r ON o.restaurant_id = r.id
       JOIN users u ON o.customer_id = u.id
       WHERE d.delivery_partner_id = $1
       ORDER BY d.created_at DESC`,
      [deliveryPartnerId]
    );
    return result.rows;
  }

  // Get deliveries ordered by pending age (for restaurant to track active gigs)
  static async findActiveForRestaurant(restaurantId) {
    const result = await db.query(
      `SELECT d.*, o.total_amount, o.payment_mode,
              u.name as customer_name, u.phone as customer_phone,
              dp.name as partner_name
       FROM deliveries d
       JOIN orders o ON d.order_id = o.id
       JOIN users u ON o.customer_id = u.id
       JOIN users dp ON d.delivery_partner_id = dp.id
       WHERE o.restaurant_id = $1
         AND d.status IN ('assigned', 'accepted', 'picked_up', 'out_for_delivery')
       ORDER BY d.created_at ASC`,
      [restaurantId]
    );
    return result.rows;
  }

  // Update delivery
  static async update(id, updateData) {
    const fields = Object.keys(updateData)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');

    const values = Object.values(updateData);
    values.unshift(id);

    const result = await db.query(
      `UPDATE deliveries SET ${fields} WHERE id = $1 RETURNING *`,
      values
    );

    return result.rows[0];
  }

  // Delete delivery
  static async delete(id) {
    await db.query('DELETE FROM deliveries WHERE id = $1', [id]);
  }
}

module.exports = Delivery;