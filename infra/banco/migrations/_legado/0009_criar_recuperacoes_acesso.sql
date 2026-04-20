CREATE TABLE IF NOT EXISTS recuperacoes_acesso (
  id TEXT PRIMARY KEY,
  usuario_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  destino_email TEXT NOT NULL,
  expira_em TEXT NOT NULL,
  usado_em TEXT
);

CREATE INDEX IF NOT EXISTS idx_recuperacoes_usuario_id ON recuperacoes_acesso(usuario_id);
CREATE INDEX IF NOT EXISTS idx_recuperacoes_expira_em ON recuperacoes_acesso(expira_em);
