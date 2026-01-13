import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import get_current_user
from app.models import Provider, User
from app.services.asterisk import asterisk_service

router = APIRouter()


class ConferenceRequest(BaseModel):
    number1: str
    number2: str
    callerid: Optional[str] = "Conferencia"


class ConferenceResponse(BaseModel):
    success: bool
    conference_id: Optional[str] = None
    number1: Optional[str] = None
    number2: Optional[str] = None
    provider1: Optional[str] = None
    provider2: Optional[str] = None
    error: Optional[str] = None


@router.post("/create", response_model=ConferenceResponse)
async def create_conference(
    data: ConferenceRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Cria uma conferência entre dois números"""
    
    # Busca provedores ativos
    result = await db.execute(select(Provider).where(Provider.status == "active"))
    providers = result.scalars().all()
    
    if not providers:
        raise HTTPException(status_code=400, detail="Nenhum provedor ativo encontrado")
    
    providers_data = [
        {
            "name": p.name,
            "type": p.type,
            "ip_address": p.ip_address,
            "port": p.port,
            "tech_prefix": p.tech_prefix,
            "status": p.status
        }
        for p in providers
    ]
    
    # Gera ID da conferência
    conference_id = f"conf-{uuid.uuid4().hex[:8]}"
    
    # Cria a conferência
    result = await asterisk_service.create_conference(
        number1=data.number1,
        number2=data.number2,
        conference_id=conference_id,
        providers=providers_data,
        callerid=data.callerid
    )
    
    return ConferenceResponse(**result)


@router.get("/active")
async def get_active_conferences(
    current_user: User = Depends(get_current_user)
):
    """Lista conferências ativas"""
    channels = await asterisk_service.get_active_channels()
    
    # Filtra apenas canais de conferência
    conferences = {}
    for channel in channels:
        if channel.get('application') == 'ConfBridge':
            conf_id = channel.get('data', '').split(',')[0]
            if conf_id not in conferences:
                conferences[conf_id] = {
                    'conference_id': conf_id,
                    'participants': []
                }
            conferences[conf_id]['participants'].append({
                'channel': channel.get('channel'),
                'state': channel.get('state')
            })
    
    return list(conferences.values())
