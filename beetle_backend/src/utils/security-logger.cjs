const fs = require('fs');
const path = require('path');
const { hashForLogging } = require('./security.cjs');

/**
 * Security logging utility for OAuth and webhook events
 */

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const securityLogFile = path.join(logsDir, 'security.log');

/**
 * Logs security events with structured format
 * @param {string} event - Event type
 * @param {object} details - Event details
 * @param {string} level - Log level (info, warn, error)
 */
function logSecurityEvent(event, details = {}, level = 'info') {
  const timestamp = new Date().toISOString();
  const sanitizedDetails = sanitizeLogDetails(details);
  const logEntry = {
    timestamp,
    level,
    event,
    details: sanitizedDetails,
    env: process.env.NODE_ENV || 'development'
  };

  const logLine = JSON.stringify(logEntry) + '\n';

  // Write to console with sanitized details
  console.log(`[SECURITY ${level.toUpperCase()}] ${event}:`, JSON.stringify(sanitizedDetails, null, 2));

  // Write to file (async, non-blocking)
  fs.appendFile(securityLogFile, logLine, (err) => {
    if (err) {
      console.error('Failed to write security log:', err);
    }
  });
}

/**
 * Sanitizes log details to remove sensitive information
 * @param {object} details - Original details
 * @returns {object} - Sanitized details
 */
function sanitizeLogDetails(details) {
  const sanitized = { ...details };
  
  // Hash or remove sensitive fields
  const sensitiveFields = [
    'accessToken', 'token', 'secret', 'password', 
    'authorization', 'client_secret', 'refresh_token'
  ];
  
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = hashForLogging(sanitized[field]);
    }
  });

  // Truncate long fields
  Object.keys(sanitized).forEach(key => {
    if (typeof sanitized[key] === 'string' && sanitized[key].length > 200) {
      sanitized[key] = sanitized[key].substring(0, 200) + '...';
    }
  });

  return sanitized;
}

/**
 * OAuth-specific security event loggers
 */
const oauthEvents = {
  stateGenerated: (state, clientIp) => {
    logSecurityEvent('oauth_state_generated', {
      stateHash: hashForLogging(state),
      clientIp,
      userAgent: 'N/A'
    });
  },

  stateValidated: (state, clientIp, success) => {
    logSecurityEvent('oauth_state_validated', {
      stateHash: hashForLogging(state),
      clientIp,
      success,
      userAgent: 'N/A'
    }, success ? 'info' : 'warn');
  },

  tokenExchange: (code, clientIp, success, error = null) => {
    logSecurityEvent('oauth_token_exchange', {
      codeHash: hashForLogging(code),
      clientIp,
      success,
      error: error ? error.message : null
    }, success ? 'info' : 'error');
  },

  authSuccess: (userId, clientIp) => {
    logSecurityEvent('oauth_auth_success', {
      userId,
      clientIp
    });
  },

  authFailure: (reason, clientIp, details = {}) => {
    logSecurityEvent('oauth_auth_failure', {
      reason,
      clientIp,
      ...details
    }, 'warn');
  },

  rateLimitExceeded: (clientIp, endpoint) => {
    logSecurityEvent('oauth_rate_limit_exceeded', {
      clientIp,
      endpoint
    }, 'warn');
  }
};

/**
 * Webhook-specific security event loggers
 */
const webhookEvents = {
  signatureVerified: (event, delivery, success) => {
    logSecurityEvent('webhook_signature_verified', {
      event,
      delivery,
      success
    }, success ? 'info' : 'error');
  },

  received: (event, delivery, source) => {
    logSecurityEvent('webhook_received', {
      event,
      delivery,
      source
    });
  },

  processed: (event, delivery, success, error = null) => {
    logSecurityEvent('webhook_processed', {
      event,
      delivery,
      success,
      error: error ? error.message : null
    }, success ? 'info' : 'error');
  }
};

/**
 * General security event loggers
 */
const securityEvents = {
  suspiciousActivity: (activity, clientIp, details = {}) => {
    logSecurityEvent('suspicious_activity', {
      activity,
      clientIp,
      ...details
    }, 'warn');
  },

  encryptionFailure: (operation, error) => {
    logSecurityEvent('encryption_failure', {
      operation,
      error: error.message
    }, 'error');
  },

  accessTokenEncrypted: (userId) => {
    logSecurityEvent('access_token_encrypted', {
      userId
    });
  },

  accessTokenDecrypted: (userId) => {
    logSecurityEvent('access_token_decrypted', {
      userId
    });
  }
};

/**
 * Rate limiting for security events to prevent log flooding
 */
const eventRateLimits = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX_EVENTS = 10;

function isRateLimited(eventKey) {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW;

  if (!eventRateLimits.has(eventKey)) {
    eventRateLimits.set(eventKey, []);
  }

  const events = eventRateLimits.get(eventKey);
  
  // Clean old events
  const recentEvents = events.filter(timestamp => timestamp > windowStart);
  eventRateLimits.set(eventKey, recentEvents);

  if (recentEvents.length >= RATE_LIMIT_MAX_EVENTS) {
    return true;
  }

  recentEvents.push(now);
  return false;
}

/**
 * Wrapper function that applies rate limiting to security logging
 */
function rateLimitedLog(eventKey, logFunction) {
  if (isRateLimited(eventKey)) {
    return; // Skip logging if rate limited
  }
  logFunction();
}

module.exports = {
  logSecurityEvent,
  oauthEvents,
  webhookEvents,
  securityEvents,
  rateLimitedLog
};