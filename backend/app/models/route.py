import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, Text, Numeric, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base


class Route(Base):
    __tablename__ = "routes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    pattern = Column(String(100), nullable=False)
    gateway_id = Column(UUID(as_uuid=True), ForeignKey("gateways.id", ondelete="SET NULL"))
    priority = Column(Integer, default=1)
    cost_per_minute = Column(Numeric(10, 6), default=0)
    status = Column(String(20), default="active")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    gateway = relationship("Gateway", back_populates="routes")
    customer_routes = relationship("CustomerRoute", back_populates="route")
