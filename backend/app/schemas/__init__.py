from datetime import datetime
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, EmailStr, Field
from decimal import Decimal


# ============================================
# AUTH SCHEMAS
# ============================================
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class LoginRequest(BaseModel):
    username: str
    password: str


# ============================================
# USER SCHEMAS
# ============================================
class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: Optional[str] = None
    role: str = "operator"


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    role: Optional[str] = None
    status: Optional[str] = None
    password: Optional[str] = None


class UserResponse(UserBase):
    id: UUID
    status: str
    last_login: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ============================================
# PROVIDER SCHEMAS
# ============================================
class ProviderBase(BaseModel):
    name: str
    description: Optional[str] = None
    type: str
    ip_address: str
    port: int = 5060
    tech_prefix: Optional[str] = None
    auth_type: str = "ip"
    username: Optional[str] = None
    password: Optional[str] = None
    cost_per_minute: Decimal = Decimal("0")
    max_channels: int = 0


class ProviderCreate(ProviderBase):
    pass


class ProviderUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    type: Optional[str] = None
    ip_address: Optional[str] = None
    port: Optional[int] = None
    tech_prefix: Optional[str] = None
    auth_type: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None
    cost_per_minute: Optional[Decimal] = None
    max_channels: Optional[int] = None
    status: Optional[str] = None


class ProviderResponse(ProviderBase):
    id: UUID
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============================================
# GATEWAY SCHEMAS
# ============================================
class GatewayBase(BaseModel):
    provider_id: Optional[UUID] = None
    name: str
    description: Optional[str] = None
    ip_address: Optional[str] = None
    port: int = 5060
    tech_prefix: Optional[str] = None
    context: str = "from-trunk"
    codecs: str = "alaw,ulaw"
    dtmf_mode: str = "rfc2833"
    qualify: str = "yes"
    max_channels: int = 0
    auth_type: str = "ip"
    username: Optional[str] = None
    password: Optional[str] = None


class GatewayCreate(GatewayBase):
    pass


class GatewayUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    ip_address: Optional[str] = None
    port: Optional[int] = None
    tech_prefix: Optional[str] = None
    context: Optional[str] = None
    codecs: Optional[str] = None
    dtmf_mode: Optional[str] = None
    qualify: Optional[str] = None
    max_channels: Optional[int] = None
    auth_type: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None
    status: Optional[str] = None


class GatewayResponse(GatewayBase):
    id: UUID
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


# ============================================
# ROUTE SCHEMAS
# ============================================
class RouteBase(BaseModel):
    name: str
    description: Optional[str] = None
    pattern: str
    gateway_id: Optional[UUID] = None
    priority: int = 1
    cost_per_minute: Decimal = Decimal("0")


class RouteCreate(RouteBase):
    pass


class RouteUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    pattern: Optional[str] = None
    gateway_id: Optional[UUID] = None
    priority: Optional[int] = None
    cost_per_minute: Optional[Decimal] = None
    status: Optional[str] = None


class RouteResponse(RouteBase):
    id: UUID
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


# ============================================
# CUSTOMER SCHEMAS
# ============================================
class CustomerBase(BaseModel):
    code: str
    name: str
    type: str = "extension"
    document: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    billing_type: str = "postpaid"
    credit_limit: Decimal = Decimal("0")
    max_channels: int = 10
    notes: Optional[str] = None
    trunk_ip: Optional[str] = None
    trunk_port: int = 5060
    trunk_codecs: str = "alaw,ulaw"
    trunk_auth_type: str = "ip"
    trunk_username: Optional[str] = None
    trunk_password: Optional[str] = None
    trunk_tech_prefix: Optional[str] = None
    trunk_context: str = "from-trunk"


class CustomerCreate(CustomerBase):
    pass


