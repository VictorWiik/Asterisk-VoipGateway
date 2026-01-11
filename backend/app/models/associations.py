import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, Numeric, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base


class CustomerDID(Base):
    __tablename__ = "customer_dids"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("customers.id", ondelete="CASCADE"))
    did_id = Column(UUID(as_uuid=True), ForeignKey("dids.id", ondelete="CASCADE"), unique=True)
    destination_type = Column(String(20), default="extension")  # extension, queue, ivr, external, conference
    destination = Column(String(100))
    monthly_price = Column(Numeric(10, 2), default=0)
    allocated_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String(20), default="active")

    # Relationships
    customer = relationship("Customer", back_populates="customer_dids")
    did = relationship("DID", back_populates="customer_did")


class CustomerRoute(Base):
    __tablename__ = "customer_routes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("customers.id", ondelete="CASCADE"))
    route_id = Column(UUID(as_uuid=True), ForeignKey("routes.id", ondelete="CASCADE"))
    price_per_minute = Column(Numeric(10, 6), default=0)
    max_daily_minutes = Column(Integer, default=0)
    status = Column(String(20), default="active")
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    customer = relationship("Customer", back_populates="customer_routes")
    route = relationship("Route", back_populates="customer_routes")
