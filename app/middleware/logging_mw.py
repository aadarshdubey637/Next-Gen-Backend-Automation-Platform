"""
Structured request/response logging middleware using Loguru.
"""
import time
import uuid
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from loguru import logger
from app.config import settings

# Configure loguru (removed duplicate sink)
logger.configure(extra={"request_id": "system"})
# Note: Log sink is now configured in main.py lifespan to avoid duplicates


class LoggingMiddleware(BaseHTTPMiddleware):
    """Logs every request with timing, status, and a unique request ID."""

    async def dispatch(self, request: Request, call_next):
        request_id = str(uuid.uuid4())[:8]
        start = time.perf_counter()

        # Bind request_id to all log calls in this context
        with logger.contextualize(request_id=request_id):
            response = await call_next(request)

            elapsed_ms = (time.perf_counter() - start) * 1000
            # Silence auth logs for clean production logs
            if response.status_code >= 400:
                logger.error(
                    f"← {response.status_code} | {elapsed_ms:.1f}ms "
                    f"| {request.method} {request.url.path}"
                )

            # Attach request ID to response for tracing
            response.headers["X-Request-ID"] = request_id
            return response
