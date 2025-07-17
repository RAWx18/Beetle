/**
 * Basic tests for security enhancements
 * These tests verify the core security functionality
 */

const { encrypt, decrypt, verifyGitHubSignature, generateSecureToken, validateRedirectUri } = require('./src/utils/security.cjs');
const crypto = require('crypto');

// Set up test environment
process.env.JWT_SECRET = 'test-secret-key-for-encryption-testing';

console.log('🧪 Running Security Tests...\n');

// Test 1: Token encryption and decryption
console.log('1. Testing token encryption/decryption...');
try {
  const testToken = 'ghp_test123456789abcdefghijklmnopqrstuvwxyz';
  const encrypted = encrypt(testToken);
  const decrypted = decrypt(encrypted);
  
  if (decrypted === testToken) {
    console.log('✅ Encryption/decryption test passed');
  } else {
    console.log('❌ Encryption/decryption test failed');
  }
} catch (error) {
  console.log('❌ Encryption/decryption test error:', error.message);
}

// Test 2: GitHub signature verification
console.log('\n2. Testing GitHub signature verification...');
try {
  const payload = JSON.stringify({ test: 'data' });
  const secret = 'webhook-secret';
  
  // Create valid signature
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  const signature = 'sha256=' + hmac.digest('hex');
  
  const isValid = verifyGitHubSignature(payload, signature, secret);
  const isInvalid = verifyGitHubSignature(payload, 'sha256=invalid', secret);
  
  if (isValid && !isInvalid) {
    console.log('✅ GitHub signature verification test passed');
  } else {
    console.log('❌ GitHub signature verification test failed');
  }
} catch (error) {
  console.log('❌ GitHub signature verification test error:', error.message);
}

// Test 3: Secure token generation
console.log('\n3. Testing secure token generation...');
try {
  const token1 = generateSecureToken();
  const token2 = generateSecureToken();
  
  if (token1 !== token2 && token1.length > 0 && token2.length > 0) {
    console.log('✅ Secure token generation test passed');
  } else {
    console.log('❌ Secure token generation test failed');
  }
} catch (error) {
  console.log('❌ Secure token generation test error:', error.message);
}

// Test 4: Redirect URI validation
console.log('\n4. Testing redirect URI validation...');
try {
  const allowedOrigins = ['http://localhost:3000', 'https://example.com'];
  
  const validUri = 'http://localhost:3000/callback';
  const invalidUri = 'http://malicious.com/callback';
  
  const isValidAccepted = validateRedirectUri(validUri, allowedOrigins);
  const isInvalidRejected = !validateRedirectUri(invalidUri, allowedOrigins);
  
  if (isValidAccepted && isInvalidRejected) {
    console.log('✅ Redirect URI validation test passed');
  } else {
    console.log('❌ Redirect URI validation test failed');
  }
} catch (error) {
  console.log('❌ Redirect URI validation test error:', error.message);
}

// Test 5: Empty/invalid input handling
console.log('\n5. Testing error handling...');
try {
  let errorCount = 0;
  
  // Test empty encryption
  try {
    encrypt('');
  } catch (e) {
    errorCount++;
  }
  
  // Test invalid decryption
  try {
    decrypt({ encrypted: 'invalid' });
  } catch (e) {
    errorCount++;
  }
  
  // Test invalid signature
  const invalidSig = verifyGitHubSignature('', '', '');
  if (!invalidSig) errorCount++;
  
  if (errorCount >= 3) {
    console.log('✅ Error handling test passed');
  } else {
    console.log('❌ Error handling test failed');
  }
} catch (error) {
  console.log('❌ Error handling test error:', error.message);
}

console.log('\n🧪 Security tests completed!');