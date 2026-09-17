/**
 * Order Routes
 * 
 * POST   /api/orders              - Create new order
 * GET    /api/orders              - Get user orders
 * GET    /api/orders/all          - Get all orders (admin)
 * GET    /api/orders/stats        - Get order statistics (admin)
 * GET    /api/orders/:id          - Get order by ID
 * PUT    /api/orders/:id/status   - Update order status
 * PUT    /api/orders/:id/cancel   - Cancel order
 */

const express = require('express');
const router = express.Router();

const orderController = require('../controllers/orderController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireAdmin, requireCustomer } = require('../middleware/roleMiddleware');
const { validate } = require('../validation');
const { validateOrder, validateOrderStatus } = require('../validation/orderValidation');

// ============================================
// All routes require authentication
// ============================================
router.use(authenticateToken);

// ============================================
// Admin Routes
// ============================================

// GET /api/orders/all
router.get('/all', requireAdmin, orderController.getAllOrders);

// GET /api/orders/stats
router.get('/stats', requireAdmin, orderController.getOrderStats);

// ============================================
// User Routes
// ============================================

// POST /api/orders
router.post('/', requireCustomer, validate(validateOrder), orderController.createOrder);

// GET /api/orders
router.get('/', orderController.getMyOrders);

// GET /api/orders/:id
router.get('/:id', orderController.getOrderById);

// PUT /api/orders/:id/status
router.put('/:id/status', validate(validateOrderStatus), orderController.updateOrderStatus);

// PUT /api/orders/:id/cancel
router.put('/:id/cancel', orderController.cancelOrder);

module.exports = router;
