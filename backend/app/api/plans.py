from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, insert
from sqlalchemy.orm import selectinload
from typing import List, Optional
from pydantic import BaseModel
from uuid import UUID
from datetime import datetime

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.plan import Plan, plan_routes
from app.models.route import Route

router = APIRouter()

# Schemas
class RouteInfo(BaseModel):
    id: UUID
    name: str
    pattern: str

    class Config:
        from_attributes = True

class PlanBase(BaseModel):
    name: str
    description: Optional[str] = None
    max_channels: Optional[int] = 0
    status: Optional[str] = "active"

class PlanCreate(PlanBase):
    route_ids: Optional[List[UUID]] = []

class PlanUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    max_channels: Optional[int] = None
    status: Optional[str] = None
    route_ids: Optional[List[UUID]] = None

class PlanResponse(PlanBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    routes: List[RouteInfo] = []

    class Config:
        from_attributes = True

# Endpoints
@router.get("/", response_model=List[PlanResponse])
async def list_plans(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    query = select(Plan).options(selectinload(Plan.routes)).offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/{plan_id}", response_model=PlanResponse)
async def get_plan(
    plan_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    query = select(Plan).options(selectinload(Plan.routes)).where(Plan.id == plan_id)
    result = await db.execute(query)
    plan = result.scalar_one_or_none()
    if not plan:
        raise HTTPException(status_code=404, detail="Plano não encontrado")
    return plan

@router.post("/", response_model=PlanResponse, status_code=201)
async def create_plan(
    plan_data: PlanCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # Verificar se nome já existe
    query = select(Plan).where(Plan.name == plan_data.name)
    result = await db.execute(query)
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Nome já existe")

    # Criar plano
    plan = Plan(
        name=plan_data.name,
        description=plan_data.description,
        max_channels=plan_data.max_channels,
        status=plan_data.status
    )
    db.add(plan)
    await db.flush()

    # Associar rotas usando insert direto na tabela de associação
    if plan_data.route_ids:
        for route_id in plan_data.route_ids:
            stmt = insert(plan_routes).values(plan_id=plan.id, route_id=route_id)
            await db.execute(stmt)

    await db.commit()

    # Recarregar com rotas
    query = select(Plan).options(selectinload(Plan.routes)).where(Plan.id == plan.id)
    result = await db.execute(query)
    return result.scalar_one()

@router.put("/{plan_id}", response_model=PlanResponse)
async def update_plan(
    plan_id: UUID,
    plan_data: PlanUpdate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    query = select(Plan).where(Plan.id == plan_id)
    result = await db.execute(query)
    plan = result.scalar_one_or_none()

    if not plan:
        raise HTTPException(status_code=404, detail="Plano não encontrado")

    # Atualizar campos
    if plan_data.name is not None:
        plan.name = plan_data.name
    if plan_data.description is not None:
        plan.description = plan_data.description
    if plan_data.max_channels is not None:
        plan.max_channels = plan_data.max_channels
    if plan_data.status is not None:
        plan.status = plan_data.status

    # Atualizar rotas
    if plan_data.route_ids is not None:
        # Remover rotas antigas
        stmt = delete(plan_routes).where(plan_routes.c.plan_id == plan_id)
        await db.execute(stmt)
        
        # Adicionar novas rotas
        for route_id in plan_data.route_ids:
            stmt = insert(plan_routes).values(plan_id=plan_id, route_id=route_id)
            await db.execute(stmt)

    await db.commit()

    # Recarregar com rotas
    query = select(Plan).options(selectinload(Plan.routes)).where(Plan.id == plan_id)
    result = await db.execute(query)
    return result.scalar_one()

@router.delete("/{plan_id}")
async def delete_plan(
    plan_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    query = select(Plan).where(Plan.id == plan_id)
    result = await db.execute(query)
    plan = result.scalar_one_or_none()

    if not plan:
        raise HTTPException(status_code=404, detail="Plano não encontrado")

    # Remover associações primeiro
    stmt = delete(plan_routes).where(plan_routes.c.plan_id == plan_id)
    await db.execute(stmt)

    await db.delete(plan)
    await db.commit()
    return {"message": "Plano excluído com sucesso"}
