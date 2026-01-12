from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import auth, customers, providers, gateways, dids, routes, extensions, tariffs, dashboard, reports, conference, plans

app = FastAPI(title="TrunkFlow API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(dashboard.router, prefix="/api/v1/dashboard", tags=["Dashboard"])
app.include_router(customers.router, prefix="/api/v1/customers", tags=["Customers"])
app.include_router(providers.router, prefix="/api/v1/providers", tags=["Providers"])
app.include_router(gateways.router, prefix="/api/v1/gateways", tags=["Gateways"])
app.include_router(dids.router, prefix="/api/v1/dids", tags=["DIDs"])
app.include_router(routes.router, prefix="/api/v1/routes", tags=["Routes"])
app.include_router(extensions.router, prefix="/api/v1/extensions", tags=["Extensions"])
app.include_router(tariffs.router, prefix="/api/v1/tariffs", tags=["Tariffs"])
app.include_router(reports.router, prefix="/api/v1/reports", tags=["Reports"])
app.include_router(conference.router, prefix="/api/v1/conference", tags=["Conference"])
app.include_router(plans.router, prefix="/api/v1/plans", tags=["Plans"])

@app.get("/api/v1/health")
async def health_check():
    return {"status": "healthy"}
