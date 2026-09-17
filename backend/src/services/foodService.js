/**
 * Food Item Service
 * 
 * Handles all food item business logic
 */

const { query, getClient } = require('../config/database');

/**
 * Get all food items with search, filter, pagination
 */
const getAllFoodItems = async (filters = {}) => {
  const {
    page = 1,
    limit = 10,
    search = '',
    category = '',
    restaurantId = '',
    minPrice = 0,
    maxPrice = 999999,
    isVegetarian = null,
    isVegan = null,
    isGlutenFree = null,
    sortBy = 'created_at',
    sortOrder = 'DESC'
  } = filters;

  const offset = (page - 1) * limit;
  const values = [];
  let paramIndex = 1;

  let queryText = `
    SELECT f.*, r.name as restaurant_name, r.cuisine_type
    FROM food_items f
    JOIN restaurants r ON f.restaurant_id = r.restaurant_id
    WHERE f.is_available = true AND r.is_active = true
  `;

  // Search filter
  if (search) {
    queryText += ` AND (f.name ILIKE $${paramIndex} OR f.description ILIKE $${paramIndex} OR f.category ILIKE $${paramIndex})`;
    values.push(`%${search}%`);
    paramIndex++;
  }

  // Category filter
  if (category) {
    queryText += ` AND f.category ILIKE $${paramIndex}`;
    values.push(`%${category}%`);
    paramIndex++;
  }

  // Restaurant filter
  if (restaurantId) {
    queryText += ` AND f.restaurant_id = $${paramIndex}`;
    values.push(restaurantId);
    paramIndex++;
  }

  // Price range filter
  if (minPrice > 0) {
    queryText += ` AND f.price >= $${paramIndex}`;
    values.push(minPrice);
    paramIndex++;
  }

  if (maxPrice < 999999) {
    queryText += ` AND f.price <= $${paramIndex}`;
    values.push(maxPrice);
    paramIndex++;
  }

  // Dietary filters
  if (isVegetarian !== null) {
    queryText += ` AND f.is_vegetarian = $${paramIndex}`;
    values.push(isVegetarian);
    paramIndex++;
  }

  if (isVegan !== null) {
    queryText += ` AND f.is_vegan = $${paramIndex}`;
    values.push(isVegan);
    paramIndex++;
  }

  if (isGlutenFree !== null) {
    queryText += ` AND f.is_gluten_free = $${paramIndex}`;
    values.push(isGlutenFree);
    paramIndex++;
  }

  // Get total count
  const countQuery = queryText.replace(/SELECT.*FROM/, 'SELECT COUNT(*) FROM');
  const countResult = await query(countQuery, values);
  const totalCount = parseInt(countResult.rows[0].count);

  // Sorting
  const allowedSorts = ['name', 'price', 'category', 'created_at', 'calories'];
  const safeSortBy = allowedSorts.includes(sortBy) ? `f.${sortBy}` : 'f.created_at';
  const safeSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  queryText += ` ORDER BY ${safeSortBy} ${safeSortOrder}`;
  queryText += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  values.push(limit, offset);

  const result = await query(queryText, values);

  return {
    success: true,
    data: {
      foodItems: result.rows.map(item => formatFoodItem(item)),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    }
  };
};

/**
 * Get food item by ID
 */
const getFoodItemById = async (itemId) => {
  const result = await query(
    `SELECT f.*, r.name as restaurant_name, r.cuisine_type
     FROM food_items f
     JOIN restaurants r ON f.restaurant_id = r.restaurant_id
     WHERE f.item_id = $1 AND f.is_available = true`,
    [itemId]
  );

  if (result.rows.length === 0) {
    throw new Error('Food item not found');
  }

  return {
    success: true,
    data: formatFoodItem(result.rows[0])
  };
};

/**
 * Get food items by restaurant
 */
const getFoodItemsByRestaurant = async (restaurantId, filters = {}) => {
  const { category = '', search = '' } = filters;

  let queryText = `
    SELECT * FROM food_items
    WHERE restaurant_id = $1 AND is_available = true
  `;
  const values = [restaurantId];
  let paramIndex = 2;

  if (search) {
    queryText += ` AND (name ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`;
    values.push(`%${search}%`);
    paramIndex++;
  }

  if (category) {
    queryText += ` AND category ILIKE $${paramIndex}`;
    values.push(`%${category}%`);
    paramIndex++;
  }

  queryText += ` ORDER BY category, name`;

  const result = await query(queryText, values);

  // Group by category
  const menuByCategory = {};
  result.rows.forEach(item => {
    if (!menuByCategory[item.category]) {
      menuByCategory[item.category] = [];
    }
    menuByCategory[item.category].push(formatFoodItem(item));
  });

  return {
    success: true,
    data: {
      items: result.rows.map(item => formatFoodItem(item)),
      byCategory: menuByCategory,
      totalItems: result.rows.length
    }
  };
};

