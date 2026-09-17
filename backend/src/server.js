/**
 * FoodExpress Backend Entry Point
 * 
 * Express server with authentication and user management
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// Global Middleware
// ============================================
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================
// Health Check Endpoint
// ============================================
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'healthy',
    service: 'FoodExpress Backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// ============================================
// API Info Endpoint
// ============================================
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    name: 'FoodExpress API',
    version: '1.0.0',
    description: 'Food Delivery Platform API',
    endpoints: {
      health: 'GET /health',
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        changePassword: 'PUT /api/auth/change-password',
        refresh: 'POST /api/auth/refresh'
      },
      users: {
        getProfile: 'GET /api/users/profile',
        updateProfile: 'PUT /api/users/profile',
        deleteAccount: 'DELETE /api/users/profile',
        getAllUsers: 'GET /api/users (admin)'
      },
      restaurants: '/api/restaurants',
      foodItems: '/api/food-items',
      orders: '/api/orders'
    }
  });
});

// ============================================
// API Routes
// ============================================
app.use('/api', routes);

// ============================================
// Error Handling Middleware
// ============================================
app.use(notFound);
app.use(errorHandler);

// ============================================
// Start Server
// ============================================
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔═══════════════════════════════════════════════════╗
║                                                   ║
║           FoodExpress Backend v1.0.0               ║
║                                                   ║
║   Server running on port ${PORT}                    ║
║   Environment: ${(process.env.NODE_ENV || 'development').padEnd(33)}║
║                                                   ║
║   API Endpoints:                                  ║
║   - Health:  http://localhost:${PORT}/health         ║
║   - API:     http://localhost:${PORT}/api            ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
  `);
});

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  server.close(() => {
    process.exit(1);
  });
});

module.exports = app;
