/**
 * Validation Index
 * 
 * Export all validation functions
 */

const {
  validateRegister,
  validateLogin,
  validateProfileUpdate,
  sanitizeInput
} = require('./authValidation');

/**
 * Validation middleware factory
 */
const validate = (validationFn) => {
  return (req, res, next) => {
    const { isValid, errors } = validationFn(req.body);

    if (!isValid) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Invalid input data',
        details: errors
      });
    }

    next();
  };
};

module.exports = {
  validate,
  validateRegister: validate(validateRegister),
  validateLogin: validate(validateLogin),
  validateProfileUpdate: validate(validateProfileUpdate),
  sanitizeInput
};
