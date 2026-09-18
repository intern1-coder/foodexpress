const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

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
}

// Test with different secrets to see if we can reproduce the issue
console.log('\n--- Testing with different secrets ---');

const testSecrets = [
  'your-secret-key-change-in-production',
  'your-super-secret-jwt-key-change-in-production',
  'simple-secret',
  'secret with spaces',
  'secret-with-dashes',
  'secret_with_underscores',
  'secret123!@#',
  '🔑🔐💫' // emoji
];

testSecrets.forEach(secret => {
  try {
    const testToken = jwt.sign(payload, secret, { expiresIn: '1h' });
    const decoded = jwt.verify(testToken, secret);
    console.log(`✓ Secret "${secret.substring(0, 20)}${secret.length > 20 ? '...' : ''}" works`);
  } catch (error) {
    console.log(`✗ Secret "${secret.substring(0, 20)}${secret.length > 20 ? '...' : ''}" failed:`, error.message);
  }
});