/**
 * User Routes
 * 
 * GET    /api/users/profile    - Get current user profile
 * PUT    /api/users/profile    - Update current user profile
 * DELETE /api/users/profile    - Delete current user account
 * GET    /api/users            - Get all users (admin only)
 */

const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');
const { validateProfileUpdate } = require('../validation');

// ============================================
// Protected Routes (require authentication)
// ============================================

// GET /api/users/profile
router.get('/profile', authenticateToken, userController.getProfile);

// PUT /api/users/profile
router.put('/profile', authenticateToken, validateProfileUpdate, userController.updateProfile);

// DELETE /api/users/profile
router.delete('/profile', authenticateToken, userController.deleteAccount);

// ============================================
// Admin Routes
// ============================================

// GET /api/users
router.get('/', authenticateToken, requireAdmin, userController.getAllUsers);

module.exports = router;
