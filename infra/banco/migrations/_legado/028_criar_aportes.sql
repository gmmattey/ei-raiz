-- Captura transacional de aportes reais do usuário.
-- Substitui o sinal indireto de `mesesComAporteUltimos6m` (que mede crescimento
-- patrimonial, não depósito). Quando há dado real nesta tabela para o usuário,
-- o repositório de insights passa a preferir a contagem real sobre o sinal
-- indireto, e emite a métrica com `fonteMesesComAporte = "real"`.

CREATE TABLE IF NOT EXISTS aportes (
  id TEXT PRIMARY KEY,
  usuario_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  ativo_id TEXT REFERENCES ativos(id) ON DELETE SET NULL,
  valor REAL NOT NULL CHECK (valor > 0),
  data_aporte TEXT NOT NULL,
  origem TEXT NOT NULL DEFAULT 'manual' CHECK (origem IN ('manual', 'importacao', 'integracao')),
  observacao TEXT,
  criado_em TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_aportes_usuario_data
  ON aportes(usuario_id, data_aporte DESC);

CREATE INDEX IF NOT EXISTS idx_aportes_ativo
  ON aportes(ativo_id);
