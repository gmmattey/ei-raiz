-- Fila de reconstrução retroativa da carteira.
-- Usada quando o usuário importa dados históricos e precisamos reconstruir
-- o patrimônio mês a mês a partir das movimentações.
--
-- Um registro por usuário (UNIQUE). O worker processa em chunks para não
-- exceder o timeout do Cloudflare Worker, marcando progresso.

CREATE TABLE IF NOT EXISTS fila_reconstrucao_carteira (
  id                   TEXT PRIMARY KEY,
  usuario_id           TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  status               TEXT NOT NULL DEFAULT 'pendente',  -- 'pendente' | 'processando' | 'concluido' | 'erro'
  ano_mes_inicial      TEXT,                              -- primeiro mês identificado ("YYYY-MM")
  ano_mes_cursor       TEXT,                              -- último mês processado (checkpoint)
  ano_mes_final        TEXT,                              -- mês atual (limite superior)
  meses_processados    INTEGER NOT NULL DEFAULT 0,
  meses_totais         INTEGER NOT NULL DEFAULT 0,
  iniciado_em          TEXT,
  concluido_em         TEXT,
  erro_mensagem        TEXT,
  tentativas           INTEGER NOT NULL DEFAULT 0,
  criado_em            TEXT NOT NULL DEFAULT (datetime('now')),
  atualizado_em        TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(usuario_id)
);

CREATE INDEX IF NOT EXISTS idx_fila_reconstrucao_status
  ON fila_reconstrucao_carteira(status, atualizado_em);
