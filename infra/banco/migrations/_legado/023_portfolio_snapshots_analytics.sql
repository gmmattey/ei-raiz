-- Snapshot consolidado do portfólio por usuário
-- Computado em background após escritas (aporte, importação, exclusão)
-- Atualizado pelo cron trigger de refresh de mercado
CREATE TABLE IF NOT EXISTS portfolio_snapshots (
  id TEXT PRIMARY KEY,
  usuario_id TEXT NOT NULL,
  calculado_em TEXT NOT NULL,
  total_investido REAL NOT NULL DEFAULT 0,
  total_atual REAL NOT NULL DEFAULT 0,
  retorno_total REAL NOT NULL DEFAULT 0,
  payload_json TEXT NOT NULL,
  UNIQUE(usuario_id)
);

-- Analytics do portfólio por usuário (score, diagnóstico, insights)
-- Computado em background após escritas e pelo cron trigger
CREATE TABLE IF NOT EXISTS portfolio_analytics (
  id TEXT PRIMARY KEY,
  usuario_id TEXT NOT NULL,
  calculado_em TEXT NOT NULL,
  score_unificado REAL,
  faixa TEXT,
  confianca REAL,
  payload_json TEXT NOT NULL,
  UNIQUE(usuario_id)
);

CREATE INDEX IF NOT EXISTS idx_portfolio_snapshots_usuario ON portfolio_snapshots(usuario_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_analytics_usuario ON portfolio_analytics(usuario_id);
