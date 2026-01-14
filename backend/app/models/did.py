import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Numeric, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base

class DID(Base):
    __tablename__ = "dids"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    number = Column(String(30), unique=True, nullable=False, index=True)
    provider_id = Column(UUID(as_uuid=True), ForeignKey("providers.id", ondelete="SET NULL"))
    gateway_id = Column(UUID(as_uuid=True), ForeignKey("gateways.id", ondelete="SET NULL"))
    gateway_group_id = Column(UUID(as_uuid=True), ForeignKey("gateway_groups.id", ondelete="SET NULL"))
    city = Column(String(100))
    state = Column(String(50))
    country = Column(String(50), default="Brasil")
    monthly_cost = Column(Numeric(10, 2), default=0)
    status = Column(String(20), default="available")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relacionamentos
    provider = relationship("Provider", back_populates="dids")
    gateway = relationship("Gateway")
    gateway_group = relationship("GatewayGroup", back_populates="dids")
    customer_did = relationship("CustomerDID", back_populates="did", uselist=False)
