-- Uma única reconstrução pendente por usuário. O reenvio atualiza a mesma fila.
CREATE UNIQUE INDEX IF NOT EXISTS idx_patrimonio_fila_reconstrucao_usuario
  ON patrimonio_fila_reconstrucao(usuario_id);
