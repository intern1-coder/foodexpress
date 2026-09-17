/**
 * Delivery Partner Controller
 *
 * Handles HTTP requests for delivery partner endpoints
 */

const authService = require('../services/authService');
const orderService = require('../services/orderService');
const deliveryPartnerService = require('../services/deliveryPartnerService');
const { generateToken } = require('../middleware/authMiddleware');

/**
 * @desc    Delivery partner login
 * @route   POST /api/delivery/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Email and password are required'
      });
    }

    // Use the auth service to login (this will work for delivery partners as they are users)
    const result = await authService.login(email, password);

    // Check if the user is a delivery partner
    if (result.data.user.role !== 'delivery_partner') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Access denied. Delivery partner role required.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: result.data
    });
  } catch (error) {
    if (error.message.includes('Invalid email or password') ||
        error.message.includes('deactivated')) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: error.message
      });
    }
    next(error);
  }
};

/**
 * @desc    Get delivery partner dashboard stats
 * @route   GET /api/delivery/dashboard
 * @access  Private/Delivery Partner
 */
const getDashboard = async (req, res, next) => {
  try {
    const deliveryPartnerId = req.user.userId; // from auth middleware

    // Get delivery partner details
    const dpResult = await deliveryPartnerService.getDeliveryPartnerByUserId(deliveryPartnerId);
    if (!dpResult.success) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Delivery partner not found'
      });
    }

    // Get order stats for this delivery partner
    const orders = await orderService.getDeliveryPartnerOrders(deliveryPartnerId);

    const activeDeliveries = orders.filter(order =>
      order.delivery_status &&
      !['Delivered', 'Cancelled'].includes(order.delivery_status)
    ).length;

    const completedDeliveries = orders.filter(order =>
      order.delivery_status === 'Delivered'
    ).length;

    const totalDeliveries = orders.length;

    res.status(200).json({
      success: true,
      data: {
        deliveryPartner: {
          id: dpResult.data.id,
          userId: dpResult.data.userId,
          firstName: dpResult.data.firstName,
          lastName: dpResult.data.lastName,
          email: dpResult.data.email,
          phone: dpResult.data.phone,
          vehicleType: dpResult.data.vehicleType,
          isAvailable: dpResult.data.isAvailable
        },
        stats: {
          activeDeliveries,
          completedDeliveries,
          totalDeliveries
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get delivery partner's orders
 * @route   GET /api/delivery/orders
 * @access  Private/Delivery Partner
 */
const getMyOrders = async (req, res, next) => {
  try {
    const deliveryPartnerId = req.user.userId;

    const orders = await orderService.getDeliveryPartnerOrders(deliveryPartnerId);

    res.status(200).json({
      success: true,
      data: orders
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get order by ID for delivery partner
 * @route   GET /api/delivery/orders/:id
 * @access  Private/Delivery Partner
 */
const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deliveryPartnerId = req.user.userId;

    const order = await orderService.getOrderByIdForDeliveryPartner(id, deliveryPartnerId);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Order not found or not assigned to you'
      });
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Accept order
 * @route   PUT /api/delivery/orders/:id/accept
 * @access  Private/Delivery Partner
 */
const acceptOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deliveryPartnerId = req.user.userId;

    const result = await orderService.acceptOrder(id, deliveryPartnerId);

    res.status(200).json({
      success: true,
      message: 'Order accepted successfully',
      data: result
    });
  } catch (error) {
    if (error.message.includes('Order not found') ||
        error.message.includes('Not assigned to you') ||
        error.message.includes('Invalid status transition')) {
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
 * @desc    Pick up order
 * @route   PUT /api/delivery/orders/:id/pickup
 * @access  Private/Delivery Partner
 */
const pickUpOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deliveryPartnerId = req.user.userId;

    const result = await orderService.pickUpOrder(id, deliveryPartnerId);

    res.status(200).json({
      success: true,
      message: 'Order picked up successfully',
      data: result
    });
  } catch (error) {
    if (error.message.includes('Order not found') ||
        error.message.includes('Not assigned to you') ||
        error.message.includes('Invalid status transition')) {
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
 * @desc    Start delivery (on the way)
 * @route   PUT /api/delivery/orders/:id/on-the-way
 * @access  Private/Delivery Partner
 */
const onTheWayOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deliveryPartnerId = req.user.userId;

    const result = await orderService.onTheWayOrder(id, deliveryPartnerId);

    res.status(200).json({
      success: true,
      message: 'Order marked as on the way',
      data: result
    });
  } catch (error) {
    if (error.message.includes('Order not found') ||
        error.message.includes('Not assigned to you') ||
        error.message.includes('Invalid status transition')) {
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
 * @desc    Mark order as delivered
 * @route   PUT /api/delivery/orders/:id/delivered
 * @access  Private/Delivery Partner
 */
const deliveredOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deliveryPartnerId = req.user.userId;

    const result = await orderService.deliveredOrder(id, deliveryPartnerId);

    res.status(200).json({
      success: true,
      message: 'Order marked as delivered',
      data: result
    });
  } catch (error) {
    if (error.message.includes('Order not found') ||
        error.message.includes('Not assigned to you') ||
        error.message.includes('Invalid status transition')) {
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
 * @desc    Get delivery partner profile
 * @route   GET /api/delivery/profile
 * @access  Private/Delivery Partner
 */
const getProfile = async (req, res, next) => {
  try {
    const deliveryPartnerId = req.user.userId;

    const dpResult = await deliveryPartnerService.getDeliveryPartnerByUserId(deliveryPartnerId);
    if (!dpResult.success) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Delivery partner not found'
      });
    }

    res.status(200).json({
      success: true,
      data: dpResult.data
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update delivery partner profile
 * @route   PUT /api/delivery/profile
 * @access  Private/Delivery Partner
 */
const updateProfile = async (req, res, next) => {
  try {
    const deliveryPartnerId = req.user.userId;
    const { phone, address, city, state, zip_code } = req.body;

    // We'll update the user table for these fields
    const client = await getClient();
    try {
      await client.query('BEGIN');

      const result = await client.query(
        `UPDATE users
         SET phone = $1, address = $2, city = $3, state = $4, zip_code = $5, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $6
         RETURNING user_id, first_name, last_name, email, phone, address, city, state, zip_code, role, created_at, updated_at`,
        [phone || null, address || null, city || null, state || null, zip_code || null, deliveryPartnerId]
      );

      if (result.rows.length === 0) {
        throw new Error('Delivery partner not found');
      }

      const user = result.rows[0];

      await client.query('COMMIT');

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          userId: user.user_id,
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          phone: user.phone,
          address: user.address,
          city: user.city,
          state: user.state,
          zipCode: user.zip_code,
          role: user.role,
          createdAt: user.created_at,
          updatedAt: user.updated_at
        }
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    next(error);
  }
};

// Helper function to get client (since we need it in updateProfile)
const getClient = require('../config/database').getClient;

module.exports = {
  login,
  getDashboard,
  getMyOrders,
  getOrderById,
  acceptOrder,
  pickUpOrder,
  onTheWayOrder,
  deliveredOrder,
  getProfile,
  updateProfile
};