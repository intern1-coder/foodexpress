const Delivery = require('../models/Delivery');
const Order = require('../models/Order');
const User = require('../models/User');
const DeliveryLocation = require('../models/DeliveryLocation');

const EARNINGS_RATE = 0.2; // 20% of order total

// Get delivery partner's deliveries (with order items)
const getDeliveries = async (req, res) => {
  try {
    const deliveryPartnerId = req.user.id;
    const deliveries = await Delivery.findByDeliveryPartnerId(deliveryPartnerId);

    // Attach items to each delivery
    for (const delivery of deliveries) {
      delivery.items = await Order.getOrderItems(delivery.order_id);
    }

    res.json({ deliveries });
  } catch (error) {
    console.error('Get deliveries error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Accept assigned delivery (delivery partner)
const acceptDelivery = async (req, res) => {
  try {
    const deliveryId = parseInt(req.params.id);
    const delivery = await Delivery.findById(deliveryId);
    if (!delivery) {
      return res.status(404).json({ message: 'Delivery not found' });
    }
    if (delivery.delivery_partner_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (delivery.status !== 'assigned') {
      return res.status(400).json({ message: 'Delivery is not in awaiting-acceptance state' });
    }

    const updatedDelivery = await Delivery.update(deliveryId, { status: 'accepted' });
    res.json({ message: 'Delivery accepted', delivery: updatedDelivery });
  } catch (error) {
    console.error('Accept delivery error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Reject assigned delivery (delivery partner)
const rejectDelivery = async (req, res) => {
  try {
    const deliveryId = parseInt(req.params.id);
    const delivery = await Delivery.findById(deliveryId);
    if (!delivery) {
      return res.status(404).json({ message: 'Delivery not found' });
    }
    if (delivery.delivery_partner_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (delivery.status !== 'assigned' && delivery.status !== 'accepted') {
      return res.status(400).json({ message: 'Delivery can no longer be rejected' });
    }

    const updatedDelivery = await Delivery.update(deliveryId, { status: 'rejected' });
    // Free the partner slot on the order so the restaurant can reassign
    await Order.update(delivery.order_id, { delivery_partner_id: null });

    res.json({ message: 'Delivery rejected', delivery: updatedDelivery });
  } catch (error) {
    console.error('Reject delivery error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Verify pickup OTP (delivery partner)
const verifyOtp = async (req, res) => {
  try {
    const deliveryId = parseInt(req.params.id);
    const { otp } = req.body;

    const delivery = await Delivery.findById(deliveryId);
    if (!delivery) {
      return res.status(404).json({ message: 'Delivery not found' });
    }
    if (delivery.delivery_partner_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (!['accepted', 'assigned'].includes(delivery.status)) {
      return res.status(400).json({ message: 'OTP can only be verified before pickup' });
    }

    const order = await Order.findById(delivery.order_id);
    if (!order || order.status !== 'ready_for_pickup') {
      return res.status(400).json({ message: 'Order is not ready for pickup yet' });
    }
    if (!order.delivery_otp) {
      return res.status(400).json({ message: 'No OTP has been generated for this order' });
    }
    if (String(otp).trim() !== order.delivery_otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    const updatedDelivery = await Delivery.update(deliveryId, { status: 'picked_up' });
    await Order.update(order.id, { status: 'picked_up' });

    res.json({ message: 'OTP verified, food picked up!', delivery: updatedDelivery });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update delivery status (delivery partner) - out_for_delivery -> delivered
const updateDeliveryStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const deliveryId = parseInt(req.params.id);

    const delivery = await Delivery.findById(deliveryId);
    if (!delivery) {
      return res.status(404).json({ message: 'Delivery not found' });
    }
    if (delivery.delivery_partner_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this delivery' });
    }

    if (status === 'out_for_delivery') {
      if (delivery.status !== 'picked_up') {
        return res.status(400).json({ message: 'Food must be picked up before heading out' });
      }
      const updatedDelivery = await Delivery.update(deliveryId, { status: 'out_for_delivery' });
      await Order.update(delivery.order_id, { status: 'out_for_delivery' });
      return res.json({ message: 'Delivery out for delivery', delivery: updatedDelivery });
    }

    if (status === 'delivered') {
      if (!['out_for_delivery', 'picked_up'].includes(delivery.status)) {
        return res.status(400).json({ message: 'Delivery must be in transit to be completed' });
      }

      const order = await Order.findById(delivery.order_id);
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      const earnings = Math.round(order.total_amount * EARNINGS_RATE * 100) / 100;

      const updatedDelivery = await Delivery.update(deliveryId, {
        status: 'delivered',
        earnings,
        actual_time: new Date()
      });
      // Mark order delivered; on COD, payment collected now; online already paid
      await Order.update(order.id, {
        status: 'delivered',
        payment_status: order.payment_mode === 'cod' ? 'paid' : order.payment_status
      });

      return res.json({ message: 'Delivery completed', delivery: updatedDelivery });
    }

    return res.status(400).json({ message: 'Invalid delivery status' });
  } catch (error) {
    console.error('Update delivery status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Send live location (delivery partner) - stores to delivery_locations + user profile
const updateLocation = async (req, res) => {
  try {
    const deliveryId = parseInt(req.params.id);
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }

    const delivery = await Delivery.findById(deliveryId);
    if (!delivery) {
      return res.status(404).json({ message: 'Delivery not found' });
    }
    if (delivery.delivery_partner_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (!['picked_up', 'out_for_delivery'].includes(delivery.status)) {
      return res.status(400).json({ message: 'Tracking only available during delivery' });
    }

    const location = await DeliveryLocation.create(deliveryId, latitude, longitude);
    await User.updateLocation(req.user.id, latitude, longitude);

    res.json({ message: 'Location updated', location });
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get tracking info for a delivery (customer, restaurant, or partner)
const getTrack = async (req, res) => {
  try {
    const deliveryId = parseInt(req.params.id);
    const delivery = await Delivery.findById(deliveryId);
    if (!delivery) {
      return res.status(404).json({ message: 'Delivery not found' });
    }

    const order = await Order.findById(delivery.order_id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Authorization
    if (req.user.role === 'customer' && order.customer_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (req.user.role === 'delivery_partner' && delivery.delivery_partner_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (req.user.role === 'restaurant_admin') {
      const Restaurant = require('../models/Restaurant');
      const restaurant = await Restaurant.findByOwnerId(req.user.id);
      if (!restaurant || order.restaurant_id !== restaurant.id) {
        return res.status(403).json({ message: 'Not authorized' });
      }
    }

    const partner = delivery.delivery_partner_id
      ? await User.findById(delivery.delivery_partner_id)
      : null;

    const latestLocation = await DeliveryLocation.getLatest(deliveryId);

    res.json({
      delivery: {
        id: delivery.id,
        status: delivery.status,
        pickup_location: delivery.pickup_location,
        delivery_location: delivery.delivery_location,
        estimated_time: delivery.estimated_time,
        actual_time: delivery.actual_time,
        latest_location: latestLocation,
        partner: partner ? {
          name: partner.name,
          phone: partner.phone,
          vehicle_type: partner.vehicle_type,
          latitude: partner.latitude,
          longitude: partner.longitude
        } : null
      },
      order: {
        id: order.id,
        status: order.status,
        total_amount: order.total_amount,
        payment_mode: order.payment_mode,
        payment_status: order.payment_status,
        delivery_address: order.delivery_address
      }
    });
  } catch (error) {
    console.error('Get track error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Toggle partner online/offline
const toggleOnline = async (req, res) => {
  try {
    const { is_online } = req.body;
    if (req.user.role !== 'delivery_partner') {
      return res.status(403).json({ message: 'Only delivery partners can toggle availability' });
    }
    const user = await User.toggleOnline(req.user.id, !!is_online);
    const { password_hash, ...safeUser } = user;
    res.json({ message: is_online ? 'You are now online' : 'You are now offline', user: safeUser });
  } catch (error) {
    console.error('Toggle online error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get earnings summary (delivery partner)
const getEarnings = async (req, res) => {
  try {
    const deliveries = await Delivery.findByDeliveryPartnerId(req.user.id);
    const completed = deliveries.filter(d => d.status === 'delivered');

    const now = new Date();
    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
    const weekStart = new Date(now); weekStart.setDate(now.getDate() - 7);

    const today = completed.filter(d => new Date(d.actual_time || d.created_at) >= todayStart);
    const week = completed.filter(d => new Date(d.actual_time || d.created_at) >= weekStart);

    res.json({
      summary: {
        today_earnings: Math.round(today.reduce((s, d) => s + Number(d.earnings), 0) * 100) / 100,
        week_earnings: Math.round(week.reduce((s, d) => s + Number(d.earnings), 0) * 100) / 100,
        total_deliveries: completed.length
      },
      deliveries: completed.map(d => ({
        id: d.id,
        order_id: d.order_id,
        status: d.status,
        earnings: d.earnings,
        total_amount: d.total_amount,
        restaurant_name: d.restaurant_name,
        customer_name: d.customer_name,
        payment_mode: d.payment_mode,
        created_at: d.created_at,
        actual_time: d.actual_time
      }))
    });
  } catch (error) {
    console.error('Get earnings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getDeliveries,
  acceptDelivery,
  rejectDelivery,
  verifyOtp,
  updateDeliveryStatus,
  updateLocation,
  getTrack,
  toggleOnline,
  getEarnings
};