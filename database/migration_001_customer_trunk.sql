-- ============================================
-- MIGRAÇÃO: Adicionar suporte a Cliente Trunk
-- ============================================

-- Adicionar campo type na tabela customers
ALTER TABLE customers ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'extension' CHECK (type IN ('extension', 'trunk'));

-- Adicionar campos para cliente trunk
ALTER TABLE customers ADD COLUMN IF NOT EXISTS trunk_ip VARCHAR(45);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS trunk_port INTEGER DEFAULT 5060;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS trunk_codecs VARCHAR(100) DEFAULT 'alaw,ulaw';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS trunk_auth_type VARCHAR(20) DEFAULT 'ip' CHECK (trunk_auth_type IN ('ip', 'credentials', 'both'));
ALTER TABLE customers ADD COLUMN IF NOT EXISTS trunk_username VARCHAR(100);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS trunk_password VARCHAR(255);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS trunk_tech_prefix VARCHAR(20);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS trunk_context VARCHAR(50) DEFAULT 'from-trunk';

-- Atualizar destination_type para incluir trunk
ALTER TABLE customer_dids DROP CONSTRAINT IF EXISTS customer_dids_destination_type_check;
ALTER TABLE customer_dids ADD CONSTRAINT customer_dids_destination_type_check CHECK (destination_type IN ('extension', 'queue', 'ivr', 'external', 'conference', 'trunk'));

-- Índice para busca por tipo de cliente
CREATE INDEX IF NOT EXISTS idx_customers_type ON customers(type);

-- Comentários
COMMENT ON COLUMN customers.type IS 'Tipo de cliente: extension (ramais) ou trunk (gateway SIP)';
COMMENT ON COLUMN customers.trunk_ip IS 'IP de destino para clientes trunk';
COMMENT ON COLUMN customers.trunk_port IS 'Porta SIP para clientes trunk';
