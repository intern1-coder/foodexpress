const db = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  // Create a new user
  static async create(userData) {
    const { email, password, role, name, phone, address, vehicle_type } = userData;

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const result = await db.query(
      `INSERT INTO users (email, password_hash, role, name, phone, address, vehicle_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [email, passwordHash, role, name, phone, address, vehicle_type || null]
    );

    return result.rows[0];
  }

  // Find user by email
  static async findByEmail(email) {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0];
  }

  // Find user by ID
  static async findById(id) {
    const result = await db.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0];
  }

  // Find users by role
  static async findByRole(role) {
    const result = await db.query('SELECT * FROM users WHERE role = $1', [role]);
    return result.rows;
  }

  // Compare password
  static async comparePassword(candidatePassword, storedHash) {
    return await bcrypt.compare(candidatePassword, storedHash);
  }

  // Update user
  static async update(id, updateData) {
    const fields = Object.keys(updateData)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');

    const values = Object.values(updateData);
    values.unshift(id);

    const result = await db.query(
      `UPDATE users SET ${fields} WHERE id = $1 RETURNING *`,
      values
    );

    return result.rows[0];
  }

  // Get available delivery partners (online, not currently assigned to an active delivery)
  static async findAvailableDeliveryPartners() {
    const result = await db.query(
      `SELECT id, name, phone, email, vehicle_type, latitude, longitude
       FROM users
       WHERE role = 'delivery_partner'
         AND is_online = TRUE
         AND id NOT IN (
            SELECT DISTINCT delivery_partner_id FROM deliveries
            WHERE status IN ('assigned', 'accepted', 'picked_up', 'out_for_delivery')
              AND delivery_partner_id IS NOT NULL
         )
       ORDER BY name`
    );
    return result.rows;
  }

  // Toggle partner online status
  static async toggleOnline(id, isOnline) {
    const result = await db.query(
      'UPDATE users SET is_online = $1 WHERE id = $2 RETURNING *',
      [isOnline, id]
    );
    return result.rows[0];
  }

  // Update live location of a delivery partner
  static async updateLocation(id, latitude, longitude) {
    const result = await db.query(
      'UPDATE users SET latitude = $1, longitude = $2 WHERE id = $3 RETURNING *',
      [latitude, longitude, id]
    );
    return result.rows[0];
  }
}

module.exports = User;