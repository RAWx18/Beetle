const NodeCache = require('node-cache');

/**
 * Enhanced GitHub API Cache Manager
 * Supports ETags, conditional requests, and intelligent cache invalidation
 */
class GitHubCacheManager {
  constructor() {
    // Main data cache
    this.dataCache = new NodeCache({ stdTTL: 900 }); // 15 minutes default
    
    // ETag cache for conditional requests
    this.etagCache = new NodeCache({ stdTTL: 3600 }); // 1 hour for ETags
    
    // Cache configurations for different data types
    this.cacheConfigs = {
      'user_profile': { ttl: 1800, priority: 'high' }, // 30 minutes
      'user_repos': { ttl: 900, priority: 'high' }, // 15 minutes
      'repo_details': { ttl: 1800, priority: 'medium' }, // 30 minutes
      'repo_branches': { ttl: 900, priority: 'medium' }, // 15 minutes
      'repo_commits': { ttl: 900, priority: 'low' }, // 15 minutes
      'repo_issues': { ttl: 600, priority: 'high' }, // 10 minutes
      'repo_prs': { ttl: 600, priority: 'high' }, // 10 minutes
      'user_activity': { ttl: 300, priority: 'high' }, // 5 minutes
      'repo_contributors': { ttl: 3600, priority: 'low' }, // 1 hour
      'repo_languages': { ttl: 3600, priority: 'low' }, // 1 hour
      'search_repos': { ttl: 900, priority: 'low' }, // 15 minutes
      'repo_tree': { ttl: 900, priority: 'medium' }, // 15 minutes
      'file_content': { ttl: 600, priority: 'medium' } // 10 minutes
    };

    console.log('✅ GitHub Cache Manager initialized');
  }

  /**
   * Generate cache key for data
   */
  generateCacheKey(type, ...params) {
    const cleanParams = params.filter(p => p != null).map(p => String(p));
    return `${type}_${cleanParams.join('_')}`;
  }

  /**
   * Generate ETag cache key
   */
  generateETagKey(cacheKey) {
    return `etag_${cacheKey}`;
  }

  /**
   * Get cache configuration for data type
   */
  getCacheConfig(type) {
    return this.cacheConfigs[type] || { ttl: 900, priority: 'medium' };
  }

  /**
   * Store data with ETag information
   */
  set(type, data, etag = null, ...keyParams) {
    const cacheKey = this.generateCacheKey(type, ...keyParams);
    const config = this.getCacheConfig(type);
    
    // Store the actual data
    this.dataCache.set(cacheKey, data, config.ttl);
    
    // Store ETag if provided
    if (etag) {
      const etagKey = this.generateETagKey(cacheKey);
      this.etagCache.set(etagKey, etag);
    }

    console.log(`💾 Cached ${type} data with key: ${cacheKey} (TTL: ${config.ttl}s)`);
    return true;
  }

  /**
   * Get cached data
   */
  get(type, ...keyParams) {
    const cacheKey = this.generateCacheKey(type, ...keyParams);
    const data = this.dataCache.get(cacheKey);
    
    if (data) {
      console.log(`✅ Cache hit for ${type}: ${cacheKey}`);
      return data;
    } else {
      console.log(`❌ Cache miss for ${type}: ${cacheKey}`);
      return null;
    }
  }

  /**
   * Get ETag for cached data
   */
  getETag(type, ...keyParams) {
    const cacheKey = this.generateCacheKey(type, ...keyParams);
    const etagKey = this.generateETagKey(cacheKey);
    return this.etagCache.get(etagKey);
  }

  /**
   * Check if data is cached and fresh
   */
  has(type, ...keyParams) {
    const cacheKey = this.generateCacheKey(type, ...keyParams);
    return this.dataCache.has(cacheKey);
  }

  /**
   * Delete cached data
   */
  delete(type, ...keyParams) {
    const cacheKey = this.generateCacheKey(type, ...keyParams);
    const etagKey = this.generateETagKey(cacheKey);
    
    this.dataCache.del(cacheKey);
    this.etagCache.del(etagKey);
    
    console.log(`🗑️ Deleted cache for ${type}: ${cacheKey}`);
    return true;
  }

