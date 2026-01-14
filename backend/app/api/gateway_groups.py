from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List, Optional
from pydantic import BaseModel
from uuid import UUID
from datetime import datetime

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.gateway_group import GatewayGroup
from app.models.gateway import Gateway
from app.models.provider import Provider

router = APIRouter()

# Schemas
class GatewayInfo(BaseModel):
    id: UUID
    name: str
    ip_address: Optional[str] = None
    status: str

    class Config:
        from_attributes = True

class ProviderInfo(BaseModel):
    id: UUID
    name: str

    class Config:
        from_attributes = True

class GatewayGroupBase(BaseModel):
    name: str
    description: Optional[str] = None
    provider_id: Optional[UUID] = None
    status: Optional[str] = "active"

class GatewayGroupCreate(GatewayGroupBase):
    pass

class GatewayGroupUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    provider_id: Optional[UUID] = None
    status: Optional[str] = None

class GatewayGroupResponse(GatewayGroupBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    provider: Optional[ProviderInfo] = None
    gateways: List[GatewayInfo] = []

    class Config:
        from_attributes = True

# Endpoints
@router.get("/", response_model=List[GatewayGroupResponse])
async def list_gateway_groups(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    query = select(GatewayGroup).options(
        selectinload(GatewayGroup.provider),
        selectinload(GatewayGroup.gateways)
    ).offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/{group_id}", response_model=GatewayGroupResponse)
async def get_gateway_group(
    group_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    query = select(GatewayGroup).options(
        selectinload(GatewayGroup.provider),
        selectinload(GatewayGroup.gateways)
    ).where(GatewayGroup.id == group_id)
    result = await db.execute(query)
    group = result.scalar_one_or_none()
    if not group:
        raise HTTPException(status_code=404, detail="Grupo de gateways não encontrado")
    return group

@router.post("/", response_model=GatewayGroupResponse, status_code=201)
async def create_gateway_group(
    group_data: GatewayGroupCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # Verificar se nome já existe
    query = select(GatewayGroup).where(GatewayGroup.name == group_data.name)
    result = await db.execute(query)
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Nome já existe")

    group = GatewayGroup(**group_data.model_dump())
    db.add(group)
    await db.commit()
    await db.refresh(group)

    # Recarregar com relacionamentos
    query = select(GatewayGroup).options(
        selectinload(GatewayGroup.provider),
        selectinload(GatewayGroup.gateways)
    ).where(GatewayGroup.id == group.id)
    result = await db.execute(query)
    return result.scalar_one()

@router.put("/{group_id}", response_model=GatewayGroupResponse)
async def update_gateway_group(
    group_id: UUID,
    group_data: GatewayGroupUpdate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    query = select(GatewayGroup).where(GatewayGroup.id == group_id)
    result = await db.execute(query)
    group = result.scalar_one_or_none()

    if not group:
        raise HTTPException(status_code=404, detail="Grupo de gateways não encontrado")

    update_data = group_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(group, field, value)

    await db.commit()

    # Recarregar com relacionamentos
    query = select(GatewayGroup).options(
        selectinload(GatewayGroup.provider),
        selectinload(GatewayGroup.gateways)
    ).where(GatewayGroup.id == group.id)
    result = await db.execute(query)
    return result.scalar_one()

@router.delete("/{group_id}")
async def delete_gateway_group(
    group_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    query = select(GatewayGroup).where(GatewayGroup.id == group_id)
    result = await db.execute(query)
    group = result.scalar_one_or_none()

    if not group:
        raise HTTPException(status_code=404, detail="Grupo de gateways não encontrado")

    await db.delete(group)
    await db.commit()
    return {"message": "Grupo de gateways excluído com sucesso"}
