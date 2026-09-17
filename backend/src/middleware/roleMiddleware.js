/**
 * Role-Based Access Control Middleware
 * 
 * Restricts access based on user roles
 */

/**
 * Check if user has required role
 * @param {string|string[]} allowedRoles - Single role or array of allowed roles
 */
const authorizeRole = (allowedRoles) => {
  return (req, res, next) => {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    // Normalize to array
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    // Check if user role is in allowed roles
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: `Access denied. Required role: ${roles.join(' or ')}`
      });
    }

    next();
  };
};

/**
 * Check if user is admin
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Authentication required'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Forbidden',
      message: 'Admin access required'
    });
  }

  next();
};

/**
 * Check if user is customer
 */
const requireCustomer = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Authentication required'
    });
  }

  if (req.user.role !== 'customer') {
    return res.status(403).json({
      success: false,
      error: 'Forbidden',
      message: 'Customer access required'
    });
  }

  next();
};

/**
 * Check if user is delivery partner
 */
const requireDeliveryPartner = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Authentication required'
    });
  }

  if (req.user.role !== 'delivery_partner') {
    return res.status(403).json({
      success: false,
      error: 'Forbidden',
      message: 'Delivery partner access required'
    });
  }

  next();
};

/**
 * Check if user is owner of resource or admin
 */
const requireOwnerOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Authentication required'
    });
  }

  // Admins can access any resource
  if (req.user.role === 'admin') {
    return next();
  }

  // Check if user is owner (userId from params or body must match authenticated user)
  const resourceUserId = req.params.userId || req.body.userId;

  if (resourceUserId && resourceUserId !== req.user.userId) {
    return res.status(403).json({
      success: false,
      error: 'Forbidden',
      message: 'You can only access your own resources'
    });
  }

  next();
};

module.exports = {
  authorizeRole,
  requireAdmin,
  requireCustomer,
  requireDeliveryPartner,
  requireOwnerOrAdmin
};
