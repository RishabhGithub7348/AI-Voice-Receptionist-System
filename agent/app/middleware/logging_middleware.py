"""
Logging and monitoring middleware
"""

import time
import logging
from uuid import uuid4
from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger(__name__)


class LoggingMiddleware(BaseHTTPMiddleware):
    """Middleware for request/response logging and monitoring"""

    async def dispatch(self, request: Request, call_next):
        # Generate request ID
        request_id = str(uuid4())

        # Add request ID to request state
        request.state.request_id = request_id

        # Log request
        start_time = time.time()
        logger.info(f"[{request_id}] {request.method} {request.url.path} - Request started")

        try:
            # Process request
            response = await call_next(request)

            # Calculate processing time
            process_time = time.time() - start_time

            # Add headers
            response.headers["X-Request-ID"] = request_id
            response.headers["X-Process-Time"] = str(process_time)

            # Log response
            logger.info(f"[{request_id}] {request.method} {request.url.path} - "
                       f"Status: {response.status_code}, Time: {process_time:.3f}s")

            return response

        except Exception as e:
            # Calculate processing time
            process_time = time.time() - start_time

            # Log error
            logger.error(f"[{request_id}] {request.method} {request.url.path} - "
                        f"Error: {str(e)}, Time: {process_time:.3f}s")

            # Return error response
            return JSONResponse(
                status_code=500,
                content={
                    "success": False,
                    "message": "Internal server error",
                    "request_id": request_id
                },
                headers={"X-Request-ID": request_id}
            )


class ErrorHandlingMiddleware(BaseHTTPMiddleware):
    """Middleware for global error handling"""

    async def dispatch(self, request: Request, call_next):
        try:
            return await call_next(request)
        except Exception as e:
            request_id = getattr(request.state, 'request_id', 'unknown')

            logger.error(f"[{request_id}] Unhandled exception: {str(e)}", exc_info=True)

            return JSONResponse(
                status_code=500,
                content={
                    "success": False,
                    "message": "An unexpected error occurred",
                    "request_id": request_id
                }
            )