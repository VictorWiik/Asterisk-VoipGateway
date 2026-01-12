-- Tabela de Planos
CREATE TABLE IF NOT EXISTS plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    max_channels INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de associação Plano <-> Rotas
CREATE TABLE IF NOT EXISTS plan_routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
    route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(plan_id, route_id)
);

-- Adicionar coluna plan_id na tabela customers
ALTER TABLE customers ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES plans(id);

-- Índices
CREATE INDEX IF NOT EXISTS idx_plan_routes_plan_id ON plan_routes(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_routes_route_id ON plan_routes(route_id);
CREATE INDEX IF NOT EXISTS idx_customers_plan_id ON customers(plan_id);
