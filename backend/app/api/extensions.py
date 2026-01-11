from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import get_current_user
from app.models import Extension, User
from app.schemas import ExtensionCreate, ExtensionUpdate, ExtensionResponse
from app.services.asterisk import asterisk_service

router = APIRouter(prefix="/extensions", tags=["Ramais"])


async def sync_extensions_to_asterisk(db: AsyncSession):
    """Sincroniza ramais com o Asterisk"""
    result = await db.execute(select(Extension))
    extensions = result.scalars().all()
    
    extensions_data = [
        {
            "extension": e.extension,
            "name": e.name,
            "secret": e.secret,
            "context": e.context,
            "codecs": e.codecs,
            "max_contacts": e.max_contacts,
            "callerid": e.callerid,
            "status": e.status,
        }
        for e in extensions
    ]
    
    success = await asterisk_service.save_extensions_pjsip_config(extensions_data)
    
    if success:
        await asterisk_service.reload_pjsip()
    
    return success


@router.get("/", response_model=List[ExtensionResponse])
async def list_extensions(
    skip: int = 0,
    limit: int = 100,
    customer_id: UUID = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(Extension)
    if customer_id:
        query = query.where(Extension.customer_id == customer_id)
    
    result = await db.execute(
        query.offset(skip).limit(limit).order_by(Extension.extension)
    )
    return result.scalars().all()


@router.get("/{extension_id}", response_model=ExtensionResponse)
async def get_extension(
    extension_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Extension).where(Extension.id == extension_id))
    extension = result.scalar_one_or_none()
    if not extension:
        raise HTTPException(status_code=404, detail="Ramal nao encontrado")
    return extension


@router.post("/", response_model=ExtensionResponse, status_code=status.HTTP_201_CREATED)
async def create_extension(
    data: ExtensionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verifica se ramal já existe para o cliente
    result = await db.execute(
        select(Extension).where(
            Extension.customer_id == data.customer_id,
            Extension.extension == data.extension
        )
    )
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Ramal ja existe para este cliente")
    
    extension = Extension(**data.model_dump())
    db.add(extension)
    await db.commit()
    await db.refresh(extension)
    
    # Sincroniza com Asterisk
    await sync_extensions_to_asterisk(db)
    
    return extension


@router.put("/{extension_id}", response_model=ExtensionResponse)
async def update_extension(
    extension_id: UUID,
    data: ExtensionUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Extension).where(Extension.id == extension_id))
    extension = result.scalar_one_or_none()
    if not extension:
        raise HTTPException(status_code=404, detail="Ramal nao encontrado")
    
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(extension, field, value)
    
    await db.commit()
    await db.refresh(extension)
    
    # Sincroniza com Asterisk
    await sync_extensions_to_asterisk(db)
    
    return extension


@router.delete("/{extension_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_extension(
    extension_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Extension).where(Extension.id == extension_id))
    extension = result.scalar_one_or_none()
    if not extension:
        raise HTTPException(status_code=404, detail="Ramal nao encontrado")
    
    await db.delete(extension)
    await db.commit()
    
    # Sincroniza com Asterisk
    await sync_extensions_to_asterisk(db)


@router.post("/sync", status_code=status.HTTP_200_OK)
async def sync_extensions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Força sincronização dos ramais com o Asterisk"""
    success = await sync_extensions_to_asterisk(db)
    
    if success:
        return {"message": "Sincronização realizada com sucesso"}
    else:
        raise HTTPException(status_code=500, detail="Erro na sincronização")
