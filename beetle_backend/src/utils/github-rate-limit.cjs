const NodeCache = require('node-cache');

/**
 * GitHub API Rate Limit Manager
 * Handles rate limit tracking, retry logic, and request queuing
 */
class GitHubRateLimitManager {
  constructor() {
    // Cache for rate limit information per token
    this.rateLimitCache = new NodeCache({ stdTTL: 3600 }); // 1 hour TTL
    
    // Request queue for when rate limited
    this.requestQueue = [];
    this.isProcessingQueue = false;
    
    // Rate limit thresholds
    this.RATE_LIMIT_THRESHOLD = 100; // Start queuing when under 100 requests remaining
    this.RETRY_DELAYS = [1000, 2000, 4000, 8000, 16000]; // Exponential backoff in ms
    
    console.log('✅ GitHub Rate Limit Manager initialized');
  }

  /**
   * Get cache key for rate limit data
   */
  getRateLimitKey(token) {
    return `rate_limit_${token.substring(0, 10)}`;
  }

  /**
   * Parse rate limit headers from GitHub API response
   */
  parseRateLimitHeaders(headers) {
    return {
      limit: parseInt(headers['x-ratelimit-limit']) || 5000,
      remaining: parseInt(headers['x-ratelimit-remaining']) || 5000,
      reset: parseInt(headers['x-ratelimit-reset']) || Math.floor(Date.now() / 1000) + 3600,
      used: parseInt(headers['x-ratelimit-used']) || 0,
      resource: headers['x-ratelimit-resource'] || 'core',
      resetDate: new Date(parseInt(headers['x-ratelimit-reset']) * 1000)
    };
  }

  /**
   * Update rate limit information from API response
   */
  updateRateLimit(token, headers) {
    if (!headers || !token) return;

    const rateLimitInfo = this.parseRateLimitHeaders(headers);
    const cacheKey = this.getRateLimitKey(token);
    
    this.rateLimitCache.set(cacheKey, rateLimitInfo);
    
    console.log(`📊 Rate limit updated - Remaining: ${rateLimitInfo.remaining}/${rateLimitInfo.limit}, Reset: ${rateLimitInfo.resetDate.toISOString()}`);
    
    return rateLimitInfo;
  }

  /**
   * Get current rate limit status
   */
  getRateLimitStatus(token) {
    const cacheKey = this.getRateLimitKey(token);
    const rateLimitInfo = this.rateLimitCache.get(cacheKey);
    
    if (!rateLimitInfo) {
      // Default values when no rate limit info available
      return {
        limit: 5000,
        remaining: 5000,
        reset: Math.floor(Date.now() / 1000) + 3600,
        used: 0,
        resource: 'core',
        resetDate: new Date(Date.now() + 3600000),
        isNearLimit: false,
        isRateLimited: false
      };
    }

    const now = Math.floor(Date.now() / 1000);
    const isRateLimited = rateLimitInfo.remaining === 0 && now < rateLimitInfo.reset;
    const isNearLimit = rateLimitInfo.remaining < this.RATE_LIMIT_THRESHOLD;

    return {
      ...rateLimitInfo,
      isNearLimit,
      isRateLimited
    };
  }

  /**
   * Check if we should delay the request due to rate limiting
   */
  shouldDelayRequest(token) {
    const status = this.getRateLimitStatus(token);
    return status.isRateLimited || status.isNearLimit;
  }

  /**
   * Calculate delay until rate limit reset
   */
  getDelayUntilReset(token) {
    const status = this.getRateLimitStatus(token);
    const now = Math.floor(Date.now() / 1000);
    const delaySeconds = Math.max(0, status.reset - now);
    return delaySeconds * 1000; // Convert to milliseconds
  }

  /**
   * Get appropriate retry delay with exponential backoff
   */
  getRetryDelay(attemptNumber) {
    const maxAttempts = this.RETRY_DELAYS.length;
    const index = Math.min(attemptNumber - 1, maxAttempts - 1);
    const baseDelay = this.RETRY_DELAYS[index];
    
    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 1000;
    return baseDelay + jitter;
  }

