"""
╔══════════════════════════════════════════════════════════╗
║  Next-Gen Backend Automation Platform                    ║
║  ─────────────────────────────────────                   ║
║  FastAPI application entry point.                        ║
║  Schema → API in seconds.                                ║
╚══════════════════════════════════════════════════════════╝
"""
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.config import settings
from app.db.postgresql import init_postgres, shutdown_postgres
from app.db.mongodb import init_mongodb, shutdown_mongodb
from app.middleware.rate_limiter import RateLimiterMiddleware
from app.middleware.logging_mw import LoggingMiddleware
from app.middleware.error_handler import ErrorHandlerMiddleware

from app.api.auth import router as auth_router
from app.api.schemas import router as schemas_router
from app.api.admin import router as admin_router
from app.api.notifications import router as notifications_router
from app.core.route_builder import load_and_mount_all_schemas

import sys
from loguru import logger

# Silent mode for production/terminal (Only errors in terminal)
logger.remove()
logger.add(
    sys.stderr, 
    level="ERROR",
    format="<red>{time:HH:mm:ss}</red> | <level>{level: <8}</level> | <cyan>{message}</cyan>"
)

# File logging configured once
logger.add(
    settings.LOG_FILE, 
    rotation="10 MB", 
    retention=5, 
    compression="zip",
    level=settings.LOG_LEVEL,
    format="{time:YYYY-MM-DD HH:mm:ss.SSS} | {level:<8} | {extra[request_id]} | {message}",
    enqueue=True # Run in background thread to not block event loop
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown lifecycle."""
    # ── Startup ─────────────────────────────────────────
    # Create logs directory
    os.makedirs("logs", exist_ok=True)

    # Initialize databases in parallel
    import asyncio
    
    db_tasks = []
    db_tasks.append(init_postgres())
    db_tasks.append(init_mongodb())
    
    # Run DB initializations
    db_results = await asyncio.gather(*db_tasks, return_exceptions=True)
    
    if isinstance(db_results[0], Exception):
        logger.warning(f"⚠️ PostgreSQL connection failed: {db_results[0]}")

    if isinstance(db_results[1], Exception):
        logger.warning(f"⚠️ MongoDB connection failed: {db_results[1]}")

    # Load dynamic routes in the background
    asyncio.create_task(load_and_mount_all_schemas(app))
    
    print(f"🚀 Server started at http://{settings.HOST}:{settings.PORT}")
    print(f"🌐 API docs: http://{settings.HOST}:{settings.PORT}/docs")
    print("━" * 50)

    yield

    # ── Shutdown ────────────────────────────────────────
    logger.info("🛑 Shutting down...")
    await shutdown_postgres()
    await shutdown_mongodb()
    logger.info("Goodbye! 👋")


# ── Create the FastAPI app ──────────────────────────────
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="""
## 🚀 Next-Gen Backend Automation Platform

Generate fully functional backend APIs from:
- **JSON Schema** — structured field definitions
- **Form Input** — interactive schema builder
- **Plain English** — AI-powered generation

### Features
- ✅ Auto CRUD generation
- 🔐 JWT Authentication & RBAC
- 🗄️ PostgreSQL + MongoDB support
- 📊 Admin Dashboard
- ⚡ Rate Limiting & Logging
- 🧠 AI-Powered Schema Generation
    """,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ── Middleware Stack (order matters: last added = first executed) ──
app.add_middleware(ErrorHandlerMiddleware)
app.add_middleware(LoggingMiddleware)
app.add_middleware(RateLimiterMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Register API Routers ───────────────────────────────
app.include_router(auth_router)
app.include_router(schemas_router)
app.include_router(admin_router)
app.include_router(notifications_router)


# ── Frontend static file serving ──────────────────────
frontend_dist = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "dist")

if os.path.exists(frontend_dist):
    # Mount assets folder
    assets_dir = os.path.join(frontend_dist, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

@app.get("/", include_in_schema=False)
async def serve_home():
    """Serve the React app index."""
    index_path = os.path.join(frontend_dist, "index.html")
    logger.info(f"Serving index from: {index_path}")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"message": "Frontend build not found. Run 'npm run build' in frontend folder."}

@app.get("/generator", include_in_schema=False)
async def serve_generator():
    """Serve the React app for the generator route."""
    index_path = os.path.join(frontend_dist, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"message": "Frontend build not found."}

@app.get("/dashboard", include_in_schema=False)
async def serve_dashboard_redirect():
    """Redirect old dashboard to new generator page."""
    from fastapi.responses import RedirectResponse
    return RedirectResponse(url="/generator")


# ── Health check ────────────────────────────────────────
@app.get("/health", tags=["System"])
async def health_check():
    """System health check endpoint."""
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
    }


# Root is now handled above by serve_home()
