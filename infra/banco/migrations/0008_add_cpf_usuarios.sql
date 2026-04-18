ALTER TABLE usuarios ADD COLUMN cpf TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_usuarios_cpf_unico
  ON usuarios(cpf)
  WHERE cpf IS NOT NULL;
