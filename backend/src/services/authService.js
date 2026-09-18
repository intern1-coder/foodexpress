/**
 * Authentication Service
 *
 * Handles user registration, login, and token management
 */

const bcrypt = require('bcrypt');
const { query, getClient } = require('../config/database');
const { generateToken } = require('../middleware/authMiddleware');
const { sanitizeInput } = require('../validation');

const SALT_ROUNDS = 12;

/**
 * Register a new user
 */
const register = async (userData) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    // Sanitize input
    const sanitized = sanitizeInput(userData);

    // Check if email already exists
    const existingUser = await client.query(
      'SELECT user_id FROM users WHERE email = $1',
      [sanitized.email]
    );

    if (existingUser.rows.length > 0) {
      throw new Error('Email already registered');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(sanitized.password, SALT_ROUNDS);

    // Insert new user
    const result = await client.query(
      `INSERT INTO users (
        first_name, last_name, email, password_hash,
        phone, address, city, state, zip_code, role
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING user_id, first_name, last_name, email, phone, role, created_at`,
      [
        sanitized.first_name,
        sanitized.last_name,
        sanitized.email,
        passwordHash,
        sanitized.phone || null,
        sanitized.address || null,
        sanitized.city || null,
        sanitized.state || null,
        sanitized.zip_code || null,
        sanitized.role || 'customer'
      ]
    );

    const newUser = result.rows[0];

    // Generate JWT token
    const token = generateToken({
      userId: newUser.user_id,
      email: newUser.email,
      role: newUser.role
    });

    await client.query('COMMIT');

    return {
      success: true,
      data: {
        user: {
          userId: newUser.user_id,
          firstName: newUser.first_name,
          lastName: newUser.last_name,
          email: newUser.email,
          phone: newUser.phone,
          role: newUser.role,
          createdAt: newUser.created_at
        },
        token,
        expiresIn: process.env.JWT_EXPIRES_IN || '24h'
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
 * Login user
 */
const login = async (email, password) => {
  // Find user by email
  const result = await query(
    `SELECT user_id, first_name, last_name, email, password_hash,
            phone, role, is_active
     FROM users
     WHERE email = $1`,
    [email.toLowerCase().trim()]
  );

  if (result.rows.length === 0) {
    throw new Error('Invalid email or password');
  }

  const user = result.rows[0];

  // Check if user is active
  if (!user.is_active) {
    throw new Error('Your account has been deactivated. Please contact support.');
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.password_hash);

  if (!isValidPassword) {
    throw new Error('Invalid email or password');
  }

  // Generate JWT token - ensure role is a clean string
  const cleanRole = String(user.role).trim();
  const token = generateToken({
    userId: user.user_id,
    email: user.email,
    role: cleanRole
  });

  return {
    success: true,
    data: {
      user: {
        userId: user.user_id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        phone: user.phone,
        role: cleanRole
      },
      token,
      expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    }
  };
};

/**
 * Change password
 */
const changePassword = async (userId, currentPassword, newPassword) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    // Get user's current password
    const result = await client.query(
      'SELECT password_hash FROM users WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, result.rows[0].password_hash);

    if (!isValidPassword) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Update password
    await client.query(
      'UPDATE users SET password_hash = $1 WHERE user_id = $2',
      [passwordHash, userId]
    );

    await client.query('COMMIT');

    return {
      success: true,
      message: 'Password changed successfully'
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Refresh token
 */
const refreshToken = async (userId) => {
  // Get user data
  const result = await query(
    'SELECT user_id, email, role, is_active FROM users WHERE user_id = $1',
    [userId]
  );

  if (result.rows.length === 0) {
    throw new Error('User not found');
  }

  const user = result.rows[0];

  if (!user.is_active) {
    throw new Error('Account is deactivated');
  }

  // Generate new token - ensure role is a clean string
  const cleanRole = String(user.role).trim();
  const token = generateToken({
    userId: user.user_id,
    email: user.email,
    role: cleanRole
  });

  return {
    success: true,
    data: {
      token,
      expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    }
  };
};

module.exports = {
  register,
  login,
  changePassword,
  refreshToken
};