/**
 * Food Item Validation Schemas
 */

/**
 * Validate food item creation/update
 */
const validateFoodItem = (data, isUpdate = false) => {
  const errors = [];

  // Restaurant ID (required for create)
  if (!isUpdate || data.restaurantId !== undefined) {
    if (!data.restaurantId) {
      errors.push({ field: 'restaurantId', message: 'Restaurant ID is required' });
    }
  }

  // Name (required for create)
  if (!isUpdate || data.name !== undefined) {
    if (!data.name || data.name.trim().length === 0) {
      errors.push({ field: 'name', message: 'Food item name is required' });
    } else if (data.name.trim().length > 255) {
      errors.push({ field: 'name', message: 'Name must be less than 255 characters' });
    }
  }

  // Price (required for create)
  if (!isUpdate || data.price !== undefined) {
    if (data.price === undefined || data.price === null) {
      errors.push({ field: 'price', message: 'Price is required' });
    } else if (isNaN(data.price) || data.price <= 0) {
      errors.push({ field: 'price', message: 'Price must be greater than 0' });
    }
  }

  // Category (required for create)
  if (!isUpdate || data.category !== undefined) {
    if (!data.category || data.category.trim().length === 0) {
      errors.push({ field: 'category', message: 'Category is required' });
    }
  }

  // Description
  if (data.description && data.description.length > 1000) {
    errors.push({ field: 'description', message: 'Description must be less than 1000 characters' });
  }

  // Preparation time
  if (data.preparationTime !== undefined) {
    if (isNaN(data.preparationTime) || data.preparationTime < 0) {
      errors.push({ field: 'preparationTime', message: 'Preparation time must be a positive number' });
    }
  }

  // Calories
  if (data.calories !== undefined && data.calories !== null) {
    if (isNaN(data.calories) || data.calories < 0) {
      errors.push({ field: 'calories', message: 'Calories must be a positive number' });
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

module.exports = {
  validateFoodItem
};
