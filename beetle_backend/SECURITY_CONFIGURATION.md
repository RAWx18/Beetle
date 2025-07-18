# Security Configuration Guide

This document outlines the security configurations and features implemented in the Beetle application for OAuth integration and webhook security.

## Overview

The Beetle application implements comprehensive security measures for GitHub OAuth integration, including:

- **Access token encryption** for secure database storage
- **Enhanced OAuth state validation** with persistent storage and security checks
- **GitHub webhook signature verification** to ensure webhook authenticity
- **OAuth-specific rate limiting** to prevent abuse
- **Security event logging** for monitoring and auditing
- **Configuration validation** to ensure proper security setup

## Environment Variables

### Required Security Configuration

```bash
# JWT Configuration (Required)
JWT_SECRET=your_very_secure_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# GitHub OAuth Configuration (Required)
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URL=http://localhost:3001/auth/github/callback

# GitHub Webhook Configuration (Required for webhooks)
GITHUB_WEBHOOK_SECRET=your_github_webhook_secret

# Security Configuration (Recommended)
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
NODE_ENV=production
```

### Security Environment Variables Explained

#### JWT_SECRET
- **Purpose**: Used for JWT token signing and as the base for access token encryption
- **Requirements**: Should be at least 32 characters long and cryptographically random
- **Security**: This secret is critical - if compromised, all user sessions and encrypted tokens can be compromised
- **Example**: Use `openssl rand -base64 32` to generate a secure secret

#### GITHUB_WEBHOOK_SECRET
- **Purpose**: Used to verify GitHub webhook signatures using HMAC-SHA256
- **Requirements**: Should be cryptographically random
- **Security**: Without this, malicious actors could send fake webhook events
- **Setup**: Configure this in your GitHub repository's webhook settings

#### ALLOWED_ORIGINS
- **Purpose**: Whitelist of allowed origins for OAuth redirect URI validation
- **Format**: Comma-separated list of allowed origins (protocol + domain + port)
- **Security**: Prevents OAuth redirect attacks by validating callback URLs
- **Example**: `https://myapp.com,https://staging.myapp.com`

## Security Features

### 1. Access Token Encryption

All GitHub access tokens are encrypted before being stored in the database using AES-256-GCM encryption.

#### Implementation Details:
- **Algorithm**: AES-256-GCM (Galois/Counter Mode)
- **Key Derivation**: PBKDF2 with 100,000 iterations using JWT_SECRET as base
- **Unique Per Token**: Each token uses a unique salt and IV
- **Authentication**: GCM mode provides built-in authentication

#### Usage:
```javascript
const { encrypt, decrypt } = require('./src/utils/security.cjs');

// Encrypt access token before storage
const encryptedData = encrypt(accessToken);

// Decrypt when needed
const decryptedToken = decrypt(encryptedData);
```

### 2. OAuth State Validation

Enhanced OAuth state validation with persistent storage and security checks.

#### Security Features:
- **Cryptographically secure state generation**: 32-byte random tokens
- **Persistent storage**: States survive server restarts
- **One-time use**: States are marked as used to prevent replay attacks
- **IP validation**: Optional IP address verification
- **Expiration**: Automatic cleanup of expired states

#### State Lifecycle:
1. Generate secure random state token
2. Store in database with metadata (IP, timestamp, etc.)
3. Include in OAuth authorization URL
4. Validate state in callback (check existence, not used, IP match)
5. Mark state as used
6. Clean up after successful authentication

### 3. GitHub Webhook Signature Verification

All GitHub webhooks are verified using HMAC-SHA256 signatures.

#### Implementation:
- **Algorithm**: HMAC-SHA256
- **Header**: `X-Hub-Signature-256`
- **Timing Attack Protection**: Uses constant-time comparison
- **Raw Body Required**: Signature is calculated on raw request body

#### Usage:
```javascript
const { verifyGitHubSignature } = require('./src/utils/security.cjs');

const isValid = verifyGitHubSignature(
  rawPayload,
  req.headers['x-hub-signature-256'],
  process.env.GITHUB_WEBHOOK_SECRET
);
```

### 4. Rate Limiting

OAuth-specific rate limiting to prevent abuse and brute force attacks.

#### Rate Limits:
- **OAuth Initiation**: 10 requests per 15 minutes per IP
- **OAuth Callback**: 20 requests per 5 minutes per IP
- **Token Validation**: 60 requests per minute per IP
- **Webhooks**: 100 requests per minute per IP+User-Agent

