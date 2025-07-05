const jwt = require('jsonwebtoken');
const { getSession, updateSession } = require('../utils/database.cjs');

// Authentication middleware
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Access token required',
        message: 'Please provide a valid Bearer token'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get session from database
    const session = await getSession(decoded.sessionId);
    
    if (!session) {
      return res.status(401).json({
        error: 'Invalid session',
        message: 'Session not found or expired'
      });
    }

    // Update session activity
    await updateSession(decoded.sessionId, {
      lastActivity: new Date().toISOString()
    });

    // Attach user data to request
    req.user = {
      id: session.githubId,
      login: session.login,
      name: session.name,
      avatar_url: session.avatar_url,
      accessToken: session.accessToken,
      sessionId: decoded.sessionId
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'The provided token is invalid'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired',
        message: 'The provided token has expired'
      });
    }

    console.error('Auth middleware error:', error);
    return res.status(500).json({
      error: 'Authentication error',
      message: 'An error occurred during authentication'
    });
  }
};

// Optional authentication middleware (doesn't fail if no token)
const optionalAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continue without authentication
    }

    const token = authHeader.substring(7);
    
    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get session from database
    const session = await getSession(decoded.sessionId);
    
    if (session) {
      // Update session activity
      await updateSession(decoded.sessionId, {
        lastActivity: new Date().toISOString()
      });

      // Attach user data to request
      req.user = {
        id: session.githubId,
        login: session.login,
        name: session.name,
        avatar_url: session.avatar_url,
        accessToken: session.accessToken,
        sessionId: decoded.sessionId
      };
    }

    next();
  } catch (error) {
    // Continue without authentication on error
    next();
  }
};

// Role-based access control middleware
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'User must be authenticated'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        message: 'User does not have required role'
      });
    }

    next();
  };
};

// Repository access middleware
const requireRepositoryAccess = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'User must be authenticated'
      });
    }

    const { owner, repo } = req.params;
    
    // Check if user has access to the repository
    // This is a simplified check - in a real app, you'd verify repository permissions
    const hasAccess = await checkRepositoryAccess(req.user.accessToken, owner, repo);
    
    if (!hasAccess) {
      return res.status(403).json({
        error: 'Repository access denied',
        message: 'You do not have access to this repository'
      });
    }

    next();
  } catch (error) {
    console.error('Repository access check error:', error);
    return res.status(500).json({
      error: 'Access check failed',
      message: 'Failed to verify repository access'
    });
  }
};

// Helper function to check repository access
const checkRepositoryAccess = async (accessToken, owner, repo) => {
  try {
    // This is a simplified implementation
    // In a real app, you'd use GitHub's API to check repository permissions
    return true; // For now, assume access is granted
  } catch (error) {
    console.error('Repository access check failed:', error);
    return false;
  }
};

// Rate limiting middleware for authenticated users
const userRateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const requests = new Map();
  
  return (req, res, next) => {
    if (!req.user) {
      return next();
    }

    const userId = req.user.id;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean old requests
    if (requests.has(userId)) {
      requests.set(userId, requests.get(userId).filter(timestamp => timestamp > windowStart));
    } else {
      requests.set(userId, []);
    }

    const userRequests = requests.get(userId);

    if (userRequests.length >= maxRequests) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: `Too many requests. Limit: ${maxRequests} requests per ${windowMs / 1000 / 60} minutes`
      });
    }

    userRequests.push(now);
    next();
  };
};

// Export all middleware functions
module.exports = {
  authMiddleware,
  optionalAuthMiddleware,
  requireRole,
  requireRepositoryAccess,
  userRateLimit
}; 