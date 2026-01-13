from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import get_current_user
from app.models import Provider, User
from app.schemas import ProviderCreate, ProviderUpdate, ProviderResponse
from app.services.asterisk import asterisk_service

router = APIRouter()


async def sync_providers_to_asterisk(db: AsyncSession):
    """Sincroniza todos os provedores ativos com o Asterisk"""
    result = await db.execute(select(Provider).where(Provider.status == "active"))
    providers = result.scalars().all()
    
    providers_data = [
        {
            "name": p.name,
            "ip_address": p.ip_address,
            "port": p.port,
            "tech_prefix": p.tech_prefix,
            "codecs": "alaw,ulaw",
            "auth_type": p.auth_type,
            "username": p.username,
            "password": p.password,
            "status": p.status
        }
        for p in providers
    ]
    
    # Salva no arquivo
    success = await asterisk_service.save_providers_config(providers_data)
    
    if success:
        # Recarrega o Asterisk
        await asterisk_service.reload_pjsip()
    
    return success


@router.get("/", response_model=List[ProviderResponse])
async def list_providers(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lista todos os provedores"""
    result = await db.execute(
        select(Provider).offset(skip).limit(limit).order_by(Provider.name)
    )
    return result.scalars().all()


@router.get("/{provider_id}", response_model=ProviderResponse)
async def get_provider(
    provider_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtém um provedor pelo ID"""
    result = await db.execute(select(Provider).where(Provider.id == provider_id))
    provider = result.scalar_one_or_none()
    
    if not provider:
        raise HTTPException(status_code=404, detail="Provedor não encontrado")
    
    return provider


@router.post("/", response_model=ProviderResponse, status_code=status.HTTP_201_CREATED)
async def create_provider(
    data: ProviderCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Cria um novo provedor"""
    provider = Provider(**data.model_dump())
    db.add(provider)
    await db.commit()
    await db.refresh(provider)
    
    # Sincroniza com Asterisk
    await sync_providers_to_asterisk(db)
    
    return provider


@router.put("/{provider_id}", response_model=ProviderResponse)
async def update_provider(
    provider_id: UUID,
    data: ProviderUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Atualiza um provedor"""
    result = await db.execute(select(Provider).where(Provider.id == provider_id))
    provider = result.scalar_one_or_none()
    
    if not provider:
        raise HTTPException(status_code=404, detail="Provedor não encontrado")
    
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(provider, field, value)
    
    await db.commit()
    await db.refresh(provider)
    
    # Sincroniza com Asterisk
    await sync_providers_to_asterisk(db)
    
    return provider


@router.delete("/{provider_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_provider(
    provider_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Remove um provedor"""
    result = await db.execute(select(Provider).where(Provider.id == provider_id))
    provider = result.scalar_one_or_none()
    
    if not provider:
        raise HTTPException(status_code=404, detail="Provedor não encontrado")
    
    await db.delete(provider)
    await db.commit()
    
    # Sincroniza com Asterisk
    await sync_providers_to_asterisk(db)


@router.post("/sync", status_code=status.HTTP_200_OK)
async def sync_asterisk(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Força sincronização dos provedores com o Asterisk"""
    success = await sync_providers_to_asterisk(db)
    
    if success:
        return {"message": "Sincronização realizada com sucesso"}
    else:
        raise HTTPException(status_code=500, detail="Erro na sincronização")
