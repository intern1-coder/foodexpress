/**
 * Order Validation Schemas
 */

/**
 * Validate order creation
 */
const validateOrder = (data) => {
  const errors = [];

  // Restaurant ID
  if (!data.restaurantId) {
    errors.push({ field: 'restaurantId', message: 'Restaurant ID is required' });
  }

  // Items
  if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
    errors.push({ field: 'items', message: 'At least one item is required' });
  } else {
    data.items.forEach((item, index) => {
      if (!item.itemId) {
        errors.push({ field: `items[${index}].itemId`, message: 'Item ID is required' });
      }
      if (item.quantity !== undefined && (isNaN(item.quantity) || item.quantity < 1)) {
        errors.push({ field: `items[${index}].quantity`, message: 'Quantity must be at least 1' });
      }
    });
  }

  // Delivery address
  if (!data.deliveryAddress || data.deliveryAddress.trim().length === 0) {
    errors.push({ field: 'deliveryAddress', message: 'Delivery address is required' });
  }

  // Payment method
  const validPaymentMethods = ['cash_on_delivery', 'credit_card', 'debit_card', 'online_payment'];
  if (data.paymentMethod && !validPaymentMethods.includes(data.paymentMethod)) {
    errors.push({ field: 'paymentMethod', message: 'Invalid payment method' });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate order status update
 */
const validateOrderStatus = (data) => {
  const errors = [];
  const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'];

  if (!data.status) {
    errors.push({ field: 'status', message: 'Status is required' });
  } else if (!validStatuses.includes(data.status)) {
    errors.push({ field: 'status', message: 'Invalid status' });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

module.exports = {
  validateOrder,
  validateOrderStatus
};
