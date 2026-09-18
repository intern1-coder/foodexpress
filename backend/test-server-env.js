// Test to see what JWT_SECRET the server would use
console.log('=== Server Environment Test ===');

// Mock the require.cache to simulate fresh requires
// Clear the cache for dotenv and our test modules
const Module = require('module');

function clearRequireCache() {
  Object.keys(require.cache).forEach(key => {
    if (key.endsWith('.js') || key.endsWith('.json')) {
      delete require.cache[key];
    }
  });
}

// Clear cache and set up environment like server.js does
clearRequireCache();

// Load dotenv with path to .env in parent directory (like our fixed server.js)
require('dotenv').config({ path: '../.env' });

// Now load authMiddleware to see what JWT_SECRET it gets
const authMiddleware = require('./src/middleware/authMiddleware');

console.log('process.env.JWT_SECRET:', JSON.stringify(process.env.JWT_SECRET));
console.log('authMiddleware.JWT_SECRET:', JSON.stringify(authMiddleware.JWT_SECRET));
console.log('Match:', process.env.JWT_SECRET === authMiddleware.JWT_SECRET);

const expected = 'your-super-secret-jwt-key-change-in-production';
console.log('Expected:', JSON.stringify(expected));
console.log('Env matches expected:', process.env.JWT_SECRET === expected);
console.log('AuthMiddleware matches expected:', authMiddleware.JWT_SECRET === expected);