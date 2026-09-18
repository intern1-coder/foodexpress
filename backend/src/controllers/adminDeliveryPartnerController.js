/**
 * Delivery Partner Controller (Admin)
 *
 * Handles HTTP requests for delivery partner management endpoints
 */

const deliveryPartnerService = require('../services/deliveryPartnerService');

/**
 * @desc    Get all delivery partners
 * @route   GET /api/admin/delivery-partners
 * @access  Private/Admin
 */
const getAllDeliveryPartners = async (req, res, next) => {
  try {
    const result = await deliveryPartnerService.getAllDeliveryPartners();

    res.status(200).json({
      success: true,
      data: result.data
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get delivery partner by ID
 * @route   GET /api/admin/delivery-partners/:id
 * @access  Private/Admin
 */
const getDeliveryPartnerById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await deliveryPartnerService.getDeliveryPartnerById(id);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: result.error
      });
    }

    res.status(200).json({
      success: true,
      data: result.data
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create delivery partner
 * @route   POST /api/admin/delivery-partners
 * @access  Private/Admin
 */
const createDeliveryPartner = async (req, res, next) => {
  try {
    const result = await deliveryPartnerService.createDeliveryPartner(req.body);

    res.status(201).json({
      success: true,
      message: 'Delivery partner created successfully',
      data: result.data
    });
  } catch (error) {
    if (error.message.includes('User not found') ||
        error.message.includes('User is not a delivery partner') ||
        error.message.includes('Delivery partner record already exists')) {
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
 * @desc    Update delivery partner
 * @route   PUT /api/admin/delivery-partners/:id
 * @access  Private/Admin
 */
const updateDeliveryPartner = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await deliveryPartnerService.updateDeliveryPartner(id, req.body);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: result.error
      });
    }

    res.status(200).json({
      success: true,
      message: 'Delivery partner updated successfully',
      data: result.data
    });
  } catch (error) {
    if (error.message.includes('Delivery partner not found') ||
        error.message.includes('No fields to update')) {
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
 * @desc    Delete delivery partner
 * @route   DELETE /api/admin/delivery-partners/:id
 * @access  Private/Admin
 */
const deleteDeliveryPartner = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await deliveryPartnerService.deleteDeliveryPartner(id);

    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    if (error.message.includes('Delivery partner not found') ||
        error.message.includes('Cannot delete delivery partner with active assignments')) {
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
 * @desc    Assign delivery partner to order
 * @route   PUT /api/admin/orders/:id/assign-delivery-partner
 * @access  Private/Admin
 */
const assignDeliveryPartnerToOrder = async (req, res, next) => {
  try {
    const { id } = req.params; // orderId
    const { deliveryPartnerId } = req.body;

    if (!deliveryPartnerId) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Delivery partner ID is required'
      });
    }

    const result = await deliveryPartnerService.assignDeliveryPartnerToOrder(id, deliveryPartnerId);

    res.status(200).json({
      success: true,
      message: 'Delivery partner assigned successfully',
      data: result.data
    });
  } catch (error) {
    if (error.message.includes('Order not found') ||
        error.message.includes('Delivery partner not found') ||
        error.message.includes('Delivery partner is not available')) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: error.message
      });
    }
    next(error);
  }
};

module.exports = {
  getAllDeliveryPartners,
  getDeliveryPartnerById,
  createDeliveryPartner,
  updateDeliveryPartner,
  deleteDeliveryPartner,
  assignDeliveryPartnerToOrder
};