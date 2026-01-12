from sqlalchemy import Column, String, Integer, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.core.database import Base

class Customer(Base):
    __tablename__ = "customers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code = Column(String(50), unique=True, nullable=False)
    name = Column(String(200), nullable=False)
    type = Column(String(20), default="trunk")  # trunk ou extension
    
    # Campos para tipo trunk
    trunk_ip = Column(String(50))
    trunk_port = Column(Integer, default=5060)
    trunk_context = Column(String(50), default="from-trunk")
    trunk_codecs = Column(String(100), default="alaw,ulaw")
    tech_prefix = Column(String(20))
    
    # Plano associado
    plan_id = Column(UUID(as_uuid=True), ForeignKey('plans.id'))
    
    status = Column(String(20), default="active")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relacionamentos
    plan = relationship("Plan", back_populates="customers")
    extensions = relationship("Extension", back_populates="customer")
    dids = relationship("CustomerDID", back_populates="customer")
