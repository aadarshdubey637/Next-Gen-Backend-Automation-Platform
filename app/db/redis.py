"""
Redis connection for caching and rate-limit state.
"""
import redis.asyncio as aioredis
from app.config import settings

_redis: aioredis.Redis | None = None


async def init_redis():
    """Connect to Redis on startup."""
    global _redis
    _redis = aioredis.from_url(
        settings.REDIS_URL,
        encoding="utf-8",
        decode_responses=True,
    )


async def shutdown_redis():
    """Close Redis connection on shutdown."""
    global _redis
    if _redis:
        await _redis.close()


def get_redis() -> aioredis.Redis:
    """Return the Redis client."""
    if _redis is None:
        raise RuntimeError("Redis not initialized.")
    return _redis
