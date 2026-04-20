CREATE TABLE IF NOT EXISTS perfil_contexto_financeiro (
  id TEXT PRIMARY KEY,
  usuario_id TEXT NOT NULL UNIQUE REFERENCES usuarios(id) ON DELETE CASCADE,
  contexto_json TEXT NOT NULL,
  atualizado_em TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_perfil_contexto_usuario ON perfil_contexto_financeiro(usuario_id);

