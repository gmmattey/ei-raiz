CREATE TABLE IF NOT EXISTS snapshots_score_unificado (
  id TEXT PRIMARY KEY,
  usuario_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  faixa TEXT NOT NULL,
  pilares_json TEXT NOT NULL,
  patrimonio_bruto REAL NOT NULL,
  patrimonio_liquido REAL NOT NULL,
  divida_total REAL NOT NULL,
  ativos_liquidos REAL NOT NULL,
  inputs_resumo_json TEXT NOT NULL,
  criado_em TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_snapshots_score_unificado_usuario_criado_em
  ON snapshots_score_unificado(usuario_id, criado_em DESC);
