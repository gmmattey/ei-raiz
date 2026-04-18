CREATE TABLE IF NOT EXISTS snapshots_patrimonio (
  id TEXT PRIMARY KEY,
  usuario_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  data TEXT NOT NULL,
  valor_total REAL,
  variacao_percentual REAL
);
