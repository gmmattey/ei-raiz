ALTER TABLE patrimonio_itens ADD COLUMN corretora_id TEXT REFERENCES corretoras(id) ON DELETE SET NULL;
ALTER TABLE patrimonio_itens ADD COLUMN lifecycle_status TEXT NOT NULL DEFAULT 'ativo'
  CHECK(lifecycle_status IN ('ativo','em_resgate','em_saida','vendido','encerrado','arquivado'));

CREATE INDEX idx_patrimonio_itens_usuario_lifecycle
  ON patrimonio_itens(usuario_id, lifecycle_status);
