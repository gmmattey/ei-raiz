-- Incremental e seguro sobre o schema canônico já existente.
-- Não use `wrangler d1 migrations apply` sem antes baselinar a migration 100
-- no D1 remoto: ela é um rebuild histórico e contém DROP TABLE.

ALTER TABLE importacoes ADD COLUMN chave_idempotencia TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_importacoes_usuario_chave_idempotencia
  ON importacoes(usuario_id, chave_idempotencia)
  WHERE chave_idempotencia IS NOT NULL;
