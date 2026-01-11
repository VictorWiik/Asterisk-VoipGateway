from datetime import datetime, timedelta
from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.core.database import get_db
from app.core.security import get_current_user
from app.models import CDR, DID, Provider, Customer, User
import io
import csv

router = APIRouter(prefix="/reports", tags=["Relatorios"])


@router.get("/cdr")
async def get_cdr_report(
    start_date: str = Query(None),
    end_date: str = Query(None),
    customer_id: UUID = Query(None),
    call_type: str = Query(None),
    search: str = Query(None),
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(CDR)
    
    if start_date:
        query = query.where(CDR.start_time >= datetime.fromisoformat(start_date))
    if end_date:
        end = datetime.fromisoformat(end_date) + timedelta(days=1)
        query = query.where(CDR.start_time < end)
    if customer_id:
        query = query.where(CDR.customer_id == customer_id)
    if call_type:
        query = query.where(CDR.call_type == call_type)
    if search:
        query = query.where(
            (CDR.src.ilike(f"%{search}%")) | (CDR.dst.ilike(f"%{search}%"))
        )
    
    # Get records
    result = await db.execute(
        query.order_by(CDR.start_time.desc()).offset(skip).limit(limit)
    )
    records = result.scalars().all()
    
    # Get summary
    summary_query = select(
        func.count(CDR.id).label('total_calls'),
        func.sum(CDR.billsec).label('total_duration'),
        func.sum(CDR.cost).label('total_cost'),
        func.sum(CDR.price).label('total_price')
    )
    
    if start_date:
        summary_query = summary_query.where(CDR.start_time >= datetime.fromisoformat(start_date))
    if end_date:
        end = datetime.fromisoformat(end_date) + timedelta(days=1)
        summary_query = summary_query.where(CDR.start_time < end)
    if customer_id:
        summary_query = summary_query.where(CDR.customer_id == customer_id)
    if call_type:
        summary_query = summary_query.where(CDR.call_type == call_type)
    
    summary_result = await db.execute(summary_query)
    summary_row = summary_result.one()
    
    return {
        "records": [
            {
                "id": str(r.id),
                "call_id": r.call_id,
                "src": r.src,
                "dst": r.dst,
                "callerid": r.callerid,
                "call_type": r.call_type,
                "start_time": r.start_time.isoformat() if r.start_time else None,
                "duration": r.duration,
                "billsec": r.billsec,
                "disposition": r.disposition,
                "cost": float(r.cost or 0),
                "price": float(r.price or 0),
            }
            for r in records
        ],
        "summary": {
            "total_calls": summary_row.total_calls or 0,
            "total_duration": summary_row.total_duration or 0,
            "total_cost": float(summary_row.total_cost or 0),
            "total_price": float(summary_row.total_price or 0),
        }
    }


@router.get("/cdr/export")
async def export_cdr(
    start_date: str = Query(None),
    end_date: str = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(CDR)
    
    if start_date:
        query = query.where(CDR.start_time >= datetime.fromisoformat(start_date))
    if end_date:
        end = datetime.fromisoformat(end_date) + timedelta(days=1)
        query = query.where(CDR.start_time < end)
    
    result = await db.execute(query.order_by(CDR.start_time.desc()))
    records = result.scalars().all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['Data/Hora', 'Origem', 'Destino', 'CallerID', 'Tipo', 'Duracao', 'Billsec', 'Status', 'Custo', 'Preco'])
    
    for r in records:
        writer.writerow([
            r.start_time.isoformat() if r.start_time else '',
            r.src,
            r.dst,
            r.callerid,
            r.call_type,
            r.duration,
            r.billsec,
            r.disposition,
            float(r.cost or 0),
            float(r.price or 0)
        ])
    
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=cdr_{start_date}_{end_date}.csv"}
    )


@router.get("/dids")
async def get_did_report(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Total and by status
    status_result = await db.execute(
        select(DID.status, func.count(DID.id).label('count'))
        .group_by(DID.status)
    )
    by_status = [{"status": r.status, "count": r.count} for r in status_result.all()]
    
    total = sum(s["count"] for s in by_status)
    available = next((s["count"] for s in by_status if s["status"] == "available"), 0)
    allocated = next((s["count"] for s in by_status if s["status"] == "allocated"), 0)
    
    # By provider
    provider_result = await db.execute(
        select(
            Provider.name.label('provider'),
            func.count(DID.id).label('count'),
            func.sum(DID.monthly_cost).label('cost')
        )
        .outerjoin(Provider, DID.provider_id == Provider.id)
        .group_by(Provider.id, Provider.name)
    )
    by_provider = [
        {"provider": r.provider, "count": r.count, "cost": float(r.cost or 0)}
        for r in provider_result.all()
    ]
    
    # Total monthly cost
    cost_result = await db.execute(select(func.sum(DID.monthly_cost)))
    monthly_cost = cost_result.scalar() or 0
    
    return {
        "total": total,
        "available": available,
        "allocated": allocated,
        "monthly_cost": float(monthly_cost),
        "by_status": by_status,
        "by_provider": by_provider
    }
