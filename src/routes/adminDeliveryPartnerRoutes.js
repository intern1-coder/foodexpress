/**
 * Admin Delivery Partner Routes
 *
 * Handles admin management of delivery partners
 */

const express = require('express');
const router = express.Router();

const adminDeliveryPartnerController = require('../controllers/adminDeliveryPartnerController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');

// ============================================
// Protected Routes (require authentication and admin role)
// ============================================
router.use(authenticateToken);
router.use(requireAdmin);

// ============================================
// Delivery Partners Management
// ============================================

// GET /api/admin/delivery-partners
router.get('/delivery-partners', adminDeliveryPartnerController.getAllDeliveryPartners);

// POST /api/admin/delivery-partners
router.post('/delivery-partners', adminDeliveryPartnerController.createDeliveryPartner);

// PUT /api/admin/delivery-partners/:id
router.put('/delivery-partners/:id', adminDeliveryPartnerController.updateDeliveryPartner);

// DELETE /api/admin/delivery-partners/:id
router.delete('/delivery-partners/:id', adminDeliveryPartnerController.deleteDeliveryPartner);

// ============================================
// Assign Delivery Partner to Order
// ============================================

// PUT /api/admin/orders/:id/assign-delivery-partner
router.put('/orders/:id/assign-delivery-partner', async (req, res, next) => {
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

    const result = await adminDeliveryPartnerController.assignDeliveryPartnerToOrder(id, deliveryPartnerId);

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
});

module.exports = router;