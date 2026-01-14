import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, Table, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base

# Tabela de associação Route Plan <-> Routes
route_plan_routes = Table(
    'route_plan_routes',
    Base.metadata,
    Column('route_plan_id', UUID(as_uuid=True), ForeignKey('route_plans.id', ondelete='CASCADE'), primary_key=True),
    Column('route_id', UUID(as_uuid=True), ForeignKey('routes.id', ondelete='CASCADE'), primary_key=True)
)

class RoutePlan(Base):
    __tablename__ = "route_plans"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(String(500))
    max_channels = Column(Integer, default=0)
    status = Column(String(20), default="active")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relacionamentos
    routes = relationship("Route", secondary=route_plan_routes, backref="route_plans")
    customers = relationship("Customer", back_populates="route_plan")
