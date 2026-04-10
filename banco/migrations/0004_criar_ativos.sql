CREATE TABLE IF NOT EXISTS ativos (
  id TEXT PRIMARY KEY,
  usuario_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  ticker TEXT,
  nome TEXT NOT NULL,
  categoria TEXT NOT NULL,
  plataforma TEXT,
  quantidade REAL,
  preco_medio REAL,
  valor_atual REAL,
  participacao REAL,
  retorno_12m REAL
);
