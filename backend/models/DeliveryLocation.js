const db = require('../config/database');

class DeliveryLocation {
  // Record a partner location update for a delivery
  static async create(deliveryId, latitude, longitude) {
    const result = await db.query(
      `INSERT INTO delivery_locations (delivery_id, latitude, longitude)
       VALUES ($1, $2, $3) RETURNING *`,
      [deliveryId, latitude, longitude]
    );
    return result.rows[0];
  }

  // Get the latest location for a delivery
  static async getLatest(deliveryId) {
    const result = await db.query(
      `SELECT latitude, longitude, created_at
       FROM delivery_locations
       WHERE delivery_id = $1
       ORDER BY created_at DESC, id DESC
       LIMIT 1`,
      [deliveryId]
    );
    return result.rows[0] || null;
  }

  // Get the full movement trail for a delivery
  static async getTrail(deliveryId) {
    const result = await db.query(
      `SELECT latitude, longitude, created_at
       FROM delivery_locations
       WHERE delivery_id = $1
       ORDER BY created_at ASC`,
      [deliveryId]
    );
    return result.rows;
  }
}

module.exports = DeliveryLocation;