from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import get_current_user
from app.models import Route, Gateway, User
from app.schemas import RouteCreate, RouteUpdate, RouteResponse
from app.services.asterisk import asterisk_service

router = APIRouter()


async def sync_routes_to_asterisk(db: AsyncSession):
    """Sincroniza rotas com o Asterisk"""
    # Busca rotas
    routes_result = await db.execute(select(Route))
    routes = routes_result.scalars().all()
    
    # Busca gateways
    gateways_result = await db.execute(select(Gateway))
    gateways = gateways_result.scalars().all()
    
    routes_data = [
        {
            "id": str(r.id),
            "name": r.name,
            "pattern": r.pattern,
            "gateway_id": str(r.gateway_id) if r.gateway_id else None,
            "priority": r.priority,
            "status": r.status,
        }
        for r in routes
    ]
    
    gateways_data = [
        {
            "id": str(g.id),
            "name": g.name,
            "tech_prefix": g.tech_prefix,
        }
        for g in gateways
    ]
    
    success = await asterisk_service.save_outbound_routes_config(routes_data, gateways_data)
    
    if success:
        await asterisk_service.reload_dialplan()
    
    return success


@router.get("/", response_model=List[RouteResponse])
async def list_routes(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(Route).offset(skip).limit(limit).order_by(Route.priority, Route.name)
    )
    return result.scalars().all()


@router.get("/{route_id}", response_model=RouteResponse)
async def get_route(
    route_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Route).where(Route.id == route_id))
    route = result.scalar_one_or_none()
    if not route:
        raise HTTPException(status_code=404, detail="Rota nao encontrada")
    return route


@router.post("/", response_model=RouteResponse, status_code=status.HTTP_201_CREATED)
async def create_route(
    data: RouteCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    route = Route(**data.model_dump())
    db.add(route)
    await db.commit()
    await db.refresh(route)
    
    # Sincroniza com Asterisk
    await sync_routes_to_asterisk(db)
    
    return route


@router.put("/{route_id}", response_model=RouteResponse)
async def update_route(
    route_id: UUID,
    data: RouteUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Route).where(Route.id == route_id))
    route = result.scalar_one_or_none()
    if not route:
        raise HTTPException(status_code=404, detail="Rota nao encontrada")
    
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(route, field, value)
    
    await db.commit()
    await db.refresh(route)
    
    # Sincroniza com Asterisk
    await sync_routes_to_asterisk(db)
    
    return route


@router.delete("/{route_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_route(
    route_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Route).where(Route.id == route_id))
    route = result.scalar_one_or_none()
    if not route:
        raise HTTPException(status_code=404, detail="Rota nao encontrada")
    
    await db.delete(route)
    await db.commit()
    
    # Sincroniza com Asterisk
    await sync_routes_to_asterisk(db)


@router.post("/sync", status_code=status.HTTP_200_OK)
async def sync_routes(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Força sincronização das rotas com o Asterisk"""
    success = await sync_routes_to_asterisk(db)
    
    if success:
        return {"message": "Sincronização realizada com sucesso"}
    else:
        raise HTTPException(status_code=500, detail="Erro na sincronização")
