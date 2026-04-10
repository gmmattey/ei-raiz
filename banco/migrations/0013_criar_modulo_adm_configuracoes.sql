CREATE TABLE IF NOT EXISTS configuracoes_produto (
  chave TEXT PRIMARY KEY,
  tipo TEXT NOT NULL,
  valor_json TEXT NOT NULL,
  atualizado_em TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS feature_flags (
  chave TEXT PRIMARY KEY,
  habilitada INTEGER NOT NULL DEFAULT 0,
  rollout_percentual INTEGER NOT NULL DEFAULT 100,
  atualizado_em TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS configuracoes_menu (
  id TEXT PRIMARY KEY,
  chave TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  path TEXT NOT NULL,
  ordem INTEGER NOT NULL,
  visivel INTEGER NOT NULL DEFAULT 1,
  atualizado_em TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_configuracoes_menu_ordem ON configuracoes_menu(ordem);
