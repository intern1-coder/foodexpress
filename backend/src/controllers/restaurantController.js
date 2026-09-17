/**
 * Restaurant Controller
 * 
 * Handles HTTP requests for restaurant endpoints
 */

const restaurantService = require('../services/restaurantService');

/**
 * @desc    Get all restaurants
 * @route   GET /api/restaurants
 * @access  Public
 */
const getAllRestaurants = async (req, res, next) => {
  try {
    const result = await restaurantService.getAllRestaurants(req.query);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get restaurant by ID
 * @route   GET /api/restaurants/:id
 * @access  Public
 */
const getRestaurantById = async (req, res, next) => {
  try {
    const result = await restaurantService.getRestaurantById(req.params.id);
    res.status(200).json(result);
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
 * @desc    Get restaurant with menu
 * @route   GET /api/restaurants/:id/menu
 * @access  Public
 */
const getRestaurantMenu = async (req, res, next) => {
  try {
    const result = await restaurantService.getRestaurantWithMenu(req.params.id);
    res.status(200).json(result);
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
 * @desc    Create restaurant
 * @route   POST /api/restaurants
 * @access  Private/Admin
 */
const createRestaurant = async (req, res, next) => {
  try {
    const result = await restaurantService.createRestaurant(req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update restaurant
 * @route   PUT /api/restaurants/:id
 * @access  Private/Admin
 */
const updateRestaurant = async (req, res, next) => {
  try {
    const result = await restaurantService.updateRestaurant(req.params.id, req.body);
    res.status(200).json(result);
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
 * @desc    Delete restaurant
 * @route   DELETE /api/restaurants/:id
 * @access  Private/Admin
 */
const deleteRestaurant = async (req, res, next) => {
  try {
    const result = await restaurantService.deleteRestaurant(req.params.id);
    res.status(200).json(result);
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

module.exports = {
  getAllRestaurants,
  getRestaurantById,
  getRestaurantMenu,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant
};
