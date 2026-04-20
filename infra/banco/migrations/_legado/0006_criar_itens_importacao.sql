CREATE TABLE IF NOT EXISTS itens_importacao (
  id TEXT PRIMARY KEY,
  importacao_id TEXT NOT NULL REFERENCES importacoes(id) ON DELETE CASCADE,
  ticker TEXT,
  categoria TEXT,
  plataforma TEXT,
  valor REAL,
  status TEXT DEFAULT 'ok',
  observacao TEXT
);
