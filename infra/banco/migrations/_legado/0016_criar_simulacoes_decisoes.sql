CREATE TABLE IF NOT EXISTS simulacoes (
  id TEXT PRIMARY KEY,
  usuario_id TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK(tipo IN ('imovel','carro','reserva_ou_financiar','gastar_ou_investir','livre')),
  nome TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('rascunho','salva')) DEFAULT 'salva',
  score_atual REAL,
  score_projetado REAL,
  delta_score REAL,
  diagnostico_titulo TEXT,
  diagnostico_descricao TEXT,
  diagnostico_acao TEXT,
  resumo_curto TEXT,
  premissas_json TEXT NOT NULL,
  resultado_json TEXT NOT NULL,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  criado_em TEXT NOT NULL DEFAULT (datetime('now')),
  atualizado_em TEXT NOT NULL DEFAULT (datetime('now')),
  salvo_em TEXT
);

CREATE INDEX IF NOT EXISTS idx_simulacoes_usuario ON simulacoes(usuario_id, atualizado_em DESC);
CREATE INDEX IF NOT EXISTS idx_simulacoes_usuario_tipo ON simulacoes(usuario_id, tipo);

CREATE TABLE IF NOT EXISTS simulacoes_historico (
  id TEXT PRIMARY KEY,
  simulacao_id TEXT NOT NULL,
  versao INTEGER NOT NULL,
  premissas_json TEXT NOT NULL,
  resultado_json TEXT NOT NULL,
  diagnostico_json TEXT NOT NULL,
  criado_em TEXT NOT NULL DEFAULT (datetime('now')),
  criado_por TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_simulacoes_historico_simulacao ON simulacoes_historico(simulacao_id, versao DESC);

CREATE TABLE IF NOT EXISTS simulacoes_parametros (
  id TEXT PRIMARY KEY,
  chave TEXT NOT NULL UNIQUE,
  valor_json TEXT NOT NULL,
  descricao TEXT,
  origem TEXT NOT NULL DEFAULT 'admin',
  ativo INTEGER NOT NULL DEFAULT 1,
  atualizado_em TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO simulacoes_parametros (id, chave, valor_json, descricao, origem, ativo) VALUES
  ('simparam_1', 'imovel_valorizacao_padrao', '{"valor": 0.06}', 'Valorização anual padrão de imóveis', 'seed', 1),
  ('simparam_2', 'carro_depreciacao_padrao', '{"valor": 0.15}', 'Depreciação anual padrão de veículos', 'seed', 1),
  ('simparam_3', 'retorno_investimento_padrao', '{"valor": 0.10}', 'Retorno anual esperado de investimento base', 'seed', 1),
  ('simparam_4', 'inflacao_padrao', '{"valor": 0.045}', 'Inflação anual padrão para projeções', 'seed', 1),
  ('simparam_5', 'reajuste_aluguel_padrao', '{"valor": 0.06}', 'Reajuste anual de aluguel', 'seed', 1),
  ('simparam_6', 'custo_oportunidade_padrao', '{"valor": 0.10}', 'Taxa de custo de oportunidade', 'seed', 1);
