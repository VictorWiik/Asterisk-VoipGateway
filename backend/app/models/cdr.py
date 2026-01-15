import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, Boolean, Numeric, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base

class CDR(Base):
    __tablename__ = "cdr"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    call_id = Column(String(100), index=True)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("customers.id", ondelete="SET NULL"))
    extension_id = Column(UUID(as_uuid=True), ForeignKey("extensions.id", ondelete="SET NULL"))
    route_id = Column(UUID(as_uuid=True), ForeignKey("routes.id", ondelete="SET NULL"))
    gateway_id = Column(UUID(as_uuid=True), ForeignKey("gateways.id", ondelete="SET NULL"))
    
    # Campos padrão do Asterisk CDR
    calldate = Column(DateTime, index=True, default=datetime.utcnow)
    clid = Column(String(80))
    src = Column(String(50), index=True)
    dst = Column(String(50), index=True)
    dcontext = Column(String(80))
    channel = Column(String(80))
    dstchannel = Column(String(80))
    lastapp = Column(String(80))
    lastdata = Column(String(80))
    duration = Column(Integer, default=0)
    billsec = Column(Integer, default=0)
    disposition = Column(String(50))
    amaflags = Column(Integer, default=0)
    accountcode = Column(String(20))
    uniqueid = Column(String(150))
    userfield = Column(String(255))
    peeraccount = Column(String(20))
    linkedid = Column(String(150))
    sequence = Column(Integer)
    
    # Campos adicionais do TrunkFlow
    callerid = Column(String(100))
    call_type = Column(String(20))  # inbound, outbound, internal
    start_time = Column(DateTime)
    answer_time = Column(DateTime)
    end_time = Column(DateTime)
    hangup_cause = Column(String(50))
    cost = Column(Numeric(10, 6), default=0)
    price = Column(Numeric(10, 6), default=0)
    recorded = Column(Boolean, default=False)
    recording_path = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)
