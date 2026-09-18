/**
 * Routes Index
 *
 * Define all API routes here
 */

const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const restaurantRoutes = require('./restaurantRoutes');
const foodRoutes = require('./foodRoutes');
const orderRoutes = require('./orderRoutes');
const deliveryPartnerRoutes = require('./deliveryPartnerRoutes');
const adminDeliveryPartnerRoutes = require('./adminDeliveryPartnerRoutes');

// ============================================
// Mount Routes
// ============================================

// Authentication routes
router.use('/auth', authRoutes);

// User routes
router.use('/users', userRoutes);

// Restaurant routes
router.use('/restaurants', restaurantRoutes);

// Food item routes
router.use('/foods', foodRoutes);

// Order routes
router.use('/orders', orderRoutes);

// Delivery partner routes
router.use('/delivery', deliveryPartnerRoutes);

// Admin delivery partner routes
router.use('/admin', adminDeliveryPartnerRoutes);

module.exports = router;