/**
 * Create new food item (admin only)
 */
const createFoodItem = async (foodData) => {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    // Verify restaurant exists
    const restaurant = await client.query(
      'SELECT restaurant_id FROM restaurants WHERE restaurant_id = $1 AND is_active = true',
      [foodData.restaurantId]
    );

    if (restaurant.rows.length === 0) {
      throw new Error('Restaurant not found');
    }

    const result = await client.query(
      `INSERT INTO food_items (
        restaurant_id, name, description, price, category,
        image_url, is_vegetarian, is_vegan, is_gluten_free,
        preparation_time, calories
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        foodData.restaurantId,
        foodData.name,
        foodData.description || null,
        foodData.price,
        foodData.category,
        foodData.imageUrl || null,
        foodData.isVegetarian || false,
        foodData.isVegan || false,
        foodData.isGlutenFree || false,
        foodData.preparationTime || 15,
        foodData.calories || null
      ]
    );

    await client.query('COMMIT');

    return {
      success: true,
      message: 'Food item created successfully',
      data: formatFoodItem(result.rows[0])
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Update food item (admin only)
 */
const updateFoodItem = async (itemId, updateData) => {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    // Check if item exists
    const existing = await client.query(
      'SELECT item_id FROM food_items WHERE item_id = $1 AND is_available = true',
      [itemId]
    );

    if (existing.rows.length === 0) {
      throw new Error('Food item not found');
    }

    // Build update query
    const updates = [];
    const values = [];
    let paramIndex = 1;

    const fieldMapping = {
      name: updateData.name,
      description: updateData.description,
      price: updateData.price,
      category: updateData.category,
      image_url: updateData.imageUrl,
      is_vegetarian: updateData.isVegetarian,
      is_vegan: updateData.isVegan,
      is_gluten_free: updateData.isGlutenFree,
      is_available: updateData.isAvailable,
      preparation_time: updateData.preparationTime,
      calories: updateData.calories
    };

    for (const [field, value] of Object.entries(fieldMapping)) {
      if (value !== undefined) {
        updates.push(`${field} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    if (updates.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(itemId);

    const result = await client.query(
      `UPDATE food_items
       SET ${updates.join(', ')}
       WHERE item_id = $${paramIndex}
       RETURNING *`,
      values
    );

    await client.query('COMMIT');

    return {
      success: true,
      message: 'Food item updated successfully',
      data: formatFoodItem(result.rows[0])
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Delete food item (soft delete - admin only)
 */
const deleteFoodItem = async (itemId) => {
  const result = await query(
    `UPDATE food_items
     SET is_available = false
     WHERE item_id = $1 AND is_available = true
     RETURNING item_id`,
    [itemId]
  );

  if (result.rows.length === 0) {
    throw new Error('Food item not found');
  }

  return {
    success: true,
    message: 'Food item deleted successfully'
  };
};

/**
 * Get categories by restaurant
 */
const getCategoriesByRestaurant = async (restaurantId) => {
  const result = await query(
    `SELECT DISTINCT category, COUNT(*) as item_count
     FROM food_items
     WHERE restaurant_id = $1 AND is_available = true
     GROUP BY category
     ORDER BY category`,
    [restaurantId]
  );

  return {
    success: true,
    data: result.rows.map(r => ({
      category: r.category,
      itemCount: parseInt(r.item_count)
    }))
  };
};

// Helper: Format food item object
const formatFoodItem = (f) => ({
  itemId: f.item_id,
  restaurantId: f.restaurant_id,
  restaurantName: f.restaurant_name || null,
  name: f.name,
  description: f.description,
  price: parseFloat(f.price),
  category: f.category,
  imageUrl: f.image_url,
  isVegetarian: f.is_vegetarian,
  isVegan: f.is_vegan,
  isGlutenFree: f.is_gluten_free,
  isAvailable: f.is_available,
  preparationTime: f.preparation_time,
  calories: f.calories,
  createdAt: f.created_at,
  updatedAt: f.updated_at
});

module.exports = {
  getAllFoodItems,
  getFoodItemById,
  getFoodItemsByRestaurant,
  createFoodItem,
  updateFoodItem,
  deleteFoodItem,
  getCategoriesByRestaurant
};
