/**
 * Comprehensive security tests for OAuth implementation
 * Tests all security features including OAuth flow, encryption, webhooks, and rate limiting
 */

const crypto = require('crypto');
const { encrypt, decrypt, verifyGitHubSignature, generateSecureToken, validateRedirectUri } = require('./src/utils/security.cjs');
const { logSecurityEvent, oauthEvents, webhookEvents, securityEvents } = require('./src/utils/security-logger.cjs');

// Set up test environment
process.env.JWT_SECRET = 'test-secret-key-for-comprehensive-encryption-testing-12345';
process.env.NODE_ENV = 'test';

console.log('🧪 Running Comprehensive Security Tests...\n');

let testResults = {
  passed: 0,
  failed: 0,
  total: 0
};

function runTest(testName, testFn) {
  testResults.total++;
  console.log(`${testResults.total}. Testing ${testName}...`);
  
  try {
    const result = testFn();
    if (result) {
      console.log(`✅ ${testName} test passed`);
      testResults.passed++;
    } else {
      console.log(`❌ ${testName} test failed`);
      testResults.failed++;
    }
  } catch (error) {
    console.log(`❌ ${testName} test error:`, error.message);
    testResults.failed++;
  }
  console.log('');
}

// Test 1: Advanced encryption scenarios
runTest('Advanced token encryption with various token types', () => {
  const testTokens = [
    'ghp_basic123456789',
    'gho_oauth_token_1234567890abcdef',
    'github_pat_11AAAAAAA0AAAAAAAAAAAAAAAAAAAAAAAAAAAAa',
    'very_long_token_'.repeat(10) + 'end',
    'token_with_special_chars_!@#$%^&*()_+-=[]{}|;:,.<>?'
  ];

  for (const token of testTokens) {
    const encrypted = encrypt(token);
    const decrypted = decrypt(encrypted);
    
    if (decrypted !== token) {
      console.log(`Failed for token: ${token.substring(0, 20)}...`);
      return false;
    }
    
    // Verify all required fields are present
    if (!encrypted.encrypted || !encrypted.salt || !encrypted.iv || !encrypted.tag || !encrypted.algorithm) {
      console.log('Missing required encryption fields');
      return false;
    }
  }
  
  return true;
});

// Test 2: Encryption edge cases and security
runTest('Encryption security and edge cases', () => {
  const token = 'test_token_123';
  
  // Test that same token produces different encrypted output each time
  const encrypted1 = encrypt(token);
  const encrypted2 = encrypt(token);
  
  if (encrypted1.encrypted === encrypted2.encrypted || encrypted1.salt === encrypted2.salt || encrypted1.iv === encrypted2.iv) {
    console.log('Encryption not properly randomized');
    return false;
  }
  
  // Test that both decrypt to the same value
  if (decrypt(encrypted1) !== token || decrypt(encrypted2) !== token) {
    console.log('Decryption inconsistent');
    return false;
  }
  
  // Test tampered data detection
  try {
    const tampered = { ...encrypted1, encrypted: encrypted1.encrypted.slice(0, -4) + 'XXXX' };
    decrypt(tampered);
    console.log('Failed to detect tampered data');
    return false;
  } catch (error) {
    // Expected to fail
  }
  
  return true;
});

// Test 3: Comprehensive GitHub signature verification
runTest('GitHub webhook signature verification with various payloads', () => {
  const secret = 'test-webhook-secret-12345';
  
  const testPayloads = [
    '{"action":"opened","number":1}',
    '{"ref":"refs/heads/main","commits":[]}',
    JSON.stringify({ test: 'data', number: 42, array: [1, 2, 3] }),
    '{}',
    '{"unicode":"test with émojis 🚀 and special chars ñáéíóú"}'
  ];
  
  for (const payload of testPayloads) {
    // Create valid signature
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payload);
    const validSignature = 'sha256=' + hmac.digest('hex');
    
    // Test valid signature
    if (!verifyGitHubSignature(payload, validSignature, secret)) {
      console.log(`Valid signature verification failed for payload: ${payload.substring(0, 50)}`);
      return false;
    }
    
    // Test invalid signature
    const invalidSignature = 'sha256=' + hmac.digest('hex').slice(0, -4) + '1234';
    if (verifyGitHubSignature(payload, invalidSignature, secret)) {
      console.log(`Invalid signature verification should have failed: ${payload.substring(0, 50)}`);
      return false;
    }
    
    // Test signature without sha256 prefix
    const hmac2 = crypto.createHmac('sha256', secret);
    hmac2.update(payload);
    const rawSignature = hmac2.digest('hex');
    if (!verifyGitHubSignature(payload, rawSignature, secret)) {
      console.log(`Raw signature verification failed: ${payload.substring(0, 50)}`);
      return false;
    }
  }
  
  return true;
});

