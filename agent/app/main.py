"""
Main FastAPI application for Frontdesk AI Supervisor Backend
"""

import logging
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load environment variables
load_dotenv(dotenv_path=".env.local")

from .controllers import ai_controller, supervisor_controller
from .middleware.logging_middleware import LoggingMiddleware, ErrorHandlingMiddleware

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan management"""
    logger.info("🚀 Frontdesk AI Supervisor Backend starting up...")

    # Startup tasks
    try:
        # Test database connection
        from .repositories.base_repository import BaseRepository
        repo = BaseRepository("customers")  # Test table
        logger.info("✅ Database connection established")

        # Any other startup tasks
        logger.info("✅ Backend startup completed successfully")

    except Exception as e:
        logger.error(f"❌ Startup failed: {e}")
        raise

    yield

    # Shutdown tasks
    logger.info("🛑 Frontdesk AI Supervisor Backend shutting down...")


# Create FastAPI application
app = FastAPI(
    title="Frontdesk AI Supervisor Backend",
    description="""
    Human-in-the-Loop AI Supervisor System for Frontdesk

    This backend provides:
    - AI agent query processing with knowledge base lookup
    - Help request escalation to human supervisors
    - Supervisor dashboard for handling customer queries
    - Knowledge base management and learning from resolutions
    - Analytics and monitoring capabilities

    ## Architecture
    - **Controllers**: Handle HTTP requests/responses
    - **Services**: Business logic layer
    - **Repositories**: Database operations
    - **Models**: Pydantic schemas for validation
    """,
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add middleware
app.add_middleware(ErrorHandlingMiddleware)
app.add_middleware(LoggingMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(ai_controller.router)
app.include_router(supervisor_controller.router)


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "Frontdesk AI Supervisor Backend",
        "status": "healthy",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Detailed health check"""
    try:
        # Test database connection
        from .repositories.base_repository import BaseRepository
        repo = BaseRepository("customers")

        return {
            "status": "healthy",
            "database": "connected",
            "timestamp": "2024-01-01T00:00:00Z"  # Would be actual timestamp
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e)
        }


if __name__ == "__main__":
    import uvicorn

    host = os.getenv("FASTAPI_HOST", "0.0.0.0")
    port = int(os.getenv("FASTAPI_PORT", 8001))

    logger.info(f"Starting server on {host}:{port}")

    uvicorn.run(
        "app.main:app",
        host=host,
        port=port,
        reload=True,
        log_level="info"
    )