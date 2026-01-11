-- ============================================
-- MIGRAÇÃO: Adicionar campos SIP ao Gateway
-- ============================================

ALTER TABLE gateways ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45);
ALTER TABLE gateways ADD COLUMN IF NOT EXISTS port INTEGER DEFAULT 5060;
ALTER TABLE gateways ADD COLUMN IF NOT EXISTS tech_prefix VARCHAR(20);
ALTER TABLE gateways ADD COLUMN IF NOT EXISTS auth_type VARCHAR(20) DEFAULT 'ip';
ALTER TABLE gateways ADD COLUMN IF NOT EXISTS username VARCHAR(100);
ALTER TABLE gateways ADD COLUMN IF NOT EXISTS password VARCHAR(255);

COMMENT ON COLUMN gateways.ip_address IS 'IP do gateway SIP';
COMMENT ON COLUMN gateways.tech_prefix IS 'Prefixo tecnico adicionado antes do numero';
