import asyncio
import json
import logging
from typing import Any, Optional, Dict, List, Union
from datetime import datetime, timedelta
import hashlib
import pickle

try:
    import redis.asyncio as redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False
    redis = None

logger = logging.getLogger(__name__)


class CacheService:
    """Cache service for Redis operations"""
    
    def __init__(self, redis_url: str = "redis://localhost:6379", default_ttl: int = 3600):
        self.redis_url = redis_url
        self.default_ttl = default_ttl
        self.redis_client = None
        self.initialized = False
        
        if not REDIS_AVAILABLE:
            logger.warning("Redis not available, using in-memory cache")
            self._fallback_cache = {}
    
    async def initialize(self):
        """Initialize Redis connection"""
        if not REDIS_AVAILABLE:
            logger.warning("Redis not available, using in-memory cache")
            return
        
        try:
            self.redis_client = redis.from_url(self.redis_url)
            await self.redis_client.ping()
            self.initialized = True
            logger.info("Redis cache service initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Redis cache: {e}")
            self._fallback_cache = {}
    
    async def close(self):
        """Close Redis connection"""
        if self.redis_client:
            await self.redis_client.close()
            self.initialized = False
    
    def _generate_key(self, prefix: str, *args) -> str:
        """Generate cache key from prefix and arguments"""
        key_parts = [prefix] + [str(arg) for arg in args]
        key_string = ":".join(key_parts)
        return hashlib.md5(key_string.encode()).hexdigest()
    
    async def get(self, key: str) -> Optional[Any]:
        """Get value from cache"""
        if not self.initialized or not REDIS_AVAILABLE:
            return self._fallback_cache.get(key)
        
        try:
            value = await self.redis_client.get(key)
            if value:
                return json.loads(value)
            return None
        except Exception as e:
            logger.error(f"Error getting from cache: {e}")
            return None
    
    async def set(self, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        """Set value in cache"""
        if not self.initialized or not REDIS_AVAILABLE:
            self._fallback_cache[key] = value
            return True
        
        try:
            ttl = ttl or self.default_ttl
            serialized_value = json.dumps(value, default=str)
            await self.redis_client.setex(key, ttl, serialized_value)
            return True
        except Exception as e:
            logger.error(f"Error setting cache: {e}")
            return False
    
    async def delete(self, key: str) -> bool:
        """Delete value from cache"""
        if not self.initialized or not REDIS_AVAILABLE:
            if key in self._fallback_cache:
                del self._fallback_cache[key]
            return True
        
        try:
            await self.redis_client.delete(key)
            return True
        except Exception as e:
            logger.error(f"Error deleting from cache: {e}")
            return False
    
    async def exists(self, key: str) -> bool:
        """Check if key exists in cache"""
        if not self.initialized or not REDIS_AVAILABLE:
            return key in self._fallback_cache
        
        try:
            return await self.redis_client.exists(key) > 0
        except Exception as e:
            logger.error(f"Error checking cache existence: {e}")
            return False
    
    async def expire(self, key: str, ttl: int) -> bool:
        """Set expiration for key"""
        if not self.initialized or not REDIS_AVAILABLE:
            return True  # In-memory cache doesn't support TTL
        
        try:
            return await self.redis_client.expire(key, ttl)
        except Exception as e:
            logger.error(f"Error setting expiration: {e}")
            return False
    
    async def ttl(self, key: str) -> int:
        """Get time to live for key"""
        if not self.initialized or not REDIS_AVAILABLE:
            return -1  # No TTL in in-memory cache
        
        try:
            return await self.redis_client.ttl(key)
        except Exception as e:
            logger.error(f"Error getting TTL: {e}")
            return -1
    
    async def clear(self, pattern: str = "*") -> bool:
        """Clear cache entries matching pattern"""
        if not self.initialized or not REDIS_AVAILABLE:
            if pattern == "*":
                self._fallback_cache.clear()
            else:
                # Simple pattern matching for in-memory cache
                keys_to_delete = [k for k in self._fallback_cache.keys() if pattern in k]
                for key in keys_to_delete:
                    del self._fallback_cache[key]
            return True
        
        try:
            keys = await self.redis_client.keys(pattern)
            if keys:
                await self.redis_client.delete(*keys)
            return True
        except Exception as e:
            logger.error(f"Error clearing cache: {e}")
            return False
    
    async def get_many(self, keys: List[str]) -> Dict[str, Any]:
        """Get multiple values from cache"""
        if not self.initialized or not REDIS_AVAILABLE:
            return {key: self._fallback_cache.get(key) for key in keys}
        
        try:
            values = await self.redis_client.mget(keys)
            result = {}
            for key, value in zip(keys, values):
                if value:
                    result[key] = json.loads(value)
                else:
                    result[key] = None
            return result
        except Exception as e:
            logger.error(f"Error getting multiple values from cache: {e}")
            return {key: None for key in keys}
    
    async def set_many(self, data: Dict[str, Any], ttl: Optional[int] = None) -> bool:
        """Set multiple values in cache"""
        if not self.initialized or not REDIS_AVAILABLE:
            self._fallback_cache.update(data)
            return True
        
        try:
            ttl = ttl or self.default_ttl
            pipeline = self.redis_client.pipeline()
            
            for key, value in data.items():
                serialized_value = json.dumps(value, default=str)
                pipeline.setex(key, ttl, serialized_value)
            
            await pipeline.execute()
            return True
        except Exception as e:
            logger.error(f"Error setting multiple values in cache: {e}")
            return False
    
    async def increment(self, key: str, amount: int = 1) -> Optional[int]:
        """Increment counter in cache"""
        if not self.initialized or not REDIS_AVAILABLE:
            current = self._fallback_cache.get(key, 0)
            if isinstance(current, (int, float)):
                new_value = current + amount
                self._fallback_cache[key] = new_value
                return int(new_value)
            return None
        
        try:
            return await self.redis_client.incr(key, amount)
        except Exception as e:
            logger.error(f"Error incrementing cache: {e}")
            return None
    
    async def decrement(self, key: str, amount: int = 1) -> Optional[int]:
        """Decrement counter in cache"""
        if not self.initialized or not REDIS_AVAILABLE:
            current = self._fallback_cache.get(key, 0)
            if isinstance(current, (int, float)):
                new_value = current - amount
                self._fallback_cache[key] = new_value
                return int(new_value)
            return None
        
        try:
            return await self.redis_client.decr(key, amount)
        except Exception as e:
            logger.error(f"Error decrementing cache: {e}")
            return None
    
    async def get_or_set(self, key: str, default_func, ttl: Optional[int] = None) -> Any:
        """Get value from cache or set default if not exists"""
        value = await self.get(key)
        if value is not None:
            return value
        
        # Generate default value
        if callable(default_func):
            default_value = default_func()
        else:
            default_value = default_func
        
        # Set in cache
        await self.set(key, default_value, ttl)
        return default_value
    
    async def cache_function_result(
        self,
        func,
        *args,
        prefix: str = "func",
        ttl: Optional[int] = None,
        **kwargs
    ) -> Any:
        """Cache function result"""
        # Generate cache key from function name and arguments
        key = self._generate_key(prefix, func.__name__, *args, **kwargs)
        
        # Try to get from cache
        cached_result = await self.get(key)
        if cached_result is not None:
            return cached_result
        
        # Execute function and cache result
        result = await func(*args, **kwargs) if asyncio.iscoroutinefunction(func) else func(*args, **kwargs)
        await self.set(key, result, ttl)
        
        return result
    
    async def get_cache_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        if not self.initialized or not REDIS_AVAILABLE:
            return {
                "type": "in-memory",
                "size": len(self._fallback_cache),
                "keys": list(self._fallback_cache.keys()),
            }
        
        try:
            info = await self.redis_client.info()
            return {
                "type": "redis",
                "connected_clients": info.get("connected_clients", 0),
                "used_memory": info.get("used_memory", 0),
                "used_memory_peak": info.get("used_memory_peak", 0),
                "keyspace_hits": info.get("keyspace_hits", 0),
                "keyspace_misses": info.get("keyspace_misses", 0),
                "total_commands_processed": info.get("total_commands_processed", 0),
            }
        except Exception as e:
            logger.error(f"Error getting cache stats: {e}")
            return {"error": str(e)}
    
    async def health_check(self) -> Dict[str, Any]:
        """Health check for cache service"""
        try:
            if not self.initialized or not REDIS_AVAILABLE:
                return {
                    "status": "healthy",
                    "type": "in-memory",
                    "message": "Using in-memory cache",
                }
            
            # Test connection
            await self.redis_client.ping()
            
            return {
                "status": "healthy",
                "type": "redis",
                "message": "Redis connection is working",
            }
        except Exception as e:
            return {
                "status": "unhealthy",
                "type": "redis",
                "message": f"Redis connection failed: {e}",
            }


# Global cache service instance
_cache_service = None


async def get_cache_service(redis_url: str = "redis://localhost:6379") -> CacheService:
    """Get global cache service instance"""
    global _cache_service
    
    if _cache_service is None:
        _cache_service = CacheService(redis_url)
        await _cache_service.initialize()
    
    return _cache_service


async def close_cache_service():
    """Close global cache service"""
    global _cache_service
    
    if _cache_service:
        await _cache_service.close()
        _cache_service = None 