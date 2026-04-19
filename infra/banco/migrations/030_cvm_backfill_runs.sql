-- Controle operacional do backfill mensal de cotas CVM.
--
-- Diferente de cvm_ingestion_runs (que registra ingestão diária mês-corrente),
-- aqui registramos execuções de backfill retroativo — uma execução processa
-- vários meses de uma vez, carregando apenas o fechamento mensal de cada
-- fundo relevante. Escrita continua em cotas_fundos_cvm (não duplicamos
-- tabela), o que preserva o contrato já consumido por
-- obterFechamentosMensais(...).

CREATE TABLE IF NOT EXISTS cvm_backfill_runs (
  id                       TEXT PRIMARY KEY,
  status                   TEXT NOT NULL DEFAULT 'queued', -- queued|running|completed|failed
  origem_execucao          TEXT NOT NULL DEFAULT 'manual', -- manual|scheduled|github_action
  intervalo_inicial        TEXT NOT NULL,                  -- "YYYY-MM"
  intervalo_final          TEXT NOT NULL,                  -- "YYYY-MM"
  total_meses_previstos    INTEGER NOT NULL DEFAULT 0,
  total_meses_processados  INTEGER NOT NULL DEFAULT 0,
  total_fundos             INTEGER NOT NULL DEFAULT 0,
  registros_lidos          INTEGER NOT NULL DEFAULT 0,
  registros_gravados       INTEGER NOT NULL DEFAULT 0,
  registros_invalidos      INTEGER NOT NULL DEFAULT 0,
  erro_resumo              TEXT,
  iniciado_em              TEXT NOT NULL DEFAULT (datetime('now')),
  finalizado_em            TEXT,
  criado_em                TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_cvm_backfill_runs_iniciado_em
  ON cvm_backfill_runs(iniciado_em DESC);

CREATE INDEX IF NOT EXISTS idx_cvm_backfill_runs_status
  ON cvm_backfill_runs(status, iniciado_em DESC);
