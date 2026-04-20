CREATE TABLE IF NOT EXISTS plataformas_vinculadas (
  id TEXT PRIMARY KEY,
  usuario_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  ultimo_import TEXT,
  status TEXT DEFAULT 'ativo'
);
