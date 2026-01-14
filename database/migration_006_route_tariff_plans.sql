-- ============================================
-- MIGRATION 006: Planos de Rotas, Tarifas e Grupos de Gateways
-- ============================================

-- ============================================
-- PARTE 1: Grupos de Gateways
-- ============================================

CREATE TABLE IF NOT EXISTS gateway_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    provider_id UUID REFERENCES providers(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Adicionar gateway_group_id na tabela gateways
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gateways' AND column_name = 'gateway_group_id') THEN
        ALTER TABLE gateways ADD COLUMN gateway_group_id UUID REFERENCES gateway_groups(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Adicionar gateway_group_id na tabela dids
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dids' AND column_name = 'gateway_group_id') THEN
        ALTER TABLE dids ADD COLUMN gateway_group_id UUID REFERENCES gateway_groups(id) ON DELETE SET NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_gateways_group ON gateways(gateway_group_id);
CREATE INDEX IF NOT EXISTS idx_dids_gateway_group ON dids(gateway_group_id);

-- ============================================
-- PARTE 2: Planos de Rotas
-- ============================================

CREATE TABLE IF NOT EXISTS route_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    max_channels INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS route_plan_routes (
    route_plan_id UUID REFERENCES route_plans(id) ON DELETE CASCADE,
    route_id UUID REFERENCES routes(id) ON DELETE CASCADE,
    PRIMARY KEY (route_plan_id, route_id)
);

-- ============================================
-- PARTE 3: Planos de Tarifas
-- ============================================

CREATE TABLE IF NOT EXISTS tariff_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tariff_plan_tariffs (
    tariff_plan_id UUID REFERENCES tariff_plans(id) ON DELETE CASCADE,
    tariff_id UUID REFERENCES tariffs(id) ON DELETE CASCADE,
    PRIMARY KEY (tariff_plan_id, tariff_id)
);

-- ============================================
-- PARTE 4: Atualizar Customers com planos
-- ============================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'route_plan_id') THEN
        ALTER TABLE customers ADD COLUMN route_plan_id UUID REFERENCES route_plans(id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'tariff_plan_id') THEN
        ALTER TABLE customers ADD COLUMN tariff_plan_id UUID REFERENCES tariff_plans(id) ON DELETE SET NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_customers_route_plan ON customers(route_plan_id);
CREATE INDEX IF NOT EXISTS idx_customers_tariff_plan ON customers(tariff_plan_id);
CREATE INDEX IF NOT EXISTS idx_route_plan_routes_plan ON route_plan_routes(route_plan_id);
CREATE INDEX IF NOT EXISTS idx_tariff_plan_tariffs_plan ON tariff_plan_tariffs(tariff_plan_id);

-- Garantir permissões
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO asterisk;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO asterisk;
