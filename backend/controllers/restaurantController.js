const Restaurant = require('../models/Restaurant');
const User = require('../models/User');
const Delivery = require('../models/Delivery');
const Order = require('../models/Order');

// Get restaurant profile (for restaurant admin)
const getRestaurantProfile = async (req, res) => {
  try {
    // Find restaurant owned by the current user
    const restaurant = await Restaurant.findByOwnerId(req.user.id);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    res.json({ restaurant });
  } catch (error) {
    console.error('Get restaurant profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create restaurant (for restaurant admin)
const createRestaurant = async (req, res) => {
  try {
    const { name, description, address, phone, image_url, cuisine, delivery_time } = req.body;
    const owner_id = req.user.id;

    // Check if user already has a restaurant
    const existingRestaurant = await Restaurant.findByOwnerId(owner_id);
    if (existingRestaurant) {
      return res.status(400).json({ message: 'User already has a restaurant' });
    }

    const restaurant = await Restaurant.create({ owner_id, name, description, address, phone, image_url, cuisine, delivery_time });

    res.status(201).json({
      message: 'Restaurant created successfully',
      restaurant
    });
  } catch (error) {
    console.error('Create restaurant error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update restaurant (for restaurant admin)
const updateRestaurant = async (req, res) => {
  try {
    const { name, description, address, phone, image_url, cuisine, delivery_time, is_active } = req.body;
    const restaurantId = req.params.id;

    // Check if restaurant belongs to current user
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    if (restaurant.owner_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this restaurant' });
    }

    const updatedRestaurant = await Restaurant.update(restaurantId, { name, description, address, phone, image_url, cuisine, delivery_time, is_active });

    res.json({
      message: 'Restaurant updated successfully',
      restaurant: updatedRestaurant
    });
  } catch (error) {
    console.error('Update restaurant error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all restaurants (for customers)
const getAllRestaurants = async (req, res) => {
  try {
    const restaurants = await Restaurant.findAll();
    const publicRestaurants = restaurants
      .filter(r => r.is_active !== false)
      .map(r => ({
        id: r.id, name: r.name, description: r.description, address: r.address,
        phone: r.phone, image_url: r.image_url, cuisine: r.cuisine,
        rating: r.rating, delivery_time: r.delivery_time, created_at: r.created_at
      }));
    res.json({ restaurants: publicRestaurants });
  } catch (error) {
    console.error('Get all restaurants error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get available (online) delivery partners for assignment (restaurant admin)
const getAvailableDeliveryPartners = async (req, res) => {
  try {
    const partners = await User.findAvailableDeliveryPartners();
    res.json({ partners });
  } catch (error) {
    console.error('Get available partners error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get dashboard stats for restaurant admin
const getDashboardStats = async (req, res) => {
  try {
    const restaurant = await Restaurant.findByOwnerId(req.user.id);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    const orders = await Order.findByRestaurantId(restaurant.id);
    const deliveries = await Delivery.findActiveForRestaurant(restaurant.id);

    const now = new Date();
    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);

    const todayOrders = orders.filter(o => new Date(o.created_at) >= todayStart);
    const todayRevenue = todayOrders
      .filter(o => o.status !== 'rejected' && o.status !== 'cancelled')
      .reduce((s, o) => s + Number(o.total_amount), 0);

    res.json({
      stats: {
        today_orders: todayOrders.length,
        today_revenue: Math.round(todayRevenue * 100) / 100,
        pending_orders: orders.filter(o => o.status === 'pending').length,
        preparing_orders: orders.filter(o => o.status === 'preparing').length,
        ready_orders: orders.filter(o => o.status === 'ready_for_pickup').length,
        active_deliveries: deliveries.length
      },
      recent_orders: orders.slice(0, 5)
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getRestaurantProfile,
  createRestaurant,
  updateRestaurant,
  getAllRestaurants,
  getAvailableDeliveryPartners,
  getDashboardStats
};