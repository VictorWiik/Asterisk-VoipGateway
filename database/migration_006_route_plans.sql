-- Migration 006: Planos de Rotas
-- TrunkFlow - Sistema de Gerenciamento VoIP

CREATE TABLE IF NOT EXISTS route_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    max_channels INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS route_plan_routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_plan_id UUID REFERENCES route_plans(id) ON DELETE CASCADE,
    route_id UUID REFERENCES routes(id) ON DELETE CASCADE,
    priority INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
