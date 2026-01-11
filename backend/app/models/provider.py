import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, Text, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base


class Provider(Base):
    __tablename__ = "providers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    type = Column(String(20), nullable=False)  # fixo, movel, ldi, misto
    ip_address = Column(String(45), nullable=False)
    port = Column(Integer, default=5060)
    tech_prefix = Column(String(20))
    auth_type = Column(String(20), default="ip")  # ip, credentials, both
    username = Column(String(100))
    password = Column(String(255))
    cost_per_minute = Column(Numeric(10, 6), default=0)
    status = Column(String(20), default="active")
    max_channels = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    gateways = relationship("Gateway", back_populates="provider", cascade="all, delete-orphan")
    dids = relationship("DID", back_populates="provider")