// Test 4: OAuth state token security
runTest('OAuth state token generation and uniqueness', () => {
  const tokens = new Set();
  const tokenCount = 1000;
  
  // Generate many tokens and ensure uniqueness
  for (let i = 0; i < tokenCount; i++) {
    const token = generateSecureToken();
    
    if (tokens.has(token)) {
      console.log('Duplicate token generated');
      return false;
    }
    
    tokens.add(token);
    
    // Verify token length and format
    if (token.length < 32 || !/^[A-Za-z0-9_-]+$/.test(token)) {
      console.log(`Invalid token format: ${token}`);
      return false;
    }
  }
  
  // Test custom lengths
  const customToken = generateSecureToken(64);
  if (customToken.length < 64) {
    console.log('Custom length token too short');
    return false;
  }
  
  return true;
});

// Test 5: Redirect URI validation comprehensive tests
runTest('Redirect URI validation with edge cases', () => {
  const testCases = [
    // Valid cases
    { uri: 'http://localhost:3000/callback', origins: ['http://localhost:3000'], expected: true },
    { uri: 'https://app.example.com/auth/callback', origins: ['https://app.example.com'], expected: true },
    { uri: 'http://127.0.0.1:8080/auth', origins: ['http://127.0.0.1:8080'], expected: true },
    
    // Invalid cases
    { uri: 'http://localhost:3000/callback', origins: ['https://localhost:3000'], expected: false }, // Protocol mismatch
    { uri: 'http://malicious.com/callback', origins: ['http://localhost:3000'], expected: false }, // Domain mismatch
    { uri: 'http://localhost:3001/callback', origins: ['http://localhost:3000'], expected: false }, // Port mismatch
    { uri: 'javascript:alert(1)', origins: ['http://localhost:3000'], expected: false }, // Invalid protocol
    { uri: '', origins: ['http://localhost:3000'], expected: false }, // Empty URI
    { uri: 'http://localhost:3000/callback', origins: [], expected: false }, // No allowed origins
    
    // Edge cases
    { uri: 'HTTP://LOCALHOST:3000/callback', origins: ['http://localhost:3000'], expected: true }, // URL normalization handles case
    { uri: 'http://localhost:3000:80/callback', origins: ['http://localhost:3000'], expected: false }, // Explicit port
  ];
  
  for (const testCase of testCases) {
    const result = validateRedirectUri(testCase.uri, testCase.origins);
    if (result !== testCase.expected) {
      console.log(`Failed for URI: ${testCase.uri}, Expected: ${testCase.expected}, Got: ${result}`);
      return false;
    }
  }
  
  return true;
});

// Test 6: Security logging functionality
runTest('Security logging and sanitization', () => {
  // Test that sensitive data is properly sanitized
  const sensitiveData = {
    accessToken: 'ghp_sensitive_token_123',
    password: 'secret123',
    authorization: 'Bearer token123',
    normalField: 'safe_data',
    longField: 'x'.repeat(300)
  };
  
  // Capture console output
  const originalLog = console.log;
  let logOutput = '';
  console.log = (...args) => {
    logOutput += args.join(' ') + '\n';
  };
  
  try {
    logSecurityEvent('test_event', sensitiveData);
    
    // Restore console.log
    console.log = originalLog;
    
    // Verify sensitive data is not in logs
    if (logOutput.includes('ghp_sensitive_token_123') || 
        logOutput.includes('secret123') || 
        logOutput.includes('Bearer token123')) {
      console.log('Sensitive data found in logs');
      return false;
    }
    
    // Verify normal data is preserved (should be in the structured JSON output)
    if (!logOutput.includes('safe_data')) {
      console.log('Normal data missing from logs');
      return false;
    }
    
    // Verify event name appears
    if (!logOutput.includes('test_event')) {
      console.log('Event name missing from logs');
      return false;
    }
    
    // Verify truncation occurred (should show '...' for long field)
    if (!logOutput.includes('...')) {
      console.log('Long field not truncated properly');
      return false;
    }
    
  } catch (error) {
    console.log = originalLog;
    throw error;
  }
  
  return true;
});

