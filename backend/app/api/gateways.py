from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from pydantic import BaseModel
from uuid import UUID
from datetime import datetime

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.gateway import Gateway
from app.services.asterisk import AsteriskService

router = APIRouter()

class GatewayBase(BaseModel):
    name: str
    description: Optional[str] = None
    ip_address: Optional[str] = None
    port: Optional[int] = 5060
    context: Optional[str] = "from-trunk"
    codecs: Optional[str] = "alaw,ulaw"
    dtmf_mode: Optional[str] = "rfc2833"
    qualify: Optional[str] = "yes"
    max_channels: Optional[int] = 0
    tech_prefix: Optional[str] = None
    auth_type: Optional[str] = "ip"
    username: Optional[str] = None
    password: Optional[str] = None
    provider_id: Optional[UUID] = None
    gateway_group_id: Optional[UUID] = None
    status: Optional[str] = "active"

class GatewayCreate(GatewayBase):
    pass

class GatewayUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    ip_address: Optional[str] = None
    port: Optional[int] = None
    context: Optional[str] = None
    codecs: Optional[str] = None
    dtmf_mode: Optional[str] = None
    qualify: Optional[str] = None
    max_channels: Optional[int] = None
    tech_prefix: Optional[str] = None
    auth_type: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None
    provider_id: Optional[UUID] = None
    gateway_group_id: Optional[UUID] = None
    status: Optional[str] = None

class GatewayResponse(GatewayBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    class Config:
        from_attributes = True

@router.get("/", response_model=List[GatewayResponse])
async def list_gateways(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db), current_user = Depends(get_current_user)):
    query = select(Gateway).offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/{gateway_id}", response_model=GatewayResponse)
async def get_gateway(gateway_id: UUID, db: AsyncSession = Depends(get_db), current_user = Depends(get_current_user)):
    query = select(Gateway).where(Gateway.id == gateway_id)
    result = await db.execute(query)
    gateway = result.scalar_one_or_none()
    if not gateway:
        raise HTTPException(status_code=404, detail="Gateway não encontrado")
    return gateway

@router.post("/", response_model=GatewayResponse, status_code=201)
async def create_gateway(gateway_data: GatewayCreate, db: AsyncSession = Depends(get_db), current_user = Depends(get_current_user)):
    gateway = Gateway(**gateway_data.model_dump())
    db.add(gateway)
    await db.commit()
    await db.refresh(gateway)
    try:
        asterisk = AsteriskService()
        await asterisk.sync_gateways(db)
    except Exception as e:
        print(f"Erro ao sincronizar com Asterisk: {e}")
    return gateway

@router.put("/{gateway_id}", response_model=GatewayResponse)
async def update_gateway(gateway_id: UUID, gateway_data: GatewayUpdate, db: AsyncSession = Depends(get_db), current_user = Depends(get_current_user)):
    query = select(Gateway).where(Gateway.id == gateway_id)
    result = await db.execute(query)
    gateway = result.scalar_one_or_none()
    if not gateway:
        raise HTTPException(status_code=404, detail="Gateway não encontrado")
    update_data = gateway_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(gateway, field, value)
    await db.commit()
    await db.refresh(gateway)
    try:
        asterisk = AsteriskService()
        await asterisk.sync_gateways(db)
    except Exception as e:
        print(f"Erro ao sincronizar com Asterisk: {e}")
    return gateway

@router.delete("/{gateway_id}")
async def delete_gateway(gateway_id: UUID, db: AsyncSession = Depends(get_db), current_user = Depends(get_current_user)):
    query = select(Gateway).where(Gateway.id == gateway_id)
    result = await db.execute(query)
    gateway = result.scalar_one_or_none()
    if not gateway:
        raise HTTPException(status_code=404, detail="Gateway não encontrado")
    await db.delete(gateway)
    await db.commit()
    try:
        asterisk = AsteriskService()
        await asterisk.sync_gateways(db)
    except Exception as e:
        print(f"Erro ao sincronizar com Asterisk: {e}")
    return {"message": "Gateway excluído com sucesso"}