  /**
   * Sleep for specified milliseconds
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Execute request with rate limit handling and retries
   */
  async executeWithRateLimit(token, requestFn, context = {}) {
    const maxRetries = 5;
    let attempt = 1;

    while (attempt <= maxRetries) {
      try {
        // Check rate limit status before making request
        const status = this.getRateLimitStatus(token);
        
        if (status.isRateLimited) {
          const delayMs = this.getDelayUntilReset(token);
          console.log(`⏰ Rate limited, waiting ${Math.ceil(delayMs / 1000)}s until reset...`);
          await this.sleep(Math.min(delayMs, 60000)); // Cap at 1 minute
        } else if (status.isNearLimit && context.priority !== 'high') {
          // For non-high priority requests, add small delay when near limit
          await this.sleep(1000);
        }

        // Execute the request
        const result = await requestFn();
        
        // Update rate limit info from response headers
        if (result && result.headers) {
          this.updateRateLimit(token, result.headers);
        }

        return result;

      } catch (error) {
        const isRateLimitError = this.isRateLimitError(error);
        const isRetryableError = this.isRetryableError(error);

        if (isRateLimitError) {
          console.warn(`🚫 Rate limit error on attempt ${attempt}:`, error.message);
          
          // Update rate limit info from error response
          if (error.response && error.response.headers) {
            this.updateRateLimit(token, error.response.headers);
          }

          if (attempt < maxRetries) {
            const delayMs = this.getRetryDelay(attempt);
            console.log(`⏳ Retrying in ${Math.ceil(delayMs / 1000)}s... (attempt ${attempt + 1}/${maxRetries})`);
            await this.sleep(delayMs);
            attempt++;
            continue;
          }
        } else if (isRetryableError && attempt < maxRetries) {
          console.warn(`🔄 Retryable error on attempt ${attempt}:`, error.message);
          const delayMs = this.getRetryDelay(attempt);
          await this.sleep(delayMs);
          attempt++;
          continue;
        }

        // Non-retryable error or max retries reached
        throw this.enhanceError(error, attempt - 1);
      }
    }
  }

  /**
   * Check if error is a rate limit error
   */
  isRateLimitError(error) {
    if (!error.response) return false;
    
    const status = error.response.status;
    const message = error.response.data?.message || error.message || '';
    
    return status === 403 && (
      message.includes('rate limit') ||
      message.includes('API rate limit exceeded') ||
      error.response.headers['x-ratelimit-remaining'] === '0'
    );
  }

  /**
   * Check if error is retryable
   */
  isRetryableError(error) {
    if (!error.response) return true; // Network errors are retryable
    
    const status = error.response.status;
    
    // Retryable HTTP status codes
    return status >= 500 || status === 502 || status === 503 || status === 504 || status === 429;
  }

  /**
   * Enhance error with rate limit context
   */
  enhanceError(error, attemptCount) {
    const isRateLimit = this.isRateLimitError(error);
    
    if (isRateLimit) {
      const enhancedError = new Error(
        `GitHub API rate limit exceeded. The application has hit the GitHub API rate limit. ` +
        `This is a temporary limitation that will reset automatically. ` +
        `You can continue using the demo mode or try again later. ` +
        `(${attemptCount} retries attempted)`
      );
      enhancedError.name = 'GitHubRateLimitError';
      enhancedError.isRateLimit = true;
      enhancedError.originalError = error;
      enhancedError.attemptCount = attemptCount;
      return enhancedError;
    }

    return error;
  }

  /**
   * Add request to queue (for future implementation)
   */
  queueRequest(token, requestFn, context = {}) {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({
        token,
        requestFn,
        context,
        resolve,
        reject,
        timestamp: Date.now()
      });

      this.processQueue();
    });
  }

  /**
   * Process queued requests (for future implementation)
   */
  async processQueue() {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    try {
      while (this.requestQueue.length > 0) {
        const queuedRequest = this.requestQueue.shift();
        const { token, requestFn, context, resolve, reject } = queuedRequest;

        try {
          const result = await this.executeWithRateLimit(token, requestFn, context);
          resolve(result);
        } catch (error) {
          reject(error);
        }

        // Small delay between queued requests
        await this.sleep(100);
      }
    } finally {
      this.isProcessingQueue = false;
    }
  }

  /**
   * Get rate limit statistics for monitoring
   */
  getStatistics() {
    const allKeys = this.rateLimitCache.keys();
    const stats = {
      totalTokens: allKeys.length,
      rateLimits: {},
      queuedRequests: this.requestQueue.length
    };

    allKeys.forEach(key => {
      const rateLimitInfo = this.rateLimitCache.get(key);
      if (rateLimitInfo) {
        stats.rateLimits[key] = {
          remaining: rateLimitInfo.remaining,
          limit: rateLimitInfo.limit,
          resetDate: rateLimitInfo.resetDate,
          percentageUsed: ((rateLimitInfo.limit - rateLimitInfo.remaining) / rateLimitInfo.limit * 100).toFixed(1)
        };
      }
    });

    return stats;
  }
}

// Singleton instance
const rateLimitManager = new GitHubRateLimitManager();

module.exports = {
  GitHubRateLimitManager,
  rateLimitManager
};