  /**
   * Invalidate related cache entries
   */
  invalidateRelated(type, ...keyParams) {
    const patterns = this.getInvalidationPatterns(type, ...keyParams);
    let invalidatedCount = 0;

    patterns.forEach(pattern => {
      const keys = this.dataCache.keys().filter(key => key.includes(pattern));
      keys.forEach(key => {
        this.dataCache.del(key);
        const etagKey = this.generateETagKey(key);
        this.etagCache.del(etagKey);
        invalidatedCount++;
      });
    });

    if (invalidatedCount > 0) {
      console.log(`🔄 Invalidated ${invalidatedCount} related cache entries for ${type}`);
    }

    return invalidatedCount;
  }

  /**
   * Get invalidation patterns for different data types
   */
  getInvalidationPatterns(type, ...keyParams) {
    const patterns = [];

    switch (type) {
      case 'repo_details':
        if (keyParams.length >= 2) {
          const [owner, repo] = keyParams;
          patterns.push(`repo_${owner}_${repo}`);
        }
        break;
      case 'user_repos':
        if (keyParams.length >= 1) {
          const [token] = keyParams;
          patterns.push(`user_repos_${token.substring(0, 10)}`);
        }
        break;
      case 'repo_commits':
      case 'repo_issues':
      case 'repo_prs':
        if (keyParams.length >= 2) {
          const [owner, repo] = keyParams;
          patterns.push(`${owner}_${repo}`);
        }
        break;
    }

    return patterns;
  }

  /**
   * Prepare headers for conditional requests
   */
  getConditionalHeaders(type, ...keyParams) {
    const headers = {};
    const etag = this.getETag(type, ...keyParams);
    
    if (etag) {
      headers['If-None-Match'] = etag;
    }

    return headers;
  }

  /**
   * Handle 304 Not Modified response
   */
  handleNotModified(type, ...keyParams) {
    console.log(`📄 304 Not Modified - using cached data for ${type}`);
    return this.get(type, ...keyParams);
  }

  /**
   * Get cache statistics
   */
  getStatistics() {
    const dataKeys = this.dataCache.keys();
    const etagKeys = this.etagCache.keys();
    
    const stats = {
      totalDataEntries: dataKeys.length,
      totalETagEntries: etagKeys.length,
      cacheByType: {},
      memoryUsage: {
        data: this.dataCache.getStats(),
        etag: this.etagCache.getStats()
      }
    };

    // Group by cache type
    dataKeys.forEach(key => {
      const type = key.split('_')[0];
      if (!stats.cacheByType[type]) {
        stats.cacheByType[type] = 0;
      }
      stats.cacheByType[type]++;
    });

    return stats;
  }

  /**
   * Clear all cache
   */
  clear() {
    this.dataCache.flushAll();
    this.etagCache.flushAll();
    console.log('🧹 All cache cleared');
  }

  /**
   * Clean expired entries
   */
  cleanup() {
    const beforeData = this.dataCache.keys().length;
    const beforeETag = this.etagCache.keys().length;
    
    // NodeCache automatically cleans up expired entries
    // We can force cleanup by accessing stats
    this.dataCache.getStats();
    this.etagCache.getStats();
    
    const afterData = this.dataCache.keys().length;
    const afterETag = this.etagCache.keys().length;
    
    const cleaned = (beforeData - afterData) + (beforeETag - afterETag);
    if (cleaned > 0) {
      console.log(`🧹 Cleaned up ${cleaned} expired cache entries`);
    }
    
    return cleaned;
  }

  /**
   * Batch cache operations
   */
  batch() {
    const operations = [];
    
    return {
      set: (type, data, etag, ...keyParams) => {
        operations.push({ action: 'set', type, data, etag, keyParams });
        return this;
      },
      delete: (type, ...keyParams) => {
        operations.push({ action: 'delete', type, keyParams });
        return this;
      },
      execute: () => {
        operations.forEach(op => {
          if (op.action === 'set') {
            this.set(op.type, op.data, op.etag, ...op.keyParams);
          } else if (op.action === 'delete') {
            this.delete(op.type, ...op.keyParams);
          }
        });
        console.log(`📦 Executed ${operations.length} batch cache operations`);
      }
    };
  }
}

// Singleton instance
const cacheManager = new GitHubCacheManager();

// Cleanup expired entries every 10 minutes
setInterval(() => {
  cacheManager.cleanup();
}, 10 * 60 * 1000);

module.exports = {
  GitHubCacheManager,
  cacheManager
};