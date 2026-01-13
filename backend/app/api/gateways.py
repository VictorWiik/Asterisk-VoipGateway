from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import get_current_user
from app.models import Gateway, User
from app.schemas import GatewayCreate, GatewayUpdate, GatewayResponse
from app.services.asterisk import asterisk_service

router = APIRouter()


async def sync_gateways_to_asterisk(db: AsyncSession):
    """Sincroniza gateways com o Asterisk"""
    result = await db.execute(select(Gateway))
    gateways = result.scalars().all()
    
    gateways_data = [
        {
            "name": g.name,
            "status": g.status,
            "ip_address": g.ip_address,
            "port": g.port,
            "codecs": g.codecs,
            "context": g.context,
            "auth_type": g.auth_type,
            "username": g.username,
            "password": g.password,
        }
        for g in gateways
    ]
    
    success = await asterisk_service.save_gateways_config(gateways_data)
    
    if success:
        await asterisk_service.reload_pjsip()
    
    return success


@router.get("/", response_model=List[GatewayResponse])
async def list_gateways(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(Gateway).offset(skip).limit(limit).order_by(Gateway.name)
    )
    return result.scalars().all()


@router.get("/{gateway_id}", response_model=GatewayResponse)
async def get_gateway(
    gateway_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Gateway).where(Gateway.id == gateway_id))
    gateway = result.scalar_one_or_none()
    if not gateway:
        raise HTTPException(status_code=404, detail="Gateway nao encontrado")
    return gateway


@router.post("/", response_model=GatewayResponse, status_code=status.HTTP_201_CREATED)
async def create_gateway(
    data: GatewayCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    gateway = Gateway(**data.model_dump())
    db.add(gateway)
    await db.commit()
    await db.refresh(gateway)
    
    # Sincroniza com Asterisk
    await sync_gateways_to_asterisk(db)
    
    return gateway


@router.put("/{gateway_id}", response_model=GatewayResponse)
async def update_gateway(
    gateway_id: UUID,
    data: GatewayUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Gateway).where(Gateway.id == gateway_id))
    gateway = result.scalar_one_or_none()
    if not gateway:
        raise HTTPException(status_code=404, detail="Gateway nao encontrado")
    
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(gateway, field, value)
    
    await db.commit()
    await db.refresh(gateway)
    
    # Sincroniza com Asterisk
    await sync_gateways_to_asterisk(db)
    
    return gateway


@router.delete("/{gateway_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_gateway(
    gateway_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Gateway).where(Gateway.id == gateway_id))
    gateway = result.scalar_one_or_none()
    if not gateway:
        raise HTTPException(status_code=404, detail="Gateway nao encontrado")
    
    await db.delete(gateway)
    await db.commit()
    
    # Sincroniza com Asterisk
    await sync_gateways_to_asterisk(db)


@router.post("/sync", status_code=status.HTTP_200_OK)
async def sync_gateways(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Força sincronização dos gateways com o Asterisk"""
    success = await sync_gateways_to_asterisk(db)
    
    if success:
        return {"message": "Sincronização realizada com sucesso"}
    else:
        raise HTTPException(status_code=500, detail="Erro na sincronização")
