/**
 * Food Item Controller
 * 
 * Handles HTTP requests for food item endpoints
 */

const foodService = require('../services/foodService');

/**
 * @desc    Get all food items
 * @route   GET /api/foods
 * @access  Public
 */
const getAllFoodItems = async (req, res, next) => {
  try {
    const result = await foodService.getAllFoodItems(req.query);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get food item by ID
 * @route   GET /api/foods/:id
 * @access  Public
 */
const getFoodItemById = async (req, res, next) => {
  try {
    const result = await foodService.getFoodItemById(req.params.id);
    res.status(200).json(result);
  } catch (error) {
    if (error.message === 'Food item not found') {
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
 * @desc    Get food items by restaurant
 * @route   GET /api/restaurants/:id/foods
 * @access  Public
 */
const getFoodsByRestaurant = async (req, res, next) => {
  try {
    const result = await foodService.getFoodItemsByRestaurant(req.params.id, req.query);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create food item
 * @route   POST /api/foods
 * @access  Private/Admin
 */
const createFoodItem = async (req, res, next) => {
  try {
    const result = await foodService.createFoodItem(req.body);
    res.status(201).json(result);
  } catch (error) {
    if (error.message === 'Restaurant not found') {
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
 * @desc    Update food item
 * @route   PUT /api/foods/:id
 * @access  Private/Admin
 */
const updateFoodItem = async (req, res, next) => {
  try {
    const result = await foodService.updateFoodItem(req.params.id, req.body);
    res.status(200).json(result);
  } catch (error) {
    if (error.message === 'Food item not found') {
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
 * @desc    Delete food item
 * @route   DELETE /api/foods/:id
 * @access  Private/Admin
 */
const deleteFoodItem = async (req, res, next) => {
  try {
    const result = await foodService.deleteFoodItem(req.params.id);
    res.status(200).json(result);
  } catch (error) {
    if (error.message === 'Food item not found') {
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
 * @desc    Get categories by restaurant
 * @route   GET /api/restaurants/:id/categories
 * @access  Public
 */
const getCategories = async (req, res, next) => {
  try {
    const result = await foodService.getCategoriesByRestaurant(req.params.id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllFoodItems,
  getFoodItemById,
  getFoodsByRestaurant,
  createFoodItem,
  updateFoodItem,
  deleteFoodItem,
  getCategories
};
