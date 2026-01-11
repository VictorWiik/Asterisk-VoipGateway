from typing import List, Optional
from uuid import UUID
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import get_current_user
from app.models import Tariff, User

router = APIRouter(prefix="/tariffs", tags=["Tarifas"])


class TariffBase(BaseModel):
    name: str
    description: Optional[str] = None
    direction: str = "outbound"
    pattern: str = "_X."
    customer_id: Optional[UUID] = None
    cost_per_minute: Decimal = Decimal("0")
    price_per_minute: Decimal = Decimal("0")
    connection_fee: Decimal = Decimal("0")
    billing_increment: int = 6
    min_duration: int = 0


class TariffCreate(TariffBase):
    pass


class TariffUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    direction: Optional[str] = None
    pattern: Optional[str] = None
    customer_id: Optional[UUID] = None
    cost_per_minute: Optional[Decimal] = None
    price_per_minute: Optional[Decimal] = None
    connection_fee: Optional[Decimal] = None
    billing_increment: Optional[int] = None
    min_duration: Optional[int] = None
    status: Optional[str] = None


class TariffResponse(TariffBase):
    id: UUID
    status: str
    priority: int
    created_at: str

    class Config:
        from_attributes = True


@router.get("/")
async def list_tariffs(
    skip: int = 0,
    limit: int = 100,
    direction: str = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(Tariff)
    if direction:
        query = query.where(Tariff.direction == direction)
    
    result = await db.execute(
        query.offset(skip).limit(limit).order_by(Tariff.priority, Tariff.name)
    )
    tariffs = result.scalars().all()
    
    return [
        {
            "id": str(t.id),
            "name": t.name,
            "description": t.description,
            "direction": t.direction,
            "pattern": t.pattern,
            "customer_id": str(t.customer_id) if t.customer_id else None,
            "cost_per_minute": float(t.cost_per_minute or 0),
            "price_per_minute": float(t.price_per_minute or 0),
            "connection_fee": float(t.connection_fee or 0),
            "billing_increment": t.billing_increment,
            "min_duration": t.min_duration,
            "status": t.status,
            "priority": t.priority,
            "created_at": t.created_at.isoformat() if t.created_at else None
        }
        for t in tariffs
    ]


@router.get("/{tariff_id}")
async def get_tariff(
    tariff_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Tariff).where(Tariff.id == tariff_id))
    tariff = result.scalar_one_or_none()
    if not tariff:
        raise HTTPException(status_code=404, detail="Tarifa nao encontrada")
    return tariff


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_tariff(
    data: TariffCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    tariff = Tariff(**data.model_dump())
    db.add(tariff)
    await db.commit()
    await db.refresh(tariff)
    
    return {
        "id": str(tariff.id),
        "name": tariff.name,
        "description": tariff.description,
        "direction": tariff.direction,
        "pattern": tariff.pattern,
        "customer_id": str(tariff.customer_id) if tariff.customer_id else None,
        "cost_per_minute": float(tariff.cost_per_minute or 0),
        "price_per_minute": float(tariff.price_per_minute or 0),
        "connection_fee": float(tariff.connection_fee or 0),
        "billing_increment": tariff.billing_increment,
        "min_duration": tariff.min_duration,
        "status": tariff.status,
        "priority": tariff.priority,
        "created_at": tariff.created_at.isoformat() if tariff.created_at else None
    }


@router.put("/{tariff_id}")
async def update_tariff(
    tariff_id: UUID,
    data: TariffUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Tariff).where(Tariff.id == tariff_id))
    tariff = result.scalar_one_or_none()
    if not tariff:
        raise HTTPException(status_code=404, detail="Tarifa nao encontrada")
    
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(tariff, field, value)
    
    await db.commit()
    await db.refresh(tariff)
    
    return {
        "id": str(tariff.id),
        "name": tariff.name,
        "description": tariff.description,
        "direction": tariff.direction,
        "pattern": tariff.pattern,
        "customer_id": str(tariff.customer_id) if tariff.customer_id else None,
        "cost_per_minute": float(tariff.cost_per_minute or 0),
        "price_per_minute": float(tariff.price_per_minute or 0),
        "connection_fee": float(tariff.connection_fee or 0),
        "billing_increment": tariff.billing_increment,
        "min_duration": tariff.min_duration,
        "status": tariff.status,
        "priority": tariff.priority,
        "created_at": tariff.created_at.isoformat() if tariff.created_at else None
    }


@router.delete("/{tariff_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tariff(
    tariff_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Tariff).where(Tariff.id == tariff_id))
    tariff = result.scalar_one_or_none()
    if not tariff:
        raise HTTPException(status_code=404, detail="Tarifa nao encontrada")
    
    await db.delete(tariff)
    await db.commit()
