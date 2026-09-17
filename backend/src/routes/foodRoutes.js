/**
 * Food Item Routes
 * 
 * GET    /api/foods              - Get all food items
 * GET    /api/foods/:id          - Get food item by ID
 * POST   /api/foods              - Create food item (admin)
 * PUT    /api/foods/:id          - Update food item (admin)
 * DELETE /api/foods/:id          - Delete food item (admin)
 */

const express = require('express');
const router = express.Router();

const foodController = require('../controllers/foodController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');
const { validate } = require('../validation');
const { validateFoodItem } = require('../validation/foodValidation');

// ============================================
// Public Routes
// ============================================

// GET /api/foods
router.get('/', foodController.getAllFoodItems);

// GET /api/foods/:id
router.get('/:id', foodController.getFoodItemById);

// ============================================
// Admin Routes (require authentication + admin role)
// ============================================

// POST /api/foods
router.post('/',
  authenticateToken,
  requireAdmin,
  validate(validateFoodItem),
  foodController.createFoodItem
);

// PUT /api/foods/:id
router.put('/:id',
  authenticateToken,
  requireAdmin,
  validate((data) => validateFoodItem(data, true)),
  foodController.updateFoodItem
);

// DELETE /api/foods/:id
router.delete('/:id',
  authenticateToken,
  requireAdmin,
  foodController.deleteFoodItem
);

module.exports = router;
