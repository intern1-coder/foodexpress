const db = require('../config/database');

class Restaurant {
  // Create a new restaurant
  static async create(restaurantData) {
    const { owner_id, name, description, address, phone, image_url, cuisine, delivery_time } = restaurantData;

    const result = await db.query(
      `INSERT INTO restaurants (owner_id, name, description, address, phone, image_url, cuisine, delivery_time)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [owner_id, name, description, address, phone, image_url, cuisine || null, delivery_time || 30]
    );

    return result.rows[0];
  }

  // Find restaurant by ID
  static async findById(id) {
    const result = await db.query('SELECT * FROM restaurants WHERE id = $1', [id]);
    return result.rows[0];
  }

  // Find restaurant by owner ID
  static async findByOwnerId(ownerId) {
    const result = await db.query('SELECT * FROM restaurants WHERE owner_id = $1', [ownerId]);
    return result.rows[0];
  }

  // Get all restaurants
  static async findAll() {
    const result = await db.query('SELECT * FROM restaurants');
    return result.rows;
  }

  // Update restaurant
  static async update(id, updateData) {
    const fields = Object.keys(updateData)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');

    const values = Object.values(updateData);
    values.unshift(id);

    const result = await db.query(
      `UPDATE restaurants SET ${fields} WHERE id = $1 RETURNING *`,
      values
    );

    return result.rows[0];
  }

  // Delete restaurant
  static async delete(id) {
    await db.query('DELETE FROM restaurants WHERE id = $1', [id]);
  }
}

module.exports = Restaurant;