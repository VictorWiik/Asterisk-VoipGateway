-- ============================================
-- ASTERISK ADMIN - DATABASE SCHEMA
-- Sistema de Gerenciamento de Operadora VoIP
-- ============================================

-- Extensão para UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABELA: providers (Provedores/Fornecedores)
-- ============================================
CREATE TABLE providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    type VARCHAR(20) NOT NULL CHECK (type IN ('fixo', 'movel', 'ldi', 'misto')),
    ip_address VARCHAR(45) NOT NULL,
    port INTEGER DEFAULT 5060,
    tech_prefix VARCHAR(20),
    auth_type VARCHAR(20) DEFAULT 'ip' CHECK (auth_type IN ('ip', 'credentials', 'both')),
    username VARCHAR(100),
    password VARCHAR(255),
    cost_per_minute DECIMAL(10,6) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    max_channels INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABELA: gateways (Troncos SIP)
-- ============================================
CREATE TABLE gateways (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_id UUID REFERENCES providers(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    context VARCHAR(50) DEFAULT 'from-trunk',
    codecs VARCHAR(100) DEFAULT 'alaw,ulaw',
    dtmf_mode VARCHAR(20) DEFAULT 'rfc2833',
    qualify VARCHAR(10) DEFAULT 'yes',
    max_channels INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABELA: routes (Rotas de saída)
-- ============================================
CREATE TABLE routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    pattern VARCHAR(100) NOT NULL,
    gateway_id UUID REFERENCES gateways(id) ON DELETE SET NULL,
    priority INTEGER DEFAULT 1,
    cost_per_minute DECIMAL(10,6) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABELA: customers (Clientes)
-- ============================================
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    document VARCHAR(20),
    email VARCHAR(200),
    phone VARCHAR(20),
    address TEXT,
    billing_type VARCHAR(20) DEFAULT 'postpaid' CHECK (billing_type IN ('prepaid', 'postpaid')),
    credit_limit DECIMAL(12,2) DEFAULT 0,
    balance DECIMAL(12,2) DEFAULT 0,
    max_channels INTEGER DEFAULT 10,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'blocked')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABELA: dids (Inventário de DIDs)
-- ============================================
CREATE TABLE dids (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    number VARCHAR(30) NOT NULL UNIQUE,
    provider_id UUID REFERENCES providers(id) ON DELETE SET NULL,
    city VARCHAR(100),
    state VARCHAR(50),
    country VARCHAR(50) DEFAULT 'Brasil',
    monthly_cost DECIMAL(10,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'allocated', 'reserved', 'porting', 'inactive')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABELA: customer_dids (DIDs alocados a clientes)
-- ============================================
CREATE TABLE customer_dids (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    did_id UUID REFERENCES dids(id) ON DELETE CASCADE,
    destination_type VARCHAR(20) DEFAULT 'extension' CHECK (destination_type IN ('extension', 'queue', 'ivr', 'external', 'conference')),
    destination VARCHAR(100),
    monthly_price DECIMAL(10,2) DEFAULT 0,
    allocated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    UNIQUE(did_id)
);

-- ============================================
-- TABELA: customer_routes (Rotas permitidas por cliente)
-- ============================================
CREATE TABLE customer_routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    route_id UUID REFERENCES routes(id) ON DELETE CASCADE,
    price_per_minute DECIMAL(10,6) DEFAULT 0,
    max_daily_minutes INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(customer_id, route_id)
);

-- ============================================
-- TABELA: extensions (Ramais)
-- ============================================
CREATE TABLE extensions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    extension VARCHAR(20) NOT NULL,
    name VARCHAR(100),
    secret VARCHAR(100),
    auth_type VARCHAR(20) DEFAULT 'credentials' CHECK (auth_type IN ('ip', 'credentials', 'both')),
    allowed_ips TEXT,
    callerid VARCHAR(100),
    context VARCHAR(50) DEFAULT 'from-internal',
    max_contacts INTEGER DEFAULT 1,
    codecs VARCHAR(100) DEFAULT 'alaw,ulaw',
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(customer_id, extension)
);

