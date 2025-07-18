const crypto = require('crypto');

/**
 * Security utilities for OAuth token encryption and webhook verification
 */

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // For AES, this is always 16
const TAG_LENGTH = 16; // Authentication tag length
const SALT_LENGTH = 32; // Salt length for key derivation

/**
 * Derives an encryption key from the JWT secret and salt
 * @param {string} salt - Base64 encoded salt
 * @returns {Buffer} - Derived key
 */
function deriveKey(salt) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required for encryption');
  }
  return crypto.pbkdf2Sync(secret, Buffer.from(salt, 'base64'), 100000, 32, 'sha256');
}

/**
 * Encrypts sensitive data (like access tokens)
 * @param {string} text - The text to encrypt
 * @returns {object} - Object containing encrypted data and metadata
 */
function encrypt(text) {
  if (!text) {
    throw new Error('Text to encrypt cannot be empty');
  }

  try {
    // Generate random salt and IV
    const salt = crypto.randomBytes(SALT_LENGTH);
    const iv = crypto.randomBytes(IV_LENGTH);
    
    // Derive key from JWT secret and salt
    const key = deriveKey(salt.toString('base64'));
    
    // Create cipher using createCipheriv (the modern, non-deprecated method)
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    cipher.setAAD(Buffer.from('additional-auth-data'));
    
    // Encrypt the text
    let encrypted = cipher.update(text, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    // Get authentication tag
    const tag = cipher.getAuthTag();
    
    return {
      encrypted,
      salt: salt.toString('base64'),
      iv: iv.toString('base64'),
      tag: tag.toString('base64'),
      algorithm: ALGORITHM
    };
  } catch (error) {
    throw new Error(`Encryption failed: ${error.message}`);
  }
}

/**
 * Decrypts sensitive data
 * @param {object} encryptedData - Object containing encrypted data and metadata
 * @returns {string} - Decrypted text
 */
function decrypt(encryptedData) {
  if (!encryptedData || !encryptedData.encrypted) {
    throw new Error('Invalid encrypted data provided');
  }

  try {
    const { encrypted, salt, iv, tag, algorithm } = encryptedData;
    
    if (algorithm !== ALGORITHM) {
      throw new Error(`Unsupported encryption algorithm: ${algorithm}`);
    }
    
    // Derive key from JWT secret and salt
    const key = deriveKey(salt);
    
    // Create decipher using createDecipheriv (the modern, non-deprecated method)
    const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(iv, 'base64'));
    decipher.setAAD(Buffer.from('additional-auth-data'));
    decipher.setAuthTag(Buffer.from(tag, 'base64'));
    
    // Decrypt the text
    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    throw new Error(`Decryption failed: ${error.message}`);
  }
}

/**
 * Verifies GitHub webhook signature
 * @param {string} payload - The raw payload from GitHub
 * @param {string} signature - The signature from GitHub headers (x-hub-signature-256)
 * @param {string} secret - The webhook secret
 * @returns {boolean} - True if signature is valid
 */
function verifyGitHubSignature(payload, signature, secret) {
  if (!payload || !signature || !secret) {
    return false;
  }

  try {
    // GitHub sends signature as "sha256=<hash>"
    const expectedSignature = signature.startsWith('sha256=') 
      ? signature.slice(7) 
      : signature;
    
    // Calculate expected hash
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payload, 'utf8');
    const calculatedHash = hmac.digest('hex');
    
    // Use constant-time comparison to prevent timing attacks
    // Ensure both strings are the same length before comparison
    if (expectedSignature.length !== calculatedHash.length) {
      return false;
    }
    
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(calculatedHash, 'hex')
    );
  } catch (error) {
    console.error('GitHub signature verification error:', error);
    return false;
  }
}

/**
 * Generates a secure random token for OAuth state
 * @param {number} length - Token length in bytes (default: 32)
 * @returns {string} - Base64url encoded token
 */
function generateSecureToken(length = 32) {
  return crypto.randomBytes(length).toString('base64url');
}

/**
 * Validates OAuth redirect URI against allowed origins
 * @param {string} redirectUri - The redirect URI to validate
 * @param {string[]} allowedOrigins - Array of allowed origins
 * @returns {boolean} - True if redirect URI is valid
 */
function validateRedirectUri(redirectUri, allowedOrigins) {
  if (!redirectUri || !allowedOrigins || allowedOrigins.length === 0) {
    return false;
  }

  try {
    const url = new URL(redirectUri);
    const origin = `${url.protocol}//${url.host}`;
    
    return allowedOrigins.includes(origin);
  } catch (error) {
    console.error('Invalid redirect URI format:', error);
    return false;
  }
}

/**
 * Hashes sensitive data for logging (one-way hash)
 * @param {string} data - Data to hash
 * @returns {string} - SHA256 hash (truncated for logs)
 */
function hashForLogging(data) {
  if (!data) return 'empty';
  
  const hash = crypto.createHash('sha256');
  hash.update(data);
  return hash.digest('hex').substring(0, 16); // First 16 chars for logging
}

module.exports = {
  encrypt,
  decrypt,
  verifyGitHubSignature,
  generateSecureToken,
  validateRedirectUri,
  hashForLogging
};