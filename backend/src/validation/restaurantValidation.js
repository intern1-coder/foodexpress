/**
 * Restaurant Validation Schemas
 */

/**
 * Validate restaurant creation/update
 */
const validateRestaurant = (data, isUpdate = false) => {
  const errors = [];

  // Name (required for create)
  if (!isUpdate || data.name !== undefined) {
    if (!data.name || data.name.trim().length === 0) {
      errors.push({ field: 'name', message: 'Restaurant name is required' });
    } else if (data.name.trim().length < 2 || data.name.trim().length > 255) {
      errors.push({ field: 'name', message: 'Name must be 2-255 characters' });
    }
  }

  // Cuisine type (required for create)
  if (!isUpdate || data.cuisineType !== undefined) {
    if (!data.cuisineType || data.cuisineType.trim().length === 0) {
      errors.push({ field: 'cuisineType', message: 'Cuisine type is required' });
    }
  }

  // Address (required for create)
  if (!isUpdate || data.address !== undefined) {
    if (!data.address || data.address.trim().length === 0) {
      errors.push({ field: 'address', message: 'Address is required' });
    }
  }

  // City (required for create)
  if (!isUpdate || data.city !== undefined) {
    if (!data.city || data.city.trim().length === 0) {
      errors.push({ field: 'city', message: 'City is required' });
    }
  }

  // State (required for create)
  if (!isUpdate || data.state !== undefined) {
    if (!data.state || data.state.trim().length === 0) {
      errors.push({ field: 'state', message: 'State is required' });
    }
  }

  // Phone (required for create)
  if (!isUpdate || data.phone !== undefined) {
    if (!data.phone || data.phone.trim().length === 0) {
      errors.push({ field: 'phone', message: 'Phone number is required' });
    } else if (!/^\+?[\d\s-]{10,15}$/.test(data.phone)) {
      errors.push({ field: 'phone', message: 'Invalid phone number format' });
    }
  }

  // Email (optional)
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push({ field: 'email', message: 'Invalid email format' });
  }

  // Opening time (required for create)
  if (!isUpdate || data.openingTime !== undefined) {
    if (!data.openingTime) {
      errors.push({ field: 'openingTime', message: 'Opening time is required' });
    }
  }

  // Closing time (required for create)
  if (!isUpdate || data.closingTime !== undefined) {
    if (!data.closingTime) {
      errors.push({ field: 'closingTime', message: 'Closing time is required' });
    }
  }

  // Delivery fee
  if (data.deliveryFee !== undefined && (isNaN(data.deliveryFee) || data.deliveryFee < 0)) {
    errors.push({ field: 'deliveryFee', message: 'Delivery fee must be a positive number' });
  }

  // Minimum order
  if (data.minimumOrder !== undefined && (isNaN(data.minimumOrder) || data.minimumOrder < 0)) {
    errors.push({ field: 'minimumOrder', message: 'Minimum order must be a positive number' });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

module.exports = {
  validateRestaurant
};
