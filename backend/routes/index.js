const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const restaurantController = require('../controllers/restaurantController');
const menuController = require('../controllers/menuController');
const orderController = require('../controllers/orderController');
const deliveryController = require('../controllers/deliveryController');
const { authenticateToken } = require('../middleware/auth');
const { authorizeRole } = require('../middleware/roleCheck');

// Authentication routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/profile', authenticateToken, authController.getProfile);
router.put('/profile', authenticateToken, authController.updateProfile);

// Restaurant routes
router.get('/restaurants', restaurantController.getAllRestaurants);
router.post('/restaurants', authenticateToken, authorizeRole('restaurant_admin'), restaurantController.createRestaurant);
router.get('/restaurants/profile', authenticateToken, authorizeRole('restaurant_admin'), restaurantController.getRestaurantProfile);
router.put('/restaurants/:id', authenticateToken, authorizeRole('restaurant_admin'), restaurantController.updateRestaurant);

// Restaurant dashboard & delivery partner assignment (restaurant admin)
router.get('/restaurant/dashboard', authenticateToken, authorizeRole('restaurant_admin'), restaurantController.getDashboardStats);
router.get('/delivery/available-partners', authenticateToken, authorizeRole('restaurant_admin'), restaurantController.getAvailableDeliveryPartners);

// Menu routes
router.get('/restaurants/:restaurantId/menu', menuController.getMenuItems);
router.post('/restaurants/:restaurantId/menu', authenticateToken, authorizeRole('restaurant_admin'), menuController.createMenuItem);
router.put('/restaurants/:restaurantId/menu/:menuItemId', authenticateToken, authorizeRole('restaurant_admin'), menuController.updateMenuItem);
router.delete('/restaurants/:restaurantId/menu/:menuItemId', authenticateToken, authorizeRole('restaurant_admin'), menuController.deleteMenuItem);

// Order routes (customer)
router.post('/orders', authenticateToken, authorizeRole('customer'), orderController.createOrder);
router.get('/orders', authenticateToken, authorizeRole('customer'), orderController.getCustomerOrders);
router.get('/orders/:id', authenticateToken, orderController.getOrderDetail);
router.post('/orders/:id/cancel', authenticateToken, authorizeRole('customer'), orderController.cancelOrder);

// Order routes (restaurant admin)
router.get('/restaurant/orders', authenticateToken, authorizeRole('restaurant_admin'), orderController.getRestaurantOrders);
router.put('/orders/:id/accept', authenticateToken, authorizeRole('restaurant_admin'), orderController.acceptOrder);
router.put('/orders/:id/reject', authenticateToken, authorizeRole('restaurant_admin'), orderController.rejectOrder);
router.put('/orders/:id/status', authenticateToken, authorizeRole('restaurant_admin'), orderController.updateOrderStatus);
router.post('/orders/:id/assign', authenticateToken, authorizeRole('restaurant_admin'), orderController.assignDeliveryPartner);

// Delivery routes (delivery partner)
router.get('/deliveries', authenticateToken, authorizeRole('delivery_partner'), deliveryController.getDeliveries);
router.put('/deliveries/:id/accept', authenticateToken, authorizeRole('delivery_partner'), deliveryController.acceptDelivery);
router.put('/deliveries/:id/reject', authenticateToken, authorizeRole('delivery_partner'), deliveryController.rejectDelivery);
router.put('/deliveries/:id/verify-otp', authenticateToken, authorizeRole('delivery_partner'), deliveryController.verifyOtp);
router.put('/deliveries/:id/status', authenticateToken, authorizeRole('delivery_partner'), deliveryController.updateDeliveryStatus);
router.post('/deliveries/:id/location', authenticateToken, authorizeRole('delivery_partner'), deliveryController.updateLocation);
router.get('/deliveries/:id/track', authenticateToken, deliveryController.getTrack);
router.put('/delivery/toggle-online', authenticateToken, deliveryController.toggleOnline);
router.get('/delivery/earnings', authenticateToken, authorizeRole('delivery_partner'), deliveryController.getEarnings);

module.exports = router;