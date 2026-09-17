/**
 * Restaurant Service
 * 
 * Handles all restaurant business logic
 */

const { query, getClient } = require('../config/database');

/**
 * Get all restaurants with search, filter, pagination
 */
const getAllRestaurants = async (filters = {}) => {
  const {
    page = 1,
    limit = 10,
    search = '',
    cuisine = '',
    city = '',
    minRating = 0,
    sortBy = 'created_at',
    sortOrder = 'DESC'
  } = filters;

  const offset = (page - 1) * limit;
  const values = [];
  let paramIndex = 1;

  let queryText = `
    SELECT restaurant_id, name, description, cuisine_type,
           address, city, state, zip_code, phone, email,
           opening_time, closing_time, rating, is_active,
           is_available, delivery_fee, minimum_order,
           estimated_delivery_time, created_at, updated_at
    FROM restaurants
    WHERE is_active = true
  `;

  // Search filter
  if (search) {
    queryText += ` AND (name ILIKE $${paramIndex} OR description ILIKE $${paramIndex} OR cuisine_type ILIKE $${paramIndex})`;
    values.push(`%${search}%`);
    paramIndex++;
  }

  // Cuisine filter
  if (cuisine) {
    queryText += ` AND cuisine_type ILIKE $${paramIndex}`;
    values.push(`%${cuisine}%`);
    paramIndex++;
  }

  // City filter
  if (city) {
    queryText += ` AND city ILIKE $${paramIndex}`;
    values.push(`%${city}%`);
    paramIndex++;
  }

  // Rating filter
  if (minRating > 0) {
    queryText += ` AND rating >= $${paramIndex}`;
    values.push(minRating);
    paramIndex++;
  }

  // Get total count
  const countQuery = queryText.replace(/SELECT.*FROM/, 'SELECT COUNT(*) FROM');
  const countResult = await query(countQuery, values);
  const totalCount = parseInt(countResult.rows[0].count);

  // Sorting
  const allowedSorts = ['name', 'rating', 'created_at', 'delivery_fee', 'minimum_order'];
  const safeSortBy = allowedSorts.includes(sortBy) ? sortBy : 'created_at';
  const safeSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  queryText += ` ORDER BY ${safeSortBy} ${safeSortOrder}`;
  queryText += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  values.push(limit, offset);

  const result = await query(queryText, values);

  return {
    success: true,
    data: {
      restaurants: result.rows.map(r => formatRestaurant(r)),
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
 * Get restaurant by ID
 */
const getRestaurantById = async (restaurantId) => {
  const result = await query(
    `SELECT restaurant_id, name, description, cuisine_type,
            address, city, state, zip_code, phone, email,
            opening_time, closing_time, rating, is_active,
            is_available, delivery_fee, minimum_order,
            estimated_delivery_time, created_at, updated_at
     FROM restaurants
     WHERE restaurant_id = $1 AND is_active = true`,
    [restaurantId]
  );

  if (result.rows.length === 0) {
    throw new Error('Restaurant not found');
  }

  return {
    success: true,
    data: formatRestaurant(result.rows[0])
  };
};

/**
 * Create new restaurant (admin only)
 */
const createRestaurant = async (restaurantData) => {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    const result = await client.query(
      `INSERT INTO restaurants (
        name, description, cuisine_type, address, city, state,
        zip_code, phone, email, opening_time, closing_time,
        delivery_fee, minimum_order, estimated_delivery_time
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        restaurantData.name,
        restaurantData.description || null,
        restaurantData.cuisineType,
        restaurantData.address,
        restaurantData.city,
        restaurantData.state,
        restaurantData.zipCode || null,
        restaurantData.phone,
        restaurantData.email || null,
        restaurantData.openingTime,
        restaurantData.closingTime,
        restaurantData.deliveryFee || 0,
        restaurantData.minimumOrder || 0,
        restaurantData.estimatedDeliveryTime || 30
      ]
    );

    await client.query('COMMIT');

    return {
      success: true,
      message: 'Restaurant created successfully',
      data: formatRestaurant(result.rows[0])
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Update restaurant (admin only)
 */
const updateRestaurant = async (restaurantId, updateData) => {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    // Check if restaurant exists
    const existing = await client.query(
      'SELECT restaurant_id FROM restaurants WHERE restaurant_id = $1 AND is_active = true',
      [restaurantId]
    );

    if (existing.rows.length === 0) {
      throw new Error('Restaurant not found');
    }

    // Build update query
    const updates = [];
    const values = [];
    let paramIndex = 1;

    const fieldMapping = {
      name: updateData.name,
      description: updateData.description,
      cuisine_type: updateData.cuisineType,
      address: updateData.address,
      city: updateData.city,
      state: updateData.state,
      zip_code: updateData.zipCode,
      phone: updateData.phone,
      email: updateData.email,
      opening_time: updateData.openingTime,
      closing_time: updateData.closingTime,
      is_available: updateData.isAvailable,
      delivery_fee: updateData.deliveryFee,
      minimum_order: updateData.minimumOrder,
      estimated_delivery_time: updateData.estimatedDeliveryTime
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

    values.push(restaurantId);

    const result = await client.query(
      `UPDATE restaurants
       SET ${updates.join(', ')}
       WHERE restaurant_id = $${paramIndex}
       RETURNING *`,
      values
    );

    await client.query('COMMIT');

    return {
      success: true,
      message: 'Restaurant updated successfully',
      data: formatRestaurant(result.rows[0])
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Delete restaurant (soft delete - admin only)
 */
const deleteRestaurant = async (restaurantId) => {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    const result = await client.query(
      `UPDATE restaurants
       SET is_active = false
       WHERE restaurant_id = $1 AND is_active = true
       RETURNING restaurant_id`,
      [restaurantId]
    );

    if (result.rows.length === 0) {
      throw new Error('Restaurant not found');
    }

    // Also deactivate all food items
    await client.query(
      'UPDATE food_items SET is_available = false WHERE restaurant_id = $1',
      [restaurantId]
    );

    await client.query('COMMIT');

    return {
      success: true,
      message: 'Restaurant deleted successfully'
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Get restaurant with menu
 */
const getRestaurantWithMenu = async (restaurantId) => {
  const client = await getClient();

  try {
    // Get restaurant
    const restaurantResult = await client.query(
      `SELECT * FROM restaurants WHERE restaurant_id = $1 AND is_active = true`,
      [restaurantId]
    );

    if (restaurantResult.rows.length === 0) {
      throw new Error('Restaurant not found');
    }

    // Get menu items
    const menuResult = await client.query(
      `SELECT * FROM food_items
       WHERE restaurant_id = $1 AND is_available = true
       ORDER BY category, name`,
      [restaurantId]
    );

    // Group items by category
    const menuByCategory = {};
    menuResult.rows.forEach(item => {
      if (!menuByCategory[item.category]) {
        menuByCategory[item.category] = [];
      }
      menuByCategory[item.category].push(formatFoodItem(item));
    });

    return {
      success: true,
      data: {
        restaurant: formatRestaurant(restaurantResult.rows[0]),
        menu: menuByCategory,
        totalItems: menuResult.rows.length
      }
    };
  } finally {
    client.release();
  }
};

// Helper: Format restaurant object
const formatRestaurant = (r) => ({
  restaurantId: r.restaurant_id,
  name: r.name,
  description: r.description,
  cuisineType: r.cuisine_type,
  address: r.address,
  city: r.city,
  state: r.state,
  zipCode: r.zip_code,
  phone: r.phone,
  email: r.email,
  openingTime: r.opening_time,
  closingTime: r.closing_time,
  rating: parseFloat(r.rating),
  isActive: r.is_active,
  isAvailable: r.is_available,
  deliveryFee: parseFloat(r.delivery_fee),
  minimumOrder: parseFloat(r.minimum_order),
  estimatedDeliveryTime: r.estimated_delivery_time,
  createdAt: r.created_at,
  updatedAt: r.updated_at
});

// Helper: Format food item object
const formatFoodItem = (f) => ({
  itemId: f.item_id,
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
  calories: f.calories
});

module.exports = {
  getAllRestaurants,
  getRestaurantById,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
  getRestaurantWithMenu
};
