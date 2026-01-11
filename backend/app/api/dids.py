from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.core.database import get_db
from app.core.security import get_current_user
from app.models import DID, CustomerDID, Customer, User
from app.schemas import DIDCreate, DIDUpdate, DIDResponse, DIDImport, CustomerDIDCreate, CustomerDIDResponse
from app.services.asterisk import asterisk_service

router = APIRouter(prefix="/dids", tags=["DIDs"])


async def sync_dids_to_asterisk(db: AsyncSession):
    """Sincroniza DIDs com o Asterisk"""
    # Busca DIDs alocados
    dids_result = await db.execute(
        select(DID, CustomerDID)
        .outerjoin(CustomerDID, DID.id == CustomerDID.did_id)
    )
    dids_with_alloc = dids_result.all()
    
    # Busca clientes
    customers_result = await db.execute(select(Customer))
    customers = customers_result.scalars().all()
    
    dids_data = []
    for did, alloc in dids_with_alloc:
        dids_data.append({
            "number": did.number,
            "status": did.status,
            "customer_id": str(alloc.customer_id) if alloc else None,
            "destination": alloc.destination if alloc else None,
            "destination_type": alloc.destination_type if alloc else None,
        })
    
    customers_data = [
        {
            "id": str(c.id),
            "code": c.code,
            "name": c.name,
            "type": c.type,
            "trunk_ip": c.trunk_ip,
            "trunk_port": c.trunk_port,
        }
        for c in customers
    ]
    
    success = await asterisk_service.save_inbound_dids_config(dids_data, customers_data)
    
    if success:
        await asterisk_service.reload_dialplan()
    
    return success


