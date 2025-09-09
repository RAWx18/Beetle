
from cachetools import TTLCache

# In-memory cache with a TTL of 15 minutes
cache = TTLCache(maxsize=100, ttl=900)
