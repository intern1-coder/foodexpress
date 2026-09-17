/**
 * Validation Schemas
 * 
 * Input validation for authentication endpoints
 */

/**
 * Validate email format
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 */
const isValidPassword = (password) => {
  // At least 8 chars, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

/**
 * Validate phone number
 */
const isValidPhone = (phone) => {
  const phoneRegex = /^\+?[\d\s-]{10,15}$/;
  return phoneRegex.test(phone);
};

/**
 * Validate registration input
 */
const validateRegister = (data) => {
  const errors = [];

  // First name
  if (!data.firstName || data.firstName.trim().length === 0) {
    errors.push({ field: 'firstName', message: 'First name is required' });
  } else if (data.firstName.trim().length < 2 || data.firstName.trim().length > 100) {
    errors.push({ field: 'firstName', message: 'First name must be 2-100 characters' });
  }

  // Last name
  if (!data.lastName || data.lastName.trim().length === 0) {
    errors.push({ field: 'lastName', message: 'Last name is required' });
  } else if (data.lastName.trim().length < 2 || data.lastName.trim().length > 100) {
    errors.push({ field: 'lastName', message: 'Last name must be 2-100 characters' });
  }

  // Email
  if (!data.email || data.email.trim().length === 0) {
    errors.push({ field: 'email', message: 'Email is required' });
  } else if (!isValidEmail(data.email)) {
    errors.push({ field: 'email', message: 'Invalid email format' });
  }

  // Password
  if (!data.password) {
    errors.push({ field: 'password', message: 'Password is required' });
  } else if (!isValidPassword(data.password)) {
    errors.push({
      field: 'password',
      message: 'Password must be at least 8 characters with uppercase, lowercase, and number'
    });
  }

  // Phone (optional)
  if (data.phone && !isValidPhone(data.phone)) {
    errors.push({ field: 'phone', message: 'Invalid phone number format' });
  }

  // Role (optional, defaults to customer)
  if (data.role && !['customer', 'admin', 'delivery_partner'].includes(data.role)) {
    errors.push({ field: 'role', message: 'Invalid role' });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate login input
 */
const validateLogin = (data) => {
  const errors = [];

  // Email
  if (!data.email || data.email.trim().length === 0) {
    errors.push({ field: 'email', message: 'Email is required' });
  } else if (!isValidEmail(data.email)) {
    errors.push({ field: 'email', message: 'Invalid email format' });
  }

  // Password
  if (!data.password || data.password.length === 0) {
    errors.push({ field: 'password', message: 'Password is required' });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate profile update input
 */
const validateProfileUpdate = (data) => {
  const errors = [];

  // First name
  if (data.firstName && (data.firstName.trim().length < 2 || data.firstName.trim().length > 100)) {
    errors.push({ field: 'firstName', message: 'First name must be 2-100 characters' });
  }

  // Last name
  if (data.lastName && (data.lastName.trim().length < 2 || data.lastName.trim().length > 100)) {
    errors.push({ field: 'lastName', message: 'Last name must be 2-100 characters' });
  }

  // Email
  if (data.email && !isValidEmail(data.email)) {
    errors.push({ field: 'email', message: 'Invalid email format' });
  }

  // Phone
  if (data.phone && !isValidPhone(data.phone)) {
    errors.push({ field: 'phone', message: 'Invalid phone number format' });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Sanitize input data
 */
const sanitizeInput = (data) => {
  const sanitized = {};

  if (data.firstName) sanitized.first_name = data.firstName.trim();
  if (data.lastName) sanitized.last_name = data.lastName.trim();
  if (data.email) sanitized.email = data.email.trim().toLowerCase();
  if (data.password) sanitized.password = data.password;
  if (data.phone) sanitized.phone = data.phone.trim();
  if (data.address) sanitized.address = data.address.trim();
  if (data.city) sanitized.city = data.city.trim();
  if (data.state) sanitized.state = data.state.trim();
  if (data.zipCode) sanitized.zip_code = data.zipCode.trim();
  if (data.role) sanitized.role = data.role;

  return sanitized;
};

module.exports = {
  isValidEmail,
  isValidPassword,
  isValidPhone,
  validateRegister,
  validateLogin,
  validateProfileUpdate,
  sanitizeInput
};
