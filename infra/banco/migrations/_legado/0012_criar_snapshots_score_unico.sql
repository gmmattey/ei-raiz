CREATE TABLE IF NOT EXISTS snapshots_score (
  id TEXT PRIMARY KEY,
  usuario_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  faixa TEXT NOT NULL,
  risco_principal TEXT NOT NULL,
  acao_prioritaria TEXT NOT NULL,
  blocos_json TEXT NOT NULL,
  fatores_positivos_json TEXT NOT NULL,
  fatores_negativos_json TEXT NOT NULL,
  criado_em TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_snapshots_score_usuario_criado_em
  ON snapshots_score(usuario_id, criado_em DESC);
