CREATE TABLE IF NOT EXISTS importacoes (
  id TEXT PRIMARY KEY,
  usuario_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  arquivo_nome TEXT,
  status TEXT DEFAULT 'pendente',
  total_linhas INTEGER,
  conflitos INTEGER DEFAULT 0,
  erros INTEGER DEFAULT 0,
  validos INTEGER DEFAULT 0,
  criado_em TEXT DEFAULT (datetime('now'))
);
