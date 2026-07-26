CREATE TABLE job_execucoes (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('executando', 'concluido', 'falhou')),
  iniciado_em TEXT NOT NULL,
  concluido_em TEXT,
  duracao_ms INTEGER,
  volume INTEGER,
  erro TEXT
);

CREATE INDEX idx_job_execucoes_nome_inicio
  ON job_execucoes(nome, iniciado_em DESC);