@router.get("/", response_model=List[DIDResponse])
async def list_dids(
    skip: int = 0,
    limit: int = 100,
    status_filter: str = None,
    provider_id: UUID = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lista todos os DIDs"""
    query = select(DID)
    
    if status_filter:
        query = query.where(DID.status == status_filter)
    
    if provider_id:
        query = query.where(DID.provider_id == provider_id)
    
    result = await db.execute(query.offset(skip).limit(limit).order_by(DID.number))
    return result.scalars().all()


@router.get("/with-allocation")
async def list_dids_with_allocation(
    skip: int = 0,
    limit: int = 100,
    status_filter: str = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lista DIDs com informações de alocação"""
    from app.models import Gateway
    
    query = select(DID, CustomerDID, Customer, Gateway).outerjoin(
        CustomerDID, DID.id == CustomerDID.did_id
    ).outerjoin(
        Customer, CustomerDID.customer_id == Customer.id
    ).outerjoin(
        Gateway, DID.gateway_id == Gateway.id
    )
    
    if status_filter:
        query = query.where(DID.status == status_filter)
    
    result = await db.execute(query.offset(skip).limit(limit).order_by(DID.number))
    
    dids_list = []
    for did, alloc, customer, gateway in result.all():
        dids_list.append({
            "id": str(did.id),
            "number": did.number,
            "provider_id": str(did.provider_id) if did.provider_id else None,
            "gateway_id": str(did.gateway_id) if did.gateway_id else None,
            "gateway_name": gateway.name if gateway else None,
            "city": did.city,
            "state": did.state,
            "country": did.country,
            "monthly_cost": float(did.monthly_cost) if did.monthly_cost else 0,
            "status": did.status,
            "created_at": did.created_at.isoformat(),
            "customer_id": str(customer.id) if customer else None,
            "customer_name": customer.name if customer else None,
            "customer_code": customer.code if customer else None,
            "destination": alloc.destination if alloc else None,
            "destination_type": alloc.destination_type if alloc else None,
        })
    
    return dids_list


@router.get("/summary")
async def get_dids_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retorna resumo de DIDs por status"""
    result = await db.execute(
        select(DID.status, func.count(DID.id).label('total'))
        .group_by(DID.status)
    )
    
    summary = {row.status: row.total for row in result.all()}
    return summary


@router.get("/{did_id}", response_model=DIDResponse)
async def get_did(
    did_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtém um DID pelo ID"""
    result = await db.execute(select(DID).where(DID.id == did_id))
    did = result.scalar_one_or_none()
    
    if not did:
        raise HTTPException(status_code=404, detail="DID não encontrado")
    
    return did


@router.post("/", response_model=DIDResponse, status_code=status.HTTP_201_CREATED)
async def create_did(
    data: DIDCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Cria um novo DID"""
    # Verifica se número já existe
    result = await db.execute(select(DID).where(DID.number == data.number))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Número de DID já existe")
    
    did = DID(**data.model_dump())
    db.add(did)
    await db.commit()
    await db.refresh(did)
    return did


@router.post("/import")
async def import_dids(
    data: DIDImport,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Importa múltiplos DIDs"""
    imported = 0
    duplicated = 0
    
    for number in data.numbers:
        # Verifica se já existe
        result = await db.execute(select(DID).where(DID.number == number))
        if result.scalar_one_or_none():
            duplicated += 1
            continue
        
        did = DID(
            number=number,
            provider_id=data.provider_id,
            city=data.city,
            state=data.state
        )
        db.add(did)
        imported += 1
    
    await db.commit()
    
    return {
        "imported": imported,
        "duplicated": duplicated,
        "total": len(data.numbers)
    }


@router.put("/{did_id}", response_model=DIDResponse)
async def update_did(
    did_id: UUID,
    data: DIDUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Atualiza um DID"""
    result = await db.execute(select(DID).where(DID.id == did_id))
    did = result.scalar_one_or_none()
    
    if not did:
        raise HTTPException(status_code=404, detail="DID não encontrado")
    
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(did, field, value)
    
    await db.commit()
    await db.refresh(did)
    
    # Sincroniza com Asterisk
    await sync_dids_to_asterisk(db)
    
    return did


@router.delete("/{did_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_did(
    did_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Remove um DID"""
    result = await db.execute(select(DID).where(DID.id == did_id))
    did = result.scalar_one_or_none()
    
    if not did:
        raise HTTPException(status_code=404, detail="DID não encontrado")
    
    await db.delete(did)
    await db.commit()
    
    # Sincroniza com Asterisk
    await sync_dids_to_asterisk(db)


# ============================================
# ALOCAÇÃO DE DIDs
# ============================================

@router.post("/{did_id}/allocate", response_model=CustomerDIDResponse)
async def allocate_did(
    did_id: UUID,
    data: CustomerDIDCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Aloca um DID para um cliente"""
    # Verifica DID
    result = await db.execute(select(DID).where(DID.id == did_id))
    did = result.scalar_one_or_none()
    
    if not did:
        raise HTTPException(status_code=404, detail="DID não encontrado")
    
    if did.status != "available":
        raise HTTPException(status_code=400, detail="DID não está disponível")
    
    # Cria alocação
    customer_did = CustomerDID(
        customer_id=data.customer_id,
        did_id=did_id,
        destination_type=data.destination_type,
        destination=data.destination,
        monthly_price=data.monthly_price
    )
    
    # Atualiza status do DID
    did.status = "allocated"
    
    db.add(customer_did)
    await db.commit()
    await db.refresh(customer_did)
    
    # Sincroniza com Asterisk
    await sync_dids_to_asterisk(db)
    
    return customer_did


@router.post("/{did_id}/deallocate", status_code=status.HTTP_204_NO_CONTENT)
async def deallocate_did(
    did_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Desaloca um DID de um cliente"""
    # Verifica alocação
    result = await db.execute(select(CustomerDID).where(CustomerDID.did_id == did_id))
    customer_did = result.scalar_one_or_none()
    
    if not customer_did:
        raise HTTPException(status_code=404, detail="DID não está alocado")
    
    # Atualiza status do DID
    did_result = await db.execute(select(DID).where(DID.id == did_id))
    did = did_result.scalar_one_or_none()
    if did:
        did.status = "available"
    
    await db.delete(customer_did)
    await db.commit()
    
    # Sincroniza com Asterisk
    await sync_dids_to_asterisk(db)


@router.post("/sync", status_code=status.HTTP_200_OK)
async def sync_dids(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Força sincronização dos DIDs com o Asterisk"""
    success = await sync_dids_to_asterisk(db)
    
    if success:
        return {"message": "Sincronização realizada com sucesso"}
    else:
        raise HTTPException(status_code=500, detail="Erro na sincronização")
