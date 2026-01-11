import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, Text, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base


class Customer(Base):
    __tablename__ = "customers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code = Column(String(20), unique=True, nullable=False, index=True)
    name = Column(String(200), nullable=False)
    type = Column(String(20), default="extension")  # extension, trunk
    document = Column(String(20))
    email = Column(String(200))
    phone = Column(String(20))
    address = Column(Text)
    billing_type = Column(String(20), default="postpaid")  # prepaid, postpaid
    credit_limit = Column(Numeric(12, 2), default=0)
    balance = Column(Numeric(12, 2), default=0)
    max_channels = Column(Integer, default=10)
    status = Column(String(20), default="active")
    notes = Column(Text)
    
    # Campos para cliente trunk
    trunk_ip = Column(String(45))
    trunk_port = Column(Integer, default=5060)
    trunk_codecs = Column(String(100), default="alaw,ulaw")
    trunk_auth_type = Column(String(20), default="ip")  # ip, credentials, both
    trunk_username = Column(String(100))
    trunk_password = Column(String(255))
    trunk_tech_prefix = Column(String(20))
    trunk_context = Column(String(50), default="from-trunk")
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    extensions = relationship("Extension", back_populates="customer", cascade="all, delete-orphan")
    customer_dids = relationship("CustomerDID", back_populates="customer", cascade="all, delete-orphan")
    customer_routes = relationship("CustomerRoute", back_populates="customer", cascade="all, delete-orphan")
