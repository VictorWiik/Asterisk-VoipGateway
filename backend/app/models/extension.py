import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, Text, ForeignKey, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base

class Extension(Base):
    __tablename__ = "extensions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("customers.id", ondelete="CASCADE"))
    extension = Column(String(20), nullable=False)
    name = Column(String(100))
    secret = Column(String(100))
    auth_type = Column(String(20), default="credentials")
    allowed_ips = Column(Text)
    callerid = Column(String(100))
    context = Column(String(50), default="from-internal")
    max_contacts = Column(Integer, default=1)
    codecs = Column(String(100), default="alaw,ulaw")
    nat_enabled = Column(Boolean, default=True)
    status = Column(String(20), default="active")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    customer = relationship("Customer", back_populates="extensions")
    
    __table_args__ = (
        {"mysql_charset": "utf8mb4"},
    )
