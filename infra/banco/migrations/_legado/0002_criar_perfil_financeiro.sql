CREATE TABLE IF NOT EXISTS perfil_financeiro (
  id TEXT PRIMARY KEY,
  usuario_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  renda_mensal REAL,
  aporte_mensal REAL,
  horizonte TEXT,
  perfil_risco TEXT,
  objetivo TEXT,
  maturidade INTEGER DEFAULT 1
);
