"""Redis cache (Upstash compatible)."""
import os
import json
import time
import redis

_redis = None

def get_redis():
    global _redis
    if _redis is None:
        url = os.getenv("REDIS_URL")
        if url:
            _redis = redis.from_url(url, decode_responses=True)
        else:
            _redis = _MemoryCache()
    return _redis

class _MemoryCache:
    """Fallback used only when REDIS_URL isn't set (e.g. local dev)."""
    def __init__(self):
        self._data = {}
        self._expiry = {}

    def get(self, k):
        exp = self._expiry.get(k)
        if exp is not None and time.time() >= exp:
            self._data.pop(k, None)
            self._expiry.pop(k, None)
            return None
        return self._data.get(k)

    def set(self, k, v, ex=None):
        self._data[k] = v
        self._expiry[k] = (time.time() + ex) if ex else None

    def delete(self, k):
        self._data.pop(k, None)
        self._expiry.pop(k, None)

def cache_get(key):
    r = get_redis()
    val = r.get(key)
    return json.loads(val) if val else None

def cache_set(key, value, ttl=300):
    r = get_redis()
    r.set(key, json.dumps(value), ex=ttl)

def cache_delete(key):
    get_redis().delete(key)