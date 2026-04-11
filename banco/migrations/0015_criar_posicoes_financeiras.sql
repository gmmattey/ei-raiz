CREATE TABLE IF NOT EXISTS posicoes_financeiras (
  id TEXT PRIMARY KEY,
  usuario_id TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK(tipo IN ('investimento','caixa','poupanca','cofrinho','imovel','veiculo','divida')),
  nome TEXT NOT NULL,
  valor_atual REAL NOT NULL,
  custo_aquisicao REAL,
  liquidez TEXT NOT NULL CHECK(liquidez IN ('imediata','curto_prazo','medio_prazo','baixa')),
  risco TEXT NOT NULL CHECK(risco IN ('baixo','medio','alto')),
  categoria TEXT NOT NULL,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  ativo INTEGER NOT NULL DEFAULT 1,
  criado_em TEXT NOT NULL DEFAULT (datetime('now')),
  atualizado_em TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_posicoes_usuario ON posicoes_financeiras(usuario_id);
CREATE INDEX IF NOT EXISTS idx_posicoes_usuario_tipo ON posicoes_financeiras(usuario_id, tipo);