#### Features:
- **Adaptive Limiting**: Different limits for authenticated vs unauthenticated users
- **IP-based**: Rate limiting by client IP address
- **Graceful Handling**: Proper error responses and redirect handling
- **Development Skip**: Rate limiting can be disabled in development

### 5. Security Event Logging

Comprehensive logging of security events for monitoring and auditing.

#### Event Types:
- **OAuth Events**: State generation/validation, token exchange, auth success/failure
- **Webhook Events**: Signature verification, processing status
- **Security Events**: Suspicious activity, encryption operations

#### Log Features:
- **Sanitization**: Sensitive data (tokens, passwords) are hashed before logging
- **Structured Format**: JSON format with timestamps and event metadata
- **File and Console**: Logs to both console and security.log file
- **Rate Limited**: Prevents log flooding attacks

#### Example Security Log Entry:
```json
{
  "timestamp": "2023-12-07T10:30:00.000Z",
  "level": "info",
  "event": "oauth_auth_success",
  "details": {
    "userId": "12345",
    "clientIp": "192.168.1.100"
  },
  "env": "production"
}
```

## Security Best Practices

### Production Deployment

1. **Environment Variables**:
   - Use strong, unique secrets for JWT_SECRET and GITHUB_WEBHOOK_SECRET
   - Set NODE_ENV=production
   - Configure ALLOWED_ORIGINS with your actual domain(s)

2. **HTTPS**:
   - Always use HTTPS in production
   - Update GITHUB_CALLBACK_URL to use HTTPS
   - Set secure cookies and headers

3. **Database Security**:
   - Secure your database with authentication
   - Use database encryption at rest
   - Regular security updates

4. **Monitoring**:
   - Monitor security.log for suspicious activity
   - Set up alerts for authentication failures
   - Regular security audits

### Development Setup

1. **Generate Secure Secrets**:
   ```bash
   # Generate JWT secret
   openssl rand -base64 32
   
   # Generate webhook secret
   openssl rand -base64 32
   ```

2. **GitHub App Setup**:
   - Create a GitHub OAuth App
   - Set callback URL to your development server
   - Configure webhook URL and secret

3. **Local Testing**:
   - Use ngrok or similar for webhook testing
   - Test with various OAuth scenarios
   - Verify rate limiting behavior

## Security Testing

The application includes comprehensive security tests:

```bash
# Run basic security tests
npm run test:security

# Run comprehensive security tests
npm run test:security:comprehensive
```

### Test Coverage:
- Access token encryption/decryption with various token types
- GitHub webhook signature verification
- OAuth state token generation and uniqueness
- Redirect URI validation with edge cases
- Security logging and data sanitization
- Rate limiting behavior
- Error handling and edge cases
- Timing attack resistance

## Troubleshooting

### Common Issues:

1. **"JWT_SECRET environment variable is required"**:
   - Set JWT_SECRET in your environment
   - Ensure it's at least 32 characters long

2. **"Invalid webhook signature"**:
   - Verify GITHUB_WEBHOOK_SECRET matches GitHub settings
   - Check that raw request body is used for verification
   - Ensure webhook URL is correctly configured

3. **"Invalid redirect URI"**:
   - Check ALLOWED_ORIGINS includes your callback domain
   - Verify protocol (http vs https) matches
   - Ensure no trailing slashes in origins

4. **Rate limit exceeded**:
   - Normal in development with repeated testing
   - Check if rate limiting is properly skipped for localhost in development
   - Verify client IP detection is working correctly

### Security Logs:

Monitor logs for these security events:
- `oauth_auth_failure`: Failed authentication attempts
- `suspicious_activity`: Potential security threats
- `oauth_rate_limit_exceeded`: Rate limiting triggers
- `webhook_signature_verified`: Webhook verification status

## Security Updates

To maintain security:

1. **Regular Updates**:
   - Keep dependencies updated
   - Monitor security advisories
   - Update Node.js regularly

2. **Secret Rotation**:
   - Rotate JWT_SECRET periodically (requires user re-authentication)
   - Rotate webhook secrets as needed
   - Update OAuth app credentials if compromised

3. **Monitoring**:
   - Review security logs regularly
   - Set up alerting for security events
   - Monitor for unusual authentication patterns

## Support

For security-related questions or issues:
1. Check the security logs for detailed error information
2. Review this documentation for configuration requirements
3. Run security tests to verify implementation
4. Open an issue with detailed error logs and configuration (redact sensitive information)

---

**Important**: Never commit secrets or sensitive configuration to version control. Use environment variables or secure secret management systems.