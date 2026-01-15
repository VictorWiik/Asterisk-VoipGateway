-- Migration 007: Planos de Tarifas
-- TrunkFlow - Sistema de Gerenciamento VoIP

CREATE TABLE IF NOT EXISTS tariff_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tariff_plan_tariffs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tariff_plan_id UUID REFERENCES tariff_plans(id) ON DELETE CASCADE,
    tariff_id UUID REFERENCES tariffs(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Adicionar referência nos clientes
ALTER TABLE customers ADD COLUMN IF NOT EXISTS route_plan_id UUID REFERENCES route_plans(id);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS tariff_plan_id UUID REFERENCES tariff_plans(id);
