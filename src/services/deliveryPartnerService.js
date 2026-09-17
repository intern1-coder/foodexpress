/**
 * Delivery Partner Service
 *
 * Handles delivery partner business logic
 */

const { query, getClient } = require('../config/database');

/**
 * Get all delivery partners with user details
 */
const getAllDeliveryPartners = async () => {
  const result = await query(
    `SELECT dp.id, dp.vehicle_type, dp.is_available, dp.created_at,
            u.user_id, u.first_name, u.last_name, u.email, u.phone, u.role, u.is_active
     FROM delivery_partners dp
     JOIN users u ON dp.user_id = u.user_id
     ORDER BY dp.created_at DESC`
  );

  return {
    success: true,
    data: result.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
      phone: row.phone,
      role: row.role,
      isActive: row.is_active,
      vehicleType: row.vehicle_type,
      isAvailable: row.is_available,
      createdAt: row.created_at
    }))
  };
};

/**
 * Get delivery partner by ID
 */
const getDeliveryPartnerById = async (id) => {
  const result = await query(
    `SELECT dp.id, dp.vehicle_type, dp.is_available, dp.created_at,
            u.user_id, u.first_name, u.last_name, u.email, u.phone, u.role, u.is_active
     FROM delivery_partners dp
     JOIN users u ON dp.user_id = u.user_id
     WHERE dp.id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    return {
      success: false,
      error: 'Delivery partner not found'
    };
  }

  const row = result.rows[0];

  return {
    success: true,
    data: {
      id: row.id,
      userId: row.user_id,
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
      phone: row.phone,
      role: row.role,
      isActive: row.is_active,
      vehicleType: row.vehicle_type,
      isAvailable: row.is_available,
      createdAt: row.created_at
    }
  };
};

/**
 * Get delivery partner by user ID
 */
const getDeliveryPartnerByUserId = async (userId) => {
  const result = await query(
    `SELECT dp.id, dp.vehicle_type, dp.is_available, dp.created_at,
            u.user_id, u.first_name, u.last_name, u.email, u.phone, u.role, u.is_active
     FROM delivery_partners dp
     JOIN users u ON dp.user_id = u.user_id
     WHERE dp.user_id = $1`,
    [userId]
  );

  if (result.rows.length === 0) {
    return {
      success: false,
      error: 'Delivery partner not found'
    };
  }

  const row = result.rows[0];

  return {
    success: true,
    data: {
      id: row.id,
      userId: row.user_id,
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
      phone: row.phone,
      role: row.role,
      isActive: row.is_active,
      vehicleType: row.vehicle_type,
      isAvailable: row.is_available,
      createdAt: row.created_at
    }
  };
};

/**
 * Create delivery partner
 * @param {Object} deliveryPartnerData - { userId, vehicleType, isAvailable }
 */
const createDeliveryPartner = async (deliveryPartnerData) => {
  const { userId, vehicleType, isAvailable = true } = deliveryPartnerData;

  // Verify user exists and is a delivery partner
  const userResult = await query(
    'SELECT user_id, role FROM users WHERE user_id = $1',
    [userId]
  );

  if (userResult.rows.length === 0) {
    throw new Error('User not found');
  }

  if (userResult.rows[0].role !== 'delivery_partner') {
    throw new Error('User is not a delivery partner');
  }

  // Check if delivery partner record already exists for this user
  const existingDp = await query(
    'SELECT id FROM delivery_partners WHERE user_id = $1',
    [userId]
  );

  if (existingDp.rows.length > 0) {
    throw new Error('Delivery partner record already exists for this user');
  }

  const client = await getClient();

  try {
    await client.query('BEGIN');

    const result = await client.query(
      `INSERT INTO delivery_partners (
        user_id, vehicle_type, is_available
      ) VALUES ($1, $2, $3)
      RETURNING id, user_id, vehicle_type, is_available, created_at`,
      [userId, vehicleType, isAvailable]
    );

    const newDp = result.rows[0];

    await client.query('COMMIT');

    return {
      success: true,
      data: {
        id: newDp.id,
        userId: newDp.user_id,
        vehicleType: newDp.vehicle_type,
        isAvailable: newDp.is_available,
        createdAt: newDp.created_at
      }
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Update delivery partner
 * @param {string} id - Delivery partner ID
 * @param {Object} updateData - { vehicleType, isAvailable }
 */
const updateDeliveryPartner = async (id, updateData) => {
  const { vehicleType, isAvailable } = updateData;

  // Build update query dynamically
  const updateFields = [];
  const values = [];
  let paramIndex = 1;

  if (vehicleType !== undefined) {
    updateFields.push(`vehicle_type = $${paramIndex++}`);
    values.push(vehicleType);
  }

  if (isAvailable !== undefined) {
    updateFields.push(`is_available = $${paramIndex++}`);
    values.push(isAvailable);
  }

  if (updateFields.length === 0) {
    throw new Error('No fields to update');
  }

  values.push(id); // for WHERE clause

  const result = await query(
    `UPDATE delivery_partners
     SET ${updateFields.join(', ')}
     WHERE id = $${paramIndex}
     RETURNING id, user_id, vehicle_type, is_available, created_at`,
    values
  );

  if (result.rows.length === 0) {
    return {
      success: false,
      error: 'Delivery partner not found'
    };
  }

  const dp = result.rows[0];

  return {
    success: true,
    data: {
      id: dp.id,
      userId: dp.user_id,
      vehicleType: dp.vehicle_type,
      isAvailable: dp.is_available,
      createdAt: dp.created_at
    }
  };
};

/**
 * Delete delivery partner
 */
const deleteDeliveryPartner = async (id) => {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    // Check if delivery partner exists
    const dpResult = await query(
      'SELECT id FROM delivery_partners WHERE id = $1',
      [id]
    );

    if (dpResult.rows.length === 0) {
      throw new Error('Delivery partner not found');
    }

    // Check if delivery partner is assigned to any active orders
    const orderResult = await query(
      `SELECT order_id FROM orders
       WHERE delivery_partner_id = $1
       AND delivery_status NOT IN ('Delivered', 'Cancelled')`,
      [id]
    );

    if (orderResult.rows.length > 0) {
      throw new Error('Cannot delete delivery partner with active assignments');
    }

    // Delete delivery partner
    await query('DELETE FROM delivery_partners WHERE id = $1', [id]);

    await client.query('COMMIT');

    return {
      success: true,
      message: 'Delivery partner deleted successfully'
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Assign delivery partner to order
 * @param {string} orderId - Order ID
 * @param {string} deliveryPartnerId - Delivery partner ID
 */
const assignDeliveryPartnerToOrder = async (orderId, deliveryPartnerId) => {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    // Verify order exists
    const orderResult = await query(
      'SELECT order_id, delivery_partner_id, delivery_status FROM orders WHERE order_id = $1',
      [orderId]
    );

    if (orderResult.rows.length === 0) {
      throw new Error('Order not found');
    }

    const order = orderResult.rows[0];

    // Verify delivery partner exists
    const dpResult = await query(
      'SELECT id FROM delivery_partners WHERE id = $1',
      [deliveryPartnerId]
    );

    if (dpResult.rows.length === 0) {
      throw new Error('Delivery partner not found');
    }

    // Check if delivery partner is available
    const dpAvailability = await query(
      'SELECT is_available FROM delivery_partners WHERE id = $1',
      [deliveryPartnerId]
    );

    if (!dpAvailability.rows[0].is_available) {
      throw new Error('Delivery partner is not available');
    }

    // Update order with delivery partner and set status to Assigned
    const result = await client.query(
      `UPDATE orders
       SET delivery_partner_id = $1, delivery_status = 'Assigned', updated_at = CURRENT_TIMESTAMP
       WHERE order_id = $2
       RETURNING order_id, delivery_partner_id, delivery_status, updated_at`,
      [deliveryPartnerId, orderId]
    );

    await client.query('COMMIT');

    return {
      success: true,
      data: {
        orderId: result.rows[0].order_id,
        deliveryPartnerId: result.rows[0].delivery_partner_id,
        deliveryStatus: result.rows[0].delivery_status,
        updatedAt: result.rows[0].updated_at
      }
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Update delivery partner availability
 * @param {string} deliveryPartnerId - Delivery partner ID
 * @param {boolean} isAvailable - Availability status
 */
const updateDeliveryPartnerAvailability = async (deliveryPartnerId, isAvailable) => {
  return await updateDeliveryPartner(deliveryPartnerId, { isAvailable });
};

module.exports = {
  getAllDeliveryPartners,
  getDeliveryPartnerById,
  getDeliveryPartnerByUserId,
  createDeliveryPartner,
  updateDeliveryPartner,
  deleteDeliveryPartner,
  assignDeliveryPartnerToOrder,
  updateDeliveryPartnerAvailability
};