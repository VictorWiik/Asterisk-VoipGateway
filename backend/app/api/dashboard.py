from datetime import datetime, timedelta
from decimal import Decimal
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.core.database import get_db
from app.core.security import get_current_user
from app.models import Customer, DID, Extension, Provider, CDR, User
from app.schemas import DashboardStats

router = APIRouter()


@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retorna estatísticas gerais do dashboard"""
    
    # Total de clientes
    total_customers = await db.execute(select(func.count(Customer.id)))
    total_customers = total_customers.scalar() or 0
    
    # Clientes ativos
    active_customers = await db.execute(
        select(func.count(Customer.id)).where(Customer.status == "active")
    )
    active_customers = active_customers.scalar() or 0
    
    # Total de DIDs
    total_dids = await db.execute(select(func.count(DID.id)))
    total_dids = total_dids.scalar() or 0
    
    # DIDs alocados
    allocated_dids = await db.execute(
        select(func.count(DID.id)).where(DID.status == "allocated")
    )
    allocated_dids = allocated_dids.scalar() or 0
    
    # DIDs disponíveis
    available_dids = await db.execute(
        select(func.count(DID.id)).where(DID.status == "available")
    )
    available_dids = available_dids.scalar() or 0
    
    # Total de ramais
    total_extensions = await db.execute(select(func.count(Extension.id)))
    total_extensions = total_extensions.scalar() or 0
    
    # Total de provedores
    total_providers = await db.execute(select(func.count(Provider.id)))
    total_providers = total_providers.scalar() or 0
    
    # Chamadas de hoje
    today = datetime.utcnow().date()
    today_start = datetime.combine(today, datetime.min.time())
    
    calls_today = await db.execute(
        select(func.count(CDR.id)).where(CDR.start_time >= today_start)
    )
    total_calls_today = calls_today.scalar() or 0
    
    # Minutos de hoje
    minutes_today = await db.execute(
        select(func.sum(CDR.billsec)).where(CDR.start_time >= today_start)
    )
    total_minutes_today = (minutes_today.scalar() or 0) // 60
    
    # Receita de hoje
    revenue = await db.execute(
        select(func.sum(CDR.price)).where(CDR.start_time >= today_start)
    )
    revenue_today = revenue.scalar() or Decimal("0")
    
    return DashboardStats(
        total_customers=total_customers,
        active_customers=active_customers,
        total_dids=total_dids,
        allocated_dids=allocated_dids,
        available_dids=available_dids,
        total_extensions=total_extensions,
        total_providers=total_providers,
        total_calls_today=total_calls_today,
        total_minutes_today=total_minutes_today,
        revenue_today=revenue_today
    )


@router.get("/calls/by-hour")
async def get_calls_by_hour(
    days: int = 1,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retorna chamadas agrupadas por hora"""
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Busca CDRs do período
    result = await db.execute(
        select(CDR.start_time, CDR.billsec)
        .where(CDR.start_time >= start_date)
        .order_by(CDR.start_time)
    )
    rows = result.all()
    
    if not rows:
        return []
    
    # Agrupa manualmente por hora
    hourly_data = {}
    for row in rows:
        if row.start_time:
            hour_key = row.start_time.replace(minute=0, second=0, microsecond=0)
            if hour_key not in hourly_data:
                hourly_data[hour_key] = {"total_calls": 0, "total_seconds": 0}
            hourly_data[hour_key]["total_calls"] += 1
            hourly_data[hour_key]["total_seconds"] += row.billsec or 0
    
    return [
        {
            "hour": hour.isoformat(),
            "total_calls": data["total_calls"],
            "total_minutes": data["total_seconds"] // 60
        }
        for hour, data in sorted(hourly_data.items())
    ]


@router.get("/calls/by-destination")
async def get_calls_by_destination(
    days: int = 7,
    limit: int = 10,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retorna top destinos"""
    start_date = datetime.utcnow() - timedelta(days=days)
    
    result = await db.execute(
        select(
            func.substr(CDR.dst, 1, 4).label('prefix'),
            func.count(CDR.id).label('total_calls'),
            func.sum(CDR.billsec).label('total_seconds'),
            func.sum(CDR.cost).label('total_cost')
        )
        .where(CDR.start_time >= start_date)
        .group_by(func.substr(CDR.dst, 1, 4))
        .order_by(func.count(CDR.id).desc())
        .limit(limit)
    )
    
    return [
        {
            "prefix": row.prefix,
            "total_calls": row.total_calls,
            "total_minutes": (row.total_seconds or 0) // 60,
            "total_cost": float(row.total_cost or 0)
        }
        for row in result.all()
    ]


@router.get("/customers/top-consumption")
async def get_top_customers(
    days: int = 30,
    limit: int = 10,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retorna clientes com maior consumo"""
    start_date = datetime.utcnow() - timedelta(days=days)
    
    result = await db.execute(
        select(
            Customer.code,
            Customer.name,
            func.count(CDR.id).label('total_calls'),
            func.sum(CDR.billsec).label('total_seconds'),
            func.sum(CDR.price).label('total_price')
        )
        .join(CDR, CDR.customer_id == Customer.id)
        .where(CDR.start_time >= start_date)
        .group_by(Customer.id, Customer.code, Customer.name)
        .order_by(func.sum(CDR.billsec).desc())
        .limit(limit)
    )
    
    return [
        {
            "code": row.code,
            "name": row.name,
            "total_calls": row.total_calls,
            "total_minutes": (row.total_seconds or 0) // 60,
            "total_price": float(row.total_price or 0)
        }
        for row in result.all()
    ]


@router.get("/providers/usage")
async def get_providers_usage(
    days: int = 30,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retorna uso por provedor"""
    start_date = datetime.utcnow() - timedelta(days=days)
    
    result = await db.execute(
        select(
            Provider.name,
            func.count(CDR.id).label('total_calls'),
            func.sum(CDR.billsec).label('total_seconds'),
            func.sum(CDR.cost).label('total_cost')
        )
        .join(CDR, CDR.gateway_id == Provider.id)
        .where(CDR.start_time >= start_date)
        .group_by(Provider.id, Provider.name)
        .order_by(func.count(CDR.id).desc())
    )
    
    return [
        {
            "provider": row.name,
            "total_calls": row.total_calls,
            "total_minutes": (row.total_seconds or 0) // 60,
            "total_cost": float(row.total_cost or 0)
        }
        for row in result.all()
    ]
