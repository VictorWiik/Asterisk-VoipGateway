from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, insert
from sqlalchemy.orm import selectinload
from typing import List, Optional
from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from decimal import Decimal

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.tariff_plan import TariffPlan, tariff_plan_tariffs
from app.models.tariff import Tariff

router = APIRouter()

# Schemas
class TariffInfo(BaseModel):
    id: UUID
    name: str
    prefix: str
    price_per_minute: Decimal

    class Config:
        from_attributes = True

class TariffPlanBase(BaseModel):
    name: str
    description: Optional[str] = None
    status: Optional[str] = "active"

class TariffPlanCreate(TariffPlanBase):
    tariff_ids: Optional[List[UUID]] = []

class TariffPlanUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    tariff_ids: Optional[List[UUID]] = None

class TariffPlanResponse(TariffPlanBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    tariffs: List[TariffInfo] = []

    class Config:
        from_attributes = True

# Endpoints
@router.get("/", response_model=List[TariffPlanResponse])
async def list_tariff_plans(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    query = select(TariffPlan).options(selectinload(TariffPlan.tariffs)).offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/{plan_id}", response_model=TariffPlanResponse)
async def get_tariff_plan(
    plan_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    query = select(TariffPlan).options(selectinload(TariffPlan.tariffs)).where(TariffPlan.id == plan_id)
    result = await db.execute(query)
    plan = result.scalar_one_or_none()
    if not plan:
        raise HTTPException(status_code=404, detail="Plano de tarifas não encontrado")
    return plan

@router.post("/", response_model=TariffPlanResponse, status_code=201)
async def create_tariff_plan(
    plan_data: TariffPlanCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # Verificar se nome já existe
    query = select(TariffPlan).where(TariffPlan.name == plan_data.name)
    result = await db.execute(query)
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Nome já existe")

    # Criar plano
    plan = TariffPlan(
        name=plan_data.name,
        description=plan_data.description,
        status=plan_data.status
    )
    db.add(plan)
    await db.flush()

    # Associar tarifas
    if plan_data.tariff_ids:
        for tariff_id in plan_data.tariff_ids:
            stmt = insert(tariff_plan_tariffs).values(tariff_plan_id=plan.id, tariff_id=tariff_id)
            await db.execute(stmt)

    await db.commit()

    # Recarregar com tarifas
    query = select(TariffPlan).options(selectinload(TariffPlan.tariffs)).where(TariffPlan.id == plan.id)
    result = await db.execute(query)
    return result.scalar_one()

@router.put("/{plan_id}", response_model=TariffPlanResponse)
async def update_tariff_plan(
    plan_id: UUID,
    plan_data: TariffPlanUpdate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    query = select(TariffPlan).where(TariffPlan.id == plan_id)
    result = await db.execute(query)
    plan = result.scalar_one_or_none()

    if not plan:
        raise HTTPException(status_code=404, detail="Plano de tarifas não encontrado")

    # Atualizar campos
    if plan_data.name is not None:
        plan.name = plan_data.name
    if plan_data.description is not None:
        plan.description = plan_data.description
    if plan_data.status is not None:
        plan.status = plan_data.status

    # Atualizar tarifas
    if plan_data.tariff_ids is not None:
        stmt = delete(tariff_plan_tariffs).where(tariff_plan_tariffs.c.tariff_plan_id == plan_id)
        await db.execute(stmt)
        
        for tariff_id in plan_data.tariff_ids:
            stmt = insert(tariff_plan_tariffs).values(tariff_plan_id=plan_id, tariff_id=tariff_id)
            await db.execute(stmt)

    await db.commit()

    # Recarregar com tarifas
    query = select(TariffPlan).options(selectinload(TariffPlan.tariffs)).where(TariffPlan.id == plan_id)
    result = await db.execute(query)
    return result.scalar_one()

@router.delete("/{plan_id}")
async def delete_tariff_plan(
    plan_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    query = select(TariffPlan).where(TariffPlan.id == plan_id)
    result = await db.execute(query)
    plan = result.scalar_one_or_none()

    if not plan:
        raise HTTPException(status_code=404, detail="Plano de tarifas não encontrado")

    # Remover associações
    stmt = delete(tariff_plan_tariffs).where(tariff_plan_tariffs.c.tariff_plan_id == plan_id)
    await db.execute(stmt)

    await db.delete(plan)
    await db.commit()
    return {"message": "Plano de tarifas excluído com sucesso"}
