const db = require('../config/database');

class MenuItem {
  // Create a new menu item
  static async create(menuItemData) {
    const { restaurant_id, name, description, price, category, image_url, is_available } = menuItemData;

    const result = await db.query(
      `INSERT INTO menu_items (restaurant_id, name, description, price, category, image_url, is_available)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [restaurant_id, name, description, price, category, image_url, is_available]
    );

    return result.rows[0];
  }

  // Find menu item by ID
  static async findById(id) {
    const result = await db.query('SELECT * FROM menu_items WHERE id = $1', [id]);
    return result.rows[0];
  }

  // Get all menu items for a restaurant
  static async findByRestaurantId(restaurantId) {
    const result = await db.query('SELECT * FROM menu_items WHERE restaurant_id = $1', [restaurantId]);
    return result.rows;
  }

  // Update menu item
  static async update(id, updateData) {
    const fields = Object.keys(updateData)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');

    const values = Object.values(updateData);
    values.unshift(id);

    const result = await db.query(
      `UPDATE menu_items SET ${fields} WHERE id = $1 RETURNING *`,
      values
    );

    return result.rows[0];
  }

  // Delete menu item
  static async delete(id) {
    await db.query('DELETE FROM menu_items WHERE id = $1', [id]);
  }
}

module.exports = MenuItem;