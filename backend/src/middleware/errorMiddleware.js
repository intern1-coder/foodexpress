/**
 * Error Handling Middleware
 * 
 * Centralized error handling for the application
 */

/**
 * Not Found middleware - 404 handler
 */
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', {
      message: err.message,
      stack: err.stack,
      path: req.originalUrl,
      method: req.method,
      body: req.body,
      user: req.user
    });
  }

  // Default error status
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // PostgreSQL unique constraint error
  if (err.code === '23505') {
    const field = err.detail ? err.detail.match(/\(([^)]+)\)/)?.[1] : 'field';
    return res.status(409).json({
      success: false,
      error: 'Conflict',
      message: `${field} already exists`
    });
  }

  // PostgreSQL foreign key violation
  if (err.code === '23503') {
    return res.status(400).json({
      success: false,
      error: 'Bad Request',
      message: 'Referenced record does not exist'
    });
  }

  // PostgreSQL check violation
  if (err.code === '23514') {
    return res.status(400).json({
      success: false,
      error: 'Bad Request',
      message: 'Invalid data format'
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Invalid token'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Token expired'
    });
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: err.message,
      details: err.details
    });
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: statusCode === 500 ? 'Internal Server Error' : message,
    message: process.env.NODE_ENV === 'development' ? message : 'Something went wrong',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

/**
 * Custom error classes
 */
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';
  }
}

class ValidationError extends Error {
  constructor(message, details = []) {
    super(message);
    this.statusCode = 400;
    this.name = 'ValidationError';
    this.details = details;
  }
}

class NotFoundError extends Error {
  constructor(message = 'Resource not found') {
    super(message);
    this.statusCode = 404;
    this.name = 'NotFoundError';
  }
}

class UnauthorizedError extends Error {
  constructor(message = 'Unauthorized') {
    super(message);
    this.statusCode = 401;
    this.name = 'UnauthorizedError';
  }
}

class ForbiddenError extends Error {
  constructor(message = 'Forbidden') {
    super(message);
    this.statusCode = 403;
    this.name = 'ForbiddenError';
  }
}

module.exports = {
  notFound,
  errorHandler,
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError
};
