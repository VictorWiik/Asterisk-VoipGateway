import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base


class Gateway(Base):
    __tablename__ = "gateways"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    provider_id = Column(UUID(as_uuid=True), ForeignKey("providers.id", ondelete="CASCADE"))
    name = Column(String(100), nullable=False)
    description = Column(Text)
    ip_address = Column(String(45))
    port = Column(Integer, default=5060)
    tech_prefix = Column(String(20))
    context = Column(String(50), default="from-trunk")
    codecs = Column(String(100), default="alaw,ulaw")
    dtmf_mode = Column(String(20), default="rfc2833")
    qualify = Column(String(10), default="yes")
    max_channels = Column(Integer, default=0)
    auth_type = Column(String(20), default="ip")
    username = Column(String(100))
    password = Column(String(255))
    status = Column(String(20), default="active")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    provider = relationship("Provider", back_populates="gateways")
    routes = relationship("Route", back_populates="gateway")
