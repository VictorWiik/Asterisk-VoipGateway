import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Table, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base

# Tabela de associação Tariff Plan <-> Tariffs
tariff_plan_tariffs = Table(
    'tariff_plan_tariffs',
    Base.metadata,
    Column('tariff_plan_id', UUID(as_uuid=True), ForeignKey('tariff_plans.id', ondelete='CASCADE'), primary_key=True),
    Column('tariff_id', UUID(as_uuid=True), ForeignKey('tariffs.id', ondelete='CASCADE'), primary_key=True)
)

class TariffPlan(Base):
    __tablename__ = "tariff_plans"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(String(500))
    status = Column(String(20), default="active")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relacionamentos
    tariffs = relationship("Tariff", secondary=tariff_plan_tariffs, backref="tariff_plans")
    customers = relationship("Customer", back_populates="tariff_plan")
