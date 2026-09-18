// Test JWT generation and verification with the fixed server configuration
console.log('=== Fixed JWT Test ===');

// Clear require cache to simulate fresh start
const Module = require('module');
function clearRequireCache() {
  Object.keys(require.cache).forEach(key => {
    if (key.endsWith('.js') || key.endsWith('.json')) {
      delete require.cache[key];
    }
  });
}

// Clear cache and set up like server.js
clearRequireCache();

// Load dotenv with correct path (like our fixed server.js)
require('dotenv').config({ path: '../.env' });

// Now load the authMiddleware
const authMiddleware = require('./src/middleware/authMiddleware');

console.log('JWT_SECRET from authMiddleware:', JSON.stringify(authMiddleware.JWT_SECRET));

// Test the generateToken function
const testPayload = {
  userId: '12345678-1234-1234-1234-123456789012',
  email: 'driver@example.com',
  role: 'delivery_partner'
};

console.log('\nTest payload:', JSON.stringify(testPayload, null, 2));

// Generate token using the authMiddleware's generateToken function
const token = authMiddleware.generateToken(testPayload);
console.log('\nGenerated token:', token);

// Verify token using jwt.verify directly with the same secret
const jwt = require('jsonwebtoken');
try {
  const decoded = jwt.verify(token, authMiddleware.JWT_SECRET);
  console.log('\n✓ Token verified successfully with jwt.verify!');
  console.log('Decoded payload:', JSON.stringify(decoded, null, 2));
} catch (error) {
  console.error('\n✗ Token verification failed:', error.message);
}

// Also test that the authMiddleware's verify would work (we can't directly test authenticateToken without request/response objects)
// But we can at least verify that the secret is consistent

console.log('\n=== Consistency Check ===');
const expectedSecret = 'your-super-secret-jwt-key-change-in-production';
console.log('Expected secret:', JSON.stringify(expectedSecret));
console.log('Actual secret:', JSON.stringify(authMiddleware.JWT_SECRET));
console.log('Secrets match:', authMiddleware.JWT_SECRET === expectedSecret);