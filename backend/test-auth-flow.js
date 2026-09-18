const jwt = require('jsonwebtoken');

// Simulate the auth middleware
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

console.log('JWT_SECRET:', JWT_SECRET);
console.log('JWT_EXPIRES_IN:', JWT_EXPIRES_IN);

// Simulate what happens in authService.login
const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// Simulate what happens in authMiddleware.authenticateToken
const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

// Test payload similar to what would be created during login
const testPayload = {
  userId: '12345678-1234-1234-1234-123456789012',
  email: 'driver@example.com',
  role: 'delivery_partner'
};

console.log('\n=== Testing JWT Generation and Verification ===');
console.log('Payload:', JSON.stringify(testPayload, null, 2));

// Generate token
const token = generateToken(testPayload);
console.log('\nGenerated token:', token);

// Verify token
try {
  const decoded = verifyToken(token);
  console.log('\n✓ Token verified successfully!');
  console.log('Decoded payload:', JSON.stringify(decoded, null, 2));
} catch (error) {
  console.error('\n✗ Token verification failed:', error.message);
  console.error('Error name:', error.name);
  if (error.name === 'JsonWebTokenError') {
    console.error('This usually means the secret used to verify does not match the secret used to sign');
  }
}

// Test with a wrong secret to see if we can reproduce the original error
console.log('\n=== Testing with Wrong Secret ===');
const WRONG_SECRET = 'your-secret-key-change-in-production'; // Without "super"
console.log('Using wrong secret:', WRONG_SECRET);

const verifyTokenWithWrongSecret = (token) => {
  return jwt.verify(token, WRONG_SECRET);
};

try {
  const decodedWrong = verifyTokenWithWrongSecret(token);
  console.log('\n?? Token verified with wrong secret? This is unexpected:', JSON.stringify(decodedWrong, null, 2));
} catch (error) {
  console.error('\n✗ Expected failure with wrong secret:', error.message);
  console.error('Error name:', error.name);
}

// Let's also try to decode the token without verification to see what's actually in it
console.log('\n=== Decoding Token Without Verification ===');
const decodedWithoutVerify = jwt.decode(token);
console.log('Decoded payload (no verification):', JSON.stringify(decodedWithoutVerify, null, 2));

// Let's manually check the payload JSON for any issues
console.log('\n=== Manual Payload Inspection ===');
const payloadStr = JSON.stringify(testPayload);
console.log('Original payload string:', payloadStr);
console.log('Length:', payloadStr.length);
for (let i = 0; i < payloadStr.length; i++) {
  const charCode = payloadStr.charCodeAt(i);
  if (charCode > 127 || charCode < 32) { // Non-printable ASCII
    console.log(`  Position ${i}: char '${payloadStr[i]}' (code ${charCode})`);
  }
}