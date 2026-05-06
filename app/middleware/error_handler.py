"""
Global error-handling middleware — catches unhandled exceptions
and returns structured JSON error responses.
"""
import traceback
from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from loguru import logger


class ErrorHandlerMiddleware(BaseHTTPMiddleware):
    """Catches all unhandled exceptions and returns a clean JSON error."""

    async def dispatch(self, request: Request, call_next):
        try:
            return await call_next(request)
        except Exception as exc:
            logger.opt(exception=True).error(
                f"Unhandled exception on {request.method} {request.url.path}: {exc}"
            )
            return JSONResponse(
                status_code=500,
                content={
                    "error": "Internal Server Error",
                    "detail": str(exc) if __debug__ else "An unexpected error occurred.",
                    "path": str(request.url.path),
                },
            )
