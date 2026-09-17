/**
 * User Service
 * 
 * Handles user profile operations
 */

const { query, getClient } = require('../config/database');
const bcrypt = require('bcrypt');
const { sanitizeInput } = require('../validation');

const SALT_ROUNDS = 12;

/**
 * Get user profile by ID
 */
const getProfile = async (userId) => {
  const result = await query(
    `SELECT user_id, first_name, last_name, email, phone,
            address, city, state, zip_code, role, is_active,
            created_at, updated_at
     FROM users
     WHERE user_id = $1`,
    [userId]
  );

  if (result.rows.length === 0) {
    throw new Error('User not found');
  }

  const user = result.rows[0];

  return {
    success: true,
    data: {
      userId: user.user_id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      phone: user.phone,
      address: user.address,
      city: user.city,
      state: user.state,
      zipCode: user.zip_code,
      role: user.role,
      isActive: user.is_active,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    }
  };
};

/**
 * Update user profile
 */
const updateProfile = async (userId, updateData) => {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    // Sanitize input
    const sanitized = sanitizeInput(updateData);

    // Check if email is being changed and already exists
    if (sanitized.email) {
      const existingEmail = await client.query(
        'SELECT user_id FROM users WHERE email = $1 AND user_id != $2',
        [sanitized.email, userId]
      );

      if (existingEmail.rows.length > 0) {
        throw new Error('Email already in use');
      }
    }

    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramIndex = 1;

    const fieldMapping = {
      first_name: sanitized.first_name,
      last_name: sanitized.last_name,
      email: sanitized.email,
      phone: sanitized.phone,
      address: sanitized.address,
      city: sanitized.city,
      state: sanitized.state,
      zip_code: sanitized.zip_code
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

    values.push(userId);

    const result = await client.query(
      `UPDATE users
       SET ${updates.join(', ')}
       WHERE user_id = $${paramIndex}
       RETURNING user_id, first_name, last_name, email, phone,
                 address, city, state, zip_code, role, updated_at`,
      values
    );

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    const updatedUser = result.rows[0];

    await client.query('COMMIT');

    return {
      success: true,
      data: {
        userId: updatedUser.user_id,
        firstName: updatedUser.first_name,
        lastName: updatedUser.last_name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        address: updatedUser.address,
        city: updatedUser.city,
        state: updatedUser.state,
        zipCode: updatedUser.zip_code,
        role: updatedUser.role,
        updatedAt: updatedUser.updated_at
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
 * Delete user account (soft delete)
 */
const deleteAccount = async (userId) => {
  const result = await query(
    `UPDATE users
     SET is_active = false
     WHERE user_id = $1 AND is_active = true
     RETURNING user_id`,
    [userId]
  );

  if (result.rows.length === 0) {
    throw new Error('User not found or already deactivated');
  }

  return {
    success: true,
    message: 'Account deactivated successfully'
  };
};

/**
 * Get all users (admin only)
 */
const getAllUsers = async (page = 1, limit = 10, search = '', role = '') => {
  const offset = (page - 1) * limit;

  let queryText = `
    SELECT user_id, first_name, last_name, email, phone,
           role, is_active, created_at
    FROM users
  `;

  const values = [];
  const conditions = [];
  let paramIndex = 1;

  if (search) {
    conditions.push(`(first_name ILIKE $${paramIndex} OR last_name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`);
    values.push(`%${search}%`);
    paramIndex++;
  }

  if (role) {
    conditions.push(`role = $${paramIndex}`);
    values.push(role);
    paramIndex++;
  }

  if (conditions.length > 0) {
    queryText += ` WHERE ${conditions.join(' AND ')}`;
  }

  queryText += `
    ORDER BY created_at DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;
  values.push(limit, offset);

  const result = await query(queryText, values);

  // Get total count
  let countQuery = 'SELECT COUNT(*) FROM users';
  const countValues = [];
  let countParamIndex = 1;
  const countConditions = [];

  if (search) {
    countConditions.push(`(first_name ILIKE $${countParamIndex} OR last_name ILIKE $${countParamIndex} OR email ILIKE $${countParamIndex})`);
    countValues.push(`%${search}%`);
    countParamIndex++;
  }

  if (role) {
    countConditions.push(`role = $${countParamIndex}`);
    countValues.push(role);
    countParamIndex++;
  }

  if (countConditions.length > 0) {
    countQuery += ` WHERE ${countConditions.join(' AND ')}`;
  }

  const countResult = await query(countQuery, countValues);
  const totalCount = parseInt(countResult.rows[0].count);

  return {
    success: true,
    data: {
      users: result.rows.map(user => ({
        userId: user.user_id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isActive: user.is_active,
        createdAt: user.created_at
      })),
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    }
  };
};

module.exports = {
  getProfile,
  updateProfile,
  deleteAccount,
  getAllUsers
};
