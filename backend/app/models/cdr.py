import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, Boolean, Numeric, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base


class CDR(Base):
    __tablename__ = "cdr"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    call_id = Column(String(100), unique=True, index=True)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("customers.id", ondelete="SET NULL"))
    extension_id = Column(UUID(as_uuid=True), ForeignKey("extensions.id", ondelete="SET NULL"))
    route_id = Column(UUID(as_uuid=True), ForeignKey("routes.id", ondelete="SET NULL"))
    gateway_id = Column(UUID(as_uuid=True), ForeignKey("gateways.id", ondelete="SET NULL"))
    src = Column(String(50), index=True)
    dst = Column(String(50), index=True)
    callerid = Column(String(100))
    call_type = Column(String(20))  # inbound, outbound, internal
    start_time = Column(DateTime, index=True)
    answer_time = Column(DateTime)
    end_time = Column(DateTime)
    duration = Column(Integer, default=0)
    billsec = Column(Integer, default=0)
    disposition = Column(String(50))
    hangup_cause = Column(String(50))
    cost = Column(Numeric(10, 6), default=0)
    price = Column(Numeric(10, 6), default=0)
    recorded = Column(Boolean, default=False)
    recording_path = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)
