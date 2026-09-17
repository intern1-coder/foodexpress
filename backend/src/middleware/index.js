/**
 * Middleware Index
 * 
 * Export all middleware here
 */

const { authenticateToken, optionalAuth } = require('./authMiddleware');
const { authorizeRole, requireAdmin, requireCustomer, requireDeliveryPartner, requireOwnerOrAdmin } = require('./roleMiddleware');
const { notFound, errorHandler, AppError, ValidationError, NotFoundError, UnauthorizedError, ForbiddenError } = require('./errorMiddleware');

module.exports = {
  // Auth middleware
  authenticateToken,
  optionalAuth,

  // Role middleware
  authorizeRole,
  requireAdmin,
  requireCustomer,
  requireDeliveryPartner,
  requireOwnerOrAdmin,

  // Error middleware
  notFound,
  errorHandler,

  // Error classes
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError
};