-- ============================================
-- TABELA: cdr (Call Detail Records)
-- ============================================
CREATE TABLE cdr (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    call_id VARCHAR(100) UNIQUE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    extension_id UUID REFERENCES extensions(id) ON DELETE SET NULL,
    route_id UUID REFERENCES routes(id) ON DELETE SET NULL,
    gateway_id UUID REFERENCES gateways(id) ON DELETE SET NULL,
    src VARCHAR(50),
    dst VARCHAR(50),
    callerid VARCHAR(100),
    call_type VARCHAR(20) CHECK (call_type IN ('inbound', 'outbound', 'internal')),
    start_time TIMESTAMP,
    answer_time TIMESTAMP,
    end_time TIMESTAMP,
    duration INTEGER DEFAULT 0,
    billsec INTEGER DEFAULT 0,
    disposition VARCHAR(50),
    hangup_cause VARCHAR(50),
    cost DECIMAL(10,6) DEFAULT 0,
    price DECIMAL(10,6) DEFAULT 0,
    recorded BOOLEAN DEFAULT FALSE,
    recording_path VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABELA: users (Usuários do sistema)
-- ============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(200) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(200),
    role VARCHAR(20) DEFAULT 'operator' CHECK (role IN ('admin', 'operator', 'viewer')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABELA: audit_log (Log de auditoria)
-- ============================================
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- ÍNDICES
-- ============================================
CREATE INDEX idx_cdr_customer ON cdr(customer_id);
CREATE INDEX idx_cdr_start_time ON cdr(start_time);
CREATE INDEX idx_cdr_dst ON cdr(dst);
CREATE INDEX idx_dids_status ON dids(status);
CREATE INDEX idx_dids_provider ON dids(provider_id);
CREATE INDEX idx_extensions_customer ON extensions(customer_id);
CREATE INDEX idx_customer_dids_customer ON customer_dids(customer_id);
CREATE INDEX idx_audit_log_user ON audit_log(user_id);
CREATE INDEX idx_audit_log_created ON audit_log(created_at);

-- ============================================
-- VIEWS
-- ============================================

-- View: Resumo de DIDs por status
CREATE VIEW vw_dids_summary AS
SELECT 
    status,
    COUNT(*) as total,
    COALESCE(SUM(monthly_cost), 0) as total_cost
FROM dids
GROUP BY status;

-- View: Consumo por cliente
CREATE VIEW vw_customer_consumption AS
SELECT 
    c.id as customer_id,
    c.code,
    c.name,
    COUNT(cdr.id) as total_calls,
    COALESCE(SUM(cdr.billsec), 0) as total_seconds,
    COALESCE(SUM(cdr.cost), 0) as total_cost,
    COALESCE(SUM(cdr.price), 0) as total_price
FROM customers c
LEFT JOIN cdr ON c.id = cdr.customer_id
GROUP BY c.id, c.code, c.name;

-- View: Utilização de rotas
CREATE VIEW vw_route_usage AS
SELECT 
    r.id as route_id,
    r.name as route_name,
    g.name as gateway_name,
    p.name as provider_name,
    COUNT(cdr.id) as total_calls,
    COALESCE(SUM(cdr.billsec), 0) as total_seconds,
    COALESCE(SUM(cdr.cost), 0) as total_cost
FROM routes r
LEFT JOIN gateways g ON r.gateway_id = g.id
LEFT JOIN providers p ON g.provider_id = p.id
LEFT JOIN cdr ON r.id = cdr.route_id
GROUP BY r.id, r.name, g.name, p.name;

-- ============================================
-- DADOS INICIAIS
-- ============================================

-- Usuário admin padrão (senha: admin123 - trocar em produção!)
INSERT INTO users (username, email, password_hash, full_name, role) VALUES
('admin', 'admin@localhost', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.KPslCGBnAUSzOy', 'Administrador', 'admin');
