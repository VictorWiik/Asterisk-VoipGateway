-- ============================================
-- MIGRAÇÃO: Tabela de Tarifas
-- ============================================

CREATE TABLE IF NOT EXISTS tariffs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    direction VARCHAR(20) NOT NULL DEFAULT 'outbound' CHECK (direction IN ('inbound', 'outbound')),
    pattern VARCHAR(100) NOT NULL DEFAULT '_X.',
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    cost_per_minute DECIMAL(10,6) DEFAULT 0,
    price_per_minute DECIMAL(10,6) DEFAULT 0,
    connection_fee DECIMAL(10,4) DEFAULT 0,
    billing_increment INTEGER DEFAULT 6,
    min_duration INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    priority INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tariffs_direction ON tariffs(direction);
CREATE INDEX IF NOT EXISTS idx_tariffs_customer ON tariffs(customer_id);
CREATE INDEX IF NOT EXISTS idx_tariffs_pattern ON tariffs(pattern);

COMMENT ON TABLE tariffs IS 'Tabela de tarifas para precificacao de chamadas';
COMMENT ON COLUMN tariffs.direction IS 'Direcao: inbound (entrada) ou outbound (saida)';
COMMENT ON COLUMN tariffs.pattern IS 'Pattern para match de numeros (formato Asterisk)';
COMMENT ON COLUMN tariffs.customer_id IS 'Cliente especifico ou NULL para tarifa geral';
COMMENT ON COLUMN tariffs.billing_increment IS 'Incremento de tarifacao em segundos';
COMMENT ON COLUMN tariffs.min_duration IS 'Duracao minima cobrada em segundos';
