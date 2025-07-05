// Error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Default error
  let error = {
    message: 'Internal Server Error',
    status: 500
  };

  // Handle different types of errors
  if (err.name === 'ValidationError') {
    error = {
      message: 'Validation Error',
      status: 400,
      details: err.details
    };
  } else if (err.name === 'UnauthorizedError') {
    error = {
      message: 'Unauthorized',
      status: 401
    };
  } else if (err.name === 'ForbiddenError') {
    error = {
      message: 'Forbidden',
      status: 403
    };
  } else if (err.name === 'NotFoundError') {
    error = {
      message: 'Not Found',
      status: 404
    };
  } else if (err.name === 'ConflictError') {
    error = {
      message: 'Conflict',
      status: 409
    };
  } else if (err.name === 'RateLimitError') {
    error = {
      message: 'Too Many Requests',
      status: 429
    };
  } else if (err.code === 'ENOTFOUND') {
    error = {
      message: 'External service unavailable',
      status: 503
    };
  } else if (err.code === 'ECONNREFUSED') {
    error = {
      message: 'External service connection refused',
      status: 503
    };
  } else if (err.response && err.response.status) {
    // Handle HTTP errors from external APIs
    error = {
      message: err.response.data?.message || 'External API Error',
      status: err.response.status,
      details: err.response.data
    };
  } else if (err.message) {
    error.message = err.message;
  }

  // Send error response
  res.status(error.status).json({
    error: {
      message: error.message,
      status: error.status,
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
      method: req.method,
      ...(error.details && { details: error.details })
    }
  });
};

// Custom error classes
class ValidationError extends Error {
  constructor(message, details) {
    super(message);
    this.name = 'ValidationError';
    this.details = details;
  }
}

class UnauthorizedError extends Error {
  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

class ForbiddenError extends Error {
  constructor(message = 'Forbidden') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

class NotFoundError extends Error {
  constructor(message = 'Not Found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

class ConflictError extends Error {
  constructor(message = 'Conflict') {
    super(message);
    this.name = 'ConflictError';
  }
}

class RateLimitError extends Error {
  constructor(message = 'Too Many Requests') {
    super(message);
    this.name = 'RateLimitError';
  }
}

// Async error wrapper
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Export all functions and classes
module.exports = {
  errorHandler,
  asyncHandler,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  RateLimitError
}; 