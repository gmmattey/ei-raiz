-- Histórico mensal consolidado da carteira por usuário.
-- Alimentado por:
--   1) Job D-1 noturno (origem = 'fechamento_mensal') no último dia útil de cada mês
--   2) Reconstrução retroativa (origem = 'reconstrucao') a partir de movimentações e importações
--
-- Serve o gráfico de ganhos e perdas mensais e o endpoint GET /api/historico/snapshots.
-- Não substitui portfolio_snapshots (estado atual) — é uma tabela paralela, temporal.

CREATE TABLE IF NOT EXISTS historico_carteira_mensal (
  id              TEXT PRIMARY KEY,
  usuario_id      TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  ano_mes         TEXT NOT NULL,                         -- formato "YYYY-MM", ex: "2026-04"
  data_fechamento TEXT NOT NULL,                         -- ISO 8601, último dia persistido do mês
  total_investido REAL NOT NULL DEFAULT 0,               -- soma de (quantidade * preco_medio) naquele mês
  total_atual     REAL NOT NULL DEFAULT 0,               -- patrimônio consolidado no fechamento
  retorno_mes     REAL NOT NULL DEFAULT 0,               -- % vs fechamento do mês anterior
  retorno_acum    REAL NOT NULL DEFAULT 0,               -- % desde o primeiro mês registrado
  payload_json    TEXT NOT NULL,                         -- snapshot completo do mês (ativos, distribuição)
  origem          TEXT NOT NULL DEFAULT 'fechamento_mensal',  -- 'fechamento_mensal' | 'reconstrucao'
  criado_em       TEXT NOT NULL DEFAULT (datetime('now')),
  atualizado_em   TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(usuario_id, ano_mes)
);

CREATE INDEX IF NOT EXISTS idx_historico_carteira_mensal_usuario_mes
  ON historico_carteira_mensal(usuario_id, ano_mes DESC);
