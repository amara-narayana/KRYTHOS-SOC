import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path

from backend.app.config import settings, BASE_DIR
from backend.app.database import init_db, SessionLocal
from backend.app.api.router import api_v1_router
from backend.app.core.logging_config import logger
from backend.app.services.detection_service import initialize_default_rules

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialize database tables and default rules
    logger.info("Initializing KRYTHOS SOC database and models...")
    init_db()
    with SessionLocal() as db:
        rules_added = initialize_default_rules(db)
        if rules_added:
            logger.info(f"Seeded {rules_added} built-in detection rules.")
    logger.info(f"{settings.APP_NAME} v{settings.APP_VERSION} initialized successfully.")
    yield
    # Shutdown
    logger.info(f"Shutting down {settings.APP_NAME}...")

app = FastAPI(
    title="KRYTHOS SOC",
    description="KRYTHOS Security Operations Platform - Local-first SIEM, security analytics, threat detection and incident response.",
    version=settings.APP_VERSION,
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

# CORS configuration for secure local web frontend access
origins = [
    "http://127.0.0.1:8000",
    "http://localhost:8000",
    "http://127.0.0.1:5173",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include v1 REST API
app.include_router(api_v1_router)

# Mount frontend build if it exists
frontend_dist = BASE_DIR / "frontend" / "dist"
if frontend_dist.exists() and (frontend_dist / "index.html").exists():
    app.mount("/assets", StaticFiles(directory=str(frontend_dist / "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # Don't intercept API calls
        if full_path.startswith("api"):
            raise HTTPException(status_code=404, detail="API endpoint not found")
        file_path = frontend_dist / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(frontend_dist / "index.html")
else:
    @app.get("/")
    def index():
        return {
            "name": settings.APP_NAME,
            "version": settings.APP_VERSION,
            "tagline": "Every Signal Connected. Every Threat Investigated.",
            "status": "online",
            "api_docs": "/api/docs"
        }
