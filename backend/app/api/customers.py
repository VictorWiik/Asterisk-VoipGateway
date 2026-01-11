from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import get_current_user
from app.models import Customer, User
from app.schemas import CustomerCreate, CustomerUpdate, CustomerResponse
from app.services.asterisk import asterisk_service

router = APIRouter(prefix="/customers", tags=["Clientes"])


async def sync_customer_trunks_to_asterisk(db: AsyncSession):
    """Sincroniza clientes trunk com o Asterisk"""
    result = await db.execute(select(Customer).where(Customer.type == "trunk"))
    customers = result.scalars().all()
    
    customers_data = [
        {
            "code": c.code,
            "name": c.name,
            "type": c.type,
            "status": c.status,
            "trunk_ip": c.trunk_ip,
            "trunk_port": c.trunk_port,
            "trunk_codecs": c.trunk_codecs,
            "trunk_auth_type": c.trunk_auth_type,
            "trunk_username": c.trunk_username,
            "trunk_password": c.trunk_password,
            "trunk_tech_prefix": c.trunk_tech_prefix,
            "trunk_context": c.trunk_context,
        }
        for c in customers
    ]
    
    success = await asterisk_service.save_customer_trunks_config(customers_data)
    
    if success:
        await asterisk_service.reload_pjsip()
    
    return success


@router.get("/", response_model=List[CustomerResponse])
async def list_customers(
    skip: int = 0,
    limit: int = 100,
    status_filter: str = None,
    type_filter: str = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lista todos os clientes"""
    query = select(Customer)
    
    if status_filter:
        query = query.where(Customer.status == status_filter)
    
    if type_filter:
        query = query.where(Customer.type == type_filter)
    
    result = await db.execute(query.offset(skip).limit(limit).order_by(Customer.name))
    return result.scalars().all()


@router.get("/{customer_id}", response_model=CustomerResponse)
async def get_customer(
    customer_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtém um cliente pelo ID"""
    result = await db.execute(select(Customer).where(Customer.id == customer_id))
    customer = result.scalar_one_or_none()
    
    if not customer:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    
    return customer


@router.post("/", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
async def create_customer(
    data: CustomerCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Cria um novo cliente"""
    # Verifica se código já existe
    result = await db.execute(select(Customer).where(Customer.code == data.code))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Código de cliente já existe")
    
    customer = Customer(**data.model_dump())
    db.add(customer)
    await db.commit()
    await db.refresh(customer)
    
    # Se for trunk, sincroniza com Asterisk
    if customer.type == "trunk":
        await sync_customer_trunks_to_asterisk(db)
    
    return customer


@router.put("/{customer_id}", response_model=CustomerResponse)
async def update_customer(
    customer_id: UUID,
    data: CustomerUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Atualiza um cliente"""
    result = await db.execute(select(Customer).where(Customer.id == customer_id))
    customer = result.scalar_one_or_none()
    
    if not customer:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    
    was_trunk = customer.type == "trunk"
    
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(customer, field, value)
    
    await db.commit()
    await db.refresh(customer)
    
    # Se era trunk ou virou trunk, sincroniza
    if was_trunk or customer.type == "trunk":
        await sync_customer_trunks_to_asterisk(db)
    
    return customer


@router.delete("/{customer_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_customer(
    customer_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Remove um cliente"""
    result = await db.execute(select(Customer).where(Customer.id == customer_id))
    customer = result.scalar_one_or_none()
    
    if not customer:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    
    was_trunk = customer.type == "trunk"
    
    await db.delete(customer)
    await db.commit()
    
    # Se era trunk, sincroniza para remover do Asterisk
    if was_trunk:
        await sync_customer_trunks_to_asterisk(db)


@router.post("/sync-trunks", status_code=status.HTTP_200_OK)
async def sync_trunks(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Força sincronização dos clientes trunk com o Asterisk"""
    success = await sync_customer_trunks_to_asterisk(db)
    
    if success:
        return {"message": "Sincronização realizada com sucesso"}
    else:
        raise HTTPException(status_code=500, detail="Erro na sincronização")
