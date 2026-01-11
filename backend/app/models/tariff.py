import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, Text, Numeric, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base


class Tariff(Base):
    __tablename__ = "tariffs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    direction = Column(String(20), default="outbound")  # inbound, outbound
    pattern = Column(String(100), default="_X.")
    customer_id = Column(UUID(as_uuid=True), ForeignKey("customers.id", ondelete="CASCADE"), nullable=True)
    cost_per_minute = Column(Numeric(10, 6), default=0)
    price_per_minute = Column(Numeric(10, 6), default=0)
    connection_fee = Column(Numeric(10, 4), default=0)
    billing_increment = Column(Integer, default=6)
    min_duration = Column(Integer, default=0)
    status = Column(String(20), default="active")
    priority = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    customer = relationship("Customer", backref="tariffs")
