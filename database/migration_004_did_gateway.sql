-- ============================================
-- MIGRAÇÃO: Adicionar gateway_id ao DID
-- ============================================

ALTER TABLE dids ADD COLUMN IF NOT EXISTS gateway_id UUID REFERENCES gateways(id);

CREATE INDEX IF NOT EXISTS idx_dids_gateway ON dids(gateway_id);

COMMENT ON COLUMN dids.gateway_id IS 'Gateway por onde as chamadas deste DID entram';