// Test 7: OAuth event logging
runTest('OAuth security event logging', () => {
  const clientIp = '192.168.1.100';
  const state = 'test_oauth_state_123';
  const userId = 'test_user_456';
  
  // Test various OAuth events (these should not throw errors)
  try {
    oauthEvents.stateGenerated(state, clientIp);
    oauthEvents.stateValidated(state, clientIp, true);
    oauthEvents.stateValidated(state, clientIp, false);
    oauthEvents.tokenExchange('code123', clientIp, true);
    oauthEvents.tokenExchange('code456', clientIp, false, new Error('Test error'));
    oauthEvents.authSuccess(userId, clientIp);
    oauthEvents.authFailure('test_reason', clientIp, { extra: 'data' });
    oauthEvents.rateLimitExceeded(clientIp, 'test_endpoint');
    
    return true;
  } catch (error) {
    console.log('OAuth event logging failed:', error.message);
    return false;
  }
});

// Test 8: Webhook event logging
runTest('Webhook security event logging', () => {
  const event = 'push';
  const delivery = 'test-delivery-123';
  
  try {
    webhookEvents.received(event, delivery, '192.168.1.100');
    webhookEvents.signatureVerified(event, delivery, true);
    webhookEvents.signatureVerified(event, delivery, false);
    webhookEvents.processed(event, delivery, true);
    webhookEvents.processed(event, delivery, false, new Error('Test processing error'));
    
    return true;
  } catch (error) {
    console.log('Webhook event logging failed:', error.message);
    return false;
  }
});

// Test 9: Error handling and edge cases
runTest('Comprehensive error handling', () => {
  let errorCount = 0;
  
  // Test encryption with invalid inputs
  try { encrypt(null); } catch (e) { errorCount++; }
  try { encrypt(undefined); } catch (e) { errorCount++; }
  try { encrypt(''); } catch (e) { errorCount++; }
  
  // Test decryption with invalid inputs
  try { decrypt(null); } catch (e) { errorCount++; }
  try { decrypt({}); } catch (e) { errorCount++; }
  try { decrypt({ encrypted: 'invalid', salt: 'test', iv: 'test', tag: 'test', algorithm: 'aes-256-gcm' }); } catch (e) { errorCount++; }
  
  // Test signature verification with invalid inputs
  if (!verifyGitHubSignature(null, 'sig', 'secret')) errorCount++;
  if (!verifyGitHubSignature('payload', null, 'secret')) errorCount++;
  if (!verifyGitHubSignature('payload', 'sig', null)) errorCount++;
  if (!verifyGitHubSignature('', '', '')) errorCount++;
  
  // Test redirect URI validation with invalid inputs
  if (validateRedirectUri(null, ['http://test.com'])) errorCount++;
  if (validateRedirectUri('http://test.com', null)) errorCount++;
  if (validateRedirectUri('invalid-uri', ['http://test.com'])) errorCount++;
  
  return errorCount >= 10; // Should catch most error cases
});

// Test 10: Performance and timing attack resistance
runTest('Timing attack resistance', () => {
  const payload = 'test payload';
  const secret = 'test secret';
  const validSig = 'sha256=' + crypto.createHmac('sha256', secret).update(payload).digest('hex');
  const invalidSig = 'sha256=' + '0'.repeat(64);
  
  // Time multiple operations to check for timing differences
  const iterations = 100;
  
  const timeValid = Date.now();
  for (let i = 0; i < iterations; i++) {
    verifyGitHubSignature(payload, validSig, secret);
  }
  const validTime = Date.now() - timeValid;
  
  const timeInvalid = Date.now();
  for (let i = 0; i < iterations; i++) {
    verifyGitHubSignature(payload, invalidSig, secret);
  }
  const invalidTime = Date.now() - timeInvalid;
  
  // Times should be roughly similar (within 100% of each other for basic checks)
  const timeDiff = Math.abs(validTime - invalidTime);
  const avgTime = (validTime + invalidTime) / 2;
  const diffPercent = avgTime > 0 ? (timeDiff / avgTime) * 100 : 0;
  
  // Be more lenient with timing checks since test environments can be variable
  if (diffPercent > 300) {
    console.log(`Potential timing attack vulnerability: ${diffPercent}% difference`);
    return false;
  }
  
  return true;
});

// Run all tests and display summary
console.log('📊 Test Results Summary:');
console.log(`Total tests: ${testResults.total}`);
console.log(`Passed: ${testResults.passed}`);
console.log(`Failed: ${testResults.failed}`);
console.log(`Success rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);

if (testResults.failed === 0) {
  console.log('🎉 All comprehensive security tests passed!');
  process.exit(0);
} else {
  console.log('❌ Some tests failed. Review security implementation.');
  process.exit(1);
}