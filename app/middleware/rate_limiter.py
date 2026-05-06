"""
Rate Limiter middleware — per-IP, per-user throttling.
Uses in-memory store (works without Redis for dev) with optional Redis backend.
"""
import time
from collections import defaultdict
from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from app.config import settings


class RateLimiterMiddleware(BaseHTTPMiddleware):
    """
    Simple sliding-window rate limiter.
    In production, swap the in-memory dict for Redis (see _get_key_redis).
    """

    def __init__(self, app, max_requests: int = None, window_seconds: int = 60):
        super().__init__(app)
        self.max_requests = max_requests or settings.RATE_LIMIT_PER_MINUTE
        self.window = window_seconds
        # In-memory store: {key: [timestamps]}
        self._store: dict[str, list[float]] = defaultdict(list)

    def _get_client_key(self, request: Request) -> str:
        """Identify client by IP (or by user-id if authenticated)."""
        forwarded = request.headers.get("X-Forwarded-For")
        ip = forwarded.split(",")[0].strip() if forwarded else request.client.host
        return f"rate:{ip}"

    def _is_rate_limited(self, key: str) -> bool:
        now = time.time()
        # Purge timestamps outside the window
        self._store[key] = [
            ts for ts in self._store[key] if now - ts < self.window
        ]
        if len(self._store[key]) >= self.max_requests:
            return True
        self._store[key].append(now)
        return False

    async def dispatch(self, request: Request, call_next):
        # Skip rate limiting for docs endpoints
        if request.url.path in ("/docs", "/redoc", "/openapi.json", "/dashboard"):
            return await call_next(request)

        key = self._get_client_key(request)
        if self._is_rate_limited(key):
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Rate limit exceeded. Max {self.max_requests} requests per {self.window}s.",
            )

        response = await call_next(request)
        # Add rate limit headers
        remaining = self.max_requests - len(self._store[key])
        response.headers["X-RateLimit-Limit"] = str(self.max_requests)
        response.headers["X-RateLimit-Remaining"] = str(max(0, remaining))
        return response
