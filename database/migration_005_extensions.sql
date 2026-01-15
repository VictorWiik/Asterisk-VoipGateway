-- Migration 005: Campos de ramais/extensões
-- TrunkFlow - Sistema de Gerenciamento VoIP

-- Adicionar campo NAT nas extensões
ALTER TABLE extensions ADD COLUMN IF NOT EXISTS nat BOOLEAN DEFAULT true;
ALTER TABLE extensions ADD COLUMN IF NOT EXISTS direct_media BOOLEAN DEFAULT false;
ALTER TABLE extensions ADD COLUMN IF NOT EXISTS force_rport BOOLEAN DEFAULT true;
ALTER TABLE extensions ADD COLUMN IF NOT EXISTS rewrite_contact BOOLEAN DEFAULT true;
ALTER TABLE extensions ADD COLUMN IF NOT EXISTS rtp_symmetric BOOLEAN DEFAULT true;
