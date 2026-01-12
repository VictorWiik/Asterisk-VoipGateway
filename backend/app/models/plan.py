from sqlalchemy import Column, String, Integer, DateTime, Text, ForeignKey, Table
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.core.database import Base

# Tabela de associação Plan <-> Routes
plan_routes = Table(
    'plan_routes',
    Base.metadata,
    Column('id', UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
    Column('plan_id', UUID(as_uuid=True), ForeignKey('plans.id', ondelete='CASCADE')),
    Column('route_id', UUID(as_uuid=True), ForeignKey('routes.id', ondelete='CASCADE')),
    Column('created_at', DateTime, default=datetime.utcnow)
)

class Plan(Base):
    __tablename__ = "plans"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text)
    max_channels = Column(Integer, default=0)
    status = Column(String(20), default="active")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relacionamentos
    routes = relationship("Route", secondary=plan_routes, backref="plans")
    customers = relationship("Customer", back_populates="plan")
