const jwt = require('jsonwebtoken');

// Test JWT generation and verification
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
console.log('Using JWT_SECRET:', JWT_SECRET);

// Test payload
const payload = {
  userId: '12345678-1234-1234-1234-123456789012',
  email: 'test@example.com',
  role: 'delivery_partner'
};

console.log('Payload:', JSON.stringify(payload, null, 2));

// Generate token
const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
console.log('Generated token:', token);

// Verify token
try {
  const decoded = jwt.verify(token, JWT_SECRET);
  console.log('Decoded payload:', JSON.stringify(decoded, null, 2));
} catch (error) {
  console.error('Verification error:', error.message);
  console.error('Error stack:', error.stack);
}

// Let's also try to decode without verifying to see what's in the token
try {
  const decodedWithoutVerify = jwt.decode(token);
  console.log('Decoded without verify:', JSON.stringify(decodedWithoutVerify, null, 2));
} catch (error) {
  console.error('Decode error:', error.message);
}