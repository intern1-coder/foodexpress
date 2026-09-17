/**
 * Delivery Partner Routes
 *
 * Handles delivery partner authentication and order management
 */

const express = require('express');
const router = express.Router();

const deliveryPartnerController = require('../controllers/deliveryPartnerController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireDeliveryPartner } = require('../middleware/roleMiddleware');

// ============================================
// Public Routes
// ============================================

// POST /api/delivery/login
router.post('/login', deliveryPartnerController.login);

// ============================================
// Protected Routes (require authentication and delivery partner role)
// ============================================
router.use(authenticateToken);
router.use(requireDeliveryPartner);

// ============================================
// Delivery Partner Dashboard
// ============================================

// GET /api/delivery/dashboard
router.get('/dashboard', deliveryPartnerController.getDashboard);

// ============================================
// Delivery Partner Orders
// ============================================

// GET /api/delivery/orders
router.get('/orders', deliveryPartnerController.getMyOrders);

// GET /api/delivery/orders/:id
router.get('/orders/:id', deliveryPartnerController.getOrderById);

// PUT /api/delivery/orders/:id/accept
router.put('/orders/:id/accept', deliveryPartnerController.acceptOrder);

// PUT /api/delivery/orders/:id/pickup
router.put('/orders/:id/pickup', deliveryPartnerController.pickUpOrder);

// PUT /api/delivery/orders/:id/on-the-way
router.put('/orders/:id/on-the-way', deliveryPartnerController.onTheWayOrder);

// PUT /api/delivery/orders/:id/delivered
router.put('/orders/:id/delivered', deliveryPartnerController.deliveredOrder);

// ============================================
// Delivery Partner Profile
// ============================================

// GET /api/delivery/profile
router.get('/profile', deliveryPartnerController.getProfile);

// PUT /api/delivery/profile
router.put('/profile', deliveryPartnerController.updateProfile);

module.exports = router;