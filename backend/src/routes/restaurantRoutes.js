/**
 * Restaurant Routes
 * 
 * GET    /api/restaurants         - Get all restaurants
 * GET    /api/restaurants/:id     - Get restaurant by ID
 * GET    /api/restaurants/:id/menu - Get restaurant menu
 * POST   /api/restaurants         - Create restaurant (admin)
 * PUT    /api/restaurants/:id     - Update restaurant (admin)
 * DELETE /api/restaurants/:id     - Delete restaurant (admin)
 */

const express = require('express');
const router = express.Router();

const restaurantController = require('../controllers/restaurantController');
const foodController = require('../controllers/foodController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');
const { validate } = require('../validation');
const { validateRestaurant } = require('../validation/restaurantValidation');

// ============================================
// Public Routes
// ============================================

// GET /api/restaurants
router.get('/', restaurantController.getAllRestaurants);

// GET /api/restaurants/:id
router.get('/:id', restaurantController.getRestaurantById);

// GET /api/restaurants/:id/menu
router.get('/:id/menu', restaurantController.getRestaurantMenu);

// GET /api/restaurants/:id/foods - Food items by restaurant
router.get('/:id/foods', foodController.getFoodsByRestaurant);

// GET /api/restaurants/:id/categories
router.get('/:id/categories', foodController.getCategories);

// ============================================
// Admin Routes (require authentication + admin role)
// ============================================

// POST /api/restaurants
router.post('/',
  authenticateToken,
  requireAdmin,
  validate(validateRestaurant),
  restaurantController.createRestaurant
);

// PUT /api/restaurants/:id
router.put('/:id',
  authenticateToken,
  requireAdmin,
  validate((data) => validateRestaurant(data, true)),
  restaurantController.updateRestaurant
);

// DELETE /api/restaurants/:id
router.delete('/:id',
  authenticateToken,
  requireAdmin,
  restaurantController.deleteRestaurant
);

module.exports = router;
