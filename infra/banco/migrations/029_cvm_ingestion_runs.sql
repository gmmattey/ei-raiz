-- Controle operacional das execuções de ingestão CVM.
--
-- Cada execução do script externo (GitHub Action ou manual) registra um run
-- com status/contagens/timestamps para que o painel admin possa mostrar
-- freshness real — não status fake. O Worker apenas lê/escreve; a ingestão
-- pesada (download de CSV, parse) continua fora do request path.

CREATE TABLE IF NOT EXISTS cvm_ingestion_runs (
  id                   TEXT PRIMARY KEY,            -- uuid
  referencia_ano_mes   TEXT NOT NULL,               -- "YYYY-MM" da competência CVM
  status               TEXT NOT NULL DEFAULT 'queued', -- queued|running|completed|failed
  origem_execucao      TEXT NOT NULL DEFAULT 'manual', -- manual|scheduled|github_action|trigger
  arquivos_processados INTEGER NOT NULL DEFAULT 0,
  registros_lidos      INTEGER NOT NULL DEFAULT 0,
  registros_validos    INTEGER NOT NULL DEFAULT 0,
  registros_invalidos  INTEGER NOT NULL DEFAULT 0,
  erro_resumo          TEXT,                        -- mensagem curta em caso de falha
  iniciado_em          TEXT NOT NULL DEFAULT (datetime('now')),
  finalizado_em        TEXT,
  criado_em            TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_cvm_ingestion_runs_iniciado_em
  ON cvm_ingestion_runs(iniciado_em DESC);

CREATE INDEX IF NOT EXISTS idx_cvm_ingestion_runs_status
  ON cvm_ingestion_runs(status, iniciado_em DESC);
