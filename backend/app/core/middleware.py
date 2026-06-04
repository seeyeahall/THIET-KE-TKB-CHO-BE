import time
import uuid
from typing import Any

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Any) -> Response:
        request_id = str(uuid.uuid4())[:8]
        request.state.request_id = request_id
        start = time.time()

        response = await call_next(request)

        duration = (time.time() - start) * 1000
        import logging
        # Use a non-uvicorn logger to avoid format conflicts
        logger = logging.getLogger("app.access")
        logger.info(
            "[%s] %s %s - %s - %.1fms",
            request_id, request.method, request.url.path,
            response.status_code, duration,
        )
        response.headers["X-Request-ID"] = request_id
        return response


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Simple in-memory rate limiter per client IP."""

    def __init__(self, app: Any, max_requests: int = 60, window_seconds: int = 60) -> None:
        super().__init__(app)
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._store: dict[str, list[float]] = {}

    async def dispatch(self, request: Request, call_next: Any) -> Response:
        client_ip = request.client.host if request.client else "unknown"
        now = time.time()
        window = self._store.get(client_ip, [])
        window = [t for t in window if now - t < self.window_seconds]
        if len(window) >= self.max_requests:
            from starlette.responses import JSONResponse
            return JSONResponse(
                status_code=429,
                content={"error": "Rate limit exceeded", "retry_after": self.window_seconds},
            )
        window.append(now)
        self._store[client_ip] = window
        return await call_next(request)
