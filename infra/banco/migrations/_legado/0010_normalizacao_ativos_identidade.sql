ALTER TABLE ativos ADD COLUMN ticker_canonico TEXT;
ALTER TABLE ativos ADD COLUMN nome_canonico TEXT;
ALTER TABLE ativos ADD COLUMN identificador_canonico TEXT;
ALTER TABLE ativos ADD COLUMN cnpj_fundo TEXT;
ALTER TABLE ativos ADD COLUMN isin TEXT;
ALTER TABLE ativos ADD COLUMN aliases_json TEXT;

ALTER TABLE itens_importacao ADD COLUMN data_operacao TEXT;
ALTER TABLE itens_importacao ADD COLUMN nome TEXT;
ALTER TABLE itens_importacao ADD COLUMN quantidade REAL;
ALTER TABLE itens_importacao ADD COLUMN ticker_canonico TEXT;
ALTER TABLE itens_importacao ADD COLUMN nome_canonico TEXT;
ALTER TABLE itens_importacao ADD COLUMN identificador_canonico TEXT;
ALTER TABLE itens_importacao ADD COLUMN cnpj_fundo TEXT;
ALTER TABLE itens_importacao ADD COLUMN isin TEXT;
ALTER TABLE itens_importacao ADD COLUMN aliases_json TEXT;

CREATE INDEX IF NOT EXISTS idx_ativos_usuario_identificador_canonico
  ON ativos(usuario_id, identificador_canonico);

CREATE INDEX IF NOT EXISTS idx_ativos_usuario_ticker_canonico
  ON ativos(usuario_id, ticker_canonico);

CREATE INDEX IF NOT EXISTS idx_ativos_usuario_cnpj_fundo
  ON ativos(usuario_id, cnpj_fundo);

CREATE INDEX IF NOT EXISTS idx_ativos_usuario_isin
  ON ativos(usuario_id, isin);