class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    document: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    billing_type: Optional[str] = None
    credit_limit: Optional[Decimal] = None
    max_channels: Optional[int] = None
    status: Optional[str] = None
    notes: Optional[str] = None
    trunk_ip: Optional[str] = None
    trunk_port: Optional[int] = None
    trunk_codecs: Optional[str] = None
    trunk_auth_type: Optional[str] = None
    trunk_username: Optional[str] = None
    trunk_password: Optional[str] = None
    trunk_tech_prefix: Optional[str] = None
    trunk_context: Optional[str] = None


class CustomerResponse(CustomerBase):
    id: UUID
    balance: Decimal
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


# ============================================
# DID SCHEMAS
# ============================================
class DIDBase(BaseModel):
    number: str
    provider_id: Optional[UUID] = None
    gateway_id: Optional[UUID] = None
    gateway_group_id: Optional[UUID] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: str = "Brasil"
    monthly_cost: Decimal = Decimal("0")


class DIDCreate(DIDBase):
    pass


class DIDUpdate(BaseModel):
    provider_id: Optional[UUID] = None
    gateway_id: Optional[UUID] = None
    gateway_group_id: Optional[UUID] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    monthly_cost: Optional[Decimal] = None
    status: Optional[str] = None


class DIDResponse(DIDBase):
    id: UUID
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class DIDImport(BaseModel):
    numbers: List[str]
    provider_id: Optional[UUID] = None
    gateway_id: Optional[UUID] = None
    gateway_group_id: Optional[UUID] = None
    city: Optional[str] = None
    state: Optional[str] = None


# ============================================
# EXTENSION SCHEMAS
# ============================================
class ExtensionBase(BaseModel):
    customer_id: UUID
    extension: str
    name: Optional[str] = None
    secret: Optional[str] = None
    auth_type: str = "credentials"
    allowed_ips: Optional[str] = None
    callerid: Optional[str] = None
    context: str = "from-internal"
    max_contacts: int = 1
    codecs: str = "alaw,ulaw"
    nat_enabled: bool = True


class ExtensionCreate(ExtensionBase):
    pass


class ExtensionUpdate(BaseModel):
    name: Optional[str] = None
    secret: Optional[str] = None
    auth_type: Optional[str] = None
    allowed_ips: Optional[str] = None
    callerid: Optional[str] = None
    context: Optional[str] = None
    max_contacts: Optional[int] = None
    codecs: Optional[str] = None
    status: Optional[str] = None
    nat_enabled: Optional[bool] = None


class ExtensionResponse(ExtensionBase):
    id: UUID
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


# ============================================
# CUSTOMER DID SCHEMAS
# ============================================
class CustomerDIDBase(BaseModel):
    customer_id: UUID
    did_id: UUID
    destination_type: str = "extension"
    destination: Optional[str] = None
    monthly_price: Decimal = Decimal("0")


class CustomerDIDCreate(CustomerDIDBase):
    pass


class CustomerDIDResponse(CustomerDIDBase):
    id: UUID
    allocated_at: datetime
    status: str

    class Config:
        from_attributes = True


# ============================================
# CUSTOMER ROUTE SCHEMAS
# ============================================
class CustomerRouteBase(BaseModel):
    customer_id: UUID
    route_id: UUID
    price_per_minute: Decimal = Decimal("0")
    max_daily_minutes: int = 0


class CustomerRouteCreate(CustomerRouteBase):
    pass


class CustomerRouteResponse(CustomerRouteBase):
    id: UUID
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


# ============================================
# DASHBOARD SCHEMAS
# ============================================
class DashboardStats(BaseModel):
    total_customers: int
    active_customers: int
    total_dids: int
    allocated_dids: int
    available_dids: int
    total_extensions: int
    total_providers: int
    total_calls_today: int
    total_minutes_today: int
    revenue_today: Decimal


class RouteUsage(BaseModel):
    route_name: str
    gateway_name: str
    provider_name: str
    total_calls: int
    total_minutes: int
    total_cost: Decimal


class CustomerConsumption(BaseModel):
    customer_code: str
    customer_name: str
    total_calls: int
    total_minutes: int
    total_cost: Decimal
    total_price: Decimal
