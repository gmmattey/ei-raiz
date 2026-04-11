ALTER TABLE ativos ADD COLUMN data_cadastro TEXT DEFAULT (datetime('now'));
ALTER TABLE ativos ADD COLUMN data_aquisicao TEXT;

UPDATE ativos
SET data_cadastro = COALESCE(data_cadastro, datetime('now'));

UPDATE ativos
SET data_aquisicao = COALESCE(data_aquisicao, data_cadastro);

CREATE TABLE IF NOT EXISTS ativos_movimentacoes (
  id TEXT PRIMARY KEY,
  usuario_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  ativo_origem_id TEXT NOT NULL REFERENCES ativos(id) ON DELETE CASCADE,
  ativo_destino_id TEXT NOT NULL REFERENCES ativos(id) ON DELETE CASCADE,
  valor REAL NOT NULL,
  data_movimentacao TEXT NOT NULL,
  observacao TEXT,
  criado_em TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_ativos_mov_usuario_data ON ativos_movimentacoes(usuario_id, data_movimentacao DESC);
CREATE INDEX IF NOT EXISTS idx_ativos_mov_origem ON ativos_movimentacoes(ativo_origem_id);
CREATE INDEX IF NOT EXISTS idx_ativos_mov_destino ON ativos_movimentacoes(ativo_destino_id);

