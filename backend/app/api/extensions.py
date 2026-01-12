from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from pydantic import BaseModel
from uuid import UUID
from datetime import datetime

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.extension import Extension
from app.services.asterisk import AsteriskService
from app.services.ami import get_extensions_status, check_extension_online

router = APIRouter()

# Schemas
class ExtensionBase(BaseModel):
    extension: str
    name: Optional[str] = None
    secret: str
    customer_id: UUID
    context: Optional[str] = "from-internal"
    codecs: Optional[str] = "alaw,ulaw"
    callerid: Optional[str] = None
    status: Optional[str] = "active"

class ExtensionCreate(ExtensionBase):
    pass

class ExtensionUpdate(BaseModel):
    name: Optional[str] = None
    secret: Optional[str] = None
    context: Optional[str] = None
    codecs: Optional[str] = None
    callerid: Optional[str] = None
    status: Optional[str] = None

class ExtensionResponse(ExtensionBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    is_online: Optional[bool] = None

    class Config:
        from_attributes = True

# Endpoints
@router.get("/", response_model=List[ExtensionResponse])
async def list_extensions(
    skip: int = 0,
    limit: int = 100,
    customer_id: Optional[UUID] = None,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    query = select(Extension)
    if customer_id:
        query = query.where(Extension.customer_id == customer_id)
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    extensions = result.scalars().all()
    
    # Obter status online de todos os ramais
    try:
        online_status = get_extensions_status()
    except:
        online_status = {}
    
    # Adicionar status online a cada ramal
    response = []
    for ext in extensions:
        ext_dict = {
            "id": ext.id,
            "extension": ext.extension,
            "name": ext.name,
            "secret": ext.secret,
            "customer_id": ext.customer_id,
            "context": ext.context,
            "codecs": ext.codecs,
            "callerid": ext.callerid,
            "status": ext.status,
            "created_at": ext.created_at,
            "updated_at": ext.updated_at,
            "is_online": online_status.get(ext.extension, "Unavailable") != "Unavailable"
        }
        response.append(ext_dict)
    
    return response

@router.get("/status")
async def get_all_extensions_status(
    current_user = Depends(get_current_user)
):
    """Retorna status online/offline de todos os ramais"""
    try:
        status = get_extensions_status()
        return {
            "success": True,
            "extensions": status
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "extensions": {}
        }

@router.get("/{extension_id}", response_model=ExtensionResponse)
async def get_extension(
    extension_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    query = select(Extension).where(Extension.id == extension_id)
    result = await db.execute(query)
    extension = result.scalar_one_or_none()
    if not extension:
        raise HTTPException(status_code=404, detail="Ramal não encontrado")
    
    # Verificar status online
    is_online = check_extension_online(extension.extension)
    
    return {
        **extension.__dict__,
        "is_online": is_online
    }

@router.get("/{extension_id}/status")
async def get_extension_status(
    extension_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Retorna status online/offline de um ramal específico"""
    query = select(Extension).where(Extension.id == extension_id)
    result = await db.execute(query)
    extension = result.scalar_one_or_none()
    if not extension:
        raise HTTPException(status_code=404, detail="Ramal não encontrado")
    
    is_online = check_extension_online(extension.extension)
    
    return {
        "extension": extension.extension,
        "is_online": is_online
    }

@router.post("/", response_model=ExtensionResponse, status_code=201)
async def create_extension(
    extension_data: ExtensionCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # Verificar se ramal já existe
    query = select(Extension).where(Extension.extension == extension_data.extension)
    result = await db.execute(query)
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Ramal já existe")

    extension = Extension(**extension_data.model_dump())
    db.add(extension)
    await db.commit()
    await db.refresh(extension)

    # Sync com Asterisk
    try:
        asterisk = AsteriskService()
        await asterisk.sync_extensions(db)
    except Exception as e:
        print(f"Erro ao sincronizar com Asterisk: {e}")

    return {**extension.__dict__, "is_online": False}

@router.put("/{extension_id}", response_model=ExtensionResponse)
async def update_extension(
    extension_id: UUID,
    extension_data: ExtensionUpdate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    query = select(Extension).where(Extension.id == extension_id)
    result = await db.execute(query)
    extension = result.scalar_one_or_none()
    
    if not extension:
        raise HTTPException(status_code=404, detail="Ramal não encontrado")

    update_data = extension_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(extension, field, value)

    await db.commit()
    await db.refresh(extension)

    # Sync com Asterisk
    try:
        asterisk = AsteriskService()
        await asterisk.sync_extensions(db)
    except Exception as e:
        print(f"Erro ao sincronizar com Asterisk: {e}")

    is_online = check_extension_online(extension.extension)
    return {**extension.__dict__, "is_online": is_online}

@router.delete("/{extension_id}")
async def delete_extension(
    extension_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    query = select(Extension).where(Extension.id == extension_id)
    result = await db.execute(query)
    extension = result.scalar_one_or_none()
    
    if not extension:
        raise HTTPException(status_code=404, detail="Ramal não encontrado")

    await db.delete(extension)
    await db.commit()

    # Sync com Asterisk
    try:
        asterisk = AsteriskService()
        await asterisk.sync_extensions(db)
    except Exception as e:
        print(f"Erro ao sincronizar com Asterisk: {e}")

    return {"message": "Ramal excluído com sucesso"}

@router.post("/sync")
async def sync_extensions(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    try:
        asterisk = AsteriskService()
        await asterisk.sync_extensions(db)
        return {"message": "Ramais sincronizados com Asterisk"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
