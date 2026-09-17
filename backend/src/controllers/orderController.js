/**
 * Order Controller
 * 
 * Handles HTTP requests for order endpoints
 */

const orderService = require('../services/orderService');

/**
 * @desc    Create new order
 * @route   POST /api/orders
 * @access  Private/Customer
 */
const createOrder = async (req, res, next) => {
  try {
    const result = await orderService.createOrder(req.body, req.user.userId);
    res.status(201).json(result);
  } catch (error) {
    if (error.message.includes('not found') ||
        error.message.includes('not available') ||
        error.message.includes('not available')) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: error.message
      });
    }
    if (error.message.includes('Minimum order')) {
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
 * @desc    Get order by ID
 * @route   GET /api/orders/:id
 * @access  Private (owner or admin)
 */
const getOrderById = async (req, res, next) => {
  try {
    const userId = req.user.role === 'admin' ? null : req.user.userId;
    const result = await orderService.getOrderById(req.params.id, userId);
    res.status(200).json(result);
  } catch (error) {
    if (error.message === 'Order not found') {
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
 * @desc    Get user orders
 * @route   GET /api/orders
 * @access  Private
 */
const getMyOrders = async (req, res, next) => {
  try {
    const result = await orderService.getUserOrders(req.user.userId, req.query);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all orders (admin)
 * @route   GET /api/orders/all
 * @access  Private/Admin
 */
const getAllOrders = async (req, res, next) => {
  try {
    const result = await orderService.getAllOrders(req.query);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update order status
 * @route   PUT /api/orders/:id/status
 * @access  Private (owner or admin)
 */
const updateOrderStatus = async (req, res, next) => {
  try {
    const result = await orderService.updateOrderStatus(
      req.params.id,
      req.body.status,
      req.user.userId,
      req.user.role
    );
    res.status(200).json(result);
  } catch (error) {
    if (error.message === 'Order not found') {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: error.message
      });
    }
    if (error.message.includes('Cannot change status')) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: error.message
      });
    }
    if (error.message.includes('only update your own')) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: error.message
      });
    }
    next(error);
  }
};

/**
 * @desc    Cancel order
 * @route   PUT /api/orders/:id/cancel
 * @access  Private (owner or admin)
 */
const cancelOrder = async (req, res, next) => {
  try {
    const result = await orderService.cancelOrder(
      req.params.id,
      req.user.userId,
      req.user.role
    );
    res.status(200).json(result);
  } catch (error) {
    if (error.message === 'Order not found') {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: error.message
      });
    }
    if (error.message.includes('Cannot change status')) {
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
 * @desc    Get order statistics (admin)
 * @route   GET /api/orders/stats
 * @access  Private/Admin
 */
const getOrderStats = async (req, res, next) => {
  try {
    const result = await orderService.getOrderStats(req.query.restaurantId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  getOrderById,
  getMyOrders,
  getAllOrders,
  updateOrderStatus,
  cancelOrder,
  getOrderStats
};
