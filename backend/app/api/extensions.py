from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from uuid import UUID

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.extension import Extension
from app.schemas import ExtensionCreate, ExtensionUpdate, ExtensionResponse
from app.services.asterisk_config import write_pjsip_extensions_async

router = APIRouter()

@router.get("/", response_model=List[ExtensionResponse])
async def list_extensions(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    result = await db.execute(select(Extension))
    return result.scalars().all()

@router.get("/{extension_id}", response_model=ExtensionResponse)
async def get_extension(
    extension_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    result = await db.execute(select(Extension).where(Extension.id == extension_id))
    ext = result.scalar_one_or_none()
    if not ext:
        raise HTTPException(status_code=404, detail="Ramal não encontrado")
    return ext

@router.post("/", response_model=ExtensionResponse)
async def create_extension(
    data: ExtensionCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # Verificar se extension já existe
    result = await db.execute(
        select(Extension).where(Extension.extension == data.extension)
    )
    existing = result.scalar_one_or_none()
    
    if existing:
        raise HTTPException(status_code=400, detail="Ramal já existe")
    
    ext = Extension(**data.model_dump())
    db.add(ext)
    await db.commit()
    await db.refresh(ext)
    
    # Regenerar arquivo PJSIP
    await write_pjsip_extensions_async(db)
    
    return ext

@router.put("/{extension_id}", response_model=ExtensionResponse)
async def update_extension(
    extension_id: UUID,
    data: ExtensionUpdate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    result = await db.execute(select(Extension).where(Extension.id == extension_id))
    ext = result.scalar_one_or_none()
    if not ext:
        raise HTTPException(status_code=404, detail="Ramal não encontrado")
    
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(ext, field, value)
    
    await db.commit()
    await db.refresh(ext)
    
    # Regenerar arquivo PJSIP
    await write_pjsip_extensions_async(db)
    
    return ext

@router.delete("/{extension_id}")
async def delete_extension(
    extension_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    result = await db.execute(select(Extension).where(Extension.id == extension_id))
    ext = result.scalar_one_or_none()
    if not ext:
        raise HTTPException(status_code=404, detail="Ramal não encontrado")
    
    await db.delete(ext)
    await db.commit()
    
    # Regenerar arquivo PJSIP
    await write_pjsip_extensions_async(db)
    
    return {"message": "Ramal excluído com sucesso"}

@router.post("/regenerate-config")
async def regenerate_pjsip_config(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Força a regeneração do arquivo pjsip_extensions.conf"""
    success = await write_pjsip_extensions_async(db)
    if success:
        return {"message": "Arquivo pjsip_extensions.conf regenerado com sucesso"}
    else:
        raise HTTPException(status_code=500, detail="Erro ao regenerar arquivo")
