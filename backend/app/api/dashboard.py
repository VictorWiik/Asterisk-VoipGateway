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

    # Chamadas de hoje - usando calldate
    today = datetime.utcnow().date()
    today_start = datetime.combine(today, datetime.min.time())

    calls_today = await db.execute(
        select(func.count(CDR.id)).where(CDR.calldate >= today_start)
    )
    total_calls_today = calls_today.scalar() or 0

    # Minutos de hoje
    minutes_today = await db.execute(
        select(func.sum(CDR.billsec)).where(CDR.calldate >= today_start)
    )
    total_seconds_today = minutes_today.scalar() or 0

    # Receita de hoje
    revenue = await db.execute(
        select(func.sum(CDR.price)).where(CDR.calldate >= today_start)
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
        total_minutes_today=total_seconds_today // 60 if total_seconds_today >= 60 else total_seconds_today,
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

    result = await db.execute(
        select(CDR.calldate, CDR.billsec)
        .where(CDR.calldate >= start_date)
        .order_by(CDR.calldate)
    )
    rows = result.all()

    if not rows:
        return []

    hourly_data = {}
    for row in rows:
        if row.calldate:
            hour_key = row.calldate.replace(minute=0, second=0, microsecond=0)
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
        .where(CDR.calldate >= start_date)
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
        .where(CDR.calldate >= start_date)
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
        .where(CDR.calldate >= start_date)
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


@router.get("/calls/live")
async def get_live_calls(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retorna chamadas em andamento via AMI"""
    import subprocess
    import re
    
    try:
        result = subprocess.run(
            ['/usr/sbin/asterisk', '-rx', 'core show channels concise'],
            capture_output=True,
            text=True,
            timeout=5
        )
        
        lines = result.stdout.strip().split('\n')
        live_calls = []
        
        for line in lines:
            if not line or 'active' in line.lower():
                continue
                
            parts = line.split('!')
            if len(parts) >= 7:
                channel = parts[0]
                context = parts[1] if len(parts) > 1 else ''
                extension = parts[2] if len(parts) > 2 else ''
                state = parts[4] if len(parts) > 4 else ''
                duration = parts[11] if len(parts) > 11 else '0'
                
                src = ''
                if 'PJSIP/' in channel:
                    match = re.search(r'PJSIP/(\d+)', channel)
                    if match:
                        src = match.group(1)
                
                direction = 'outbound'
                if context == 'from-trunk' or 'inbound' in context.lower():
                    direction = 'inbound'
                
                if state in ['Up', 'Ring', 'Ringing']:
                    live_calls.append({
                        'channel': channel,
                        'src': src or channel.split('/')[1].split('-')[0] if '/' in channel else '',
                        'dst': extension,
                        'direction': direction,
                        'state': state,
                        'duration': duration,
                        'start_time': datetime.utcnow().isoformat(),
                        'customer_name': None,
                        'gateway_name': None,
                        'did': None
                    })
        
        return live_calls
        
    except Exception as e:
        print(f"Erro ao buscar chamadas ao vivo: {e}")
        return []


@router.get("/calls/recent")
async def get_recent_calls(
    limit: int = 10,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retorna chamadas mais recentes"""
    result = await db.execute(
        select(CDR)
        .order_by(CDR.calldate.desc())
        .limit(limit)
    )
    
    calls = result.scalars().all()
    
    return [
        {
            "calldate": call.calldate.isoformat() if call.calldate else None,
            "src": call.src,
            "dst": call.dst,
            "duration": call.duration or 0,
            "billsec": call.billsec or 0,
            "disposition": call.disposition,
            "channel": call.channel,
            "dstchannel": call.dstchannel
        }
        for call in calls
    ]
