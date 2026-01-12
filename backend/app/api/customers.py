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
from app.models.customer import Customer
from app.services.asterisk import AsteriskService

router = APIRouter()

# Schemas
class CustomerBase(BaseModel):
    code: str
    name: str
    type: Optional[str] = "trunk"
    trunk_ip: Optional[str] = None
    trunk_port: Optional[int] = 5060
    trunk_context: Optional[str] = "from-trunk"
    trunk_codecs: Optional[str] = "alaw,ulaw"
    tech_prefix: Optional[str] = None
    plan_id: Optional[UUID] = None
    status: Optional[str] = "active"

class CustomerCreate(CustomerBase):
    pass

class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    trunk_ip: Optional[str] = None
    trunk_port: Optional[int] = None
    trunk_context: Optional[str] = None
    trunk_codecs: Optional[str] = None
    tech_prefix: Optional[str] = None
    plan_id: Optional[UUID] = None
    status: Optional[str] = None

class CustomerResponse(CustomerBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Endpoints
@router.get("/", response_model=List[CustomerResponse])
async def list_customers(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    query = select(Customer)
    if search:
        query = query.where(
            (Customer.name.ilike(f"%{search}%")) | 
            (Customer.code.ilike(f"%{search}%"))
        )
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/{customer_id}", response_model=CustomerResponse)
async def get_customer(
    customer_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    query = select(Customer).where(Customer.id == customer_id)
    result = await db.execute(query)
    customer = result.scalar_one_or_none()
    if not customer:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    return customer

@router.post("/", response_model=CustomerResponse, status_code=201)
async def create_customer(
    customer_data: CustomerCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # Verificar se código já existe
    query = select(Customer).where(Customer.code == customer_data.code)
    result = await db.execute(query)
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Código já existe")

    customer = Customer(**customer_data.model_dump())
    db.add(customer)
    await db.commit()
    await db.refresh(customer)

    # Sync com Asterisk se for trunk
    if customer.type == "trunk" and customer.trunk_ip:
        try:
            asterisk = AsteriskService()
            await asterisk.sync_customer_trunks(db)
        except Exception as e:
            print(f"Erro ao sincronizar com Asterisk: {e}")

    return customer

@router.put("/{customer_id}", response_model=CustomerResponse)
async def update_customer(
    customer_id: UUID,
    customer_data: CustomerUpdate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    query = select(Customer).where(Customer.id == customer_id)
    result = await db.execute(query)
    customer = result.scalar_one_or_none()
    
    if not customer:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")

    update_data = customer_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(customer, field, value)

    await db.commit()
    await db.refresh(customer)

    # Sync com Asterisk se for trunk
    if customer.type == "trunk":
        try:
            asterisk = AsteriskService()
            await asterisk.sync_customer_trunks(db)
        except Exception as e:
            print(f"Erro ao sincronizar com Asterisk: {e}")

    return customer

@router.delete("/{customer_id}")
async def delete_customer(
    customer_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    query = select(Customer).where(Customer.id == customer_id)
    result = await db.execute(query)
    customer = result.scalar_one_or_none()
    
    if not customer:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")

    await db.delete(customer)
    await db.commit()

    # Sync com Asterisk
    try:
        asterisk = AsteriskService()
        await asterisk.sync_customer_trunks(db)
    except Exception as e:
        print(f"Erro ao sincronizar com Asterisk: {e}")

    return {"message": "Cliente excluído com sucesso"}
