CREATE TABLE patrimonio_movimentos (
  id                  TEXT PRIMARY KEY,
  usuario_id          TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  item_id             TEXT NOT NULL REFERENCES patrimonio_itens(id) ON DELETE CASCADE,
  importacao_id       TEXT REFERENCES importacoes(id) ON DELETE SET NULL,
  linha_importacao    INTEGER,
  tipo                TEXT NOT NULL CHECK(tipo IN ('compra','venda','aporte','retirada','transferencia','resgate','ajuste','correcao')),
  quantidade          REAL,
  valor_brl           REAL,
  data                TEXT NOT NULL,
  origem              TEXT NOT NULL CHECK(origem IN ('manual','importacao','vinculo_corretora','sincronizado')),
  dados_json          TEXT NOT NULL DEFAULT '{}',
  criado_em           TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(importacao_id, linha_importacao)
);

CREATE INDEX idx_patrimonio_movimentos_usuario_data
  ON patrimonio_movimentos(usuario_id, data DESC);
CREATE INDEX idx_patrimonio_movimentos_item_data
  ON patrimonio_movimentos(item_id, data DESC);
