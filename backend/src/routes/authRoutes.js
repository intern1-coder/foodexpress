/**
 * Authentication Routes
 * 
 * POST /api/auth/register   - Register new user
 * POST /api/auth/login      - Login user
 * PUT  /api/auth/change-password - Change password
 * POST /api/auth/refresh    - Refresh token
 */

const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { validateRegister, validateLogin } = require('../validation');

// ============================================
// Public Routes
// ============================================

// POST /api/auth/register
router.post('/register', validateRegister, authController.register);

// POST /api/auth/login
router.post('/login', validateLogin, authController.login);

// ============================================
// Protected Routes (require authentication)
// ============================================

// PUT /api/auth/change-password
router.put('/change-password', authenticateToken, authController.changePassword);

// POST /api/auth/refresh
router.post('/refresh', authenticateToken, authController.refreshToken);

module.exports = router;
