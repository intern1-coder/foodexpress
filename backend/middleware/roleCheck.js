const authenticateToken = require('./auth');

// Middleware to check user role
const authorizeRole = (...allowedRoles) => {
  return (req, res, next) => {
    // First authenticate the token
    authenticateToken(req, res, () => {
      // Then check if user role is allowed
      if (!req.user) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ message: 'Insufficient permissions' });
      }

      next();
    });
  };
};

module.exports = { authorizeRole };