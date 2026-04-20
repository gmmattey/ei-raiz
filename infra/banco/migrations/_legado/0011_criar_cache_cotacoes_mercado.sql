CREATE TABLE IF NOT EXISTS cotacoes_ativos_cache (
  id TEXT PRIMARY KEY,
  fonte TEXT NOT NULL,
  chave_ativo TEXT NOT NULL,
  preco_atual REAL,
  variacao_percentual REAL,
  payload_json TEXT,
  atualizado_em TEXT NOT NULL,
  expira_em TEXT NOT NULL,
  erro TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_cotacoes_cache_fonte_chave
  ON cotacoes_ativos_cache(fonte, chave_ativo);

CREATE INDEX IF NOT EXISTS idx_cotacoes_cache_expira
  ON cotacoes_ativos_cache(expira_em);
