from fastapi import APIRouter
from backend.app.api.health import router as health_router
from backend.app.api.auth import router as auth_router
from backend.app.api.users import router as users_router
from backend.app.api.dashboard import router as dashboard_router
from backend.app.api.events import router as events_router
from backend.app.api.ingestion import router as ingestion_router
from backend.app.api.detections import router as detections_router
from backend.app.api.alerts import router as alerts_router
from backend.app.api.cases import router as cases_router
from backend.app.api.entities import router as entities_router
from backend.app.api.intelligence import router as intelligence_router
from backend.app.api.reports import router as reports_router
from backend.app.api.settings import router as settings_router
from backend.app.api.playbooks import router as playbooks_router

api_v1_router = APIRouter(prefix="/api/v1")

api_v1_router.include_router(health_router)
api_v1_router.include_router(auth_router)
api_v1_router.include_router(users_router)
api_v1_router.include_router(dashboard_router)
api_v1_router.include_router(events_router)
api_v1_router.include_router(ingestion_router)
api_v1_router.include_router(detections_router)
api_v1_router.include_router(alerts_router)
api_v1_router.include_router(cases_router)
api_v1_router.include_router(entities_router)
api_v1_router.include_router(intelligence_router)
api_v1_router.include_router(reports_router)
api_v1_router.include_router(settings_router)
api_v1_router.include_router(playbooks_router)
