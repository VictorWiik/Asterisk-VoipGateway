from fastapi import APIRouter
from app.api.auth import router as auth_router
from app.api.providers import router as providers_router
from app.api.customers import router as customers_router
from app.api.dids import router as dids_router
from app.api.dashboard import router as dashboard_router
from app.api.conference import router as conference_router
from app.api.gateways import router as gateways_router
from app.api.routes import router as routes_router
from app.api.extensions import router as extensions_router
from app.api.reports import router as reports_router
from app.api.tariffs import router as tariffs_router

api_router = APIRouter()

api_router.include_router(auth_router)
api_router.include_router(providers_router)
api_router.include_router(customers_router)
api_router.include_router(dids_router)
api_router.include_router(dashboard_router)
api_router.include_router(conference_router)
api_router.include_router(gateways_router)
api_router.include_router(routes_router)
api_router.include_router(extensions_router)
api_router.include_router(reports_router)
api_router.include_router(tariffs_router)
