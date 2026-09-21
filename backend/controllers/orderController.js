const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const MenuItem = require('../models/MenuItem');
const Delivery = require('../models/Delivery');
const User = require('../models/User');

const DELIVERY_FEE = 2.0;

const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

// Create a new order (for customers)
const createOrder = async (req, res) => {
  try {
    const { restaurant_id, items, delivery_address, payment_mode } = req.body;
    const customer_id = req.user.id;

    if (!items || !items.length) {
      return res.status(400).json({ message: 'Order must contain at least one item' });
    }
    if (!['cod', 'online'].includes(payment_mode)) {
      return res.status(400).json({ message: 'Payment mode must be cod or online' });
    }
    if (!delivery_address) {
      return res.status(400).json({ message: 'Delivery address is required' });
    }

    // Verify restaurant exists
    const restaurant = await Restaurant.findById(restaurant_id);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    // Calculate total amount and validate menu items
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const menuItem = await MenuItem.findById(item.menu_item_id);
      if (!menuItem) {
        return res.status(404).json({ message: `Menu item ${item.menu_item_id} not found` });
      }

      if (menuItem.restaurant_id !== parseInt(restaurant_id)) {
        return res.status(400).json({ message: `Menu item ${item.menu_item_id} does not belong to this restaurant` });
      }

      if (!menuItem.is_available) {
        return res.status(400).json({ message: `Menu item ${menuItem.name} is not available` });
      }

      const itemTotal = Number(menuItem.price) * item.quantity;
      subtotal += itemTotal;
      orderItems.push({
        menu_item_id: item.menu_item_id,
        name: menuItem.name,
        quantity: item.quantity,
        unit_price: Number(menuItem.price)
      });
    }

    const totalAmount = Math.round((subtotal + DELIVERY_FEE) * 100) / 100;

    // Create order
    const order = await Order.create({
      customer_id,
      restaurant_id,
      status: 'pending',
      total_amount: totalAmount,
      delivery_address,
      payment_mode,
      payment_status: payment_mode === 'online' ? 'paid' : 'pending'
    });

    // Save order items
    await Order.createOrderItems(order.id, orderItems);

    const detail = await Order.findDetail(order.id);

    res.status(201).json({
      message: 'Order created successfully',
      order: detail,
      delivery_fee: DELIVERY_FEE
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get customer's orders
const getCustomerOrders = async (req, res) => {
  try {
    const customerId = req.user.id;
    const orders = await Order.findByCustomerId(customerId);
    res.json({ orders });
  } catch (error) {
    console.error('Get customer orders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get order detail (used for tracking by customer/restaurant/partner)
const getOrderDetail = async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    const order = await Order.findDetail(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Authorization
    if (req.user.role === 'customer' && order.customer_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to view this order' });
    }
    if (req.user.role === 'restaurant_admin') {
      const restaurant = await Restaurant.findByOwnerId(req.user.id);
      if (!restaurant || order.restaurant_id !== restaurant.id) {
        return res.status(403).json({ message: 'Not authorized to view this order' });
      }
    }
    if (req.user.role === 'delivery_partner' && order.delivery_partner_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to view this order' });
    }

    res.json({ order });
  } catch (error) {
    console.error('Get order detail error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get restaurant's orders (for restaurant admin)
const getRestaurantOrders = async (req, res) => {
  try {
    // Verify user owns a restaurant
    const restaurant = await Restaurant.findByOwnerId(req.user.id);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    const orders = await Order.findByRestaurantId(restaurant.id);
    res.json({ orders, restaurant });
  } catch (error) {
    console.error('Get restaurant orders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Accept order (restaurant admin) - pending -> accepted
const acceptOrder = async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    if (order.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending orders can be accepted' });
    }

    // Verify ownership
    const restaurant = await Restaurant.findByOwnerId(req.user.id);
    if (!restaurant || order.restaurant_id !== restaurant.id) {
      return res.status(403).json({ message: 'Not authorized to accept this order' });
    }

    const updatedOrder = await Order.update(orderId, { status: 'accepted' });
    res.json({ message: 'Order accepted', order: updatedOrder });
  } catch (error) {
    console.error('Accept order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Reject order (restaurant admin) - pending -> rejected
const rejectOrder = async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    const { reason } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    if (order.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending orders can be rejected' });
    }

    const restaurant = await Restaurant.findByOwnerId(req.user.id);
    if (!restaurant || order.restaurant_id !== restaurant.id) {
      return res.status(403).json({ message: 'Not authorized to reject this order' });
    }

    const updatedOrder = await Order.update(orderId, {
      status: 'rejected',
      rejection_reason: reason || 'Restaurant rejected the order'
    });
    res.json({ message: 'Order rejected', order: updatedOrder });
  } catch (error) {
    console.error('Reject order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Cancel order (customer) - pending or accepted -> cancelled
const cancelOrder = async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    if (order.customer_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to cancel this order' });
    }
    if (!['pending', 'accepted'].includes(order.status)) {
      return res.status(400).json({ message: 'Order can only be cancelled before it is being prepared' });
    }

    const updatedOrder = await Order.update(orderId, { status: 'cancelled' });
    res.json({ message: 'Order cancelled', order: updatedOrder });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update order status (restaurant admin) - accepted -> preparing -> ready_for_pickup
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const orderId = parseInt(req.params.id);

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Only restaurant admin of this restaurant can move order through kitchen statuses
    const restaurant = await Restaurant.findByOwnerId(req.user.id);
    if (!restaurant || order.restaurant_id !== restaurant.id) {
      return res.status(403).json({ message: 'Not authorized to update this order' });
    }

    if (!['preparing', 'ready_for_pickup'].includes(status)) {
      return res.status(400).json({ message: 'Invalid kitchen status' });
    }

    // Validate transition order
    if (status === 'preparing' && order.status !== 'accepted') {
      return res.status(400).json({ message: 'Order must be accepted before preparing' });
    }
    if (status === 'ready_for_pickup' && order.status !== 'preparing') {
      return res.status(400).json({ message: 'Order must be preparing before ready for pickup' });
    }

    const updateData = { status };

    // Generate OTP when food is ready for pickup
    if (status === 'ready_for_pickup') {
      const otp = generateOtp();
      updateData.delivery_otp = otp;

      // Copy OTP to any existing delivery record
      const delivery = await Delivery.findByOrderId(orderId);
      if (delivery) {
        await Delivery.update(delivery.id, { otp });
      }
    }

    const updatedOrder = await Order.update(orderId, updateData);

    res.json({
      message: 'Order status updated successfully',
      order: updatedOrder,
      delivery_otp: updatedOrder.delivery_otp
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Assign delivery partner to order (restaurant admin)
const assignDeliveryPartner = async (req, res) => {
  try {
    const { delivery_partner_id } = req.body;
    const orderId = parseInt(req.params.id);

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Verify user owns the restaurant for this order
    const restaurant = await Restaurant.findByOwnerId(req.user.id);
    if (!restaurant || order.restaurant_id !== restaurant.id) {
      return res.status(403).json({ message: 'Not authorized to assign delivery partner to this order' });
    }

    if (!['accepted', 'preparing', 'ready_for_pickup'].includes(order.status)) {
      return res.status(400).json({ message: 'Order must be accepted before assigning a delivery partner' });
    }

    // Verify delivery partner exists and has correct role
    const deliveryPartner = await User.findById(delivery_partner_id);
    if (!deliveryPartner || deliveryPartner.role !== 'delivery_partner') {
      return res.status(400).json({ message: 'Invalid delivery partner' });
    }

    // Attach partner to order
    const updatedOrder = await Order.update(orderId, { delivery_partner_id });

    // Create or update delivery record
    let delivery = await Delivery.findByOrderId(orderId);
    if (delivery) {
      // Reassign if partner changes
      delivery = await Delivery.update(delivery.id, {
        delivery_partner_id,
        status: 'assigned',
        pickup_location: restaurant.address || restaurant.name,
        delivery_location: order.delivery_address,
        otp: order.delivery_otp,
        estimated_time: new Date(Date.now() + 30 * 60000)
      });
    } else {
      delivery = await Delivery.create({
        order_id: orderId,
        delivery_partner_id,
        status: 'assigned',
        pickup_location: restaurant.address || restaurant.name,
        delivery_location: order.delivery_address,
        otp: order.delivery_otp,
        estimated_time: new Date(Date.now() + 30 * 60000)
      });
    }

    res.json({
      message: 'Delivery partner assigned successfully',
      order: updatedOrder,
      delivery
    });
  } catch (error) {
    console.error('Assign delivery partner error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createOrder,
  getCustomerOrders,
  getOrderDetail,
  getRestaurantOrders,
  acceptOrder,
  rejectOrder,
  cancelOrder,
  updateOrderStatus,
  assignDeliveryPartner
};