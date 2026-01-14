import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base

class GatewayGroup(Base):
    __tablename__ = "gateway_groups"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(String(500))
    provider_id = Column(UUID(as_uuid=True), ForeignKey('providers.id', ondelete='SET NULL'))
    status = Column(String(20), default="active")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relacionamentos
    provider = relationship("Provider", backref="gateway_groups")
    gateways = relationship("Gateway", back_populates="gateway_group")
    dids = relationship("DID", back_populates="gateway_group")
