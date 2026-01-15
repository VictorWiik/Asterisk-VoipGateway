-- Migration 008: Campos CDR compatíveis com Asterisk
-- TrunkFlow - Sistema de Gerenciamento VoIP

-- Adicionar campos padrão do Asterisk CDR
ALTER TABLE cdr ADD COLUMN IF NOT EXISTS calldate TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE cdr ADD COLUMN IF NOT EXISTS clid VARCHAR(80);
ALTER TABLE cdr ADD COLUMN IF NOT EXISTS dcontext VARCHAR(80);
ALTER TABLE cdr ADD COLUMN IF NOT EXISTS channel VARCHAR(80);
ALTER TABLE cdr ADD COLUMN IF NOT EXISTS dstchannel VARCHAR(80);
ALTER TABLE cdr ADD COLUMN IF NOT EXISTS lastapp VARCHAR(80);
ALTER TABLE cdr ADD COLUMN IF NOT EXISTS lastdata VARCHAR(80);
ALTER TABLE cdr ADD COLUMN IF NOT EXISTS amaflags INTEGER DEFAULT 0;
ALTER TABLE cdr ADD COLUMN IF NOT EXISTS accountcode VARCHAR(20);
ALTER TABLE cdr ADD COLUMN IF NOT EXISTS uniqueid VARCHAR(150);
ALTER TABLE cdr ADD COLUMN IF NOT EXISTS userfield VARCHAR(255);
ALTER TABLE cdr ADD COLUMN IF NOT EXISTS peeraccount VARCHAR(20);
ALTER TABLE cdr ADD COLUMN IF NOT EXISTS linkedid VARCHAR(150);
ALTER TABLE cdr ADD COLUMN IF NOT EXISTS sequence INTEGER;

-- Remover constraint única do call_id (Asterisk pode duplicar)
ALTER TABLE cdr DROP CONSTRAINT IF EXISTS cdr_call_id_key;

-- Criar índice no calldate
CREATE INDEX IF NOT EXISTS idx_cdr_calldate ON cdr(calldate);

-- Comentários
COMMENT ON COLUMN cdr.calldate IS 'Data/hora da chamada (padrão Asterisk)';
COMMENT ON COLUMN cdr.clid IS 'Caller ID completo';
COMMENT ON COLUMN cdr.channel IS 'Canal de origem';
COMMENT ON COLUMN cdr.dstchannel IS 'Canal de destino';
