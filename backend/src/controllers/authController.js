/**
 * Authentication Controller
 * 
 * Handles HTTP requests for authentication endpoints
 */

const authService = require('../services/authService');

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: result.data
    });
  } catch (error) {
    if (error.message === 'Email already registered') {
      return res.status(409).json({
        success: false,
        error: 'Conflict',
        message: error.message
      });
    }
    next(error);
  }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Email and password are required'
      });
    }

    const result = await authService.login(email, password);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: result.data
    });
  } catch (error) {
    if (error.message.includes('Invalid email or password') ||
        error.message.includes('deactivated')) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: error.message
      });
    }
    next(error);
  }
};

/**
 * @desc    Change password
 * @route   PUT /api/auth/change-password
 * @access  Private
 */
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Current password and new password are required'
      });
    }

    const result = await authService.changePassword(
      req.user.userId,
      currentPassword,
      newPassword
    );

    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    if (error.message.includes('incorrect') ||
        error.message.includes('not found')) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: error.message
      });
    }
    next(error);
  }
};

/**
 * @desc    Refresh token
 * @route   POST /api/auth/refresh
 * @access  Private
 */
const refreshToken = async (req, res, next) => {
  try {
    const result = await authService.refreshToken(req.user.userId);

    res.status(200).json({
      success: true,
      message: 'Token refreshed',
      data: result.data
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  changePassword,
  refreshToken
};
