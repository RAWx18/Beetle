const rateLimit = require('express-rate-limit');
const { oauthEvents, rateLimitedLog } = require('../utils/security-logger.cjs');

/**
 * OAuth-specific rate limiting middleware
 */

// Rate limiter for OAuth initiation (getting auth URL)
const oauthInitiateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 OAuth initiations per windowMs
  message: {
    error: 'Too many OAuth requests',
    message: 'Too many OAuth authentication attempts from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    const clientIp = req.ip || req.connection.remoteAddress;
    
    rateLimitedLog(`oauth_rate_limit_${clientIp}`, () => {
      oauthEvents.rateLimitExceeded(clientIp, 'oauth_initiate');
    });

    res.status(429).json({
      error: 'Too many OAuth requests',
      message: 'Too many OAuth authentication attempts from this IP, please try again later.',
      retryAfter: '15 minutes'
    });
  },
  skip: (req) => {
    // Skip rate limiting in development for testing
    return process.env.NODE_ENV === 'development' && req.ip === '127.0.0.1';
  }
});

// Rate limiter for OAuth callback
const oauthCallbackLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // Limit each IP to 20 callback attempts per windowMs
  message: {
    error: 'Too many callback requests',
    message: 'Too many OAuth callback attempts from this IP, please try again later.',
    retryAfter: '5 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    const clientIp = req.ip || req.connection.remoteAddress;
    
    rateLimitedLog(`oauth_callback_rate_limit_${clientIp}`, () => {
      oauthEvents.rateLimitExceeded(clientIp, 'oauth_callback');
    });

    // For OAuth callback, redirect to frontend with error instead of JSON response
    const frontendUrl = process.env.NODE_ENV === 'production'
      ? 'https://your-frontend-domain.com'
      : 'http://localhost:3000';
    
    const redirectUrl = `${frontendUrl}/?auth_error=${encodeURIComponent('Rate Limit Exceeded')}&auth_message=${encodeURIComponent('Too many authentication attempts. Please try again later.')}`;
    
    res.redirect(redirectUrl);
  },
  skip: (req) => {
    // Skip rate limiting in development for testing
    return process.env.NODE_ENV === 'development' && req.ip === '127.0.0.1';
  }
});

// Rate limiter for token validation endpoints
const tokenValidationLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // Limit each IP to 60 token validations per minute
  message: {
    error: 'Too many validation requests',
    message: 'Too many token validation requests from this IP, please try again later.',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    const clientIp = req.ip || req.connection.remoteAddress;
    
    rateLimitedLog(`token_validation_rate_limit_${clientIp}`, () => {
      oauthEvents.rateLimitExceeded(clientIp, 'token_validation');
    });

    res.status(429).json({
      error: 'Too many validation requests',
      message: 'Too many token validation requests from this IP, please try again later.',
      retryAfter: '1 minute'
    });
  },
  skip: (req) => {
    // Skip rate limiting in development for testing
    return process.env.NODE_ENV === 'development' && req.ip === '127.0.0.1';
  }
});

// Rate limiter for webhook endpoints
const webhookLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // Limit each IP to 100 webhook requests per minute
  message: {
    error: 'Too many webhook requests',
    message: 'Too many webhook requests from this IP.',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use a combination of IP and user agent for webhook rate limiting
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent') || 'unknown';
    return `${ip}:${userAgent}`;
  },
  handler: (req, res) => {
    const clientIp = req.ip || req.connection.remoteAddress;
    
    rateLimitedLog(`webhook_rate_limit_${clientIp}`, () => {
      oauthEvents.rateLimitExceeded(clientIp, 'webhook');
    });

    res.status(429).json({
      error: 'Too many webhook requests',
      message: 'Too many webhook requests from this IP.',
      retryAfter: '1 minute'
    });
  },
  skip: (req) => {
    // Don't skip webhooks in any environment - they should always be rate limited
    return false;
  }
});

// Adaptive rate limiter that adjusts based on user authentication status
const adaptiveRateLimit = (authenticatedMax = 100, unauthenticatedMax = 20, windowMs = 15 * 60 * 1000) => {
  const authenticatedLimiter = rateLimit({
    windowMs,
    max: authenticatedMax,
    keyGenerator: (req) => {
      // Use user ID for authenticated requests
      return req.user ? `user:${req.user.id}` : `ip:${req.ip}`;
    },
    skip: (req) => !req.user, // Skip for unauthenticated users
    message: {
      error: 'Rate limit exceeded',
      message: `Too many requests from authenticated user. Limit: ${authenticatedMax} requests per ${windowMs / 1000 / 60} minutes.`
    }
  });

  const unauthenticatedLimiter = rateLimit({
    windowMs,
    max: unauthenticatedMax,
    keyGenerator: (req) => `ip:${req.ip}`,
    skip: (req) => !!req.user, // Skip for authenticated users
    message: {
      error: 'Rate limit exceeded',
      message: `Too many requests from this IP. Limit: ${unauthenticatedMax} requests per ${windowMs / 1000 / 60} minutes.`
    }
  });

  return (req, res, next) => {
    if (req.user) {
      authenticatedLimiter(req, res, next);
    } else {
      unauthenticatedLimiter(req, res, next);
    }
  };
};

module.exports = {
  oauthInitiateLimit,
  oauthCallbackLimit,
  tokenValidationLimit,
  webhookLimit,
  adaptiveRateLimit
};