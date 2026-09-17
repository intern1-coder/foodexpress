/**
 * Order Service
 *
 * Handles all order business logic with status management
 */

const { query, getClient } = require('../config/database');

// Valid order status transitions
const STATUS_TRANSITIONS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['out_for_delivery'],
  out_for_delivery: ['delivered'],
  delivered: [],
  cancelled: []
};

// Valid delivery status transitions
const DELIVERY_STATUS_TRANSITIONS = {
  Assigned: ['Accepted'],
  Accepted: ['Picked Up'],
  'Picked Up': ['On The Way'],
  'On The Way': ['Delivered'],
  Delivered: []
};

/**
 * Generate unique order number
 */
const generateOrderNumber = async () => {
  const result = await query(
    `SELECT COUNT(*) FROM orders WHERE created_at >= CURRENT_DATE`
  );
  const count = parseInt(result.rows[0].count) + 1;
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `FE-${date}-${String(count).padStart(4, '0')}`;
};

/**
 * Create new order
 */
const createOrder = async (orderData, userId) => {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    // Verify restaurant exists and is available
    const restaurant = await client.query(
      `SELECT restaurant_id, name, delivery_fee, minimum_order, is_active, is_available
       FROM restaurants
       WHERE restaurant_id = $1`,
      [orderData.restaurantId]
    );

    if (restaurant.rows.length === 0) {
      throw new Error('Restaurant not found');
    }

    const rest = restaurant.rows[0];
    if (!rest.is_active || !rest.is_available) {
      throw new Error('Restaurant is not available');
    }

    // Verify all food items exist and belong to the restaurant
    let subtotal = 0;
    const orderItems = [];

    for (const item of orderData.items) {
      const foodItem = await client.query(
        `SELECT item_id, name, price, is_available
         FROM food_items
         WHERE item_id = $1 AND restaurant_id = $2`,
        [item.itemId, orderData.restaurantId]
      );

      if (foodItem.rows.length === 0) {
        throw new Error(`Food item ${item.itemId} not found in this restaurant`);
      }

      if (!foodItem.rows[0].is_available) {
        throw new Error(`Food item "${foodItem.rows[0].name}" is not available`);
      }

      const quantity = item.quantity || 1;
      const unitPrice = parseFloat(foodItem.rows[0].price);
      const itemTotal = unitPrice * quantity;
      subtotal += itemTotal;

      orderItems.push({
        itemId: item.itemId,
        quantity,
        unitPrice,
        totalPrice: itemTotal,
        specialInstructions: item.specialInstructions || null
      });
    }

    // Check minimum order
    if (subtotal < parseFloat(rest.minimum_order)) {
      throw new Error(`Minimum order amount is $${rest.minimum_order}`);
    }

    // Calculate totals
    const deliveryFee = parseFloat(rest.delivery_fee);
    const taxRate = 0.08; // 8% tax
    const tax = parseFloat((subtotal * taxRate).toFixed(2));
    const total = parseFloat((subtotal + deliveryFee + tax).toFixed(2));

    // Generate order number
    const orderNumber = await generateOrderNumber();

    // Calculate estimated delivery time
    const estimatedDeliveryTime = new Date();
    estimatedDeliveryTime.setMinutes(estimatedDeliveryTime.getMinutes() + (rest.estimated_delivery_time || 30));

    // Create order
    const orderResult = await client.query(
      `INSERT INTO orders (
        user_id, restaurant_id, order_number, status,
        subtotal, delivery_fee, tax, total,
        delivery_address, delivery_notes, special_instructions,
        estimated_delivery_time, payment_method
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        userId,
        orderData.restaurantId,
        orderNumber,
        'pending',
        subtotal,
        deliveryFee,
        tax,
        total,
        orderData.deliveryAddress,
        orderData.deliveryNotes || null,
        orderData.specialInstructions || null,
        estimatedDeliveryTime,
        orderData.paymentMethod || 'cash_on_delivery'
      ]
    );

    const order = orderResult.rows[0];

    // Create order items
    for (const item of orderItems) {
      await client.query(
        `INSERT INTO order_items (
          order_id, item_id, quantity, unit_price, total_price, special_instructions
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          order.order_id,
          item.itemId,
          item.quantity,
          item.unitPrice,
          item.totalPrice,
          item.specialInstructions
        ]
      );
    }

    await client.query('COMMIT');

    // Fetch complete order
    const completeOrder = await getOrderById(order.order_id, userId);

    return {
      success: true,
      message: 'Order placed successfully',
      data: completeOrder.data
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Get order by ID
 */
const getOrderById = async (orderId, userId = null) => {
  let queryText = `
    SELECT o.*,
           r.name as restaurant_name, r.phone as restaurant_phone,
           r.address as restaurant_address,
           u.first_name, u.last_name, u.email, u.phone as user_phone
    FROM orders o
    JOIN restaurants r ON o.restaurant_id = r.restaurant_id
    JOIN users u ON o.user_id = u.user_id
    WHERE o.order_id = $1
  `;
  const values = [orderId];

  // If userId provided, ensure user owns the order (unless admin)
  if (userId) {
    queryText += ` AND o.user_id = $2`;
    values.push(userId);
  }

  const result = await query(queryText, values);

  if (result.rows.length === 0) {
    throw new Error('Order not found');
  }

  // Get order items
  const itemsResult = await query(
    `SELECT oi.*, fi.name as item_name, fi.category
     FROM order_items oi
     JOIN food_items fi ON oi.item_id = fi.item_id
     WHERE oi.order_id = $1`,
    [orderId]
  );

  return {
    success: true,
    data: formatOrder(result.rows[0], itemsResult.rows)
  };
};

/**
 * Get user orders with pagination
 */
const getUserOrders = async (userId, filters = {}) => {
  const { page = 1, limit = 10, status = '' } = filters;
  const offset = (page - 1) * limit;
  const values = [userId];
  let paramIndex = 2;

  let queryText = `
    SELECT o.*, r.name as restaurant_name
    FROM orders o
    JOIN restaurants r ON o.restaurant_id = r.restaurant_id
    WHERE o.user_id = $1
  `;

  if (status) {
    queryText += ` AND o.status = $${paramIndex}`;
    values.push(status);
    paramIndex++;
  }

  // Get total count
  const countQuery = queryText.replace(/SELECT.*FROM/, 'SELECT COUNT(*) FROM');
  const countResult = await query(countQuery, values);
  const totalCount = parseInt(countResult.rows[0].count);

  queryText += ` ORDER BY o.created_at DESC`;
  queryText += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  values.push(limit, offset);

  const result = await query(queryText, values);

  // Get items for each order
  const orders = [];
  for (const order of result.rows) {
    const itemsResult = await query(
      `SELECT oi.*, fi.name as item_name
       FROM order_items oi
       JOIN food_items fi ON oi.item_id = fi.item_id
       WHERE oi.order_id = $1`,
      [order.order_id]
    );
    orders.push(formatOrder(order, itemsResult.rows));
  }

  return {
    success: true,
    data: {
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    }
  };
};

/**
 * Get all orders (admin/restaurant view)
 */
const getAllOrders = async (filters = {}) => {
  const {
    page = 1,
    limit = 10,
    status = '',
    restaurantId = '',
    search = '',
    startDate = '',
    endDate = ''
  } = filters;

  const offset = (page - 1) * limit;
  const values = [];
  let paramIndex = 1;

  let queryText = `
    SELECT o.*, r.name as restaurant_name,
           u.first_name, u.last_name, u.email
    FROM orders o
    JOIN restaurants r ON o.restaurant_id = r.restaurant_id
    JOIN users u ON o.user_id = u.user_id
    WHERE 1=1
  `;

  if (search) {
    queryText += ` AND (o.order_number ILIKE $${paramIndex} OR u.first_name ILIKE $${paramIndex} OR u.last_name ILIKE $${paramIndex})`;
    values.push(`%${search}%`);
    paramIndex++;
  }

  if (status) {
    queryText += ` AND o.status = $${paramIndex}`;
    values.push(status);
    paramIndex++;
  }

  if (restaurantId) {
    queryText += ` AND o.restaurant_id = $${paramIndex}`;
    values.push(restaurantId);
    paramIndex++;
  }

  if (startDate) {
    queryText += ` AND o.created_at >= $${paramIndex}`;
    values.push(startDate);
    paramIndex++;
  }

  if (endDate) {
    queryText += ` AND o.created_at <= $${paramIndex}`;
    values.push(endDate);
    paramIndex++;
  }

  // Get total count
  const countQuery = queryText.replace(/SELECT.*FROM/, 'SELECT COUNT(*) FROM');
  const countResult = await query(countQuery, values);
  const totalCount = parseInt(countResult.rows[0].count);

  queryText += ` ORDER BY o.created_at DESC`;
  queryText += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  values.push(limit, offset);

  const result = await query(queryText, values);

  return {
    success: true,
    data: {
      orders: result.rows.map(order => formatOrder(order)),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    }
  };
};

/**
 * Update order status
 */
const updateOrderStatus = async (orderId, newStatus, userId = null, userRole = 'customer') => {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    // Get current order
    let orderQuery = 'SELECT * FROM orders WHERE order_id = $1';
    const orderValues = [orderId];

    const orderResult = await client.query(orderQuery, orderValues);

    if (orderResult.rows.length === 0) {
      throw new Error('Order not found');
    }

    const order = orderResult.rows[0];

    // Check if user can update this order
    if (userRole === 'customer' && order.user_id !== userId) {
      throw new Error('You can only update your own orders');
    }

    // Validate status transition
    const currentStatus = order.status;
    const allowedTransitions = STATUS_TRANSITIONS[currentStatus] || [];

    if (!allowedTransitions.includes(newStatus)) {
      throw new Error(`Cannot change status from "${currentStatus}" to "${newStatus}"`);
    }

    // Update status
    const updateFields = { status: newStatus };

    // Set actual delivery time if delivered
    if (newStatus === 'delivered') {
      updateFields.actual_delivery_time = new Date();
      updateFields.payment_status = 'paid';
    }

    // Set payment status
    if (newStatus === 'cancelled') {
      updateFields.payment_status = 'refunded';
    }

    let updateQuery = 'UPDATE orders SET status = $1';
    const updateValues = [newStatus];
    let updateParamIndex = 2;

    if (updateFields.actual_delivery_time) {
      updateQuery += `, actual_delivery_time = $${updateParamIndex}`;
      updateValues.push(updateFields.actual_delivery_time);
      updateParamIndex++;
    }

    if (updateFields.payment_status) {
      updateQuery += `, payment_status = $${updateParamIndex}`;
      updateValues.push(updateFields.payment_status);
      updateParamIndex++;
    }

    updateQuery += ` WHERE order_id = $${updateParamIndex}`;
    updateValues.push(orderId);

    await client.query(updateQuery, updateValues);

    await client.query('COMMIT');

    // Return updated order
    return await getOrderById(orderId);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Cancel order
 */
const cancelOrder = async (orderId, userId, userRole = 'customer') => {
  return await updateOrderStatus(orderId, 'cancelled', userId, userRole);
};

/**
 * Get order statistics (admin)
 */
const getOrderStats = async (restaurantId = null) => {
  let queryText = `
    SELECT
      COUNT(*) as total_orders,
      COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
      COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_orders,
      COUNT(CASE WHEN status = 'preparing' THEN 1 END) as preparing_orders,
      COUNT(CASE WHEN status = 'out_for_delivery' THEN 1 END) as out_for_delivery_orders,
      COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_orders,
      COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders,
      COALESCE(SUM(CASE WHEN status != 'cancelled' THEN total ELSE 0 END), 0) as total_revenue,
      COALESCE(AVG(CASE WHEN status != 'cancelled' THEN total END), 0) as average_order_value
    FROM orders
    WHERE 1=1
  `;
  const values = [];
  let paramIndex = 1;

  if (restaurantId) {
    queryText += ` AND restaurant_id = $${paramIndex}`;
    values.push(restaurantId);
    paramIndex++;
  }

  const result = await query(queryText, values);

  return {
    success: true,
    data: {
      stats: {
        totalOrders: parseInt(result.rows[0].total_orders),
        pendingOrders: parseInt(result.rows[0].pending_orders),
        confirmedOrders: parseInt(result.rows[0].confirmed_orders),
        preparingOrders: parseInt(result.rows[0].preparing_orders),
        outForDeliveryOrders: parseInt(result.rows[0].out_for_delivery_orders),
        deliveredOrders: parseInt(result.rows[0].delivered_orders),
        cancelledOrders: parseInt(result.rows[0].cancelled_orders),
        totalRevenue: parseFloat(result.rows[0].total_revenue),
        averageOrderValue: parseFloat(result.rows[0].average_order_value).toFixed(2)
      }
    }
  };
};

/**
 * Get orders assigned to a delivery partner
 */
const getDeliveryPartnerOrders = async (deliveryPartnerId) => {
  const result = await query(
    `SELECT o.*,
            r.name as restaurant_name, r.phone as restaurant_phone,
            r.address as restaurant_address,
            u.first_name, u.last_name, u.email, u.phone as user_phone,
            o.delivery_partner_id, o.delivery_status
     FROM orders o
     JOIN restaurants r ON o.restaurant_id = r.restaurant_id
     JOIN users u ON o.user_id = u.user_id
     WHERE o.delivery_partner_id = $1
     ORDER BY o.created_at DESC`,
    [deliveryPartnerId]
  );

  // Get order items for each order
  const orders = [];
  for (const order of result.rows) {
    const itemsResult = await query(
      `SELECT oi.*, fi.name as item_name
       FROM order_items oi
       JOIN food_items fi ON oi.item_id = fi.item_id
       WHERE oi.order_id = $1`,
      [order.order_id]
    );
    orders.push(formatOrderWithDelivery(order, itemsResult.rows));
  }

  return {
    success: true,
    data: orders
  };
};

/**
 * Get order by ID for delivery partner (checks assignment)
 */
const getOrderByIdForDeliveryPartner = async (orderId, deliveryPartnerId) => {
  const result = await query(
    `SELECT o.*,
            r.name as restaurant_name, r.phone as restaurant_phone,
            r.address as restaurant_address,
            u.first_name, u.last_name, u.email, u.phone as user_phone,
            o.delivery_partner_id, o.delivery_status
     FROM orders o
     JOIN restaurants r ON o.restaurant_id = r.restaurant_id
     JOIN users u ON o.user_id = u.user_id
     WHERE o.order_id = $1 AND o.delivery_partner_id = $2`,
    [orderId, deliveryPartnerId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  // Get order items
  const itemsResult = await query(
    `SELECT oi.*, fi.name as item_name
     FROM order_items oi
     JOIN food_items fi ON oi.item_id = fi.item_id
     WHERE oi.order_id = $1`,
    [orderId]
  );

  return formatOrderWithDelivery(result.rows[0], itemsResult.rows);
};

/**
 * Accept order (delivery partner)
 */
const acceptOrder = async (orderId, deliveryPartnerId) => {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    // Get current order
    const orderResult = await client.query(
      `SELECT order_id, delivery_partner_id, delivery_status
       FROM orders
       WHERE order_id = $1`,
      [orderId]
    );

    if (orderResult.rows.length === 0) {
      throw new Error('Order not found');
    }

    const order = orderResult.rows[0];

    // Check if order is assigned to this delivery partner
    if (order.delivery_partner_id !== deliveryPartnerId) {
      throw new Error('Order not assigned to you');
    }

    // Validate delivery status transition
    const currentStatus = order.delivery_status;
    const allowedTransitions = DELIVERY_STATUS_TRANSITIONS[currentStatus] || [];

    if (!allowedTransitions.includes('Accepted')) {
      throw new Error(`Invalid status transition from ${currentStatus} to Accepted`);
    }

    // Update delivery status
    const result = await client.query(
      `UPDATE orders
       SET delivery_status = 'Accepted', updated_at = CURRENT_TIMESTAMP
       WHERE order_id = $1
       RETURNING order_id, delivery_partner_id, delivery_status, updated_at`,
      [orderId]
    );

    await client.query('COMMIT');

    return {
      success: true,
      data: {
        orderId: result.rows[0].order_id,
        deliveryPartnerId: result.rows[0].delivery_partner_id,
        deliveryStatus: result.rows[0].delivery_status,
        updatedAt: result.rows[0].updated_at
      }
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Pick up order (delivery partner)
 */
const pickUpOrder = async (orderId, deliveryPartnerId) => {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    // Get current order
    const orderResult = await client.query(
      `SELECT order_id, delivery_partner_id, delivery_status
       FROM orders
       WHERE order_id = $1`,
      [orderId]
    );

    if (orderResult.rows.length === 0) {
      throw new Error('Order not found');
    }

    const order = orderResult.rows[0];

    // Check if order is assigned to this delivery partner
    if (order.delivery_partner_id !== deliveryPartnerId) {
      throw new Error('Order not assigned to you');
    }

    // Validate delivery status transition
    const currentStatus = order.delivery_status;
    const allowedTransitions = DELIVERY_STATUS_TRANSITIONS[currentStatus] || [];

    if (!allowedTransitions.includes('Picked Up')) {
      throw new Error(`Invalid status transition from ${currentStatus} to Picked Up`);
    }

    // Update delivery status
    const result = await client.query(
      `UPDATE orders
       SET delivery_status = 'Picked Up', updated_at = CURRENT_TIMESTAMP
       WHERE order_id = $1
       RETURNING order_id, delivery_partner_id, delivery_status, updated_at`,
      [orderId]
    );

    await client.query('COMMIT');

    return {
      success: true,
      data: {
        orderId: result.rows[0].order_id,
        deliveryPartnerId: result.rows[0].delivery_partner_id,
        deliveryStatus: result.rows[0].delivery_status,
        updatedAt: result.rows[0].updated_at
      }
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Mark order as on the way (delivery partner)
 */
const onTheWayOrder = async (orderId, deliveryPartnerId) => {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    // Get current order
    const orderResult = await client.query(
      `SELECT order_id, delivery_partner_id, delivery_status
       FROM orders
       WHERE order_id = $1`,
      [orderId]
    );

    if (orderResult.rows.length === 0) {
      throw new Error('Order not found');
    }

    const order = orderResult.rows[0];

    // Check if order is assigned to this delivery partner
    if (order.delivery_partner_id !== deliveryPartnerId) {
      throw new Error('Order not assigned to you');
    }

    // Validate delivery status transition
    const currentStatus = order.delivery_status;
    const allowedTransitions = DELIVERY_STATUS_TRANSITIONS[currentStatus] || [];

    if (!allowedTransitions.includes('On The Way')) {
      throw new Error(`Invalid status transition from ${currentStatus} to On The Way`);
    }

    // Update delivery status
    const result = await client.query(
      `UPDATE orders
       SET delivery_status = 'On The Way', updated_at = CURRENT_TIMESTAMP
       WHERE order_id = $1
       RETURNING order_id, delivery_partner_id, delivery_status, updated_at`,
      [orderId]
    );

    await client.query('COMMIT');

    return {
      success: true,
      data: {
        orderId: result.rows[0].order_id,
        deliveryPartnerId: result.rows[0].delivery_partner_id,
        deliveryStatus: result.rows[0].delivery_status,
        updatedAt: result.rows[0].updated_at
      }
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Mark order as delivered (delivery partner)
 */
const deliveredOrder = async (orderId, deliveryPartnerId) => {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    // Get current order
    const orderResult = await client.query(
      `SELECT order_id, delivery_partner_id, delivery_status
       FROM orders
       WHERE order_id = $1`,
      [orderId]
    );

    if (orderResult.rows.length === 0) {
      throw new Error('Order not found');
    }

    const order = orderResult.rows[0];

    // Check if order is assigned to this delivery partner
    if (order.delivery_partner_id !== deliveryPartnerId) {
      throw new Error('Order not assigned to you');
    }

    // Validate delivery status transition
    const currentStatus = order.delivery_status;
    const allowedTransitions = DELIVERY_STATUS_TRANSITIONS[currentStatus] || [];

    if (!allowedTransitions.includes('Delivered')) {
      throw new Error(`Invalid status transition from ${currentStatus} to Delivered`);
    }

    // Update delivery status and actual delivery time
    const result = await client.query(
      `UPDATE orders
       SET delivery_status = 'Delivered',
           actual_delivery_time = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE order_id = $1
       RETURNING order_id, delivery_partner_id, delivery_status, actual_delivery_time, updated_at`,
      [orderId]
    );

    await client.query('COMMIT');

    return {
      success: true,
      data: {
        orderId: result.rows[0].order_id,
        deliveryPartnerId: result.rows[0].delivery_partner_id,
        deliveryStatus: result.rows[0].delivery_status,
        actualDeliveryTime: result.rows[0].actual_delivery_time,
        updatedAt: result.rows[0].updated_at
      }
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Helper: Format order object
const formatOrder = (o, items = []) => ({
  orderId: o.order_id,
  orderNumber: o.order_number,
  userId: o.user_id,
  restaurantId: o.restaurant_id,
  restaurantName: o.restaurant_name,
  firstName: o.first_name,
  lastName: o.last_name,
  email: o.email,
  phone: o.user_phone || o.phone,
  status: o.status,
  subtotal: parseFloat(o.subtotal),
  deliveryFee: parseFloat(o.delivery_fee),
  tax: parseFloat(o.tax),
  total: parseFloat(o.total),
  deliveryAddress: o.delivery_address,
  deliveryNotes: o.delivery_notes,
  specialInstructions: o.special_instructions,
  estimatedDeliveryTime: o.estimated_delivery_time,
  actualDeliveryTime: o.actual_delivery_time,
  paymentMethod: o.payment_method,
  paymentStatus: o.payment_status,
  itemCount: items.length,
  items: items.map(item => ({
    orderItemId: item.order_item_id,
    itemId: item.item_id,
    itemName: item.item_name,
    quantity: item.quantity,
    unitPrice: parseFloat(item.unit_price),
    totalPrice: parseFloat(item.total_price),
    specialInstructions: item.special_instructions
  })),
  createdAt: o.created_at,
  updatedAt: o.updated_at
});

// Helper: Format order object with delivery details
const formatOrderWithDelivery = (o, items = []) => ({
  ...formatOrder(o, items),
  deliveryPartnerId: o.delivery_partner_id,
  deliveryStatus: o.delivery_status
});

module.exports = {
  createOrder,
  getOrderById,
  getUserOrders,
  getAllOrders,
  updateOrderStatus,
  cancelOrder,
  getOrderStats,
  getDeliveryPartnerOrders,
  getOrderByIdForDeliveryPartner,
  acceptOrder,
  pickUpOrder,
  onTheWayOrder,
  deliveredOrder
};