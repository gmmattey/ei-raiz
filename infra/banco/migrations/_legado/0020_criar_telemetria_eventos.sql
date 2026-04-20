CREATE TABLE IF NOT EXISTS telemetria_eventos (
  id TEXT PRIMARY KEY,
  usuario_id TEXT,
  nome_evento TEXT NOT NULL,
  payload_json TEXT,
  origem TEXT NOT NULL DEFAULT 'web',
  criado_em TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_telemetria_eventos_nome_data
  ON telemetria_eventos(nome_evento, criado_em DESC);

CREATE INDEX IF NOT EXISTS idx_telemetria_eventos_usuario_data
  ON telemetria_eventos(usuario_id, criado_em DESC);
