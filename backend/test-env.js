// Test to see what JWT_SECRET is being used
console.log('=== Environment Variable Test ===');

// Require dotenv and specify path to .env file (in parent directory)
require('dotenv').config({ path: '../.env' });

// Now check the JWT_SECRET
const JWT_SECRET = process.env.JWT_SECRET;
console.log('process.env.JWT_SECRET:', JSON.stringify(JWT_SECRET));
console.log('Length:', JWT_SECRET ? JWT_SECRET.length : 0);

// Check if it matches what we expect
const expected = 'your-super-secret-jwt-key-change-in-production';
console.log('Expected:', JSON.stringify(expected));
console.log('Expected length:', expected.length);
console.log('Match:', JWT_SECRET === expected);

// Now test what the authMiddleware would get
const authMiddlewareJWTSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
console.log('\n=== AuthMiddleware JWT_SECRET ===');
console.log('Value:', JSON.stringify(authMiddlewareJWTSecret));
console.log('Length:', authMiddlewareJWTSecret.length);
console.log('Matches expected:', authMiddlewareJWTSecret === expected);