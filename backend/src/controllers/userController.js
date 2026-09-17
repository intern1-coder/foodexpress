/**
 * User Controller
 * 
 * Handles HTTP requests for user profile endpoints
 */

const userService = require('../services/userService');

/**
 * @desc    Get current user profile
 * @route   GET /api/users/profile
 * @access  Private
 */
const getProfile = async (req, res, next) => {
  try {
    const result = await userService.getProfile(req.user.userId);

    res.status(200).json({
      success: true,
      data: result.data
    });
  } catch (error) {
    if (error.message === 'User not found') {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: error.message
      });
    }
    next(error);
  }
};

/**
 * @desc    Update current user profile
 * @route   PUT /api/users/profile
 * @access  Private
 */
const updateProfile = async (req, res, next) => {
  try {
    const result = await userService.updateProfile(req.user.userId, req.body);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: result.data
    });
  } catch (error) {
    if (error.message === 'Email already in use') {
      return res.status(409).json({
        success: false,
        error: 'Conflict',
        message: error.message
      });
    }
    if (error.message === 'User not found') {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: error.message
      });
    }
    next(error);
  }
};

/**
 * @desc    Delete current user account
 * @route   DELETE /api/users/profile
 * @access  Private
 */
const deleteAccount = async (req, res, next) => {
  try {
    const result = await userService.deleteAccount(req.user.userId);

    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all users (admin only)
 * @route   GET /api/users
 * @access  Private/Admin
 */
const getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '', role = '' } = req.query;

    const result = await userService.getAllUsers(
      parseInt(page),
      parseInt(limit),
      search,
      role
    );

    res.status(200).json({
      success: true,
      data: result.data
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  deleteAccount,
  getAllUsers
};
