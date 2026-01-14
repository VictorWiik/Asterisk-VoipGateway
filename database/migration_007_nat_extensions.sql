-- Migration 007: Adiciona campo NAT nas extensions
-- TrunkFlow - Sistema de Gerenciamento VoIP

-- Adicionar campo nat_enabled na tabela extensions
ALTER TABLE extensions ADD COLUMN IF NOT EXISTS nat_enabled BOOLEAN DEFAULT true;

-- Comentário
COMMENT ON COLUMN extensions.nat_enabled IS 'Habilita configurações de NAT para ramais atrás de firewall';
